'use client';

// Cookie-consent banner for the public marketing site. Opt-in: the marketing
// pixels (gated by <ConsentGate>) only load after the visitor clicks Accept.
// Uses inline styles so it renders correctly regardless of which stylesheet
// the current (main) page loaded.

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { readConsent, writeConsent } from '@/lib/consent';

export default function ConsentBanner() {
  // Start "decided" so the banner never flashes during SSR / first paint;
  // reveal it after mount only when the visitor hasn't chosen yet.
  const [decided, setDecided] = useState(true);

  useEffect(() => {
    // Reveal only after mount (client-only cookie read), and only when the
    // visitor hasn't chosen yet. Wrapped in a fn to match ConsentGate's shape.
    const sync = () => setDecided(readConsent() !== null);
    sync();
  }, []);

  if (decided) return null;

  const choose = (value: 'granted' | 'denied') => {
    writeConsent(value);
    setDecided(true);
  };

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      style={{
        position: 'fixed',
        left: 16,
        right: 16,
        bottom: 16,
        zIndex: 1000,
        maxWidth: 760,
        margin: '0 auto',
        background: '#0D3F48',
        color: '#F3F0E7',
        borderRadius: 12,
        padding: '16px 20px',
        boxShadow: '0 8px 28px rgba(0,0,0,0.25)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 14,
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, flex: '1 1 280px' }}>
        We use analytics cookies to understand how the site is used and improve it.
        Nothing loads until you choose. See our{' '}
        <Link href="/privacy" style={{ color: '#C5E84A', textDecoration: 'underline' }}>
          privacy policy
        </Link>
        .
      </p>
      <div style={{ display: 'flex', gap: 8, flex: '0 0 auto' }}>
        <button
          type="button"
          onClick={() => choose('denied')}
          style={{
            background: 'transparent',
            color: '#F3F0E7',
            border: '1px solid rgba(243,240,231,0.4)',
            borderRadius: 999,
            padding: '8px 18px',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Decline
        </button>
        <button
          type="button"
          onClick={() => choose('granted')}
          style={{
            background: '#C5E84A',
            color: '#1a3530',
            border: 'none',
            borderRadius: 999,
            padding: '8px 18px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Accept
        </button>
      </div>
    </div>
  );
}
