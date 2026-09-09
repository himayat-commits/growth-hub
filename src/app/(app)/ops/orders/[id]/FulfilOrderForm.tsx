'use client';

// Fulfilment controls on the ops order detail page.
//
//   paid     → ship form (both roles). NO cancel button: a paid order is
//              cancelled by refunding in Stripe; the charge.refunded webhook
//              marks it refunded and stock is restocked from Inventory.
//   pending  → "Cancel order" for admins only (an unpaid checkout that never
//              completed). The API rejects it for support / non-pending rows.
//   shipped  → read-only tracking summary.
//   other    → nothing to do.

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { OrderStatus } from '@/lib/shop/types';

interface Props {
  id: number;
  status: OrderStatus;
  /** Admin-only affordance; the PATCH route enforces the same rule. */
  canCancel: boolean;
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
}

export default function FulfilOrderForm({ id, status, canCancel, carrier, trackingNumber, trackingUrl }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState({
    carrier: carrier ?? 'auspost',
    trackingNumber: trackingNumber ?? '',
    trackingUrl: trackingUrl ?? '',
    notes: '',
  });
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function send(body: Record<string, unknown>, okMsg: string) {
    setErr(null);
    setDone(null);
    const res = await fetch(`/api/ops/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setErr(data.error ?? 'Update failed');
      return;
    }
    setDone(okMsg);
    start(() => router.refresh());
  }

  if (status === 'shipped') {
    return (
      <p>
        Shipped{carrier ? ` via ${carrier}` : ''}.
        {trackingNumber && (
          <>
            {' '}
            Tracking <strong>{trackingNumber}</strong>
            {trackingUrl && (
              <>
                {' '}
                — <a href={trackingUrl} target="_blank" rel="noopener noreferrer">open ↗</a>
              </>
            )}
          </>
        )}
      </p>
    );
  }

  if (status === 'pending') {
    return (
      <div style={{ display: 'grid', gap: 10 }}>
        <p className="gh-ops-meta" style={{ margin: 0 }}>
          Unpaid checkout — nothing to ship. It clears itself if the customer never pays.
        </p>
        {canCancel ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="gh-btn ghost"
              disabled={pending}
              onClick={() => {
                if (window.confirm('Cancel this unpaid order? The customer has not been charged.')) {
                  void send({ status: 'cancelled' }, 'Order cancelled.');
                }
              }}
            >
              Cancel order
            </button>
            {err && <span className="gh-ops-err">{err}</span>}
            {done && <span className="gh-ops-meta">{done}</span>}
          </div>
        ) : (
          <p className="gh-ops-meta" style={{ margin: 0 }}>Only admins can cancel orders.</p>
        )}
      </div>
    );
  }

  if (status !== 'paid') {
    return <p className="gh-ops-meta">Nothing to do — order is {status}.</p>;
  }

  return (
    <form
      className="gh-ops-fulfil"
      style={{ display: 'grid', gap: 10 }}
      onSubmit={(e) => {
        e.preventDefault();
        void send(
          {
            status: 'shipped',
            carrier: form.carrier,
            trackingNumber: form.trackingNumber || undefined,
            trackingUrl: form.trackingUrl || undefined,
            notes: form.notes || undefined,
          },
          "Marked shipped — the customer's been emailed the tracking details.",
        );
      }}
    >
      <label className="gh-ops-meta">
        Carrier
        <select className="gh-ops-select" value={form.carrier} onChange={(e) => setForm({ ...form, carrier: e.target.value })} style={{ display: 'block', width: '100%' }}>
          <option value="auspost">Australia Post</option>
          <option value="sendle">Sendle</option>
          <option value="startrack">StarTrack</option>
          <option value="other">Other</option>
        </select>
      </label>
      <label className="gh-ops-meta">
        Tracking number
        <input className="gh-ops-input" value={form.trackingNumber} onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })} style={{ display: 'block', width: '100%' }} />
      </label>
      <label className="gh-ops-meta">
        Tracking URL (optional — auto-filled for AusPost / Sendle / StarTrack)
        <input className="gh-ops-input" type="url" value={form.trackingUrl} onChange={(e) => setForm({ ...form, trackingUrl: e.target.value })} style={{ display: 'block', width: '100%' }} />
      </label>
      <label className="gh-ops-meta">
        Internal note (optional)
        <textarea className="gh-ops-input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ display: 'block', width: '100%' }} />
      </label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="submit" className="gh-btn lime" disabled={pending}>
          {pending ? 'Saving…' : 'Mark as shipped'}
        </button>
      </div>
      <p className="gh-ops-meta" style={{ margin: 0 }}>
        Need to cancel? Paid orders are cancelled by refunding in Stripe — the charge.refunded webhook marks this order
        refunded, then restock from <Link href="/ops/inventory">Inventory</Link>.
      </p>
      {err && <span className="gh-ops-err">{err}</span>}
      {done && <span className="gh-ops-meta">{done}</span>}
    </form>
  );
}
