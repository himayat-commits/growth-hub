import { getEventBySlug } from '@/lib/cms';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://thegrowthhub.com.au';

// RFC 5545 (.ics) generator for a public event. Consumed by the "Add to
// Calendar" button on /events/[slug]. macOS Calendar, Outlook, and Google
// Calendar all import .ics by URL or download.
//
// Lookup is by slug (matches the public URL). The route handler returns
// 404 when the slug doesn't resolve; never throws so the link never
// 500s in front of a visitor.

function pad(n: number) { return String(n).padStart(2, '0'); }

/** Format a Date as YYYYMMDDTHHMMSSZ (UTC) per RFC 5545. */
function fmtIcsUtc(d: Date): string {
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

/** Format a Date as YYYYMMDD for all-day events. */
function fmtIcsDate(d: Date): string {
  return d.getUTCFullYear().toString() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate());
}

/** Escape commas, semicolons and newlines per RFC 5545 §3.3.11. */
function icsEscape(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function parseTimeRange(dateIso: string, timeStr: string | null | undefined) {
  const day = new Date(dateIso);
  if (Number.isNaN(day.getTime())) return null;
  if (!timeStr) {
    return { start: day, end: null, allDay: true };
  }
  const m = timeStr
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*[–\-]\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!m) return { start: day, end: null, allDay: true };

  const [, sH, sM, sMer, eH, eM, eMer] = m;
  const mer = (eMer ?? sMer ?? 'pm').toLowerCase();
  const sMerFinal = (sMer ?? mer).toLowerCase();
  const to24 = (h: number, ampm: string) => {
    if (ampm === 'pm' && h < 12) return h + 12;
    if (ampm === 'am' && h === 12) return 0;
    return h;
  };
  const start = new Date(day);
  start.setHours(to24(Number(sH), sMerFinal), Number(sM ?? '0'), 0, 0);
  const end = new Date(day);
  end.setHours(to24(Number(eH), mer), Number(eM ?? '0'), 0, 0);
  if (end.getTime() <= start.getTime()) end.setHours(end.getHours() + 12);
  return { start, end, allDay: false };
}

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const doc = await getEventBySlug(slug);
  if (!doc) return new Response('Not found', { status: 404 });

  const title = String(doc.title ?? 'Event');
  const description = String(doc.description ?? '');
  const location = String(doc.location ?? '').trim();
  const url = `${SITE_URL}/events/${slug}`;
  const dateIso = doc.date ? String(doc.date) : '';
  const time = (doc as { time?: string | null }).time ?? null;
  const range = parseTimeRange(dateIso, time);

  const now = new Date();
  const uid = `event-${doc.id}@thegrowthhub.com.au`;

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Growth Hub by Himayat//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${fmtIcsUtc(now)}`,
    `SUMMARY:${icsEscape(title)}`,
    `URL:${url}`,
  ];

  if (description) lines.push(`DESCRIPTION:${icsEscape(description)}`);
  if (location) lines.push(`LOCATION:${icsEscape(location)}`);

  if (range?.allDay && range.start) {
    const next = new Date(range.start);
    next.setUTCDate(next.getUTCDate() + 1);
    lines.push(`DTSTART;VALUE=DATE:${fmtIcsDate(range.start)}`);
    lines.push(`DTEND;VALUE=DATE:${fmtIcsDate(next)}`);
  } else if (range?.start && range.end) {
    lines.push(`DTSTART:${fmtIcsUtc(range.start)}`);
    lines.push(`DTEND:${fmtIcsUtc(range.end)}`);
  } else if (dateIso) {
    const d = new Date(dateIso);
    lines.push(`DTSTART;VALUE=DATE:${fmtIcsDate(d)}`);
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');

  // Folding to 75 octets per RFC is omitted — modern calendar clients
  // tolerate long lines, and our titles/descriptions stay well within bounds.
  const ics = lines.join('\r\n') + '\r\n';

  return new Response(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${slug}.ics"`,
      'Cache-Control': 'public, max-age=600, s-maxage=600',
    },
  });
}
