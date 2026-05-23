import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Adds the Strategists collection — named humans assigned 1:1 to each
// member. Slug is the stable key referenced by
// user_profiles.assigned_strategist_id in the public schema (no FK across
// schemas; orphaned slugs are tolerated and the UI falls back to "Growth
// Hub Team").

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE "payload"."strategists" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "slug" varchar,
      "role" varchar NOT NULL,
      "photo_id" integer,
      "email" varchar NOT NULL,
      "bio" jsonb,
      "calendly_url" varchar,
      "active" boolean DEFAULT true,
      "order" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "payload"."payload_locked_documents_rels"
      ADD COLUMN "strategists_id" integer;

    CREATE UNIQUE INDEX "strategists_slug_idx"
      ON "payload"."strategists" USING btree ("slug");
    CREATE INDEX "strategists_photo_id_idx"
      ON "payload"."strategists" USING btree ("photo_id");
    CREATE INDEX "strategists_updated_at_idx"
      ON "payload"."strategists" USING btree ("updated_at");
    CREATE INDEX "strategists_created_at_idx"
      ON "payload"."strategists" USING btree ("created_at");

    ALTER TABLE "payload"."strategists"
      ADD CONSTRAINT "strategists_photo_id_fk"
      FOREIGN KEY ("photo_id") REFERENCES "payload"."media"("id")
      ON DELETE set null ON UPDATE no action;

    ALTER TABLE "payload"."payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_strategists_fk"
      FOREIGN KEY ("strategists_id") REFERENCES "payload"."strategists"("id")
      ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "payload_locked_documents_rels_strategists_id_idx"
      ON "payload"."payload_locked_documents_rels" USING btree ("strategists_id");

    INSERT INTO "payload"."strategists"
      ("name", "slug", "role", "email", "active", "order")
    VALUES
      ('Growth Hub Team', 'growth-hub-team', 'Strategy Team', 'team@himayat.com.au', false, 999);
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_strategists_fk";
    DROP INDEX IF EXISTS "payload"."payload_locked_documents_rels_strategists_id_idx";
    ALTER TABLE "payload"."payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "strategists_id";

    DROP TABLE IF EXISTS "payload"."strategists" CASCADE;
  `)
}
