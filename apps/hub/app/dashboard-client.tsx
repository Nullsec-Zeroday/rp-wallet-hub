"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Copy, ExternalLink, Loader2, X } from "lucide-react";
import { RpWalletApiClient } from "@rp-wallet/api-client";
import type { HubSessionResponse, WalletAppId } from "@rp-wallet/types";

const DEVICE_ID_KEY = "rp_wallet_hub_device_id";
const WALLET_RETURN_TO: Record<WalletAppId, string> = {
  phantom: `${process.env.NEXT_PUBLIC_PHANTOM_URL || "http://localhost:5173"}/bootstrap`,
  trust: `${process.env.NEXT_PUBLIC_TRUST_URL || "http://localhost:5174"}/bootstrap`,
};

export default function DashboardClient() {
  const api = useMemo(() => new RpWalletApiClient(process.env.NEXT_PUBLIC_API_BASE_URL), []);
  const [licenseKey, setLicenseKey] = useState("");
  const [session, setSession] = useState<HubSessionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [manualTokens, setManualTokens] = useState<Partial<Record<WalletAppId, string>>>({});
  const [setupWalletId, setSetupWalletId] = useState<WalletAppId | null>(null);

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
        deviceId: getDeviceId(),
      });
      setSession(response);
    } catch (activationError) {
      setError(getFriendlyApiError(activationError, "Unable to activate this license key."));
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
        returnTo: WALLET_RETURN_TO[walletAppId],
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
        returnTo: WALLET_RETURN_TO[walletAppId],
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

  if (session) {
    const setupWallet = setupWalletId ? session.wallets.find((wallet) => wallet.id === setupWalletId) : null;

    return (
      <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#0d0d0e] px-6 selection:bg-[#9c8df6]/30">
        <Link
          href="/"
          className="absolute left-6 top-6 z-50 flex items-center gap-2 rounded-full bg-white/5 px-3.5 py-2 text-[13px] font-medium text-white/50 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white md:left-8 md:top-8"
        >
          <ArrowLeft size={16} />
          Go Back
        </Link>

        <main className="relative z-10 flex w-full max-w-[340px] flex-col justify-center gap-6 py-12 animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-4">
            <Image src="/logo_white.webp" alt="RP Wallet Logo" width={64} height={64} className="size-16" />
            <h1 className="text-center text-[22px] font-semibold tracking-tight text-white">Choose a wallet to launch</h1>
            <p className="mx-auto mt-1 max-w-[280px] text-center text-[13px] font-medium leading-normal text-white/60">
              Your {session.license.plan} session is active until {formatDate(session.license.expiresAt)}.
            </p>
          </div>

          {error && <p className="mx-auto mt-1 max-w-[280px] text-center text-[13px] font-medium leading-normal text-[#ef4444] animate-in fade-in duration-300">{error}</p>}

          <div className="flex w-full flex-col gap-4">
            {session.wallets.map((wallet) => (
              <div key={wallet.id} className="flex flex-col gap-3 rounded-xl border border-white/[0.05] bg-white/[0.03] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-semibold text-white">{wallet.name}</span>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${wallet.activated ? 'bg-[#9c8df6]/10 text-[#9c8df6]' : 'bg-white/5 text-white/40'}`}>
                    {wallet.activated ? "Ready" : "Not Installed"}
                  </span>
                </div>

                <button
                  className="flex h-[48px] w-full cursor-pointer items-center justify-center rounded-lg bg-[#9c8df6] text-sm font-semibold text-white transition-all duration-300 hover:bg-[#aba0f7] disabled:opacity-50 active:scale-[0.98]"
                  disabled={loading || !wallet.enabled}
                  onClick={() => (wallet.activated ? launchWallet(wallet.id) : setSetupWalletId(wallet.id))}
                >
                  {wallet.activated ? "Open Wallet" : `Connect ${wallet.name}`}
                </button>
                <button
                  className="flex h-[48px] w-full cursor-pointer items-center justify-center rounded-lg bg-white/[0.06] text-sm font-semibold text-white transition-all duration-300 hover:bg-white/[0.1] disabled:opacity-50 active:scale-[0.98]"
                  disabled={loading || !wallet.enabled}
                  onClick={() => setSetupWalletId(wallet.id)}
                >
                  Setup Guide
                </button>
                {manualTokens[wallet.id] && (
                  <p className="mt-1 text-center text-[12px] text-white/50">Launch token copied: {shrinkToken(manualTokens[wallet.id]!)}</p>
                )}
              </div>
            ))}
          </div>
        </main>

        {setupWallet && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#000000]/70 px-4 pb-4 backdrop-blur-md animate-in fade-in duration-300 sm:items-center sm:pb-0">
            <button aria-label="Close setup guide" className="absolute inset-0 cursor-default" onClick={() => setSetupWalletId(null)} type="button" />
            <section className="relative z-10 w-full max-w-[360px] overflow-hidden rounded-[28px] border border-white/10 bg-[#13111c]/90 p-6 text-white shadow-[0_24px_80px_rgba(156,141,246,0.12)] backdrop-blur-2xl animate-in slide-in-from-bottom-8 duration-300 zoom-in-95">
              <div className="absolute inset-0 pointer-events-none rounded-[inherit] bg-gradient-to-b from-[#9c8df6]/10 to-transparent opacity-60" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  {/* <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#9c8df6]">Wallet Setup</p> */}
                  <h2 className="mt-1.5 text-[24px] font-semibold tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                    Connect {setupWallet.name}
                  </h2>
                </div>
                <button
                  aria-label="Close setup guide"
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-white/5 border border-white/5 text-white/50 transition-all hover:bg-white/10 hover:text-white"
                  onClick={() => setSetupWalletId(null)}
                  type="button"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="relative mt-3 text-[13.5px] leading-relaxed text-white/60">
                {setupWallet.name} runs as its own PWA, so Hub cannot pass your session directly. You'll need to manually link them using a secure launch token.
              </p>

              <div className="relative mt-6 flex flex-col gap-1.5">
                {[
                  "Copy your one-time launch token.",
                  `Open ${setupWallet.name} on this device.`,
                  "Paste the token when prompted.",
                ].map((step, index) => (
                  <div className="group flex items-center gap-3.5 rounded-2xl border border-transparent bg-white/[0.02] px-3.5 py-3 transition-colors hover:border-white/5 hover:bg-white/[0.04]" key={step}>
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[#9c8df6]/30 bg-[#9c8df6]/10 text-[12px] font-semibold text-[#c7bdff] shadow-[0_0_12px_rgba(156,141,246,0.15)] transition-transform group-hover:scale-105">
                      {index + 1}
                    </div>
                    <p className="text-[13px] font-medium leading-relaxed text-white/70 transition-colors group-hover:text-white">{step}</p>
                  </div>
                ))}
              </div>

              {manualTokens[setupWallet.id] && (
                <div className="relative mt-4 flex items-center justify-between rounded-2xl border border-[#9c8df6]/30 bg-[#9c8df6]/10 px-4 py-3.5 shadow-[inset_0_0_20px_rgba(156,141,246,0.05)] animate-in fade-in zoom-in-95 duration-200">
                  <span className="text-[12px] font-medium text-[#c7bdff]">Token Copied</span>
                  <span className="font-mono text-[13px] font-semibold tracking-wider text-white">{shrinkToken(manualTokens[setupWallet.id]!)}</span>
                </div>
              )}

              <div className="relative mt-6 flex flex-col gap-3">
                <button
                  className="flex h-[52px] w-full items-center justify-center gap-2.5 rounded-[14px] bg-gradient-to-b from-[#aba0f7] to-[#9c8df6] text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_14px_rgba(156,141,246,0.25)] transition-all duration-300 hover:from-[#b5aef7] hover:to-[#aba0f7] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_6px_20px_rgba(156,141,246,0.4)] disabled:opacity-50 active:scale-[0.98]"
                  disabled={loading || !setupWallet.enabled}
                  onClick={() => generateManualToken(setupWallet.id)}
                  type="button"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Copy size={17} />}
                  Copy Launch Token
                </button>
                <button
                  className="flex h-[52px] w-full items-center justify-center gap-2.5 rounded-[14px] border border-white/10 bg-white/5 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10 disabled:opacity-50 active:scale-[0.98]"
                  disabled={!manualTokens[setupWallet.id]}
                  onClick={() => {
                    window.location.href = WALLET_RETURN_TO[setupWallet.id];
                  }}
                  type="button"
                >
                  <ExternalLink size={17} />
                  Open {setupWallet.name}
                </button>
              </div>

              <p className="relative mt-5 text-center text-[12px] leading-relaxed text-white/40 px-2">
                If the wallet is not on your home screen yet, open it once and select 'Add to Home Screen' before pasting.
              </p>
            </section>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#0d0d0e] px-6 selection:bg-[#9c8df6]/30">
      <Link
        href="/"
        className="absolute left-6 top-6 z-50 flex items-center gap-2 rounded-full bg-white/5 px-3.5 py-2 text-[13px] font-medium text-white/50 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white md:left-8 md:top-8"
      >
        <ArrowLeft size={16} />
        Go Back
      </Link>

      <main className="relative z-10 flex w-full max-w-[340px] flex-col justify-center gap-6 py-12 animate-in fade-in duration-300">
        <div className="flex flex-col items-center gap-4">
          <Image src="/logo_white.webp" alt="RP Wallet Logo" width={64} height={64} className="size-16" />
          <h1 className="text-center text-[22px] font-semibold tracking-tight text-white">Enter License Key</h1>
          {error && <p className="mx-auto mt-1 max-w-[280px] text-center text-[13px] font-medium leading-normal text-[#ef4444] animate-in fade-in duration-300">{error}</p>}
        </div>

        <form onSubmit={activateLicense} className="flex w-full flex-col gap-4">
          <input
            id="licenseKey"
            type="text"
            disabled={loading}
            value={licenseKey}
            onChange={(event) => {
              setLicenseKey(event.target.value.toUpperCase());
              if (error) setError("");
            }}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            required
            className="h-[54px] w-full rounded-lg border border-transparent bg-white/[0.05] text-center font-mono text-base tracking-widest text-white outline-none transition-all duration-300 placeholder:text-white/20 focus:border-white/10 disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={loading || !licenseKey.trim()}
            className="flex h-[54px] w-full cursor-pointer items-center justify-center rounded-lg bg-[#9c8df6] text-sm font-semibold text-white transition-all duration-300 hover:bg-[#aba0f7] disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? <Loader2 size={18} className="animate-spin text-white" /> : "Activate License"}
          </button>

          <Link
            href={process.env.NEXT_PUBLIC_SELLAUTH_STARTER_URL || "https://rp-wallet.sellauth.com/product/starter"}
            target="_blank"
            className="mt-8 block cursor-pointer text-center text-[13px] font-semibold tracking-wide text-[#9c8df6] transition-all duration-300 hover:underline"
          >
            Don&apos;t have a key? Purchase one here
          </Link>

          <Link
            href="https://t.me/larpzwalletcom"
            target="_blank"
            className="mb-2 mt-2 flex h-[54px] w-full cursor-pointer items-center justify-center rounded-lg bg-white/[0.06] text-sm font-semibold text-white transition-all duration-300 hover:bg-white/[0.1] active:scale-[0.98]"
          >
            Need help? Contact us
          </Link>
        </form>

        <div
          style={{
            backgroundColor: "rgba(255, 230, 0, 0.05)",
            border: "1px solid rgba(255, 230, 0, 0.2)",
            color: "#ffe600",
          }}
          className="w-full rounded-2xl p-4.5 text-[13px] leading-relaxed"
        >
          <span style={{ fontWeight: 600, color: "#ffe600" }}>⚠️ Important:</span> Activate your license key directly inside the{" "}
          <span style={{ fontWeight: 600, color: "#ffe600" }}>installed PWA only</span> once we finalize the launch flow. For now, this Hub screen is the central place to activate access and launch wallets.
        </div>
      </main>
    </div>
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

function getFriendlyApiError(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback;
  if (error.message.includes("DEVICE_LIMIT_REACHED") || error.message.includes("already active on")) {
    return "This license is already active on the maximum number of devices for its plan.";
  }
  return fallback;
}
