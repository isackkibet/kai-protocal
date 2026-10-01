'use client';

import { useEffect, useRef } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { usePrivyAuth } from '@/lib/auth/privy-auth';
import { buildOwnershipChallenge } from '@/lib/auth/wallet-signature';

const REGISTERED_KEY = (addr: string) => `kai:wallet-registered:${addr}`;
const DECLINED_KEY = (addr: string) => `kai:wallet-register-declined:${addr}`;

function readFlag(storage: 'local' | 'session', key: string) {
  try {
    return (storage === 'local' ? window.localStorage : window.sessionStorage).getItem(key) === '1';
  } catch {
    return false;
  }
}

function setFlag(storage: 'local' | 'session', key: string) {
  try {
    (storage === 'local' ? window.localStorage : window.sessionStorage).setItem(key, '1');
  } catch {
    /* storage blocked — worst case we ask again next visit */
  }
}

/**
 * Records people who join by connecting a browser wallet (MetaMask/Core)
 * without signing in through Privy, so they show up in the member count
 * (POST /api/wallet/register). Asks the wallet to sign a free ownership
 * message once per address; Privy-signed-in users are already recorded by
 * the onboard flow and are skipped. A declined signature isn't asked again
 * this browser session.
 */
export function WalletMemberSync() {
  const { address, isConnected, connector } = useAccount();
  const { ready, authenticated } = usePrivyAuth();
  const { signMessageAsync } = useSignMessage();
  const inFlight = useRef<string | null>(null);

  useEffect(() => {
    // Wait for Privy to finish loading: before that `authenticated` is briefly
    // false even for signed-in users, who must not get a signature prompt.
    if (!ready || !isConnected || !address || authenticated) return;
    const addr = address.toLowerCase();
    if (inFlight.current === addr) return;
    if (readFlag('local', REGISTERED_KEY(addr)) || readFlag('session', DECLINED_KEY(addr))) return;

    inFlight.current = addr;
    (async () => {
      try {
        const timestamp = Date.now();
        const signature = await signMessageAsync({ message: buildOwnershipChallenge(addr, timestamp) });
        const res = await fetch('/api/wallet/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: addr, signature, timestamp, connector: connector?.name }),
        });
        if (res.ok) setFlag('local', REGISTERED_KEY(addr));
      } catch {
        // User rejected the signature (or the wallet errored) — don't nag.
        setFlag('session', DECLINED_KEY(addr));
      } finally {
        inFlight.current = null;
      }
    })();
  }, [ready, isConnected, address, authenticated, connector, signMessageAsync]);

  return null;
}
