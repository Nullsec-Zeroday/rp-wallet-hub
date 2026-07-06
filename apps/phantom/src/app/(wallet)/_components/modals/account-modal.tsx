"use client";

import React from "react";
import { X, User, Settings, Pencil, Check, Copy, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useWalletStore } from "@/lib/wallet-store";
import { formatCurrency, TOKEN_MAP } from "@/lib/wallet-data";
import Avatar from "../avatar";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { deleteBackendWalletAccount } from "@/lib/backend-wallet";


interface AccountModalProps {
  visible: boolean;
  onClose: () => void;
  onAddAccount: () => Promise<boolean>;
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
  const displayName = profile?.username || walletName || "RPWallet";

  const [isClosing, setIsClosing] = React.useState(false);
  const [activeView, setActiveView] = React.useState<'list' | 'edit'>('list');
  const [editingAccountIndex, setEditingAccountIndex] = React.useState<number>(0);
  const [deletingAccountId, setDeletingAccountId] = React.useState<string | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    if (visible) {
      setIsClosing(false);
      setActiveView('list');
    }
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

        {activeView === 'list' ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleClose}
                  className="w-[36px] h-[36px] rounded-full bg-[#1c1c1e] flex items-center justify-center active:scale-95 transition-transform"
                >
                  <X size={18} color="#fff" />
                </button>
                <div className="text-white font-bold text-[19px] tracking-tight">
                  Your Accounts
                </div>
              </div>
              <button
                onClick={async () => {
                  try {
                    if (await onAddAccount()) {
                      toast.success("New account added");
                    }
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Unable to create account.");
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

                  const getInitials = (name: string) => {
                    if (!name) return "";
                    const cleanName = name.replace(/\.com$/i, "");
                    const parts = cleanName.trim().split(/\s+/);
                    if (parts.length === 1) {
                      return parts[0].substring(0, 1).toUpperCase();
                    }
                    const first = parts[0].substring(0, 1).toUpperCase();
                    const last = parts[parts.length - 1];
                    const lastChar = /^\d+$/.test(last) ? last : last.substring(0, 1).toUpperCase();
                    return first + lastChar;
                  };

                  return (
                    <div
                      key={account.id}
                      onClick={() => {
                        switchAccount(index);
                        toast.success(`Switched to ${accDisplayName}`);
                        handleClose();
                      }}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-[24px] cursor-pointer transition-transform active:scale-[0.98] bg-[#1c1c1e]`}
                    >
                      <div className="relative flex-shrink-0">
                        <div 
                          className="w-11 h-11 rounded-full bg-[#252528] flex items-center justify-center text-white font-semibold text-[15px]"
                        >
                          {getInitials(accDisplayName)}
                        </div>
                        {isActive && (
                          <div className="absolute -bottom-1 -right-1 w-[20px] h-[20px] rounded-full bg-[#AB9FF2] flex items-center justify-center border-[3px] border-[#1c1c1e]">
                            <Check size={11} color="#fff" strokeWidth={3.5} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-white font-medium text-[16px] mb-0.5">{accDisplayName}</div>
                        <div className="text-[#A0A0A0] text-[14px]">{formatCurrency(accTotalBalance, baseCurrency)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* QR Code / Copy Address Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(account.profile?.walletAddress || "");
                            toast.success("Address copied to clipboard");
                          }}
                          className="w-[36px] h-[36px] rounded-[12px] bg-[#252528] flex items-center justify-center text-[#e0e0e0] hover:text-white active:scale-95 transition-all"
                        >
                          <svg 
                            width="18" 
                            height="18" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path 
                              fill="currentColor" 
                              d="M13 14a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1zM13 20a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1zM19 20a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1zM19 14a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1zM16 17a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1z"
                            />
                            <path 
                              stroke="currentColor" 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth="2" 
                              d="M3 5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 16a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM14 5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2z"
                            />
                            <path 
                              fill="currentColor" 
                              fillRule="evenodd" 
                              d="M5.5 6.1a.6.6 0 0 1 .6-.6h.8a.6.6 0 0 1 .6.6v.8a.6.6 0 0 1-.6.6h-.8a.6.6 0 0 1-.6-.6zM5.5 17.1a.6.6 0 0 1 .6-.6h.8a.6.6 0 0 1 .6.6v.8a.6.6 0 0 1-.6.6h-.8a.6.6 0 0 1-.6-.6zM16.5 6.1a.6.6 0 0 1 .6-.6h.8a.6.6 0 0 1 .6.6v.8a.6.6 0 0 1-.6.6h-.8a.6.6 0 0 1-.6-.6z" 
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        {/* Ellipsis / Options Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingAccountIndex(index);
                            setActiveView('edit');
                          }}
                          className="w-[36px] h-[36px] rounded-[12px] bg-[#252528] flex items-center justify-center text-[#e0e0e0] hover:text-white active:scale-95 transition-transform"
                        >
                          <svg 
                            width="18" 
                            height="18" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="19" cy="12" r="1"></circle>
                            <circle cx="5" cy="12" r="1"></circle>
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (() => {
          const editingAccount = accounts[editingAccountIndex] || accounts[0];
          const editingDisplayName = editingAccount?.profile?.username || editingAccount?.walletName || `Account ${editingAccountIndex + 1}`;
          
          const handleRemoveAccount = async () => {
            if (accounts.length <= 1) {
              toast.error("Cannot remove the only remaining account.");
              return;
            }
            if (!editingAccount || deletingAccountId) return;

            setDeletingAccountId(editingAccount.id);
            try {
              await deleteBackendWalletAccount(editingAccount.id);
              toast.success(`Removed account ${editingDisplayName}`);
              setActiveView('list');
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Unable to remove account.");
            } finally {
              setDeletingAccountId(null);
            }
          };

          return (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveView('list')}
                    className="w-[36px] h-[36px] rounded-full bg-[#1c1c1e] flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <ChevronLeft size={20} color="#fff" />
                  </button>
                  <div className="text-white font-bold text-[19px] tracking-tight">
                    Edit Account
                  </div>
                </div>
                <div className="w-[36px] h-[36px]" />
              </div>

              {/* Edit Account Content */}
              <div className="flex-1 overflow-y-auto mt-2" style={{ overscrollBehavior: "contain" }}>
                {/* Avatar Display */}
                <div className="flex flex-col items-center mt-6 mb-8 flex-shrink-0">
                  <div className="relative">
                    <Avatar
                      iconIndex={editingAccount?.avatarIconIndex || editingAccount?.profile?.iconIndex || 1}
                      avatarType={editingAccount?.profile?.avatarType || 'emoji'}
                      size={110}
                    />
                    <button 
                      onClick={() => {
                        handleClose();
                        router.push('/settings/edit-profile');
                      }}
                      className="absolute bottom-0 right-0 w-[30px] h-[30px] rounded-full bg-[#1c1c1e] border-[2px] border-black flex items-center justify-center active:scale-95 transition-transform"
                    >
                      <Pencil size={12} color="#fff" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-4 px-4">
                  {/* Group 1: Name and Addresses */}
                  <div className="bg-[#1c1c1e] rounded-[16px] overflow-hidden">
                    <button 
                      onClick={() => {
                        handleClose();
                        router.push('/settings/edit-profile');
                      }}
                      className="w-full h-[54px] px-4 flex items-center justify-between active:bg-[#252528] transition-colors"
                    >
                      <span className="text-white text-[16px]">Account Name</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#a0a0a0] text-[15px]">{editingDisplayName}</span>
                        <ChevronRight size={16} className="text-[#8e8e93]" />
                      </div>
                    </button>
                    <div className="h-[1px] bg-[#2A2A2C] mx-4" />
                    <button 
                      onClick={() => {
                        handleClose();
                        router.push('/settings/edit-profile');
                      }}
                      className="w-full h-[54px] px-4 flex items-center justify-between active:bg-[#252528] transition-colors"
                    >
                      <span className="text-white text-[16px]">Account Addresses</span>
                      <ChevronRight size={16} className="text-[#8e8e93]" />
                    </button>
                  </div>

                  {/* Group 2: Notifications */}
                  <div className="bg-[#1c1c1e] rounded-[16px] overflow-hidden">
                    <button 
                      onClick={() => {
                        handleClose();
                        router.push('/settings/edit-profile');
                      }}
                      className="w-full h-[54px] px-4 flex items-center justify-between active:bg-[#252528] transition-colors"
                    >
                      <span className="text-white text-[16px]">Notifications</span>
                      <ChevronRight size={16} className="text-[#8e8e93]" />
                    </button>
                  </div>

                  {/* Group 3: Show Recovery Phrase and Show Private Key */}
                  <div className="bg-[#1c1c1e] rounded-[16px] overflow-hidden">
                    <button 
                      onClick={() => {
                        handleClose();
                        router.push('/settings/edit-profile');
                      }}
                      className="w-full h-[54px] px-4 flex items-center justify-between active:bg-[#252528] transition-colors"
                    >
                      <span className="text-white text-[16px]">Show Recovery Phrase</span>
                      <ChevronRight size={16} className="text-[#8e8e93]" />
                    </button>
                    <div className="h-[1px] bg-[#2A2A2C] mx-4" />
                    <button 
                      onClick={() => {
                        handleClose();
                        router.push('/settings/edit-profile');
                      }}
                      className="w-full h-[54px] px-4 flex items-center justify-between active:bg-[#252528] transition-colors"
                    >
                      <span className="text-white text-[16px]">Show Private Key</span>
                      <ChevronRight size={16} className="text-[#8e8e93]" />
                    </button>
                  </div>

                  {/* Group 4: Remove Account */}
                  <div className="bg-[#1c1c1e] rounded-[16px] overflow-hidden">
                    <button 
                      onClick={handleRemoveAccount}
                      disabled={deletingAccountId === editingAccount?.id}
                      className="w-full h-[54px] px-4 flex items-center justify-start active:bg-[#252528] transition-colors text-[#FF3B30] font-medium text-[16px]"
                    >
                      {deletingAccountId === editingAccount?.id ? "Removing..." : "Remove Account"}
                    </button>
                  </div>
                </div>
              </div>
            </>
          );
        })()}
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
