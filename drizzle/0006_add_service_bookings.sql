CREATE TABLE "service_bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"service_slug" text NOT NULL,
	"service_title" text NOT NULL,
	"status" varchar(20) DEFAULT 'requested' NOT NULL,
	"notes" text,
	"date_preference" text,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"scheduled_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "service_bookings_user_status_idx" ON "service_bookings" USING btree ("user_id","status");