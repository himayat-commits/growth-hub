import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Partners directory GTM expansion:
//
//   1. `partners.is_anchor`            — flags an "anchor partner", gets the
//                                        2-col card variant + sort priority.
//   2. `partners_secondary_categories` — child table for the new hasMany
//                                        select. Lets a partner span more
//                                        than one category section in the
//                                        directory (e.g. ACT Government).
//   3. `partners_page` adds            — Hero tertiary CTA fields (Refer a
//                                        partner) and the inline Recruitment
//                                        Card fields (heading/body/cta).
//   4. `partners_page_recruit_needs`   — child table for the recruitment
//                                        card's needs[] (legal / accounting /
//                                        trades-training etc.).
//
// All additions are nullable / default-safe so existing rows continue to
// render with the component-side fallbacks introduced alongside this change.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- 1. partners.is_anchor ─────────────────────────────────────────────────
    ALTER TABLE "payload"."partners"
      ADD COLUMN IF NOT EXISTS "is_anchor" boolean DEFAULT false;

    -- 2. partners_secondary_categories ──────────────────────────────────────
    CREATE TABLE IF NOT EXISTS "payload"."partners_secondary_categories" (
      "_order"     integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id"         varchar PRIMARY KEY,
      "value"      "payload"."enum_partners_category" NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "payload"."partners_secondary_categories"
        ADD CONSTRAINT "partners_secondary_categories_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "payload"."partners"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "partners_secondary_categories_order_idx"
      ON "payload"."partners_secondary_categories" ("_order");
    CREATE INDEX IF NOT EXISTS "partners_secondary_categories_parent_id_idx"
      ON "payload"."partners_secondary_categories" ("_parent_id");

    -- 3. partners_page singleton columns ────────────────────────────────────
    ALTER TABLE "payload"."partners_page"
      ADD COLUMN IF NOT EXISTS "hero_tertiary_cta_label" varchar DEFAULT 'Refer a partner';
    ALTER TABLE "payload"."partners_page"
      ADD COLUMN IF NOT EXISTS "hero_tertiary_cta_href" varchar;
    ALTER TABLE "payload"."partners_page"
      ADD COLUMN IF NOT EXISTS "hero_tertiary_cta_hint" varchar DEFAULT '— know someone we should meet?';

    ALTER TABLE "payload"."partners_page"
      ADD COLUMN IF NOT EXISTS "recruit_heading" varchar DEFAULT 'Could you be here?';
    ALTER TABLE "payload"."partners_page"
      ADD COLUMN IF NOT EXISTS "recruit_body" varchar;
    ALTER TABLE "payload"."partners_page"
      ADD COLUMN IF NOT EXISTS "recruit_cta_label" varchar DEFAULT 'Become a partner';
    ALTER TABLE "payload"."partners_page"
      ADD COLUMN IF NOT EXISTS "recruit_cta_href" varchar DEFAULT '#become';

    -- 4. partners_page_recruit_needs ────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS "payload"."partners_page_recruit_needs" (
      "_order"     integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id"         varchar PRIMARY KEY,
      "text"       varchar NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "payload"."partners_page_recruit_needs"
        ADD CONSTRAINT "partners_page_recruit_needs_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "payload"."partners_page"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "partners_page_recruit_needs_order_idx"
      ON "payload"."partners_page_recruit_needs" ("_order");
    CREATE INDEX IF NOT EXISTS "partners_page_recruit_needs_parent_id_idx"
      ON "payload"."partners_page_recruit_needs" ("_parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "payload"."partners_page_recruit_needs";
    DROP TABLE IF EXISTS "payload"."partners_secondary_categories";

    ALTER TABLE "payload"."partners_page" DROP COLUMN IF EXISTS "recruit_cta_href";
    ALTER TABLE "payload"."partners_page" DROP COLUMN IF EXISTS "recruit_cta_label";
    ALTER TABLE "payload"."partners_page" DROP COLUMN IF EXISTS "recruit_body";
    ALTER TABLE "payload"."partners_page" DROP COLUMN IF EXISTS "recruit_heading";
    ALTER TABLE "payload"."partners_page" DROP COLUMN IF EXISTS "hero_tertiary_cta_hint";
    ALTER TABLE "payload"."partners_page" DROP COLUMN IF EXISTS "hero_tertiary_cta_href";
    ALTER TABLE "payload"."partners_page" DROP COLUMN IF EXISTS "hero_tertiary_cta_label";

    ALTER TABLE "payload"."partners" DROP COLUMN IF EXISTS "is_anchor";
  `)
}
