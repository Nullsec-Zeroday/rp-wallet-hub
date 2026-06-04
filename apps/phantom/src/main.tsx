import React from "react";
import { createRoot } from "react-dom/client";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Eye, Gamepad2, Send, X } from "lucide-react";
import { RpWalletApiClient } from "@rp-wallet/api-client";
import type { WalletBootstrapPayload } from "@rp-wallet/types";
import {
  clearPendingToken,
  addDemoPaywallListener,
  applyDemoRestrictions,
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
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/inter/latin-800.css";
import "@ionic/react/css/core.css";
import "./styles.css";

const FORCE_PAYWALL_PREVIEW = false;

function registerPhantomServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const register = () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("Phantom service worker registration failed", error);
    });
  };

  if (document.readyState === "complete") {
    register();
  } else {
    window.addEventListener("load", register, { once: true });
  }
}

function PhantomApp() {
  const api = React.useMemo(() => new RpWalletApiClient(appEnv.apiBaseUrl), []);
  const [payload, setPayload] = React.useState<WalletBootstrapPayload | null>(() => {
    const cached = readCachedBootstrap("phantom");
    return cached ? applyDemoRestrictions("phantom", cached) : null;
  });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [installReady, setInstallReady] = React.useState(false);
  const [now, setNow] = React.useState(() => Date.now());
  const [activeDemoPaywallOpen, setActiveDemoPaywallOpen] = React.useState(false);

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
        if (cached) {
          setPayload(cached);
          setInstallReady(true);
        } else if (pendingToken) {
          setError(getFriendlyBootstrapError(loadError, "Open Phantom again from the hub to refresh this wallet session."));
        } else {
          setError("Reconnect through the hub to refresh this wallet session.");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [api]);

  const standalone = isStandalonePwa();

  if (!appEnv.walletAppEnabled) {
    return <UnavailablePanel walletName="Phantom" />;
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
      {FORCE_PAYWALL_PREVIEW ? (
        <DemoPaywall walletName="Phantom" locked />
      ) : payload && isDemoExpired(payload, now) ? (
        <DemoPaywall walletName="Phantom" locked />
      ) : payload ? (
        <StrictWalletApp payload={payload} />
      ) : !loading ? (
        <ReconnectPanel
          body={error || "Launch Phantom from the LarperWallet hub to attach a session to this installed app."}
        />
      ) : null}

      <AnimatePresence>
        {loading && <SplashScreen />}
        {payload?.access?.kind === "demo" && !isDemoExpired(payload, now) && activeDemoPaywallOpen && (
          <DemoPaywall walletName="Phantom" onClose={() => setActiveDemoPaywallOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

function DemoPaywall({ locked = false, onClose, walletName }: { locked?: boolean; onClose?: () => void; walletName: string }) {
  const purchaseUrl = `${appEnv.hubUrl.replace(/\/+$/, "")}/buy`;

  return (
    <main className="fixed inset-0 z-[100000000] flex min-h-screen flex-col overflow-hidden bg-[#0d0d0e] text-white">
      {/* Background glow effects */}
      <div className="absolute top-0 inset-x-0 h-[40vh] bg-gradient-to-b from-[#ab9ff2]/15 to-transparent pointer-events-none" />
      <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[50vh] bg-[#ab9ff2]/10 blur-[100px] rounded-full pointer-events-none" />

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
          <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-[#ab9ff2]/15 border border-[#ab9ff2]/30 text-[#ab9ff2] text-[10px] font-extrabold tracking-widest uppercase mb-1 shadow-[0_0_20px_rgba(171,159,242,0.2)]">
            Premium Access
          </div>
          <h1 className="text-[20px] font-extrabold tracking-tight text-white leading-[1.1] drop-shadow-lg">
            Unlock <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ab9ff2] to-[#7f66ff]">LarperWallet</span>
          </h1>
          <p className="text-[14px] text-white/50 font-medium max-w-[260px] mt-1.5 leading-relaxed">
            Get unrestricted access to all features and wallet apps.
          </p>
        </div>
      </section>

      <section className="flex flex-1 flex-col px-5 pb-[calc(16px+env(safe-area-inset-bottom))] relative z-10">
        <div className="mt-2 rounded-[24px] bg-white/[0.03] border border-white/[0.08] backdrop-blur-3xl p-4 shadow-2xl relative overflow-hidden">
          {/* Subtle inner glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#ab9ff2]/10 blur-3xl" />
          <PaywallFeature icon={<Eye size={20} />} title="Full Wallet Editing" body="Customize balances, profiles, addresses, and tokens without a timer." />
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-1" />
          <PaywallFeature icon={<Send size={20} />} title="Send and Receive Tools" body="Keep simulated transfers, notifications, and activity history unlocked." />
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-1" />
          <PaywallFeature icon={<Gamepad2 size={20} />} title="All Wallet Apps" body="Use every supported LarperWallet app from the same active license." />
        </div>

        <div className="mt-auto pt-6">
          <a
            className="flex h-[52px] w-full items-center justify-center rounded-[1rem] bg-gradient-to-r from-[#ab9ff2] to-[#7f66ff] text-[16px] font-bold text-white shadow-[0_10px_30px_rgba(171,159,242,0.3)] transition-transform active:scale-[0.98]"
            href={purchaseUrl}
          >
            Upgrade Now
          </a>
          <p className="mt-3 text-center text-[12px] font-medium text-white/40 px-2 leading-snug">
            {locked ? "Demo ended. Choose a plan on LarperWallet to continue." : "This feature is locked in demo mode. Upgrade when you are ready."}
          </p>
          <div className="mt-5 flex items-center justify-center gap-5 text-[11px] font-semibold text-white/30">
            <a href={`${appEnv.hubUrl.replace(/\/+$/, "")}/privacy`} className="hover:text-white/60 transition-colors">Privacy Policy</a>
            <div className="size-1 rounded-full bg-white/10" />
            <a href={appEnv.hubUrl} className="hover:text-white/60 transition-colors">Restore</a>
            <div className="size-1 rounded-full bg-white/10" />
            <a href={`${appEnv.hubUrl.replace(/\/+$/, "")}/terms`} className="hover:text-white/60 transition-colors">Terms of Service</a>
          </div>
        </div>
      </section>
    </main>
  );
}

function PaywallFeature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex gap-3 py-2.5 first:pt-1 last:pb-1 relative z-10">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#ab9ff2]/20 to-[#7f66ff]/10 border border-[#ab9ff2]/20 text-[#ab9ff2] shadow-[inset_0_0_20px_rgba(171,159,242,0.1)]">{icon}</div>
      <div className="flex flex-col justify-center">
        <h2 className="text-[15px] font-bold leading-tight text-white">{title}</h2>
        <p className="mt-0.5 text-[12px] font-medium leading-relaxed text-white/50 pr-2">{body}</p>
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
        <p className="muted">This LarperWallet app is currently disabled. Check the hub for the wallets available on your license.</p>
      </section>
    </main>
  );
}

function InstallGate({ heading, tone }: { heading: string; tone: string }) {
  const ios = isIOS();
  const steps = ios
    ? ["Tap the Share button in Safari", 'Choose "Add to Home Screen"', 'Tap "Add"', "Open the app from your home screen"]
    : ["Open the browser menu", 'Choose "Add to Home screen"', 'Confirm with "Add"', "Open the app from your home screen"];

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
  const hubUrl = (import.meta.env as any).VITE_HUB_URL || "https://larperwallet.com";

  return (
    <main className="min-h-screen bg-[#0d0d0e] text-white px-6 py-12 flex flex-col font-sans">
      <section className="mb-12 mt-12">
        <p className="text-[#ab9ff2] text-xs font-bold tracking-widest uppercase mb-4">Larper Wallet PWA</p>
        <h1 className="text-4xl font-semibold tracking-tight text-white leading-tight mb-4">Open this from the hub</h1>
        <p className="text-white/50 text-sm leading-relaxed max-w-[280px]">
          {body}
        </p>
      </section>

      <a
        className="flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-[#ab9ff2] to-[#7f66ff] text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
        href={hubUrl}
      >
        Open Hub
      </a>
    </main>
  );
}

registerPhantomServiceWorker();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PhantomApp />
  </React.StrictMode>,
);

function getFriendlyBootstrapError(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback;
  if (error.message.includes("DEVICE_LIMIT_REACHED") || error.message.includes("already active on")) {
    return "This license has already reached its device limit.";
  }
  return fallback;
}
