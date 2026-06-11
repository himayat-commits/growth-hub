-- Attribution columns on event_rsvps (source / UTM / referral code), used by
-- rsvpToEvent() in src/lib/db/rsvps.ts. These were applied to production
-- out-of-band, so this migration is written idempotently (IF NOT EXISTS) and
-- recorded as already-applied on prod — it exists to bring the committed
-- migration history back in sync with the schema.
ALTER TABLE "event_rsvps" ADD COLUMN IF NOT EXISTS "source" varchar(64);--> statement-breakpoint
ALTER TABLE "event_rsvps" ADD COLUMN IF NOT EXISTS "utm_medium" varchar(64);--> statement-breakpoint
ALTER TABLE "event_rsvps" ADD COLUMN IF NOT EXISTS "utm_campaign" varchar(80);--> statement-breakpoint
ALTER TABLE "event_rsvps" ADD COLUMN IF NOT EXISTS "utm_content" varchar(80);--> statement-breakpoint
ALTER TABLE "event_rsvps" ADD COLUMN IF NOT EXISTS "ref" varchar(64);
