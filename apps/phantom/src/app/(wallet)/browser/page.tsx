"use client";

import React, { useState } from "react";
import { useWalletStore } from "@/lib/wallet-store";
import Avatar from "../_components/avatar";

// ── Overlapping Rank Shield Vector Badges ──
const Rank1Shield = () => (
  <svg width="22" height="24" viewBox="0 0 22 24" fill="none">
    <path d="M4.75885 7.99661L6.21416 9.36849L6.75885 8.79068V7.99661H4.75885ZM17.2411 7.99838H15.2411V8.79212L15.7854 9.36985L17.2411 7.99838ZM13.7204 4H15.4722V0H13.7204V4ZM8.27783 4H13.7204V0H8.27783V4ZM6.52779 4H8.27783V0H6.52779V4ZM6.75885 3.73598C6.75885 3.91709 6.61977 4 6.52779 4V0C4.48189 0 2.75885 1.63736 2.75885 3.73598H6.75885ZM6.75885 7.99661V3.73598H2.75885V7.99661H6.75885ZM4.5 13.6593C4.5 12.0081 5.14463 10.5031 6.21416 9.36849L3.30354 6.62472C1.56901 8.46472 0.5 10.9386 0.5 13.6593H4.5ZM10.9991 20.0001C7.37414 20.0001 4.5 17.1259 4.5 13.6593H0.5C0.5 19.4056 5.23625 24.0001 10.9991 24.0001V20.0001ZM17.4983 13.6593C17.4983 17.1259 14.6241 20.0001 10.9991 20.0001V24.0001C16.762 24.0001 21.4983 19.4056 21.4983 13.6593H17.4983ZM15.7854 9.36985C16.8542 10.5043 17.4983 12.0088 17.4983 13.6593H21.4983C21.4983 10.9397 20.4301 8.46669 18.6968 6.62691L15.7854 9.36985ZM15.2411 3.73598V7.99838H19.2411V3.73598H15.2411ZM15.4722 4C15.3802 4 15.2411 3.91709 15.2411 3.73598H19.2411C19.2411 1.63736 17.5181 0 15.4722 0V4Z" fill="#111111"></path>
    <path d="M15.4722 2H13.7204H8.27783H6.52779C5.55083 2 4.75885 2.77722 4.75885 3.73598V7.99661C3.35682 9.48389 2.5 11.4734 2.5 13.6593C2.5 18.2658 6.30519 22.0001 10.9991 22.0001C15.6931 22.0001 19.4983 18.2658 19.4983 13.6593C19.4983 11.4743 18.6421 9.48547 17.2411 7.99838V3.73598C17.2411 2.77722 16.4491 2 15.4722 2Z" fill="#FFD13F" fillRule="evenodd"></path>
    <path d="M15.4731 2H6.5287C5.55174 2 4.75977 2.77722 4.75977 3.73598V9.25095C4.75977 10.2097 5.55174 10.9869 6.5287 10.9869H15.4731C16.45 10.9869 17.242 10.2097 17.242 9.25095V3.73598C17.242 2.77722 16.45 2 15.4731 2Z" fill="#AB9FF2"></path>
    <path d="M13.72 2H8.27734V8.31632H13.72V2Z" fill="#E2DFFE" opacity="0.5"></path>
    <path d="M10.9991 21.9999C15.6931 21.9999 19.4983 18.2656 19.4983 13.6591C19.4983 9.05266 15.6931 5.31836 10.9991 5.31836C6.30519 5.31836 2.5 9.05266 2.5 13.6591C2.5 18.2656 6.30519 21.9999 10.9991 21.9999Z" fill="#FFD13F"></path>
    <path d="M10.9998 20.8121C15.0254 20.8121 18.2888 17.6095 18.2888 13.659C18.2888 9.70841 15.0254 6.50586 10.9998 6.50586C6.97429 6.50586 3.71094 9.70841 3.71094 13.659C3.71094 17.6095 6.97429 20.8121 10.9998 20.8121Z" fill="#FFFFC4" opacity="0.5"></path>
    <path d="M16.1533 18.7167C19.0001 15.923 19.0001 11.3949 16.1533 8.60118C13.3065 5.80742 8.6925 5.80742 5.8457 8.60118L16.1533 18.7167Z" fill="#F1C63C"></path>
    <path d="M10.7135 17.8549C10.603 17.8549 10.5135 17.7653 10.5135 17.6549V11.6838C10.5135 11.5302 10.3474 11.4339 10.2141 11.5102L8.9888 12.2115C8.85547 12.2878 8.68945 12.1916 8.68945 12.038V11.0128C8.68945 10.94 8.72895 10.873 8.7926 10.8378L10.5523 9.86388C10.5819 9.84747 10.6152 9.83887 10.6491 9.83887H11.7415C11.8519 9.83887 11.9415 9.92841 11.9415 10.0389V17.6549C11.9415 17.7653 11.8519 17.8549 11.7415 17.8549H10.7135Z" fill="#2C2D30"></path>
  </svg>
);

