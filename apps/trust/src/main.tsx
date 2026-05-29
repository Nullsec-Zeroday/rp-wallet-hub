import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { IonApp, IonContent, IonPage, setupIonicReact } from "@ionic/react";
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
import "@ionic/react/css/core.css";
import "./styles.css";

setupIonicReact();

function TrustApp() {
  const api = useMemo(() => new RpWalletApiClient(appEnv.apiBaseUrl), []);
  const [payload, setPayload] = useState<WalletBootstrapPayload | null>(() => readCachedBootstrap("trust"));
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState("");
  const [installReady, setInstallReady] = useState(false);

  useEffect(() => {
    if (!appEnv.walletAppEnabled) {
      setLoading(false);
      return;
    }

    const token = new URL(window.location.href).searchParams.get("token");
    if (token) {
      writePendingToken("trust", token);
      window.history.replaceState({}, "", window.location.pathname);
    }

    const pendingToken = readPendingToken("trust");
    const standalone = isStandalonePwa();

    setLoading(true);
    const loadWallet = pendingToken
      ? api
          .exchangeWalletBootstrap({
            token: pendingToken,
            deviceId: getPlatformDeviceId(),
          })
          .then((response) => {
            writeCachedBootstrap("trust", response);
            clearPendingToken("trust");
            setPayload(response);
            setInstallReady(true);
            setError("");
          })
      : api.getWalletState("trust").then((response) => {
          writeCachedBootstrap("trust", response);
          setPayload(response);
          setError("");
        });

    loadWallet
      .catch((loadError) => {
        const cached = readCachedBootstrap("trust");
        if (cached) {
          setPayload(cached);
          setInstallReady(true);
        } else if (pendingToken) {
          setError(getFriendlyBootstrapError(loadError, "This launch token has expired. Open Trust again from the hub."));
        } else {
          setError("Reconnect through the hub to refresh this wallet session.");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [api]);

  const standalone = isStandalonePwa();

  return (
    <IonApp>
      <IonPage>
        <IonContent fullscreen>
          {!appEnv.walletAppEnabled ? (
            <InstallGate
              heading="This wallet is not available yet"
              tone="This LarperWallet app is currently disabled. Check the hub for the wallets available on your license."
            />
          ) : !standalone ? (
            <InstallGate
              heading={installReady ? "Open Trust from your home screen" : "Install Trust on your device"}
              tone={
                installReady
                  ? "Your wallet session is ready. Add this app to your home screen, then relaunch it there to continue."
                  : "Add this to your home screen, then relaunch it there to complete the wallet handoff."
              }
            />
          ) : loading ? (
            <StatusPanel eyebrow="Trust Wallet PWA" title="Preparing your wallet" body="Syncing your launch token and profile." />
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
            <StatusPanel
              eyebrow="Trust Wallet PWA"
              title="Open this from the hub"
              body={error || "Launch Trust from the LarperWallet hub to attach a session to this installed app."}
            />
          )}
        </IonContent>
      </IonPage>
    </IonApp>
  );
}

function BootstrappedWallet({
  api,
  mutating,
  onMutatingChange,
  onPayloadChange,
  onErrorChange,
  payload,
}: {
  api: RpWalletApiClient;
  mutating: boolean;
  onMutatingChange: (value: boolean) => void;
  onPayloadChange: (value: WalletBootstrapPayload) => void;
  onErrorChange: (value: string) => void;
  payload: WalletBootstrapPayload;
}) {
  const primaryAccount = payload.accounts[0];
  const [transactionType, setTransactionType] = useState<WalletMutationType>("receive");
  const [tokenSymbol, setTokenSymbol] = useState("SOL");
  const [amount, setAmount] = useState("1.0");
  const [counterparty, setCounterparty] = useState(primaryAccount?.address || "");

  async function submitTransaction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!primaryAccount) return;

    onMutatingChange(true);
    onErrorChange("");

    const body: CreateWalletTransactionRequest = {
      walletAppId: "trust",
      accountId: primaryAccount.id,
      type: transactionType,
      tokenSymbol,
      amount,
      fromAddress: transactionType === "receive" ? counterparty || "seed-source" : primaryAccount.address,
      toAddress: transactionType === "receive" ? primaryAccount.address : counterparty,
    };

    try {
      const response = await api.createWalletTransaction(body);
      writeCachedBootstrap("trust", response.payload);
      onPayloadChange(response.payload);
    } catch {
      onErrorChange("That transaction could not be applied.");
    } finally {
      onMutatingChange(false);
    }
  }

  return (
    <main className="walletShell">
      <section className="balancePanel">
        <p className="label">{payload.wallet.name}</p>
        <h1>$0.00</h1>
        <p className="muted">{payload.profile.displayName} is active until {formatDate(payload.license.expiresAt)}.</p>
      </section>

      <section className="actionGrid" aria-label="Wallet actions">
        <button type="button">Send</button>
        <button type="button">Swap</button>
        <button type="button">Receive</button>
        <button type="button">Buy</button>
      </section>

      <section className="detailPanel">
        <div className="detailRow">
          <span>Account</span>
          <strong>{primaryAccount?.name || "Account 1"}</strong>
        </div>
        <div className="detailRow">
          <span>Address</span>
          <strong>{compactAddress(primaryAccount?.address)}</strong>
        </div>
        <div className="detailRow">
          <span>Plan</span>
          <strong>{payload.license.plan}</strong>
        </div>
      </section>

      <section className="listPanel">
        <div className="listHeader">Balances</div>
        {payload.balances.length === 0 ? (
          <div className="emptyState">No balances yet.</div>
        ) : (
          payload.balances.map((balance) => (
            <div className="listRow" key={`${balance.accountId}-${balance.tokenSymbol}`}>
              <span>{balance.tokenSymbol}</span>
              <strong>{balance.amount}</strong>
            </div>
          ))
        )}
      </section>

      <section className="listPanel">
        <div className="listHeader">Recent Activity</div>
        {payload.recentTransactions.length === 0 ? (
          <div className="emptyState">No transactions yet.</div>
        ) : (
          payload.recentTransactions.map((transaction) => (
            <div className="listRow" key={transaction.id}>
              <span>{transaction.type.replace(/_/g, " ")}</span>
              <strong>
                {transaction.amount} {transaction.tokenSymbol}
              </strong>
            </div>
          ))
        )}
      </section>

      <form className="composerPanel" onSubmit={submitTransaction}>
        <div className="listHeader">Simulate Transaction</div>
        <div className="modeRow" role="tablist" aria-label="Transaction mode">
          {(["receive", "same_wallet_transfer", "manual_adjustment"] as WalletMutationType[]).map((mode) => (
            <button
              aria-pressed={transactionType === mode}
              className={`modeButton${transactionType === mode ? " active" : ""}`}
              key={mode}
              onClick={() => setTransactionType(mode)}
              type="button"
            >
              {mode === "same_wallet_transfer" ? "Transfer" : mode === "manual_adjustment" ? "Adjust" : "Receive"}
            </button>
          ))}
        </div>

        <label className="field">
          <span>Token</span>
          <input onChange={(event) => setTokenSymbol(event.target.value.toUpperCase())} value={tokenSymbol} />
        </label>

        <label className="field">
          <span>Amount</span>
          <input inputMode="decimal" onChange={(event) => setAmount(event.target.value)} value={amount} />
        </label>

        <label className="field">
          <span>{transactionType === "receive" ? "Source" : "Destination"}</span>
          <input onChange={(event) => setCounterparty(event.target.value)} value={counterparty} />
        </label>

        <button className="submitButton" disabled={mutating || !amount.trim() || !tokenSymbol.trim()} type="submit">
          {mutating ? "Applying..." : "Apply"}
        </button>
      </form>
    </main>
  );
}

function InstallGate({ heading, tone }: { heading: string; tone: string }) {
  const ios = isIOS();
  const steps = ios
    ? [
        "Tap the Share button in Safari",
        'Choose "Add to Home Screen"',
        'Tap "Add"',
        "Open Trust from your home screen",
      ]
    : [
        "Open the browser menu",
        'Choose "Add to Home screen"',
        'Confirm with "Add"',
        "Open Trust from your home screen",
      ];

  return (
    <main className="installShell">
      <section className="installPanel">
        <p className="label">Trust Wallet PWA</p>
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
        <p className="label">{eyebrow}</p>
        <h1 className="statusTitle">{title}</h1>
        <p className="muted">{body}</p>
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
