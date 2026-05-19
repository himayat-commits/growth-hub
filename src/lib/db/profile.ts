// Server-side data layer for the user_profiles table.
//
// Read/write helpers used by /(app)/profile, /(app)/dashboard, and the
// /api/profile endpoint. Every helper assumes a valid WorkOS userId is
// passed in — auth checks happen at the call site.

import 'server-only';
import { eq, sql } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { userProfiles, type UserProfile } from '@/lib/db/schema';
import { computeProfileCompletePct } from '@/lib/auth/ensure-user-record';

interface WorkOSUserLike {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}

/** Fetch the profile row for a user. Returns null if no row exists yet
 *  (which shouldn't happen post-Phase-1 since ensureUserRecord runs on
 *  every sign-in, but we tolerate it just in case). */
export async function getProfile(userId: string): Promise<UserProfile | null> {
  const rows = await getDb()
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

/** Fields the /api/profile PUT endpoint accepts. Everything else is
 *  read-only or system-managed. */
export interface ProfileUpdate {
  businessName?: string | null;
  businessDescription?: string | null;
  stage?: string | null;
  industry?: string | null;
  helpAreas?: string[];
  city?: string | null;
  phone?: string | null;
  preferredLanguage?: string;
  notifBooking?: boolean;
  notifLibrary?: boolean;
  notifEvents?: boolean;
  notifNewsletter?: boolean;
  notifReferrals?: boolean;
}

/** Apply a partial update and refresh the cached completeness pct in the
 *  same transaction. Returns the updated row. */
export async function updateProfile(
  user: WorkOSUserLike,
  patch: ProfileUpdate,
): Promise<UserProfile> {
  const db = getDb();
  // Merge what's being set with what's already in the row so the
  // completeness recompute sees the post-update state.
  const existing = await getProfile(user.id);
  const merged = { ...existing, ...patch };
  const pct = computeProfileCompletePct(user, {
    businessName: merged?.businessName ?? null,
    businessDescription: merged?.businessDescription ?? null,
    stage: merged?.stage ?? null,
    industry: merged?.industry ?? null,
    helpAreas: merged?.helpAreas ?? [],
  });

  const updated = await db
    .update(userProfiles)
    .set({
      ...patch,
      profileCompletePct: pct,
      updatedAt: sql`now()`,
    })
    .where(eq(userProfiles.userId, user.id))
    .returning();

  if (!updated[0]) {
    throw new Error(`updateProfile: no row exists for user ${user.id}`);
  }
  return updated[0];
}
