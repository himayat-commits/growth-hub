import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Adds the SiteSettings.communityLinks group — invite URLs to the member
// community groups (Slack / Facebook / WhatsApp / forum). Surfaced on the
// member Benefits page once an editor fills them in. All nullable; no backfill.
//
// Group fields flatten to "<group>_<field>" columns, matching the existing
// social_links_* convention on this table.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."site_settings" ADD COLUMN "community_links_slack" varchar;
    ALTER TABLE "payload"."site_settings" ADD COLUMN "community_links_facebook" varchar;
    ALTER TABLE "payload"."site_settings" ADD COLUMN "community_links_whatsapp" varchar;
    ALTER TABLE "payload"."site_settings" ADD COLUMN "community_links_forum" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."site_settings" DROP COLUMN IF EXISTS "community_links_slack";
    ALTER TABLE "payload"."site_settings" DROP COLUMN IF EXISTS "community_links_facebook";
    ALTER TABLE "payload"."site_settings" DROP COLUMN IF EXISTS "community_links_whatsapp";
    ALTER TABLE "payload"."site_settings" DROP COLUMN IF EXISTS "community_links_forum";
  `)
}
