// GET /api/messages — full thread for the signed-in user (oldest first).
// POST /api/messages — append a customer reply.

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { getThread, sendUserMessage } from '@/lib/db/messages';

export const runtime = 'nodejs';

export async function GET() {
  const { user } = await withAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const items = await getThread(user.id);
  return NextResponse.json({ messages: items });
}

export async function POST(req: NextRequest) {
  const { user } = await withAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const text =
    body && typeof body.body === 'string' ? body.body.trim() : '';
  if (!text) {
    return NextResponse.json({ error: 'Message body required' }, { status: 400 });
  }
  if (text.length > 4000) {
    return NextResponse.json(
      { error: 'Message must be 4000 characters or fewer' },
      { status: 400 },
    );
  }

  const message = await sendUserMessage(user.id, text);
  return NextResponse.json({ message });
}
