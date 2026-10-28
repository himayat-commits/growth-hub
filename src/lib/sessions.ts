// Growth Hub Sessions: the published season plan, merged with the CMS.
//
// Free Sessions run on the 2nd Wednesday (12:00–1:30) and paid Build Labs on
// the 4th Wednesday (9:30–12:30). The 2026 pilot runs in November (11 and
// 25 Nov, on that rhythm) and December (2 and 9 Dec, off it); the season
// proper starts in February. SEASON is the plan we publish; bookings live on the matching Payload
// event (same Canberra date). "Book a seat" shows only once that event has a
// registerUrl; until then the date links to its event page ("See details").
// Upcoming CMS events that aren't part of the season (webinars, one-offs)
// still list, after the season rows.

import type { Event as PayloadEvent } from '@/payload-types';
import { canberraDateKey } from '@/lib/events-time';
import { toPublicEvent } from '@/lib/events-data';

export type SessionKind = 'session' | 'lab' | 'other';
export type SessionArea = 'Get started' | 'Get found' | 'Run smarter' | 'Practical AI' | 'Stay safe';

export const SESSION_AREAS: Array<{ area: SessionArea; blurb: string }> = [
  { area: 'Get started', blurb: 'Email, files and payments set up once, properly.' },
  { area: 'Get found', blurb: 'Search, Google Business Profile and a site that brings enquiries.' },
  { area: 'Run smarter', blurb: 'Choosing business software, and actually using it.' },
  { area: 'Practical AI', blurb: 'Fewer tools, used with confidence.' },
  { area: 'Stay safe', blurb: 'MFA, backups and your privacy duties, in plain English.' },
];

// The room at CBRIN (1 Moore St) is requested but not yet confirmed. Flip this
// to true once CBRIN agrees and every venue line on the site updates together.
const VENUE_CONFIRMED = false;

export const SESSION_VENUE = VENUE_CONFIRMED
  ? { short: 'CBRIN, 1 Moore St', row: 'CBRIN' }
  : { short: 'Canberra city, venue to be confirmed', row: 'Canberra city · venue TBC' };

export const SESSION_FORMAT: Record<'session' | 'lab', { label: string; price: string; time: string; where: string }> = {
  session: { label: 'Session', price: 'Free', time: '12:00–1:30pm', where: VENUE_CONFIRMED ? 'CBRIN · in person' : SESSION_VENUE.row },
  lab: { label: 'Build Lab', price: 'A$179', time: '9:30am–12:30pm', where: VENUE_CONFIRMED ? 'CBRIN · in person' : SESSION_VENUE.row },
};

interface SeasonItem {
  /** Canberra calendar date, YYYY-MM-DD. */
  date: string;
  kind: 'session' | 'lab';
  title: string;
  /** Sessions rotate through the five areas; Build Labs are always a website build. */
  area?: SessionArea;
  pilot?: boolean;
}

const LAB_TITLE = 'Build and publish your website';

export const SEASON: SeasonItem[] = [
  { date: '2026-11-11', kind: 'session', area: 'Get started', title: 'Digital set-up that saves hours', pilot: true },
  { date: '2026-11-25', kind: 'lab', title: LAB_TITLE, pilot: true },
  { date: '2026-12-02', kind: 'session', area: 'Get found', title: 'Be found and chosen online', pilot: true },
  { date: '2026-12-09', kind: 'lab', title: LAB_TITLE, pilot: true },
  { date: '2027-02-10', kind: 'session', area: 'Get found', title: 'Marketing that works in 2027' },
  { date: '2027-02-24', kind: 'lab', title: LAB_TITLE },
  { date: '2027-03-10', kind: 'session', area: 'Get started', title: 'Digital set-up that saves hours' },
  { date: '2027-03-24', kind: 'lab', title: LAB_TITLE },
  { date: '2027-04-14', kind: 'session', area: 'Practical AI', title: "AI tools you'll use tomorrow" },
  { date: '2027-04-28', kind: 'lab', title: LAB_TITLE },
  { date: '2027-05-12', kind: 'session', area: 'Stay safe', title: 'Cyber basics in an hour' },
  { date: '2027-05-26', kind: 'lab', title: LAB_TITLE },
  { date: '2027-06-09', kind: 'session', area: 'Run smarter', title: 'The right software for end of financial year' },
  { date: '2027-06-23', kind: 'lab', title: LAB_TITLE },
];

/** How a 90-minute Session runs; the last two steps are about your business. */
export const RUN_SHEET = [
  { t: '0:00', h: 'Coffee and a seat', p: 'Tables by stage: starting out, trading, growing.', yours: false },
  { t: '0:10', h: 'Why it matters now', p: "A short welcome, and why this month's topic matters.", yours: false },
  { t: '0:15', h: 'Three practical moves', p: 'With Canberra examples, and no product pitch.', yours: false },
  { t: '0:45', h: 'Done live', p: 'One move, done in the room so you see it work.', yours: false },
  { t: '1:00', h: 'Table clinic', p: 'Your table works on one real problem, with helpers.', yours: true },
  { t: '1:20', h: 'Your next step', p: 'Free advice, a Build Lab, or next month.', yours: true },
];

/** How a three-hour Build Lab runs. */
export const LAB_STEPS = [
  { t: '20 min', h: 'Brief.', p: 'Your answers from booking, printed on a card.' },
  { t: '40 min', h: 'Build.', p: 'Pick a template, or let the AI builder draft it from your brief.' },
  { t: '40 min', h: 'Check.', p: 'A 12-point check with a helper: real details, honest claims.' },
  { t: '30 min', h: 'Publish.', p: 'Live, linked to your Google Business Profile, enquiry form tested.' },
  { t: '30 min', h: 'Plan.', p: 'Your next 30 days, and your own domain if you want it.' },
];

