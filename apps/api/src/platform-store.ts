import { neon } from "@neondatabase/serverless";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@rp-wallet/db";
import type {
  CreateWalletTransactionRequest,
  HubSessionResponse,
  LicenseSummary,
  SessionSummary,
  UserSummary,
  WalletAccount,
  WalletAppId,
  WalletBalance,
  WalletBootstrapPayload,
  WalletProfile,
  WalletTransaction,
} from "@rp-wallet/types";
import { listWalletApps, walletRegistry } from "@rp-wallet/wallet-core";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const LAUNCH_TOKEN_TTL_MS = 60 * 1000;

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
  activateLicense(input: ActivationInput): Promise<HubSessionResponse>;
  getHubSession(sessionId: string): Promise<HubSessionResponse | null>;
  createWalletLaunch(input: WalletLaunchInput): Promise<WalletLaunchResult | null>;
  exchangeWalletBootstrap(input: WalletBootstrapInput): Promise<WalletBootstrapResult | null>;
  getWalletState(sessionId: string, walletAppId: WalletAppId): Promise<WalletBootstrapPayload | null>;
  getWalletTransactions(sessionId: string, walletAppId: WalletAppId): Promise<WalletTransaction[] | null>;
  createWalletTransaction(sessionId: string, input: CreateWalletTransactionRequest): Promise<WalletBootstrapPayload | null>;
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

  async activateLicense(input: ActivationInput): Promise<HubSessionResponse> {
    const now = new Date();
    const keyHash = await hashToken(normalizeLicenseKey(input.licenseKey));
    const existingLicense = [...this.licenses.values()].find((license) => license.keyHash === keyHash);
    const user = existingLicense ? this.users.get(existingLicense.userId)! : this.createUser(input.email);
    const license = existingLicense ?? this.createLicense(keyHash, user.id, now);
    const session = this.createSession(user.id, license.id, license.expiresAt);

    this.recordDevice(user.id, input.deviceId);
    return this.buildHubSession(user, license, session);
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

  async getWalletTransactions(sessionId: string, walletAppId: WalletAppId): Promise<WalletTransaction[] | null> {
    const session = this.sessions.get(sessionId);
    if (!session || new Date(session.expiresAt) <= new Date()) return null;

    const user = this.users.get(session.userId);
    if (!user) return null;

    const profile = this.getOrCreateWalletProfile(user.id, walletAppId, walletRegistry[walletAppId].name);
    return [...(this.walletTransactions.get(profile.id) || [])].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }

  async createWalletTransaction(sessionId: string, input: CreateWalletTransactionRequest): Promise<WalletBootstrapPayload | null> {
    const session = this.sessions.get(sessionId);
    if (!session || new Date(session.expiresAt) <= new Date()) return null;

    const user = this.users.get(session.userId);
    const license = this.licenses.get(session.licenseId);
    if (!user || !license) return null;

    const profile = this.getOrCreateWalletProfile(user.id, input.walletAppId, walletRegistry[input.walletAppId].name);
    const account = this.getOrCreateWalletAccounts(profile).find((entry) => entry.id === input.accountId);
    if (!account) return null;

    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) return null;

    const balanceKey = getBalanceKey(input.accountId, input.tokenSymbol);
    const current = this.walletBalances.get(balanceKey) || createBalanceRow(input.accountId, input.tokenSymbol, "0");
    const currentAmount = Number(current.amount);
    let nextAmount = currentAmount;

    if (input.type === "receive") nextAmount = currentAmount + amount;
    if (input.type === "manual_adjustment") nextAmount = currentAmount + amount;
    if (input.type === "same_wallet_transfer") {
      if (currentAmount < amount) return null;
      nextAmount = currentAmount - amount;
    }

    const nextBalance = {
      ...current,
      amount: formatAmount(nextAmount),
      updatedAt: new Date().toISOString(),
    };
    this.walletBalances.set(balanceKey, nextBalance);

    const transaction: WalletTransaction = {
      id: createId("wtx"),
      walletAppId: input.walletAppId,
      accountId: input.accountId,
      type: input.type,
      status: "confirmed",
      tokenSymbol: input.tokenSymbol.toUpperCase(),
      amount: formatAmount(amount),
      fromAddress: input.fromAddress,
      toAddress: input.toAddress,
      createdAt: new Date().toISOString(),
    };

    const existing = this.walletTransactions.get(profile.id) || [];
    this.walletTransactions.set(profile.id, [transaction, ...existing]);

    return this.buildWalletBootstrap(user, license, input.walletAppId);
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

    return {
      user,
      license: toLicenseSummary(license),
      wallet,
      profile,
      accounts,
      balances,
      recentTransactions,
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
      allowedDevices: 2,
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
      address: createDemoAddress(profile.walletAppId),
      createdAt: new Date().toISOString(),
    };

    this.walletAccounts.set(profile.id, [account]);
    return [account];
  }

  private getWalletBalances(accounts: WalletAccount[]) {
    const accountIds = new Set(accounts.map((account) => account.id));
    return [...this.walletBalances.values()].filter((balance) => accountIds.has(balance.accountId));
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
}

