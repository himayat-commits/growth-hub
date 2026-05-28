import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Two polish-tier additions in one migration:
//
//   1. payload.events_key_metrics — junction table for the new
//      Events.keyMetrics array field. Lets editors restore the "84
//      attendees / 92% would recommend" stats grid on /events under
//      "From the archive" (the stats grid was dropped in PR #54 when
//      the hardcoded past-events array was replaced with a CMS query,
//      because the schema had no field for them).
//
//   2. payload.case_studies.partner_id — single relationship FK to
//      payload.partners. Replaces the brittle `client = partner.name`
//      string match used by /with/{slug} so editors can author the
//      relation directly in admin.
//
// Both are additive + nullable; safe to apply ahead of code deploy.
// Hand-written for the same reason as previous Tier 1+ migrations —
// payload migrate:create emits a full diff that re-runs
// already-applied statements and fails on "already exists".

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- 1. events_key_metrics junction table for the array field
    CREATE TABLE IF NOT EXISTS "payload"."events_key_metrics" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "value" varchar NOT NULL,
      "label" varchar NOT NULL
    );

    -- Postgres doesn't support ADD CONSTRAINT IF NOT EXISTS — guard with DO.
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'events_key_metrics_parent_fk') THEN
        ALTER TABLE "payload"."events_key_metrics"
          ADD CONSTRAINT "events_key_metrics_parent_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "payload"."events"("id")
          ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "events_key_metrics_order_idx"
      ON "payload"."events_key_metrics" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "events_key_metrics_parent_id_idx"
      ON "payload"."events_key_metrics" USING btree ("_parent_id");

    -- 2. case_studies.partner_id single relationship FK
    ALTER TABLE "payload"."case_studies"
      ADD COLUMN IF NOT EXISTS "partner_id" integer;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'case_studies_partner_id_partners_id_fk') THEN
        ALTER TABLE "payload"."case_studies"
          ADD CONSTRAINT "case_studies_partner_id_partners_id_fk"
          FOREIGN KEY ("partner_id") REFERENCES "payload"."partners"("id")
          ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "case_studies_partner_idx"
      ON "payload"."case_studies" USING btree ("partner_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."case_studies"
      DROP CONSTRAINT IF EXISTS "case_studies_partner_id_partners_id_fk";
    DROP INDEX IF EXISTS "payload"."case_studies_partner_idx";
    ALTER TABLE "payload"."case_studies" DROP COLUMN IF EXISTS "partner_id";

    DROP TABLE IF EXISTS "payload"."events_key_metrics" CASCADE;
  `)
}
