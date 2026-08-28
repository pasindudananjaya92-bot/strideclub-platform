import { db } from './index.ts';
import { notifications } from './schema.ts';
import { eq, desc, and } from 'drizzle-orm';

export interface CreateNotificationInput {
  userId: number;
  userUid: string;
  title: string;
  message: string;
  type: 'ai_coach_plan' | 'moderation_warning' | 'event_reminder' | 'data_sync' | 'system';
  data?: any;
}

export async function createNotification(input: CreateNotificationInput) {
  try {
    const inserted = await db
      .insert(notifications)
      .values({
        userId: input.userId,
        userUid: input.userUid,
        title: input.title,
        message: input.message,
        type: input.type,
        data: input.data ? JSON.stringify(input.data) : null,
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error('Error creating notification in DB:', error);
    throw new Error('Failed to create notification', { cause: error });
  }
}

export async function getUserNotifications(userUid: string) {
  try {
    const list = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userUid, userUid))
      .orderBy(desc(notifications.createdAt))
      .limit(30);

    return list.map((n) => ({
      ...n,
      data: n.data ? JSON.parse(n.data) : null,
    }));
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: number, userUid: string) {
  try {
    const updated = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userUid, userUid)))
      .returning();

    return updated[0] || null;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw new Error('Failed to update notification', { cause: error });
  }
}

export async function markAllNotificationsAsRead(userUid: string) {
  try {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userUid, userUid));
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
}
