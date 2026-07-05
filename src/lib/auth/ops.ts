// Server-side helper for the /ops staff console.
//
// Auth model:
//   - Visitor must be signed in via WorkOS.
//   - Their email must be in OPS_EMAILS (comma-separated env var).
//
// Roles: each OPS_EMAILS entry is either "email" or "email:role" where role is
// `admin` or `support`. A bare email (no role) is treated as `admin`, so any
// pre-existing allowlist keeps full access — roles are opt-in. `support` can
// view everything and triage bookings / reply in the inbox, but NOT approve
// referral credits (money) or reassign strategists — those require `admin`.
//
//   OPS_EMAILS="waheed@himayat.com.au:admin, support@himayat.com.au:support"
//
// Falls back to ['waheed@himayat.com.au'] (admin) in dev so the console works
// out of the box for the project owner.
//
// Returns the WorkOS user (with role) if allowed, null otherwise. Pages call
// `await getOpsUser()` at the top and redirect if it returns null.

// The local wrapper, not @workos-inc/authkit-nextjs directly: identical in
// production, but it honours the env-gated Playwright test session so the
// ops console is reachable in E2E runs (the test user still needs to be on
// OPS_EMAILS — the allowlist gate below is unchanged).
import { withAuth } from '@/lib/auth/with-auth';

export type OpsRole = 'admin' | 'support';

export interface OpsUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: OpsRole;
}

const FALLBACK_ALLOWLIST = ['waheed@himayat.com.au'];

/** Parse OPS_EMAILS into an email→role map. Entries are "email" or
 *  "email:role"; a bare email is admin (back-compat), an unrecognised role
 *  defaults to admin so a typo never silently downgrades someone. */
function parseAllowlist(): Map<string, OpsRole> {
  const raw = process.env.OPS_EMAILS;
  const entries = raw
    ? raw.split(',').map((s) => s.trim()).filter(Boolean)
    : FALLBACK_ALLOWLIST;
  const map = new Map<string, OpsRole>();
  for (const entry of entries) {
    const [emailPart, rolePart] = entry.split(':');
    const email = emailPart?.trim().toLowerCase();
    if (!email) continue;
    const role: OpsRole = rolePart?.trim().toLowerCase() === 'support' ? 'support' : 'admin';
    map.set(email, role);
  }
  return map;
}

export async function getOpsUser(): Promise<OpsUser | null> {
  const { user } = await withAuth().catch(() => ({ user: null }));
  if (!user || !user.email) return null;
  const role = parseAllowlist().get(user.email.toLowerCase());
  if (!role) return null;
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    role,
  };
}

export function isOpsEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return parseAllowlist().has(email.toLowerCase());
}
