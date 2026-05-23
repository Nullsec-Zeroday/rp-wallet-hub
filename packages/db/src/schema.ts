import { boolean, integer, numeric, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const licenseStatus = pgEnum("license_status", ["active", "expired", "revoked"]);
export const walletAppId = pgEnum("wallet_app_id", ["phantom", "trust"]);
export const transactionType = pgEnum("transaction_type", [
  "send",
  "receive",
  "swap",
  "buy",
  "same_wallet_transfer",
  "cross_wallet_transfer",
  "manual_adjustment",
]);
export const transactionStatus = pgEnum("transaction_status", ["pending", "confirmed", "failed"]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const licenses = pgTable(
  "licenses",
  {
    id: text("id").primaryKey(),
    keyHash: text("key_hash").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    plan: text("plan").notNull(),
    status: licenseStatus("status").default("active").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    allowedDevices: integer("allowed_devices").default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("licenses_key_hash_unique").on(table.keyHash)],
);

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  licenseId: text("license_id")
    .notNull()
    .references(() => licenses.id),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const devices = pgTable(
  "devices",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    deviceId: text("device_id").notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("devices_user_device_unique").on(table.userId, table.deviceId)],
);

export const walletApps = pgTable("wallet_apps", {
  id: walletAppId("id").primaryKey(),
  name: text("name").notNull(),
  host: text("host").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const walletProfiles = pgTable(
  "wallet_profiles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    walletAppId: walletAppId("wallet_app_id")
      .notNull()
      .references(() => walletApps.id),
    displayName: text("display_name").notNull(),
    username: text("username"),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("wallet_profiles_user_app_unique").on(table.userId, table.walletAppId)],
);

export const walletAccounts = pgTable("wallet_accounts", {
  id: text("id").primaryKey(),
  walletProfileId: text("wallet_profile_id")
    .notNull()
    .references(() => walletProfiles.id),
  name: text("name").notNull(),
  address: text("address").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const walletBalances = pgTable(
  "wallet_balances",
  {
    accountId: text("account_id")
      .notNull()
      .references(() => walletAccounts.id),
    tokenSymbol: text("token_symbol").notNull(),
    amount: numeric("amount", { precision: 32, scale: 12 }).default("0").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.accountId, table.tokenSymbol] })],
);

export const walletTransactions = pgTable("wallet_transactions", {
  id: text("id").primaryKey(),
  walletAppId: walletAppId("wallet_app_id")
    .notNull()
    .references(() => walletApps.id),
  accountId: text("account_id")
    .notNull()
    .references(() => walletAccounts.id),
  type: transactionType("type").notNull(),
  status: transactionStatus("status").default("confirmed").notNull(),
  tokenSymbol: text("token_symbol").notNull(),
  amount: numeric("amount", { precision: 32, scale: 12 }).notNull(),
  fromAddress: text("from_address"),
  toAddress: text("to_address"),
  counterpartWalletAppId: walletAppId("counterpart_wallet_app_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const walletLaunchTokens = pgTable(
  "wallet_launch_tokens",
  {
    id: text("id").primaryKey(),
    tokenHash: text("token_hash").notNull(),
    sessionId: text("session_id")
      .notNull()
      .references(() => sessions.id),
    walletAppId: walletAppId("wallet_app_id")
      .notNull()
      .references(() => walletApps.id),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("wallet_launch_tokens_hash_unique").on(table.tokenHash)],
);
