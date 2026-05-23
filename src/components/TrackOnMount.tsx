'use client';

// Tiny client-side bridge that fires a PostHog event once on mount.
// Lets server components opt into analytics by dropping <TrackOnMount/>
// at the top of their JSX with the right event name + properties.
//
// Idempotent against React Strict Mode in dev — useRef guards the fire.

import { useEffect, useRef } from 'react';
import { track, type AnalyticsEvent } from '@/lib/analytics';

export default function TrackOnMount({
  event,
  properties,
}: {
  event: AnalyticsEvent;
  properties?: Record<string, string | number | boolean | null | undefined>;
}) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    track(event, properties);
  }, [event, properties]);
  return null;
}
