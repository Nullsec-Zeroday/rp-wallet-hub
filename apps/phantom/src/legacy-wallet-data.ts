export interface TokenInfo {
  symbol: string;
  name: string;
  price: number;
  decimals: number;
  defaultBalance: number;
  color: string;
  icon: string;
  logoUrl?: string;
  coingeckoId?: string;
  chainId?: string;
}

export interface TokenBalance {
  symbol: string;
  balance: number;
}

export interface PriceData {
  usd: number;
  usd_24h_change: number;
  image?: string;
}

export type LivePrices = Record<string, PriceData>;

export const CHAIN_ICONS: Record<string, string> = {
  solana: "https://cryptologos.cc/logos/solana-sol-logo.svg?v=024",
  ethereum: "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=024",
  base: "/tokens/base.png",
  bsc: "https://cryptologos.cc/logos/bnb-bnb-logo.svg?v=024",
  polygon: "https://cryptologos.cc/logos/polygon-matic-logo.svg?v=024",
  arbitrum: "https://cryptologos.cc/logos/arbitrum-arb-logo.svg?v=024",
  optimism: "https://cryptologos.cc/logos/optimism-ethereum-op-logo.svg?v=024",
  avalanche: "https://cryptologos.cc/logos/avalanche-avax-logo.svg?v=024",
};

export const TOKENS: TokenInfo[] = [
  { symbol: "SOL", name: "Solana", price: 130, decimals: 9, defaultBalance: 0.05178, color: "#9945FF", icon: "◎", logoUrl: "/tokens/sol.webp", coingeckoId: "solana" },
  { symbol: "USDT", name: "USDT", price: 1, decimals: 6, defaultBalance: 65, color: "#26A17B", icon: "$", logoUrl: "/tokens/usdt.webp", coingeckoId: "tether", chainId: "solana" },
  { symbol: "ETH", name: "Ethereum", price: 1600, decimals: 18, defaultBalance: 0, color: "#627EEA", icon: "Ξ", logoUrl: "/tokens/eth.webp", coingeckoId: "ethereum" },
  { symbol: "BTC", name: "Bitcoin", price: 83000, decimals: 8, defaultBalance: 0, color: "#F7931A", icon: "₿", logoUrl: "/tokens/btc.webp", coingeckoId: "bitcoin" },
  { symbol: "SUI", name: "Sui", price: 2.5, decimals: 9, defaultBalance: 0, color: "#4DA2FF", icon: "💧", logoUrl: "/tokens/sui.webp", coingeckoId: "sui" },
  { symbol: "MATIC", name: "Polygon", price: 0.35, decimals: 18, defaultBalance: 0, color: "#8247E5", icon: "⬡", logoUrl: "/tokens/matic.webp", coingeckoId: "matic-network" },
  { symbol: "HYPE", name: "Hyperliquid", price: 14, decimals: 8, defaultBalance: 0, color: "#00E5B4", icon: "◈", logoUrl: "/tokens/hype.webp", coingeckoId: "hyperliquid" },
  { symbol: "BNB", name: "BNB", price: 590, decimals: 18, defaultBalance: 0, color: "#F3BA2F", icon: "⬡", logoUrl: "/tokens/bnb.webp", coingeckoId: "binancecoin" },
  { symbol: "AVAX", name: "Avalanche", price: 22, decimals: 18, defaultBalance: 0, color: "#E84142", icon: "△", logoUrl: "/tokens/avax.webp", coingeckoId: "avalanche-2" },
  { symbol: "LINK", name: "Chainlink", price: 12, decimals: 18, defaultBalance: 0, color: "#2A5ADA", icon: "⬡", logoUrl: "/tokens/link.webp", coingeckoId: "chainlink" },
  { symbol: "UNI", name: "Uniswap", price: 7, decimals: 18, defaultBalance: 0, color: "#FF007A", icon: "🦄", logoUrl: "/tokens/uni.webp", coingeckoId: "uniswap" },
  { symbol: "USDC", name: "USDC", price: 1, decimals: 6, defaultBalance: 0, color: "#2775CA", icon: "$", logoUrl: "/tokens/usdc.webp", coingeckoId: "usd-coin", chainId: "solana" },
  { symbol: "DOGE", name: "Dogecoin", price: 0.16, decimals: 8, defaultBalance: 0, color: "#C2A633", icon: "Ð", logoUrl: "/tokens/doge.webp", coingeckoId: "dogecoin" },
  { symbol: "MON", name: "Monad", price: 1.5, decimals: 18, defaultBalance: 0, color: "#836EF9", icon: "◎", logoUrl: "/tokens/mon.webp" },
];

export const TOKEN_MAP = TOKENS.reduce(
  (acc, token) => {
    acc[token.symbol] = token;
    return acc;
  },
  {} as Record<string, TokenInfo>,
);

export const DEFAULT_BALANCES: TokenBalance[] = TOKENS.map((token) => ({
  symbol: token.symbol,
  balance: token.defaultBalance,
}));

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  AUD: "A$",
  CAD: "C$",
  CNY: "¥",
  INR: "₹",
};

export function formatCurrency(value: number, currency = "USD", decimals = 2): string {
  const symbol = CURRENCY_SYMBOLS[currency] || "$";
  let minDecimals = decimals;
  let maxDecimals = decimals;

  if (value > 0 && value < 0.01) {
    minDecimals = 2;
    maxDecimals = 8;
  }

  return `${symbol}${value.toLocaleString("en-US", {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  })}`;
}

export function formatBalance(value: number): string {
  if (value === 0) return "0";
  if (value >= 1) {
    return value.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  }
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 });
}

export function generateRandomAddress(): string {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < 44; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
