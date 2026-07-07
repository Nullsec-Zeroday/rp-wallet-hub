import React, { useState } from "react";
import { Bell, Check, RefreshCw } from "lucide-react";
import { TRUST_TOKENS } from "@/lib/trust-token-data";
import { useTrustWallet, type TrustSettingsInput } from "@/lib/trust-wallet-context";
import { requestNotificationPermission } from "@/lib/notifications";
import type { WalletMutationType } from "@rp-wallet/types";
import { requestDemoPaywall } from "@rp-wallet/wallet-core";


const generateTrustAddress = () => {
  const chars = "0123456789abcdef";
  let result = "0x";
  for (let i = 0; i < 40; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export default function WalletHeader() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExtraCoinsVisible, setIsExtraCoinsVisible] = useState(false);
  const trustWallet = useTrustWallet();
  const [settingsDraft, setSettingsDraft] = useState<TrustSettingsInput>(trustWallet.settingsInitialValues);
  const [transactionDraft, setTransactionDraft] = useState({
    address: "",
    amount: "",
    createdAt: "",
    tokenSymbol: "USDT",
    type: "receive" as WalletMutationType,
  });
  const [transactionNotice, setTransactionNotice] = useState("");

  React.useEffect(() => {
    if (!isSettingsOpen) {
      setSettingsDraft(trustWallet.settingsInitialValues);
    }
  }, [isSettingsOpen, trustWallet.settingsInitialValues]);

  const updateBalanceDraft = (symbol: string, amount: string) => {
    setSettingsDraft((current) => ({
      ...current,
      balances: {
        ...current.balances,
        [symbol]: amount,
      },
    }));
  };

  const saveSettings = async () => {
    const saved = await trustWallet.saveSettings(settingsDraft);
    if (saved) setIsSettingsOpen(false);
  };

  const handleTogglePush = async () => {
    if (trustWallet.notificationSettings.pushEnabled) {
      await trustWallet.saveNotificationSettings({
        ...trustWallet.notificationSettings,
        pushEnabled: false,
      });
      return;
    }

    const granted = await requestNotificationPermission();
    if (!granted) return;

    await trustWallet.saveNotificationSettings({
      ...trustWallet.notificationSettings,
      pushEnabled: true,
    });
  };

  const createCustomTransaction = async () => {
    setTransactionNotice("");
    const isReceive = transactionDraft.type === "receive";
    const transaction = await trustWallet.createTransaction({
      amount: transactionDraft.amount,
      createdAt: transactionDraft.createdAt || undefined,
      fromAddress: isReceive ? transactionDraft.address.trim() : trustWallet.walletAddress,
      toAddress: isReceive ? trustWallet.walletAddress : transactionDraft.address.trim(),
      tokenSymbol: transactionDraft.tokenSymbol,
      type: transactionDraft.type,
    });
    if (transaction) {
      setTransactionNotice("Transaction added.");
      setTransactionDraft((current) => ({ ...current, address: "", amount: "", createdAt: "" }));
    }
  };

  return (
    <>
      <div id="trustMainHeader" className="flex items-center justify-between gap-3" style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 100, background: "transparent", paddingLeft: "16px", paddingRight: "16px", paddingTop: "max(env(safe-area-inset-top), 54px)" }}>
      <div className="flex justify-start min-w-0">
        <button
          data-testid="wallet-header-settings-button"
          type="button"
          className="outline-none flex items-center gap-2 rounded-full"
          style={{ background: "#2A2A2D", border: "none", cursor: "pointer", padding: "5px 18px 5px 6px", minHeight: "46px" }}
          onClick={() => trustWallet.demoMode ? requestDemoPaywall("settings") : setIsSettingsOpen(true)}
        >
          <span className="flex items-center justify-center shrink-0" style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#FEB902" }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.4 4.7H8.3C6.3 4.7 4.7 6.3 4.7 8.3V15.7C4.7 17.7 6.3 19.3 8.3 19.3H15.7C17.7 19.3 19.3 17.7 19.3 15.7V11.6C19.3 10.1 18.2 9 16.7 9H9.4" stroke="#FFFFFF" strokeWidth="2.3" strokeLinecap="round" fill="none"></path>
              <path d="M13.9 14.15h1.7" stroke="#FFFFFF" strokeWidth="2.3" strokeLinecap="round"></path>
            </svg>
          </span>
          <span id="walletNameDisplay" className="text-white font-semibold" style={{ fontSize: "17px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{trustWallet.walletName}</span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          data-testid="wallet-header-history-button"
          type="button"
          className="outline-none flex items-center justify-center shrink-0"
          style={{ width: "46px", height: "46px", borderRadius: "50%", background: "#2A2A2D", border: "none", cursor: "pointer" }}
          onClick={() => window.dispatchEvent(new Event("trust-open-history"))}
        >
          <svg className="text-utility-1-opacity-1" fill="none" width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M23.109 12C23.109 17.58 18.569 22.12 12.989 22.12C10.049 22.12 7.25903 20.85 5.33903 18.63C5.13903 18.4 5.04902 18.11 5.06902 17.81C5.08902 17.51 5.22903 17.24 5.44903 17.04C5.65903 16.87 5.91903 16.77 6.18903 16.77C6.51903 16.77 6.82902 16.91 7.03902 17.16C8.53902 18.88 10.699 19.88 12.989 19.88C17.329 19.88 20.859 16.34 20.859 12C20.859 7.66 17.329 4.12 12.989 4.12C9.09903 4.12 5.82903 6.91 5.21903 10.76L5.18903 10.9H6.01903C6.46903 10.9 6.87903 11.17 7.05903 11.6C7.22903 12.02 7.12903 12.5 6.80903 12.82L4.80903 14.82C4.59903 15.04 4.31903 15.15 4.01903 15.15C3.71903 15.15 3.42903 15.04 3.21903 14.82L1.21903 12.82C0.89903 12.5 0.799024 12.02 0.979024 11.6C1.14902 11.17 1.55903 10.9 2.01903 10.9H2.92902V10.79C3.54902 5.71 7.86903 1.88 12.989 1.88C18.569 1.88 23.109 6.42 23.109 12Z" fill="currentColor"></path>
            <path d="M16.9189 14.62C16.7089 14.94 16.3589 15.12 15.9789 15.12C15.7589 15.12 15.5489 15.06 15.3589 14.94L11.8589 12.6V7C11.8589 6.38 12.3589 5.88 12.9889 5.88C13.6189 5.88 14.1089 6.38 14.1089 7V11.4L14.1689 11.44L16.6089 13.06C16.8589 13.23 17.0289 13.48 17.0889 13.78C17.1489 14.07 17.0889 14.37 16.9189 14.62Z" fill="currentColor"></path>
          </svg>
        </button>
        <button
          data-testid="wallet-header-scan-button"
          type="button"
          className="outline-none flex items-center justify-center shrink-0"
          style={{ width: "46px", height: "46px", borderRadius: "50%", background: "#2A2A2D", border: "none", cursor: "pointer" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="text-utility-1-opacity-1" width="20" height="20" viewBox="0 0 10.327905 9.5664062" version="1.1" id="svg1" xmlSpace="preserve">
            <defs id="defs1"></defs>
            <g id="layer1" transform="translate(-177.39211,-85.718861)">
              <path style={{ fill: "none", stroke: "currentColor", strokeWidth: 1, strokeLinecap: "round", strokeLinejoin: "round", strokeMiterlimit: 5.5, strokeDasharray: "none", paintOrder: "fill markers stroke" }} d="m 178.35548,88.518958 v -2.300099 h 2.57889" id="path1"></path>
              <path style={{ fill: "none", stroke: "currentColor", strokeWidth: 1, strokeLinecap: "round", strokeLinejoin: "round", strokeMiterlimit: 5.5, strokeDasharray: "none", paintOrder: "fill markers stroke" }} d="m 178.35548,92.485163 v 2.300099 h 2.57889" id="path1-8"></path>
              <path style={{ fill: "none", stroke: "currentColor", strokeWidth: 1, strokeLinecap: "round", strokeLinejoin: "round", strokeMiterlimit: 5.5, strokeDasharray: "none", paintOrder: "fill markers stroke" }} d="m 186.76162,88.518949 v -2.30009 h -2.57889" id="path1-8-8"></path>
              <path style={{ fill: "none", stroke: "currentColor", strokeWidth: 1, strokeLinecap: "round", strokeLinejoin: "round", strokeMiterlimit: 5.5, strokeDasharray: "none", paintOrder: "fill markers stroke" }} d="m 186.76162,92.485172 v 2.30009 h -2.57889" id="path1-8-8-2"></path>
              <path style={{ fill: "none", stroke: "currentColor", strokeWidth: 1, strokeLinecap: "round", strokeLinejoin: "round", strokeMiterlimit: 5.5, strokeDasharray: "none", paintOrder: "fill markers stroke" }} d="m 177.89212,90.500714 h 9.32792" id="path2"></path>
            </g>
          </svg>
        </button>
      </div>
      </div>

      {isSettingsOpen && (
        <div id="settingsOverlay" style={{ display: "flex", position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 10000, justifyContent: "center", alignItems: "flex-end" }} className="open">
            <div id="settingsPanel" style={{ background: "#1a1a1a", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: "420px", maxHeight: "85vh", overflowY: "auto", padding: "20px", paddingBottom: "40px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h2 style={{ color: "#fff", fontSize: "20px", fontWeight: 600 }} data-i18n="settings.title">Settings</h2>
                    <button id="settingsClose" onClick={() => setIsSettingsOpen(false)} style={{ background: "none", border: "none", color: "#888", fontSize: "28px", cursor: "pointer" }}>×</button>
                </div>

                <div style={{ marginBottom: "24px" }}>
                    <div style={{ color: "#888", fontSize: "12px", textTransform: "uppercase", marginBottom: "12px" }} data-i18n="settings.wallet_name">Wallet Name</div>
                    <input id="set-walletName" type="text" placeholder="Larper Wallet" maxLength={32} value={settingsDraft.walletName} onChange={(event) => setSettingsDraft((current) => ({ ...current, walletName: event.target.value }))} style={{ width: "100%", padding: "12px", background: "#252525", border: "1px solid #333", borderRadius: "10px", color: "#fff", fontSize: "14px", marginBottom: "8px" }} />
                </div>

                <div style={{ marginBottom: "24px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                      <div style={{ color: "#888", fontSize: "12px", textTransform: "uppercase" }}>Wallet Address</div>
                      <button
                        type="button"
                        onClick={() => setSettingsDraft((current) => ({ ...current, walletAddress: generateTrustAddress() }))}
                        style={{ alignItems: "center", background: "transparent", border: 0, color: "#3CC68A", cursor: "pointer", display: "flex", fontSize: "11px", fontWeight: 700, gap: "5px", letterSpacing: "0.04em", padding: 0, textTransform: "uppercase" }}
                      >
                        <RefreshCw size={11} strokeWidth={2.5} />
                        Generate
                      </button>
                    </div>
                    <input id="set-walletAddress" type="text" placeholder="Enter wallet address" value={settingsDraft.walletAddress} onChange={(event) => setSettingsDraft((current) => ({ ...current, walletAddress: event.target.value }))} style={{ width: "100%", padding: "12px", background: "#252525", border: "1px solid #333", borderRadius: "10px", color: "#fff", fontSize: "14px", marginBottom: "8px" }} />
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <div style={{ color: "#888", fontSize: "12px", textTransform: "uppercase", marginBottom: "12px" }}>Notifications</div>
                  <div style={{ alignItems: "center", background: "#252525", border: "1px solid #333", borderRadius: "12px", display: "flex", justifyContent: "space-between", padding: "12px" }}>
                    <div style={{ alignItems: "center", display: "flex", gap: "10px" }}>
                      <Bell size={18} color="#3CC68A" />
                      <div>
                        <div style={{ color: "#fff", fontSize: "14px", fontWeight: 600 }}>Push Notifications</div>
                        <div style={{ color: "#888", fontSize: "12px", marginTop: "2px" }}>Incoming receive alerts</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleTogglePush}
                      style={{
                        alignItems: "center",
                        background: trustWallet.notificationSettings.pushEnabled ? "#102A1E" : "#2c2c2e",
                        border: trustWallet.notificationSettings.pushEnabled ? "1px solid rgba(16,185,129,0.35)" : "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "8px",
                        color: trustWallet.notificationSettings.pushEnabled ? "#10B981" : "#8b8ca7",
                        cursor: "pointer",
                        display: "flex",
                        fontSize: "12px",
                        fontWeight: 700,
                        gap: "5px",
                        height: "30px",
                        padding: "0 10px",
                      }}
                    >
                      {trustWallet.notificationSettings.pushEnabled ? (
                        <>
                          Enabled <Check size={12} strokeWidth={3} />
                        </>
                      ) : "Disabled"}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: "24px" }}>
                    <div style={{ color: "#888", fontSize: "12px", textTransform: "uppercase", marginBottom: "12px" }} data-i18n="settings.currency">Currency</div>
                    <select id="set-currency" value={settingsDraft.currency.toLowerCase()} onChange={(event) => setSettingsDraft((current) => ({ ...current, currency: event.target.value.toUpperCase() }))} style={{ width: "100%", padding: "12px", background: "#252525", border: "1px solid #333", borderRadius: "10px", color: "#fff", fontSize: "14px" }}>
                        <option value="usd">$ USD</option>
                        <option value="eur">€ EUR</option>
                        <option value="gbp">£ GBP</option>
                        <option value="cad">CA$ CAD</option>
                        <option value="aud">A$ AUD</option>
                        <option value="jpy">¥ JPY</option>
                        <option value="chf">CHF CHF</option>
                        <option value="cny">¥ CNY</option>
                        <option value="inr">₹ INR</option>
                        <option value="brl">R$ BRL</option>
                        <option value="zar">R ZAR</option>
                    </select>
                </div>

                <div style={{ marginBottom: "24px" }}>
                    <div style={{ color: "#888", fontSize: "12px", textTransform: "uppercase", marginBottom: "12px" }} data-i18n="settings.coin_balances">Coin Balances</div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        <img src="https://assets-cdn.trustwallet.com/blockchains/solana/info/logo.png" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ color: "#fff", fontSize: "14px" }}>Solana (SOL)</div>
                            <input id="set-sol" type="number" min="0" step="any" placeholder="0" value={settingsDraft.balances.SOL || ""} onChange={(event) => updateBalanceDraft("SOL", event.target.value)} style={{ width: "100%", padding: "8px", background: "#252525", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "14px", marginTop: "4px" }} />
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        <img src="https://assets-cdn.trustwallet.com/blockchains/bitcoin/info/logo.png" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ color: "#fff", fontSize: "14px" }}>Bitcoin (BTC)</div>
                            <input id="set-btc" type="number" min="0" step="any" placeholder="0" value={settingsDraft.balances.BTC || ""} onChange={(event) => updateBalanceDraft("BTC", event.target.value)} style={{ width: "100%", padding: "8px", background: "#252525", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "14px", marginTop: "4px" }} />
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        <img src="https://assets-cdn.trustwallet.com/blockchains/ethereum/info/logo.png" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ color: "#fff", fontSize: "14px" }}>Ethereum (ETH)</div>
                            <input id="set-eth" type="number" min="0" step="any" placeholder="0" value={settingsDraft.balances.ETH || ""} onChange={(event) => updateBalanceDraft("ETH", event.target.value)} style={{ width: "100%", padding: "8px", background: "#252525", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "14px", marginTop: "4px" }} />
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        <img src="https://assets-cdn.trustwallet.com/blockchains/tron/info/logo.png" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ color: "#fff", fontSize: "14px" }}>TRON (TRX)</div>
                            <input id="set-trx" type="number" min="0" step="any" placeholder="0" value={settingsDraft.balances.TRX || ""} onChange={(event) => updateBalanceDraft("TRX", event.target.value)} style={{ width: "100%", padding: "8px", background: "#252525", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "14px", marginTop: "4px" }} />
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        <img src="https://assets-cdn.trustwallet.com/blockchains/smartchain/info/logo.png" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ color: "#fff", fontSize: "14px" }}>BNB (BNB)</div>
                            <input id="set-bnb" type="number" min="0" step="any" placeholder="0" value={settingsDraft.balances.BNB || ""} onChange={(event) => updateBalanceDraft("BNB", event.target.value)} style={{ width: "100%", padding: "8px", background: "#252525", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "14px", marginTop: "4px" }} />
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        <img src="https://assets-cdn.trustwallet.com/blockchains/smartchain/assets/0x55d398326f99059fF775485246999027B3197955/logo.png" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ color: "#fff", fontSize: "14px" }}>Tether USD (USDT)</div>
                            <input id="set-usdt" type="number" min="0" step="any" placeholder="0" value={settingsDraft.balances.USDT || ""} onChange={(event) => updateBalanceDraft("USDT", event.target.value)} style={{ width: "100%", padding: "8px", background: "#252525", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "14px", marginTop: "4px" }} />
                            {/*
                            <select id="set-usdtNetwork" style={{ width: "100%", padding: "8px", background: "#252525", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "13px", marginTop: "6px" }}>
                                <option value="trc20">TRC20 (Tron)</option>
                                <option value="erc20">ERC20 (Ethereum)</option>
                                <option value="bep20">BEP20 (BNB Smart Chain)</option>
                                <option value="spl">SPL (Solana)</option>
                            </select>
                            */}
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        <img src="https://assets-cdn.trustwallet.com/blockchains/ripple/info/logo.png" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ color: "#fff", fontSize: "14px" }}>XRP (XRP)</div>
                            <input id="set-xrp" type="number" min="0" step="any" placeholder="0" value={settingsDraft.balances.XRP || ""} onChange={(event) => updateBalanceDraft("XRP", event.target.value)} style={{ width: "100%", padding: "8px", background: "#252525", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "14px", marginTop: "4px" }} />
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        <img src="https://assets-cdn.trustwallet.com/blockchains/litecoin/info/logo.png" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ color: "#fff", fontSize: "14px" }}>Litecoin (LTC)</div>
                            <input id="set-ltc" type="number" min="0" step="any" placeholder="0" value={settingsDraft.balances.LTC || ""} onChange={(event) => updateBalanceDraft("LTC", event.target.value)} style={{ width: "100%", padding: "8px", background: "#252525", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "14px", marginTop: "4px" }} />
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        <img src="https://assets-cdn.trustwallet.com/blockchains/zcash/info/logo.png" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ color: "#fff", fontSize: "14px" }}>Zcash (ZEC)</div>
                            <input id="set-zec" type="number" min="0" step="any" placeholder="0" value={settingsDraft.balances.ZEC || ""} onChange={(event) => updateBalanceDraft("ZEC", event.target.value)} style={{ width: "100%", padding: "8px", background: "#252525", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "14px", marginTop: "4px" }} />
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        <img src="https://assets-cdn.trustwallet.com/blockchains/algorand/info/logo.png" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ color: "#fff", fontSize: "14px" }}>Algorand (ALGO)</div>
                            <input id="set-algo" type="number" min="0" step="any" placeholder="0" value={settingsDraft.balances.ALGO || ""} onChange={(event) => updateBalanceDraft("ALGO", event.target.value)} style={{ width: "100%", padding: "8px", background: "#252525", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "14px", marginTop: "4px" }} />
                        </div>
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        <img src="https://assets-cdn.trustwallet.com/blockchains/stellar/info/logo.png" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ color: "#fff", fontSize: "14px" }}>Stellar (XLM)</div>
                            <input id="set-xlm" type="number" min="0" step="any" placeholder="0" value={settingsDraft.balances.XLM || ""} onChange={(event) => updateBalanceDraft("XLM", event.target.value)} style={{ width: "100%", padding: "8px", background: "#252525", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "14px", marginTop: "4px" }} />
                        </div>
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        <img src="https://assets-cdn.trustwallet.com/blockchains/sui/info/logo.png" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ color: "#fff", fontSize: "14px" }}>Sui (SUI)</div>
                            <input id="set-sui" type="number" min="0" step="any" placeholder="0" value={settingsDraft.balances.SUI || ""} onChange={(event) => updateBalanceDraft("SUI", event.target.value)} style={{ width: "100%", padding: "8px", background: "#252525", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "14px", marginTop: "4px" }} />
                        </div>
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        <img src="https://assets-cdn.trustwallet.com/blockchains/doge/info/logo.png" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ color: "#fff", fontSize: "14px" }}>Dogecoin (DOGE)</div>
                            <input id="set-doge" type="number" min="0" step="any" placeholder="0" value={settingsDraft.balances.DOGE || ""} onChange={(event) => updateBalanceDraft("DOGE", event.target.value)} style={{ width: "100%", padding: "8px", background: "#252525", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "14px", marginTop: "4px" }} />
                        </div>
                    </div>

                    <button 
                      id="coinsShowMore" 
                      type="button" 
                      onClick={() => setIsExtraCoinsVisible(!isExtraCoinsVisible)}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", width: "100%", padding: "10px", background: "transparent", border: "1px dashed #444", borderRadius: "10px", color: "#888", fontSize: "14px", cursor: "pointer", marginBottom: "4px" }}
                    >
                        <span id="coinsShowMoreText">{isExtraCoinsVisible ? "Show less" : "Show more"}</span>
                        <span id="coinsShowMoreArrow" style={{ transition: "transform 0.2s", display: "inline-block", transform: isExtraCoinsVisible ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
                    </button>

                    <div id="coinsExtra" style={{ display: isExtraCoinsVisible ? "block" : "none" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px", marginTop: "8px" }}>
                            <img src="https://assets-cdn.trustwallet.com/blockchains/ton/info/logo.png" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ color: "#fff", fontSize: "14px" }}>Toncoin (TON)</div>
                                <input id="set-ton" type="number" min="0" step="any" placeholder="0" value={settingsDraft.balances.TON || ""} onChange={(event) => updateBalanceDraft("TON", event.target.value)} style={{ width: "100%", padding: "8px", background: "#252525", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "14px", marginTop: "4px" }} />
                                {/*
                                <select id="set-tonNetwork" style={{ width: "100%", padding: "8px", background: "#252525", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "13px", marginTop: "6px" }}>
                                    <option value="ton">TON</option>
                                    <option value="bep20">BEP20 (BNB Smart Chain)</option>
                                    <option value="erc20">ERC20 (Ethereum)</option>
                                </select>
                                */}
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                            <img src="https://assets-cdn.trustwallet.com/blockchains/polkadot/info/logo.png" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ color: "#fff", fontSize: "14px" }}>Polkadot (DOT)</div>
                                <input id="set-dot" type="number" min="0" step="any" placeholder="0" value={settingsDraft.balances.DOT || ""} onChange={(event) => updateBalanceDraft("DOT", event.target.value)} style={{ width: "100%", padding: "8px", background: "#252525", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "14px", marginTop: "4px" }} />
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                            <img src="https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0xfAbA6f8e4a5E8Ab82F62fe7C39859FA577269BE3/logo.png" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ color: "#fff", fontSize: "14px" }}>Ondo (ONDO)</div>
                                <input id="set-ondo" type="number" min="0" step="any" placeholder="0" value={settingsDraft.balances.ONDO || ""} onChange={(event) => updateBalanceDraft("ONDO", event.target.value)} style={{ width: "100%", padding: "8px", background: "#252525", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "14px", marginTop: "4px" }} />
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                            <img src="https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0x0D8775F648430679A709E98d2b0Cb6250d2887EF/logo.png" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ color: "#fff", fontSize: "14px" }}>Basic Attention Token (BAT)</div>
                                <input id="set-bat" type="number" min="0" step="any" placeholder="0" value={settingsDraft.balances.BAT || ""} onChange={(event) => updateBalanceDraft("BAT", event.target.value)} style={{ width: "100%", padding: "8px", background: "#252525", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "14px", marginTop: "4px" }} />
                                {/*
                                <select id="set-batNetwork" style={{ width: "100%", padding: "8px", background: "#252525", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "13px", marginTop: "6px" }}>
                                    <option value="erc20">ERC20 (Ethereum)</option>
                                    <option value="bep20">BEP20 (BNB Smart Chain)</option>
                                    <option value="spl">SPL (Solana)</option>
                                    <option value="avax">Avalanche (BAT.e)</option>
                                </select>
                                */}
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                            <img src="https://assets-cdn.trustwallet.com/blockchains/hedera/info/logo.png" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ color: "#fff", fontSize: "14px" }}>Hedera (HBAR)</div>
                                <input id="set-hbar" type="number" min="0" step="any" placeholder="0" value={settingsDraft.balances.HBAR || ""} onChange={(event) => updateBalanceDraft("HBAR", event.target.value)} style={{ width: "100%", padding: "8px", background: "#252525", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "14px", marginTop: "4px" }} />
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                            <img src="https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0xD533a949740bb3306d119CC777fa900bA034cd52/logo.png" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ color: "#fff", fontSize: "14px" }}>Curve DAO Token (CRV)</div>
                                <input id="set-crv" type="number" min="0" step="any" placeholder="0" value={settingsDraft.balances.CRV || ""} onChange={(event) => updateBalanceDraft("CRV", event.target.value)} style={{ width: "100%", padding: "8px", background: "#252525", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "14px", marginTop: "4px" }} />
                                {/*
                                <select id="set-crvNetwork" style={{ width: "100%", padding: "8px", background: "#252525", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "13px", marginTop: "6px" }}>
                                    <option value="erc20">ERC20 (Ethereum)</option>
                                    <option value="spl">SPL (Solana)</option>
                                    <option value="base">Base</option>
                                    <option value="polygon">Polygon</option>
                                    <option value="arb">Arbitrum</option>
                                </select>
                                */}
                            </div>
                        </div>
                    </div>
                </div>

                {/*
                <div style={{ marginBottom: "24px" }}>
                    <div style={{ color: "#888", fontSize: "12px", textTransform: "uppercase", marginBottom: "12px" }} data-i18n="trust.custom_sol">Custom Tokens (Solana)</div>
                    <div id="custom-sol-token-list"></div>
                    <button id="addSolToken" type="button" style={{ width: "100%", padding: "10px", background: "transparent", border: "1px dashed #444", borderRadius: "10px", color: "#3CC68A", fontSize: "14px", cursor: "pointer" }} data-i18n="btn.add_sol_token_t">+ Add Solana Token by Contract Address</button>
                </div>

                <div style={{ marginBottom: "24px" }}>
                    <div style={{ color: "#888", fontSize: "12px", textTransform: "uppercase", marginBottom: "12px" }} data-i18n="trust.custom_eth">Custom Tokens (Ethereum)</div>
                    <div id="custom-eth-token-list"></div>
                    <button id="addEthToken" type="button" style={{ width: "100%", padding: "10px", background: "transparent", border: "1px dashed #444", borderRadius: "10px", color: "#627EEA", fontSize: "14px", cursor: "pointer" }} data-i18n="btn.add_eth_token_t">+ Add Ethereum Token by Contract Address</button>
                </div>
                */}

                <div style={{ marginBottom: "24px" }}>
                    <div style={{ color: "#888", fontSize: "12px", textTransform: "uppercase", marginBottom: "12px" }}>Custom Transaction</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                      <select value={transactionDraft.type} onChange={(event) => setTransactionDraft((current) => ({ ...current, type: event.target.value as WalletMutationType }))} style={{ width: "100%", padding: "12px", background: "#252525", border: "1px solid #333", borderRadius: "10px", color: "#fff", fontSize: "14px" }}>
                        <option value="receive">Receive</option>
                        <option value="send">Send</option>
                      </select>
                      <select value={transactionDraft.tokenSymbol} onChange={(event) => setTransactionDraft((current) => ({ ...current, tokenSymbol: event.target.value }))} style={{ width: "100%", padding: "12px", background: "#252525", border: "1px solid #333", borderRadius: "10px", color: "#fff", fontSize: "14px" }}>
                        {TRUST_TOKENS.map((token) => (
                          <option key={token.symbol} value={token.symbol}>{token.symbol}</option>
                        ))}
                      </select>
                    </div>
                    <input type="number" min="0" step="any" placeholder="Amount" value={transactionDraft.amount} onChange={(event) => setTransactionDraft((current) => ({ ...current, amount: event.target.value }))} style={{ width: "100%", padding: "12px", background: "#252525", border: "1px solid #333", borderRadius: "10px", color: "#fff", fontSize: "14px", marginBottom: "10px" }} />
                    <input type="text" placeholder={transactionDraft.type === "receive" ? "Sender address" : "Recipient address"} value={transactionDraft.address} onChange={(event) => setTransactionDraft((current) => ({ ...current, address: event.target.value }))} style={{ width: "100%", padding: "12px", background: "#252525", border: "1px solid #333", borderRadius: "10px", color: "#fff", fontSize: "14px", marginBottom: "10px" }} />
                    <input type="datetime-local" value={transactionDraft.createdAt} onChange={(event) => setTransactionDraft((current) => ({ ...current, createdAt: event.target.value }))} style={{ width: "100%", padding: "12px", background: "#252525", border: "1px solid #333", borderRadius: "10px", color: "#fff", fontSize: "14px", marginBottom: "10px" }} />
                    {transactionNotice ? (
                      <div style={{ marginBottom: "10px", borderRadius: "10px", background: "#173226", color: "#48FF91", padding: "10px 12px", fontSize: "13px", fontWeight: 600 }}>
                        {transactionNotice}
                      </div>
                    ) : null}
                    {trustWallet.transactionError ? (
                      <div style={{ marginBottom: "10px", borderRadius: "10px", background: "#3F2526", color: "#FE5D5D", padding: "10px 12px", fontSize: "13px", fontWeight: 600 }}>
                        {trustWallet.transactionError}
                      </div>
                    ) : null}
                    <button type="button" disabled={trustWallet.transactionPending} onClick={createCustomTransaction} style={{ width: "100%", padding: "12px", background: trustWallet.transactionPending ? "#28573d" : "transparent", border: "1px dashed #3CC68A", borderRadius: "10px", color: "#3CC68A", fontSize: "14px", fontWeight: 700, cursor: trustWallet.transactionPending ? "default" : "pointer" }}>
                      {trustWallet.transactionPending ? "Adding..." : "Add transaction"}
                    </button>
                </div>

                <div style={{ marginBottom: "24px" }}>
                    <div style={{ color: "#888", fontSize: "12px", textTransform: "uppercase", marginBottom: "12px" }} data-i18n="trust.coingecko">CoinGecko API</div>
                    <input id="set-cgApiKey" type="text" placeholder="Optional - lifts rate limits" value={settingsDraft.coingeckoApiKey} onChange={(event) => setSettingsDraft((current) => ({ ...current, coingeckoApiKey: event.target.value }))} style={{ width: "100%", padding: "12px", background: "#252525", border: "1px solid #333", borderRadius: "10px", color: "#fff", fontSize: "14px", marginBottom: "8px" }} />
                    {/*
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "#888", fontSize: "13px" }}>
                        <input id="set-cgApiKeyPro" type="checkbox" style={{ width: "18px", height: "18px" }} />
                        <span data-i18n="trust.pro_api">Pro API Key</span>
                    </label>
                    */}
                </div>

                {/*
                <div style={{ marginBottom: "20px" }}>
                    <div style={{ color: "#888", fontSize: "12px", textTransform: "uppercase", marginBottom: "8px" }} data-i18n="lang.label">Language</div>
                    <select className="i18n-switcher" style={{ width: "100%", padding: "10px 12px", background: "#252525", border: "1px solid #444", borderRadius: "10px", color: "#fff", fontSize: "14px", cursor: "pointer" }}>
                        <option value="en">EN — English</option>
                        <option value="fr">FR — Français</option>
                        <option value="es">ES — Español</option>
                        <option value="pt">PT — Português</option>
                        <option value="ru">RU — Русский</option>
                        <option value="tr">TR — Türkçe</option>
                    </select>
                </div>
                */}
                {trustWallet.saveError ? (
                  <div style={{ marginBottom: "12px", borderRadius: "10px", background: "#3F2526", color: "#FE5D5D", padding: "10px 12px", fontSize: "13px", fontWeight: 600 }}>
                    {trustWallet.saveError}
                  </div>
                ) : null}
                <button id="settingsConfirm" disabled={trustWallet.savingSettings} onClick={saveSettings} style={{ width: "100%", padding: "14px", background: trustWallet.savingSettings ? "#28573d" : "#3CC68A", border: "none", borderRadius: "12px", color: "#000", fontSize: "16px", fontWeight: 600, cursor: trustWallet.savingSettings ? "default" : "pointer" }} data-i18n="btn.save">{trustWallet.savingSettings ? "Saving..." : "Save"}</button>
            </div>
        </div>
      )}
    </>
  );
}
