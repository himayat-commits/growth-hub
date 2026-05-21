// Adapter between Payload Event docs and the shape the public /events
// pages render. Most fields are pulled straight from the CMS; date display
// strings (monthShort / day / year / dateLong) are derived from `date`
// unless `dateDisplay` is set as an override.

import type { Event as PayloadEvent } from '@/payload-types';

export type EventCategory = 'Summit' | 'Workshop' | 'Mixer' | 'Clinic' | 'Community' | 'Webinar';

export interface PublicEvent {
  slug: string;
  title: string;
  desc: string;
  tag: string;
  tagClass: string;
  monthShort: string;
  day: string;
  year: string;
  dateLong: string;
  time: string;
  location: string;
  cost: string;
  audience: string;
  cat: EventCategory;
  featured: boolean;
  bespoke: boolean;
}

const CATEGORY_LABELS: Record<string, EventCategory> = {
  summit: 'Summit',
  workshop: 'Workshop',
  mixer: 'Mixer',
  clinic: 'Clinic',
  community: 'Community',
  webinar: 'Webinar',
};

const TAG_CLASSES: Record<EventCategory, string> = {
  Summit: 'tag-summit',
  Workshop: 'tag-workshop',
  Mixer: 'tag-mixer',
  Clinic: 'tag-clinic',
  Community: 'tag-community',
  Webinar: 'tag-workshop',
};

function formatDateLong(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

function monthShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'TBC';
  return d.toLocaleString('en-AU', { month: 'short' });
}

function dayOf(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return String(d.getDate()).padStart(2, '0');
}

function yearOf(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return String(d.getFullYear());
}

/** Map a Payload Event document into the shape the public pages render.
 *  `dateDisplay` overrides the parsed date string when set — used for
 *  events with date='TBC' or recurring schedules. */
export function toPublicEvent(ev: PayloadEvent): PublicEvent {
  const cat: EventCategory =
    CATEGORY_LABELS[(ev as { category?: string }).category ?? 'workshop'] ?? 'Workshop';
  const dateIso = String(ev.date ?? '');
  const override = (ev as { dateDisplay?: string | null }).dateDisplay;

  return {
    slug: String(ev.slug ?? ''),
    title: String(ev.title ?? ''),
    desc: String(ev.description ?? ''),
    tag: String((ev as { tag?: string | null }).tag ?? cat),
    tagClass: TAG_CLASSES[cat] ?? 'tag-workshop',
    monthShort: override ? 'TBC' : monthShort(dateIso),
    day: override ? '—' : dayOf(dateIso),
    year: override ? '' : yearOf(dateIso),
    dateLong: override || formatDateLong(dateIso),
    time: String(ev.time ?? ''),
    location: String(ev.location ?? ''),
    cost: String((ev as { cost?: string | null }).cost ?? 'Free'),
    audience: String((ev as { audience?: string | null }).audience ?? ''),
    cat,
    featured: Boolean(ev.featured),
    bespoke: Boolean((ev as { bespoke?: boolean | null }).bespoke),
  };
}

export function toPublicEvents(docs: PayloadEvent[]): PublicEvent[] {
  return docs.map(toPublicEvent).filter((e) => e.slug);
}
