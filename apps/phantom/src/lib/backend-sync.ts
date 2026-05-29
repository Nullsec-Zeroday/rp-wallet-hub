import type { WalletBootstrapPayload } from "@rp-wallet/types";
import { DEFAULT_BALANCES } from "./wallet-data";
import { useWalletStore, type Transaction, type UserProfile } from "./wallet-store";

function mapBackendProfileFields(payload: WalletBootstrapPayload): Pick<UserProfile, "name" | "username" | "walletAddress"> {
  const account = payload.accounts[0];
  const displayName = payload.profile.displayName || account?.name || "Account 1";

  return {
    name: displayName,
    username: payload.profile.username || "",
    walletAddress: account?.address || "",
  };
}

function mapTransactions(payload: WalletBootstrapPayload, accountId?: string): Transaction[] {
  return payload.recentTransactions
    .filter((tx) => !accountId || tx.accountId === accountId)
    .map((tx) => ({
      amount: Number(tx.amount),
      from: tx.fromAddress || "External Wallet",
      id: tx.id,
      status: "confirmed" as const,
      timestamp: new Date(tx.createdAt).getTime(),
      to: tx.toAddress || "Your Wallet",
      token: tx.tokenSymbol,
      type: (
        tx.type === "send" || tx.type === "cross_wallet_transfer"
          ? "send"
          : tx.type === "same_wallet_transfer"
            ? "swap"
            : tx.type === "manual_adjustment"
              ? "buy"
              : "receive"
      ) as Transaction["type"],
    }))
    .sort((a, b) => b.timestamp - a.timestamp);
}

function formatLicenseExpiration(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function syncStoreFromPayload(payload: WalletBootstrapPayload) {
  const account = payload.accounts[0];
  const accountBalances = account ? payload.balances.filter((balance) => balance.accountId === account.id) : payload.balances;
  const tokenBalances = accountBalances.map((balance) => ({
    balance: Number(balance.amount),
    symbol: balance.tokenSymbol,
  }));
  const transactions = mapTransactions(payload, account?.id);

  useWalletStore.setState((state) => {
    const profile = {
      ...state.profile,
      ...mapBackendProfileFields(payload),
    };
    const currentAccount = state.accounts[state.currentAccountIndex];

    const backendNotificationSettings = payload.notificationSettings;
    const keepLocalStoppedNotifications =
      backendNotificationSettings?.isActive &&
      !state.notificationSettings.isActive &&
      state.notificationSettings.remainingTimes <= 0;

    return {
      accounts: [
        {
          avatarIconIndex: currentAccount?.avatarIconIndex ?? profile.iconIndex,
          cashBalance: currentAccount?.cashBalance ?? state.cashBalance,
          id: account?.id || "initial-account",
          name: account?.name || profile.name,
          profile,
          tokenBalances: tokenBalances.length ? tokenBalances : DEFAULT_BALANCES,
          transactions,
          walletName: account?.name || profile.name,
        },
      ],
      currentAccountIndex: 0,
      notificationSettings: keepLocalStoppedNotifications
        ? state.notificationSettings
        : backendNotificationSettings || state.notificationSettings,
      profile,
      licenseExpiration: formatLicenseExpiration(payload.license.expiresAt) || state.licenseExpiration,
      licensePlan: payload.license.plan || state.licensePlan,
      tokenBalances: tokenBalances.length ? tokenBalances : DEFAULT_BALANCES,
      transactions,
      walletName: account?.name || profile.name,
    };
  });
}
