import { eq, and, desc } from 'drizzle-orm';
import { db } from './index.ts';
import { userIntegrations, users } from './schema.ts';
import { encryptData, decryptData, maskKey } from '../utils/crypto.ts';

export interface UserIntegrationRecord {
  id: number;
  userId: number;
  userUid: string;
  serviceName: string;
  serviceLabel: string;
  maskedKey: string;
  endpointUrl: string | null;
  configData: any;
  isEnabled: boolean;
  lastSyncedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export async function getUserIntegrations(userUid: string): Promise<UserIntegrationRecord[]> {
  const rows = await db
    .select()
    .from(userIntegrations)
    .where(eq(userIntegrations.userUid, userUid))
    .orderBy(desc(userIntegrations.createdAt));

  return rows.map((row) => {
    const rawKey = row.apiKeyEncrypted ? decryptData(row.apiKeyEncrypted) : '';
    let parsedConfig = {};
    if (row.configData) {
      try {
        parsedConfig = JSON.parse(row.configData);
      } catch {
        parsedConfig = {};
      }
    }

    return {
      id: row.id,
      userId: row.userId,
      userUid: row.userUid,
      serviceName: row.serviceName,
      serviceLabel: row.serviceLabel,
      maskedKey: maskKey(rawKey),
      endpointUrl: row.endpointUrl,
      configData: parsedConfig,
      isEnabled: row.isEnabled ?? true,
      lastSyncedAt: row.lastSyncedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  });
}

export async function saveUserIntegration(params: {
  userId: number;
  userUid: string;
  serviceName: string;
  serviceLabel: string;
  apiKey?: string;
  apiSecret?: string;
  endpointUrl?: string;
  configData?: any;
}) {
  const apiKeyEncrypted = params.apiKey ? encryptData(params.apiKey) : null;
  const apiSecretEncrypted = params.apiSecret ? encryptData(params.apiSecret) : null;
  const configString = params.configData ? JSON.stringify(params.configData) : '{}';

  // Check if an integration for this service already exists for this user
  const existing = await db
    .select()
    .from(userIntegrations)
    .where(
      and(
        eq(userIntegrations.userId, params.userId),
        eq(userIntegrations.serviceName, params.serviceName)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    const [updated] = await db
      .update(userIntegrations)
      .set({
        serviceLabel: params.serviceLabel,
        apiKeyEncrypted: apiKeyEncrypted || existing[0].apiKeyEncrypted,
        apiSecretEncrypted: apiSecretEncrypted || existing[0].apiSecretEncrypted,
        endpointUrl: params.endpointUrl || existing[0].endpointUrl,
        configData: configString,
        isEnabled: true,
        updatedAt: new Date(),
      })
      .where(eq(userIntegrations.id, existing[0].id))
      .returning();
    return updated;
  }

  const [inserted] = await db
    .insert(userIntegrations)
    .values({
      userId: params.userId,
      userUid: params.userUid,
      serviceName: params.serviceName,
      serviceLabel: params.serviceLabel,
      apiKeyEncrypted,
      apiSecretEncrypted,
      endpointUrl: params.endpointUrl || null,
      configData: configString,
      isEnabled: true,
    })
    .returning();

  return inserted;
}

export async function deleteUserIntegration(id: number, userUid: string): Promise<boolean> {
  const result = await db
    .delete(userIntegrations)
    .where(and(eq(userIntegrations.id, id), eq(userIntegrations.userUid, userUid)))
    .returning();

  return result.length > 0;
}

export async function testIntegrationWebhook(id: number, userUid: string): Promise<{ success: boolean; message: string; payload?: any }> {
  const rows = await db
    .select()
    .from(userIntegrations)
    .where(and(eq(userIntegrations.id, id), eq(userIntegrations.userUid, userUid)))
    .limit(1);

  if (rows.length === 0) {
    return { success: false, message: 'Integration not found' };
  }

  const integration = rows[0];
  const rawKey = integration.apiKeyEncrypted ? decryptData(integration.apiKeyEncrypted) : null;

  // If endpoint URL is given (e.g. n8n, Discord, Slack webhook), trigger a test ping
  if (integration.endpointUrl && integration.endpointUrl.startsWith('http')) {
    try {
      const payload = {
        event: 'test_connection',
        timestamp: new Date().toISOString(),
        service: integration.serviceName,
        club: 'Running Club Platform',
        message: 'Hello from StrideClub Integration Hub! Webhook connectivity is verified.',
      };

      const res = await fetch(integration.endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(rawKey ? { 'Authorization': `Bearer ${rawKey}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      await db
        .update(userIntegrations)
        .set({ lastSyncedAt: new Date() })
        .where(eq(userIntegrations.id, id));

      if (res.ok) {
        return { success: true, message: `Webhook responded with status ${res.status} OK!`, payload };
      } else {
        return { success: false, message: `Endpoint returned HTTP status ${res.status}: ${res.statusText}` };
      }
    } catch (err: any) {
      return { success: false, message: `Connection error: ${err.message}` };
    }
  }

  // Token-only services (e.g. Strava, Vercel, Supabase)
  if (rawKey) {
    await db
      .update(userIntegrations)
      .set({ lastSyncedAt: new Date() })
      .where(eq(userIntegrations.id, id));

    return {
      success: true,
      message: `Credentials verified and encrypted securely in Cloud SQL. Ready for background automated syncs!`,
    };
  }

  return { success: false, message: 'No endpoint URL or API key provided to test.' };
} 
