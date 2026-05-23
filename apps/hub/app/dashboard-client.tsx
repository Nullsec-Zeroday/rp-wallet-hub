"use client";

import { useEffect, useMemo, useState } from "react";
import { RpWalletApiClient } from "@rp-wallet/api-client";
import type { HubSessionResponse, WalletAppId } from "@rp-wallet/types";

const DEVICE_ID_KEY = "rp_wallet_hub_device_id";

export default function DashboardClient() {
  const api = useMemo(() => new RpWalletApiClient(), []);
  const [licenseKey, setLicenseKey] = useState("");
  const [email, setEmail] = useState("");
  const [session, setSession] = useState<HubSessionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [manualTokens, setManualTokens] = useState<Partial<Record<WalletAppId, string>>>({});

  useEffect(() => {
    api
      .getMe()
      .then(setSession)
      .catch(() => {
        setSession(null);
      });
  }, [api]);

  async function activateLicense(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.activateLicense({
        licenseKey,
        email: email || undefined,
        deviceId: getDeviceId(),
      });
      setSession(response);
    } catch {
      setError("Unable to activate this license key.");
    } finally {
      setLoading(false);
    }
  }

  async function launchWallet(walletAppId: WalletAppId) {
    setLoading(true);
    setError("");

    try {
      const response = await api.createWalletLaunch({
        walletAppId,
        returnTo: walletAppId === "phantom" ? "http://localhost:5173/bootstrap" : "http://localhost:5174/bootstrap",
      });
      window.location.href = response.launchUrl;
    } catch {
      setError("Unable to create wallet launch token.");
    } finally {
      setLoading(false);
    }
  }

  async function generateManualToken(walletAppId: WalletAppId) {
    setLoading(true);
    setError("");

    try {
      const response = await api.createWalletLaunch({
        walletAppId,
        returnTo: walletAppId === "phantom" ? "http://localhost:5173/bootstrap" : "http://localhost:5174/bootstrap",
      });
      const token = new URL(response.launchUrl).searchParams.get("token") || "";
      setManualTokens((current) => ({
        ...current,
        [walletAppId]: token,
      }));
      if (token) {
        await navigator.clipboard.writeText(token);
      }
    } catch {
      setError("Unable to generate a manual wallet launch token.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <section className="intro">
        <p className="eyebrow">RP Wallet Platform</p>
        <h1>{session ? "Choose a wallet to launch." : "Activate your license."}</h1>
        <p className="summary">
          {session
            ? `Your ${session.license.plan} session is active until ${formatDate(session.license.expiresAt)}.`
            : "Enter a license key once, then install each wallet PWA from its own subdomain."}
        </p>
      </section>

      {!session && (
        <form className="activationForm" onSubmit={activateLicense}>
          <label>
            License key
            <input
              value={licenseKey}
              onChange={(event) => setLicenseKey(event.target.value.toUpperCase())}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              required
            />
          </label>
          <label>
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="optional@email.com"
              type="email"
            />
          </label>
          <button disabled={loading || !licenseKey.trim()} type="submit">
            {loading ? "Activating..." : "Activate"}
          </button>
        </form>
      )}

      {error && <p className="errorMessage">{error}</p>}

      {session && (
        <section className="walletGrid" aria-label="Available wallets">
          {session.wallets.map((wallet) => (
            <article className="walletCard" key={wallet.id}>
              <div>
                <p className="walletName">{wallet.name}</p>
                <p className="walletHost">{wallet.host}</p>
                {manualTokens[wallet.id] && (
                  <p className="walletHost">Token ready: {shrinkToken(manualTokens[wallet.id]!)}</p>
                )}
              </div>
              <div className="walletActions">
                <button className="launchButton" disabled={loading || !wallet.enabled} onClick={() => launchWallet(wallet.id)}>
                  {wallet.activated ? "Open" : "Install"}
                </button>
                <button className="launchButton secondary" disabled={loading || !wallet.enabled} onClick={() => generateManualToken(wallet.id)}>
                  Copy Token
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

function getDeviceId() {
  const existing = localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  const deviceId = crypto.randomUUID();
  localStorage.setItem(DEVICE_ID_KEY, deviceId);
  return deviceId;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function shrinkToken(value: string) {
  if (value.length <= 18) return value;
  return `${value.slice(0, 10)}...${value.slice(-6)}`;
}
