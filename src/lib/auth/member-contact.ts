// Resolve a member's email + name from their WorkOS user id.
//
// Free members have NO subscriptions row (absence of a row IS the Free
// state), so `subscriptions.email` alone would leave every Growth Call booker
// — the Free-tier benefit — unreachable from ops flows. WorkOS is the source
// of truth for identity, so fall back to the User Management API when the
// billing row is missing. Never throws; returns null when nothing resolves.

import 'server-only';
import { eq } from 'drizzle-orm';
import { getWorkOS } from '@workos-inc/authkit-nextjs';
import { getDb } from '@/lib/db';
import { subscriptions } from '@/lib/db/schema';

export interface MemberContact {
  email: string;
  firstName: string | null;
  lastName: string | null;
  /** Where the email came from — for logging / the ops UI. */
  source: 'subscriptions' | 'workos';
}

export async function getMemberContact(userId: string): Promise<MemberContact | null> {
  try {
    const rows = await getDb()
      .select({ email: subscriptions.email })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);
    if (rows[0]?.email) {
      return { email: rows[0].email, firstName: null, lastName: null, source: 'subscriptions' };
    }
  } catch (e) {
    console.error('[member-contact] subscriptions lookup failed', e);
  }

  try {
    const user = await getWorkOS().userManagement.getUser(userId);
    if (user?.email) {
      return {
        email: user.email,
        firstName: user.firstName ?? null,
        lastName: user.lastName ?? null,
        source: 'workos',
      };
    }
  } catch (e) {
    console.error('[member-contact] WorkOS lookup failed', e);
  }
  return null;
}
