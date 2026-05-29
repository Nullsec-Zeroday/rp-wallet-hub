import React from "react";
import { createRoot } from "react-dom/client";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { RpWalletApiClient } from "@rp-wallet/api-client";
import type { WalletBootstrapPayload } from "@rp-wallet/types";
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
import { StrictWalletApp } from "./strict-wallet";
import SplashScreen from "./splash-screen";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/inter/latin-800.css";
import "@ionic/react/css/core.css";
import "./styles.css";

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
  const [payload, setPayload] = React.useState<WalletBootstrapPayload | null>(() => readCachedBootstrap("phantom"));
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [installReady, setInstallReady] = React.useState(false);

  React.useEffect(() => {
    if (!appEnv.walletAppEnabled) {
      setLoading(false);
      return;
    }

    const token = new URL(window.location.href).searchParams.get("token");
    if (token) {
      writePendingToken("phantom", token);
      window.history.replaceState({}, "", window.location.pathname);
    }

    const pendingToken = readPendingToken("phantom");

    setLoading(true);
    const loadWallet = pendingToken
      ? api
        .exchangeWalletBootstrap({
          deviceId: getPlatformDeviceId(),
          token: pendingToken,
        })
        .then((response) => {
          writeCachedBootstrap("phantom", response);
          clearPendingToken("phantom");
          setPayload(response);
          setInstallReady(true);
          setError("");
        })
      : api.getWalletState("phantom").then((response) => {
        writeCachedBootstrap("phantom", response);
        setPayload(response);
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
          setError(getFriendlyBootstrapError(loadError, "This launch token has expired. Open Phantom again from the hub."));
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
      {payload ? (
        <StrictWalletApp payload={payload} />
      ) : !loading ? (
        <ReconnectPanel
          api={api}
          body={error || "Launch Phantom from the LarperWallet hub to attach a session to this installed app."}
          onErrorChange={setError}
          onPayloadChange={setPayload}
        />
      ) : null}

      <AnimatePresence>
        {loading && <SplashScreen />}
      </AnimatePresence>
    </>
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

function ReconnectPanel({
  api,
  body,
  onErrorChange,
  onPayloadChange,
}: {
  api: RpWalletApiClient;
  body: string;
  onErrorChange: (value: string) => void;
  onPayloadChange: (value: WalletBootstrapPayload) => void;
}) {
  const [token, setToken] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function submitToken(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token.trim()) return;

    setSubmitting(true);
    onErrorChange("");

    try {
      const response = await api.exchangeWalletBootstrap({
        deviceId: getPlatformDeviceId(),
        token: token.trim(),
      });
      writeCachedBootstrap("phantom", response);
      clearPendingToken("phantom");
      onPayloadChange(response);
    } catch (submitError) {
      onErrorChange(getFriendlyBootstrapError(submitError, "That one-time token is invalid or has expired."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0d0d0e] text-white px-6 py-12 flex flex-col font-sans">
      <section className="mb-12 mt-12">
        <p className="text-[#ab9ff2] text-xs font-bold tracking-widest uppercase mb-4">Larper Wallet PWA</p>
        <h1 className="text-4xl font-semibold tracking-tight text-white leading-tight mb-4">Open this from the hub</h1>
        <p className="text-white/50 text-sm leading-relaxed max-w-[280px]">
          {body}
        </p>
      </section>

      <form 
        className="flex flex-col gap-5 p-6 rounded-3xl bg-[#121212]/80 border border-white/[0.04] backdrop-blur-md shadow-2xl" 
        onSubmit={submitToken}
      >
        <div className="text-white/80 font-semibold text-xs tracking-widest uppercase">Manual One-Time Token</div>
        <label className="flex flex-col gap-2">
          <span className="text-white/40 text-[11px] font-bold uppercase tracking-widest">Launch token</span>
          <input
            className="h-12 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm focus:outline-none focus:border-[#ab9ff2]/50 transition-colors placeholder:text-white/20"
            autoCapitalize="off"
            autoCorrect="off"
            onChange={(event) => setToken(event.target.value)}
            placeholder="Paste token from hub"
            value={token}
          />
        </label>
        <button 
          className="h-12 mt-2 bg-gradient-to-r from-[#ab9ff2] to-[#7f66ff] text-white font-semibold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100" 
          disabled={submitting || !token.trim()} 
          type="submit"
        >
          {submitting ? "Connecting..." : "Connect Wallet"}
        </button>
      </form>
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
