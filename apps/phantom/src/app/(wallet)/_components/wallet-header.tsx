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

  // Fade the row edges: right edge while it overflows, left edge once scrolled so
  // pills dissolve as they slide behind the avatar (which overlays the row).
  const tabsRef = React.useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = React.useState(false);
  const [showRightFade, setShowRightFade] = React.useState(false);

  React.useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    const update = () => {
      setShowLeftFade(el.scrollLeft > 1);
      setShowRightFade(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  // Left fade sits just past the avatar so pills melt into it; right fade hugs the edge.
  // Gentle stop — most of the "disappearing" effect comes from the blur strip below.
  const leftStop = "transparent 0, transparent 14px, black 44px";
  const rightStop = "black 92%, transparent 100%";
  let tabsMask: string | undefined;
  if (showLeftFade && showRightFade) tabsMask = `linear-gradient(to right, ${leftStop}, ${rightStop})`;
  else if (showLeftFade) tabsMask = `linear-gradient(to right, ${leftStop}, black 100%)`;
  else if (showRightFade) tabsMask = `linear-gradient(to right, ${rightStop})`;

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
      <div className="relative z-10 flex items-center px-4 pt-2.5 pb-2.5">
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex items-center action-btn walkthrough-settings"
          onClick={onAvatarPress}
        >
          <Avatar
            iconIndex={profile.iconIndex}
            avatarType={profile.avatarType}
            size={38}
          />
        </button>

        {/* Blur strip behind the avatar — softly blurs pills as they scroll under it. */}
        {showLeftFade && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 bottom-0 z-10"
            style={{
              width: "112px",
              WebkitBackdropFilter: "blur(5px)",
              backdropFilter: "blur(5px)",
              WebkitMaskImage: "linear-gradient(to right, black 45%, transparent 100%)",
              maskImage: "linear-gradient(to right, black 45%, transparent 100%)",
            }}
          />
        )}

        <div
          ref={tabsRef}
          className="w-full flex items-center gap-2 overflow-x-auto no-scrollbar pl-[52px]"
          style={tabsMask ? {
            WebkitMaskImage: tabsMask,
            maskImage: tabsMask,
          } : undefined}
        >
          <button
            onClick={() => router.push('/home')}
            className={`shrink-0 h-[38px] px-4 flex items-center justify-center rounded-full tracking-tight transition-colors ${pathname === '/home' || pathname === '/' ? 'bg-[#B4A6F9] text-black' : 'bg-[#2A2A2B] text-[#A0A0A5]'}`}
          >
            <span className="font-normal text-[17px]">Home</span>
          </button>
          <button
            onClick={() => router.push('/swap')}
            className={`shrink-0 h-[38px] px-4 flex items-center justify-center rounded-full tracking-tight transition-colors ${pathname === '/swap' ? 'bg-[#B4A6F9] text-black' : 'bg-[#2A2A2B] text-[#A0A0A5]'}`}
          >
            <span className="font-normal text-[17px]">Trade</span>
          </button>
          <button
            onClick={() => router.push('/predict')}
            className={`shrink-0 h-[38px] px-4 flex items-center justify-center rounded-full tracking-tight transition-colors ${pathname === '/predict' ? 'bg-[#B4A6F9] text-black' : 'bg-[#2A2A2B] text-[#A0A0A5]'}`}
          >
            <span className="font-normal text-[17px]">Predict</span>
          </button>
          <button
            onClick={() => router.push('/browser')}
            className={`shrink-0 h-[38px] px-4 flex items-center justify-center rounded-full tracking-tight transition-colors ${pathname === '/browser' ? 'bg-[#B4A6F9] text-black' : 'bg-[#2A2A2B] text-[#A0A0A5]'}`}
          >
            <span className="font-normal text-[17px]">Explore</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default WalletHeader;
