import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { RpWalletApiClient } from "@rp-wallet/api-client";
import type { CreateWalletTransactionRequest, UpdateWalletStateRequest, WalletAccount, WalletBootstrapPayload, WalletMutationType, WalletNotificationSettings, WalletTransaction } from "@rp-wallet/types";
import { applyDemoRestrictions, isDemoPayload, requestDemoPaywall, writeCachedBootstrap } from "@rp-wallet/wallet-core";
import { useTrustLivePrices } from "@/hooks/useTrustLivePrices";
import { formatTrustCurrency, getStaticTrustPrices, getTrustToken, TRUST_TOKENS, type TrustLivePrices } from "@/lib/trust-token-data";

const BASE_CURRENCY_KEY = "trust_base_currency";
const CG_API_KEY = "trust_coingecko_api_key";

export const DEFAULT_TRUST_NOTIFICATION_SETTINGS: WalletNotificationSettings = {
  pushEnabled: false,
  coins: [
    { symbol: "BTC", enabled: true, min: 0.001, max: 0.1 },
    { symbol: "ETH", enabled: true, min: 0.01, max: 1 },
    { symbol: "USDT", enabled: true, min: 1, max: 100 },
    { symbol: "LTC", enabled: true, min: 0.01, max: 1 },
  ],
  mode: "Random",
  frequency: 30,
  unit: "sec",
  initialDelay: 0,
  isActive: false,
  totalTimes: 0,
  remainingTimes: 0,
  senderAddress: "",
};

export interface TrustSettingsInput {
  balances: Record<string, string>;
  coingeckoApiKey: string;
  currency: string;
  walletAddress: string;
  walletName: string;
}

export interface TrustTransactionInput {
  amount: string;
  createdAt?: string;
  fromAddress?: string;
  toAddress?: string;
  tokenSymbol: string;
  type: WalletMutationType;
}

interface TrustWalletContextValue {
  account: WalletAccount | null;
  balanceMap: Record<string, number>;
  baseCurrency: string;
  coingeckoApiKey: string;
  payload: WalletBootstrapPayload;
  notificationSettings: WalletNotificationSettings;
  priceError: string | null;
  prices: TrustLivePrices;
  priceLoading: boolean;
  createTransaction: (input: TrustTransactionInput) => Promise<WalletTransaction | null>;
  refetchPrices: () => Promise<void>;
  saveError: string;
  saveNotificationSettings: (settings: WalletNotificationSettings) => Promise<boolean>;
  savingSettings: boolean;
  saveSettings: (input: TrustSettingsInput) => Promise<boolean>;
  settingsInitialValues: TrustSettingsInput;
  tokenSymbols: string[];
  totalChange: { dollar: number; percent: number };
  totalValue: number;
  transactionError: string;
  transactionPending: boolean;
  walletAddress: string;
  walletName: string;
  demoMode: boolean;
}

const TrustWalletContext = createContext<TrustWalletContextValue | null>(null);

function readPreference(key: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  return window.localStorage.getItem(key) || fallback;
}

function writePreference(key: string, value: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, value);
}

function parseAmount(value: string | number | undefined) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : 0;
}

function formatAmount(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(8).replace(/0+$/, "").replace(/\.$/, "");
}

function getAccount(payload: WalletBootstrapPayload) {
  return payload.accounts[0] || null;
}

function getPayloadBalanceMap(payload: WalletBootstrapPayload) {
  const account = getAccount(payload);
  const balances = account ? payload.balances.filter((balance) => balance.accountId === account.id) : payload.balances;
  return Object.fromEntries(balances.map((balance) => [balance.tokenSymbol.toUpperCase(), parseAmount(balance.amount)]));
}

