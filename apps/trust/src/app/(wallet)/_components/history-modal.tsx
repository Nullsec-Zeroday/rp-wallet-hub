"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { WalletTransaction } from "@rp-wallet/types";
import { formatTrustBalance, formatTrustCurrency, getTrustToken } from "@/lib/trust-token-data";
import { useTrustWallet } from "@/lib/trust-wallet-context";

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TransactionItem = {
  id: string;
  raw: WalletTransaction;
  type: string;
  address: string;
  amount: string;
  symbol: string;
  fiat: string;
  isPositive?: boolean;
  swapFrom?: string;
};

type TransactionGroup = {
  date: string;
  items: TransactionItem[];
};

function truncateAddress(value = "") {
  if (!value) return "Unknown";
  if (value.length <= 14) return value;
  return `${value.slice(0, 6)}...${value.slice(-5)}`;
}

function getTransactionTypeLabel(transaction: WalletTransaction) {
  if (transaction.type === "receive") return "Received";
  if (transaction.type === "swap") return "Swapped";
  if (transaction.type === "buy") return "Bought";
  return "Sent";
}

function groupTransactions(transactions: WalletTransaction[], prices: Record<string, { usd?: number }>, currency: string): TransactionGroup[] {
  const groups = new Map<string, TransactionItem[]>();

  transactions.forEach((transaction) => {
    const type = getTransactionTypeLabel(transaction);
    const isPositive = transaction.type === "receive" || transaction.type === "buy";
    const amountNumber = Number(transaction.amount) || 0;
    const symbol = transaction.tokenSymbol.toUpperCase();
    const price = prices[symbol]?.usd ?? getTrustToken(symbol).price;
    const date = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(transaction.createdAt));
    const address = transaction.type === "receive" ? transaction.fromAddress : transaction.toAddress;
    const item: TransactionItem = {
      id: transaction.id,
      raw: transaction,
      type,
      address: truncateAddress(address),
      amount: `${isPositive ? "+" : "-"}${formatTrustBalance(amountNumber)}`,
      symbol,
      fiat: formatTrustCurrency(amountNumber * price, currency),
      isPositive,
    };
    groups.set(date, [...(groups.get(date) || []), item]);
  });

  return Array.from(groups.entries()).map(([date, items]) => ({ date, items }));
}

