CREATE TYPE "public"."affiliate_conversion_status" AS ENUM('pending', 'approved', 'rejected', 'paid');--> statement-breakpoint
CREATE TYPE "public"."affiliate_payout_status" AS ENUM('pending', 'paid', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."affiliate_status" AS ENUM('active', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('transaction_received', 'simulation_started', 'simulation_stopped');--> statement-breakpoint
CREATE TYPE "public"."support_ticket_status" AS ENUM('open', 'in_progress', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."support_ticket_type" AS ENUM('did_not_receive_key', 'bug');--> statement-breakpoint
CREATE TYPE "public"."wallet_event_type" AS ENUM('wallet_received', 'transaction_created', 'balance_updated');--> statement-breakpoint
CREATE TABLE "affiliate_attributions" (
	"visitor_id" text PRIMARY KEY NOT NULL,
	"affiliate_id" text NOT NULL,
	"affiliate_code" text NOT NULL,
	"click_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "affiliate_checkout_intents" (
	"id" text PRIMARY KEY NOT NULL,
	"affiliate_id" text NOT NULL,
	"affiliate_code" text NOT NULL,
	"visitor_id" text NOT NULL,
	"click_id" text,
	"plan" text NOT NULL,
	"product_id" text,
	"variant_id" text,
	"sellauth_invoice_id" text,
	"buyer_email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "affiliate_clicks" (
	"id" text PRIMARY KEY NOT NULL,
	"affiliate_id" text NOT NULL,
	"affiliate_code" text NOT NULL,
	"visitor_id" text NOT NULL,
	"landing_path" text NOT NULL,
	"referrer" text,
	"source" text,
	"user_agent_hash" text,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "affiliate_conversions" (
	"id" text PRIMARY KEY NOT NULL,
	"affiliate_id" text NOT NULL,
	"affiliate_code" text NOT NULL,
	"checkout_intent_id" text,
	"license_id" text,
	"user_id" text,
	"sellauth_order_id" text NOT NULL,
	"buyer_email" text,
	"plan" text NOT NULL,
	"amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"commission_rate" numeric(5, 4) NOT NULL,
	"commission_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"status" "affiliate_conversion_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "affiliate_magic_links" (
	"id" text PRIMARY KEY NOT NULL,
	"token_hash" text NOT NULL,
	"affiliate_id" text NOT NULL,
	"email" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "affiliate_payouts" (
	"id" text PRIMARY KEY NOT NULL,
	"affiliate_id" text NOT NULL,
	"amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" "affiliate_payout_status" DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "affiliate_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"affiliate_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "affiliates" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"display_name" text NOT NULL,
	"email" text,
	"status" "affiliate_status" DEFAULT 'active' NOT NULL,
	"commission_rate" numeric(5, 4) DEFAULT '0.2000' NOT NULL,
	"payout_info_json" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "demo_devices" (
	"id" text PRIMARY KEY NOT NULL,
	"device_id" text NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "demo_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"key_hash" text NOT NULL,
	"label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "demo_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"demo_key_id" text NOT NULL,
	"demo_device_id" text NOT NULL,
	"user_id" text NOT NULL,
	"license_id" text NOT NULL,
	"session_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
	"affiliate_checkout_intent_id" text,
	"affiliate_visitor_id" text,
	"affiliate_click_id" text,
	"status" text DEFAULT 'created' NOT NULL,
	"license_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"fulfilled_at" timestamp with time zone,
	"abandoned_reminder_sent_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "support_ticket_type" NOT NULL,
	"status" "support_ticket_status" DEFAULT 'open' NOT NULL,
	"email" text NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"provider" text DEFAULT 'nowpayments' NOT NULL,
	"order_id" text,
	"provider_payment_id" text,
	"transaction_hash" text,
	"payment_currency" text,
	"amount" text,
	"admin_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet_events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"wallet_app_id" "wallet_app_id" NOT NULL,
	"account_id" text NOT NULL,
	"type" "wallet_event_type" NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"transaction_id" text,
	"notification_id" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet_notification_settings" (
	"wallet_profile_id" text PRIMARY KEY NOT NULL,
	"push_enabled" boolean DEFAULT false NOT NULL,
	"coins_json" text NOT NULL,
	"mode" text DEFAULT 'Auto' NOT NULL,
	"frequency" integer DEFAULT 2 NOT NULL,
	"unit" text DEFAULT 'sec' NOT NULL,
	"initial_delay" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"total_times" integer DEFAULT 10 NOT NULL,
	"remaining_times" integer DEFAULT 0 NOT NULL,
	"sender_address" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet_notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"wallet_app_id" "wallet_app_id" NOT NULL,
	"account_id" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"transaction_id" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "licenses" ADD COLUMN "key_plaintext" text;--> statement-breakpoint
ALTER TABLE "wallet_accounts" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD COLUMN "to_token_symbol" text;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD COLUMN "to_amount" numeric(32, 12);--> statement-breakpoint
ALTER TABLE "affiliate_attributions" ADD CONSTRAINT "affiliate_attributions_affiliate_id_affiliates_id_fk" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_attributions" ADD CONSTRAINT "affiliate_attributions_click_id_affiliate_clicks_id_fk" FOREIGN KEY ("click_id") REFERENCES "public"."affiliate_clicks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_checkout_intents" ADD CONSTRAINT "affiliate_checkout_intents_affiliate_id_affiliates_id_fk" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_checkout_intents" ADD CONSTRAINT "affiliate_checkout_intents_click_id_affiliate_clicks_id_fk" FOREIGN KEY ("click_id") REFERENCES "public"."affiliate_clicks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_clicks" ADD CONSTRAINT "affiliate_clicks_affiliate_id_affiliates_id_fk" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_conversions" ADD CONSTRAINT "affiliate_conversions_affiliate_id_affiliates_id_fk" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_conversions" ADD CONSTRAINT "affiliate_conversions_checkout_intent_id_affiliate_checkout_intents_id_fk" FOREIGN KEY ("checkout_intent_id") REFERENCES "public"."affiliate_checkout_intents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_conversions" ADD CONSTRAINT "affiliate_conversions_license_id_licenses_id_fk" FOREIGN KEY ("license_id") REFERENCES "public"."licenses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_conversions" ADD CONSTRAINT "affiliate_conversions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_magic_links" ADD CONSTRAINT "affiliate_magic_links_affiliate_id_affiliates_id_fk" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_payouts" ADD CONSTRAINT "affiliate_payouts_affiliate_id_affiliates_id_fk" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_sessions" ADD CONSTRAINT "affiliate_sessions_affiliate_id_affiliates_id_fk" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demo_sessions" ADD CONSTRAINT "demo_sessions_demo_key_id_demo_keys_id_fk" FOREIGN KEY ("demo_key_id") REFERENCES "public"."demo_keys"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demo_sessions" ADD CONSTRAINT "demo_sessions_demo_device_id_demo_devices_id_fk" FOREIGN KEY ("demo_device_id") REFERENCES "public"."demo_devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demo_sessions" ADD CONSTRAINT "demo_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demo_sessions" ADD CONSTRAINT "demo_sessions_license_id_licenses_id_fk" FOREIGN KEY ("license_id") REFERENCES "public"."licenses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demo_sessions" ADD CONSTRAINT "demo_sessions_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_affiliate_checkout_intent_id_affiliate_checkout_intents_id_fk" FOREIGN KEY ("affiliate_checkout_intent_id") REFERENCES "public"."affiliate_checkout_intents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_affiliate_click_id_affiliate_clicks_id_fk" FOREIGN KEY ("affiliate_click_id") REFERENCES "public"."affiliate_clicks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_license_id_licenses_id_fk" FOREIGN KEY ("license_id") REFERENCES "public"."licenses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_events" ADD CONSTRAINT "wallet_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_events" ADD CONSTRAINT "wallet_events_wallet_app_id_wallet_apps_id_fk" FOREIGN KEY ("wallet_app_id") REFERENCES "public"."wallet_apps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_events" ADD CONSTRAINT "wallet_events_account_id_wallet_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."wallet_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_events" ADD CONSTRAINT "wallet_events_transaction_id_wallet_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."wallet_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_events" ADD CONSTRAINT "wallet_events_notification_id_wallet_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."wallet_notifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_notification_settings" ADD CONSTRAINT "wallet_notification_settings_wallet_profile_id_wallet_profiles_id_fk" FOREIGN KEY ("wallet_profile_id") REFERENCES "public"."wallet_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_notifications" ADD CONSTRAINT "wallet_notifications_wallet_app_id_wallet_apps_id_fk" FOREIGN KEY ("wallet_app_id") REFERENCES "public"."wallet_apps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_notifications" ADD CONSTRAINT "wallet_notifications_account_id_wallet_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."wallet_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_notifications" ADD CONSTRAINT "wallet_notifications_transaction_id_wallet_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."wallet_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "affiliate_attributions_visitor_unique" ON "affiliate_attributions" USING btree ("visitor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "affiliate_conversions_order_unique" ON "affiliate_conversions" USING btree ("sellauth_order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "affiliate_magic_links_hash_unique" ON "affiliate_magic_links" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "affiliate_sessions_id_unique" ON "affiliate_sessions" USING btree ("id");--> statement-breakpoint
CREATE UNIQUE INDEX "affiliates_code_unique" ON "affiliates" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "demo_devices_device_id_unique" ON "demo_devices" USING btree ("device_id");--> statement-breakpoint
CREATE UNIQUE INDEX "demo_keys_key_hash_unique" ON "demo_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_orders_provider_payment_unique" ON "payment_orders" USING btree ("provider","provider_payment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_accounts_address_unique" ON "wallet_accounts" USING btree ("address");