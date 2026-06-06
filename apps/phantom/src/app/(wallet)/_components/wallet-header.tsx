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
  isDrawerOpen?: boolean;
}

const WalletHeader = ({ scrolled = false, onAvatarPress, onActivityPress, isDrawerOpen = false }: WalletHeaderProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { walletName, profile } = useWalletStore();

  let title = walletName || "Account 1";
  if (pathname === "/tokens") title = "Cash";
  if (pathname === "/swap") title = "Swap";
  if (pathname === "/activity") title = "Chats";


  return (
    <header
      className="fixed -top-2 left-0 right-0"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        zIndex: 100,
      }}
    >
      {/* Stacked graduated blur layers — approximates iOS native variable blur.
          Each layer covers a different vertical band with decreasing blur intensity,
          creating a true graduated blur rather than a masked uniform blur. */}

      {/* Layer 1: Strong blur — covers the full header area solidly */}
      <div
        aria-hidden="true"
        className="pointer-events-none"
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          bottom: 0,
          WebkitBackdropFilter: "blur(5px)",
          backdropFilter: "blur(5px)",
          WebkitMaskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
          maskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
          backgroundColor: isDrawerOpen ? "transparent" : "rgba(0,0,0, 0.6)",
          transition: "background-color 0.3s ease-in-out"
        }}
      />

      {/* Layer 2: Medium blur — overlaps bottom of header, fades into content */}
      <div
        aria-hidden="true"
        className="pointer-events-none"
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          bottom: "-12px",
          WebkitBackdropFilter: "blur(2px)",
          backdropFilter: "blur(2px)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.8) 60%, rgba(0,0,0,0.4) 80%, transparent 100%)",
          maskImage: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.8) 60%, rgba(0,0,0,0.4) 80%, transparent 100%)",
          background: "transparent",
        }}
      />

      {/* Layer 3: Light blur — feathers furthest into the content below */}
      <div
        aria-hidden="true"
        className="pointer-events-none"
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          bottom: "-25px",
          WebkitBackdropFilter: "blur(0px)",
          backdropFilter: "blur(0px)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.5) 75%, rgba(0,0,0,0.2) 90%, transparent 100%)",
          maskImage: "linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.5) 75%, rgba(0,0,0,0.2) 90%, transparent 100%)",
          background: "transparent",
        }}
      />
      <div className="relative z-10 flex items-center px-4 pt-3 pb-2 gap-2">
        <button className="flex items-center action-btn walkthrough-settings" onClick={onAvatarPress}>
          <Avatar
            iconIndex={profile.iconIndex}
            avatarType={profile.avatarType}
            size={40}
          />
        </button>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => router.push('/home')}
            className={`h-[38px] px-3 flex items-center justify-center rounded-full tracking-tight transition-colors ${pathname === '/home' || pathname === '/' ? 'bg-[#B4A6F9] text-black' : 'bg-[#2A2A2B] text-[#A0A0A5]'}`}
          >
            <span className="font-medium">Home</span>
          </button>
          <button 
            onClick={() => router.push('/swap')}
            className={`h-[38px] px-3 flex items-center justify-center rounded-full tracking-tight transition-colors ${pathname === '/swap' ? 'bg-[#B4A6F9] text-black' : 'bg-[#2A2A2B] text-[#A0A0A5]'}`}
          >
            <span className="font-medium">Trade</span>
          </button>
          <button 
            onClick={() => router.push('/browser')}
            className={`h-[38px] px-3 flex items-center justify-center rounded-full tracking-tight transition-colors ${pathname === '/browser' ? 'bg-[#B4A6F9] text-black' : 'bg-[#2A2A2B] text-[#A0A0A5]'}`}
          >
            <span className="font-medium">Explore</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default WalletHeader;
