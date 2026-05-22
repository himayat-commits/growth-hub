import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Partners-page redesign: adds four new fields to the BecomePartnerCTA
// right-side meta block.
//
//   partnership_lead    Named partnership lead (e.g. "Amal — Director of Growth")
//   partner_email       Partnership-specific inbox (defaults to partners@himayat.com.au)
//   deck_url            Link to the partnership deck PDF. When set, the
//                       secondary CTA becomes "Download partnership deck (PDF)".
//   requirements_url    Optional link to a partner-requirements page.
//
// Existing copy (hero/benefits/proof/become) is unchanged — refresh it via
// scripts/seed.ts or the /admin Partners-Page global if you want the
// new mockup defaults. The component is built so an empty meta block
// degrades gracefully.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."partners_page" ADD COLUMN "partnership_lead" varchar;
    ALTER TABLE "payload"."partners_page" ADD COLUMN "partner_email" varchar;
    ALTER TABLE "payload"."partners_page" ADD COLUMN "deck_url" varchar;
    ALTER TABLE "payload"."partners_page" ADD COLUMN "requirements_url" varchar;

    -- Sensible defaults for the singleton row only. Leaves nothing to do
    -- on a fresh DB (no row exists yet) and idempotent on subsequent runs.
    UPDATE "payload"."partners_page"
       SET "partner_email" = 'partners@himayat.com.au'
     WHERE "partner_email" IS NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."partners_page" DROP COLUMN IF EXISTS "partnership_lead";
    ALTER TABLE "payload"."partners_page" DROP COLUMN IF EXISTS "partner_email";
    ALTER TABLE "payload"."partners_page" DROP COLUMN IF EXISTS "deck_url";
    ALTER TABLE "payload"."partners_page" DROP COLUMN IF EXISTS "requirements_url";
  `)
}
