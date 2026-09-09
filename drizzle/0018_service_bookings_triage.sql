ALTER TABLE "service_bookings" ADD COLUMN "need" varchar(32);--> statement-breakpoint
ALTER TABLE "service_bookings" ADD COLUMN "preferred_slots" jsonb;--> statement-breakpoint
ALTER TABLE "service_bookings" ADD COLUMN "pre_session_notes" text;--> statement-breakpoint
ALTER TABLE "service_bookings" ADD COLUMN "outcome" text;--> statement-breakpoint
ALTER TABLE "service_bookings" ADD COLUMN "next_step" text;--> statement-breakpoint
ALTER TABLE "service_bookings" ADD COLUMN "strategist_slug" text;--> statement-breakpoint
ALTER TABLE "service_bookings" ADD COLUMN "status_changed_by" text;--> statement-breakpoint
ALTER TABLE "service_bookings" ADD COLUMN "status_changed_at" timestamp with time zone;
