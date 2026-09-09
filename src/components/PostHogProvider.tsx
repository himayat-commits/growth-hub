'use client';

// PostHog client-side initialiser.
//
// Mounts once at the layout level. No-ops without NEXT_PUBLIC_POSTHOG_KEY
// so dev / preview environments don't ship telemetry. Page-view tracking
// is wired manually via usePathname() because Next.js App Router doesn't
// fire the classic 'routeChangeComplete' that PostHog's autocapture
// pageview hook listens for.
//
// Consent: nothing initialises until the visitor has accepted analytics
// cookies (gh_consent=granted — the same opt-in gate ConsentGate applies to
// the ad pixels), so the banner's "Nothing loads until you choose" is true.
// Accepting later in the session inits on CONSENT_EVENT and captures the
// current page (PageViewTracker only fires on subsequent navigations);
// declining after a grant opts out of capturing. The (app) shell renders no
// banner, so a member who never chose on the marketing site stays untracked.

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';
import { readConsent, CONSENT_EVENT } from '@/lib/consent';
import { POSTHOG_LOADED_EVENT } from '@/lib/analytics';

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

/** Init (or re-enable) PostHog. Safe to call repeatedly. */
function startPostHog(): void {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';
  if (!apiKey) return;

  if (posthog.__loaded) {
    // Granted → denied → granted within one session: resume capturing.
    if (posthog.has_opted_out_capturing()) posthog.opt_in_capturing();
    return;
  }

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

  // The page the visitor is on when PostHog comes up. PageViewTracker's
  // mount effect already ran (child effects fire before this parent's) and
  // no-op'd, so this is the only capture for the current URL — both on a
  // consented first load and on a mid-session Accept.
  posthog.capture('$pageview', { $current_url: window.location.href });

  // Let one-shot consumers (PostHogIdentify) know they can now talk to the
  // SDK — they mount before this provider's effect runs.
  window.dispatchEvent(new Event(POSTHOG_LOADED_EVENT));
}

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const sync = () => {
      if (readConsent() === 'granted') {
        startPostHog();
      } else if (posthog.__loaded && !posthog.has_opted_out_capturing()) {
        posthog.opt_out_capturing();
      }
    };
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
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
