import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  Plus,
  Bell,
  Sparkles,
  ChevronRight,
  Coffee,
  Flame,
  X,
} from 'lucide-react';
import { ClubEventItem, UserProfile } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface EventsViewProps {
  currentUser: UserProfile | null;
  onNotify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const EventsView: React.FC<EventsViewProps> = ({ currentUser, onNotify }) => {
  const { token } = useAuth();
  const [events, setEvents] = useState<ClubEventItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('07:00 AM');
  const [distanceKm, setDistanceKm] = useState('10');
  const [paceCategory, setPaceCategory] = useState('All Paces (4:30 - 6:30 min/km)');

  /** YYYY-MM-DD → weekday (no timezone shift) */
  const weekdayFromYmd = (ymd: string): string | null => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
    const [y, m, d] = ymd.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    if (Number.isNaN(dt.getTime())) return null;
    return dt.toLocaleDateString('en-US', { weekday: 'long' });
  };

  /** Title has "Sunday" but date is Tuesday → replace day name to match date */
  const alignTitleWeekday = (rawTitle: string, ymd: string): string => {
    const correct = weekdayFromYmd(ymd);
    if (!correct) return rawTitle;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let out = rawTitle;
    for (const day of days) {
      const re = new RegExp(`\\b${day}\\b`, 'gi');
      if (re.test(out)) {
        out = out.replace(re, correct);
      }
    }
    return out;
  };

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const url = currentUser
        ? `/api/events?userUid=${encodeURIComponent(currentUser.uid)}`
        : '/api/events';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('Error loading events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [currentUser]);

  const handleToggleRsvp = async (eventId: number) => {
    if (!currentUser) {
      onNotify?.('Please sign in to RSVP for club events', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        onNotify?.(
          data.rsvp
            ? "RSVP Confirmed! You'll receive an automated reminder on Saturday at 7:00 PM."
            : 'RSVP Cancelled.',
          'success'
        );
        fetchEvents();
      }
    } catch (err: any) {
      onNotify?.(err.message || 'Failed to update RSVP', 'error');
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !location || !eventDate || !eventTime) {
      onNotify?.('Please fill in all required event fields', 'error');
      return;
    }

    let normalizedDate = eventDate.trim();
    const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(normalizedDate);
    if (dmy) {
      const [, dd, mm, yyyy] = dmy;
      normalizedDate = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
      onNotify?.('Date must be YYYY-MM-DD (use the date picker)', 'error');
      return;
    }

    const alignedTitle = alignTitleWeekday(title.trim(), normalizedDate);

    try {
      setIsSubmitting(true);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch('/api/events', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: alignedTitle,
          description,
          location,
          eventDate: normalizedDate,
          eventTime,
          distanceKm: parseFloat(distanceKm) || 10,
          paceCategory,
        }),
      });

      if (res.ok) {
        onNotify?.('Club Event scheduled! Auto-reminder agent configured.', 'success');
        setIsModalOpen(false);
        setTitle('');
        setDescription('');
        setLocation('');
        setEventDate('');
        fetchEvents();
      } else {
        let msg = 'Failed to schedule event';
        try {
          const err = await res.json();
          msg = err.error || msg;
        } catch {
          msg = `Failed to schedule event (HTTP ${res.status})`;
        }
        onNotify?.(msg, 'error');
      }
    } catch (err: any) {
      onNotify?.(err.message || 'Error creating event', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                Autonomous Event Sync Active
              </span>
              <span className="text-xs text-slate-400 font-mono">
                System 3 • Sat 7:00 PM Auto Reminders
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight flex items-center gap-3">
              <Calendar className="w-8 h-8 text-amber-400" />
              <span>Club Events & Group Runs</span>
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Join weekly long runs and speed workouts. When you RSVP, Pasiya Agent can deliver a pre-run reminder to your dashboard.
            </p>
          </div>

          <button
            id="create-event-btn"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold shadow-lg shadow-amber-950 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            Host Club Event
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            Upcoming Club Runs & Meetups
          </h2>
          <span className="text-xs text-slate-400">{events.length} Scheduled Sessions</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {events.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-100">{event.title}</h3>
                  <p className="mt-1 text-sm text-slate-400 line-clamp-2">{event.description}</p>
                </div>
                {event.userHasRsvped && (
                  <span className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> RSVP
                  </span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  {new Date(event.eventDate + 'T12:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  {event.eventTime}
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  {event.location}
                </div>
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  {event.distanceKm} km
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  {event.rsvpCount ?? 0} going
                </div>
              </div>

              <button
                onClick={() => handleToggleRsvp(event.id)}
                className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-800/80 py-2.5 text-sm font-semibold text-slate-100 hover:bg-slate-700 transition"
              >
                {event.userHasRsvped ? 'Cancel RSVP' : 'RSVP · Get Auto Reminder'}
              </button>
            </motion.div>
          ))}
        </div>

        {!isLoading && events.length === 0 && (
          <p className="text-center text-slate-500 py-10">No club events yet. Host the first group run.</p>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  Schedule Club Group Run
                </h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Event Title *</label>
                  <input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Sunday Sunrise 10K Long Run & Coffee"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Description & Route Details *</label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Describe the route, hydration stops, paced subgroups..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Meeting Location & Landmark *</label>
                  <input
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Marina Promenade (Near Main Clubhouse Fountain)"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Event Date (YYYY-MM-DD) *</label>
                    <input
                      type="date"
                      required
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
                    />
                    {eventDate && weekdayFromYmd(eventDate) && (
                      <p className="mt-1.5 text-xs text-amber-300/90">
                        Selected weekday:{' '}
                        <span className="font-bold">{weekdayFromYmd(eventDate)}</span>
                        {' '}— if title has Mon–Sun, it will match this date
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Start Time *</label>
                    <input
                      required
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      placeholder="07:00 AM"
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Distance (km)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={distanceKm}
                      onChange={(e) => setDistanceKm(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Pace Category</label>
                    <input
                      value={paceCategory}
                      onChange={(e) => setPaceCategory(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200/90">
                  Autonomous Agent: when scheduled, reminders can go to RSVP’d athletes before the run.
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold disabled:opacity-60"
                  >
                    {isSubmitting ? 'Saving…' : 'Publish Event'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
 
