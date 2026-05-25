// POST /api/events/[id]/rsvp — toggle an RSVP for the signed-in user.
//
// Idempotent: if the user already has an RSVP for this event, the response
// includes `rsvped: true` and `created: false`. New RSVPs return
// `created: true`. DELETE removes the RSVP.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { rsvpToEvent, cancelRsvp, type RsvpAttribution } from '@/lib/db/rsvps';
import { getEventById } from '@/lib/cms';

export const runtime = 'nodejs';

function parseEventId(raw: string): number | null {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Read the `gh_attr_{slug}` cookie set by /events/[slug] and return it
 *  as a typed attribution object. Falls back to null on any parse error
 *  so a broken cookie never blocks an RSVP. Caller passes the slug if
 *  known; otherwise we scan any gh_attr_* cookie (last-write-wins). */
async function readAttributionCookie(slug?: string): Promise<RsvpAttribution | undefined> {
  try {
    const store = await cookies();
    const target = slug
      ? store.get(`gh_attr_${slug}`)
      : store.getAll().find((c) => c.name.startsWith('gh_attr_'));
    if (!target?.value) return undefined;
    const parsed = JSON.parse(decodeURIComponent(target.value)) as Record<string, unknown>;
    const pick = (k: string) => (typeof parsed[k] === 'string' ? (parsed[k] as string).slice(0, 64) : null);
    return {
      source: pick('source'),
      utmMedium: pick('utmMedium'),
      utmCampaign: pick('utmCampaign'),
      utmContent: pick('utmContent'),
      ref: pick('ref'),
    };
  } catch {
    return undefined;
  }
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

  const attribution = await readAttributionCookie(
    (event as { slug?: string }).slug ?? undefined,
  );
  const created = await rsvpToEvent(user.id, eventId, attribution);
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
