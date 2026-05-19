// Idempotent helper that makes sure a user has the supporting rows we need
// once they're signed in. Called from /auth/callback after WorkOS completes
// the OAuth dance.
//
// What it does:
//   1. Ensures there's a `user_profiles` row keyed by the WorkOS user id.
//   2. Generates a unique referral code (GROW-{LASTNAME}-{YYYY}) on first
//      insert. Collisions are exceedingly rare given the timestamp suffix,
//      but the column is UNIQUE so a retry will fix any clash.
//
// What it deliberately does NOT do:
//   - Create a `subscriptions` row. The absence of a row IS the Free Member
//     state — that's the model we're committing to so we don't have to
//     maintain a "free placeholder" row that gets garbage-collected on upgrade.
//   - Touch WorkOS. The WorkOS user object is the source of truth for
//     name/email/phone. We just mirror onto our own data.

import 'server-only';
import { eq, sql } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { userProfiles, type UserProfile } from '@/lib/db/schema';

interface WorkOSUserLike {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}

/**
 * Build a referral code like GROW-AQIQ-2026. Falls back to the userId
 * suffix when no last name is on the WorkOS profile.
 */
function makeReferCode(user: WorkOSUserLike): string {
  const slug =
    (user.lastName || user.firstName || user.email?.split('@')[0] || user.id)
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '')
      .slice(0, 8) || 'MEMBER';
  return `GROW-${slug}-${new Date().getFullYear()}`;
}

export async function ensureUserRecord(user: WorkOSUserLike): Promise<UserProfile> {
  const db = getDb();
  const rows = await db.select().from(userProfiles).where(eq(userProfiles.userId, user.id)).limit(1);
  if (rows[0]) return rows[0];

  // First sign-in. Insert a starter profile.
  const inserted = await db
    .insert(userProfiles)
    .values({
      userId: user.id,
      referCode: makeReferCode(user),
    })
    .onConflictDoNothing({ target: userProfiles.userId })
    .returning();

  if (inserted[0]) return inserted[0];

  // ON CONFLICT path — someone else (a concurrent sign-in) created the row.
  // Fetch what's now there.
  const refetched = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, user.id))
    .limit(1);
  if (!refetched[0]) {
    throw new Error(`ensureUserRecord: race-recovery select returned no row for ${user.id}`);
  }
  return refetched[0];
}

/**
 * Compute profile completeness as a 0-100 integer.
 *
 * Weights are equal across six signals: firstName/lastName (from WorkOS) and
 * five UserProfile columns. Stored on the row so the dashboard can read it
 * without joining + recomputing on every request.
 */
export function computeProfileCompletePct(
  user: WorkOSUserLike,
  profile: Pick<
    UserProfile,
    'businessName' | 'businessDescription' | 'stage' | 'industry' | 'helpAreas'
  >,
): number {
  const signals = [
    !!(user.firstName || user.lastName),
    !!profile.businessName,
    !!profile.businessDescription,
    !!profile.stage,
    !!profile.industry,
    (profile.helpAreas?.length ?? 0) > 0,
  ];
  const done = signals.filter(Boolean).length;
  return Math.round((done / signals.length) * 100);
}

/**
 * Recompute and persist the cached profileCompletePct. Call this from the
 * /api/profile PUT handler after persisting a change. Cheap — one UPDATE
 * statement, no extra SELECT.
 */
export async function refreshProfileCompletePct(userId: string, user: WorkOSUserLike) {
  const db = getDb();
  const rows = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  const row = rows[0];
  if (!row) return;
  const pct = computeProfileCompletePct(user, row);
  await db
    .update(userProfiles)
    .set({ profileCompletePct: pct, updatedAt: sql`now()` })
    .where(eq(userProfiles.userId, userId));
}
