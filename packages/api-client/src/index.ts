import { apiDefaults } from "@rp-wallet/config";
import type {
  DemoActivationRequest,
  DemoConfigResponse,
  LicenseActivationRequest,
  WalletBootstrapExchangeRequest,
  WalletLaunchRequest,
  WalletLaunchResponse,
} from "@rp-wallet/auth";
import type {
  CreateWalletTransactionResponse,
  CreateWalletAccountRequest,
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

export const RP_WALLET_UNAUTHORIZED_EVENT = "rp-wallet:unauthorized";

export class RpWalletApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly path: string,
  ) {
    super(message);
    this.name = "RpWalletApiError";
  }
}

export function isRpWalletApiClientError(error: unknown) {
  return error instanceof RpWalletApiError && error.status >= 400 && error.status < 500;
}

function emitUnauthorized(path: string, status: number) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(RP_WALLET_UNAUTHORIZED_EVENT, { detail: { path, status } }));
}

export interface AdminLicenseSnapshot {
  license: {
    id: string;
    plan: string;
    expiresAt: string;
    status: "active" | "expired" | "revoked";
    allowedDevices: number;
    keyPlaintext?: string;
    userId: string;
    email?: string;
    createdAt: string;
    updatedAt: string;
  };
  devices: Array<{
    id: string;
    deviceId: string;
    lastSeenAt: string;
    createdAt: string;
  }>;
  sessions: Array<{
    id: string;
    expiresAt: string;
    revokedAt?: string;
    createdAt: string;
    active: boolean;
  }>;
  counts: {
    devices: number;
    activeSessions: number;
    revokedSessions: number;
  };
}

export interface AdminLicenseResetResult {
  snapshot: AdminLicenseSnapshot;
  clearedDevices: number;
  revokedSessions: number;
}

export interface AdminUnusedLicenseSummary {
  id: string;
  keyPlaintext?: string;
  userId: string;
  email?: string;
  plan: string;
  expiresAt: string;
  status: "active" | "expired" | "revoked";
  allowedDevices: number;
  deviceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminLicenseReminderResult {
  ok: boolean;
  emailId?: string;
  to: string;
}

export type SupportTicketType = "did_not_receive_key" | "bug";
export type SupportTicketStatus = "open" | "in_progress" | "resolved" | "closed";

export interface SupportTicket {
  id: string;
  type: SupportTicketType;
  status: SupportTicketStatus;
  email: string;
  subject: string;
  message: string;
  provider: string;
  orderId?: string;
  providerPaymentId?: string;
  transactionHash?: string;
  paymentCurrency?: string;
  amount?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

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

  async getDemoConfig() {
    return this.request<DemoConfigResponse>("/demo/config");
  }

