// PATCH /api/ops/bookings/[id] — triage a service booking. Staff-only.
//
// Body (all optional, at least one):
//   { status?: 'requested'|'scheduled'|'completed'|'cancelled',
//     preSessionNotes?: string,   // ops-only prep, any time
//     outcome?: string,           // what happened (usually with completed)
//     nextStep?: string }
//
// Status changes are validated against BOOKING_TRANSITIONS (F4.6):
//   requested → scheduled | cancelled
//   scheduled → completed | cancelled
//   completed → (terminal)
//   cancelled → requested
// and stamp status_changed_by / status_changed_at. The member's own `notes`
// are never overwritten here.
//
// Side effects (best-effort, never fail the response):
//   scheduled / completed → member notification (if profile.notifBooking)
//                           + email "Your <service> is scheduled|complete"
//   completed + growth-call → qualify the pending referral (the A$50 credit
//                           unlocks on a *held* call, not a request)
//   completed             → HubSpot note with outcome + next step (F4.4)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import * as Sentry from '@sentry/nextjs';
import { getOpsUser } from '@/lib/auth/ops';
import { getMemberContact } from '@/lib/auth/member-contact';
import { getDb } from '@/lib/db';
import { serviceBookings } from '@/lib/db/schema';
import {
  GROWTH_CALL_SLUG,
  canTransition,
  getBookingById,
  type BookingStatus,
} from '@/lib/db/bookings';
import { createNotification } from '@/lib/db/notifications';
import { getProfile } from '@/lib/db/profile';
// TODO(merge): rename to qualifyReferralForCompletedGrowthCall once the
// referral branch (pending-credit rework) lands — same call site, new name.
import { qualifyReferral } from '@/lib/db/referrals';
import { DEFAULT_FROM, escapeHtml, sendEmail } from '@/lib/email/send';
import { syncNote } from '@/lib/hubspot/crm';

export const runtime = 'nodejs';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.thegrowthhub.com.au';

const BodySchema = z
  .object({
    status: z.enum(['requested', 'scheduled', 'completed', 'cancelled']).optional(),
    preSessionNotes: z.string().trim().max(4000).optional(),
    outcome: z.string().trim().max(4000).optional(),
    nextStep: z.string().trim().max(2000).optional(),
  })
  .refine(
    (b) =>
      b.status !== undefined ||
      b.preSessionNotes !== undefined ||
      b.outcome !== undefined ||
      b.nextStep !== undefined,
    { message: 'Nothing to update' },
  );

