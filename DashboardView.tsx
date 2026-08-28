import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { DashboardData, AppTab, TrainingPlanData, NotificationItem, TrainingDayPlan } from '../types.ts';
import { formatPace, formatDuration, formatDate } from '../utils/formatters.ts';
import { TrainingPlanModal } from './TrainingPlanModal.tsx';
import {
  LayoutDashboard,
  Trophy,
  Activity,
  Flame,
  Zap,
  Target,
  Award,
  ArrowRight,
  Plus,
  PlugZap,
  CheckCircle2,
  Lock,
  Sparkles,
  Bot,
  MapPin,
  Calendar,
  Layers,
  Bell,
  ChevronRight,
  Shield,
  TrendingUp,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
  ComposedChart,
} from 'recharts';

interface DashboardViewProps {
  setActiveTab: (tab: AppTab) => void;
  onOpenLogModal: () => void;
  onLogPresetWorkout?: (dayPlan: TrainingDayPlan) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActiveTab,
  onOpenLogModal,
  onLogPresetWorkout,
}) => {
  const { user, signIn, getAuthHeaders, loading: authLoading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<TrainingPlanData | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [chartMetric, setChartMetric] = useState<'distance' | 'pace'>('distance');

  const fetchDashboard = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const res = await fetch('/api/dashboard', { headers });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  // If user is not logged in, show an engaging welcome dashboard with CTA to Sign In with Google
  if (!user) {
    return (
      <div id="guest-dashboard-hero" className="space-y-8 max-w-5xl mx-auto">
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-2xl">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>24/7 Autonomous AI Running Platform</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Welcome to <span className="text-emerald-400 font-mono">STRIDECLUB</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Powered by autonomous Gemini 2.5 Flash agents, Cloud SQL PostgreSQL, and 24/7 background cron schedulers. Receive weekly training microcycles every Monday at 6:00 AM without lifting a finger.
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={signIn}
                className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-lg shadow-emerald-950/50 active:scale-95"
              >
                <span>Sign In with Google to View Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveTab('leaderboard')}
                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-5 py-3 rounded-xl text-sm transition-all border border-slate-700"
              >
                <Trophy className="w-4 h-4 text-emerald-400" />
                <span>View Club Leaderboard</span>
              </button>

              <button
                onClick={() => setActiveTab('agent-logs')}
                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-semibold px-5 py-3 rounded-xl text-sm transition-all border border-indigo-500/30"
              >
                <Bot className="w-4 h-4 text-indigo-400" />
                <span>Agent Logs & Telemetry</span>
              </button>
            </div>
          </div>
        </div>

        {/* Feature previews */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Auto AI Coach</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every Monday at 6:00 AM, Gemini 2.5 Flash analyzes your volume and generates a structured 7-day training plan.
            </p>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Auto Event Reminders</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              RSVP for Sunday 7:00 AM club runs and receive automated briefing notifications on Saturday at 7:00 PM.
            </p>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Auto Strava Sync</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cloud Run Jobs sync external Strava & webhook payloads every 6 hours into your PostgreSQL logbook.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    totalKm: 0,
    totalRuns: 0,
    totalSeconds: 0,
    avgPace: 0,
    longestRunKm: 0,
    currentWeeklyKm: 0,
    weeklyGoalPercent: 0,
    streakWeeks: 0,
  };

  const weeklyTrend = data?.weeklyTrend || [];
  const notifications = data?.notifications || [];
  const badges = data?.badges || [];
  const recentRuns = data?.recentRuns || [];
  const weeklyGoalKm = data?.user?.weeklyGoalKm || 25;

  // Find latest AI Coach plan notification if available
  const latestPlanNotif = notifications.find((n) => n.type === 'ai_coach_plan' && n.data);

  const handleOpenPlanModal = () => {
    if (latestPlanNotif && latestPlanNotif.data) {
      setSelectedPlan(latestPlanNotif.data);
      setIsPlanModalOpen(true);
    } else {
      // Create on-the-fly sample plan if none generated yet
      const samplePlan: TrainingPlanData = {
        weekStarting: 'Current Training Microcycle',
        coachSummary: `Tailored for ${data?.user?.displayName || 'Athlete'} focusing on ${weeklyGoalKm} km weekly mileage target with aerobic base and threshold intervals.`,
        weeklyTargetKm: weeklyGoalKm,
        keyWorkouts: ['Tuesday 6x400m Speed Repeats', 'Sunday Club 10K Long Run'],
        recoveryTip: 'Hydrate with electrolyte salts within 30 minutes of tempo sessions.',
        generatedAt: new Date().toISOString(),
        days: [
          { day: 'Monday', workoutType: 'Easy Run', distanceKm: 5, targetPace: '5:30 min/km', focus: 'Aerobic Base', instructions: 'Conversational Zone 2 jog.' },
          { day: 'Tuesday', workoutType: 'Intervals', distanceKm: 6, targetPace: '4:50 min/km', focus: 'VO2 Max', instructions: '1km warm up + 6x400m fast.' },
          { day: 'Wednesday', workoutType: 'Rest / Mobility', distanceKm: 0, targetPace: 'N/A', focus: 'Recovery', instructions: 'Foam rolling & stretches.' },
          { day: 'Thursday', workoutType: 'Tempo Run', distanceKm: 6, targetPace: '5:10 min/km', focus: 'Lactate Threshold', instructions: 'Sustained 4km threshold.' },
          { day: 'Friday', workoutType: 'Recovery', distanceKm: 4, targetPace: '5:45 min/km', focus: 'Flush Legs', instructions: 'Light easy jog.' },
          { day: 'Saturday', workoutType: 'Rest / Mobility', distanceKm: 0, targetPace: 'N/A', focus: 'Pre-Long Run Rest', instructions: 'Hydration & sleep.' },
          { day: 'Sunday', workoutType: 'Long Run', distanceKm: 10, targetPace: '5:35 min/km', focus: 'Endurance', instructions: 'Sunday 7am club long run.' },
        ],
      };
      setSelectedPlan(samplePlan);
      setIsPlanModalOpen(true);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1">
          <div className="font-bold text-slate-100 border-b border-slate-800 pb-1">{label}</div>
          <div className="flex items-center justify-between gap-4 text-emerald-400 font-mono">
            <span>Distance Logged:</span>
            <span className="font-bold">{dataPoint.distanceKm} km</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-indigo-400 font-mono">
            <span>Average Pace:</span>
            <span className="font-bold">{formatPace(dataPoint.avgPace)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-slate-400 font-mono">
            <span>Sessions Logged:</span>
            <span>{dataPoint.runsCount} runs</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-slate-500 font-mono">
            <span>Weekly Target:</span>
            <span>{dataPoint.targetKm} km</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="user-dashboard-container" className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Runner Profile Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Runner'}
                referrerPolicy="no-referrer"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-emerald-400 object-cover shadow-lg"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-800 text-emerald-400 border border-slate-700 flex items-center justify-center font-bold text-2xl">
                {user.displayName?.[0] || 'R'}
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white">
                  {user.displayName || 'Athlete'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                  Autonomous Sync Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {data?.user?.city || 'Club Athlete'} {data?.user?.shoeModel ? `• Shoe: ${data.user.shoeModel}` : ''}
              </p>
              <div className="flex items-center space-x-3 text-xs text-slate-400 mt-2 font-mono">
                <span>UID: {user.uid.slice(0, 8)}...</span>
                <span>•</span>
                <span className="text-emerald-400">{data?.connectedIntegrationsCount || 0} Integrations Active</span>
              </div>
            </div>
          </div>

          {/* Quick Dashboard Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              id="dashboard-log-run-btn"
              onClick={onOpenLogModal}
              className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-emerald-950/40 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Log Run</span>
            </button>

            <button
              id="view-training-plan-btn"
              onClick={handleOpenPlanModal}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-indigo-950/40"
            >
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span>7-Day AI Plan</span>
            </button>

            <button
              onClick={() => setActiveTab('events')}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all"
            >
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Club Events</span>
            </button>

            <button
              onClick={() => setActiveTab('agent-logs')}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all"
            >
              <Bot className="w-4 h-4 text-emerald-400" />
              <span>Agent Logs</span>
            </button>
          </div>
        </div>

        {/* Weekly Goal Tracker Strip */}
        <div className="mt-6 pt-6 border-t border-slate-800/80">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="font-semibold text-slate-300 flex items-center space-x-1.5">
              <Target className="w-4 h-4 text-emerald-400" />
              <span>Weekly Mileage Target</span>
            </span>
            <span className="font-mono font-bold text-emerald-400">
              {stats.currentWeeklyKm.toFixed(1)} / {weeklyGoalKm} km ({stats.weeklyGoalPercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700/60">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, stats.weeklyGoalPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Autonomous AI Coach Spotlight Card */}
      <div className="bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Bot className="w-3.5 h-3.5" />
              Auto AI Coach (Pasiya Agent)
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Monday 6:00 AM Automated Schedule
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-100">
            {latestPlanNotif?.title || 'Personalized 7-Day Autonomous Training Plan Active'}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {latestPlanNotif?.message ||
              `Pasiya AI continuously customizes your microcycle workouts based on your ${weeklyGoalKm}km target and past runs.`}
          </p>
        </div>

        <button
          onClick={handleOpenPlanModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shrink-0 shadow-lg shadow-indigo-950"
        >
          <span>Open 7-Day Plan</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Total Distance</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black font-mono text-white">
            {stats.totalKm.toFixed(1)} <span className="text-sm font-normal text-slate-400 font-sans">km</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            {(stats.totalKm * 0.621371).toFixed(1)} miles all-time
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Completed Runs</span>
            <Trophy className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black font-mono text-white">
            {stats.totalRuns} <span className="text-sm font-normal text-slate-400 font-sans">runs</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            {formatDuration(stats.totalSeconds)} time on feet
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Average Pace</span>
            <Flame className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black font-mono text-emerald-400">
            {formatPace(stats.avgPace)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Across all logged terrains
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Longest Distance</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black font-mono text-white">
            {stats.longestRunKm.toFixed(1)} <span className="text-sm font-normal text-slate-400 font-sans">km</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Personal best single run
          </p>
        </div>
      </div>

      {/* RECHARTS: Weekly Distance Trend Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span>Weekly Distance & Performance Trend</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Historical 6-week training volume progression with weekly mileage goal overlay
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setChartMetric('distance')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                chartMetric === 'distance'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Weekly Volume (km)
            </button>
            <button
              onClick={() => setChartMetric('pace')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                chartMetric === 'pace'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Avg Pace (min/km)
            </button>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          {weeklyTrend.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400 font-mono">
              Log activities to populate weekly trend visualization.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={weeklyTrend}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
                <XAxis
                  dataKey="weekLabel"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  unit={chartMetric === 'distance' ? ' km' : ' min'}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  formatter={(value) => <span className="text-slate-300 font-medium">{value}</span>}
                />
                {chartMetric === 'distance' ? (
                  <>
                    <Bar
                      dataKey="distanceKm"
                      name="Distance Logged (km)"
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                    />
                    <Line
                      type="monotone"
                      dataKey="targetKm"
                      name="Weekly Target (km)"
                      stroke="#6366f1"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{ fill: '#6366f1', r: 3 }}
                    />
                  </>
                ) : (
                  <Line
                    type="monotone"
                    dataKey="avgPace"
                    name="Average Pace (min/km)"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Achievement Badges Showcase */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
              <Award className="w-5 h-5 text-emerald-400" />
              <span>Achievement Milestones & Badges</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Unlock club honors as you log distance, increase pace, and connect your services
            </p>
          </div>
          <div className="text-xs font-mono font-bold text-emerald-400 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 w-fit">
            {badges.filter((b) => b.isUnlocked).length} / {badges.length} Unlocked
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                badge.isUnlocked
                  ? 'bg-slate-800/80 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                  : 'bg-slate-950/60 border-slate-800 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      badge.isUnlocked
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    <Award className="w-5 h-5" />
                  </div>

                  {badge.isUnlocked ? (
                    <span className="flex items-center space-x-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Unlocked</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 text-[10px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                      <Lock className="w-3 h-3" />
                      <span>Locked</span>
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-white">{badge.name}</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{badge.description}</p>
              </div>

              {!badge.isUnlocked && (
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                    <span>Progress</span>
                    <span>{Math.round(badge.progressPercent)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${badge.progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Section: Recent Activities & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Runs */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Recent Running Sessions</span>
            </h3>
            <button
              onClick={() => setActiveTab('logbook')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
            >
              <span>View Full Logbook</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentRuns.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs bg-slate-950/40 rounded-xl border border-slate-800/80">
              No runs recorded yet. Click <strong>"Log Run"</strong> to record your first miles!
            </div>
          ) : (
            <div className="space-y-3">
              {recentRuns.map((run) => (
                <div
                  key={run.id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <h4 className="text-xs sm:text-sm font-bold text-white">{run.title}</h4>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
                      <span>{formatDate(run.runDate)}</span>
                      <span>•</span>
                      <span className="text-slate-300">{run.surfaceType || 'Road'}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm sm:text-base font-bold font-mono text-white">
                      {run.distanceKm.toFixed(2)} <span className="text-xs text-slate-400 font-sans">km</span>
                    </div>
                    <div className="text-xs font-mono font-semibold text-emerald-400">
                      {formatPace(run.paceMinPerKm)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notifications & System Activity Box */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300">
                {notifications.length} Alerts
              </span>
            </div>

            <h3 className="text-base font-bold text-white">Autonomous Alerts</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Updates delivered automatically by Pasiya Agent, Cloud Scheduler, and Strava background sync.
            </p>

            <div className="mt-4 space-y-2 max-h-52 overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-400 text-center">
                  No alerts currently. Systems are standing by.
                </div>
              ) : (
                notifications.slice(0, 4).map((notif) => (
                  <div
                    key={notif.id}
                    className="p-2.5 bg-slate-950/90 rounded-xl border border-slate-800 text-xs space-y-1"
                  >
                    <div className="font-semibold text-slate-200 flex items-center justify-between">
                      <span className="truncate">{notif.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      {notif.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('agent-logs')}
            className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs border border-slate-700 transition-all active:scale-95"
          >
            <span>View All Agent Logs</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* 7-Day Training Plan Modal */}
      <TrainingPlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        plan={selectedPlan}
        onLogWorkout={onLogPresetWorkout}
      />
    </div>
  );
};
