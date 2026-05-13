import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_pages_blocks_about_stats_tone" AS ENUM('teal', 'lime', 'plain');
  CREATE TYPE "payload"."enum_pages_blocks_big_quote_badges_icon" AS ENUM('verified', 'ndis', 'location');
  CREATE TYPE "payload"."enum__pages_v_blocks_about_stats_tone" AS ENUM('teal', 'lime', 'plain');
  CREATE TYPE "payload"."enum__pages_v_blocks_big_quote_badges_icon" AS ENUM('verified', 'ndis', 'location');
  CREATE TABLE "payload"."pages_blocks_hero_chips" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_logo_strip_text_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_how_it_works_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_how_it_works" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"section_image_id" integer,
  	"image_badge" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_about_paragraphs" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_about_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"description" varchar,
  	"tone" "payload"."enum_pages_blocks_about_stats_tone" DEFAULT 'plain'
  );
  
  CREATE TABLE "payload"."pages_blocks_about" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"section_label" varchar DEFAULT 'About',
  	"heading" varchar,
  	"subheading" varchar,
  	"pull_quote" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_big_quote_badges" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"icon" "payload"."enum_pages_blocks_big_quote_badges_icon" DEFAULT 'verified'
  );
  
  CREATE TABLE "payload"."pages_blocks_big_quote" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"quote" varchar,
  	"attribution" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_community_tabs_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_community_tabs" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"slug" varchar,
  	"badge" varchar,
  	"locked" boolean DEFAULT true,
  	"tag_line" varchar,
  	"panel_heading" varchar,
  	"panel_description" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_community" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"subheading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_hero_chips" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_logo_strip_text_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_how_it_works_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_how_it_works" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"section_image_id" integer,
  	"image_badge" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_about_paragraphs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_about_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"description" varchar,
  	"tone" "payload"."enum__pages_v_blocks_about_stats_tone" DEFAULT 'plain',
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_about" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"section_label" varchar DEFAULT 'About',
  	"heading" varchar,
  	"subheading" varchar,
  	"pull_quote" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_big_quote_badges" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"icon" "payload"."enum__pages_v_blocks_big_quote_badges_icon" DEFAULT 'verified',
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_big_quote" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"quote" varchar,
  	"attribution" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_community_tabs_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_community_tabs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"slug" varchar,
  	"badge" varchar,
  	"locked" boolean DEFAULT true,
  	"tag_line" varchar,
  	"panel_heading" varchar,
  	"panel_description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_community" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"subheading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "payload"."pages_blocks_hero" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "payload"."pages_blocks_hero" ADD COLUMN "handnote" varchar;
  ALTER TABLE "payload"."pages_blocks_testimonials" ADD COLUMN "cta_label" varchar DEFAULT 'Sign Up Now';
  ALTER TABLE "payload"."pages_blocks_testimonials" ADD COLUMN "cta_href" varchar DEFAULT '#contact';
  ALTER TABLE "payload"."_pages_v_blocks_hero" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "payload"."_pages_v_blocks_hero" ADD COLUMN "handnote" varchar;
  ALTER TABLE "payload"."_pages_v_blocks_testimonials" ADD COLUMN "cta_label" varchar DEFAULT 'Sign Up Now';
  ALTER TABLE "payload"."_pages_v_blocks_testimonials" ADD COLUMN "cta_href" varchar DEFAULT '#contact';
  ALTER TABLE "payload"."site_settings" ADD COLUMN "phone" varchar;
  ALTER TABLE "payload"."site_settings" ADD COLUMN "address" varchar;
  ALTER TABLE "payload"."pages_blocks_hero_chips" ADD CONSTRAINT "pages_blocks_hero_chips_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_logo_strip_text_items" ADD CONSTRAINT "pages_blocks_logo_strip_text_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_logo_strip"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_how_it_works_steps" ADD CONSTRAINT "pages_blocks_how_it_works_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_how_it_works"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_how_it_works" ADD CONSTRAINT "pages_blocks_how_it_works_section_image_id_media_id_fk" FOREIGN KEY ("section_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_how_it_works" ADD CONSTRAINT "pages_blocks_how_it_works_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_about_paragraphs" ADD CONSTRAINT "pages_blocks_about_paragraphs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_about"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_about_stats" ADD CONSTRAINT "pages_blocks_about_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_about"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_about" ADD CONSTRAINT "pages_blocks_about_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_big_quote_badges" ADD CONSTRAINT "pages_blocks_big_quote_badges_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_big_quote"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_big_quote" ADD CONSTRAINT "pages_blocks_big_quote_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_community_tabs_features" ADD CONSTRAINT "pages_blocks_community_tabs_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_community_tabs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_community_tabs" ADD CONSTRAINT "pages_blocks_community_tabs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_community"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_community" ADD CONSTRAINT "pages_blocks_community_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_hero_chips" ADD CONSTRAINT "_pages_v_blocks_hero_chips_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_logo_strip_text_items" ADD CONSTRAINT "_pages_v_blocks_logo_strip_text_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_logo_strip"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_how_it_works_steps" ADD CONSTRAINT "_pages_v_blocks_how_it_works_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_how_it_works"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_how_it_works" ADD CONSTRAINT "_pages_v_blocks_how_it_works_section_image_id_media_id_fk" FOREIGN KEY ("section_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_how_it_works" ADD CONSTRAINT "_pages_v_blocks_how_it_works_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_about_paragraphs" ADD CONSTRAINT "_pages_v_blocks_about_paragraphs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_about"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_about_stats" ADD CONSTRAINT "_pages_v_blocks_about_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_about"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_about" ADD CONSTRAINT "_pages_v_blocks_about_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_big_quote_badges" ADD CONSTRAINT "_pages_v_blocks_big_quote_badges_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_big_quote"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_big_quote" ADD CONSTRAINT "_pages_v_blocks_big_quote_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_community_tabs_features" ADD CONSTRAINT "_pages_v_blocks_community_tabs_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_community_tabs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_community_tabs" ADD CONSTRAINT "_pages_v_blocks_community_tabs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_community"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_community" ADD CONSTRAINT "_pages_v_blocks_community_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_hero_chips_order_idx" ON "payload"."pages_blocks_hero_chips" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_chips_parent_id_idx" ON "payload"."pages_blocks_hero_chips" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_logo_strip_text_items_order_idx" ON "payload"."pages_blocks_logo_strip_text_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_logo_strip_text_items_parent_id_idx" ON "payload"."pages_blocks_logo_strip_text_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_how_it_works_steps_order_idx" ON "payload"."pages_blocks_how_it_works_steps" USING btree ("_order");
  CREATE INDEX "pages_blocks_how_it_works_steps_parent_id_idx" ON "payload"."pages_blocks_how_it_works_steps" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_how_it_works_order_idx" ON "payload"."pages_blocks_how_it_works" USING btree ("_order");
  CREATE INDEX "pages_blocks_how_it_works_parent_id_idx" ON "payload"."pages_blocks_how_it_works" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_how_it_works_path_idx" ON "payload"."pages_blocks_how_it_works" USING btree ("_path");
  CREATE INDEX "pages_blocks_how_it_works_section_image_idx" ON "payload"."pages_blocks_how_it_works" USING btree ("section_image_id");
  CREATE INDEX "pages_blocks_about_paragraphs_order_idx" ON "payload"."pages_blocks_about_paragraphs" USING btree ("_order");
  CREATE INDEX "pages_blocks_about_paragraphs_parent_id_idx" ON "payload"."pages_blocks_about_paragraphs" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_about_stats_order_idx" ON "payload"."pages_blocks_about_stats" USING btree ("_order");
  CREATE INDEX "pages_blocks_about_stats_parent_id_idx" ON "payload"."pages_blocks_about_stats" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_about_order_idx" ON "payload"."pages_blocks_about" USING btree ("_order");
  CREATE INDEX "pages_blocks_about_parent_id_idx" ON "payload"."pages_blocks_about" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_about_path_idx" ON "payload"."pages_blocks_about" USING btree ("_path");
  CREATE INDEX "pages_blocks_big_quote_badges_order_idx" ON "payload"."pages_blocks_big_quote_badges" USING btree ("_order");
  CREATE INDEX "pages_blocks_big_quote_badges_parent_id_idx" ON "payload"."pages_blocks_big_quote_badges" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_big_quote_order_idx" ON "payload"."pages_blocks_big_quote" USING btree ("_order");
  CREATE INDEX "pages_blocks_big_quote_parent_id_idx" ON "payload"."pages_blocks_big_quote" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_big_quote_path_idx" ON "payload"."pages_blocks_big_quote" USING btree ("_path");
  CREATE INDEX "pages_blocks_community_tabs_features_order_idx" ON "payload"."pages_blocks_community_tabs_features" USING btree ("_order");
  CREATE INDEX "pages_blocks_community_tabs_features_parent_id_idx" ON "payload"."pages_blocks_community_tabs_features" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_community_tabs_order_idx" ON "payload"."pages_blocks_community_tabs" USING btree ("_order");
  CREATE INDEX "pages_blocks_community_tabs_parent_id_idx" ON "payload"."pages_blocks_community_tabs" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_community_order_idx" ON "payload"."pages_blocks_community" USING btree ("_order");
  CREATE INDEX "pages_blocks_community_parent_id_idx" ON "payload"."pages_blocks_community" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_community_path_idx" ON "payload"."pages_blocks_community" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_hero_chips_order_idx" ON "payload"."_pages_v_blocks_hero_chips" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero_chips_parent_id_idx" ON "payload"."_pages_v_blocks_hero_chips" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_logo_strip_text_items_order_idx" ON "payload"."_pages_v_blocks_logo_strip_text_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_logo_strip_text_items_parent_id_idx" ON "payload"."_pages_v_blocks_logo_strip_text_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_how_it_works_steps_order_idx" ON "payload"."_pages_v_blocks_how_it_works_steps" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_how_it_works_steps_parent_id_idx" ON "payload"."_pages_v_blocks_how_it_works_steps" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_how_it_works_order_idx" ON "payload"."_pages_v_blocks_how_it_works" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_how_it_works_parent_id_idx" ON "payload"."_pages_v_blocks_how_it_works" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_how_it_works_path_idx" ON "payload"."_pages_v_blocks_how_it_works" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_how_it_works_section_image_idx" ON "payload"."_pages_v_blocks_how_it_works" USING btree ("section_image_id");
  CREATE INDEX "_pages_v_blocks_about_paragraphs_order_idx" ON "payload"."_pages_v_blocks_about_paragraphs" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_about_paragraphs_parent_id_idx" ON "payload"."_pages_v_blocks_about_paragraphs" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_about_stats_order_idx" ON "payload"."_pages_v_blocks_about_stats" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_about_stats_parent_id_idx" ON "payload"."_pages_v_blocks_about_stats" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_about_order_idx" ON "payload"."_pages_v_blocks_about" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_about_parent_id_idx" ON "payload"."_pages_v_blocks_about" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_about_path_idx" ON "payload"."_pages_v_blocks_about" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_big_quote_badges_order_idx" ON "payload"."_pages_v_blocks_big_quote_badges" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_big_quote_badges_parent_id_idx" ON "payload"."_pages_v_blocks_big_quote_badges" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_big_quote_order_idx" ON "payload"."_pages_v_blocks_big_quote" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_big_quote_parent_id_idx" ON "payload"."_pages_v_blocks_big_quote" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_big_quote_path_idx" ON "payload"."_pages_v_blocks_big_quote" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_community_tabs_features_order_idx" ON "payload"."_pages_v_blocks_community_tabs_features" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_community_tabs_features_parent_id_idx" ON "payload"."_pages_v_blocks_community_tabs_features" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_community_tabs_order_idx" ON "payload"."_pages_v_blocks_community_tabs" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_community_tabs_parent_id_idx" ON "payload"."_pages_v_blocks_community_tabs" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_community_order_idx" ON "payload"."_pages_v_blocks_community" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_community_parent_id_idx" ON "payload"."_pages_v_blocks_community" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_community_path_idx" ON "payload"."_pages_v_blocks_community" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."pages_blocks_hero_chips" CASCADE;
  DROP TABLE "payload"."pages_blocks_logo_strip_text_items" CASCADE;
  DROP TABLE "payload"."pages_blocks_how_it_works_steps" CASCADE;
  DROP TABLE "payload"."pages_blocks_how_it_works" CASCADE;
  DROP TABLE "payload"."pages_blocks_about_paragraphs" CASCADE;
  DROP TABLE "payload"."pages_blocks_about_stats" CASCADE;
  DROP TABLE "payload"."pages_blocks_about" CASCADE;
  DROP TABLE "payload"."pages_blocks_big_quote_badges" CASCADE;
  DROP TABLE "payload"."pages_blocks_big_quote" CASCADE;
  DROP TABLE "payload"."pages_blocks_community_tabs_features" CASCADE;
  DROP TABLE "payload"."pages_blocks_community_tabs" CASCADE;
  DROP TABLE "payload"."pages_blocks_community" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_hero_chips" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_logo_strip_text_items" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_how_it_works_steps" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_how_it_works" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_about_paragraphs" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_about_stats" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_about" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_big_quote_badges" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_big_quote" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_community_tabs_features" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_community_tabs" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_community" CASCADE;
  ALTER TABLE "payload"."pages_blocks_hero" DROP COLUMN "eyebrow";
  ALTER TABLE "payload"."pages_blocks_hero" DROP COLUMN "handnote";
  ALTER TABLE "payload"."pages_blocks_testimonials" DROP COLUMN "cta_label";
  ALTER TABLE "payload"."pages_blocks_testimonials" DROP COLUMN "cta_href";
  ALTER TABLE "payload"."_pages_v_blocks_hero" DROP COLUMN "eyebrow";
  ALTER TABLE "payload"."_pages_v_blocks_hero" DROP COLUMN "handnote";
  ALTER TABLE "payload"."_pages_v_blocks_testimonials" DROP COLUMN "cta_label";
  ALTER TABLE "payload"."_pages_v_blocks_testimonials" DROP COLUMN "cta_href";
  ALTER TABLE "payload"."site_settings" DROP COLUMN "phone";
  ALTER TABLE "payload"."site_settings" DROP COLUMN "address";
  DROP TYPE "payload"."enum_pages_blocks_about_stats_tone";
  DROP TYPE "payload"."enum_pages_blocks_big_quote_badges_icon";
  DROP TYPE "payload"."enum__pages_v_blocks_about_stats_tone";
  DROP TYPE "payload"."enum__pages_v_blocks_big_quote_badges_icon";`)
}
