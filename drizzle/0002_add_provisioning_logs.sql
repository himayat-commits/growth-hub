CREATE TABLE "provisioning_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"step" integer NOT NULL,
	"kind" varchar(40) NOT NULL,
	"ok" boolean NOT NULL,
	"payload" jsonb NOT NULL,
	"response" jsonb,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "provisioning_logs_user_id_idx" ON "provisioning_logs" USING btree ("user_id","created_at");