'use client';

import { useAccount } from 'wagmi';
import type { Address } from 'viem';
import { usePrivyAuth } from '@/lib/privy-auth';

/**
 * The single account used across the app.
 *
 * A user can arrive two ways: signing in with Google/email (a Privy embedded
 * Avalanche wallet) or by connecting a browser wallet (MetaMask/Core). Before
 * this hook, pages disagreed on which one "the account" was — the home page
 * read the wagmi wallet, so a Google user saw $0.00 while /wallet showed their
 * real embedded balance.
 *
 * Resolution order: the Privy identity wins when present (that is the account
 * created by "Continue with Google"); otherwise fall back to the connected
 * browser wallet. Every balance/profile read should use this hook.
 */
export function useActiveAccount() {
  const { address: wagmiAddress, isConnected: wagmiConnected, chainId } = useAccount();
  const { address: privyAddress, authenticated: privyAuthenticated } = usePrivyAuth();

  const address = (privyAddress ?? wagmiAddress ?? undefined) as Address | undefined;
  const isConnected = Boolean(address);
  const isPrivy = Boolean(privyAuthenticated && privyAddress);

  return {
    address,
    isConnected,
    isPrivy,
    chainId,
    privyAddress,
    wagmiAddress,
    wagmiConnected,
  };
}