class NeonPlatformStore implements PlatformStore {
  private readonly db;

  constructor(databaseUrl: string) {
    this.db = drizzle({ client: neon(databaseUrl), schema });
  }

  async activateLicense(input: ActivationInput): Promise<HubSessionResponse> {
    await this.ensureWalletApps();

    const now = new Date();
    const keyHash = await hashToken(normalizeLicenseKey(input.licenseKey));
    const [existingLicense] = await this.db.select().from(schema.licenses).where(eq(schema.licenses.keyHash, keyHash)).limit(1);

    const user = existingLicense
      ? await this.getUser(existingLicense.userId)
      : await this.createUser(input.email);
    const license = existingLicense ?? (await this.createLicense(keyHash, user.id, now));
    const session = await this.createSession(user.id, license.id, license.expiresAt);

    await this.recordDevice(user.id, input.deviceId);
    return this.buildHubSession(user, license, session);
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

  async createWalletTransaction(sessionId: string, input: CreateWalletTransactionRequest): Promise<WalletBootstrapPayload | null> {
    const session = await this.getSession(sessionId);
    if (!session) return null;

    const user = await this.getUser(session.userId);
    const license = await this.getLicense(session.licenseId);
    const profile = await this.getOrCreateWalletProfile(user.id, input.walletAppId, walletRegistry[input.walletAppId].name);
    const accounts = await this.getOrCreateWalletAccounts(profile);
    const account = accounts.find((entry) => entry.id === input.accountId);
    if (!account) return null;

    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) return null;

    const [existingBalance] = await this.db
      .select()
      .from(schema.walletBalances)
      .where(and(eq(schema.walletBalances.accountId, input.accountId), eq(schema.walletBalances.tokenSymbol, input.tokenSymbol.toUpperCase())))
      .limit(1);

    const currentAmount = Number(existingBalance?.amount || "0");
    let nextAmount = currentAmount;

    if (input.type === "receive") nextAmount = currentAmount + amount;
    if (input.type === "manual_adjustment") nextAmount = currentAmount + amount;
    if (input.type === "same_wallet_transfer") {
      if (currentAmount < amount) return null;
      nextAmount = currentAmount - amount;
    }

    await this.db
      .insert(schema.walletBalances)
      .values({
        accountId: input.accountId,
        tokenSymbol: input.tokenSymbol.toUpperCase(),
        amount: formatAmount(nextAmount),
      })
      .onConflictDoUpdate({
        target: [schema.walletBalances.accountId, schema.walletBalances.tokenSymbol],
        set: {
          amount: formatAmount(nextAmount),
          updatedAt: new Date(),
        },
      });

    await this.db.insert(schema.walletTransactions).values({
      id: createId("wtx"),
      walletAppId: input.walletAppId,
      accountId: input.accountId,
      type: input.type,
      status: "confirmed",
      tokenSymbol: input.tokenSymbol.toUpperCase(),
      amount: formatAmount(amount),
      fromAddress: input.fromAddress,
      toAddress: input.toAddress,
    });

    return this.buildWalletBootstrap(user, license, input.walletAppId);
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
        allowedDevices: 2,
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

  private async getOrCreateWalletAccounts(profile: WalletProfile): Promise<WalletAccount[]> {
    const existing = await this.db.select().from(schema.walletAccounts).where(eq(schema.walletAccounts.walletProfileId, profile.id));

    const accounts =
      existing.length > 0
        ? existing
        : await this.db
            .insert(schema.walletAccounts)
            .values({
              id: createId("wac"),
              walletProfileId: profile.id,
              name: "Account 1",
              address: createDemoAddress(profile.walletAppId),
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
}

type DbLicense = typeof schema.licenses.$inferSelect;
type DbSession = typeof schema.sessions.$inferSelect;

function toLicenseSummary(license: Omit<LicenseRecord, "keyHash" | "userId">): LicenseSummary {
  return {
    id: license.id,
    plan: license.plan,
    expiresAt: license.expiresAt,
    status: license.status,
    allowedDevices: license.allowedDevices,
  };
}

function normalizeLicenseKey(key: string) {
  return key.trim().toUpperCase().replace(/-/g, "");
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

function formatAmount(value: number) {
  return value.toFixed(6).replace(/\.?0+$/, "");
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
