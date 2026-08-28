import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { UserProfile } from '../types.ts';
import {
  Settings,
  User,
  Shield,
  Download,
  Database,
  Cloud,
  Save,
  CheckCircle2,
  Bot,
  Gauge,
  MapPin,
  Flame,
  Key,
  Copy,
  Check,
  Terminal,
  FileCode,
  Layers,
  Cpu,
  Server,
  LogIn,
  Sparkles,
  Zap,
  Activity,
  ArrowRight,
} from 'lucide-react';

interface SettingsViewProps {
  onNavigateToAgentLogs?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onNavigateToAgentLogs }) => {
  const { user, signIn, fetchUserProfile, token } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Autonomous mode state
  const [autonomousMode, setAutonomousMode] = useState<boolean>(true);
  const [isUpdatingAutonomousToggle, setIsUpdatingAutonomousToggle] = useState<boolean>(false);

  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [shoeModel, setShoeModel] = useState('');
  const [unitPreference, setUnitPreference] = useState('km');
  const [weeklyGoalKm, setWeeklyGoalKm] = useState('25');
  const [targetPace, setTargetPace] = useState('5.3');

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const fetchProfileAndConfig = async () => {
    try {
      setLoading(true);
      const configPromise = fetch('/api/agent/config');
      let profilePromise: Promise<Response> | null = null;

      if (user && token) {
        profilePromise = fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      const [cfgRes, profRes] = await Promise.all([configPromise, profilePromise]);

      if (cfgRes.ok) {
        const cfg = await cfgRes.json();
        setAutonomousMode(Boolean(cfg.autonomousModeEnabled));
      }

      if (profRes && profRes.ok) {
        const json = await profRes.json();
        const u = json.user;
        setProfile(u);
        setDisplayName(u.displayName || '');
        setCity(u.city || '');
        setBio(u.bio || '');
        setShoeModel(u.shoeModel || '');
        setUnitPreference(u.unitPreference || 'km');
        setWeeklyGoalKm(String(u.weeklyGoalKm || 25));
        setTargetPace(String(u.targetPaceMinPerKm || 5.3));
      }
    } catch (err) {
      console.error('Error loading settings/profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndConfig();
  }, [user, token]);

  const handleToggleAutonomous = async () => {
    try {
      setIsUpdatingAutonomousToggle(true);
      const nextState = !autonomousMode;
      const res = await fetch('/api/agent/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autonomousModeEnabled: nextState }),
      });

      if (res.ok) {
        const data = await res.json();
        setAutonomousMode(data.autonomousModeEnabled);
        setSuccessMessage(
          `Autonomous Systems ${data.autonomousModeEnabled ? 'ACTIVATED (24/7 Engine ON)' : 'PAUSED'}`
        );
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      console.error('Failed to toggle autonomous mode:', err);
    } finally {
      setIsUpdatingAutonomousToggle(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSuccessMessage('');

      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName,
          city,
          bio,
          shoeModel,
          unitPreference,
          weeklyGoalKm: parseFloat(weeklyGoalKm) || 25,
          targetPaceMinPerKm: parseFloat(targetPace) || 5.3,
        }),
      });

      if (res.ok) {
        setSuccessMessage('Profile and running targets updated successfully in Cloud SQL!');
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const dockerfileCode = `# Multi-stage Dockerfile for Running Club Platform
FROM node:22-alpine AS builder
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
RUN npm ci

# Copy source code and build Vite frontend + Express server bundle
COPY . .
RUN npm run build

# Production runner image
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled frontend and bundled server from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/firebase-applet-config.json ./firebase-applet-config.json

EXPOSE 3000

# Start server via bundled CJS
CMD ["node", "dist/server.cjs"]`;

  const envExampleCode = `# Environment Configuration (.env.example)

# Cloud SQL PostgreSQL Database
DATABASE_URL=postgresql://app_user:YOUR_DB_PASSWORD@localhost:5432/postgres
SQL_HOST=/cloudsql/YOUR_PROJECT_ID:asia-southeast1:ai-studio-76afe49b
SQL_DB_NAME=postgres
SQL_USER=app_user
SQL_PASSWORD=YOUR_SECURE_PASSWORD

# Google Gemini AI API (Free Tier for Pasiya AI Coach)
GEMINI_API_KEY=YOUR_GEMINI_API_KEY

# Integration Vault Encryption Key (32-character AES secret)
INTEGRATION_ENCRYPTION_KEY=super_secure_strideclub_vault_key_32c`;

  const gcloudDeployCode = `# 1. Set your GCP project ID
gcloud config set project YOUR_PROJECT_ID

# 2. Enable Cloud Run and Cloud SQL Admin services
gcloud services enable run.googleapis.com sqladmin.googleapis.com cloudbuild.googleapis.com

# 3. Deploy full-stack container to Cloud Run in asia-southeast1
gcloud run deploy running-club-platform \\
  --source . \\
  --region asia-southeast1 \\
  --platform managed \\
  --allow-unauthenticated \\
  --add-cloudsql-instances YOUR_PROJECT_ID:asia-southeast1:ai-studio-76afe49b \\
  --set-env-vars SQL_HOST=/cloudsql/YOUR_PROJECT_ID:asia-southeast1:ai-studio-76afe49b,\\
SQL_DB_NAME=postgres,\\
SQL_USER=app_user,\\
SQL_PASSWORD=YOUR_SECURE_PASSWORD,\\
GEMINI_API_KEY=YOUR_GEMINI_API_KEY,\\
INTEGRATION_ENCRYPTION_KEY=super_secure_strideclub_vault_key_32c`;

  return (
    <div id="settings-view-container" className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30 w-fit mb-2">
          <Settings className="w-3.5 h-3.5" />
          <span>Autonomous Systems, Cloud Run & Account</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Platform Settings & Cloud Run Guide
        </h1>
        <p className="text-sm text-slate-300 mt-1 leading-relaxed">
          Configure master autonomous AI background agents, manage your personal runner profile, download the GitHub ZIP archive, and follow the step-by-step Google Cloud Run deployment workflow.
        </p>
      </div>

      {/* MASTER AUTONOMOUS MODE ON/OFF TOGGLE CARD */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                24/7 Autopilot Control
              </span>
              <span className="text-xs text-slate-400 font-mono">
                System Config
              </span>
            </div>

            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-emerald-400" />
              <span>Enable Autonomous Mode (ON / OFF)</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              When toggled <strong>ON</strong>, all 5 autonomous systems run 24/7 in the background via Cloud Scheduler & Gemini 2.5 Flash: Auto AI Coach (Monday 6am), Auto Moderator (Hourly), Event Reminders (Sat 7pm), and Strava Data Sync (Every 6h).
            </p>
          </div>

          <div className="flex flex-col items-center sm:items-end gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold font-mono ${autonomousMode ? 'text-emerald-400' : 'text-slate-500'}`}>
                {autonomousMode ? 'MODE: ACTIVE' : 'MODE: PAUSED'}
              </span>
              <button
                id="settings-autonomous-mode-toggle"
                onClick={handleToggleAutonomous}
                disabled={isUpdatingAutonomousToggle}
                className={`relative inline-flex h-9 w-18 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950 ${
                  autonomousMode ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-7 w-7 transform rounded-full bg-white shadow-md transition-transform ${
                    autonomousMode ? 'translate-x-10' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {onNavigateToAgentLogs && (
              <button
                onClick={onNavigateToAgentLogs}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 mt-1"
              >
                <span>View Real-Time Agent Logs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {!user ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
            <User className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Sign In to Customize Your Profile</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Log in with Google to set weekly mileage targets, customize pace units, and sync records to Cloud SQL.
          </p>
          <button
            id="btn-google-sign-in-settings"
            onClick={signIn}
            className="inline-flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-lg active:scale-95"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In with Google</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Profile Form */}
          <form
            onSubmit={handleSaveProfile}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <User className="w-4 h-4 text-emerald-400" />
                <span>Athletic Information (Saved to Cloud SQL)</span>
              </h2>

              {successMessage && (
                <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-semibold bg-emerald-950/80 px-3 py-1 rounded-lg border border-emerald-800 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{successMessage}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">City / Region (for Weather)</label>
                <input
                  type="text"
                  placeholder="e.g. Colombo, Sri Lanka"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Current Primary Running Shoe</label>
                <input
                  type="text"
                  placeholder="e.g. Nike Vaporfly 3 / Asics Novablast 4"
                  value={shoeModel}
                  onChange={(e) => setShoeModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Preferred Units</label>
                <select
                  value={unitPreference}
                  onChange={(e) => setUnitPreference(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="km">Kilometers (km, min/km)</option>
                  <option value="mi">Miles (mi, min/mi)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Weekly Mileage Target (KM)</label>
                <input
                  type="number"
                  step="1"
                  min="5"
                  max="300"
                  value={weeklyGoalKm}
                  onChange={(e) => setWeeklyGoalKm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Target Pace (min/km)</label>
                <input
                  type="number"
                  step="0.1"
                  min="2.5"
                  max="12.0"
                  value={targetPace}
                  onChange={(e) => setTargetPace(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-300 block mb-1">Runner Bio / Personal Goal</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Training for my first sub-4 hour marathon in December. Loving tempo intervals!"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </div>
          </form>

          {/* GitHub Full Project ZIP Download Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Download Full Project as ZIP (for GitHub)</span>
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Export the complete repository containing React 19 frontend, Express backend, Drizzle schema, Dockerfile, and scripts.
                </p>
              </div>

              <a
                id="btn-download-project-zip"
                href="/api/export/project-zip"
                download="running-club-platform.zip"
                className="flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3 rounded-xl text-xs sm:text-sm transition-all shadow-lg active:scale-95 shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Download Full Project ZIP</span>
              </a>
            </div>
          </div>

          {/* STEP-BY-STEP DEPLOY TO CLOUD RUN GUIDE */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <Cloud className="w-4 h-4 text-emerald-400" />
                  <span>Step-by-Step Deploy to Google Cloud Run</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Deploy as a free-tier container in region <strong className="text-emerald-400">asia-southeast1</strong> connected to Cloud SQL.
                </p>
              </div>
            </div>

            {/* Step 1: Dockerfile */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                  <span>1. Production Dockerfile</span>
                </span>
                <button
                  onClick={() => copyToClipboard(dockerfileCode, 'dockerfile')}
                  className="flex items-center space-x-1 text-[11px] text-slate-300 hover:text-white bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 transition-colors"
                >
                  {copiedSection === 'dockerfile' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Dockerfile</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="bg-slate-950 border border-slate-800 text-slate-300 text-xs p-3.5 rounded-xl font-mono overflow-x-auto">
                {dockerfileCode}
              </pre>
            </div>

            {/* Step 2: .env.example */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>2. Environment Variables (.env.example)</span>
                </span>
                <button
                  onClick={() => copyToClipboard(envExampleCode, 'env')}
                  className="flex items-center space-x-1 text-[11px] text-slate-300 hover:text-white bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 transition-colors"
                >
                  {copiedSection === 'env' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy .env.example</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="bg-slate-950 border border-slate-800 text-slate-300 text-xs p-3.5 rounded-xl font-mono overflow-x-auto">
                {envExampleCode}
              </pre>
            </div>

            {/* Step 3: Exact gcloud command */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>3. Exact gcloud Command for Cloud Run</span>
                </span>
                <button
                  onClick={() => copyToClipboard(gcloudDeployCode, 'gcloud')}
                  className="flex items-center space-x-1 text-[11px] text-slate-300 hover:text-white bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 transition-colors"
                >
                  {copiedSection === 'gcloud' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Command</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="bg-slate-950 border border-slate-800 text-emerald-400 text-xs p-3.5 rounded-xl font-mono overflow-x-auto">
                {gcloudDeployCode}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
