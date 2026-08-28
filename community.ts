import { desc, eq, sql } from 'drizzle-orm';
import { db } from './index.ts';
import { communityPosts, users } from './schema.ts';

export interface CommunityPostRecord {
  id: number;
  userId: number;
  userUid: string;
  authorName: string;
  authorPhoto: string | null;
  title: string;
  content: string;
  category: string;
  likesCount: number;
  createdAt: Date | null;
}

export async function getCommunityPosts(): Promise<CommunityPostRecord[]> {
  const posts = await db
    .select({
      id: communityPosts.id,
      userId: communityPosts.userId,
      userUid: communityPosts.userUid,
      authorName: communityPosts.authorName,
      authorPhoto: communityPosts.authorPhoto,
      title: communityPosts.title,
      content: communityPosts.content,
      category: communityPosts.category,
      likesCount: communityPosts.likesCount,
      createdAt: communityPosts.createdAt,
    })
    .from(communityPosts)
    .orderBy(desc(communityPosts.createdAt))
    .limit(50);

  // If table is empty, seed a few inspiring running community discussions
  if (posts.length === 0) {
    const seedPosts = [
      {
        userId: 1,
        userUid: 'club-founder',
        authorName: 'Coach Marcus',
        authorPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        title: 'Weekly Long Run Route: Coastal Trail Loop (15km)',
        content: 'This Saturday we meet at 6:30 AM at Bayfront Park. Hydration stations every 4km. Pace groups: 5:00, 5:45, and 6:30 min/km. Bring a handheld bottle!',
        category: 'Route',
        likesCount: 18,
      },
      {
        userId: 1,
        userUid: 'club-founder',
        authorName: 'Dr. Elena Rostova',
        authorPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
        title: 'Zone 2 Base Building: Why Slower Makes You Faster',
        content: '80% of your weekly volume should be at a conversational effort where you can speak in complete sentences. Your mitochondrial density and fat oxidation improve drastically without accumulating systemic fatigue.',
        category: 'Training Tip',
        likesCount: 34,
      },
      {
        userId: 1,
        userUid: 'club-founder',
        authorName: 'Alex Thorne',
        authorPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        title: 'Sub-3 Marathon Race Report & Nutrition Strategy',
        content: 'Fueling every 25 minutes with 30g maltodextrin/fructose gels and 200mg sodium capsules kept cramping away till the finish line. Final time: 2:54:12!',
        category: 'Race Report',
        likesCount: 42,
      },
    ];

    try {
      // Find or create dummy user
      const existingUser = await db.select().from(users).limit(1);
      if (existingUser.length > 0) {
        for (const p of seedPosts) {
          await db.insert(communityPosts).values({
            ...p,
            userId: existingUser[0].id,
            userUid: existingUser[0].uid,
            category: p.category || 'Discussion',
            likesCount: p.likesCount || 0,
          });
        }
        return await db.select().from(communityPosts).orderBy(desc(communityPosts.createdAt));
      }
    } catch {
      // ignore
    }
  }

  return posts.map((p) => ({
    ...p,
    category: p.category || 'Discussion',
    likesCount: p.likesCount || 0,
  }));
}

export async function createCommunityPost(params: {
  userId: number;
  userUid: string;
  authorName: string;
  authorPhoto?: string | null;
  title: string;
  content: string;
  category?: string;
}) {
  const [newPost] = await db
    .insert(communityPosts)
    .values({
      userId: params.userId,
      userUid: params.userUid,
      authorName: params.authorName,
      authorPhoto: params.authorPhoto || null,
      title: params.title.trim(),
      content: params.content.trim(),
      category: params.category || 'Discussion',
      likesCount: 0,
    })
    .returning();

  return newPost;
}

export async function likeCommunityPost(postId: number) {
  const [updated] = await db
    .update(communityPosts)
    .set({
      likesCount: sql`${communityPosts.likesCount} + 1`,
    })
    .where(eq(communityPosts.id, postId))
    .returning();

  return updated;
}
