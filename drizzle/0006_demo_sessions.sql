CREATE TABLE "demo_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"key_hash" text NOT NULL,
	"label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "demo_devices" (
	"id" text PRIMARY KEY NOT NULL,
	"device_id" text NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
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
ALTER TABLE "demo_sessions" ADD CONSTRAINT "demo_sessions_demo_key_id_demo_keys_id_fk" FOREIGN KEY ("demo_key_id") REFERENCES "public"."demo_keys"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "demo_sessions" ADD CONSTRAINT "demo_sessions_demo_device_id_demo_devices_id_fk" FOREIGN KEY ("demo_device_id") REFERENCES "public"."demo_devices"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "demo_sessions" ADD CONSTRAINT "demo_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "demo_sessions" ADD CONSTRAINT "demo_sessions_license_id_licenses_id_fk" FOREIGN KEY ("license_id") REFERENCES "public"."licenses"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "demo_sessions" ADD CONSTRAINT "demo_sessions_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "demo_keys_key_hash_unique" ON "demo_keys" USING btree ("key_hash");
--> statement-breakpoint
CREATE UNIQUE INDEX "demo_devices_device_id_unique" ON "demo_devices" USING btree ("device_id");
