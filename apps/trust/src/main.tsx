import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { AnimatePresence, motion } from "framer-motion";
import SplashScreen from "./splash-screen";
import {
  Activity,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRightLeft,
  ChevronRight,
  Clock3,
  Compass,
  Copy,
  Home,
  Infinity as InfinityIcon,
  MoreHorizontal,
  Plus,
  Repeat2,
  ScanLine,
  Search,
  Send,
  Settings,
  TrendingUp,
} from "lucide-react";
import { RouterProvider } from "./shims/router-context";
import WalletShell from "./wallet-shell";
import { DEFAULT_TRUST_NOTIFICATION_SETTINGS, TrustWalletProvider } from "@/lib/trust-wallet-context";
import { requestNotificationPermission, showSystemNotification } from "@/lib/notifications";
import { RpWalletApiClient } from "@rp-wallet/api-client";
import type { CreateWalletTransactionRequest, WalletBootstrapPayload, WalletEvent, WalletMutationType, WalletNotificationSettings, WalletTransaction } from "@rp-wallet/types";
import {
  clearPendingToken,
  getPlatformDeviceId,
  isIOS,
  isStandalonePwa,
  readCachedBootstrap,
  readPendingToken,
  writeCachedBootstrap,
  writePendingToken,
} from "@rp-wallet/wallet-core";
import { appEnv } from "./app-env";
import "../../phantom/src/styles.css";
import "./styles.css";

const NOTIFICATION_PERMISSION_PROMPT_KEY = "rp-wallet:trust:notification-permission-prompted";

function maxIsoDate(left: string, right: string) {
  return Date.parse(right) > Date.parse(left) ? right : left;
}

function truncateAddress(value = "") {
  if (!value) return "Unknown";
  if (value.length <= 14) return value;
  return `${value.slice(0, 6)}...${value.slice(-5)}`;
}

function getTrustNotificationSettings(payload: WalletBootstrapPayload): WalletNotificationSettings {
  return payload.notificationSettings || DEFAULT_TRUST_NOTIFICATION_SETTINGS;
}

async function showTrustReceiveNotification(event: WalletEvent, payload: WalletBootstrapPayload) {
  const transaction = event.transactionId
    ? payload.recentTransactions.find((entry) => entry.id === event.transactionId)
    : undefined;

  const amount = transaction?.amount || "";
  const symbol = transaction?.tokenSymbol || "";
  const title = amount && symbol ? `💰 Received: ${amount} ${symbol}` : `💰 ${event.title || "Received"}`;
  const body = transaction?.fromAddress
    ? `From ${truncateAddress(transaction.fromAddress)}`
    : event.body || "Received funds";

  await showSystemNotification(title, body);
}

function registerTrustServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  if (import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });
    if ("caches" in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => caches.delete(key));
      });
    }
    return;
  }

  const register = () => {
    navigator.serviceWorker.register("/sw.js").catch((registrationError) => {
      console.warn("Trust service worker registration failed", registrationError);
    });
  };

  if (document.readyState === "complete") {
    register();
  } else {
    window.addEventListener("load", register, { once: true });
  }
}

function getSafeTokenClearedPath() {
  const pathname = window.location.pathname.replace(/^\/+/, "/") || "/";
  return `${pathname}${window.location.hash}`;
}