export default function HistoryModal({ isOpen, onClose }: HistoryModalProps) {
  const [show, setShow] = useState(false);
  const [isRendered, setIsRendered] = useState(isOpen);
  const [activeTab, setActiveTab] = useState("history");
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);
  const { baseCurrency, payload, prices } = useTrustWallet();
  const transactionGroups = groupTransactions(payload.recentTransactions, prices, baseCurrency);

  useEffect(() => {
    let timer: number;
    let showTimer: number;
    if (isOpen) {
      setIsRendered(true);
      showTimer = window.setTimeout(() => setShow(true), 10);
    } else {
      setShow(false);
      timer = window.setTimeout(() => setIsRendered(false), 300);
    }
    return () => {
      clearTimeout(timer);
      clearTimeout(showTimer);
    };
  }, [isOpen]);

  if (!isRendered) return null;

  return createPortal(
    <>
      <div
        style={{
          position: "fixed", inset: 0, background: "transparent", zIndex: 10000,
          opacity: show ? 1 : 0, transition: "background 0.3s ease, opacity 0.25s ease", pointerEvents: show ? "auto" : "none"
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "0px",
            left: "0px",
            width: "100%",
            height: "100%",
            background: "hsl(var(--twc-backgroundPrimary,240 1.8% 10.8%))",
            display: "flex",
            flexDirection: "column",
            transform: show ? "translateX(0%)" : "translateX(100%)",
            transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
            overflow: "hidden",
            paddingTop: "env(safe-area-inset-top, 54px)"
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 12px", flexShrink: 0, position: "relative" }}>
            <button onClick={onClose} style={{ background: "none", border: "none", padding: "6px", cursor: "pointer", color: "#888", display: "flex", alignItems: "center", WebkitTapHighlightColor: "transparent", zIndex: 2 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M5 12L12 19M5 12L12 5" /></svg>
            </button>
            <span style={{ color: "#fff", fontSize: "19px", fontWeight: 600, position: "absolute", left: "50%", transform: "translateX(-50%)", zIndex: 1 }}>
              History
            </span>
            <div style={{ width: "38px" }}></div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "24px", padding: "0 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0, overflowX: "auto" }}>
            <button
              onClick={() => setActiveTab("history")}
              style={{ background: "none", border: "none", padding: "12px 0", color: activeTab === "history" ? "#fff" : "#888", fontSize: "16px", fontWeight: 600, position: "relative", cursor: "pointer", whiteSpace: "nowrap" }}
            >
              Transaction Hist...
              {activeTab === "history" && (
                <div style={{ position: "absolute", bottom: "-1px", left: 0, width: "100%", height: "3px", background: "#48FF91", borderRadius: "3px 3px 0 0" }} />
              )}
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              style={{ background: "none", border: "none", padding: "12px 0", color: activeTab === "orders" ? "#fff" : "#888", fontSize: "16px", fontWeight: 600, position: "relative", cursor: "pointer" }}
            >
              Orders
              {activeTab === "orders" && (
                <div style={{ position: "absolute", bottom: "-1px", left: 0, width: "100%", height: "3px", background: "#48FF91", borderRadius: "3px 3px 0 0" }} />
              )}
            </button>
            <button
              onClick={() => setActiveTab("order_history")}
              style={{ background: "none", border: "none", padding: "12px 0", color: activeTab === "order_history" ? "#fff" : "#888", fontSize: "16px", fontWeight: 600, position: "relative", cursor: "pointer" }}
            >
              Order History
              {activeTab === "order_history" && (
                <div style={{ position: "absolute", bottom: "-1px", left: 0, width: "100%", height: "3px", background: "#48FF91", borderRadius: "3px 3px 0 0" }} />
              )}
            </button>
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: "12px", padding: "16px", flexShrink: 0 }}>
            <button style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.08)", border: "none", padding: "8px 14px", borderRadius: "100px", color: "#bbb", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>
              Filters
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M5 6L0 0H10L5 6Z" fill="#bbb" /></svg>
            </button>
            <button style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.08)", border: "none", padding: "8px 14px", borderRadius: "100px", color: "#bbb", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>
              All Networks
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M5 6L0 0H10L5 6Z" fill="#bbb" /></svg>
            </button>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 24px" }}>
            {transactionGroups.length === 0 && (
              <div style={{ color: "#888", fontSize: "14px", padding: "32px 0", textAlign: "center" }}>
                No transactions yet
              </div>
            )}
            {transactionGroups.map((group, i) => (
              <div key={i} style={{ marginBottom: "24px" }}>
                <div style={{ color: "#fff", fontSize: "15px", fontWeight: 600, marginBottom: "16px" }}>
                  {group.date}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {group.items.map(tx => (
                    <div
                      key={tx.id}
                      onClick={() => setSelectedTx({ ...tx, date: group.date } as TransactionItem & { date: string })}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#2A2A2D", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {tx.type === "Sent" && (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
                          )}
                          {tx.type === "Received" && (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
                          )}
                          {tx.type === "Swapped" && (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5"></path><path d="M21 3l-7 7"></path><path d="M8 21H3v-5"></path><path d="M3 21l7-7"></path></svg>
                          )}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ color: "#fff", fontSize: "16px", fontWeight: 600 }}>{tx.type}</span>
                          <span style={{ color: "#888", fontSize: "13px" }}>
                            {tx.type === "Sent" ? "To: " : tx.type === "Received" ? "From: " : "Via: "}{tx.address}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
                        <span style={{ color: tx.isPositive ? "#48FF91" : "#fff", fontSize: "16px", fontWeight: 600 }}>
                          {tx.amount} {tx.symbol}
                        </span>
                        <span style={{ color: "#888", fontSize: "13px" }}>
                          {tx.swapFrom ? `${tx.swapFrom} ≈ ` : ""}≈ {tx.fiat}
                        </span>
                      </div>
                    </div>
                  ))}

                </div>
              </div>
            ))}
          </div>

          {/* Nested Details Overlay */}
          <div 
            onClick={() => setSelectedTx(null)}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              opacity: selectedTx ? 1 : 0,
              pointerEvents: selectedTx ? "auto" : "none",
              transition: "opacity 0.3s ease",
              zIndex: 9
            }} 
          />

          {/* Nested Details Modal */}
          <div
            style={{
              position: "absolute",
              bottom: "0px",
              left: "0px",
              width: "100%",
              height: "65vh",
              borderTopLeftRadius: "24px",
              borderTopRightRadius: "24px",
              background: "hsl(var(--twc-backgroundPrimary,240 1.8% 10.8%))",
              display: "flex",
              flexDirection: "column",
              transform: selectedTx ? "translateY(0%)" : "translateY(100%)",
              transition: "transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
              boxShadow: "0px -10px 40px rgba(0,0,0,0.5)",
              zIndex: 10,
            }}
          >
            {selectedTx && (
              <>
                <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 8px" }}>
                  <div style={{ width: "36px", height: "4px", background: "rgba(255,255,255,0.3)", borderRadius: "2px" }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px 24px", flexShrink: 0 }}>
                  <button style={{ background: "none", border: "none", padding: "6px", cursor: "pointer", color: "#ccc", display: "flex", alignItems: "center", WebkitTapHighlightColor: "transparent" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                  </button>
                  <span style={{ color: "#fff", fontSize: "17px", fontWeight: 600, position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
                    {selectedTx.type}
                  </span>
                  <button onClick={() => setSelectedTx(null)} style={{ background: "none", border: "none", padding: "6px", cursor: "pointer", color: "#ccc", display: "flex", alignItems: "center", WebkitTapHighlightColor: "transparent" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>

                <div style={{ flex: 1, padding: "0 16px 24px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "40px", gap: "8px" }}>
                    <div style={{ color: "#fff", fontSize: "32px", fontWeight: "bold" }}>≈ {selectedTx.fiat}</div>
                    <div style={{ color: "#888", fontSize: "15px", fontWeight: 500 }}>{selectedTx.amount} {selectedTx.symbol}</div>
                  </div>

                  <div style={{ background: "#2A2A2D", borderRadius: "16px", padding: "16px 20px", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ color: "#aaa", fontSize: "14px", fontWeight: 500 }}>Date</div>
                      <div style={{ color: "#eee", fontSize: "14px", fontWeight: 500 }}>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(selectedTx.raw.createdAt))}</div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ color: "#aaa", fontSize: "14px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
                        Status <svg width="15" height="15" viewBox="0 0 24 24" fill="#888"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
                      </div>
                      <div style={{ color: selectedTx.raw.status === "failed" ? "#FE5D5D" : selectedTx.raw.status === "pending" ? "#888" : "#48FF91", fontSize: "14px", fontWeight: 500 }}>{selectedTx.raw.status === "confirmed" ? "Completed" : selectedTx.raw.status === "failed" ? "Failed" : "Pending"}</div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ color: "#aaa", fontSize: "14px", fontWeight: 500 }}>{selectedTx.type === "Sent" ? "Recipient" : "Sender"}</div>
                      <div style={{ color: "#eee", fontSize: "14px", fontWeight: 500 }}>{truncateAddress(selectedTx.type === "Sent" ? selectedTx.raw.toAddress : selectedTx.raw.fromAddress)}</div>
                    </div>
                  </div>

                  <div style={{ background: "#2A2A2D", borderRadius: "16px", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ color: "#aaa", fontSize: "14px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
                        Network fee <svg width="15" height="15" viewBox="0 0 24 24" fill="#888"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
                      </div>
                      <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: "2px" }}>
                        <div style={{ color: "#eee", fontSize: "14px", fontWeight: 500 }}>{selectedTx.type === "Sent" ? `0.0000072 ${selectedTx.symbol}` : `0 ${selectedTx.symbol}`}</div>
                        {selectedTx.type === "Sent" && <div style={{ color: "#888", fontSize: "13px" }}>≈ {formatTrustCurrency(0, baseCurrency)}</div>}
                      </div>
                    </div>
                    {selectedTx.type === "Received" && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ color: "#aaa", fontSize: "14px", fontWeight: 500 }}>Nonce</div>
                        <div style={{ color: "#eee", fontSize: "14px", fontWeight: 500 }}>4</div>
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", paddingBottom: "8px" }}>
                    <button style={{ width: "100%", padding: "16px", background: "transparent", color: "#48FF91", fontSize: "16px", fontWeight: 600, border: "none", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
                      View on block explorer
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </>,
    document.body
  );
}
