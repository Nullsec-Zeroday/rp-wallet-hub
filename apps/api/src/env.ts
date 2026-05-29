export interface ApiEnv {
  DATABASE_URL?: string;
  COINGECKO_API_KEY?: string;
  SESSION_COOKIE_NAME?: string;
  HUB_ORIGIN?: string;
  PHANTOM_ORIGIN?: string;
  TRUST_ORIGIN?: string;
  PHANTOM_ENABLED?: string;
  TRUST_ENABLED?: string;
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
    "https://www.larperwallet.com",
    "http://127.0.0.1:3000",
    env.PHANTOM_ORIGIN || "http://localhost:5173",
    env.TRUST_ORIGIN || "http://localhost:5174",
  ];
}
