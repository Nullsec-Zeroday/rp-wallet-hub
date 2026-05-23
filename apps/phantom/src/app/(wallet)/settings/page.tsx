"use client";

import React, { useState } from "react";
import { ChevronLeft, Search, ChevronRight, Layers, CreditCard, Bell, SlidersHorizontal, Shield, Lock, Globe, Users, Terminal, HelpCircle, LogOut, Loader2 } from "lucide-react";
import { useWalletStore } from "@/lib/wallet-store";
import { AVATAR_IMAGES } from "@/lib/wallet-data";
import Avatar from "../_components/avatar";
import { useRouter } from "next/navigation";



function SettingRow({ icon: Icon, label, value, onClick }: {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  value?: string;
  onClick?: () => void;
}) {
  return (
    <button
      className="flex items-center justify-between w-full px-4 py-[15px] action-btn"
      onClick={onClick}
    >
      <div className="flex items-center gap-3.5">
        <div className="w-[22px] flex items-center justify-center">
          <Icon size={20} color="#AB9FF2" />
        </div>
        <span className="text-[15px]" style={{ color: "#FFFFFF" }}>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-sm" style={{ color: "#5C5D7A" }}>{value}</span>}
        <ChevronRight size={16} color="#3D3E59" />
      </div>
    </button>
  );
}

function Divider() {
  return <div className="h-px ml-[52px]" style={{ backgroundColor: "#2C2C2E" }} />;
}

