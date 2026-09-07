import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Adds the Products collection — the merch catalogue behind /shop.
//
// Stock and orders are NOT here: they live in the Drizzle `public` schema
// (public.inventory / public.orders / public.order_items, migration
// drizzle/0015_shop_orders_inventory.sql) keyed by the variant SKU string.
// No FK crosses the schema boundary; the app tolerates orphaned SKUs.
//
// Payload migrations are applied by hand as raw SQL (not in CI) — see
// DEPLOY_CHECKLIST.md. Every statement is guarded so a partial re-run is safe.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "payload"."enum_products_status" AS ENUM('draft', 'published', 'archived');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      CREATE TYPE "payload"."enum_products_category" AS ENUM('apparel', 'accessories', 'stationery', 'other');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    CREATE TABLE IF NOT EXISTS "payload"."products" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "slug" varchar,
      "status" "payload"."enum_products_status" DEFAULT 'draft' NOT NULL,
      "category" "payload"."enum_products_category" DEFAULT 'apparel',
      "short_description" varchar,
      "description" jsonb,
      "price_cents" numeric NOT NULL,
      "member_discount_pct" numeric DEFAULT 10,
      "featured" boolean DEFAULT false,
      "sort_order" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "payload"."products_variants" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "sku" varchar NOT NULL,
      "size" varchar,
      "colour" varchar,
      "price_cents_override" numeric,
      "weight_grams" numeric
    );

    CREATE TABLE IF NOT EXISTS "payload"."products_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "media_id" integer
    );

    ALTER TABLE "payload"."payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "products_id" integer;

    DO $$ BEGIN
      ALTER TABLE "payload"."products_variants"
        ADD CONSTRAINT "products_variants_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "payload"."products"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "payload"."products_rels"
        ADD CONSTRAINT "products_rels_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "payload"."products"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "payload"."products_rels"
        ADD CONSTRAINT "products_rels_media_fk"
        FOREIGN KEY ("media_id") REFERENCES "payload"."media"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "payload"."payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_products_fk"
        FOREIGN KEY ("products_id") REFERENCES "payload"."products"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    CREATE UNIQUE INDEX IF NOT EXISTS "products_slug_idx" ON "payload"."products" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "products_updated_at_idx" ON "payload"."products" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "products_created_at_idx" ON "payload"."products" USING btree ("created_at");

    CREATE INDEX IF NOT EXISTS "products_variants_order_idx" ON "payload"."products_variants" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "products_variants_parent_id_idx" ON "payload"."products_variants" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "products_variants_sku_idx" ON "payload"."products_variants" USING btree ("sku");

    CREATE INDEX IF NOT EXISTS "products_rels_order_idx" ON "payload"."products_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "products_rels_parent_idx" ON "payload"."products_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "products_rels_path_idx" ON "payload"."products_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "products_rels_media_id_idx" ON "payload"."products_rels" USING btree ("media_id");

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_products_id_idx"
      ON "payload"."payload_locked_documents_rels" USING btree ("products_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_products_fk";
    DROP INDEX IF EXISTS "payload"."payload_locked_documents_rels_products_id_idx";
    ALTER TABLE "payload"."payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "products_id";

    DROP TABLE IF EXISTS "payload"."products_rels" CASCADE;
    DROP TABLE IF EXISTS "payload"."products_variants" CASCADE;
    DROP TABLE IF EXISTS "payload"."products" CASCADE;

    DROP TYPE IF EXISTS "payload"."enum_products_status";
    DROP TYPE IF EXISTS "payload"."enum_products_category";
  `)
}
