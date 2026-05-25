'use client';

// Triggers the .ics download from /api/events/ics/[slug] and fires
// event_add_to_calendar in PostHog. Plain anchor — the browser handles
// the file download; we don't need to fetch().

import { track } from '@/lib/analytics';
import { readAttribution } from './useAttribution';

export default function AddToCalendarLink({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const href = `/api/events/ics/${encodeURIComponent(slug)}`;
  return (
    <a
      className="btn btn-secondary"
      href={href}
      onClick={() => track('event_add_to_calendar', { slug, title, ...readAttribution(slug) })}
    >
      Add to calendar
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        aria-hidden="true"
        style={{ marginLeft: 6 }}
      >
        <path d="M7 3v8M3 7h8" />
      </svg>
    </a>
  );
}
