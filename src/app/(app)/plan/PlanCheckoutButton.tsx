'use client';

// Tiny client-side helper that POSTs to /api/checkout and redirects to the
// Stripe-hosted checkout URL. Used by the "Upgrade to X" buttons on /plan.

import { useState } from 'react';
import type { PaidPlanTier, BillingInterval } from '@/lib/plans';

export default function PlanCheckoutButton({
  tier,
  interval = 'month',
  label,
  className,
}: {
  tier: PaidPlanTier;
  interval?: BillingInterval;
  label: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);

  const start = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, interval }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? 'Could not start checkout');
      }
      window.location.href = data.url;
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Could not start checkout');
      setLoading(false);
    }
  };

  return (
    <button type="button" onClick={start} disabled={loading} className={className}>
      {loading ? 'Loading…' : label}
    </button>
  );
}
