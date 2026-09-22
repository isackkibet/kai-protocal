'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ListChecks, Mail, Wallet, Trophy, Gift, Loader2, CheckCircle2, Clock, ChevronRight, ArrowLeft, ShieldCheck, UserCheck } from 'lucide-react';
import { usePrivyAuth } from '@/lib/privy-auth';
import { useKaiBar } from '@/hooks/useKaiBar';

/* Same editorial system as the home page, wallet modal and wallet
   dashboard — pine + gold + paper, flat rows separated by a hairline,
   no card shells. */
const C = {
  bg:        '#0B1C14',
  gold:      '#C89B3C',
  goldLight: '#E4C878',
  paper:     '#F6F2E7',
  paperDim:  '#EFE9D9',
  inkLight:  '#9BA396',
  hairline:  'rgba(200,155,60,0.14)',
  red:       '#E88C7D',
};
const MONO: React.CSSProperties = { fontFamily: 'var(--font-plex-mono), monospace' };
const SERIF: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const label: React.CSSProperties = { ...MONO, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: C.goldLight, fontWeight: 600, margin: 0 };
const W: React.CSSProperties = { width: '100%', maxWidth: 640, margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' };

function Row({ icon, label: rowLabel, value, valueColor, mono }: { icon: React.ReactNode; label: string; value: string; valueColor?: string; mono?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0',
      borderBottom: `1px solid ${C.hairline}`,
    }}>
      <div style={{ width: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      <p style={{ fontSize: 12.5, color: C.inkLight, margin: 0, flexShrink: 0, width: 128 }}>{rowLabel}</p>
      <p style={{
        fontSize: mono ? 13 : 14, fontWeight: 700, margin: 0, color: valueColor ?? C.paper,
        fontFamily: mono ? 'var(--font-plex-mono), monospace' : 'inherit',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
      }}>
        {value}
      </p>
    </div>
  );
}

function QuickLink({ icon, title, sub, href }: { icon: React.ReactNode; title: string; sub?: string; href: string }) {
  return (
    <Link href={href} className="waitlist-link" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0' }}>
      {icon}
      <div style={{ flex: 1 }}>
        <p className="waitlist-link-title" style={{ fontSize: 14, fontWeight: 700, margin: 0, color: C.paper, transition: 'color 0.15s ease' }}>{title}</p>
        {sub && <p style={{ fontSize: 11.5, color: C.inkLight, margin: '2px 0 0' }}>{sub}</p>}
      </div>
      <ChevronRight size={15} color={C.inkLight} />
    </Link>
  );
}

export default function WaitlistPage() {
  const { authenticated, ready, email, address, getAccessToken, signInWithGoogle, signInWithEmail } = usePrivyAuth();
  const { kaiBar, airdrop, loading } = useKaiBar();
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [wl, setWl] = useState<{ whitelisted: boolean; joinedBy: string | null; joinedAt: string | null } | null>(null);
  const [claimingWl, setClaimingWl] = useState(false);
  const [wlMsg, setWlMsg] = useState<string>('');

  useEffect(() => {
    if (!authenticated) return;
    (async () => {
      try {
        const token = await getAccessToken();
        const r = await fetch('/api/whitelist', { headers: token ? { authorization: `Bearer ${token}` } : {} });
        const d = await r.json();
        setWl(d);
      } catch { /* leave wl null */ }
    })();
  }, [authenticated, getAccessToken]);

  const claimWhitelist = async () => {
    setClaimingWl(true);
    setWlMsg('');
    try {
      const token = await getAccessToken();
      const r = await fetch('/api/whitelist', { method: 'POST', headers: token ? { authorization: `Bearer ${token}` } : {} });
      const d = await r.json();
      if (r.ok) setWl(d);
      else setWlMsg(String(d.error ?? 'Could not join — try again'));
    } catch {
      setWlMsg('Network error — try again');
    }
    setClaimingWl(false);
  };

  // `ready` (Privy SDK + embedded wallet init) has no hard timeout of its own —
  // without this, a slow/stuck Privy init spins this page forever instead of
  // falling through to the sign-in screen.
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 1800);
    return () => clearTimeout(t);
  }, []);

  if (!ready && !timedOut) {
    return <main style={{ minHeight: '100dvh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin" size={24} color={C.goldLight} /></main>;
  }

  if (!authenticated) {
    return (
      <main style={{ minHeight: '100dvh', background: C.bg, color: C.paper, fontFamily: "'Poppins', 'IBM Plex Sans', var(--font-sans)", position: 'relative' }}>
        <div style={{ ...W, paddingTop: 96, textAlign: 'center', maxWidth: 440 }}>
          <p style={label}>KAI Nuvari · Avalanche C-Chain</p>
          <h1 style={{ ...SERIF, fontSize: 30, fontWeight: 700, margin: '14px 0 0', letterSpacing: '-0.5px' }}>
            <span style={{ color: C.goldLight }}>KAI Nuvari</span> Waitlist
          </h1>
          <p style={{ fontSize: 14, color: C.inkLight, margin: '12px 0 28px', lineHeight: 1.6 }}>
            Sign in to get your Avalanche wallet and join the waitlist instantly.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 280, margin: '0 auto' }}>
            <button disabled={emailLoading}
              onClick={async () => {
                setSignInError(null);
                setEmailLoading(true);
                const res = await signInWithEmail();
                setEmailLoading(false);
                if (!res.ok && res.reason !== 'login-cancelled') {
                  setSignInError(res.reason === 'privy-not-configured' ? 'Email sign-in is not configured yet.' : String(res.reason ?? 'Email sign-in failed. Please try again.'));
                }
              }}
              style={{
                padding: '14px 26px', borderRadius: 999, border: 'none', cursor: 'pointer',
                background: C.gold, color: '#1B1A14', fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
              {emailLoading ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />} Continue with Email
            </button>
            <button disabled={googleLoading}
              onClick={async () => {
                setSignInError(null);
                setGoogleLoading(true);
                const res = await signInWithGoogle();
                setGoogleLoading(false);
                if (!res.ok && res.reason !== 'login-cancelled') {
                  setSignInError(res.reason === 'privy-not-configured' ? 'Google sign-in is not configured yet.' : String(res.reason ?? 'Google sign-in failed. Please try again.'));
                }
              }}
              style={{
                padding: '14px 26px', borderRadius: 999, border: `1px solid ${C.hairline}`, cursor: 'pointer',
                background: 'none', color: C.paperDim, fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
              }}>
              Continue with Google
            </button>
            {signInError && (
              <p style={{ fontSize: 11, color: C.red, margin: '4px 0 0' }}>{signInError}</p>
            )}
          </div>
        </div>
      </main>
    );
  }

  const walletStatus = address ? 'active' : 'provisioning';

  return (
    <main style={{ minHeight: '100dvh', background: C.bg, color: C.paper, fontFamily: "'Poppins', 'IBM Plex Sans', var(--font-sans)", paddingBottom: 80 }}>
      <style>{`.waitlist-link:hover .waitlist-link-title { color: ${C.goldLight}; }`}</style>
      <div style={{ ...W, paddingTop: 40 }}>
        <p style={label}>KAI Nuvari</p>
        <h1 style={{ ...SERIF, fontSize: 26, fontWeight: 700, margin: '10px 0 0', letterSpacing: '-0.4px' }}>
          You&apos;re on the <span style={{ color: C.goldLight }}>Waitlist</span>
        </h1>

        <section style={{ marginTop: 32 }}>
          <Row icon={<Mail size={16} color={C.goldLight} />} label="Account" value={email ?? '—'} />
          <Row
            icon={<Wallet size={16} color={C.goldLight} />}
            label="Avalanche Wallet"
            value={address ? `${address.slice(0, 6)}…${address.slice(-4)}` : 'Provisioning…'}
            mono
          />
          <Row
            icon={walletStatus === 'active' ? <CheckCircle2 size={16} color={C.goldLight} /> : <Clock size={16} color={C.gold} />}
            label="Wallet Status"
            value={walletStatus === 'active' ? 'Active on Avalanche' : 'Provisioning'}
            valueColor={walletStatus === 'active' ? C.goldLight : C.gold}
          />
          <Row
            icon={<Trophy size={16} color={C.gold} />}
            label="Current Points"
            value={loading ? '…' : kaiBar.toLocaleString()}
            valueColor={C.gold}
          />
          <Row
            icon={<Gift size={16} color={airdrop?.eligible ? C.goldLight : C.inkLight} />}
            label="Airdrop Status"
            value={airdrop?.eligible ? 'Eligible' : 'In Progress'}
            valueColor={airdrop?.eligible ? C.goldLight : undefined}
          />
          <Row
            icon={<ShieldCheck size={16} color={wl?.whitelisted ? C.goldLight : C.inkLight} />}
            label="Whitelist Status"
            value={wl === null ? '…' : wl?.whitelisted ? (wl?.joinedBy === 'SELF' ? 'Claimed by you' : 'Approved') : 'Not whitelisted'}
            valueColor={wl?.whitelisted ? C.goldLight : undefined}
          />
        </section>

        {wl && !wl?.whitelisted && (
          <section style={{ marginTop: 24, padding: 16, border: `1px solid ${C.hairline}`, borderRadius: 12 }}>
            <p style={{ fontSize: 13, color: C.paper, margin: '0 0 10px', fontWeight: 600 }}>
              Whitelist yourself for early rewards
            </p>
            <button
              onClick={claimWhitelist}
              disabled={claimingWl}
              style={{
                padding: '12px 22px', borderRadius: 999, border: 'none', cursor: claimingWl ? 'default' : 'pointer',
                background: C.gold, color: '#1B1A14', fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%',
                opacity: claimingWl ? 0.7 : 1,
              }}
            >
              {claimingWl ? <Loader2 size={15} className="animate-spin" /> : <UserCheck size={15} />} Claim my whitelist spot
            </button>
            {wlMsg && <p style={{ fontSize: 11.5, color: C.red, margin: '10px 0 0' }}>{wlMsg}</p>}
          </section>
        )}

        <section style={{ marginTop: 36, paddingTop: 28, borderTop: `1px solid ${C.hairline}` }}>
          <QuickLink href="/kai-bar" icon={<Trophy size={18} color={C.goldLight} strokeWidth={1.7} />}
            title="Earn more points" sub="Daily sign-in, referrals & tasks" />
          <QuickLink href="/wallet" icon={<ArrowLeft size={18} color={C.inkLight} strokeWidth={1.7} />}
            title="Back to Wallet" />
        </section>
      </div>
    </main>
  );
}
