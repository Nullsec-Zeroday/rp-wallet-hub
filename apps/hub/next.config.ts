import type { NextConfig } from "next";
import path from "node:path";

const base44Origin = process.env.BASE44_PUBLIC_HOST_SUFFIX
  ? `https://3000-${process.env.BASE44_PUBLIC_HOST_SUFFIX}`
  : undefined;

const nextConfig: NextConfig = {
  allowedDevOrigins: base44Origin ? [base44Origin] : [],
  transpilePackages: ["@rp-wallet/api-client", "@rp-wallet/auth", "@rp-wallet/config", "@rp-wallet/types"],
  async redirects() {
    return [
      {
        source: "/blog/why-we-chose-pwa",
        destination: "https://rpwallet.app/blog/crypto-wallet-simulator-use-cases",
        permanent: true,
      },
      {
        source: "/blog/whale-watching-simulation",
        destination: "https://rpwallet.app/blog/fake-crypto-portfolio-for-content-creators",
        permanent: true,
      },
    ];
  },
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
