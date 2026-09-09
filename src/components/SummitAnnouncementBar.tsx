'use client';

// Site-wide promo bar for the "Entrepreneurship for Everyone" summit. Sits
// above the navbar on every marketing page. Dismissible (remembered in
// localStorage) and self-retiring after the event date, so it needs no manual
// teardown post-9-July. Click-through fires summit_register_intent so the
// announcement bar shows up as a funnel source in analytics.

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { track } from '@/lib/analytics';
import { SUMMIT } from '@/lib/summit';

const DISMISS_KEY = 'gh-summit-bar-dismissed-2026';
// Hide the bar once the day has passed (1 day grace after the event).
const HIDE_AFTER = new Date('2026-07-10T00:00:00+10:00').getTime();

// ─── Visibility store ────────────────────────────────────────────────────────
// Whether to show the bar depends on localStorage + the clock, neither known
// during SSR. It is modelled as an external store read via useSyncExternalStore:
// the server snapshot is always `false` (render nothing on first paint, so
// there is no hydration mismatch) and the client snapshot is computed from
// localStorage once hydrated — the same first-paint behaviour the previous
// useEffect + setState pair gave, without a setState-in-effect cascade.

const listeners = new Set<() => void>();
// In-memory dismissal so the bar still hides when localStorage is blocked.
let dismissedThisSession = false;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): boolean {
  if (dismissedThisSession) return false;
  if (Date.now() > HIDE_AFTER) return false;
  try {
    if (localStorage.getItem(DISMISS_KEY) === '1') return false;
  } catch {
    /* localStorage blocked (private mode) — just show the bar */
  }
  return true;
}

function getServerSnapshot(): boolean {
  return false;
}

function dismiss() {
  dismissedThisSession = true;
  try {
    localStorage.setItem(DISMISS_KEY, '1');
  } catch {
    /* ignore */
  }
  listeners.forEach((notify) => notify());
}

export default function SummitAnnouncementBar() {
  const show = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (!show) return null;

  return (
    <div role="region" aria-label="Event announcement" className="summit-bar">
      <div className="summit-bar-inner">
        <span>
          <strong>Free summit · {SUMMIT.name}</strong>
          <span style={{ opacity: 0.85 }}> — {SUMMIT.dateLong}, {SUMMIT.venue}</span>
        </span>
        <Link
          href={SUMMIT.path}
          className="summit-bar-link"
          onClick={() => track('summit_register_intent', { slug: SUMMIT.slug, channel: 'announce-bar', surface: 'announcement' })}
        >
          See the program →
        </Link>
        <button type="button" onClick={dismiss} aria-label="Dismiss announcement" className="summit-bar-close">
          ×
        </button>
      </div>
    </div>
  );
}
