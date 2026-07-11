"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ChevronLeft, Trash2, Pencil, RefreshCw, Bell, Check, Search, Plus, Loader2 } from "lucide-react";
import { useWalletStore, type UserProfile, DEFAULT_NOTIFICATION_SETTINGS } from "@/lib/wallet-store";
import { AVATAR_ICONS, AVATAR_IMAGES, TOKENS, type TokenInfo } from "@/lib/wallet-data";
import TokenLogo from "../../_components/token-logo";
import Avatar from "../../_components/avatar";
import { useRouter, useSearchParams } from "next/navigation";
import { useLivePrices } from "@/hooks/useLivePrices";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  clearBackendWalletTransactions,
  createBackendWalletTransaction,
  deleteBackendWalletTransaction,
  updateBackendNotificationSettings,
  updateBackendWalletState,
} from "@/lib/backend-wallet";
import { requestNotificationPermission } from "@/lib/notifications";
import { appEnv } from "@/app-env";

interface SearchResult {
  id: string;
  name: string;
  symbol: string;
  market_cap_rank: number | null;
  thumb: string;
  large: string;
  chainId?: string;
}

const generateRealisticAddress = () => {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < 44; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

const normalizeNotificationSettings = (settings: typeof DEFAULT_NOTIFICATION_SETTINGS) =>
  JSON.stringify({
    ...settings,
    coins: [...(settings.coins || [])].map((coin) => ({
      ...coin,
      symbol: coin.symbol.toUpperCase(),
    })).sort((a, b) => a.symbol.localeCompare(b.symbol)),
  });

const prepareRunnableNotificationSettings = (settings: typeof DEFAULT_NOTIFICATION_SETTINGS) => {
  const totalTimes = Math.max(0, Number(settings.totalTimes) || 0);

  return {
    ...settings,
    totalTimes,
    remainingTimes: settings.isActive
      ? Math.max(Number(settings.remainingTimes) || 0, totalTimes)
      : Math.max(0, Number(settings.remainingTimes) || 0),
  };
};

// Removed PwaGate import

function EditProfileContent() {
  const {
    profile,
    tokenBalances,
    walletName,
    updateProfile,
    updateWalletName,
    updateAllBalances,
    cashBalance,
    updateCashBalance,
    boostConfig,
    updateBoostConfig,
    notificationSettings,
    updateNotificationSettings,
    transactions,
    deleteTransaction,
    clearTransactions,
    baseCurrency,
    updateBaseCurrency,
    customTokens,
    addCustomToken,
    removeCustomToken,
    dexscreenerApiKey
  } = useWalletStore();

  const router = useRouter();
  const searchParams = useSearchParams();
  const highlight = searchParams.get("highlight");
  const { prices } = useLivePrices();

  const [localProfile, setLocalProfile] = useState<UserProfile>(profile);
  const [localWalletName, setLocalWalletName] = useState(walletName);
  const [localCashBalance, setLocalCashBalance] = useState(cashBalance.toString());
  const [localBoostConfig, setLocalBoostConfig] = useState(boostConfig);
  const [localNotificationSettings, setLocalNotificationSettings] = useState(notificationSettings || DEFAULT_NOTIFICATION_SETTINGS);
  const [localBaseCurrency, setLocalBaseCurrency] = useState(baseCurrency);
  const [avatarTab, setAvatarTab] = useState<'emojis' | 'avatars'>(profile.avatarType === 'image' ? 'avatars' : 'emojis');

  const fakeTxRef = React.useRef<HTMLDivElement>(null);
  const tokensRef = React.useRef<HTMLDivElement>(null);

  // Combined list for dropdowns and display
  const allTokens = useMemo(() => {
    return [...TOKENS, ...customTokens];
  }, [customTokens]);

  // Fake Transaction State
  const [txType, setTxType] = useState<'receive' | 'send'>('receive');
  const [txToken, setTxToken] = useState('SOL');
  const [txAmount, setTxAmount] = useState('');
  const [txFrom, setTxFrom] = useState('');
  const [txDate, setTxDate] = useState('');
  const [txTime, setTxTime] = useState('');

  const [localBalances, setLocalBalances] = useState<Record<string, string>>({});

  // Custom token search and import state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isImporting, setIsImporting] = useState<string | null>(null);

  // Debounced custom token search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearch = async () => {
    setSearchLoading(true);
    try {
      const url = `${appEnv.apiBaseUrl}/search?query=${encodeURIComponent(searchQuery.trim())}${dexscreenerApiKey ? `&dsKey=${encodeURIComponent(dexscreenerApiKey)}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Search failed");
      const data: unknown = await res.json();
      if (!Array.isArray(data)) throw new Error("Invalid search response");
      setSearchResults(data);
    } catch (err) {
      console.error("Search error:", err);
      toast.error("Failed to search tokens");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleImport = async (result: SearchResult) => {
    if (isImporting) return;
    setIsImporting(result.id);

    try {
      const url = `${appEnv.apiBaseUrl}/token-info?id=${encodeURIComponent(result.id)}${dexscreenerApiKey ? `&dsKey=${encodeURIComponent(dexscreenerApiKey)}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch token info");
      const tokenInfo: TokenInfo = await res.json();

      addCustomToken(tokenInfo);
      
      // Initialize local balance for this token
      setLocalBalances(prev => ({
        ...prev,
        [tokenInfo.symbol]: "0"
      }));
      
      toast.success(`${tokenInfo.name} imported successfully`);
      setSearchQuery("");
      setSearchResults([]);
    } catch (err) {
      console.error("Import error:", err);
      toast.error("Failed to import token");
    } finally {
      setIsImporting(null);
    }
  };

  const handleRemoveCustom = (symbol: string) => {
    removeCustomToken(symbol);
    setLocalBalances(prev => {
      const copy = { ...prev };
      delete copy[symbol];
      return copy;
    });
    toast.success("Token removed");
  };

  // Sync on mount only to prevent overwriting user input during background updates
  useEffect(() => {
    setLocalProfile(profile);
    setLocalWalletName(walletName);
    setLocalCashBalance(cashBalance.toString());
    setLocalBalances(
      Object.fromEntries(tokenBalances.map((b) => [b.symbol, String(b.balance)]))
    );
    setLocalBoostConfig(boostConfig);
    setLocalNotificationSettings(notificationSettings || DEFAULT_NOTIFICATION_SETTINGS);
    setLocalBaseCurrency(baseCurrency);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (notificationSettings.isActive || notificationSettings.remainingTimes > 0) return;

    setLocalNotificationSettings((prev) => (
      prev.isActive || prev.remainingTimes !== 0
        ? { ...prev, isActive: false, remainingTimes: 0 }
        : prev
    ));
  }, [notificationSettings.isActive, notificationSettings.remainingTimes]);

  // Handle URL highlighting separately
  useEffect(() => {
    if (highlight === 'send') setTxType('send');
    if (highlight === 'receive') setTxType('receive');

    if (highlight === 'send' || highlight === 'receive') {
      setTimeout(() => {
        fakeTxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } else if (highlight === 'tokens') {
      setTimeout(() => {
        tokensRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [highlight]);

  // Removed PwaGate check

  const handleSave = () => {
    // ── OPTIMISTIC LOCAL SAVE ──
    updateProfile(localProfile);
    if (localWalletName !== walletName) {
      updateWalletName(localWalletName);
    }

    const parsedCash = parseFloat(localCashBalance);
    if (!isNaN(parsedCash)) updateCashBalance(parsedCash);

    const newBalances = allTokens.map((t) => ({
      symbol: t.symbol,
      balance: parseFloat(localBalances[t.symbol] ?? "0") || 0,
    }));
    updateAllBalances(newBalances);
    updateBoostConfig(localBoostConfig);
    const notificationSettingsToSave = prepareRunnableNotificationSettings(localNotificationSettings);
    updateNotificationSettings(notificationSettingsToSave);
    if (normalizeNotificationSettings(notificationSettingsToSave) !== normalizeNotificationSettings(notificationSettings || DEFAULT_NOTIFICATION_SETTINGS)) {
      updateBackendNotificationSettings(notificationSettingsToSave).catch((err) => {
        console.error("Notification settings persist failed:", err);
      });
    }
    updateBaseCurrency(localBaseCurrency);

    updateBackendWalletState({
      accountAddress: localProfile.walletAddress,
      accountName: localWalletName,
      accountUsername: localProfile.username,
      balances: newBalances.map((balance) => ({
        amount: String(balance.balance),
        tokenSymbol: balance.symbol,
      })),
      profile: {
        displayName: localWalletName,
      },
    }).catch((err) => {
      console.error("Wallet state persist failed:", err);
      toast.error(err instanceof Error ? err.message : "Saved locally, but backend sync failed.");
    });

    router.push("/home");
  };

  const handleAddTransaction = async () => {
    const amount = parseFloat(txAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }

    try {
      const createdAt = txDate ? new Date(`${txDate}T${txTime || '12:00'}:00`).toISOString() : undefined;
      await createBackendWalletTransaction({
        type: txType,
        tokenSymbol: txToken,
        amount: String(amount),
        fromAddress: txType === 'receive' ? (txFrom || 'External Wallet') : profile.walletAddress,
        toAddress: txType === 'send' ? (txFrom || 'External Wallet') : profile.walletAddress,
        createdAt,
      });
    } catch {
      toast.error("Unable to add transaction. Check the balance and backend session.");
      return;
    }

    setLocalBalances(prev => {
      const currentVal = parseFloat(prev[txToken] || "0");
      let newVal = currentVal;
      if (txType === 'receive') newVal += amount;
      else if (txType === 'send') newVal = Math.max(0, newVal - amount);

      return {
        ...prev,
        [txToken]: String(newVal)
      };
    });

    setTxAmount('');
    setTxFrom('');
    setTxDate('');
    setTxTime('');
    toast.success(`Transaction Added: ${txType === 'receive' ? 'Received' : 'Sent'} ${amount} ${txToken}`);
  };

  const handleTogglePush = async () => {
    if (!localNotificationSettings.pushEnabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        toast.error("Notification permission is blocked for this browser.");
        return;
      }
      setLocalNotificationSettings((prev) => ({ ...prev, pushEnabled: true }));
    } else {
      setLocalNotificationSettings((prev) => ({ ...prev, pushEnabled: false }));
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    deleteTransaction(transactionId);
    try {
      await deleteBackendWalletTransaction(transactionId);
    } catch (error) {
      console.error("Transaction delete failed:", error);
      toast.error("Deleted locally, but backend sync failed.");
    }
  };

  const handleClearTransactions = async () => {
    clearTransactions();
    try {
      await clearBackendWalletTransactions();
      toast.success("All transactions cleared");
    } catch (error) {
      console.error("Transaction clear failed:", error);
      toast.error("Cleared locally, but backend sync failed.");
    }
  };

  const formatBalance = (val: number) => {
    if (val === 0) return "0";
    if (val < 0.001) return val.toFixed(6);
    if (val < 1) return val.toFixed(4);
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  };

  const formatCurrency = (val: number, currency: string) => {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(val);
  };

  return (
    <div className="flex flex-col h-full min-h-full max-w-[430px] mx-auto w-full relative walkthrough-edit-profile-page bg-[#111111] text-[#eeeeee]">
      <div className="flex-1 flex flex-col w-full relative">
        {/* Header - Sticky Matching Wallet Style */}
        <div className="flex items-center justify-between px-3 pt-[calc(8px+env(safe-area-inset-top))] pb-4 sticky top-0 z-20 backdrop-blur-md bg-[#111111]/90 border-b border-[#1c1c1e]">
          <button
            onClick={() => router.back()}
            className="p-2 text-[#eeeeee] active:opacity-60 transition-opacity"
          >
            <ChevronLeft size={28} />
          </button>
          <div className="text-[17px] font-bold text-[#eeeeee] absolute left-1/2 -translate-x-1/2">
            Edit Profile
          </div>
          <button
            onClick={handleSave}
            className="px-2 py-1 text-[#AB9FF2] active:opacity-60 font-semibold text-[17px] transition-opacity"
          >
            Save
          </button>
        </div>

        <div className="flex-1 overflow-y-auto hidden-scrollbar px-4 pb-12">
          {/* ── TOP AVATAR PREVIEW ── */}
          <div className="flex flex-col items-center justify-center pt-8 pb-4">
            <div className="relative">
              <div className="rounded-full overflow-hidden p-0.5 bg-[#1c1c1e] border-2 border-white/10 shadow-lg">
                <Avatar
                  iconIndex={localProfile.iconIndex}
                  avatarType={localProfile.avatarType}
                  size={96}
                  className="rounded-full"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-[#AB9FF2] p-2 rounded-full shadow-md border-2 border-[#111111] active:scale-90 transition-transform">
                <Pencil size={14} color="#111111" strokeWidth={2.5} />
              </div>
            </div>
            <h2 className="text-[18px] font-bold mt-4 text-[#eeeeee]">
              {localProfile.username ? `@${localProfile.username}` : (localWalletName || "Account 1")}
            </h2>
          </div>

          {/* ── ICON SELECTOR ── */}
          <p className="text-[12px] font-semibold text-[#8b8ca7] uppercase tracking-wider ml-1 mb-2 mt-5">
            Icon
          </p>
          <div className="rounded-[16px] bg-[#1c1c1e] p-3 shadow-md">
            {/* Sliding segment tabs using Solid colors */}
            <div className="flex bg-[#2c2c2e] p-1 rounded-xl mb-4 relative h-[38px] border border-white/5">
              <div
                className="absolute top-1 bottom-1 rounded-lg bg-[#1c1c1e] transition-all duration-200 shadow-sm"
                style={{
                  left: avatarTab === 'emojis' ? '4px' : 'calc(50% + 2px)',
                  width: 'calc(50% - 6px)',
                }}
              />
              <button
                onClick={() => setAvatarTab('emojis')}
                className={`flex-1 flex items-center justify-center text-xs font-bold transition-colors z-10 ${avatarTab === 'emojis' ? 'text-white' : 'text-[#8b8ca7]'}`}
              >
                EMOJIS
              </button>
              <button
                onClick={() => setAvatarTab('avatars')}
                className={`flex-1 flex items-center justify-center text-xs font-bold transition-colors z-10 ${avatarTab === 'avatars' ? 'text-white' : 'text-[#8b8ca7]'}`}
              >
                AVATARS
              </button>
            </div>

            <div className="flex flex-wrap gap-2 p-1 max-h-[220px] overflow-y-auto hidden-scrollbar">
              {avatarTab === 'emojis' ? (
                AVATAR_ICONS.map((emoji, idx) => {
                  const isSelected = localProfile.iconIndex === idx && localProfile.avatarType === 'emoji';
                  return (
                    <button
                      key={idx}
                      className={`w-[46px] h-[46px] rounded-xl flex items-center justify-center transition-all duration-200 active:scale-90 relative ${isSelected ? 'bg-[#AB9FF2] text-[#111111]' : 'bg-[#2c2c2e] text-white'}`}
                      onClick={() => setLocalProfile((p) => ({ ...p, iconIndex: idx, avatarType: 'emoji' }))}
                    >
                      <span className="text-[22px] select-none">{emoji}</span>
                      {isSelected && (
                        <div className="absolute -top-0.5 -right-0.5 bg-white text-[#AB9FF2] rounded-full p-0.5 shadow-sm">
                          <Check size={8} strokeWidth={4} />
                        </div>
                      )}
                    </button>
                  );
                })
              ) : (
                AVATAR_IMAGES.map((img, idx) => {
                  const isSelected = localProfile.iconIndex === idx && localProfile.avatarType === 'image';
                  return (
                    <button
                      key={idx}
                      className={`w-[46px] h-[46px] rounded-xl flex items-center justify-center overflow-hidden transition-all duration-200 active:scale-90 relative bg-[#2c2c2e] ${isSelected ? 'ring-2 ring-[#AB9FF2]' : ''}`}
                      onClick={() => setLocalProfile((p) => ({ ...p, iconIndex: idx, avatarType: 'image' }))}
                    >
                      <Avatar iconIndex={idx} avatarType="image" size={46} className="rounded-none" />
                      {isSelected && (
                        <div className="absolute -top-0.5 -right-0.5 bg-[#AB9FF2] text-[#111111] rounded-full p-0.5 shadow-sm z-10">
                          <Check size={8} strokeWidth={4} />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ── PROFILE SECTION ── */}
          <p className="text-[12px] font-semibold text-[#8b8ca7] uppercase tracking-wider ml-1 mb-2 mt-5">
            Profile
          </p>
          <div className="rounded-[16px] bg-[#1c1c1e] shadow-md overflow-hidden">
            {/* Username row */}
            <div className="relative h-[52px] flex items-center justify-between px-4">
              <span className="text-[15px] text-[#8b8ca7]">Username</span>
              <div className="flex items-center gap-1">
                <span className="text-[15px] text-[#8b8ca7]">@</span>
                <input
                  className="bg-transparent text-[15px] font-medium text-right outline-none text-white w-[160px] focus:text-[#AB9FF2] transition-colors placeholder-[#555555]"
                  value={localProfile.username}
                  onChange={(e) => setLocalProfile((p) => ({ ...p, username: e.target.value.replace(/[^a-zA-Z0-9_.]/g, "") }))}
                  placeholder="username"
                />
              </div>
            </div>

            <div className="h-px bg-[#2c2c2e] ml-4" />

            {/* Account Name row */}
            <div className="relative h-[52px] flex items-center justify-between px-4">
              <span className="text-[15px] text-[#8b8ca7]">Account Name</span>
              <input
                className="bg-transparent text-[15px] font-medium text-right outline-none text-white w-[180px] focus:text-[#AB9FF2] transition-colors placeholder-[#555555]"
                value={localWalletName}
                onChange={(e) => setLocalWalletName(e.target.value)}
                placeholder="Account 1"
              />
            </div>

            <div className="h-px bg-[#2c2c2e] ml-4" />

            {/* Wallet Address row */}
            <div className="relative flex flex-col px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[15px] text-[#8b8ca7]">Wallet Address</span>
                <button
                  onClick={() => setLocalProfile(p => ({ ...p, walletAddress: generateRealisticAddress() }))}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#AB9FF2] hover:opacity-80 transition-opacity uppercase tracking-wider"
                >
                  <RefreshCw size={11} strokeWidth={2.5} />
                  Generate
                </button>
              </div>
              <input
                className="bg-transparent text-[13px] font-mono outline-none w-full border-b border-[#2c2c2e] pb-1 text-white focus:border-[#AB9FF2]/50 transition-colors"
                value={localProfile.walletAddress}
                onChange={(e) => setLocalProfile((p) => ({ ...p, walletAddress: e.target.value }))}
                placeholder="Enter wallet address..."
              />
            </div>
          </div>

          {/* ── BIO ── */}
          <p className="text-[12px] font-semibold text-[#8b8ca7] uppercase tracking-wider ml-1 mb-2 mt-5">
            Bio
          </p>
          <div className="rounded-[16px] bg-[#1c1c1e] shadow-md p-4">
            <textarea
              className="w-full bg-transparent text-[15px] min-h-[80px] resize-none outline-none text-white placeholder-[#555555] focus:text-white transition-colors"
              placeholder="Tell people about yourself..."
              value={localProfile.bio}
              onChange={(e) => setLocalProfile((p) => ({ ...p, bio: e.target.value }))}
            />
          </div>

          {/* ── CONTACT & SOCIALS ── */}
          <p className="text-[12px] font-semibold text-[#8b8ca7] uppercase tracking-wider ml-1 mb-2 mt-5">
            Contact & Socials
          </p>
          <div className="rounded-[16px] bg-[#1c1c1e] shadow-md overflow-hidden">
            <div className="flex h-[52px] items-center justify-between px-4">
              <span className="text-[15px] text-[#8b8ca7]">Email</span>
              <input
                className="bg-transparent text-[15px] text-right outline-none text-white w-[180px] focus:text-[#AB9FF2] transition-colors placeholder-[#555555]"
                placeholder="you@email.com"
                value={localProfile.email}
                onChange={(e) => setLocalProfile((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div className="h-px bg-[#2c2c2e] ml-4" />
            <div className="flex h-[52px] items-center justify-between px-4">
              <span className="text-[15px] text-[#8b8ca7]">Twitter / X</span>
              <input
                className="bg-transparent text-[15px] text-right outline-none text-white w-[180px] focus:text-[#AB9FF2] transition-colors placeholder-[#555555]"
                placeholder="@handle"
                value={localProfile.twitter}
                onChange={(e) => setLocalProfile((p) => ({ ...p, twitter: e.target.value }))}
              />
            </div>
            <div className="h-px bg-[#2c2c2e] ml-4" />
            <div className="flex h-[52px] items-center justify-between px-4">
              <span className="text-[15px] text-[#8b8ca7]">Discord</span>
              <input
                className="bg-transparent text-[15px] text-right outline-none text-white w-[180px] focus:text-[#AB9FF2] transition-colors placeholder-[#555555]"
                placeholder="username#0000"
                value={localProfile.discord}
                onChange={(e) => setLocalProfile((p) => ({ ...p, discord: e.target.value }))}
              />
            </div>
          </div>

          {/* ── CURRENCY ── */}
          <p className="text-[12px] font-semibold text-[#8b8ca7] uppercase tracking-wider ml-1 mb-2 mt-5">
            Currency
          </p>
          <div className="rounded-[16px] bg-[#1c1c1e] shadow-md overflow-hidden">
            <div className="flex h-[52px] items-center justify-between px-4">
              <span className="text-[15px] text-[#8b8ca7]">Base Currency</span>
              <select
                className="bg-[#2c2c2e] text-[#AB9FF2] text-sm font-bold px-3 py-1.5 rounded-lg border border-white/5 outline-none cursor-pointer hover:bg-[#3a3a3c] transition-colors"
                value={localBaseCurrency}
                onChange={(e) => setLocalBaseCurrency(e.target.value)}
              >
                {['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CNY', 'INR'].map(curr => (
                  <option key={curr} value={curr} style={{ color: "black" }}>{curr}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── CASH BALANCE ── */}
          <div className="relative">
            <p className="text-[12px] font-semibold text-[#8b8ca7] uppercase tracking-wider ml-1 mb-2 mt-5">
              Cash Balance
            </p>
            <motion.div
              animate={highlight === "cash" ? {
                borderColor: ["rgba(255,255,255,0.05)", "rgba(171, 159, 242, 0.8)", "rgba(255,255,255,0.05)"]
              } : {}}
              transition={{ duration: 1.5, repeat: 3 }}
              className="rounded-[16px] bg-[#1c1c1e] shadow-md overflow-hidden p-4 flex items-center justify-between border border-transparent"
            >
              <span className="text-[15px] text-[#8b8ca7]">Cash ({localBaseCurrency})</span>
              <input
                className="text-[15px] font-bold text-right rounded-lg px-3 py-1.5 w-[130px] bg-[#2c2c2e] text-white outline-none border border-transparent focus:border-[#AB9FF2]/40 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                type="number"
                autoFocus={highlight === "cash"}
                value={localCashBalance}
                onChange={(e) => setLocalCashBalance(e.target.value)}
              />
            </motion.div>
            {highlight === "cash" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute -right-1 -top-1 bg-[#AB9FF2] text-[#111111] text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm z-10"
              >
                EDIT HERE
              </motion.div>
            )}
          </div>

          {/* ── TOKEN HOLDINGS ── */}
          <div className="relative">
            <p className="text-[12px] font-semibold text-[#8b8ca7] uppercase tracking-wider ml-1 mb-2 mt-5">
              Token Holdings
            </p>
            <motion.div
              ref={tokensRef}
              animate={highlight === "tokens" ? {
                borderColor: ["rgba(255,255,255,0.05)", "rgba(171, 159, 242, 0.8)", "rgba(255,255,255,0.05)"]
              } : {}}
              transition={{ duration: 1.5, repeat: 3 }}
              className="rounded-[16px] bg-[#1c1c1e] shadow-md overflow-hidden border border-transparent"
            >
              {allTokens.map((token, idx) => {
                const isCustom = !TOKENS.some(t => t.symbol === token.symbol);
                return (
                  <React.Fragment key={token.symbol}>
                    <div className="flex items-center gap-3 px-4 py-3 h-[58px]">
                      <TokenLogo token={token} size={30} liveImage={prices[token.symbol]?.image} />
                      <span className="text-[15px] font-semibold text-white flex-1 truncate">
                        {token.name}
                      </span>
                      {isCustom && (
                        <button
                          onClick={() => handleRemoveCustom(token.symbol)}
                          className="text-[#F80633] active:opacity-60 p-1.5 rounded-lg bg-[#2c2c2e] hover:bg-[#3a3a3c] transition-colors flex-shrink-0"
                          title="Remove custom token"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      <input
                        className="text-[15px] font-bold text-right rounded-lg px-3 py-1.5 w-[110px] bg-[#2c2c2e] text-white outline-none border border-transparent focus:border-[#AB9FF2]/40 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        type="number"
                        autoFocus={highlight === "tokens" && idx === 0}
                        value={localBalances[token.symbol] ?? "0"}
                        onChange={(e) =>
                          setLocalBalances((prev) => ({ ...prev, [token.symbol]: e.target.value }))
                        }
                      />
                    </div>
                    {idx < allTokens.length - 1 && (
                      <div className="h-px bg-[#2c2c2e] ml-12" />
                    )}
                  </React.Fragment>
                );
              })}

              {/* Divider before import section */}
              <div className="h-px bg-[#2c2c2e]" />

              {/* Search & Import Tokens Sub-Section */}
              <div className="p-4 bg-[#232326]">
                <div className="text-[12px] font-bold text-[#8b8ca7] uppercase tracking-wider mb-2.5">
                  Search & Import Tokens
                </div>
                <div className="flex items-center gap-2 bg-[#1c1c1e] rounded-xl px-3 py-2 border border-white/5 focus-within:border-[#AB9FF2]/30 transition-all">
                  <Search size={15} className="text-[#8b8ca7] flex-shrink-0" />
                  <input
                    className="flex-1 bg-transparent text-[13px] outline-none text-white placeholder-[#5c5d7a]"
                    placeholder="Search token name or symbol..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchLoading && <Loader2 size={14} className="animate-spin text-[#AB9FF2] flex-shrink-0" />}
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto hidden-scrollbar pt-3 mt-2 border-t border-[#2c2c2e]">
                    {searchResults.map((result) => {
                      const isAlreadyImported = allTokens.some(
                        (t) => t.coingeckoId === result.id || t.symbol.toLowerCase() === result.symbol.toLowerCase()
                      );
                      return (
                        <div key={result.id} className="flex items-center justify-between py-1.5 border-b border-[#2c2c2e]/30 last:border-0">
                          <div className="flex items-center gap-2 min-w-0">
                            {result.thumb ? (
                              <img src={result.thumb} alt={result.name} className="w-6 h-6 rounded-full flex-shrink-0" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-[#1c1c1e] flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                {result.symbol.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="flex flex-col min-w-0">
                              <span className="text-[12px] font-semibold text-white truncate leading-tight">{result.name}</span>
                              <span className="text-[10px] text-[#8b8ca7] uppercase font-bold mt-0.5 leading-none">{result.symbol}</span>
                            </div>
                          </div>
                          <button
                            disabled={isAlreadyImported || isImporting === result.id}
                            onClick={() => handleImport(result)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                              isAlreadyImported
                                ? "bg-[#102A1E] text-[#4FE862] cursor-default"
                                : "bg-[#AB9FF2] text-[#111111] active:scale-95 hover:opacity-90"
                            }`}
                          >
                            {isImporting === result.id ? (
                              <Loader2 size={10} className="animate-spin" />
                            ) : isAlreadyImported ? (
                              <>Imported <Check size={10} strokeWidth={3.5} /></>
                            ) : (
                              <><Plus size={10} strokeWidth={3.5} /> Import</>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {searchQuery.trim().length >= 2 && searchResults.length === 0 && !searchLoading && (
                  <p className="text-[11px] text-center text-[#8b8ca7] pt-3">No tokens found matching "{searchQuery}"</p>
                )}
              </div>
            </motion.div>
            {highlight === "tokens" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute -right-1 -top-1 bg-[#AB9FF2] text-[#111111] text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm z-10"
              >
                EDIT HERE
              </motion.div>
            )}
          </div>

          {/* ── CREATE FAKE TRANSACTION ── */}
          <p className="text-[12px] font-semibold text-[#8b8ca7] uppercase tracking-wider ml-1 mb-2 mt-5">
            Create Fake Transaction
          </p>
          <motion.div
            ref={fakeTxRef}
            animate={(highlight === "send" || highlight === "receive") ? {
              borderColor: ["rgba(255,255,255,0.05)", "rgba(171, 159, 242, 0.8)", "rgba(255,255,255,0.05)"]
            } : {}}
            transition={{ duration: 1.5, repeat: 3 }}
            className="rounded-[16px] bg-[#1c1c1e] shadow-md overflow-hidden relative border border-transparent"
          >
            <div className="flex h-[52px] items-center justify-between px-4">
              <span className="text-[15px] text-[#8b8ca7]">Type</span>
              <div className="flex bg-[#2c2c2e] rounded-lg p-0.5 h-[32px] border border-white/5">
                <button
                  className={`px-3 rounded-md text-xs font-semibold transition-all ${txType === 'receive' ? 'bg-[#1c1c1e] text-[#4FE862]' : 'text-[#8b8ca7]'}`}
                  onClick={() => setTxType('receive')}
                >
                  Receive
                </button>
                <button
                  className={`px-3 rounded-md text-xs font-semibold transition-all ${txType === 'send' ? 'bg-[#1c1c1e] text-[#AB9FF2]' : 'text-[#8b8ca7]'}`}
                  onClick={() => setTxType('send')}
                >
                  Send
                </button>
              </div>
            </div>
            <div className="h-px bg-[#2c2c2e] ml-4" />

            <div className="flex h-[52px] items-center justify-between px-4">
              <span className="text-[15px] text-[#8b8ca7]">Token Symbol</span>
              <select
                className="bg-[#2c2c2e] text-white text-sm font-bold px-3 py-1.5 rounded-lg border border-white/5 outline-none cursor-pointer"
                value={txToken}
                onChange={(e) => setTxToken(e.target.value)}
              >
                {allTokens.map(t => (
                  <option key={t.symbol} value={t.symbol} style={{ color: "black" }}>{t.symbol}</option>
                ))}
              </select>
            </div>
            <div className="h-px bg-[#2c2c2e] ml-4" />

            <div className="flex h-[52px] items-center justify-between px-4">
              <span className="text-[15px] text-[#8b8ca7]">Amount</span>
              <input
                className="bg-transparent text-[15px] font-semibold text-right outline-none text-white w-[160px] focus:text-[#AB9FF2] transition-colors placeholder-[#555555] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                type="number"
                placeholder="0.00"
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
              />
            </div>
            <div className="h-px bg-[#2c2c2e] ml-4" />

            <div className="flex h-[52px] items-center justify-between px-4">
              <span className="text-[15px] text-[#8b8ca7]">Date (Optional)</span>
              <input
                className="bg-transparent text-[14px] font-semibold text-right outline-none text-white w-[180px] focus:text-[#AB9FF2] transition-colors [color-scheme:dark]"
                type="date"
                max={new Date().toISOString().split('T')[0]}
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
              />
            </div>
            <div className="h-px bg-[#2c2c2e] ml-4" />

            <div className="flex h-[52px] items-center justify-between px-4">
              <span className="text-[15px] text-[#8b8ca7]">Time (Optional)</span>
              <input
                className="bg-transparent text-[14px] font-semibold text-right outline-none text-white w-[180px] focus:text-[#AB9FF2] transition-colors [color-scheme:dark]"
                type="time"
                value={txTime}
                onChange={(e) => setTxTime(e.target.value)}
              />
            </div>
            <div className="h-px bg-[#2c2c2e] ml-4" />

            <div className="flex flex-col px-4 py-3">
              <span className="text-[15px] text-[#8b8ca7] mb-2">{txType === 'receive' ? 'From' : 'To'} Address</span>
              <input
                className="bg-transparent text-[13px] font-mono outline-none w-full border-b border-[#2c2c2e] pb-1 text-white focus:border-[#AB9FF2]/50 transition-colors placeholder-[#555555]"
                placeholder="Wallet Address..."
                value={txFrom}
                onChange={(e) => setTxFrom(e.target.value)}
              />
            </div>

            <div className="p-3">
              <button
                className="w-full py-3 rounded-xl bg-[#AB9FF2] active:scale-[0.98] transition-transform text-[#111111] font-bold text-[15px] shadow-sm flex items-center justify-center"
                onClick={handleAddTransaction}
              >
                Add Transaction
              </button>
            </div>
            {(highlight === "send" || highlight === "receive") && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute -right-1 -top-1 bg-[#AB9FF2] text-[#111111] text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm z-10"
              >
                CREATE HERE
              </motion.div>
            )}
          </motion.div>

          {/* ── YOUR TRANSACTIONS ── */}
          <div className="mt-5">
            <div className="flex items-center justify-between ml-1 mb-2">
              <div className="text-[#888888] text-[12px] font-semibold uppercase tracking-wider">Your Transactions</div>
              {transactions.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm("Are you sure you want to clear all transactions?")) {
                      void handleClearTransactions();
                    }
                  }}
                  className="text-[11px] font-bold text-[#F80633] active:opacity-60 uppercase tracking-wider flex items-center gap-1"
                >
                  Clear All
                </button>
              )}
            </div>
            <div className="bg-[#1c1c1e] shadow-md rounded-[16px] overflow-hidden divide-y divide-[#2c2c2e]">
              {transactions.length === 0 ? (
                <div className="px-4 py-8 text-center text-[#8b8ca7] text-[15px] font-medium">No transactions yet</div>
              ) : (
                transactions.slice(0, 10).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between gap-3 px-4 py-3 h-[60px]">
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-[15px] font-bold">
                        <span className={tx.type === 'receive' ? 'text-[#4FE862]' : tx.type === 'swap' ? 'text-[#AB9FF2]' : 'text-[#F80633]'}>
                          {tx.type === 'receive' ? '+' : tx.type === 'swap' ? '' : '-'}{tx.amount} {tx.token}
                        </span>
                      </div>
                      <div className="text-[#8b8ca7] text-xs font-semibold mt-0.5 capitalize">
                        {tx.type} · {formatDate(tx.timestamp)}
                      </div>
                    </div>
                    <button
                      onClick={() => void handleDeleteTransaction(tx.id)}
                      className="text-[#F80633] active:opacity-60 p-2 rounded-xl bg-[#2c2c2e] hover:bg-[#3a3a3c] transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>
            {transactions.length > 10 && (
              <p className="text-center text-[10px] text-[#8b8ca7] mt-2 italic">Showing last 10 transactions</p>
            )}
          </div>

          {/* ── REFRESH BOOST ── */}
          <p className="text-[12px] font-semibold text-[#8b8ca7] uppercase tracking-wider ml-1 mb-2 mt-5">
            Refresh Boost (Auto-Balance)
          </p>
          <div className="rounded-[16px] bg-[#1c1c1e] shadow-md overflow-hidden relative">

            <div className="flex h-[52px] items-center justify-between px-4">
              <span className="text-[15px] text-[#8b8ca7]">Enabled</span>
              <button
                onClick={() => setLocalBoostConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                className="w-[50px] h-[28px] rounded-full p-1 transition-colors duration-200 relative border border-white/5"
                style={{
                  backgroundColor: localBoostConfig.enabled ? "#AB9FF2" : "#2c2c2e"
                }}
              >
                <div
                  className={`w-5 h-5 rounded-full shadow-sm transition-transform duration-200 ${localBoostConfig.enabled ? 'bg-[#111111] translate-x-[22px]' : 'bg-white translate-x-0'}`}
                />
              </button>
            </div>
            <div className="h-px bg-[#2c2c2e] ml-4" />

            <div className="flex h-[52px] items-center justify-between px-4">
              <span className="text-[15px] text-[#8b8ca7]">Token</span>
              <select
                className="bg-[#2c2c2e] text-white text-sm font-bold px-3 py-1.5 rounded-lg border border-white/5 outline-none cursor-pointer"
                value={localBoostConfig.tokenSymbol}
                onChange={(e) => setLocalBoostConfig(prev => ({ ...prev, tokenSymbol: e.target.value }))}
              >
                {allTokens.map(t => (
                  <option key={t.symbol} value={t.symbol} style={{ color: "black" }}>{t.symbol}</option>
                ))}
              </select>
            </div>
            <div className="h-px bg-[#2c2c2e] ml-4" />

            <div className="flex h-[52px] items-center justify-between px-4">
              <span className="text-[15px] text-[#8b8ca7]">Increase Range</span>
              <div className="flex items-center gap-1.5">
                <input
                  className="bg-[#2c2c2e] text-white text-xs font-bold text-center outline-none w-14 py-1.5 rounded-lg border border-white/5"
                  type="number"
                  step="0.01"
                  value={localBoostConfig.minIncrease}
                  onChange={(e) => setLocalBoostConfig(prev => ({ ...prev, minIncrease: parseFloat(e.target.value) || 0 }))}
                />
                <span className="text-[#8b8ca7] text-xs font-bold">to</span>
                <input
                  className="bg-[#2c2c2e] text-white text-xs font-bold text-center outline-none w-14 py-1.5 rounded-lg border border-white/5"
                  type="number"
                  step="0.01"
                  value={localBoostConfig.maxIncrease}
                  onChange={(e) => setLocalBoostConfig(prev => ({ ...prev, maxIncrease: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="h-px bg-[#2c2c2e] ml-4" />

            <div className="flex h-[52px] items-center justify-between px-4">
              <span className="text-[15px] text-[#8b8ca7]">Refresh Range</span>
              <div className="flex items-center gap-1.5">
                <input
                  className="bg-[#2c2c2e] text-white text-xs font-bold text-center outline-none w-12 py-1.5 rounded-lg border border-white/5"
                  type="number"
                  value={localBoostConfig.minRefreshes}
                  onChange={(e) => setLocalBoostConfig(prev => ({ ...prev, minRefreshes: parseInt(e.target.value) || 0 }))}
                />
                <span className="text-[#8b8ca7] text-xs font-bold">to</span>
                <input
                  className="bg-[#2c2c2e] text-white text-xs font-bold text-center outline-none w-12 py-1.5 rounded-lg border border-white/5"
                  type="number"
                  value={localBoostConfig.maxRefreshes}
                  onChange={(e) => setLocalBoostConfig(prev => ({ ...prev, maxRefreshes: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="h-px bg-[#2c2c2e] ml-4" />

            <div className="flex h-[52px] items-center justify-between px-4">
              <span className="text-[15px] text-[#8b8ca7]">Total Times</span>
              <input
                className="bg-[#2c2c2e] text-white text-xs font-bold text-center outline-none w-16 py-1.5 rounded-lg border border-white/5"
                type="number"
                value={localBoostConfig.totalTimes}
                onChange={(e) => setLocalBoostConfig(prev => ({ ...prev, totalTimes: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          {/* ── NOTIFICATION SYSTEM ── */}
          <p className="text-[12px] font-semibold text-[#8b8ca7] uppercase tracking-wider ml-1 mb-2 mt-8">
            Notification System
          </p>
          <div className="rounded-[16px] bg-[#1c1c1e] shadow-md overflow-hidden relative">

            <div className="flex h-[52px] items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-[#AB9FF2]" />
                <span className="text-[15px] text-[#8b8ca7]">Push Permissions</span>
              </div>
              <button
                onClick={handleTogglePush}
                className={`flex items-center px-3 h-[28px] rounded-lg font-bold text-xs transition-colors border ${localNotificationSettings.pushEnabled
                  ? "bg-[#102A1E] text-[#4FE862] border-[#4FE862]/30"
                  : "bg-[#2c2c2e] text-[#8b8ca7] border-white/5"
                  }`}
              >
                {localNotificationSettings.pushEnabled ? (
                  <span className="flex items-center gap-1">
                    Enabled <Check size={12} strokeWidth={3} />
                  </span>
                ) : "Disabled"}
              </button>
            </div>
            <div className="h-px bg-[#2c2c2e] ml-4" />

            <div className="flex h-[52px] items-center justify-between px-4">
              <span className="text-[15px] text-[#8b8ca7]">Status</span>
              <button
                onClick={() => setLocalNotificationSettings((prev) => {
                  const isActive = !prev.isActive;
                  const totalTimes = Math.max(0, Number(prev.totalTimes) || 0);
                  return {
                    ...prev,
                    isActive,
                    remainingTimes: isActive ? totalTimes : Math.max(0, Number(prev.remainingTimes) || 0),
                  };
                })}
                className="w-[50px] h-[28px] rounded-full p-1 transition-colors duration-200 relative border border-white/5"
                style={{
                  backgroundColor: localNotificationSettings.isActive ? "#E11D48" : "#2c2c2e"
                }}
              >
                <div
                  className={`w-5 h-5 rounded-full shadow-sm transition-transform duration-200 ${localNotificationSettings.isActive ? 'bg-white translate-x-[22px]' : 'bg-white translate-x-0'}`}
                />
              </button>
            </div>
            <div className="h-px bg-[#2c2c2e] ml-4" />

            <div className="flex h-[52px] items-center justify-between px-4">
              <span className="text-[15px] text-[#8b8ca7]">Mode</span>
              <div className="flex bg-[#2c2c2e] rounded-lg p-0.5 h-[32px] border border-white/5">
                {['Auto', 'Random', 'Fixed'].map((m) => (
                  <button
                    key={m}
                    className={`px-3 rounded-md text-xs font-semibold transition-all ${localNotificationSettings.mode === m ? 'bg-[#1c1c1e] text-[#AB9FF2]' : 'text-[#8b8ca7]'}`}
                    onClick={() => setLocalNotificationSettings(prev => ({ ...prev, mode: m as any }))}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-px bg-[#2c2c2e] ml-4" />

            <div className="flex h-[52px] items-center justify-between px-4">
              <span className="text-[15px] text-[#8b8ca7]">Frequency</span>
              <div className="flex items-center gap-1.5">
                <input
                  className="bg-[#2c2c2e] text-white text-xs font-bold text-center outline-none w-12 py-1.5 rounded-lg border border-white/5"
                  type="number"
                  value={localNotificationSettings.frequency ?? 0}
                  onChange={(e) => setLocalNotificationSettings(prev => ({ ...prev, frequency: parseInt(e.target.value) || 0 }))}
                />
                <select
                  value={localNotificationSettings.unit ?? 'sec'}
                  onChange={(e) => setLocalNotificationSettings(prev => ({ ...prev, unit: e.target.value as any }))}
                  className="bg-[#2c2c2e] text-[#AB9FF2] text-xs font-bold px-2 py-1 rounded border border-white/5 outline-none cursor-pointer"
                >
                  <option value="ms">ms</option>
                  <option value="sec">sec</option>
                  <option value="min">min</option>
                  <option value="hr">hr</option>
                </select>
              </div>
            </div>
            <div className="h-px bg-[#2c2c2e] ml-4" />

            <div className="flex h-[52px] items-center justify-between px-4">
              <span className="text-[15px] text-[#8b8ca7]">Initial Delay (sec)</span>
              <input
                className="bg-[#2c2c2e] text-white text-xs font-bold text-center outline-none w-12 py-1.5 rounded-lg border border-white/5"
                type="number"
                value={localNotificationSettings.initialDelay ?? 0}
                onChange={(e) => setLocalNotificationSettings(prev => ({ ...prev, initialDelay: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="h-px bg-[#2c2c2e] ml-4" />

            <div className="flex h-[52px] items-center justify-between px-4">
              <span className="text-[15px] text-[#8b8ca7]">Total Times</span>
              <input
                className="bg-[#2c2c2e] text-white text-xs font-bold text-center outline-none w-16 py-1.5 rounded-lg border border-white/5"
                type="number"
                value={localNotificationSettings.totalTimes ?? 0}
                onChange={(e) => setLocalNotificationSettings((prev) => {
                  const totalTimes = Math.max(0, parseInt(e.target.value) || 0);
                  return {
                    ...prev,
                    totalTimes,
                    remainingTimes: prev.isActive ? totalTimes : prev.remainingTimes,
                  };
                })}
              />
            </div>
            <div className="h-px bg-[#2c2c2e] ml-4" />

            <div className="flex flex-col px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[15px] text-[#8b8ca7]">Sender Address</span>
                <button
                  onClick={() => setLocalNotificationSettings(prev => ({ ...prev, senderAddress: generateRealisticAddress() }))}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-[#AB9FF2] hover:opacity-80 transition-opacity uppercase tracking-wider"
                >
                  <RefreshCw size={11} strokeWidth={2.5} />
                  Generate
                </button>
              </div>
              <input
                className="bg-transparent text-[13px] font-mono outline-none w-full border-b border-[#2c2c2e] pb-1 text-white focus:border-[#AB9FF2]/50 transition-colors placeholder-[#555555]"
                value={localNotificationSettings.senderAddress ?? ""}
                onChange={(e) => setLocalNotificationSettings((prev: any) => ({ ...prev, senderAddress: e.target.value }))}
                placeholder="Enter sender address..."
              />
            </div>

            {/* Coin Ranges */}
            <div className="px-4 py-4 space-y-3.5">
              <p className="text-[11px] font-bold text-[#8b8ca7] uppercase tracking-wider">Coin Ranges</p>
              {(localNotificationSettings.coins || []).map((coin: any) => (
                <div key={coin.symbol} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const updatedCoins = localNotificationSettings.coins.map((c: any) =>
                          c.symbol === coin.symbol ? { ...c, enabled: !c.enabled } : c
                        );
                        setLocalNotificationSettings({ ...localNotificationSettings, coins: updatedCoins });
                      }}
                      className={`w-[18px] h-[18px] rounded-md flex items-center justify-center border transition-all ${coin.enabled
                        ? "bg-[#AB9FF2] border-[#AB9FF2]"
                        : "bg-transparent border-white/[0.15]"
                        }`}
                    >
                      {coin.enabled && <Check size={12} color="#111111" strokeWidth={3.5} />}
                    </button>
                    <span className={`text-[13px] font-bold ${coin.enabled ? "text-white" : "text-[#5C5D7A]"}`}>
                      {coin.symbol}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={coin.min ?? 0}
                      onChange={(e) => {
                        const updatedCoins = localNotificationSettings.coins.map((c: any) =>
                          c.symbol === coin.symbol ? { ...c, min: parseFloat(e.target.value) || 0 } : c
                        );
                        setLocalNotificationSettings({ ...localNotificationSettings, coins: updatedCoins });
                      }}
                      className="w-12 bg-[#2c2c2e] border border-white/5 text-white text-center text-xs py-1 rounded-lg outline-none font-bold"
                    />
                    <span className="text-[#333333]">-</span>
                    <input
                      type="number"
                      value={coin.max ?? 0}
                      onChange={(e) => {
                        const updatedCoins = localNotificationSettings.coins.map((c: any) =>
                          c.symbol === coin.symbol ? { ...c, max: parseFloat(e.target.value) || 0 } : c
                        );
                        setLocalNotificationSettings({ ...localNotificationSettings, coins: updatedCoins });
                      }}
                      className="w-12 bg-[#2c2c2e] border border-white/5 text-white text-center text-xs py-1 rounded-lg outline-none font-bold"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="h-20" />
        </div>
      </div>
    </div>
  );
}

export default function EditProfilePage() {
  return (
    <React.Suspense fallback={null}>
      <EditProfileContent />
    </React.Suspense>
  );
}
