// Server-side helpers for the messages thread.
//
// v1 model: one thread per user — every message is in or out of the
// "Growth Hub Team" catch-all. When we add Strategist assignment we'll
// expand to multi-thread without a breaking migration (just add threadId).

import 'server-only';
import { asc, eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { messages, type Message, type NewMessage } from '@/lib/db/schema';

const TEAM_AUTHOR_NAME = 'Growth Hub Team';

/** All messages in a user's thread, oldest first. */
export async function getThread(userId: string): Promise<Message[]> {
  return getDb()
    .select()
    .from(messages)
    .where(eq(messages.userId, userId))
    .orderBy(asc(messages.createdAt));
}

/** Send a message from the customer. */
export async function sendUserMessage(userId: string, body: string): Promise<Message> {
  const row: NewMessage = {
    userId,
    fromTeam: false,
    authorName: null,
    body,
  };
  const result = await getDb().insert(messages).values(row).returning();
  if (!result[0]) throw new Error('sendUserMessage: insert returned no row');
  return result[0];
}

/** Send a message from the Himayat team. `authorName` defaults to
 *  "Growth Hub Team" if not supplied. */
export async function sendTeamMessage(
  userId: string,
  body: string,
  authorName?: string,
): Promise<Message> {
  const row: NewMessage = {
    userId,
    fromTeam: true,
    authorName: authorName ?? TEAM_AUTHOR_NAME,
    body,
  };
  const result = await getDb().insert(messages).values(row).returning();
  if (!result[0]) throw new Error('sendTeamMessage: insert returned no row');
  return result[0];
}

/** How many of the team's messages has this user not opened yet?
 *  Only fromTeam messages count — the customer's own outgoing messages
 *  are trivially "read" by them. */
export async function getUnreadMessageCount(userId: string): Promise<number> {
  const { and, isNull } = await import('drizzle-orm');
  const rows = await getDb()
    .select({ id: messages.id })
    .from(messages)
    .where(
      and(
        eq(messages.userId, userId),
        eq(messages.fromTeam, true),
        isNull(messages.readAt),
      ),
    );
  return rows.length;
}

/** Mark every team message in the thread as read. Called when the user
 *  opens /messages. */
export async function markThreadRead(userId: string): Promise<void> {
  const { and, sql } = await import('drizzle-orm');
  await getDb()
    .update(messages)
    .set({ readAt: sql`now()` })
    .where(and(eq(messages.userId, userId), eq(messages.fromTeam, true)));
}

export { TEAM_AUTHOR_NAME };
