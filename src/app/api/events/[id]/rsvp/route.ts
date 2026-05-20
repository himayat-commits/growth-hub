// POST /api/events/[id]/rsvp — toggle an RSVP for the signed-in user.
//
// Idempotent: if the user already has an RSVP for this event, the response
// includes `rsvped: true` and `created: false`. New RSVPs return
// `created: true`. DELETE removes the RSVP.

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { rsvpToEvent, cancelRsvp } from '@/lib/db/rsvps';
import { getEventById } from '@/lib/cms';

export const runtime = 'nodejs';

function parseEventId(raw: string): number | null {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user } = await withAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: rawId } = await ctx.params;
  const eventId = parseEventId(rawId);
  if (eventId === null) {
    return NextResponse.json({ error: 'Invalid event id' }, { status: 400 });
  }

  // Verify the event exists before we record an RSVP — avoids dangling rows
  // for events someone fabricated via direct URL.
  const event = await getEventById(eventId);
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  const created = await rsvpToEvent(user.id, eventId);
  return NextResponse.json({ rsvped: true, created });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user } = await withAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: rawId } = await ctx.params;
  const eventId = parseEventId(rawId);
  if (eventId === null) {
    return NextResponse.json({ error: 'Invalid event id' }, { status: 400 });
  }

  const removed = await cancelRsvp(user.id, eventId);
  return NextResponse.json({ rsvped: false, removed });
}
