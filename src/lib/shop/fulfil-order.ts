// Turn a paid Stripe Checkout Session into a fulfilled order. Shared by the
// Stripe webhook (canonical) and /shop/success (beats the webhook race, the
// same way /onboarding/upgraded calls syncSubscription).
//
// Idempotent: step 1 is a conditional UPDATE that only matches while the
// order is still `pending`, so whichever caller lands second is a no-op.
// Only step 1 may throw (→ webhook 500 → Stripe retry). Everything after the
// claim is best-effort because the customer's money has already been taken.

import 'server-only';
import type Stripe from 'stripe';
import * as Sentry from '@sentry/nextjs';
import { claimOrderPaid, flagOrder, getOrderItems, getOrderById } from '@/lib/db/orders';
import { decrementStockAtomic, OversoldError } from '@/lib/db/inventory';
import { createNotification } from '@/lib/db/notifications';
import { sendServerConversion } from '@/lib/analytics/server-conversions';
import { sendOrderConfirmationEmail, sendOversoldAlert } from '@/lib/shop/emails';

/** Shipping rate labels. The webhook payload doesn't expand the rate object,
 *  so map the configured IDs to display names instead of an extra API call. */
export function shippingRateLabel(rateId: string | null): string | null {
  if (!rateId) return null;
  if (rateId === process.env.STRIPE_SHIPPING_RATE_STANDARD) return 'Standard';
  if (rateId === process.env.STRIPE_SHIPPING_RATE_EXPRESS) return 'Express';
  if (rateId === process.env.STRIPE_SHIPPING_RATE_FREE) return 'Free shipping';
  return null;
}

function idOf(x: string | { id: string } | null | undefined): string | null {
  if (!x) return null;
  return typeof x === 'string' ? x : x.id;
}

export function orderIdFromSession(session: Stripe.Checkout.Session): number | null {
  const raw = session.metadata?.orderId ?? session.client_reference_id ?? null;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function isShopSession(session: Stripe.Checkout.Session): boolean {
  return session.mode === 'payment' && session.metadata?.kind === 'shop_order';
}

export async function fulfilOrderFromSession(
  session: Stripe.Checkout.Session,
  opts: { stripeEventId?: string } = {},
): Promise<{ claimed: boolean; orderId: number | null }> {
  const orderId = orderIdFromSession(session);
  if (!orderId) throw new Error('shop_order session without a usable orderId');
  if (session.payment_status !== 'paid') return { claimed: false, orderId };

  // Stripe SDK 22: shipping details live under collected_information.
  const shipping = (session as unknown as {
    collected_information?: { shipping_details?: { name?: string | null; address?: unknown } | null } | null;
  }).collected_information?.shipping_details ?? null;
  const shippingRate = session.shipping_cost?.shipping_rate ?? null;
  const shippingRateId = idOf(shippingRate as string | { id: string } | null);
  const expandedLabel =
    shippingRate && typeof shippingRate === 'object' ? (shippingRate as Stripe.ShippingRate).display_name ?? null : null;

  // 1. Claim pending → paid. Exactly one caller wins.
  const claimed = await claimOrderPaid(orderId, {
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: idOf(session.payment_intent as string | { id: string } | null),
    stripeCustomerId: idOf(session.customer as string | { id: string } | null),
    email: session.customer_details?.email?.toLowerCase() ?? undefined,
    shippingName: shipping?.name ?? session.customer_details?.name ?? null,
    shippingPhone: session.customer_details?.phone ?? null,
    shippingAddress: shipping?.address ?? null,
    shippingCents: session.shipping_cost?.amount_total ?? 0,
    shippingRateId,
    shippingRateLabel: expandedLabel ?? shippingRateLabel(shippingRateId),
    totalCents: typeof session.amount_total === 'number' ? session.amount_total : undefined,
  });
  if (!claimed) return { claimed: false, orderId };

  // 2. Decrement stock — all-or-nothing. Failure flags the order for ops;
  //    it must NOT throw (money is taken; a retry would not help).
  try {
    const items = await getOrderItems(orderId);
    await decrementStockAtomic(items.map((i) => ({ sku: i.sku, qty: i.qty })));
  } catch (err) {
    const reason = err instanceof OversoldError ? err.message : 'stock decrement error';
    await flagOrder(orderId, 'oversold').catch(() => undefined);
    Sentry.captureException(err, { tags: { area: 'shop.fulfil', phase: 'stock' }, extra: { orderId } });
    void sendOversoldAlert(orderId, reason);
  }

  // 3. Side effects — best-effort.
  await sendOrderConfirmationEmail(orderId);

  if (opts.stripeEventId) {
    void sendServerConversion({
      eventId: opts.stripeEventId,
      eventName: 'Purchase',
      email: session.customer_details?.email ?? null,
      phone: session.customer_details?.phone ?? null,
      externalId: idOf(session.customer as string | { id: string } | null),
      value: typeof session.amount_total === 'number' ? session.amount_total / 100 : undefined,
      currency: session.currency?.toUpperCase() ?? 'AUD',
      sourceUrl: session.success_url ?? undefined,
    }).catch(() => undefined);
  }

  const userId = session.metadata?.userId || null;
  if (userId) {
    const order = await getOrderById(orderId).catch(() => null);
    const num = order?.orderNumber ?? `#${orderId}`;
    await createNotification({
      userId,
      kind: 'message_received',
      title: 'Order confirmed',
      body: `Thanks — order ${num} is confirmed. We'll let you know when it ships.`,
      href: '/orders',
    }).catch(() => undefined);
  }

  return { claimed: true, orderId };
}
