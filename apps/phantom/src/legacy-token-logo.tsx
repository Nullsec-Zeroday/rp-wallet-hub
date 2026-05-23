import React, { useEffect, useState } from "react";
import type { TokenInfo } from "./legacy-wallet-data";
import { CHAIN_ICONS } from "./legacy-wallet-data";

interface TokenLogoProps {
  token: TokenInfo;
  size?: number;
  liveImage?: string;
  hideChainIcon?: boolean;
}

export default function TokenLogo({ token, size = 44, liveImage, hideChainIcon = false }: TokenLogoProps) {
  const [imgErr, setImgErr] = useState(false);
  const imgSrc = liveImage || token.logoUrl;

  useEffect(() => {
    if (imgSrc) {
      setImgErr(false);
    }
  }, [imgSrc]);

  return (
    <div className="tokenLogoWrap" style={{ width: size, height: size }}>
      <div className="tokenLogoImageWrap">
        {imgSrc && !imgErr ? (
          <img
            alt={token.name}
            className="tokenLogoImage"
            onError={() => setImgErr(true)}
            src={imgSrc}
          />
        ) : (
          <div className="tokenLogoFallback" style={{ backgroundColor: token.color }}>
            <span style={{ color: "#FFFFFF", fontSize: size * 0.4 }}>{token.icon || token.symbol.charAt(0)}</span>
          </div>
        )}
      </div>
      {!hideChainIcon && token.chainId && CHAIN_ICONS[token.chainId] ? (
        <div
          className={`chainBadge${token.chainId === "solana" ? " solana" : ""}`}
          style={{
            width: Math.max(18, size * 0.42),
            height: Math.max(18, size * 0.42),
            bottom: -1,
            right: -1,
            padding: token.chainId === "solana" ? "3.5px" : "2px",
          }}
        >
          <img
            alt={token.chainId}
            className={`chainBadgeImg${token.chainId === "solana" ? " solana" : ""}`}
            src={CHAIN_ICONS[token.chainId]}
          />
        </div>
      ) : null}
    </div>
  );
}
