// Event RSVP emails — server-only, plain HTML (same approach as
// event-recap.tsx and order-emails.ts: no @react-email dependency, Resend
// accepts a string body).
//
// Two templates:
//   eventRsvpConfirmationEmail — sent once when a member's RSVP is created
//   eventReminderEmail         — sent by /api/cron/event-reminders the day
//                                before (or the morning of) the event
//
// Times are always Canberra wall-clock with the zone spelled out (AEST/AEDT)
// because members join from anywhere. Brand voice: short, warm, practical.
// No emoji.

import { escapeHtml } from '@/lib/email/resend';

export interface EventMailInput {
  title: string;
  /** "Thursday 9 July 2026" */
  dateLong: string;
  /** "12:30 – 1:30 pm AEST" or "" when the event has no time. */
  timeLabel: string;
  /** Physical location; "" for online. */
  location: string;
  isOnline: boolean;
  /** Members-only join link; null when the editor hasn't set one. */
  meetingUrl: string | null;
  /** Public event page. */
  eventUrl: string;
  /** /my-events on the app host. */
  manageUrl: string;
  /** Public .ics download (no meeting link). */
  icsUrl: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

const FOOTER_HTML =
  '<p style="margin:0;font-size:12px;color:#999;">Growth Hub by Himayat · Level 4, 1 Moore St, Canberra ACT</p>';
const FOOTER_TEXT = 'Growth Hub by Himayat · Level 4, 1 Moore St, Canberra ACT';

function wrap(body: string): string {
  return `<!doctype html>
<html lang="en-AU">
<body style="margin:0;padding:0;background:#f3f0e7;font-family:Georgia,'Times New Roman',serif;color:#1f1f1f;line-height:1.55;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <p style="font-size:13px;color:#666;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 24px;">Growth Hub by Himayat</p>
${body}
    <hr style="border:none;border-top:1px solid #ddd;margin:36px 0;" />
    ${FOOTER_HTML}
  </div>
</body>
</html>`;
}

function whenWhereHtml(i: EventMailInput): string {
  const where = i.isOnline
    ? i.meetingUrl
      ? `Online · <a href="${escapeHtml(i.meetingUrl)}" style="color:#0D3F48;">Join link</a>`
      : 'Online · the join link will be in your reminder'
    : escapeHtml(i.location || 'Canberra');
  return `
    <table style="border-collapse:collapse;margin:0 0 24px;font-size:15px;">
      <tr><td style="padding:4px 16px 4px 0;color:#666;">When</td><td style="padding:4px 0;"><strong>${escapeHtml(i.dateLong)}</strong>${i.timeLabel ? ` · ${escapeHtml(i.timeLabel)}` : ''}</td></tr>
      <tr><td style="padding:4px 16px 4px 0;color:#666;">Where</td><td style="padding:4px 0;">${where}</td></tr>
    </table>`;
}

function whenWhereText(i: EventMailInput): string[] {
  const where = i.isOnline
    ? i.meetingUrl
      ? `Online — join: ${i.meetingUrl}`
      : 'Online — the join link will be in your reminder'
    : i.location || 'Canberra';
  return [`When:  ${i.dateLong}${i.timeLabel ? ` · ${i.timeLabel}` : ''}`, `Where: ${where}`];
}

function joinButtonHtml(i: EventMailInput): string {
  if (!i.meetingUrl) return '';
  return `
    <p style="margin:0 0 28px;">
      <a href="${escapeHtml(i.meetingUrl)}" style="display:inline-block;padding:12px 22px;background:#0D3F48;color:#f3f0e7;text-decoration:none;border-radius:6px;">Join online</a>
    </p>`;
}

/** Sent once when the RSVP row is created. The .ics is attached by the caller. */
export function eventRsvpConfirmationEmail(i: EventMailInput): RenderedEmail {
  const subject = `You're in: ${i.title} — ${i.dateLong}`;

  const html = wrap(`
    <h1 style="font-size:28px;line-height:1.15;margin:0 0 8px;">You're in.</h1>
    <p style="font-size:18px;margin:0 0 24px;"><a href="${escapeHtml(i.eventUrl)}" style="color:#0D3F48;">${escapeHtml(i.title)}</a></p>
    ${whenWhereHtml(i)}
    ${joinButtonHtml(i)}
    <p style="margin:0 0 12px;font-size:14px;">A calendar file (.ics) is attached — open it to add the session to your calendar${i.meetingUrl ? ' with the join link' : ''}.</p>
    <p style="margin:0 0 12px;font-size:14px;">We'll email you a reminder the day before. Plans change? <a href="${escapeHtml(i.manageUrl)}" style="color:#0D3F48;">Manage in My events</a>.</p>`);

  const text = [
    "You're in.",
    i.title,
    i.eventUrl,
    '',
    ...whenWhereText(i),
    '',
    `A calendar file (.ics) is attached${i.meetingUrl ? ' (includes the join link)' : ''}.`,
    "We'll email you a reminder the day before.",
    `Manage in My events: ${i.manageUrl}`,
    '',
    FOOTER_TEXT,
  ].join('\n');

  return { subject, html, text };
}

/** Sent by the daily cron. `when` is relative to Canberra's calendar. */
export function eventReminderEmail(
  i: EventMailInput,
  when: 'today' | 'tomorrow',
): RenderedEmail {
  const lead = when === 'today' ? 'Today' : 'Tomorrow';
  const subject = i.timeLabel
    ? `${lead}: ${i.title} at ${i.timeLabel}`
    : `${lead}: ${i.title}`;

  const html = wrap(`
    <h1 style="font-size:28px;line-height:1.15;margin:0 0 8px;">${lead}: ${escapeHtml(i.title)}</h1>
    <p style="font-size:14px;color:#666;margin:0 0 24px;">A quick reminder that you're registered.</p>
    ${whenWhereHtml(i)}
    ${joinButtonHtml(i)}
    <p style="margin:0 0 12px;font-size:14px;"><a href="${escapeHtml(i.icsUrl)}" style="color:#0D3F48;">Add to calendar (.ics)</a> · <a href="${escapeHtml(i.manageUrl)}" style="color:#0D3F48;">My events</a></p>
    <p style="margin:0 0 12px;font-size:14px;">Can't make it? Cancel from My events so we can offer the seat to someone else.</p>`);

  const text = [
    `${lead}: ${i.title}`,
    "A quick reminder that you're registered.",
    '',
    ...whenWhereText(i),
    '',
    `Add to calendar: ${i.icsUrl}`,
    `My events: ${i.manageUrl}`,
    "Can't make it? Cancel from My events so we can offer the seat to someone else.",
    '',
    FOOTER_TEXT,
  ].join('\n');

  return { subject, html, text };
}
