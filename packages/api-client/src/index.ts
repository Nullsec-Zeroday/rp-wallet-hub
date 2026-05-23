import { apiDefaults } from "@rp-wallet/config";
import type {
  LicenseActivationRequest,
  WalletBootstrapExchangeRequest,
  WalletLaunchRequest,
  WalletLaunchResponse,
} from "@rp-wallet/auth";
import type {
  CreateWalletTransactionRequest,
  HubSessionResponse,
  WalletAppId,
  WalletBootstrapPayload,
  WalletTransaction,
} from "@rp-wallet/types";

export class RpWalletApiClient {
  constructor(private readonly baseUrl = apiDefaults.localBaseUrl) {}

  async health() {
    return this.request<{ ok: boolean; service: string }>("/health");
  }

  async activateLicense(body: LicenseActivationRequest) {
    return this.request<HubSessionResponse>("/auth/license/activate", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async getMe() {
    return this.request<HubSessionResponse>("/me");
  }

  async createWalletLaunch(body: WalletLaunchRequest) {
    return this.request<WalletLaunchResponse>("/wallet-launch", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async exchangeWalletLaunchToken(token: string) {
    return this.exchangeWalletBootstrap({ token, deviceId: "browser" });
  }

  async exchangeWalletBootstrap(body: WalletBootstrapExchangeRequest) {
    return this.request<WalletBootstrapPayload>("/wallet-bootstrap/exchange", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async getWalletState(walletAppId: WalletAppId) {
    return this.request<WalletBootstrapPayload>(`/wallet-state/${walletAppId}`);
  }

  async getWalletTransactions(walletAppId: WalletAppId) {
    return this.request<WalletTransaction[]>(`/wallet-transactions?walletAppId=${encodeURIComponent(walletAppId)}`);
  }

  async createWalletTransaction(body: CreateWalletTransactionRequest) {
    return this.request<WalletBootstrapPayload>("/wallet-transactions", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  private async request<T>(path: string, init: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "content-type": "application/json",
        ...init.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`RP Wallet API request failed: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }
}
