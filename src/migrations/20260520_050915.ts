import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_services_category" AS ENUM('strategy', 'build', 'marketing', 'ops');
  CREATE TYPE "payload"."enum_services_tone" AS ENUM('lime', 'teal', 'plum', 'lav');
  CREATE TYPE "payload"."enum_services_icon" AS ENUM('cal', 'globe', 'megaphone', 'type', 'trend', 'share', 'briefcase');
  CREATE TABLE "payload"."services" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"category" "payload"."enum_services_category" DEFAULT 'strategy',
  	"tone" "payload"."enum_services_tone" DEFAULT 'teal',
  	"icon" "payload"."enum_services_icon" DEFAULT 'briefcase',
  	"price" varchar,
  	"price_label" varchar,
  	"cta_label" varchar DEFAULT 'Request',
  	"active" boolean DEFAULT true,
  	"sort_order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "services_id" integer;
  CREATE UNIQUE INDEX "services_slug_idx" ON "payload"."services" USING btree ("slug");
  CREATE INDEX "services_updated_at_idx" ON "payload"."services" USING btree ("updated_at");
  CREATE INDEX "services_created_at_idx" ON "payload"."services" USING btree ("created_at");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "payload"."services"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_services_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("services_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."services" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."services" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_services_fk";
  
  DROP INDEX "payload"."payload_locked_documents_rels_services_id_idx";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "services_id";
  DROP TYPE "payload"."enum_services_category";
  DROP TYPE "payload"."enum_services_tone";
  DROP TYPE "payload"."enum_services_icon";`)
}
