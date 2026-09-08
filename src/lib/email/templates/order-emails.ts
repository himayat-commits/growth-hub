// Shop order emails — server-only, plain HTML (same approach as
// event-recap.tsx: no @react-email dependency, Resend accepts a string).
//
// Two templates:
//   orderConfirmationEmail — sent when payment lands (doubles as the tax
//                            invoice: order number, GST component, ABN)
//   orderShippedEmail      — sent when ops marks the order shipped
//
// Brand voice: short, warm, practical. No emoji.

import { escapeHtml } from '@/lib/email/resend';
import { formatAud, gstComponentCents } from '@/lib/shop/pricing';
import type { Order, OrderItem } from '@/lib/db/schema';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://thegrowthhub.com.au';
const ABN = process.env.SHOP_ABN ?? '';

interface Address {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
}

function addressLines(order: Order): string[] {
  const a = (order.shippingAddress ?? {}) as Address;
  return [
    order.shippingName,
    a.line1,
    a.line2,
    [a.city, a.state, a.postal_code].filter(Boolean).join(' '),
    a.country,
  ]
    .map((s) => (s ?? '').trim())
    .filter(Boolean);
}

function itemsTableHtml(items: OrderItem[]): string {
  const rows = items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #E6E1D2;">
          <strong>${escapeHtml(i.nameSnapshot)}</strong>
          ${i.variantLabelSnapshot ? `<div style="font-size:13px;color:#4A6A70;">${escapeHtml(i.variantLabelSnapshot)}</div>` : ''}
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #E6E1D2;text-align:center;color:#4A6A70;">×${i.qty}</td>
        <td style="padding:8px 0;border-bottom:1px solid #E6E1D2;text-align:right;">
          ${
            i.unitCents < i.listUnitCents
              ? `<span style="text-decoration:line-through;color:#7A9098;font-size:13px;margin-right:6px;">${formatAud(i.listUnitCents * i.qty)}</span>`
              : ''
          }${formatAud(i.unitCents * i.qty)}
        </td>
      </tr>`,
    )
    .join('');
  return `<table style="width:100%;border-collapse:collapse;margin:0 0 12px;">${rows}</table>`;
}

function totalsHtml(order: Order): string {
  const gst = gstComponentCents(order.totalCents);
  const line = (label: string, value: string, strong = false) =>
    `<tr><td style="padding:3px 0;color:#4A6A70;">${label}</td><td style="padding:3px 0;text-align:right;${strong ? 'font-weight:600;font-size:17px;' : ''}">${value}</td></tr>`;
  return `
    <table style="width:100%;border-collapse:collapse;margin:0 0 6px;">
      ${line('Subtotal', formatAud(order.subtotalCents))}
      ${order.discountCents > 0 ? line('Member savings', `−${formatAud(order.discountCents)}`) : ''}
      ${line(`Shipping${order.shippingRateLabel ? ` (${escapeHtml(order.shippingRateLabel)})` : ''}`, formatAud(order.shippingCents))}
      ${line('Total paid', formatAud(order.totalCents), true)}
    </table>
    <p style="margin:0 0 18px;font-size:13px;color:#7A9098;">Total includes GST of ${formatAud(gst)}.${ABN ? ` ABN ${escapeHtml(ABN)}.` : ''} This email is your tax invoice.</p>`;
}

function shell(inner: string): string {
  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;line-height:1.55;max-width:600px;color:#0D3F48;">
    ${inner}
    <p style="margin:24px 0 0;font-size:13px;color:#7A9098;">Questions? Reply to this email or write to hello@himayat.com.au.<br/>— The Growth Hub team</p>
  </div>`;
}

export interface OrderEmail {
  subject: string;
  html: string;
  text: string;
}

