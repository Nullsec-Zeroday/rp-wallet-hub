"use client";

import React, { useState } from "react";
import Image from "next/image";
import { type TokenInfo, CHAIN_ICONS } from "@/lib/wallet-data";

interface TokenLogoProps {
  token: TokenInfo;
  size?: number;
  liveImage?: string;
  priority?: boolean;
  hideChainIcon?: boolean;
}

export default function TokenLogo({ token, size = 44, liveImage, priority = false, hideChainIcon = false }: TokenLogoProps) {
  const [imgErr, setImgErr] = useState(false);

  // Prefer Phantom API live image, default back to local payload
  const imgSrc = liveImage || token.logoUrl;

  React.useEffect(() => {
    if (imgSrc) {
      setImgErr(false);
    }
  }, [imgSrc]);

  const renderContent = () => {
    if (imgSrc && !imgErr) {
      return (
        <Image
          src={imgSrc}
          alt={token.name}
          width={size}
          height={size}
          priority={priority}
          className="rounded-full object-cover w-full h-full"
          onError={() => setImgErr(true)}
        />
      );
    }

    return (
      <div
        className="w-full h-full rounded-full flex items-center justify-center"
        style={{ backgroundColor: token.color }}
      >
        <span style={{ fontSize: size * 0.4, color: "#FFFFFF" }}>{token.icon || token.symbol.charAt(0)}</span>
      </div>
    );
  };

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
        {renderContent()}
      </div>
      {!hideChainIcon && token.chainId && CHAIN_ICONS[token.chainId] && (
        <div
          className={`absolute flex items-center justify-center border ${token.chainId === 'solana'
            ? 'rounded-[8px] bg-white border-[#111] border-2'
            : 'rounded-[8px] bg-[#1a1a1a] border-[#333]'
            }`}
          style={{
            width: Math.max(18, size * 0.42),
            height: Math.max(18, size * 0.42),
            bottom: -1,
            right: -1,
            padding: token.chainId === 'solana' ? '3.5px' : '2px'
          }}
        >
          <img
            src={CHAIN_ICONS[token.chainId]}
            alt={token.chainId}
            className={`w-full h-full object-contain ${token.chainId === 'solana' ? 'grayscale brightness-0' : 'rounded-sm'}`}
          />
        </div>
      )}
    </div>
  );
}
