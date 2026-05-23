export interface PhantomTokenMeta {
  symbol: string;
  name: string;
  color: string;
  icon: string;
}

export const PHANTOM_TOKEN_CATALOG: PhantomTokenMeta[] = [
  { symbol: "SOL", name: "Solana", color: "#9945FF", icon: "◎" },
  { symbol: "USDT", name: "USDT", color: "#26A17B", icon: "$" },
  { symbol: "ETH", name: "Ethereum", color: "#627EEA", icon: "E" },
  { symbol: "BTC", name: "Bitcoin", color: "#F7931A", icon: "B" },
  { symbol: "SUI", name: "Sui", color: "#4DA2FF", icon: "S" },
  { symbol: "MATIC", name: "Polygon", color: "#8247E5", icon: "P" },
  { symbol: "HYPE", name: "Hyperliquid", color: "#00E5B4", icon: "H" },
  { symbol: "BNB", name: "BNB", color: "#F3BA2F", icon: "B" },
  { symbol: "AVAX", name: "Avalanche", color: "#E84142", icon: "A" },
  { symbol: "LINK", name: "Chainlink", color: "#2A5ADA", icon: "L" },
  { symbol: "UNI", name: "Uniswap", color: "#FF007A", icon: "U" },
  { symbol: "USDC", name: "USDC", color: "#2775CA", icon: "$" },
  { symbol: "DOGE", name: "Dogecoin", color: "#C2A633", icon: "D" },
  { symbol: "MON", name: "Monad", color: "#836EF9", icon: "M" },
];

export const PHANTOM_TOKEN_MAP = Object.fromEntries(
  PHANTOM_TOKEN_CATALOG.map((token) => [token.symbol, token]),
) as Record<string, PhantomTokenMeta>;

export function formatPhantomCurrency(value: number) {
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: value > 0 && value < 0.01 ? 6 : 2,
  })}`;
}

export function formatPhantomBalance(value: number) {
  if (value === 0) return "0";
  if (value >= 1) {
    return value.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  }
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 });
}
