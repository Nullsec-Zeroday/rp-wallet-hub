CREATE TYPE "public"."notification_type" AS ENUM('transaction_received', 'simulation_started', 'simulation_stopped');--> statement-breakpoint
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
ALTER TABLE "wallet_notification_settings" ADD CONSTRAINT "wallet_notification_settings_wallet_profile_id_wallet_profiles_id_fk" FOREIGN KEY ("wallet_profile_id") REFERENCES "public"."wallet_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_notifications" ADD CONSTRAINT "wallet_notifications_wallet_app_id_wallet_apps_id_fk" FOREIGN KEY ("wallet_app_id") REFERENCES "public"."wallet_apps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_notifications" ADD CONSTRAINT "wallet_notifications_account_id_wallet_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."wallet_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_notifications" ADD CONSTRAINT "wallet_notifications_transaction_id_wallet_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."wallet_transactions"("id") ON DELETE no action ON UPDATE no action;
