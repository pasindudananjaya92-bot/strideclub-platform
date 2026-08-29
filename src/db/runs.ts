import { db } from './index.ts';
import { runs, users } from './schema.ts';
import { eq, desc, and, gte, sql } from 'drizzle-orm';

export interface CreateRunInput {
  userId: number;
  userUid: string;
  title: string;
  distanceKm: number;
  durationSeconds: number;
  runDate: string; // YYYY-MM-DD
  paceMinPerKm: number;
  notes?: string;
  surfaceType?: string;
}

export async function createRun(data: CreateRunInput) {
  try {
    const inserted = await db
      .insert(runs)
      .values({
        userId: data.userId,
        userUid: data.userUid,
        title: data.title,
        distanceKm: data.distanceKm,
        durationSeconds: data.durationSeconds,
        runDate: data.runDate,
        paceMinPerKm: data.paceMinPerKm,
        notes: data.notes || '',
        surfaceType: data.surfaceType || 'Road',
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error('Database query error in createRun:', error);
    throw new Error('Failed to log run to database.', { cause: error });
  }
}

export async function getUserRuns(userUid: string) {
  try {
    return await db
      .select()
      .from(runs)
      .where(eq(runs.userUid, userUid))
      .orderBy(desc(runs.runDate), desc(runs.createdAt));
  } catch (error) {
    console.error('Database query error in getUserRuns:', error);
    throw new Error('Failed to fetch user runs.', { cause: error });
  }
}

export async function deleteRun(runId: number, userUid: string) {
  try {
    const deleted = await db
      .delete(runs)
      .where(and(eq(runs.id, runId), eq(runs.userUid, userUid)))
      .returning();

    return deleted.length > 0;
  } catch (error) {
    console.error('Database query error in deleteRun:', error);
    throw new Error('Failed to delete run.', { cause: error });
  }
}

export interface LeaderboardEntry {
  userId: number;
  uid: string;
  displayName: string;
  email: string;
  photoUrl: string | null;
  totalDistanceKm: number;
  totalRuns: number;
  totalDurationSeconds: number;
  avgPaceMinPerKm: number;
  longestRunKm: number;
  fastestPaceMinPerKm: number;
}

export async function getLeaderboard(period: 'all' | 'month' | 'week' = 'all'): Promise<LeaderboardEntry[]> {
  try {
    let dateFilter: string | null = null;
    const now = new Date();

    if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = weekAgo.toISOString().split('T')[0];
    } else if (period === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = monthAgo.toISOString().split('T')[0];
    }

    const whereClause = dateFilter ? gte(runs.runDate, dateFilter) : undefined;

    // Join runs with users and aggregate per user
    const rows = await db
      .select({
        userId: users.id,
        uid: users.uid,
        displayName: users.displayName,
        email: users.email,
        photoUrl: users.photoUrl,
        totalDistanceKm: sql<number>`COALESCE(SUM(${runs.distanceKm}), 0)`,
        totalRuns: sql<number>`COUNT(${runs.id})`,
        totalDurationSeconds: sql<number>`COALESCE(SUM(${runs.durationSeconds}), 0)`,
        avgPaceMinPerKm: sql<number>`COALESCE(AVG(${runs.paceMinPerKm}), 0)`,
        longestRunKm: sql<number>`COALESCE(MAX(${runs.distanceKm}), 0)`,
        fastestPaceMinPerKm: sql<number>`COALESCE(MIN(${runs.paceMinPerKm}), 0)`,
      })
      .from(users)
      .leftJoin(runs, eq(users.id, runs.userId))
      .where(whereClause)
      .groupBy(users.id, users.uid, users.displayName, users.email, users.photoUrl)
      .orderBy(sql`COALESCE(SUM(${runs.distanceKm}), 0) DESC`);

    return rows.map((r) => ({
      userId: Number(r.userId),
      uid: String(r.uid),
      displayName: r.displayName || r.email.split('@')[0] || 'Runner',
      email: r.email,
      photoUrl: r.photoUrl,
      totalDistanceKm: Math.round(Number(r.totalDistanceKm) * 100) / 100,
      totalRuns: Number(r.totalRuns),
      totalDurationSeconds: Number(r.totalDurationSeconds),
      avgPaceMinPerKm: Math.round(Number(r.avgPaceMinPerKm) * 100) / 100,
      longestRunKm: Math.round(Number(r.longestRunKm) * 100) / 100,
      fastestPaceMinPerKm: Math.round(Number(r.fastestPaceMinPerKm) * 100) / 100,
    }));
  } catch (error) {
    console.error('Database query error in getLeaderboard:', error);
    throw new Error('Failed to compute club leaderboard.', { cause: error });
  }
}

export async function getClubStats() {
  try {
    const totalRunsResult = await db
      .select({
        totalKm: sql<number>`COALESCE(SUM(${runs.distanceKm}), 0)`,
        totalCount: sql<number>`COUNT(${runs.id})`,
        totalSeconds: sql<number>`COALESCE(SUM(${runs.durationSeconds}), 0)`,
        avgPace: sql<number>`COALESCE(AVG(${runs.paceMinPerKm}), 0)`,
      })
      .from(runs);

    const totalUsersResult = await db
      .select({
        memberCount: sql<number>`COUNT(${users.id})`,
      })
      .from(users);

    const recentRuns = await db
      .select({
        id: runs.id,
        title: runs.title,
        distanceKm: runs.distanceKm,
        durationSeconds: runs.durationSeconds,
        runDate: runs.runDate,
        paceMinPerKm: runs.paceMinPerKm,
        surfaceType: runs.surfaceType,
        runnerName: users.displayName,
        runnerPhoto: users.photoUrl,
        userUid: runs.userUid,
        createdAt: runs.createdAt,
      })
      .from(runs)
      .innerJoin(users, eq(runs.userId, users.id))
      .orderBy(desc(runs.createdAt))
      .limit(10);

    const row = totalRunsResult[0];
    const memberRow = totalUsersResult[0];

    return {
      totalKm: Math.round(Number(row?.totalKm || 0) * 10) / 10,
      totalRuns: Number(row?.totalCount || 0),
      totalSeconds: Number(row?.totalSeconds || 0),
      avgPace: Math.round(Number(row?.avgPace || 0) * 100) / 100,
      totalMembers: Number(memberRow?.memberCount || 0),
      recentActivity: recentRuns,
    };
  } catch (error) {
    console.error('Database query error in getClubStats:', error);
    throw new Error('Failed to retrieve club analytics.', { cause: error });
  }
} 
