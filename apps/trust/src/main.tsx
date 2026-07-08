import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { AnimatePresence, motion } from "framer-motion";
import SplashScreen from "./splash-screen";
import {
  Activity,
  ArrowDownToLine,
  ArrowRightLeft,
  ChevronRight,
  Clock3,
  Compass,
  Copy,
  Eye,
  Gamepad2,
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
  X,
} from "lucide-react";
import { RouterProvider } from "./shims/router-context";
import WalletShell from "./wallet-shell";
import { DEFAULT_TRUST_NOTIFICATION_SETTINGS, TrustWalletProvider } from "@/lib/trust-wallet-context";
import { requestNotificationPermission, showSystemNotification } from "@/lib/notifications";
import { isRpWalletApiClientError, RP_WALLET_UNAUTHORIZED_EVENT, RpWalletApiClient } from "@rp-wallet/api-client";
import type { CreateWalletTransactionRequest, WalletBootstrapPayload, WalletEvent, WalletMutationType, WalletNotificationSettings, WalletTransaction } from "@rp-wallet/types";
import {
  clearCachedBootstrap,
  clearPendingToken,
  addDemoPaywallListener,
  applyDemoRestrictions,
  canUseCachedBootstrap,
  getPlatformDeviceId,
  isDemoExpired,
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
const EXPIRED_ACCESS_MESSAGE = "This wallet session has ended. Open the hub to renew your access or launch the wallet with an active license.";

function clearTrustLocalSession() {
  clearCachedBootstrap("trust");
  clearPendingToken("trust");
}

function maxIsoDate(left: string, right: string) {
  return Date.parse(right) > Date.parse(left) ? right : left;
}

function truncateAddress(value = "") {
  if (!value) return "Unknown";
  if (value.length <= 14) return value;
  return `${value.slice(0, 6)}...${value.slice(-5)}`;
}

function formatNotificationAmount(value = "") {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return value;
  if (Number.isInteger(numeric)) return String(numeric);
  return numeric.toFixed(8).replace(/0+$/, "").replace(/\.$/, "");
}

function getTrustNotificationSettings(payload: WalletBootstrapPayload): WalletNotificationSettings {
  return payload.notificationSettings || DEFAULT_TRUST_NOTIFICATION_SETTINGS;
}

async function showTrustReceiveNotification(event: WalletEvent, payload: WalletBootstrapPayload) {
  const transaction = event.transactionId
    ? payload.recentTransactions.find((entry) => entry.id === event.transactionId)
    : undefined;

  const amount = formatNotificationAmount(transaction?.amount || "");
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
      console.warn("Tru5t service worker registration failed", registrationError);
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

function readInitialTrustPayload() {
  const cached = readCachedBootstrap("trust");
  if (import.meta.env.DEV) {
    return cached || createDevTrustPayload();
  }
  return cached && canUseCachedBootstrap(cached) ? applyDemoRestrictions("trust", cached) : null;
}

function TrustApp() {
  const api = useMemo(() => new RpWalletApiClient(appEnv.apiBaseUrl), []);
  const initialPayload = useMemo(readInitialTrustPayload, []);
  const [payload, setPayload] = useState<WalletBootstrapPayload | null>(initialPayload);
  const [loading, setLoading] = useState(!initialPayload);
  const [showSplash, setShowSplash] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState("");
  const [installReady, setInstallReady] = useState(Boolean(initialPayload));
  const [now, setNow] = useState(() => Date.now());
  const [activeDemoPaywallOpen, setActiveDemoPaywallOpen] = useState(false);
  const payloadRef = React.useRef(payload);

  useEffect(() => {
    payloadRef.current = payload;
  }, [payload]);

  // Always show the splash briefly on mount, even on a fast cached open, then reveal
  // the wallet. The startup license check still runs independently (non-blocking).
  useEffect(() => {
    const timer = window.setTimeout(() => setShowSplash(false), 500);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      if (payloadRef.current?.access?.kind === "demo") return;
      clearTrustLocalSession();
      setPayload(null);
      setInstallReady(false);
      setError(EXPIRED_ACCESS_MESSAGE);
      setLoading(false);
    };

    window.addEventListener(RP_WALLET_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(RP_WALLET_UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  useEffect(() => {
    if (payload?.access?.kind !== "demo") return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [payload?.access?.kind]);

  useEffect(() => addDemoPaywallListener(() => setActiveDemoPaywallOpen(true)), []);

  const exchangeTrustToken = useCallback(
    async (token: string, deviceId = getPlatformDeviceId()) => {
      const response = await api.exchangeWalletBootstrap({
        token,
        deviceId,
      });
      const nextPayload = applyDemoRestrictions("trust", response);
      writeCachedBootstrap("trust", nextPayload);
      clearPendingToken("trust");
      setPayload(nextPayload);
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
    const cached = readCachedBootstrap("trust");
    if (!pendingToken && cached?.access?.kind === "demo") {
      const nextPayload = applyDemoRestrictions("trust", cached);
      writeCachedBootstrap("trust", nextPayload);
      setPayload(nextPayload);
      setInstallReady(true);
      setError("");
      setLoading(false);
      return;
    }

    if (import.meta.env.DEV && !pendingToken) {
      const cached = readCachedBootstrap("trust");
      setPayload(cached || createDevTrustPayload());
      setInstallReady(true);
      setError("");
      setLoading(false);
      return;
    }

    const shouldBlockOnStartupCheck = !payloadRef.current;
    setLoading(shouldBlockOnStartupCheck);
    const loadWallet = pendingToken
      ? exchangeTrustToken(pendingToken, launchDeviceId || getPlatformDeviceId())
      : api.getWalletState("trust").then((response) => {
        const nextPayload = applyDemoRestrictions("trust", response);
        writeCachedBootstrap("trust", nextPayload);
        setPayload(nextPayload);
        setInstallReady(true);
        setError("");
      });

    loadWallet
      .catch((loadError) => {
        if (isRpWalletApiClientError(loadError)) {
          clearTrustLocalSession();
          setPayload(null);
          setInstallReady(false);
          setError(
            pendingToken
              ? getFriendlyBootstrapError(loadError, "This launch token has expired. Open the app again from the hub.")
              : EXPIRED_ACCESS_MESSAGE,
          );
          return;
        }

        const cached = readCachedBootstrap("trust");
        if (cached && canUseCachedBootstrap(cached)) {
          setPayload(applyDemoRestrictions("trust", cached));
          setInstallReady(true);
        } else if (pendingToken) {
          setError(getFriendlyBootstrapError(loadError, "This launch token has expired. Open the app again from the hub."));
        } else {
          setError(EXPIRED_ACCESS_MESSAGE);
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
            tone="This RPWallet app is currently disabled. Check the hub for the wallets available on your license."
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
        ) : payload && isDemoExpired(payload, now) ? (
          <DemoPaywall walletName="Tru5t" locked />
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
            body={error || "Launch the app from the RPWallet hub to attach a session to this installed app."}
            onErrorChange={setError}
            onExchangeToken={exchangeTrustToken}
          />
        ) : null}
      </div>

      <AnimatePresence>
        {(loading || showSplash) && <SplashScreen />}
        {payload?.access?.kind === "demo" && !isDemoExpired(payload, now) && activeDemoPaywallOpen && (
          <DemoPaywall walletName="Tru5t" onClose={() => setActiveDemoPaywallOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

function DemoPaywall({ locked = false, onClose, walletName }: { locked?: boolean; onClose?: () => void; walletName: string }) {
  const hubUrl = appEnv.hubUrl.replace(/\/+$/, "");
  const purchaseUrl = `${hubUrl}/buy`;

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[#050806] text-white">
      {/* Background glow effects */}
      <div className="absolute top-0 inset-x-0 h-[40vh] bg-gradient-to-b from-[#48FF91]/15 to-transparent pointer-events-none" />
      <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[50vh] bg-[#48FF91]/10 blur-[100px] rounded-full pointer-events-none" />

      <section className="relative flex flex-col items-center pt-[calc(40px+env(safe-area-inset-top))] pb-4 px-5 z-10">
        {!locked && <button
          aria-label="Close"
          className="absolute right-5 top-[calc(16px+env(safe-area-inset-top))] flex size-8 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-all backdrop-blur-md"
          onClick={onClose}
          type="button"
        >
          <X size={18} strokeWidth={2.5} />
        </button>}

        <div className="flex flex-col items-center text-center gap-1.5 relative">
          <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-[#48FF91]/15 border border-[#48FF91]/30 text-[#48FF91] text-[10px] font-extrabold tracking-widest uppercase mb-1 shadow-[0_0_20px_rgba(72,255,145,0.15)]">
            Premium Access
          </div>
          <h1 className="text-[20px] font-extrabold tracking-tight text-white leading-[1.1] drop-shadow-lg">
            Unlock <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#48FF91] to-[#12C868]">RPWallet</span>
          </h1>
          <p className="text-[14px] text-white/50 font-medium max-w-[260px] mt-1.5 leading-relaxed">
            Get unrestricted access to all features and wallet apps.
          </p>
        </div>
      </section>

      <section className="flex flex-1 flex-col px-5 pb-[calc(16px+env(safe-area-inset-bottom))] relative z-10">
        <div className="mt-2 rounded-[24px] bg-[#102016]/60 border border-[#48FF91]/10 backdrop-blur-3xl p-4 shadow-2xl relative overflow-hidden">
          {/* Subtle inner glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#48FF91]/10 blur-3xl" />
          <PaywallFeature icon={<Eye size={20} />} title="Full Wallet Editing" body="Customize balances, profiles, addresses, and tokens without a timer." />
          <div className="w-full h-px bg-gradient-to-r from-transparent via-[#48FF91]/10 to-transparent my-1" />
          <PaywallFeature icon={<Send size={20} />} title="Transfer Simulator" body="Keep simulated sends, receives, notifications, and activity history unlocked." />
          <div className="w-full h-px bg-gradient-to-r from-transparent via-[#48FF91]/10 to-transparent my-1" />
          <PaywallFeature icon={<Gamepad2 size={20} />} title="All Wallet Apps" body="Use every supported RPWallet app from the same active license." />
        </div>

        <div className="mt-auto pt-6">
          <a
            className="flex h-[52px] w-full items-center justify-center rounded-[1rem] bg-gradient-to-r from-[#48FF91] to-[#12C868] text-[16px] font-bold text-[#050806] shadow-[0_10px_30px_rgba(72,255,145,0.25)] transition-transform active:scale-[0.98]"
            href={purchaseUrl}
          >
            Upgrade Now
          </a>
          <p className="mt-3 text-center text-[12px] font-medium text-white/40 px-2 leading-snug">
            {locked ? "Demo ended. Choose a plan on RPWallet to continue." : "This feature is locked in demo mode. Upgrade when you are ready."}
          </p>
          <div className="mt-5 flex items-center justify-center gap-5 text-[11px] font-semibold text-white/30">
            <a href={`${hubUrl}/privacy`} className="hover:text-white/60 transition-colors">Privacy Policy</a>
            <div className="size-1 rounded-full bg-white/10" />
            <a href={hubUrl} className="hover:text-white/60 transition-colors">Restore</a>
            <div className="size-1 rounded-full bg-white/10" />
            <a href={`${hubUrl}/terms`} className="hover:text-white/60 transition-colors">Terms of Service</a>
          </div>
        </div>
      </section>
    </main>
  );
}

function PaywallFeature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex gap-3 py-2.5 first:pt-1 last:pb-1 relative z-10">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#48FF91]/20 to-[#12C868]/10 border border-[#48FF91]/20 text-[#48FF91] shadow-[inset_0_0_20px_rgba(72,255,145,0.1)]">{icon}</div>
      <div className="flex flex-col justify-center">
        <h2 className="text-[15px] font-bold leading-tight text-white">{title}</h2>
        <p className="mt-0.5 text-[12px] font-medium leading-relaxed text-white/50 pr-2">{body}</p>
      </div>
    </div>
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
        console.warn("Unable to persist Tru5t notification permission preference", error);
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
      console.warn("Unable to request Tru5t notification permission", error);
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
        console.warn("Unable to poll Tru5t wallet events", error);
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
                Get notified when incoming Tru5t transfers arrive.
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[100000000] flex items-center justify-center"
      style={{ backgroundColor: "#0a0a0a" }}
    >
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
  const buyUrl = `${appEnv.hubUrl.replace(/\/+$/, "")}/buy`;

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

        <a className="submitButton" href={buyUrl}>
          Renew Access
        </a>

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
      email: "dev@rpwallet.local",
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
      name: "Tru5t",
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
