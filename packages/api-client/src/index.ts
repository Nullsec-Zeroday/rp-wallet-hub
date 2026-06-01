import { apiDefaults } from "@rp-wallet/config";
import type {
  LicenseActivationRequest,
  WalletBootstrapExchangeRequest,
  WalletLaunchRequest,
  WalletLaunchResponse,
} from "@rp-wallet/auth";
import type {
  CreateWalletTransactionResponse,
  CreateWalletTransactionsBatchRequest,
  CreateWalletTransactionRequest,
  HubSessionResponse,
  TriggerWalletNotificationRequest,
  TriggerWalletNotificationResponse,
  UpdateWalletStateRequest,
  UpdateWalletNotificationSettingsRequest,
  WalletAppId,
  WalletBootstrapPayload,
  WalletEvent,
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

  async logout() {
    return this.request<{ ok: boolean }>("/auth/logout", {
      method: "POST",
    });
  }

  async createAffiliateCheckoutIntent(body: {
    affiliateCode: string;
    visitorId: string;
    clickId?: string;
    plan: string;
    productId?: string | number;
    variantId?: string | number;
    buyerEmail?: string;
  }) {
    return this.request<{ accepted: boolean; intent?: { id: string } }>("/affiliate/checkout-intent", {
      method: "POST",
      body: JSON.stringify(body),
    });
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

  async getWalletEvents(walletAppId: WalletAppId, after?: string) {
    const params = new URLSearchParams({ walletAppId });
    if (after) params.set("after", after);
    return this.request<WalletEvent[]>(`/wallet-events?${params.toString()}`);
  }

  async createWalletTransaction(body: CreateWalletTransactionRequest) {
    return this.request<CreateWalletTransactionResponse>("/wallet-transactions", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async createWalletTransactionsBatch(body: CreateWalletTransactionsBatchRequest) {
    return this.request<WalletBootstrapPayload>("/wallet-transactions/batch", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async deleteWalletTransaction(walletAppId: WalletAppId, transactionId: string) {
    return this.request<WalletBootstrapPayload>(`/wallet-transactions/${encodeURIComponent(transactionId)}?walletAppId=${encodeURIComponent(walletAppId)}`, {
      method: "DELETE",
    });
  }

  async clearWalletTransactions(walletAppId: WalletAppId) {
    return this.request<WalletBootstrapPayload>(`/wallet-transactions?walletAppId=${encodeURIComponent(walletAppId)}`, {
      method: "DELETE",
    });
  }

  async updateWalletState(body: UpdateWalletStateRequest) {
    return this.request<WalletBootstrapPayload>("/wallet-state", {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async updateWalletNotificationSettings(body: UpdateWalletNotificationSettingsRequest) {
    return this.request<WalletBootstrapPayload>("/wallet-notification-settings", {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async triggerWalletNotification(body: TriggerWalletNotificationRequest) {
    return this.request<TriggerWalletNotificationResponse>("/wallet-notifications/trigger", {
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
      let detail = "";
      try {
        const body = (await response.json()) as { error?: string };
        detail = body.error ? `: ${body.error}` : "";
      } catch {
        detail = "";
      }
      throw new Error(`LarperWallet API request failed: ${response.status}${detail}`);
    }

    return response.json() as Promise<T>;
  }
}
