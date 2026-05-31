import React, { useState } from "react";
import { Search } from "lucide-react";
import { formatTrustCurrency } from "@/lib/trust-token-data";
import { useTrustWallet, type TrustSettingsInput } from "@/lib/trust-wallet-context";

interface WalletHeaderProps {
  scrolled?: boolean;
}

export default function WalletHeader({ scrolled = false }: WalletHeaderProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExtraCoinsVisible, setIsExtraCoinsVisible] = useState(false);
  const trustWallet = useTrustWallet();
  const [settingsDraft, setSettingsDraft] = useState<TrustSettingsInput>(trustWallet.settingsInitialValues);

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

  return (
    <>
      <div id="trustMainHeader" className="flex items-center justify-between gap-4" style={{ position: "relative", zIndex: 100, background: "transparent", paddingLeft: "16px", paddingRight: "16px", paddingTop: "max(env(safe-area-inset-top), 54px)", marginBottom: "2px" }}>
      <div className={scrolled ? "flex-1 flex justify-start" : "flex justify-start"}>
        <button data-testid="wallet-header-settings-button" type="button" className="outline-none bg-transparent p-2 -ml-2" onClick={() => setIsSettingsOpen(true)}>
          <svg xmlns="http://www.w3.org/2000/svg" className="text-utility-1-opacity-1" width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path fillRule="evenodd" clipRule="evenodd" d="M10.65 3L9.93163 3.53449L9.32754 5.54812L7.47651 4.55141L6.5906 4.68143L4.68141 6.59062L4.55139 7.47652L5.5481 9.32755L3.53449 9.93163L3 10.65V13.35L3.53449 14.0684L5.54811 14.6725L4.55142 16.5235L4.68144 17.4094L6.59063 19.3186L7.47653 19.4486L9.32754 18.4519L9.93163 20.4655L10.65 21H13.35L14.0684 20.4655L14.6725 18.4519L16.5235 19.4486L17.4094 19.3185L19.3186 17.4094L19.4486 16.5235L18.4519 14.6724L20.4655 14.0684L21 13.35V10.65L20.4655 9.93163L18.4519 9.32754L19.4486 7.47654L19.3186 6.59063L17.4094 4.68144L16.5235 4.55142L14.6725 5.54812L14.0684 3.53449L13.35 3H10.65ZM10.4692 6.96284L11.208 4.5H12.792L13.5308 6.96284L13.8753 7.0946C13.9654 7.12908 14.0543 7.16597 14.142 7.2052L14.4789 7.35598L16.7433 6.13668L17.8633 7.25671L16.644 9.52111L16.7948 9.85803C16.834 9.9457 16.8709 10.0346 16.9054 10.1247L17.0372 10.4692L19.5 11.208V12.792L17.0372 13.5308L16.9054 13.8753C16.8709 13.9654 16.834 14.0543 16.7948 14.1419L16.644 14.4789L17.8633 16.7433L16.7433 17.8633L14.4789 16.644L14.142 16.7948C14.0543 16.834 13.9654 16.8709 13.8753 16.9054L13.5308 17.0372L12.792 19.5H11.208L10.4692 17.0372L10.1247 16.9054C10.0346 16.8709 9.94569 16.834 9.85803 16.7948L9.52111 16.644L7.25671 17.8633L6.13668 16.7433L7.35597 14.4789L7.2052 14.142C7.16597 14.0543 7.12908 13.9654 7.0946 13.8753L6.96284 13.5308L4.5 12.792L4.5 11.208L6.96284 10.4692L7.0946 10.1247C7.12907 10.0346 7.16596 9.94571 7.20519 9.85805L7.35596 9.52113L6.13666 7.2567L7.25668 6.13667L9.5211 7.35598L9.85803 7.2052C9.9457 7.16597 10.0346 7.12908 10.1247 7.0946L10.4692 6.96284ZM14.25 12C14.25 13.2426 13.2426 14.25 12 14.25C10.7574 14.25 9.75 13.2426 9.75 12C9.75 10.7574 10.7574 9.75 12 9.75C13.2426 9.75 14.25 10.7574 14.25 12ZM15.75 12C15.75 14.0711 14.0711 15.75 12 15.75C9.92893 15.75 8.25 14.0711 8.25 12C8.25 9.92893 9.92893 8.25 12 8.25C14.0711 8.25 15.75 9.92893 15.75 12Z" fill="currentColor"></path>
          </svg>
        </button>
      </div>

      {scrolled ? (
        <div className="flex flex-col items-center justify-center shrink-0 transition-opacity duration-300" style={{ minHeight: "38px" }}>
          <span className="text-white text-[17px] font-bold leading-tight">{formatTrustCurrency(trustWallet.totalValue, trustWallet.baseCurrency)}</span>
        </div>
      ) : (
        <div className="flex-1">
          <div className="flex items-center bg-utility-1-opacity-5 rounded-full px-4 gap-2 transition-all duration-300" style={{ paddingTop: "10px", paddingBottom: "10px" }}>
            <svg className="text-utility-1-opacity-1 mr-2" fill="none" width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M10.6262 1.99976C15.3904 1.99976 19.2527 5.86217 19.2528 10.6263C19.2528 12.3718 18.7333 13.9969 17.8415 15.355L21.4847 18.9983L21.6059 19.1326C22.1688 19.8231 22.1282 20.8412 21.4847 21.4848C20.841 22.1285 19.8222 22.1693 19.1316 21.6059L18.9983 21.4848L15.355 17.8415C13.9969 18.7333 12.3718 19.2528 10.6262 19.2528C5.86214 19.2527 1.99973 15.3904 1.99973 10.6263C1.99981 5.86222 5.86219 1.99984 10.6262 1.99976ZM10.6262 5.51628C7.80427 5.51636 5.51633 7.8043 5.51625 10.6263C5.51625 13.4483 7.80422 15.7362 10.6262 15.7363C13.4483 15.7363 15.7362 13.4484 15.7362 10.6263C15.7362 7.80425 13.4483 5.51628 10.6262 5.51628Z" fill="currentColor"></path>
            </svg>
            <span className="text-utility-1-opacity-2 typography-body-14" data-i18n="trust.search">Search</span>
          </div>
        </div>
      )}

      <div className={scrolled ? "flex-1 flex justify-end items-center gap-6" : "flex items-center gap-6"}>
        {scrolled && (
          <button data-testid="wallet-header-search-icon" type="button" className="outline-none bg-transparent p-2 transition-opacity duration-300">
            <Search className="text-utility-1-opacity-1" size={24} strokeWidth={2.5} />
          </button>
        )}
        <button data-testid="wallet-header-scan-button" type="button" className="outline-none bg-transparent p-2">
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
                    <input id="set-walletName" type="text" placeholder="Larpz Wallet" maxLength={32} value={settingsDraft.walletName} onChange={(event) => setSettingsDraft((current) => ({ ...current, walletName: event.target.value }))} style={{ width: "100%", padding: "12px", background: "#252525", border: "1px solid #333", borderRadius: "10px", color: "#fff", fontSize: "14px", marginBottom: "8px" }} />
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
                        <img src="https://wsrv.nl/?url=https://assets-cdn.trustwallet.com/blockchains/solana/info/logo.png" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ color: "#fff", fontSize: "14px" }}>Solana (SOL)</div>
                            <input id="set-sol" type="number" min="0" step="any" placeholder="0" value={settingsDraft.balances.SOL || ""} onChange={(event) => updateBalanceDraft("SOL", event.target.value)} style={{ width: "100%", padding: "8px", background: "#252525", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "14px", marginTop: "4px" }} />
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        <img src="https://wsrv.nl/?url=https://assets-cdn.trustwallet.com/blockchains/bitcoin/info/logo.png" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ color: "#fff", fontSize: "14px" }}>Bitcoin (BTC)</div>
                            <input id="set-btc" type="number" min="0" step="any" placeholder="0" value={settingsDraft.balances.BTC || ""} onChange={(event) => updateBalanceDraft("BTC", event.target.value)} style={{ width: "100%", padding: "8px", background: "#252525", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "14px", marginTop: "4px" }} />
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        <img src="https://wsrv.nl/?url=https://assets-cdn.trustwallet.com/blockchains/ethereum/info/logo.png" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ color: "#fff", fontSize: "14px" }}>Ethereum (ETH)</div>
                            <input id="set-eth" type="number" min="0" step="any" placeholder="0" value={settingsDraft.balances.ETH || ""} onChange={(event) => updateBalanceDraft("ETH", event.target.value)} style={{ width: "100%", padding: "8px", background: "#252525", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "14px", marginTop: "4px" }} />
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        <img src="https://wsrv.nl/?url=https://assets-cdn.trustwallet.com/blockchains/tron/info/logo.png" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ color: "#fff", fontSize: "14px" }}>TRON (TRX)</div>
                            <input id="set-trx" type="number" min="0" step="any" placeholder="0" value={settingsDraft.balances.TRX || ""} onChange={(event) => updateBalanceDraft("TRX", event.target.value)} style={{ width: "100%", padding: "8px", background: "#252525", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "14px", marginTop: "4px" }} />
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        <img src="https://wsrv.nl/?url=https://assets-cdn.trustwallet.com/blockchains/smartchain/info/logo.png" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ color: "#fff", fontSize: "14px" }}>BNB (BNB)</div>
                            <input id="set-bnb" type="number" min="0" step="any" placeholder="0" value={settingsDraft.balances.BNB || ""} onChange={(event) => updateBalanceDraft("BNB", event.target.value)} style={{ width: "100%", padding: "8px", background: "#252525", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "14px", marginTop: "4px" }} />
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        <img src="https://wsrv.nl/?url=https://assets-cdn.trustwallet.com/blockchains/smartchain/assets/0x55d398326f99059fF775485246999027B3197955/logo.png" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
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
                        <img src="https://wsrv.nl/?url=https://assets-cdn.trustwallet.com/blockchains/ripple/info/logo.png" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ color: "#fff", fontSize: "14px" }}>XRP (XRP)</div>
                            <input id="set-xrp" type="number" min="0" step="any" placeholder="0" value={settingsDraft.balances.XRP || ""} onChange={(event) => updateBalanceDraft("XRP", event.target.value)} style={{ width: "100%", padding: "8px", background: "#252525", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "14px", marginTop: "4px" }} />
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        <img src="https://wsrv.nl/?url=https://assets-cdn.trustwallet.com/blockchains/litecoin/info/logo.png" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ color: "#fff", fontSize: "14px" }}>Litecoin (LTC)</div>
                            <input id="set-ltc" type="number" min="0" step="any" placeholder="0" value={settingsDraft.balances.LTC || ""} onChange={(event) => updateBalanceDraft("LTC", event.target.value)} style={{ width: "100%", padding: "8px", background: "#252525", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "14px", marginTop: "4px" }} />
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        <img src="https://wsrv.nl/?url=https://assets-cdn.trustwallet.com/blockchains/zcash/info/logo.png" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ color: "#fff", fontSize: "14px" }}>Zcash (ZEC)</div>
                            <input id="set-zec" type="number" min="0" step="any" placeholder="0" value={settingsDraft.balances.ZEC || ""} onChange={(event) => updateBalanceDraft("ZEC", event.target.value)} style={{ width: "100%", padding: "8px", background: "#252525", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "14px", marginTop: "4px" }} />
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        <img src="https://wsrv.nl/?url=https://assets-cdn.trustwallet.com/blockchains/algorand/info/logo.png" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ color: "#fff", fontSize: "14px" }}>Algorand (ALGO)</div>
                            <input id="set-algo" type="number" min="0" step="any" placeholder="0" value={settingsDraft.balances.ALGO || ""} onChange={(event) => updateBalanceDraft("ALGO", event.target.value)} style={{ width: "100%", padding: "8px", background: "#252525", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "14px", marginTop: "4px" }} />
                        </div>
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        <img src="https://wsrv.nl/?url=https://assets-cdn.trustwallet.com/blockchains/stellar/info/logo.png" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ color: "#fff", fontSize: "14px" }}>Stellar (XLM)</div>
                            <input id="set-xlm" type="number" min="0" step="any" placeholder="0" value={settingsDraft.balances.XLM || ""} onChange={(event) => updateBalanceDraft("XLM", event.target.value)} style={{ width: "100%", padding: "8px", background: "#252525", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "14px", marginTop: "4px" }} />
                        </div>
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        <img src="https://wsrv.nl/?url=https://assets-cdn.trustwallet.com/blockchains/sui/info/logo.png" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ color: "#fff", fontSize: "14px" }}>Sui (SUI)</div>
                            <input id="set-sui" type="number" min="0" step="any" placeholder="0" value={settingsDraft.balances.SUI || ""} onChange={(event) => updateBalanceDraft("SUI", event.target.value)} style={{ width: "100%", padding: "8px", background: "#252525", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "14px", marginTop: "4px" }} />
                        </div>
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        <img src="https://wsrv.nl/?url=https://assets-cdn.trustwallet.com/blockchains/doge/info/logo.png" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
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
                            <img src="https://wsrv.nl/?url=https://assets-cdn.trustwallet.com/blockchains/ton/info/logo.png" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
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
                            <img src="https://wsrv.nl/?url=https://assets-cdn.trustwallet.com/blockchains/polkadot/info/logo.png" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ color: "#fff", fontSize: "14px" }}>Polkadot (DOT)</div>
                                <input id="set-dot" type="number" min="0" step="any" placeholder="0" value={settingsDraft.balances.DOT || ""} onChange={(event) => updateBalanceDraft("DOT", event.target.value)} style={{ width: "100%", padding: "8px", background: "#252525", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "14px", marginTop: "4px" }} />
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                            <img src="https://wsrv.nl/?url=https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0xfAbA6f8e4a5E8Ab82F62fe7C39859FA577269BE3/logo.png" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ color: "#fff", fontSize: "14px" }}>Ondo (ONDO)</div>
                                <input id="set-ondo" type="number" min="0" step="any" placeholder="0" value={settingsDraft.balances.ONDO || ""} onChange={(event) => updateBalanceDraft("ONDO", event.target.value)} style={{ width: "100%", padding: "8px", background: "#252525", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "14px", marginTop: "4px" }} />
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                            <img src="https://wsrv.nl/?url=https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0x0D8775F648430679A709E98d2b0Cb6250d2887EF/logo.png" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
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
                            <img src="https://wsrv.nl/?url=https://assets-cdn.trustwallet.com/blockchains/hedera/info/logo.png" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ color: "#fff", fontSize: "14px" }}>Hedera (HBAR)</div>
                                <input id="set-hbar" type="number" min="0" step="any" placeholder="0" value={settingsDraft.balances.HBAR || ""} onChange={(event) => updateBalanceDraft("HBAR", event.target.value)} style={{ width: "100%", padding: "8px", background: "#252525", border: "1px solid #333", borderRadius: "8px", color: "#fff", fontSize: "14px", marginTop: "4px" }} />
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                            <img src="https://wsrv.nl/?url=https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0xD533a949740bb3306d119CC777fa900bA034cd52/logo.png" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
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
