import { db } from './index.ts';
import { clubEvents, eventRsvps, users } from './schema.ts';
import { eq, desc, and, sql } from 'drizzle-orm';

export interface CreateEventInput {
  title: string;
  description: string;
  location: string;
  eventDate: string; // YYYY-MM-DD
  eventTime: string; // e.g. "07:00 AM"
  distanceKm?: number;
  paceCategory?: string;
  createdByUid: string;
}

export async function createClubEvent(input: CreateEventInput) {
  try {
    const inserted = await db
      .insert(clubEvents)
      .values({
        title: input.title,
        description: input.description,
        location: input.location,
        eventDate: input.eventDate,
        eventTime: input.eventTime,
        distanceKm: input.distanceKm ?? 10,
        paceCategory: input.paceCategory || 'All Paces (4:30 - 6:30 min/km)',
        createdByUid: input.createdByUid,
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error('Error creating club event:', error);
    throw new Error('Failed to create event', { cause: error });
  }
}

export async function getAllEvents(currentUserUid?: string) {
  try {
    const eventsList = await db
      .select({
        id: clubEvents.id,
        title: clubEvents.title,
        description: clubEvents.description,
        location: clubEvents.location,
        eventDate: clubEvents.eventDate,
        eventTime: clubEvents.eventTime,
        distanceKm: clubEvents.distanceKm,
        paceCategory: clubEvents.paceCategory,
        reminderSent: clubEvents.reminderSent,
        createdByUid: clubEvents.createdByUid,
        createdAt: clubEvents.createdAt,
        rsvpsCount: sql<number>`COUNT(${eventRsvps.id})`,
      })
      .from(clubEvents)
      .leftJoin(eventRsvps, eq(clubEvents.id, eventRsvps.eventId))
      .groupBy(clubEvents.id)
      .orderBy(clubEvents.eventDate, clubEvents.eventTime);

    let userRsvpsSet = new Set<number>();
    if (currentUserUid) {
      const userRsvps = await db
        .select({ eventId: eventRsvps.eventId })
        .from(eventRsvps)
        .where(eq(eventRsvps.userUid, currentUserUid));
      userRsvpsSet = new Set(userRsvps.map((r) => r.eventId));
    }

    return eventsList.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      location: e.location,
      eventDate: e.eventDate,
      eventTime: e.eventTime,
      distanceKm: Number(e.distanceKm),
      paceCategory: e.paceCategory || 'All Paces',
      reminderSent: Boolean(e.reminderSent),
      createdByUid: e.createdByUid,
      createdAt: e.createdAt ? e.createdAt.toISOString() : new Date().toISOString(),
      rsvpsCount: Number(e.rsvpsCount || 0),
      isRsvpCurrentUser: userRsvpsSet.has(e.id),
    }));
  } catch (error) {
    console.error('Error fetching club events:', error);
    return [];
  }
}

export async function toggleEventRsvp(eventId: number, userId: number, userUid: string, userName: string, userPhoto?: string | null) {
  try {
    // Check if already RSVP'd
    const existing = await db
      .select()
      .from(eventRsvps)
      .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userUid, userUid)))
      .limit(1);

    if (existing.length > 0) {
      await db
        .delete(eventRsvps)
        .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userUid, userUid)));
      return { rsvp: false };
    } else {
      await db.insert(eventRsvps).values({
        eventId,
        userId,
        userUid,
        userName,
        userPhoto: userPhoto || null,
      });
      return { rsvp: true };
    }
  } catch (error) {
    console.error('Error toggling RSVP:', error);
    throw new Error('Failed to update event RSVP', { cause: error });
  }
}

export async function getEventRsvps(eventId: number) {
  try {
    return await db
      .select()
      .from(eventRsvps)
      .where(eq(eventRsvps.eventId, eventId))
      .orderBy(desc(eventRsvps.createdAt));
  } catch (error) {
    console.error('Error fetching event RSVPs:', error);
    return [];
  }
}

export async function markEventReminderSent(eventId: number) {
  try {
    await db
      .update(clubEvents)
      .set({ reminderSent: true })
      .where(eq(clubEvents.id, eventId));
  } catch (error) {
    console.error('Error marking event reminder sent:', error);
  }
}

export async function seedDefaultEventsIfEmpty() {
  try {
    const countRes = await db.select({ count: sql<number>`COUNT(*)` }).from(clubEvents);
    const count = Number(countRes[0]?.count || 0);
    if (count === 0) {
      // Seed upcoming Sunday 7am group run
      const nextSunday = new Date();
      nextSunday.setDate(nextSunday.getDate() + ((7 - nextSunday.getDay()) % 7 || 7));
      const nextSundayStr = nextSunday.toISOString().split('T')[0];

      const nextTuesday = new Date();
      nextTuesday.setDate(nextTuesday.getDate() + ((2 + 7 - nextTuesday.getDay()) % 7 || 7));
      const nextTuesdayStr = nextTuesday.toISOString().split('T')[0];

      await db.insert(clubEvents).values([
        {
          title: 'Sunday Sunrise 10K Long Run & Coffee',
          description: 'Official club weekly long run. Paced groups from 4:45/km to 6:30/km. Hydration stop at 5km and artisan coffee post-run at Galle Face / Marina.',
          location: 'Marina Promenade & Coastal Path (Main Clubhouse)',
          eventDate: nextSundayStr,
          eventTime: '07:00 AM',
          distanceKm: 10,
          paceCategory: 'All Paces (4:30 - 6:30 min/km)',
          reminderSent: false,
          createdByUid: 'club_admin_uid',
        },
        {
          title: 'Tuesday Track Speed Repeats (8x400m)',
          description: 'Speedwork session with structured warm-up, dynamic drills, 8x400m at 5K race pace with 90s recovery jog, and guided cool down.',
          location: 'National Athletics Stadium Track (Lane 1-4)',
          eventDate: nextTuesdayStr,
          eventTime: '06:00 PM',
          distanceKm: 7.5,
          paceCategory: 'Interval Pace (3:45 - 5:00 min/km)',
          reminderSent: false,
          createdByUid: 'club_admin_uid',
        },
      ]);
    }
  } catch (err) {
    console.error('Error seeding default events:', err);
  }
}
