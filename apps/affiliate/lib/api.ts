"use client";

import { RpWalletApiClient } from "@rp-wallet/api-client";

export function createApiClient() {
  return new RpWalletApiClient(process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8787");
}