const Rank2Shield = () => (
  <svg width="22" height="24" viewBox="0 0 22 24" fill="none">
    <path d="M4.75885 7.99661L6.21416 9.36849L6.75885 8.79068V7.99661H4.75885ZM17.2411 7.99838H15.2411V8.79212L15.7854 9.36985L17.2411 7.99838ZM13.7204 4H15.4722V0H13.7204V4ZM8.27783 4H13.7204V0H8.27783V4ZM6.52779 4H8.27783V0H6.52779V4ZM6.75885 3.73598C6.75885 3.91709 6.61977 4 6.52779 4V0C4.48189 0 2.75885 1.63736 2.75885 3.73598H6.75885ZM6.75885 7.99661V3.73598H2.75885V7.99661H6.75885ZM4.5 13.6593C4.5 12.0081 5.14463 10.5031 6.21416 9.36849L3.30354 6.62472C1.56901 8.46472 0.5 10.9386 0.5 13.6593H4.5ZM10.9991 20.0001C7.37414 20.0001 4.5 17.1259 4.5 13.6593H0.5C0.5 19.4056 5.23625 24.0001 10.9991 24.0001V20.0001ZM17.4983 13.6593C17.4983 17.1259 14.6241 20.0001 10.9991 20.0001V24.0001C16.762 24.0001 21.4983 19.4056 21.4983 13.6593H17.4983ZM15.7854 9.36985C16.8542 10.5043 17.4983 12.0088 17.4983 13.6593H21.4983C21.4983 10.9397 20.4301 8.46669 18.6968 6.62691L15.7854 9.36985ZM15.2411 3.73598V7.99838H19.2411V3.73598H15.2411ZM15.4722 4C15.3802 4 15.2411 3.91709 15.2411 3.73598H19.2411C19.2411 1.63736 17.5181 0 15.4722 0V4Z" fill="#111111"></path>
    <path d="M15.4722 2H13.7204H8.27783H6.52779C5.55083 2 4.75885 2.77722 4.75885 3.73598V7.99661C3.35682 9.48389 2.5 11.4734 2.5 13.6593C2.5 18.2658 6.30519 22.0001 10.9991 22.0001C15.6931 22.0001 19.4983 18.2658 19.4983 13.6593C19.4983 11.4743 18.6421 9.48547 17.2411 7.99838V3.73598C17.2411 2.77722 16.4491 2 15.4722 2Z" fill="#FFD13F" fillRule="evenodd"></path>
    <path d="M15.4731 2H6.5287C5.55174 2 4.75977 2.77722 4.75977 3.73598V9.25095C4.75977 10.2097 5.55174 10.9869 6.5287 10.9869H15.4731C16.45 10.9869 17.242 10.2097 17.242 9.25095V3.73598C17.242 2.77722 16.45 2 15.4731 2Z" fill="#4A87F2"></path>
    <path d="M13.72 2H8.27734V8.31632H13.72V2Z" fill="#E2DFFE" opacity="0.4"></path>
    <path d="M10.9991 21.9999C15.6931 21.9999 19.4983 18.2656 19.4983 13.6591C19.4983 9.05266 15.6931 5.31836 10.9991 5.31836C6.30519 5.31836 2.5 9.05266 2.5 13.6591C2.5 18.2656 6.30519 21.9999 10.9991 21.9999Z" fill="#D2D0CC"></path>
    <path d="M10.9998 20.8121C15.0254 20.8121 18.2888 17.6095 18.2888 13.659C18.2888 9.70841 15.0254 6.50586 10.9998 6.50586C6.97429 6.50586 3.71094 9.70841 3.71094 13.659C3.71094 17.6095 6.97429 20.8121 10.9998 20.8121Z" fill="#E8E6E2" opacity="0.5"></path>
    <path d="M16.1533 18.7167C19.0001 15.923 19.0001 11.3949 16.1533 8.60118C13.3065 5.80742 8.6925 5.80742 5.8457 8.60118L16.1533 18.7167Z" fill="#BBB9B6"></path>
    <path d="M8.4475 17.535C8.33704 17.535 8.2475 17.4455 8.2475 17.335V16.503C8.2475 16.4493 8.26912 16.3978 8.30748 16.3602L11.3195 13.407C11.9435 12.795 12.2075 12.351 12.2075 11.823C12.2075 11.139 11.7875 10.671 10.9835 10.671C10.2837 10.671 9.78957 11.0103 9.58671 11.8221C9.55908 11.9327 9.45059 12.0064 9.33934 11.9818L8.37023 11.7674C8.26741 11.7447 8.19922 11.6457 8.22073 11.5426C8.49447 10.2303 9.49226 9.375 10.9835 9.375C12.5915 9.375 13.6595 10.359 13.6595 11.847C13.6595 12.711 13.2875 13.443 12.1235 14.499L10.4486 16.0677C10.43 16.0851 10.4195 16.1095 10.4195 16.1349C10.4195 16.1858 10.4607 16.227 10.5116 16.227H13.6515C13.762 16.227 13.8515 16.3165 13.8515 16.427V17.335C13.8515 17.4455 13.762 17.535 13.6515 17.535H8.4475Z" fill="#2C2D30"></path>
  </svg>
);

