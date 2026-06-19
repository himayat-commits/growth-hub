'use client';

// CTA cluster for the summit landing page. Three actions, all analytics-wired:
//   1. Attendee "Register" → Eventbrite (CBRIN-hosted). Hidden until the link
//      is set in src/lib/summit.ts; a "get notified" fallback shows instead.
//   2. Contributor "Apply" → the existing HubSpot form at /expo/apply.
//   3. "Add to calendar" → a self-contained .ics built from the SUMMIT
//      constants (no CMS round-trip, so the date is always correct).
//
// The .ics uses explicit UTC instants for 9am–5pm AEST (UTC+10, no winter DST
// in the ACT) so every calendar client lands on the right wall-clock time.

import Link from 'next/link';
import { track } from '@/lib/analytics';
import { SUMMIT, isSummitRegistrationOpen } from '@/lib/summit';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://thegrowthhub.com.au';

const ICS = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'PRODID:-//Growth Hub by Himayat//Entrepreneurship for Everyone//EN',
  'CALSCALE:GREGORIAN',
  'METHOD:PUBLISH',
  'BEGIN:VEVENT',
  `UID:${SUMMIT.slug}-2026@thegrowthhub.com.au`,
  'DTSTAMP:20260601T000000Z',
  // 9:00am AEST (UTC+10) = 23:00 UTC the day before.
  'DTSTART:20260708T230000Z',
  // 6:30pm AEST = 08:30 UTC same day.
  'DTEND:20260709T083000Z',
  `SUMMARY:${SUMMIT.name}`,
  `LOCATION:${SUMMIT.venueFull.replace(/,/g, '\\,')}`,
  'DESCRIPTION:A free full-day summit for Canberra small business — talks\\, workshops and help-desks. All welcome.',
  `URL:${SITE_URL}${SUMMIT.path}`,
  'END:VEVENT',
  'END:VCALENDAR',
].join('\r\n');

const ICS_HREF = `data:text/calendar;charset=utf-8,${encodeURIComponent(ICS)}`;

const Arrow = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
    <path d="M3 7h8M7 3l4 4-4 4" />
  </svg>
);

/** Standalone "apply to contribute" button for use outside the hero
 *  (e.g. under the "ways to be part of the day" grid). */
export function SummitApplyLink({
  surface = 'involved',
  label = 'Apply to take part',
}: {
  surface?: string;
  label?: string;
}) {
  return (
    <Link
      className="btn btn-primary"
      href={SUMMIT.applyPath}
      onClick={() => track('summit_apply_click', { slug: SUMMIT.slug, surface })}
    >
      {label} <Arrow />
    </Link>
  );
}

export default function SummitCtas({ surface = 'hero' }: { surface?: string }) {
  const open = isSummitRegistrationOpen();
  return (
    <div className="hero-ctas">
      {open ? (
        <a
          className="btn btn-primary"
          href={SUMMIT.eventbriteUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('summit_register_intent', { slug: SUMMIT.slug, channel: 'eventbrite', surface })}
        >
          Register free <Arrow />
        </a>
      ) : (
        <a
          className="btn btn-primary"
          href="#get-notified"
          onClick={() => track('summit_register_intent', { slug: SUMMIT.slug, channel: 'notify', surface })}
        >
          Get notified when registration opens <Arrow />
        </a>
      )}
      <Link
        className="btn btn-secondary"
        href={SUMMIT.applyPath}
        onClick={() => track('summit_apply_click', { slug: SUMMIT.slug, surface })}
      >
        Become a stallholder, speaker or sponsor
      </Link>
      <a
        className="btn btn-tertiary"
        href={ICS_HREF}
        download="entrepreneurship-for-everyone.ics"
        onClick={() => track('event_add_to_calendar', { slug: SUMMIT.slug, title: SUMMIT.name, surface })}
      >
        Add to calendar
      </a>
    </div>
  );
}
