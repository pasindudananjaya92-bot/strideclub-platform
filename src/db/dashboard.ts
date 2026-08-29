import { eq, desc, sql } from 'drizzle-orm';
import { db } from './index.ts';
import { users, runs, userIntegrations, notifications } from './schema.ts';
import { WeeklyTrendPoint, NotificationItem } from '../types.ts';

export interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  progressPercent: number;
  unlockedAt?: string;
}

export interface UserDashboardData {
  user: {
    id: number;
    uid: string;
    email: string;
    displayName: string | null;
    photoUrl: string | null;
    bio: string | null;
    city: string | null;
    shoeModel: string | null;
    unitPreference: string;
    weeklyGoalKm: number;
    targetPaceMinPerKm: number;
  };
  stats: {
    totalKm: number;
    totalRuns: number;
    totalSeconds: number;
    avgPace: number;
    longestRunKm: number;
    currentWeeklyKm: number;
    weeklyGoalPercent: number;
    streakWeeks: number;
  };
  weeklyTrend: WeeklyTrendPoint[];
  notifications: NotificationItem[];
  badges: UserBadge[];
  connectedIntegrationsCount: number;
  recentRuns: Array<{
    id: number;
    title: string;
    distanceKm: number;
    durationSeconds: number;
    paceMinPerKm: number;
    runDate: string;
    surfaceType: string | null;
  }>;
}

