import { neon } from "@neondatabase/serverless";
import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@rp-wallet/db";
import type {
  CreateWalletTransactionResponse,
  CreateWalletTransactionRequest,
  CreateWalletTransactionsBatchRequest,
  HubSessionResponse,
  LicenseSummary,
  SessionSummary,
  TriggerWalletNotificationResponse,
  UpdateWalletNotificationSettingsRequest,
  UpdateWalletStateRequest,
  UserSummary,
  WalletAccount,
  WalletAppId,
  WalletBalance,
  WalletBootstrapPayload,
  WalletEvent,
  WalletNotification,
  WalletNotificationSettings,
  WalletProfile,
  WalletTransaction,
} from "@rp-wallet/types";
import { listWalletApps, walletRegistry } from "@rp-wallet/wallet-core";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const LAUNCH_TOKEN_TTL_MS = 60 * 1000;
const DEFAULT_WALLET_USERNAME = "larperwallet";

export class DeviceLimitError extends Error {
  constructor(allowedDevices: number) {
    super(`This license is already active on ${allowedDevices} device${allowedDevices === 1 ? "" : "s"}.`);
    this.name = "DeviceLimitError";
  }
}

export class InvalidLicenseError extends Error {
  constructor() {
    super("Invalid license key.");
    this.name = "InvalidLicenseError";
  }
}

interface LicenseRecord extends LicenseSummary {
  keyHash: string;
  userId: string;
}

interface SessionRecord extends SessionSummary {
  userId: string;
  licenseId: string;
}

interface LaunchTokenRecord {
  id: string;
  tokenHash: string;
  sessionId: string;
  walletAppId: WalletAppId;
  expiresAt: string;
  consumedAt?: string;
}

interface DeviceRecord {
  id: string;
  userId: string;
  deviceId: string;
  lastSeenAt: string;
}

export interface ActivationInput {
  licenseKey: string;
  deviceId: string;
  email?: string;
}

export interface PurchasedLicenseInput {
  licenseKey: string;
  email?: string;
  plan: string;
  expiresAt: Date;
  allowedDevices: number;
}

export interface WalletLaunchInput {
  sessionId: string;
  walletAppId: WalletAppId;
}

export interface WalletLaunchResult {
  token: string;
  expiresAt: string;
}

export interface WalletBootstrapInput {
  token: string;
  deviceId: string;
}

export interface WalletBootstrapResult {
  sessionId: string;
  payload: WalletBootstrapPayload;
}

export interface PlatformStore {
  createPurchasedLicense(input: PurchasedLicenseInput): Promise<LicenseSummary>;
  activateLicense(input: ActivationInput): Promise<HubSessionResponse>;
  getHubSession(sessionId: string): Promise<HubSessionResponse | null>;
  createWalletLaunch(input: WalletLaunchInput): Promise<WalletLaunchResult | null>;
  exchangeWalletBootstrap(input: WalletBootstrapInput): Promise<WalletBootstrapResult | null>;
  getWalletState(sessionId: string, walletAppId: WalletAppId): Promise<WalletBootstrapPayload | null>;
  updateWalletState(sessionId: string, input: UpdateWalletStateRequest): Promise<WalletBootstrapPayload | null>;
  getWalletTransactions(sessionId: string, walletAppId: WalletAppId): Promise<WalletTransaction[] | null>;
  createWalletTransaction(sessionId: string, input: CreateWalletTransactionRequest): Promise<CreateWalletTransactionResponse | null>;
  createWalletTransactionsBatch(sessionId: string, input: CreateWalletTransactionsBatchRequest): Promise<WalletBootstrapPayload | null>;
  deleteWalletTransaction(sessionId: string, walletAppId: WalletAppId, transactionId: string): Promise<WalletBootstrapPayload | null>;
  clearWalletTransactions(sessionId: string, walletAppId: WalletAppId): Promise<WalletBootstrapPayload | null>;
  getWalletEvents(sessionId: string, walletAppId: WalletAppId, after?: string): Promise<WalletEvent[] | null>;
  updateWalletNotificationSettings(sessionId: string, input: UpdateWalletNotificationSettingsRequest): Promise<WalletBootstrapPayload | null>;
  triggerWalletNotification(sessionId: string, walletAppId: WalletAppId, accountId: string): Promise<TriggerWalletNotificationResponse | null>;
}

let inMemoryStore: PlatformStore | undefined;
const databaseStores = new Map<string, PlatformStore>();

export function getPlatformStore(databaseUrl?: string): PlatformStore {
  if (!databaseUrl) {
    inMemoryStore ??= new InMemoryPlatformStore();
    return inMemoryStore;
  }

  const existing = databaseStores.get(databaseUrl);
  if (existing) return existing;

  const store = new NeonPlatformStore(databaseUrl);
  databaseStores.set(databaseUrl, store);
  return store;
}

class InMemoryPlatformStore implements PlatformStore {
  private readonly users = new Map<string, UserSummary>();
  private readonly licenses = new Map<string, LicenseRecord>();
  private readonly sessions = new Map<string, SessionRecord>();
  private readonly launchTokens = new Map<string, LaunchTokenRecord>();
  private readonly devices = new Map<string, DeviceRecord>();
  private readonly walletProfiles = new Map<string, WalletProfile>();
  private readonly walletAccounts = new Map<string, WalletAccount[]>();
  private readonly walletBalances = new Map<string, WalletBalance>();
  private readonly walletTransactions = new Map<string, WalletTransaction[]>();
  private readonly walletNotificationSettings = new Map<string, WalletNotificationSettings>();
  private readonly walletNotifications = new Map<string, WalletNotification[]>();
  private readonly walletEvents = new Map<string, WalletEvent[]>();

  async activateLicense(input: ActivationInput): Promise<HubSessionResponse> {
    const now = new Date();
    const keyHash = await hashToken(normalizeLicenseKey(input.licenseKey));
    const existingLicense = [...this.licenses.values()].find((license) => license.keyHash === keyHash);
    if (!existingLicense) {
      throw new InvalidLicenseError();
    }

    const user = this.users.get(existingLicense.userId)!;
    const license = existingLicense;

    this.assertDeviceAllowed(user.id, license, input.deviceId);
    const session = this.createSession(user.id, license.id, license.expiresAt);
    this.recordDevice(user.id, input.deviceId);
    return this.buildHubSession(user, license, session);
  }

  async createPurchasedLicense(input: PurchasedLicenseInput): Promise<LicenseSummary> {
    const keyHash = await hashToken(normalizeLicenseKey(input.licenseKey));
    const existingLicense = [...this.licenses.values()].find((license) => license.keyHash === keyHash);
    if (existingLicense) return toLicenseSummary(existingLicense);

    const user = this.createUser(input.email);
    const license: LicenseRecord = {
      id: createId("lic"),
      keyHash,
      userId: user.id,
      plan: input.plan,
      expiresAt: input.expiresAt.toISOString(),
      status: "active",
      allowedDevices: input.allowedDevices,
    };
    this.licenses.set(license.id, license);
    return toLicenseSummary(license);
  }

  async getHubSession(sessionId: string): Promise<HubSessionResponse | null> {
    const session = this.sessions.get(sessionId);
    if (!session || new Date(session.expiresAt) <= new Date()) return null;

    const user = this.users.get(session.userId);
    const license = this.licenses.get(session.licenseId);
    if (!user || !license) return null;

    return this.buildHubSession(user, license, session);
  }

  async createWalletLaunch(input: WalletLaunchInput): Promise<WalletLaunchResult | null> {
    const session = this.sessions.get(input.sessionId);
    const wallet = walletRegistry[input.walletAppId];
    if (!session || !wallet?.enabled || new Date(session.expiresAt) <= new Date()) return null;

    const rawToken = `${createId("wlt")}.${crypto.randomUUID()}`;
    const record: LaunchTokenRecord = {
      id: createId("wlt"),
      tokenHash: await hashToken(rawToken),
      sessionId: session.id,
      walletAppId: input.walletAppId,
      expiresAt: new Date(Date.now() + LAUNCH_TOKEN_TTL_MS).toISOString(),
    };

    this.launchTokens.set(record.tokenHash, record);

    return {
      token: rawToken,
      expiresAt: record.expiresAt,
    };
  }

  async exchangeWalletBootstrap(input: WalletBootstrapInput): Promise<WalletBootstrapResult | null> {
    const tokenHash = await hashToken(input.token);
    const launchToken = this.launchTokens.get(tokenHash);

    if (!launchToken || launchToken.consumedAt || new Date(launchToken.expiresAt) <= new Date()) return null;

    const session = this.sessions.get(launchToken.sessionId);
    if (!session || new Date(session.expiresAt) <= new Date()) return null;

    const user = this.users.get(session.userId);
    const license = this.licenses.get(session.licenseId);
    if (!user || !license) return null;

    this.assertDeviceAllowed(user.id, license, input.deviceId);

    launchToken.consumedAt = new Date().toISOString();
    this.recordDevice(user.id, input.deviceId);

    return {
      sessionId: session.id,
      payload: await this.buildWalletBootstrap(user, license, launchToken.walletAppId),
    };
  }

