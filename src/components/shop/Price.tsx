// Price display. No hooks — usable from server and client components.
//
//   Member (discount applies):  ~~A$35.00~~  A$31.50  [Member price]
//   Non-member (discount exists): A$35.00  "Members pay A$31.50"
//   No discount:                  A$35.00

import Link from 'next/link';
import { formatAud } from '@/lib/shop/pricing';

export interface PriceProps {
  priceCents: number;
  memberPriceCents: number;
  isMember: boolean;
  /** "from" prefix for cards with several variant prices. */
  from?: boolean;
  /** Show the "Members pay …" nudge for non-members. */
  nudge?: boolean;
  size?: 'sm' | 'lg';
}

export function Price({ priceCents, memberPriceCents, isMember, from = false, nudge = false, size = 'sm' }: PriceProps) {
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
      {nudge && hasDiscount && !isMember && (
        <span className="shop-price-nudge">
          Members pay {formatAud(memberPriceCents)}. <Link href="/sign-up?redirect_url=%2Fshop">Join free</Link> or{' '}
          <Link href="/pricing">pick a plan</Link>.
        </span>
      )}
    </span>
  );
}
