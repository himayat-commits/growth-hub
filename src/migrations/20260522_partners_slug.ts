import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Adds a unique slug column to Partners so /partners/[slug] deep pages
// can render. Backfills from name via lower() + regexp_replace — same
// pattern as the Events public-fields migration.
//
// If two partner names collide on the generated slug, the unique index
// creation fails loudly. Fix by editing one name before re-running.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."partners" ADD COLUMN "slug" varchar;

    UPDATE "payload"."partners"
       SET "slug" = trim(both '-' from regexp_replace(lower("name"), '[^a-z0-9]+', '-', 'g'))
     WHERE "slug" IS NULL;

    CREATE UNIQUE INDEX "partners_slug_idx" ON "payload"."partners" USING btree ("slug");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "payload"."partners_slug_idx";
    ALTER TABLE "payload"."partners" DROP COLUMN IF EXISTS "slug";
  `)
}
