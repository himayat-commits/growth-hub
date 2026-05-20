// GET /api/notifications — last 20 notifications for the signed-in user.

import { NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { getNotifications } from '@/lib/db/notifications';

export const runtime = 'nodejs';

export async function GET() {
  const { user } = await withAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const items = await getNotifications(user.id, 20);
  return NextResponse.json({ notifications: items });
}
