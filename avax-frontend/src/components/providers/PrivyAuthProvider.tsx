'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PrivyProvider, usePrivy, useWallets } from '@privy-io/react-auth';
import { avalancheFuji } from 'wagmi/chains';
import { createWalletClient, custom, type Address } from 'viem';
import {
  PrivyAuthContext,
  type PrivyAuthValue,
  type PrivyAuthSyncResult,
} from '@/lib/privy-auth';
import { ERC20_ABI } from '@/lib/erc20abi';
import { AIRDROP_ABI } from '@/lib/airdropAbi';

const POST_LOGIN_REDIRECT_KEY = 'privy:post-login-redirect';

/**
 * PrivyAuthProvider — Google login → embedded Avalanche C-Chain wallet (PRD 1).
 *
 * Every user who signs in with Google is given a non-custodial embedded EVM
 * wallet on Avalanche Fuji. Kainovari never sees or stores any private key —
 * Privy owns key management end to end.
 *
 * The appId is client-safe (NEXT_PUBLIC_ prefix), so it is fine in the
 * browser. `createOnLogin: 'all-users'` guarantees a wallet is created for
 * every new Google login (no extra setup step for the user).
 *
 * This component also renders the inner `PrivyAuthContextProvider` that
 * exposes `usePrivyAuth()` to the rest of the app — bridging the raw Privy
 * SDK hooks (`usePrivy`, `useWallets`) into the typed context consumed by the
 * wallet and Kai Bar dashboards.
 */
export function PrivyAuthProvider({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    // No Privy app configured — render children unchanged (e.g. dev with
    // MetaMask/Core fallback) rather than crashing the whole app.
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        // Only one of loginMethods / loginMethodsAndOrder may be set — Privy
        // warns and its behavior is undefined otherwise (was silently
        // breaking the Google login popup). loginMethodsAndOrder is the one
        // that also lets us control button order, so it wins.
        loginMethodsAndOrder: { primary: ['email', 'google'] },
        appearance: {
          theme: 'dark',
          accentColor: '#10b981',
        },
        embeddedWallets: {
          ethereum: { createOnLogin: 'all-users' },
        },
        defaultChain: avalancheFuji,
        supportedChains: [avalancheFuji],
      }}
    >
      <PrivyAuthContextProvider>{children}</PrivyAuthContextProvider>
    </PrivyProvider>
  );
}

/**
 * Bridges the raw Privy SDK into the rest of the app via PrivyAuthContext.
 * This is what actually makes `usePrivyAuth()` return live values instead of
 * the safe no-op stub defined in lib/privy-auth.ts.
 */
