export interface TrustTokenInfo {
  symbol: string;
  name: string;
  chain: string;
  price: number;
  coingeckoId?: string;
  logo: string;
}

export interface TrustPriceData {
  image?: string;
  usd: number;
  usd_24h_change?: number;
}

export type TrustLivePrices = Record<string, TrustPriceData>;

const trustAssetLogo = (chain: string, path = "info/logo.png") =>
  `https://wsrv.nl/?url=https://assets-cdn.trustwallet.com/blockchains/${chain}/${path}`;

export const TRUST_TOKENS: TrustTokenInfo[] = [
  { symbol: "BTC", name: "Bitcoin", chain: "Bitcoin", price: 73778, coingeckoId: "bitcoin", logo: trustAssetLogo("bitcoin") },
  { symbol: "ETH", name: "Ethereum", chain: "Ethereum", price: 1600, coingeckoId: "ethereum", logo: trustAssetLogo("ethereum") },
  { symbol: "SOL", name: "Solana", chain: "Solana", price: 82.61, coingeckoId: "solana", logo: trustAssetLogo("solana") },
  { symbol: "BNB", name: "BNB", chain: "BNB Smart Chain", price: 590, coingeckoId: "binancecoin", logo: trustAssetLogo("smartchain") },
  { symbol: "USDT", name: "Tether USD", chain: "TRC20", price: 1, coingeckoId: "tether", logo: trustAssetLogo("smartchain", "assets/0x55d398326f99059fF775485246999027B3197955/logo.png") },
  { symbol: "TRX", name: "TRON", chain: "Tron", price: 0.12, coingeckoId: "tron", logo: trustAssetLogo("tron") },
  { symbol: "LTC", name: "Litecoin", chain: "Litecoin", price: 52.32, coingeckoId: "litecoin", logo: trustAssetLogo("litecoin") },
  { symbol: "XRP", name: "XRP", chain: "XRP Ledger", price: 0.52, coingeckoId: "ripple", logo: trustAssetLogo("ripple") },
  { symbol: "DOGE", name: "Dogecoin", chain: "Dogecoin", price: 0.16, coingeckoId: "dogecoin", logo: trustAssetLogo("doge") },
  { symbol: "SUI", name: "Sui", chain: "Sui", price: 2.5, coingeckoId: "sui", logo: trustAssetLogo("sui") },
  { symbol: "USDC", name: "USD Coin", chain: "Ethereum", price: 1, coingeckoId: "usd-coin", logo: trustAssetLogo("ethereum", "assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png") },
];

export const TRUST_TOKEN_MAP = Object.fromEntries(TRUST_TOKENS.map((token) => [token.symbol, token])) as Record<string, TrustTokenInfo>;

export function getTrustToken(symbol: string) {
  return TRUST_TOKEN_MAP[symbol.toUpperCase()] || {
    symbol: symbol.toUpperCase(),
    name: symbol.toUpperCase(),
    chain: "Unknown",
    price: 0,
    logo: "",
  };
}

export function getStaticTrustPrices(): TrustLivePrices {
  return Object.fromEntries(
    TRUST_TOKENS.map((token) => [
      token.symbol,
      {
        image: token.logo,
        usd: token.price,
        usd_24h_change: 0,
      },
    ]),
  );
}

export function formatTrustCurrency(value: number, currency = "USD") {
  const useCompactCents = Math.abs(value) < 1000;

  return new Intl.NumberFormat("en-US", {
    currency: currency.toUpperCase(),
    maximumFractionDigits: useCompactCents ? 2 : 0,
    minimumFractionDigits: useCompactCents ? 2 : 0,
    style: "currency",
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatTrustBalance(value: number) {
  if (!Number.isFinite(value)) return "0";
  if (value === 0) return "0";
  if (Math.abs(value) >= 100) return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (Math.abs(value) >= 1) return value.toLocaleString("en-US", { maximumFractionDigits: 4 });
  return value.toLocaleString("en-US", { maximumFractionDigits: 6 });
}
