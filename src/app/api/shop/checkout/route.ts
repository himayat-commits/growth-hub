// POST /api/shop/checkout — turn a cart into a Stripe Checkout Session.
//
// Guest-capable: signed-in users are recognised (and get member pricing when
// their subscription is active), everyone else supplies an email. The client
// only ever sends { sku, qty } — every price is recomputed here from the
// published catalogue, and stock is checked before we create the session.
//
// Order lifecycle: a `pending` order row is created BEFORE the session so the
// webhook and /shop/success can both find it by id (in session metadata).
// See src/lib/shop/fulfil-order.ts for the paid transition.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import { withAuth } from '@/lib/auth/with-auth';
import { getStripe } from '@/lib/stripe';
import { getSubscription, isActive } from '@/lib/subscription';
import { rateLimit, clientIp, tooManyRequests } from '@/lib/rate-limit';
import { getStockBySku } from '@/lib/db/inventory';
import { attachSession, cancelOrder, createPendingOrder, type OrderLineInput } from '@/lib/db/orders';
import { indexPublishedSkus, productImages, variantListPrice } from '@/lib/shop/catalogue';
import { memberPriceCents, variantLabel } from '@/lib/shop/pricing';
import { MAX_CART_LINES, MAX_QTY_PER_LINE } from '@/lib/shop/types';

export const runtime = 'nodejs';

const BodySchema = z.object({
  items: z
    .array(
      z.object({
        sku: z.string().trim().min(1).max(64),
        qty: z.number().int().min(1).max(MAX_QTY_PER_LINE),
      }),
    )
    .min(1)
    .max(MAX_CART_LINES),
  email: z.string().trim().email().max(254).optional(),
});

const SESSION_TTL_SECONDS = 30 * 60;

