'use client';

// Site-wide promo bar for the "Entrepreneurship for Everyone" summit. Sits
// above the navbar on every marketing page. Dismissible (remembered in
// localStorage) and self-retiring after the event date, so it needs no manual
// teardown post-9-July. Click-through fires summit_register_intent so the
// announcement bar shows up as a funnel source in analytics.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { track } from '@/lib/analytics';
import { SUMMIT } from '@/lib/summit';

const DISMISS_KEY = 'gh-summit-bar-dismissed-2026';
// Hide the bar once the day has passed (1 day grace after the event).
const HIDE_AFTER = new Date('2026-07-10T00:00:00+10:00').getTime();

export default function SummitAnnouncementBar() {
  // Render nothing on first paint to avoid an SSR/client mismatch — the bar
  // depends on localStorage + the current date, neither known during SSR.
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (Date.now() > HIDE_AFTER) return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === '1') return;
    } catch {
      /* localStorage blocked (private mode) — just show the bar */
    }
    setShow(true);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  };

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
