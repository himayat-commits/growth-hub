'use client';

// Variant picker + quantity + add-to-cart for /shop/[slug]. Receives a fully
// serialised ProductView (with live stock and pre-computed member prices)
// and the viewer's member flag from the server component — the client never
// decides eligibility or discounts for anything that gets charged.

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useCart } from './CartProvider';
import { Price } from './Price';
import { track } from '@/lib/analytics';
import { MAX_QTY_PER_LINE, type ProductView, type VariantView } from '@/lib/shop/types';

type Sel = { size: string | null; colour: string | null };

function matches(v: VariantView, sel: Sel, axes: { size: boolean; colour: boolean }) {
  return (!axes.size || v.size === sel.size) && (!axes.colour || v.colour === sel.colour);
}

export default function ProductPurchasePanel({ product, isMember }: { product: ProductView; isMember: boolean }) {
  const { add } = useCart();
  const variants = product.variants;
  const axes = useMemo(
    () => ({
      size: variants.some((v) => v.size),
      colour: variants.some((v) => v.colour),
    }),
    [variants],
  );
  const sizes = useMemo(() => [...new Set(variants.map((v) => v.size).filter(Boolean))] as string[], [variants]);
  const colours = useMemo(() => [...new Set(variants.map((v) => v.colour).filter(Boolean))] as string[], [variants]);
  const single = variants.length === 1;

  const [sel, setSel] = useState<Sel>(() =>
    single ? { size: variants[0]!.size, colour: variants[0]!.colour } : { size: null, colour: null },
  );
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const variant = useMemo(() => {
    if (single) return variants[0]!;
    if (axes.size && !sel.size) return null;
    if (axes.colour && !sel.colour) return null;
    return variants.find((v) => matches(v, sel, axes)) ?? null;
  }, [variants, sel, axes, single]);

  const inStock = !!variant && variant.stock > 0;
  const maxQty = Math.max(1, Math.min(variant?.stock ?? 1, MAX_QTY_PER_LINE));

  // A chip is disabled when no in-stock variant exists for it given the
  // other axis's current selection.
  const sizeEnabled = (s: string) =>
    variants.some((v) => v.size === s && v.stock > 0 && (!axes.colour || !sel.colour || v.colour === sel.colour));
  const colourEnabled = (c: string) =>
    variants.some((v) => v.colour === c && v.stock > 0 && (!axes.size || !sel.size || v.size === sel.size));

  const priceCents = variant?.priceCents ?? product.priceCents;
  const memberPrice = variant?.memberPriceCents ?? product.memberPriceCents;

  function onAdd() {
    if (!variant || !inStock) return;
    add(variant.sku, qty, variant.stock);
    setAdded(true);
    track('shop_add_to_cart', { sku: variant.sku, product: product.slug, qty, member: isMember });
    window.setTimeout(() => setAdded(false), 2500);
  }

  return (
    <div className="shop-buy">
      <Price priceCents={priceCents} memberPriceCents={memberPrice} isMember={isMember} nudge size="lg" />

      {!single && axes.size && (
        <fieldset className="shop-axis">
          <legend>Size</legend>
          <div className="shop-chips" role="radiogroup" aria-label="Size">
            {sizes.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={sel.size === s}
                className={'shop-chip' + (sel.size === s ? ' is-on' : '')}
                disabled={!sizeEnabled(s)}
                onClick={() => {
                  setSel((p) => ({ ...p, size: s }));
                  setQty(1);
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {!single && axes.colour && (
        <fieldset className="shop-axis">
          <legend>Colour</legend>
          <div className="shop-chips" role="radiogroup" aria-label="Colour">
            {colours.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={sel.colour === c}
                className={'shop-chip' + (sel.colour === c ? ' is-on' : '')}
                disabled={!colourEnabled(c)}
                onClick={() => {
                  setSel((p) => ({ ...p, colour: c }));
                  setQty(1);
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {variant && !inStock && (
        <p className="shop-soldout" role="status">
          Sold out in this option{!single ? ' — try another size or colour' : ''}.
        </p>
      )}
      {!variant && !single && <p className="shop-hint">Pick {axes.size && axes.colour ? 'a size and colour' : axes.size ? 'a size' : 'a colour'} to continue.</p>}

      <div className="shop-buy-row">
        <div className="shop-qty" aria-label="Quantity">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={!inStock || qty <= 1} aria-label="Decrease quantity">
            −
          </button>
          <span aria-live="polite">{qty}</span>
          <button type="button" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={!inStock || qty >= maxQty} aria-label="Increase quantity">
            +
          </button>
        </div>
        <button type="button" className="btn btn-primary shop-add" disabled={!inStock} onClick={onAdd} data-testid="add-to-cart">
          {added ? 'Added ✓' : 'Add to cart'}
        </button>
      </div>

      {added && (
        <p className="shop-added" role="status">
          In your cart. <Link href="/shop/cart">View cart →</Link>
        </p>
      )}
      {inStock && variant && variant.stock <= 5 && (
        <p className="shop-hint">Only {variant.stock} left.</p>
      )}
      <p className="shop-fine">Ships Australia-wide. Shipping calculated at checkout. Prices include GST.</p>
    </div>
  );
}