function buildLocalPayload(payload: WalletBootstrapPayload, input: TrustSettingsInput): WalletBootstrapPayload {
  const account = getAccount(payload);
  const now = new Date().toISOString();
  const existingBySymbol = new Map(payload.balances.map((balance) => [balance.tokenSymbol.toUpperCase(), balance]));
  const nextBalances = Object.entries(input.balances)
    .filter(([, value]) => value.trim() !== "")
    .map(([symbol, value]) => ({
      accountId: account?.id || payload.accounts[0]?.id || "trust-account",
      tokenSymbol: symbol.toUpperCase(),
      amount: String(parseAmount(value)),
      updatedAt: existingBySymbol.get(symbol.toUpperCase())?.updatedAt || now,
    }));

  return {
    ...payload,
    accounts: payload.accounts.map((entry, index) => index === 0 ? {
      ...entry,
      address: input.walletAddress.trim() || entry.address,
      name: input.walletName.trim() || entry.name,
    } : entry),
    balances: nextBalances,
    profile: {
      ...payload.profile,
      displayName: input.walletName.trim() || payload.profile.displayName,
      updatedAt: now,
    },
  };
}

function buildLocalTransactionPayload(payload: WalletBootstrapPayload, input: TrustTransactionInput) {
  const account = getAccount(payload);
  if (!account) throw new Error("No Tru5t account is available.");

  const amount = parseAmount(input.amount);
  if (amount <= 0) throw new Error("Enter a valid amount greater than zero.");

  const tokenSymbol = input.tokenSymbol.trim().toUpperCase();
  const createdAt = input.createdAt ? new Date(input.createdAt).toISOString() : new Date().toISOString();
  const balanceMap = getPayloadBalanceMap(payload);
  const currentBalance = balanceMap[tokenSymbol] || 0;
  const shouldDebit = input.type === "send" || input.type === "same_wallet_transfer" || input.type === "cross_wallet_transfer";
  const shouldCredit = input.type === "receive";
  const nextAmount = shouldDebit ? currentBalance - amount : shouldCredit ? currentBalance + amount : currentBalance;

  if (shouldDebit && nextAmount < -0.00000001) {
    throw new Error("Insufficient balance for this transfer.");
  }

  const existingBalance = payload.balances.find((balance) => balance.accountId === account.id && balance.tokenSymbol.toUpperCase() === tokenSymbol);
  const otherBalances = payload.balances.filter((balance) => !(balance.accountId === account.id && balance.tokenSymbol.toUpperCase() === tokenSymbol));
  const transaction: WalletTransaction = {
    id: `local-trust-tx-${Date.now()}`,
    walletAppId: "trust",
    accountId: account.id,
    type: input.type,
    status: "confirmed",
    tokenSymbol,
    amount: formatAmount(amount),
    fromAddress: input.fromAddress || (input.type === "receive" ? input.fromAddress : account.address),
    toAddress: input.toAddress || (input.type === "receive" ? account.address : input.toAddress),
    createdAt,
  };

  return {
    nextPayload: {
      ...payload,
      balances: [
        ...otherBalances,
        {
          accountId: account.id,
          tokenSymbol,
          amount: formatAmount(Math.max(0, nextAmount)),
          updatedAt: existingBalance?.updatedAt || createdAt,
        },
      ],
      recentTransactions: [transaction, ...payload.recentTransactions].slice(0, 50),
    },
    transaction,
  };
}

function withNotificationSettings(payload: WalletBootstrapPayload, settings: WalletNotificationSettings): WalletBootstrapPayload {
  return {
    ...payload,
    notificationSettings: settings,
  };
}

function computePortfolio(balanceMap: Record<string, number>, prices: TrustLivePrices) {
  let totalValue = 0;
  let previousValue = 0;

  for (const [symbol, balance] of Object.entries(balanceMap)) {
    const token = getTrustToken(symbol);
    const price = prices[symbol]?.usd ?? token.price;
    const change = prices[symbol]?.usd_24h_change ?? 0;
    const valueNow = balance * price;
    const priceBefore = change === -100 ? price : price / (1 + change / 100);

    totalValue += valueNow;
    previousValue += balance * priceBefore;
  }

  const dollar = totalValue - previousValue;
  const percent = previousValue > 0 ? (dollar / previousValue) * 100 : 0;
  return {
    totalChange: { dollar, percent },
    totalValue,
  };
}