function TrustApp() {
  const api = useMemo(() => new RpWalletApiClient(appEnv.apiBaseUrl), []);
  const [payload, setPayload] = useState<WalletBootstrapPayload | null>(() => readCachedBootstrap("trust"));
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState("");
  const [installReady, setInstallReady] = useState(false);

  const exchangeTrustToken = useCallback(
    async (token: string, deviceId = getPlatformDeviceId()) => {
      const response = await api.exchangeWalletBootstrap({
        token,
        deviceId,
      });
      writeCachedBootstrap("trust", response);
      clearPendingToken("trust");
      setPayload(response);
      setInstallReady(true);
      setError("");
    },
    [api],
  );

  useEffect(() => {
    if (!appEnv.walletAppEnabled) {
      setLoading(false);
      return;
    }

    const token = new URL(window.location.href).searchParams.get("token");
    const launchDeviceId = new URL(window.location.href).searchParams.get("deviceId");
    if (token) {
      writePendingToken("trust", token);
      window.history.replaceState({}, "", getSafeTokenClearedPath());
    }

    const pendingToken = readPendingToken("trust");

    if (import.meta.env.DEV && !pendingToken) {
      const cached = readCachedBootstrap("trust");
      setPayload(cached || createDevTrustPayload());
      setInstallReady(true);
      setError("");
      setLoading(false);
      return;
    }

    setLoading(true);
    const loadWallet = pendingToken
      ? exchangeTrustToken(pendingToken, launchDeviceId || getPlatformDeviceId())
      : api.getWalletState("trust").then((response) => {
        writeCachedBootstrap("trust", response);
        setPayload(response);
        setInstallReady(true);
        setError("");
      });

    loadWallet
      .catch((loadError) => {
        const cached = readCachedBootstrap("trust");
        if (cached) {
          setPayload(cached);
          setInstallReady(true);
        } else if (pendingToken) {
          setError(getFriendlyBootstrapError(loadError, "This launch token has expired. Open the app again from the hub."));
        } else {
          setError("Reconnect through the hub to refresh this wallet session.");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [api, exchangeTrustToken]);

  const requiresStandalone = !import.meta.env.DEV;
  const standalone = isStandalonePwa();

  return (
    <>
      <div className="trustViewport absolute inset-0 h-screen flex w-full flex-col overflow-hidden">
        {!appEnv.walletAppEnabled ? (
          <InstallGate
            heading="This wallet is not available yet"
            tone="This LarperWallet app is currently disabled. Check the hub for the wallets available on your license."
          />
        ) : requiresStandalone && !standalone ? (
          <InstallGate
            heading={installReady ? "Open the app from your home screen" : "Install the app on your device"}
            tone={
              installReady
                ? "Your wallet session is ready. Add this app to your home screen, then open it there to continue."
                : "Your launch is waiting. Add this app to your home screen, then open it from there to finish setup."
            }
          />
        ) : payload ? (
          <BootstrappedWallet
            api={api}
            mutating={mutating}
            onMutatingChange={setMutating}
            onPayloadChange={setPayload}
            onErrorChange={setError}
            payload={payload}
          />
        ) : !loading ? (
          <DevTokenPanel
            body={error || "Launch the app from the LarperWallet hub to attach a session to this installed app."}
            onErrorChange={setError}
            onExchangeToken={exchangeTrustToken}
          />
        ) : null}
      </div>

      <AnimatePresence>
        {loading && <SplashScreen />}
      </AnimatePresence>
    </>
  );
}

function BootstrappedWallet({
  api,
  onPayloadChange,
  payload,
}: {
  api: RpWalletApiClient;
  mutating: boolean;
  onMutatingChange: (value: boolean) => void;
  onPayloadChange: (value: WalletBootstrapPayload) => void;
  onErrorChange: (value: string) => void;
  payload: WalletBootstrapPayload;
}) {
  const [notificationPromptVisible, setNotificationPromptVisible] = useState(false);
  const payloadRef = React.useRef(payload);
  const notificationSettingsRef = React.useRef(getTrustNotificationSettings(payload));
  const walletEventCursorRef = React.useRef(new Date().toISOString());
  const seenWalletEventIdsRef = React.useRef(new Set<string>());

  useEffect(() => {
    payloadRef.current = payload;
    notificationSettingsRef.current = getTrustNotificationSettings(payload);
  }, [payload]);

  const applyPayload = useCallback((nextPayload: WalletBootstrapPayload) => {
    payloadRef.current = nextPayload;
    notificationSettingsRef.current = getTrustNotificationSettings(nextPayload);
    writeCachedBootstrap("trust", nextPayload);
    onPayloadChange(nextPayload);
  }, [onPayloadChange]);

  const persistNotificationSettings = useCallback(async (settings: WalletNotificationSettings) => {
    const currentPayload = payloadRef.current;
    const account = currentPayload.accounts[0];
    if (!account) return;

    const localPayload = {
      ...currentPayload,
      notificationSettings: settings,
    };

    if (import.meta.env.DEV && currentPayload.license.id === "dev-license") {
      applyPayload(localPayload);
      return;
    }

    const nextPayload = await api.updateWalletNotificationSettings({
      accountId: account.id,
      settings,
      walletAppId: "trust",
    });
    applyPayload(nextPayload);
  }, [api, applyPayload]);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const settings = notificationSettingsRef.current;
    if (window.Notification.permission === "granted" && !settings.pushEnabled) {
      persistNotificationSettings({ ...settings, pushEnabled: true }).catch((error) => {
        console.warn("Unable to persist Trust notification permission preference", error);
      });
      return;
    }

    if (window.Notification.permission !== "default") return;
    if (window.localStorage.getItem(NOTIFICATION_PERMISSION_PROMPT_KEY)) return;

    setNotificationPromptVisible(true);
  }, [persistNotificationSettings]);

  const enableNotifications = async () => {
    window.localStorage.setItem(NOTIFICATION_PERMISSION_PROMPT_KEY, "1");
    setNotificationPromptVisible(false);

    try {
      const granted = await requestNotificationPermission();
      if (!granted) return;

      await persistNotificationSettings({
        ...notificationSettingsRef.current,
        pushEnabled: true,
      });
    } catch (error) {
      console.warn("Unable to request Trust notification permission", error);
    }
  };

  const dismissNotificationPrompt = () => {
    window.localStorage.setItem(NOTIFICATION_PERMISSION_PROMPT_KEY, "1");
    setNotificationPromptVisible(false);
  };

  useEffect(() => {
    let cancelled = false;

    const pollWalletEvents = async () => {
      try {
        const events = await api.getWalletEvents("trust", walletEventCursorRef.current);
        if (cancelled || events.length === 0) return;

        const receiveEvents: WalletEvent[] = [];
        for (const event of events) {
          walletEventCursorRef.current = maxIsoDate(walletEventCursorRef.current, event.createdAt);
          if (seenWalletEventIdsRef.current.has(event.id)) continue;
          seenWalletEventIdsRef.current.add(event.id);
          if (event.type === "wallet_received") {
            receiveEvents.push(event);
          }
        }

        if (receiveEvents.length === 0) return;

        const nextPayload = await api.getWalletState("trust");
        if (cancelled) return;

        applyPayload(nextPayload);

        if (notificationSettingsRef.current.pushEnabled) {
          for (const event of receiveEvents) {
            await showTrustReceiveNotification(event, nextPayload);
          }
        }
      } catch (error) {
        console.warn("Unable to poll Trust wallet events", error);
      }
    };

    pollWalletEvents();
    const intervalId = window.setInterval(pollWalletEvents, 2500);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [api, applyPayload]);

  return (
    <RouterProvider>
      <TrustWalletProvider api={api} initialPayload={payload} onPayloadChange={onPayloadChange}>
        <WalletShell />
      </TrustWalletProvider>
      <AnimatePresence>
        {notificationPromptVisible && (
          <motion.div
            key="trust-notification-permission-prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100000] flex items-end justify-center bg-black/45 px-4 pb-[calc(18px+env(safe-area-inset-bottom))] backdrop-blur-[2px]"
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ type: "spring", damping: 30, stiffness: 380, mass: 0.8 }}
              className="w-full max-w-[360px] rounded-[28px] border border-white/10 bg-[#171717]/95 p-5 text-white shadow-[0_22px_70px_rgba(0,0,0,0.45)]"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#48FF91]/15 text-[#48FF91]">
                <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <h2 className="text-center text-[20px] font-semibold text-white">
                Enable notifications
              </h2>
              <p className="mx-auto mt-2 max-w-[280px] text-center text-[14px] leading-5 text-[#a7a7aa]">
                Get notified when incoming Trust Wallet transfers arrive.
              </p>
              <div className="mt-5 flex flex-col gap-2.5">
                <button
                  className="h-12 w-full rounded-2xl bg-[#48FF91] text-[16px] font-semibold text-black active:opacity-80"
                  onClick={enableNotifications}
                  type="button"
                >
                  Enable Notifications
                </button>
                <button
                  className="h-11 w-full rounded-2xl bg-white/[0.06] text-[15px] font-semibold text-white/75 active:bg-white/[0.1]"
                  onClick={dismissNotificationPrompt}
                  type="button"
                >
                  Not Now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </RouterProvider>
  );
}

function InstallGate({ heading, tone }: { heading: string; tone: string }) {
  const ios = isIOS();
  const steps = ios
    ? [
      "Tap the Share button in Safari",
      'Choose "Add to Home Screen"',
      'Tap "Add"',
      "Open the app from your home screen",
    ]
    : [
      "Open the browser menu",
      'Choose "Add to Home screen"',
      'Confirm with "Add"',
      "Open the app from your home screen",
    ];

  const hubUrl = (import.meta.env as any).VITE_HUB_URL || (typeof document !== 'undefined' && document.referrer ? document.referrer : "https://larperwallet.com");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[100000000] flex items-center justify-center"
      style={{ backgroundColor: "#0a0a0a" }}
    >
      <a
        href={hubUrl}
        className="absolute top-6 left-6 md:top-8 md:left-8 text-white/50 hover:text-white transition-colors flex items-center gap-2 text-[13px] font-medium z-50 bg-white/5 hover:bg-white/10 px-3.5 py-2 rounded-full backdrop-blur-sm"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
      >
        <ArrowLeft size={16} />
        Go Back
      </a>
      <div className="w-full max-w-[340px] px-6 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="text-white text-[25px] font-bold text-center tracking-tight mb-2"
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
        >
          {heading}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="text-[#8e8e93] text-[14px] leading-snug font-medium text-center mb-8"
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
        >
          {tone}
        </motion.div>

        <div className="w-full flex flex-col gap-4">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.15 + i * 0.07,
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex flex-row items-center gap-4 w-full"
            >
              <div
                className="flex items-center justify-center rounded-full font-bold text-white shrink-0"
                style={{
                  width: 32,
                  height: 32,
                  backgroundColor: "#47e18d",
                  fontSize: 14,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                }}
              >
                {i + 1}
              </div>

              <div
                className="flex-1 text-[#efefef] text-[15px] font-medium leading-snug"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                }}
              >
                {step}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="text-[#555557] text-[13px] font-medium text-center mt-10"
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
        >
          Your license key will be saved automatically.
        </motion.div>
      </div>
    </motion.div>
  );
}

