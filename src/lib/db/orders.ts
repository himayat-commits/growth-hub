// Server-side helpers for shop orders (merch bought via /shop → Stripe
// Checkout). Companion to inventory.ts. Status machine:
//
//   pending ──(payment)──▶ paid ──(ops)──▶ shipped
//      │                    │
//      └─(session expired)─▶ cancelled      └─(Stripe refund)─▶ refunded
//
// The pending → paid step is `claimOrderPaid`: a conditional UPDATE that only
// matches while status='pending', so the webhook and the /shop/success page
// can both call it and exactly one wins.

import 'server-only';
import { and, desc, eq, or } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import {
  orderItems,
  orders,
  userProfiles,
  type Order,
  type OrderItem,
} from '@/lib/db/schema';
import type { OrderStatus } from '@/lib/shop/types';

export interface OrderLineInput {
  productSlug: string;
  sku: string;
  name: string;
  variantLabel: string | null;
  imageUrl: string | null;
  listUnitCents: number;
  unitCents: number;
  qty: number;
}

export interface CreatePendingOrderInput {
  userId: string | null;
  email: string;
  memberDiscountApplied: boolean;
  lines: OrderLineInput[];
}

/** Insert a `pending` order + its items. Totals exclude shipping (Stripe
 *  picks the rate); `totalCents` is updated from the session on payment. */
export async function createPendingOrder(input: CreatePendingOrderInput): Promise<Order> {
  const subtotal = input.lines.reduce((n, l) => n + l.listUnitCents * l.qty, 0);
  const charged = input.lines.reduce((n, l) => n + l.unitCents * l.qty, 0);
  const db = getDb();

  const inserted = await db
    .insert(orders)
    .values({
      userId: input.userId,
      email: input.email,
      status: 'pending',
      subtotalCents: subtotal,
      discountCents: subtotal - charged,
      shippingCents: 0,
      totalCents: charged,
      memberDiscountApplied: input.memberDiscountApplied,
    })
    .returning();
  const order = inserted[0];
  if (!order) throw new Error('createPendingOrder: insert returned no row');

  await db.insert(orderItems).values(
    input.lines.map((l) => ({
      orderId: order.id,
      productSlug: l.productSlug,
      sku: l.sku,
      nameSnapshot: l.name,
      variantLabelSnapshot: l.variantLabel,
      imageUrlSnapshot: l.imageUrl,
      listUnitCents: l.listUnitCents,
      unitCents: l.unitCents,
      qty: l.qty,
    })),
  );

  return order;
}

export async function attachSession(orderId: number, sessionId: string): Promise<void> {
  await getDb()
    .update(orders)
    .set({ stripeCheckoutSessionId: sessionId, updatedAt: new Date() })
    .where(eq(orders.id, orderId));
}

export interface ClaimPaidPatch {
  stripeCheckoutSessionId: string;
  stripePaymentIntentId: string | null;
  stripeCustomerId: string | null;
  email?: string;
  shippingName: string | null;
  shippingPhone: string | null;
  shippingAddress: unknown;
  shippingCents: number;
  shippingRateId: string | null;
  shippingRateLabel: string | null;
  totalCents?: number;
}

/** pending → paid. Returns true only for the caller that flipped it. */
export async function claimOrderPaid(orderId: number, patch: ClaimPaidPatch): Promise<boolean> {
  const now = new Date();
  const rows = await getDb()
    .update(orders)
    .set({
      status: 'paid',
      paidAt: now,
      updatedAt: now,
      stripeCheckoutSessionId: patch.stripeCheckoutSessionId,
      stripePaymentIntentId: patch.stripePaymentIntentId,
      stripeCustomerId: patch.stripeCustomerId,
      ...(patch.email ? { email: patch.email } : {}),
      shippingName: patch.shippingName,
      shippingPhone: patch.shippingPhone,
      shippingAddress: patch.shippingAddress ?? null,
      shippingCents: patch.shippingCents,
      shippingRateId: patch.shippingRateId,
      shippingRateLabel: patch.shippingRateLabel,
      ...(typeof patch.totalCents === 'number' ? { totalCents: patch.totalCents } : {}),
    })
    .where(and(eq(orders.id, orderId), eq(orders.status, 'pending')))
    .returning({ id: orders.id });
  return rows.length > 0;
}

export async function flagOrder(orderId: number, flag: 'oversold' | null): Promise<void> {
  await getDb()
    .update(orders)
    .set({ fulfilmentFlag: flag, updatedAt: new Date() })
    .where(eq(orders.id, orderId));
}

export async function markConfirmationEmailSent(orderId: number): Promise<void> {
  await getDb()
    .update(orders)
    .set({ confirmationEmailSentAt: new Date() })
    .where(eq(orders.id, orderId));
}

