import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { RpWalletApiClient } from "@rp-wallet/api-client";
import type { UpdateWalletStateRequest, WalletAccount, WalletBootstrapPayload } from "@rp-wallet/types";
import { writeCachedBootstrap } from "@rp-wallet/wallet-core";
import { useTrustLivePrices } from "@/hooks/useTrustLivePrices";
import { formatTrustCurrency, getStaticTrustPrices, getTrustToken, TRUST_TOKENS, type TrustLivePrices } from "@/lib/trust-token-data";

const BASE_CURRENCY_KEY = "trust_base_currency";
const CG_API_KEY = "trust_coingecko_api_key";

export interface TrustSettingsInput {
  balances: Record<string, string>;
  coingeckoApiKey: string;
  currency: string;
  walletName: string;
}

interface TrustWalletContextValue {
  account: WalletAccount | null;
  balanceMap: Record<string, number>;
  baseCurrency: string;
  coingeckoApiKey: string;
  payload: WalletBootstrapPayload;
  priceError: string | null;
  prices: TrustLivePrices;
  priceLoading: boolean;
  refetchPrices: () => Promise<void>;
  saveError: string;
  savingSettings: boolean;
  saveSettings: (input: TrustSettingsInput) => Promise<boolean>;
  settingsInitialValues: TrustSettingsInput;
  tokenSymbols: string[];
  totalChange: { dollar: number; percent: number };
  totalValue: number;
  walletName: string;
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
    accounts: payload.accounts.map((entry, index) => index === 0 ? { ...entry, name: input.walletName.trim() || entry.name } : entry),
    balances: nextBalances,
    profile: {
      ...payload.profile,
      displayName: input.walletName.trim() || payload.profile.displayName,
      updatedAt: now,
    },
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

  useEffect(() => {
    setPayload(initialPayload);
  }, [initialPayload]);

  const account = useMemo(() => getAccount(payload), [payload]);
  const balanceMap = useMemo(() => getPayloadBalanceMap(payload), [payload]);
  const tokenSymbols = useMemo(
    () => Array.from(new Set([...TRUST_TOKENS.map((token) => token.symbol), ...Object.keys(balanceMap)])),
    [balanceMap],
  );
  const { error: priceError, isLoading: priceLoading, prices, refetch: refetchPrices } = useTrustLivePrices(tokenSymbols, coingeckoApiKey, baseCurrency);
  const portfolio = useMemo(() => computePortfolio(balanceMap, { ...getStaticTrustPrices(), ...prices }), [balanceMap, prices]);
  const walletName = payload.profile.displayName || account?.name || "Larpz Wallet";

  const settingsInitialValues = useMemo<TrustSettingsInput>(() => {
    const balances = Object.fromEntries(tokenSymbols.map((symbol) => [symbol, balanceMap[symbol] ? String(balanceMap[symbol]) : ""]));
    return {
      balances,
      coingeckoApiKey,
      currency: baseCurrency,
      walletName,
    };
  }, [balanceMap, baseCurrency, coingeckoApiKey, tokenSymbols, walletName]);

  const applyPayload = useCallback((nextPayload: WalletBootstrapPayload) => {
    setPayload(nextPayload);
    writeCachedBootstrap("trust", nextPayload);
    onPayloadChange(nextPayload);
  }, [onPayloadChange]);

  const saveSettings = useCallback(async (input: TrustSettingsInput) => {
    const normalizedCurrency = (input.currency || "USD").toUpperCase();
    writePreference(BASE_CURRENCY_KEY, normalizedCurrency);
    writePreference(CG_API_KEY, input.coingeckoApiKey.trim());
    setBaseCurrency(normalizedCurrency);
    setCoingeckoApiKey(input.coingeckoApiKey.trim());
    setSaveError("");
    setSavingSettings(true);

    const localPayload = buildLocalPayload(payload, input);

    try {
      if (!account) throw new Error("No Trust account is available.");

      const body: UpdateWalletStateRequest = {
        accountId: account.id,
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
  }, [account, api, applyPayload, payload, walletName]);

  const value = useMemo<TrustWalletContextValue>(() => ({
    account,
    balanceMap,
    baseCurrency,
    coingeckoApiKey,
    payload,
    priceError,
    priceLoading,
    prices,
    refetchPrices,
    saveError,
    saveSettings,
    savingSettings,
    settingsInitialValues,
    tokenSymbols,
    totalChange: portfolio.totalChange,
    totalValue: portfolio.totalValue,
    walletName,
  }), [account, balanceMap, baseCurrency, coingeckoApiKey, payload, priceError, priceLoading, portfolio, prices, refetchPrices, saveError, saveSettings, savingSettings, settingsInitialValues, tokenSymbols, walletName]);

  return <TrustWalletContext.Provider value={value}>{children}</TrustWalletContext.Provider>;
}

export function useTrustWallet() {
  const value = useContext(TrustWalletContext);
  if (!value) throw new Error("TrustWalletProvider is missing.");
  return value;
}

export { formatTrustCurrency };
