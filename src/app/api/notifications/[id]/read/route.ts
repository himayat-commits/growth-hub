// POST /api/notifications/[id]/read — mark a single notification as read.
// Idempotent — repeat calls return updated: false.

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { markNotificationRead } from '@/lib/db/notifications';

export const runtime = 'nodejs';

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user } = await withAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  const n = Number(id);
  if (!Number.isFinite(n) || n <= 0) {
    return NextResponse.json({ error: 'Invalid notification id' }, { status: 400 });
  }
  const updated = await markNotificationRead(user.id, n);
  return NextResponse.json({ updated });
}
