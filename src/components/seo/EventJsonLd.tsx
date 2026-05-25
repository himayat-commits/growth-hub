import type { Event as PayloadEvent } from '@/payload-types';
import { JsonLd } from './JsonLd';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://thegrowthhub.com.au';

// Parse the Payload `time` free-text field into a start ISO + optional end ISO,
// anchored to the event's calendar date. Returns null when the format isn't
// recognised — Schema.org Event allows startDate alone, so we degrade gracefully.
function buildStartEnd(dateIso: string, timeStr: string | null | undefined): { start: string; end?: string } | null {
  if (!dateIso) return null;
  const day = new Date(dateIso);
  if (Number.isNaN(day.getTime())) return null;
  if (!timeStr) return { start: day.toISOString() };

  // Accept formats like "12:30 – 1:30 pm", "10:00 – 11:30 am", "6 – 8 pm".
  const m = timeStr
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*[–\-]\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!m) return { start: day.toISOString() };

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
  // If end resolves before start (e.g. "11 – 1 pm"), assume same-day cross-over.
  if (end.getTime() <= start.getTime()) end.setHours(end.getHours() + 12);
  return { start: start.toISOString(), end: end.toISOString() };
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

  data.offers = {
    '@type': 'Offer',
    url,
    price: looksFree ? '0' : cost,
    priceCurrency: 'AUD',
    availability: 'https://schema.org/InStock',
    validFrom: new Date().toISOString(),
  };

  return <JsonLd data={data} />;
}
