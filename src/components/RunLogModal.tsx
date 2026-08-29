import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { formatPace } from '../utils/formatters.ts';
import {
  X,
  Calendar,
  Compass,
  Timer,
  Zap,
  FileText,
  CheckCircle2,
  AlertCircle,
  CloudSun,
  Search,
  ExternalLink,
  Sparkles,
  PlusCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RunLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunLogged: () => void;
  initialData?: {
    title?: string;
    distanceKm?: number;
    targetPace?: string;
    notes?: string;
  } | null;
}

const DISTANCE_PRESETS = [
  { label: '3K', value: 3.0 },
  { label: '5K', value: 5.0 },
  { label: '10K', value: 10.0 },
  { label: '15K', value: 15.0 },
  { label: 'Half (21.1K)', value: 21.1 },
  { label: 'Full (42.2K)', value: 42.2 },
];

const SURFACE_OPTIONS = ['Road', 'Trail', 'Track', 'Treadmill', 'Park'];

export const RunLogModal: React.FC<RunLogModalProps> = ({
  isOpen,
  onClose,
  onRunLogged,
  initialData,
}) => {
  const { user, dbProfile, token } = useAuth();
  
  const today = new Date().toISOString().split('T')[0];
  const [title, setTitle] = useState('');
  const [distanceKm, setDistanceKm] = useState<string>('5.0');
  const [hours, setHours] = useState<string>('0');
  const [minutes, setMinutes] = useState<string>('25');
  const [seconds, setSeconds] = useState<string>('00');
  const [runDate, setRunDate] = useState<string>(today);
  const [surfaceType, setSurfaceType] = useState<string>('Road');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Weather search state
  const [weatherLocation, setWeatherLocation] = useState<string>(dbProfile?.city || '');
  const [fetchingWeather, setFetchingWeather] = useState(false);
  const [weatherData, setWeatherData] = useState<{
    summary: string;
    sources: Array<{ title: string; url: string }>;
  } | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      if (initialData.title) setTitle(initialData.title);
      if (initialData.distanceKm) setDistanceKm(initialData.distanceKm.toString());
      if (initialData.notes) setNotes(initialData.notes);
    }
  }, [initialData]);

  // Compute total duration in seconds and live pace
  const distNum = parseFloat(distanceKm) || 0;
  const totalSeconds = (parseInt(hours || '0', 10) * 3600) + (parseInt(minutes || '0', 10) * 60) + parseInt(seconds || '0', 10);
  const calculatedPace = distNum > 0 && totalSeconds > 0 ? (totalSeconds / 60) / distNum : 0;

  const handleFetchWeather = async () => {
    if (!weatherLocation.trim()) {
      setWeatherError('Please enter a city or location to search weather for.');
      return;
    }

    try {
      setFetchingWeather(true);
      setWeatherError(null);

      const res = await fetch('/api/weather/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: weatherLocation.trim(),
          date: runDate,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to retrieve weather');
      }

      const data = await res.json();
      setWeatherData(data);
    } catch (err: any) {
      console.error('Weather fetch error:', err);
      setWeatherError(err.message || 'Unable to fetch weather conditions.');
    } finally {
      setFetchingWeather(false);
    }
  };

  const handleApplyWeatherToNotes = () => {
    if (!weatherData) return;
    const weatherSnippet = `🌤️ Weather (${weatherLocation} on ${runDate}):\n${weatherData.summary}`;
    setNotes((prev) => (prev ? `${prev}\n\n${weatherSnippet}` : weatherSnippet));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please provide a title for your run.');
      return;
    }
    if (distNum <= 0) {
      setError('Distance must be greater than 0 km.');
      return;
    }
    if (totalSeconds <= 0) {
      setError('Duration must be greater than 0 seconds.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/runs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          distanceKm: distNum,
          durationSeconds: totalSeconds,
          runDate,
          notes: notes.trim(),
          surfaceType,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to record run');
      }

      // Reset and close
      setTitle('');
      setNotes('');
      setWeatherData(null);
      onRunLogged();
      onClose();
    } catch (err: any) {
      console.error('Error logging run:', err);
      setError(err.message || 'Failed to submit run. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18 }}
          className="relative w-full max-w-lg bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-slate-950 px-6 py-5 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Log a New Run</h2>
                <p className="text-xs text-slate-400">Save to Cloud SQL & update club leaderboard</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-red-300 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Run Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Run Title <span className="text-emerald-400">*</span>
              </label>
              <input
                id="input-run-title"
                type="text"
                required
                placeholder="e.g. Morning River Trail Run, 5K Tempo, Track Repeats"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white placeholder-slate-600 transition-all"
              />
            </div>

            {/* Distance & Presets */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Distance (Kilometers) <span className="text-emerald-400">*</span>
                </label>
                <span className="text-xs text-slate-400 font-mono">
                  {distNum > 0 ? `${(distNum * 0.621371).toFixed(2)} miles` : ''}
                </span>
              </div>
              <div className="relative">
                <input
                  id="input-run-distance"
                  type="number"
                  step="0.01"
                  min="0.1"
                  max="500"
                  required
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono font-semibold focus:outline-none focus:border-emerald-500 text-white"
                  placeholder="5.0"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-slate-500 font-semibold">KM</span>
              </div>

              {/* Quick Distance Presets */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {DISTANCE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setDistanceKm(preset.value.toString())}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                      parseFloat(distanceKm) === preset.value
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time / Duration */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Duration (HH : MM : SS) <span className="text-emerald-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <div className="relative">
                    <input
                      id="input-duration-hours"
                      type="number"
                      min="0"
                      max="24"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      className="w-full text-center py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono font-semibold focus:outline-none focus:border-emerald-500 text-white"
                      placeholder="0"
                    />
                  </div>
                  <span className="block text-center text-[10px] text-slate-500 mt-1 uppercase font-semibold">Hours</span>
                </div>
                <div>
                  <div className="relative">
                    <input
                      id="input-duration-minutes"
                      type="number"
                      min="0"
                      max="59"
                      value={minutes}
                      onChange={(e) => setMinutes(e.target.value)}
                      className="w-full text-center py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono font-semibold focus:outline-none focus:border-emerald-500 text-white"
                      placeholder="25"
                    />
                  </div>
                  <span className="block text-center text-[10px] text-slate-500 mt-1 uppercase font-semibold">Minutes</span>
                </div>
                <div>
                  <div className="relative">
                    <input
                      id="input-duration-seconds"
                      type="number"
                      min="0"
                      max="59"
                      value={seconds}
                      onChange={(e) => setSeconds(e.target.value)}
                      className="w-full text-center py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono font-semibold focus:outline-none focus:border-emerald-500 text-white"
                      placeholder="00"
                    />
                  </div>
                  <span className="block text-center text-[10px] text-slate-500 mt-1 uppercase font-semibold">Seconds</span>
                </div>
              </div>
            </div>

            {/* Calculated Pace Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Timer className="w-5 h-5 text-emerald-400" />
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Calculated Average Pace</span>
                  <span className="text-base font-bold font-mono text-emerald-400">
                    {calculatedPace > 0 ? formatPace(calculatedPace) : '--:--'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block font-medium">Total Time</span>
                <span className="text-xs font-mono font-bold text-slate-200">
                  {Math.floor(totalSeconds / 60)} min {totalSeconds % 60} sec
                </span>
              </div>
            </div>

            {/* Date and Surface */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Date of Run
                </label>
                <div className="relative">
                  <input
                    id="input-run-date"
                    type="date"
                    required
                    value={runDate}
                    max={today}
                    onChange={(e) => setRunDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Terrain / Surface
                </label>
                <select
                  id="select-surface-type"
                  value={surfaceType}
                  onChange={(e) => setSurfaceType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-white font-medium"
                >
                  {SURFACE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Google Search Weather Lookup */}
            <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
                  <CloudSun className="w-4 h-4 text-amber-400" />
                  <span>Fetch Real Weather (Google Search Grounding)</span>
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Live Search
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    id="input-weather-location"
                    type="text"
                    placeholder="Enter city / location (e.g. Colombo, Central Park, London)"
                    value={weatherLocation}
                    onChange={(e) => setWeatherLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  id="btn-fetch-weather"
                  type="button"
                  onClick={handleFetchWeather}
                  disabled={fetchingWeather || !weatherLocation.trim()}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 hover:border-slate-600 transition-all flex items-center justify-center space-x-1.5 active:scale-95 disabled:opacity-50 shrink-0"
                >
                  <Search className={`w-3.5 h-3.5 text-emerald-400 ${fetchingWeather ? 'animate-spin' : ''}`} />
                  <span>{fetchingWeather ? 'Searching Google...' : 'Fetch Weather'}</span>
                </button>
              </div>

              {weatherError && (
                <p className="text-[11px] text-red-400 bg-red-950/50 p-2 rounded-lg border border-red-900/50">
                  {weatherError}
                </p>
              )}

              {weatherData && (
                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-semibold flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Weather for {weatherLocation} ({runDate})</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleApplyWeatherToNotes}
                      className="flex items-center space-x-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/80 px-2.5 py-1 rounded-lg border border-emerald-800/80 transition-all active:scale-95"
                    >
                      <PlusCircle className="w-3 h-3" />
                      <span>Add to Notes</span>
                    </button>
                  </div>

                  <div className="text-slate-300 text-xs whitespace-pre-line leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60 font-sans">
                    {weatherData.summary}
                  </div>

                  {weatherData.sources && weatherData.sources.length > 0 && (
                    <div className="pt-1.5 border-t border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block mb-1">Google Search Sources:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {weatherData.sources.slice(0, 3).map((s, idx) => (
                          <a
                            key={idx}
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-[10px] text-emerald-400 hover:underline bg-slate-950 px-2 py-0.5 rounded border border-slate-800"
                          >
                            <span className="truncate max-w-[140px]">{s.title}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Notes & Conditions (Optional)
              </label>
              <textarea
                id="textarea-run-notes"
                rows={2}
                placeholder="Weather, heart rate, how it felt, shoe gear..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-white placeholder-slate-600"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                id="btn-submit-run"
                type="submit"
                disabled={submitting || !user}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center space-x-2"
              >
                {submitting ? (
                  <span>Logging Run...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    <span>Save Run to Cloud SQL</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}; 
