'use client';

// Cart state for the storefront. Persists ONLY { sku, qty } in localStorage;
// everything else (names, prices, images, stock, member pricing) is fetched
// from /api/shop/products so the server stays the authority.
//
// Why localStorage and not a cookie: Next 16 forbids cookies().set() in
// Server Components, so a cookie cart would need a round-trip for every
// quantity change and would opt the catalogue pages out of caching.
//
// localStorage is treated as an external store (useSyncExternalStore): the
// server snapshot is an empty cart and `ready` flips to true after hydration,
// so the badge never mismatches between server and client HTML.

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from 'react';
import { z } from 'zod';
import { MAX_CART_LINES, MAX_QTY_PER_LINE, type CartLine } from '@/lib/shop/types';

const KEY = 'gh_cart_v1';

const LineSchema = z.object({
  sku: z.string().min(1).max(64),
  qty: z.number().int().min(1).max(MAX_QTY_PER_LINE),
});
const CartSchema = z.array(LineSchema).max(MAX_CART_LINES);

// ── External store ──────────────────────────────────────────────────────────

const EMPTY: CartLine[] = [];
const listeners = new Set<() => void>();
let cache: { raw: string | null; lines: CartLine[] } = { raw: null, lines: EMPTY };

function parse(raw: string | null): CartLine[] {
  if (!raw) return EMPTY;
  try {
    const parsed = CartSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : EMPTY;
  } catch {
    return EMPTY;
  }
}

function readSnapshot(): CartLine[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  if (raw !== cache.raw) cache = { raw, lines: parse(raw) };
  return cache.lines;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === null) cb();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
}

function write(next: CartLine[]) {
  const raw = JSON.stringify(next);
  try {
    localStorage.setItem(KEY, raw);
  } catch {
    // Private mode / quota — keep an in-memory cart for this page view.
  }
  cache = { raw, lines: next };
  listeners.forEach((l) => l());
}

const subscribeNoop = () => () => {};

// ── Context ─────────────────────────────────────────────────────────────────

interface CartContextValue {
  lines: CartLine[];
  /** Sum of quantities — for the nav badge. */
  count: number;
  /** False during SSR / before hydration. */
  ready: boolean;
  add: (sku: string, qty: number, max?: number) => void;
  setQty: (sku: string, qty: number) => void;
  remove: (sku: string) => void;
  clear: () => void;
  /** Drop lines whose SKU the server says no longer exists. */
  prune: (validSkus: string[]) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const lines = useSyncExternalStore(subscribe, readSnapshot, () => EMPTY);
  const ready = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  const commit = useCallback((next: CartLine[]) => write(next), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      ready,
      count: lines.reduce((n, l) => n + l.qty, 0),
      add: (sku, qty, max = MAX_QTY_PER_LINE) => {
        const cap = Math.max(1, Math.min(max, MAX_QTY_PER_LINE));
        const existing = lines.find((l) => l.sku === sku);
        if (existing) {
          commit(lines.map((l) => (l.sku === sku ? { ...l, qty: Math.min(l.qty + qty, cap) } : l)));
        } else if (lines.length < MAX_CART_LINES) {
          commit([...lines, { sku, qty: Math.min(qty, cap) }]);
        }
      },
      setQty: (sku, qty) => {
        if (qty <= 0) commit(lines.filter((l) => l.sku !== sku));
        else commit(lines.map((l) => (l.sku === sku ? { ...l, qty: Math.min(qty, MAX_QTY_PER_LINE) } : l)));
      },
      remove: (sku) => commit(lines.filter((l) => l.sku !== sku)),
      clear: () => commit([]),
      prune: (valid) => {
        const keep = new Set(valid);
        const next = lines.filter((l) => keep.has(l.sku));
        if (next.length !== lines.length) commit(next);
      },
    }),
    [lines, ready, commit],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