const Rank3Shield = () => (
  <svg width="22" height="24" viewBox="0 0 22 24" fill="none">
    <path d="M4.75885 7.99661L6.21416 9.36849L6.75885 8.79068V7.99661H4.75885ZM17.2411 7.99838H15.2411V8.79212L15.7854 9.36985L17.2411 7.99838ZM13.7204 4H15.4722V0H13.7204V4ZM8.27783 4H13.7204V0H8.27783V4ZM6.52779 4H8.27783V0H6.52779V4ZM6.75885 3.73598C6.75885 3.91709 6.61977 4 6.52779 4V0C4.48189 0 2.75885 1.63736 2.75885 3.73598H6.75885ZM6.75885 7.99661V3.73598H2.75885V7.99661H6.75885ZM4.5 13.6593C4.5 12.0081 5.14463 10.5031 6.21416 9.36849L3.30354 6.62472C1.56901 8.46472 0.5 10.9386 0.5 13.6593H4.5ZM10.9991 20.0001C7.37414 20.0001 4.5 17.1259 4.5 13.6593H0.5C0.5 19.4056 5.23625 24.0001 10.9991 24.0001V20.0001ZM17.4983 13.6593C17.4983 17.1259 14.6241 20.0001 10.9991 20.0001V24.0001C16.762 24.0001 21.4983 19.4056 21.4983 13.6593H17.4983ZM15.7854 9.36985C16.8542 10.5043 17.4983 12.0088 17.4983 13.6593H21.4983C21.4983 10.9397 20.4301 8.46669 18.6968 6.62691L15.7854 9.36985ZM15.2411 3.73598V7.99838H19.2411V3.73598H15.2411ZM15.4722 4C15.3802 4 15.2411 3.91709 15.2411 3.73598H19.2411C19.2411 1.63736 17.5181 0 15.4722 0V4Z" fill="#111111"></path>
    <path d="M15.4722 2H13.7204H8.27783H6.52779C5.55083 2 4.75885 2.77722 4.75885 3.73598V7.99661C3.35682 9.48389 2.5 11.4734 2.5 13.6593C2.5 18.2658 6.30519 22.0001 10.9991 22.0001C15.6931 22.0001 19.4983 18.2658 19.4983 13.6593C19.4983 11.4743 18.6421 9.48547 17.2411 7.99838V3.73598C17.2411 2.77722 16.4491 2 15.4722 2Z" fill="#FFD13F" fillRule="evenodd"></path>
    <path d="M15.4731 2H6.5287C5.55174 2 4.75977 2.77722 4.75977 3.73598V9.25095C4.75977 10.2097 5.55174 10.9869 6.5287 10.9869H15.4731C16.45 10.9869 17.242 10.2097 17.242 9.25095V3.73598C17.242 2.77722 16.45 2 15.4731 2Z" fill="#2EC08B"></path>
    <path d="M13.72 2H8.27734V8.31632H13.72V2Z" fill="#4A87F2" opacity="0.4"></path>
    <path d="M10.9991 21.9999C15.6931 21.9999 19.4983 18.2656 19.4983 13.6591C19.4983 9.05266 15.6931 5.31836 10.9991 5.31836C6.30519 5.31836 2.5 9.05266 2.5 13.6591C2.5 18.2656 6.30519 21.9999 10.9991 21.9999Z" fill="#FF7243"></path>
    <path d="M10.9998 20.8121C15.0254 20.8121 18.2888 17.6095 18.2888 13.659C18.2888 9.70841 15.0254 6.50586 10.9998 6.50586C6.97429 6.50586 3.71094 9.70841 3.71094 13.659C3.71094 17.6095 6.97429 20.8121 10.9998 20.8121Z" fill="#FFA080" opacity="0.5"></path>
    <path d="M16.1533 18.7167C19.0001 15.923 19.0001 11.3949 16.1533 8.60118C13.3065 5.80742 8.6925 5.80742 5.8457 8.60118L16.1533 18.7167Z" fill="#D95A2F"></path>
    <path d="M10.94 17.9915C9.36888 17.9915 8.34864 17.1922 8.04322 16.0445C8.01544 15.9401 8.08369 15.8366 8.18905 15.8129L9.14375 15.5979C9.24879 15.5742 9.35243 15.6386 9.39046 15.7393C9.60892 16.318 10.1005 16.6835 10.928 16.6835C11.864 16.6835 12.404 16.2515 12.404 15.4955C12.404 14.7275 11.84 14.2835 10.928 14.2835H10.3C10.1895 14.2835 10.1 14.194 10.1 14.0835V13.3075C10.1 13.197 10.1895 13.1075 10.3 13.1075H10.916C11.636 13.1075 12.14 12.6755 12.14 12.0275C12.14 11.3675 11.696 10.9835 10.976 10.9835C10.256 10.9835 9.7609 11.3414 9.56632 12.1327C9.53896 12.244 9.43006 12.3187 9.31817 12.294L8.35096 12.08C8.24805 12.0572 8.17983 11.9581 8.20163 11.8549C8.47685 10.5531 9.4859 9.6875 10.988 9.6875C12.488 9.6875 13.544 10.5875 13.544 11.8235C13.544 12.6214 13.0392 13.2587 12.2427 13.5558C12.2101 13.5679 12.188 13.5988 12.188 13.6335C12.188 13.6701 12.2127 13.7023 12.2479 13.7128C13.2871 14.0242 13.784 14.781 13.784 15.6995C13.784 17.0675 12.68 17.9915 10.94 17.9915Z" fill="#2C2D30"></path>
  </svg>
);

