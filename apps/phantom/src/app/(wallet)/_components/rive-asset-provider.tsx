"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { RuntimeLoader } from "@rive-app/react-canvas";

if (typeof window !== "undefined") {
  RuntimeLoader.setWasmUrl("/rive/rive.wasm");
}

// Global cache outside React state to ensure synchronous availability across re-mounts
const globalRiveCache: Record<string, ArrayBuffer> = {};
let globalIsLoaded = false;
const globalLoadingPromise: { current: Promise<void> | null } = { current: null };

interface RiveAssetContextType {
  getAsset: (src: string) => ArrayBuffer | null;
  isLoaded: boolean;
}

const RiveAssetContext = createContext<RiveAssetContextType>({
  getAsset: (src) => globalRiveCache[src] || null,
  isLoaded: globalIsLoaded,
});

const SECRET_KEY = "RP_WALLET_ASSET_PROTECTION_2026";

const RIVE_ASSETS = [
  "/rive/nav-home.rivx",
  "/rive/nav-wallet.rivx",
  "/rive/nav-swap.rivx",
  "/rive/nav-chat.rivx",
  "/rive/nav-search.rivx",
  "/rive/progress-send.rivx",
];

const unscramble = (buffer: ArrayBuffer) => {
  const view = new Uint8Array(buffer);
  for (let i = 0; i < view.length; i++) {
    view[i] = view[i] ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length);
  }
  return buffer;
};

export const RiveAssetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [, setTick] = useState(0); // Only used to trigger re-render once loaded

  useEffect(() => {
    if (globalLoadingPromise.current) return;

    const loadAssets = async () => {
      try {
        await Promise.all(
          RIVE_ASSETS.map(async (src) => {
            if (globalRiveCache[src]) return;
            const response = await fetch(src);
            if (response.ok) {
              const buffer = await response.arrayBuffer();
              const decrypted = unscramble(buffer);
              globalRiveCache[src] = decrypted;
            }
          })
        );
        globalIsLoaded = true;
        setTick(t => t + 1); // Trigger one re-render for consumers
      } catch (error) {
        console.error("Failed to preload Rive assets:", error);
      }
    };

    globalLoadingPromise.current = loadAssets();
  }, []);

  const getAsset = (src: string) => globalRiveCache[src] || null;

  return (
    <RiveAssetContext.Provider value={{ getAsset, isLoaded: globalIsLoaded }}>
      {children}
    </RiveAssetContext.Provider>
  );
};

export const useRiveAsset = (src: string) => {
  const { getAsset } = useContext(RiveAssetContext);
  // Automatically attempt to resolve both raw .riv and protected .rivx paths
  // to ensure backward compatibility and seamless loading.
  return getAsset(src) || getAsset(src + "x");
};

export const useRiveAssetsLoaded = () => {
  const { isLoaded } = useContext(RiveAssetContext);
  return isLoaded;
};
