import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { RunItem } from '../types.ts';
import { formatPace, formatDuration, formatDate } from '../utils/formatters.ts';
import { Activity, Plus, Trash2, Calendar, Gauge, Clock, Award, MapPin, Sparkles, LogIn, Download, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface LogbookViewProps {
  onOpenLogModal: () => void;
}

export const LogbookView: React.FC<LogbookViewProps> = ({ onOpenLogModal }) => {
  const { user, token, signIn, loading: authLoading } = useAuth();
  const [runs, setRuns] = useState<RunItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [exported, setExported] = useState(false);

  const fetchRuns = async () => {
    if (!token) {
      setRuns([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch('/api/runs', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setRuns(data.runs || []);
      }
    } catch (err) {
      console.error('Failed to fetch runs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, [token]);

  const handleDeleteRun = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this run record?')) return;
    try {
      setDeletingId(id);
      const res = await fetch(`/api/runs/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setRuns((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete run:', err);
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl text-center">
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
          <Activity className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Track Your Running Journey</h2>
        <p className="text-xs sm:text-sm text-slate-400 mb-6 max-w-md mx-auto">
          Sign in with your Google account to log runs with accurate distance, duration, and pace, persist your data in Cloud SQL, and rank on the club leaderboard.
        </p>
        <button
          id="btn-login-prompt"
          onClick={signIn}
          className="inline-flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3 rounded-xl text-xs sm:text-sm transition-all shadow-md active:scale-95"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In with Google</span>
        </button>
      </div>
    );
  }

  // Calculate Personal Stats
  const totalKm = runs.reduce((acc, r) => acc + r.distanceKm, 0);
  const totalDuration = runs.reduce((acc, r) => acc + r.durationSeconds, 0);
  const longestRun = runs.length > 0 ? Math.max(...runs.map((r) => r.distanceKm)) : 0;
  const avgPace = runs.length > 0 && totalKm > 0 ? (totalDuration / 60) / totalKm : 0;
  const fastestRunPace = runs.length > 0 ? Math.min(...runs.map((r) => r.paceMinPerKm)) : 0;

  // Filtered list
  const filteredRuns = runs.filter((r) => {
    if (filterMonth === 'all') return true;
    return r.runDate.startsWith(filterMonth);
  });

  const handleExportCSV = () => {
    if (runs.length === 0) return;

    const dataToExport = filteredRuns.length > 0 ? filteredRuns : runs;
    const headers = [
      'Date',
      'Title',
      'Distance (km)',
      'Distance (miles)',
      'Duration (HH:MM:SS)',
      'Duration (Seconds)',
      'Pace (min/km)',
      'Surface / Terrain',
      'Notes',
      'Logged Date'
    ];

    const escapeCSV = (val: string | number | null | undefined) => {
      if (val === null || val === undefined) return '""';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return `"${str}"`;
    };

    const rows = dataToExport.map((run) => {
      const miles = (run.distanceKm * 0.621371).toFixed(2);
      const durationFormatted = formatDuration(run.durationSeconds);
      const paceFormatted = formatPace(run.paceMinPerKm);

      return [
        escapeCSV(run.runDate),
        escapeCSV(run.title),
        escapeCSV(run.distanceKm.toFixed(2)),
        escapeCSV(miles),
        escapeCSV(durationFormatted),
        escapeCSV(run.durationSeconds),
        escapeCSV(paceFormatted),
        escapeCSV(run.surfaceType || 'Road'),
        escapeCSV(run.notes || ''),
        escapeCSV(run.createdAt || '')
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const sanitizedName = user?.displayName ? user.displayName.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'runner';
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `${sanitizedName}-running-logbook-${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExported(true);
    setTimeout(() => setExported(false), 2500);
  };

  return (
    <div id="logbook-container" className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personal Training Log</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {user.displayName ? `${user.displayName}'s Logbook` : 'My Running Logbook'}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {runs.length} {runs.length === 1 ? 'activity' : 'activities'} logged in Google Cloud SQL
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="btn-export-csv"
              onClick={handleExportCSV}
              disabled={runs.length === 0}
              title="Export runs to CSV spreadsheet"
              className="inline-flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {exported ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                  <span className="text-emerald-400">Exported CSV!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Export CSV</span>
                </>
              )}
            </button>

            <button
              id="btn-log-new-run"
              onClick={onOpenLogModal}
              className="inline-flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-3 rounded-xl text-sm transition-all shadow-lg active:scale-95"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>Log a New Run</span>
            </button>
          </div>
        </div>

        {/* 4 Core Summary Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-slate-800">
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-medium mb-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Total Distance</span>
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {totalKm.toFixed(1)} <span className="text-xs font-sans text-slate-400 font-normal">km</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {(totalKm * 0.621371).toFixed(1)} miles
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-medium mb-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Time on Feet</span>
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {formatDuration(totalDuration)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Across {runs.length} runs
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-medium mb-1">
              <Gauge className="w-3.5 h-3.5 text-emerald-400" />
              <span>Average Pace</span>
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {formatPace(avgPace)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Fastest: {runs.length > 0 ? formatPace(fastestRunPace) : '--:--'}
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-medium mb-1">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span>Longest Run</span>
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {longestRun > 0 ? `${longestRun.toFixed(1)} km` : '0 km'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Personal Milestone
            </div>
          </div>
        </div>
      </div>

      {/* Activity List Section */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">Activity History</h2>
            <p className="text-xs text-slate-400">All recorded runs sorted by recent date</p>
          </div>

          {runs.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                id="btn-export-csv-table"
                onClick={handleExportCSV}
                title="Export filtered runs to CSV spreadsheet"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-800 hover:border-slate-700 transition-colors active:scale-95"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export CSV ({filteredRuns.length})</span>
              </button>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400 font-medium">Filter:</span>
                <select
                  id="select-logbook-filter"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Runs ({runs.length})</option>
                  {Array.from(new Set(runs.map((r) => r.runDate.substring(0, 7)))).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        ) : filteredRuns.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">No runs recorded yet</h3>
            <p className="text-xs text-slate-400 mb-5 max-w-sm mx-auto">
              Get your running shoes on! Log your first run to start tracking your distance, time, and pace.
            </p>
            <button
              onClick={onOpenLogModal}
              className="inline-flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Log Your First Run</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRuns.map((run) => (
              <motion.div
                key={run.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                id={`run-item-${run.id}`}
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl border border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-950/90 transition-all gap-4"
              >
                {/* Left info */}
                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 rounded-xl bg-slate-900 text-emerald-400 border border-slate-800 group-hover:border-emerald-500/40 transition-colors">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-white">{run.title}</h4>
                      {run.surfaceType && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-800 text-slate-300 rounded-md">
                          {run.surfaceType}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(run.runDate)}</span>
                      </span>
                    </div>
                    {run.notes && (
                      <p className="text-xs text-slate-300 mt-1.5 italic bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800 max-w-lg">
                        "{run.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Metrics & Delete */}
                <div className="flex items-center justify-between sm:justify-end space-x-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <div className="text-left sm:text-right">
                    <span className="text-xs text-slate-400 block font-medium">Distance</span>
                    <span className="text-base font-bold font-mono text-white">
                      {run.distanceKm.toFixed(2)} <span className="text-xs font-sans text-slate-400">km</span>
                    </span>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-xs text-slate-400 block font-medium">Duration</span>
                    <span className="text-base font-bold font-mono text-white">
                      {formatDuration(run.durationSeconds)}
                    </span>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-xs text-slate-400 block font-medium">Avg Pace</span>
                    <span className="text-base font-bold font-mono text-emerald-400">
                      {formatPace(run.paceMinPerKm)}
                    </span>
                  </div>

                  <button
                    id={`btn-delete-run-${run.id}`}
                    onClick={() => handleDeleteRun(run.id)}
                    disabled={deletingId === run.id}
                    title="Delete Run"
                    className="text-slate-400 hover:text-red-400 p-2 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 
