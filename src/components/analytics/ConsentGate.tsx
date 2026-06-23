'use client';

// Renders its children (the marketing pixels) only once the visitor has
// granted cookie consent, and re-evaluates live when the choice changes (so
// accepting in the banner starts tracking without a page reload).
//
// Server-renders nothing and starts false on the client too, so there's no
// hydration mismatch — the pixels are afterInteractive anyway.

import { useEffect, useState } from 'react';
import { readConsent, CONSENT_EVENT } from '@/lib/consent';

export default function ConsentGate({ children }: { children: React.ReactNode }) {
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    const sync = () => setGranted(readConsent() === 'granted');
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, []);

  return granted ? <>{children}</> : null;
}
