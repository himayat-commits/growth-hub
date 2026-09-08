// Ops order detail: full line items, shipping address, Stripe links, and the
// fulfilment form.

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getOrderById, getOrderItems } from '@/lib/db/orders';
import { formatAud } from '@/lib/shop/pricing';
import type { OrderStatus } from '@/lib/shop/types';
import { OrderStatusBadge } from '@/components/shop/OrderStatusBadge';
import FulfilOrderForm from './FulfilOrderForm';

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

export default async function OpsOrderDetailPage({ params }: { params: Params }) {
  const { id: raw } = await params;
  const id = Number.parseInt(raw, 10);
  if (!Number.isFinite(id)) notFound();
  const order = await getOrderById(id);
  if (!order) notFound();
  const items = await getOrderItems(id);
  const addr = (order.shippingAddress ?? {}) as Address;
  const fmt = new Intl.DateTimeFormat('en-AU', { dateStyle: 'medium', timeStyle: 'short' });
  const stripeBase = 'https://dashboard.stripe.com';

  return (
    <>
      <div className="gh-ops-head-inner">
        <p>
          <Link href="/ops/orders">← Shop orders</Link>
        </p>
        <h1>
          Order {order.orderNumber} <OrderStatusBadge status={order.status} variant="ops" />
        </h1>
        <p>
          Placed {fmt.format(order.createdAt)}
          {order.paidAt ? ` · paid ${fmt.format(order.paidAt)}` : ''}
          {order.shippedAt ? ` · shipped ${fmt.format(order.shippedAt)}` : ''}
          {order.refundedAt ? ` · refunded ${fmt.format(order.refundedAt)}` : ''}
        </p>
        {order.fulfilmentFlag === 'oversold' && (
          <p style={{ color: 'var(--plum)' }}>
            ⚠ Paid but stock could not be decremented. Either restock in <Link href="/ops/inventory">Inventory</Link> and ship, or refund in Stripe (the
            webhook marks it refunded).
          </p>
        )}
      </div>

      <div className="gh-ops-table-wrap" style={{ marginBottom: 16 }}>
        <table className="gh-ops-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>SKU</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Line</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id}>
                <td>
                  <strong>{i.nameSnapshot}</strong>
                  {i.variantLabelSnapshot && <div className="gh-ops-meta">{i.variantLabelSnapshot}</div>}
                </td>
                <td className="gh-ops-meta">{i.sku}</td>
                <td>{i.qty}</td>
                <td>
                  {formatAud(i.unitCents)}
                  {i.unitCents < i.listUnitCents && <div className="gh-ops-meta">list {formatAud(i.listUnitCents)}</div>}
                </td>
                <td>{formatAud(i.unitCents * i.qty)}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={4} style={{ textAlign: 'right' }} className="gh-ops-meta">
                Subtotal {formatAud(order.subtotalCents)}
                {order.discountCents > 0 ? ` · member savings −${formatAud(order.discountCents)}` : ''} · shipping {formatAud(order.shippingCents)}
                {order.shippingRateLabel ? ` (${order.shippingRateLabel})` : ''}
              </td>
              <td>
                <strong>{formatAud(order.totalCents)}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <section className="gh-ops-empty" style={{ textAlign: 'left' }}>
          <h2 style={{ marginTop: 0 }}>Customer</h2>
          <p>
            <strong>{order.shippingName ?? '—'}</strong>
            <br />
            <a href={`mailto:${order.email}`}>{order.email}</a>
            {order.shippingPhone && (
              <>
                <br />
                {order.shippingPhone}
              </>
            )}
          </p>
          <h3>Ship to</h3>
          <address style={{ fontStyle: 'normal', whiteSpace: 'pre-line' }}>
            {[addr.line1, addr.line2, [addr.city, addr.state, addr.postal_code].filter(Boolean).join(' '), addr.country].filter(Boolean).join('\n') || '—'}
          </address>
          <p className="gh-ops-meta">
            {order.userId ? `Member ${order.userId.slice(0, 14)}…` : 'Guest checkout'}
            {order.stripePaymentIntentId && (
              <>
                {' · '}
                <a href={`${stripeBase}/payments/${order.stripePaymentIntentId}`} target="_blank" rel="noopener noreferrer">
                  Stripe payment ↗
                </a>
              </>
            )}
          </p>
          {order.notes && (
            <>
              <h3>Notes</h3>
              <p style={{ whiteSpace: 'pre-wrap' }}>{order.notes}</p>
            </>
          )}
        </section>

        <section className="gh-ops-empty" style={{ textAlign: 'left' }}>
          <h2 style={{ marginTop: 0 }}>Fulfilment</h2>
          <FulfilOrderForm
            id={order.id}
            status={order.status as OrderStatus}
            carrier={order.carrier}
            trackingNumber={order.trackingNumber}
            trackingUrl={order.trackingUrl}
          />
        </section>
      </div>
    </>
  );
}
