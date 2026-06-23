// Authorization scoping for the /ops inbox.
//
// The inbox LIST view (ops/inbox/page.tsx) already scopes a strategist to
// their assigned members. These helpers let the THREAD view and the reply
// API enforce the same rule, closing an IDOR where any ops user could read
// or post into any member's thread by editing the URL.
//
// Kept in its own module (not lib/auth/ops.ts) because ops.ts is imported by
// the edge middleware (proxy.ts) and must stay free of the Payload/CMS import
// that getActiveStrategists pulls in.

import 'server-only';
import { eq } from 'drizzle-orm';
import { getActiveStrategists } from '@/lib/cms';
import { getDb } from '@/lib/db';
import { userProfiles } from '@/lib/db/schema';
import type { OpsUser } from '@/lib/auth/ops';

/**
 * Resolve the active strategist slug for an ops user, matched by email.
 * Returns null when the ops user has no strategist record — i.e. an
 * admin/owner/unrecognised ops account, which retains full access (same
 * contract as the inbox list view).
 */
export async function getOpsStrategistSlug(email: string): Promise<string | null> {
  const strategists = await getActiveStrategists().catch(() => []);
  const me = strategists.find(
    (s) => (s as { email?: string | null }).email?.toLowerCase() === email.toLowerCase(),
  );
  return (me as { slug?: string | null } | undefined)?.slug ?? null;
}

/**
 * Whether this ops user may view/reply to the given member's thread.
 * Strategists are scoped to members assigned to them; ops users with no
 * strategist slug (admins/owners) see everyone.
 */
export async function canAccessMemberThread(
  opsUser: OpsUser,
  memberUserId: string,
): Promise<boolean> {
  const mySlug = await getOpsStrategistSlug(opsUser.email);
  if (!mySlug) return true; // admin / owner / unrecognised → full access

  const rows = await getDb()
    .select({ assignedStrategistId: userProfiles.assignedStrategistId })
    .from(userProfiles)
    .where(eq(userProfiles.userId, memberUserId))
    .limit(1);

  return rows[0]?.assignedStrategistId === mySlug;
}
