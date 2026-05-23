"use client";

import React, { useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

const RiveNavIcon = dynamic(() => import("./rive-nav-icon"), { ssr: false });

const navItems = [
  {
    label: "Home",
    href: "/home",
    riveSrc: "/rive/nav-home.riv",
    size: 44,
  },
  {
    label: "Tokens",
    href: "/tokens",
    riveSrc: "/rive/nav-wallet.riv",
    size: 44,
  },
  {
    label: "Swap",
    href: "/swap",
    riveSrc: "/rive/nav-swap.riv",
    size: 44,
  },
  {
    label: "Activity",
    href: "/activity",
    riveSrc: "/rive/nav-chat.riv",
    size: 44,
  },
  {
    label: "Browser",
    href: "/browser",
    riveSrc: "/rive/nav-search.riv",
    size: 44,
  },
];

const WalletFooterNavigation = ({ activeTabOverride, blurred = true, hidden = false }: { activeTabOverride?: string; blurred?: boolean; hidden?: boolean }) => {
  const pathname = usePathname();
  const currentPath = activeTabOverride || pathname;
  const prevPathRef = useRef(currentPath);

  // Track which item was just tapped to trigger a one-shot animation
  const [tappedItem, setTappedItem] = React.useState<string | null>(null);

  const handleNavClick = useCallback((href: string) => {
    // Light haptic feedback for footer navigation clicks
    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
    // If already on this tab, fire the animation anyway for feedback
    setTappedItem(href);
    // Reset after animation plays
    setTimeout(() => setTappedItem(null), 800);
  }, []);

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${hidden ? "translate-y-full pointer-events-none" : "translate-y-0 pointer-events-none"}`}
      style={{ height: "calc(60px + env(safe-area-inset-bottom, 0px))" }}
    >
      <div 
        className="absolute inset-0 pointer-events-auto"
        style={{
          backgroundColor: blurred ? "rgba(17, 17, 17, 0.82)" : "#111111",
          backdropFilter: blurred ? "blur(20px) saturate(150%)" : "none",
          WebkitBackdropFilter: blurred ? "blur(20px) saturate(150%)" : "none",
        }}
      />
      
      <nav 
        className="absolute inset-0 pointer-events-auto px-[20px] max-w-[430px] mx-auto"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div role="tablist" className="flex flex-row w-full h-[60px]">
          {navItems.map((item) => {
            const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className="flex flex-1 justify-center items-start h-[60px] pt-[10px]"
                onClick={() => handleNavClick(item.href)}
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                <div
                  className="flex flex-col flex-1 items-center justify-start p-[5px] cursor-pointer"
                  style={{
                    opacity: isActive ? 1 : 0.5,
                    transition: "opacity 80ms ease-out",
                    willChange: "opacity",
                  }}
                >
                  <div className="relative w-10 h-10 pointer-events-none">
                    <RiveNavIcon
                      src={item.riveSrc}
                      isActive={isActive || tappedItem === item.href}
                      size={40}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default WalletFooterNavigation;
