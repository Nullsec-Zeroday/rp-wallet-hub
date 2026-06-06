"use client";

import React from "react";
import { X, User, Settings, Pencil, Check, Copy, Plus } from "lucide-react";
import { useWalletStore } from "@/lib/wallet-store";
import { formatCurrency, TOKEN_MAP } from "@/lib/wallet-data";
import Avatar from "../avatar";
import { toast } from "sonner";


interface AccountModalProps {
  visible: boolean;
  onClose: () => void;
  onAddAccount: () => boolean;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onCloseStart?: () => void;
}

export default function AccountModal({
  visible,
  onClose,
  onAddAccount,
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
    switchAccount
  } = useWalletStore();
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
          background: "rgb(0, 0, 0)",
          height: "94vh",
          paddingBottom: "calc(24px + env(safe-area-inset-bottom))",
          animation: isClosing
            ? "slideDown 0.2s cubic-bezier(0.32, 0.72, 0, 1) forwards"
            : "slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards",
          willChange: "transform",
        }}
      >
        {/* Drag Handle */}
        <div className="w-full flex justify-center pt-3 pb-3">
          <div className="w-9 h-[5px] bg-[#333333] rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-4 flex-shrink-0 relative">
          <button
            onClick={handleClose}
            className="w-[36px] h-[36px] rounded-full bg-[#1c1c1e] flex items-center justify-center active:scale-95 transition-transform"
          >
            <X size={18} color="#fff" />
          </button>
          <div className="text-white font-semibold text-[17px] absolute left-1/2 -translate-x-1/2">
            Your Accounts
          </div>
          <button
            onClick={() => {
              if (onAddAccount()) {
                toast.success("New account added");
              }
            }}
            className="w-[36px] h-[36px] rounded-full bg-[#1c1c1e] flex items-center justify-center active:scale-95 transition-transform"
          >
            <Plus size={18} color="#fff" />
          </button>
        </div>

        {/* Accounts List */}
        <div className="px-4 flex-1 overflow-y-auto mt-2" style={{ overscrollBehavior: "contain" }}>
          <div className="flex flex-col gap-3">
            {accounts.map((account, index) => {
              const isActive = index === currentAccountIndex;
              const accDisplayName = account.profile?.username || account.walletName || `Account ${index + 1}`;
              
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
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-[24px] cursor-pointer transition-transform active:scale-[0.98] bg-[#1c1c1e]`}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar
                      iconIndex={account.avatarIconIndex || account.profile?.iconIndex || 1}
                      avatarType={account.profile?.avatarType || 'emoji'}
                      size={44}
                    />
                    {isActive && (
                      <div className="absolute -bottom-1 -right-1 w-[20px] h-[20px] rounded-full bg-[#AB9FF2] flex items-center justify-center border-[3px] border-[#1c1c1e]">
                        <Check size={12} color="#000" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-white font-medium text-[16px] mb-0.5">{accDisplayName}</div>
                    <div className="text-[#A0A0A0] text-[14px]">{formatCurrency(accTotalBalance, baseCurrency)}</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isActive) {
                        onOpenProfile();
                      } else {
                        switchAccount(index);
                      }
                    }}
                    className="w-[36px] h-[36px] rounded-full bg-[#2A2A2C] flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <Pencil size={16} color="#e0e0e0" />
                  </button>
                </div>
              );
            })}
          </div>
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
