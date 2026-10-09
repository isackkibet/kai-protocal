'use client';

/**
 * Guardian sign-in through the KAI Nuvari Privy app (shared accounts with the
 * main KAI site). Loaded only on the Guardian Hub page so public pages stay
 * light.
 *
 * Flow: Privy signs the person in (Google or email code) -> we send Privy's
 * access token to /api/guardian/auth/privy -> the server verifies it with
 * Privy and starts a Guardian session. Roles still come from the Guardian
 * database, never from the sign-in itself.
 *
 * Lessons carried over from the main KAI site:
 *  - Google uses Privy's full-page redirect (initOAuth), not a popup: popups
 *    fail in in-app browsers (WhatsApp, Instagram) and with popup blockers.
 *  - Only loginMethodsAndOrder is set (setting loginMethods as well breaks
 *    the Google flow).
 *  - Embedded wallets are off: Guardian does not use them.
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { PrivyProvider, useIdentityToken, useLoginWithOAuth, usePrivy } from '@privy-io/react-auth';

export interface GuardianAuth {
  /** Privy is configured on this deployment. */
  available: boolean;
  ready: boolean;
  /** Exchanging a Privy sign-in for a Guardian session. */
  linking: boolean;
  error: string;
  signInWithGoogle: () => void;
  signInWithEmail: () => void;
  /** Ends the Privy session too, so the user is not signed straight back in. */
  signOutOfPrivy: () => Promise<void>;
}

const unavailable: GuardianAuth = {
  available: false, ready: true, linking: false, error: '',
  signInWithGoogle: () => {}, signInWithEmail: () => {}, signOutOfPrivy: async () => {},
};

const GuardianAuthContext = createContext<GuardianAuth>(unavailable);
export const useGuardianAuth = () => useContext(GuardianAuthContext);

export function GuardianAuthProvider({ needsSession, onSessionCreated, children }: {
  /** True while there is no Guardian session; a Privy sign-in is then exchanged for one. */
  needsSession: boolean;
  onSessionCreated: () => void;
  children: ReactNode;
}) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  if (!appId) return <GuardianAuthContext.Provider value={unavailable}>{children}</GuardianAuthContext.Provider>;
  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethodsAndOrder: { primary: ['google', 'email'] },
        appearance: { theme: 'dark', accentColor: '#10b981' },
        embeddedWallets: { ethereum: { createOnLogin: 'off' } },
      }}
    >
      <Bridge needsSession={needsSession} onSessionCreated={onSessionCreated}>{children}</Bridge>
    </PrivyProvider>
  );
}

function Bridge({ needsSession, onSessionCreated, children }: { needsSession: boolean; onSessionCreated: () => void; children: ReactNode }) {
  const { ready, authenticated, login, logout } = usePrivy();
  const { identityToken } = useIdentityToken();
  const { initOAuth } = useLoginWithOAuth({ onError: (err) => setError(`Google sign-in failed: ${String(err)}`) });
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState('');
  const attempted = useRef(false);

  // Signed in with Privy but no Guardian session yet: exchange it once.
  useEffect(() => {
    if (!needsSession) { attempted.current = false; return; }
    if (!ready || !authenticated || !identityToken || attempted.current) return;
    attempted.current = true;
    setLinking(true);
    setError('');
    void (async () => {
      try {
        const res = await fetch('/api/guardian/auth/privy', { method: 'POST', headers: { Authorization: `Bearer ${identityToken}` } });
        const json = await res.json().catch(() => ({}));
        if (res.ok) onSessionCreated();
        else setError(json.error ?? 'Sign-in failed. Please try again.');
      } catch {
        setError('Could not reach the server. Please try again.');
      } finally {
        setLinking(false);
      }
    })();
  }, [needsSession, ready, authenticated, identityToken, onSessionCreated]);

  const signOutOfPrivy = useCallback(async () => {
    attempted.current = false;
    if (authenticated) await logout();
  }, [authenticated, logout]);

  const value: GuardianAuth = {
    available: true,
    ready,
    linking,
    error,
    signInWithGoogle: () => { setError(''); attempted.current = false; void initOAuth({ provider: 'google' }); },
    signInWithEmail: () => { setError(''); attempted.current = false; login({ loginMethods: ['email'] }); },
    signOutOfPrivy,
  };
  return <GuardianAuthContext.Provider value={value}>{children}</GuardianAuthContext.Provider>;
}
