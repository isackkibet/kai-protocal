import { create } from 'zustand';

interface TokenBalances {
  avax:   number;   // native AVAX gas balance
  nvr:    number;   // NVR governance token
  ybob:   number;   // yBOB stable token
  ytoken: number;   // Y Token ETF
  ygold:  number;   // YGold ETF
  gami:   number;   // GAMI rewards token
  cents:  number;   // Nuvari cents token
}

interface KaivaxState {
  // Wallet state (MetaMask / Core Wallet via Wagmi)
  connected:  boolean;
  walletType: 'metamask' | 'core' | null;
  accountId:  string; // 0x EVM address

  // Balances
  balances: TokenBalances;

  // Misc
  autoMineActive: boolean;

  // Actions
  connectWallet:    (type: 'metamask' | 'core', address: string) => void;
  disconnectWallet: () => void;
  setAvaxBalance:   (avax: number) => void;
  setTokenBalance:  (token: keyof Omit<TokenBalances, 'avax'>, value: number) => void;
  setAllBalances:   (balances: Partial<TokenBalances>) => void;
  toggleAutoMine:   () => void;
}

const ZERO_BALANCES: TokenBalances = { avax: 0, nvr: 0, ybob: 0, ytoken: 0, ygold: 0, gami: 0, cents: 0 };

export const useKaivaxStore = create<KaivaxState>((set) => ({
  connected:      false,
  walletType:     null,
  accountId:      '',
  balances:       { ...ZERO_BALANCES },
  autoMineActive: false,

  connectWallet:    (type, address) =>
    set({ connected: true, walletType: type, accountId: address }),

  disconnectWallet: () =>
    set({ connected: false, walletType: null, accountId: '', balances: { ...ZERO_BALANCES } }),

  setAvaxBalance: (avax) =>
    set((s) => ({ balances: { ...s.balances, avax } })),

  setTokenBalance: (token, value) =>
    set((s) => ({ balances: { ...s.balances, [token]: value } })),

  setAllBalances: (incoming) =>
    set((s) => ({ balances: { ...s.balances, ...incoming } })),

  toggleAutoMine: () =>
    set((s) => ({ autoMineActive: !s.autoMineActive })),
}));
