// GET /api/notifications/unread-count — number of unread notifications for
// the signed-in user. Used by the topbar bell to poll every 60s.
// Returns 0 (not 401) for unauthed callers so the client poller can stay
// silent without paranoid error handling.

import { NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { getUnreadNotificationCount } from '@/lib/db/notifications';

export const runtime = 'nodejs';

export async function GET() {
  const { user } = await withAuth();
  if (!user) return NextResponse.json({ count: 0 });
  const count = await getUnreadNotificationCount(user.id);
  return NextResponse.json({ count });
}
