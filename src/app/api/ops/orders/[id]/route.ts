// PATCH /api/ops/orders/[id] — fulfil or cancel a shop order. Staff-only
// (both ops roles; shipping isn't a money movement).
//
// Body: { status: 'shipped', carrier?, trackingNumber?, trackingUrl?, notes? }
//       { status: 'cancelled', notes? }
//
// `shipped` is only allowed from `paid` and emails the buyer their tracking.
// Refunds are NOT done here — refund in the Stripe dashboard and the
// charge.refunded webhook flips the row to `refunded`.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import { getOpsUser } from '@/lib/auth/ops';
import { cancelOrder, getOrderById, markShipped } from '@/lib/db/orders';
import { sendOrderShippedEmail } from '@/lib/shop/emails';

export const runtime = 'nodejs';

const BodySchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('shipped'),
    carrier: z.string().trim().max(40).optional(),
    trackingNumber: z.string().trim().max(80).optional(),
    trackingUrl: z.string().trim().url().max(500).optional().or(z.literal('')),
    notes: z.string().trim().max(2000).optional(),
  }),
  z.object({
    status: z.literal('cancelled'),
    notes: z.string().trim().max(2000).optional(),
  }),
]);

const TRACKING_URL_TEMPLATES: Record<string, (n: string) => string> = {
  auspost: (n) => `https://auspost.com.au/mypost/track/#/details/${encodeURIComponent(n)}`,
  sendle: (n) => `https://track.sendle.com/tracking?ref=${encodeURIComponent(n)}`,
  startrack: (n) => `https://startrack.com.au/track/details/${encodeURIComponent(n)}`,
};

type Params = Promise<{ id: string }>;

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const opsUser = await getOpsUser();
  if (!opsUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const order = await getOrderById(id);
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  try {
    if (parsed.data.status === 'shipped') {
      if (order.status !== 'paid') {
        return NextResponse.json({ error: `Only paid orders can be shipped (this one is ${order.status}).` }, { status: 409 });
      }
      const carrier = parsed.data.carrier || null;
      const trackingNumber = parsed.data.trackingNumber || null;
      const trackingUrl =
        parsed.data.trackingUrl ||
        (carrier && trackingNumber && TRACKING_URL_TEMPLATES[carrier] ? TRACKING_URL_TEMPLATES[carrier](trackingNumber) : null);
      const ok = await markShipped(id, { carrier, trackingNumber, trackingUrl, notes: parsed.data.notes });
      if (!ok) return NextResponse.json({ error: 'Order changed underneath you — refresh.' }, { status: 409 });
      await sendOrderShippedEmail(id);
      return NextResponse.json({ ok: true });
    }

    // cancelled
    if (order.status !== 'pending' && order.status !== 'paid') {
      return NextResponse.json({ error: `Cannot cancel an order that is ${order.status}.` }, { status: 409 });
    }
    const ok = await cancelOrder(id, parsed.data.notes);
    if (!ok) return NextResponse.json({ error: 'Order changed underneath you — refresh.' }, { status: 409 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[ops.orders] update failed', err);
    Sentry.captureException(err, { tags: { area: 'ops.orders', actor: opsUser.email }, extra: { orderId: id } });
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
