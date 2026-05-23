-- Cancellation log. See schema.ts for the why.
-- Idempotent ON CONFLICT (stripe_subscription_id) DO UPDATE pattern in
-- src/lib/db/cancellations.ts handles dual-writer races.

CREATE TABLE IF NOT EXISTS "subscription_cancellations" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "stripe_subscription_id" text NOT NULL,
  "plan_tier" varchar(20),
  "reason" varchar(40) DEFAULT '' NOT NULL,
  "comment" text DEFAULT '' NOT NULL,
  "cancel_at" timestamp with time zone,
  "restored_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "subscription_cancellations_stripe_subscription_id_unique"
    UNIQUE ("stripe_subscription_id")
);

CREATE INDEX IF NOT EXISTS "subscription_cancellations_created_idx"
  ON "subscription_cancellations" USING btree ("created_at");

CREATE INDEX IF NOT EXISTS "subscription_cancellations_reason_idx"
  ON "subscription_cancellations" USING btree ("reason");
