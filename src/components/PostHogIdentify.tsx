'use client';

// Client component that ties the current WorkOS user to a PostHog person
// profile. Idempotent — posthog.identify() dedupes on the distinct_id.
//
// Rendered inside the (app) layout so every authenticated page assigns
// events to the right profile. (main) pages stay anonymous unless the
// user has previously signed in (PostHog persists the distinct_id in
// localStorage).
//
// Only the WorkOS id and plan tier are sent — no email. The id is enough to
// join against our own records; PII stays out of the US-hosted PostHog
// project (see F7.7 in docs/reviews/2026-09-gtm-readiness-review.md).
//
// PostHog is consent-gated (PostHogProvider) and this component's effect runs
// before the provider's, so the first identify() attempt is usually a no-op.
// We retry when the provider announces it has loaded — on a consented first
// paint or after a mid-session Accept.

import { useEffect } from 'react';
import { identify, POSTHOG_LOADED_EVENT } from '@/lib/analytics';

export default function PostHogIdentify({
  userId,
  planTier,
}: {
  userId: string;
  planTier: string | null;
}) {
  useEffect(() => {
    if (!userId) return;
    const run = () => identify(userId, { planTier });
    run();
    window.addEventListener(POSTHOG_LOADED_EVENT, run);
    return () => window.removeEventListener(POSTHOG_LOADED_EVENT, run);
  }, [userId, planTier]);
  return null;
}
