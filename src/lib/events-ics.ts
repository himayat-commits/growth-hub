// RFC 5545 (.ics) builder for a single event. Shared by:
//   - GET /api/events/ics/[slug]   public "Add to calendar" download (no meeting link)
//   - RSVP confirmation email      attachment for members (may carry meetingUrl)
//
// Times come from parseCanberraRange (src/lib/events-time.ts) and are emitted
// as UTC (`...Z`), which every calendar client converts to the viewer's zone —
// no VTIMEZONE block needed. All-day events use VALUE=DATE with the Canberra
// calendar date.
//
// Pure function, no I/O.

import { parseCanberraRange } from '@/lib/events-time';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://thegrowthhub.com.au';

export interface IcsEventInput {
  /** Payload event id — used for a stable UID so re-imports update in place. */
  id: string | number;
  slug: string;
  title: string;
  description?: string | null;
  location?: string | null;
  dateIso: string;
  time?: string | null;
  /** Members only. When set, appended to DESCRIPTION and used as LOCATION
   *  for online events. The public route must leave this undefined. */
  meetingUrl?: string | null;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

/** Format a Date as YYYYMMDDTHHMMSSZ (UTC) per RFC 5545. */
export function fmtIcsUtc(d: Date): string {
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
}

/** YYYY-MM-DD → YYYYMMDD for VALUE=DATE properties. */
function fmtIcsDateKey(dateKey: string): string {
  return dateKey.replace(/-/g, '');
}

function nextDateKey(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
}

/** Escape commas, semicolons and newlines per RFC 5545 §3.3.11. */
export function icsEscape(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

/** Build a complete VCALENDAR string (CRLF line endings). */
export function buildEventIcs(input: IcsEventInput, now: Date = new Date()): string {
  const title = input.title || 'Event';
  const url = `${SITE_URL}/events/${input.slug}`;
  const meetingUrl = (input.meetingUrl ?? '').trim();
  const location = (input.location ?? '').trim() || meetingUrl;
  const description = [
    (input.description ?? '').trim(),
    meetingUrl ? `Join online: ${meetingUrl}` : '',
    `Event page: ${url}`,
  ]
    .filter(Boolean)
    .join('\n\n');

  const range = parseCanberraRange(input.dateIso, input.time);

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Growth Hub by Himayat//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:event-${input.id}@thegrowthhub.com.au`,
    `DTSTAMP:${fmtIcsUtc(now)}`,
    `SUMMARY:${icsEscape(title)}`,
    `URL:${url}`,
  ];

  if (description) lines.push(`DESCRIPTION:${icsEscape(description)}`);
  if (location) lines.push(`LOCATION:${icsEscape(location)}`);

  if (range && !range.allDay && range.end) {
    lines.push(`DTSTART:${fmtIcsUtc(range.start)}`);
    lines.push(`DTEND:${fmtIcsUtc(range.end)}`);
  } else if (range) {
    lines.push(`DTSTART;VALUE=DATE:${fmtIcsDateKey(range.dateKey)}`);
    lines.push(`DTEND;VALUE=DATE:${fmtIcsDateKey(nextDateKey(range.dateKey))}`);
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');

  // Folding to 75 octets per RFC is omitted — modern calendar clients
  // tolerate long lines, and our titles/descriptions stay well within bounds.
  return lines.join('\r\n') + '\r\n';
}
