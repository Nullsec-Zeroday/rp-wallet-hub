import type { LivePrices } from "@/lib/wallet-data";
import type { Transaction } from "@/lib/wallet-store";

const UNAVAILABLE = "—";

function formatNumber(value: number | undefined) {
  if (value === undefined || !Number.isFinite(value)) return UNAVAILABLE;
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 9,
    useGrouping: true,
  });
}

function formatUsd(value: number | undefined) {
  if (value === undefined || !Number.isFinite(value)) return UNAVAILABLE;
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatUtcTimestamp(timestamp: number) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return UNAVAILABLE;

  const datePart = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC",
  }).format(date);

  return `${timePart} ${datePart} (UTC)`;
}

export function shortenSolscanValue(value: string | undefined, leading = 6, trailing = 6) {
  if (!value) return UNAVAILABLE;
  if (value.length <= leading + trailing + 3) return value;
  return `${value.slice(0, leading)}...${value.slice(-trailing)}`;
}

export function getSolscanTransactionDetails(transaction: Transaction | null, prices: LivePrices) {
  const solPrice = prices.SOL;
  const tokenPrice = transaction ? prices[transaction.token]?.usd : undefined;
  const tokenUsdValue = transaction && tokenPrice !== undefined
    ? transaction.amount * tokenPrice
    : undefined;
  const status = transaction?.status === "failed"
    ? "FAILED"
    : transaction?.status === "pending"
      ? "PENDING"
      : "SUCCESS";

  return {
    amount: formatNumber(transaction?.amount),
    averageFee: UNAVAILABLE,
    destinationAmount: formatNumber(transaction?.toAmount),
    destinationToken: transaction?.toToken || UNAVAILABLE,
    fee: "0 SOL",
    from: transaction?.from || UNAVAILABLE,
    fromShort: shortenSolscanValue(transaction?.from),
    instructionName: transaction?.type === "swap" ? "Swap" : "Transfer",
    instructionProgram: transaction?.type === "swap"
      ? "Token Program"
      : transaction?.token === "SOL"
        ? "System Program"
        : "Token Program",
    priorityFee: "0 SOL",
    signature: transaction?.id || UNAVAILABLE,
    signatureShort: shortenSolscanValue(transaction?.id, 16, 12),
    signer: transaction?.from || UNAVAILABLE,
    signerShort: shortenSolscanValue(transaction?.from),
    solChange: solPrice
      ? `${solPrice.usd_24h_change >= 0 ? "+" : ""}${solPrice.usd_24h_change.toFixed(2)}%`
      : UNAVAILABLE,
    solChangeIsPositive: (solPrice?.usd_24h_change ?? 0) >= 0,
    solPrice: solPrice ? formatUsd(solPrice.usd) : UNAVAILABLE,
    status,
    statusTone: status === "SUCCESS" ? "success" : status === "PENDING" ? "pending" : "failed",
    timestamp: transaction ? formatUtcTimestamp(transaction.timestamp) : UNAVAILABLE,
    to: transaction?.to || UNAVAILABLE,
    toShort: shortenSolscanValue(transaction?.to),
    token: transaction?.token || UNAVAILABLE,
    tokenUsdValue: formatUsd(tokenUsdValue),
    transactionType: transaction?.type === "swap"
      ? "Swap"
      : transaction?.type === "receive"
        ? "Receive"
        : "Transfer",
  } as const;
}
