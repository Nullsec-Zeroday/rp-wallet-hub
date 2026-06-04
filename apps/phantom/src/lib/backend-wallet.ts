import { RpWalletApiClient } from "@rp-wallet/api-client";
import type {
  CreateWalletTransactionResponse,
  CreateWalletTransactionRequest,
  UpdateWalletStateRequest,
  WalletBootstrapPayload,
  WalletNotificationSettings,
} from "@rp-wallet/types";
import { applyDemoRestrictions, isDemoPayload, readCachedBootstrap, writeCachedBootstrap } from "@rp-wallet/wallet-core";
import { appEnv } from "../app-env";
import { syncStoreFromPayload } from "./backend-sync";
import { logWalletDebug } from "./wallet-debug";
import { useWalletStore } from "./wallet-store";

const api = new RpWalletApiClient(appEnv.apiBaseUrl);

function applyPayload(payload: WalletBootstrapPayload, options: { preserveLocalNotificationSettings?: boolean } = {}) {
  payload = applyDemoRestrictions("phantom", payload);
  const payloadToApply = options.preserveLocalNotificationSettings
    ? {
      ...payload,
      notificationSettings: useWalletStore.getState().notificationSettings,
    }
    : payload;

  writeCachedBootstrap("phantom", payloadToApply);
  syncStoreFromPayload(payloadToApply);
  return payloadToApply;
}

function isDemoMode() {
  return isDemoPayload(readCachedBootstrap("phantom"));
}

function createLocalTransaction(input: Omit<CreateWalletTransactionRequest, "walletAppId" | "accountId">) {
  const account = getCurrentBackendAccount();
  if (!account) throw new Error("No wallet account is available.");
  const store = useWalletStore.getState();
  const amount = Number(input.amount);
  const tokenSymbol = input.tokenSymbol.toUpperCase();
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter a valid amount greater than zero.");
  if (input.type === "send") {
    const current = store.tokenBalances.find((balance) => balance.symbol === tokenSymbol)?.balance || 0;
    if (current < amount) throw new Error("Insufficient balance for this transfer.");
    store.updateBalance(tokenSymbol, Math.max(0, current - amount));
  }
  store.addTransaction({
    amount,
    from: input.fromAddress || account.profile.walletAddress || "Your Wallet",
    status: "confirmed",
    to: input.toAddress || "External Wallet",
    token: tokenSymbol,
    type: input.type === "send" ? "send" : "receive",
  });
  const transaction = useWalletStore.getState().transactions[0];
  return transaction;
}

export function getCurrentBackendAccount() {
  return useWalletStore.getState().accounts[useWalletStore.getState().currentAccountIndex];
}

export async function createBackendWalletTransaction(input: Omit<CreateWalletTransactionRequest, "walletAppId" | "accountId">) {
  const account = getCurrentBackendAccount();
  if (!account) throw new Error("No wallet account is available.");
  if (isDemoMode()) {
    const tx = createLocalTransaction(input);
    return {
      delivery: "external",
      payload: readCachedBootstrap("phantom")!,
      recipientFound: false,
      transaction: {
        id: tx.id,
        walletAppId: "phantom",
        accountId: account.id,
        type: tx.type === "send" ? "send" : "receive",
        status: "confirmed",
        tokenSymbol: tx.token,
        amount: String(tx.amount),
        fromAddress: tx.from,
        toAddress: tx.to,
        createdAt: new Date(tx.timestamp).toISOString(),
      },
    } satisfies CreateWalletTransactionResponse;
  }

  logWalletDebug("send:start", {
    amount: input.amount,
    fromAddress: input.fromAddress,
    toAddress: input.toAddress,
    tokenSymbol: input.tokenSymbol,
    type: input.type,
  });

  const response = await api.createWalletTransaction({
    walletAppId: "phantom",
    accountId: account.id,
    ...input,
  });

  const payload = applyPayload(response.payload);
  logWalletDebug("send:result", {
    delivery: response.delivery,
    recipientFound: response.recipientFound,
    counterpartWalletAppId: response.counterpartTransaction?.walletAppId,
    transactionId: response.transaction.id,
    type: response.transaction.type,
  });

  return {
    ...response,
    payload,
  } satisfies CreateWalletTransactionResponse;
}

export async function createBackendWalletTransactionsBatch(inputs: Array<Omit<CreateWalletTransactionRequest, "walletAppId" | "accountId">>) {
  const account = getCurrentBackendAccount();
  if (!account) throw new Error("No wallet account is available.");
  if (isDemoMode()) {
    inputs.forEach(createLocalTransaction);
    return readCachedBootstrap("phantom")!;
  }
  if (inputs.length === 0) {
    return api.getWalletState("phantom").then((payload) => applyPayload(payload));
  }

  const payload = await api.createWalletTransactionsBatch({
    walletAppId: "phantom",
    accountId: account.id,
    transactions: inputs,
  });

  return applyPayload(payload, {
    preserveLocalNotificationSettings: inputs.some((input) => input.source === "notification_simulation"),
  });
}

export async function deleteBackendWalletTransaction(transactionId: string) {
  if (isDemoMode()) {
    useWalletStore.getState().deleteTransaction(transactionId);
    return readCachedBootstrap("phantom")!;
  }
  const payload = await api.deleteWalletTransaction("phantom", transactionId);
  return applyPayload(payload);
}

export async function clearBackendWalletTransactions() {
  if (isDemoMode()) {
    useWalletStore.getState().clearTransactions();
    return readCachedBootstrap("phantom")!;
  }
  const payload = await api.clearWalletTransactions("phantom");
  return applyPayload(payload);
}

export async function updateBackendWalletState(input: Omit<UpdateWalletStateRequest, "walletAppId" | "accountId">) {
  const account = getCurrentBackendAccount();
  if (!account) throw new Error("No wallet account is available.");
  if (isDemoMode()) return readCachedBootstrap("phantom")!;

  const payload = await api.updateWalletState({
    walletAppId: "phantom",
    accountId: account.id,
    ...input,
  });

  return applyPayload(payload);
}

export async function updateBackendNotificationSettings(settings: WalletNotificationSettings) {
  const account = getCurrentBackendAccount();
  if (!account) throw new Error("No wallet account is available.");
  if (isDemoMode()) {
    useWalletStore.getState().updateNotificationSettings(settings);
    return readCachedBootstrap("phantom")!;
  }

  const payload = await api.updateWalletNotificationSettings({
    walletAppId: "phantom",
    accountId: account.id,
    settings,
  });

  return applyPayload(payload);
}

export async function triggerBackendNotification() {
  const account = getCurrentBackendAccount();
  if (!account) throw new Error("No wallet account is available.");
  if (isDemoMode()) throw new Error("Notifications are local in demo mode.");

  const response = await api.triggerWalletNotification({
    walletAppId: "phantom",
    accountId: account.id,
  });

  applyPayload(response.payload);
  return response;
}
