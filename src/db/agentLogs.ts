import { db } from './index.ts';
import { agentLogs } from './schema.ts';
import { desc, sql, gte, eq } from 'drizzle-orm';
import { AgentTelemetrySummary } from '../types.ts';

export interface CreateAgentLogInput {
  systemName: string;
  actionType: string;
  description: string;
  status?: 'success' | 'warning' | 'error' | 'skipped';
  metrics?: any;
}

export async function logAgentAction(input: CreateAgentLogInput) {
  try {
    const inserted = await db
      .insert(agentLogs)
      .values({
        systemName: input.systemName,
        actionType: input.actionType,
        description: input.description,
        status: input.status || 'success',
        metrics: input.metrics ? JSON.stringify(input.metrics) : null,
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error('Error writing agent log:', error);
    return null;
  }
}

export async function getAgentLogs(limitCount = 60, systemFilter?: string) {
  try {
    let query = db.select().from(agentLogs);
    if (systemFilter && systemFilter !== 'all') {
      query = db.select().from(agentLogs).where(eq(agentLogs.systemName, systemFilter)) as any;
    }

    const rows = await query.orderBy(desc(agentLogs.executedAt)).limit(limitCount);

    return rows.map((r) => ({
      id: r.id,
      systemName: r.systemName,
      actionType: r.actionType,
      description: r.description,
      status: (r.status as 'success' | 'warning' | 'error' | 'skipped') || 'success',
      metrics: r.metrics ? JSON.parse(r.metrics) : null,
      executedAt: r.executedAt ? r.executedAt.toISOString() : new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error retrieving agent logs:', error);
    return [];
  }
}

export async function getAgentTelemetrySummary(autonomousModeEnabled: boolean): Promise<AgentTelemetrySummary> {
  try {
    const totalCountRes = await db.select({ count: sql<number>`COUNT(*)` }).from(agentLogs);
    const totalCount = Number(totalCountRes[0]?.count || 0);

    const logs = await db.select().from(agentLogs).orderBy(desc(agentLogs.executedAt)).limit(200);

    let plansGeneratedTotal = 0;
    let postsScannedTotal = 0;
    let spamPostsDeletedTotal = 0;
    let eventRemindersSentTotal = 0;
    let stravaRunsSyncedTotal = 0;
    let lastRunTimestamp: string | null = null;

    if (logs.length > 0 && logs[0].executedAt) {
      lastRunTimestamp = logs[0].executedAt.toISOString();
    }

    for (const log of logs) {
      if (log.metrics) {
        try {
          const m = JSON.parse(log.metrics);
          if (m.plansGenerated) plansGeneratedTotal += Number(m.plansGenerated);
          if (m.scannedPosts) postsScannedTotal += Number(m.scannedPosts);
          if (m.deletedSpam) spamPostsDeletedTotal += Number(m.deletedSpam);
          if (m.rsvpsNotifiedCount) eventRemindersSentTotal += Number(m.rsvpsNotifiedCount);
          if (m.totalRunsImported) stravaRunsSyncedTotal += Number(m.totalRunsImported);
        } catch {
          // ignore parsing error
        }
      }
    }

    return {
      autonomousModeEnabled,
      totalAgentExecutions: totalCount,
      plansGeneratedTotal,
      postsScannedTotal,
      spamPostsDeletedTotal,
      eventRemindersSentTotal,
      stravaRunsSyncedTotal,
      lastRunTimestamp,
    };
  } catch (error) {
    console.error('Error computing telemetry summary:', error);
    return {
      autonomousModeEnabled,
      totalAgentExecutions: 0,
      plansGeneratedTotal: 0,
      postsScannedTotal: 0,
      spamPostsDeletedTotal: 0,
      eventRemindersSentTotal: 0,
      stravaRunsSyncedTotal: 0,
      lastRunTimestamp: null,
    };
  }
} 
