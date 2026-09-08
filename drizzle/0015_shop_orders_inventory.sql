CREATE TABLE "inventory" (
	"sku" text PRIMARY KEY NOT NULL,
	"product_slug" text NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_stock_non_negative" CHECK ("inventory"."stock" >= 0)
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_slug" text NOT NULL,
	"sku" text NOT NULL,
	"name_snapshot" text NOT NULL,
	"variant_label_snapshot" text,
	"image_url_snapshot" text,
	"list_unit_cents" integer NOT NULL,
	"unit_cents" integer NOT NULL,
	"qty" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" text GENERATED ALWAYS AS ('GH-' || lpad(id::text, 5, '0')) STORED,
	"user_id" text,
	"email" text NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"fulfilment_flag" varchar(20),
	"stripe_checkout_session_id" text,
	"stripe_payment_intent_id" text,
	"stripe_customer_id" text,
	"currency" varchar(3) DEFAULT 'aud' NOT NULL,
	"subtotal_cents" integer NOT NULL,
	"discount_cents" integer DEFAULT 0 NOT NULL,
	"shipping_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer NOT NULL,
	"member_discount_applied" boolean DEFAULT false NOT NULL,
	"shipping_name" text,
	"shipping_phone" text,
	"shipping_address" jsonb,
	"shipping_rate_id" text,
	"shipping_rate_label" text,
	"carrier" text,
	"tracking_number" text,
	"tracking_url" text,
	"notes" text,
	"paid_at" timestamp with time zone,
	"shipped_at" timestamp with time zone,
	"refunded_at" timestamp with time zone,
	"confirmation_email_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_stripe_checkout_session_id_unique" UNIQUE("stripe_checkout_session_id"),
	CONSTRAINT "orders_stripe_payment_intent_id_unique" UNIQUE("stripe_payment_intent_id")
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inventory_product_slug_idx" ON "inventory" USING btree ("product_slug");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "orders_user_created_idx" ON "orders" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "orders_email_idx" ON "orders" USING btree ("email");--> statement-breakpoint
CREATE INDEX "orders_status_created_idx" ON "orders" USING btree ("status","created_at");