function StatusPanel({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <main className="walletShell">
      <section className="balancePanel">
        <h1 className="statusTitle">{title}</h1>
        <p className="muted">{body}</p>
      </section>
    </main>
  );
}

function DevTokenPanel({
  body,
  onErrorChange,
  onExchangeToken,
}: {
  body: string;
  onErrorChange: (value: string) => void;
  onExchangeToken: (token: string, deviceId?: string) => Promise<void>;
}) {
  const [tokenInput, setTokenInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitToken(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const launch = extractLaunchToken(tokenInput);
    if (!launch.token) {
      onErrorChange("Paste a launch URL or token from the hub.");
      return;
    }

    setSubmitting(true);
    onErrorChange("");
    try {
      await onExchangeToken(launch.token, launch.deviceId || getPlatformDeviceId());
    } catch (exchangeError) {
      onErrorChange(getFriendlyBootstrapError(exchangeError, "That launch token could not be used. Open the app from the hub again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="walletShell">
      <section className="balancePanel">
        <h1 className="statusTitle">Open this from the hub</h1>
        <p className="muted">{body}</p>

        {import.meta.env.DEV ? (
          <form className="devTokenForm" onSubmit={submitToken}>
            <label className="field devTokenField">
              <span>Dev launch token</span>
              <input
                autoCapitalize="off"
                autoCorrect="off"
                onChange={(event) => setTokenInput(event.target.value)}
                placeholder="Paste token or launch URL"
                spellCheck={false}
                value={tokenInput}
              />
            </label>
            <button className="submitButton devTokenButton" disabled={submitting || !tokenInput.trim()} type="submit">
              {submitting ? "Connecting..." : "Connect PWA"}
            </button>
          </form>
        ) : null}
      </section>
    </main>
  );
}

function compactAddress(value?: string) {
  if (!value) return "Unavailable";
  return `${value.slice(0, 6)}...${value.slice(-6)}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

registerTrustServiceWorker();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TrustApp />
  </React.StrictMode>,
);

function getFriendlyBootstrapError(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback;
  if (error.message.includes("DEVICE_LIMIT_REACHED") || error.message.includes("already active on")) {
    return "This license has already reached its device limit.";
  }
  return fallback;
}

function extractLaunchToken(value: string): { token: string; deviceId?: string } {
  const trimmed = value.trim();
  if (!trimmed) return { token: "" };

  try {
    const url = new URL(trimmed);
    return {
      token: url.searchParams.get("token")?.trim() || trimmed,
      deviceId: url.searchParams.get("deviceId")?.trim() || undefined,
    };
  } catch {
    return { token: trimmed };
  }
}

function buildTrustTokenRows(payload: WalletBootstrapPayload) {
  const balanceMap = new Map(payload.balances.map((balance) => [balance.tokenSymbol.toUpperCase(), balance.amount]));
  const fallback = {
    BTC: "0.0002",
    LTC: "0.7729",
    SOL: "0.2217",
  } as const;

  return [
    { symbol: "LTC", name: "Litecoin", price: "$52.32", change: "+0.30%", amount: balanceMap.get("LTC") || fallback.LTC, value: "$40.44" },
    { symbol: "SOL", name: "Solana", price: "$82.61", change: "-0.00%", amount: balanceMap.get("SOL") || fallback.SOL, value: "$18.32" },
    { symbol: "BTC", name: "Bitcoin", price: "$73,831.29", change: "-0.07%", amount: balanceMap.get("BTC") || fallback.BTC, value: "$18.00" },
  ];
}

function createDevTrustPayload(): WalletBootstrapPayload {
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const accountId = "dev-trust-account-1";

  return {
    user: {
      id: "dev-user",
      email: "dev@larperwallet.local",
      createdAt: now,
    },
    license: {
      id: "dev-license",
      plan: "Dev",
      expiresAt,
      status: "active",
      allowedDevices: 99,
    },
    wallet: {
      id: "trust",
      name: "Trust Wallet",
      host: "localhost:5174",
      enabled: true,
      activated: true,
    },
    profile: {
      id: "dev-trust-profile",
      userId: "dev-user",
      walletAppId: "trust",
      displayName: "Main Wallet",
      username: "trust_dev",
      createdAt: now,
      updatedAt: now,
    },
    accounts: [
      {
        id: accountId,
        walletProfileId: "dev-trust-profile",
        name: "Account 1",
        address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        createdAt: now,
      },
    ],
    balances: [
      { accountId, tokenSymbol: "ETH", amount: "12.45", updatedAt: now },
      { accountId, tokenSymbol: "BTC", amount: "1.08", updatedAt: now },
      { accountId, tokenSymbol: "BNB", amount: "82.2", updatedAt: now },
      { accountId, tokenSymbol: "USDT", amount: "24850.00", updatedAt: now },
      { accountId, tokenSymbol: "SOL", amount: "930.5", updatedAt: now },
    ],
    recentTransactions: [
      {
        id: "dev-trust-tx-1",
        walletAppId: "trust",
        accountId,
        type: "receive",
        status: "confirmed",
        tokenSymbol: "USDT",
        amount: "2500.00",
        fromAddress: "0x91cA6F18C5D1c9b5b4E2c4cF1C5d1B2c9d9E8f10",
        toAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        createdAt: now,
      },
      {
        id: "dev-trust-tx-2",
        walletAppId: "trust",
        accountId,
        type: "send",
        status: "confirmed",
        tokenSymbol: "ETH",
        amount: "0.35",
        fromAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        toAddress: "0x28c6c06298d514db089934071355e5743bf21d60",
        createdAt: now,
      },
    ],
  };
}
