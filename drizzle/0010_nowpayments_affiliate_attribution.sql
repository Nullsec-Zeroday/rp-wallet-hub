ALTER TABLE "payment_orders" ADD COLUMN "affiliate_checkout_intent_id" text;
--> statement-breakpoint
ALTER TABLE "payment_orders" ADD COLUMN "affiliate_visitor_id" text;
--> statement-breakpoint
ALTER TABLE "payment_orders" ADD COLUMN "affiliate_click_id" text;
--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_affiliate_checkout_intent_id_affiliate_checkout_intents_id_fk" FOREIGN KEY ("affiliate_checkout_intent_id") REFERENCES "public"."affiliate_checkout_intents"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_affiliate_click_id_affiliate_clicks_id_fk" FOREIGN KEY ("affiliate_click_id") REFERENCES "public"."affiliate_clicks"("id") ON DELETE no action ON UPDATE no action;
