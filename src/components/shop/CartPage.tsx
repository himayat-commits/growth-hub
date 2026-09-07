'use client';

// /shop/cart body. Hydrates lines from the server, lets the buyer adjust
// quantities, and hands off to Stripe via POST /api/shop/checkout.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from './CartProvider';
import { useHydratedCart, type CartRow } from './useHydratedCart';
import { formatAud } from '@/lib/shop/pricing';
import { track } from '@/lib/analytics';
import { MAX_QTY_PER_LINE } from '@/lib/shop/types';

function LineItem({ row, highlight }: { row: CartRow; highlight: boolean }) {
  const { setQty, remove } = useCart();
  const max = Math.min(row.stock, MAX_QTY_PER_LINE);
  return (
    <li className={'shop-line' + (highlight ? ' is-unavailable' : '')} data-testid="cart-line">
      <div className="shop-line-media">
        {row.imageUrl ? <Image src={row.imageUrl} alt="" width={96} height={96} /> : <div className="shop-card-placeholder" />}
      </div>
      <div className="shop-line-body">
        <Link href={`/shop/${row.productSlug}`} className="shop-line-name">
          {row.name}
        </Link>
        {row.variantLabel && <div className="shop-line-variant">{row.variantLabel}</div>}
        {!row.available ? (
          <div className="shop-line-warn">Sold out — remove it to continue.</div>
        ) : row.qty > row.stock ? (
          <div className="shop-line-warn">Only {row.stock} left.</div>
        ) : null}
        <div className="shop-line-actions">
          <div className="shop-qty" aria-label={`Quantity for ${row.name}`}>
            <button type="button" onClick={() => setQty(row.sku, row.qty - 1)} aria-label="Decrease quantity">
              −
            </button>
            <span aria-live="polite">{row.qty}</span>
            <button type="button" onClick={() => setQty(row.sku, row.qty + 1)} disabled={row.qty >= max} aria-label="Increase quantity">
              +
            </button>
          </div>
          <button type="button" className="shop-link-btn" onClick={() => remove(row.sku)}>
            Remove
          </button>
        </div>
      </div>
      <div className="shop-line-price">
        {row.memberPriceCents !== null && row.memberPriceCents < row.priceCents ? (
          <>
            <s className="shop-price-was">{formatAud(row.lineListCents)}</s>
            <strong>{formatAud(row.lineCents)}</strong>
          </>
        ) : (
          <strong>{formatAud(row.lineCents)}</strong>
        )}
      </div>
    </li>
  );
}

export default function CartPage({ cancelled }: { cancelled: boolean }) {
  const { lines, ready } = useCart();
  const cart = useHydratedCart();
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState<string[]>([]);

  useEffect(() => {
    if (ready) track('shop_cart_view', { lines: lines.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  async function checkout() {
    setError(null);
    setUnavailable([]);
    setCheckingOut(true);
    track('shop_checkout_start', { lines: lines.length, subtotal: cart.subtotalCents / 100, member: cart.isMember });
    try {
      const res = await fetch('/api/shop/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: lines }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
        unavailable?: Array<{ sku: string; available: number }>;
      };
      if (res.status === 409 && data.unavailable) {
        setUnavailable(data.unavailable.map((u) => u.sku));
        setError("Some items just sold out or changed. We've highlighted them — adjust and try again.");
        cart.refresh();
        return;
      }
      if (!res.ok || !data.url) {
        setError(data.error ?? "Couldn't start checkout just now. Give it another go, or email hello@himayat.com.au if it keeps happening.");
        return;
      }
      window.location.assign(data.url);
    } catch {
      setError("Couldn't start checkout just now. Give it another go, or email hello@himayat.com.au if it keeps happening.");
    } finally {
      setCheckingOut(false);
    }
  }

  if (!ready || (cart.loading && cart.rows.length === 0 && lines.length > 0)) {
    return <p className="shop-muted">Loading your cart…</p>;
  }

  if (lines.length === 0) {
    return (
      <div className="shop-empty" data-testid="cart-empty">
        <h2>Your cart&apos;s empty.</h2>
        <p>Good things come to those who browse.</p>
        <Link href="/shop" className="btn btn-primary">
          Browse the shop
        </Link>
      </div>
    );
  }

  return (
    <div className="shop-cart">
      <div className="shop-cart-main">
        {cancelled && <p className="shop-notice">No charge was made — your cart&apos;s exactly as you left it.</p>}
        {cart.notices.map((n) => (
          <p key={n} className="shop-notice">
            {n}
          </p>
        ))}
        {cart.error && <p className="shop-error">{cart.error}</p>}
        <ul className="shop-lines">
          {cart.rows.map((row) => (
            <LineItem key={row.sku} row={row} highlight={unavailable.includes(row.sku)} />
          ))}
        </ul>
      </div>

      <aside className="shop-summary" aria-label="Order summary">
        <h2>Summary</h2>
        <dl>
          {cart.savingsCents > 0 && (
            <>
              <dt>Items</dt>
              <dd>{formatAud(cart.listSubtotalCents)}</dd>
              <dt>Member savings</dt>
              <dd className="shop-savings">−{formatAud(cart.savingsCents)}</dd>
            </>
          )}
          <dt>Subtotal</dt>
          <dd>
            <strong>{formatAud(cart.subtotalCents)}</strong>
          </dd>
          <dt>Shipping</dt>
          <dd className="shop-muted">Calculated at checkout</dd>
        </dl>
        <p className="shop-fine">Australia only. Prices include GST. You&apos;ll pay securely on Stripe.</p>
        {error && (
          <p className="shop-error" role="alert">
            {error}
          </p>
        )}
        <button
          type="button"
          className="btn btn-primary shop-checkout"
          onClick={checkout}
          disabled={checkingOut || cart.blocked || cart.rows.length === 0}
          data-testid="checkout"
        >
          {checkingOut ? 'Heading to checkout…' : 'Checkout'}
        </button>
        {cart.blocked && <p className="shop-hint">Remove sold-out items to continue.</p>}
        {!cart.isMember && cart.rows.some((r) => r.memberPriceCents === null) && (
          <p className="shop-fine">
            Members with a paid plan get a discount on merch. <Link href="/pricing">See plans</Link>.
          </p>
        )}
        <Link href="/shop" className="shop-continue">
          ← Keep browsing
        </Link>
      </aside>
    </div>
  );
}
