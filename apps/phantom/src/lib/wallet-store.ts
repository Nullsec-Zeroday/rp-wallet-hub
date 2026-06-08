import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TokenBalance, TOKEN_MAP, DEFAULT_BALANCES, TOKENS, type LivePrices, type TokenInfo } from '@/lib/wallet-data';

export interface UserProfile {
  iconIndex: number;
  avatarType: 'emoji' | 'image';
  name: string;
  username: string;
  bio: string;
  email: string;
  twitter: string;
  discord: string;
  walletAddress: string;
}

export interface AddressEntry {
  address: string;
  name: string;
  timestamp?: number;
  isBookmarked?: boolean;
}

export interface Account {
  id: string;
  name: string;
  walletName: string;
  avatarIconIndex: number;
  tokenBalances: TokenBalance[];
  profile: UserProfile;
  cashBalance: number;
  transactions: Transaction[];
}


const DEFAULT_PROFILE: UserProfile = {
  iconIndex: 1,
  avatarType: 'emoji',
  name: '',
  username: 'rpwallet',
  bio: '',
  email: '',
  twitter: '',
  discord: '',
  walletAddress: '7x8fR9m4K5L2n3jP8hQ6vY7zB1cX0m9A8s7d6f5g4h3j',
};


export interface Transaction {
  id: string;
  type: 'receive' | 'send' | 'swap' | 'buy';
  token: string;
  amount: number;
  toToken?: string;
  toAmount?: number;
  status: 'confirmed' | 'pending' | 'failed';
  from: string;
  to: string;
  timestamp: number;
}


export interface BoostConfig {
  enabled: boolean;
  tokenSymbol: string;
  minIncrease: number;
  maxIncrease: number;
  minRefreshes: number;
  maxRefreshes: number;
  totalTimes: number;
}

export interface BoostState {
  currentRefreshCount: number;
  targetRefreshCount: number;
  remainingTimes: number;
}

export interface NotificationCoin {
  symbol: string;
  enabled: boolean;
  min: number;
  max: number;
}


export interface NotificationSettings {
  pushEnabled: boolean;
  coins: NotificationCoin[];
  mode: 'Manual' | 'Auto' | 'Random' | 'Fixed';
  frequency: number;
  unit: 'ms' | 'sec' | 'min' | 'hr';
  initialDelay: number;
  isActive: boolean;
  totalTimes: number;
  remainingTimes: number;
  senderAddress: string;
}

interface WalletStore {
  // State
  isOnboarded: boolean;
  walletName: string;
  avatarIconIndex: number;
  tokenBalances: TokenBalance[];
  profile: UserProfile;
  cashBalance: number;
  transactions: Transaction[];
  isKeyVerified: boolean;
  boostConfig: BoostConfig;
  boostState: BoostState;
  pwaModalOpen: boolean;
  coingeckoApiKey: string;
  dexscreenerApiKey: string;
  notificationSettings: NotificationSettings;
  baseCurrency: string;
  hasSeenWalkthrough: boolean;
  isWalkthroughActive: boolean;
  walkthroughStep: number;
  licensePlan: string;
  licenseExpiration: string;
  showBalances: boolean;
  customTokens: TokenInfo[];
  manageTokensVisible: boolean;
  tokenPickerVisible: boolean;
  accounts: Account[];
  currentAccountIndex: number;
  addressBook: AddressEntry[];
  recentAddresses: AddressEntry[];
  footerHidden: boolean;

