import { apiDefaults } from "@rp-wallet/config";

const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "");
const productionApiBaseUrl = apiDefaults.productionBaseUrl.replace(/\/+$/, "");
const shouldUseSameOriginProxy =
  process.env.NODE_ENV === "production" &&
  (!configuredBaseUrl ||
    configuredBaseUrl === productionApiBaseUrl ||
    configuredBaseUrl === "https://api.rpwallet.app");

export const HUB_API_BASE_URL =
  shouldUseSameOriginProxy
    ? "/api/rp"
    : !configuredBaseUrl || configuredBaseUrl === "https://api.rpwallet.app"
      ? apiDefaults.localBaseUrl
      : configuredBaseUrl;
