-- ==============================================================================
-- STRIDECLUB PLATFORM — SUPABASE / CLOUD SQL POSTGRESQL SCHEMA (FREE TIER)
-- Run this script in the Supabase SQL Editor to provision all tables & indexes.
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Users Profile Table
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(128) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  photo_url TEXT,
  bio TEXT,
  city VARCHAR(100) DEFAULT 'Colombo',
  shoe_model VARCHAR(100) DEFAULT 'Nike Pegasus 40',
  unit_preference VARCHAR(10) DEFAULT 'km',
  weekly_goal_km REAL DEFAULT 25.0,
  target_pace_min_per_km REAL DEFAULT 5.30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Running Activities Table
CREATE TABLE IF NOT EXISTS public.runs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_uid VARCHAR(128) NOT NULL,
  title VARCHAR(255) NOT NULL,
  distance_km REAL NOT NULL,
  duration_seconds INTEGER NOT NULL,
  run_date DATE NOT NULL DEFAULT CURRENT_DATE,
  pace_min_per_km REAL NOT NULL,
  notes TEXT,
  surface_type VARCHAR(50) DEFAULT 'Road',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. User Integrations & Encrypted Vault Table (Strava / n8n / Webhooks)
CREATE TABLE IF NOT EXISTS public.user_integrations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_uid VARCHAR(128) NOT NULL,
  service_name VARCHAR(50) NOT NULL,
  service_label VARCHAR(100) NOT NULL,
  encrypted_api_key TEXT NOT NULL,
  auth_tag VARCHAR(64) NOT NULL,
  iv VARCHAR(64) NOT NULL,
  masked_key VARCHAR(50) NOT NULL,
  endpoint_url TEXT,
  config_data JSONB DEFAULT '{}'::jsonb,
  is_enabled BOOLEAN DEFAULT TRUE,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Community Discussions Table
CREATE TABLE IF NOT EXISTS public.community_posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_uid VARCHAR(128) NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  author_photo TEXT,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'General',
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Club Group Events Table
CREATE TABLE IF NOT EXISTS public.club_events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(255) NOT NULL,
  event_date DATE NOT NULL,
  event_time VARCHAR(20) NOT NULL DEFAULT '07:00 AM',
  distance_km REAL NOT NULL DEFAULT 10.0,
  pace_category VARCHAR(50) DEFAULT 'All Paces Welcome',
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_by_uid VARCHAR(128) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Event RSVPs Table
CREATE TABLE IF NOT EXISTS public.event_rsvps (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES public.club_events(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_uid VARCHAR(128) NOT NULL,
  user_display_name VARCHAR(255) NOT NULL,
  user_photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_event_user_rsvp UNIQUE (event_id, user_id)
);

-- 8. Autonomous Agent Telemetry Logs Table
CREATE TABLE IF NOT EXISTS public.agent_logs (
  id SERIAL PRIMARY KEY,
  system_name VARCHAR(100) NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'success',
  metrics JSONB DEFAULT '{}'::jsonb,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. In-App Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_uid VARCHAR(128) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'system',
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Global Autonomous Mode System Config Table
CREATE TABLE IF NOT EXISTS public.system_config (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial system configuration
INSERT INTO public.system_config (key, value)
VALUES ('autonomous_mode_enabled', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 11. Performance & Query Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_runs_user_id ON public.runs(user_id);
CREATE INDEX IF NOT EXISTS idx_runs_run_date ON public.runs(run_date DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_logs_executed_at ON public.agent_logs(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_uid ON public.notifications(user_uid, is_read);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON public.club_events(event_date);

-- 12. Row Level Security (RLS) Policies for Supabase Auth
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;

-- Allow Public Read Access for Club Aggregates & Community
CREATE POLICY "Public Read Users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Public Read Runs" ON public.runs FOR SELECT USING (true);
CREATE POLICY "Public Read Posts" ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "Public Read Events" ON public.club_events FOR SELECT USING (true);
CREATE POLICY "Public Read RSVPs" ON public.event_rsvps FOR SELECT USING (true);
CREATE POLICY "Public Read Agent Logs" ON public.agent_logs FOR SELECT USING (true);

-- Service Role / Authenticated Write Policies
CREATE POLICY "Users Can Insert Runs" ON public.runs FOR INSERT WITH CHECK (true);
CREATE POLICY "Users Can Insert Posts" ON public.community_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Users Can Update Own Profile" ON public.users FOR UPDATE USING (true);
