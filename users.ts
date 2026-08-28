import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(
  uid: string,
  email: string,
  displayName?: string,
  photoUrl?: string | null
) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        displayName: displayName || email.split('@')[0],
        photoUrl: photoUrl || null,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(displayName ? { displayName } : {}),
          ...(photoUrl !== undefined ? { photoUrl } : {}),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query error in getOrCreateUser:', error);
    throw new Error('Failed to synchronize user account in database.', { cause: error });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const result = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error('Database query error in getUserByUid:', error);
    throw new Error('Failed to retrieve user profile.', { cause: error });
  }
}

export async function getAllUsers() {
  try {
    return await db.select().from(users);
  } catch (error) {
    console.error('Database query error in getAllUsers:', error);
    throw new Error('Failed to retrieve club members.', { cause: error });
  }
}