  // Actions
  addAccount: (name?: string) => void;
  switchAccount: (index: number) => void;
  removeAccount: (id: string) => void;
  updateBalance: (symbol: string, newBalance: number) => void;
  updateAllBalances: (balances: TokenBalance[]) => void;
  updateWalletName: (name: string) => void;
  setAvatarIcon: (index: number) => void;
  updateProfile: (profile: UserProfile) => void;
  updateCashBalance: (balance: number) => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'timestamp'>) => void;
  setIsOnboarded: (val: boolean) => void;
  setIsKeyVerified: (val: boolean) => void;
  setPwaModalOpen: (val: boolean) => void;
  updateCoingeckoApiKey: (key: string) => void;
  updateDexscreenerApiKey: (key: string) => void;
  updateBoostConfig: (config: Partial<BoostConfig>) => void;
  handleRefreshBoost: () => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  toggleNotificationActive: () => void;
  triggerSimulatedTransaction: () => { symbol: string, amount: number } | null;
  updateBaseCurrency: (currency: string) => void;
  setHasSeenWalkthrough: (val: boolean) => void;
  setIsWalkthroughActive: (val: boolean) => void;
  setWalkthroughStep: (step: number) => void;
  deleteTransaction: (id: string) => void;
  clearTransactions: () => void;
  randomizeAvatar: () => void;
  updateLicenseInfo: (plan: string, expiration: string) => void;
  toggleShowBalances: () => void;
  addCustomToken: (token: TokenInfo) => void;
  removeCustomToken: (symbol: string) => void;
  setManageTokensVisible: (visible: boolean) => void;
  setTokenPickerVisible: (visible: boolean) => void;
  addRecentAddress: (address: string, name?: string) => void;
  toggleAddressBook: (address: string, name?: string) => void;
  setFooterHidden: (hidden: boolean) => void;


  // Computed
  getTotalBalance: (livePrices?: LivePrices) => number;
  getTotalPnL: (livePrices: LivePrices) => { dollarChange: number; percentChange: number };
}

const DEFAULT_BOOST_CONFIG: BoostConfig = {
  enabled: false,
  tokenSymbol: 'SOL',
  minIncrease: 0.1,
  maxIncrease: 0.5,
  minRefreshes: 3,
  maxRefreshes: 7,
  totalTimes: 5,
};

const DEFAULT_BOOST_STATE: BoostState = {
  currentRefreshCount: 0,
  targetRefreshCount: 0,
  remainingTimes: 0,
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  pushEnabled: false,
  coins: TOKENS.map(t => ({
    symbol: t.symbol,
    enabled: t.symbol === 'SOL',
    min: t.symbol === 'SOL' ? 5 : (t.symbol === 'ETH' ? 0.1 : 1),
    max: t.symbol === 'SOL' ? 95 : (t.symbol === 'ETH' ? 1.5 : 10),
  })),
  mode: 'Auto',
  frequency: 2,
  unit: 'sec',
  initialDelay: 0,
  isActive: false,
  totalTimes: 10,
  remainingTimes: 0,
  senderAddress: '7x8fR9m4K5L2n3jP8hQ6vY7zB1cX0m9A8s7d6f5g4h3j',
};

const CONTACT_NAMES = [
  "Account 1", "Main Wallet", "Trading", "Savings",
  "Secondary", "Whale Wallet", "Solana Mobile", "Ledger",
  "Dex", "NFT Vault"
];

export function generateRandomContacts(count: number): AddressEntry[] {
  return Array.from({ length: count }).map((_, i) => ({
    address: generateRandomAddress(),
    name: CONTACT_NAMES[i % CONTACT_NAMES.length] || `Contact ${i + 1}`,
    timestamp: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000),
    isBookmarked: Math.random() > 0.7
  }));
}

import { generateRandomAddress } from '@/lib/wallet-data';

