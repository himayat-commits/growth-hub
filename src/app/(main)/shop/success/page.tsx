import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type Stripe from 'stripe';
import { withAuth } from '@/lib/auth/with-auth';
import { getStripe } from '@/lib/stripe';
import { getOrderBySessionId, getOrderItems } from '@/lib/db/orders';
import { fulfilOrderFromSession, isShopSession } from '@/lib/shop/fulfil-order';
import { formatAud, gstComponentCents } from '@/lib/shop/pricing';
import TrackOnMount from '@/components/TrackOnMount';
import { OrderStatusBadge } from '@/components/shop/OrderStatusBadge';
import ClearCartOnMount from './ClearCartOnMount';

// Post-checkout landing. Stripe's success_url brings the buyer here with the
// session id. We fulfil the order from the session BEFORE reading it back —
// so the page never shows "pending" while the webhook is still in flight.
// fulfilOrderFromSession is idempotent; the webhook is the safety net.

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Thanks for your order — Growth Hub Shop',
  robots: { index: false, follow: false },
};

function maskEmail(email: string | null | undefined): string {
  if (!email) return 'your email';
  const [u, d] = email.split('@');
  if (!u || !d) return email;
  return `${u.slice(0, 2)}${'•'.repeat(Math.max(1, Math.min(6, u.length - 2)))}@${d}`;
}

export default async function ShopSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  if (!sessionId || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) redirect('/shop');

  // Stripe failures must never block the page. redirect() throws, so the
  // ownership check lives outside the try.
  let session: Stripe.Checkout.Session | null = null;
  try {
    session = await getStripe().checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'shipping_cost.shipping_rate'],
    });
  } catch {
    session = null;
  }
  if (session && !isShopSession(session)) redirect('/shop');

  // Members may only view their own sessions; guests hold the unguessable id.
  const { user } = await withAuth().catch(() => ({ user: null }));
  if (session?.metadata?.userId && session.metadata.userId !== (user?.id ?? '')) redirect('/shop');

  if (session) {
    try {
      await fulfilOrderFromSession(session);
    } catch {
      // Webhook retries converge the row.
    }
  }

  const order = await getOrderBySessionId(sessionId).catch(() => null);
  const items = order ? await getOrderItems(order.id).catch(() => []) : [];
  const paid = order ? order.status !== 'pending' && order.status !== 'cancelled' : false;
  const email = order?.email ?? session?.customer_details?.email ?? null;
  const total = order?.totalCents ?? session?.amount_total ?? null;

  return (
    <main className="shop shop-success">
      <ClearCartOnMount />
      <TrackOnMount
        event="shop_purchase"
        properties={{ orderId: order?.orderNumber ?? null, value: total !== null ? total / 100 : undefined, currency: 'AUD' }}
      />
      <div className="wrap shop-success-wrap">
        <p className="shop-eyebrow">Shop</p>
        <h1 className="shop-h1 shop-h1-sm">Thanks — {paid ? "your order's confirmed." : "we're confirming your order."}</h1>
        <p className="shop-lead">
          {order?.orderNumber ? (
            <>
              Order <strong>{order.orderNumber}</strong>.{' '}
            </>
          ) : null}
          A receipt is on its way to <strong>{maskEmail(email)}</strong>. We&apos;ll email again with tracking once it ships.
        </p>

        {!paid && (
          <p className="shop-notice" role="status">
            Payment went through and Stripe is finalising things. This takes a few seconds — your confirmation email is on its way.
          </p>
        )}

        {order && items.length > 0 && (
          <div className="shop-receipt">
            <div className="shop-receipt-head">
              <span>Order summary</span>
              <OrderStatusBadge status={order.status} />
            </div>
            <ul className="shop-receipt-lines">
              {items.map((i) => (
                <li key={i.id}>
                  <span>
                    {i.qty} × {i.nameSnapshot}
                    {i.variantLabelSnapshot ? <em> · {i.variantLabelSnapshot}</em> : null}
                  </span>
                  <span>{formatAud(i.unitCents * i.qty)}</span>
                </li>
              ))}
            </ul>
            <dl className="shop-receipt-totals">
              <dt>Subtotal</dt>
              <dd>{formatAud(order.subtotalCents)}</dd>
              {order.discountCents > 0 && (
                <>
                  <dt>Member savings</dt>
                  <dd className="shop-savings">−{formatAud(order.discountCents)}</dd>
                </>
              )}
              <dt>Shipping{order.shippingRateLabel ? ` (${order.shippingRateLabel})` : ''}</dt>
              <dd>{formatAud(order.shippingCents)}</dd>
              <dt>Total paid</dt>
              <dd>
                <strong>{formatAud(order.totalCents)}</strong>
              </dd>
            </dl>
            <p className="shop-fine">Includes GST of {formatAud(gstComponentCents(order.totalCents))}. Your email receipt is your tax invoice.</p>
          </div>
        )}

        <div className="shop-success-ctas">
          {user ? (
            <Link href="/orders" className="btn btn-primary">
              View your orders
            </Link>
          ) : (
            <Link href="/sign-up?redirect_url=%2Forders" className="btn btn-primary">
              Join free to track orders
            </Link>
          )}
          <Link href="/shop" className="btn btn-secondary">
            Keep browsing
          </Link>
        </div>
      </div>
    </main>
  );
}
