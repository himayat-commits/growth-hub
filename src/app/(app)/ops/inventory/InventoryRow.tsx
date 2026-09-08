'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function InventoryRow({
  sku,
  productSlug,
  stock,
  updatedAt,
}: {
  sku: string;
  productSlug: string;
  stock: number;
  updatedAt: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [setValue, setSetValue] = useState('');

  async function patch(body: Record<string, number>) {
    setErr(null);
    const res = await fetch(`/api/ops/inventory/${encodeURIComponent(sku)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setErr(data.error ?? 'Update failed');
      return;
    }
    setSetValue('');
    start(() => router.refresh());
  }

  const tone = stock === 0 ? 'status-cancelled' : stock <= 5 ? 'status-pending' : 'status-completed';

  return (
    <tr>
      <td>
        <a href={`/shop/${productSlug}`} target="_blank" rel="noopener noreferrer">
          {productSlug}
        </a>
      </td>
      <td className="gh-ops-meta">{sku}</td>
      <td>
        <span className={`gh-ops-status ${tone}`}>{stock}</span>
      </td>
      <td>
        <div className="gh-ops-actions" style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" className="gh-ops-actionbtn" disabled={pending || stock <= 0} onClick={() => patch({ delta: -1 })} aria-label={`Decrease ${sku}`}>
            −1
          </button>
          <button type="button" className="gh-ops-actionbtn" disabled={pending} onClick={() => patch({ delta: 1 })} aria-label={`Increase ${sku}`}>
            +1
          </button>
          <button type="button" className="gh-ops-actionbtn" disabled={pending} onClick={() => patch({ delta: 10 })}>
            +10
          </button>
          <form
            style={{ display: 'inline-flex', gap: 4 }}
            onSubmit={(e) => {
              e.preventDefault();
              const n = Number.parseInt(setValue, 10);
              if (Number.isFinite(n) && n >= 0) void patch({ set: n });
            }}
          >
            <input
              className="gh-ops-input"
              type="number"
              min={0}
              placeholder="set"
              value={setValue}
              onChange={(e) => setSetValue(e.target.value)}
              style={{ width: 72 }}
              aria-label={`Set stock for ${sku}`}
            />
            <button type="submit" className="gh-ops-actionbtn" disabled={pending || setValue === ''}>
              set
            </button>
          </form>
          {err && <span className="gh-ops-err">{err}</span>}
        </div>
      </td>
      <td className="gh-ops-meta">{new Intl.DateTimeFormat('en-AU', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(updatedAt))}</td>
    </tr>
  );
}
