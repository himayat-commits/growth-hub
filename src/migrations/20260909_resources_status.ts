import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Adds the `status` select to payload.resources so editors can hold a
// half-finished guide as a draft instead of it going live within the hour
// (GTM review F5.6). Payload stores selects as a Postgres enum named
// enum_<table>_<field> (see 20260511_075336.ts), so the type is created
// first, guarded like 20260907_add_products.ts so a partial re-run is safe.
//
// DEFAULT 'published' (not 'draft' as on posts): every existing row was
// live, and ADD COLUMN ... DEFAULT backfills them in place. The column is
// left nullable to match how Payload emits selects; the read helpers treat
// NULL as published as a second line of defence.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "payload"."enum_resources_status" AS ENUM('draft', 'published');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    ALTER TABLE "payload"."resources"
      ADD COLUMN IF NOT EXISTS "status" "payload"."enum_resources_status" DEFAULT 'published';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."resources" DROP COLUMN IF EXISTS "status";
    DROP TYPE IF EXISTS "payload"."enum_resources_status";
  `)
}
