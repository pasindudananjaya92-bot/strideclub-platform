import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { LeaderboardUser, TimeFilterPeriod } from '../types.ts';
import { formatPace, formatDuration } from '../utils/formatters.ts';
import { Trophy, Medal, Award, Flame, User, RefreshCw, Sparkles, Filter, ChevronRight, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface LeaderboardViewProps {
  onOpenLogModal: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ onOpenLogModal }) => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<TimeFilterPeriod>('all');
  const [sortBy, setSortBy] = useState<'distance' | 'runs' | 'pace' | 'longest'>('distance');
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async (selectedPeriod: TimeFilterPeriod) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/leaderboard?period=${selectedPeriod}`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(period);
  }, [period]);

  // Sort entries based on sortBy state
  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    if (sortBy === 'distance') return b.totalDistanceKm - a.totalDistanceKm;
    if (sortBy === 'runs') return b.totalRuns - a.totalRuns;
    if (sortBy === 'longest') return b.longestRunKm - a.longestRunKm;
    if (sortBy === 'pace') {
      // For pace, lower is faster (excluding 0)
      if (a.avgPaceMinPerKm <= 0) return 1;
      if (b.avgPaceMinPerKm <= 0) return -1;
      return a.avgPaceMinPerKm - b.avgPaceMinPerKm;
    }
    return 0;
  });

  const topThree = sortedLeaderboard.slice(0, 3);

  return (
    <div id="leaderboard-container" className="space-y-8">
      {/* Hero Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold uppercase tracking-wider mb-3 border border-emerald-500/30">
              <Trophy className="w-3.5 h-3.5" />
              <span>Official Club Standings</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Running Club Leaderboard
            </h1>
            <p className="text-sm text-slate-400 mt-2">
              Live runner rankings computed from PostgreSQL database records. Log your miles and climb to the top of the podium!
            </p>
          </div>

          {/* Time Filter Pills */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 self-start md:self-center">
            <button
              id="filter-period-all"
              onClick={() => setPeriod('all')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                period === 'all'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              All-Time
            </button>
            <button
              id="filter-period-month"
              onClick={() => setPeriod('month')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                period === 'month'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Past 30 Days
            </button>
            <button
              id="filter-period-week"
              onClick={() => setPeriod('week')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                period === 'week'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Past 7 Days
            </button>
          </div>
        </div>

        {/* Podium for Top 3 (if we have runners) */}
        {!loading && topThree.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-800">
            {/* 2nd Place */}
            {topThree[1] && (
              <div className="order-2 md:order-1 bg-slate-800/50 rounded-2xl p-5 border border-slate-700/40 text-center relative flex flex-col justify-between">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-slate-300 text-slate-900 font-bold text-xs rounded-full shadow flex items-center space-x-1">
                  <Medal className="w-3.5 h-3.5 text-slate-700" />
                  <span>2ND PLACE</span>
                </div>
                <div className="pt-2">
                  {topThree[1].photoUrl ? (
                    <img
                      src={topThree[1].photoUrl}
                      alt={topThree[1].displayName}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-full mx-auto mb-2.5 border-2 border-slate-300 object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-700 mx-auto mb-2.5 flex items-center justify-center text-slate-300 border-2 border-slate-300">
                      <User className="w-8 h-8" />
                    </div>
                  )}
                  <h3 className="text-base font-bold text-white truncate">{topThree[1].displayName}</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{topThree[1].totalRuns} runs</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-700/50 flex justify-around text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Distance</span>
                    <span className="text-lg font-bold font-mono text-white">{topThree[1].totalDistanceKm.toFixed(1)} km</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Avg Pace</span>
                    <span className="text-lg font-bold font-mono text-emerald-400">{formatPace(topThree[1].avgPaceMinPerKm)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 1st Place - Gold */}
            {topThree[0] && (
              <div className="order-1 md:order-2 bg-gradient-to-b from-amber-500/20 to-slate-800/80 rounded-2xl p-6 border-2 border-amber-400/60 text-center relative shadow-xl flex flex-col justify-between transform md:-translate-y-2">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-400 text-slate-950 font-black text-xs rounded-full shadow-lg flex items-center space-x-1">
                  <Trophy className="w-4 h-4 text-slate-950 fill-slate-950" />
                  <span>CLUB CHAMPION</span>
                </div>
                <div className="pt-2">
                  {topThree[0].photoUrl ? (
                    <img
                      src={topThree[0].photoUrl}
                      alt={topThree[0].displayName}
                      referrerPolicy="no-referrer"
                      className="w-20 h-20 rounded-full mx-auto mb-3 border-4 border-amber-400 shadow-md object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-slate-700 mx-auto mb-3 flex items-center justify-center text-amber-400 border-4 border-amber-400">
                      <User className="w-10 h-10" />
                    </div>
                  )}
                  <h3 className="text-lg font-extrabold text-white truncate">{topThree[0].displayName}</h3>
                  <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-amber-400/20 text-amber-300 rounded-full text-xs font-semibold mt-1">
                    <Flame className="w-3.5 h-3.5" />
                    <span>{topThree[0].totalRuns} Completed Runs</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-amber-400/30 flex justify-around text-center">
                  <div>
                    <span className="text-[10px] text-amber-200/70 uppercase font-semibold block">Total Mileage</span>
                    <span className="text-2xl font-black font-mono text-amber-300">{topThree[0].totalDistanceKm.toFixed(1)} km</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-200/70 uppercase font-semibold block">Avg Pace</span>
                    <span className="text-2xl font-black font-mono text-emerald-400">{formatPace(topThree[0].avgPaceMinPerKm)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 3rd Place - Bronze */}
            {topThree[2] && (
              <div className="order-3 md:order-3 bg-slate-800/50 rounded-2xl p-5 border border-slate-700/40 text-center relative flex flex-col justify-between">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-amber-700 text-white font-bold text-xs rounded-full shadow flex items-center space-x-1">
                  <Medal className="w-3.5 h-3.5 text-amber-300" />
                  <span>3RD PLACE</span>
                </div>
                <div className="pt-2">
                  {topThree[2].photoUrl ? (
                    <img
                      src={topThree[2].photoUrl}
                      alt={topThree[2].displayName}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-full mx-auto mb-2.5 border-2 border-amber-700 object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-700 mx-auto mb-2.5 flex items-center justify-center text-slate-300 border-2 border-amber-700">
                      <User className="w-8 h-8" />
                    </div>
                  )}
                  <h3 className="text-base font-bold text-white truncate">{topThree[2].displayName}</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{topThree[2].totalRuns} runs</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-700/50 flex justify-around text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Distance</span>
                    <span className="text-lg font-bold font-mono text-white">{topThree[2].totalDistanceKm.toFixed(1)} km</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Avg Pace</span>
                    <span className="text-lg font-bold font-mono text-emerald-400">{formatPace(topThree[2].avgPaceMinPerKm)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Leaderboard Table */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
        {/* Table Controls */}
        <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white">Rankings & Activity Stats</h2>
            <p className="text-xs text-slate-400">Ranked by overall running activity in the selected timeframe</p>
          </div>

          {/* Sort Category Selector */}
          <div className="flex items-center space-x-2 overflow-x-auto">
            <span className="text-xs text-slate-400 font-medium">Rank by:</span>
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setSortBy('distance')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  sortBy === 'distance' ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Distance
              </button>
              <button
                onClick={() => setSortBy('runs')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  sortBy === 'runs' ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Total Runs
              </button>
              <button
                onClick={() => setSortBy('pace')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  sortBy === 'pace' ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Avg Pace
              </button>
              <button
                onClick={() => setSortBy('longest')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  sortBy === 'longest' ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Longest Run
              </button>
            </div>

            <button
              onClick={() => fetchLeaderboard(period)}
              title="Refresh Leaderboard"
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        ) : sortedLeaderboard.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">No runner activity in this timeframe</h3>
            <p className="text-xs text-slate-400 mb-4">Be the first to log a run and claim #1 on the leaderboard!</p>
            <button
              onClick={onOpenLogModal}
              className="inline-flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-sm active:scale-95"
            >
              <Zap className="w-4 h-4 stroke-[2.5]" />
              <span>Log a Run Now</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <th className="py-3.5 px-4 sm:px-6 w-16 text-center">Rank</th>
                  <th className="py-3.5 px-4 sm:px-6">Runner</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Total Distance</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right hidden sm:table-cell">Runs</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Avg Pace</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right hidden md:table-cell">Longest Run</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right hidden lg:table-cell">Total Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {sortedLeaderboard.map((runner, index) => {
                  const isCurrentUser = user && runner.uid === user.uid;
                  const rank = index + 1;

                  return (
                    <tr
                      key={runner.userId}
                      id={`leaderboard-row-${runner.userId}`}
                      className={`transition-colors ${
                        isCurrentUser
                          ? 'bg-emerald-950/30 hover:bg-emerald-950/40 font-semibold'
                          : 'hover:bg-slate-800/50'
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-4 px-4 sm:px-6 text-center">
                        {rank === 1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-xs">
                            1
                          </span>
                        ) : rank === 2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-900 font-bold text-xs shadow-xs">
                            2
                          </span>
                        ) : rank === 3 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-white font-bold text-xs shadow-xs">
                            3
                          </span>
                        ) : (
                          <span className="text-xs font-mono font-bold text-slate-500">#{rank}</span>
                        )}
                      </td>

                      {/* Runner info */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center space-x-3">
                          {runner.photoUrl ? (
                            <img
                              src={runner.photoUrl}
                              alt={runner.displayName}
                              referrerPolicy="no-referrer"
                              className="w-9 h-9 rounded-full object-cover border border-slate-700"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                              <User className="w-4 h-4" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-white">{runner.displayName}</span>
                              {isCurrentUser && (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500 text-slate-950 rounded-full font-mono">
                                  YOU
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400">{runner.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Total Distance */}
                      <td className="py-4 px-4 sm:px-6 text-right font-mono font-bold text-white">
                        {runner.totalDistanceKm.toFixed(1)}{' '}
                        <span className="text-xs font-sans font-normal text-slate-400">km</span>
                      </td>

                      {/* Runs count */}
                      <td className="py-4 px-4 sm:px-6 text-right font-mono text-slate-300 hidden sm:table-cell">
                        {runner.totalRuns}
                      </td>

                      {/* Avg Pace */}
                      <td className="py-4 px-4 sm:px-6 text-right font-mono font-bold text-emerald-400">
                        {formatPace(runner.avgPaceMinPerKm)}
                      </td>

                      {/* Longest Run */}
                      <td className="py-4 px-4 sm:px-6 text-right font-mono text-slate-300 hidden md:table-cell">
                        {runner.longestRunKm > 0 ? `${runner.longestRunKm.toFixed(1)} km` : '-'}
                      </td>

                      {/* Total Duration */}
                      <td className="py-4 px-4 sm:px-6 text-right font-mono text-xs text-slate-400 hidden lg:table-cell">
                        {formatDuration(runner.totalDurationSeconds)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
