// Server-side helper for the /ops staff console.
//
// Auth model:
//   - Visitor must be signed in via WorkOS.
//   - Their email must be in OPS_EMAILS (comma-separated env var).
//
// Falls back to ['waheed@himayat.com.au'] in dev so the console works
// out of the box for the project owner.
//
// Returns the WorkOS user if allowed, null otherwise. Pages call
// `await requireOpsUser()` at the top and redirect if it returns null.

import { withAuth } from '@workos-inc/authkit-nextjs';

export interface OpsUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

const FALLBACK_ALLOWLIST = ['waheed@himayat.com.au'];

function parseAllowlist(): string[] {
  const raw = process.env.OPS_EMAILS;
  if (!raw) return FALLBACK_ALLOWLIST;
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function getOpsUser(): Promise<OpsUser | null> {
  const { user } = await withAuth().catch(() => ({ user: null }));
  if (!user || !user.email) return null;
  const allowlist = parseAllowlist();
  if (!allowlist.includes(user.email.toLowerCase())) return null;
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
  };
}

export function isOpsEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return parseAllowlist().includes(email.toLowerCase());
}
