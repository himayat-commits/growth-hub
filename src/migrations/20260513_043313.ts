import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_partners_type" AS ENUM('technology', 'community', 'enterprise', 'funding', 'media');
  CREATE TYPE "payload"."enum_partners_status" AS ENUM('draft', 'published');
  CREATE TABLE "payload"."partners" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"type" "payload"."enum_partners_type" NOT NULL,
  	"description" varchar,
  	"website" varchar,
  	"contact_name" varchar,
  	"contact_email" varchar,
  	"contact_phone" varchar,
  	"logo_id" integer,
  	"featured" boolean DEFAULT false,
  	"order" numeric DEFAULT 0,
  	"status" "payload"."enum_partners_status" DEFAULT 'draft' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."partners_page_hero_chips" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."partners_page_benefits" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar NOT NULL,
  	"heading" varchar NOT NULL,
  	"body" varchar NOT NULL,
  	"handnote" varchar
  );
  
  CREATE TABLE "payload"."partners_page_proof_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar,
  	"num" varchar NOT NULL,
  	"unit" varchar,
  	"heading" varchar NOT NULL,
  	"body" varchar
  );
  
  CREATE TABLE "payload"."partners_page_proof_quotes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL,
  	"attribution" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."partners_page_become_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."partners_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_eyebrow" varchar DEFAULT 'Strategic Partners',
  	"hero_heading" varchar DEFAULT 'Better together.',
  	"hero_subheading" varchar,
  	"hero_cta_label" varchar DEFAULT 'Become a Partner',
  	"hero_cta_href" varchar DEFAULT '#become',
  	"hero_secondary_cta_label" varchar DEFAULT 'View Directory',
  	"hero_secondary_cta_href" varchar DEFAULT '#directory',
  	"featured_wall_heading" varchar DEFAULT 'Featured partners',
  	"featured_wall_lead" varchar,
  	"directory_heading" varchar DEFAULT 'Meet our partners.',
  	"directory_lead" varchar,
  	"benefits_heading" varchar DEFAULT 'Why partner with Growth Hub?',
  	"benefits_lead" varchar,
  	"proof_heading" varchar DEFAULT 'Impact by the numbers.',
  	"proof_lead" varchar,
  	"become_heading" varchar DEFAULT 'Become a partner.',
  	"become_body" varchar,
  	"become_cta_label" varchar DEFAULT 'Get in touch',
  	"become_cta_href" varchar DEFAULT 'mailto:hello@himayat.com.au?subject=Partnership%20Enquiry',
  	"become_secondary_cta_label" varchar DEFAULT 'View packages',
  	"become_secondary_cta_href" varchar DEFAULT '/#packages',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "partners_id" integer;
  ALTER TABLE "payload"."partners" ADD CONSTRAINT "partners_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."partners_page_hero_chips" ADD CONSTRAINT "partners_page_hero_chips_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."partners_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."partners_page_benefits" ADD CONSTRAINT "partners_page_benefits_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."partners_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."partners_page_proof_stats" ADD CONSTRAINT "partners_page_proof_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."partners_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."partners_page_proof_quotes" ADD CONSTRAINT "partners_page_proof_quotes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."partners_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."partners_page_become_bullets" ADD CONSTRAINT "partners_page_become_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."partners_page"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "partners_logo_idx" ON "payload"."partners" USING btree ("logo_id");
  CREATE INDEX "partners_updated_at_idx" ON "payload"."partners" USING btree ("updated_at");
  CREATE INDEX "partners_created_at_idx" ON "payload"."partners" USING btree ("created_at");
  CREATE INDEX "partners_page_hero_chips_order_idx" ON "payload"."partners_page_hero_chips" USING btree ("_order");
  CREATE INDEX "partners_page_hero_chips_parent_id_idx" ON "payload"."partners_page_hero_chips" USING btree ("_parent_id");
  CREATE INDEX "partners_page_benefits_order_idx" ON "payload"."partners_page_benefits" USING btree ("_order");
  CREATE INDEX "partners_page_benefits_parent_id_idx" ON "payload"."partners_page_benefits" USING btree ("_parent_id");
  CREATE INDEX "partners_page_proof_stats_order_idx" ON "payload"."partners_page_proof_stats" USING btree ("_order");
  CREATE INDEX "partners_page_proof_stats_parent_id_idx" ON "payload"."partners_page_proof_stats" USING btree ("_parent_id");
  CREATE INDEX "partners_page_proof_quotes_order_idx" ON "payload"."partners_page_proof_quotes" USING btree ("_order");
  CREATE INDEX "partners_page_proof_quotes_parent_id_idx" ON "payload"."partners_page_proof_quotes" USING btree ("_parent_id");
  CREATE INDEX "partners_page_become_bullets_order_idx" ON "payload"."partners_page_become_bullets" USING btree ("_order");
  CREATE INDEX "partners_page_become_bullets_parent_id_idx" ON "payload"."partners_page_become_bullets" USING btree ("_parent_id");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "payload"."partners"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_partners_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("partners_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."partners" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."partners_page_hero_chips" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."partners_page_benefits" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."partners_page_proof_stats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."partners_page_proof_quotes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."partners_page_become_bullets" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."partners_page" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."partners" CASCADE;
  DROP TABLE "payload"."partners_page_hero_chips" CASCADE;
  DROP TABLE "payload"."partners_page_benefits" CASCADE;
  DROP TABLE "payload"."partners_page_proof_stats" CASCADE;
  DROP TABLE "payload"."partners_page_proof_quotes" CASCADE;
  DROP TABLE "payload"."partners_page_become_bullets" CASCADE;
  DROP TABLE "payload"."partners_page" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_partners_fk";
  
  DROP INDEX "payload"."payload_locked_documents_rels_partners_id_idx";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "partners_id";
  DROP TYPE "payload"."enum_partners_type";
  DROP TYPE "payload"."enum_partners_status";`)
}
