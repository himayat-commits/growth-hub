import { handleAuth } from '@workos-inc/authkit-nextjs';
import { ensureUserRecord } from '@/lib/auth/ensure-user-record';

// Exchanges the WorkOS authorization code for a session cookie.
// Configure this URL as a Redirect URI in dashboard.workos.com → Redirects.
//
// onSuccess fires once the cookie has been set and gives us the resolved
// WorkOS user. We use that moment to materialise our own `user_profiles`
// row + referral code (idempotent — safe to run on every sign-in, no-op
// after the first one).
export const GET = handleAuth({
  returnPathname: '/dashboard',
  onSuccess: async ({ user }) => {
    if (!user) return;
    try {
      await ensureUserRecord({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      });
    } catch (err) {
      // Don't block sign-in if the profile materialisation hits the DB
      // wrong — they'll just hit /dashboard without a profile row and the
      // next request will retry via the same ensureUserRecord path
      // (called lazily from /api/profile / /(app)/profile).
      console.error('[auth.callback] ensureUserRecord failed', err);
    }
  },
});
