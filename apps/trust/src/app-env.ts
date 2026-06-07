import { apiDefaults } from "@rp-wallet/config";

const defaultApiBaseUrl = import.meta.env.DEV
  ? apiDefaults.localBaseUrl
  : apiDefaults.productionBaseUrl;

export const walletFlags = {
  phantom: import.meta.env.VITE_WALLET_PHANTOM_ENABLED !== "false",
  trust: import.meta.env.DEV || import.meta.env.VITE_WALLET_TRUST_ENABLED === "true",
} as const;

export const appEnv = {
  walletAppEnabled: walletFlags.trust,
  apiBaseUrl: import.meta.env.VITE_RP_WALLET_API_URL || defaultApiBaseUrl,
  hubUrl: import.meta.env.VITE_HUB_URL || "https://rpwallet.app",
} as const;
