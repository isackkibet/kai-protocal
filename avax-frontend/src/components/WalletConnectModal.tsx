'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useConnect, useAccount, useDisconnect, type Connector } from 'wagmi';
import { X, LogOut, RefreshCw, Wallet, Mail, Check } from 'lucide-react';
import { usePrivyAuth } from '@/lib/privy-auth';

interface WalletConnectModalProps {
  onClose: () => void;
}

/* Same editorial palette as the home page (pine + gold + paper) — the modal
   used to be a generic green Web3-template look that didn't match anything
   else in the app, which is its own source of confusion at the exact moment
   a user needs things to feel familiar. */
const C = {
  bg:        '#0E2418',
  gold:      '#C89B3C',
  goldLight: '#E4C878',
  paper:     '#F6F2E7',
  paperDim:  '#EFE9D9',
  ink:       '#1B1A14',
  inkLight:  '#9BA396',
  hairline:  'rgba(200,155,60,0.16)',
  red:       '#E88C7D',
};
const MONO: React.CSSProperties = { fontFamily: 'var(--font-plex-mono), monospace' };

// ── Wallet display config ─────────────────────────────────────────────────────
function getWalletMeta(connector: Connector) {
  const key = `${connector.id} ${connector.name}`.toLowerCase();
  if (key.includes('metamask')) return { icon: <MetaMaskIcon />, label: 'MetaMask', description: <>Browser extension, <Hi>most popular</Hi> EVM wallet</> };
  if (key.includes('core'))     return { icon: <CoreIcon />,     label: 'Core Wallet', description: <>Built by Ava Labs, <Hi>native Avalanche</Hi> wallet</> };
  return { icon: <Wallet size={24} color={C.goldLight} strokeWidth={1.6} />, label: connector.name, description: 'EVM compatible wallet' };
}

/* One flat row shape for every sign-in option — icon, label, description,
   trailing chevron/spinner. No border, no colour-tinted box behind the
   icon; only a hairline between rows and a hover wash show it's a choice. */
function OptionRow({ icon, label, description, onClick, loading, disabled, trailing }: {
  icon: React.ReactNode; label: string; description: React.ReactNode;
  onClick?: () => void; loading?: boolean; disabled?: boolean; trailing?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="wcm-row"
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '18px 4px', textAlign: 'left', background: 'none', border: 'none',
        borderBottom: `1px solid ${C.hairline}`,
        cursor: disabled || loading ? 'default' : 'pointer',
        opacity: disabled ? 0.55 : 1, width: '100%', fontFamily: 'inherit',
      }}>
      <div style={{ width: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: C.paper, margin: '0 0 3px' }}>{label}</p>
        <p style={{ fontSize: 13, color: C.inkLight, margin: 0, lineHeight: 1.45 }}>{description}</p>
      </div>
      <div style={{ flexShrink: 0 }}>
        {loading
          ? <RefreshCw size={18} color={C.goldLight} style={{ animation: 'spin 1s linear infinite' }} />
          : trailing ?? <span style={{ color: C.inkLight, fontSize: 20 }}>›</span>}
      </div>
    </button>
  );
}

/* Bold + gold on the phrase that actually matters in each option's
   description, so the differences between five sign-in choices are
   scannable instead of five same-weight sentences. */
const Hi = ({ children }: { children: React.ReactNode }) => (
  <strong style={{ color: C.goldLight, fontWeight: 700 }}>{children}</strong>
);

function StatusBlock({ label, address, sub, onPrimary, primaryLabel, onSignOut }: {
  label: string; address: string; sub: string;
  onPrimary?: () => void; primaryLabel?: string; onSignOut: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0 4px', gap: 18 }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: 'rgba(200,155,60,0.12)', border: `2px solid ${C.gold}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Check size={28} color={C.goldLight} strokeWidth={2.4} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: C.paper, margin: '0 0 8px' }}>{label}</p>
        <p style={{ ...MONO, fontSize: 14, color: C.goldLight, margin: '0 0 8px' }}>
          {address.slice(0, 6)}…{address.slice(-4)}
        </p>
        <p style={{ fontSize: 12.5, color: C.inkLight, margin: 0 }}>{sub}</p>
      </div>
      {onPrimary && (
        <button onClick={onPrimary} style={{
          display: 'flex', alignItems: 'center', gap: 8, marginTop: 2,
          padding: '13px 28px', borderRadius: 999, border: 'none', cursor: 'pointer',
          background: C.gold, color: C.ink, fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
        }}>
          <Wallet size={15} /> {primaryLabel}
        </button>
      )}
      <button onClick={onSignOut} style={{
        display: 'flex', alignItems: 'center', gap: 6, background: 'none',
        border: 'none', cursor: 'pointer', color: C.inkLight, fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
      }}>
        <LogOut size={14} /> {onPrimary ? 'Sign out' : 'Disconnect'}
      </button>
    </div>
  );
}

