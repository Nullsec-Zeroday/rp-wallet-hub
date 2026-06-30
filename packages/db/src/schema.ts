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
export const notificationType = pgEnum("notification_type", ["transaction_received", "simulation_started", "simulation_stopped"]);
export const walletEventType = pgEnum("wallet_event_type", ["wallet_received", "transaction_created", "balance_updated"]);
export const affiliateStatus = pgEnum("affiliate_status", ["active", "disabled"]);
export const affiliateConversionStatus = pgEnum("affiliate_conversion_status", ["pending", "approved", "rejected", "paid"]);
export const affiliatePayoutStatus = pgEnum("affiliate_payout_status", ["pending", "paid", "cancelled"]);

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
    keyPlaintext: text("key_plaintext"),
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

export const paymentOrders = pgTable(
  "payment_orders",
  {
    id: text("id").primaryKey(),
    provider: text("provider").notNull(),
    providerPaymentId: text("provider_payment_id"),
    email: text("email").notNull(),
    planId: text("plan_id").notNull(),
    planLabel: text("plan_label").notNull(),
    priceAmount: numeric("price_amount", { precision: 12, scale: 2 }).notNull(),
    priceCurrency: text("price_currency").default("USD").notNull(),
    durationDays: integer("duration_days").notNull(),
    allowedDevices: integer("allowed_devices").default(1).notNull(),
    affiliateCode: text("affiliate_code"),
    status: text("status").default("created").notNull(),
    licenseId: text("license_id").references(() => licenses.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    fulfilledAt: timestamp("fulfilled_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("payment_orders_provider_payment_unique").on(table.provider, table.providerPaymentId)],
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

export const demoKeys = pgTable(
  "demo_keys",
  {
    id: text("id").primaryKey(),
    keyHash: text("key_hash").notNull(),
    label: text("label").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("demo_keys_key_hash_unique").on(table.keyHash)],
);

export const demoDevices = pgTable(
  "demo_devices",
  {
    id: text("id").primaryKey(),
    deviceId: text("device_id").notNull(),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).defaultNow().notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("demo_devices_device_id_unique").on(table.deviceId)],
);

export const demoSessions = pgTable("demo_sessions", {
  id: text("id").primaryKey(),
  demoKeyId: text("demo_key_id")
    .notNull()
    .references(() => demoKeys.id),
  demoDeviceId: text("demo_device_id")
    .notNull()
    .references(() => demoDevices.id),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  licenseId: text("license_id")
    .notNull()
    .references(() => licenses.id),
  sessionId: text("session_id")
    .notNull()
    .references(() => sessions.id),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

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
  username: text("username"),
  address: text("address").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("wallet_accounts_address_unique").on(table.address)]);

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
  toTokenSymbol: text("to_token_symbol"),
  toAmount: numeric("to_amount", { precision: 32, scale: 12 }),
  fromAddress: text("from_address"),
  toAddress: text("to_address"),
  counterpartWalletAppId: walletAppId("counterpart_wallet_app_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const walletNotificationSettings = pgTable("wallet_notification_settings", {
  walletProfileId: text("wallet_profile_id")
    .primaryKey()
    .references(() => walletProfiles.id),
  pushEnabled: boolean("push_enabled").default(false).notNull(),
  coinsJson: text("coins_json").notNull(),
  mode: text("mode").default("Auto").notNull(),
  frequency: integer("frequency").default(2).notNull(),
  unit: text("unit").default("sec").notNull(),
  initialDelay: integer("initial_delay").default(0).notNull(),
  isActive: boolean("is_active").default(false).notNull(),
  totalTimes: integer("total_times").default(10).notNull(),
  remainingTimes: integer("remaining_times").default(0).notNull(),
  senderAddress: text("sender_address").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const walletNotifications = pgTable("wallet_notifications", {
  id: text("id").primaryKey(),
  walletAppId: walletAppId("wallet_app_id")
    .notNull()
    .references(() => walletApps.id),
  accountId: text("account_id")
    .notNull()
    .references(() => walletAccounts.id),
  type: notificationType("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  transactionId: text("transaction_id").references(() => walletTransactions.id),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const walletEvents = pgTable("wallet_events", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  walletAppId: walletAppId("wallet_app_id")
    .notNull()
    .references(() => walletApps.id),
  accountId: text("account_id")
    .notNull()
    .references(() => walletAccounts.id),
  type: walletEventType("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  transactionId: text("transaction_id").references(() => walletTransactions.id),
  notificationId: text("notification_id").references(() => walletNotifications.id),
  readAt: timestamp("read_at", { withTimezone: true }),
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

export const affiliates = pgTable(
  "affiliates",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    displayName: text("display_name").notNull(),
    email: text("email"),
    status: affiliateStatus("status").default("active").notNull(),
    commissionRate: numeric("commission_rate", { precision: 5, scale: 4 }).default("0.2000").notNull(),
    payoutInfoJson: text("payout_info_json"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("affiliates_code_unique").on(table.code)],
);

export const affiliateClicks = pgTable("affiliate_clicks", {
  id: text("id").primaryKey(),
  affiliateId: text("affiliate_id")
    .notNull()
    .references(() => affiliates.id),
  affiliateCode: text("affiliate_code").notNull(),
  visitorId: text("visitor_id").notNull(),
  landingPath: text("landing_path").notNull(),
  referrer: text("referrer"),
  source: text("source"),
  userAgentHash: text("user_agent_hash"),
  ipHash: text("ip_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const affiliateAttributions = pgTable(
  "affiliate_attributions",
  {
    visitorId: text("visitor_id").primaryKey(),
    affiliateId: text("affiliate_id")
      .notNull()
      .references(() => affiliates.id),
    affiliateCode: text("affiliate_code").notNull(),
    clickId: text("click_id")
      .notNull()
      .references(() => affiliateClicks.id),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("affiliate_attributions_visitor_unique").on(table.visitorId)],
);

export const affiliateCheckoutIntents = pgTable("affiliate_checkout_intents", {
  id: text("id").primaryKey(),
  affiliateId: text("affiliate_id")
    .notNull()
    .references(() => affiliates.id),
  affiliateCode: text("affiliate_code").notNull(),
  visitorId: text("visitor_id").notNull(),
  clickId: text("click_id").references(() => affiliateClicks.id),
  plan: text("plan").notNull(),
  productId: text("product_id"),
  variantId: text("variant_id"),
  sellauthInvoiceId: text("sellauth_invoice_id"),
  buyerEmail: text("buyer_email"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const affiliateConversions = pgTable(
  "affiliate_conversions",
  {
    id: text("id").primaryKey(),
    affiliateId: text("affiliate_id")
      .notNull()
      .references(() => affiliates.id),
    affiliateCode: text("affiliate_code").notNull(),
    checkoutIntentId: text("checkout_intent_id").references(() => affiliateCheckoutIntents.id),
    licenseId: text("license_id").references(() => licenses.id),
    userId: text("user_id").references(() => users.id),
    sellauthOrderId: text("sellauth_order_id").notNull(),
    buyerEmail: text("buyer_email"),
    plan: text("plan").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).default("0").notNull(),
    currency: text("currency").default("USD").notNull(),
    commissionRate: numeric("commission_rate", { precision: 5, scale: 4 }).notNull(),
    commissionAmount: numeric("commission_amount", { precision: 12, scale: 2 }).default("0").notNull(),
    status: affiliateConversionStatus("status").default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("affiliate_conversions_order_unique").on(table.sellauthOrderId)],
);

export const affiliatePayouts = pgTable("affiliate_payouts", {
  id: text("id").primaryKey(),
  affiliateId: text("affiliate_id")
    .notNull()
    .references(() => affiliates.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).default("0").notNull(),
  currency: text("currency").default("USD").notNull(),
  status: affiliatePayoutStatus("status").default("pending").notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const affiliateMagicLinks = pgTable(
  "affiliate_magic_links",
  {
    id: text("id").primaryKey(),
    tokenHash: text("token_hash").notNull(),
    affiliateId: text("affiliate_id")
      .notNull()
      .references(() => affiliates.id),
    email: text("email").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("affiliate_magic_links_hash_unique").on(table.tokenHash)],
);

export const affiliateSessions = pgTable(
  "affiliate_sessions",
  {
    id: text("id").primaryKey(),
    affiliateId: text("affiliate_id")
      .notNull()
      .references(() => affiliates.id),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("affiliate_sessions_id_unique").on(table.id)],
);
