"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ChevronDown, ArrowRightLeft, CheckCircle2, Search, X, SlidersHorizontal, Info, ChevronRight, Sparkles, BadgeCent, ArrowUp, BarChart2, TrendingUp } from "lucide-react";
import { fetchTrendingSolanaTokens, TrendingToken } from "@/lib/coingecko-service";
import { useWalletStore } from "@/lib/wallet-store";
import { TOKENS, TOKEN_MAP, formatCurrency, formatBalance, type TokenInfo } from "@/lib/wallet-data";
import { useLivePrices } from "@/hooks/useLivePrices";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import TokenLogo from "../_components/token-logo";
import { motion, AnimatePresence } from "framer-motion";
import { useRive, useStateMachineInput } from "@rive-app/react-canvas";
import { useRiveAsset } from "../_components/rive-asset-provider";

// ── Helpers ──
function formatMarketCap(value: number, currency: string): string {
  const formatCompact = (num: number) => Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(num);
  const symbol = formatCurrency(0, currency).charAt(0);
  return `${symbol}${formatCompact(value)} MC`;
}

function formatPrice(value: number, currency: string): string {
  return formatCurrency(value, currency);
}

function formatChange(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function getRankBadgeColor(rank: number): string {
  if (rank === 1) return 'rgb(245, 166, 35)';
  if (rank === 2) return 'rgb(155, 155, 155)';
  if (rank === 3) return 'rgb(205, 124, 58)';
  return 'rgb(42, 42, 42)';
}

function getTokenInitials(name: string): string {
  if (!name) return "";
  return name.slice(0, 2).toUpperCase();
}

function TokenRankIcon({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <svg width="22" height="24" viewBox="0 0 22 24" fill="none">
        <path d="M4.75885 7.99661L6.21416 9.36849L6.75885 8.79068V7.99661H4.75885ZM17.2411 7.99838H15.2411V8.79212L15.7854 9.36985L17.2411 7.99838ZM13.7204 4H15.4722V0H13.7204V4ZM8.27783 4H13.7204V0H8.27783V4ZM6.52779 4H8.27783V0H6.52779V4ZM6.75885 3.73598C6.75885 3.91709 6.61977 4 6.52779 4V0C4.48189 0 2.75885 1.63736 2.75885 3.73598H6.75885ZM6.75885 7.99661V3.73598H2.75885V7.99661H6.75885ZM4.5 13.6593C4.5 12.0081 5.14463 10.5031 6.21416 9.36849L3.30354 6.62472C1.56901 8.46472 0.5 10.9386 0.5 13.6593H4.5ZM10.9991 20.0001C7.37414 20.0001 4.5 17.1259 4.5 13.6593H0.5C0.5 19.4056 5.23625 24.0001 10.9991 24.0001V20.0001ZM17.4983 13.6593C17.4983 17.1259 14.6241 20.0001 10.9991 20.0001V24.0001C16.762 24.0001 21.4983 19.4056 21.4983 13.6593H17.4983ZM15.7854 9.36985C16.8542 10.5043 17.4983 12.0088 17.4983 13.6593H21.4983C21.4983 10.9397 20.4301 8.46669 18.6968 6.62691L15.7854 9.36985ZM15.2411 3.73598V7.99838H19.2411V3.73598H15.2411ZM15.4722 4C15.3802 4 15.2411 3.91709 15.2411 3.73598H19.2411C19.2411 1.63736 17.5181 0 15.4722 0V4Z" fill="#111111" />
        <path d="M15.4722 2H13.7204H8.27783H6.52779C5.55083 2 4.75885 2.77722 4.75885 3.73598V7.99661C3.35682 9.48389 2.5 11.4734 2.5 13.6593C2.5 18.2658 6.30519 22.0001 10.9991 22.0001C15.6931 22.0001 19.4983 18.2658 19.4983 13.6593C19.4983 11.4743 18.6421 9.48547 17.2411 7.99838V3.73598C17.2411 2.77722 16.4491 2 15.4722 2Z" fill="#FFD13F" fillRule="evenodd" />
        <path d="M15.4731 2H6.5287C5.55174 2 4.75977 2.77722 4.75977 3.73598V9.25095C4.75977 10.2097 5.55174 10.9869 6.5287 10.9869H15.4731C16.45 10.9869 17.242 10.2097 17.242 9.25095V3.73598C17.242 2.77722 16.45 2 15.4731 2Z" fill="#AB9FF2" />
        <path d="M13.72 2H8.27734V8.31632H13.72V2Z" fill="#E2DFFE" opacity="0.5" />
        <path d="M10.9991 21.9999C15.6931 21.9999 19.4983 18.2656 19.4983 13.6591C19.4983 9.05266 15.6931 5.31836 10.9991 5.31836C6.30519 5.31836 2.5 9.05266 2.5 13.6591C2.5 18.2656 6.30519 21.9999 10.9991 21.9999Z" fill="#FFD13F" />
        <path d="M10.9998 20.8121C15.0254 20.8121 18.2888 17.6095 18.2888 13.659C18.2888 9.70841 15.0254 6.50586 10.9998 6.50586C6.97429 6.50586 3.71094 9.70841 3.71094 13.659C3.71094 17.6095 6.97429 20.8121 10.9998 20.8121Z" fill="#FFFFC4" opacity="0.5" />
        <path d="M16.1533 18.7167C19.0001 15.923 19.0001 11.3949 16.1533 8.60118C13.3065 5.80742 8.6925 5.80742 5.8457 8.60118L16.1533 18.7167Z" fill="#F1C63C" />
        <path d="M10.7135 17.8549C10.603 17.8549 10.5135 17.7653 10.5135 17.6549V11.6838C10.5135 11.5302 10.3474 11.4339 10.2141 11.5102L8.9888 12.2115C8.85547 12.2878 8.68945 12.1916 8.68945 12.038V11.0128C8.68945 10.94 8.72895 10.873 8.7926 10.8378L10.5523 9.86388C10.5819 9.84747 10.6152 9.83887 10.6491 9.83887H11.7415C11.8519 9.83887 11.9415 9.92841 11.9415 10.0389V17.6549C11.9415 17.7653 11.8519 17.8549 11.7415 17.8549H10.7135Z" fill="#2C2D30" />
      </svg>
    );
  }
  if (rank === 2) {
    return (
      <svg width="22" height="24" viewBox="0 0 22 24" fill="none">
        <path d="M4.75885 7.99661L6.21416 9.36849L6.75885 8.79068V7.99661H4.75885ZM17.2411 7.99838H15.2411V8.79212L15.7854 9.36985L17.2411 7.99838ZM13.7204 4H15.4722V0H13.7204V4ZM8.27783 4H13.7204V0H8.27783V4ZM6.52779 4H8.27783V0H6.52779V4ZM6.75885 3.73598C6.75885 3.91709 6.61977 4 6.52779 4V0C4.48189 0 2.75885 1.63736 2.75885 3.73598H6.75885ZM6.75885 7.99661V3.73598H2.75885V7.99661H6.75885ZM4.5 13.6593C4.5 12.0081 5.14463 10.5031 6.21416 9.36849L3.30354 6.62472C1.56901 8.46472 0.5 10.9386 0.5 13.6593H4.5ZM10.9991 20.0001C7.37414 20.0001 4.5 17.1259 4.5 13.6593H0.5C0.5 19.4056 5.23625 24.0001 10.9991 24.0001V20.0001ZM17.4983 13.6593C17.4983 17.1259 14.6241 20.0001 10.9991 20.0001V24.0001C16.762 24.0001 21.4983 19.4056 21.4983 13.6593H17.4983ZM15.7854 9.36985C16.8542 10.5043 17.4983 12.0088 17.4983 13.6593H21.4983C21.4983 10.9397 20.4301 8.46669 18.6968 6.62691L15.7854 9.36985ZM15.2411 3.73598V7.99838H19.2411V3.73598H15.2411ZM15.4722 4C15.3802 4 15.2411 3.91709 15.2411 3.73598H19.2411C19.2411 1.63736 17.5181 0 15.4722 0V4Z" fill="#111111" />
        <path d="M15.4722 2H13.7204H8.27783H6.52779C5.55083 2 4.75885 2.77722 4.75885 3.73598V7.99661C3.35682 9.48389 2.5 11.4734 2.5 13.6593C2.5 18.2658 6.30519 22.0001 10.9991 22.0001C15.6931 22.0001 19.4983 18.2658 19.4983 13.6593C19.4983 11.4743 18.6421 9.48547 17.2411 7.99838V3.73598C17.2411 2.77722 16.4491 2 15.4722 2Z" fill="#FFD13F" fillRule="evenodd" />
        <path d="M15.4731 2H6.5287C5.55174 2 4.75977 2.77722 4.75977 3.73598V9.25095C4.75977 10.2097 5.55174 10.9869 6.5287 10.9869H15.4731C16.45 10.9869 17.242 10.2097 17.242 9.25095V3.73598C17.242 2.77722 16.45 2 15.4731 2Z" fill="#4A87F2" />
        <path d="M13.72 2H8.27734V8.31632H13.72V2Z" fill="#E2DFFE" opacity="0.4" />
        <path d="M10.9991 21.9999C15.6931 21.9999 19.4983 18.2656 19.4983 13.6591C19.4983 9.05266 15.6931 5.31836 10.9991 5.31836C6.30519 5.31836 2.5 9.05266 2.5 13.6591C2.5 18.2656 6.30519 21.9999 10.9991 21.9999Z" fill="#D2D0CC" />
        <path d="M10.9998 20.8121C15.0254 20.8121 18.2888 17.6095 18.2888 13.659C18.2888 9.70841 15.0254 6.50586 10.9998 6.50586C6.97429 6.50586 3.71094 9.70841 3.71094 13.659C3.71094 17.6095 6.97429 20.8121 10.9998 20.8121Z" fill="#E8E6E2" opacity="0.5" />
        <path d="M16.1533 18.7167C19.0001 15.923 19.0001 11.3949 16.1533 8.60118C13.3065 5.80742 8.6925 5.80742 5.8457 8.60118L16.1533 18.7167Z" fill="#BBB9B6" />
        <path d="M8.4475 17.535C8.33704 17.535 8.2475 17.4455 8.2475 17.335V16.503C8.2475 16.4493 8.26912 16.3978 8.30748 16.3602L11.3195 13.407C11.9435 12.795 12.2075 12.351 12.2075 11.823C12.2075 11.139 11.7875 10.671 10.9835 10.671C10.2837 10.671 9.78957 11.0103 9.58671 11.8221C9.55908 11.9327 9.45059 12.0064 9.33934 11.9818L8.37023 11.7674C8.26741 11.7447 8.19922 11.6457 8.22073 11.5426C8.49447 10.2303 9.49226 9.375 10.9835 9.375C12.5915 9.375 13.6595 10.359 13.6595 11.847C13.6595 12.711 13.2875 13.443 12.1235 14.499L10.4486 16.0677C10.43 16.0851 10.4195 16.1095 10.4195 16.1349C10.4195 16.1858 10.4607 16.227 10.5116 16.227H13.6515C13.762 16.227 13.8515 16.3165 13.8515 16.427V17.335C13.8515 17.4455 13.762 17.535 13.6515 17.535H8.4475Z" fill="#2C2D30" />
      </svg>
    );
  }
  if (rank === 3) {
    return (
      <svg width="22" height="24" viewBox="0 0 22 24" fill="none">
        <path d="M4.75885 7.99661L6.21416 9.36849L6.75885 8.79068V7.99661H4.75885ZM17.2411 7.99838H15.2411V8.79212L15.7854 9.36985L17.2411 7.99838ZM13.7204 4H15.4722V0H13.7204V4ZM8.27783 4H13.7204V0H8.27783V4ZM6.52779 4H8.27783V0H6.52779V4ZM6.75885 3.73598C6.75885 3.91709 6.61977 4 6.52779 4V0C4.48189 0 2.75885 1.63736 2.75885 3.73598H6.75885ZM6.75885 7.99661V3.73598H2.75885V7.99661H6.75885ZM4.5 13.6593C4.5 12.0081 5.14463 10.5031 6.21416 9.36849L3.30354 6.62472C1.56901 8.46472 0.5 10.9386 0.5 13.6593H4.5ZM10.9991 20.0001C7.37414 20.0001 4.5 17.1259 4.5 13.6593H0.5C0.5 19.4056 5.23625 24.0001 10.9991 24.0001V20.0001ZM17.4983 13.6593C17.4983 17.1259 14.6241 20.0001 10.9991 20.0001V24.0001C16.762 24.0001 21.4983 19.4056 21.4983 13.6593H17.4983ZM15.7854 9.36985C16.8542 10.5043 17.4983 12.0088 17.4983 13.6593H21.4983C21.4983 10.9397 20.4301 8.46669 18.6968 6.62691L15.7854 9.36985ZM15.2411 3.73598V7.99838H19.2411V3.73598H15.2411ZM15.4722 4C15.3802 4 15.2411 3.91709 15.2411 3.73598H19.2411C19.2411 1.63736 17.5181 0 15.4722 0V4Z" fill="#111111" />
        <path d="M15.4722 2H13.7204H8.27783H6.52779C5.55083 2 4.75885 2.77722 4.75885 3.73598V7.99661C3.35682 9.48389 2.5 11.4734 2.5 13.6593C2.5 18.2658 6.30519 22.0001 10.9991 22.0001C15.6931 22.0001 19.4983 18.2658 19.4983 13.6593C19.4983 11.4743 18.6421 9.48547 17.2411 7.99838V3.73598C17.2411 2.77722 16.4491 2 15.4722 2Z" fill="#FFD13F" fillRule="evenodd" />
        <path d="M15.4731 2H6.5287C5.55174 2 4.75977 2.77722 4.75977 3.73598V9.25095C4.75977 10.2097 5.55174 10.9869 6.5287 10.9869H15.4731C16.45 10.9869 17.242 10.2097 17.242 9.25095V3.73598C17.242 2.77722 16.45 2 15.4731 2Z" fill="#4FE862" />
        <path d="M13.72 2H8.27734V8.31632H13.72V2Z" fill="#4A87F2" opacity="0.4" />
        <path d="M10.9991 21.9999C15.6931 21.9999 19.4983 18.2656 19.4983 13.6591C19.4983 9.05266 15.6931 5.31836 10.9991 5.31836C6.30519 5.31836 2.5 9.05266 2.5 13.6591C2.5 18.2656 6.30519 21.9999 10.9991 21.9999Z" fill="#FF7243" />
        <path d="M10.9998 20.8121C15.0254 20.8121 18.2888 17.6095 18.2888 13.659C18.2888 9.70841 15.0254 6.50586 10.9998 6.50586C6.97429 6.50586 3.71094 9.70841 3.71094 13.659C3.71094 17.6095 6.97429 20.8121 10.9998 20.8121Z" fill="#FFA080" opacity="0.5" />
        <path d="M16.1533 18.7167C19.0001 15.923 19.0001 11.3949 16.1533 8.60118C13.3065 5.80742 8.6925 5.80742 5.8457 8.60118L16.1533 18.7167Z" fill="#D95A2F" />
        <path d="M10.94 17.9915C9.36888 17.9915 8.34864 17.1922 8.04322 16.0445C8.01544 15.9401 8.08369 15.8366 8.18905 15.8129L9.14375 15.5979C9.24879 15.5742 9.35243 15.6386 9.39046 15.7393C9.60892 16.318 10.1005 16.6835 10.928 16.6835C11.864 16.6835 12.404 16.2515 12.404 15.4955C12.404 14.7275 11.84 14.2835 10.928 14.2835H10.3C10.1895 14.2835 10.1 14.194 10.1 14.0835V13.3075C10.1 13.197 10.1895 13.1075 10.3 13.1075H10.916C11.636 13.1075 12.14 12.6755 12.14 12.0275C12.14 11.3675 11.696 10.9835 10.976 10.9835C10.256 10.9835 9.7609 11.3414 9.56632 12.1327C9.53896 12.244 9.43006 12.3187 9.31817 12.294L8.35096 12.08C8.24805 12.0572 8.17983 11.9581 8.20163 11.8549C8.47685 10.5531 9.4859 9.6875 10.988 9.6875C12.488 9.6875 13.544 10.5875 13.544 11.8235C13.544 12.6214 13.0392 13.2587 12.2427 13.5558C12.2101 13.5679 12.188 13.5988 12.188 13.6335C12.188 13.6701 12.2127 13.7023 12.2479 13.7128C13.2871 14.0242 13.784 14.781 13.784 15.6995C13.784 17.0675 12.68 17.9915 10.94 17.9915Z" fill="#2C2D30" />
      </svg>
    );
  }
  return <div className="text-[15px] font-semibold text-[#b4b4b4] w-[22px] flex justify-center">{rank}</div>;
}