  async getWalletState(sessionId: string, walletAppId: WalletAppId): Promise<WalletBootstrapPayload | null> {
    const session = this.sessions.get(sessionId);
    if (!session || new Date(session.expiresAt) <= new Date()) return null;

    const user = this.users.get(session.userId);
    const license = this.licenses.get(session.licenseId);
    if (!user || !license) return null;

    return this.buildWalletBootstrap(user, license, walletAppId);
  }

  async updateWalletState(sessionId: string, input: UpdateWalletStateRequest): Promise<WalletBootstrapPayload | null> {
    const session = this.sessions.get(sessionId);
    if (!session || new Date(session.expiresAt) <= new Date()) return null;

    const user = this.users.get(session.userId);
    const license = this.licenses.get(session.licenseId);
    if (!user || !license) return null;

    const profile = this.getOrCreateWalletProfile(user.id, input.walletAppId, walletRegistry[input.walletAppId].name);
    const accounts = this.getOrCreateWalletAccounts(profile);
    const account = accounts.find((entry) => entry.id === input.accountId);
    if (!account) return null;

    if (input.profile) {
      const nextProfile = {
        ...profile,
        displayName: input.profile.displayName?.trim() || profile.displayName,
        username: normalizeOptionalString(input.profile.username),
        avatarUrl: normalizeOptionalString(input.profile.avatarUrl),
        updatedAt: new Date().toISOString(),
      };
      this.walletProfiles.set(`${user.id}:${input.walletAppId}`, nextProfile);
    }

    if (input.accountName?.trim()) {
      this.walletAccounts.set(
        profile.id,
        accounts.map((entry) => entry.id === input.accountId ? { ...entry, name: input.accountName!.trim() } : entry),
      );
    }

    if (input.accountAddress?.trim()) {
      const nextAddress = input.accountAddress.trim();
      if (this.isAddressInUse(nextAddress, input.accountId)) return null;
      this.walletAccounts.set(
        profile.id,
        (this.walletAccounts.get(profile.id) || accounts).map((entry) => entry.id === input.accountId ? { ...entry, address: nextAddress } : entry),
      );
    }

    for (const balance of input.balances || []) {
      const amount = Number(balance.amount);
      if (!Number.isFinite(amount) || amount < 0) continue;
      this.walletBalances.set(getBalanceKey(input.accountId, balance.tokenSymbol), createBalanceRow(input.accountId, balance.tokenSymbol, formatAmount(amount)));
    }

    return this.buildWalletBootstrap(user, license, input.walletAppId);
  }

  async getWalletTransactions(sessionId: string, walletAppId: WalletAppId): Promise<WalletTransaction[] | null> {
    const session = this.sessions.get(sessionId);
    if (!session || new Date(session.expiresAt) <= new Date()) return null;

    const user = this.users.get(session.userId);
    if (!user) return null;

    const profile = this.getOrCreateWalletProfile(user.id, walletAppId, walletRegistry[walletAppId].name);
    return [...(this.walletTransactions.get(profile.id) || [])].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }

  async createWalletTransaction(sessionId: string, input: CreateWalletTransactionRequest): Promise<CreateWalletTransactionResponse | null> {
    const session = this.sessions.get(sessionId);
    if (!session || new Date(session.expiresAt) <= new Date()) return null;

    const user = this.users.get(session.userId);
    const license = this.licenses.get(session.licenseId);
    if (!user || !license) return null;

    const profile = this.getOrCreateWalletProfile(user.id, input.walletAppId, walletRegistry[input.walletAppId].name);
    const account = this.getOrCreateWalletAccounts(profile).find((entry) => entry.id === input.accountId);
    if (!account) throw new Error("Wallet account was not found.");

    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter a valid amount greater than zero.");

    const counterpartAccount = this.findCounterpartAccount(user.id, input);
    const effectiveType = getEffectiveTransactionType(input, counterpartAccount?.walletAppId);
    if (counterpartAccount?.id === account.id) {
      throw new Error("Choose a different wallet address. Sending to your own address is not supported.");
    }
    if (!this.applyBalanceMutation(input.accountId, input.tokenSymbol, amount, getBalanceDirection(effectiveType))) {
      throw new Error("Insufficient balance for this transfer.");
    }

    if ((effectiveType === "same_wallet_transfer" || effectiveType === "cross_wallet_transfer") && counterpartAccount) {
      this.applyBalanceMutation(counterpartAccount.id, input.tokenSymbol, amount, "credit");
    }

    const createdAt = getSafeTransactionDate(input.createdAt).toISOString();
    const transaction: WalletTransaction = {
      id: createId("wtx"),
      walletAppId: input.walletAppId,
      accountId: input.accountId,
      type: effectiveType,
      status: "confirmed",
      tokenSymbol: input.tokenSymbol.toUpperCase(),
      amount: formatAmount(amount),
      fromAddress: input.fromAddress,
      toAddress: input.toAddress,
      counterpartWalletAppId: counterpartAccount?.walletAppId || input.counterpartWalletAppId,
      createdAt,
    };

    const existing = this.walletTransactions.get(profile.id) || [];
    this.walletTransactions.set(profile.id, [transaction, ...existing]);
    let counterpartTransaction: WalletTransaction | undefined;
    let notification: WalletNotification | undefined;

    if ((effectiveType === "same_wallet_transfer" || effectiveType === "cross_wallet_transfer") && counterpartAccount && counterpartAccount.id !== account.id) {
      const counterpartProfile = [...this.walletProfiles.values()].find((entry) => entry.id === counterpartAccount.walletProfileId);
      if (counterpartProfile) {
        counterpartTransaction = {
          ...transaction,
          id: createId("wtx"),
          walletAppId: counterpartProfile.walletAppId,
          accountId: counterpartAccount.id,
          type: "receive",
          fromAddress: account.address,
          toAddress: counterpartAccount.address,
          counterpartWalletAppId: input.walletAppId,
        };
        const counterpartExisting = this.walletTransactions.get(counterpartProfile.id) || [];
        this.walletTransactions.set(counterpartProfile.id, [counterpartTransaction, ...counterpartExisting]);
        notification = this.createWalletNotificationRecord(counterpartProfile.id, {
          walletAppId: counterpartProfile.walletAppId,
          accountId: counterpartAccount.id,
          transactionId: counterpartTransaction.id,
          title: "Received",
          body: `Received ${counterpartTransaction.amount} ${counterpartTransaction.tokenSymbol}`,
        });
        this.createWalletEventRecord(counterpartProfile.id, {
          userId: counterpartProfile.userId,
          walletAppId: counterpartProfile.walletAppId,
          accountId: counterpartAccount.id,
          type: "wallet_received",
          title: notification.title,
          body: notification.body,
          transactionId: counterpartTransaction.id,
          notificationId: notification.id,
        });
      }
    }

    return {
      payload: this.buildWalletBootstrap(user, license, input.walletAppId),
      transaction,
      counterpartTransaction,
      delivery: toTransferDelivery(effectiveType),
      recipientFound: Boolean(counterpartAccount),
      notification,
    };
  }

  async createWalletTransactionsBatch(sessionId: string, input: CreateWalletTransactionsBatchRequest): Promise<WalletBootstrapPayload | null> {
    const session = this.sessions.get(sessionId);
    if (!session || new Date(session.expiresAt) <= new Date()) return null;

    const user = this.users.get(session.userId);
    const license = this.licenses.get(session.licenseId);
    if (!user || !license) return null;

    const profile = this.getOrCreateWalletProfile(user.id, input.walletAppId, walletRegistry[input.walletAppId].name);
    const account = this.getOrCreateWalletAccounts(profile).find((entry) => entry.id === input.accountId);
    if (!account) return null;

    for (const transactionInput of input.transactions) {
      if (transactionInput.type !== "receive" && transactionInput.type !== "manual_adjustment") return null;
      const amount = Number(transactionInput.amount);
      if (!Number.isFinite(amount) || amount <= 0) return null;

      this.applyBalanceMutation(input.accountId, transactionInput.tokenSymbol, amount, "credit");
      const createdAt = getSafeTransactionDate(transactionInput.createdAt).toISOString();
      const transaction: WalletTransaction = {
        id: createId("wtx"),
        walletAppId: input.walletAppId,
        accountId: input.accountId,
        type: transactionInput.type,
        status: "confirmed",
        tokenSymbol: transactionInput.tokenSymbol.toUpperCase(),
        amount: formatAmount(amount),
        fromAddress: transactionInput.fromAddress,
        toAddress: transactionInput.toAddress,
        counterpartWalletAppId: transactionInput.counterpartWalletAppId,
        createdAt,
      };
      const existing = this.walletTransactions.get(profile.id) || [];
      this.walletTransactions.set(profile.id, [transaction, ...existing]);

      if (transactionInput.source === "notification_simulation") {
        this.createWalletNotificationRecord(profile.id, {
          walletAppId: input.walletAppId,
          accountId: input.accountId,
          transactionId: transaction.id,
          title: "Notification",
          body: `Received ${transaction.amount} ${transaction.tokenSymbol}`,
        });
      }
    }

    return this.buildWalletBootstrap(user, license, input.walletAppId);
  }