function PrivyAuthContextProvider({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, user, login, logout, createWallet, getAccessToken } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();

  const [syncState, setSyncState] = useState<PrivyAuthValue['syncState']>('idle');
  const [error, setError] = useState<string | null>(null);
  const haveSynced = useRef(false);
  const syncAttempts = useRef(0);

  // The embedded Avalanche wallet (first ethereum wallet on Fuji from Privy).
  const wallet = useMemo(
    () =>
      (wallets || []).find((w) => w.type === 'ethereum' && w.chainId?.includes('43113')) ??
      (wallets || [])[0] ??
      null,
    [wallets],
  );

  const address = useMemo<Address | null>(
    () => (wallet?.address ? (wallet.address as Address) : null),
    [wallet],
  );

  // Privy user identity → app fields.
  const privyUserId = (user?.id as string | undefined) ?? null;
  const email = user?.email?.address ?? null;
  const name = user?.google?.name ?? user?.email?.address ?? null;
  const authProvider = user?.google ? 'GOOGLE' : 'EMAIL';

  // Always-current snapshot of identity/wallet state, read from a ref rather
  // than closed-over variables. Without this, signInWithGoogle/signInWithEmail
  // call syncToBackend() through a closure captured *before* login started —
  // address is still null in that closure no matter how long you wait, so the
  // sync call always failed with "missing-identity" even when login itself
  // succeeded and the wallet was created moments later.
  const stateRef = useRef({ privyUserId, email, name, authProvider, address: null as Address | null });
  useEffect(() => {
    stateRef.current = { privyUserId, email, name, authProvider, address };
  }, [privyUserId, email, name, authProvider, address]);

  const builtLogin = useCallback(() => login({ loginMethods: ['google'] }), [login]);
  const builtEmailLogin = useCallback(() => login({ loginMethods: ['email'] }), [login]);

  // Log the page the user was on before starting login, so that if Privy uses
  // its redirect-based OAuth flow (browser popup blocked, embedded/mobile
  // webview) the Google callback — which lands on the app root, the registered
  // redirect URI — can send the user back where they came from.
  const rememberPostLoginPath = () => {
    if (typeof window === 'undefined') return;
    const current = window.location.pathname + window.location.search + window.location.hash;
    if (current && current !== '/') window.sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, current);
  };

  // If a redirect-flow login dropped us on the app root instead of the page the
  // user started from, send them on to their intended destination. Popup flow
  // leaves the URL untouched (saved path === current path), so this is a no-op.
  // The key is always cleared on read, so this never fires twice.
  useEffect(() => {
    if (!ready || !authenticated || typeof window === 'undefined') return;
    const target = window.sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY);
    if (!target) return;
    window.sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
    const current = window.location.pathname + window.location.search + window.location.hash;
    if (current === '/' && target !== current && target.startsWith('/')) {
      window.location.replace(target);
    }
  }, [ready, authenticated]);

  /**
   * Sends an ERC-20 transfer through the Privy embedded wallet. All signing
   * goes through Privy — the app never touches a private key (PRD 1 §6, §9).
   */
  const sendToken = useCallback(
    async ({ tokenAddress, to, amount }: { tokenAddress: Address; to: Address; amount: bigint }) => {
      if (!wallet || !address) throw new Error('Wallet not connected');
      const from = address as Address;
      const provider = await wallet.getEthereumProvider();
      const client = createWalletClient({
        chain: avalancheFuji,
        transport: custom(provider),
        account: from,
      });
      const hash = await client.writeContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [to, amount],
        account: from,
      });
      return hash;
    },
    [wallet, address],
  );

  /**
   * Submits an airdrop claim through the Privy embedded wallet (PRD 2 §11).
   * The user proves their allocation with a Merkle proof; signing goes through
   * Privy — the app never touches a private key.
   */
  const claimAirdrop = useCallback(
    async ({ vault, amount, proof }: { vault: Address; amount: bigint; proof: `0x${string}`[] }) => {
      if (!wallet || !address) throw new Error('Wallet not connected');
      const from = address as Address;
      const provider = await wallet.getEthereumProvider();
      const client = createWalletClient({
        chain: avalancheFuji,
        transport: custom(provider),
        account: from,
      });
      const hash = await client.writeContract({
        address: vault,
        abi: AIRDROP_ABI,
        functionName: 'claim',
        args: [amount, proof],
        account: from,
      });
      return hash;
    },
    [wallet, address],
  );

  /**
   * Creates/links the Kainovari KaiUser (and attaches the KaiWallet once one
   * exists) and credits the welcome bonus (handoff between PRD 1 and PRD 2).
   * Idempotent. Deliberately does NOT require a wallet address — a person who
   * has verified their email must be saved immediately (PRD: "wallet-
   * optional"); the wallet attaches on a later call once it's ready.
   */
  const syncToBackend = useCallback(async (): Promise<PrivyAuthSyncResult> => {
    const s = stateRef.current;
    if (!s.privyUserId || !s.email) {
      return { ok: false, reason: 'missing-identity', isNew: false };
    }
    setSyncState('linking');
    try {
      const token = await getAccessToken();
      if (!token) {
        setSyncState('error');
        setError('Could not verify your session. Please try again.');
        return { ok: false, reason: 'no-access-token', isNew: false };
      }
      const res = await fetch('/api/kai-bar/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          privyUserId: s.privyUserId, email: s.email, name: s.name,
          authProvider: s.authProvider, address: s.address ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSyncState('error');
        setError(data.error ?? 'Failed to link your account.');
        return { ok: false, reason: data.error, isNew: false };
      }
      setSyncState('linked');
      setError(null);
      return { ok: true, isNew: data.isNew, kaiBar: data.kaiBar, userId: data.userId };
    } catch (e: unknown) {
      console.error('[privy-auth] syncToBackend failed', e);
      setSyncState('error');
      setError('Could not reach our servers. Please try again.');
      return { ok: false, reason: 'network', isNew: false };
    }
  }, [getAccessToken]);

  /**
   * One-shot "Continue with Google": logs in, then links the account to the
   * backend. Used by the hand-rolled sign-in buttons on the wallet / Kai Bar
   * pages.
   */
  const signInWithGoogle = useCallback(async (): Promise<PrivyAuthSyncResult> => {
    if (authenticated) return { ok: true, reason: 'already-authenticated', isNew: false };
    try {
      rememberPostLoginPath();
      await builtLogin();
      // Identity (email + privyUserId) is saved immediately — it must not
      // wait on the embedded wallet, which can lag or fail independently
      // (the wallet-attach effect below picks it up once it's ready). Retry
      // once for the brief state-update race right after login() resolves.
      let result = await syncToBackend();
      if (!result.ok && result.reason === 'missing-identity') {
        await new Promise((r) => setTimeout(r, 400));
        result = await syncToBackend();
      }
      return result;
    } catch (e: unknown) {
      const rawMsg = typeof e === 'object' && e !== null && 'message' in e
        ? String((e as { message: unknown }).message)
        : '';
      const msg = rawMsg.toLowerCase();
      if (msg.includes('cancelled') || msg.includes('rejected') || msg.includes('closed')) {
        return { ok: false, reason: 'login-cancelled', isNew: false };
      }
      setError(rawMsg || 'Google sign-in failed. Please try again.');
      return { ok: false, reason: rawMsg || 'login-failed', isNew: false };
    }
  }, [authenticated, builtLogin, syncToBackend]);

  /**
   * "Continue with Email": opens Privy's email OTP flow, then links the
   * account to the backend exactly like Google (KAI Nuvari PRD §1 — this is
   * the primary signup path; Google remains a secondary option).
   */
  const signInWithEmail = useCallback(async (): Promise<PrivyAuthSyncResult> => {
    if (authenticated) return { ok: true, reason: 'already-authenticated', isNew: false };
    try {
      rememberPostLoginPath();
      await builtEmailLogin();
      let result = await syncToBackend();
      if (!result.ok && result.reason === 'missing-identity') {
        await new Promise((r) => setTimeout(r, 400));
        result = await syncToBackend();
      }
      return result;
    } catch (e: unknown) {
      const rawMsg = typeof e === 'object' && e !== null && 'message' in e
        ? String((e as { message: unknown }).message)
        : '';
      const msg = rawMsg.toLowerCase();
      if (msg.includes('cancelled') || msg.includes('rejected') || msg.includes('closed')) {
        return { ok: false, reason: 'login-cancelled', isNew: false };
      }
      setError(rawMsg || 'Email sign-in failed. Please try again.');
      return { ok: false, reason: rawMsg || 'login-failed', isNew: false };
    }
  }, [authenticated, builtEmailLogin, syncToBackend]);

  const loginFn = login;

  // Auto-sync identity as soon as the user is authenticated with an email —
  // deliberately NOT gated on a wallet being ready, so a returning user (or
  // one whose embedded wallet is slow/fails to provision) is still saved.
  // Only locks out further attempts on success — a transient failure
  // (network blip, cold-start race) gets a couple of retries instead of
  // being stuck until the user logs out and back in.
  useEffect(() => {
    if (!ready || !authenticated || !email || haveSynced.current) return;
    if (syncAttempts.current >= 3) return;
    syncAttempts.current += 1;
    syncToBackend().then((result) => {
      if (result.ok) haveSynced.current = true;
    });
  }, [ready, authenticated, email, syncToBackend, syncState]);

  // Separate pass: once a wallet address becomes available — possibly well
  // after identity was already synced above — attach it to the account.
  // syncToBackend is idempotent (finds the existing user, only creates/
  // updates the wallet row), so calling it again here is safe.
  const haveSyncedWallet = useRef(false);
  useEffect(() => {
    if (!ready || !authenticated || !address || haveSyncedWallet.current) return;
    haveSyncedWallet.current = true;
    syncToBackend();
  }, [ready, authenticated, address, syncToBackend]);

  const value = useMemo<PrivyAuthValue>(
    () => ({
      ready: ready && walletsReady,
      readyToUse: ready && walletsReady,
      authenticated,
      isLoggedIn: authenticated,
      user: user ? { id: user.id as string } : null,
      privyUserId,
      email,
      name,
      address,
      wallet,
      client: null,
      signInWithGoogle,
      signInWithEmail,
      login: loginFn,
      logout: async () => {
        haveSynced.current = false;
        haveSyncedWallet.current = false;
        await logout();
      },
      createWallet: async () => {
        try {
          await createWallet();
        } catch {
          /* surface via error state if needed */
        }
      },
      connectWallet: async () => loginFn(),
      getTokenBalance: async () => 0n,
      sendToken,
      claimAirdrop,
      syncToBackend,
      getAccessToken,
      syncState,
      error,
    }),
    [
      ready, walletsReady, authenticated, user, privyUserId, email, name, address,
      wallet, signInWithGoogle, signInWithEmail, loginFn, logout, createWallet, sendToken,
      claimAirdrop, syncToBackend, getAccessToken, syncState, error,
    ],
  );

  return <PrivyAuthContext.Provider value={value}>{children}</PrivyAuthContext.Provider>;
}