type Params = Promise<{ id: string }>;

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const opsUser = await getOpsUser();
  if (!opsUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid body' },
      { status: 400 },
    );
  }
  const body = parsed.data;

  const booking = await getBookingById(id);
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  const nextStatus: BookingStatus | null = body.status ?? null;
  if (nextStatus && !canTransition(booking.status, nextStatus)) {
    return NextResponse.json(
      { error: `Cannot move a ${booking.status.replace('_', ' ')} booking to ${nextStatus}` },
      { status: 409 },
    );
  }
  if (nextStatus === 'completed' && !(body.outcome ?? booking.outcome)) {
    return NextResponse.json(
      { error: 'Record an outcome before marking the session completed' },
      { status: 400 },
    );
  }

  const now = new Date();
  const patch: Partial<typeof serviceBookings.$inferInsert> = { updatedAt: now };
  if (body.preSessionNotes !== undefined) patch.preSessionNotes = body.preSessionNotes || null;
  if (body.outcome !== undefined) patch.outcome = body.outcome || null;
  if (body.nextStep !== undefined) patch.nextStep = body.nextStep || null;
  if (nextStatus) {
    patch.status = nextStatus;
    patch.statusChangedBy = opsUser.email;
    patch.statusChangedAt = now;
    if (nextStatus === 'scheduled') patch.scheduledAt = now;
    if (nextStatus === 'completed') patch.completedAt = now;
    // Re-opening clears the timestamps the earlier lifecycle stamped.
    if (nextStatus === 'requested') {
      patch.scheduledAt = null;
      patch.completedAt = null;
    }
  }

  try {
    await getDb().update(serviceBookings).set(patch).where(eq(serviceBookings.id, id));
  } catch (err) {
    console.error('[ops.bookings] update failed', err);
    Sentry.captureException(err, {
      tags: { area: 'ops.bookings', actor: opsUser.email },
      extra: { bookingId: id, status: nextStatus },
    });
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }

  // ── Side effects ─────────────────────────────────────────────────────────
  if (nextStatus === 'scheduled' || nextStatus === 'completed') {
    await notifyMember({
      userId: booking.userId,
      serviceTitle: booking.serviceTitle,
      status: nextStatus,
      nextStep: body.nextStep ?? booking.nextStep ?? null,
      actor: opsUser.email,
    });
  }

  if (nextStatus === 'completed' && booking.serviceSlug === GROWTH_CALL_SLUG) {
    try {
      const referral = await qualifyReferral(booking.userId);
      if (referral) {
        await Promise.all([
          createNotification({
            userId: referral.referrerUserId,
            kind: 'referral_signed_up',
            title: 'Your referral completed their Growth Call',
            body: 'A$50 service credit is on its way to both of you — we apply it on your next paid plan.',
            href: '/benefits',
          }),
          createNotification({
            userId: booking.userId,
            kind: 'referral_signed_up',
            title: 'A$50 credit unlocked',
            body: "Thanks for joining via a friend — your A$50 service credit applies to your next paid plan.",
            href: '/plan',
          }),
        ]);
      }
    } catch (e) {
      console.error('[ops.bookings] referral qualification failed', e);
      Sentry.captureException(e, {
        tags: { area: 'ops.bookings', phase: 'referral' },
        extra: { bookingId: id, userId: booking.userId },
      });
    }
  }

  if (nextStatus === 'completed') {
    // Fire-and-forget CRM note so the outcome is visible in HubSpot before
    // the next conversation (crm.ts handles its own errors + Sentry).
    const contact = await getMemberContact(booking.userId);
    if (contact) {
      void syncNote(
        contact.email,
        [
          `Completed ${booking.serviceTitle} (gh_booking_id=#${booking.id})`,
          `by=${opsUser.email}`,
          `outcome=${body.outcome ?? booking.outcome ?? '—'}`,
          `next_step=${body.nextStep ?? booking.nextStep ?? '—'}`,
        ].join('\n'),
      );
    }
  }

  return NextResponse.json({ ok: true, status: nextStatus ?? booking.status });
}

async function notifyMember(input: {
  userId: string;
  serviceTitle: string;
  status: 'scheduled' | 'completed';
  nextStep: string | null;
  actor: string;
}) {
  const scheduled = input.status === 'scheduled';
  try {
    const profile = await getProfile(input.userId);
    if (profile && !profile.notifBooking) return; // member opted out of booking updates

    const title = scheduled
      ? `Your ${input.serviceTitle} is scheduled`
      : `Your ${input.serviceTitle} is complete`;
    const bodyText = scheduled
      ? 'Your strategist has confirmed a time — check your email for the details and add it to your calendar.'
      : input.nextStep
        ? `Next step: ${input.nextStep}`
        : 'Thanks for your time. Reply in your inbox if anything is unclear.';

    await createNotification({
      userId: input.userId,
      kind: 'booking_status',
      title,
      body: bodyText,
      href: scheduled ? '/services' : '/messages',
    });

    const contact = await getMemberContact(input.userId);
    if (!contact) {
      console.warn('[ops.bookings] no member email resolved; status email skipped', input.userId);
      return;
    }
    const greet = contact.firstName ?? profile?.businessName ?? 'there';
    const result = await sendEmail({
      from: DEFAULT_FROM,
      to: contact.email,
      subject: title,
      text: `Hi ${greet},\n\n${bodyText}\n\n${APP_URL}/${scheduled ? 'services' : 'messages'}`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;line-height:1.6;max-width:600px;color:#1a2e2e;">
          <h2 style="font-family:Georgia,serif;color:#0D3F48;margin:0 0 12px;">Hi ${escapeHtml(greet)},</h2>
          <p style="margin:0 0 18px;color:#4A6A70;">${escapeHtml(bodyText)}</p>
          <a href="${APP_URL}/${scheduled ? 'services' : 'messages'}" style="display:inline-block;background:#0D3F48;color:#fff;text-decoration:none;padding:10px 22px;border-radius:8px;font-size:14px;font-weight:600;">
            ${scheduled ? 'View your engagements →' : 'Open your inbox →'}
          </a>
        </div>
      `,
    });
    if (!result.ok) console.error('[ops.bookings] status email not sent', result.error);
  } catch (e) {
    console.error('[ops.bookings] member notification failed', e);
    Sentry.captureException(e, {
      tags: { area: 'ops.bookings', phase: 'notify_member', actor: input.actor },
      extra: { userId: input.userId, status: input.status },
    });
  }
}