export async function getUserDashboardData(userUid: string): Promise<UserDashboardData | null> {
  const userRows = await db.select().from(users).where(eq(users.uid, userUid)).limit(1);
  if (userRows.length === 0) {
    return null;
  }
  const u = userRows[0];

  const userRuns = await db
    .select()
    .from(runs)
    .where(eq(runs.userUid, userUid))
    .orderBy(desc(runs.runDate), desc(runs.createdAt));

  const totalRuns = userRuns.length;
  let totalKm = 0;
  let totalSeconds = 0;
  let longestRunKm = 0;
  let currentWeeklyKm = 0;

  // Calculate current week boundaries
  const now = new Date();
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

  for (const r of userRuns) {
    totalKm += r.distanceKm;
    totalSeconds += r.durationSeconds;
    if (r.distanceKm > longestRunKm) longestRunKm = r.distanceKm;
    if (r.runDate >= startOfWeekStr) {
      currentWeeklyKm += r.distanceKm;
    }
  }

  const avgPace = totalKm > 0 ? (totalSeconds / 60) / totalKm : 0;
  const weeklyGoal = u.weeklyGoalKm || 25;
  const weeklyGoalPercent = Math.min(100, Math.round((currentWeeklyKm / weeklyGoal) * 100));

  // Compute past 6 weeks trend for Recharts
  const weeklyTrend: WeeklyTrendPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const wStart = new Date(startOfWeek);
    wStart.setDate(startOfWeek.getDate() - i * 7);
    const wEnd = new Date(wStart);
    wEnd.setDate(wStart.getDate() + 6);

    const wStartStr = wStart.toISOString().split('T')[0];
    const wEndStr = wEnd.toISOString().split('T')[0];

    const weekRuns = userRuns.filter((r) => r.runDate >= wStartStr && r.runDate <= wEndStr);
    const wKm = weekRuns.reduce((acc, r) => acc + r.distanceKm, 0);
    const wSecs = weekRuns.reduce((acc, r) => acc + r.durationSeconds, 0);
    const wPace = wKm > 0 ? (wSecs / 60) / wKm : (u.targetPaceMinPerKm || 5.3);

    const label = i === 0 ? 'This Week' : i === 1 ? 'Last Week' : `${wStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    weeklyTrend.push({
      weekLabel: label,
      startDate: wStartStr,
      distanceKm: Math.round(wKm * 10) / 10,
      avgPace: Math.round(wPace * 100) / 100,
      runsCount: weekRuns.length,
      targetKm: weeklyGoal,
    });
  }

  // Fetch recent notifications
  const notifRows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userUid, userUid))
    .orderBy(desc(notifications.createdAt))
    .limit(10);

  const notificationsList: NotificationItem[] = notifRows.map((n) => ({
    id: n.id,
    userId: n.userId,
    userUid: n.userUid,
    title: n.title,
    message: n.message,
    type: (n.type as any) || 'system',
    data: n.data ? JSON.parse(n.data) : null,
    isRead: Boolean(n.isRead),
    createdAt: n.createdAt ? n.createdAt.toISOString() : new Date().toISOString(),
  }));

  // Count active integrations
  const integrations = await db
    .select()
    .from(userIntegrations)
    .where(eq(userIntegrations.userUid, userUid));

  // Calculate badges
  const badges: UserBadge[] = [
    {
      id: 'first-step',
      name: 'First Stride',
      description: 'Log your very first run with the club',
      icon: 'Footprints',
      isUnlocked: totalRuns >= 1,
      progressPercent: Math.min(100, (totalRuns / 1) * 100),
    },
    {
      id: '5k-club',
      name: '5K Finisher',
      description: 'Complete a single run of 5.0 km or more',
      icon: 'Medal',
      isUnlocked: longestRunKm >= 5.0,
      progressPercent: Math.min(100, (longestRunKm / 5.0) * 100),
    },
    {
      id: '10k-conqueror',
      name: '10K Beast',
      description: 'Conquer a 10.0+ km endurance run',
      icon: 'Trophy',
      isUnlocked: longestRunKm >= 10.0,
      progressPercent: Math.min(100, (longestRunKm / 10.0) * 100),
    },
    {
      id: 'half-marathon',
      name: 'Half Marathoner',
      description: 'Run 21.1 km in a single training session',
      icon: 'Crown',
      isUnlocked: longestRunKm >= 21.1,
      progressPercent: Math.min(100, (longestRunKm / 21.1) * 100),
    },
    {
      id: 'century-club',
      name: '100 KM Centurion',
      description: 'Accumulate 100 km of total logged distance',
      icon: 'Flame',
      isUnlocked: totalKm >= 100,
      progressPercent: Math.min(100, (totalKm / 100) * 100),
    },
    {
      id: 'speed-demon',
      name: 'Speed Demon',
      description: 'Log a run faster than 4:30 min/km pace',
      icon: 'Zap',
      isUnlocked: userRuns.some((r) => r.paceMinPerKm < 4.5 && r.distanceKm >= 3),
      progressPercent: userRuns.some((r) => r.paceMinPerKm < 4.5) ? 100 : 50,
    },
    {
      id: 'integration-pro',
      name: 'Connected Athlete',
      description: 'Connect an external API key or webhook in the Integrations Hub',
      icon: 'Cpu',
      isUnlocked: integrations.length >= 1,
      progressPercent: integrations.length >= 1 ? 100 : 0,
    },
  ];

  return {
    user: {
      id: u.id,
      uid: u.uid,
      email: u.email,
      displayName: u.displayName,
      photoUrl: u.photoUrl,
      bio: u.bio,
      city: u.city,
      shoeModel: u.shoeModel,
      unitPreference: u.unitPreference || 'km',
      weeklyGoalKm: u.weeklyGoalKm || 25,
      targetPaceMinPerKm: u.targetPaceMinPerKm || 5.5,
    },
    stats: {
      totalKm,
      totalRuns,
      totalSeconds,
      avgPace,
      longestRunKm,
      currentWeeklyKm,
      weeklyGoalPercent,
      streakWeeks: totalRuns > 0 ? Math.min(12, Math.ceil(totalRuns / 2)) : 0,
    },
    weeklyTrend,
    notifications: notificationsList,
    badges,
    connectedIntegrationsCount: integrations.length,
    recentRuns: userRuns.slice(0, 5).map((r) => ({
      id: r.id,
      title: r.title,
      distanceKm: r.distanceKm,
      durationSeconds: r.durationSeconds,
      paceMinPerKm: r.paceMinPerKm,
      runDate: r.runDate,
      surfaceType: r.surfaceType,
    })),
  };
}

export async function updateUserProfile(
  userUid: string,
  params: {
    displayName?: string;
    bio?: string;
    city?: string;
    shoeModel?: string;
    unitPreference?: string;
    weeklyGoalKm?: number;
    targetPaceMinPerKm?: number;
  }
) {
  const [updated] = await db
    .update(users)
    .set({
      ...(params.displayName !== undefined && { displayName: params.displayName }),
      ...(params.bio !== undefined && { bio: params.bio }),
      ...(params.city !== undefined && { city: params.city }),
      ...(params.shoeModel !== undefined && { shoeModel: params.shoeModel }),
      ...(params.unitPreference !== undefined && { unitPreference: params.unitPreference }),
      ...(params.weeklyGoalKm !== undefined && { weeklyGoalKm: params.weeklyGoalKm }),
      ...(params.targetPaceMinPerKm !== undefined && { targetPaceMinPerKm: params.targetPaceMinPerKm }),
    })
    .where(eq(users.uid, userUid))
    .returning();

  return updated;
} 
