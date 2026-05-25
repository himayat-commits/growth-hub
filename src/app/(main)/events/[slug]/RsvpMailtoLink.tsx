'use client';

// Client wrapper around the "RSVP by email" mailto: link on
// /events/[slug]. The wrapping is only there to attach the analytics
// onClick — there's no other client-side state. Keeps the page itself
// a clean server component.

import { track } from '@/lib/analytics';
import { readAttribution } from './useAttribution';

export default function RsvpMailtoLink({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const mailto = `mailto:hello@himayat.com.au?subject=${encodeURIComponent(`RSVP — ${title}`)}`;
  return (
    <a
      className="btn btn-primary"
      href={mailto}
      onClick={() =>
        track('event_rsvp_intent', { slug, title, channel: 'mailto', ...readAttribution(slug) })
      }
    >
      RSVP by email
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="M3 7h8M7 3l4 4-4 4" />
      </svg>
    </a>
  );
}
