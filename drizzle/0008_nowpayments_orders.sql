CREATE TABLE "payment_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"provider_payment_id" text,
	"email" text NOT NULL,
	"plan_id" text NOT NULL,
	"plan_label" text NOT NULL,
	"price_amount" numeric(12, 2) NOT NULL,
	"price_currency" text DEFAULT 'USD' NOT NULL,
	"duration_days" integer NOT NULL,
	"allowed_devices" integer DEFAULT 1 NOT NULL,
	"affiliate_code" text,
	"status" text DEFAULT 'created' NOT NULL,
	"license_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"fulfilled_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_license_id_licenses_id_fk" FOREIGN KEY ("license_id") REFERENCES "public"."licenses"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "payment_orders_provider_payment_unique" ON "payment_orders" USING btree ("provider","provider_payment_id");
