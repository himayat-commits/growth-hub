import { cookies } from 'next/headers';
import { handleAuth } from '@workos-inc/authkit-nextjs';
import * as Sentry from '@sentry/nextjs';
import { ensureUserRecordWithStatus } from '@/lib/auth/ensure-user-record';
import { createNotification } from '@/lib/db/notifications';
import { sendTeamMessage } from '@/lib/db/messages';
import { attributeReferral } from '@/lib/db/referrals';

// Exchanges the WorkOS authorization code for a session cookie.
// Configure this URL as a Redirect URI in dashboard.workos.com → Redirects.
//
// onSuccess fires once the cookie has been set and gives us the resolved
// WorkOS user. We use that moment to materialise our own `user_profiles`
// row + referral code, and on first-ever sign-in to seed the welcome
// message + welcome notification.

export const GET = handleAuth({
  returnPathname: '/dashboard',
  onSuccess: async ({ user }) => {
    if (!user) return;
    try {
      const { created } = await ensureUserRecordWithStatus({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      });

      if (created) {
        // First sign-in: seed the welcome content. Both calls swallow
        // their own errors so a flaky DB doesn't block sign-in.
        const greet = user.firstName ?? 'there';
        await createNotification({
          userId: user.id,
          kind: 'welcome',
          title: 'Welcome to The Growth Hub',
          body: 'Your account is live. Complete your profile to unlock tailored recommendations.',
          href: '/profile',
        });
        await sendTeamMessage(
          user.id,
          `Salaam ${greet}, and welcome to The Growth Hub.\n\nWe're a small team and we read every message ourselves. To make the most of your first month:\n\n1. Finish your profile so we can match you to the right Strategist.\n2. Book your free 30-minute Growth Call when you're ready — no prep needed.\n3. Have a look around the resource library if you want a head start.\n\nReply here any time. We're cheering for you.\n\n— The Growth Hub Team`,
        );

        // Referral attribution. Reads the gh_ref cookie set by middleware
        // when the visitor first landed with ?ref=GROW-…
        try {
          const jar = await cookies();
          const refCode = jar.get('gh_ref')?.value;
          if (refCode) {
            const referral = await attributeReferral({
              referredUserId: user.id,
              referCode: refCode,
            });
            // Notify the referrer so they can see the new lead immediately.
            if (referral) {
              await createNotification({
                userId: referral.referrerUserId,
                kind: 'referral_signed_up',
                title: `${user.firstName ?? 'A new member'} joined via your link`,
                body: 'When they book their first Growth Call you both get A$50 in service credit.',
                href: '/benefits',
              });
            }
            // Clear the cookie either way (consumed or invalid).
            jar.delete('gh_ref');
          }
        } catch (err) {
          console.error('[auth.callback] referral attribution failed', err);
          Sentry.captureException(err, { tags: { area: 'auth.callback', phase: 'referral' } });
        }
      }
    } catch (err) {
      // Don't block sign-in if the seeding fails — they'll just hit
      // /dashboard without the welcome content and the next request will
      // retry profile materialisation via the same ensureUserRecord path.
      console.error('[auth.callback] welcome-seed failed', err);
      Sentry.captureException(err, { tags: { area: 'auth.callback', phase: 'welcome_seed' } });
    }
  },
});
