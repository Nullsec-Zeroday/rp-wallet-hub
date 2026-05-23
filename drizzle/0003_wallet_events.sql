CREATE TYPE "public"."wallet_event_type" AS ENUM('wallet_received', 'transaction_created', 'balance_updated');--> statement-breakpoint
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
ALTER TABLE "wallet_events" ADD CONSTRAINT "wallet_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_events" ADD CONSTRAINT "wallet_events_wallet_app_id_wallet_apps_id_fk" FOREIGN KEY ("wallet_app_id") REFERENCES "public"."wallet_apps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_events" ADD CONSTRAINT "wallet_events_account_id_wallet_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."wallet_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_events" ADD CONSTRAINT "wallet_events_transaction_id_wallet_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."wallet_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_events" ADD CONSTRAINT "wallet_events_notification_id_wallet_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."wallet_notifications"("id") ON DELETE no action ON UPDATE no action;