export default function SettingsPage() {

  const {
    walletName,
    profile,
    setIsKeyVerified,
    coingeckoApiKey,
    updateCoingeckoApiKey,
    dexscreenerApiKey,
    updateDexscreenerApiKey,
    licensePlan,
    licenseExpiration,
    updateLicenseInfo
  } = useWalletStore();

  const [search, setSearch] = useState("");
  const [activationKey, setActivationKey] = useState("");
  const [currentKey, setCurrentKey] = useState("");
  const [activating, setActivating] = useState(false);
  const isActivatingRef = React.useRef(false);
  const [error, setError] = useState("");
  const router = useRouter();


  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentKey(localStorage.getItem("wallet_key") || "");
    }
  }, []);

  const performActivation = async () => {
    if (!activationKey.trim() || activating || isActivatingRef.current) return;

    setError("");
    setActivating(true);
    isActivatingRef.current = true;

    try {
      // If re-entering the same key that's already active, don't count as a new redemption
      const cleanInput = activationKey.trim().replace(/-/g, "").toUpperCase();
      const isReactivatingSameKey = cleanInput === currentKey.toUpperCase();

      const res = await fetch("/api/auth/verify-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: cleanInput,
          isRedeeming: !isReactivatingSameKey
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("wallet_key");
        }
        throw new Error(data.error || "Invalid License Key");
      }

      const cleanKey = activationKey.trim().replace(/-/g, "");
      localStorage.setItem("wallet_key", cleanKey);
      setIsKeyVerified(true);

      if (data.plan && data.expirationDate) {
        const formattedDate = new Date(data.expirationDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
        updateLicenseInfo(data.plan, formattedDate);
      }

      router.replace("/home")
    } catch (err: any) {
      if (err.message === "Key has expired") {
        router.push('/buy?error=expired');
        return;
      }
      setError(err.message || "Failed to activate license.");
      setActivating(false);
      isActivatingRef.current = false;
    }
  };

  const handleActivate = () => {
    if (!activationKey.trim() || activating || isActivatingRef.current) return;

    performActivation();
  };


  const displayName = profile.username || walletName || "rpwallet.app";

  return (
    <div className="flex flex-col min-h-full max-w-[430px] mx-auto w-full relative walkthrough-settings-page bg-[#111111] text-[#eeeeee]">
      <div className="flex-1 flex flex-col w-full relative">
        {/* Header - Sticky Matching Wallet Style */}
        <div className="flex items-center justify-between px-3 pt-[calc(8px+env(safe-area-inset-top))] pb-4 sticky top-0 z-20 backdrop-blur-md bg-[#111111] border-b border-[#1c1c1e]">
          <button
            onClick={() => router.back()}
            className="p-2 text-[#eeeeee] active:opacity-60 transition-opacity"
          >
            <ChevronLeft size={28} />
          </button>
          <div className="text-[17px] font-bold text-[#eeeeee] absolute left-1/2 -translate-x-1/2">
            Settings
          </div>
          <div className="w-[44px]" />
        </div>

        <div className="flex-1 overflow-y-auto hidden-scrollbar px-4 pb-5">
          {/* Search */}
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-4"
            style={{ backgroundColor: "#1C1C1E" }}
          >
            <Search size={16} color="#5C5D7A" />
            <input
              className="flex-1 bg-transparent text-[15px] outline-none"
              style={{ color: "#FFFFFF" }}
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Account Row */}
          <div className="rounded-[14px] overflow-hidden mb-3 walkthrough-edit-profile-btn" style={{ backgroundColor: "#1C1C1E" }}>
            <button
              className="flex items-center w-full px-4 py-3.5 action-btn"
              onClick={() => router.push("/settings/edit-profile")}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center mr-3"
                style={{ backgroundColor: "#2C2C2E" }}
              >
                <Avatar iconIndex={profile.iconIndex} avatarType={profile.avatarType} size={36} />
              </div>
              <span className="text-base font-medium flex-1 text-left" style={{ color: "#FFFFFF" }}>
                @{displayName}
              </span>
              <ChevronRight size={16} color="#3D3E59" />
            </button>
          </div>

          {/* Group 1 */}
          <div className="rounded-[14px] overflow-hidden mb-3" style={{ backgroundColor: "#1C1C1E" }}>
            <SettingRow icon={Layers} label="Manage Accounts" value="1" />
            <Divider />
            <SettingRow icon={CreditCard} label="Buy Crypto" />
            <Divider />
            <SettingRow icon={Bell} label="Notifications" value="Off" />
            <Divider />
            <SettingRow icon={SlidersHorizontal} label="Preferences" />
            <Divider />
            <SettingRow icon={Shield} label="Security & Privacy" />
            <Divider />
            <SettingRow icon={Lock} label="Show Recovery Phrase" />
          </div>

          {/* Group 2 */}
          <div className="rounded-[14px] overflow-hidden mb-3" style={{ backgroundColor: "#1C1C1E" }}>
            <SettingRow icon={Globe} label="Active Networks" value="All" />
            <Divider />
            <SettingRow icon={Users} label="Friends" value="0" />
            <Divider />
            <SettingRow icon={Layers} label="Connected Apps" />
          </div>
          {/* Group: Current Plan & Expiration */}
          <div className="mb-6" id="license-section">
            <h2 className="text-[12px] font-bold text-[#5C5D7A] uppercase tracking-widest mb-2.5 ml-1">Subscription Info</h2>
            <div className="rounded-[16px] overflow-hidden bg-[#1C1C1E] border border-white/[0.04]">
              <div className="p-4">
                {/* Expiration Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-400/10 flex items-center justify-center">
                      <Shield size={18} className="text-emerald-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-[#5C5D7A] uppercase tracking-wider">Expiration Day</span>
                      <span className="text-[15px] font-bold text-white">{licenseExpiration}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>


          </div>

          {/* Group: CoinGecko API */}
          <div className="mb-6">
            <h2 className="text-[12px] font-bold text-[#5C5D7A] uppercase tracking-widest mb-2.5 ml-1">CoinGecko API</h2>
            <div className="rounded-[16px] overflow-hidden bg-[#1C1C1E] border border-white/[0.04]">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center">
                    <Terminal size={18} className="text-[#AB9FF2]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] font-bold text-white">Custom API Key</span>
                    <span className="text-[12px] text-[#5C5D7A]">
                      Enable 10s price polling
                    </span>
                  </div>
                </div>

                <div className="relative flex items-center gap-2">
                  <input
                    type="password"
                    placeholder="CG-xxxxxxxxxxxxxxxx"
                    value={coingeckoApiKey}
                    onChange={(e) => updateCoingeckoApiKey(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl py-3.5 px-4 text-sm text-white placeholder-[#5C5D7A] outline-none focus:border-[#8B5CF6]/50 focus:bg-white/[0.05] transition-all"
                  />
                </div>
                <p className="text-[11px] text-[#5C5D7A] mt-3 leading-relaxed">
                  Enter your CoinGecko Demo or Pro API key to enable high-frequency (10s) price updates.
                </p>
              </div>
            </div>
          </div>

          {/* Group: DexScreener API */}
          <div className="mb-6">
            <h2 className="text-[12px] font-bold text-[#5C5D7A] uppercase tracking-widest mb-2.5 ml-1">DexScreener API</h2>
            <div className="rounded-[16px] overflow-hidden bg-[#1C1C1E] border border-white/[0.04]">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Layers size={18} className="text-blue-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] font-bold text-white">Enterprise API Key</span>
                    <span className="text-[12px] text-[#5C5D7A]">
                      Avoid rate limits & errors
                    </span>
                  </div>
                </div>

                <div className="relative flex items-center gap-2">
                  <input
                    type="password"
                    placeholder="DS-xxxxxxxxxxxxxxxx"
                    value={dexscreenerApiKey}
                    onChange={(e) => updateDexscreenerApiKey(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl py-3.5 px-4 text-sm text-white placeholder-[#5C5D7A] outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all"
                  />
                </div>
                <p className="text-[11px] text-[#5C5D7A] mt-3 leading-relaxed">
                  Enter your DexScreener Enterprise API key to prevent rate-limiting when importing multiple custom tokens.
                </p>
              </div>
            </div>
          </div>

          {/* Group 3 */}
          <div className="rounded-[14px] overflow-hidden mb-3" style={{ backgroundColor: "#1C1C1E" }}>
            <SettingRow icon={Terminal} label="Developer Settings" />
          </div>

          {/* Group 4 */}
          <div className="rounded-[14px] overflow-hidden mb-3" style={{ backgroundColor: "#1C1C1E" }}>
            <SettingRow icon={HelpCircle} label="Help & Support" />
          </div>


        </div>
      </div>

    </div>
  );
}

