'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Flame, Users, CheckCircle2, Gift, Copy, ChevronRight,
  Lock, Trophy, Bird, ArrowLeft, Share2, Loader2,
} from 'lucide-react';
import { usePrivyAuth } from '@/lib/privy-auth';
import { useKaiBar } from '@/hooks/useKaiBar';
import { AirdropClaimCard } from '@/components/AirdropClaimCard';
import DailyCheckInCard from '@/components/DailyCheckInCard';

/* Same editorial system as the home page, wallet modal and wallet
   dashboard — pine + gold + paper, flat sections separated by a
   hairline, no card shells. */
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
const W: React.CSSProperties = { width: '100%', maxWidth: 1200, margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' };

const TASK_ICON: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  SIGNUP: Gift,
  EMAIL_VERIFY: CheckCircle2,
  COMPLETE_PROFILE: Users,
  INVITE_FRIEND: Share2,
  FIRST_TRANSACTION: Flame,
  DAILY_CHECKIN: Trophy,
  CAMPAIGN: Bird,
};

const NEXT_MILESTONE = 15000;

export default function KaiBarDashboard() {
  const { authenticated, ready, address, signInWithGoogle, signInWithEmail, getAccessToken } = usePrivyAuth();
  const kb = useKaiBar();

  // DAILY_CHECKIN has its own dedicated card + /api/kai-bar/checkin route
  // (repeatable per day) — keep it out of the generic one-time task list.
  const visibleTasks = kb.tasks.filter(t => t.taskType !== 'DAILY_CHECKIN');

  const [copied, setCopied] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [emailSigningIn, setEmailSigningIn] = useState(false);
  const [googleSigningIn, setGoogleSigningIn] = useState(false);

  const progress = Math.min((kb.kaiBar / NEXT_MILESTONE) * 100, 100);
  const remaining = Math.max(NEXT_MILESTONE - kb.kaiBar, 0);
  const rank = kb.kaiBar > 15000 ? 42 : kb.kaiBar > 10000 ? 127 : kb.kaiBar > 5000 ? 318 : kb.kaiBar > 1000 ? 712 : 1500;
  const todayEarned = kb.entries.filter(e => {
    const d = new Date(e.createdAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).reduce((s, e) => s + e.amount, 0);

  const copyCode = () => {
    if (!kb.referralCode) return;
    navigator.clipboard.writeText(kb.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 1800);
    return () => clearTimeout(t);
  }, []);

  if (!ready && !timedOut) {
    return <main style={{ minHeight: '100dvh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin" size={24} color={C.goldLight} /></main>;
  }

  if (!authenticated || !address) {
    return (
      <main style={{ minHeight: '100dvh', background: C.bg, color: C.paper, fontFamily: "'Poppins', 'IBM Plex Sans', var(--font-sans)", position: 'relative', paddingBottom: 80 }}>
        <div style={{ ...W, paddingTop: 96, textAlign: 'center', maxWidth: 440 }}>
          <p style={label}>KAI Nuvari · Avalanche C-Chain</p>
          <h1 style={{ ...SERIF, fontSize: 30, fontWeight: 700, margin: '14px 0 0', letterSpacing: '-0.5px' }}>
            <span style={{ color: C.goldLight }}>Kai</span> Bar
          </h1>
          <p style={{ fontSize: 14, color: C.inkLight, margin: '12px 0 28px', lineHeight: 1.6 }}>
            Sign in to start earning points toward future rewards.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 280, margin: '0 auto' }}>
            <button disabled={emailSigningIn}
              onClick={async () => {
                setSignInError(null);
                setEmailSigningIn(true);
                const res = await signInWithEmail();
                setEmailSigningIn(false);
                if (!res.ok && res.reason !== 'login-cancelled') {
                  setSignInError(res.reason === 'privy-not-configured' ? 'Email sign-in is not configured yet.' : String(res.reason ?? 'Email sign-in failed. Please try again.'));
                }
              }}
              style={{
                padding: '14px 26px', borderRadius: 999, border: 'none', cursor: 'pointer',
                background: C.gold, color: '#1B1A14', fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
              }}>
              {emailSigningIn ? 'Signing in…' : 'Continue with Email'}
            </button>
            <button disabled={googleSigningIn}
              onClick={async () => {
                setSignInError(null);
                setGoogleSigningIn(true);
                const res = await signInWithGoogle();
                setGoogleSigningIn(false);
                if (!res.ok && res.reason !== 'login-cancelled') {
                  setSignInError(res.reason === 'privy-not-configured' ? 'Google sign-in is not configured yet.' : String(res.reason ?? 'Google sign-in failed. Please try again.'));
                }
              }}
              style={{
                padding: '14px 26px', borderRadius: 999, border: `1px solid ${C.hairline}`, cursor: 'pointer',
                background: 'none', color: C.paperDim, fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
              }}>
              {googleSigningIn ? 'Signing in…' : 'Continue with Google'}
            </button>
            {signInError && (
              <p style={{ fontSize: 11, color: C.red, margin: '4px 0 0' }}>{signInError}</p>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100dvh', background: C.bg, color: C.paper, fontFamily: "'Poppins', 'IBM Plex Sans', var(--font-sans)", position: 'relative', paddingBottom: 80 }}>
      <style>{`
        .kb-grid { display: flex; flex-direction: column; gap: 0; }
        @media (min-width: 1000px) {
          .kb-grid { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(280px, 1fr); align-items: start; gap: 48px; }
        }
      `}</style>
      <div style={{ ...W, paddingTop: 40 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 14 }}>
          <div>
            <p style={label}>Kainovari Rewards</p>
            <h1 style={{ ...SERIF, fontSize: 28, fontWeight: 700, margin: '10px 0 0', letterSpacing: '-0.4px' }}>
              <span style={{ color: C.goldLight }}>Kai</span> Bar
            </h1>
          </div>
          <button onClick={kb.reload} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: C.inkLight, fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
          }}>{kb.loading ? 'Refreshing…' : 'Refresh'}</button>
        </div>

        <div className="kb-grid" style={{ marginTop: 32 }}>
          <div style={{ minWidth: 0 }}>

            {/* Balance hero */}
            <section>
              <p style={label}>Kai Bar</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '10px 0 0' }}>
                <span style={{ ...SERIF, fontSize: 44, fontWeight: 600, letterSpacing: '-1.5px', lineHeight: 1, color: C.goldLight }}>{kb.kaiBar.toLocaleString()}</span>
                <span style={{ fontSize: 13, color: C.inkLight, fontWeight: 600 }}>points</span>
              </div>
              <div className="home-stats" style={{ marginTop: 24 }}>
                {[
                  { label: 'Your Rank', value: `#${rank.toLocaleString()}` },
                  { label: 'Today', value: `+${todayEarned.toLocaleString()}` },
                  { label: 'Network', value: `${kb.referralStats.networkSize}` },
                  { label: 'Airdrop', value: kb.airdrop?.eligible ? 'Eligible' : 'In Progress', hl: kb.airdrop?.eligible },
                ].map(s => (
                  <div key={s.label} className="home-stat">
                    <p className="home-stat-value" style={{ color: s.hl ? C.goldLight : C.paper }}>{s.value}</p>
                    <p className="home-stat-label">{s.label}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Milestone progress */}
            <section style={{ marginTop: 36, paddingTop: 28, borderTop: `1px solid ${C.hairline}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.paperDim, margin: 0 }}>
                  Next milestone: <span style={{ color: C.goldLight, fontWeight: 700 }}>{NEXT_MILESTONE.toLocaleString()}</span> Kai Bar
                </p>
                <p style={{ fontSize: 12, color: C.inkLight, margin: 0 }}>{remaining.toLocaleString()} remaining</p>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: C.hairline, overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.9, ease: 'easeOut' }}
                  style={{ height: '100%', borderRadius: 2, background: C.gold }} />
              </div>
            </section>

            {/* Tasks */}
            <section style={{ marginTop: 36, paddingTop: 28, borderTop: `1px solid ${C.hairline}` }}>
              <p style={{ ...label, marginBottom: 16 }}>Earn Kai Bar</p>
              {visibleTasks.map(t => {
                const Icon = TASK_ICON[t.taskType] ?? Gift;
                return (
                  <div key={t.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0',
                    borderBottom: `1px solid ${C.hairline}`,
                  }}>
                    <Icon size={18} color={t.completed ? C.inkLight : C.goldLight} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: t.completed ? C.inkLight : C.paper }}>{t.name}</p>
                      {t.description && <p style={{ fontSize: 11.5, color: C.inkLight, margin: '2px 0 0' }}>{t.description}</p>}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.gold, flexShrink: 0 }}>+{t.rewardAmount.toLocaleString()}</span>
                    {t.completed ? (
                      <CheckCircle2 size={18} color={C.goldLight} style={{ flexShrink: 0 }} />
                    ) : (
                      <button disabled={completing === t.id}
                        onClick={async () => {
                          setCompleting(t.id);
                          try {
                            const token = await getAccessToken();
                            if (!token) { setToast('Could not verify your session.'); return; }
                            const res = await fetch('/api/kai-bar/tasks/complete', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                              body: JSON.stringify({ taskId: t.id }),
                            });
                            const d = await res.json();
                            if (d.error) { setToast(d.error); return; }
                            await kb.reload();
                            setToast(`+${d.earned} Kai Bar earned!`);
                          } catch {
                            setToast('Something went wrong.');
                          } finally {
                            setCompleting(null);
                            setTimeout(() => setToast(null), 3000);
                          }
                        }}
                        style={{
                          padding: '7px 16px', borderRadius: 999, border: `1px solid ${C.hairline}`, cursor: 'pointer',
                          background: 'none', color: C.goldLight, fontSize: 11.5, fontWeight: 700, fontFamily: 'inherit', flexShrink: 0,
                        }}>
                        {completing === t.id ? '…' : 'Do it'}
                      </button>
                    )}
                  </div>
                );
              })}
            </section>

            {/* Recent ledger */}
            <section style={{ marginTop: 36, paddingTop: 28, borderTop: `1px solid ${C.hairline}` }}>
              <p style={{ ...label, marginBottom: 16 }}>Activity ledger</p>
              {kb.entries.length === 0 ? (
                <p style={{ fontSize: 13, color: C.inkLight, margin: 0 }}>No activity yet.</p>
              ) : (
                kb.entries.slice(0, 6).map(e => (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: `1px solid ${C.hairline}` }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: e.amount > 0 ? C.goldLight : C.red, minWidth: 52 }}>
                      {e.amount > 0 ? '+' : ''}{e.amount}
                    </span>
                    <span style={{ flex: 1, fontSize: 12.5, color: C.paperDim }}>{e.description}</span>
                    <span style={{ ...MONO, fontSize: 10.5, color: C.inkLight }}>
                      {new Date(e.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))
              )}
            </section>
          </div>

          {/* ── SIDEBAR ── */}
          <div>
            {/* Daily sign-in */}
            <section>
              <DailyCheckInCard
                claimedToday={kb.checkin.claimedToday}
                points={kb.checkin.points}
                claiming={kb.claimingCheckin}
                onClaim={async () => {
                  const res = await kb.claimDailyCheckin();
                  if (res.ok) setToast(`+${res.earned} Kai Bar earned!`);
                  else if (res.error) setToast(res.error);
                  setTimeout(() => setToast(null), 3000);
                }}
              />
            </section>

            {/* Referral */}
            <section style={{ marginTop: 24, paddingTop: 24, borderTop: `1px solid ${C.hairline}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <Users size={17} color={C.goldLight} strokeWidth={1.7} />
                <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: C.paper }}>Invite friends</p>
              </div>
              <p style={{ fontSize: 11.5, color: C.inkLight, margin: '0 0 14px' }}>+500 Kai Bar per direct referral, +50 for second-level</p>
              {kb.referralCode ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14, borderBottom: `1px solid ${C.hairline}`, marginBottom: 14 }}>
                    <code style={{ ...MONO, flex: 1, fontSize: 16, fontWeight: 700, letterSpacing: 1, color: C.goldLight }}>{kb.referralCode}</code>
                    <button onClick={copyCode} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: copied ? C.goldLight : C.inkLight, fontSize: 12, fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit',
                    }}>
                      {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                    {[
                      { label: 'Direct', v: kb.referralStats.direct },
                      { label: 'Active', v: kb.referralStats.active },
                      { label: 'Network', v: kb.referralStats.networkSize },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: 'center' }}>
                        <p style={{ ...SERIF, fontSize: 17, fontWeight: 600, color: C.goldLight, margin: 0 }}>{s.v}</p>
                        <p style={{ ...MONO, fontSize: 9, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: C.inkLight, margin: '3px 0 0' }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p style={{ fontSize: 12.5, color: C.inkLight, margin: 0 }}>Complete signing up to get your referral code.</p>
              )}
            </section>

            {/* Airdrop eligibility */}
            <section style={{ marginTop: 24, paddingTop: 24, borderTop: `1px solid ${C.hairline}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <Lock size={17} color={C.gold} strokeWidth={1.7} />
                <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: C.paper }}>Airdrop Status</p>
                <span style={{ marginLeft: 'auto', ...MONO, fontSize: 10, fontWeight: 700, color: kb.airdrop?.eligible ? C.goldLight : C.inkLight }}>
                  {kb.airdrop?.eligible ? '● ELIGIBLE' : 'IN PROGRESS'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 }}>
                {[
                  { label: 'Contribution', v: kb.airdrop?.contributionScore ?? 0 },
                  { label: 'Referral', v: kb.airdrop?.referralScore ?? 0 },
                  { label: 'Activity', v: kb.airdrop?.activityScore ?? 0 },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <p style={{ ...SERIF, fontSize: 17, fontWeight: 600, color: C.gold, margin: 0 }}>{s.v.toLocaleString()}</p>
                    <p style={{ ...MONO, fontSize: 9, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: C.inkLight, margin: '3px 0 0' }}>{s.label} score</p>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: C.inkLight, margin: '14px 0 0', lineHeight: 1.5 }}>
                Eligibility is tracked now; the Kai Bar → KAI conversion formula is not set in stone yet.
              </p>
              <AirdropClaimCard eligible={kb.airdrop?.eligible ?? false} amount={kb.airdrop?.contributionScore ?? 0} />
            </section>

            {/* Back to wallet */}
            <section style={{ marginTop: 24, paddingTop: 24, borderTop: `1px solid ${C.hairline}` }}>
              <Link href="/wallet" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
                <ArrowLeft size={18} color={C.inkLight} strokeWidth={1.7} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: C.paper }}>Back to Wallet</p>
                  <p style={{ fontSize: 11.5, color: C.inkLight, margin: '2px 0 0' }}>Manage your assets</p>
                </div>
                <ChevronRight size={15} color={C.inkLight} />
              </Link>
            </section>
          </div>
        </div>

        {toast && <div style={{
          position: 'fixed', bottom: 96, left: '50%', transform: 'translateX(-50%)', zIndex: 50,
          padding: '11px 20px', borderRadius: 999, fontSize: 13, fontWeight: 700,
          background: '#0E2418', border: `1px solid ${C.hairline}`, color: C.goldLight,
        }}>{toast}</div>}
      </div>
    </main>
  );
}
