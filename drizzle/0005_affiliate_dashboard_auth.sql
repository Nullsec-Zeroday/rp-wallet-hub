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
CREATE TABLE "affiliate_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"affiliate_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "affiliate_magic_links" ADD CONSTRAINT "affiliate_magic_links_affiliate_id_affiliates_id_fk" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_sessions" ADD CONSTRAINT "affiliate_sessions_affiliate_id_affiliates_id_fk" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "affiliate_magic_links_hash_unique" ON "affiliate_magic_links" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "affiliate_sessions_id_unique" ON "affiliate_sessions" USING btree ("id");
