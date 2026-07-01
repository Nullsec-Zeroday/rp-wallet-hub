CREATE TYPE "public"."support_ticket_status" AS ENUM('open', 'in_progress', 'resolved', 'closed');
--> statement-breakpoint
CREATE TYPE "public"."support_ticket_type" AS ENUM('did_not_receive_key', 'bug');
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
CREATE INDEX "support_tickets_status_created_idx" ON "support_tickets" USING btree ("status","created_at");
--> statement-breakpoint
CREATE INDEX "support_tickets_email_idx" ON "support_tickets" USING btree ("email");