  async deleteWalletTransaction(sessionId: string, walletAppId: WalletAppId, transactionId: string): Promise<WalletBootstrapPayload | null> {
    const session = this.sessions.get(sessionId);
    if (!session || new Date(session.expiresAt) <= new Date()) return null;

    const user = this.users.get(session.userId);
    const license = this.licenses.get(session.licenseId);
    if (!user || !license) return null;

    const profile = this.getOrCreateWalletProfile(user.id, walletAppId, walletRegistry[walletAppId].name);
    const transactions = this.walletTransactions.get(profile.id) || [];
    this.walletTransactions.set(profile.id, transactions.filter((transaction) => transaction.id !== transactionId));
    this.walletNotifications.set(profile.id, (this.walletNotifications.get(profile.id) || []).filter((notification) => notification.transactionId !== transactionId));
    this.walletEvents.set(profile.id, (this.walletEvents.get(profile.id) || []).filter((event) => event.transactionId !== transactionId));
    return this.buildWalletBootstrap(user, license, walletAppId);
  }

  async clearWalletTransactions(sessionId: string, walletAppId: WalletAppId): Promise<WalletBootstrapPayload | null> {
    const session = this.sessions.get(sessionId);
    if (!session || new Date(session.expiresAt) <= new Date()) return null;

    const user = this.users.get(session.userId);
    const license = this.licenses.get(session.licenseId);
    if (!user || !license) return null;

    const profile = this.getOrCreateWalletProfile(user.id, walletAppId, walletRegistry[walletAppId].name);
    this.walletTransactions.set(profile.id, []);
    this.walletNotifications.set(profile.id, []);
    this.walletEvents.set(profile.id, []);
    return this.buildWalletBootstrap(user, license, walletAppId);
  }

  async getWalletEvents(sessionId: string, walletAppId: WalletAppId, after?: string): Promise<WalletEvent[] | null> {
    const session = this.sessions.get(sessionId);
    if (!session || new Date(session.expiresAt) <= new Date()) return null;

    const profile = this.getOrCreateWalletProfile(session.userId, walletAppId, walletRegistry[walletAppId].name);
    const afterMs = after ? Date.parse(after) : Number.NaN;
    return (this.walletEvents.get(profile.id) || [])
      .filter((event) => !Number.isFinite(afterMs) || Date.parse(event.createdAt) > afterMs)
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
      .slice(-50);
  }

  async updateWalletNotificationSettings(sessionId: string, input: UpdateWalletNotificationSettingsRequest): Promise<WalletBootstrapPayload | null> {
    const session = this.sessions.get(sessionId);
    if (!session || new Date(session.expiresAt) <= new Date()) return null;

    const user = this.users.get(session.userId);
    const license = this.licenses.get(session.licenseId);
    if (!user || !license) return null;

    const profile = this.getOrCreateWalletProfile(user.id, input.walletAppId, walletRegistry[input.walletAppId].name);
    const account = this.getOrCreateWalletAccounts(profile).find((entry) => entry.id === input.accountId);
    if (!account) return null;

    this.walletNotificationSettings.set(profile.id, sanitizeNotificationSettings(input.settings));
    return this.buildWalletBootstrap(user, license, input.walletAppId);
  }

  async triggerWalletNotification(sessionId: string, walletAppId: WalletAppId, accountId: string): Promise<TriggerWalletNotificationResponse | null> {
    const session = this.sessions.get(sessionId);
    if (!session || new Date(session.expiresAt) <= new Date()) return null;

    const user = this.users.get(session.userId);
    if (!user) return null;

    const profile = this.getOrCreateWalletProfile(user.id, walletAppId, walletRegistry[walletAppId].name);
    const account = this.getOrCreateWalletAccounts(profile).find((entry) => entry.id === accountId);
    if (!account) return null;

    const settings = this.walletNotificationSettings.get(profile.id) || createDefaultNotificationSettings();
    const simulated = buildSimulatedReceive(settings);
    if (!simulated) return null;

    const result = await this.createWalletTransaction(sessionId, {
      walletAppId,
      accountId,
      type: "receive",
      tokenSymbol: simulated.symbol,
      amount: String(simulated.amount),
      fromAddress: settings.senderAddress,
      toAddress: account.address,
      source: "notification_simulation",
    });
    if (!result) return null;

    const transaction = result.transaction;
    const nextSettings = decrementNotificationSettings(settings);
    this.walletNotificationSettings.set(profile.id, nextSettings);

    const notification: WalletNotification = {
      id: createId("ntf"),
      walletAppId,
      accountId,
      type: "transaction_received",
      title: "Notification",
      body: `Received ${simulated.amount} ${simulated.symbol}`,
      transactionId: transaction.id,
      createdAt: new Date().toISOString(),
    };
    const existing = this.walletNotifications.get(profile.id) || [];
    this.walletNotifications.set(profile.id, [notification, ...existing]);

    return {
      payload: await this.buildWalletBootstrap(user, this.licenses.get(session.licenseId)!, walletAppId),
      notification,
      transaction,
    };
  }

  private buildHubSession(user: UserSummary, license: LicenseRecord, session: SessionRecord): HubSessionResponse {
    return {
      user,
      license: toLicenseSummary(license),
      session: {
        id: session.id,
        expiresAt: session.expiresAt,
      },
      wallets: listWalletApps(this.getActivatedWallets(user.id)),
    };
  }

  private buildWalletBootstrap(user: UserSummary, license: LicenseRecord, walletAppId: WalletAppId): WalletBootstrapPayload {
    const wallet = { ...walletRegistry[walletAppId], activated: true };
    const profile = this.getOrCreateWalletProfile(user.id, walletAppId, wallet.name);
    const accounts = this.getOrCreateWalletAccounts(profile);
    const balances = this.getWalletBalances(accounts);
    const recentTransactions = this.walletTransactions.get(profile.id) || [];
    const notificationSettings = this.walletNotificationSettings.get(profile.id) || createDefaultNotificationSettings();
    const recentNotifications = this.walletNotifications.get(profile.id) || [];

    return {
      user,
      license: toLicenseSummary(license),
      wallet,
      profile,
      accounts,
      balances,
      recentTransactions,
      notificationSettings,
      recentNotifications,
    };
  }

  private createUser(email?: string): UserSummary {
    const user: UserSummary = {
      id: createId("usr"),
      email,
      createdAt: new Date().toISOString(),
    };

    this.users.set(user.id, user);
    return user;
  }

  private createLicense(keyHash: string, userId: string, now: Date): LicenseRecord {
    const license: LicenseRecord = {
      id: createId("lic"),
      keyHash,
      userId,
      plan: "Platform Preview",
      expiresAt: new Date(now.getTime() + THIRTY_DAYS_MS).toISOString(),
      status: "active",
      allowedDevices: 1,
    };

    this.licenses.set(license.id, license);
    return license;
  }

  private createSession(userId: string, licenseId: string, expiresAt: string): SessionRecord {
    const session: SessionRecord = {
      id: createId("ses"),
      userId,
      licenseId,
      expiresAt,
    };

    this.sessions.set(session.id, session);
    return session;
  }

  private getActivatedWallets(userId: string): WalletAppId[] {
    return [...this.walletProfiles.values()]
      .filter((profile) => profile.userId === userId)
      .map((profile) => profile.walletAppId);
  }

  private getOrCreateWalletProfile(userId: string, walletAppId: WalletAppId, displayName: string) {
    const id = `${userId}:${walletAppId}`;
    const existing = this.walletProfiles.get(id);
    if (existing) return existing;

    const now = new Date().toISOString();
    const profile: WalletProfile = {
      id: createId("wpf"),
      userId,
      walletAppId,
      displayName,
      username: DEFAULT_WALLET_USERNAME,
      createdAt: now,
      updatedAt: now,
    };

    this.walletProfiles.set(id, profile);
    return profile;
  }

  private getOrCreateWalletAccounts(profile: WalletProfile) {
    const existing = this.walletAccounts.get(profile.id);
    if (existing) return existing;

    const account: WalletAccount = {
      id: createId("wac"),
      walletProfileId: profile.id,
      name: "Account 1",
      address: this.createUniqueDemoAddress(profile.walletAppId),
      createdAt: new Date().toISOString(),
    };

    this.walletAccounts.set(profile.id, [account]);
    return [account];
  }

  private getWalletBalances(accounts: WalletAccount[]) {
    const accountIds = new Set(accounts.map((account) => account.id));
    return [...this.walletBalances.values()].filter((balance) => accountIds.has(balance.accountId));
  }

  private isAddressInUse(address: string, currentAccountId?: string) {
    return [...this.walletAccounts.values()]
      .flat()
      .some((account) => account.address === address && account.id !== currentAccountId);
  }

  private createUniqueDemoAddress(walletAppId: WalletAppId) {
    let address = createDemoAddress(walletAppId);
    while (this.isAddressInUse(address)) {
      address = createDemoAddress(walletAppId);
    }
    return address;
  }

  private applyBalanceMutation(accountId: string, tokenSymbol: string, amount: number, direction: "credit" | "debit") {
    const balanceKey = getBalanceKey(accountId, tokenSymbol);
    const current = this.walletBalances.get(balanceKey) || createBalanceRow(accountId, tokenSymbol, "0");
    const currentAmount = Number(current.amount);
    const nextAmount = direction === "credit" ? currentAmount + amount : currentAmount - amount;
    if (nextAmount < 0) return false;

    this.walletBalances.set(balanceKey, {
      ...current,
      amount: formatAmount(nextAmount),
      updatedAt: new Date().toISOString(),
    });
    return true;
  }

