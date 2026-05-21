import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Public-events extension: adds the fields the /(main)/events hub + detail
// pages read from. Existing dashboard fields (type, seats, registerUrl,
// recording) are unchanged.
//
// `slug` is unique. For existing rows we backfill from title using a basic
// lower-case + non-alnum-to-dash transform. If two titles collide on the
// generated slug the migration will fail loudly — fix by editing the
// duplicate title before re-running.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "payload"."enum_events_category" AS ENUM('summit', 'workshop', 'mixer', 'clinic', 'community', 'webinar');

    ALTER TABLE "payload"."events" ADD COLUMN "slug" varchar;
    ALTER TABLE "payload"."events" ADD COLUMN "category" "payload"."enum_events_category" DEFAULT 'workshop';
    ALTER TABLE "payload"."events" ADD COLUMN "tag" varchar;
    ALTER TABLE "payload"."events" ADD COLUMN "audience" varchar;
    ALTER TABLE "payload"."events" ADD COLUMN "cost" varchar DEFAULT 'Free';
    ALTER TABLE "payload"."events" ADD COLUMN "date_display" varchar;
    ALTER TABLE "payload"."events" ADD COLUMN "bespoke" boolean DEFAULT false;

    -- Backfill slug from title for existing rows.
    UPDATE "payload"."events"
       SET "slug" = trim(both '-' from regexp_replace(lower("title"), '[^a-z0-9]+', '-', 'g'))
     WHERE "slug" IS NULL;

    -- Mirror existing type column into category for early rows so the public
    -- hub shows something sensible until an editor sets the category explicitly.
    UPDATE "payload"."events" SET "category" = "type"::text::"payload"."enum_events_category"
     WHERE "type" IS NOT NULL AND "category" = 'workshop';

    CREATE UNIQUE INDEX "events_slug_idx" ON "payload"."events" USING btree ("slug");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "payload"."events_slug_idx";
    ALTER TABLE "payload"."events" DROP COLUMN IF EXISTS "slug";
    ALTER TABLE "payload"."events" DROP COLUMN IF EXISTS "category";
    ALTER TABLE "payload"."events" DROP COLUMN IF EXISTS "tag";
    ALTER TABLE "payload"."events" DROP COLUMN IF EXISTS "audience";
    ALTER TABLE "payload"."events" DROP COLUMN IF EXISTS "cost";
    ALTER TABLE "payload"."events" DROP COLUMN IF EXISTS "date_display";
    ALTER TABLE "payload"."events" DROP COLUMN IF EXISTS "bespoke";
    DROP TYPE IF EXISTS "payload"."enum_events_category";
  `)
}
