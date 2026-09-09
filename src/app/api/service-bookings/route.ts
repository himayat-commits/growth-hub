// POST /api/service-bookings — customer requests a service.
// GET  /api/service-bookings — list the signed-in user's bookings.
//
// On successful create:
//   1. Insert a `requested` row (need, preferred slots, notes, routed strategist)
//   2. Drop an in-app notification on the customer's feed
//   3. Email ops (CC the assigned strategist) with a link to the member 360
//   4. Email the member a confirmation
// Steps 2–4 are best-effort — they never block a successful response.
//
// Referral qualification does NOT happen here any more: a referral becomes
// qualified when ops marks the Growth Call *completed* (PATCH
// /api/ops/bookings/[id]), so a no-show can't unlock A$50 for both sides.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, sql } from 'drizzle-orm';
import { withAuth } from '@workos-inc/authkit-nextjs';
import {
  GROWTH_CALL_SLUG,
  createBooking,
  getUserBookings,
  hasEverBookedGrowthCall,
  hasOpenBookingFor,
} from '@/lib/db/bookings';
import { createNotification } from '@/lib/db/notifications';
<<<<<<< HEAD
import { getServiceBySlug } from '@/lib/cms';
=======
import { getProfile } from '@/lib/db/profile';
import { getDb } from '@/lib/db';
import { userProfiles } from '@/lib/db/schema';
import { pickNextStrategistSlug } from '@/lib/auth/ensure-user-record';
import { getServiceBySlug, getStrategistBySlug } from '@/lib/cms';
>>>>>>> 02e0828 (feat(advisory): triage intake, adviser 360, status workflow, specialties routing (F4.1–F4.3, F4.5–F4.10))
import { rateLimit, tooManyRequests } from '@/lib/rate-limit';
import { DEFAULT_FROM, OPS_EMAIL, escapeHtml, sendEmail } from '@/lib/email/send';
import {
  MAX_PREFERRED_SLOTS,
  NEEDS,
  SLOT_WINDOWS,
  formatSlots,
  needFromHelpAreas,
  needLabel,
} from '@/lib/advisory/needs';

export const runtime = 'nodejs';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.thegrowthhub.com.au';

const BodySchema = z.object({
  serviceSlug: z.string().trim().min(1).max(80),
  need: z.enum(NEEDS),
  preferredSlots: z
    .array(
      z.object({
        day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'day must be YYYY-MM-DD'),
        window: z.enum(SLOT_WINDOWS),
      }),
    )
    .max(MAX_PREFERRED_SLOTS)
    .default([]),
  notes: z.string().trim().max(4000).optional(),
  // Legacy free-text availability (pre-triage clients). Kept so an old tab
  // doesn't 400; the form no longer sends it.
  datePreference: z.string().trim().max(200).optional(),
});

export async function GET() {
  const { user } = await withAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const bookings = await getUserBookings(user.id);
  return NextResponse.json({ bookings });
}

