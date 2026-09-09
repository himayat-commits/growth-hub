import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Strategists.specialties — hasMany select used to route members to the
// strategist who covers their need (src/lib/advisory/needs.ts NEEDS).
//
// Payload's postgres adapter stores a hasMany select as a child table named
// `<collection>_<field>` with the *_rels column convention (`order`,
// `parent_id` — NOT the array/block `_order`/`_parent_id`; see the
// 20260603 corrective migration for what happens when that is mixed up),
// a `value` column typed as `enum_<collection>_<field>`, and a serial id.
//
// Apply BY HAND (raw SQL against prod) before deploying the code that adds
// the field — `payload migrate` is not run in CI on this project. The
// statements are idempotent so re-running is harmless.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "payload"."enum_strategists_specialties" AS ENUM(
        'starting_business',
        'behind_on_digital',
        'marketing_growth',
        'website',
        'funding_grants',
        'other'
      );
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    CREATE TABLE IF NOT EXISTS "payload"."strategists_specialties" (
      "order"     integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value"     "payload"."enum_strategists_specialties",
      "id"        serial PRIMARY KEY NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "payload"."strategists_specialties"
        ADD CONSTRAINT "strategists_specialties_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "payload"."strategists"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "strategists_specialties_order_idx"
      ON "payload"."strategists_specialties" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "strategists_specialties_parent_idx"
      ON "payload"."strategists_specialties" USING btree ("parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "payload"."strategists_specialties" CASCADE;
    DROP TYPE IF EXISTS "payload"."enum_strategists_specialties";
  `)
}
