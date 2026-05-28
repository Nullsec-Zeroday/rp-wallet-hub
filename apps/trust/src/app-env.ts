export const walletFlags = {
  phantom: import.meta.env.VITE_WALLET_PHANTOM_ENABLED !== "false",
  trust: import.meta.env.VITE_WALLET_TRUST_ENABLED === "true",
} as const;

export const appEnv = {
  walletAppEnabled: walletFlags.trust,
  apiBaseUrl: import.meta.env.VITE_RP_WALLET_API_URL || undefined,
} as const;
