"use client";

import React from "react";
import { Clock, Search, Plus, MoreHorizontal, SlidersHorizontal } from "lucide-react";
import { useWalletStore } from "@/lib/wallet-store";
import { usePathname, useRouter } from "next/navigation";
import Avatar from "./avatar";

interface WalletHeaderProps {
  scrolled?: boolean;
  onAvatarPress?: () => void;
  onActivityPress?: () => void;
}

const WalletHeader = ({ scrolled = false, onAvatarPress, onActivityPress }: WalletHeaderProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { walletName, profile } = useWalletStore();

  if (pathname.startsWith("/browser")) {
    return null;
  }

  let title = walletName || "Account 1";
  if (pathname === "/tokens") title = "Cash";
  if (pathname === "/swap") title = "Swap";
  if (pathname === "/activity") title = "Chats";


  return (
    <header
      className="fixed top-0 left-0 right-0"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        zIndex: 100,
      }}
    >
      {/* Glass backdrop — absolutely positioned to fill the entire header
          including the safe-area padding zone. Putting backdrop-filter on a
          child instead of the header itself avoids a WebKit compositing bug
          where the filter doesn't paint into env() safe-area padding. */}
      <div
        aria-hidden="true"
        className="transition-colors duration-300"
        style={{
          position: "absolute",
          inset: 0,
          WebkitBackdropFilter: "blur(20px) saturate(150%)",
          backdropFilter: "blur(20px) saturate(150%)",
          backgroundColor: scrolled ? "rgba(17, 17, 17, 0.82)" : "rgba(17, 17, 17, 0.62)",
        }}
      />
      <div className="relative z-10 flex items-center justify-between px-4 pt-3 pb-2">
        <button className="flex items-center gap-3 action-btn walkthrough-settings" onClick={onAvatarPress}>
          <Avatar
            iconIndex={profile.iconIndex}
            avatarType={profile.avatarType}
            size={44}
          />
          <div className="flex flex-col items-start text-left">
            {profile.username && (
              <span className="text-[15px] font-semibold leading-tight tracking-tight opacity-65" style={{ color: "#FFFFFF" }}>
                @{profile.username}
              </span>
            )}
            <span className="text-white text-2xl font-semibold tracking-tight leading-tight" style={{ color: "#FFFFFF" }}>
              {title}
            </span>
          </div>
        </button>

        <div className="flex items-center gap-5 text-white">
          {/* Wallet Home Icons */}
          {(pathname === "/home" || pathname === "/") && (
            <>
              <button className="min-h-[44px] flex items-center active:opacity-60 transition-opacity" onClick={onActivityPress}>
                <Clock size={24} strokeWidth={1.8} />
              </button>
              <button
                className="min-h-[44px] flex items-center active:opacity-60 transition-opacity"
                onClick={() => router.push('/browser')}
              >
                <Search size={24} strokeWidth={1.8} />
              </button>
            </>
          )}

          {/* Cash Icons */}
          {pathname === "/tokens" && (
            <button className="min-h-[44px] flex items-center active:opacity-60 transition-opacity">
              <MoreHorizontal size={24} strokeWidth={1.8} />
            </button>
          )}

          {/* Swap Icons */}
          {pathname === "/swap" && (
            <button className="min-h-[44px] flex items-center active:opacity-60 transition-opacity">
              <SlidersHorizontal size={24} strokeWidth={1.8} />
            </button>
          )}

          {/* Chats (Activity) Icons -> Empty as requested */}
        </div>
      </div>
    </header>
  );
};

export default WalletHeader;
