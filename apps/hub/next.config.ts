import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: ["@rp-wallet/api-client", "@rp-wallet/auth", "@rp-wallet/config", "@rp-wallet/types"],
  webpack(config) {
    config.resolve ??= {};
    config.resolve.alias ??= {};
    config.resolve.alias["@"] = path.resolve(__dirname);
    return config;
  },
  turbopack: {
    resolveAlias: {
      "@": path.resolve(__dirname),
    },
  },
};

export default nextConfig;
