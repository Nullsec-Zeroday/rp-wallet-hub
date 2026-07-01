import React from "react";
import { createRoot } from "react-dom/client";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Crown, Eye, Gamepad2, Send, ShoppingCart, X } from "lucide-react";
import { RP_WALLET_UNAUTHORIZED_EVENT, RpWalletApiClient } from "@rp-wallet/api-client";
import type { WalletBootstrapPayload } from "@rp-wallet/types";
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
import { StrictWalletApp } from "./strict-wallet";
import SplashScreen from "./splash-screen";
import { DEFAULT_NOTIFICATION_SETTINGS } from "./lib/wallet-store";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/inter/latin-800.css";
import "@ionic/react/css/core.css";
import "./styles.css";

const DEV_PWA_AUTH_BYPASS = import.meta.env.DEV;
const PHANTOM_PERSISTED_STORE_KEY = "phantom-wallet-storage";
const EXPIRED_ACCESS_MESSAGE = "This wallet session has ended. Open the hub to renew your access or launch the wallet with an active license.";
const DEV_PAYWALL_PREVIEW = import.meta.env.DEV && typeof window !== "undefined"
  ? new URLSearchParams(window.location.search).get("paywall")
  : null;
const PAYWALL_PLANS = [
  { id: "starter", label: "7 Days", price: "$14", detail: "1 active device", badge: undefined },
  { id: "popular", label: "1 Month", price: "$39", detail: "1 active device", badge: "Most Popular" },
  { id: "yearly", label: "1 Year", price: "$99", detail: "2 active devices", badge: "Best Value" },
] as const;

function registerPh4ntomServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const register = () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("Ph4ntom service worker registration failed", error);
    });
  };

  if (document.readyState === "complete") {
    register();
  } else {
    window.addEventListener("load", register, { once: true });
  }
}

function clearPh4ntomLocalSession() {
  clearCachedBootstrap("phantom");
  clearPendingToken("phantom");
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PHANTOM_PERSISTED_STORE_KEY);
}

