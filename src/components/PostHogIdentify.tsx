'use client';

// One-shot client component that ties the current WorkOS user to a
// PostHog person profile on mount. Idempotent — posthog.identify()
// dedupes on the distinct_id.
//
// Rendered inside the (app) layout so every authenticated page assigns
// events to the right profile. (main) pages stay anonymous unless the
// user has previously signed in (PostHog persists the distinct_id in
// localStorage).

import { useEffect } from 'react';
import { identify } from '@/lib/analytics';

export default function PostHogIdentify({
  userId,
  email,
  planTier,
}: {
  userId: string;
  email: string | null;
  planTier: string | null;
}) {
  useEffect(() => {
    if (!userId) return;
    identify(userId, { email: email ?? undefined, planTier });
  }, [userId, email, planTier]);
  return null;
}
