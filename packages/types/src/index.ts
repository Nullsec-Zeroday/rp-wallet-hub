export type WalletAppId = "phantom" | "trust";

export type TransactionType =
  | "send"
  | "receive"
  | "swap"
  | "buy"
  | "same_wallet_transfer"
  | "cross_wallet_transfer"
  | "manual_adjustment";

export type TransactionStatus = "pending" | "confirmed" | "failed";

export interface LicenseSummary {
  id: string;
  plan: string;
  expiresAt: string;
  status: "active" | "expired" | "revoked";
  allowedDevices: number;
}

export interface UserSummary {
  id: string;
  email?: string;
  createdAt: string;
}

export interface WalletAppSummary {
  id: WalletAppId;
  name: string;
  host: string;
  enabled: boolean;
  activated: boolean;
}

export interface WalletAccount {
  id: string;
  walletProfileId: string;
  name: string;
  username?: string;
  address: string;
  createdAt: string;
}

export interface WalletBalance {
  accountId: string;
  tokenSymbol: string;
  amount: string;
  updatedAt: string;
}

export interface WalletProfile {
  id: string;
  userId: string;
  walletAppId: WalletAppId;
  displayName: string;
  username?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  walletAppId: WalletAppId;
  accountId: string;
  type: TransactionType;
  status: TransactionStatus;
  tokenSymbol: string;
  amount: string;
  fromAddress?: string;
  toAddress?: string;
  counterpartWalletAppId?: WalletAppId;
  createdAt: string;
}

export interface WalletNotificationCoin {
  symbol: string;
  enabled: boolean;
  min: number;
  max: number;
}

export interface WalletNotificationSettings {
  pushEnabled: boolean;
  coins: WalletNotificationCoin[];
  mode: "Manual" | "Auto" | "Random" | "Fixed";
  frequency: number;
  unit: "ms" | "sec" | "min" | "hr";
  initialDelay: number;
  isActive: boolean;
  totalTimes: number;
  remainingTimes: number;
  senderAddress: string;
}

export interface WalletNotification {
  id: string;
  walletAppId: WalletAppId;
  accountId: string;
  type: "transaction_received" | "simulation_started" | "simulation_stopped";
  title: string;
  body: string;
  transactionId?: string;
  readAt?: string;
  createdAt: string;
}

export interface WalletEvent {
  id: string;
  userId: string;
  walletAppId: WalletAppId;
  accountId: string;
  type: "wallet_received" | "transaction_created" | "balance_updated";
  title: string;
  body: string;
  transactionId?: string;
  notificationId?: string;
  readAt?: string;
  createdAt: string;
}

export interface SessionSummary {
  id: string;
  expiresAt: string;
}

export interface AccessSummary {
  kind: "license" | "demo";
  expiresAt: string;
  purchaseUrl?: string;
}

export interface HubSessionResponse {
  user: UserSummary;
  license: LicenseSummary;
  wallets: WalletAppSummary[];
  session: SessionSummary;
  access?: AccessSummary;
}

export interface WalletBootstrapPayload {
  user: UserSummary;
  license: LicenseSummary;
  access?: AccessSummary;
  wallet: WalletAppSummary;
  profile: WalletProfile;
  accounts: WalletAccount[];
  balances: WalletBalance[];
  recentTransactions: WalletTransaction[];
  notificationSettings?: WalletNotificationSettings;
  recentNotifications?: WalletNotification[];
}

export interface CreateWalletAccountRequest {
  walletAppId: WalletAppId;
  name?: string;
}

export type WalletMutationType = "send" | "receive" | "same_wallet_transfer" | "cross_wallet_transfer" | "manual_adjustment";

export interface CreateWalletTransactionRequest {
  walletAppId: WalletAppId;
  accountId: string;
  type: WalletMutationType;
  tokenSymbol: string;
  amount: string;
  fromAddress?: string;
  toAddress?: string;
  counterpartWalletAppId?: WalletAppId;
  counterpartAccountId?: string;
  createdAt?: string;
  source?: "user" | "notification_simulation" | "system";
}

export interface CreateWalletTransactionsBatchRequest {
  walletAppId: WalletAppId;
  accountId: string;
  transactions: Array<Omit<CreateWalletTransactionRequest, "walletAppId" | "accountId">>;
}

export interface CreateWalletTransactionResponse {
  payload: WalletBootstrapPayload;
  transaction: WalletTransaction;
  counterpartTransaction?: WalletTransaction;
  delivery: "external" | "same_wallet" | "cross_wallet";
  recipientFound: boolean;
  notification?: WalletNotification;
}

export interface UpdateWalletNotificationSettingsRequest {
  walletAppId: WalletAppId;
  accountId: string;
  settings: WalletNotificationSettings;
}

export interface TriggerWalletNotificationRequest {
  walletAppId: WalletAppId;
  accountId: string;
}

export interface TriggerWalletNotificationResponse {
  payload: WalletBootstrapPayload;
  notification: WalletNotification;
  transaction: WalletTransaction;
}

export interface UpdateWalletStateRequest {
  walletAppId: WalletAppId;
  accountId: string;
  profile?: {
    displayName?: string;
    username?: string;
    avatarUrl?: string;
  };
  accountName?: string;
  accountUsername?: string;
  accountAddress?: string;
  balances?: Array<{
    tokenSymbol: string;
    amount: string;
  }>;
}