  private createWalletNotificationRecord(
    walletProfileId: string,
    input: { walletAppId: WalletAppId; accountId: string; transactionId?: string; title: string; body: string },
  ) {
    const notification: WalletNotification = {
      id: createId("ntf"),
      walletAppId: input.walletAppId,
      accountId: input.accountId,
      type: "transaction_received",
      title: input.title,
      body: input.body,
      transactionId: input.transactionId,
      createdAt: new Date().toISOString(),
    };
    const existing = this.walletNotifications.get(walletProfileId) || [];
    this.walletNotifications.set(walletProfileId, [notification, ...existing]);
    return notification;
  }

  private createWalletEventRecord(
    walletProfileId: string,
    input: {
      userId: string;
      walletAppId: WalletAppId;
      accountId: string;
      type: WalletEvent["type"];
      title: string;
      body: string;
      transactionId?: string;
      notificationId?: string;
    },
  ) {
    const event: WalletEvent = {
      id: createId("wev"),
      userId: input.userId,
      walletAppId: input.walletAppId,
      accountId: input.accountId,
      type: input.type,
      title: input.title,
      body: input.body,
      transactionId: input.transactionId,
      notificationId: input.notificationId,
      createdAt: new Date().toISOString(),
    };
    const existing = this.walletEvents.get(walletProfileId) || [];
    this.walletEvents.set(walletProfileId, [event, ...existing]);
    return event;
  }

  private findCounterpartAccount(userId: string, input: CreateWalletTransactionRequest) {
    const profiles = [...this.walletProfiles.values()].filter((profile) =>
      input.counterpartWalletAppId ? profile.walletAppId === input.counterpartWalletAppId : true,
    );

    for (const targetProfile of profiles) {
      const accounts = this.walletAccounts.get(targetProfile.id) || [];
      const account = accounts.find((entry) => entry.id === input.counterpartAccountId || entry.address === input.toAddress);
      if (account) return { ...account, userId: targetProfile.userId, walletAppId: targetProfile.walletAppId };
    }

    return null;
  }

  private recordDevice(userId: string, deviceId: string) {
    const id = `${userId}:${deviceId}`;
    this.devices.set(id, {
      id,
      userId,
      deviceId,
      lastSeenAt: new Date().toISOString(),
    });
  }

  private assertDeviceAllowed(userId: string, license: LicenseRecord, deviceId: string) {
    const devices = [...this.devices.values()].filter((device) => device.userId === userId);
    const isKnownDevice = devices.some((device) => device.deviceId === deviceId);
    const allowedDevices = getEffectiveAllowedDevices(license);

    if (!isKnownDevice && devices.length >= allowedDevices) {
      throw new DeviceLimitError(allowedDevices);
    }
  }
}

class NeonPlatformStore implements PlatformStore {
  private readonly db;

  constructor(databaseUrl: string) {
    this.db = drizzle({ client: neon(databaseUrl), schema });
  }

  async activateLicense(input: ActivationInput): Promise<HubSessionResponse> {
    await this.ensureWalletApps();

    const keyHash = await hashToken(normalizeLicenseKey(input.licenseKey));
    const [existingLicense] = await this.db.select().from(schema.licenses).where(eq(schema.licenses.keyHash, keyHash)).limit(1);
    if (!existingLicense) {
      throw new InvalidLicenseError();
    }

    const user = await this.getUser(existingLicense.userId);
    const license = existingLicense;

    await this.assertDeviceAllowed(user.id, license, input.deviceId);
    const session = await this.createSession(user.id, license.id, license.expiresAt);
    await this.recordDevice(user.id, input.deviceId);
    return this.buildHubSession(user, license, session);
  }

  async createPurchasedLicense(input: PurchasedLicenseInput): Promise<LicenseSummary> {
    await this.ensureWalletApps();

    const keyHash = await hashToken(normalizeLicenseKey(input.licenseKey));
    const [existingLicense] = await this.db.select().from(schema.licenses).where(eq(schema.licenses.keyHash, keyHash)).limit(1);
    if (existingLicense) {
      return toLicenseSummary({
        ...existingLicense,
        expiresAt: existingLicense.expiresAt.toISOString(),
      });
    }

    const user = await this.createUser(input.email);
    const [license] = await this.db
      .insert(schema.licenses)
      .values({
        id: createId("lic"),
        keyHash,
        userId: user.id,
        plan: input.plan,
        expiresAt: input.expiresAt,
        allowedDevices: input.allowedDevices,
      })
      .onConflictDoNothing({ target: schema.licenses.keyHash })
      .returning();

    const createdLicense = license ?? (await this.db.select().from(schema.licenses).where(eq(schema.licenses.keyHash, keyHash)).limit(1))[0];
    return toLicenseSummary({
      ...createdLicense,
      expiresAt: createdLicense.expiresAt.toISOString(),
    });
  }

  async getHubSession(sessionId: string): Promise<HubSessionResponse | null> {
    const session = await this.getSession(sessionId);
    if (!session) return null;

    const user = await this.getUser(session.userId);
    const license = await this.getLicense(session.licenseId);
    return this.buildHubSession(user, license, session);
  }

