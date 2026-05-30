"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, Copy, Loader2, LogOut } from "lucide-react";
import { RpWalletApiClient } from "@rp-wallet/api-client";
import type { HubSessionResponse, WalletAppId } from "@rp-wallet/types";

const DEVICE_ID_KEY = "rp_wallet_hub_device_id";
const WALLET_RETURN_TO: Record<WalletAppId, string> = {
  phantom: `${process.env.NEXT_PUBLIC_PHANTOM_URL || "http://localhost:5173"}/bootstrap`,
  trust: `${process.env.NEXT_PUBLIC_TRUST_URL || "http://localhost:5174"}/bootstrap`,
};
const SHOW_DEV_WALLET_TOOLS = process.env.NODE_ENV !== "production";

export default function DashboardClient() {
  const api = useMemo(() => new RpWalletApiClient(process.env.NEXT_PUBLIC_API_BASE_URL), []);
  const [licenseKey, setLicenseKey] = useState("");
  const [session, setSession] = useState<HubSessionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copiedWalletId, setCopiedWalletId] = useState<WalletAppId | null>(null);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

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
    setNotice("");

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
    setNotice("");

    try {
      const response = await createWalletLaunch(walletAppId);
      window.location.href = response.launchUrl;
    } catch {
      setError("Unable to open this wallet. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function createWalletLaunch(walletAppId: WalletAppId) {
    return api.createWalletLaunch({
      deviceId: getDeviceId(),
      walletAppId,
      returnTo: WALLET_RETURN_TO[walletAppId],
    });
  }

  async function copyWalletLaunchToken(walletAppId: WalletAppId) {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const response = await createWalletLaunch(walletAppId);
      const token = new URL(response.launchUrl).searchParams.get("token");
      if (!token) throw new Error("Launch token missing");

      await navigator.clipboard.writeText(response.launchUrl);
      setCopiedWalletId(walletAppId);
      setNotice(`${walletAppId === "trust" ? "Trust" : "Phantom"} dev launch URL copied.`);
      window.setTimeout(() => {
        setCopiedWalletId((current) => (current === walletAppId ? null : current));
      }, 1800);
    } catch {
      setError("Unable to copy launch token. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await api.logout();
    } catch {
      // Even if the API call fails, clear state locally
    }
    setSession(null);
    setLicenseKey("");
    setError("");
    setNotice("");
    setShowSignOutModal(false);
    setSigningOut(false);
  }

  if (session) {
    return (
      <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#0d0d0e] px-6 selection:bg-[#9c8df6]/30">
        <Link
          href="/"
          className="absolute left-6 top-6 z-50 flex items-center gap-2 rounded-full bg-white/5 px-3.5 py-2 text-[13px] font-medium text-white/50 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white md:left-8 md:top-8"
        >
          <ArrowLeft size={16} />
          Go Back
        </Link>

        <button
          onClick={() => setShowSignOutModal(true)}
          className="absolute right-6 top-6 z-50 flex cursor-pointer items-center gap-2 rounded-full bg-white/5 px-3.5 py-2 text-[13px] font-medium text-white/50 backdrop-blur-sm transition-colors hover:bg-red-500/10 hover:text-red-400 md:right-8 md:top-8"
        >
          <LogOut size={15} />
          Sign Out
        </button>

        <main className="relative z-10 flex w-full max-w-[340px] flex-col justify-center gap-6 py-12 animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-4">
            <Image src="/logo_white.webp" alt="LarperWallet Logo" width={64} height={64} className="height-16 aspect-auto" />
            <h1 className="text-center text-[22px] font-semibold tracking-tight text-white">Choose a wallet to launch</h1>
            <p className="mx-auto mt-1 max-w-[280px] text-center text-[13px] font-medium leading-normal text-white/60">
              Your {session.license.plan} session is active until {formatDate(session.license.expiresAt)}.
            </p>
          </div>

          {error && <p className="mx-auto mt-1 max-w-[280px] text-center text-[13px] font-medium leading-normal text-[#ef4444] animate-in fade-in duration-300">{error}</p>}
          {notice && <p className="mx-auto mt-1 max-w-[280px] text-center text-[13px] font-medium leading-normal text-[#9c8df6] animate-in fade-in duration-300">{notice}</p>}

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
                  onClick={() => launchWallet(wallet.id)}
                >
                  {wallet.activated ? "Open Wallet" : `Launch ${wallet.name}`}
                </button>

                {SHOW_DEV_WALLET_TOOLS && wallet.enabled && (
                  <button
                    className="flex h-[42px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] text-[13px] font-semibold text-white/70 transition-all duration-300 hover:bg-white/[0.08] hover:text-white disabled:opacity-50 active:scale-[0.98]"
                    disabled={loading}
                    onClick={() => copyWalletLaunchToken(wallet.id)}
                  >
                    {copiedWalletId === wallet.id ? <Check size={15} /> : <Copy size={15} />}
                    {copiedWalletId === wallet.id ? "Copied Token" : "Copy Dev Token"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </main>

        {/* Sign Out Confirmation Modal */}
        {showSignOutModal && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget && !signingOut) setShowSignOutModal(false);
            }}
          >
            <div className="mx-4 w-full max-w-[340px] rounded-2xl border border-white/[0.05] bg-[#0d0d0e] p-6 shadow-2xl animate-in zoom-in-95 fade-in duration-200">
              <div className="flex flex-col items-center gap-4 text-center">
                {/* Warning icon */}
                <div className="flex size-14 items-center justify-center rounded-full bg-white/[0.03] border border-white/[0.05]">
                  <LogOut size={22} className="text-[#9c8df6]" />
                </div>

                <div className="flex flex-col gap-1">
                  <h2 className="text-[20px] font-semibold tracking-tight text-white">Sign out?</h2>
                  <p className="text-[13px] leading-relaxed text-white/60">
                    Your <span className="font-medium text-white">{session.license.plan}</span> session is active. Signing out will clear your session from this device.
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: "rgba(255, 230, 0, 0.05)",
                    border: "1px solid rgba(255, 230, 0, 0.2)",
                    color: "#ffe600",
                  }}
                  className="w-full rounded-xl p-4 text-left text-[12.5px] leading-relaxed"
                >
                  <span style={{ fontWeight: 600, color: "#ffe600" }}>⚠️ Note:</span> You will need to re-enter your license key to access the dashboard again.
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="flex h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#9c8df6] text-sm font-semibold text-white transition-all duration-300 hover:bg-[#aba0f7] disabled:opacity-50 active:scale-[0.98]"
                >
                  {signingOut ? <Loader2 size={18} className="animate-spin text-white" /> : "Sign Out"}
                </button>
                <button
                  onClick={() => setShowSignOutModal(false)}
                  disabled={signingOut}
                  className="flex h-[48px] w-full cursor-pointer items-center justify-center rounded-lg bg-white/[0.06] text-sm font-semibold text-white transition-all duration-300 hover:bg-white/[0.1] active:scale-[0.98]"
                >
                  Cancel
                </button>
              </div>
            </div>
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
          <Image src="/logo_white.webp" alt="LarperWallet Logo" width={64} height={64} className="height-14 aspect-auto" />
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

function getFriendlyApiError(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback;
  if (error.message.includes("DEVICE_LIMIT_REACHED") || error.message.includes("already active on")) {
    return "This license is already active on the maximum number of devices for its plan.";
  }
  if (error.message.includes("INVALID_LICENSE") || error.message.includes("Invalid license")) {
    return "This license key is invalid. Please check the key from your order page and try again.";
  }
  return fallback;
}
