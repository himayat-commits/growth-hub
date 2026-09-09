import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Adds Events.meetingUrl — the Zoom/Meet join link for online events. Shown
// only to signed-in members who have RSVP'd (my-events + confirmation /
// reminder emails); never on the public page or the public .ics.
//
// Nullable, no backfill. Hand-written for the same reason as every other
// events migration: payload:migrate:create diffs the whole schema and fails
// on "already exists". In production this file is NOT run by `payload
// migrate` (see scripts/prod-migrate.mjs) — apply the ALTER by hand:
//
//   ALTER TABLE "payload"."events" ADD COLUMN IF NOT EXISTS "meeting_url" varchar;

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."events" ADD COLUMN IF NOT EXISTS "meeting_url" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."events" DROP COLUMN IF EXISTS "meeting_url";
  `)
}