function renderRankBadge(rank: number) {
  if (rank === 1) return <Rank1Shield />;
  if (rank === 2) return <Rank2Shield />;
  if (rank === 3) return <Rank3Shield />;
  return null;
}

// ── Static Explore / Browser Data ──
const CATEGORIES = [
  {
    id: "tokens",
    label: "Tokens",
    bgColor: "rgb(48, 164, 108)",
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="m19 7-2.515-2.515a8.485 8.485 0 0 0-12 12L7 19m15-5.5a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0" fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "perps",
    label: "Perps",
    bgColor: "rgb(255, 218, 220)",
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M20.4 12a3.15 3.15 0 0 0-5.432-2.171l-.238.281L13.312 12l1.418 1.89a3.15 3.15 0 0 0 5.67-1.888M3.6 12a3.15 3.15 0 0 0 5.67 1.89l1.417-1.891L9.27 10.11A3.15 3.15 0 0 0 3.6 12m18.9 0a5.25 5.25 0 0 1-9.45 3.15L12 13.75l-1.05 1.4A5.25 5.25 0 0 1 1.5 12a5.25 5.25 0 0 1 9.45-3.15l1.05 1.4 1.05-1.4.193-.24A5.25 5.25 0 0 1 22.5 12" fill="#111111" stroke="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "lists",
    label: "Lists",
    bgColor: "rgb(171, 159, 242)",
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="m2 17 10 5 10-5M2 12l10 5 10-5M12 2 2 7l10 5 10-5z" fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "people",
    label: "People",
    bgColor: "rgb(255, 209, 63)",
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M17 3.535c1.196.692 2 1.984 2 3.465 0 1.48-.804 2.773-2 3.465M17 21l-.07-.24c-.602-2.065-.903-3.098-1.51-3.864a5 5 0 0 0-2.037-1.528C12.478 15 11.402 15 9.25 15h-.5c-2.152 0-3.228 0-4.133.368a5 5 0 0 0-2.037 1.528c-.607.766-.908 1.799-1.51 3.865L1 21M23 21l-.07-.24c-.602-2.065-.904-3.098-1.51-3.864a5 5 0 0 0-2.037-1.528" fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "sites",
    label: "Sites",
    bgColor: "rgb(74, 135, 242)",
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M22 12c0 5.523-4.477 10-10 10m10-10c0-5.523-4.477-10-10-10m10 10H2m10 10C6.477 22 2 17.523 2 12m10 10a15.3 15.3 0 0 0 4-10 15.3 15.3 0 0 0-4-10m0 20a15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10M2 12C2 6.477 6.477 2 12 2" fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "learn",
    label: "Learn",
    bgColor: "rgb(255, 114, 67)",
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5z" fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const TRENDING_TOKENS = [
  {
    id: "purple_bitcoin",
    rank: 1,
    name: "Purple Bitcoin",
    subtitle: "$15.0M MC",
    price: "$0.7768",
    change: "-9.96%",
    isPositive: false,
    image: "https://cdn.dexscreener.com/cms/images/3b535c9ffc582a1571ea53e75b2ffeb23e043d3318a6af80c79a40e7e4198905?width=800&height=800&quality=95&format=auto",
  },
  {
    id: "world_cup_coin",
    rank: 2,
    name: "World Cup Coin",
    subtitle: "$3.7M MC",
    price: "$0.003686",
    change: "+83.11%",
    isPositive: true,
    image: "https://cdn.dexscreener.com/cms/images/F3H3l8fxpmRPX-yq?width=800&height=800&quality=95&format=auto",
  },
  {
    id: "ptroll",
    rank: 3,
    name: "PTROLL",
    subtitle: "$16.7M MC",
    price: "$0.0167",
    change: "+6865.00%",
    isPositive: true,
    image: "https://cdn.dexscreener.com/cms/images/uKbU2ciwDnnLFeJ0?width=800&height=800&quality=95&format=auto",
  },
];

const TRENDING_PERPS = [
  {
    id: "spcx",
    rank: 1,
    name: "SPCX",
    leverage: "5x",
    subtitle: "$49.9M Vol",
    price: "$202.73",
    change: "+12.63%",
    isPositive: true,
    image: "https://app.trade.xyz/markets/spcx.svg",
  },
  {
    id: "usar",
    rank: 2,
    name: "USAR",
    leverage: "10x",
    subtitle: "$2.6M Vol",
    price: "$21.24",
    change: "-12.42%",
    isPositive: false,
    image: "https://app.hyperliquid.xyz/coins/xyz:USAR.svg",
  },
  {
    id: "sndk",
    rank: 3,
    name: "SNDK",
    leverage: "10x",
    subtitle: "$95.0M Vol",
    price: "$1314.80",
    change: "-5.98%",
    isPositive: false,
    image: "https://app.hyperliquid.xyz/coins/xyz:SNDK.svg",
  },
  {
    id: "hyundai",
    rank: null,
    name: "HYUNDAI",
    leverage: "10x",
    subtitle: "$1.3M Vol",
    price: "$438.07",
    change: "-7.56%",
    isPositive: false,
    image: "https://logo.clearbit.com/hyundai.com",
  },
];

const TOP_LISTS = [
  {
    id: "gainers",
    name: "Top Gainers",
    subtitle: "7 tokens",
    image: "https://assets.phantom.app/assets/top-gainers0.png",
  },
  {
    id: "meme",
    name: "Meme",
    subtitle: "100 tokens",
    image: "https://assets.phantom.app/assets/meme.png",
  },
  {
    id: "stocks",
    name: "Tokenized Stocks",
    subtitle: "100 tokens",
    image: "https://assets.phantom.app/assets/tokenized-stocks.png",
  },
];

const TOP_TRADERS = [
  {
    id: "leftbrass",
    rank: 1,
    username: "@LeftBrass5465",
    profit: "+4,310.30%",
    image: "/avatars/avatar-8.webp",
  },
  {
    id: "distoredfun",
    rank: 2,
    username: "@distoredfun",
    profit: "+1,356.48%",
    image: "/avatars/avatar-9.webp",
  },
  {
    id: "kingf",
    rank: 3,
    username: "@kingF",
    profit: "+1,087.29%",
    image: "/avatars/avatar-10.webp",
  },
];

const TRENDING_SITES = [
  {
    id: "get_free_sol",
    name: "Get Free Sol",
    subtitle: "Tools",
    image: "https://phantom-portal20240925173430423400000001.s3.ca-central-1.amazonaws.com/icons/0a92692c-ce96-4805-8a74-9d5e691a009e.png",
  },
  {
    id: "jupiter",
    name: "Jupiter",
    subtitle: "DeFi",
    image: "https://phantom-portal20240925173430423400000001.s3.ca-central-1.amazonaws.com/icons/656306c7-bc78-412c-9cf0-998eb739b2f4.jpg",
  },
  {
    id: "gmgn",
    name: "GMGN",
    subtitle: "DeFi",
    image: "https://phantom-portal20240925173430423400000001.s3.ca-central-1.amazonaws.com/icons/18bce0d1-0fef-4225-ad07-e569d17946d3.png",
  },
];

const LEARN = [
  {
    id: "liquid_staking",
    title: "Liquid Staking 101",
    subtitle: "What is liquid staking?",
    image: "https://cdn.sanity.io/images/3nm6d03a/production/926b24fb33d2043dc11a052b499784d6587a9731-344x336.png",
  },
  {
    id: "monad",
    title: "Monad 101",
    subtitle: "Learn more about Monad",
    image: "https://cdn.sanity.io/images/3nm6d03a/production/c0acbea2f7239992df77757e53c49e793692672a-336x232.png",
  },
  {
    id: "pay",
    title: "New ways to Pay",
    subtitle: "Onboard with Google or Apple pay",
    image: "https://cdn.sanity.io/images/3nm6d03a/production/ccff974411d41048d70fdb0abd09cc635bbc6a39-344x336.png",
  },
];

export default function BrowserPage() {
  const { profile } = useWalletStore();
  const [followedTraders, setFollowedTraders] = useState<string[]>([]);

  const handleFollowToggle = (id: string) => {
    setFollowedTraders((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#111111] pb-12">
      {/* Scrollbar hiding styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />

      {/* ── Custom Sticky Search Header ── */}
      <div
        className="sticky top-0 z-50 bg-[#111111] px-4 pb-3 flex items-center justify-between gap-3"
        style={{ paddingTop: "calc(12px + env(safe-area-inset-top, 0px))" }}
      >
        {/* Left: Saved Profile Avatar */}
        <div
          className="w-8 h-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center cursor-pointer active:opacity-75 transition-opacity"
        >
          <Avatar
            iconIndex={profile.iconIndex}
            avatarType={profile.avatarType}
            size={32}
          />
        </div>

        {/* Center: Search pill */}
        <div
          className="flex-1 flex items-center bg-[#1c1c1e] rounded-xl px-3 py-2 text-[#b4b4b4] hover:bg-[#2c2c2e]/70 transition-colors cursor-pointer"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="mr-2 shrink-0">
            <path
              d="m21 21-4.35-4.35M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0"
              stroke="#b4b4b4"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-[#b4b4b4] text-[15px] font-medium leading-none select-none">
            Sites, tokens, URL
          </span>
        </div>

        {/* Right: Tab count indicator */}
        <div
          className="w-8 h-8 rounded-lg border border-[#b4b4b4] flex items-center justify-center shrink-0 cursor-pointer active:opacity-75 transition-opacity"
        >
          <span className="text-[#b4b4b4] text-[13px] font-bold leading-none">1</span>
        </div>
      </div>

      {/* ── Category Pills (Horizontal Scroll) ── */}
      <div
        className="flex overflow-x-auto gap-2.5 px-4 py-3 no-scrollbar scroll-smooth shrink-0"
        style={{
          msOverflowStyle: "none",
          scrollbarWidth: "none"
        }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className="flex items-center bg-[#1c1c1e] rounded-[20px] pr-4 pl-1 py-1 gap-2 hover:bg-[#2c2c2e]/60 transition-colors focus:outline-none shrink-0"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: cat.bgColor }}
            >
              {cat.svg}
            </div>
            <span className="text-white text-sm font-semibold tracking-tight">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* ── Trending Tokens ── */}
      <div className="mt-5">
        <button className="flex items-center justify-between w-full px-4 mb-3 group outline-none text-left">
          <h2 className="text-[22px] font-medium text-white tracking-tight">Trending Tokens</h2>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white opacity-60 group-active:translate-x-1 transition-transform">
            <path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="bg-[#1c1c1e] rounded-[24px] mx-4 p-4 flex flex-col gap-4 border border-[#2a2a2a]/20">
          {TRENDING_TOKENS.map((token) => (
            <div key={token.id} className="flex items-center justify-between cursor-pointer active:opacity-75 transition-opacity">
              <div className="flex items-center flex-1 min-w-0">
                {/* Image Avatar with overlapping rank shield */}
                <div className="relative w-11 h-11 rounded-full shrink-0 mr-3">
                  <img
                    src={token.image}
                    alt={token.name}
                    className="w-full h-full object-cover rounded-full bg-[#2c2c2e]"
                  />
                  {token.rank && (
                    <div className="absolute -bottom-[3px] -right-[5px] z-10">
                      {renderRankBadge(token.rank)}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <span className="text-white font-bold text-[15px] leading-snug tracking-tight truncate">
                    {token.name}
                  </span>
                  <span className="text-[#888888] text-[13px] font-medium leading-normal tracking-tight truncate mt-0.5">
                    {token.subtitle}
                  </span>
                </div>
              </div>

              {/* Price & Change */}
              <div className="flex flex-col items-end shrink-0 pl-3">
                <span className="text-white font-semibold text-[15px] leading-snug tracking-tight">
                  {token.price}
                </span>
                <span
                  className="text-[13px] font-semibold leading-normal tracking-tight mt-0.5"
                  style={{ color: token.isPositive ? "rgb(48, 164, 108)" : "rgb(238, 66, 32)" }}
                >
                  {token.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Trending Perps ── */}
      <div className="mt-7">
        <button className="flex items-center justify-between w-full px-4 mb-3 group outline-none text-left">
          <h2 className="text-[22px] font-medium text-white tracking-tight">Trending Perps</h2>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white opacity-60 group-active:translate-x-1 transition-transform">
            <path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="bg-[#1c1c1e] rounded-[24px] mx-4 p-4 flex flex-col gap-4 border border-[#2a2a2a]/20">
          {TRENDING_PERPS.map((perp) => (
            <div key={perp.id} className="flex items-center justify-between cursor-pointer active:opacity-75 transition-opacity">
              <div className="flex items-center flex-1 min-w-0">
                {/* Image Avatar with overlapping rank shield */}
                <div className="relative w-11 h-11 rounded-full shrink-0 mr-3">
                  <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden bg-[#2c2c2e]">
                    <img
                      src={perp.image}
                      alt={perp.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  {perp.rank && (
                    <div className="absolute -bottom-[3px] -right-[5px] z-10">
                      {renderRankBadge(perp.rank)}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 leading-snug">
                    <span className="text-white font-bold text-[15px] tracking-tight truncate">
                      {perp.name}
                    </span>
                    <span className="bg-[#2c2c2e] rounded px-1.5 py-0.5 text-[11px] font-bold text-[#b4b4b4] tracking-tight leading-none mt-0.5">
                      {perp.leverage}
                    </span>
                  </div>
                  <span className="text-[#888888] text-[13px] font-medium leading-normal tracking-tight truncate mt-0.5">
                    {perp.subtitle}
                  </span>
                </div>
              </div>

              {/* Price & Change */}
              <div className="flex flex-col items-end shrink-0 pl-3">
                <span className="text-white font-semibold text-[15px] leading-snug tracking-tight">
                  {perp.price}
                </span>
                <span
                  className="text-[13px] font-semibold leading-normal tracking-tight mt-0.5"
                  style={{ color: perp.isPositive ? "rgb(48, 164, 108)" : "rgb(238, 66, 32)" }}
                >
                  {perp.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Top Lists ── */}
      <div className="mt-7">
        <button className="flex items-center justify-between w-full px-4 mb-3 group outline-none text-left">
          <h2 className="text-[22px] font-medium text-white tracking-tight">Top Lists</h2>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white opacity-60 group-active:translate-x-1 transition-transform">
            <path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="bg-[#1c1c1e] rounded-[24px] mx-4 p-4 flex flex-col gap-4 border border-[#2a2a2a]/20">
          {TOP_LISTS.map((list) => (
            <div key={list.id} className="flex items-center justify-between cursor-pointer active:opacity-75 transition-opacity">
              <div className="flex items-center flex-1 min-w-0">
                <div
                  className="w-11 h-11 rounded-[14px] overflow-hidden shrink-0 mr-3 flex items-center justify-center"
                  style={{ backgroundColor: "rgb(26, 42, 58)" }}
                >
                  <img
                    src={list.image}
                    alt={list.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <span className="text-white font-bold text-[15px] leading-snug tracking-tight truncate">
                    {list.name}
                  </span>
                  <span className="text-[#888888] text-[13px] font-medium leading-normal tracking-tight truncate mt-0.5">
                    {list.subtitle}
                  </span>
                </div>
              </div>

              {/* Chevron right */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#b4b4b4] shrink-0 ml-3">
                <path d="m9 19 7-7-7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ))}
        </div>
      </div>

      {/* ── Top Traders ── */}
      <div className="mt-7">
        <button className="flex items-center justify-between w-full px-4 mb-3 group outline-none text-left">
          <h2 className="text-[22px] font-medium text-white tracking-tight">Top Traders</h2>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white opacity-60 group-active:translate-x-1 transition-transform">
            <path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="bg-[#1c1c1e] rounded-[24px] mx-4 p-4 flex flex-col gap-4 border border-[#2a2a2a]/20">
          {TOP_TRADERS.map((trader) => {
            const isFollowing = followedTraders.includes(trader.id);
            return (
              <div key={trader.id} className="flex items-center justify-between">
                <div className="flex items-center flex-1 min-w-0">
                  {/* Image Avatar with overlapping rank shield */}
                  <div className="relative w-11 h-11 rounded-full shrink-0 mr-3">
                    <img
                      src={trader.image}
                      alt={trader.username}
                      className="w-full h-full object-cover rounded-full bg-[#2c2c2e]"
                    />
                    {trader.rank && (
                      <div className="absolute -bottom-[3px] -right-[5px] z-10">
                        {renderRankBadge(trader.rank)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <span className="text-white font-bold text-[15px] leading-snug tracking-tight truncate">
                      {trader.username}
                    </span>
                    <span
                      className="text-[13px] font-semibold leading-normal tracking-tight truncate mt-0.5"
                      style={{ color: "rgb(48, 164, 108)" }}
                    >
                      {trader.profit}
                    </span>
                  </div>
                </div>

                {/* Follow/Following Button */}
                <button
                  onClick={() => handleFollowToggle(trader.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all select-none active:scale-95 duration-100 ${isFollowing
                    ? "bg-[#2c2c2e] text-[#b4b4b4]"
                    : "bg-[#AB9FF2] text-black hover:opacity-90"
                    }`}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Trending Sites ── */}
      <div className="mt-7">
        <button className="flex items-center justify-between w-full px-4 mb-3 group outline-none text-left">
          <h2 className="text-[22px] font-medium text-white tracking-tight">Trending Sites</h2>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white opacity-60 group-active:translate-x-1 transition-transform">
            <path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="bg-[#1c1c1e] rounded-[24px] mx-4 p-4 flex flex-col gap-4 border border-[#2a2a2a]/20">
          {TRENDING_SITES.map((site) => (
            <div key={site.id} className="flex items-center justify-between cursor-pointer active:opacity-75 transition-opacity">
              <div className="flex items-center flex-1 min-w-0">
                <div
                  className="w-11 h-11 rounded-[14px] overflow-hidden shrink-0 mr-3 flex items-center justify-center bg-[#2c2c2e]"
                >
                  <img
                    src={site.image}
                    alt={site.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <span className="text-white font-bold text-[15px] leading-snug tracking-tight truncate">
                    {site.name}
                  </span>
                  <span className="text-[#888888] text-[13px] font-medium leading-normal tracking-tight truncate mt-0.5">
                    {site.subtitle}
                  </span>
                </div>
              </div>

              {/* Diagonal Up-Right arrow indicator */}
              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 ml-3 bg-[#2c2c2e]/60">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-[#b4b4b4]">
                  <path d="M7 17 17 7m0 0H7m10 0v10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Learn ── */}
      <div className="mt-7">
        <button className="flex items-center justify-between w-full px-4 mb-3 group outline-none text-left">
          <h2 className="text-[22px] font-medium text-white tracking-tight">Learn</h2>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white opacity-60 group-active:translate-x-1 transition-transform">
            <path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="bg-[#1c1c1e] rounded-[24px] mx-4 p-4 flex flex-col gap-4 border border-[#2a2a2a]/20">
          {LEARN.map((item) => (
            <div key={item.id} className="flex items-center justify-between cursor-pointer active:opacity-75 transition-opacity">
              <div className="flex items-center flex-1 min-w-0">
                <div
                  className="w-11 h-11 rounded-[14px] overflow-hidden shrink-0 mr-3 flex items-center justify-center bg-[#2c2c2e]"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <span className="text-white font-bold text-[15px] leading-snug tracking-tight truncate">
                    {item.title}
                  </span>
                  <span className="text-[#888888] text-[13px] font-medium leading-normal tracking-tight truncate mt-0.5">
                    {item.subtitle}
                  </span>
                </div>
              </div>

              {/* Chevron right */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#b4b4b4] shrink-0 ml-3">
                <path d="m9 19 7-7-7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ))}
        </div>
      </div>

      {/* ── Competitions / Standalone Card ── */}
      <div
        tabIndex={0}
        className="mt-6 mx-4 p-4 rounded-[24px] bg-[#1c1c1e] border border-[#2a2a2a]/20 cursor-pointer active:opacity-75 transition-opacity flex flex-col justify-center gap-1"
      >
        <span className="text-white font-bold text-[15px] leading-snug tracking-tight">
          Competitions
        </span>
        <span className="text-[#888888] text-[13px] font-medium leading-normal tracking-tight">
          Trade to win prizes
        </span>
      </div>

      {/* ── Muted Footnote Disclaimer ── */}
      <div className="px-6 text-[11px] text-[#888888] leading-relaxed text-left mt-7 pb-20 select-none">
        Tokenized Stocks are blockchain-based instruments issued by third parties that are designed to follow underlying equity performance.
      </div>
    </div>
  );
}
