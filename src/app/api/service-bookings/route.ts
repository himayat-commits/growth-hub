// POST /api/service-bookings — customer requests a service.
// GET  /api/service-bookings — list the signed-in user's bookings.
//
// On successful create:
//   1. Insert a `requested` row
//   2. Drop an in-app notification on the customer's feed
//   3. Email ops at hello@himayat.com.au with the booking details
// Steps 2 and 3 are best-effort — they never block a successful response.

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { createBooking, getUserBookings, hasOpenBookingFor } from '@/lib/db/bookings';
import { createNotification } from '@/lib/db/notifications';
import { qualifyReferral } from '@/lib/db/referrals';
import { getServiceBySlug } from '@/lib/cms';

export const runtime = 'nodejs';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const OPS_EMAIL = process.env.OPS_NOTIFICATION_EMAIL ?? 'hello@himayat.com.au';

interface BookingRequest {
  serviceSlug: string;
  notes?: string;
  datePreference?: string;
}

export async function GET() {
  const { user } = await withAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const bookings = await getUserBookings(user.id);
  return NextResponse.json({ bookings });
}

export async function POST(req: NextRequest) {
  const { user } = await withAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: BookingRequest;
  try {
    body = (await req.json()) as BookingRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const slug = typeof body.serviceSlug === 'string' ? body.serviceSlug.trim() : '';
  if (!slug) {
    return NextResponse.json({ error: 'serviceSlug is required' }, { status: 400 });
  }
  const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 4000) : null;
  const datePreference =
    typeof body.datePreference === 'string'
      ? body.datePreference.trim().slice(0, 200)
      : null;

  // Verify the service exists in Payload (and is active).
  const service = await getServiceBySlug(slug);
  if (!service) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 });
  }

  // Block silent duplicates — if the user has an open request for this
  // service we tell them instead of writing another row.
  const duplicate = await hasOpenBookingFor(user.id, slug);
  if (duplicate) {
    return NextResponse.json(
      { error: 'You already have an open request for this service.' },
      { status: 409 },
    );
  }

  const booking = await createBooking({
    userId: user.id,
    serviceSlug: slug,
    serviceTitle: service.title,
    notes,
    datePreference,
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

  // Growth Call → qualify any pending referral attributed to this user.
  // Notify both sides that the A$50 credit is pending issuance.
  if (slug === 'growth-call') {
    try {
      const referral = await qualifyReferral(user.id);
      if (referral) {
        await Promise.all([
          createNotification({
            userId: referral.referrerUserId,
            kind: 'referral_signed_up',
            title: 'Your referral booked a Growth Call',
            body: 'A$50 service credit is on its way to both of you — we apply it on your next paid plan.',
            href: '/benefits',
          }),
          createNotification({
            userId: user.id,
            kind: 'referral_signed_up',
            title: 'A$50 credit unlocked',
            body: "Thanks for joining via a friend — your A$50 service credit applies to your next paid plan.",
            href: '/plan',
          }),
        ]);
      }
    } catch (e) {
      console.error('[service-bookings] referral qualification failed', e);
    }
  }

  // Best-effort email to ops.
  if (resend) {
    try {
      const userEmail = user.email ?? 'unknown';
      const userName =
        [user.firstName, user.lastName].filter(Boolean).join(' ') || userEmail;
      await resend.emails.send({
        from: 'Growth Hub <noreply@himayat.com.au>',
        to: OPS_EMAIL,
        replyTo: userEmail,
        subject: `[Booking] ${service.title} — ${userName}`,
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;line-height:1.55;max-width:600px;">
            <h2 style="font-family:Georgia,serif;color:#0D3F48;margin:0 0 8px;">New service request</h2>
            <p style="margin:0 0 18px;color:#4A6A70;">A member just requested <strong>${escapeHtml(service.title)}</strong>.</p>
            <table style="border-collapse:collapse;margin:0 0 18px;">
              <tr><td style="padding:4px 12px 4px 0;color:#4A6A70;">Member</td><td>${escapeHtml(userName)}</td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#4A6A70;">Email</td><td><a href="mailto:${escapeHtml(userEmail)}">${escapeHtml(userEmail)}</a></td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#4A6A70;">Service</td><td>${escapeHtml(service.title)} <code style="font-size:12px;color:#4A6A70;">(${escapeHtml(slug)})</code></td></tr>
              ${datePreference ? `<tr><td style="padding:4px 12px 4px 0;color:#4A6A70;">When</td><td>${escapeHtml(datePreference)}</td></tr>` : ''}
              <tr><td style="padding:4px 12px 4px 0;color:#4A6A70;">Booking ID</td><td>#${booking.id}</td></tr>
            </table>
            ${
              notes
                ? `<div style="border-left:3px solid #E3F29C;padding:8px 14px;background:#FCFAF3;color:#0D3F48;white-space:pre-wrap;">${escapeHtml(notes)}</div>`
                : '<p style="color:#7A9098;font-style:italic;">No notes provided.</p>'
            }
            <p style="margin:18px 0 0;font-size:13px;color:#7A9098;">Reply to this email to write back directly — the From address is set to the customer.</p>
          </div>
        `,
      });
    } catch (e) {
      console.error('[service-bookings] ops email failed', e);
    }
  }

  return NextResponse.json({ booking });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