export default function WalletConnectModal({ onClose }: WalletConnectModalProps) {
  const router = useRouter();
  const { connectors, connect, status, error, reset } = useConnect();
  const { address, isConnected, connector: activeConnector } = useAccount();
  const { disconnect } = useDisconnect();
  const { authenticated: privyAuthenticated, address: privyAddress, signInWithGoogle, signInWithEmail, logout: privyLogout } = usePrivyAuth();
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const prevPrivyAuth = useRef(privyAuthenticated);
  const prevConnected = useRef(isConnected);

  // Only auto-close on a fresh connect (transition false → true), same as
  // the Privy effect below. Without this guard, opening the modal while
  // already connected — e.g. to hit Disconnect — re-fires this on mount
  // since isConnected is already true, and the modal vanishes ~900ms later
  // before the user can click anything.
  useEffect(() => {
    const wasConnected = prevConnected.current;
    prevConnected.current = isConnected;
    if (!wasConnected && isConnected) {
      const t = setTimeout(onClose, 900);
      return () => clearTimeout(t);
    }
  }, [isConnected, onClose]);

  // Only auto-close the modal when a login completes *while it is open*
  // (transition false → true). A returning, already-authenticated user must
  // not be silently bounced back to the page — the modal shows their account
  // instead, so they can get to /wallet.
  useEffect(() => {
    const wasAuthenticated = prevPrivyAuth.current;
    prevPrivyAuth.current = privyAuthenticated;
    if (!wasAuthenticated && privyAuthenticated) {
      const t = setTimeout(onClose, 900);
      return () => clearTimeout(t);
    }
  }, [privyAuthenticated, onClose]);

  useEffect(() => {
    if (status !== 'pending') setConnectingId(null);
  }, [status]);

  const handleConnect = (connector: Connector) => {
    setConnectingId(connector.id);
    connect({ connector }, { onError: () => setConnectingId(null) });
  };

  const handleEmailSignIn = async () => {
    setEmailLoading(true);
    setEmailError(null);
    const result = await signInWithEmail();
    setEmailLoading(false);
    if (!result.ok && result.reason !== 'login-cancelled') {
      setEmailError(
        result.reason === 'privy-not-configured'
          ? 'Email sign-in is not configured yet.'
          : String(result.reason ?? 'Email sign-in failed. Please try again.'),
      );
    } else if (result.ok) {
      router.push('/wallet');
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setGoogleError(null);
    const result = await signInWithGoogle();
    setGoogleLoading(false);
    if (!result.ok && result.reason !== 'login-cancelled') {
      setGoogleError(
        result.reason === 'privy-not-configured'
          ? 'Google sign-in is not configured yet.'
          : String(result.reason ?? 'Google sign-in failed. Please try again.'),
      );
    } else if (result.ok) {
      router.push('/wallet');
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, background: 'rgba(7,15,11,0.75)', backdropFilter: 'blur(10px)',
      }}
      onClick={onClose}
    >
      <style>{`.wcm-row:hover:not(:disabled) { background: rgba(200,155,60,0.06); }
        .wcm-row:hover:not(:disabled) p:first-child { color: ${C.goldLight}; }`}</style>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 460, borderRadius: 22, padding: '34px 30px 28px',
          background: C.bg, border: `1px solid ${C.hairline}`,
          boxShadow: '0 24px 80px rgba(0,0,0,0.55)', position: 'relative',
          fontFamily: "'Poppins', 'IBM Plex Sans', var(--font-sans)",
        }}
      >
        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 18, right: 18,
          background: 'none', border: 'none',
          borderRadius: '50%', width: 34, height: 34, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: C.inkLight,
        }}>
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ ...MONO, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: C.goldLight, fontWeight: 600, margin: '0 0 10px' }}>
            KAI Nuvari · Avalanche C-Chain
          </p>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: C.paper, margin: 0, letterSpacing: '-0.3px' }}>
            Connect a wallet
          </h2>
        </div>

        {isConnected ? (
          <StatusBlock
            label="Connected"
            address={address ?? ''}
            sub={`via ${activeConnector?.name ?? 'wallet'}`}
            onSignOut={() => disconnect()}
          />
        ) : privyAuthenticated && privyAddress ? (
          <StatusBlock
            label="Signed in via Kainovari"
            address={privyAddress}
            sub="Embedded Avalanche wallet"
            onPrimary={() => { router.push('/wallet'); onClose(); }}
            primaryLabel="View wallet"
            onSignOut={privyLogout}
          />
        ) : (
          /* ── Sign-in options — one flat list, easiest first ── */
          <div>
            <OptionRow icon={<Mail size={23} color={C.goldLight} strokeWidth={1.7} />}
              label="Continue with email" description={<>We&apos;ll send a <Hi>one-time code</Hi>, no password</>}
              onClick={handleEmailSignIn} loading={emailLoading} />
            {emailError && <p style={{ fontSize: 12, color: C.red, margin: '8px 0 0' }}>{emailError}</p>}

            <OptionRow icon={<GoogleIcon />}
              label="Continue with Google" description={<><Hi>Instant</Hi> embedded wallet, no seed phrase</>}
              onClick={handleGoogleSignIn} loading={googleLoading} />
            {googleError && <p style={{ fontSize: 12, color: C.red, margin: '8px 0 0' }}>{googleError}</p>}

            {connectors.map(connector => {
              const meta = getWalletMeta(connector);
              const connecting = status === 'pending' && connectingId === connector.id;
              return (
                <OptionRow key={connector.id} icon={meta.icon} label={meta.label} description={meta.description}
                  onClick={() => handleConnect(connector)}
                  loading={connecting}
                  disabled={status === 'pending' && !connecting} />
              );
            })}

            <OptionRow icon={<KaiIcon />} label="KAI Wallet" description="Native KAI identity, DID, x402 payments"
              disabled
              trailing={<span style={{ ...MONO, fontSize: 9, fontWeight: 700, color: C.goldLight, letterSpacing: 0.8 }}>SOON</span>} />

            {error && (
              <div style={{ marginTop: 14, paddingLeft: 14, borderLeft: `2px solid ${C.red}` }}>
                <p style={{ fontWeight: 700, fontSize: 12, color: C.red, margin: '0 0 4px' }}>Connection error</p>
                <p style={{ fontSize: 12, color: C.inkLight, margin: '0 0 6px' }}>{error.message}</p>
                <button onClick={reset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.goldLight, fontSize: 11, fontWeight: 700, fontFamily: 'inherit', padding: 0 }}>
                  Reset and retry →
                </button>
              </div>
            )}

            <p style={{ fontSize: 10.5, textAlign: 'center', color: C.inkLight, lineHeight: 1.5, marginTop: 18 }}>
              Set your wallet network to <strong style={{ color: C.paperDim }}>Avalanche C-Chain</strong> or <strong style={{ color: C.paperDim }}>Fuji Testnet</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── SVG Icon components ───────────────────────────────────────────────────── */

function GoogleIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.7 6.1 29.6 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.7 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2.2 13.4-5.7l-6.2-5.2C29.2 34.5 26.7 36 24 36c-5.2 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/>
    </svg>
  );
}

function MetaMaskIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 318 318" fill="none">
      <path d="M274.1 35.5l-99.7 73.9 18.4-43.6 81.3-30.3z" fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M44.4 35.5l98.9 74.5-17.6-44.2L44.4 35.5z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M238.3 206.8l-26.5 40.6 56.7 15.6 16.3-55.3-46.5-.9z" fill="#E4761B" stroke="#E4761B"/>
      <path d="M33.9 207.7l16.2 55.3 56.7-15.6-26.5-40.6-46.4.9z" fill="#E4761B" stroke="#E4761B"/>
      <path d="M103.6 138.2l-15.8 23.9 56.3 2.5-2-60.5-38.5 34.1z" fill="#E4761B" stroke="#E4761B"/>
      <path d="M214.9 138.2l-39-34.7-1.3 61.1 56.2-2.5-15.9-23.9z" fill="#E4761B" stroke="#E4761B"/>
      <path d="M100.3 247.4l33.8-16.5-29.2-22.8-4.6 39.3z" fill="#E4761B" stroke="#E4761B"/>
      <path d="M184.4 230.9l33.9 16.5-4.7-39.3-29.2 22.8z" fill="#E4761B" stroke="#E4761B"/>
    </svg>
  );
}

function CoreIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="18" fill="#1A1A2E" stroke="#3B99FC" strokeWidth="1.5"/>
      <path d="M20 8 L30 14 L30 26 L20 32 L10 26 L10 14 Z" stroke="#3B99FC" strokeWidth="1.8" fill="none"/>
      <path d="M20 13 L26 16.5 L26 23.5 L20 27 L14 23.5 L14 16.5 Z" fill="#3B99FC" opacity="0.6"/>
      <circle cx="20" cy="20" r="3" fill="#3B99FC"/>
    </svg>
  );
}

function KaiIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
      <path d="M20 4 L36 12 L36 28 L20 36 L4 28 L4 12 Z" fill="none" stroke="#C89B3C" strokeWidth="1.5"/>
      <path d="M14 14 L20 20 L14 26" stroke="#E4C878" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22 14 L26 20 L22 26" stroke="#C89B3C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
