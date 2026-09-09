'use client';

// Inline fulfilment control for the orders table. "Mark shipped" expands a
// carrier + tracking form; PATCHes /api/ops/orders/[id] then refreshes.

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { OrderStatus } from '@/lib/shop/types';

export default function OrderRowActions({ id, status }: { id: number; status: OrderStatus }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({ carrier: 'auspost', trackingNumber: '' });

  async function patch(body: Record<string, unknown>) {
    setErr(null);
    const res = await fetch(`/api/ops/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setErr(data.error ?? 'Update failed');
      return false;
    }
    startTransition(() => router.refresh());
    return true;
  }

  if (status !== 'paid') {
    return <span className="gh-ops-meta">—</span>;
  }

  if (!open) {
    return (
      <div className="gh-ops-actions">
        <button type="button" className="gh-ops-actionbtn" onClick={() => setOpen(true)} disabled={pending}>
          → mark shipped
        </button>
        {err && <span className="gh-ops-err">{err}</span>}
      </div>
    );
  }

  return (
    <form
      className="gh-ops-actions"
      style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}
      onSubmit={async (e) => {
        e.preventDefault();
        const ok = await patch({ status: 'shipped', ...form });
        if (ok) setOpen(false);
      }}
    >
      <select
        className="gh-ops-select"
        value={form.carrier}
        onChange={(e) => setForm({ ...form, carrier: e.target.value })}
        aria-label="Carrier"
      >
        <option value="auspost">Australia Post</option>
        <option value="sendle">Sendle</option>
        <option value="startrack">StarTrack</option>
        <option value="other">Other</option>
      </select>
      <input
        className="gh-ops-input"
        placeholder="Tracking number"
        value={form.trackingNumber}
        onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })}
        aria-label="Tracking number"
        style={{ width: 160 }}
      />
      <button type="submit" className="gh-ops-actionbtn" disabled={pending}>
        {pending ? '…' : 'Ship it'}
      </button>
      {/* Closes the inline form only. There is deliberately no "cancel order"
          action for paid rows here or on the detail page — paid orders are
          cancelled by refunding in Stripe (webhook → refunded). */}
      <button type="button" className="gh-ops-actionbtn" onClick={() => setOpen(false)} disabled={pending}>
        close
      </button>
      {err && <span className="gh-ops-err">{err}</span>}
    </form>
  );
}
