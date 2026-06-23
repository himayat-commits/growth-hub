// POST /api/test/auth
// Sets the __gh_test_uid session cookie that the with-auth.ts bypass reads.
// This endpoint exists ONLY for Playwright E2E tests and is permanently
// disabled in production (returns 404).
//
// The test token in the request body must match PLAYWRIGHT_TEST_TOKEN — so
// even though this route bypasses WorkOS, it can't be abused without knowing
// the secret configured in CI / local .env.local.

import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { TEST_USER_ID, TEST_COOKIE_NAME } from '@/lib/auth/with-auth';

export const runtime = 'nodejs';

// Constant-time string compare so the token can't be recovered byte-by-byte
// via response timing. (Defense-in-depth — the endpoint is already 404 in prod.)
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function POST(req: Request): Promise<NextResponse> {
  // Hard-fail in production or when the feature flag isn't configured.
  const expectedToken = process.env.PLAYWRIGHT_TEST_TOKEN;
  if (!expectedToken || process.env.VERCEL_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let body: { token?: string };
  try {
    body = (await req.json()) as { token?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (typeof body.token !== 'string' || !safeEqual(body.token, expectedToken)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true, userId: TEST_USER_ID });
  response.cookies.set(TEST_COOKIE_NAME, TEST_USER_ID, {
    httpOnly: true,
    secure: false,     // localhost tests don't need HTTPS
    sameSite: 'lax',
    path: '/',
    maxAge: 2 * 60 * 60, // 2 hours — enough for any test run
  });

  return response;
}