  async createWalletLaunch(input: WalletLaunchInput): Promise<WalletLaunchResult | null> {
    const session = await this.getSession(input.sessionId);
    const wallet = walletRegistry[input.walletAppId];
    if (!session || !wallet?.enabled) return null;

    await this.ensureWalletApps();

    const rawToken = `${createId("wlt")}.${crypto.randomUUID()}`;
    const expiresAt = new Date(Date.now() + LAUNCH_TOKEN_TTL_MS);

    await this.db.insert(schema.walletLaunchTokens).values({
      id: createId("wlt"),
      tokenHash: await hashToken(rawToken),
      sessionId: session.id,
      walletAppId: input.walletAppId,
      expiresAt,
    });

    return {
      token: rawToken,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async exchangeWalletBootstrap(input: WalletBootstrapInput): Promise<WalletBootstrapResult | null> {
    const tokenHash = await hashToken(input.token);
    const [launchToken] = await this.db
      .select()
      .from(schema.walletLaunchTokens)
      .where(and(eq(schema.walletLaunchTokens.tokenHash, tokenHash), isNull(schema.walletLaunchTokens.consumedAt)))
      .limit(1);

    if (!launchToken || launchToken.expiresAt <= new Date()) return null;

    const session = await this.getSession(launchToken.sessionId);
    if (!session) return null;

    const user = await this.getUser(session.userId);
    const license = await this.getLicense(session.licenseId);

    await this.assertDeviceAllowed(user.id, license, input.deviceId);

    await this.db
      .update(schema.walletLaunchTokens)
      .set({ consumedAt: new Date() })
      .where(eq(schema.walletLaunchTokens.id, launchToken.id));
    await this.recordDevice(user.id, input.deviceId);

    return {
      sessionId: session.id,
      payload: await this.buildWalletBootstrap(user, license, launchToken.walletAppId),
    };
  }

  async getWalletState(sessionId: string, walletAppId: WalletAppId): Promise<WalletBootstrapPayload | null> {
    const session = await this.getSession(sessionId);
    if (!session) return null;

    const user = await this.getUser(session.userId);
    const license = await this.getLicense(session.licenseId);
    return this.buildWalletBootstrap(user, license, walletAppId);
  }

  async updateWalletState(sessionId: string, input: UpdateWalletStateRequest): Promise<WalletBootstrapPayload | null> {
    const session = await this.getSession(sessionId);
    if (!session) return null;

    const user = await this.getUser(session.userId);
    const license = await this.getLicense(session.licenseId);
    const profile = await this.getOrCreateWalletProfile(user.id, input.walletAppId, walletRegistry[input.walletAppId].name);
    const accounts = await this.getOrCreateWalletAccounts(profile);
    const account = accounts.find((entry) => entry.id === input.accountId);
    if (!account) return null;

    if (input.profile) {
      await this.db
        .update(schema.walletProfiles)
        .set({
          displayName: input.profile.displayName?.trim() || profile.displayName,
          username: normalizeOptionalString(input.profile.username),
          avatarUrl: normalizeOptionalString(input.profile.avatarUrl),
          updatedAt: new Date(),
        })
        .where(eq(schema.walletProfiles.id, profile.id));
    }

    if (input.accountName?.trim()) {
      await this.db.update(schema.walletAccounts).set({ name: input.accountName.trim() }).where(eq(schema.walletAccounts.id, input.accountId));
    }

    if (input.accountAddress?.trim()) {
      const nextAddress = input.accountAddress.trim();
      const [existingAddress] = await this.db
        .select({ id: schema.walletAccounts.id })
        .from(schema.walletAccounts)
        .where(eq(schema.walletAccounts.address, nextAddress))
        .limit(1);
      if (existingAddress && existingAddress.id !== input.accountId) return null;

      await this.db.update(schema.walletAccounts).set({ address: nextAddress }).where(eq(schema.walletAccounts.id, input.accountId));
    }

    for (const balance of input.balances || []) {
      const amount = Number(balance.amount);
      if (!Number.isFinite(amount) || amount < 0) continue;
      await this.db
        .insert(schema.walletBalances)
        .values({
          accountId: input.accountId,
          tokenSymbol: balance.tokenSymbol.toUpperCase(),
          amount: formatAmount(amount),
        })
        .onConflictDoUpdate({
          target: [schema.walletBalances.accountId, schema.walletBalances.tokenSymbol],
          set: {
            amount: formatAmount(amount),
            updatedAt: new Date(),
          },
        });
    }

    return this.buildWalletBootstrap(user, license, input.walletAppId);
  }

  async getWalletTransactions(sessionId: string, walletAppId: WalletAppId): Promise<WalletTransaction[] | null> {
    const session = await this.getSession(sessionId);
    if (!session) return null;

    const profile = await this.getWalletProfileByUserAndApp(session.userId, walletAppId);
    if (!profile) return [];

    const transactions = await this.db
      .select()
      .from(schema.walletTransactions)
      .where(eq(schema.walletTransactions.walletAppId, walletAppId))
      .orderBy(desc(schema.walletTransactions.createdAt))
      .limit(50);

    const accountIds = new Set(
      (
        await this.db.select({ id: schema.walletAccounts.id }).from(schema.walletAccounts).where(eq(schema.walletAccounts.walletProfileId, profile.id))
      ).map((row) => row.id),
    );

    return transactions.filter((tx) => accountIds.has(tx.accountId)).map(toWalletTransaction);
  }

  async createWalletTransaction(sessionId: string, input: CreateWalletTransactionRequest): Promise<CreateWalletTransactionResponse | null> {
    const session = await this.getSession(sessionId);
    if (!session) return null;

    const user = await this.getUser(session.userId);
    const license = await this.getLicense(session.licenseId);
    const profile = await this.getOrCreateWalletProfile(user.id, input.walletAppId, walletRegistry[input.walletAppId].name);
    const accounts = await this.getOrCreateWalletAccounts(profile);
    const account = accounts.find((entry) => entry.id === input.accountId);
    if (!account) throw new Error("Wallet account was not found.");

    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter a valid amount greater than zero.");

    const counterpartAccount = await this.findCounterpartAccount(user.id, input);
    const effectiveType = getEffectiveTransactionType(input, counterpartAccount?.walletAppId);
    if (counterpartAccount?.id === account.id) {
      throw new Error("Choose a different wallet address. Sending to your own address is not supported.");
    }
    if (!(await this.applyBalanceMutation(input.accountId, input.tokenSymbol, amount, getBalanceDirection(effectiveType)))) {
      throw new Error("Insufficient balance for this transfer.");
    }

    if ((effectiveType === "same_wallet_transfer" || effectiveType === "cross_wallet_transfer") && counterpartAccount) {
      await this.applyBalanceMutation(counterpartAccount.id, input.tokenSymbol, amount, "credit");
    }

    const transactionId = createId("wtx");
    const createdAt = getSafeTransactionDate(input.createdAt);
    await this.db.insert(schema.walletTransactions).values({
      id: transactionId,
      walletAppId: input.walletAppId,
      accountId: input.accountId,
      type: effectiveType,
      status: "confirmed",
      tokenSymbol: input.tokenSymbol.toUpperCase(),
      amount: formatAmount(amount),
      fromAddress: input.fromAddress,
      toAddress: input.toAddress,
      counterpartWalletAppId: counterpartAccount?.walletAppId || input.counterpartWalletAppId,
      createdAt,
    });
    const transaction = toWalletTransaction({
      id: transactionId,
      walletAppId: input.walletAppId,
      accountId: input.accountId,
      type: effectiveType,
      status: "confirmed",
      tokenSymbol: input.tokenSymbol.toUpperCase(),
      amount: formatAmount(amount),
      fromAddress: input.fromAddress ?? null,
      toAddress: input.toAddress ?? null,
      counterpartWalletAppId: counterpartAccount?.walletAppId || input.counterpartWalletAppId || null,
      createdAt,
    });

    let counterpartTransaction: WalletTransaction | undefined;
    let notification: WalletNotification | undefined;
    if ((effectiveType === "same_wallet_transfer" || effectiveType === "cross_wallet_transfer") && counterpartAccount && counterpartAccount.id !== account.id) {
      const counterpartProfile = await this.getWalletProfileById(counterpartAccount.walletProfileId);
      if (counterpartProfile) {
        const counterpartTransactionId = createId("wtx");
        const counterpartTxInsert = {
          id: counterpartTransactionId,
          walletAppId: counterpartProfile.walletAppId,
          accountId: counterpartAccount.id,
          type: "receive" as const,
          status: "confirmed" as const,
          tokenSymbol: input.tokenSymbol.toUpperCase(),
          amount: formatAmount(amount),
          fromAddress: account.address,
          toAddress: counterpartAccount.address,
          counterpartWalletAppId: input.walletAppId,
          createdAt,
        };
        await this.db.insert(schema.walletTransactions).values({
          ...counterpartTxInsert,
        });
        counterpartTransaction = toWalletTransaction({
          ...counterpartTxInsert,
          fromAddress: counterpartTxInsert.fromAddress ?? null,
          toAddress: counterpartTxInsert.toAddress ?? null,
          counterpartWalletAppId: counterpartTxInsert.counterpartWalletAppId ?? null,
        });
        notification = await this.createWalletNotification({
          walletAppId: counterpartProfile.walletAppId,
          accountId: counterpartAccount.id,
          transactionId: counterpartTransactionId,
          title: "Received",
          body: `Received ${formatAmount(amount)} ${input.tokenSymbol.toUpperCase()}`,
        });
        await this.createWalletEvent({
          userId: counterpartProfile.userId,
          walletAppId: counterpartProfile.walletAppId,
          accountId: counterpartAccount.id,
          type: "wallet_received",
          title: notification.title,
          body: notification.body,
          transactionId: counterpartTransactionId,
          notificationId: notification.id,
        });
      }
    }

    if (input.source === "notification_simulation") {
      await this.createWalletNotification({
        walletAppId: input.walletAppId,
        accountId: input.accountId,
        transactionId,
        title: "Notification",
        body: `Received ${formatAmount(amount)} ${input.tokenSymbol.toUpperCase()}`,
      });
    }

    return {
      payload: await this.buildWalletBootstrap(user, license, input.walletAppId),
      transaction,
      counterpartTransaction,
      delivery: toTransferDelivery(effectiveType),
      recipientFound: Boolean(counterpartAccount),
      notification,
    };
  }

  async createWalletTransactionsBatch(sessionId: string, input: CreateWalletTransactionsBatchRequest): Promise<WalletBootstrapPayload | null> {
    const session = await this.getSession(sessionId);
    if (!session) return null;

    const user = await this.getUser(session.userId);
    const license = await this.getLicense(session.licenseId);
    const profile = await this.getOrCreateWalletProfile(user.id, input.walletAppId, walletRegistry[input.walletAppId].name);
    const accounts = await this.getOrCreateWalletAccounts(profile);
    const account = accounts.find((entry) => entry.id === input.accountId);
    if (!account) return null;

    const rows: Array<typeof schema.walletTransactions.$inferInsert> = [];
    const notificationRows: Array<typeof schema.walletNotifications.$inferInsert> = [];
    const balanceCredits = new Map<string, number>();

    for (const transactionInput of input.transactions) {
      if (transactionInput.type !== "receive" && transactionInput.type !== "manual_adjustment") return null;
      const amount = Number(transactionInput.amount);
      if (!Number.isFinite(amount) || amount <= 0) return null;

      const tokenSymbol = transactionInput.tokenSymbol.toUpperCase();
      balanceCredits.set(tokenSymbol, (balanceCredits.get(tokenSymbol) || 0) + amount);

      const transactionId = createId("wtx");
      const createdAt = getSafeTransactionDate(transactionInput.createdAt);
      rows.push({
        id: transactionId,
        walletAppId: input.walletAppId,
        accountId: input.accountId,
        type: transactionInput.type,
        status: "confirmed",
        tokenSymbol,
        amount: formatAmount(amount),
        fromAddress: transactionInput.fromAddress,
        toAddress: transactionInput.toAddress,
        counterpartWalletAppId: transactionInput.counterpartWalletAppId,
        createdAt,
      });

      if (transactionInput.source === "notification_simulation") {
        notificationRows.push({
          id: createId("ntf"),
          walletAppId: input.walletAppId,
          accountId: input.accountId,
          type: "transaction_received",
          title: "Notification",
          body: `Received ${formatAmount(amount)} ${tokenSymbol}`,
          transactionId,
        });
      }
    }

    for (const [tokenSymbol, amount] of balanceCredits) {
      if (!(await this.applyBalanceMutation(input.accountId, tokenSymbol, amount, "credit"))) return null;
    }

    if (rows.length > 0) {
      await this.db.insert(schema.walletTransactions).values(rows);
    }
    if (notificationRows.length > 0) {
      await this.db.insert(schema.walletNotifications).values(notificationRows);
    }

    return this.buildWalletBootstrap(user, license, input.walletAppId);
  }

  async deleteWalletTransaction(sessionId: string, walletAppId: WalletAppId, transactionId: string): Promise<WalletBootstrapPayload | null> {
    const session = await this.getSession(sessionId);
    if (!session) return null;

    const user = await this.getUser(session.userId);
    const license = await this.getLicense(session.licenseId);
    const profile = await this.getWalletProfileByUserAndApp(user.id, walletAppId);
    if (!profile) return this.buildWalletBootstrap(user, license, walletAppId);

    const accounts = await this.getOrCreateWalletAccounts(toWalletProfile(profile));
    const accountIds = new Set(accounts.map((account) => account.id));
    const [transaction] = await this.db.select().from(schema.walletTransactions).where(eq(schema.walletTransactions.id, transactionId)).limit(1);
    if (!transaction || !accountIds.has(transaction.accountId)) return null;

    await this.db.delete(schema.walletEvents).where(eq(schema.walletEvents.transactionId, transactionId));
    await this.db.delete(schema.walletNotifications).where(eq(schema.walletNotifications.transactionId, transactionId));
    await this.db.delete(schema.walletTransactions).where(eq(schema.walletTransactions.id, transactionId));

    return this.buildWalletBootstrap(user, license, walletAppId);
  }

  async clearWalletTransactions(sessionId: string, walletAppId: WalletAppId): Promise<WalletBootstrapPayload | null> {
    const session = await this.getSession(sessionId);
    if (!session) return null;

    const user = await this.getUser(session.userId);
    const license = await this.getLicense(session.licenseId);
    const profile = await this.getWalletProfileByUserAndApp(user.id, walletAppId);
    if (!profile) return this.buildWalletBootstrap(user, license, walletAppId);

    const accounts = await this.getOrCreateWalletAccounts(toWalletProfile(profile));
    const accountIds = accounts.map((account) => account.id);
    if (accountIds.length === 0) return this.buildWalletBootstrap(user, license, walletAppId);

    const transactions = await this.db
      .select({ id: schema.walletTransactions.id })
      .from(schema.walletTransactions)
      .where(inArray(schema.walletTransactions.accountId, accountIds));
    const transactionIds = transactions.map((transaction) => transaction.id);
    if (transactionIds.length === 0) return this.buildWalletBootstrap(user, license, walletAppId);

    await this.db.delete(schema.walletEvents).where(inArray(schema.walletEvents.transactionId, transactionIds));
    await this.db.delete(schema.walletNotifications).where(inArray(schema.walletNotifications.transactionId, transactionIds));
    await this.db.delete(schema.walletTransactions).where(inArray(schema.walletTransactions.id, transactionIds));

    return this.buildWalletBootstrap(user, license, walletAppId);
  }

  async getWalletEvents(sessionId: string, walletAppId: WalletAppId, after?: string): Promise<WalletEvent[] | null> {
    const session = await this.getSession(sessionId);
    if (!session) return null;

    const profile = await this.getWalletProfileByUserAndApp(session.userId, walletAppId);
    if (!profile) return [];

    const accounts = await this.getOrCreateWalletAccounts(toWalletProfile(profile));
    const accountIds = new Set(accounts.map((account) => account.id));
    const afterMs = after ? Date.parse(after) : Number.NaN;
    const events = await this.db.select().from(schema.walletEvents).orderBy(desc(schema.walletEvents.createdAt)).limit(50);

    return events
      .filter((event) => accountIds.has(event.accountId))
      .filter((event) => !Number.isFinite(afterMs) || event.createdAt.getTime() > afterMs)
      .map(toWalletEvent)
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  }

  async updateWalletNotificationSettings(sessionId: string, input: UpdateWalletNotificationSettingsRequest): Promise<WalletBootstrapPayload | null> {
    const session = await this.getSession(sessionId);
    if (!session) return null;

    const user = await this.getUser(session.userId);
    const license = await this.getLicense(session.licenseId);
    const profile = await this.getOrCreateWalletProfile(user.id, input.walletAppId, walletRegistry[input.walletAppId].name);
    const accounts = await this.getOrCreateWalletAccounts(profile);
    if (!accounts.some((account) => account.id === input.accountId)) return null;

    const settings = sanitizeNotificationSettings(input.settings);
    await this.db
      .insert(schema.walletNotificationSettings)
      .values(toWalletNotificationSettingsRow(profile.id, settings))
      .onConflictDoUpdate({
        target: schema.walletNotificationSettings.walletProfileId,
        set: {
          pushEnabled: settings.pushEnabled,
          coinsJson: JSON.stringify(settings.coins),
          mode: settings.mode,
          frequency: settings.frequency,
          unit: settings.unit,
          initialDelay: settings.initialDelay,
          isActive: settings.isActive,
          totalTimes: settings.totalTimes,
          remainingTimes: settings.remainingTimes,
          senderAddress: settings.senderAddress,
          updatedAt: new Date(),
        },
      });

    return this.buildWalletBootstrap(user, license, input.walletAppId);
  }

  async triggerWalletNotification(sessionId: string, walletAppId: WalletAppId, accountId: string): Promise<TriggerWalletNotificationResponse | null> {
    const session = await this.getSession(sessionId);
    if (!session) return null;

    const user = await this.getUser(session.userId);
    const profile = await this.getOrCreateWalletProfile(user.id, walletAppId, walletRegistry[walletAppId].name);
    const accounts = await this.getOrCreateWalletAccounts(profile);
    const account = accounts.find((entry) => entry.id === accountId);
    if (!account) return null;

    const settings = await this.getNotificationSettings(profile.id);
    const simulated = buildSimulatedReceive(settings);
    if (!simulated) return null;

    const result = await this.createWalletTransaction(sessionId, {
      walletAppId,
      accountId,
      type: "receive",
      tokenSymbol: simulated.symbol,
      amount: String(simulated.amount),
      fromAddress: settings.senderAddress,
      toAddress: account.address,
      source: "notification_simulation",
    });
    if (!result) return null;

    const nextSettings = decrementNotificationSettings(settings);
    await this.updateWalletNotificationSettings(sessionId, {
      walletAppId,
      accountId,
      settings: nextSettings,
    });

    const refreshed = await this.buildWalletBootstrap(user, await this.getLicense(session.licenseId), walletAppId);
    const notification = refreshed.recentNotifications?.[0];
    const transaction = refreshed.recentTransactions[0];
    if (!notification || !transaction) return null;

    return {
      payload: refreshed,
      notification,
      transaction,
    };
  }

  private async buildHubSession(user: UserSummary, license: DbLicense, session: DbSession): Promise<HubSessionResponse> {
    const activatedWallets = await this.getActivatedWallets(user.id);

    return {
      user,
      license: toLicenseSummary({
        ...license,
        expiresAt: license.expiresAt.toISOString(),
      }),
      session: {
        id: session.id,
        expiresAt: session.expiresAt.toISOString(),
      },
      wallets: listWalletApps(activatedWallets),
    };
  }

  private async buildWalletBootstrap(user: UserSummary, license: DbLicense, walletAppId: WalletAppId): Promise<WalletBootstrapPayload> {
    const wallet = { ...walletRegistry[walletAppId], activated: true };
    const profile = await this.getOrCreateWalletProfile(user.id, walletAppId, wallet.name);
    const accounts = await this.getOrCreateWalletAccounts(profile);
    const balances = await this.getWalletBalances(accounts);
    const recentTransactions = await this.getRecentWalletTransactions(accounts);
    const notificationSettings = await this.getNotificationSettings(profile.id);
    const recentNotifications = await this.getRecentWalletNotifications(accounts);

    return {
      user,
      license: toLicenseSummary({
        ...license,
        expiresAt: license.expiresAt.toISOString(),
      }),
      wallet,
      profile,
      accounts,
      balances,
      recentTransactions,
      notificationSettings,
      recentNotifications,
    };
  }

  private async getUser(userId: string): Promise<UserSummary> {
    const [user] = await this.db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
    if (!user) throw new Error("User not found");

    return {
      id: user.id,
      email: user.email ?? undefined,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private async getLicense(licenseId: string) {
    const [license] = await this.db.select().from(schema.licenses).where(eq(schema.licenses.id, licenseId)).limit(1);
    if (!license) throw new Error("License not found");
    return license;
  }

  private async getSession(sessionId: string) {
    const [session] = await this.db
      .select()
      .from(schema.sessions)
      .where(and(eq(schema.sessions.id, sessionId), isNull(schema.sessions.revokedAt)))
      .limit(1);

    if (!session || session.expiresAt <= new Date()) return null;
    return session;
  }

  private async createUser(email?: string): Promise<UserSummary> {
    const [user] = await this.db
      .insert(schema.users)
      .values({
        id: createId("usr"),
        email,
      })
      .returning();

    return {
      id: user.id,
      email: user.email ?? undefined,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private async createLicense(keyHash: string, userId: string, now: Date) {
    const [license] = await this.db
      .insert(schema.licenses)
      .values({
        id: createId("lic"),
        keyHash,
        userId,
        plan: "Platform Preview",
        expiresAt: new Date(now.getTime() + THIRTY_DAYS_MS),
        allowedDevices: 1,
      })
      .returning();

    return license;
  }

  private async createSession(userId: string, licenseId: string, expiresAt: Date) {
    const [session] = await this.db
      .insert(schema.sessions)
      .values({
        id: createId("ses"),
        userId,
        licenseId,
        expiresAt,
      })
      .returning();

    return session;
  }

  private async ensureWalletApps() {
    await this.db
      .insert(schema.walletApps)
      .values(Object.values(walletRegistry))
      .onConflictDoUpdate({
        target: schema.walletApps.id,
        set: {
          name: schema.walletApps.name,
          host: schema.walletApps.host,
          enabled: schema.walletApps.enabled,
        },
      });
  }

  private async getActivatedWallets(userId: string): Promise<WalletAppId[]> {
    const profiles = await this.db
      .select({ walletAppId: schema.walletProfiles.walletAppId })
      .from(schema.walletProfiles)
      .where(eq(schema.walletProfiles.userId, userId));

    return profiles.map((profile) => profile.walletAppId);
  }

  private async getOrCreateWalletProfile(userId: string, walletAppId: WalletAppId, displayName: string): Promise<WalletProfile> {
    const [existing] = await this.db
      .select()
      .from(schema.walletProfiles)
      .where(and(eq(schema.walletProfiles.userId, userId), eq(schema.walletProfiles.walletAppId, walletAppId)))
      .limit(1);

    const profile =
      existing ??
      (
        await this.db
          .insert(schema.walletProfiles)
          .values({
            id: createId("wpf"),
            userId,
            walletAppId,
            displayName,
            username: DEFAULT_WALLET_USERNAME,
          })
          .returning()
      )[0];

    return {
      id: profile.id,
      userId: profile.userId,
      walletAppId: profile.walletAppId,
      displayName: profile.displayName,
      username: profile.username ?? undefined,
      avatarUrl: profile.avatarUrl ?? undefined,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }

  private async getWalletProfileByUserAndApp(userId: string, walletAppId: WalletAppId) {
    const [profile] = await this.db
      .select()
      .from(schema.walletProfiles)
      .where(and(eq(schema.walletProfiles.userId, userId), eq(schema.walletProfiles.walletAppId, walletAppId)))
      .limit(1);

    return profile;
  }

  private async getWalletProfileById(walletProfileId: string) {
    const [profile] = await this.db.select().from(schema.walletProfiles).where(eq(schema.walletProfiles.id, walletProfileId)).limit(1);
    return profile ?? null;
  }

  private async getOrCreateWalletAccounts(profile: WalletProfile): Promise<WalletAccount[]> {
    const existing = await this.db
      .select()
      .from(schema.walletAccounts)
      .where(eq(schema.walletAccounts.walletProfileId, profile.id))
      .orderBy(desc(schema.walletAccounts.createdAt));

    const accounts =
      existing.length > 0
        ? existing
        : await this.db
            .insert(schema.walletAccounts)
            .values({
              id: createId("wac"),
              walletProfileId: profile.id,
              name: "Account 1",
              address: await this.createUniqueDemoAddress(profile.walletAppId),
            })
            .returning();

    return accounts.map((account) => ({
      id: account.id,
      walletProfileId: account.walletProfileId,
      name: account.name,
      address: account.address,
      createdAt: account.createdAt.toISOString(),
    }));
  }

  private async getWalletBalances(accounts: WalletAccount[]): Promise<WalletBalance[]> {
    if (accounts.length === 0) return [];

    const allBalances = await Promise.all(
      accounts.map((account) =>
        this.db.select().from(schema.walletBalances).where(eq(schema.walletBalances.accountId, account.id)).orderBy(asc(schema.walletBalances.tokenSymbol)),
      ),
    );

    return allBalances.flat().map((balance) => ({
      accountId: balance.accountId,
      tokenSymbol: balance.tokenSymbol,
      amount: balance.amount,
      updatedAt: balance.updatedAt.toISOString(),
    }));
  }

  private async applyBalanceMutation(accountId: string, tokenSymbol: string, amount: number, direction: "credit" | "debit") {
    const normalizedSymbol = tokenSymbol.toUpperCase();
    const [existingBalance] = await this.db
      .select()
      .from(schema.walletBalances)
      .where(and(eq(schema.walletBalances.accountId, accountId), eq(schema.walletBalances.tokenSymbol, normalizedSymbol)))
      .limit(1);

    const currentAmount = Number(existingBalance?.amount || "0");
    const nextAmount = direction === "credit" ? currentAmount + amount : currentAmount - amount;
    if (nextAmount < 0) return false;

    await this.db
      .insert(schema.walletBalances)
      .values({
        accountId,
        tokenSymbol: normalizedSymbol,
        amount: formatAmount(nextAmount),
      })
      .onConflictDoUpdate({
        target: [schema.walletBalances.accountId, schema.walletBalances.tokenSymbol],
        set: {
          amount: formatAmount(nextAmount),
          updatedAt: new Date(),
        },
      });

    return true;
  }

  private async findCounterpartAccount(userId: string, input: CreateWalletTransactionRequest) {
    const profiles = input.counterpartWalletAppId
      ? await this.db
          .select()
          .from(schema.walletProfiles)
          .where(eq(schema.walletProfiles.walletAppId, input.counterpartWalletAppId))
      : await this.db.select().from(schema.walletProfiles);

    for (const profile of profiles) {
      const accounts = await this.db.select().from(schema.walletAccounts).where(eq(schema.walletAccounts.walletProfileId, profile.id));
      const account = accounts.find((entry) => entry.id === input.counterpartAccountId || entry.address === input.toAddress);
      if (account) return { ...account, userId: profile.userId, walletAppId: profile.walletAppId };
    }

    return null;
  }

  private async createUniqueDemoAddress(walletAppId: WalletAppId) {
    for (let attempts = 0; attempts < 10; attempts++) {
      const address = createDemoAddress(walletAppId);
      const [existing] = await this.db
        .select({ id: schema.walletAccounts.id })
        .from(schema.walletAccounts)
        .where(eq(schema.walletAccounts.address, address))
        .limit(1);
      if (!existing) return address;
    }

    throw new Error("Unable to generate a unique wallet address");
  }

  private async getNotificationSettings(walletProfileId: string): Promise<WalletNotificationSettings> {
    const [settings] = await this.db
      .select()
      .from(schema.walletNotificationSettings)
      .where(eq(schema.walletNotificationSettings.walletProfileId, walletProfileId))
      .limit(1);

    return settings ? toWalletNotificationSettings(settings) : createDefaultNotificationSettings();
  }

  private async getRecentWalletNotifications(accounts: WalletAccount[]): Promise<WalletNotification[]> {
    if (accounts.length === 0) return [];

    const accountIds = new Set(accounts.map((account) => account.id));
    const notifications = await this.db.select().from(schema.walletNotifications).orderBy(desc(schema.walletNotifications.createdAt)).limit(50);
    return notifications.filter((notification) => accountIds.has(notification.accountId)).map(toWalletNotification);
  }

  private async createWalletNotification(input: {
    walletAppId: WalletAppId;
    accountId: string;
    transactionId?: string;
    title: string;
    body: string;
  }) {
    const [notification] = await this.db
      .insert(schema.walletNotifications)
      .values({
        id: createId("ntf"),
        walletAppId: input.walletAppId,
        accountId: input.accountId,
        type: "transaction_received",
        title: input.title,
        body: input.body,
        transactionId: input.transactionId,
      })
      .returning();

    return toWalletNotification(notification);
  }

  private async createWalletEvent(input: {
    userId: string;
    walletAppId: WalletAppId;
    accountId: string;
    type: WalletEvent["type"];
    title: string;
    body: string;
    transactionId?: string;
    notificationId?: string;
  }) {
    const [event] = await this.db
      .insert(schema.walletEvents)
      .values({
        id: createId("wev"),
        userId: input.userId,
        walletAppId: input.walletAppId,
        accountId: input.accountId,
        type: input.type,
        title: input.title,
        body: input.body,
        transactionId: input.transactionId,
        notificationId: input.notificationId,
      })
      .returning();

    const walletEvent = toWalletEvent(event);
    return walletEvent;
  }

  private async getRecentWalletTransactions(accounts: WalletAccount[]): Promise<WalletTransaction[]> {
    if (accounts.length === 0) return [];

    const accountIds = new Set(accounts.map((account) => account.id));
    const transactions = await this.db.select().from(schema.walletTransactions).orderBy(desc(schema.walletTransactions.createdAt)).limit(50);

    return transactions.filter((tx) => accountIds.has(tx.accountId)).map(toWalletTransaction);
  }

  private async recordDevice(userId: string, deviceId: string) {
    await this.db
      .insert(schema.devices)
      .values({
        id: createId("dev"),
        userId,
        deviceId,
      })
      .onConflictDoUpdate({
        target: [schema.devices.userId, schema.devices.deviceId],
        set: {
          lastSeenAt: new Date(),
        },
      });
  }

  private async assertDeviceAllowed(userId: string, license: DbLicense, deviceId: string) {
    const devices = await this.db.select({ deviceId: schema.devices.deviceId }).from(schema.devices).where(eq(schema.devices.userId, userId));
    const isKnownDevice = devices.some((device) => device.deviceId === deviceId);
    const allowedDevices = getEffectiveAllowedDevices(license);

    if (!isKnownDevice && devices.length >= allowedDevices) {
      throw new DeviceLimitError(allowedDevices);
    }
  }
}

type DbLicense = typeof schema.licenses.$inferSelect;
type DbSession = typeof schema.sessions.$inferSelect;
type DbWalletNotificationSettings = typeof schema.walletNotificationSettings.$inferSelect;
type DbWalletNotification = typeof schema.walletNotifications.$inferSelect;
type DbWalletEvent = typeof schema.walletEvents.$inferSelect;

const DEFAULT_NOTIFICATION_COINS = [
  { symbol: "SOL", enabled: true, min: 5, max: 95 },
  { symbol: "USDT", enabled: false, min: 1, max: 10 },
  { symbol: "ETH", enabled: false, min: 0.1, max: 1.5 },
  { symbol: "BTC", enabled: false, min: 1, max: 10 },
  { symbol: "SUI", enabled: false, min: 1, max: 10 },
  { symbol: "MATIC", enabled: false, min: 1, max: 10 },
  { symbol: "HYPE", enabled: false, min: 1, max: 10 },
  { symbol: "BNB", enabled: false, min: 1, max: 10 },
  { symbol: "AVAX", enabled: false, min: 1, max: 10 },
  { symbol: "LINK", enabled: false, min: 1, max: 10 },
  { symbol: "UNI", enabled: false, min: 1, max: 10 },
  { symbol: "USDC", enabled: false, min: 1, max: 10 },
  { symbol: "DOGE", enabled: false, min: 1, max: 10 },
  { symbol: "MON", enabled: false, min: 1, max: 10 },
];

function toLicenseSummary(license: Omit<LicenseRecord, "keyHash" | "userId">): LicenseSummary {
  return {
    id: license.id,
    plan: license.plan,
    expiresAt: license.expiresAt,
    status: license.status,
    allowedDevices: getEffectiveAllowedDevices(license),
  };
}

function getEffectiveAllowedDevices(license: { plan: string; allowedDevices: number }) {
  const plan = license.plan.toLowerCase();
  if (plan.includes("year")) return 2;
  if (plan.includes("week") || plan.includes("starter") || plan.includes("month") || plan.includes("popular")) return 1;
  return Math.max(1, license.allowedDevices);
}

function normalizeLicenseKey(key: string) {
  return key.trim().toUpperCase().replace(/-/g, "");
}

function normalizeOptionalString(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

async function hashToken(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 18)}`;
}

function createDemoAddress(walletAppId: WalletAppId) {
  const prefix = walletAppId === "phantom" ? "Ph" : "Tw";
  return `${prefix}${crypto.randomUUID().replace(/-/g, "").slice(0, 30)}`;
}

function getBalanceKey(accountId: string, tokenSymbol: string) {
  return `${accountId}:${tokenSymbol.toUpperCase()}`;
}

function createBalanceRow(accountId: string, tokenSymbol: string, amount: string): WalletBalance {
  return {
    accountId,
    tokenSymbol: tokenSymbol.toUpperCase(),
    amount,
    updatedAt: new Date().toISOString(),
  };
}

function getBalanceDirection(type: CreateWalletTransactionRequest["type"]): "credit" | "debit" {
  return type === "receive" || type === "manual_adjustment" ? "credit" : "debit";
}

function getEffectiveTransactionType(input: CreateWalletTransactionRequest, counterpartWalletAppId?: WalletAppId): CreateWalletTransactionRequest["type"] {
  if (input.type !== "send") return input.type;
  if (!counterpartWalletAppId) return "send";
  return counterpartWalletAppId === input.walletAppId ? "same_wallet_transfer" : "cross_wallet_transfer";
}

function toTransferDelivery(type: CreateWalletTransactionRequest["type"]) {
  if (type === "same_wallet_transfer") return "same_wallet";
  if (type === "cross_wallet_transfer") return "cross_wallet";
  return "external";
}

function formatAmount(value: number) {
  return value.toFixed(6).replace(/\.?0+$/, "");
}

function getSafeTransactionDate(value?: string) {
  if (!value) return new Date();

  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.getTime() > Date.now()) return new Date();
  return date;
}

function toWalletProfile(profile: typeof schema.walletProfiles.$inferSelect): WalletProfile {
  return {
    id: profile.id,
    userId: profile.userId,
    walletAppId: profile.walletAppId,
    displayName: profile.displayName,
    username: profile.username ?? undefined,
    avatarUrl: profile.avatarUrl ?? undefined,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

function toWalletTransaction(tx: typeof schema.walletTransactions.$inferSelect): WalletTransaction {
  return {
    id: tx.id,
    walletAppId: tx.walletAppId,
    accountId: tx.accountId,
    type: tx.type,
    status: tx.status,
    tokenSymbol: tx.tokenSymbol,
    amount: tx.amount,
    fromAddress: tx.fromAddress ?? undefined,
    toAddress: tx.toAddress ?? undefined,
    counterpartWalletAppId: tx.counterpartWalletAppId ?? undefined,
    createdAt: tx.createdAt.toISOString(),
  };
}

function createDefaultNotificationSettings(): WalletNotificationSettings {
  return {
    pushEnabled: false,
    coins: DEFAULT_NOTIFICATION_COINS,
    mode: "Auto",
    frequency: 2,
    unit: "sec",
    initialDelay: 0,
    isActive: false,
    totalTimes: 10,
    remainingTimes: 0,
    senderAddress: "7x8fR9m4K5L2n3jP8hQ6vY7zB1cX0m9A8s7d6f5g4h3j",
  };
}

function sanitizeNotificationSettings(settings: WalletNotificationSettings): WalletNotificationSettings {
  const fallback = createDefaultNotificationSettings();
  const coins = (settings.coins?.length ? settings.coins : fallback.coins).map((coin) => ({
    symbol: coin.symbol.toUpperCase(),
    enabled: Boolean(coin.enabled),
    min: Math.max(0, Number(coin.min) || 0),
    max: Math.max(Number(coin.min) || 0, Number(coin.max) || 0),
  }));

  return {
    pushEnabled: Boolean(settings.pushEnabled),
    coins,
    mode: ["Manual", "Auto", "Random", "Fixed"].includes(settings.mode) ? settings.mode : fallback.mode,
    frequency: Math.max(0, Number(settings.frequency) || fallback.frequency),
    unit: ["ms", "sec", "min", "hr"].includes(settings.unit) ? settings.unit : fallback.unit,
    initialDelay: Math.max(0, Number(settings.initialDelay) || 0),
    isActive: Boolean(settings.isActive),
    totalTimes: Math.max(0, Math.floor(Number(settings.totalTimes) || fallback.totalTimes)),
    remainingTimes: Math.max(0, Math.floor(Number(settings.remainingTimes) || 0)),
    senderAddress: settings.senderAddress?.trim() || fallback.senderAddress,
  };
}

function buildSimulatedReceive(settings: WalletNotificationSettings) {
  if (settings.isActive && settings.remainingTimes <= 0) return null;

  const enabledCoins = settings.coins.filter((coin) => coin.enabled);
  if (enabledCoins.length === 0) return null;

  const coin = enabledCoins[Math.floor(Math.random() * enabledCoins.length)];
  const rawAmount = settings.mode === "Fixed" ? coin.min : Math.random() * (coin.max - coin.min) + coin.min;
  const decimals = coin.symbol === "SOL" || coin.symbol === "ETH" ? 5 : 2;

  return {
    symbol: coin.symbol,
    amount: Number(rawAmount.toFixed(decimals)),
  };
}

function decrementNotificationSettings(settings: WalletNotificationSettings): WalletNotificationSettings {
  if (!settings.isActive) return settings;

  const remainingTimes = Math.max(0, settings.remainingTimes - 1);
  return {
    ...settings,
    remainingTimes,
    isActive: remainingTimes > 0,
  };
}

function toWalletNotificationSettingsRow(walletProfileId: string, settings: WalletNotificationSettings): typeof schema.walletNotificationSettings.$inferInsert {
  return {
    walletProfileId,
    pushEnabled: settings.pushEnabled,
    coinsJson: JSON.stringify(settings.coins),
    mode: settings.mode,
    frequency: settings.frequency,
    unit: settings.unit,
    initialDelay: settings.initialDelay,
    isActive: settings.isActive,
    totalTimes: settings.totalTimes,
    remainingTimes: settings.remainingTimes,
    senderAddress: settings.senderAddress,
  };
}

function toWalletNotificationSettings(settings: DbWalletNotificationSettings): WalletNotificationSettings {
  let coins = createDefaultNotificationSettings().coins;
  try {
    const parsed = JSON.parse(settings.coinsJson);
    if (Array.isArray(parsed)) coins = parsed;
  } catch {
    coins = createDefaultNotificationSettings().coins;
  }

  return sanitizeNotificationSettings({
    pushEnabled: settings.pushEnabled,
    coins,
    mode: settings.mode as WalletNotificationSettings["mode"],
    frequency: settings.frequency,
    unit: settings.unit as WalletNotificationSettings["unit"],
    initialDelay: settings.initialDelay,
    isActive: settings.isActive,
    totalTimes: settings.totalTimes,
    remainingTimes: settings.remainingTimes,
    senderAddress: settings.senderAddress,
  });
}

function toWalletNotification(notification: DbWalletNotification): WalletNotification {
  return {
    id: notification.id,
    walletAppId: notification.walletAppId,
    accountId: notification.accountId,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    transactionId: notification.transactionId ?? undefined,
    readAt: notification.readAt?.toISOString(),
    createdAt: notification.createdAt.toISOString(),
  };
}

function toWalletEvent(event: DbWalletEvent): WalletEvent {
  return {
    id: event.id,
    userId: event.userId,
    walletAppId: event.walletAppId,
    accountId: event.accountId,
    type: event.type,
    title: event.title,
    body: event.body,
    transactionId: event.transactionId ?? undefined,
    notificationId: event.notificationId ?? undefined,
    readAt: event.readAt?.toISOString(),
    createdAt: event.createdAt.toISOString(),
  };
}
