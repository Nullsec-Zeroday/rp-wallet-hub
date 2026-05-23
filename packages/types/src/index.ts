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

export interface SessionSummary {
  id: string;
  expiresAt: string;
}

export interface HubSessionResponse {
  user: UserSummary;
  license: LicenseSummary;
  wallets: WalletAppSummary[];
  session: SessionSummary;
}

export interface WalletBootstrapPayload {
  user: UserSummary;
  license: LicenseSummary;
  wallet: WalletAppSummary;
  profile: WalletProfile;
  accounts: WalletAccount[];
  balances: WalletBalance[];
  recentTransactions: WalletTransaction[];
}

export type WalletMutationType = "receive" | "same_wallet_transfer" | "manual_adjustment";

export interface CreateWalletTransactionRequest {
  walletAppId: WalletAppId;
  accountId: string;
  type: WalletMutationType;
  tokenSymbol: string;
  amount: string;
  fromAddress?: string;
  toAddress?: string;
}