const NumberPad = ({ onNumberPress, onDelete }: { onNumberPress: (n: string) => void, onDelete: () => void }) => {
  const buttons = [
    { num: '1', letters: '' },
    { num: '2', letters: 'A B C' },
    { num: '3', letters: 'D E F' },
    { num: '4', letters: 'G H I' },
    { num: '5', letters: 'J K L' },
    { num: '6', letters: 'M N O' },
    { num: '7', letters: 'P Q R S' },
    { num: '8', letters: 'T U V' },
    { num: '9', letters: 'W X Y Z' },
    { num: '.', letters: '' },
    { num: '0', letters: '' },
    { num: 'del', letters: '' }
  ];

  return (
    <div className="grid grid-cols-3 gap-[6px] p-1.5 w-full pb-8 pt-1.5">
      {buttons.map((btn, i) => (
        <button
          key={i}
          onClick={(e) => {
            e.preventDefault();
            btn.num === 'del' ? onDelete() : onNumberPress(btn.num);
          }}
          className={`flex flex-col items-center justify-center active:bg-[#6b6b6b] rounded-[10px] h-[52px] border-none cursor-pointer ${btn.num === '.' || btn.num === 'del'
            ? 'bg-transparent shadow-none'
            : 'bg-[#515151] shadow-sm'
            }`}
        >
          {btn.num === 'del' ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path>
              <line x1="18" y1="9" x2="12" y2="15"></line>
              <line x1="12" y1="9" x2="18" y2="15"></line>
            </svg>
          ) : (
            <>
              <span className="text-[25px] leading-[30px] font-normal text-[#ffffff]">{btn.num}</span>
              {btn.letters && <span className="text-[10px] leading-[10px] font-bold text-[#ffffff] tracking-[1px] mt-0.5">{btn.letters}</span>}
            </>
          )}
        </button>
      ))}
    </div>
  );
};

