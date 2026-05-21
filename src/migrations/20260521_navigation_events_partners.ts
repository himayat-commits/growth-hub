import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Idempotently inserts Events + Partners into the existing Navigation
// global's navItems list. Won't duplicate if either is already there.
//
// New items are appended after the current max _order so other entries
// keep their position. Editors can re-order in /admin afterwards.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    DECLARE
      v_parent_id integer;
      v_max_order integer;
    BEGIN
      -- Navigation is a singleton global; grab its id.
      SELECT id INTO v_parent_id FROM "payload"."navigation" ORDER BY id LIMIT 1;
      IF v_parent_id IS NULL THEN
        -- No navigation row yet (fresh DB). Skip — scripts/seed.ts
        -- will create the global with the right items.
        RETURN;
      END IF;

      SELECT COALESCE(MAX("_order"), 0) INTO v_max_order
        FROM "payload"."navigation_nav_items"
       WHERE "_parent_id" = v_parent_id;

      -- Events
      IF NOT EXISTS (
        SELECT 1 FROM "payload"."navigation_nav_items"
         WHERE "_parent_id" = v_parent_id AND "href" = '/events'
      ) THEN
        v_max_order := v_max_order + 1;
        INSERT INTO "payload"."navigation_nav_items" ("_order", "_parent_id", "id", "label", "href", "is_external")
        VALUES (v_max_order, v_parent_id, md5(random()::text || clock_timestamp()::text), 'Events', '/events', false);
      END IF;

      -- Partners
      IF NOT EXISTS (
        SELECT 1 FROM "payload"."navigation_nav_items"
         WHERE "_parent_id" = v_parent_id AND "href" = '/partners'
      ) THEN
        v_max_order := v_max_order + 1;
        INSERT INTO "payload"."navigation_nav_items" ("_order", "_parent_id", "id", "label", "href", "is_external")
        VALUES (v_max_order, v_parent_id, md5(random()::text || clock_timestamp()::text), 'Partners', '/partners', false);
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Remove only the items this migration added. We match by href since the
  // ids are generated at up-time and not stable across runs.
  await db.execute(sql`
    DELETE FROM "payload"."navigation_nav_items"
     WHERE "href" IN ('/events', '/partners');
  `)
}
