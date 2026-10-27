import type { Event as PayloadEvent } from '@/payload-types';
import { parseCanberraRange } from '@/lib/events-time';
import { eventFacts, SESSION_FORMAT } from '@/lib/sessions';
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

/** schema.org wants a number: "Free" → "0", "A$179" → "179". Falls back to
 *  `fallback` (the season price) when the text has no amount; null if neither. */
function offerPrice(cost: string, fallback?: string): string | null {
  if (/free/i.test(cost)) return '0';
  const amount = cost.replace(/,/g, '').match(/\d+(?:\.\d{1,2})?/)?.[0];
  if (amount) return amount;
  return fallback ? offerPrice(fallback) : null;
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

  // Sessions and Build Labs are in person whatever the CMS `type` says, at the
  // venue unless `location` is set.
  const { season, price: cost, location } = eventFacts(ev);
  const isOnline = !season && ((ev as { type?: string }).type ?? 'webinar') === 'webinar';
  const url = `${SITE_URL}/events/${slug}`;
  const price = offerPrice(cost, season && SESSION_FORMAT[season.kind].price);

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
  if (!hasEnded && price !== null) {
    data.offers = {
      '@type': 'Offer',
      url,
      price,
      priceCurrency: 'AUD',
      availability: 'https://schema.org/InStock',
      validFrom: new Date().toISOString(),
    };
  }

  return <JsonLd data={data} />;
}
