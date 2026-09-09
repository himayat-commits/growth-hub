// GET /api/ops/events/[id]/roster.csv — attendee roster export. Staff-only
// (both ops roles; read-only). Linked from /ops/events.
//
// Columns: name (business name), email, rsvp_at (ISO, UTC), reminded_at,
// source, utm_medium, utm_campaign, utm_content, ref. Email prefers the value
// captured at RSVP time and falls back to the subscription email.

import { NextResponse } from 'next/server';
import { getOpsUser } from '@/lib/auth/ops';
import { getRoster } from '@/lib/db/rsvps';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** RFC 4180 quoting + a leading apostrophe on formula-looking cells so a
 *  spreadsheet never executes attendee-supplied text. */
function csvCell(v: string | number | Date | null | undefined): string {
  if (v === null || v === undefined) return '';
  let s = v instanceof Date ? v.toISOString() : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const ops = await getOpsUser();
  if (!ops) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await ctx.params;
  const eventId = Number(id);
  if (!Number.isInteger(eventId) || eventId <= 0) {
    return NextResponse.json({ error: 'Invalid event id' }, { status: 400 });
  }

  const rows = await getRoster(eventId);
  const header = [
    'name', 'email', 'rsvp_at', 'reminded_at',
    'source', 'utm_medium', 'utm_campaign', 'utm_content', 'ref',
  ];
  const lines = [
    header.join(','),
    ...rows.map((r) =>
      [
        r.businessName, r.email, r.createdAt, r.remindedAt,
        r.source, r.utmMedium, r.utmCampaign, r.utmContent, r.ref,
      ]
        .map(csvCell)
        .join(','),
    ),
  ];

  return new Response(lines.join('\r\n') + '\r\n', {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="event-${eventId}-roster.csv"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
