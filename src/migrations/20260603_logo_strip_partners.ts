import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Adds the `partners` hasMany relationship to the home page's logo-strip
// block (LogoStrip.ts). The block now renders each partner's uploaded logo
// and links it to /partners/{slug}.
//
// Payload stores block relationships in the page's shared relationship join
// tables, so this adds a `partners_id` FK column to BOTH:
//   - pages_rels        (published docs)
//   - _pages_v_rels     (versions / drafts — Pages has versioning enabled)
//
// Matches the existing logos relationship wiring (pages_rels_logos_fk /
// _idx). All additive + nullable; existing rows keep rendering via the
// component-side text fallback. Hand-written + idempotent for the same
// reason as prior Tier 1+ migrations — payload migrate:create re-emits a
// full diff that fails on already-applied statements.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- pages_rels.partners_id ──────────────────────────────────────────────
    ALTER TABLE "payload"."pages_rels"
      ADD COLUMN IF NOT EXISTS "partners_id" integer;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pages_rels_partners_fk') THEN
        ALTER TABLE "payload"."pages_rels"
          ADD CONSTRAINT "pages_rels_partners_fk"
          FOREIGN KEY ("partners_id") REFERENCES "payload"."partners"("id")
          ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "pages_rels_partners_id_idx"
      ON "payload"."pages_rels" USING btree ("partners_id");

    -- _pages_v_rels.partners_id ───────────────────────────────────────────
    ALTER TABLE "payload"."_pages_v_rels"
      ADD COLUMN IF NOT EXISTS "partners_id" integer;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_pages_v_rels_partners_fk') THEN
        ALTER TABLE "payload"."_pages_v_rels"
          ADD CONSTRAINT "_pages_v_rels_partners_fk"
          FOREIGN KEY ("partners_id") REFERENCES "payload"."partners"("id")
          ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "_pages_v_rels_partners_id_idx"
      ON "payload"."_pages_v_rels" USING btree ("partners_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."pages_rels"
      DROP CONSTRAINT IF EXISTS "pages_rels_partners_fk";
    DROP INDEX IF EXISTS "payload"."pages_rels_partners_id_idx";
    ALTER TABLE "payload"."pages_rels" DROP COLUMN IF EXISTS "partners_id";

    ALTER TABLE "payload"."_pages_v_rels"
      DROP CONSTRAINT IF EXISTS "_pages_v_rels_partners_fk";
    DROP INDEX IF EXISTS "payload"."_pages_v_rels_partners_id_idx";
    ALTER TABLE "payload"."_pages_v_rels" DROP COLUMN IF EXISTS "partners_id";
  `)
}
