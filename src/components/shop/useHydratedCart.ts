'use client';

// Joins the local { sku, qty } cart with the server's view of each SKU
// (GET /api/shop/products). Re-fetches whenever the set of SKUs changes.
// Also applies the server's corrections: prunes SKUs that no longer exist
// and clamps quantities to available stock.
//
// No synchronous setState inside the effect body: all state updates happen
// in fetch callbacks, and `loading` is derived from which key the current
// result was fetched for.

import { useEffect, useMemo, useState } from 'react';
import { useCart } from './CartProvider';
import type { HydratedLine, HydrateResponse } from '@/lib/shop/types';

export interface CartRow extends HydratedLine {
  qty: number;
  /** Price actually applied per unit (member or list). */
  unitCents: number;
  lineCents: number;
  lineListCents: number;
}

export interface HydratedCart {
  rows: CartRow[];
  isMember: boolean;
  loading: boolean;
  error: string | null;
  /** Human notices produced by server corrections (removed / clamped). */
  notices: string[];
  subtotalCents: number;
  listSubtotalCents: number;
  savingsCents: number;
  /** True when any line is sold out or over stock — blocks checkout. */
  blocked: boolean;
  refresh: () => void;
}

interface Result {
  key: string;
  tick: number;
  res: HydrateResponse;
}

export function useHydratedCart(): HydratedCart {
  const { lines, ready, prune, setQty } = useCart();
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<{ key: string; message: string } | null>(null);
  const [notices, setNotices] = useState<string[]>([]);
  const [tick, setTick] = useState(0);
  const skuKey = useMemo(() => lines.map((l) => l.sku).sort().join(','), [lines]);

  useEffect(() => {
    if (!ready || !skuKey) return;
    let cancelled = false;
    fetch(`/api/shop/products?skus=${encodeURIComponent(skuKey)}`, { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw new Error('Could not load your cart');
        return (await r.json()) as HydrateResponse;
      })
      .then((res) => {
        if (cancelled) return;
        setResult({ key: skuKey, tick, res });
        setError(null);
        const msgs: string[] = [];
        if (res.missing.length) {
          prune(res.items.map((i) => i.sku));
          msgs.push(
            res.missing.length === 1
              ? "One item's no longer available, so we've taken it out of your cart."
              : `${res.missing.length} items are no longer available, so we've taken them out of your cart.`,
          );
        }
        for (const item of res.items) {
          const line = lines.find((l) => l.sku === item.sku);
          if (line && item.stock > 0 && line.qty > item.stock) {
            setQty(item.sku, item.stock);
            msgs.push(`Only ${item.stock} left of ${item.name}${item.variantLabel ? ` (${item.variantLabel})` : ''} — we've adjusted your quantity.`);
          }
        }
        setNotices(msgs);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError({ key: skuKey, message: e instanceof Error ? e.message : 'Could not load your cart' });
      });
    return () => {
      cancelled = true;
    };
    // `lines` intentionally excluded: qty changes don't need a refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, skuKey, tick]);

  const data = result?.res ?? null;
  const fresh = !!result && result.key === skuKey && result.tick === tick;
  const failed = !!error && error.key === skuKey;
  const loading = !ready || (skuKey !== '' && !fresh && !failed);

  const rows = useMemo<CartRow[]>(() => {
    if (!data) return [];
    const byLine = new Map(lines.map((l) => [l.sku, l.qty]));
    return data.items
      .filter((i) => byLine.has(i.sku))
      .map((i) => {
        const qty = byLine.get(i.sku)!;
        const unit = i.memberPriceCents ?? i.priceCents;
        return { ...i, qty, unitCents: unit, lineCents: unit * qty, lineListCents: i.priceCents * qty };
      });
  }, [data, lines]);

  const subtotalCents = rows.reduce((n, r) => n + r.lineCents, 0);
  const listSubtotalCents = rows.reduce((n, r) => n + r.lineListCents, 0);

  return {
    rows,
    isMember: data?.isMember ?? false,
    loading,
    error: failed ? error!.message : null,
    notices,
    subtotalCents,
    listSubtotalCents,
    savingsCents: listSubtotalCents - subtotalCents,
    blocked: rows.some((r) => !r.available || r.qty > r.stock),
    refresh: () => setTick((t) => t + 1),
  };
}
