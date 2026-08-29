import { db } from './index.ts';
import { systemConfig } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getSystemConfig(key: string, defaultValue = ''): Promise<string> {
  try {
    const res = await db.select().from(systemConfig).where(eq(systemConfig.key, key)).limit(1);
    return res[0]?.value ?? defaultValue;
  } catch (err) {
    console.error(`Error reading system config ${key}:`, err);
    return defaultValue;
  }
}

export async function setSystemConfig(key: string, value: string): Promise<string> {
  try {
    const res = await db
      .insert(systemConfig)
      .values({ key, value })
      .onConflictDoUpdate({
        target: systemConfig.key,
        set: { value, updatedAt: new Date() },
      })
      .returning();
    return res[0].value;
  } catch (err) {
    console.error(`Error writing system config ${key}:`, err);
    throw new Error('Failed to update system configuration', { cause: err });
  }
}

export async function isAutonomousModeEnabled(): Promise<boolean> {
  const val = await getSystemConfig('autonomous_mode_enabled', 'true');
  return val === 'true';
}

export async function setAutonomousModeEnabled(enabled: boolean): Promise<boolean> {
  await setSystemConfig('autonomous_mode_enabled', enabled ? 'true' : 'false');
  return enabled;
} 
