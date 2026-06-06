"use client";

import React, { useCallback, useState } from "react";
import { Search, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

/* ── Action menu items ── */
const ACTION_ITEMS = [
  {
    label: "Send",
    icon: <img src="/icons/send_icon.webp" alt="Send" width={22} height={22} className="object-contain" />,
    action: "/home?modal=send",
    initialY: 220,
  },
  {
    label: "Receive",
    icon: <img src="/icons/receive_icon.webp" alt="Receive" width={22} height={22} className="object-contain" />,
    action: "/home?modal=receive",
    initialY: 160,
  },
  {
    label: "Buy",
    icon: <img src="/icons/buy_icon.webp" alt="Buy" width={22} height={22} className="object-contain" />,
    action: "/home?modal=buy",
    initialY: 110,
  },
  {
    label: "Trade",
    icon: <img src="/icons/trade_icon.webp" alt="Trade" width={22} height={22} className="object-contain" />,
    action: "/swap",
    initialY: 70,
  },
];

const SPRING_CONFIG = { type: "spring" as const, stiffness: 420, damping: 20, mass: 1 };

const WalletFooterNavigation = ({ hidden = false, isDrawerOpen = false }: { activeTabOverride?: string; blurred?: boolean; hidden?: boolean, isDrawerOpen?: boolean }) => {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavClick = useCallback(() => {
    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, []);

  const openMenu = useCallback(() => {
    handleNavClick();
    setMenuOpen(true);
  }, [handleNavClick]);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const handleAction = useCallback((action: string) => {
    setMenuOpen(false);
    setTimeout(() => {
      router.push(action);
    }, 250);
  }, [router]);

  return (
    <>
      {/* ── Plus Menu Overlay ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="plus-menu"
            className="fixed inset-0 z-[999]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
          >
            {/* Blurred backdrop */}
            <motion.div
              className="absolute inset-0"
              onClick={closeMenu}
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.2)",
                WebkitBackdropFilter: "blur(20px)",
                backdropFilter: "blur(20px)",
                transform: "translateZ(0)",
                WebkitTransform: "translateZ(0)",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
            />

            {/* Menu items - all animate at same time, different distances */}
            <div
              className="absolute right-0 flex flex-col items-end gap-[24px]"
              style={{
                bottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
                right: "20px",
              }}
            >
              {ACTION_ITEMS.map((item) => (
                <motion.button
                  key={item.label}
                  onClick={() => handleAction(item.action)}
                  className="flex items-center gap-5 active:scale-[0.95]"
                  initial={{ y: item.initialY, opacity: 0, scale: 0.8 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: item.initialY * 0.5, opacity: 0, scale: 0.85 }}
                  transition={{
                    y: SPRING_CONFIG,
                    scale: SPRING_CONFIG,
                    opacity: { duration: 0.15 },
                  }}
                >
                  <span className="text-[#dedede] text-[22px] font-semibold tracking-tight">
                    {item.label}
                  </span>
                  <div className="w-[48px] h-[48px] rounded-full bg-[#AB9FF2] flex items-center justify-center">
                    {item.icon}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Plus Button (Z-Index 1000) ── */}
      <div
        className={`fixed -bottom-3 left-0 right-0 z-[1000] pointer-events-none transition-transform duration-300 ease-in-out ${hidden ? "translate-y-full" : "translate-y-0"}`}
      >
        <div
          className="px-4 max-w-[430px] mx-auto flex items-center justify-end pt-2"
          style={{ paddingBottom: "calc(8px + env(safe-area-inset-bottom, 0px))" }}
        >
          <motion.button
            onClick={menuOpen ? closeMenu : openMenu}
            className="size-[50px] flex-shrink-0 rounded-full flex items-center justify-center pointer-events-auto active:scale-[0.95]"
            animate={{
              backgroundColor: menuOpen ? "#222222" : "#AB9FF2",
              rotate: menuOpen ? 45 : 0,
            }}
            transition={{
              rotate: SPRING_CONFIG,
              backgroundColor: { duration: 0.2, ease: "linear" }
            }}
            style={{
              boxShadow: menuOpen ? "none" : "0 0 15px rgba(171,159,242,0.15)"
            }}
          >
            <motion.div
              animate={{ color: menuOpen ? "#999999" : "#000000" }}
              transition={{ duration: 0.2 }}
            >
              <Plus size={32} strokeWidth={1.5} color="currentColor" />
            </motion.div>
          </motion.button>
        </div>
      </div>

      {/* ── Footer Bar ── */}
      <div
        className={`fixed -bottom-3 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${hidden ? "translate-y-full pointer-events-none" : "translate-y-0"}`}
      >
        {/* Stacked graduated blur layers (bottom-to-top) */}
        <div className="absolute top-[2px] left-0 right-0 bottom-0 pointer-events-none z-0">
          {/* Layer 1: Strong blur — covers the very bottom solid */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              WebkitBackdropFilter: "blur(6px)",
              backdropFilter: "blur(6px)",
              WebkitMaskImage: "linear-gradient(to top, black 65%, transparent 100%)",
              maskImage: "linear-gradient(to top, black 65%, transparent 100%)",
              backgroundColor: isDrawerOpen ? "transparent" : "rgba(0,0,0, 0.8)",
              transition: "background-color 0.3s ease-in-out"
            }}
          />

          {/* Layer 2: Medium blur */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              WebkitBackdropFilter: "blur(2px)",
              backdropFilter: "blur(2px)",
              WebkitMaskImage: "linear-gradient(to top, transparent 40%, rgba(0,0,0,0.8) 60%, rgba(0,0,0,0.4) 80%, transparent 100%)",
              maskImage: "linear-gradient(to top, transparent 40%, rgba(0,0,0,0.8) 60%, rgba(0,0,0,0.4) 80%, transparent 100%)",
            }}
          />

          {/* Layer 3: Light blur — feathers furthest up */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              WebkitBackdropFilter: "blur(0px)",
              backdropFilter: "blur(0px)",
              WebkitMaskImage: "linear-gradient(to top, transparent 60%, rgba(0,0,0,0.5) 75%, rgba(0,0,0,0.2) 90%, transparent 100%)",
              maskImage: "linear-gradient(to top, transparent 60%, rgba(0,0,0,0.5) 75%, rgba(0,0,0,0.2) 90%, transparent 100%)",
            }}
          />
        </div>

        <nav
          className="relative z-10 pointer-events-auto px-4 max-w-[430px] mx-auto flex items-center justify-between gap-3 pt-2"
          style={{ paddingBottom: "calc(8px + env(safe-area-inset-bottom, 0px))" }}
        >
          <button
            onClick={() => {
              handleNavClick();
              router.push('/browser');
            }}
            className="flex-1 h-[50px] px-4 flex items-center gap-2.5 bg-[#232323] border border-[#2b2b2b] rounded-full active:scale-[0.98] transition-transform"
          >
            <Search size={20} className="text-white" />
            <span className="text-[#797979] text-[16px]">Search Phantom</span>
          </button>

          {/* Invisible placeholder to keep the flex layout correct since the real button is floating at z-[1000] */}
          <div className="size-[50px] flex-shrink-0" />
        </nav>
      </div>
    </>
  );
};

export default WalletFooterNavigation;
