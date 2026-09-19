import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "next/dynamic": fileURLToPath(new URL("./src/shims/next-dynamic.tsx", import.meta.url)),
      "next/image": fileURLToPath(new URL("./src/shims/next-image.tsx", import.meta.url)),
      "next/link": fileURLToPath(new URL("./src/shims/next-link.tsx", import.meta.url)),
      "next/navigation": fileURLToPath(new URL("./src/shims/next-navigation.ts", import.meta.url)),
    },
  },
  server: {
    middlewareMode: false,
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: [
      "rp-walletphantom-production.up.railway.app",
      "localhost",
      "127.0.0.1",
    ],
  },
  preview: {
    middlewareMode: false,
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: [
      "rp-walletphantom-production.up.railway.app",
      "localhost",
      "127.0.0.1",
    ],
  },
});
