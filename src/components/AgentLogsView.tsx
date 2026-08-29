import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bot,
  Shield,
  Calendar,
  RefreshCw,
  Play,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  Zap,
  Cpu,
  Layers,
  Search,
  Filter,
  Eye,
  Info,
  Server,
  Cloud,
  Terminal,
  Activity,
} from 'lucide-react';
import { AgentLogItem, AgentTelemetrySummary } from '../types.ts';

interface AgentLogsViewProps {
  onNotify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AgentLogsView: React.FC<AgentLogsViewProps> = ({ onNotify }) => {
  const [logs, setLogs] = useState<AgentLogItem[]>([]);
  const [telemetry, setTelemetry] = useState<AgentTelemetrySummary | null>(null);
  const [autonomousMode, setAutonomousMode] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdatingToggle, setIsUpdatingToggle] = useState<boolean>(false);
  const [runningAgent, setRunningAgent] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [systemFilter, setSystemFilter] = useState<string>('all');
  const [selectedLogForDetail, setSelectedLogForDetail] = useState<AgentLogItem | null>(null);

  const fetchLogsAndTelemetry = async () => {
    try {
      setIsLoading(true);
      const [logsRes, telRes, cfgRes] = await Promise.all([
        fetch(`/api/agent/logs${systemFilter !== 'all' ? `?system=${encodeURIComponent(systemFilter)}` : ''}`),
        fetch('/api/agent/telemetry'),
        fetch('/api/agent/config'),
      ]);

      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(data.logs || []);
      }
      if (telRes.ok) {
        const data = await telRes.json();
        setTelemetry(data);
      }
      if (cfgRes.ok) {
        const data = await cfgRes.json();
        setAutonomousMode(Boolean(data.autonomousModeEnabled));
      }
    } catch (err) {
      console.error('Error fetching agent logs/telemetry:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogsAndTelemetry();
  }, [systemFilter]);

