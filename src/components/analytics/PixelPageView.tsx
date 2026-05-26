'use client';

// Fires per-route pageviews on GA4 and Meta after SPA navigations.
// App Router doesn't trigger the classic `routeChangeComplete` that
// these pixels' auto-pageview behaviour listens for, so we drive
// pageviews manually from usePathname() + useSearchParams().
//
// LinkedIn's Insight Tag auto-detects SPA route changes via the
// History API, so we don't push pageviews to lintrk here.
//
// PostHog has its own PageViewTracker in PostHogProvider; the two
// trackers are independent and both fire on every route change.

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

function Tracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const search = searchParams.toString();
    const path = search ? `${pathname}?${search}` : pathname;
    const url = window.location.origin + path;

    if (window.gtag && process.env.NEXT_PUBLIC_GA4_ID) {
      window.gtag('event', 'page_view', {
        page_path: path,
        page_location: url,
        page_title: document.title,
      });
    }
    if (window.fbq) {
      window.fbq('track', 'PageView');
    }
  }, [pathname, searchParams]);

  return null;
}

export default function PixelPageView() {
  // useSearchParams() in App Router requires a Suspense boundary, mirroring
  // the PostHogProvider PageViewTracker pattern.
  return (
    <Suspense fallback={null}>
      <Tracker />
    </Suspense>
  );
}
