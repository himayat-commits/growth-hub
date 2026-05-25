'use client';

// Captures ?utm_source / utm_medium / utm_campaign / utm_content / ref
// from the URL and stores them in a `gh_attr_{slug}` cookie (90-day max
// age). The cookie survives the sign-in redirect, so when an
// authenticated member eventually POSTs to /api/events/[id]/rsvp the
// attribution is still in the request and gets persisted to event_rsvps.
//
// Also fires `event_rsvp_intent` enriched with the captured attribution
// dimensions on any `RsvpMailtoLink` / `AddToCalendarLink` click event
// in the same page session (those components read the cookie too).

import { useEffect } from 'react';

const MAX_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'ref'] as const;
const MAP: Record<(typeof MAX_KEYS)[number], string> = {
  utm_source: 'source',
  utm_medium: 'utmMedium',
  utm_campaign: 'utmCampaign',
  utm_content: 'utmContent',
  ref: 'ref',
};

export default function CaptureAttribution({ slug }: { slug: string }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const attribution: Record<string, string> = {};
    for (const k of MAX_KEYS) {
      const v = params.get(k);
      if (v) attribution[MAP[k]] = v.slice(0, 64);
    }
    if (Object.keys(attribution).length === 0) return;

    const value = encodeURIComponent(JSON.stringify(attribution));
    // 90 days; SameSite=Lax so the cookie survives the WorkOS redirect.
    const maxAge = 60 * 60 * 24 * 90;
    document.cookie = `gh_attr_${slug}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  }, [slug]);

  return null;
}
