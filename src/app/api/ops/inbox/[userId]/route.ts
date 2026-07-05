// POST /api/ops/inbox/[userId]
// Send a team reply in a member's thread. Staff-only via getOpsUser.
//
// Body: { body: string }
//
// On success:
//   1. Writes a messages row (fromTeam=true, authorName = strategist name)
//   2. Creates a message_received notification for the member
//   3. Sends a Resend email to the member (best-effort, never blocks)

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import * as Sentry from '@sentry/nextjs';
import { eq } from 'drizzle-orm';
import { getOpsUser } from '@/lib/auth/ops';
import { canAccessMemberThread } from '@/lib/auth/ops-inbox';
import { getDb } from '@/lib/db';
import { userProfiles, subscriptions } from '@/lib/db/schema';
import { sendTeamMessage } from '@/lib/db/messages';
import { createNotification } from '@/lib/db/notifications';
import { getActiveStrategists } from '@/lib/cms';

export const runtime = 'nodejs';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

type Params = Promise<{ userId: string }>;

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const opsUser = await getOpsUser();
  if (!opsUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { userId } = await params;
  if (!userId) return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });

  // Strategists may only reply in threads for members assigned to them.
  if (!(await canAccessMemberThread(opsUser, userId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { body?: string };
  try {
    body = (await req.json()) as { body?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const text = (body.body ?? '').trim();
  if (!text) return NextResponse.json({ error: 'Message body required' }, { status: 400 });

  // Resolve the author name: find the strategist whose email matches this ops user.
  // Falls back to ops user email (still gets a valid name in the thread).
  const strategists = await getActiveStrategists().catch(() => []);
  const strategist = strategists.find(
    (s) => (s as { email?: string | null }).email?.toLowerCase() === opsUser.email.toLowerCase(),
  );
  const authorName =
    (strategist as { name?: string | null } | undefined)?.name ?? opsUser.email;

  try {
    // 1. Write the message row.
    await sendTeamMessage(userId, text, authorName);

    // 2. In-app notification.
    await createNotification({
      userId,
      kind: 'message_received',
      title: `New message from ${authorName}`,
      body: text.slice(0, 120) + (text.length > 120 ? '…' : ''),
      href: '/messages',
    }).catch((e) => {
      console.error('[ops.inbox] notification failed', e);
    });

    // 3. Best-effort Resend email to the member.
    if (resend) {
      // Look up member email from subscriptions table.
      const db = getDb();
      const [profile, sub] = await Promise.all([
        db.select({ businessName: userProfiles.businessName })
          .from(userProfiles)
          .where(eq(userProfiles.userId, userId))
          .limit(1),
        db.select({ email: subscriptions.email })
          .from(subscriptions)
          .where(eq(subscriptions.userId, userId))
          .limit(1),
      ]);
      const memberEmail = sub[0]?.email;
      const memberName = profile[0]?.businessName ?? 'there';

      if (memberEmail) {
        resend.emails.send({
          from: `${authorName} via Growth Hub <noreply@himayat.com.au>`,
          to: memberEmail,
          replyTo: (strategist as { email?: string | null } | undefined)?.email ?? undefined,
          subject: `New message from ${authorName} — Growth Hub`,
          html: `
            <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;line-height:1.6;max-width:600px;color:#1a2e2e;">
              <h2 style="font-family:Georgia,serif;color:#0D3F48;margin:0 0 12px;">Hi ${escapeHtml(memberName)},</h2>
              <p style="margin:0 0 18px;color:#4A6A70;">${authorName} sent you a message in Growth Hub:</p>
              <div style="background:#f5f3ef;border-left:3px solid #0D3F48;padding:16px 20px;border-radius:0 8px 8px 0;margin:0 0 20px;white-space:pre-wrap;font-size:15px;">
                ${escapeHtml(text)}
              </div>
              <a href="https://app.thegrowthhub.com.au/messages"
                 style="display:inline-block;background:#0D3F48;color:#fff;text-decoration:none;padding:10px 22px;border-radius:8px;font-size:14px;font-weight:600;">
                Reply in Growth Hub →
              </a>
              <p style="margin:24px 0 0;font-size:12px;color:#999;">
                You received this because you're a Growth Hub member.
                <a href="https://app.thegrowthhub.com.au/profile" style="color:#999;">Manage notification settings</a>
              </p>
            </div>
          `,
        }).catch((e) => {
          console.error('[ops.inbox] resend failed', e);
        });
      }
    }

    return NextResponse.json({ ok: true, authorName });
  } catch (err) {
    console.error('[ops.inbox] reply failed', err);
    Sentry.captureException(err, {
      tags: { area: 'ops.inbox', actor: opsUser.email },
      extra: { userId },
    });
    return NextResponse.json({ error: 'Reply failed' }, { status: 500 });
  }
}