function Ph4ntomApp() {
  const api = React.useMemo(() => new RpWalletApiClient(appEnv.apiBaseUrl), []);
  const [payload, setPayload] = React.useState<WalletBootstrapPayload | null>(() => {
    const cached = readCachedBootstrap("phantom");
    if (DEV_PWA_AUTH_BYPASS) {
      return cached?.license.id === "dev-license" ? cached : createDevPh4ntomPayload();
    }
    return cached && canUseCachedBootstrap(cached) ? applyDemoRestrictions("phantom", cached) : null;
  });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [installReady, setInstallReady] = React.useState(false);
  const [now, setNow] = React.useState(() => Date.now());
  const [activeDemoPaywallOpen, setActiveDemoPaywallOpen] = React.useState(false);
  const [devPaywallPreviewOpen, setDevPaywallPreviewOpen] = React.useState(Boolean(DEV_PAYWALL_PREVIEW));
  const payloadRef = React.useRef(payload);

  React.useEffect(() => {
    payloadRef.current = payload;
  }, [payload]);

  React.useEffect(() => {
    const handleUnauthorized = () => {
      if (payloadRef.current?.access?.kind === "demo") return;
      clearPh4ntomLocalSession();
      setPayload(null);
      setInstallReady(false);
      setError(EXPIRED_ACCESS_MESSAGE);
      setLoading(false);
    };

    window.addEventListener(RP_WALLET_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(RP_WALLET_UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  React.useEffect(() => {
    if (payload?.access?.kind !== "demo") return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [payload?.access?.kind]);

  React.useEffect(() => addDemoPaywallListener(() => setActiveDemoPaywallOpen(true)), []);

  React.useEffect(() => {
    if (!appEnv.walletAppEnabled) {
      setLoading(false);
      return;
    }

    if (DEV_PWA_AUTH_BYPASS) {
      const cached = readCachedBootstrap("phantom");
      const nextPayload = cached?.license.id === "dev-license" ? cached : createDevPh4ntomPayload();
      writeCachedBootstrap("phantom", nextPayload);
      setPayload(nextPayload);
      setInstallReady(true);
      setError("");
      setLoading(false);
      return;
    }

    const token = new URL(window.location.href).searchParams.get("token");
    const launchDeviceId = new URL(window.location.href).searchParams.get("deviceId");
    if (token) {
      writePendingToken("phantom", token);
      window.history.replaceState({}, "", window.location.pathname);
    }

    const pendingToken = readPendingToken("phantom");
    const cached = readCachedBootstrap("phantom");
    if (!pendingToken && cached?.access?.kind === "demo") {
      const nextPayload = applyDemoRestrictions("phantom", cached);
      writeCachedBootstrap("phantom", nextPayload);
      setPayload(nextPayload);
      setInstallReady(true);
      setError("");
      setLoading(false);
      return;
    }

    setLoading(true);
    const loadWallet = pendingToken
      ? api
        .exchangeWalletBootstrap({
          deviceId: launchDeviceId || getPlatformDeviceId(),
          token: pendingToken,
        })
        .then((response) => {
          const nextPayload = applyDemoRestrictions("phantom", response);
          writeCachedBootstrap("phantom", nextPayload);
          clearPendingToken("phantom");
          setPayload(nextPayload);
          setInstallReady(true);
          setError("");
        })
      : api.getWalletState("phantom").then((response) => {
        const nextPayload = applyDemoRestrictions("phantom", response);
        writeCachedBootstrap("phantom", nextPayload);
        setPayload(nextPayload);
        setInstallReady(true);
        setError("");
      });

    loadWallet
      .catch((loadError) => {
        const cached = readCachedBootstrap("phantom");
        if (cached && canUseCachedBootstrap(cached)) {
          setPayload(applyDemoRestrictions("phantom", cached));
          setInstallReady(true);
        } else if (pendingToken) {
          setError(getFriendlyBootstrapError(loadError, "Open Ph4ntom again from the hub to refresh this wallet session."));
        } else {
          setError(EXPIRED_ACCESS_MESSAGE);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [api]);

  const standalone = DEV_PWA_AUTH_BYPASS || isStandalonePwa();

  if (!appEnv.walletAppEnabled) {
    return <UnavailablePanel walletName="Ph4ntom" />;
  }

  if (!standalone) {
    return (
      <InstallGate
        heading={installReady ? "Open the app from your home screen" : "Install the app on your device"}
        tone={
          installReady
            ? "Your wallet session is ready. Add this app to your home screen, then open it there to continue."
            : "Your launch is waiting. Add this app to your home screen, then open it from there to finish setup."
        }
      />
    );
  }

  return (
    <>
      {DEV_PAYWALL_PREVIEW && devPaywallPreviewOpen ? (
        <DemoPaywall
          walletName="Ph4ntom"
          locked={DEV_PAYWALL_PREVIEW !== "active"}
          onClose={DEV_PAYWALL_PREVIEW === "active" ? () => setDevPaywallPreviewOpen(false) : undefined}
        />
      ) : payload && isDemoExpired(payload, now) ? (
        <DemoPaywall walletName="Ph4ntom" locked />
      ) : payload ? (
        <StrictWalletApp payload={payload} />
      ) : !loading ? (
        <ReconnectPanel
          body={error || "Launch Ph4ntom from the RPWallet hub to attach a session to this installed app."}
        />
      ) : null}

      <AnimatePresence>
        {loading && <SplashScreen />}
        {payload?.access?.kind === "demo" && !isDemoExpired(payload, now) && activeDemoPaywallOpen && (
          <DemoPaywall walletName="Ph4ntom" onClose={() => setActiveDemoPaywallOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

function DemoPaywall({ locked = false, onClose, walletName }: { locked?: boolean; onClose?: () => void; walletName: string }) {
  const [selectedPlanId, setSelectedPlanId] = React.useState<(typeof PAYWALL_PLANS)[number]["id"]>("popular");
  const selectedPlan = PAYWALL_PLANS.find((plan) => plan.id === selectedPlanId) || PAYWALL_PLANS[1];
  const purchaseUrl = `${appEnv.hubUrl.replace(/\/+$/, "")}/buy?plan=${selectedPlan.id}&checkout=1&source=phantom-paywall`;

  return (
    <main className="fixed inset-0 z-[100000000] min-h-screen overflow-y-auto bg-[#0b0b0c] text-white">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[38vh] bg-[radial-gradient(circle_at_top,rgba(171,159,242,0.18),transparent_68%)]" />
      <section className="relative mx-auto flex min-h-full w-full max-w-[430px] flex-col px-5 pb-[calc(18px+env(safe-area-inset-bottom))] pt-[calc(28px+env(safe-area-inset-top))]">
        {!locked && <button
          aria-label="Close"
          className="absolute right-5 top-[calc(18px+env(safe-area-inset-top))] flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/60 transition-colors active:bg-white/10"
          onClick={onClose}
          type="button"
        >
          <X size={19} strokeWidth={2.5} />
        </button>}

        <div className="relative flex flex-col items-center text-center">
          <div className="mb-3 flex size-11 items-center justify-center rounded-lg border border-[#ab9ff2]/25 bg-[#ab9ff2]/15 text-[#c9c0ff]">
            <Crown size={23} strokeWidth={2.2} />
          </div>
          <h1 className="text-[25px] font-bold leading-tight tracking-normal text-white">
            Unlock {walletName}
          </h1>
          <p className="mt-1.5 max-w-[300px] text-[13px] font-medium leading-relaxed text-white/45">
            Choose a plan to keep every wallet feature available without a demo timer.
          </p>
        </div>

        <div className="relative mt-6 rounded-lg border border-white/[0.08] bg-[#151516] px-4 py-2">
          <PaywallFeature icon={<Eye size={20} />} title="Full Wallet Editing" body="Customize balances, profiles, addresses, and tokens without a timer." />
          <div className="h-px w-full bg-white/[0.07]" />
          <PaywallFeature icon={<Send size={20} />} title="Complete Wallet Tools" body="Keep simulated transfers, notifications, swaps, and activity unlocked." />
          <div className="h-px w-full bg-white/[0.07]" />
          <PaywallFeature icon={<Gamepad2 size={20} />} title="Every Wallet App" body="Use all supported RPWallet experiences with the same license." />
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          {PAYWALL_PLANS.map((plan) => {
            const selected = plan.id === selectedPlanId;
            return (
              <button
                aria-pressed={selected}
                className={`relative flex min-h-[68px] w-full items-center rounded-lg border px-4 text-left transition-colors ${
                  selected
                    ? "border-[#ab9ff2] bg-[#ab9ff2]/12"
                    : "border-white/[0.08] bg-[#151516] active:bg-white/[0.06]"
                }`}
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                type="button"
              >
                <span className={`mr-3 flex size-5 shrink-0 items-center justify-center rounded-full border ${
                  selected ? "border-[#ab9ff2] bg-[#ab9ff2]" : "border-white/25"
                }`}>
                  {selected && <Check size={13} strokeWidth={4} className="text-[#111]" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-[16px] font-bold text-white">{plan.label}</span>
                    {plan.badge && (
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
                        plan.id === "yearly" ? "bg-[#d4af37]/15 text-[#e5c963]" : "bg-[#ab9ff2]/15 text-[#c9c0ff]"
                      }`}>
                        {plan.badge}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-[12px] font-medium text-white/40">{plan.detail}</span>
                </span>
                <span className="ml-3 text-[22px] font-bold tracking-tight text-white">{plan.price}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-5">
          <a
            className={`flex h-[54px] w-full items-center justify-center gap-2 rounded-lg text-[16px] font-bold shadow-[0_12px_30px_rgba(171,159,242,0.18)] transition-transform active:scale-[0.98] ${
              selectedPlan.id === "yearly" ? "bg-[#d4af37] text-[#111]" : "bg-[#ab9ff2] text-[#111]"
            }`}
            href={purchaseUrl}
          >
            Buy {selectedPlan.label} <ShoppingCart size={18} strokeWidth={2.5} />
          </a>
          <p className="mt-3 px-2 text-center text-[11px] font-medium leading-snug text-white/35">
            {locked ? "Your demo has ended. Purchase a plan to continue." : "This feature is locked during the demo. Your demo remains active after closing."}
          </p>
          <div className="mt-4 flex items-center justify-center gap-4 text-[10px] font-semibold text-white/25">
            <a href={`${appEnv.hubUrl.replace(/\/+$/, "")}/privacy`}>Privacy</a>
            <a href={appEnv.hubUrl}>Restore</a>
            <a href={`${appEnv.hubUrl.replace(/\/+$/, "")}/terms`}>Terms</a>
          </div>
        </div>
      </section>
    </main>
  );
}

function PaywallFeature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="relative z-10 flex gap-3 py-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#ab9ff2]/12 text-[#b9adfa]">{icon}</div>
      <div className="flex flex-col justify-center">
        <h2 className="text-[14px] font-bold leading-tight text-white">{title}</h2>
        <p className="mt-0.5 pr-1 text-[11px] font-medium leading-relaxed text-white/45">{body}</p>
      </div>
    </div>
  );
}


function UnavailablePanel({ walletName }: { walletName: string }) {
  return (
    <main className="installShell">
      <section className="installPanel">
        <p className="label">{walletName} PWA</p>
        <h1 className="installTitle">This wallet is not available yet</h1>
        <p className="muted">This RPWallet app is currently disabled. Check the hub for the wallets available on your license.</p>
      </section>
    </main>
  );
}

function InstallGate({ heading, tone }: { heading: string; tone: string }) {
  const ios = isIOS();
  const steps = ios
    ? ["Tap the Share button in Safari", 'Choose "Add to Home Screen"', 'Tap "Add"', "Open the app from your home screen"]
    : ["Open the browser menu", 'Choose "Add to Home screen"', 'Confirm with "Add"', "Open the app from your home screen"];

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
                  backgroundColor: "#8c78f0",
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

function ReconnectPanel({ body }: { body: string }) {
  const buyUrl = `${appEnv.hubUrl.replace(/\/+$/, "")}/buy`;

  return (
    <main className="min-h-screen bg-[#0d0d0e] text-white px-6 py-12 flex flex-col font-sans">
      <section className="mb-12 mt-12">
        <p className="text-[#ab9ff2] text-xs font-bold tracking-widest uppercase mb-4">RPWallet PWA</p>
        <h1 className="text-4xl font-semibold tracking-tight text-white leading-tight mb-4">Open this from the hub</h1>
        <p className="text-white/50 text-sm leading-relaxed max-w-[280px]">
          {body}
        </p>
      </section>

      <a
        className="flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-[#ab9ff2] to-[#7f66ff] text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
        href={buyUrl}
      >
        Renew Access
      </a>
    </main>
  );
}

registerPh4ntomServiceWorker();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Ph4ntomApp />
  </React.StrictMode>,
);

function getFriendlyBootstrapError(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback;
  if (error.message.includes("DEVICE_LIMIT_REACHED") || error.message.includes("already active on")) {
    return "This license has already reached its device limit.";
  }
  return fallback;
}

function createDevPh4ntomPayload(): WalletBootstrapPayload {
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const accountId = "dev-phantom-account-1";

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
      id: "phantom",
      name: "Ph4ntom",
      host: "localhost:5173",
      enabled: true,
      activated: true,
    },
    profile: {
      id: "dev-phantom-profile",
      userId: "dev-user",
      walletAppId: "phantom",
      displayName: "RPWallet",
      username: "RPWallet",
      createdAt: now,
      updatedAt: now,
    },
    accounts: [
      {
        id: accountId,
        walletProfileId: "dev-phantom-profile",
        name: "RPWallet",
        address: "7x8fR9m4K5L2n3jP8hQ6vY7zB1cX0m9A8s7d6f5g4h3j",
        createdAt: now,
      },
    ],
    balances: [
      { accountId, tokenSymbol: "SOL", amount: "1.5", updatedAt: now },
      { accountId, tokenSymbol: "USDT", amount: "180", updatedAt: now },
      { accountId, tokenSymbol: "SUI", amount: "45", updatedAt: now },
      { accountId, tokenSymbol: "ETH", amount: "0.04", updatedAt: now },
    ],
    recentTransactions: [
      {
        id: "dev-phantom-tx-1",
        walletAppId: "phantom",
        accountId,
        type: "receive",
        status: "confirmed",
        tokenSymbol: "USDT",
        amount: "120",
        fromAddress: "Fj7Lk2M4pQ8sV1nC9xR3tY6uA5bD0eH2jK4mN7pS",
        toAddress: "7x8fR9m4K5L2n3jP8hQ6vY7zB1cX0m9A8s7d6f5g4h3j",
        createdAt: now,
      },
    ],
    notificationSettings: DEFAULT_NOTIFICATION_SETTINGS,
    recentNotifications: [],
  };
}