  async activateDemo(body: DemoActivationRequest) {
    return this.request<HubSessionResponse>("/demo/activate", {
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

  async createNowPaymentsCheckout(body: {
    planId: string;
    email: string;
    affiliateCode?: string;
    affiliateCheckoutIntentId?: string;
    affiliateVisitorId?: string;
    affiliateClickId?: string;
  }) {
    return this.request<{ checkoutUrl: string; orderId: string }>("/payments/nowpayments/checkout", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async createSupportTicket(body: {
    type: SupportTicketType;
    email: string;
    subject?: string;
    message: string;
    orderId?: string;
    providerPaymentId?: string;
    transactionHash?: string;
    paymentCurrency?: string;
    amount?: string;
  }) {
    return this.request<{ ticket: SupportTicket }>("/support/tickets", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async requestAffiliateMagicLink(body: { email: string }) {
    return this.request<{ ok: boolean }>("/affiliate/auth/request", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async verifyAffiliateMagicLink(body: { token: string }) {
    return this.request<{ affiliate: { id: string; code: string; displayName: string; email?: string } }>("/affiliate/auth/verify", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async getAffiliateDashboard() {
    return this.request<{
      affiliate: { id: string; code: string; displayName: string; email?: string; commissionRate: string };
      referralUrl: string;
      stats: {
        clicks: number;
        checkoutIntents: number;
        conversions: number;
        pendingCommission: string;
        approvedCommission: string;
        paidCommission: string;
        totalCommission: string;
      };
      recentClicks: Array<{ id: string; landingPath: string; source?: string; createdAt: string }>;
      recentCheckoutIntents: Array<{ id: string; plan: string; productId?: string; createdAt: string }>;
      recentConversions: Array<{ id: string; plan: string; amount: string; commissionAmount: string; status: string; createdAt: string }>;
    }>("/affiliate/me");
  }

  async logoutAffiliate() {
    return this.request<{ ok: boolean }>("/affiliate/auth/logout", {
      method: "POST",
    });
  }

  async getAffiliateAdminSnapshot(adminToken: string) {
    return this.request<{
      affiliates: Array<{
        id: string;
        code: string;
        displayName: string;
        email?: string;
        status: "active" | "disabled";
        commissionRate: string;
        createdAt: string;
      }>;
      clicks: Array<{ id: string; affiliateCode: string; visitorId: string; landingPath: string; source?: string; createdAt: string }>;
      checkoutIntents: Array<{ id: string; affiliateCode: string; visitorId: string; plan: string; productId?: string; variantId?: string; createdAt: string }>;
      conversions: Array<{ id: string; affiliateCode: string; sellauthOrderId: string; buyerEmail?: string; plan: string; amount: string; commissionAmount: string; status: string; createdAt: string }>;
      payoutTotals: Array<{ affiliateId: string; affiliateCode: string; pendingCommission: string; approvedCommission: string; paidCommission: string }>;
    }>("/admin/affiliates", {
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
    });
  }

  async createAffiliateAdmin(
    adminToken: string,
    body: {
      code: string;
      displayName: string;
      email?: string;
      commissionRate?: string;
      payoutInfoJson?: string;
    },
  ) {
    return this.request<{
      id: string;
      code: string;
      displayName: string;
      email?: string;
      status: "active" | "disabled";
      commissionRate: string;
      createdAt: string;
    }>("/admin/affiliates", {
      method: "POST",
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(body),
    });
  }

  async createAdminLicenseKey(
    adminToken: string,
    body: {
      email?: string;
      plan: string;
      expiresAt?: string;
      durationDays?: number;
      allowedDevices?: number;
    },
  ) {
    return this.request<{
      licenseKey: string;
      license: {
        id: string;
        plan: string;
        expiresAt: string;
        status: "active" | "expired" | "revoked";
        allowedDevices: number;
      };
    }>("/admin/keys", {
      method: "POST",
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(body),
    });
  }

  async lookupAdminLicense(adminToken: string, body: { licenseKey: string }) {
    return this.request<AdminLicenseSnapshot>("/admin/licenses/lookup", {
      method: "POST",
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(body),
    });
  }

  async getAdminUnusedLicenses(adminToken: string) {
    return this.request<{ licenses: AdminUnusedLicenseSummary[] }>("/admin/licenses/unused", {
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
    });
  }

  async sendAdminLicenseReminder(adminToken: string, body: { licenseKey: string }) {
    return this.request<AdminLicenseReminderResult>("/admin/licenses/send-reminder", {
      method: "POST",
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(body),
    });
  }

  async clearAdminLicenseDevices(adminToken: string, body: { licenseKey: string }) {
    return this.request<AdminLicenseResetResult>("/admin/licenses/clear-devices", {
      method: "POST",
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(body),
    });
  }

  async revokeAdminLicenseSessions(adminToken: string, body: { licenseKey: string }) {
    return this.request<AdminLicenseResetResult>("/admin/licenses/revoke-sessions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(body),
    });
  }

  async resetAdminLicenseAccess(adminToken: string, body: { licenseKey: string }) {
    return this.request<AdminLicenseResetResult>("/admin/licenses/reset-access", {
      method: "POST",
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(body),
    });
  }

  async getAdminSupportTickets(adminToken: string) {
    return this.request<{ tickets: SupportTicket[] }>("/admin/tickets", {
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
    });
  }

  async updateAdminSupportTicket(
    adminToken: string,
    id: string,
    body: {
      status?: SupportTicketStatus;
      adminNotes?: string;
    },
  ) {
    return this.request<{ ticket: SupportTicket }>(`/admin/tickets/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
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

  async createWalletAccount(body: CreateWalletAccountRequest) {
    return this.request<WalletBootstrapPayload>("/wallet-accounts", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async deleteWalletAccount(walletAppId: WalletAppId, accountId: string) {
    return this.request<WalletBootstrapPayload>(`/wallet-accounts/${encodeURIComponent(accountId)}?walletAppId=${encodeURIComponent(walletAppId)}`, {
      method: "DELETE",
    });
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
      if (response.status === 401) {
        emitUnauthorized(path, response.status);
      }
      throw new RpWalletApiError(`RPWallet API request failed: ${response.status}${detail}`, response.status, path);
    }

    return response.json() as Promise<T>;
  }
}
