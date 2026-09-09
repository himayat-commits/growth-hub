// Send helpers for shop emails. Best-effort: every function swallows and
// logs errors so an email-provider outage never fails a webhook or an ops
// action. Sends go through sendEmail() (HubSpot or Resend — see
// src/lib/email/send.ts); when no provider is configured the result is
// ok=false and the provider layer has already logged + Sentry'd it once.

import 'server-only';
import * as Sentry from '@sentry/nextjs';
import { DEFAULT_FROM, OPS_EMAIL, escapeHtml, sendEmail } from '@/lib/email/send';
import { orderConfirmationEmail, orderShippedEmail } from '@/lib/email/templates/order-emails';
import { getOrderById, getOrderItems, markConfirmationEmailSent } from '@/lib/db/orders';

export async function sendOrderConfirmationEmail(orderId: number): Promise<void> {
  try {
    const order = await getOrderById(orderId);
    if (!order || order.confirmationEmailSentAt) return;
    const items = await getOrderItems(orderId);
    const mail = orderConfirmationEmail(order, items);
    const result = await sendEmail({ from: DEFAULT_FROM, to: order.email, replyTo: OPS_EMAIL, ...mail });
    if (!result.ok) {
      // Leave confirmationEmailSentAt unset so a later retry can still send it.
      console.error('[shop] confirmation email not sent', result.error);
      return;
    }
    await markConfirmationEmailSent(orderId);
  } catch (err) {
    console.error('[shop] confirmation email failed', err);
    Sentry.captureException(err, { tags: { area: 'shop.email', kind: 'confirmation' }, extra: { orderId } });
  }
}

export async function sendOrderShippedEmail(orderId: number): Promise<void> {
  try {
    const order = await getOrderById(orderId);
    if (!order) return;
    const items = await getOrderItems(orderId);
    const mail = orderShippedEmail(order, items);
    const result = await sendEmail({ from: DEFAULT_FROM, to: order.email, replyTo: OPS_EMAIL, ...mail });
    if (!result.ok) console.error('[shop] shipped email not sent', result.error);
  } catch (err) {
    console.error('[shop] shipped email failed', err);
    Sentry.captureException(err, { tags: { area: 'shop.email', kind: 'shipped' }, extra: { orderId } });
  }
}

/** Ops alert for orders that paid but could not be fulfilled from stock. */
export async function sendOversoldAlert(orderId: number, reason: string): Promise<void> {
  try {
    const order = await getOrderById(orderId);
    const num = order?.orderNumber ?? `#${orderId}`;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://thegrowthhub.com.au';
    const text = `Order ${num} was paid in Stripe but the stock decrement failed (${reason}).\n\nEither restock and ship it, or refund it in Stripe (the webhook will mark it refunded).\n\n${siteUrl}/ops/orders/${orderId}`;
    const result = await sendEmail({
      from: DEFAULT_FROM,
      to: OPS_EMAIL,
      subject: `[Shop] Order ${num} paid but stock insufficient`,
      // HubSpot single-send renders an HTML body; keep the plain text too.
      html: `<pre style="font-family:inherit;white-space:pre-wrap;">${escapeHtml(text)}</pre>`,
      text,
    });
    if (!result.ok) console.error('[shop] oversold alert not sent', result.error);
  } catch (err) {
    console.error('[shop] oversold alert failed', err);
  }
}
