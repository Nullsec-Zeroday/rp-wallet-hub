import React from "react";
import type { WalletTransaction } from "@rp-wallet/types";
import { formatTrustBalance, formatTrustCurrency, getTrustToken } from "@/lib/trust-token-data";
import { useTrustWallet } from "@/lib/trust-wallet-context";
import SwapModal from "../_components/swap-modal";
import CoinModal from "../_components/coin-modal";
import SendModal from "../_components/send-modal";
import HistoryModal from "../_components/history-modal";
import { requestDemoPaywall } from "@rp-wallet/wallet-core";

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

  return (
    <div data-testid="asset-row" role="button" className="outline-0 cursor-pointer">
      <div className="flex justify-between space-x-3 py-2 cursor-pointer items-center">
        <div className="relative min-w-min" style={{ borderRadius: "50%", boxShadow: "0 0 4px 1px rgba(35,191,125,0.08)" }}>
          <div className="flex items-center justify-center w-full h-full flex-1 flex-row">
            <div className="rounded-full overflow-hidden">
              <div className="w-10 h-10 flex items-center">
                {token.logo ? (
                  <img alt={token.name} className="w-full h-full rounded-full object-contain border-1" src={token.logo} />
                ) : (
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-[#2f3136] text-[12px] font-semibold text-white">{symbol.slice(0, 2)}</div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex-grow space-y-1">
          <div className="flex flex-row space-x-1 items-center">
            <p data-testid="asset-symbol" className="typography-body-16 text-utility-1-default font-medium">{symbol}</p>
            <div className="asset-chain-pill flex items-center justify-center typography-caption-12 font-medium rounded-6 bg-utility-1-opacity-4 text-utility-1-default px-2 py-0.5 min-h-5">{token.chain}</div>
          </div>
          <div className="flex flex-row space-x-1 items-center">
            <p data-testid="asset-fiat-price" className="typography-body-12 text-utility-1-opacity-1 font-normal">{formatTrustCurrency(price, currency)}</p>
            <p data-testid="asset-fiat-percentage-change" className="typography-body-12 font-normal" style={{ color: isPositive ? "#23BF7D" : "#FE5D5D" }}>{isPositive ? "+" : ""}{priceChange.toFixed(2)}%</p>
          </div>
        </div>
        <div className="text-right space-y-1">
          <div>
            <p data-testid="asset-crypto-balance" className="typography-body-16 text-utility-1-default font-medium">{formatTrustBalance(amount)}</p>
          </div>
          <div>
            <span className="text-textSecondary typography-body-12" data-testid="asset-fiat-balance">{formatTrustCurrency(amount * price, currency)}</span>
          </div>
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
  const { balanceMap, baseCurrency, payload, prices, tokenSymbols, totalChange, totalValue, walletName } = useTrustWallet();
  const [swapOpen, setSwapOpen] = React.useState(false);
  const [coinOpen, setCoinOpen] = React.useState(false);
  const [sendOpen, setSendOpen] = React.useState(false);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [selectedCoinSymbol, setSelectedCoinSymbol] = React.useState("BTC");
  const portfolioTokens = tokenSymbols
    .filter((symbol) => (balanceMap[symbol] || 0) > 0)
    .sort((a, b) => {
      const aToken = getTrustToken(a);
      const bToken = getTrustToken(b);
      return (balanceMap[b] || 0) * (prices[b]?.usd ?? bToken.price) - (balanceMap[a] || 0) * (prices[a]?.usd ?? aToken.price);
    });
  const displayChange = `${totalChange.dollar >= 0 ? "" : "-"}${formatTrustCurrency(Math.abs(totalChange.dollar), baseCurrency)} (${totalChange.percent >= 0 ? "+" : ""}${totalChange.percent.toFixed(2)}%)`;
  const changeColor = totalChange.dollar >= 0 ? "#23BF7D" : "#FE5D5D";
  const recentTransactions = [...payload.recentTransactions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  return (
    <>
      <div className="flex flex-col space-y-4 mb-6 mt-8 px-4">
        <div className="flex items-center justify-center space-x-2">
          <div className="relative flex items-center">
            <div className="flex items-center rounded-full px-3 py-1 wallet-pill">
              <span className="typography-header-16 flex items-center gap-2 text-utility-1-default font-semibold">
                <span id="walletNameDisplay">{walletName}</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="grey" width="14" height="14">
                  <path d="M471.1 297.4C483.6 309.9 483.6 330.2 471.1 342.7L279.1 534.7C266.6 547.2 246.3 547.2 233.8 534.7C221.3 522.2 221.3 501.9 233.8 489.4L403.2 320L233.9 150.6C221.4 138.1 221.4 117.8 233.9 105.3C246.4 92.8 266.7 92.8 279.2 105.3L471.2 297.3z"></path>
                </svg>
              </span>
            </div>
            <button className="outline-none p-1 absolute" type="button" style={{ right: "-32px", transform: "rotate(90deg)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="#B1B3B6" width="18px" height="18px" viewBox="0 0 24 24">
                <path d="M3,18 L3.11662113,17.9932723 C3.57570299,17.9399506 3.93995063,17.575703 3.99327227,17.1166211 L4,17 L4,4 L17,4 L17.1166211,3.99327227 C17.6139598,3.93550716 18,3.51283584 18,3 C18,2.48716416 17.6139598,2.06449284 17.1166211,2.00672773 L17,2 L3,2 L2.88337887,2.00672773 C2.42429701,2.06004937 2.06004937,2.42429701 2.00672773,2.88337887 L2,3 L2,17 L2.00672773,17.1166211 C2.06004937,17.575703 2.42429701,17.9399506 2.88337887,17.9932723 L3,18 Z M21,22 L21.1166211,21.9932723 C21.575703,21.9399506 21.9399506,21.575703 21.9932723,21.1166211 L22,21 L22,7 L21.9932723,6.88337887 C21.9443941,6.46255383 21.6342517,6.12141588 21.2292908,6.02641071 L21.1166211,6.00672773 L21,6 L7,6 L6.88337887,6.00672773 C6.42429701,6.06004937 6.06004937,6.42429701 6.00672773,6.88337887 L6,7 L6,21 L6.00672773,21.1166211 C6.0556059,21.5374462 6.36574828,21.8785841 6.77070917,21.9735893 L6.88337887,21.9932723 L7,22 L21,22 Z M8,20 L8,8 L20,8 L20,20 L8,20 Z"></path>
              </svg>
            </button>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center !mt-[0px]">
          <h2 data-testid="total-asset-balance" className="text-utility-1-default font-bold" style={{ fontSize: "40px" }}>
            <span id="totalBalance">{formatTrustCurrency(totalValue, baseCurrency)}</span>
          </h2>
          <p id="dailyChange" className="typography-body-14 text-success-1-default font-normal">
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
        <div data-testid="dashboard-wallet-board" className="flex items-center justify-center" style={{ gap: "26px" }}>
          <div className="flex flex-col space-y-2 items-center">
            <div data-tooltip-id="circle-action-tooltip-16" data-tooltip-place="top" data-tooltip-role="tooltip">
              <div className="flex " data-tooltip-id="button-tooltip-17" data-tooltip-place="top-end" data-tooltip-role="tooltip">
                <button onClick={() => setSendOpen(true)} data-testid="wallet-board-send-button" type="button" className="outline-none bg-button-secondary text-primary-default hover:bg-button-secondary-hovered active:bg-button-secondary-pressed disabled:bg-button-secondary-disabled p-3.5 icon-square-button">
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
          <div className="flex flex-col space-y-2 items-center">
            <div data-tooltip-id="circle-action-tooltip-16" data-tooltip-place="top" data-tooltip-role="tooltip">
              <div className="flex " data-tooltip-id="button-tooltip-17" data-tooltip-place="top-end" data-tooltip-role="tooltip">
                <button data-testid="wallet-board-receive-button" type="button" className="outline-none bg-button-secondary text-primary-default hover:bg-button-secondary-hovered active:bg-button-secondary-pressed disabled:bg-button-secondary-disabled p-3.5 icon-square-button">
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
          <div className="flex flex-col space-y-2 items-center">
            <div className="flex justify-center" data-tooltip-id="circle-action-tooltip-18" data-tooltip-place="top" data-tooltip-role="tooltip">
              <div className="flex " data-tooltip-id="button-tooltip-19" data-tooltip-place="top-end" data-tooltip-role="tooltip">
                <button data-testid="wallet-board-swap-button" type="button" className="outline-none bg-button-primary text-on-primary hover:bg-button-primary-hovered active:bg-button-primary-pressed disabled:bg-button-primary-pressed p-3.5 icon-square-button" onClick={() => setSwapOpen(true)}>
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
          <div className="flex flex-col space-y-2 items-center">
            <div data-tooltip-id="circle-action-tooltip-20" data-tooltip-place="top" data-tooltip-role="tooltip">
              <div className="flex " data-tooltip-id="button-tooltip-21" data-tooltip-place="top-end" data-tooltip-role="tooltip">
                <button data-testid="wallet-board-fund-button" type="button" className="outline-none bg-button-secondary text-primary-default hover:bg-button-secondary-hovered active:bg-button-secondary-pressed disabled:bg-button-secondary-disabled p-3.5 icon-square-button" onClick={() => requestDemoPaywall("buy")}>
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
      <div className="flex w-full justify-between items-start px-4">
        <div className="flex gap-4 justify-center" role="tablist" aria-orientation="horizontal" style={{ alignItems: "flex-start" }}>
          <button data-testid="tab-0" className="outline-none flex flex-col items-center justify-center" id="headlessui-tabs-tab-:rc:" role="tab" type="button" aria-selected="true" tabIndex={0} data-headlessui-state="selected" data-selected="" aria-controls="headlessui-tabs-panel-:rg:">
            <div className="flex flex-col w-fit h-full justify-between">
              <div className="flex items-center h-full mb-2">
                <p className="typography-subheader-16  text-utility-1-default font-medium   text-unset    " data-i18n="tab.crypto">Crypto</p>
              </div>
              <div data-selected="true" className="w-full h-1 rounded-full bg-button-primary"></div>
            </div>
          </button>
          <button data-testid="tab-1" className="outline-none flex flex-col items-center justify-center" id="headlessui-tabs-tab-:re:" role="tab" type="button" aria-selected="false" tabIndex={-1} data-headlessui-state="" aria-controls="headlessui-tabs-panel-:ri:">
            <div className="flex flex-col w-fit h-full justify-between">
              <div className="flex items-center h-full">
                <p className="typography-subheader-16  text-utility-1-opacity-2 font-medium   text-unset    " data-i18n="tab.watchlist">Watchlist</p>
              </div>
              <div data-selected="false" className="w-full h-1 rounded-full bg-transparent"></div>
            </div>
          </button>
          <button data-testid="tab-2" className="outline-none flex flex-col items-center justify-center" id="headlessui-tabs-tab-:re:" role="tab" type="button" aria-selected="false" tabIndex={-1} data-headlessui-state="" aria-controls="headlessui-tabs-panel-:ri:">
            <div className="flex flex-col w-fit h-full justify-between">
              <div className="flex items-center h-full">
                <p className="typography-subheader-16  text-utility-1-opacity-2 font-medium   text-unset    " data-i18n="tab.nfts">NFTs</p>
              </div>
              <div data-selected="false" className="w-full h-1 rounded-full bg-transparent"></div>
            </div>
          </button>
        </div>
        <div className="flex" style={{ marginRight: "6px" }}>
          <div className="flex w-auto" data-tooltip-id="button-tooltip-27" data-tooltip-place="top-end" data-tooltip-role="tooltip" style={{ marginRight: "30px" }}>
            <button onClick={() => setHistoryOpen(true)} data-testid="wallet-assets-history-button" type="button" className="outline-none bg-transparent text-background-1 text-subheader-16 leading-subheader-16 default-button !p-0 w-auto  ">
              <svg className="text-utility-1-opacity-1" fill="none" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M23.109 12C23.109 17.58 18.569 22.12 12.989 22.12C10.049 22.12 7.25903 20.85 5.33903 18.63C5.13903 18.4 5.04902 18.11 5.06902 17.81C5.08902 17.51 5.22903 17.24 5.44903 17.04C5.65903 16.87 5.91903 16.77 6.18903 16.77C6.51903 16.77 6.82902 16.91 7.03902 17.16C8.53902 18.88 10.699 19.88 12.989 19.88C17.329 19.88 20.859 16.34 20.859 12C20.859 7.66 17.329 4.12 12.989 4.12C9.09903 4.12 5.82903 6.91 5.21903 10.76L5.18903 10.9H6.01903C6.46903 10.9 6.87903 11.17 7.05903 11.6C7.22903 12.02 7.12903 12.5 6.80903 12.82L4.80903 14.82C4.59903 15.04 4.31903 15.15 4.01903 15.15C3.71903 15.15 3.42903 15.04 3.21903 14.82L1.21903 12.82C0.89903 12.5 0.799024 12.02 0.979024 11.6C1.14902 11.17 1.55903 10.9 2.01903 10.9H2.92902V10.79C3.54902 5.71 7.86903 1.88 12.989 1.88C18.569 1.88 23.109 6.42 23.109 12Z" fill="currentColor"></path>
                <path d="M16.9189 14.62C16.7089 14.94 16.3589 15.12 15.9789 15.12C15.7589 15.12 15.5489 15.06 15.3589 14.94L11.8589 12.6V7C11.8589 6.38 12.3589 5.88 12.9889 5.88C13.6189 5.88 14.1089 6.38 14.1089 7V11.4L14.1689 11.44L16.6089 13.06C16.8589 13.23 17.0289 13.48 17.0889 13.78C17.1489 14.07 17.0889 14.37 16.9189 14.62Z" fill="currentColor"></path>
              </svg>
            </button>
          </div>
          <div className="flex w-auto" data-tooltip-id="button-tooltip-26" data-tooltip-place="top-end" data-tooltip-role="tooltip">
            <button data-testid="wallet-assets-preferences-button" type="button" className="outline-none bg-transparent text-background-1 text-subheader-16 leading-subheader-16 default-button !p-0 w-auto  ">
              <svg className="text-utility-1-opacity-1" fill="none" width="21" height="16" viewBox="0 0 21 16" xmlns="http://www.w3.org/2000/svg">
                <path d="M1.12 5.11H9.3C9.79 6.77 11.3 7.99 13.12 7.99C14.94 7.99 16.45 6.77 16.94 5.11H19.12C19.74 5.11 20.24 4.61 20.24 3.99C20.24 3.37 19.74 2.87 19.12 2.87H16.94C16.45 1.21 14.94 0 13.12 0C11.3 0 9.79 1.22 9.3 2.87H1.12C0.5 2.87 0 3.37 0 3.99C0 4.61 0.5 5.11 1.12 5.11ZM13.12 2.24C14.08 2.24 14.87 3.03 14.87 3.99C14.87 4.95 14.08 5.74 13.12 5.74C12.16 5.74 11.37 4.95 11.37 3.99C11.37 3.03 12.16 2.24 13.12 2.24Z" fill="currentColor"></path>
                <path d="M19.12 10.86H10.94C10.45 9.19999 8.94 7.98999 7.12 7.98999C5.3 7.98999 3.79 9.20999 3.3 10.86H1.12C0.5 10.86 0 11.36 0 11.98C0 12.6 0.5 13.1 1.12 13.1H3.3C3.79 14.76 5.3 15.98 7.12 15.98C8.94 15.98 10.45 14.76 10.94 13.1H19.12C19.74 13.1 20.24 12.6 20.24 11.98C20.24 11.36 19.74 10.86 19.12 10.86ZM7.12 13.74C6.16 13.74 5.37 12.95 5.37 11.99C5.37 11.03 6.16 10.24 7.12 10.24C8.08 10.24 8.87 11.03 8.87 11.99C8.87 12.95 8.08 13.74 7.12 13.74Z" fill="currentColor"></path>
              </svg>
            </button>
          </div>
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
        <p className="typography-subheader-16 px-4 text-utility-1-default font-medium text-unset" data-i18n="trust.perps">Perps</p>
        <div className="flex gap-4 px-4 overflow-x-auto tw-scrollbar pb-2">
          <div role="button" className="outline-0  cursor-pointer" tabIndex={0}>
            <div className="rounded-4 bg-background-2 px-4 py-4 border-solid transition" style={{ minWidth: "210px" }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="rounded-full overflow-hidden flex-shrink-0" style={{ width: "32px", height: "32px" }}>
                  <img alt="ETH" className="rounded-full object-contain border-1" style={{ width: "32px", height: "32px" }} src="https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png" />
                </div>
                <p className="typography-subheader-16  text-utility-1-default font-semibold   text-unset    whitespace-nowrap">ETHUSDT</p>
              </div>
              <p className="typography-body-12  text-utility-1-opacity-1 font-medium   text-unset    whitespace-nowrap" style={{ fontSize: "11px" }} data-i18n="trust.trade_eth">Trade ETH with up to 200x leverage</p>
              <p className="typography-caption-12  text-utility-1-opacity-2 font-semibold   text-unset   leading-body-14 whitespace-nowrap" style={{ fontSize: "10px", marginTop: "2px" }}>$298k Vol</p>
            </div>
          </div>
          <div role="button" className="outline-0  cursor-pointer" tabIndex={0}>
            <div className="rounded-4 bg-background-2 px-4 py-4  border-solid transition" style={{ minWidth: "210px" }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="rounded-full overflow-hidden flex-shrink-0" style={{ width: "32px", height: "32px" }}>
                  <img alt="SOL" className="rounded-full object-contain border-1" style={{ width: "32px", height: "32px" }} src="https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png" />
                </div>
                <p className="typography-subheader-16  text-utility-1-default font-semibold   text-unset    whitespace-nowrap">SOLUSDT</p>
              </div>
              <p className="typography-body-12  text-utility-1-opacity-1 font-medium   text-unset    whitespace-nowrap" style={{ fontSize: "11px" }} data-i18n="trust.trade_sol">Trade SOL with up to 100x leverage</p>
              <p className="typography-caption-12  text-utility-1-opacity-2 font-semibold   text-unset   leading-body-14 whitespace-nowrap" style={{ fontSize: "10px", marginTop: "2px" }}>$1.11M Vol</p>
            </div>
          </div>
          <div role="button" className="outline-0  cursor-pointer" tabIndex={0}>
            <div className="rounded-4 bg-background-2 px-4 py-4  border-solid transition" style={{ minWidth: "210px" }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="rounded-full overflow-hidden flex-shrink-0" style={{ width: "32px", height: "32px" }}>
                  <img alt="BTC" className="rounded-full object-contain border-1" style={{ width: "32px", height: "32px" }} src="https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png" />
                </div>
                <p className="typography-subheader-16  text-utility-1-default font-semibold   text-unset    whitespace-nowrap">BTCUSDT</p>
              </div>
              <p className="typography-body-12  text-utility-1-opacity-1 font-medium   text-unset    whitespace-nowrap" style={{ fontSize: "11px" }} data-i18n="trust.trade_btc">Trade BTC with up to 200x leverage</p>
              <p className="typography-caption-12  text-utility-1-opacity-2 font-semibold   text-unset   leading-body-14 whitespace-nowrap" style={{ fontSize: "10px", marginTop: "2px" }}>$14k Vol</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 w-full mb-4 px-4">
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
      </div>
      <div className="flex flex-col gap-2 pb-10">
        <div role="button" className="outline-0 px-4 cursor-pointer" tabIndex={0}>
          <div className="flex w-full items-center gap-1">
            <p className="typography-subheader-16  text-utility-1-default font-medium   text-unset    " data-i18n="nav.earn">Earn</p>
            <svg className="text-utility-1-opacity-1" fill="none" width="16" height="16" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M7.69445 16.2503C7.44445 16.2503 7.18612 16.1586 6.98612 15.9753C6.56112 15.5836 6.53612 14.9253 6.92778 14.5003L10.8861 10.2086L6.92778 5.91694C6.53612 5.49194 6.56112 4.83361 6.98612 4.44194C7.41112 4.05028 8.06945 4.07528 8.46112 4.50028L13.0778 9.50028C13.4444 9.90028 13.4444 10.5169 13.0778 10.9169L8.46112 15.9169C8.25278 16.1419 7.97778 16.2503 7.69445 16.2503Z" fill="currentColor"></path>
            </svg>
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto tw-scrollbar pb-2 px-4">
          <div role="button" className="outline-0  cursor-pointer" tabIndex={0}>
            <div className="rounded-4 bg-background-2 px-4 py-2  border-solid transition w-full">
              <div className="flex gap-4 py-2">
                <div className="flex flex-col gap-1 whitespace-nowrap">
                  <div className="flex gap-1">
                    <small className="typography-caption-12  text-utility-1-opacity-1 font-semibold   text-unset   leading-body-14 " data-i18n="trust.earn_up_to">Earn up to</small>
                  </div>
                  <div className="flex items-center gap-1 pr-1">
                    <h3 className="typography-header-24 text-gradient-light text-utility-1-default font-bold   text-unset    ">$1.21</h3>
                    <p className="typography-body-12  text-utility-1-opacity-1 font-medium   text-unset    whitespace-nowrap" data-i18n="trust.per_year">/ Year</p>
                  </div>
                  <small className="typography-caption-12  text-utility-1-opacity-1 font-semibold   text-unset   leading-body-14 ">On 93.738445 TRX </small>
                </div>
                <div className="relative min-w-min">
                  <div className="flex items-center justify-center w-full h-full flex-1 flex-row">
                    <div className="rounded-full overflow-hidden  ">
                      <div className="w-10 h-10 flex items-center">
                        <img alt="Tron" className="w-full h-full rounded-full object-contain border-1" width="100%" height="100%" src="https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div role="button" className="outline-0  cursor-pointer" tabIndex={0}>
            <div className="rounded-4 bg-background-2 px-4 py-2  border-solid transition w-full">
              <div className="flex gap-4 py-2">
                <div className="flex flex-col gap-1 whitespace-nowrap">
                  <div className="flex gap-1">
                    <small className="typography-caption-12  text-utility-1-opacity-1 font-semibold   text-unset   leading-body-14 " data-i18n="trust.earn_up_to">Earn up to</small>
                  </div>
                  <div className="flex items-center gap-1 pr-1">
                    <h3 className="typography-header-24 text-gradient-light text-utility-1-default font-bold   text-unset    ">26.78%</h3>
                    <p className="typography-body-12  text-utility-1-opacity-1 font-medium   text-unset    whitespace-nowrap" data-i18n="trust.per_year">/ Year</p>
                  </div>
                  <small className="typography-caption-12  text-utility-1-opacity-1 font-semibold   text-unset   leading-body-14 ">On STARS</small>
                </div>
                <div className="relative min-w-min">
                  <div className="flex items-center justify-center w-full h-full flex-1 flex-row">
                    <div className="rounded-full overflow-hidden  ">
                      <div className="w-10 h-10 flex items-center">
                        <img alt="Stargaze" className="w-full h-full rounded-full object-contain border-1" width="100%" height="100%" src="https://assets-cdn.trustwallet.com/blockchains/stargaze/info/logo.png" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div role="button" className="outline-0  cursor-pointer" tabIndex={0}>
            <div className="rounded-4 bg-background-2 px-4 py-2  border-solid transition w-full">
              <div className="flex gap-4 py-2">
                <div className="flex flex-col gap-1 whitespace-nowrap">
                  <div className="flex gap-1">
                    <small className="typography-caption-12  text-utility-1-opacity-1 font-semibold   text-unset   leading-body-14 " data-i18n="trust.earn_up_to">Earn up to</small>
                  </div>
                  <div className="flex items-center gap-1 pr-1">
                    <h3 className="typography-header-24 text-gradient-light text-utility-1-default font-bold   text-unset    ">23.53%</h3>
                    <p className="typography-body-12  text-utility-1-opacity-1 font-medium   text-unset    whitespace-nowrap" data-i18n="trust.per_year">/ Year</p>
                  </div>
                  <small className="typography-caption-12  text-utility-1-opacity-1 font-semibold   text-unset   leading-body-14 ">On JUNO</small>
                </div>
                <div className="relative min-w-min">
                  <div className="flex items-center justify-center w-full h-full flex-1 flex-row">
                    <div className="rounded-full overflow-hidden  ">
                      <div className="w-10 h-10 flex items-center">
                        <img alt="Juno" className="w-full h-full rounded-full object-contain border-1" width="100%" height="100%" src="https://assets-cdn.trustwallet.com/blockchains/juno/info/logo.png" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
