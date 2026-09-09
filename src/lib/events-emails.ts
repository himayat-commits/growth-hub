// Send helpers for event emails (GTM review F3.2, F3.8). Best-effort: the
// confirmation never fails an RSVP and the reminder reports success so the
// cron only marks rows it actually sent. Both log + Sentry on failure.

import 'server-only';
import * as Sentry from '@sentry/nextjs';
import type { Event as PayloadEvent } from '@/payload-types';
import { DEFAULT_FROM, OPS_EMAIL, getResend } from '@/lib/email/resend';
import {
  eventReminderEmail,
  eventRsvpConfirmationEmail,
  type EventMailInput,
} from '@/lib/email/templates/event-rsvp';
import { buildEventIcs } from '@/lib/events-ics';
import { formatCanberraDateLong, formatCanberraTimeLabel } from '@/lib/events-time';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://thegrowthhub.com.au';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.thegrowthhub.com.au';

/** Only http(s) links are ever rendered as a join link. */
function safeUrl(raw: string | null | undefined): string | null {
  const s = (raw ?? '').trim();
  return /^https?:\/\//i.test(s) ? s : null;
}

export function eventMailInput(event: PayloadEvent): EventMailInput {
  const slug = String(event.slug ?? '');
  const dateIso = String(event.date ?? '');
  const location = String(event.location ?? '').trim();
  const isOnline = (event.type ?? 'webinar') === 'webinar' || !location;
  return {
    title: String(event.title ?? 'Event'),
    dateLong: formatCanberraDateLong(dateIso),
    timeLabel: formatCanberraTimeLabel(dateIso, event.time),
    location,
    isOnline,
    meetingUrl: safeUrl(event.meetingUrl),
    eventUrl: `${SITE_URL}/events/${slug}`,
    manageUrl: `${APP_URL}/my-events`,
    icsUrl: `${SITE_URL}/api/events/ics/${encodeURIComponent(slug)}`,
  };
}

/** Member .ics — unlike the public route this MAY carry the meeting link. */
function memberIcs(event: PayloadEvent): { filename: string; content: Buffer; contentType: string } {
  const slug = String(event.slug ?? `event-${event.id}`);
  const ics = buildEventIcs({
    id: event.id,
    slug,
    title: String(event.title ?? 'Event'),
    description: event.description,
    location: event.location,
    dateIso: String(event.date ?? ''),
    time: event.time,
    meetingUrl: safeUrl(event.meetingUrl),
  });
  return { filename: `${slug}.ics`, content: Buffer.from(ics, 'utf8'), contentType: 'text/calendar' };
}

/** Confirmation on RSVP create. Never throws. */
export async function sendRsvpConfirmationEmail(event: PayloadEvent, to: string): Promise<void> {
  const resend = getResend();
  if (!resend || !to) return;
  try {
    const mail = eventRsvpConfirmationEmail(eventMailInput(event));
    const { error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      replyTo: OPS_EMAIL,
      ...mail,
      attachments: [memberIcs(event)],
    });
    if (error) throw new Error(`${error.name}: ${error.message}`);
  } catch (err) {
    console.error('[events] RSVP confirmation email failed', err);
    Sentry.captureException(err, {
      tags: { area: 'events.email', kind: 'rsvp_confirmation' },
      extra: { eventId: event.id },
    });
  }
}

/** Day-before / morning-of reminder. Returns true only when Resend accepted it. */
export async function sendEventReminderEmail(
  event: PayloadEvent,
  to: string,
  when: 'today' | 'tomorrow',
): Promise<boolean> {
  const resend = getResend();
  if (!resend || !to) return false;
  try {
    const mail = eventReminderEmail(eventMailInput(event), when);
    const { error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      replyTo: OPS_EMAIL,
      ...mail,
    });
    if (error) throw new Error(`${error.name}: ${error.message}`);
    return true;
  } catch (err) {
    console.error('[events] reminder email failed', err);
    Sentry.captureException(err, {
      tags: { area: 'events.email', kind: `reminder_${when}` },
      extra: { eventId: event.id },
    });
    return false;
  }
}
