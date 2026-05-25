-- Marketing attribution columns on event_rsvps. Captured at RSVP time
-- from the `gh_attr_{slug}` cookie set on /events/[slug] visit, so we can
-- attribute which partner / campaign drove an RSVP — the cookie survives
-- the WorkOS sign-in redirect.
--
-- All nullable: existing RSVPs are pre-attribution and stay NULL.

ALTER TABLE "event_rsvps" ADD COLUMN "source" varchar(64);--> statement-breakpoint
ALTER TABLE "event_rsvps" ADD COLUMN "utm_medium" varchar(64);--> statement-breakpoint
ALTER TABLE "event_rsvps" ADD COLUMN "utm_campaign" varchar(80);--> statement-breakpoint
ALTER TABLE "event_rsvps" ADD COLUMN "utm_content" varchar(80);--> statement-breakpoint
ALTER TABLE "event_rsvps" ADD COLUMN "ref" varchar(64);