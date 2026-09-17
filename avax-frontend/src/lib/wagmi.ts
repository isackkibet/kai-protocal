import { http, createConfig } from 'wagmi';
import { avalancheFuji, avalanche } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

const fujiRpc = process.env.NEXT_PUBLIC_AVAX_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc';

// A wallet connector built from NEXT_PUBLIC_KAI_PRIVATE_KEY used to live here.
// Any NEXT_PUBLIC_ variable is inlined into the client bundle in plaintext —
// that shipped a real signing key to every visitor's browser. Removed
// entirely; embedded wallets are Privy's job (see PrivyAuthProvider), never
// a raw key in client code.

export const config = createConfig({
  chains: [avalancheFuji, avalanche],
  connectors: [
    injected({
      target: 'metaMask',
    }),
    injected({
      target: {
        id: 'core',
        name: 'Core Wallet',
        provider(window) {
          const win = window as Window & {
            avalanche?: { request?: unknown; isCore?: boolean };
            avax?: { request?: unknown; isCore?: boolean };
            ethereum?: { request?: unknown; isCore?: boolean };
          };
          const provider = win.avalanche?.request
            ? win.avalanche
            : win.avax?.request
              ? win.avax
              : win.ethereum?.isCore
                ? win.ethereum
                : undefined;
          return provider as never;
        },
      },
    }),
  ],
  ssr: true,
  transports: {
    [avalancheFuji.id]: http(fujiRpc),
    [avalanche.id]: http(),
  },
});
