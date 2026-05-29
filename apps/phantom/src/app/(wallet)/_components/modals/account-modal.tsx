"use client";

import React from "react";
import { X, User, Settings, Pencil, Check, Copy } from "lucide-react";
import { useWalletStore } from "@/lib/wallet-store";
import { formatCurrency, TOKEN_MAP } from "@/lib/wallet-data";
import Avatar from "../avatar";
import { toast } from "sonner";
import { useRouter } from "next/navigation";


interface AccountModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onCloseStart?: () => void;
}

export default function AccountModal({
  visible,
  onClose,
  onOpenProfile,
  onOpenSettings,
  onCloseStart,
}: AccountModalProps) {
  const {
    walletName,
    getTotalBalance,
    profile,
    cashBalance,
    baseCurrency,
    accounts,
    currentAccountIndex,
    addAccount,
    switchAccount
  } = useWalletStore();
  const router = useRouter();
  const totalBalance = getTotalBalance();

  const iconIndex = profile?.iconIndex ?? 1;
  const avatarType = profile?.avatarType ?? 'emoji';
  const displayName = profile?.username || walletName || "larperwallet.com";

  const [isClosing, setIsClosing] = React.useState(false);

  React.useEffect(() => {
    if (visible) setIsClosing(false);
  }, [visible]);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    onCloseStart?.();
    setTimeout(() => {
      onClose();
    }, 200);
  };

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-[100vh] z-[100] flex flex-col justify-end items-center sm:px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 flex-1"
        style={{
          backgroundColor: "rgba(0,0,0,0.15)",
          animation: isClosing ? "fadeOut 0.2s ease forwards" : "fadeIn 0.3s ease forwards",
        }}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        className="w-full flex flex-col rounded-t-[28px] overflow-hidden relative"
        style={{
          background: "rgb(17, 17, 17)",
          height: "94vh",
          paddingBottom: "calc(24px + env(safe-area-inset-bottom))",
          animation: isClosing
            ? "slideDown 0.2s cubic-bezier(0.32, 0.72, 0, 1) forwards"
            : "slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards",
          willChange: "transform",
        }}
      >

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Avatar iconIndex={iconIndex} avatarType={avatarType} size={40} />
            <div>
              <div className="text-white font-bold text-base">{displayName}</div>
              <button
                onClick={() => {
                  if (profile?.walletAddress) {
                    navigator.clipboard.writeText(profile.walletAddress);
                    toast.success("Address copied to clipboard");
                  }
                }}
                className="flex items-center gap-1.5 text-[#888888] text-[12px] hover:text-[#AB9FF2] transition-colors active:scale-95"
              >
                {profile?.walletAddress ? `${profile.walletAddress.slice(0, 4)}...${profile.walletAddress.slice(-4)}` : "No address"}
                <Copy size={12} />
              </button>
            </div>

          </div>
          <button
            onClick={handleClose}
            className="bg-transparent border-none p-2 cursor-pointer z-10 rounded-full active:bg-white/5 transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#eeeeee" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Grid of Profile and Settings */}
        <div className="grid grid-cols-2 gap-3 px-4 mb-5 flex-shrink-0">
          <button onClick={() => { handleClose(); onOpenProfile(); }} className="flex flex-col items-center justify-center gap-2 bg-[#232323] rounded-[18px] py-3 active:scale-[0.95] transition-transform duration-[50ms]">
            <User size={20} color="#ac9cf2" strokeWidth={2} />
            <span className="text-sm" style={{ color: "rgb(136, 136, 136)" }}>Profile</span>
          </button>
          <button onClick={() => { handleClose(); onOpenSettings(); }} className="flex flex-col items-center justify-center gap-2 bg-[#232323] rounded-[18px] py-3 active:scale-[0.95] transition-transform duration-[50ms]">
            <Settings size={20} color="#ac9cf2" strokeWidth={2} />
            <span className="text-sm" style={{ color: "rgb(136, 136, 136)" }}>Settings</span>
          </button>
        </div>

        {/* Cash Balance */}
        <div className="px-4 mb-5 flex-shrink-0">
          <div className="rounded-[18px] px-4 py-2.5 flex items-center justify-between" style={{ background: "rgb(30, 30, 30)" }}>
            <div>
              <div className="text-[#888888] text-xs mb-1">Cash Balance</div>
              <div className="text-white font-bold text-lg">{formatCurrency(cashBalance, baseCurrency)}</div>
            </div>
            <button
              onClick={() => { handleClose(); router.push('/settings/edit-profile?highlight=cash'); }}
              className="px-4 py-2 rounded-xl font-bold text-sm active:scale-[0.95] transition-transform duration-100"
              style={{ background: "rgb(172, 156, 242)", color: "rgb(17, 17, 17)" }}
            >
              Add Cash
            </button>
          </div>
        </div>

        {/* Your Accounts Area */}
        <div className="px-4 flex-1 overflow-y-auto" style={{ overscrollBehavior: "contain" }}>
          <div className="text-white font-bold text-lg mb-3">Your Accounts</div>
          <div className="flex flex-col gap-1">
            {accounts.map((account, index) => {
              const isActive = index === currentAccountIndex;
              const accDisplayName = account.profile?.username || account.walletName || "Account";

              // Calculate balance for this account
              const accTotalBalance = account.tokenBalances.reduce((total, b) => {
                const token = TOKEN_MAP[b.symbol];
                return total + (token ? b.balance * token.price : 0);
              }, 0) + account.cashBalance;

              return (
                <div
                  key={account.id}
                  onClick={() => {
                    if (!isActive) {
                      switchAccount(index);
                      toast.success(`Switched to ${accDisplayName}`);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-2 py-3 rounded-2xl cursor-pointer transition-all active:scale-[0.98] ${isActive ? 'bg-[#232323]' : 'hover:bg-[#1a1a1a] active:opacity-70'}`}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar
                      iconIndex={account.avatarIconIndex || account.profile.iconIndex}
                      avatarType={account.profile.avatarType}
                      size={44}
                    />
                    {isActive && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#ac9cf2] flex items-center justify-center">
                        <Check size={9} color="white" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-white font-semibold text-sm">{accDisplayName}</div>
                    <div className="text-[#888888] text-xs">{formatCurrency(accTotalBalance, baseCurrency)}</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isActive) {
                        handleClose();
                        onOpenProfile();
                      } else {
                        switchAccount(index);
                      }
                    }}
                    className="w-8 h-8 rounded-lg bg-pt-bg flex items-center justify-center active:opacity-60"
                  >
                    {isActive ? (
                      <Pencil size={13} strokeWidth={2} style={{ color: "rgb(136, 136, 136)" }} />
                    ) : (
                      <Check size={13} strokeWidth={2} className="text-[#888888] opacity-0 group-hover:opacity-100" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add Account Button Floor */}
        <div className="px-4 pt-4 pb-4 flex-shrink-0">
          <button
            onClick={() => {
              addAccount();
              toast.success("New account added");
            }}
            className="w-full bg-[#ac9cf2] rounded-[18px] py-4 flex items-center justify-center transition-transform duration-100 active:scale-[0.97]"
          >
            <span className="text-[#0c0c0c] font-bold text-base">Add Account</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes slideDown {
          from { transform: translateY(0); }
          to { transform: translateY(100%); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
