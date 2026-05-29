import { cookies } from 'next/headers';
import { handleAuth } from '@workos-inc/authkit-nextjs';
import { Resend } from 'resend';
import * as Sentry from '@sentry/nextjs';
import { ensureUserRecordWithStatus } from '@/lib/auth/ensure-user-record';
import { createNotification } from '@/lib/db/notifications';
import { sendTeamMessage } from '@/lib/db/messages';
import { attributeReferral } from '@/lib/db/referrals';
import { getStrategistBySlug } from '@/lib/cms';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

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

        // Resolve the assigned strategist (auto-set by ensureUserRecordWithStatus
        // above). Falls back gracefully when the collection hasn't been seeded.
        const { profile } = await ensureUserRecordWithStatus({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        });
        const strategist = profile.assignedStrategistId
          ? await getStrategistBySlug(profile.assignedStrategistId).catch(() => null)
          : null;
        const strategistName = strategist?.name ?? 'The Growth Hub Team';

        await createNotification({
          userId: user.id,
          kind: 'welcome',
          title: "You're in — welcome to The Growth Hub",
          body: `Tell us about your business so ${strategistName} can match you to the right supports.`,
          href: '/profile',
        });
        const welcomeMessage = `Hi ${greet}, and welcome to The Growth Hub.\n\nI'm ${strategistName}, your Growth Strategist. You'll see me here whenever you need help — reply any time, I read everything myself.\n\nThree things worth doing this week:\n\n1. Finish your profile so I can tailor what I send you.\n2. Book your free 30-minute Growth Call when you're ready.\n3. Have a poke around the resource library.\n\nTalk soon,\n— ${strategistName}`;

        await sendTeamMessage(user.id, welcomeMessage, strategistName);

        // Best-effort welcome email. Mirrors the in-app team message so the
        // user sees the same intro whether they open the email or land in
        // /dashboard first. Failures are logged but never block sign-in.
        if (resend && user.email) {
          try {
            const strategistEmail = (strategist as { email?: string | null } | null)?.email ?? undefined;
            await resend.emails.send({
              from: `${strategistName} via Growth Hub <noreply@himayat.com.au>`,
              to: user.email,
              replyTo: strategistEmail,
              subject: 'Welcome to The Growth Hub',
              html: `
                <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;line-height:1.6;max-width:600px;color:#1a2e2e;">
                  <h2 style="font-family:Georgia,serif;color:#0D3F48;margin:0 0 12px;">Hi ${escapeHtml(greet)},</h2>
                  <p style="margin:0 0 12px;color:#4A6A70;">Welcome to The Growth Hub.</p>
                  <p style="margin:0 0 12px;color:#4A6A70;">
                    I'm ${escapeHtml(strategistName)}, your Growth Strategist. You'll see me here whenever you need help — reply any time, I read everything myself.
                  </p>
                  <p style="margin:18px 0 8px;color:#1a2e2e;font-weight:600;">Three things worth doing this week:</p>
                  <ol style="margin:0 0 18px;padding-left:22px;color:#4A6A70;">
                    <li style="margin:0 0 6px;">Finish your profile so I can tailor what I send you.</li>
                    <li style="margin:0 0 6px;">Book your free 30-minute Growth Call when you're ready.</li>
                    <li style="margin:0 0 6px;">Have a poke around the resource library.</li>
                  </ol>
                  <a href="https://app.thegrowthhub.com.au/dashboard"
                     style="display:inline-block;background:#0D3F48;color:#fff;text-decoration:none;padding:10px 22px;border-radius:8px;font-size:14px;font-weight:600;">
                    Open your dashboard →
                  </a>
                  <p style="margin:24px 0 4px;color:#4A6A70;">Talk soon,</p>
                  <p style="margin:0;color:#4A6A70;">— ${escapeHtml(strategistName)}</p>
                  <p style="margin:24px 0 0;font-size:12px;color:#999;">
                    You received this because you signed up at The Growth Hub.
                  </p>
                </div>
              `,
            });
          } catch (err) {
            console.error('[auth.callback] welcome email failed', err);
            Sentry.captureException(err, { tags: { area: 'auth.callback', phase: 'welcome_email' } });
          }
        }

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
