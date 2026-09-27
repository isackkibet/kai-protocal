import { create } from "zustand";

interface SihuState {
  connected: boolean;
  walletType: "native" | "hashpack" | "metamask" | null;
  accountId: string;
  privateKey: string | null;
  publicKey: string | null;
  autoMineActive: boolean;
  balances: { 
    hbar: number; 
    sihu: number; 
    usdt: number;
  };
  connectWallet: (type: "native" | "hashpack" | "metamask", accountId?: string, priv?: string, pub?: string) => void;
  disconnectWallet: () => void;
  toggleAutoMine: () => void;
  incrementSihu: (amount: number) => void;
}

export const useSihuStore = create<SihuState>((set) => ({
  connected: false,
  walletType: null,
  accountId: "",
  privateKey: null,
  publicKey: null,
  autoMineActive: false,
  balances: { hbar: 0, sihu: 0, usdt: 0 },

  connectWallet: (type, customAccountId, priv, pub) =>
    set({
      connected: true,
      walletType: type,
      accountId: customAccountId
        ? customAccountId
        : type === "native" 
          ? "Unregistered Native Account"
          : type === "hashpack"
            ? "0.0.4872931"
            : "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      privateKey: priv || null,
      publicKey: pub || null,
      balances: { hbar: 245.8, sihu: 1250, usdt: 580 },
    }),

  disconnectWallet: () =>
    set({
      connected: false,
      walletType: null,
      accountId: "",
      privateKey: null,
      publicKey: null,
      autoMineActive: false,
      balances: { hbar: 0, sihu: 0, usdt: 0 },
    }),

  toggleAutoMine: () =>
    set((s) => ({ autoMineActive: !s.autoMineActive })),

  incrementSihu: (amount) =>
    set((s) => ({
      balances: { ...s.balances, sihu: s.balances.sihu + amount },
    })),
}));
