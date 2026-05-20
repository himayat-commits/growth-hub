import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_partners_shape" AS ENUM('circle', 'diamond', 'triangle', 'leaf', 'hex', 'arc', 'bars', 'cross');
  ALTER TYPE "payload"."enum_partners_type" RENAME TO "enum_partners_category";
  ALTER TABLE "payload"."partners" RENAME COLUMN "type" TO "category";
  ALTER TABLE "payload"."partners" ALTER COLUMN "category" SET DATA TYPE text;
  DROP TYPE "payload"."enum_partners_category";
  CREATE TYPE "payload"."enum_partners_category" AS ENUM('technology', 'creative-media', 'community-delivery', 'industry-government', 'accelerator-capital', 'research-education');
  UPDATE "payload"."partners" SET "category" = 'community-delivery' WHERE "category" = 'community';
  UPDATE "payload"."partners" SET "category" = 'industry-government' WHERE "category" = 'enterprise';
  UPDATE "payload"."partners" SET "category" = 'accelerator-capital' WHERE "category" = 'funding';
  UPDATE "payload"."partners" SET "category" = 'creative-media' WHERE "category" = 'media';
  ALTER TABLE "payload"."partners" ALTER COLUMN "category" SET DATA TYPE "payload"."enum_partners_category" USING "category"::"payload"."enum_partners_category";
  ALTER TABLE "payload"."partners" ADD COLUMN "shape" "payload"."enum_partners_shape";
  ALTER TABLE "payload"."partners" ADD COLUMN "region" varchar;
  ALTER TABLE "payload"."partners" ADD COLUMN "since" varchar;
  ALTER TABLE "payload"."partners" ADD COLUMN "contribution" varchar;
  ALTER TABLE "payload"."partners" ADD COLUMN "how_we_work" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "payload"."enum_partners_category" RENAME TO "enum_partners_type";
  ALTER TABLE "payload"."partners" RENAME COLUMN "category" TO "type";
  ALTER TABLE "payload"."partners" ALTER COLUMN "type" SET DATA TYPE text;
  DROP TYPE "payload"."enum_partners_type";
  CREATE TYPE "payload"."enum_partners_type" AS ENUM('technology', 'community', 'enterprise', 'funding', 'media');
  UPDATE "payload"."partners" SET "type" = 'community' WHERE "type" = 'community-delivery';
  UPDATE "payload"."partners" SET "type" = 'enterprise' WHERE "type" = 'industry-government';
  UPDATE "payload"."partners" SET "type" = 'funding' WHERE "type" = 'accelerator-capital';
  UPDATE "payload"."partners" SET "type" = 'media' WHERE "type" = 'creative-media';
  UPDATE "payload"."partners" SET "type" = NULL WHERE "type" = 'research-education';
  ALTER TABLE "payload"."partners" ALTER COLUMN "type" SET DATA TYPE "payload"."enum_partners_type" USING "type"::"payload"."enum_partners_type";
  ALTER TABLE "payload"."partners" DROP COLUMN "shape";
  ALTER TABLE "payload"."partners" DROP COLUMN "region";
  ALTER TABLE "payload"."partners" DROP COLUMN "since";
  ALTER TABLE "payload"."partners" DROP COLUMN "contribution";
  ALTER TABLE "payload"."partners" DROP COLUMN "how_we_work";
  DROP TYPE "payload"."enum_partners_shape";`)
}
