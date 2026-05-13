import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload"."signup_page_content_foundations_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."signup_page_content_foundations_trust_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."signup_page_content_growth_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."signup_page_content_growth_trust_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."signup_page_content_accelerate_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."signup_page_content_accelerate_trust_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."signup_page_content" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"foundations_title" varchar DEFAULT 'Get online. Get noticed.',
  	"foundations_tagline" varchar DEFAULT 'You''re a step away from a real team in your corner.',
  	"foundations_addon" varchar,
  	"growth_title" varchar DEFAULT 'Build trust. Build reputation.',
  	"growth_tagline" varchar DEFAULT 'You''re a step away from a real team in your corner.',
  	"growth_addon" varchar,
  	"accelerate_title" varchar DEFAULT 'Convert visitors into customers.',
  	"accelerate_tagline" varchar DEFAULT 'You''re a step away from a real team in your corner.',
  	"accelerate_addon" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload"."signup_page_content_foundations_features" ADD CONSTRAINT "signup_page_content_foundations_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."signup_page_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."signup_page_content_foundations_trust_items" ADD CONSTRAINT "signup_page_content_foundations_trust_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."signup_page_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."signup_page_content_growth_features" ADD CONSTRAINT "signup_page_content_growth_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."signup_page_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."signup_page_content_growth_trust_items" ADD CONSTRAINT "signup_page_content_growth_trust_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."signup_page_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."signup_page_content_accelerate_features" ADD CONSTRAINT "signup_page_content_accelerate_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."signup_page_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."signup_page_content_accelerate_trust_items" ADD CONSTRAINT "signup_page_content_accelerate_trust_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."signup_page_content"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "signup_page_content_foundations_features_order_idx" ON "payload"."signup_page_content_foundations_features" USING btree ("_order");
  CREATE INDEX "signup_page_content_foundations_features_parent_id_idx" ON "payload"."signup_page_content_foundations_features" USING btree ("_parent_id");
  CREATE INDEX "signup_page_content_foundations_trust_items_order_idx" ON "payload"."signup_page_content_foundations_trust_items" USING btree ("_order");
  CREATE INDEX "signup_page_content_foundations_trust_items_parent_id_idx" ON "payload"."signup_page_content_foundations_trust_items" USING btree ("_parent_id");
  CREATE INDEX "signup_page_content_growth_features_order_idx" ON "payload"."signup_page_content_growth_features" USING btree ("_order");
  CREATE INDEX "signup_page_content_growth_features_parent_id_idx" ON "payload"."signup_page_content_growth_features" USING btree ("_parent_id");
  CREATE INDEX "signup_page_content_growth_trust_items_order_idx" ON "payload"."signup_page_content_growth_trust_items" USING btree ("_order");
  CREATE INDEX "signup_page_content_growth_trust_items_parent_id_idx" ON "payload"."signup_page_content_growth_trust_items" USING btree ("_parent_id");
  CREATE INDEX "signup_page_content_accelerate_features_order_idx" ON "payload"."signup_page_content_accelerate_features" USING btree ("_order");
  CREATE INDEX "signup_page_content_accelerate_features_parent_id_idx" ON "payload"."signup_page_content_accelerate_features" USING btree ("_parent_id");
  CREATE INDEX "signup_page_content_accelerate_trust_items_order_idx" ON "payload"."signup_page_content_accelerate_trust_items" USING btree ("_order");
  CREATE INDEX "signup_page_content_accelerate_trust_items_parent_id_idx" ON "payload"."signup_page_content_accelerate_trust_items" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."signup_page_content_foundations_features" CASCADE;
  DROP TABLE "payload"."signup_page_content_foundations_trust_items" CASCADE;
  DROP TABLE "payload"."signup_page_content_growth_features" CASCADE;
  DROP TABLE "payload"."signup_page_content_growth_trust_items" CASCADE;
  DROP TABLE "payload"."signup_page_content_accelerate_features" CASCADE;
  DROP TABLE "payload"."signup_page_content_accelerate_trust_items" CASCADE;
  DROP TABLE "payload"."signup_page_content" CASCADE;`)
}
