import { sql, desc } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { users, runs, agentLogs, clubEvents } from '../db/schema.ts';
import { isAutonomousModeEnabled } from '../db/systemConfig.ts';
import { logAgentAction } from '../db/agentLogs.ts';
import { getAdminEmails } from '../lib/admin.ts';

export type HealthCheck = {
  ok: boolean;
  status: 'ok' | 'degraded' | 'error';
  time: string;
  checks: {
    database: boolean;
    geminiKey: boolean;
    encryptionSecret: boolean;
    adminEmails: boolean;
    githubToken: boolean;
    autonomousMode: boolean | null;
  };
  counts: {
    users: number | null;
    runs: number | null;
    events: number | null;
    agentLogs: number | null;
  };
  issues: string[];
};

function envSet(name: string): boolean {
  const v = process.env[name];
  return Boolean(v && String(v).trim().length > 0);
}

export async function runSentinelHealth(writeLog = true): Promise<HealthCheck> {
  const issues: string[] = [];
  const counts: HealthCheck['counts'] = {
    users: null,
    runs: null,
    events: null,
    agentLogs: null,
  };

  let database = false;
  let autonomousMode: boolean | null = null;

  const geminiKey = envSet('GEMINI_API_KEY');
  const encryptionSecret = envSet('ENCRYPTION_SECRET');
  const githubToken = envSet('GITHUB_ACCESS_TOKEN') || envSet('GITHUB_TOKEN');
  const adminEmails = getAdminEmails().length > 0;

  if (!geminiKey) issues.push('GEMINI_API_KEY is missing — AI Coach will use fallback tips.');
  if (!encryptionSecret) issues.push('ENCRYPTION_SECRET is missing — vault uses a weak default key.');
  if (!adminEmails) issues.push('ADMIN_EMAILS is empty — Admin badge will never show.');
  if (!githubToken) issues.push('GITHUB_ACCESS_TOKEN is missing — GitHub agent cannot commit.');

  try {
    await db.execute(sql`select 1`);
    database = true;

    const [userRow] = await db.select({ n: sql<number>`count(*)::int` }).from(users);
    const [runRow] = await db.select({ n: sql<number>`count(*)::int` }).from(runs);
    const [eventRow] = await db.select({ n: sql<number>`count(*)::int` }).from(clubEvents);
    const [logRow] = await db.select({ n: sql<number>`count(*)::int` }).from(agentLogs);

    counts.users = Number(userRow?.n ?? 0);
    counts.runs = Number(runRow?.n ?? 0);
    counts.events = Number(eventRow?.n ?? 0);
    counts.agentLogs = Number(logRow?.n ?? 0);

    if (counts.runs === 0) {
      issues.push('No runs in database. Dashboard 0.0 km until a signed-in user saves a Log Run.');
    }

    try {
      autonomousMode = await isAutonomousModeEnabled();
    } catch {
      autonomousMode = null;
      issues.push('system_config read failed — autonomous toggle unknown.');
    }
  } catch (err: any) {
    database = false;
    issues.push(`Database unreachable: ${err?.message || String(err)}`);
  }

  const okCore = database;
  const status: HealthCheck['status'] = !okCore ? 'error' : issues.length > 0 ? 'degraded' : 'ok';

  const result: HealthCheck = {
    ok: okCore,
    status,
    time: new Date().toISOString(),
    checks: {
      database,
      geminiKey,
      encryptionSecret,
      adminEmails,
      githubToken,
      autonomousMode,
    },
    counts,
    issues,
  };

  if (writeLog) {
    await logAgentAction({
      systemName: 'STRIDECLUB SENTINEL',
      actionType: 'health_check',
      description:
        issues.length === 0
          ? 'Health check passed. Database and core env flags look OK.'
          : `Health ${status}: ${issues.join(' | ')}`,
      status: status === 'ok' ? 'success' : status === 'degraded' ? 'warning' : 'error',
      metrics: {
        status,
        database,
        geminiKey,
        encryptionSecret,
        adminEmails,
        githubToken,
        autonomousMode,
        counts,
      },
    });
  }

  return result;
}
 
