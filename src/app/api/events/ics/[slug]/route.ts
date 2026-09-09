import { getEventBySlug } from '@/lib/cms';
import { buildEventIcs } from '@/lib/events-ics';

// RFC 5545 (.ics) download for a PUBLIC event. Consumed by the "Add to
// Calendar" button on /events/[slug]. macOS Calendar, Outlook, and Google
// Calendar all import .ics by URL or download.
//
// The builder lives in src/lib/events-ics.ts (shared with the RSVP
// confirmation email). Times are interpreted as Australia/Canberra
// wall-clock and emitted as UTC — see src/lib/events-time.ts.
//
// This route deliberately never passes `meetingUrl`: the join link is for
// signed-in members who have RSVP'd (my-events + their confirmation email).
//
// Lookup is by slug (matches the public URL). Returns 404 when the slug
// doesn't resolve; never throws so the link never 500s in front of a visitor.

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const doc = await getEventBySlug(slug);
  if (!doc) return new Response('Not found', { status: 404 });

  const ics = buildEventIcs({
    id: doc.id,
    slug,
    title: String(doc.title ?? 'Event'),
    description: doc.description,
    location: doc.location,
    dateIso: doc.date ? String(doc.date) : '',
    time: doc.time,
  });

  return new Response(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${slug}.ics"`,
      'Cache-Control': 'public, max-age=600, s-maxage=600',
    },
  });
}
