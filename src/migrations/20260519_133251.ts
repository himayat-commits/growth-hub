import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_events_type" AS ENUM('webinar', 'workshop', 'community');
  CREATE TYPE "payload"."enum_resources_tag" AS ENUM('Guide', 'Template', 'Course', 'Video', 'Webinar');
  CREATE TYPE "payload"."enum_resources_tone" AS ENUM('cream', 'lime', 'teal', 'plum', 'lav');
  CREATE TABLE "payload"."events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"date" timestamp(3) with time zone NOT NULL,
  	"time" varchar,
  	"type" "payload"."enum_events_type" DEFAULT 'webinar',
  	"location" varchar,
  	"seats" varchar,
  	"register_url" varchar,
  	"recording_id" integer,
  	"featured" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."resources" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"tag" "payload"."enum_resources_tag" DEFAULT 'Guide' NOT NULL,
  	"tone" "payload"."enum_resources_tone" DEFAULT 'cream',
  	"meta" varchar,
  	"thumbnail_id" integer,
  	"url" varchar,
  	"free" boolean DEFAULT true,
  	"published_at" timestamp(3) with time zone,
  	"featured" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "events_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "resources_id" integer;
  ALTER TABLE "payload"."events" ADD CONSTRAINT "events_recording_id_media_id_fk" FOREIGN KEY ("recording_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."resources" ADD CONSTRAINT "resources_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "events_recording_idx" ON "payload"."events" USING btree ("recording_id");
  CREATE INDEX "events_updated_at_idx" ON "payload"."events" USING btree ("updated_at");
  CREATE INDEX "events_created_at_idx" ON "payload"."events" USING btree ("created_at");
  CREATE INDEX "resources_thumbnail_idx" ON "payload"."resources" USING btree ("thumbnail_id");
  CREATE INDEX "resources_updated_at_idx" ON "payload"."resources" USING btree ("updated_at");
  CREATE INDEX "resources_created_at_idx" ON "payload"."resources" USING btree ("created_at");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "payload"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_resources_fk" FOREIGN KEY ("resources_id") REFERENCES "payload"."resources"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_events_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("events_id");
  CREATE INDEX "payload_locked_documents_rels_resources_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("resources_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."events" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."resources" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."events" CASCADE;
  DROP TABLE "payload"."resources" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_events_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_resources_fk";
  
  DROP INDEX "payload"."payload_locked_documents_rels_events_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_resources_id_idx";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "events_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "resources_id";
  DROP TYPE "payload"."enum_events_type";
  DROP TYPE "payload"."enum_resources_tag";
  DROP TYPE "payload"."enum_resources_tone";`)
}