export async function POST(req: NextRequest) {
  const rl = rateLimit(`shop-checkout:${clientIp(req)}`, 10, 60_000);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Your cart looks invalid. Refresh and try again.' }, { status: 400 });
  }

  const shippingStandard = process.env.STRIPE_SHIPPING_RATE_STANDARD;
  const shippingExpress = process.env.STRIPE_SHIPPING_RATE_EXPRESS;
  if (!shippingStandard || !shippingExpress) {
    console.error('[shop.checkout] STRIPE_SHIPPING_RATE_* not configured');
    return NextResponse.json({ error: 'The shop is not accepting orders right now.' }, { status: 503 });
  }

  // Optional auth — guests are welcome.
  const { user } = await withAuth().catch(() => ({ user: null }));
  const sub = user ? await getSubscription(user.id).catch(() => null) : null;
  const isMember = isActive(sub);
  const email = (user?.email ?? parsed.data.email ?? '').toLowerCase();
  if (!email) {
    return NextResponse.json({ error: 'We need an email address for your receipt.' }, { status: 400 });
  }

  // Merge duplicate SKUs, then re-price from the catalogue.
  const merged = new Map<string, number>();
  for (const it of parsed.data.items) {
    const sku = it.sku.toUpperCase();
    merged.set(sku, Math.min(MAX_QTY_PER_LINE, (merged.get(sku) ?? 0) + it.qty));
  }

  let bySku: Awaited<ReturnType<typeof indexPublishedSkus>>;
  let stock: Map<string, number>;
  try {
    [bySku, stock] = await Promise.all([indexPublishedSkus(), getStockBySku([...merged.keys()])]);
  } catch (err) {
    console.error('[shop.checkout] catalogue/stock lookup failed', err);
    return NextResponse.json({ error: 'The shop is not accepting orders right now.' }, { status: 503 });
  }

  const unavailable: Array<{ sku: string; available: number }> = [];
  const lines: OrderLineInput[] = [];
  for (const [sku, qty] of merged) {
    const hit = bySku.get(sku);
    const available = hit ? stock.get(sku) ?? 0 : 0;
    if (!hit || available < qty) {
      unavailable.push({ sku, available });
      continue;
    }
    const list = variantListPrice(hit.product, hit.variant);
    const unit = isMember ? memberPriceCents(list, hit.product.memberDiscountPct ?? 0) : list;
    lines.push({
      productSlug: hit.product.slug!,
      sku,
      name: hit.product.name,
      variantLabel: variantLabel(hit.variant),
      imageUrl: productImages(hit.product)[0]?.url ?? null,
      listUnitCents: list,
      unitCents: unit,
      qty,
    });
  }
  if (unavailable.length) {
    return NextResponse.json(
      { error: 'insufficient_stock', unavailable },
      { status: 409 },
    );
  }

  const order = await createPendingOrder({
    userId: user?.id ?? null,
    email,
    memberDiscountApplied: isMember && lines.some((l) => l.unitCents < l.listUnitCents),
    lines,
  });

  // Optional free shipping: swap Standard for the $0 rate over the threshold.
  const freeRate = process.env.STRIPE_SHIPPING_RATE_FREE;
  const threshold = Number(process.env.SHOP_FREE_SHIPPING_THRESHOLD_CENTS ?? '');
  const charged = lines.reduce((n, l) => n + l.unitCents * l.qty, 0);
  const standardRate = freeRate && Number.isFinite(threshold) && threshold > 0 && charged >= threshold ? freeRate : shippingStandard;

  const gstRate = process.env.STRIPE_TAX_RATE_GST_INCLUSIVE;
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin;

  try {
    const session = await getStripe().checkout.sessions.create(
      {
        mode: 'payment',
        client_reference_id: String(order.id),
        metadata: { kind: 'shop_order', orderId: String(order.id), userId: user?.id ?? '' },
        payment_intent_data: {
          metadata: { kind: 'shop_order', orderId: String(order.id) },
        },
        // `customer` and `customer_email` are mutually exclusive in Stripe.
        ...(sub?.stripeCustomerId
          ? { customer: sub.stripeCustomerId }
          : { customer_email: email, customer_creation: 'always' as const }),
        line_items: lines.map((l) => ({
          quantity: l.qty,
          ...(gstRate ? { tax_rates: [gstRate] } : {}),
          price_data: {
            currency: 'aud',
            unit_amount: l.unitCents,
            product_data: {
              name: l.name,
              ...(l.variantLabel || l.unitCents < l.listUnitCents
                ? {
                    description: [l.variantLabel, l.unitCents < l.listUnitCents ? 'Member price' : null]
                      .filter(Boolean)
                      .join(' · '),
                  }
                : {}),
              ...(l.imageUrl && /^https:\/\//.test(l.imageUrl) ? { images: [l.imageUrl] } : {}),
              metadata: { sku: l.sku, productSlug: l.productSlug },
            },
          },
        })),
        shipping_address_collection: { allowed_countries: ['AU'] },
        shipping_options: [{ shipping_rate: standardRate }, { shipping_rate: shippingExpress }],
        phone_number_collection: { enabled: true },
        invoice_creation: { enabled: true },
        allow_promotion_codes: false,
        expires_at: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
        success_url: `${origin}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/shop/cart?cancelled=1`,
      },
      { idempotencyKey: `gh-shop-${order.id}` },
    );

    if (!session.url) throw new Error('Stripe did not return a checkout URL');
    await attachSession(order.id, session.id);
    return NextResponse.json({ url: session.url, orderId: order.id });
  } catch (err) {
    console.error('[shop.checkout] session create failed', err);
    Sentry.captureException(err, { tags: { area: 'shop.checkout' }, extra: { orderId: order.id } });
    await cancelOrder(order.id, 'Stripe session creation failed').catch(() => undefined);
    return NextResponse.json(
      { error: "Couldn't start checkout just now. Give it another go, or email hello@himayat.com.au if it keeps happening." },
      { status: 502 },
    );
  }
}
