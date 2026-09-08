// Ops stock levels per SKU. Rows are created automatically (stock 0) when a
// product is saved in Payload; staff set and adjust counts here.

import Link from 'next/link';
import { listInventory } from '@/lib/db/inventory';
import InventoryRow from './InventoryRow';

export const dynamic = 'force-dynamic';

export default async function OpsInventoryPage() {
  const rows = await listInventory();
  const lowCount = rows.filter((r) => r.stock > 0 && r.stock <= 5).length;
  const outCount = rows.filter((r) => r.stock === 0).length;

  return (
    <>
      <div className="gh-ops-head-inner">
        <h1>Inventory</h1>
        <p>
          Stock per SKU. Products and variants are edited in the <Link href="/admin/collections/products">CMS</Link>; stock lives here so the
          Stripe webhook can decrement it safely. {rows.length} SKU{rows.length === 1 ? '' : 's'} · {outCount} out of stock · {lowCount} low.
        </p>
      </div>

      <div className="gh-ops-filterbar">
        <Link href="/ops/orders" className="gh-ops-pill">
          ← Orders
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="gh-ops-empty">
          <p>No SKUs yet. Create a product in the CMS and its variants will appear here.</p>
        </div>
      ) : (
        <div className="gh-ops-table-wrap">
          <table className="gh-ops-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Stock</th>
                <th>Adjust</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <InventoryRow key={r.sku} sku={r.sku} productSlug={r.productSlug} stock={r.stock} updatedAt={r.updatedAt.toISOString()} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
