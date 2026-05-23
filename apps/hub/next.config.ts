import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@rp-wallet/api-client", "@rp-wallet/auth", "@rp-wallet/config", "@rp-wallet/types"],
};

export default nextConfig;
