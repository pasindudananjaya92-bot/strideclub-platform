import React, { useEffect, useState } from 'react';
import { ClubStatsData } from '../types.ts';
import { formatPace, formatDuration, formatDate } from '../utils/formatters.ts';
import { BarChart3, Users, Flame, MapPin, Activity, Calendar, Compass, RefreshCw, Award, HeartHandshake } from 'lucide-react';

export const StatsView: React.FC = () => {
  const [stats, setStats] = useState<ClubStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to load club stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const totalKm = stats?.totalKm || 0;
  const totalRuns = stats?.totalRuns || 0;
  const totalMembers = stats?.totalMembers || 0;
  const avgPace = stats?.avgPace || 0;
  const totalSeconds = stats?.totalSeconds || 0;

  // Monthly Club Goal: 1,000 km target
  const monthlyGoalKm = 1000;
  const goalProgress = Math.min(100, Math.round((totalKm / monthlyGoalKm) * 100));

  return (
    <div id="stats-view-container" className="space-y-8">
      {/* Overview Cards */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <HeartHandshake className="w-4 h-4" />
              <span>Community Impact</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Club Mileage & Activity Feed</h1>
          </div>
          <button
            onClick={fetchStats}
            className="self-start sm:self-center p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Refresh Stats"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Big numbers */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/70 rounded-2xl p-5 border border-slate-700/60">
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-medium mb-1">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Total Distance Logged</span>
            </div>
            <div className="text-3xl font-black font-mono text-white">
              {totalKm.toFixed(1)} <span className="text-sm font-normal text-slate-400 font-sans">km</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              {(totalKm * 0.621371).toFixed(1)} miles across all runners
            </p>
          </div>

          <div className="bg-slate-800/70 rounded-2xl p-5 border border-slate-700/60">
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-medium mb-1">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Total Completed Runs</span>
            </div>
            <div className="text-3xl font-black font-mono text-white">
              {totalRuns} <span className="text-sm font-normal text-slate-400 font-sans">sessions</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              {formatDuration(totalSeconds)} combined time
            </p>
          </div>

          <div className="bg-slate-800/70 rounded-2xl p-5 border border-slate-700/60">
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-medium mb-1">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Registered Athletes</span>
            </div>
            <div className="text-3xl font-black font-mono text-white">
              {totalMembers} <span className="text-sm font-normal text-slate-400 font-sans">runners</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Connected to Cloud SQL
            </p>
          </div>

          <div className="bg-slate-800/70 rounded-2xl p-5 border border-slate-700/60">
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-medium mb-1">
              <Flame className="w-4 h-4 text-emerald-400" />
              <span>Club Average Pace</span>
            </div>
            <div className="text-3xl font-black font-mono text-emerald-400">
              {formatPace(avgPace)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Overall fleet tempo
            </p>
          </div>
        </div>

        {/* Monthly Target Progress Bar */}
        <div className="mt-6 bg-slate-800/40 rounded-2xl p-5 border border-slate-700/40">
          <div className="flex justify-between items-center mb-2 text-xs">
            <span className="font-semibold text-slate-300">Club Milestone: 1,000 KM Challenge</span>
            <span className="font-mono font-bold text-emerald-400">{goalProgress}% ({totalKm.toFixed(1)} / 1,000 km)</span>
          </div>
          <div className="w-full bg-slate-700/80 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${goalProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Community Activity Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Latest Club Activities</h2>
        <p className="text-xs text-slate-500 mb-6">Recent runs uploaded across the club</p>

        {(!stats?.recentActivity || stats.recentActivity.length === 0) ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            No activities recorded yet. When members log runs, they will appear in this real-time community stream.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 transition-all flex items-start justify-between gap-3"
              >
                <div className="flex items-start space-x-3">
                  {activity.runnerPhoto ? (
                    <img
                      src={activity.runnerPhoto}
                      alt={activity.runnerName}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold text-sm">
                      {activity.runnerName?.[0] || 'R'}
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{activity.title}</h4>
                    <p className="text-xs text-slate-500 font-medium">{activity.runnerName}</p>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-1">
                      <span>{formatDate(activity.runDate)}</span>
                      <span>•</span>
                      <span className="text-slate-600 font-semibold">{activity.surfaceType}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-base font-bold font-mono text-slate-900">
                    {activity.distanceKm.toFixed(2)} <span className="text-xs text-slate-400 font-sans">km</span>
                  </div>
                  <div className="text-xs font-mono font-semibold text-emerald-600">
                    {formatPace(activity.paceMinPerKm)}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    {formatDuration(activity.durationSeconds)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
