import type { WalletBootstrapPayload } from "@rp-wallet/types";
import { applyDemoRestrictions } from "@rp-wallet/wallet-core";
import { DEFAULT_BALANCES } from "./wallet-data";
import { useWalletStore, type Transaction, type UserProfile } from "./wallet-store";

function mapBackendProfileFields(payload: WalletBootstrapPayload): Pick<UserProfile, "name" | "username" | "walletAddress"> {
  const account = payload.accounts[0];
  const displayName = payload.profile.displayName || account?.name || "Account 1";

  return {
    name: displayName,
    username: account?.username || payload.profile.username || "",
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
          || tx.type === "same_wallet_transfer"
          ? "send"
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

export function syncStoreFromPayload(payload: WalletBootstrapPayload, preferredAccountId?: string) {
  payload = applyDemoRestrictions("phantom", payload);

  useWalletStore.setState((state) => {
    const previousAccountId = preferredAccountId || state.accounts[state.currentAccountIndex]?.id;
    const accounts = payload.accounts.map((account) => {
      const previous = state.accounts.find((entry) => entry.id === account.id);
      const profile = {
        ...(previous?.profile || state.profile),
        ...mapBackendProfileFields({
          ...payload,
          accounts: [account],
        }),
      };
      const tokenBalances = payload.balances
        .filter((balance) => balance.accountId === account.id)
        .map((balance) => ({
          balance: Number(balance.amount),
          symbol: balance.tokenSymbol,
        }));

      return {
        avatarIconIndex: previous?.avatarIconIndex ?? profile.iconIndex,
        cashBalance: previous?.cashBalance ?? 0,
        id: account.id,
        name: account.name,
        profile,
        tokenBalances: tokenBalances.length ? tokenBalances : DEFAULT_BALANCES,
        transactions: mapTransactions(payload, account.id),
        walletName: account.name,
      };
    });
    const currentAccountIndex = Math.max(0, accounts.findIndex((account) => account.id === previousAccountId));
    const currentAccount = accounts[currentAccountIndex] || accounts[0];

    const backendNotificationSettings = payload.notificationSettings;
    const keepLocalStoppedNotifications =
      backendNotificationSettings?.isActive &&
      !state.notificationSettings.isActive &&
      state.notificationSettings.remainingTimes <= 0;

    return {
      accounts,
      currentAccountIndex,
      notificationSettings: keepLocalStoppedNotifications
        ? state.notificationSettings
        : backendNotificationSettings || state.notificationSettings,
      profile: currentAccount?.profile || state.profile,
      licenseExpiration: formatLicenseExpiration(payload.license.expiresAt) || state.licenseExpiration,
      licensePlan: payload.license.plan || state.licensePlan,
      tokenBalances: currentAccount?.tokenBalances || DEFAULT_BALANCES,
      transactions: currentAccount?.transactions || [],
      cashBalance: currentAccount?.cashBalance || 0,
      walletName: currentAccount?.walletName || state.walletName,
    };
  });
}