export async function getOrderById(id: number): Promise<Order | null> {
  const rows = await getDb().select().from(orders).where(eq(orders.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getOrderBySessionId(sessionId: string): Promise<Order | null> {
  const rows = await getDb()
    .select()
    .from(orders)
    .where(eq(orders.stripeCheckoutSessionId, sessionId))
    .limit(1);
  return rows[0] ?? null;
}

export async function getOrderItems(orderId: number): Promise<OrderItem[]> {
  return getDb().select().from(orderItems).where(eq(orderItems.orderId, orderId)).orderBy(orderItems.id);
}

/** A member's orders — matched by WorkOS id OR email so a guest purchase
 *  made with the same address shows up once they sign in. Pending rows are
 *  hidden (abandoned checkouts aren't "orders" to the customer). */
export async function getOrdersForUser(userId: string, email: string | null | undefined): Promise<Order[]> {
  const who = email ? or(eq(orders.userId, userId), eq(orders.email, email.toLowerCase())) : eq(orders.userId, userId);
  const rows = await getDb()
    .select()
    .from(orders)
    .where(who)
    .orderBy(desc(orders.createdAt))
    .limit(100);
  return rows.filter((r) => r.status !== 'pending');
}

/** One order, only if it belongs to this user (by id or email). */
export async function getOrderForUser(
  id: number,
  userId: string,
  email: string | null | undefined,
): Promise<{ order: Order; items: OrderItem[] } | null> {
  const order = await getOrderById(id);
  if (!order || order.status === 'pending') return null;
  const owns = order.userId === userId || (!!email && order.email.toLowerCase() === email.toLowerCase());
  if (!owns) return null;
  const items = await getOrderItems(id);
  return { order, items };
}

/** Ops list with optional status filter; joins business name when the buyer
 *  is a member. */
export async function listOrders(opts: { status?: OrderStatus | null; limit?: number } = {}) {
  const db = getDb();
  return db
    .select({
      order: orders,
      businessName: userProfiles.businessName,
    })
    .from(orders)
    .leftJoin(userProfiles, eq(userProfiles.userId, orders.userId))
    .where(opts.status ? eq(orders.status, opts.status) : undefined)
    .orderBy(desc(orders.createdAt))
    .limit(opts.limit ?? 200);
}

export async function countOrdersToShip(): Promise<number> {
  const rows = await getDb().select({ id: orders.id }).from(orders).where(eq(orders.status, 'paid'));
  return rows.length;
}

export async function markShipped(
  orderId: number,
  input: { carrier: string | null; trackingNumber: string | null; trackingUrl: string | null; notes?: string | null },
): Promise<boolean> {
  const now = new Date();
  const rows = await getDb()
    .update(orders)
    .set({
      status: 'shipped',
      shippedAt: now,
      updatedAt: now,
      carrier: input.carrier,
      trackingNumber: input.trackingNumber,
      trackingUrl: input.trackingUrl,
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    })
    .where(and(eq(orders.id, orderId), eq(orders.status, 'paid')))
    .returning({ id: orders.id });
  return rows.length > 0;
}

export async function cancelOrder(orderId: number, notes?: string | null): Promise<boolean> {
  const rows = await getDb()
    .update(orders)
    .set({
      status: 'cancelled',
      updatedAt: new Date(),
      ...(notes !== undefined ? { notes } : {}),
    })
    .where(and(eq(orders.id, orderId), or(eq(orders.status, 'pending'), eq(orders.status, 'paid'))))
    .returning({ id: orders.id });
  return rows.length > 0;
}

/** Stripe `checkout.session.expired` → tidy up the abandoned pending row. */
export async function cancelPendingBySession(sessionId: string): Promise<void> {
  await getDb()
    .update(orders)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(and(eq(orders.stripeCheckoutSessionId, sessionId), eq(orders.status, 'pending')));
}

/** Stripe `charge.refunded`. A full refund flips status; a partial refund
 *  is recorded in notes so ops can see it without changing fulfilment state. */
export async function markRefunded(
  paymentIntentId: string,
  input: { full: boolean; amountCents: number },
): Promise<void> {
  const db = getDb();
  const rows = await db
    .select({ id: orders.id, notes: orders.notes })
    .from(orders)
    .where(eq(orders.stripePaymentIntentId, paymentIntentId))
    .limit(1);
  const row = rows[0];
  if (!row) return;
  const now = new Date();
  const note = `Refunded ${(input.amountCents / 100).toFixed(2)} AUD on ${now.toISOString().slice(0, 10)}`;
  const notes = row.notes ? `${row.notes}\n${note}` : note;
  await db
    .update(orders)
    .set(
      input.full
        ? { status: 'refunded', refundedAt: now, updatedAt: now, notes }
        : { updatedAt: now, notes },
    )
    .where(eq(orders.id, row.id));
}

/** Human-readable status label. */
export function orderStatusLabel(status: string): string {
  switch (status) {
    case 'pending': return 'Awaiting payment';
    case 'paid': return 'Paid — preparing';
    case 'shipped': return 'Shipped';
    case 'cancelled': return 'Cancelled';
    case 'refunded': return 'Refunded';
    default: return status;
  }
}
