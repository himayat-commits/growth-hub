// Ops view of shop orders. Defaults to the "to ship" queue (status=paid).
// Filter via ?status=. Inline quick action to mark shipped; full detail at
// /ops/orders/[id].

import Link from 'next/link';
import { listOrders } from '@/lib/db/orders';
import { formatAud } from '@/lib/shop/pricing';
import type { OrderStatus } from '@/lib/shop/types';
import { OrderStatusBadge } from '@/components/shop/OrderStatusBadge';
import OrderRowActions from './OrderRowActions';

export const dynamic = 'force-dynamic';

const STATUSES: OrderStatus[] = ['paid', 'shipped', 'pending', 'cancelled', 'refunded'];

export default async function OpsOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: rawStatus } = await searchParams;
  // Default to the queue that needs action; "all" shows everything.
  const status: OrderStatus | null =
    rawStatus === 'all' ? null : (STATUSES as string[]).includes(rawStatus ?? '') ? (rawStatus as OrderStatus) : 'paid';

  const rows = await listOrders({ status, limit: 200 });
  const fmt = new Intl.DateTimeFormat('en-AU', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <>
      <div className="gh-ops-head-inner">
        <h1>Shop orders</h1>
        <p>
          Paid orders are the queue to ship. Mark shipped with a tracking number and the buyer is emailed. {rows.length} row
          {rows.length === 1 ? '' : 's'} {status ? `(filtered: ${status})` : '(all)'}.
        </p>
      </div>

      <div className="gh-ops-filterbar">
        <Link href="/ops/orders?status=all" className={'gh-ops-pill' + (!status ? ' is-on' : '')}>
          All
        </Link>
        {STATUSES.map((s) => (
          <Link key={s} href={`/ops/orders?status=${s}`} className={'gh-ops-pill' + (status === s ? ' is-on' : '')}>
            {s === 'paid' ? 'to ship' : s}
          </Link>
        ))}
        <Link href="/ops/inventory" className="gh-ops-pill" style={{ marginLeft: 'auto' }}>
          Inventory →
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="gh-ops-empty">
          <p>{status === 'paid' ? 'Nothing to ship. Enjoy the quiet.' : `No orders ${status ? `with status "${status}"` : 'yet'}.`}</p>
        </div>
      ) : (
        <div className="gh-ops-table-wrap">
          <table className="gh-ops-table">
            <thead>
              <tr>
                <th>Placed</th>
                <th>Order</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ order: o, businessName }) => (
                <tr key={o.id}>
                  <td>{fmt.format(o.createdAt)}</td>
                  <td>
                    <Link href={`/ops/orders/${o.id}`}>
                      <strong>{o.orderNumber}</strong>
                    </Link>
                    {o.fulfilmentFlag === 'oversold' && (
                      <div className="gh-ops-meta" style={{ color: 'var(--plum)' }}>
                        ⚠ oversold — restock or refund
                      </div>
                    )}
                    {o.memberDiscountApplied && <div className="gh-ops-meta">member price</div>}
                  </td>
                  <td>
                    <strong>{o.shippingName ?? businessName ?? '—'}</strong>
                    <div className="gh-ops-meta">{o.email}</div>
                  </td>
                  <td>
                    {formatAud(o.totalCents)}
                    {o.shippingRateLabel && <div className="gh-ops-meta">{o.shippingRateLabel}</div>}
                  </td>
                  <td>
                    <OrderStatusBadge status={o.status} variant="ops" />
                  </td>
                  <td>
                    <OrderRowActions id={o.id} status={o.status as OrderStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
