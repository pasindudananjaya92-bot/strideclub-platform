import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, real, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoUrl: text('photo_url'),
  bio: text('bio'),
  city: text('city'),
  shoeModel: text('shoe_model'),
  unitPreference: text('unit_preference').default('km'), // 'km' or 'mi'
  weeklyGoalKm: real('weekly_goal_km').default(25),
  targetPaceMinPerKm: real('target_pace_min_per_km').default(5.5),
  createdAt: timestamp('created_at').defaultNow(),
});

export const runs = pgTable('runs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  userUid: text('user_uid').notNull(),
  title: text('title').notNull(),
  distanceKm: real('distance_km').notNull(),
  durationSeconds: integer('duration_seconds').notNull(),
  runDate: text('run_date').notNull(), // Format: YYYY-MM-DD
  paceMinPerKm: real('pace_min_per_km').notNull(), // Minutes per km (e.g. 5.25 for 5:15/km)
  notes: text('notes'),
  surfaceType: text('surface_type').default('Road'), // Road, Trail, Track, Treadmill
  createdAt: timestamp('created_at').defaultNow(),
});

export const userIntegrations = pgTable('user_integrations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  userUid: text('user_uid').notNull(),
  serviceName: text('service_name').notNull(), // 'strava', 'n8n', 'vercel', 'supabase', 'garmin', 'discord', 'webhook'
  serviceLabel: text('service_label').notNull(),
  apiKeyEncrypted: text('api_key_encrypted'),
  apiSecretEncrypted: text('api_secret_encrypted'),
  endpointUrl: text('endpoint_url'),
  configData: text('config_data'), // JSON string with metadata
  isEnabled: boolean('is_enabled').default(true),
  lastSyncedAt: timestamp('last_synced_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const communityPosts = pgTable('community_posts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  userUid: text('user_uid').notNull(),
  authorName: text('author_name').notNull(),
  authorPhoto: text('author_photo'),
  title: text('title').notNull(),
  content: text('content').notNull(),
  category: text('category').default('Discussion'), // 'Discussion', 'Route', 'Training Tip', 'Race Report', 'Event'
  likesCount: integer('likes_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  userUid: text('user_uid').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull(), // 'ai_coach_plan', 'moderation_warning', 'event_reminder', 'data_sync', 'system'
  data: text('data'), // JSON metadata (e.g. structured 7-day training plan, event details, synced run stats)
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const clubEvents = pgTable('club_events', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  location: text('location').notNull(),
  eventDate: text('event_date').notNull(), // YYYY-MM-DD
  eventTime: text('event_time').notNull(), // e.g. "07:00 AM"
  distanceKm: real('distance_km').default(10),
  paceCategory: text('pace_category').default('All Paces (4:30 - 6:30 min/km)'),
  reminderSent: boolean('reminder_sent').default(false),
  createdByUid: text('created_by_uid').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const eventRsvps = pgTable('event_rsvps', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id')
    .references(() => clubEvents.id)
    .notNull(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  userUid: text('user_uid').notNull(),
  userName: text('user_name').notNull(),
  userPhoto: text('user_photo'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const agentLogs = pgTable('agent_logs', {
  id: serial('id').primaryKey(),
  systemName: text('system_name').notNull(), // 'AUTO AI COACH (Pasiya Agent)', 'AUTO COMMUNITY MODERATOR', 'AUTO EVENTS & REMINDERS', 'AUTO DATA SYNC AGENT', 'CLOUD CRON ORCHESTRATOR'
  actionType: text('action_type').notNull(), // 'plan_generation', 'post_moderation', 'reminder_dispatch', 'strava_sync', 'cron_tick'
  description: text('description').notNull(),
  status: text('status').default('success'), // 'success', 'warning', 'error', 'skipped'
  metrics: text('metrics'), // JSON metadata (e.g. {"plansGenerated": 12, "scannedPosts": 8, "deletedSpam": 1, "syncedAccounts": 3})
  executedAt: timestamp('executed_at').defaultNow(),
});

export const systemConfig = pgTable('system_config', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  runs: many(runs),
  integrations: many(userIntegrations),
  posts: many(communityPosts),
  notifications: many(notifications),
  rsvps: many(eventRsvps),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const clubEventsRelations = relations(clubEvents, ({ many }) => ({
  rsvps: many(eventRsvps),
}));

export const eventRsvpsRelations = relations(eventRsvps, ({ one }) => ({
  event: one(clubEvents, {
    fields: [eventRsvps.eventId],
    references: [clubEvents.id],
  }),
  user: one(users, {
    fields: [eventRsvps.userId],
    references: [users.id],
  }),
}));

export const runsRelations = relations(runs, ({ one }) => ({
  user: one(users, {
    fields: [runs.userId],
    references: [users.id],
  }),
}));

export const userIntegrationsRelations = relations(userIntegrations, ({ one }) => ({
  user: one(users, {
    fields: [userIntegrations.userId],
    references: [users.id],
  }),
}));

export const communityPostsRelations = relations(communityPosts, ({ one }) => ({
  user: one(users, {
    fields: [communityPosts.userId],
    references: [users.id],
  }),
}));
 