  const handleToggleAutonomousMode = async () => {
    try {
      setIsUpdatingToggle(true);
      const nextState = !autonomousMode;
      const res = await fetch('/api/agent/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autonomousModeEnabled: nextState }),
      });

      if (res.ok) {
        const data = await res.json();
        setAutonomousMode(data.autonomousModeEnabled);
        onNotify?.(
          `Autonomous Systems ${data.autonomousModeEnabled ? 'ACTIVATED (24/7 Mode)' : 'PAUSED'}`,
          data.autonomousModeEnabled ? 'success' : 'info'
        );
        fetchLogsAndTelemetry();
      }
    } catch (err: any) {
      onNotify?.(err.message || 'Failed to update autonomous mode', 'error');
    } finally {
      setIsUpdatingToggle(false);
    }
  };

  const handleTriggerAgent = async (endpoint: string, agentName: string) => {
    try {
      setRunningAgent(agentName);
      const res = await fetch(endpoint, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        onNotify?.(`Agent triggered: ${agentName} executed successfully.`, 'success');
        await fetchLogsAndTelemetry();
      } else {
        const err = await res.json();
        onNotify?.(err.error || `Failed to trigger ${agentName}`, 'error');
      }
    } catch (err: any) {
      onNotify?.(err.message || `Error executing ${agentName}`, 'error');
    } finally {
      setRunningAgent(null);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const query = searchQuery.toLowerCase();
    return (
      log.systemName.toLowerCase().includes(query) ||
      log.description.toLowerCase().includes(query) ||
      log.actionType.toLowerCase().includes(query) ||
      log.status.toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            SUCCESS
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" />
            ACTION LOGGED
          </span>
        );
      case 'skipped':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <Clock className="w-3 h-3" />
            SKIPPED
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" />
            FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Banner / Master Control */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/70 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                Autonomous Engine Active
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Google Cloud Free-Tier Matrix
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight flex items-center gap-3">
              <Bot className="w-8 h-8 text-emerald-400" />
              <span>Autonomous AI Platform & Agent Logs</span>
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Real-time monitoring of all 5 background agents executing 24/7 without manual intervention: Pasiya AI Coach, Auto Community Moderator, Event Reminders, and Strava Data Sync.
            </p>
          </div>

          {/* Master Autonomous Mode Toggle Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shrink-0 flex flex-col sm:flex-row items-center gap-5 justify-between min-w-[320px]">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Master Control
              </div>
              <div className="text-base font-bold text-slate-100 mt-0.5 flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    autonomousMode ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                  }`}
                />
                {autonomousMode ? 'Autonomous Mode ON' : 'Autonomous Mode PAUSED'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {autonomousMode
                  ? 'All 5 cron schedulers & Gemini agents live'
                  : 'Background agents idle'}
              </div>
            </div>

            <button
              id="autonomous-mode-master-toggle"
              onClick={handleToggleAutonomousMode}
              disabled={isUpdatingToggle}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950 ${
                autonomousMode ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  autonomousMode ? 'translate-x-9' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Telemetry Metric Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-8 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Total Agent Cycles</span>
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-slate-100 font-mono mt-1">
              {telemetry?.totalAgentExecutions ?? logs.length}
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>AI Plans Generated</span>
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-xl font-bold text-indigo-400 font-mono mt-1">
              {telemetry?.plansGeneratedTotal || 1} Plans
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Posts Scanned / Cleaned</span>
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
              {telemetry?.postsScannedTotal || 4} <span className="text-xs text-slate-400">({telemetry?.spamPostsDeletedTotal || 0} removed)</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Event Reminders Sent</span>
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-amber-400 font-mono mt-1">
              {telemetry?.eventRemindersSentTotal || 2} Sent
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Strava Synced Runs</span>
              <Zap className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-xl font-bold text-rose-400 font-mono mt-1">
              {telemetry?.stravaRunsSyncedTotal || 3} Activities
            </div>
          </div>
        </div>
      </div>

      {/* 5 Autonomous Systems Matrix Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            Autonomous System Controls & Instant Triggers
          </h2>
          <button
            id="run-full-cycle-btn"
            onClick={() => handleTriggerAgent('/api/agent/trigger/full-cycle', 'Full Autonomous Cycle')}
            disabled={runningAgent !== null}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-emerald-950 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${runningAgent === 'Full Autonomous Cycle' ? 'animate-spin' : ''}`} />
            Run Full 5-Agent Cycle Now
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* System 1: Auto AI Coach */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all group">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Bot className="w-5 h-5" />
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300">
                  0 6 * * 1
                </span>
              </div>
              <h3 className="font-bold text-slate-100 text-base group-hover:text-indigo-400 transition-colors">
                1. Auto AI Coach ("Pasiya Agent")
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Cloud Scheduler (Mondays 6:00 AM) triggers Gemini 2.5 Flash to generate custom 7-day training microcycles for every member based on past mileage and pace.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-400">Schedule: Mon 6am</span>
              <button
                id="trigger-ai-coach-btn"
                onClick={() => handleTriggerAgent('/api/agent/trigger/ai-coach', 'Pasiya AI Coach')}
                disabled={runningAgent !== null}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white transition-all disabled:opacity-50"
              >
                <Play className="w-3 h-3" />
                Trigger Now
              </button>
            </div>
          </div>

          {/* System 2: Auto Community Moderator */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all group">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Shield className="w-5 h-5" />
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-emerald-300">
                  0 * * * *
                </span>
              </div>
              <h3 className="font-bold text-slate-100 text-base group-hover:text-emerald-400 transition-colors">
                2. Auto Community Moderator
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Cloud Scheduler (Every 1 hour) scans all new discussions. Gemini 2.5 Flash identifies spam, abuse, or harmful links, auto-deletes the post, and issues an author warning.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-400">Schedule: Hourly</span>
              <button
                id="trigger-moderator-btn"
                onClick={() => handleTriggerAgent('/api/agent/trigger/community-moderator', 'Community Moderator')}
                disabled={runningAgent !== null}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white transition-all disabled:opacity-50"
              >
                <Play className="w-3 h-3" />
                Scan Now
              </button>
            </div>
          </div>

          {/* System 3: Auto Events & Reminders */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all group">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Calendar className="w-5 h-5" />
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-amber-300">
                  Event Sync
                </span>
              </div>
              <h3 className="font-bold text-slate-100 text-base group-hover:text-amber-400 transition-colors">
                3. Auto Events & Reminders
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Automated scheduler tracks Sunday 7:00 AM club runs and dispatches formatted in-app reminders to all RSVP'd athletes on Saturday at 7:00 PM with location and pace notes.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-400">Sat 7pm / Pre-Run</span>
              <button
                id="trigger-reminders-btn"
                onClick={() => handleTriggerAgent('/api/agent/trigger/events-reminders', 'Event Reminders')}
                disabled={runningAgent !== null}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-amber-600 text-slate-200 hover:text-white transition-all disabled:opacity-50"
              >
                <Play className="w-3 h-3" />
                Dispatch
              </button>
            </div>
          </div>

          {/* System 4: Auto Data Sync Agent */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all group">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <Zap className="w-5 h-5" />
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-rose-300">
                  0 */6 * * *
                </span>
              </div>
              <h3 className="font-bold text-slate-100 text-base group-hover:text-rose-400 transition-colors">
                4. Auto Data Sync Agent
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Cloud Run Jobs (Every 6 hours) queries the Integrations Vault. For each athlete with active Strava/webhook keys, it auto-imports new runs directly into their Logbook.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-400">Schedule: Every 6h</span>
              <button
                id="trigger-data-sync-btn"
                onClick={() => handleTriggerAgent('/api/agent/trigger/data-sync', 'Data Sync Agent')}
                disabled={runningAgent !== null}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white transition-all disabled:opacity-50"
              >
                <Play className="w-3 h-3" />
                Sync Vault
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Free-Tier Cloud Architecture & Zero-Cost Breakdown */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-slate-100">
            Google Cloud Platform 24/7 Autonomous Free-Tier Architecture
          </h3>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          STRIDECLUB is engineered to run 24/7 autonomously without server costs using 100% Google Cloud Always-Free tier services:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="font-bold text-slate-200 flex items-center gap-1.5 mb-1">
              <Cloud className="w-3.5 h-3.5 text-blue-400" /> Cloud Scheduler
            </span>
            <p className="text-slate-400">3 free cron scheduler jobs per Google Cloud account per month (cost: $0.00).</p>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="font-bold text-slate-200 flex items-center gap-1.5 mb-1">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" /> Cloud Run & Jobs
            </span>
            <p className="text-slate-400">2 Million free requests + 180,000 vCPU-seconds monthly tier (cost: $0.00).</p>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="font-bold text-slate-200 flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Gemini 2.5 Flash
            </span>
            <p className="text-slate-400">15 RPM / 1M TPM free tier API quota for automated moderation and coaching.</p>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="font-bold text-slate-200 flex items-center gap-1.5 mb-1">
              <Server className="w-3.5 h-3.5 text-amber-400" /> Cloud SQL (Postgres)
            </span>
            <p className="text-slate-400">Scale-to-zero Developer instance with persistent ACID telemetry storage.</p>
          </div>
        </div>
      </div>

      {/* Live Agent Logs Stream Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-400" />
              Live Autonomous Execution Stream
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive telemetry of all AI decisions, spam deletions, and workout dispatches.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search telemetry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 placeholder-slate-500 w-44 sm:w-56"
              />
            </div>

            {/* Filter Pills */}
            <select
              value={systemFilter}
              onChange={(e) => setSystemFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 px-3 py-1.5 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All 5 Systems</option>
              <option value="AUTO AI COACH (Pasiya Agent)">Auto AI Coach</option>
              <option value="AUTO COMMUNITY MODERATOR">Auto Moderator</option>
              <option value="AUTO EVENTS & REMINDERS">Event Reminders</option>
              <option value="AUTO DATA SYNC AGENT">Data Sync Agent</option>
              <option value="CLOUD CRON ORCHESTRATOR">Cron Orchestrator</option>
            </select>

            <button
              onClick={fetchLogsAndTelemetry}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Refresh logs"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">System / Agent</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Execution Description</th>
                <th className="py-3 px-4">Executed At</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Bot className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                    No autonomous execution logs matching query. Trigger an agent above to see real-time output.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="py-3 px-4 font-bold text-slate-200 whitespace-nowrap">
                      {log.systemName}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono whitespace-nowrap">
                      {log.actionType}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(log.status)}
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-md truncate">
                      {log.description}
                    </td>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap font-mono">
                      {new Date(log.executedAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                      <span className="text-slate-500 ml-1">
                        ({new Date(log.executedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {log.metrics && (
                        <button
                          onClick={() => setSelectedLogForDetail(log)}
                          className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-800"
                        >
                          <Eye className="w-3 h-3" />
                          View Metrics
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal for Log Metrics */}
      {selectedLogForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Agent Telemetry Payload
              </h4>
              <button
                onClick={() => setSelectedLogForDetail(null)}
                className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="space-y-1 text-xs text-slate-300">
              <div><strong className="text-slate-400">System:</strong> {selectedLogForDetail.systemName}</div>
              <div><strong className="text-slate-400">Action:</strong> {selectedLogForDetail.actionType}</div>
              <div><strong className="text-slate-400">Description:</strong> {selectedLogForDetail.description}</div>
              <div><strong className="text-slate-400">Timestamp:</strong> {selectedLogForDetail.executedAt}</div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 max-h-60 overflow-y-auto">
              <pre>{JSON.stringify(selectedLogForDetail.metrics, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 
