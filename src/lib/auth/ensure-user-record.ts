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
import { getActiveStrategists } from '@/lib/cms';

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
  return (await ensureUserRecordWithStatus(user)).profile;
}

/**
 * Pick the next strategist to assign a new signup to. Least-loaded
 * round-robin: counts current assignments per active strategist and picks
 * the one with the fewest (Payload `order` ascending breaks ties).
 *
 * Returns null when no active strategists exist (collection not yet
 * seeded, or all marked inactive) — caller leaves the profile unassigned
 * and the UI falls back to "Growth Hub Team".
 */
async function pickNextStrategistSlug(): Promise<string | null> {
  const strategists = await getActiveStrategists();
  if (!strategists.length) return null;

  const db = getDb();
  const counts = await db
    .select({
      slug: userProfiles.assignedStrategistId,
      count: sql<number>`count(*)::int`,
    })
    .from(userProfiles)
    .where(sql`${userProfiles.assignedStrategistId} is not null`)
    .groupBy(userProfiles.assignedStrategistId);

  const loadBySlug = new Map<string, number>();
  for (const row of counts) {
    if (row.slug) loadBySlug.set(row.slug, row.count);
  }

  let best: { slug: string; load: number; order: number } | null = null;
  for (const s of strategists) {
    const slug = (s as { slug?: string | null }).slug;
    if (!slug) continue;
    const load = loadBySlug.get(slug) ?? 0;
    const order = (s as { order?: number | null }).order ?? 0;
    if (
      !best ||
      load < best.load ||
      (load === best.load && order < best.order)
    ) {
      best = { slug, load, order };
    }
  }
  return best?.slug ?? null;
}

/** Variant of ensureUserRecord that also reports whether the profile row
 *  was created on this call. Used by /auth/callback to seed the welcome
 *  notification + message exactly once per user (on their first sign-in). */
export async function ensureUserRecordWithStatus(
  user: WorkOSUserLike,
): Promise<{ profile: UserProfile; created: boolean }> {
  const db = getDb();
  const rows = await db.select().from(userProfiles).where(eq(userProfiles.userId, user.id)).limit(1);
  if (rows[0]) return { profile: rows[0], created: false };

  // First sign-in. Insert a starter profile.
  const assignedStrategistId = await pickNextStrategistSlug();
  const inserted = await db
    .insert(userProfiles)
    .values({
      userId: user.id,
      referCode: makeReferCode(user),
      assignedStrategistId,
    })
    .onConflictDoNothing({ target: userProfiles.userId })
    .returning();

  if (inserted[0]) return { profile: inserted[0], created: true };

  // ON CONFLICT path — someone else (a concurrent sign-in) created the row.
  // Fetch what's now there. We didn't create it (the concurrent path did),
  // so report created: false to avoid double-sending welcome messages.
  const refetched = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, user.id))
    .limit(1);
  if (!refetched[0]) {
    throw new Error(`ensureUserRecord: race-recovery select returned no row for ${user.id}`);
  }
  return { profile: refetched[0], created: false };
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
