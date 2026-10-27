// Price display. No hooks — usable from server and client components.
//
//   Member (discount applies):  ~~A$35.00~~  A$31.50  [Member price]
//   Everyone else:                A$35.00
//
// Paid plans are closed while the portal is parked, so there's no "Members
// pay …" nudge any more; the member branch only shows for an existing active
// subscriber, matching what shop checkout still charges them.

import { formatAud } from '@/lib/shop/pricing';

export interface PriceProps {
  priceCents: number;
  memberPriceCents: number;
  isMember: boolean;
  /** "from" prefix for cards with several variant prices. */
  from?: boolean;
  size?: 'sm' | 'lg';
}

export function Price({ priceCents, memberPriceCents, isMember, from = false, size = 'sm' }: PriceProps) {
  const hasDiscount = memberPriceCents < priceCents;
  const cls = `shop-price shop-price-${size}`;

  if (isMember && hasDiscount) {
    return (
      <span className={cls} aria-label={`Member price ${formatAud(memberPriceCents)}, usually ${formatAud(priceCents)}`}>
        {from && <span className="shop-price-from">from</span>}
        <s className="shop-price-was">{formatAud(priceCents)}</s>
        <strong className="shop-price-now">{formatAud(memberPriceCents)}</strong>
        <span className="shop-pill lime">Member price</span>
      </span>
    );
  }

  return (
    <span className={cls}>
      {from && <span className="shop-price-from">from</span>}
      <strong className="shop-price-now">{formatAud(priceCents)}</strong>
    </span>
  );
}
