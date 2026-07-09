ALTER TABLE "payment_orders" ADD COLUMN IF NOT EXISTS "abandoned_reminder_sent_at" timestamp with time zone;
