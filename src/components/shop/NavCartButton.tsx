'use client';

// Bag icon + count badge for the marketing navbar. The shop sits in the footer
// now, so the bag only appears once the cart has something in it — and renders
// nothing until the cart has been read from localStorage (avoids a hydration
// mismatch).

import Link from 'next/link';
import { useCart } from './CartProvider';

export default function NavCartButton({ onClick }: { onClick?: () => void }) {
  const { count, ready } = useCart();
  if (!ready || count === 0) return null;
  return (
    <Link
      href="/shop/cart"
      className="nav-cart"
      aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}
      onClick={onClick}
      data-testid="nav-cart"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 8h12l-1 12H7L6 8z" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      </svg>
      <span className="nav-cart-badge" data-testid="nav-cart-count">
        {count > 99 ? '99+' : count}
      </span>
    </Link>
  );
}
