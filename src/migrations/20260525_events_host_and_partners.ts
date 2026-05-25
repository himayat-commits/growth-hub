import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Co-host model on the Events collection — adds `host` (single partner)
// and `partners` (hasMany) relationships so events can render a partner
// lock-up (e.g. CBR Innovation Network) and surface back on the partner
// detail page under "Upcoming with us".
//
// `host_id` is a direct FK column on payload.events.
// `partners` (hasMany) goes through payload.events_rels — Payload's
// junction-table convention used by every hasMany relationship.
//
// `ON DELETE set null` on host (so deleting a partner doesn't cascade-
// delete events that referenced them) and `cascade` on the junction rows
// (so deleting an event clears its relation set).
//
// Hand-written rather than payload migrate:create because the generator
// in this repo emits a full schema diff and would redo already-applied
// statements (events.slug, strategists table, partners.slug, etc) and
// fail on "already exists" — the team writes these by hand.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE "payload"."events_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "partners_id" integer
    );

    ALTER TABLE "payload"."events" ADD COLUMN "host_id" integer;

    ALTER TABLE "payload"."events_rels"
      ADD CONSTRAINT "events_rels_parent_fk"
      FOREIGN KEY ("parent_id") REFERENCES "payload"."events"("id")
      ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "payload"."events_rels"
      ADD CONSTRAINT "events_rels_partners_fk"
      FOREIGN KEY ("partners_id") REFERENCES "payload"."partners"("id")
      ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "payload"."events"
      ADD CONSTRAINT "events_host_id_partners_id_fk"
      FOREIGN KEY ("host_id") REFERENCES "payload"."partners"("id")
      ON DELETE set null ON UPDATE no action;

    CREATE INDEX "events_rels_order_idx"
      ON "payload"."events_rels" USING btree ("order");
    CREATE INDEX "events_rels_parent_idx"
      ON "payload"."events_rels" USING btree ("parent_id");
    CREATE INDEX "events_rels_path_idx"
      ON "payload"."events_rels" USING btree ("path");
    CREATE INDEX "events_rels_partners_id_idx"
      ON "payload"."events_rels" USING btree ("partners_id");
    CREATE INDEX "events_host_idx"
      ON "payload"."events" USING btree ("host_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."events"
      DROP CONSTRAINT IF EXISTS "events_host_id_partners_id_fk";
    DROP INDEX IF EXISTS "payload"."events_host_idx";
    ALTER TABLE "payload"."events" DROP COLUMN IF EXISTS "host_id";

    DROP TABLE IF EXISTS "payload"."events_rels" CASCADE;
  `)
}