export const useWalletStore = create<WalletStore>()(
  persist(
    (set, get) => ({
      isOnboarded: true,
      walletName: 'Account 1',
      avatarIconIndex: 1,
      tokenBalances: DEFAULT_BALANCES,
      profile: DEFAULT_PROFILE,

      cashBalance: 0,
      transactions: [],
      isKeyVerified: false,
      boostConfig: DEFAULT_BOOST_CONFIG,
      boostState: DEFAULT_BOOST_STATE,
      pwaModalOpen: false,
      coingeckoApiKey: '',
      dexscreenerApiKey: '',
      notificationSettings: DEFAULT_NOTIFICATION_SETTINGS,
      baseCurrency: 'USD',
      hasSeenWalkthrough: false,
      isWalkthroughActive: false,
      walkthroughStep: 0,
      licensePlan: 'Active Plan',
      licenseExpiration: '',
      showBalances: true,
      customTokens: [],
      manageTokensVisible: false,
      tokenPickerVisible: false,
      accounts: [{
        id: 'initial-account',
        name: 'Account 1',
        walletName: 'Account 1',
        avatarIconIndex: 1,
        tokenBalances: DEFAULT_BALANCES,
        profile: DEFAULT_PROFILE,
        cashBalance: 0,
        transactions: [],
      }],
      currentAccountIndex: 0,
      addressBook: generateRandomContacts(5),
      recentAddresses: generateRandomContacts(3),
      footerHidden: false,

      addAccount: (name) => {
        const { accounts } = get();
        const newIndex = accounts.length + 1;
        const newAccount: Account = {
          id: Math.random().toString(36).substring(2, 9),
          name: name || `Account ${newIndex}`,
          walletName: name || `Account ${newIndex}`,
          avatarIconIndex: Math.floor(Math.random() * 7),
          tokenBalances: DEFAULT_BALANCES,
          profile: {
            ...DEFAULT_PROFILE,
            walletAddress: generateRandomAddress(),
            username: name || `Account ${newIndex}`,
          },
          cashBalance: 0,
          transactions: [],
        };
        set({ accounts: [...accounts, newAccount] });
      },

      switchAccount: (index) => {
        const { accounts } = get();
        if (index < 0 || index >= accounts.length) return;
        
        const account = accounts[index];
        set({
          currentAccountIndex: index,
          walletName: account.walletName,
          avatarIconIndex: account.avatarIconIndex,
          tokenBalances: account.tokenBalances,
          profile: account.profile,
          cashBalance: account.cashBalance,
          transactions: account.transactions,
        });
      },

      removeAccount: (id) => {
        const { accounts, currentAccountIndex } = get();
        if (accounts.length <= 1) return;
        
        const newAccounts = accounts.filter(a => a.id !== id);
        let newIndex = currentAccountIndex;
        
        if (currentAccountIndex >= newAccounts.length) {
          newIndex = newAccounts.length - 1;
        }
        
        set({ accounts: newAccounts });
        get().switchAccount(newIndex);
      },

      updateBalance: (symbol, newBalance) => {
        const { tokenBalances, accounts, currentAccountIndex } = get();
        
        let balances = [...tokenBalances];
        const exists = balances.some((b) => b.symbol === symbol);
        
        if (exists) {
          balances = balances.map((b) =>
            b.symbol === symbol ? { ...b, balance: newBalance } : b
          );
        } else {
          balances.push({ symbol, balance: newBalance });
        }
        
        const newAccounts = [...accounts];
        if (newAccounts[currentAccountIndex]) {
          newAccounts[currentAccountIndex] = {
            ...newAccounts[currentAccountIndex],
            tokenBalances: balances,
          };
        }

        set({ tokenBalances: balances, accounts: newAccounts });
      },

      updateAllBalances: (balances) => {
        const { accounts, currentAccountIndex } = get();
        const newAccounts = [...accounts];
        if (newAccounts[currentAccountIndex]) {
          newAccounts[currentAccountIndex] = {
            ...newAccounts[currentAccountIndex],
            tokenBalances: balances,
          };
        }
        set({ tokenBalances: balances, accounts: newAccounts });
      },

      updateWalletName: (name) => {
        const { accounts, currentAccountIndex } = get();
        const newAccounts = [...accounts];
        if (newAccounts[currentAccountIndex]) {
          newAccounts[currentAccountIndex] = {
            ...newAccounts[currentAccountIndex],
            walletName: name,
          };
        }
        set({ walletName: name, accounts: newAccounts });
      },

      setAvatarIcon: (index) => {
        const { accounts, currentAccountIndex } = get();
        const newAccounts = [...accounts];
        if (newAccounts[currentAccountIndex]) {
          newAccounts[currentAccountIndex] = {
            ...newAccounts[currentAccountIndex],
            avatarIconIndex: index,
          };
        }
        set({ avatarIconIndex: index, accounts: newAccounts });
      },

      updateProfile: (profile) => {
        const { accounts, currentAccountIndex } = get();
        const newAccounts = [...accounts];
        if (newAccounts[currentAccountIndex]) {
          newAccounts[currentAccountIndex] = {
            ...newAccounts[currentAccountIndex],
            profile,
            avatarIconIndex: profile.iconIndex,
          };
        }
        set({ profile, avatarIconIndex: profile.iconIndex, accounts: newAccounts });
      },

      updateCashBalance: (balance) => {
        const { accounts, currentAccountIndex } = get();
        const newAccounts = [...accounts];
        if (newAccounts[currentAccountIndex]) {
          newAccounts[currentAccountIndex] = {
            ...newAccounts[currentAccountIndex],
            cashBalance: balance,
          };
        }
        set({ cashBalance: balance, accounts: newAccounts });
      },

      addTransaction: (tx) => {
        const { transactions, accounts, currentAccountIndex } = get();
        const newTx: Transaction = {
          ...tx,
          id: Math.random().toString(36).substring(2, 9),
          timestamp: Date.now(),
        };
        const newTransactions = [newTx, ...transactions];

        const newAccounts = [...accounts];
        if (newAccounts[currentAccountIndex]) {
          newAccounts[currentAccountIndex] = {
            ...newAccounts[currentAccountIndex],
            transactions: newTransactions,
          };
        }
        
        set({ transactions: newTransactions, accounts: newAccounts });
      },

      deleteTransaction: (id) => {
        const { transactions, accounts, currentAccountIndex } = get();
        const newTransactions = transactions.filter(t => t.id !== id);
        
        const newAccounts = [...accounts];
        if (newAccounts[currentAccountIndex]) {
          newAccounts[currentAccountIndex] = {
            ...newAccounts[currentAccountIndex],
            transactions: newTransactions,
          };
        }
        
        set({ transactions: newTransactions, accounts: newAccounts });
      },
      clearTransactions: () => {
        const { accounts, currentAccountIndex } = get();
        const newAccounts = [...accounts];
        if (newAccounts[currentAccountIndex]) {
          newAccounts[currentAccountIndex] = {
            ...newAccounts[currentAccountIndex],
            transactions: [],
          };
        }
        set({ transactions: [], accounts: newAccounts });
      },
      setIsOnboarded: (val) => {
        set({ isOnboarded: val });
      },
      setIsKeyVerified: (val) => {
        set({ isKeyVerified: val });
      },
      setPwaModalOpen: (val) => {
        set({ pwaModalOpen: val });
      },

      updateCoingeckoApiKey: (key) => {
        set({ coingeckoApiKey: key });
      },

      updateDexscreenerApiKey: (key) => {
        set({ dexscreenerApiKey: key });
      },

      updateBoostConfig: (config) => {
        const newConfig = { ...get().boostConfig, ...config };
        set({ 
          boostConfig: newConfig,
          boostState: {
            currentRefreshCount: 0,
            remainingTimes: newConfig.totalTimes,
            targetRefreshCount: Math.floor(Math.random() * (newConfig.maxRefreshes - newConfig.minRefreshes + 1)) + newConfig.minRefreshes
          }
        });
      },

      handleRefreshBoost: () => {
        const { boostConfig, boostState, tokenBalances, updateBalance } = get();
        if (!boostConfig.enabled || boostState.remainingTimes <= 0) return;

        const nextCount = boostState.currentRefreshCount + 1;
        
        if (nextCount >= boostState.targetRefreshCount) {
          // Trigger increase
          const increaseValue = Math.random() * (boostConfig.maxIncrease - boostConfig.minIncrease) + boostConfig.minIncrease;
          const currentBal = tokenBalances.find(b => b.symbol === boostConfig.tokenSymbol)?.balance ?? 0;
          updateBalance(boostConfig.tokenSymbol, currentBal + increaseValue);

          // Reset and decrement
          const nextRemaining = boostState.remainingTimes - 1;
          set({
            boostConfig: {
              ...boostConfig,
              enabled: nextRemaining > 0
            },
            boostState: {
              currentRefreshCount: 0,
              remainingTimes: nextRemaining,
              targetRefreshCount: nextRemaining > 0 
                ? Math.floor(Math.random() * (boostConfig.maxRefreshes - boostConfig.minRefreshes + 1)) + boostConfig.minRefreshes
                : 0
            }
          });
        } else {
          set({
            boostState: {
              ...boostState,
              currentRefreshCount: nextCount
            }
          });
        }
      },

      updateNotificationSettings: (settings) => {
        const current = get().notificationSettings;
        const newSettings = { ...current, ...settings };
        
        // If we are starting auto, reset remainingTimes if totalTimes changed or it was 0
        if (settings.isActive && !current.isActive) {
          newSettings.remainingTimes = newSettings.totalTimes;
        }
        
        set({ notificationSettings: newSettings });
      },

      toggleNotificationActive: () => {
        const current = get().notificationSettings;
        const nextActive = !current.isActive;
        set({ 
          notificationSettings: { 
            ...current, 
            isActive: nextActive,
            remainingTimes: nextActive ? current.totalTimes : current.remainingTimes
          } 
        });
      },

      triggerSimulatedTransaction: () => {
        const { notificationSettings, tokenBalances, updateBalance, addTransaction, updateNotificationSettings } = get();
        
        if (notificationSettings.isActive && notificationSettings.remainingTimes <= 0) {
          updateNotificationSettings({ isActive: false });
          return null;
        }

        const enabledCoins = notificationSettings.coins.filter(c => c.enabled);
        
        if (enabledCoins.length === 0) return null;

        const coin = enabledCoins[Math.floor(Math.random() * enabledCoins.length)];
        
        // Mode logic
        let amount = 0;
        if (notificationSettings.mode === 'Fixed') {
          amount = coin.min;
        } else {
          amount = Math.random() * (coin.max - coin.min) + coin.min;
        }

        // Round to 5 decimals for SOL/ETH, 2 for others
        const decimals = (coin.symbol === 'SOL' || coin.symbol === 'ETH') ? 5 : 2;
        amount = Number(amount.toFixed(decimals));


        const currentBal = tokenBalances.find(b => b.symbol === coin.symbol)?.balance ?? 0;
        updateBalance(coin.symbol, currentBal + amount);

        addTransaction({
          type: 'receive',
          token: coin.symbol,
          amount: amount,
          status: 'confirmed',
          from: notificationSettings.senderAddress || '7x8fR9m4K5L2n3jP8hQ6vY7zB1cX0m9A8s7d6f5g4h3j', 
          to: 'Your Wallet',
        });

        // Decrement remaining times if active
        if (notificationSettings.isActive) {
          const nextRemaining = notificationSettings.remainingTimes - 1;
          updateNotificationSettings({ 
            remainingTimes: nextRemaining,
            isActive: nextRemaining > 0
          });
        }

        return { symbol: coin.symbol, amount };
      },

      updateBaseCurrency: (currency) => {
        set({ baseCurrency: currency });
      },
      
      setHasSeenWalkthrough: (val) => {
        set({ hasSeenWalkthrough: val });
      },

      setIsWalkthroughActive: (val) => {
        set({ isWalkthroughActive: val });
      },

      setWalkthroughStep: (step) => {
        set({ walkthroughStep: step });
      },

      getTotalBalance: (livePrices) => {
        const balances = get().tokenBalances;
        
        const tokenTotal = balances.reduce((total, b) => {
          const customToken = get().customTokens.find(t => t.symbol === b.symbol);
          const staticToken = TOKEN_MAP[b.symbol];
          const token = customToken || staticToken;

          if (livePrices && livePrices[b.symbol]) {
            return total + b.balance * livePrices[b.symbol].usd;
          }
          return total + (token ? b.balance * token.price : 0);
        }, 0);
        
        return tokenTotal + get().cashBalance;
      },

      getTotalPnL: (livePrices) => {
        const balances = get().tokenBalances;
        
        let totalNow = 0;
        let total24hAgo = 0;

        for (const b of balances) {
          const priceData = livePrices[b.symbol];
          if (!priceData || b.balance === 0) continue;

          const valueNow = b.balance * priceData.usd;
          const changePct = priceData.usd_24h_change ?? 0;
          const price24hAgo = priceData.usd / (1 + changePct / 100);
          const value24hAgo = b.balance * price24hAgo;

          totalNow += valueNow;
          total24hAgo += value24hAgo;
        }

        const dollarChange = totalNow - total24hAgo;
        const percentChange = total24hAgo > 0 ? (dollarChange / total24hAgo) * 100 : 0;

        return { dollarChange, percentChange };
      },

      randomizeAvatar: () => {
        const { profile, updateProfile } = get();
        const randomIndex = Math.floor(Math.random() * 7); // 0 to 6
        updateProfile({
          ...profile,
          iconIndex: randomIndex,
          avatarType: 'image'
        });
      },

      updateLicenseInfo: (plan, expiration) => {
        set({ licensePlan: plan, licenseExpiration: expiration });
      },
      toggleShowBalances: () => {
        set({ showBalances: !get().showBalances });
      },
      addCustomToken: (token) => {
        const { customTokens, tokenBalances } = get();
        // Check if the EXACT SAME token (by coingeckoId) is already imported
        if (token.coingeckoId && (
          customTokens.some(t => t.coingeckoId === token.coingeckoId) ||
          TOKENS.some(t => t.coingeckoId === token.coingeckoId)
        )) {
          // Already exists, just ensure balance entry exists
          const existingToken = customTokens.find(t => t.coingeckoId === token.coingeckoId) || TOKENS.find(t => t.coingeckoId === token.coingeckoId);
          if (existingToken && !tokenBalances.some(b => b.symbol === existingToken.symbol)) {
             set({ tokenBalances: [...tokenBalances, { symbol: existingToken.symbol, balance: 0 }] });
          }
          return;
        }

        // Generate a unique symbol to prevent conflicts
        let uniqueSymbol = token.symbol.toUpperCase();
        let counter = 1;
        while (
          customTokens.some(t => t.symbol === uniqueSymbol) ||
          TOKENS.some(t => t.symbol === uniqueSymbol)
        ) {
          uniqueSymbol = `${token.symbol.toUpperCase()}-${counter}`;
          counter++;
        }

        const newToken = { ...token, symbol: uniqueSymbol };

        set({
          customTokens: [...customTokens, newToken],
          tokenBalances: [...tokenBalances, { symbol: uniqueSymbol, balance: 0 }]
        });
      },
      removeCustomToken: (symbol: string) => {
        const { customTokens, tokenBalances } = get();
        set({
          customTokens: customTokens.filter(t => t.symbol !== symbol),
          tokenBalances: tokenBalances.filter(b => b.symbol !== symbol)
        });
      },
      setManageTokensVisible: (visible) => {
        set({ manageTokensVisible: visible });
      },
      setTokenPickerVisible: (visible) => {
        set({ tokenPickerVisible: visible });
      },
      addRecentAddress: (address, name) => {
        const { recentAddresses } = get();
        const filtered = recentAddresses.filter(a => a.address !== address);
        const newEntry: AddressEntry = {
          address,
          name: name || `${address.slice(0, 4)}...${address.slice(-4)}`,
          timestamp: Date.now()
        };
        set({ recentAddresses: [newEntry, ...filtered].slice(0, 10) });
      },
      toggleAddressBook: (address, name) => {
        const { addressBook } = get();
        const exists = addressBook.find(a => a.address === address);
        if (exists) {
          set({ addressBook: addressBook.filter(a => a.address !== address) });
        } else {
          const newEntry: AddressEntry = {
            address,
            name: name || `${address.slice(0, 4)}...${address.slice(-4)}`,
            isBookmarked: true
          };
          set({ addressBook: [...addressBook, newEntry] });
        }
      },
      setFooterHidden: (hidden) => {
        set({ footerHidden: hidden });
      },
    }),
    {
      name: 'phantom-wallet-storage',
      version: 1,
      partialize: (state) => {
        const { isKeyVerified, ...rest } = state;
        return rest;
      },
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migrate single account to accounts array
          const state = persistedState as any;
          if (state && !state.accounts) {
            const initialAccount: Account = {
              id: 'initial-account',
              name: state.walletName || 'Account 1',
              walletName: state.walletName || 'Account 1',
              avatarIconIndex: state.avatarIconIndex || 1,
              tokenBalances: state.tokenBalances || DEFAULT_BALANCES,
              profile: state.profile || DEFAULT_PROFILE,
              cashBalance: state.cashBalance || 0,
              transactions: state.transactions || [],
            };
            state.accounts = [initialAccount];
            state.currentAccountIndex = 0;
          }
        }
        return persistedState;
      },
    }
  )
);
