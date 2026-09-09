// Event reminder emails (Vercel cron — see vercel.json). GTM review F3.8.
//
// Scheduled daily at 21:00 UTC = 07:00 AEST / 08:00 AEDT. Vercel's Hobby plan
// caps crons at once per day, so this is the only tick we get: for every
// event whose Canberra calendar date is TODAY or TOMORROW, email each RSVP
// that has an address and hasn't been reminded yet. Hourly "starts in 1 h"
// nudges need Pro.
//
// Idempotency: event_rsvps.reminded_at is set after a successful send and
// rows with a value are skipped. One reminder per RSVP — "Tomorrow: …" when
// the RSVP existed the day before, otherwise "Today: …" on the morning of.
//
// Auth mirrors provision-retry: Vercel attaches `Authorization: Bearer
// ${CRON_SECRET}`; compared with timingSafeEqual. No secret = reject all.

import { timingSafeEqual } from 'node:crypto';
import * as Sentry from '@sentry/nextjs';
import { getEventsInWindow } from '@/lib/cms';
import { getUnremindedRsvps, markRsvpReminded } from '@/lib/db/rsvps';
import { sendEventReminderEmail } from '@/lib/events-emails';
import {
  canberraDateKey,
  canberraDateKeyPlusDays,
  canberraStartOfDay,
} from '@/lib/events-time';

export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

function authorised(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const got = Buffer.from(req.headers.get('authorization') ?? '');
  return expected.length === got.length && timingSafeEqual(expected, got);
}

export async function GET(req: Request) {
  if (!authorised(req)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const todayKey = canberraDateKey(now);
  const tomorrowKey = canberraDateKeyPlusDays(now, 1);
  const dayAfterKey = canberraDateKeyPlusDays(now, 2);

  // Payload `date` is an instant; fetch the two-day Canberra window and bucket
  // each event by its Canberra calendar date.
  const events = await getEventsInWindow(
    canberraStartOfDay(todayKey).toISOString(),
    canberraStartOfDay(dayAfterKey).toISOString(),
  );

  const TIME_BUDGET_MS = 240_000;
  const startedAt = Date.now();
  const results: Array<{ eventId: number; when: string; sent: number; skipped: number; failed: number }> = [];

  for (const event of events) {
    const key = canberraDateKey(new Date(String(event.date)));
    const when = key === todayKey ? 'today' : key === tomorrowKey ? 'tomorrow' : null;
    if (!when) continue;

    const eventId = Number(event.id);
    const tally = { eventId, when, sent: 0, skipped: 0, failed: 0 };
    results.push(tally);

    let rsvps: Awaited<ReturnType<typeof getUnremindedRsvps>>;
    try {
      rsvps = await getUnremindedRsvps(eventId);
    } catch (e) {
      Sentry.captureException(e, { tags: { area: 'events', step: 'cron_reminders_query' }, extra: { eventId } });
      tally.failed += 1;
      continue;
    }

    for (const r of rsvps) {
      if (Date.now() - startedAt > TIME_BUDGET_MS) {
        tally.skipped += 1; // picked up tomorrow (as "today") — reminded_at still null
        continue;
      }
      if (!r.email) {
        tally.skipped += 1;
        continue;
      }
      const ok = await sendEventReminderEmail(event, r.email, when);
      if (!ok) {
        tally.failed += 1;
        continue;
      }
      try {
        await markRsvpReminded(r.userId, eventId);
        tally.sent += 1;
      } catch (e) {
        // Email went out but the marker failed — surface it; a duplicate
        // tomorrow is the worst case.
        Sentry.captureException(e, { tags: { area: 'events', step: 'cron_reminders_mark' }, extra: { eventId, userId: r.userId } });
        tally.failed += 1;
      }
    }
  }

  return Response.json({ ok: true, today: todayKey, tomorrow: tomorrowKey, events: results });
}
