// Thin wrapper around WorkOS's withAuth() that provides a test bypass for
// Playwright E2E tests. Only active when isTestAuthBypassEnabled() below says
// so (token set, not Vercel production, and never a production build outside
// Vercel).
//
// In normal operation this module is a transparent pass-through — every call
// delegates to the real WorkOS withAuth(). In the test environment, when the
// __gh_test_uid cookie is present (set by POST /api/test/auth), it returns a
// fake session so the wizard can run end-to-end without a live WorkOS token.

import { withAuth as _withAuth } from '@workos-inc/authkit-nextjs';
import { cookies } from 'next/headers';

// ─── Test fixtures ────────────────────────────────────────────────────────────

export const TEST_USER_ID = 'user_playwright_001';
export const TEST_COOKIE_NAME = '__gh_test_uid';

// ─── Bypass gate ─────────────────────────────────────────────────────────────

/**
 * Whether the Playwright auth bypass (this wrapper + POST /api/test/auth) may
 * be active. Both call sites MUST use this so they can never disagree.
 *
 * Where E2E is meant to run (playwright.config.ts, STAGING.md §3):
 *   • a local `next dev` server          → NODE_ENV=development, VERCEL_ENV unset
 *   • a Vercel Preview / staging deploy  → NODE_ENV=production,  VERCEL_ENV=preview
 * and never against production           → VERCEL_ENV=production.
 *
 * `next build` / `next start` always set NODE_ENV=production — on Vercel
 * Preview too — so a bare `NODE_ENV !== 'production'` check would break the
 * documented staging flow. Gating on VERCEL_ENV alone, however, left a hole:
 * any self-hosted or copied deployment without Vercel's env vars (VERCEL_ENV
 * unset) would enable the bypass on a production build as soon as the token
 * was set. Hence the combination:
 *
 *   token set  AND  VERCEL_ENV !== 'production'  AND  (VERCEL_ENV set OR NODE_ENV !== 'production')
 *
 * A production build outside Vercel can therefore never enable it, while
 * local dev and Vercel Preview keep working unchanged. Keep
 * PLAYWRIGHT_TEST_TOKEN out of the Vercel Production environment regardless.
 */
export function isTestAuthBypassEnabled(): boolean {
  if (!process.env.PLAYWRIGHT_TEST_TOKEN) return false;
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === 'production') return false;
  const onVercel = Boolean(vercelEnv);
  return onVercel || process.env.NODE_ENV !== 'production';
}

const TEST_USER = {
  id: TEST_USER_ID,
  email: 'playwright@test.himayat.com.au',
  firstName: 'Playwright',
  lastName: 'Test',
  profilePictureUrl: null,
  emailVerified: true,
  object: 'user' as const,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  lastSignInAt: '2024-01-01T00:00:00Z',
  externalId: null,
  metadata: {},
  locale: null,
};

// ─── Exported wrapper ─────────────────────────────────────────────────────────

type WithAuthReturn = Awaited<ReturnType<typeof _withAuth>>;

export async function withAuth(
  options?: Parameters<typeof _withAuth>[0],
): Promise<WithAuthReturn> {
  // Test bypass: see isTestAuthBypassEnabled() for the exact gate and why.
  if (isTestAuthBypassEnabled()) {
    const jar = await cookies();
    if (jar.get(TEST_COOKIE_NAME)?.value === TEST_USER_ID) {
      return {
        user: TEST_USER,
        accessToken: 'test-access-token',
        sessionId: 'test-session-001',
        organizationId: undefined,
        role: undefined,
        roles: [],
        permissions: [],
        entitlements: [],
        featureFlags: [],
        impersonator: undefined,
      } as unknown as WithAuthReturn;
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return _withAuth(options as any);
}