// ── Token Picker Modal ──
function TokenPickerModal({
  visible,
  onClose,
  onSelect,
  tokens,
  prices,
  balances,
  excludeSymbol,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (symbol: string) => void;
  tokens: TokenInfo[];
  prices: Record<string, { usd: number; image?: string }>;
  balances: Record<string, number>;
  excludeSymbol?: string;
}) {
  const [search, setSearch] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (visible) {
      setSearch("");
      setIsClosing(false);
      const timer = setTimeout(() => {
        inputRef.current?.focus({ preventScroll: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 180);
  };

  if (!visible || !mounted) return null;

  const filtered = tokens.filter(t =>
    t.symbol !== excludeSymbol &&
    (t.name.toLowerCase().includes(search.toLowerCase()) || t.symbol.toLowerCase().includes(search.toLowerCase()))
  );

  return createPortal(
    <div className="fixed top-0 left-0 w-full h-[100vh] z-[120] flex flex-col justify-end items-center sm:px-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isClosing ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="absolute inset-0 bg-black/15"
        onClick={handleClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: isClosing ? "100%" : 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 38, stiffness: 420, mass: 0.75 }}
        className="w-full max-w-md bg-[#111111] overflow-hidden relative flex flex-col rounded-t-[32px] will-change-transform"
        style={{ height: "94vh", transform: "translateZ(0)" }}
      >
        {/* Sticky Header styled like SendModal select token */}
        <div className="sticky top-0 z-10 bg-[#111111]">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <span className="text-xl font-medium text-[#eeeeee]">Select Token</span>
            <button
              onClick={handleClose}
              className="bg-transparent border-none p-2 cursor-pointer z-10 rounded-full active:bg-white/5 transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#eeeeee" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div className="px-4 pt-1 pb-1">
            <div className="flex items-center gap-2 bg-[#222222] rounded-lg h-10 px-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b4b4b4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                ref={inputRef}
                placeholder="Search..."
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-[#eeeeee] text-[16px] leading-5 placeholder:text-[#b4b4b4]"
              />
            </div>
          </div>
        </div>

        {/* Token List */}
        <div className="flex-1 overflow-y-auto px-4 pt-3 pb-12 no-scrollbar" style={{ overscrollBehavior: "contain" }}>
          <div className="flex flex-col gap-2.5">
            {filtered.map((token) => {
              const bal = balances[token.symbol] ?? 0;
              const price = prices[token.symbol]?.usd ?? token.price;
              return (
                <button
                  key={token.symbol}
                  onClick={() => {
                    onSelect(token.symbol);
                    handleClose();
                  }}
                  className="flex items-center gap-3 bg-[#222222] rounded-[22px] p-4 border-none cursor-pointer text-left w-full active:scale-[0.98] transition-all group"
                >
                  <div className="w-12 h-12 rounded-[14px] flex-shrink-0  flex items-center justify-center">
                    <TokenLogo
                      token={token}
                      size={48}
                      liveImage={prices[token.symbol]?.image}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="text-[15px] font-semibold text-[#eeeeee] truncate">{token.name}</span>
                        {TOKENS.some(t => t.symbol === token.symbol) && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                            <path fill="#AB9FF2" fillRule="evenodd" clipRule="evenodd" d="M12.737 1.271a1.136 1.136 0 0 0-1.473 0l-2.46 2.097a1.136 1.136 0 0 1-.647.268l-3.222.257a1.136 1.136 0 0 0-1.041 1.041l-.257 3.222a1.136 1.136 0 0 1-.268.647L1.272 11.263a1.136 1.136 0 0 0 0 1.473l2.097 2.46a1.136 1.136 0 0 1 .268.647l.257 3.222a1.136 1.136 0 0 0 1.041 1.041l3.222.257a1.136 1.136 0 0 1 .647.268l2.46 2.097a1.136 1.136 0 0 0 1.473 0l2.46-2.097a1.136 1.136 0 0 1 .647-.268l3.222-.257a1.136 1.136 0 0 0 1.041-1.041l.257-3.222a1.136 1.136 0 0 1 .268-.647l2.097-2.46a1.136 1.136 0 0 0 0-1.473l-2.097-2.46a1.136 1.136 0 0 1-.268-.647l-.257-3.222a1.136 1.136 0 0 0-1.041-1.041l-3.222-.257a1.136 1.136 0 0 1-.647-.268zm4.077 8.31a1 1 0 1 0-1.628-1.162l-4.314 6.04-2.165-2.166a1 1 0 0 0-1.414 1.414l3 3a1 1 0 0 0 1.52-.126z"></path>
                          </svg>
                        )}
                      </div>
                      <span className="text-[15px] font-semibold text-[#eeeeee] whitespace-nowrap pl-2">
                        {bal > 0 ? formatBalance(bal) : "0"} {token.symbol}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-[2px]">
                      <span className="text-[14px] font-normal text-[#b4b4b4] truncate max-w-[150px]">
                        {token.symbol}
                      </span>
                      <span className="text-[14px] font-normal text-[#b4b4b4]">
                        {formatCurrency(bal * price, "USD")}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="py-12 text-center text-[#888]">
                <p className="font-medium">No tokens found</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}


import { SwapToast } from "../_components/swap-toast";

export default function SwapPage() {
  const { baseCurrency, tokenBalances, addTransaction, updateBalance, customTokens, setTokenPickerVisible } = useWalletStore();
  const { prices } = useLivePrices();

  const allTokens = useMemo(() => [...TOKENS, ...customTokens], [customTokens]);
  const balanceMap = useMemo(() => {
    const map: Record<string, number> = {};
    tokenBalances.forEach(b => { map[b.symbol] = b.balance; });
    return map;
  }, [tokenBalances]);

  // Swap state
  const [payToken, setPayToken] = useState("SOL");
  const [receiveToken, setReceiveToken] = useState("USDC");
  const [payAmount, setPayAmount] = useState("");
  const [pickerTarget, setPickerTarget] = useState<"pay" | "receive" | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);
  const [showSuccess, setShowSuccess] = useState<{ fromSymbol: string; toSymbol: string; fromAmount: string; toAmount: string } | null>(null);
  const [toastState, setToastState] = useState<"swapping" | "swapped" | null>(null);
  const [isUsdMode, setIsUsdMode] = useState(false);
  const [isKeypadVisible, setIsKeypadVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const setFooterHidden = useWalletStore(s => s.setFooterHidden);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setFooterHidden(isKeypadVisible);
    return () => setFooterHidden(false);
  }, [isKeypadVisible, setFooterHidden]);

  useEffect(() => {
    setTokenPickerVisible(pickerTarget !== null);
    return () => {
      setTokenPickerVisible(false);
    };
  }, [pickerTarget, setTokenPickerVisible]);

  // Trending tokens
  const [activeTab, setActiveTab] = useState<'tokens' | 'perps'>('tokens');
  const [trendingTokens, setTrendingTokens] = useState<TrendingToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTokens() {
      setIsLoading(true);
      const tokens = await fetchTrendingSolanaTokens(20, baseCurrency);
      setTrendingTokens(tokens);
      setIsLoading(false);
    }
    loadTokens();
  }, [baseCurrency]);

  // Price calculation
  const payTokenInfo = allTokens.find(t => t.symbol === payToken) || TOKENS[0];
  const receiveTokenInfo = allTokens.find(t => t.symbol === receiveToken) || TOKENS.find(t => t.symbol === 'USDC') || TOKENS[0];
  const payPrice = prices[payToken]?.usd ?? payTokenInfo.price;
  const receivePrice = prices[receiveToken]?.usd ?? receiveTokenInfo.price;

  const payAmountNum = parseFloat(payAmount) || 0;
  const payAmountInToken = isUsdMode ? (payPrice > 0 ? payAmountNum / payPrice : 0) : payAmountNum;
  const payAmountInUsd = isUsdMode ? payAmountNum : payAmountNum * payPrice;

  const receiveAmount = receivePrice > 0 ? payAmountInUsd / receivePrice : 0;

  const handleNumberPress = (num: string) => {
    setPayAmount((prev) => {
      if (num === "." && prev.includes(".")) return prev;
      if (prev === "0" && num !== ".") return num;
      if (prev.length >= 12) return prev;
      return prev + num;
    });
  };

  const handleDelete = () => {
    setPayAmount((prev) => prev.slice(0, -1));
  };

  const handlePillPress = (pct: number) => {
    let bal = isUsdMode ? payBalance * payPrice : payBalance;
    if (bal <= 0) return;
    let val = bal * pct;
    const strVal = val.toLocaleString("en-US", { useGrouping: false, maximumFractionDigits: 6 });
    setPayAmount(strVal);
  };
  const receiveAmountFormatted = receiveAmount > 0
    ? receiveAmount >= 1
      ? receiveAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })
      : receiveAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 8 })
    : "0";

  const payBalance = balanceMap[payToken] ?? 0;
  const receiveBalance = balanceMap[receiveToken] ?? 0;
  const payValueUsd = payAmountInUsd;
  const receiveValueUsd = receiveAmount * receivePrice;
  const pricingRate = receivePrice > 0 ? payPrice / receivePrice : 0;

  const canSwap = payAmountInToken > 0 && payAmountInToken <= payBalance && payToken !== receiveToken;
  const isInsufficientBalance = payAmountInToken > 0 && payAmountInToken > payBalance;

  // Swap tokens
  const handleFlip = useCallback(() => {
    setPayToken(receiveToken);
    setReceiveToken(payToken);
  }, [payToken, receiveToken]);

  // Execute swap
  const handleSwap = useCallback(() => {
    if (!canSwap) return;

    setToastState("swapping");

    // Capture swap details before clearing amount
    const sourceToken = payToken;
    const destToken = receiveToken;
    const amtPayToken = payAmountInToken;
    const amtReceive = receiveAmount;

    setPayAmount("");

    // Scroll to top smoothly
    const scrollContainer = document.querySelector(".wallet-scroll");
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Simulate processing delay
    const delay = Math.floor(Math.random() * 2001) + 3000;
    setTimeout(() => {
      // Update balances explicitly
      const currentPayBal = tokenBalances.find(b => b.symbol === sourceToken)?.balance ?? 0;
      const currentReceiveBal = tokenBalances.find(b => b.symbol === destToken)?.balance ?? 0;

      updateBalance(sourceToken, Math.max(0, currentPayBal - amtPayToken));
      updateBalance(destToken, currentReceiveBal + amtReceive);

      addTransaction({
        type: 'swap',
        token: sourceToken,
        amount: amtPayToken,
        toToken: destToken,
        toAmount: amtReceive,
        status: 'confirmed',
        from: 'Self',
        to: 'Self',
      });

      // Play sound
      const audio = new Audio("/sound-effect/confetti.mp3");
      audio.play().catch(e => console.log("Audio play failed:", e));

      setToastState("swapped");

      setTimeout(() => {
        setToastState(null);
      }, 2500);
    }, delay);
  }, [canSwap, payToken, receiveToken, payAmountInToken, receiveAmount, tokenBalances, updateBalance, addTransaction]);

  // Quick amount buttons
  const handleQuickAmount = (fraction: number) => {
    const amount = payBalance * fraction;
    if (amount > 0) {
      if (isUsdMode) {
        const usdValue = amount * payPrice;
        setPayAmount(usdValue.toFixed(2));
      } else {
        const decimals = payPrice > 100 ? 6 : 4;
        setPayAmount(amount.toFixed(decimals).replace(/\.?0+$/, ""));
      }
    }
  };

  const buttonText = toastState === "swapping"
    ? "Swapping..."
    : isInsufficientBalance
      ? "Insufficient balance"
      : payAmountNum === 0
        ? "Enter an amount"
        : "Swap Now";

  const buttonDisabled = !canSwap || toastState !== null;

  return (
    <div className="flex flex-col pb-44 bg-transparent text-[#eeeeee]">

      {/* Categories */}
      {/* <div className="flex items-center gap-3 px-4 mt-2 mb-2 overflow-x-auto no-scrollbar">
        <button className="bg-[#1c1c1e] text-[#eeeeee] px-4 py-2.5 rounded-full flex items-center gap-2 shrink-0 border border-[#2b2b2b]">
          <Sparkles size={16} className="text-[#ab9ff2]" />
          <span className="font-medium text-[15px]">Featured</span>
        </button>
        <button className="bg-[#1c1c1e] text-[#eeeeee] px-4 py-2.5 rounded-full flex items-center gap-2 shrink-0 border border-[#2b2b2b]">
          <BadgeCent size={16} className="text-[#ab9ff2]" />
          <span className="font-medium text-[15px]">Top Volume</span>
        </button>
        <button className="bg-[#1c1c1e] text-[#eeeeee] px-4 py-2.5 rounded-full flex items-center gap-2 shrink-0 border border-[#2b2b2b]">
          <ArrowUp size={16} className="text-[#ab9ff2]" />
          <span className="font-medium text-[15px]">Top Gainers</span>
        </button>
      </div> */}

      <div className="flex flex-col px-4 pt-2">
        {/* You Pay Section */}
        <div className="flex flex-col bg-[#1c1c1e] rounded-[16px] p-4 relative z-0">
          <div className="text-[#eeeeee] text-[15px] font-semibold mb-2 opacity-40">You Pay</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1 min-w-0">
              {isUsdMode && (
                <span className="text-[#eeeeee] font-bold text-[30px] mr-1 select-none leading-none">$</span>
              )}
              <input
                readOnly
                inputMode="none"
                placeholder="0"
                className="bg-transparent text-[#eeeeee] font-semibold outline-none placeholder-[#6e6e6e] text-[30px] w-full flex-1 caret-transparent cursor-pointer"
                style={{ fontSize: "30px", lineHeight: "1" }}
                type="text"
                value={payAmount}
                onClick={() => setIsKeypadVisible(true)}
              />
            </div>
            <button
              onClick={() => setPickerTarget("pay")}
              className="flex items-center rounded-full pl-1.5 pr-2.5 py-1.5 active:opacity-70 bg-[#2c2c2e] ml-3 flex-shrink-0"
            >
              <TokenLogo token={payTokenInfo} size={32} liveImage={prices[payToken]?.image} />
              <span className="text-[#eeeeee] font-bold text-[18px] mx-2">{payToken}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-0.5"><path fill="#AB9FF2" fillRule="evenodd" clipRule="evenodd" d="M12.737 1.271a1.136 1.136 0 0 0-1.473 0l-2.46 2.097a1.136 1.136 0 0 1-.647.268l-3.222.257a1.136 1.136 0 0 0-1.042 1.041l-.257 3.223a1.136 1.136 0 0 1-.268.646l-2.097 2.46a1.136 1.136 0 0 0 0 1.474l2.097 2.46c.155.182.249.408.268.646l.257 3.223c.044.556.486.997 1.042 1.041l3.222.257c.238.02.464.113.646.268l2.46 2.097a1.136 1.136 0 0 0 1.474 0l2.46-2.097c.182-.155.408-.249.646-.268l3.223-.257a1.136 1.136 0 0 0 1.041-1.041l.258-3.223c.019-.238.112-.464.267-.646l2.097-2.46a1.136 1.136 0 0 0 0-1.474l-2.097-2.46a1.136 1.136 0 0 1-.267-.646l-.258-3.223a1.136 1.136 0 0 0-1.041-1.041l-3.223-.257a1.136 1.136 0 0 1-.646-.268zm4.077 8.31a1 1 0 1 0-1.628-1.162l-4.314 6.04-2.165-2.166a1 1 0 0 0-1.414 1.414l3 3a1 1 0 0 0 1.52-.126z"></path></svg>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b4b4b4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 9 7 7 7-7"></path></svg>
            </button>
          </div>
          <div className="flex items-center justify-between mt-2 text-[#b4b4b4] text-[15px] font-semibold h-[28px]">
            {/* Left aligned container with Switch units button and equivalent metrics to its left */}
            <div className="flex items-center gap-2">
              {payAmount !== "" && (
                <span className="text-[#eeeeee]">
                  {isUsdMode
                    ? `${payAmountInToken.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 })} ${payToken}`
                    : formatCurrency(payAmountInUsd, baseCurrency)
                  }
                </span>
              )}
              <button
                onClick={() => setIsUsdMode(!isUsdMode)}
                className="w-[28px] h-[28px] rounded-full bg-[#2c2c2e] hover:bg-[#3a3a3c] flex items-center justify-center text-[#eeeeee]/60 active:scale-95 transition-all shadow-sm cursor-pointer flex-shrink-0"
                title="Switch units"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="opacity-70">
                  <path
                    d="m14 15 4 4m0 0 4-4m-4 4V8a4 4 0 0 0-4-4m-4 5L6 5m0 0L2 9m4-4v11a4 4 0 0 0 4 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {/* Right aligned pay token balance */}
            <span>
              {formatBalance(payBalance)} {payToken}
            </span>
          </div>
        </div>
        {/* Swap Arrow Button */}
        <div className="flex justify-center -my-3 relative z-10">
          <button
            onClick={handleFlip}
            className="w-10 h-10 bg-[#AD9CF2] rounded-full flex items-center justify-center active:scale-95 transition-transform"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="m14 15 4 4m0 0 4-4m-4 4V8a4 4 0 0 0-4-4m-4 5L6 5m0 0L2 9m4-4v11a4 4 0 0 0 4 4" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
          </button>
        </div>

        {/* You Receive Section */}
        <div className="flex flex-col bg-[#1c1c1e] rounded-[16px] p-4 relative z-0">
          <div className="text-[#eeeeee] text-[15px] font-semibold mb-2 opacity-40">You Receive</div>
          <div className="flex items-center justify-between">
            <input
              readOnly
              placeholder="0"
              className="bg-transparent font-semibold outline-none placeholder-[#6e6e6e] text-[30px] w-1/2 flex-1"
              style={{ color: receiveAmount > 0 ? "#eeeeee" : "#6e6e6e", fontSize: "30px", lineHeight: "1" }}
              type="text"
              value={receiveAmount > 0 ? receiveAmountFormatted : ""}
            />
            <button
              onClick={() => setPickerTarget("receive")}
              className="flex items-center rounded-full pl-1.5 pr-2.5 py-1.5 active:opacity-70 bg-[#2c2c2e] ml-3"
            >
              <TokenLogo token={receiveTokenInfo} size={32} liveImage={prices[receiveToken]?.image} />
              <span className="text-[#eeeeee] font-semibold text-[17px] mx-2">{receiveToken}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-0.5"><path fill="#AB9FF2" fillRule="evenodd" clipRule="evenodd" d="M12.737 1.271a1.136 1.136 0 0 0-1.473 0l-2.46 2.097a1.136 1.136 0 0 1-.647.268l-3.222.257a1.136 1.136 0 0 0-1.042 1.041l-.257 3.223a1.136 1.136 0 0 1-.268.646l-2.097 2.46a1.136 1.136 0 0 0 0 1.474l2.097 2.46c.155.182.249.408.268.646l.257 3.223c.044.556.486.997 1.042 1.041l3.222.257c.238.02.464.113.646.268l2.46 2.097a1.136 1.136 0 0 0 1.474 0l2.46-2.097c.182-.155.408-.249.646-.268l3.223-.257a1.136 1.136 0 0 0 1.041-1.041l.258-3.223c.019-.238.112-.464.267-.646l2.097-2.46a1.136 1.136 0 0 0 0-1.474l-2.097-2.46a1.136 1.136 0 0 1-.267-.646l-.258-3.223a1.136 1.136 0 0 0-1.041-1.041l-3.223-.257a1.136 1.136 0 0 1-.646-.268zm4.077 8.31a1 1 0 1 0-1.628-1.162l-4.314 6.04-2.165-2.166a1 1 0 0 0-1.414 1.414l3 3a1 1 0 0 0 1.52-.126z"></path></svg>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b4b4b4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 9 7 7 7-7"></path></svg>
            </button>
          </div>
          <div className="flex items-center justify-between mt-2 text-[#b4b4b4] text-[15px] font-semibold h-[28px]">
            {/* Left aligned receive equivalent amount */}
            <span className={payAmount !== "" ? "text-[#eeeeee]" : ""}>
              {payAmount === ""
                ? "$0.00"
                : formatCurrency(receiveAmount * receivePrice, baseCurrency)
              }
            </span>

            {/* Right aligned receive token balance */}
            <span>
              {formatBalance(receiveBalance)} {receiveToken}
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Conversion Details and Action Button */}
      {payAmountNum > 0 ? (
        <>
          {/* Info Metrics Card */}
          <div className="px-4 mt-4">
            <div className="bg-[#1c1c1e] rounded-[20px] overflow-hidden flex flex-col">

              {/* Row 1: Pricing */}
              <div className="flex justify-between items-center px-4 py-3.5 border-b border-white/[0.04]">
                <div className="flex items-center text-[#eeeeee] text-base font-medium tracking-tight">
                  <span>Pricing</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80 ml-1.5 flex-shrink-0 align-middle">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                  </svg>
                </div>
                <div className="flex items-center text-[#b4b4b4] text-base opacity-60 font-medium tracking-tight">
                  <span>1 {payToken} ≈ {pricingRate.toLocaleString("en-US", { maximumFractionDigits: 6 })} {receiveToken}</span>
                  <ChevronRight size={20} className="ml-1 flex-shrink-0" />
                </div>
              </div>

              {/* Row 2: Slippage */}
              <div className="flex justify-between items-center px-4 py-3.5 border-b border-white/[0.04]">
                <div className="flex items-center text-[#eeeeee] text-base font-medium tracking-tight">
                  <span>Slippage</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80 ml-1.5 flex-shrink-0 align-middle">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                  </svg>
                </div>
                <div className="flex items-center text-[#b4b4b4] text-base opacity-60 font-medium tracking-tight">
                  <span>Auto · 0.6%</span>
                  <ChevronRight size={20} className="ml-1 flex-shrink-0" />
                </div>
              </div>

              {/* Row 3: Price Impact */}
              <div className="flex justify-between items-center px-4 py-3.5 border-b border-white/[0.04]">
                <div className="flex items-center text-[#eeeeee] text-base font-medium tracking-tight">
                  <span>Price Impact</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80 ml-1.5 flex-shrink-0 align-middle">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                  </svg>
                </div>
                <span className="text-[#b4b4b4] text-base opacity-60 font-medium tracking-tight">0%</span>
              </div>

              {/* Row 4: Fees */}
              <div className="flex justify-between items-center px-4 py-3.5">
                <div className="flex items-center text-[#eeeeee] text-base font-medium tracking-tight">
                  <span>Fees</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80 ml-1.5 flex-shrink-0 align-middle">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                  </svg>
                </div>
                <span className="text-[#b4b4b4] text-base opacity-60 font-medium tracking-tight">$0.04</span>
              </div>
            </div>

            {/* Footnote statement */}
            <div className="flex items-center gap-1 mt-6 text-white/60 text-[13px] font-medium leading-none">
              <span>Quote includes a 0.85% Ph4ntom fee</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-35 align-middle ml-0.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </div>
          </div>

          {/* Swap Button */}
          <div className="px-4 mt-6">
            <button
              disabled={buttonDisabled}
              onClick={handleSwap}
              className="w-full py-4 rounded-[16px] font-bold text-[17px] tracking-tight transition-all disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed flex items-center justify-center"
              style={{
                background: isInsufficientBalance
                  ? "rgb(220, 38, 38)"
                  : buttonDisabled
                    ? "rgba(171, 159, 242, 0.4)"
                    : "#AB9FF2",
                color: isInsufficientBalance ? "#ffffff" : "#0c0814",
              }}
            >
              {buttonText}
            </button>
          </div>
        </>
      ) : (
        <>
          {/* ── Tokens / Perps Tabs ── */}
          <div className="mt-6">
            <div className="flex items-center gap-4 px-4">
              <button className={`text-2xl font-semibold transition-colors ${activeTab === 'tokens' ? 'text-[#eeeeee]' : 'text-[#6e6e6e]'}`} onClick={() => setActiveTab('tokens')}>
                Tokens
              </button>
              <button className={`text-2xl font-semibold transition-colors ${activeTab === 'perps' ? 'text-[#eeeeee]' : 'text-[#6e6e6e]'}`} onClick={() => setActiveTab('perps')}>
                Perps
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 px-4 py-3 mt-1 overflow-x-auto scrollbar-hide text-[#eeeeee] text-[15px] font-medium tracking-tight">
              <button className="flex items-center gap-1 whitespace-nowrap active:opacity-70 px-2.5 py-1 bg-[#282828] rounded-lg">
                Rank ▾
              </button>
              <button className="flex items-center gap-1 whitespace-nowrap active:opacity-70 px-2.5 py-1 bg-[#282828] rounded-lg">
                Solana ▾
              </button>
              <button className="flex items-center gap-1 whitespace-nowrap active:opacity-70 px-2.5 py-1 bg-[#282828] rounded-lg">
                24h ▾
              </button>
            </div>

            {/* Token List */}
            <div className="pb-4">
              {isLoading && trendingTokens.length === 0 ? (
                <div className="flex flex-col">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="w-full flex items-center gap-3 px-4 py-3.5">
                      <Skeleton className="w-6 h-6 flex-shrink-0 bg-[#2C2C2E]" />
                      <div className="relative flex-shrink-0 ml-1">
                        <Skeleton className="w-[48px] h-[48px] rounded-full bg-[#2C2C2E]" />
                      </div>
                      <div className="flex-1 flex flex-col gap-2 ml-3">
                        <Skeleton className="h-4 w-32 rounded bg-[#2C2C2E]" />
                        <Skeleton className="h-3 w-20 rounded bg-[#2C2C2E]" />
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Skeleton className="h-4 w-16 rounded bg-[#2C2C2E]" />
                        <Skeleton className="h-3 w-12 rounded bg-[#2C2C2E]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {trendingTokens.map((token) => {
                    const isPositive = token.priceChange24h >= 0;
                    return (
                      <div key={token.id} className="w-full flex items-center justify-between px-4 py-3 active:bg-[#1a1a1a] transition-colors cursor-pointer">
                        <div className="flex items-center flex-1 min-w-0">
                          <div className="flex items-center justify-center flex-shrink-0 mr-3">
                            <TokenRankIcon rank={token.rank} />
                          </div>

                          <div className="relative flex-shrink-0">
                            <div className="relative rounded-full overflow-hidden flex items-center justify-center text-white font-bold" style={{ width: "48px", height: "48px", background: getRankBadgeColor(token.rank), fontSize: "14px" }}>
                              {getTokenInitials(token.name)}
                              <Image alt={token.name} width={48} height={48} className="absolute inset-0 rounded-full object-cover" src={token.image} unoptimized />
                            </div>
                            <div
                              className="absolute flex items-center justify-center rounded-[6px] bg-white border-[#111] border-2 shadow-sm"
                              style={{
                                width: "18px",
                                height: "18px",
                                bottom: "-2px",
                                right: "-2px",
                                padding: "3px"
                              }}
                            >
                              <img
                                src="https://cryptologos.cc/logos/solana-sol-logo.svg?v=024"
                                alt="solana"
                                className="w-full h-full object-contain grayscale brightness-0"
                              />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0 text-left ml-3">
                            <div className="text-[#eeeeee] font-semibold text-[16px] leading-tight truncate tracking-tight">{token.symbol || token.name}</div>
                            <div className="text-[#b4b4b4] text-[14px] font-medium tracking-tight mt-0.5">{formatMarketCap(token.marketCap, baseCurrency)}</div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0 pl-3">
                          <div className="text-[#eeeeee] font-semibold text-[16px] leading-tight tracking-tight">{formatPrice(token.price, baseCurrency)}</div>
                          <div className="text-[14px] font-medium tracking-tight mt-0.5" style={{ color: isPositive ? "#4FE862" : "rgb(238, 66, 32)" }}>
                            {formatChange(token.priceChange24h)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Disclaimer */}
            <div className="px-4 pt-4 pb-8">
              <p className="text-[12px] text-[#b4b4b4] leading-relaxed font-normal">
                Tokenized Stocks are blockchain-based instruments issued by third parties that are designed to follow underlying equity performance. While they track price movements and mechanics of actual securities, they do not confer ownership rights or shareholder benefits. They are available in select jurisdictions only. Token lists are generated using market data provided by various third party providers including CoinGecko, Birdeye, Jupiter and Hyperliquid. Performance shown is based on the selected period. Past performance is not indicative of future performance.
              </p>
            </div>
          </div>
        </>
      )}

      {/* NumberPad Modal Slide Up */}
      {mounted && createPortal(
        <AnimatePresence>
          {isKeypadVisible && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[110] bg-transparent"
                onClick={() => setIsKeypadVisible(false)}
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 350 }}
                className="fixed bottom-0 left-0 right-0 z-[120] flex flex-col gap-3 max-w-[430px] mx-auto"
              >
                {/* Pills outside the glass container */}
                <div className="flex items-center gap-[8px] px-3">
                  <button onClick={() => handlePillPress(0.25)} className="flex-1 py-3.5 rounded-full bg-[#1c1c1c] active:bg-[#3a3a3c] text-[#eeeeee] text-[16px] font-semibold transition-colors shadow-lg border border-white/5">25%</button>
                  <button onClick={() => handlePillPress(0.50)} className="flex-1 py-3.5 rounded-full bg-[#1c1c1c] active:bg-[#3a3a3c] text-[#eeeeee] text-[16px] font-semibold transition-colors shadow-lg border border-white/5">50%</button>
                  <button onClick={() => handlePillPress(1)} className="flex-1 py-3.5 rounded-full bg-[#1c1c1c] active:bg-[#3a3a3c] text-[#eeeeee] text-[16px] font-semibold transition-colors shadow-lg border border-white/5">Max</button>
                  <button onClick={() => setIsKeypadVisible(false)} className="flex-1 py-3.5 rounded-full bg-[#1c1c1c] active:bg-[#3a3a3c] text-[#eeeeee] text-[16px] font-semibold transition-colors shadow-lg border border-white/5">Done</button>
                </div>

                {/* Glassmorphic container ONLY for keypad */}
                <div
                  className="bg-[#3a3a3c]/50 backdrop-blur-2xl shadow-[0_-8px_40px_rgba(0,0,0,0.5)] border-t border-white/10"
                  style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}
                >
                  <NumberPad onNumberPress={handleNumberPress} onDelete={handleDelete} />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Floating Success Toast Portal */}
      <AnimatePresence>
        {toastState && (
          <SwapToast
            status={toastState}
            fromSymbol={payToken}
            toSymbol={receiveToken}
          />
        )}
      </AnimatePresence>

      {/* Token Picker Modal */}
      <TokenPickerModal
        visible={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        onSelect={(symbol) => {
          if (pickerTarget === "pay") {
            if (symbol === receiveToken) setReceiveToken(payToken);
            setPayToken(symbol);
          } else {
            if (symbol === payToken) setPayToken(receiveToken);
            setReceiveToken(symbol);
          }
          setPayAmount("");
        }}
        tokens={allTokens}
        prices={prices}
        balances={balanceMap}
        excludeSymbol={undefined}
      />


    </div>
  );
}
