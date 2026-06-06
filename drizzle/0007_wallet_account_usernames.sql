ALTER TABLE "wallet_accounts" ADD COLUMN "username" text;
--> statement-breakpoint
UPDATE "wallet_accounts"
SET "username" = "wallet_profiles"."username"
FROM "wallet_profiles"
WHERE "wallet_accounts"."wallet_profile_id" = "wallet_profiles"."id"
  AND "wallet_accounts"."username" IS NULL;
