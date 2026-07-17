export interface ApiEnv {
  DATABASE_URL?: string;
  COINGECKO_API_KEY?: string;
  RESEND_API_KEY?: string;
  SESSION_COOKIE_NAME?: string;
  HUB_ORIGIN?: string;
  AFFILIATE_ORIGIN?: string;
  PHANTOM_ORIGIN?: string;
  TRUST_ORIGIN?: string;
  PHANTOM_ENABLED?: string;
  TRUST_ENABLED?: string;
  DEMO_ENABLED?: string;
  DEMO_DURATION_MINUTES?: string;
  AFFILIATE_ADMIN_TOKEN?: string;
  REFERRAL_SIGNING_SECRET?: string;
  NOWPAYMENTS_API_KEY?: string;
  NOWPAYMENTS_IPN_SECRET?: string;
  PAYBLIS_MERCHANT_KEY?: string;
  PAYBLIS_SECRET_KEY?: string;
  PAYBLIS_CHECKOUT_ENABLED?: string;
  PAYBLIS_SANDBOX?: string;
  PAYBLIS_IPN_ORIGIN?: string;
  SELLAUTH_WEBHOOK_SECRET?: string;
  SELLAUTH_SHOP_ID?: string;
  NEXT_PUBLIC_SELLAUTH_SHOP_ID?: string;
  SELLAUTH_STARTER_PRODUCT_ID?: string;
  SELLAUTH_MONTHLY_PRODUCT_ID?: string;
  SELLAUTH_YEARLY_PRODUCT_ID?: string;
  NEXT_PUBLIC_SELLAUTH_STARTER_PRODUCT_ID?: string;
  NEXT_PUBLIC_SELLAUTH_MONTHLY_PRODUCT_ID?: string;
  NEXT_PUBLIC_SELLAUTH_YEARLY_PRODUCT_ID?: string;
}

export function getAllowedOrigins(env: ApiEnv) {
  return [
    env.HUB_ORIGIN || "http://localhost:3000",
    env.AFFILIATE_ORIGIN || "http://localhost:3001",
    "https://affiliate.rpwallet.app",
    "https://rpwallet.app",
    "https://www.rpwallet.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    env.PHANTOM_ORIGIN || "http://localhost:5173",
    env.TRUST_ORIGIN || "http://localhost:5174",
  ];
}
