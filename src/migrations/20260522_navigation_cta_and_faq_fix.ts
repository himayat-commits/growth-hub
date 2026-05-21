import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Marketing-review fixes for the production Navigation global:
//   1. ctaHref was '#contact' on production — the prominent "Sign Up Now"
//      button in the nav just scrolled to the contact form instead of
//      starting the WorkOS sign-up flow. Repoint to /sign-up.
//   2. The FAQ nav item pointed at /#faq, but the homepage has no FAQ
//      section (the FAQ component is only rendered on /pricing). Repoint
//      to /pricing#faq so the link actually goes somewhere.
//
// Both changes are idempotent — only update when the current value
// matches the broken one, so editors who've already fixed via /admin
// don't get clobbered.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "payload"."navigation"
       SET "cta_href" = '/sign-up?redirect_url=%2Fportal'
     WHERE "cta_href" = '#contact';

    UPDATE "payload"."navigation_nav_items"
       SET "href" = '/pricing#faq'
     WHERE "href" = '/#faq';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "payload"."navigation"
       SET "cta_href" = '#contact'
     WHERE "cta_href" = '/sign-up?redirect_url=%2Fportal';

    UPDATE "payload"."navigation_nav_items"
       SET "href" = '/#faq'
     WHERE "href" = '/pricing#faq';
  `)
}
