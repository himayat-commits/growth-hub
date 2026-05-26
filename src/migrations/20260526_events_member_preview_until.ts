import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Adds the member_preview_until timestamp column to payload.events. When
// set, signed-in members can RSVP normally but the public mailto CTA on
// the event detail page is replaced with a "Members get early access"
// banner until the timestamp passes.
//
// Nullable so existing events stay open-RSVP. Hand-written (rather than
// payload:migrate:create) for the same reason as previous Tier 1+ event
// migrations — the auto-generator emits a full schema diff including
// already-applied statements and fails on "already exists".

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."events"
      ADD COLUMN IF NOT EXISTS "member_preview_until" timestamp(3) with time zone;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."events"
      DROP COLUMN IF EXISTS "member_preview_until";
  `)
}
