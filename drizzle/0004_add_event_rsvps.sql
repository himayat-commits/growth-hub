CREATE TABLE "event_rsvps" (
	"user_id" text NOT NULL,
	"event_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "event_rsvps_user_event_idx" ON "event_rsvps" USING btree ("user_id","event_id");