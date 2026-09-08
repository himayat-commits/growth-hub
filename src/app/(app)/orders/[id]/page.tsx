import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { withAuth } from '@/lib/auth/with-auth';
import { getOrderForUser } from '@/lib/db/orders';
import { formatAud, gstComponentCents } from '@/lib/shop/pricing';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { OrderStatusBadge } from '@/components/shop/OrderStatusBadge';

export const metadata: Metadata = { title: 'Order — Growth Hub' };
export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;

interface Address {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
}

export default async function OrderDetailPage({ params }: { params: Params }) {
  const { user } = await withAuth();
  if (!user) redirect('/sign-in?redirect_url=/orders');

  const { id: raw } = await params;
  const id = Number.parseInt(raw, 10);
  if (!Number.isFinite(id)) notFound();

  const found = await getOrderForUser(id, user.id, user.email);
  if (!found) notFound();
  const { order, items } = found;
  const addr = (order.shippingAddress ?? {}) as Address;
  const fmt = new Intl.DateTimeFormat('en-AU', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <>
      <PageHeader
        kicker="Merch"
        title={`Order ${order.orderNumber ?? `#${order.id}`}`}
        sub={`Placed ${fmt.format(order.createdAt)}`}
        actions={<OrderStatusBadge status={order.status} />}
      />

      <p style={{ marginTop: -8 }}>
        <Link href="/orders" className="gh-link">← All orders</Link>
      </p>

      <div className="gh-grid-2">
        <div className="gh-card">
          <div className="gh-card-h">Items</div>
          <ul className="gh-list">
            {items.map((i) => (
              <li key={i.id} className="gh-list-row">
                <div>
                  <strong>{i.nameSnapshot}</strong>
                  {i.variantLabelSnapshot && <div className="gh-muted">{i.variantLabelSnapshot}</div>}
                  <div className="gh-muted">
                    {i.qty} × {formatAud(i.unitCents)}
                    {i.unitCents < i.listUnitCents && <> · member price (was {formatAud(i.listUnitCents)})</>}
                  </div>
                </div>
                <div>{formatAud(i.unitCents * i.qty)}</div>
              </li>
            ))}
          </ul>
          <dl className="gh-totals">
            <dt>Subtotal</dt>
            <dd>{formatAud(order.subtotalCents)}</dd>
            {order.discountCents > 0 && (
              <>
                <dt>Member savings</dt>
                <dd>−{formatAud(order.discountCents)}</dd>
              </>
            )}
            <dt>Shipping{order.shippingRateLabel ? ` (${order.shippingRateLabel})` : ''}</dt>
            <dd>{formatAud(order.shippingCents)}</dd>
            <dt>
              <strong>Total paid</strong>
            </dt>
            <dd>
              <strong>{formatAud(order.totalCents)}</strong>
            </dd>
          </dl>
          <p className="gh-muted" style={{ fontSize: 12 }}>
            Includes GST of {formatAud(gstComponentCents(order.totalCents))}. Your email receipt is your tax invoice.
          </p>
        </div>

        <div className="gh-card">
          <div className="gh-card-h">Delivery</div>
          {order.status === 'shipped' ? (
            <p>
              Shipped {order.shippedAt ? fmt.format(order.shippedAt) : ''}
              {order.carrier ? ` via ${order.carrier}` : ''}.
              {order.trackingNumber && (
                <>
                  {' '}
                  Tracking <strong>{order.trackingNumber}</strong>
                  {order.trackingUrl && (
                    <>
                      {' '}
                      — <a className="gh-link" href={order.trackingUrl} target="_blank" rel="noopener noreferrer">track it</a>
                    </>
                  )}
                </>
              )}
            </p>
          ) : order.status === 'paid' ? (
            <p>We&apos;re packing it now. You&apos;ll get an email with tracking once it ships.</p>
          ) : order.status === 'refunded' ? (
            <p>This order was refunded. Allow 5–10 business days for the money to land back on your card.</p>
          ) : (
            <p>This order was cancelled and you were not charged.</p>
          )}
          {(order.shippingName || addr.line1) && (
            <>
              <div className="gh-card-h" style={{ marginTop: 16 }}>Ship to</div>
              <address style={{ fontStyle: 'normal', whiteSpace: 'pre-line' }}>
                {[order.shippingName, addr.line1, addr.line2, [addr.city, addr.state, addr.postal_code].filter(Boolean).join(' '), addr.country]
                  .filter(Boolean)
                  .join('\n')}
              </address>
            </>
          )}
          <p className="gh-muted" style={{ fontSize: 12, marginTop: 16 }}>
            Something not right? Email <a className="gh-link" href="mailto:hello@himayat.com.au">hello@himayat.com.au</a> and quote your order number.
          </p>
        </div>
      </div>
    </>
  );
}
