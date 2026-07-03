CREATE TABLE "provisioning_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"task_kind" varchar(30) NOT NULL,
	"status" varchar(10) DEFAULT 'open' NOT NULL,
	"label" text NOT NULL,
	"snapshot" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"done_at" timestamp with time zone,
	"done_by" text
);
--> statement-breakpoint
CREATE UNIQUE INDEX "provisioning_tasks_user_kind_uq" ON "provisioning_tasks" USING btree ("user_id","task_kind");--> statement-breakpoint
CREATE INDEX "provisioning_tasks_status_idx" ON "provisioning_tasks" USING btree ("status","created_at");