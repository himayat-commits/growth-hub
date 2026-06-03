import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Corrective migration — fixes a column-naming convention bug introduced by
// 20260529_partners_directory_gtm.
//
// That migration hand-created the `partners_secondary_categories` junction
// (the Partners.secondaryCategories hasMany-select field) using the ARRAY /
// BLOCK convention `_order` / `_parent_id`. Payload's generated schema for a
// hasMany *select* field uses the un-prefixed `order` / `parent_id` (the same
// convention as the `*_rels` tables). The mismatch surfaced as a drizzle push
// "create or rename?" prompt and means Payload's runtime queries for
// secondaryCategories target columns the table doesn't have.
//
// Rename the two columns into the form Payload expects. Postgres rewires the
// existing index + FK definitions to the renamed columns automatically, and
// the index/constraint NAMES already match Payload's expectation, so only the
// columns need touching.
//
// Fully guarded + idempotent: each rename runs only when the old column still
// exists and the correct one does not — so it's a safe no-op anywhere the
// table is already in the right shape.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'payload'
          AND table_name = 'partners_secondary_categories'
          AND column_name = '_order'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'payload'
          AND table_name = 'partners_secondary_categories'
          AND column_name = 'order'
      ) THEN
        ALTER TABLE "payload"."partners_secondary_categories"
          RENAME COLUMN "_order" TO "order";
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'payload'
          AND table_name = 'partners_secondary_categories'
          AND column_name = '_parent_id'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'payload'
          AND table_name = 'partners_secondary_categories'
          AND column_name = 'parent_id'
      ) THEN
        ALTER TABLE "payload"."partners_secondary_categories"
          RENAME COLUMN "_parent_id" TO "parent_id";
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Revert to the (incorrect) original column names so this migration is
  // cleanly reversible alongside 20260529.
  await db.execute(sql`
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'payload'
          AND table_name = 'partners_secondary_categories'
          AND column_name = 'order'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'payload'
          AND table_name = 'partners_secondary_categories'
          AND column_name = '_order'
      ) THEN
        ALTER TABLE "payload"."partners_secondary_categories"
          RENAME COLUMN "order" TO "_order";
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'payload'
          AND table_name = 'partners_secondary_categories'
          AND column_name = 'parent_id'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'payload'
          AND table_name = 'partners_secondary_categories'
          AND column_name = '_parent_id'
      ) THEN
        ALTER TABLE "payload"."partners_secondary_categories"
          RENAME COLUMN "parent_id" TO "_parent_id";
      END IF;
    END $$;
  `)
}
