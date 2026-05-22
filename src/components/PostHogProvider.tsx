'use client';

// PostHog client-side initialiser.
//
// Mounts once at the layout level. No-ops without NEXT_PUBLIC_POSTHOG_KEY
// so dev / preview environments don't ship telemetry. Page-view tracking
// is wired manually via usePathname() because Next.js App Router doesn't
// fire the classic 'routeChangeComplete' that PostHog's autocapture
// pageview hook listens for.

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!posthog.__loaded) return;
    const search = searchParams.toString();
    const url = search ? `${pathname}?${search}` : pathname;
    posthog.capture('$pageview', { $current_url: window.location.origin + url });
  }, [pathname, searchParams]);

  return null;
}

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';
    if (!apiKey || posthog.__loaded) return;

    posthog.init(apiKey, {
      api_host: apiHost,
      // We capture pageviews manually via PageViewTracker — autocapture
      // pageviews would fire twice with the App Router.
      capture_pageview: false,
      // Capture clicks + form submits but skip sensitive fields by default.
      autocapture: {
        // Don't autocapture inputs that look like passwords / emails — the
        // newsletter + sign-up forms send those values through deliberate
        // capture() calls with email hashed.
        css_selector_allowlist: [],
        element_allowlist: ['a', 'button'],
      },
      person_profiles: 'identified_only',
      // Session replay off — cost + noise outweighs benefit until there's a
      // specific debugging need.
      disable_session_recording: true,
    });
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      {children}
    </>
  );
}
