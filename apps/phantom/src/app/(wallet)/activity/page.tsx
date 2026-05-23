"use client";

import React from "react";
import { useWalletStore } from "@/lib/wallet-store";

// ── Static Trending Chat Data ──
const TRENDING_PAGES = [
  // Page 1
  [
    {
      id: "solaris",
      name: "SOLARIS",
      subtitle: "Solaris AI",
      image: "https://cdn.simplehash.com/assets/00be704d9e8603b445a535e1d74d3ac144033ade8ef9ff8643b8069c5c0f4657.gif",
      bgColor: "rgb(171, 159, 242)",
      users: "2.0k",
    },
    {
      id: "dogy",
      name: "DOGY",
      subtitle: "Dogy",
      image: "https://cdn.simplehash.com/assets/10bf104e51787947d1f95497a51aabe8a7df457c9bfd8f3f7f7ea5ddc9a38db0.png",
      bgColor: "rgb(255, 209, 63)",
      users: "22.0k",
    },
    {
      id: "calvin",
      name: "CALVIN",
      subtitle: "Calvin in the Cabal",
      image: "https://cdn.simplehash.com/assets/e0fae40c70adb576ac3f1432a815266ad00af9104ae16988cc1b27ea079a49ff.jpg",
      bgColor: "rgb(255, 114, 67)",
      users: "16.0k",
    },
  ],
  // Page 2
  [
    {
      id: "irene",
      name: "IRENE",
      subtitle: "ASIAN MOTHER",
      image: "https://pump.mypinata.cloud/ipfs/QmUtBmZNeNEos1bp2mE8KKR5kRnimmtRRX7jDHBRYc1DSv",
      bgColor: "rgb(74, 135, 242)",
      users: "2.0k",
    },
    {
      id: "kpop",
      name: "KPOP",
      subtitle: "KPOP",
      image: "https://cdn.simplehash.com/assets/59b8f8579275f302cfe3db26e9bd67cf480e087ea9d4b670ce041da6a795f823.jpg",
      bgColor: "rgb(46, 192, 139)",
      users: "7.0k",
    },
    {
      id: "shar",
      name: "SHAR",
      subtitle: "SHARPEI",
      image: "https://cdn.simplehash.com/assets/725fccb3d438621be4b54a42843db9c9a360f2261deb6dd2a77ad01938b91f65.png",
      bgColor: "rgb(111, 206, 252)",
      users: "24.0k",
    },
  ],
  // Page 3
  [
    {
      id: "launchcoin",
      name: "LAUNCHCOIN",
      subtitle: "Launch Coin (Deprecated)",
      image: "https://cdn.simplehash.com/assets/2484fe5a99baa057c99c1e92d2d4091a2525cd0c14b9a711d4a92f99baa86a72.png",
      bgColor: "rgb(255, 224, 102)",
      users: "5.0k",
    },
    {
      id: "broke",
      name: "BROKE",
      subtitle: "$BROKE again",
      image: "https://cdn.simplehash.com/assets/4ec04e7f6109132a72078d7459f0537cc0225d52d9b247e72c39f98d231d9d17.jpg",
      bgColor: "rgb(255, 111, 97)",
      users: "32.0k",
    },
    {
      id: "ndx",
      name: "NDX",
      subtitle: "NDX6900",
      image: "https://cdn.simplehash.com/assets/1f4c4532dc81b80fc3eef6169f0bf8a59871479a371f17eb1943e92f8eb6d89b.jpg",
      bgColor: "rgb(0, 209, 160)",
      users: "20.0k",
    },
  ],
];

export default function ActivityPage() {
  const { baseCurrency } = useWalletStore();

  return (
    <div className="flex flex-col pb-20 pt-6">
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

      {/* ── Trending Section ── */}
      <div className="mb-6">
        <div className="px-4 mb-3">
          <h2 className="text-white font-medium text-2xl tracking-tight">Trending</h2>
        </div>

        {/* Horizontal Carousel */}
        <div
          className="flex overflow-x-auto gap-3.5 px-4 pb-2 snap-x snap-mandatory no-scrollbar scroll-smooth"
          style={{
            msOverflowStyle: "none",
            scrollbarWidth: "none"
          }}
        >
          {TRENDING_PAGES.map((page, pageIdx) => (
            <div
              key={pageIdx}
              className="min-w-[346px] w-[346px] bg-[#1c1c1e] rounded-[24px] p-4 flex flex-col gap-4 snap-center border border-[#2a2a2a]/30"
            >
              {page.map((item) => (
                <div
                  key={item.id}
                  tabIndex={0}
                  className="flex items-center justify-between cursor-pointer active:opacity-75 transition-all outline-none"
                >
                  <div className="flex items-center flex-1 min-w-0">
                    {/* Circle Avatar with custom background color */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden relative"
                      style={{ backgroundColor: item.bgColor }}
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>

                    <div className="flex-1 min-w-0 text-left pl-3 flex flex-col justify-center">
                      <span className="text-white font-bold text-[15px] leading-snug tracking-tight truncate">
                        {item.name}
                      </span>
                      <span className="text-[#b4b4b4] text-[13px] font-medium leading-normal tracking-tight truncate mt-0.5">
                        {item.subtitle}
                      </span>
                    </div>
                  </div>

                  {/* Users Count */}
                  <div className="flex items-center gap-1 text-[#b4b4b4] shrink-0 text-[13px] font-semibold pl-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="shrink-0">
                      <path
                        d="M17 3.535c1.196.692 2 1.984 2 3.465 0 1.48-.804 2.773-2 3.465"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                      <path
                        d="M4 7a5 5 0 1 1 10 0A5 5 0 0 1 4 7M8.526 14h.948c1.935 0 3.197-.001 4.286.442a6 6 0 0 1 2.444 1.833c.73.922 1.083 2.133 1.624 3.991l.062.215.07.24A1 1 0 0 1 17 22H1a1 1 0 0 1-.96-1.28l.07-.24.062-.214c.541-1.858.894-3.07 1.624-3.991a6 6 0 0 1 2.444-1.833c1.09-.443 2.351-.443 4.286-.442"
                        fill="currentColor"
                        fillRule="evenodd"
                        clipRule="evenodd"
                      />
                      <path
                        d="m23 21-.07-.24c-.602-2.065-.904-3.098-1.51-3.864a5 5 0 0 0-2.037-1.528"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                    <span>{item.users}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent Section ── */}
      <div className="px-4">
        <h2 className="text-white font-medium text-2xl tracking-tight mb-3">Recent</h2>

        {/* Empty state activity graphics */}
        <div className="flex flex-col items-center justify-center py-[50px] text-center">
          <div className="size-[110px] mb-3 select-none pointer-events-none">
            <img
              src="/icons/no-activity.webp"
              alt="No chats"
              className="w-full h-full object-contain grayscale"
            />
          </div>
          <span className="text-[#b4b4b4] text-[15px] font-medium leading-normal tracking-tight">
            No chats to show yet.
          </span>
        </div>
      </div>
    </div>
  );
}