/** The season entry a CMS event belongs to (same Canberra date), if any. */
export function seasonItemFor(doc: Pick<PayloadEvent, 'date'>): SeasonItem | undefined {
  if (!doc.date) return undefined;
  const key = canberraDateKey(new Date(String(doc.date)));
  return SEASON.find((s) => s.date === key);
}

/** The event's booking link, or null when the editor hasn't added one yet. */
export function registerUrlOf(doc: Pick<PayloadEvent, 'registerUrl'>): string | null {
  return String(doc.registerUrl ?? '').trim() || null;
}

/** Price and venue as the public pages show them. Sessions and Build Labs fill
 *  blanks from the season plan, so a Lab saved without `cost` still reads
 *  A$179 and a blank `location` reads as the venue, never "Online". */
export function eventFacts(doc: Pick<PayloadEvent, 'date' | 'cost' | 'location'>) {
  const season = seasonItemFor(doc);
  const cost = String(doc.cost ?? '').trim();
  const location = String(doc.location ?? '').trim();
  if (!season) return { season, price: cost || 'Free', location };
  return {
    season,
    price: !cost || /^free$/i.test(cost) ? SESSION_FORMAT[season.kind].price : cost,
    location: location || SESSION_VENUE.short,
  };
}

export interface CalendarRow {
  key: string;
  /** Canberra calendar date, YYYY-MM-DD. */
  date: string;
  kind: SessionKind;
  /** Kind label shown on the tag: "Session", "Build Lab", or the CMS tag. */
  label: string;
  price: string;
  area?: SessionArea;
  pilot?: boolean;
  title: string;
  time: string;
  where: string;
  /** Event page, once the date exists in the CMS. */
  href?: string;
  /** The CMS event has a booking link, so the row says "Book a seat". */
  bookable?: boolean;
  seats?: string;
}

// Matched CMS events are summit-free: the summit has its own landing page and
// is long past, but its working-title slugs still exist in the CMS.
const SUMMIT_SLUGS = new Set([
  'small-business-journey',
  'ai-for-small-business-9-july',
  'entrepreneurship-for-everyone',
]);

/** Season rows from today on, with CMS bookings attached, then any other
 *  upcoming CMS events. */
export function buildCalendar(upcomingDocs: PayloadEvent[], now: Date = new Date()): CalendarRow[] {
  const today = canberraDateKey(now);
  const docs = upcomingDocs.filter((d) => d.slug && !SUMMIT_SLUGS.has(String(d.slug)));
  const byDate = new Map<string, PayloadEvent>();
  for (const d of docs) {
    if (!d.date) continue;
    const key = canberraDateKey(new Date(String(d.date)));
    if (!byDate.has(key)) byDate.set(key, d);
  }

  const used = new Set<string>();
  const seasonRows: CalendarRow[] = SEASON.filter((s) => s.date >= today).map((s) => {
    const doc = byDate.get(s.date);
    if (doc) used.add(String(doc.slug));
    const format = SESSION_FORMAT[s.kind];
    return {
      key: s.date,
      date: s.date,
      kind: s.kind,
      label: format.label,
      price: format.price,
      area: s.area,
      pilot: s.pilot,
      title: doc?.title ? String(doc.title) : s.title,
      time: doc?.time ? String(doc.time) : format.time,
      where: format.where,
      href: doc ? `/events/${doc.slug}` : undefined,
      bookable: doc ? Boolean(registerUrlOf(doc)) : false,
      seats: doc?.seats ? String(doc.seats) : undefined,
    };
  });

  const otherRows: CalendarRow[] = docs
    .filter((d) => !used.has(String(d.slug)))
    .map((d) => {
      const ev = toPublicEvent(d);
      return {
        key: ev.slug,
        date: d.date ? canberraDateKey(new Date(String(d.date))) : today,
        kind: 'other' as const,
        label: ev.tag,
        price: ev.cost,
        title: ev.title,
        time: ev.time,
        where: ev.location || 'Online',
        href: `/events/${ev.slug}`,
        bookable: Boolean(registerUrlOf(d)),
        seats: d.seats ? String(d.seats) : undefined,
      };
    })
    .filter((r) => r.date >= today);

  return [...seasonRows, ...otherRows].sort((a, b) => a.date.localeCompare(b.date));
}

/** The next free Session — drives the top bar and the home page card. */
export function nextSession(rows: CalendarRow[]): CalendarRow | null {
  return rows.find((r) => r.kind === 'session') ?? null;
}

/** One button per state: "Book a seat" once the event has a booking link,
 *  "See details" while its page exists without one, else "See dates". */
export function rowCta(row: CalendarRow | null): { label: string; href: string } {
  if (!row?.href) return { label: 'See dates', href: '/events#whats-on' };
  return { label: row.bookable ? 'Book a seat' : 'See details', href: row.href };
}

/** "2026-12-02" → { weekday: "Wed", day: "2", month: "Dec", long: "Wednesday 2 December" }.
 *  Built from the parts so the server's timezone never shifts the day. */
export function dateParts(dateKey: string) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const at = new Date(Date.UTC(y, m - 1, d, 12));
  const fmt = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('en-AU', { ...opts, timeZone: 'UTC' }).format(at);
  return {
    weekday: fmt({ weekday: 'short' }),
    day: String(d),
    month: fmt({ month: 'short' }),
    year: String(y),
    long: fmt({ weekday: 'long', day: 'numeric', month: 'long' }),
  };
}
