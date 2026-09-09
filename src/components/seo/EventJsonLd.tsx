import type { Event as PayloadEvent } from '@/payload-types';
import { parseCanberraRange } from '@/lib/events-time';
import { JsonLd } from './JsonLd';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://thegrowthhub.com.au';

// Combine the Payload `date` + free-text `time` into ISO start/end instants,
// interpreting the time as Australia/Canberra wall-clock (src/lib/events-time.ts).
// Returns null when the date is invalid — Schema.org Event allows startDate
// alone, so we degrade gracefully. All-day events emit the date only.
function buildStartEnd(dateIso: string, timeStr: string | null | undefined): { start: string; end?: string } | null {
  const range = parseCanberraRange(dateIso, timeStr);
  if (!range) return null;
  if (range.allDay || !range.end) return { start: range.dateKey };
  return { start: range.start.toISOString(), end: range.end.toISOString() };
}

/** True when the event's calendar day is more than a day behind us. Kept
 * outside the component so the React Compiler lint doesn't see an impure
 * clock read during render. */
function isPastDate(dateIso: string): boolean {
  if (!dateIso) return false;
  const t = new Date(dateIso).getTime();
  return Number.isFinite(t) && t < Date.now() - 24 * 60 * 60 * 1000;
}

export function EventJsonLd({ ev }: { ev: PayloadEvent }) {
  const slug = String(ev.slug ?? '');
  if (!slug) return null;

  const dateIso = ev.date ? String(ev.date) : '';
  const time = (ev as { time?: string | null }).time ?? null;
  const startEnd = buildStartEnd(dateIso, time);

  const isOnline = ((ev as { type?: string }).type ?? 'webinar') === 'webinar';
  const location = String(ev.location ?? '').trim();
  const url = `${SITE_URL}/events/${slug}`;
  const cost = String((ev as { cost?: string | null }).cost ?? 'Free').trim();
  const looksFree = /free/i.test(cost);

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: String(ev.title ?? ''),
    description: String(ev.description ?? ''),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: isOnline
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : 'https://schema.org/OfflineEventAttendanceMode',
    organizer: {
      '@type': 'Organization',
      name: 'Growth Hub by Himayat',
      url: SITE_URL,
    },
    url,
  };

  if (startEnd) {
    data.startDate = startEnd.start;
    if (startEnd.end) data.endDate = startEnd.end;
  } else if (dateIso) {
    data.startDate = dateIso;
  }

  if (isOnline) {
    data.location = {
      '@type': 'VirtualLocation',
      url,
    };
  } else {
    data.location = {
      '@type': 'Place',
      name: location || 'Canberra',
      address: {
        '@type': 'PostalAddress',
        streetAddress: location || 'Canberra ACT',
        addressLocality: 'Canberra',
        addressRegion: 'ACT',
        addressCountry: 'AU',
      },
    };
  }

  // Only advertise an offer for events still ahead of us; a past event with
  // an "InStock" free ticket is a rich-result error.
  const hasEnded = isPastDate(dateIso);
  if (!hasEnded) {
    data.offers = {
      '@type': 'Offer',
      url,
      price: looksFree ? '0' : cost,
      priceCurrency: 'AUD',
      availability: 'https://schema.org/InStock',
      validFrom: new Date().toISOString(),
    };
  }

  return <JsonLd data={data} />;
}
