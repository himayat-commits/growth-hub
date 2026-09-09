ALTER TABLE "user_profiles" ADD COLUMN "pending_credit_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN "referrer_credit_state" varchar(16) DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN "referred_credit_state" varchar(16) DEFAULT 'none' NOT NULL;