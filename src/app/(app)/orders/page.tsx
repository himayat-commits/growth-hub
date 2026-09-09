import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { withAuth } from '@/lib/auth/with-auth';
import { getOrdersForUser } from '@/lib/db/orders';
import { formatAud } from '@/lib/shop/pricing';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { IcoOrdersNav } from '@/components/dashboard/Icons';
import { OrderStatusBadge } from '@/components/shop/OrderStatusBadge';

export const metadata: Metadata = { title: 'My Orders — Growth Hub' };
export const dynamic = 'force-dynamic';

const MARKETING_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://thegrowthhub.com.au';

export default async function OrdersPage() {
  const { user } = await withAuth();
  if (!user) redirect('/sign-in?redirect_url=/orders');

  // Guest orders are matched by email. Only trust the email once WorkOS has
  // verified it, otherwise signing up as victim@x would surface the victim's
  // guest orders (name, address, phone).
  const orders = await getOrdersForUser(user.id, user.emailVerified ? user.email : null);
  const fmt = new Intl.DateTimeFormat('en-AU', { dateStyle: 'medium' });

  return (
    <>
      <PageHeader
        kicker="Merch"
        title="Your orders"
        sub={
          orders.length === 0
            ? "No orders yet. When you buy something from the shop it'll show up here with tracking."
            : 'Everything you’ve bought from the Growth Hub Shop, with tracking once it ships.'
        }
        actions={
          <a className="gh-btn ghost" href={`${MARKETING_SITE_URL}/shop`}>
            <IcoOrdersNav />
            Visit the shop
          </a>
        }
      />

      {orders.length === 0 ? (
        <div className="gh-empty">
          <div className="gh-empty-ic">
            <IcoOrdersNav />
          </div>
          <div className="gh-empty-h">Nothing here yet</div>
          <p className="gh-empty-p">Members with a paid plan get a discount on every order.</p>
          <a className="gh-empty-cta" href={`${MARKETING_SITE_URL}/shop`}>
            Browse the shop
          </a>
        </div>
      ) : (
        <div className="gh-card">
          <table className="gh-table" data-testid="orders-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Placed</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <strong>{o.orderNumber}</strong>
                  </td>
                  <td>{fmt.format(o.createdAt)}</td>
                  <td>
                    <OrderStatusBadge status={o.status} />
                  </td>
                  <td style={{ textAlign: 'right' }}>{formatAud(o.totalCents)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <Link href={`/orders/${o.id}`} className="gh-link">
                      Details →
                    </Link>
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
