'use client';

// Client wrapper around the event booking CTA on /events/[slug]. Goes to the
// event's ticketing page (registerUrl from the CMS) when there is one, and
// falls back to an RSVP email. The wrapping is only there to attach the
// analytics onClick — there's no other client-side state. Keeps the page
// itself a clean server component.

import { track } from '@/lib/analytics';
import { bookingHref, CONTACT } from '@/lib/site';
import { readAttribution } from './useAttribution';

export default function RsvpMailtoLink({
  slug,
  title,
  registerUrl,
  label,
}: {
  slug: string;
  title: string;
  registerUrl?: string | null;
  label?: string;
}) {
  const href = registerUrl ? bookingHref(registerUrl) : `mailto:${CONTACT.email}?subject=${encodeURIComponent(`RSVP — ${title}`)}`;
  return (
    <a
      className="btn btn-primary"
      href={href}
      {...(registerUrl ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      onClick={() =>
        track('event_rsvp_intent', {
          slug,
          title,
          channel: registerUrl ? 'register-url' : 'mailto',
          ...readAttribution(slug),
        })
      }
    >
      {label ?? (registerUrl ? 'Register' : 'RSVP by email')}
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