export function orderConfirmationEmail(order: Order, items: OrderItem[]): OrderEmail {
  const num = order.orderNumber ?? `GH-${String(order.id).padStart(5, '0')}`;
  const addr = addressLines(order);
  const ordersLink = `${SITE_URL}/orders`;

  const html = shell(`
    <h2 style="font-family:Georgia,serif;font-weight:400;margin:0 0 6px;">Thanks — your order's confirmed.</h2>
    <p style="margin:0 0 18px;color:#4A6A70;">Order <strong>${escapeHtml(num)}</strong>. We'll email again with tracking once it ships.</p>
    ${itemsTableHtml(items)}
    ${totalsHtml(order)}
    ${
      addr.length
        ? `<p style="margin:0 0 4px;font-size:13px;color:#4A6A70;">Shipping to</p><p style="margin:0 0 18px;white-space:pre-line;">${escapeHtml(addr.join('\n'))}</p>`
        : ''
    }
    ${
      order.userId
        ? `<p><a href="${ordersLink}" style="display:inline-block;background:#0D3F48;color:#F3F0E7;padding:12px 24px;border-radius:999px;text-decoration:none;">View your orders</a></p>`
        : `<p style="font-size:13px;color:#4A6A70;">Have a Growth Hub account? Sign in with this email address and the order will appear under <a href="${ordersLink}">My Orders</a>.</p>`
    }
  `);

  const text = [
    `Thanks — your order ${num} is confirmed.`,
    '',
    ...items.map((i) => `${i.qty} × ${i.nameSnapshot}${i.variantLabelSnapshot ? ` (${i.variantLabelSnapshot})` : ''} — ${formatAud(i.unitCents * i.qty)}`),
    '',
    `Subtotal: ${formatAud(order.subtotalCents)}`,
    order.discountCents > 0 ? `Member savings: -${formatAud(order.discountCents)}` : null,
    `Shipping: ${formatAud(order.shippingCents)}`,
    `Total paid: ${formatAud(order.totalCents)} (includes GST of ${formatAud(gstComponentCents(order.totalCents))})`,
    ABN ? `ABN ${ABN}` : null,
    '',
    addr.length ? `Shipping to:\n${addr.join('\n')}` : null,
    '',
    `We'll email tracking once it ships. Questions: hello@himayat.com.au`,
  ]
    .filter((l) => l !== null)
    .join('\n');

  return { subject: `Order ${num} confirmed — Growth Hub Shop`, html, text };
}

const CARRIER_LABELS: Record<string, string> = {
  auspost: 'Australia Post',
  sendle: 'Sendle',
  startrack: 'StarTrack',
  other: 'the courier',
};

export function orderShippedEmail(order: Order, items: OrderItem[]): OrderEmail {
  const num = order.orderNumber ?? `GH-${String(order.id).padStart(5, '0')}`;
  const carrier = CARRIER_LABELS[order.carrier ?? ''] ?? order.carrier ?? 'the courier';
  const tracking = order.trackingNumber ?? '';
  const trackingLink = order.trackingUrl ?? null;

  const html = shell(`
    <h2 style="font-family:Georgia,serif;font-weight:400;margin:0 0 6px;">Your order's on its way.</h2>
    <p style="margin:0 0 18px;color:#4A6A70;">Order <strong>${escapeHtml(num)}</strong> has shipped with ${escapeHtml(carrier)}.</p>
    ${
      tracking
        ? `<p style="margin:0 0 18px;">Tracking number: <strong>${escapeHtml(tracking)}</strong>${
            trackingLink ? ` — <a href="${escapeHtml(trackingLink)}">track it here</a>` : ''
          }</p>`
        : ''
    }
    ${itemsTableHtml(items)}
    ${addressLines(order).length ? `<p style="margin:0 0 4px;font-size:13px;color:#4A6A70;">Shipping to</p><p style="margin:0;white-space:pre-line;">${escapeHtml(addressLines(order).join('\n'))}</p>` : ''}
  `);

  const text = [
    `Your order ${num} has shipped with ${carrier}.`,
    tracking ? `Tracking: ${tracking}${trackingLink ? ` — ${trackingLink}` : ''}` : null,
    '',
    ...items.map((i) => `${i.qty} × ${i.nameSnapshot}${i.variantLabelSnapshot ? ` (${i.variantLabelSnapshot})` : ''}`),
  ]
    .filter((l) => l !== null)
    .join('\n');

  return { subject: `Order ${num} has shipped — Growth Hub Shop`, html, text };
}
