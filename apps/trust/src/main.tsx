import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  ArrowDownToLine,
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
import { TrustWalletProvider } from "@/lib/trust-wallet-context";
import { RpWalletApiClient } from "@rp-wallet/api-client";
import type { CreateWalletTransactionRequest, WalletBootstrapPayload, WalletMutationType } from "@rp-wallet/types";
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
      window.history.replaceState({}, "", window.location.pathname);
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
        ) : loading ? (
          <StatusPanel eyebrow="Larper Wallet PWA" title="Preparing your wallet" body="Syncing your launch token and profile." />
        ) : payload ? (
          <BootstrappedWallet
            api={api}
            mutating={mutating}
            onMutatingChange={setMutating}
            onPayloadChange={setPayload}
            onErrorChange={setError}
            payload={payload}
          />
        ) : (
          <DevTokenPanel
            body={error || "Launch the app from the LarperWallet hub to attach a session to this installed app."}
            onErrorChange={setError}
            onExchangeToken={exchangeTrustToken}
          />
        )}
      </div>
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
  return (
    <RouterProvider>
      <TrustWalletProvider api={api} initialPayload={payload} onPayloadChange={onPayloadChange}>
        <WalletShell />
      </TrustWalletProvider>
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
    <main className="installShell">
      <section className="installPanel">
        <h1 className="installTitle">{heading}</h1>
        <p className="muted">{tone}</p>
        <div className="stepList">
          {steps.map((step, index) => (
            <div className="stepRow" key={step}>
              <span className="stepBadge">{index + 1}</span>
              <span className="stepText">{step}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
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
