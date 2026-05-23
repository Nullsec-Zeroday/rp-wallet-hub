export interface ApiEnv {
  DATABASE_URL?: string;
  COINGECKO_API_KEY?: string;
  SESSION_COOKIE_NAME?: string;
  HUB_ORIGIN?: string;
  PHANTOM_ORIGIN?: string;
  TRUST_ORIGIN?: string;
}

export function getAllowedOrigins(env: ApiEnv) {
  return [
    env.HUB_ORIGIN || "http://localhost:3000",
    "http://127.0.0.1:3000",
    env.PHANTOM_ORIGIN || "http://localhost:5173",
    env.TRUST_ORIGIN || "http://localhost:5174",
  ];
}
