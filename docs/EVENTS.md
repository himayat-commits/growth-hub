# Events, webinars, RSVPs

Events live in the Payload `events` collection (`src/collections/Events.ts`);
member RSVPs live in the Drizzle table `public.event_rsvps`
(`src/lib/db/schema.ts`, helpers in `src/lib/db/rsvps.ts`). The two are in
different Postgres schemas with no foreign key — the join key is the Payload
event `id`.

## Fields that matter

| Field | Where | Public? | Notes |
|---|---|---|---|
| `date` | Payload | yes | An instant. "The event's date" always means its **Australia/Canberra** calendar date (`canberraDateKey`). |
| `time` | Payload | yes | Free text, e.g. `12:30 – 1:30 pm`. Parsed as Canberra wall-clock by `src/lib/events-time.ts` (`parseCanberraRange`) for the `.ics`, JSON-LD and emails. Unrecognised text → all-day. |
| `type` | Payload | yes | `webinar` = online. Drives the dashboard label and the JSON-LD attendance mode. |
| `category` | Payload | yes | Public hub filter chip (`Webinar` chip added). |
| `location` | Payload | yes | Blank for online events. |
| `registerUrl` | Payload | members | External registration page (Eventbrite). Shown as "Register on <host>" once RSVP'd when there is no `meetingUrl`. |
| `meetingUrl` | Payload | **members who RSVP'd only** | Zoom/Meet link. Rendered on `/my-events` as "Join online" only for RSVP'd users (the server never ships it to the client otherwise), included in the confirmation/reminder emails and the emailed `.ics`. Never on the public page or the public `.ics`. |
| `recording` | Payload | members | Media upload; surfaces under "Past recordings" on `/my-events`. |
| `event_rsvps.email` | Drizzle | ops | WorkOS email captured at RSVP. Roster/CSV/cron prefer it and fall back to `subscriptions.email`. |
| `event_rsvps.reminded_at` | Drizzle | ops | Set by the reminder cron; null = not yet reminded. |

## What happens on RSVP (`POST /api/events/[id]/rsvp`)

1. Signed-in only; event must exist; events whose Canberra date is before
   today are rejected with `409 This event has already run`.
2. Row inserted (idempotent on `(user_id, event_id)`), storing attribution
   cookie + `user.email`.
3. On a **new** row a confirmation email is sent via Resend
   (`src/lib/events-emails.ts`, template `src/lib/email/templates/event-rsvp.ts`):
   subject `You're in: <title> — <date>`, when/where in Canberra time, the
   `meetingUrl` if set, a "Manage in My events" link
   (`NEXT_PUBLIC_APP_URL ?? https://app.thegrowthhub.com.au`), and the `.ics`
   attached (`src/lib/events-ics.ts`, same builder as the public route but
   with the meeting link). Email failure never fails the RSVP (logged + Sentry).

## Reminder cron (`/api/cron/event-reminders`)

`vercel.json`: `0 21 * * *` (21:00 UTC = 07:00 AEST / 08:00 AEDT). Hobby plan
= daily only. For every event dated **today or tomorrow** (Canberra), emails
each RSVP with an address and `reminded_at IS NULL`, then sets `reminded_at`.
One reminder per RSVP: "Tomorrow: …" if the RSVP existed the morning before,
otherwise "Today: …". Auth: `Authorization: Bearer $CRON_SECRET`
(timing-safe). Manual run: `curl -H "Authorization: Bearer $CRON_SECRET" https://thegrowthhub.com.au/api/cron/event-reminders`.

## Ops

`/ops/events` lists every event with RSVPs (business, email, plan, RSVP time,
source). Each group has **Download CSV** → `GET /api/ops/events/[id]/roster.csv`
(ops-gated; columns `name,email,rsvp_at,reminded_at,source,utm_medium,utm_campaign,utm_content,ref`).

## Migrations shipped with this feature — how each reaches prod

| Change | File | Applied how |
|---|---|---|
| `payload.events.meeting_url` | `src/migrations/20260909_events_meeting_url.ts` | **By hand.** `payload migrate` is never run in prod (see `scripts/prod-migrate.mjs`). Run: `ALTER TABLE "payload"."events" ADD COLUMN IF NOT EXISTS "meeting_url" varchar;` BEFORE deploying — Payload selects every declared column, so the CMS event queries return `[]` until it exists. |
| `event_rsvps.email`, `event_rsvps.reminded_at` | `drizzle/0016_event_rsvps_email.sql` + `_journal.json` idx 16 | **Automatic.** `scripts/prod-migrate.mjs` runs `drizzle-kit migrate` in the production Vercel build. No `meta/0016_snapshot.json` was generated (needs `DATABASE_URL`); run `npx drizzle-kit generate` once against a Neon branch to backfill it before the next schema change. |

## Running a weekly webinar today

1. In `/admin` → Events → Create: title, `date`, `time` (`12:30 – 1:30 pm`),
   `type = Webinar · Online`, `category = Webinar`, leave `location` blank,
   paste the Zoom/Meet link into `meetingUrl`. Save. (The slug auto-generates;
   `/events/<slug>` and `/api/events/ics/<slug>` go live on revalidation.)
2. Members RSVP from `/my-events` → they get the confirmation + `.ics` with the
   join link, and "Join online" stays visible on `/my-events`.
3. The morning before, the cron sends "Tomorrow: …"; late RSVPs get "Today: …".
4. Afterwards, upload the recording to Media and set `recording` on the event —
   it moves to "Past recordings" for members. (A recording-announcement mail
   using `event-recap.tsx` is not wired yet.)
5. Next week: create the next event (there is no series/clone yet — see the
   GTM review §3.3 for the recurring-series scope).