export async function POST(req: NextRequest) {
  const { user } = await withAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Each request emails ops; the duplicate guard below only blocks the same
  // slug while a booking is open, so cap the rate per member as well.
  const rl = rateLimit(`booking:${user.id}`, 5, 10 * 60_000);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first ? `${first.path.join('.') || 'body'}: ${first.message}` : 'Invalid body' },
      { status: 400 },
    );
  }
  const body = parsed.data;
  const slug = body.serviceSlug;
  const notes = body.notes || null;
  const datePreference = body.datePreference || null;
  // Dedupe slots (same day + window twice is noise for the strategist).
  const preferredSlots = body.preferredSlots.filter(
    (s, i, arr) => arr.findIndex((o) => o.day === s.day && o.window === s.window) === i,
  );

  // Verify the service exists in Payload (and is active).
  const service = await getServiceBySlug(slug);
  if (!service) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 });
  }

  // Growth Call is a one-per-member-for-life Free-tier benefit (F4.8); every
  // other service just blocks a second request while one is open.
  if (slug === GROWTH_CALL_SLUG) {
    if (await hasEverBookedGrowthCall(user.id)) {
      return NextResponse.json(
        {
          error:
            "You've already used your free Growth Call. Message your strategist or request a paid session instead.",
        },
        { status: 409 },
      );
    }
  } else if (await hasOpenBookingFor(user.id, slug)) {
    return NextResponse.json(
      { error: 'You already have an open request for this service.' },
      { status: 409 },
    );
  }

  // Route to the member's strategist. Members assigned at sign-in keep that
  // strategist; anyone still unassigned (no active strategists at the time,
  // or a pre-feature account) is matched now by the need they just chose.
  const profile = await getProfile(user.id);
  let strategistSlug = profile?.assignedStrategistId ?? null;
  if (!strategistSlug) {
    strategistSlug = await pickNextStrategistSlug(
      body.need !== 'other' ? body.need : needFromHelpAreas(profile?.helpAreas),
    ).catch(() => null);
    if (strategistSlug && profile) {
      await getDb()
        .update(userProfiles)
        .set({ assignedStrategistId: strategistSlug, updatedAt: sql`now()` })
        .where(eq(userProfiles.userId, user.id))
        .catch((e) => console.error('[service-bookings] strategist assignment failed', e));
    }
  }
  const strategist = strategistSlug
    ? await getStrategistBySlug(strategistSlug).catch(() => null)
    : null;

  const booking = await createBooking({
    userId: user.id,
    serviceSlug: slug,
    serviceTitle: service.title,
    notes,
    datePreference,
    need: body.need,
    preferredSlots,
    strategistSlug,
  });

  // Best-effort notification to the customer.
  try {
    await createNotification({
      userId: user.id,
      kind: 'message_received',
      title: `${service.title} request received`,
      body: 'Thanks — the Growth Hub team has your request and will be in touch within 1 business day.',
      href: '/services#services',
    });
  } catch (e) {
    console.error('[service-bookings] customer notification failed', e);
  }

<<<<<<< HEAD
  // Referral qualification does NOT happen here. A booking *request* is free
  // and unverified; the referral qualifies when ops marks the Growth Call
  // completed (PATCH /api/ops/bookings/[id] →
  // qualifyReferralForCompletedGrowthCall).
=======
  const userEmail = user.email ?? 'unknown';
  const userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || userEmail;
  const slotsText = formatSlots(preferredSlots);
  const memberUrl = `${APP_URL}/ops/members/${encodeURIComponent(user.id)}`;
  const strategistEmail = strategist?.email ?? null;