export function TrustWalletProvider({
  api,
  children,
  initialPayload,
  onPayloadChange,
}: {
  api: RpWalletApiClient;
  children: React.ReactNode;
  initialPayload: WalletBootstrapPayload;
  onPayloadChange: (payload: WalletBootstrapPayload) => void;
}) {
  const [payload, setPayload] = useState(initialPayload);
  const [baseCurrency, setBaseCurrency] = useState(() => readPreference(BASE_CURRENCY_KEY, "USD").toUpperCase());
  const [coingeckoApiKey, setCoingeckoApiKey] = useState(() => readPreference(CG_API_KEY, ""));
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [transactionPending, setTransactionPending] = useState(false);
  const [transactionError, setTransactionError] = useState("");

  useEffect(() => {
    setPayload(applyDemoRestrictions("trust", initialPayload));
  }, [initialPayload]);
  const demoMode = isDemoPayload(payload);

  const account = useMemo(() => getAccount(payload), [payload]);
  const balanceMap = useMemo(() => getPayloadBalanceMap(payload), [payload]);
  const tokenSymbols = useMemo(
    () => Array.from(new Set([...TRUST_TOKENS.map((token) => token.symbol), ...Object.keys(balanceMap)])),
    [balanceMap],
  );
  const { error: priceError, isLoading: priceLoading, prices, refetch: refetchPrices } = useTrustLivePrices(tokenSymbols, coingeckoApiKey, baseCurrency);
  const portfolio = useMemo(() => computePortfolio(balanceMap, { ...getStaticTrustPrices(), ...prices }), [balanceMap, prices]);
  const notificationSettings = payload.notificationSettings || DEFAULT_TRUST_NOTIFICATION_SETTINGS;
  const walletName = payload.profile.displayName || account?.name || "RPWallet";
  const walletAddress = account?.address || "";

  const settingsInitialValues = useMemo<TrustSettingsInput>(() => {
    const balances = Object.fromEntries(tokenSymbols.map((symbol) => [symbol, balanceMap[symbol] ? String(balanceMap[symbol]) : ""]));
    return {
      balances,
      coingeckoApiKey,
      currency: baseCurrency,
      walletAddress,
      walletName,
    };
  }, [balanceMap, baseCurrency, coingeckoApiKey, tokenSymbols, walletAddress, walletName]);

  const applyPayload = useCallback((nextPayload: WalletBootstrapPayload) => {
    nextPayload = applyDemoRestrictions("trust", nextPayload);
    setPayload(nextPayload);
    writeCachedBootstrap("trust", nextPayload);
    onPayloadChange(nextPayload);
  }, [onPayloadChange]);

  const saveSettings = useCallback(async (input: TrustSettingsInput) => {
    const normalizedCurrency = (input.currency || "USD").toUpperCase();
    if (demoMode) {
      requestDemoPaywall("settings");
      return false;
    }
    writePreference(BASE_CURRENCY_KEY, normalizedCurrency);
    writePreference(CG_API_KEY, input.coingeckoApiKey.trim());
    setBaseCurrency(normalizedCurrency);
    setCoingeckoApiKey(input.coingeckoApiKey.trim());
    setSaveError("");
    setSavingSettings(true);

    const localPayload = buildLocalPayload(payload, input);

    try {
      if (!account) throw new Error("No Tru5t account is available.");

      const body: UpdateWalletStateRequest = {
        accountId: account.id,
        accountAddress: input.walletAddress.trim() || account.address,
        accountName: input.walletName.trim() || account.name,
        balances: Object.entries(input.balances)
          .filter(([, value]) => value.trim() !== "")
          .map(([tokenSymbol, amount]) => ({ tokenSymbol, amount: String(parseAmount(amount)) })),
        profile: {
          displayName: input.walletName.trim() || walletName,
          username: payload.profile.username || undefined,
        },
        walletAppId: "trust",
      };

      if (import.meta.env.DEV && payload.license.id === "dev-license") {
        applyPayload(localPayload);
        return true;
      }

      const nextPayload = await api.updateWalletState(body);
      applyPayload(nextPayload);
      return true;
    } catch (error) {
      if (import.meta.env.DEV && payload.license.id === "dev-license") {
        applyPayload(localPayload);
        return true;
      }
      setSaveError(error instanceof Error ? error.message : "Unable to save settings.");
      return false;
    } finally {
      setSavingSettings(false);
    }
  }, [account, api, applyPayload, demoMode, payload, walletName]);

  const createTransaction = useCallback(async (input: TrustTransactionInput) => {
    setTransactionError("");
    setTransactionPending(true);

    try {
      if (!account) throw new Error("No Tru5t account is available.");

      const request: CreateWalletTransactionRequest = {
        walletAppId: "trust",
        accountId: account.id,
        type: input.type,
        tokenSymbol: input.tokenSymbol.trim().toUpperCase(),
        amount: String(parseAmount(input.amount)),
        createdAt: input.createdAt,
        fromAddress: input.fromAddress || (input.type === "receive" ? undefined : account.address),
        toAddress: input.toAddress || (input.type === "receive" ? account.address : undefined),
        source: "user",
      };

      if (import.meta.env.DEV && payload.license.id === "dev-license") {
        const { nextPayload, transaction } = buildLocalTransactionPayload(payload, input);
        applyPayload(nextPayload);
        return transaction;
      }

      const response = await api.createWalletTransaction(request);
      applyPayload(response.payload);
      return response.transaction;
    } catch (error) {
      if (import.meta.env.DEV && payload.license.id === "dev-license") {
        try {
          const { nextPayload, transaction } = buildLocalTransactionPayload(payload, input);
          applyPayload(nextPayload);
          return transaction;
        } catch (fallbackError) {
          setTransactionError(fallbackError instanceof Error ? fallbackError.message : "Unable to create transaction.");
          return null;
        }
      }
      setTransactionError(error instanceof Error ? error.message : "Unable to create transaction.");
      return null;
    } finally {
      setTransactionPending(false);
    }
  }, [account, api, applyPayload, demoMode, payload]);

  const saveNotificationSettings = useCallback(async (settings: WalletNotificationSettings) => {
    setSaveError("");

    try {
      if (!account) throw new Error("No Tru5t account is available.");

      const localPayload = withNotificationSettings(payload, settings);
      if (demoMode) {
        requestDemoPaywall("notifications");
        return false;
      }
      if (import.meta.env.DEV && payload.license.id === "dev-license") {
        applyPayload(localPayload);
        return true;
      }

      const nextPayload = await api.updateWalletNotificationSettings({
        accountId: account.id,
        settings,
        walletAppId: "trust",
      });
      applyPayload(nextPayload);
      return true;
    } catch (error) {
      if (import.meta.env.DEV && payload.license.id === "dev-license") {
        applyPayload(withNotificationSettings(payload, settings));
        return true;
      }
      setSaveError(error instanceof Error ? error.message : "Unable to save notification settings.");
      return false;
    }
  }, [account, api, applyPayload, demoMode, payload]);

  const value = useMemo<TrustWalletContextValue>(() => ({
    account,
    balanceMap,
    baseCurrency,
    coingeckoApiKey,
    notificationSettings,
    payload,
    priceError,
    priceLoading,
    prices,
    createTransaction,
    refetchPrices,
    saveError,
    saveNotificationSettings,
    saveSettings,
    savingSettings,
    settingsInitialValues,
    tokenSymbols,
    totalChange: portfolio.totalChange,
    totalValue: portfolio.totalValue,
    transactionError,
    transactionPending,
    walletAddress,
    walletName,
    demoMode,
  }), [account, balanceMap, baseCurrency, coingeckoApiKey, createTransaction, demoMode, notificationSettings, payload, priceError, priceLoading, portfolio, prices, refetchPrices, saveError, saveNotificationSettings, saveSettings, savingSettings, settingsInitialValues, tokenSymbols, transactionError, transactionPending, walletAddress, walletName]);

  return <TrustWalletContext.Provider value={value}>{children}</TrustWalletContext.Provider>;
}

export function useTrustWallet() {
  const value = useContext(TrustWalletContext);
  if (!value) throw new Error("TrustWalletProvider is missing.");
  return value;
}

export { formatTrustCurrency };
