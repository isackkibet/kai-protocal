'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { useState } from 'react';
import { config } from '@/lib/blockchain/wagmi';
import { PrivyAuthProvider } from '@/components/providers/PrivyAuthProvider';
import { WalletMemberSync } from '@/components/providers/WalletMemberSync';

/**
 * ClientProviders: wraps the whole app in WagmiProvider (Avalanche C-Chain),
 * TanStack QueryClient, and PrivyAuthProvider (Google login → embedded
 * Avalanche wallet, PRD 1).
 */
export function ClientProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 30_000,
      },
    },
  }));

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <PrivyAuthProvider>
          <WalletMemberSync />
          {children}
        </PrivyAuthProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
