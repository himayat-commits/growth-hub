// Thin wrapper around WorkOS's withAuth() that provides a test bypass for
// Playwright E2E tests. Only active when PLAYWRIGHT_TEST_TOKEN is set and
// VERCEL_ENV is not 'production'.
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
  // Test bypass: only reachable in non-production environments with the token set.
  if (process.env.PLAYWRIGHT_TEST_TOKEN && process.env.VERCEL_ENV !== 'production') {
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
