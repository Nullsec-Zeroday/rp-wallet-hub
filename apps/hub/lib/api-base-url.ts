import { apiDefaults } from "@rp-wallet/config";

const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "");

export const HUB_API_BASE_URL =
  !configuredBaseUrl || configuredBaseUrl === "https://api.rpwallet.app"
    ? process.env.NODE_ENV === "production"
      ? apiDefaults.productionBaseUrl
      : apiDefaults.localBaseUrl
    : configuredBaseUrl;
