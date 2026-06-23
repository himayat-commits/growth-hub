-- Collapse any duplicate RSVPs created by a race before the PK existed,
-- keeping the EARLIEST row per (user_id, event_id) so the original timestamp
-- and attribution survive. Must run before the PRIMARY KEY is added, or the
-- constraint would fail on existing duplicates.
DELETE FROM "event_rsvps" a
  USING "event_rsvps" b
 WHERE a.user_id = b.user_id
   AND a.event_id = b.event_id
   AND (a.created_at > b.created_at
        OR (a.created_at = b.created_at AND a.ctid > b.ctid));--> statement-breakpoint
DROP INDEX IF EXISTS "event_rsvps_user_event_idx";--> statement-breakpoint
ALTER TABLE "event_rsvps" ADD CONSTRAINT "event_rsvps_user_id_event_id_pk" PRIMARY KEY("user_id","event_id");