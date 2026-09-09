// PATCH /api/ops/inventory/[sku] — adjust stock. Staff-only.
//
// Body: { delta: number }  — relative change (e.g. +12 restock, -1 damaged)
//       { set: number }    — absolute value
//
// Role gating (same pattern as api/ops/referrals): `support` may only ADD
// stock (positive delta). Absolute `set` and negative deltas can zero the
// shelf, so they are admin-only.
//
// Going below zero is rejected by the CHECK constraint → 409.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getOpsUser } from '@/lib/auth/ops';
import { adjustStock, OversoldError, setStock } from '@/lib/db/inventory';

export const runtime = 'nodejs';

const BodySchema = z.union([
  z.object({ delta: z.number().int().min(-10_000).max(10_000) }),
  z.object({ set: z.number().int().min(0).max(100_000) }),
]);

type Params = Promise<{ sku: string }>;

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const opsUser = await getOpsUser();
  if (!opsUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { sku: rawSku } = await params;
  const sku = decodeURIComponent(rawSku).trim().toUpperCase();
  if (!sku || sku.length > 64) return NextResponse.json({ error: 'Invalid SKU' }, { status: 400 });

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const isRestock = 'delta' in parsed.data && parsed.data.delta > 0;
  if (!isRestock && opsUser.role !== 'admin') {
    return NextResponse.json({ error: 'Admins only — support can add stock but not set or reduce it' }, { status: 403 });
  }

  try {
    const stock = 'set' in parsed.data ? await setStock(sku, parsed.data.set) : await adjustStock(sku, parsed.data.delta);
    return NextResponse.json({ ok: true, sku, stock });
  } catch (err) {
    if (err instanceof OversoldError) return NextResponse.json({ error: err.message }, { status: 409 });
    if (err instanceof Error && err.message.startsWith('No inventory row')) {
      return NextResponse.json({ error: `Unknown SKU ${sku}` }, { status: 404 });
    }
    console.error('[ops.inventory] update failed', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Update failed' }, { status: 500 });
  }
}