>>>>>>> 02e0828 (feat(advisory): triage intake, adviser 360, status workflow, specialties routing (F4.1–F4.3, F4.5–F4.10))

  // Ops email — CC the routed strategist so they learn about the booking
  // without reading hello@ (F4.2). No replyTo=member: replies should go
  // through the portal thread so history stays in one place (F4.10).
  {
    const row = (label: string, value: string) =>
      `<tr><td style="padding:4px 12px 4px 0;color:#4A6A70;vertical-align:top;">${label}</td><td>${value}</td></tr>`;
    const result = await sendEmail({
      from: DEFAULT_FROM,
      to: OPS_EMAIL,
      cc: strategistEmail ? [strategistEmail] : undefined,
      subject: `[Booking] ${service.title} — ${userName}`,
      text: [
        `New service request: ${service.title} (${slug})`,
        `Member: ${userName} <${userEmail}>`,
        `Need: ${needLabel(body.need)}`,
        slotsText ? `Preferred slots: ${slotsText}` : null,
        datePreference ? `When: ${datePreference}` : null,
        `Strategist: ${strategist?.name ?? strategistSlug ?? 'unassigned'}`,
        `Booking ID: #${booking.id}`,
        '',
        notes ?? 'No notes provided.',
        '',
        `Member 360 + reply: ${memberUrl}`,
      ]
        .filter((l) => l !== null)
        .join('\n'),
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;line-height:1.55;max-width:600px;">
          <h2 style="font-family:Georgia,serif;color:#0D3F48;margin:0 0 8px;">New service request</h2>
          <p style="margin:0 0 18px;color:#4A6A70;">A member just requested <strong>${escapeHtml(service.title)}</strong>.</p>
          <table style="border-collapse:collapse;margin:0 0 18px;">
            ${row('Member', escapeHtml(userName))}
            ${row('Email', `<a href="mailto:${escapeHtml(userEmail)}">${escapeHtml(userEmail)}</a>`)}
            ${row('Service', `${escapeHtml(service.title)} <code style="font-size:12px;color:#4A6A70;">(${escapeHtml(slug)})</code>`)}
            ${row('Need', escapeHtml(needLabel(body.need)))}
            ${slotsText ? row('Preferred slots', escapeHtml(slotsText)) : ''}
            ${datePreference ? row('When', escapeHtml(datePreference)) : ''}
            ${row('Strategist', escapeHtml(strategist?.name ?? strategistSlug ?? 'unassigned'))}
            ${row('Booking ID', `#${booking.id}`)}
          </table>
          ${
            notes
              ? `<div style="border-left:3px solid #E3F29C;padding:8px 14px;background:#FCFAF3;color:#0D3F48;white-space:pre-wrap;">${escapeHtml(notes)}</div>`
              : '<p style="color:#7A9098;font-style:italic;">No notes provided.</p>'
          }
          <p style="margin:18px 0 0;">
            <a href="${memberUrl}" style="display:inline-block;background:#0D3F48;color:#fff;text-decoration:none;padding:10px 22px;border-radius:8px;font-size:14px;font-weight:600;">Open member 360 →</a>
          </p>
          <p style="margin:12px 0 0;font-size:13px;color:#7A9098;">Schedule / reply from the ops console so the conversation stays in the member's portal thread.</p>
        </div>
      `,
    });
    if (!result.ok) console.error('[service-bookings] ops email not sent', result.error);
  }

  // Member confirmation (F4.2).
  if (user.email) {
    const greet = user.firstName ?? 'there';
    const result = await sendEmail({
      from: DEFAULT_FROM,
      to: user.email,
      replyTo: strategistEmail ?? undefined,
      subject: `We've got your ${service.title} request`,
      text: `Hi ${greet},\n\nThanks — your request for ${service.title} is in.${slotsText ? `\n\nYou asked for: ${slotsText}.` : ''}\n\n${strategist?.name ?? 'The Growth Hub team'} will confirm a time within 1 business day. You can track it under Services in your dashboard: ${APP_URL}/services`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;line-height:1.6;max-width:600px;color:#1a2e2e;">
          <h2 style="font-family:Georgia,serif;color:#0D3F48;margin:0 0 12px;">Hi ${escapeHtml(greet)},</h2>
          <p style="margin:0 0 12px;color:#4A6A70;">Thanks — your request for <strong>${escapeHtml(service.title)}</strong> is in.</p>
          ${slotsText ? `<p style="margin:0 0 12px;color:#4A6A70;">You asked for: ${escapeHtml(slotsText)}.</p>` : ''}
          <p style="margin:0 0 18px;color:#4A6A70;">${escapeHtml(strategist?.name ?? 'The Growth Hub team')} will confirm a time within 1 business day.</p>
          <a href="${APP_URL}/services" style="display:inline-block;background:#0D3F48;color:#fff;text-decoration:none;padding:10px 22px;border-radius:8px;font-size:14px;font-weight:600;">Track it in your dashboard →</a>
        </div>
      `,
    });
    if (!result.ok) console.error('[service-bookings] member confirmation not sent', result.error);
  }

  return NextResponse.json({ booking });
}
