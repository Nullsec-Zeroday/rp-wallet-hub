import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@rp-wallet/api-client", "@rp-wallet/config"],
};

export default nextConfig;
