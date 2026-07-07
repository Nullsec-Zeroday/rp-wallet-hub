import React from "react";
import type { WalletTransaction } from "@rp-wallet/types";
import { formatTrustBalance, formatTrustCurrency, getTrustToken } from "@/lib/trust-token-data";
import { useTrustWallet } from "@/lib/trust-wallet-context";
import SwapModal from "../_components/swap-modal";
import CoinModal from "../_components/coin-modal";
import SendModal from "../_components/send-modal";
import HistoryModal from "../_components/history-modal";
import { requestDemoPaywall } from "@rp-wallet/wallet-core";

const TRUST_CHAIN_BADGES: Record<string, string> = {
  "BNB Smart Chain": "https://assets-cdn.trustwallet.com/blockchains/smartchain/info/logo.png",
  Ethereum: "https://assets-cdn.trustwallet.com/blockchains/ethereum/info/logo.png",
  Solana: "https://assets-cdn.trustwallet.com/blockchains/solana/info/logo.png",
  TRC20: "https://assets-cdn.trustwallet.com/blockchains/tron/info/logo.png",
  Tron: "https://assets-cdn.trustwallet.com/blockchains/tron/info/logo.png",
};

const NATIVE_CHAIN_SYMBOLS = new Set(["BTC", "ETH", "SOL", "BNB", "TRX", "LTC", "XRP", "DOGE", "SUI", "TON", "DOT", "HBAR", "XLM", "ZEC", "ALGO"]);

function formatTokenDollarChange(value: number, currency: string) {
  const abs = Math.abs(value);
  return new Intl.NumberFormat("en-US", {
    currency: currency.toUpperCase(),
    maximumFractionDigits: abs > 0 && abs < 0.01 ? 6 : 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(abs);
}

function TrustAssetRow({
  amount,
  currency,
  price,
  priceChange,
  symbol,
}: {
  amount: number;
  currency: string;
  price: number;
  priceChange: number;
  symbol: string;
}) {
  const token = getTrustToken(symbol);
  const isPositive = priceChange >= 0;
  const fiatValue = amount * price;
  const dollarChange = fiatValue * (priceChange / 100);
  const chainBadge = NATIVE_CHAIN_SYMBOLS.has(symbol.toUpperCase()) ? undefined : TRUST_CHAIN_BADGES[token.chain];

  return (
    <div data-testid="asset-row" role="button" className="outline-0 cursor-pointer">
      <div className="flex justify-between space-x-2.5 py-3 cursor-pointer items-center">
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-full overflow-hidden flex items-center">
            {token.logo ? (
              <img alt={token.name} className="w-full h-full rounded-full object-contain border-1" src={token.logo} />
            ) : (
              <div className="grid h-12 w-12 place-items-center rounded-full bg-[#2f3136] text-[13px] font-semibold text-white">{symbol.slice(0, 2)}</div>
            )}
          </div>
          {chainBadge && (
            <span className="absolute overflow-hidden flex items-center justify-center" style={{ width: "19px", height: "19px", right: "-4px", bottom: "-2px", borderRadius: "6px", border: "2px solid #1B1B1C", background: "#1B1B1C" }}>
              <img alt={token.chain} src={chainBadge} style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.45)" }} />
            </span>
          )}
        </div>
        <div className="flex-grow min-w-0 space-y-0.5">
          <p data-testid="asset-symbol" className="text-utility-1-default font-semibold truncate" style={{ fontSize: "17px", lineHeight: "22px" }}>{token.name}</p>
          <p data-testid="asset-crypto-balance" className="font-normal" style={{ color: "#9A9A9E", fontSize: "15px", lineHeight: "20px" }}>{formatTrustBalance(amount)} {symbol}</p>
        </div>
        <div className="text-right shrink-0 space-y-0.5">
          <p data-testid="asset-fiat-balance" className="text-utility-1-default font-semibold" style={{ fontSize: "17px", lineHeight: "22px" }}>{formatTrustCurrency(fiatValue, currency)}</p>
          <p data-testid="asset-fiat-percentage-change" className="font-normal" style={{ color: isPositive ? "#23BF7D" : "#FE5D5D", fontSize: "15px", lineHeight: "20px" }}>{isPositive ? "+" : "-"}{formatTokenDollarChange(dollarChange, currency)}</p>
        </div>
      </div>
    </div>
  );
}

function truncateAddress(value = "") {
  if (!value) return "Unknown";
  if (value.length <= 14) return value;
  return `${value.slice(0, 6)}...${value.slice(-5)}`;
}

function getTransactionDisplay(transaction: WalletTransaction) {
  if (transaction.type === "receive" || transaction.type === "buy") {
    return {
      addressLabel: "From",
      address: transaction.fromAddress,
      icon: "receive" as const,
      isPositive: true,
      title: transaction.type === "buy" ? "Bought" : "Received",
    };
  }

  if (transaction.type === "swap") {
    return {
      addressLabel: "Via",
      address: transaction.toAddress || transaction.fromAddress || "Swap",
      icon: "swap" as const,
      isPositive: true,
      title: "Swapped",
    };
  }

  return {
    addressLabel: "To",
    address: transaction.toAddress,
    icon: "send" as const,
    isPositive: false,
    title: "Sent",
  };
}

function TransactionIcon({ type }: { type: "receive" | "send" | "swap" }) {
  if (type === "swap") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 3h5v5"></path><path d="M21 3l-7 7"></path><path d="M8 21H3v-5"></path><path d="M3 21l7-7"></path>
      </svg>
    );
  }

  return type === "receive" ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
  );
}

