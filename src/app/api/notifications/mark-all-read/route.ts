// POST /api/notifications/mark-all-read — flip every unread notification
// for the signed-in user to read. Returns the count that was flipped.

import { NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { markAllNotificationsRead } from '@/lib/db/notifications';

export const runtime = 'nodejs';

export async function POST() {
  const { user } = await withAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const count = await markAllNotificationsRead(user.id);
  return NextResponse.json({ markedRead: count });
}
