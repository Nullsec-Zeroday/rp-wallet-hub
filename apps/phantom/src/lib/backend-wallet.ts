import { RpWalletApiClient } from "@rp-wallet/api-client";
import type {
  CreateWalletTransactionResponse,
  CreateWalletTransactionRequest,
  UpdateWalletStateRequest,
  WalletBootstrapPayload,
  WalletNotificationSettings,
} from "@rp-wallet/types";
import { applyDemoRestrictions, writeCachedBootstrap } from "@rp-wallet/wallet-core";
import { appEnv } from "../app-env";
import { syncStoreFromPayload } from "./backend-sync";
import { logWalletDebug } from "./wallet-debug";
import { useWalletStore } from "./wallet-store";

const api = new RpWalletApiClient(appEnv.apiBaseUrl);

function applyPayload(payload: WalletBootstrapPayload, options: { preserveLocalNotificationSettings?: boolean; preferredAccountId?: string } = {}) {
  payload = applyDemoRestrictions("phantom", payload);
  const payloadToApply = options.preserveLocalNotificationSettings
    ? {
      ...payload,
      notificationSettings: useWalletStore.getState().notificationSettings,
    }
    : payload;

  writeCachedBootstrap("phantom", payloadToApply);
  syncStoreFromPayload(payloadToApply, options.preferredAccountId);
  return payloadToApply;
}

export function getCurrentBackendAccount() {
  return useWalletStore.getState().accounts[useWalletStore.getState().currentAccountIndex];
}

export async function createBackendWalletAccount(name?: string) {
  const existingIds = new Set(useWalletStore.getState().accounts.map((account) => account.id));
  const payload = await api.createWalletAccount({
    walletAppId: "phantom",
    name,
  });
  const createdAccount = payload.accounts.find((account) => !existingIds.has(account.id));

  return applyPayload(payload, {
    preferredAccountId: createdAccount?.id,
  });
}

export async function createBackendWalletTransaction(input: Omit<CreateWalletTransactionRequest, "walletAppId" | "accountId">) {
  const account = getCurrentBackendAccount();
  if (!account) throw new Error("No wallet account is available.");

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
  const payload = await api.deleteWalletTransaction("phantom", transactionId);
  return applyPayload(payload);
}

export async function clearBackendWalletTransactions() {
  const payload = await api.clearWalletTransactions("phantom");
  return applyPayload(payload);
}

export async function updateBackendWalletState(input: Omit<UpdateWalletStateRequest, "walletAppId" | "accountId">) {
  const account = getCurrentBackendAccount();
  if (!account) throw new Error("No wallet account is available.");

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

  const response = await api.triggerWalletNotification({
    walletAppId: "phantom",
    accountId: account.id,
  });

  applyPayload(response.payload);
  return response;
}
