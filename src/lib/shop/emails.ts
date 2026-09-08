// Send helpers for shop emails. Best-effort: every function swallows and
// logs errors so a Resend outage never fails a webhook or an ops action.

import 'server-only';
import * as Sentry from '@sentry/nextjs';
import { DEFAULT_FROM, OPS_EMAIL, getResend } from '@/lib/email/resend';
import { orderConfirmationEmail, orderShippedEmail } from '@/lib/email/templates/order-emails';
import { getOrderById, getOrderItems, markConfirmationEmailSent } from '@/lib/db/orders';

export async function sendOrderConfirmationEmail(orderId: number): Promise<void> {
  const resend = getResend();
  if (!resend) return;
  try {
    const order = await getOrderById(orderId);
    if (!order || order.confirmationEmailSentAt) return;
    const items = await getOrderItems(orderId);
    const mail = orderConfirmationEmail(order, items);
    await resend.emails.send({ from: DEFAULT_FROM, to: order.email, replyTo: OPS_EMAIL, ...mail });
    await markConfirmationEmailSent(orderId);
  } catch (err) {
    console.error('[shop] confirmation email failed', err);
    Sentry.captureException(err, { tags: { area: 'shop.email', kind: 'confirmation' }, extra: { orderId } });
  }
}

export async function sendOrderShippedEmail(orderId: number): Promise<void> {
  const resend = getResend();
  if (!resend) return;
  try {
    const order = await getOrderById(orderId);
    if (!order) return;
    const items = await getOrderItems(orderId);
    const mail = orderShippedEmail(order, items);
    await resend.emails.send({ from: DEFAULT_FROM, to: order.email, replyTo: OPS_EMAIL, ...mail });
  } catch (err) {
    console.error('[shop] shipped email failed', err);
    Sentry.captureException(err, { tags: { area: 'shop.email', kind: 'shipped' }, extra: { orderId } });
  }
}

/** Ops alert for orders that paid but could not be fulfilled from stock. */
export async function sendOversoldAlert(orderId: number, reason: string): Promise<void> {
  const resend = getResend();
  if (!resend) return;
  try {
    const order = await getOrderById(orderId);
    const num = order?.orderNumber ?? `#${orderId}`;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://thegrowthhub.com.au';
    await resend.emails.send({
      from: DEFAULT_FROM,
      to: OPS_EMAIL,
      subject: `[Shop] Order ${num} paid but stock insufficient`,
      text: `Order ${num} was paid in Stripe but the stock decrement failed (${reason}).\n\nEither restock and ship it, or refund it in Stripe (the webhook will mark it refunded).\n\n${siteUrl}/ops/orders/${orderId}`,
    });
  } catch (err) {
    console.error('[shop] oversold alert failed', err);
  }
}
