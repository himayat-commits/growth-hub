// GET /api/shop/products?skus=A,B,C — server-authoritative hydration for the
// cart. The cart only stores { sku, qty }; names, prices, images, stock and
// member pricing come from here every time the cart page mounts. Member
// status is resolved server-side from the session cookie.

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getSubscription, isActive } from '@/lib/subscription';
import { getStockBySku } from '@/lib/db/inventory';
import { indexPublishedSkus, productImages, variantListPrice } from '@/lib/shop/catalogue';
import { memberPriceCents, variantLabel } from '@/lib/shop/pricing';
import type { HydratedLine, HydrateResponse } from '@/lib/shop/types';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('skus') ?? '';
  const skus = [...new Set(raw.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean))].slice(0, 50);

  const { user } = await withAuth().catch(() => ({ user: null }));
  const sub = user ? await getSubscription(user.id).catch(() => null) : null;
  const isMember = isActive(sub);

  if (!skus.length) {
    return NextResponse.json({ items: [], isMember, missing: [] } satisfies HydrateResponse, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  let bySku: Awaited<ReturnType<typeof indexPublishedSkus>>;
  let stock: Map<string, number>;
  try {
    [bySku, stock] = await Promise.all([indexPublishedSkus(), getStockBySku(skus)]);
  } catch (err) {
    // Inventory table unreachable (e.g. migration not yet applied). Tell the
    // cart to try again rather than 500 — it keeps the local lines intact.
    console.error('[shop.products] catalogue/stock lookup failed', err);
    return NextResponse.json({ error: 'The shop is temporarily unavailable.' }, { status: 503 });
  }

  const items: HydratedLine[] = [];
  const missing: string[] = [];
  for (const sku of skus) {
    const hit = bySku.get(sku);
    if (!hit) {
      missing.push(sku);
      continue;
    }
    const list = variantListPrice(hit.product, hit.variant);
    const member = memberPriceCents(list, hit.product.memberDiscountPct ?? 0);
    const available = stock.get(sku) ?? 0;
    items.push({
      sku,
      productSlug: hit.product.slug!,
      name: hit.product.name,
      variantLabel: variantLabel(hit.variant),
      imageUrl: productImages(hit.product)[0]?.url ?? null,
      priceCents: list,
      memberPriceCents: isMember && member < list ? member : null,
      stock: available,
      available: available > 0,
    });
  }

  return NextResponse.json({ items, isMember, missing } satisfies HydrateResponse, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