export default function HomePage() {
  const { balanceMap, baseCurrency, payload, prices, tokenSymbols, totalChange, totalValue } = useTrustWallet();
  const [swapOpen, setSwapOpen] = React.useState(false);
  const [coinOpen, setCoinOpen] = React.useState(false);
  const [sendOpen, setSendOpen] = React.useState(false);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [selectedCoinSymbol, setSelectedCoinSymbol] = React.useState("BTC");

  React.useEffect(() => {
    const openHistory = () => setHistoryOpen(true);
    window.addEventListener("trust-open-history", openHistory);
    return () => window.removeEventListener("trust-open-history", openHistory);
  }, []);
  const portfolioTokens = tokenSymbols
    .filter((symbol) => (balanceMap[symbol] || 0) > 0)
    .sort((a, b) => {
      const aToken = getTrustToken(a);
      const bToken = getTrustToken(b);
      return (balanceMap[b] || 0) * (prices[b]?.usd ?? bToken.price) - (balanceMap[a] || 0) * (prices[a]?.usd ?? aToken.price);
    });
  const displayChange = `${formatTrustCurrency(Math.abs(totalChange.dollar), baseCurrency)} (${Math.abs(totalChange.percent).toFixed(2)}%)`;
  const changeColor = totalChange.dollar >= 0 ? "#23BF7D" : "#FE5D5D";
  const recentTransactions = [...payload.recentTransactions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  return (
    <>
      <div className="flex flex-col space-y-4 mb-6 mt-3 px-4">
        {/* <div className="flex items-center gap-3" style={{ background: "#1C1D1F", padding: "12px 14px", borderRadius: "18px" }} role="button">
          <div className="flex flex-col items-center justify-center gap-1 shrink-0" style={{ width: "5px" }}>
            <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#4A4A4E" }}></span>
            <span style={{ width: "4px", height: "16px", borderRadius: "4px", background: "#6E6E73" }}></span>
          </div>
          <div className="flex items-center justify-center shrink-0" style={{ width: "38px", height: "38px", borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, #3D2F66 0%, #16121F 75%)", fontSize: "20px" }}>🔮</div>
          <div className="flex flex-col min-w-0">
            <span className="text-white font-semibold truncate" style={{ fontSize: "15px", lineHeight: "20px" }}>Hyperliquid now live in Predictions</span>
            <span style={{ color: "#9A9A9E", fontSize: "13px", lineHeight: "18px" }}>Explore now</span>
          </div>
        </div> */}
        <div className="flex flex-col items-start">
          <h2 data-testid="total-asset-balance" className="text-utility-1-default font-semibold" style={{ fontSize: "44px", lineHeight: "52px", letterSpacing: "-1px" }}>
            <span id="totalBalance">{formatTrustCurrency(totalValue, baseCurrency)}</span>
          </h2>
          <p id="dailyChange" className=" text-success-1-default font-normal" style={{ marginTop: "6px" }}>
            <span className="daily-change-value font-semibold">
              <span style={{ color: changeColor, display: "inline-flex", alignItems: "center", gap: "3px" }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20" style={{ verticalAlign: "middle", fill: changeColor, flexShrink: 0, transform: totalChange.dollar >= 0 ? "none" : "rotate(180deg)" }}>
                  <path d="M300.3 199.2C312.9 188.9 331.4 189.7 343.1 201.4L471.1 329.4C480.3 338.6 483 352.3 478 364.3C473 376.3 461.4 384 448.5 384L192.5 384C179.6 384 167.9 376.2 162.9 364.2C157.9 352.2 160.7 338.5 169.9 329.4L297.9 201.4L300.3 199.2z"></path>
                </svg>
                {displayChange}
              </span>
            </span>
          </p>
        </div>
        <div data-testid="dashboard-wallet-board" className="flex items-center justify-between">
          <div className="flex flex-col space-y-3 items-center">
            <div data-tooltip-id="circle-action-tooltip-16" data-tooltip-place="top" data-tooltip-role="tooltip">
              <div className="flex " data-tooltip-id="button-tooltip-17" data-tooltip-place="top-end" data-tooltip-role="tooltip">
                <button onClick={() => setSendOpen(true)} data-testid="wallet-board-send-button" type="button" className="outline-none bg-button-secondary text-primary-default hover:bg-button-secondary-hovered active:bg-button-secondary-pressed disabled:bg-button-secondary-disabled icon-square-button" style={{ width: "74px", height: "56px", borderRadius: "18px" }}>
                  <svg className="text-utility-1-default" fill="none" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.71 5.59023C19.71 5.45023 19.6799 5.32023 19.6299 5.19023C19.5799 5.08023 19.51 4.98023 19.43 4.89023C19.41 4.87023 19.4 4.84024 19.3799 4.82024C19.3599 4.80024 19.33 4.79023 19.3 4.77023C19.21 4.70023 19.12 4.62023 19.01 4.58023C18.87 4.52023 18.72 4.49023 18.58 4.49023H8.57995C7.95995 4.49023 7.45995 4.99023 7.45995 5.61023C7.45995 6.23023 7.95995 6.73022 8.57995 6.73022H15.86L4.77995 17.8102C4.33995 18.2502 4.33995 18.9602 4.77995 19.4002C4.99995 19.6202 5.28995 19.7302 5.57995 19.7302C5.86995 19.7302 6.15995 19.6202 6.37995 19.4002L17.46 8.32024V15.6002C17.46 16.2202 17.96 16.7202 18.58 16.7202C19.2 16.7202 19.6999 16.2202 19.6999 15.6002V5.60023C19.6999 5.60023 19.6999 5.58024 19.6999 5.57024L19.71 5.59023Z" fill="currentColor"></path>
                  </svg>
                </button>
              </div>
            </div>
            <div>
              <p className="body-text text-utility-1-default font-medium text-unset" data-i18n="btn.send">Send</p>
            </div>
          </div>
          <div className="flex flex-col space-y-3 items-center">
            <div data-tooltip-id="circle-action-tooltip-16" data-tooltip-place="top" data-tooltip-role="tooltip">
              <div className="flex " data-tooltip-id="button-tooltip-17" data-tooltip-place="top-end" data-tooltip-role="tooltip">
                <button data-testid="wallet-board-receive-button" type="button" className="outline-none bg-button-secondary text-primary-default hover:bg-button-secondary-hovered active:bg-button-secondary-pressed disabled:bg-button-secondary-disabled icon-square-button" style={{ width: "74px", height: "56px", borderRadius: "18px" }}>
                  <svg className="text-utility-1-default" fill="none" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ transform: "rotate(135deg)" }}>
                    <path d="M19.71 5.59023C19.71 5.45023 19.6799 5.32023 19.6299 5.19023C19.5799 5.08023 19.51 4.98023 19.43 4.89023C19.41 4.87023 19.4 4.84024 19.3799 4.82024C19.3599 4.80024 19.33 4.79023 19.3 4.77023C19.21 4.70023 19.12 4.62023 19.01 4.58023C18.87 4.52023 18.72 4.49023 18.58 4.49023H8.57995C7.95995 4.49023 7.45995 4.99023 7.45995 5.61023C7.45995 6.23023 7.95995 6.73022 8.57995 6.73022H15.86L4.77995 17.8102C4.33995 18.2502 4.33995 18.9602 4.77995 19.4002C4.99995 19.6202 5.28995 19.7302 5.57995 19.7302C5.86995 19.7302 6.15995 19.6202 6.37995 19.4002L17.46 8.32024V15.6002C17.46 16.2202 17.96 16.7202 18.58 16.7202C19.2 16.7202 19.6999 16.2202 19.6999 15.6002V5.60023C19.6999 5.60023 19.6999 5.58024 19.6999 5.57024L19.71 5.59023Z" fill="currentColor"></path>
                  </svg>
                </button>
              </div>
            </div>
            <div>
              <p className="body-text text-utility-1-default font-medium text-unset" data-i18n="btn.receive">Receive</p>
            </div>
          </div>
          <div className="flex flex-col space-y-3 items-center">
            <div className="flex justify-center" data-tooltip-id="circle-action-tooltip-18" data-tooltip-place="top" data-tooltip-role="tooltip">
              <div className="flex " data-tooltip-id="button-tooltip-19" data-tooltip-place="top-end" data-tooltip-role="tooltip">
                <button data-testid="wallet-board-swap-button" type="button" className="outline-none bg-button-primary text-on-primary hover:bg-button-primary-hovered active:bg-button-primary-pressed disabled:bg-button-primary-pressed icon-square-button" style={{ width: "74px", height: "56px", borderRadius: "18px" }} onClick={() => setSwapOpen(true)}>
                  <svg className="text-backgroundPrimary" fill="none" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.7877 5.215C22.1977 5.025 21.5677 5.355 21.3777 5.945L20.7177 8.025C20.6277 7.835 20.5377 7.655 20.4377 7.455C18.7777 4.475 15.6277 2.625 12.2277 2.625C8.82771 2.625 5.67771 4.475 4.01771 7.455C3.71771 7.995 3.90771 8.685 4.45771 8.985C4.99771 9.285 5.68771 9.095 5.98771 8.545C7.24771 6.285 9.63771 4.875 12.2277 4.875C14.8177 4.875 17.2077 6.285 18.4577 8.545C18.5677 8.745 18.6577 8.935 18.7477 9.125L16.5677 8.425C15.9777 8.235 15.3477 8.565 15.1577 9.155C14.9677 9.745 15.2977 10.375 15.8877 10.565L20.6077 12.065C20.7177 12.105 20.8377 12.115 20.9477 12.115C21.4277 12.115 21.8677 11.815 22.0177 11.335L23.5177 6.615C23.7077 6.025 23.3777 5.395 22.7877 5.205V5.215Z" fill="currentColor"></path>
                    <path d="M19.9875 15.015C19.4475 14.715 18.7575 14.905 18.4575 15.455C17.1975 17.715 14.8075 19.125 12.2175 19.125C9.62752 19.125 7.23752 17.715 5.98752 15.455C5.92752 15.345 5.87752 15.235 5.82752 15.135L8.09752 15.865C8.68752 16.055 9.31752 15.725 9.50752 15.135C9.69752 14.545 9.36752 13.915 8.77752 13.725L4.05752 12.225C3.46752 12.035 2.83752 12.365 2.64752 12.955L1.14752 17.655C0.957522 18.245 1.28752 18.875 1.87752 19.065C1.98752 19.105 2.10752 19.115 2.21752 19.115C2.69752 19.115 3.13752 18.815 3.28752 18.335L3.91752 16.355C3.94752 16.415 3.97752 16.475 4.00752 16.545C5.65752 19.525 8.80752 21.375 12.2075 21.375C15.6075 21.375 18.7575 19.525 20.4075 16.545C20.7075 16.005 20.5175 15.315 19.9675 15.015H19.9875Z" fill="currentColor"></path>
                  </svg>
                </button>
              </div>
            </div>
            <div>
              <p className="body-text text-utility-1-default font-medium text-unset" data-i18n="btn.swap">Swap</p>
            </div>
          </div>
          <div className="flex flex-col space-y-3 items-center">
            <div data-tooltip-id="circle-action-tooltip-20" data-tooltip-place="top" data-tooltip-role="tooltip">
              <div className="flex " data-tooltip-id="button-tooltip-21" data-tooltip-place="top-end" data-tooltip-role="tooltip">
                <button data-testid="wallet-board-fund-button" type="button" className="outline-none bg-button-secondary text-primary-default hover:bg-button-secondary-hovered active:bg-button-secondary-pressed disabled:bg-button-secondary-disabled icon-square-button" style={{ width: "74px", height: "56px", borderRadius: "18px" }} onClick={() => requestDemoPaywall("buy")}>
                  <svg className="text-utility-1-default" fill="none" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21.25 11.25H13.75V3.75C13.75 3.06 13.19 2.5 12.5 2.5C11.81 2.5 11.25 3.06 11.25 3.75V11.25H3.75C3.06 11.25 2.5 11.81 2.5 12.5C2.5 13.19 3.06 13.75 3.75 13.75H11.25V21.25C11.25 21.94 11.81 22.5 12.5 22.5C13.19 22.5 13.75 21.94 13.75 21.25V13.75H21.25C21.94 13.75 22.5 13.19 22.5 12.5C22.5 11.81 21.94 11.25 21.25 11.25Z" fill="currentColor"></path>
                  </svg>
                </button>
              </div>
            </div>
            <div>
              <p className="body-text text-utility-1-default font-medium text-unset" data-i18n="btn.buy">Buy</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex w-full justify-between items-center px-4">
        <div className="flex items-center gap-1 cursor-pointer" role="button" tabIndex={0}>
          <p className="text-utility-1-default font-semibold" style={{ fontSize: "18px", lineHeight: "24px" }} data-i18n="tab.tokens">Tokens</p>
          <svg className="" fill="none" width="18" height="18" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M7.69445 16.2503C7.44445 16.2503 7.18612 16.1586 6.98612 15.9753C6.56112 15.5836 6.53612 14.9253 6.92778 14.5003L10.8861 10.2086L6.92778 5.91694C6.53612 5.49194 6.56112 4.83361 6.98612 4.44194C7.41112 4.05028 8.06945 4.07528 8.46112 4.50028L13.0778 9.50028C13.4444 9.90028 13.4444 10.5169 13.0778 10.9169L8.46112 15.9169C8.25278 16.1419 7.97778 16.2503 7.69445 16.2503Z" fill="currentColor"></path>
          </svg>
        </div>
      </div>
      <div className="flex flex-1 pt-2 mb-6 px-4">
        <div className="flex w-full outline-none" id="headlessui-tabs-panel-:rg:" role="tabpanel" tabIndex={0} data-headlessui-state="selected" data-selected="" aria-labelledby="headlessui-tabs-tab-:rc:">
          <div id="assetList" className="flex flex-col w-full">
            {portfolioTokens.map((symbol) => (
              <div
                key={symbol}
                onClick={() => {
                  setSelectedCoinSymbol(symbol);
                  setCoinOpen(true);
                }}
                className="cursor-pointer"
              >
                <TrustAssetRow
                  amount={balanceMap[symbol] || 0}
                  currency={baseCurrency}
                  price={prices[symbol]?.usd ?? getTrustToken(symbol).price}
                  priceChange={prices[symbol]?.usd_24h_change ?? 0}
                  symbol={symbol}
                />
              </div>
            ))}
          </div>
        </div>
        <span aria-hidden="true" id="headlessui-tabs-panel-:ri:" role="tabpanel" tabIndex={-1} aria-labelledby="headlessui-tabs-tab-:re:" style={{ position: "fixed", top: "1px", left: "1px", width: "1px", height: "0px", padding: "0px", margin: "-1px", overflow: "hidden", clip: "rect(0px, 0px, 0px, 0px)", whiteSpace: "nowrap", borderWidth: "0px" }}></span>
      </div>
      <div className="flex flex-col gap-2 w-full mb-4">
        <div className="flex items-center gap-1 cursor-pointer px-4" role="button" tabIndex={0}>
          <p className="text-utility-1-default font-semibold" style={{ fontSize: "18px", lineHeight: "24px" }} data-i18n="trust.perps">Perps</p>
          <svg className="text-utility-1-opacity-1" fill="none" width="18" height="18" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M7.69445 16.2503C7.44445 16.2503 7.18612 16.1586 6.98612 15.9753C6.56112 15.5836 6.53612 14.9253 6.92778 14.5003L10.8861 10.2086L6.92778 5.91694C6.53612 5.49194 6.56112 4.83361 6.98612 4.44194C7.41112 4.05028 8.06945 4.07528 8.46112 4.50028L13.0778 9.50028C13.4444 9.90028 13.4444 10.5169 13.0778 10.9169L8.46112 15.9169C8.25278 16.1419 7.97778 16.2503 7.69445 16.2503Z" fill="currentColor"></path>
          </svg>
        </div>
        <div className="flex gap-3 px-4 overflow-x-auto tw-scrollbar pb-2" style={{ marginTop: "8px" }}>
          {[
            { symbol: "BTC", leverage: "40x", volume: "$2.71B Vol", logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png" },
            { symbol: "ETH", leverage: "25x", volume: "$644.17M Vol", logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png" },
            { symbol: "SOL", leverage: "20x", volume: "$1.11B Vol", logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png" },
          ].map((perp) => (
            <div key={perp.symbol} role="button" className="outline-0 cursor-pointer" tabIndex={0}>
              <div style={{ minWidth: "186px", borderRadius: "24px", background: "#232427", padding: "20px" }}>
                <div className="relative w-fit" style={{ marginBottom: "18px" }}>
                  <img alt={perp.symbol} className="rounded-full object-contain" style={{ width: "48px", height: "48px" }} src={perp.logo} />
                  <span className="absolute flex items-center justify-center" style={{ width: "20px", height: "20px", right: "-5px", bottom: "-3px", borderRadius: "7px", background: "#0F231A", border: "2px solid #232427" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7CFFB2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z" />
                    </svg>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-utility-1-default font-bold whitespace-nowrap" style={{ fontSize: "22px", lineHeight: "26px" }}>{perp.symbol}</p>
                  <span className="font-semibold" style={{ background: "#39393D", color: "#B4B5B8", borderRadius: "9999px", padding: "3px 12px", fontSize: "14px", lineHeight: "20px" }}>{perp.leverage}</span>
                </div>
                <p className="font-medium whitespace-nowrap" style={{ color: "#9A9A9E", fontSize: "15px", marginTop: "8px" }}>{perp.volume}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* <div className="flex flex-col gap-2 w-full mb-4 px-4">
        <p className="typography-subheader-16 text-utility-1-default font-medium text-unset" data-i18n="trust.popular_tokens">Popular Tokens</p>
        <div className="rounded-4 bg-background-2 px-4 py-2 border-solid transition w-full">
          <div className="grid grid-cols-4 h-10 justify-center" role="tablist" aria-orientation="horizontal">
            <button data-testid="tab-0" className="outline-none flex flex-col items-center justify-center pl-2" id="headlessui-tabs-tab-:r10:" role="tab" type="button" aria-selected="true" tabIndex={0} data-headlessui-state="selected" data-selected="" aria-controls="headlessui-tabs-panel-:r18:">
              <div className="flex flex-col w-fit h-full justify-between">
                <div className="flex items-center h-full">
                  <p className="typography-subheader-16  text-utility-1-default font-medium   text-unset    " data-i18n="tab.top">Top</p>
                </div>
                <div data-selected="true" className="w-full h-1 rounded-full data-[selected='true']:bg-[#48FF91]"></div>
              </div>
            </button>
            <button data-testid="tab-1" className="outline-none flex flex-col items-center justify-center " id="headlessui-tabs-tab-:r12:" role="tab" type="button" aria-selected="false" tabIndex={-1} data-headlessui-state="" aria-controls="headlessui-tabs-panel-:r1a:">
              <div className="flex flex-col w-fit h-full justify-between">
                <div className="flex items-center h-full">
                  <p className="typography-subheader-16  text-utility-1-opacity-2 font-medium   text-unset    ">BNB</p>
                </div>
                <div data-selected="false" className="w-full h-1 rounded-full data-[selected='true']:bg-[#48FF91]"></div>
              </div>
            </button>
            <button data-testid="tab-2" className="outline-none flex flex-col items-center justify-center " id="headlessui-tabs-tab-:r14:" role="tab" type="button" aria-selected="false" tabIndex={-1} data-headlessui-state="" aria-controls="headlessui-tabs-panel-:r1c:">
              <div className="flex flex-col w-fit h-full justify-between">
                <div className="flex items-center h-full">
                  <p className="typography-subheader-16  text-utility-1-opacity-2 font-medium   text-unset    ">ETH</p>
                </div>
                <div data-selected="false" className="w-full h-1 rounded-full data-[selected='true']:bg-[#48FF91]"></div>
              </div>
            </button>
            <button data-testid="tab-3" className="outline-none flex flex-col items-center justify-center " id="headlessui-tabs-tab-:r16:" role="tab" type="button" aria-selected="false" tabIndex={-1} data-headlessui-state="" aria-controls="headlessui-tabs-panel-:r1e:">
              <div className="flex flex-col w-fit h-full justify-between">
                <div className="flex items-center h-full">
                  <p className="typography-subheader-16  text-utility-1-opacity-2 font-medium   text-unset    ">SOL</p>
                </div>
                <div data-selected="false" className="w-full h-1 rounded-full data-[selected='true']:bg-[#48FF91]"></div>
              </div>
            </button>
          </div>
          <div className="flex flex-1 pt-4">
            <div className="flex w-full outline-none" id="headlessui-tabs-panel-:r18:" role="tabpanel" tabIndex={0} data-headlessui-state="selected" data-selected="" aria-labelledby="headlessui-tabs-tab-:r10:">
              <div className="flex flex-col gap-2 w-full">
                <p className="typography-body-12  text-text-secondary font-medium   text-unset    " data-i18n="trust.top5_total">Top 5 tokens by total market cap</p>
                <div className="flex flex-col gap-2"></div>
              </div>
            </div>
            <div className="flex w-full outline-none" id="headlessui-tabs-panel-:r1a:" role="tabpanel" tabIndex={-1} hidden={true} data-headlessui-state="" style={{ display: "none" }} aria-labelledby="headlessui-tabs-tab-:r12:">
              <div className="flex flex-col gap-2 w-full">
                <p className="typography-body-12  text-text-secondary font-medium   text-unset    " data-i18n="trust.top5_bnb">Top 5 assets on BNB Chain by market cap</p>
                <div className="flex flex-col gap-2"></div>
              </div>
            </div>
            <div className="flex w-full outline-none" id="headlessui-tabs-panel-:r1c:" role="tabpanel" tabIndex={-1} hidden={true} data-headlessui-state="" style={{ display: "none" }} aria-labelledby="headlessui-tabs-tab-:r14:">
              <div className="flex flex-col gap-2 w-full">
                <p className="typography-body-12  text-text-secondary font-medium   text-unset    " data-i18n="trust.top5_eth">Top 5 assets on ETH Chain by market cap</p>
                <div className="flex flex-col gap-2"></div>
              </div>
            </div>
            <div className="flex w-full outline-none" id="headlessui-tabs-panel-:r1e:" role="tabpanel" tabIndex={-1} hidden={true} data-headlessui-state="" style={{ display: "none" }} aria-labelledby="headlessui-tabs-tab-:r16:">
              <div className="flex flex-col gap-2 w-full">
                <p className="typography-body-12  text-text-secondary font-medium   text-unset    " data-i18n="trust.top5_sol">Top 5 assets on SOL Chain by market cap</p>
                <div className="flex flex-col gap-2"></div>
              </div>
            </div>
          </div>
        </div>
      </div> */}
      <div className="flex flex-col gap-2 pb-10">
        <div role="button" className="outline-0 px-4 cursor-pointer" tabIndex={0}>
          <div className="flex w-full items-center gap-1">
            <p className="text-utility-1-default font-semibold" style={{ fontSize: "18px", lineHeight: "24px" }} data-i18n="nav.earn">Earn</p>
            <svg className="text-utility-1-opacity-1" fill="none" width="18" height="18" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M7.69445 16.2503C7.44445 16.2503 7.18612 16.1586 6.98612 15.9753C6.56112 15.5836 6.53612 14.9253 6.92778 14.5003L10.8861 10.2086L6.92778 5.91694C6.53612 5.49194 6.56112 4.83361 6.98612 4.44194C7.41112 4.05028 8.06945 4.07528 8.46112 4.50028L13.0778 9.50028C13.4444 9.90028 13.4444 10.5169 13.0778 10.9169L8.46112 15.9169C8.25278 16.1419 7.97778 16.2503 7.69445 16.2503Z" fill="currentColor"></path>
            </svg>
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto tw-scrollbar pb-2 px-4" style={{ marginTop: "8px" }}>
          {[
            { apy: "24.81% APY", asset: "JUNO", logo: "https://assets-cdn.trustwallet.com/blockchains/juno/info/logo.png" },
            { apy: "15.44% APY", asset: "KSM", logo: "https://assets-cdn.trustwallet.com/blockchains/kusama/info/logo.png" },
            { apy: "15.04% APY", asset: "DOT", logo: "https://assets-cdn.trustwallet.com/blockchains/polkadot/info/logo.png" },
          ].map((earn) => (
            <div key={earn.asset} role="button" className="outline-0 cursor-pointer" tabIndex={0}>
              <div style={{ minWidth: "186px", borderRadius: "24px", background: "#232427", padding: "20px" }}>
                <img alt={earn.asset} className="rounded-full object-contain" style={{ width: "48px", height: "48px", marginBottom: "18px" }} src={earn.logo} />
                <p className="text-utility-1-default font-bold whitespace-nowrap" style={{ fontSize: "22px", lineHeight: "26px" }}>{earn.apy}</p>
                <p className="font-medium whitespace-nowrap" style={{ color: "#9A9A9E", fontSize: "15px", marginTop: "8px" }}>on {earn.asset}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2 pb-36 px-4 mt-2">
        <div role="button" className="outline-0 cursor-pointer" tabIndex={0} onClick={() => setHistoryOpen(true)}>
          <div className="flex w-full items-center gap-1">
            <p className="typography-subheader-16 text-utility-1-default font-medium text-unset">History</p>
            <svg className="text-utility-1-opacity-1" fill="none" width="16" height="16" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M7.69445 16.2503C7.44445 16.2503 7.18612 16.1586 6.98612 15.9753C6.56112 15.5836 6.53612 14.9253 6.92778 14.5003L10.8861 10.2086L6.92778 5.91694C6.53612 5.49194 6.56112 4.83361 6.98612 4.44194C7.41112 4.05028 8.06945 4.07528 8.46112 4.50028L13.0778 9.50028C13.4444 9.90028 13.4444 10.5169 13.0778 10.9169L8.46112 15.9169C8.25278 16.1419 7.97778 16.2503 7.69445 16.2503Z" fill="currentColor"></path>
            </svg>
          </div>
        </div>

        <div className="flex flex-col gap-5 mt-4">
          {recentTransactions.length === 0 ? (
            <div className="py-4 text-center text-[14px] text-[#888]">No transactions yet</div>
          ) : recentTransactions.map((transaction) => {
            const display = getTransactionDisplay(transaction);
            const symbol = transaction.tokenSymbol.toUpperCase();
            const toSymbol = transaction.toTokenSymbol?.toUpperCase();
            const amount = Number(transaction.amount) || 0;
            const toAmount = Number(transaction.toAmount) || 0;
            const displayAmount = transaction.type === "swap" && toSymbol ? toAmount : amount;
            const displaySymbol = transaction.type === "swap" && toSymbol ? toSymbol : symbol;
            const price = prices[displaySymbol]?.usd ?? getTrustToken(displaySymbol).price;
            const sign = display.isPositive ? "+" : "-";

            return (
              <div key={transaction.id} className="flex items-center justify-between cursor-pointer" onClick={() => setHistoryOpen(true)}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center justify-center w-[42px] h-[42px] rounded-full bg-[#2A2A2D] shrink-0">
                    <TransactionIcon type={display.icon} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[16px] font-semibold text-white">{display.title}</span>
                    <span className="text-[14px] text-[#888] truncate">{display.addressLabel}: {truncateAddress(display.address)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0 pl-3">
                  <span className="text-[16px] font-semibold" style={{ color: display.isPositive ? "#48FF91" : "#fff" }}>{sign}{formatTrustBalance(displayAmount)} {displaySymbol}</span>
                  <span className="text-[14px] text-[#888]">≈ {formatTrustCurrency(displayAmount * price, baseCurrency)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center mt-6">
          <button
            onClick={() => setHistoryOpen(true)}
            className="flex items-center gap-2 bg-[#2A2A2D] hover:bg-[#3A3A3D] transition-colors rounded-full px-5 py-2 text-[15px] font-medium text-white border-none"
          >
            View all
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>
      <SwapModal isOpen={swapOpen} onClose={() => setSwapOpen(false)} />
      <HistoryModal isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
      <CoinModal isOpen={coinOpen} onClose={() => setCoinOpen(false)} symbol={selectedCoinSymbol} />
      <SendModal isOpen={sendOpen} onClose={() => setSendOpen(false)} />
    </>
  );
}
