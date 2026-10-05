'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Award, Check, ChevronRight, Copy, Gift, Loader2, Medal, Sprout, Trees, Trophy, Users, type LucideIcon,
} from 'lucide-react';
import { usePrivyAuth } from '@/lib/auth/privy-auth';
import type { AirdropSummary, LeaderboardEntry, LedgerActivityItem, MissionItem, ReferralItem } from '@/lib/airdrop/engine';

/**
 * /mine — Points & Airdrop. People who test and take part earn points,
 * saved with their email (no wallet). Points build levels and badges now,
 * and are the base for future rewards. Same APIs as before:
 * /api/airdrop/{me,claim,missions,referrals,activity,leaderboard}.
 * Wallet linking (for future token rewards) is hidden until wallets return.
 */

const C = {
  bg: '#0E2418', band: '#12301F', card: '#15352A', cardHi: '#1B4032', line: 'rgba(246,242,231,0.08)',
  paper: '#F6F2E7', dim: '#C9CFC2', ink: '#9BA396', gold: '#C89B3C', goldLight: '#E4C878', green: '#7DC383', red: '#E88C7D',
};

/** Participation levels from lifetime points (foundation for future rewards). */
const LEVELS: { name: string; from: number; icon: LucideIcon }[] = [
  { name: 'Seedling', from: 0, icon: Sprout },
  { name: 'Sapling', from: 250, icon: Sprout },
  { name: 'Guardian', from: 1000, icon: Trees },
  { name: 'Forest Keeper', from: 5000, icon: Trophy },
];
const levelFor = (pts: number) => { let i = 0; LEVELS.forEach((l, j) => { if (pts >= l.from) i = j; }); return i; };

/** Missions shown in plain words; wallet missions wait until wallets return. */
const HIDDEN_MISSIONS = new Set(['link_wallet']);
const MISSION_WORDS: Record<string, string> = {
  verify_email: 'Verify your email', complete_profile: 'Complete your profile', daily_checkin: 'Check in today',
  daily_claim: 'Collect your daily points', invite_first_friend: 'Invite a friend', friend_activates: 'Your friend becomes active',
  conservation_submission: 'Submit a conservation record', cfa_verification: 'Get a record verified by your CFA',
};

const fmtTime = (s: number) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m ${s % 60}s`;
};

export default function PointsPage() {
  const privy = usePrivyAuth();
  const [summary, setSummary] = useState<AirdropSummary | null>(null);
  const [missions, setMissions] = useState<MissionItem[]>([]);
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [ledger, setLedger] = useState<LedgerActivityItem[]>([]);
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<'missions' | 'history' | 'friends' | 'leaders'>('missions');

  const say = (text: string, ok = true) => { setToast({ text, ok }); setTimeout(() => setToast(null), 3500); };

  const load = useCallback(async (isStale: () => boolean = () => false) => {
    try {
      const token = await privy.getAccessToken();
      const headers: Record<string, string> = token ? { authorization: `Bearer ${token}` } : {};
      const [s, m, r, l, b] = await Promise.all([
        fetch('/api/airdrop/me', { headers }), fetch('/api/airdrop/missions', { headers }), fetch('/api/airdrop/referrals', { headers }),
        fetch('/api/airdrop/activity', { headers }), fetch('/api/airdrop/leaderboard', { headers }),
      ]);
      if (isStale()) return;
      setNeedsOnboarding(s.status === 404);
      if (s.ok) { const d = (await s.json()).data as AirdropSummary | undefined; if (d) { setSummary(d); setCountdown(d.dailyClaimCooldownSeconds || 0); } }
      else if (s.status === 401) { setSummary(null); setMissions([]); setReferrals([]); setLedger([]); }
      if (m.ok) setMissions(((await m.json()).data ?? []) as MissionItem[]);
      if (r.ok) setReferrals(((await r.json()).data ?? []) as ReferralItem[]);
      if (l.ok) setLedger(((await l.json()).data ?? []) as LedgerActivityItem[]);
      if (b.ok) setBoard(((await b.json()).data ?? []) as LeaderboardEntry[]);
    } catch { /* offline: keep what we have */ } finally {
      if (!isStale()) setLoading(false);
    }
  }, [privy]);

  useEffect(() => {
    let stale = false;
    const id = setTimeout(() => { void load(() => stale); }, 0);
    return () => { stale = true; clearTimeout(id); };
  }, [load, privy.authenticated]);

  // Daily countdown.
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  const authed = async () => {
    const token = await privy.getAccessToken();
    if (!token) { say('Please sign in again.', false); return null; }
    return { 'Content-Type': 'application/json', authorization: `Bearer ${token}` };
  };

  const claimDaily = async () => {
    if (busy || countdown > 0) return;
    setBusy('daily');
    try {
      const headers = await authed(); if (!headers) return;
      const res = await fetch('/api/airdrop/claim', { method: 'POST', headers, body: '{}' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.ok) { if (res.status === 409 && d.remainingSeconds) setCountdown(Number(d.remainingSeconds)); say(d.error ?? 'Could not collect your points. Try again.', false); return; }
      setCountdown(Number(d.data?.remainingSeconds ?? 86400));
      say(`+${Number(d.data?.claimPoints ?? 0)} points collected.`);
      await load();
    } catch { say('Network problem. Try again.', false); } finally { setBusy(null); }
  };

  const claimMission = async (id: string) => {
    if (busy) return;
    setBusy(id);
    try {
      const headers = await authed(); if (!headers) return;
      const res = await fetch(`/api/airdrop/missions/${id}/claim`, { method: 'POST', headers });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.ok) { say(d.error ?? 'Could not collect this mission.', false); return; }
      say(`Mission done! +${d.data?.rewardPoints ?? 0} points.`);
      await load();
    } catch { say('Network problem. Try again.', false); } finally { setBusy(null); }
  };

  const copyLink = async () => {
    if (!summary?.referralLink) return;
    try { await navigator.clipboard.writeText(summary.referralLink); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* no clipboard */ }
  };

  const lifetime = summary?.lifetimePoints ?? 0;
  const li = levelFor(lifetime);
  const level = LEVELS[li], next = LEVELS[li + 1];
  const progress = next ? Math.min(100, Math.round(((lifetime - level.from) / (next.from - level.from)) * 100)) : 100;
  const shownMissions = missions.filter((m) => !HIDDEN_MISSIONS.has(m.id));
  const badges = shownMissions.filter((m) => m.status === 'CLAIMED');
  const LevelIcon = level.icon;

  return (
    <main className="pt">
      {toast && <div className={toast.ok ? 'pt-toast' : 'pt-toast pt-toast--bad'} role="status">{toast.text}</div>}
      <header className="pt-top">
        <div className="pt-wrap pt-top-inner">
          <Link href="/" className="pt-back" aria-label="Back to home"><ArrowLeft size={18} /></Link>
          <div><h1 className="pt-title">Points &amp; Airdrop</h1><p className="pt-sub">Earn points for testing and taking part</p></div>
        </div>
      </header>

      <div className="pt-wrap pt-body">
        {!privy.authenticated ? (
          <section className="pt-card pt-hello">
            <Gift size={26} color={C.goldLight} />
            <h2>Earn points for taking part</h2>
            <p>Sign in with your email to collect daily points, finish missions and invite friends. No wallet needed.</p>
            <div className="pt-btns">
              <button className="pt-btn" onClick={() => { void privy.signInWithEmail(); }}>Sign in with email</button>
              <button className="pt-btn pt-btn--ghost" onClick={() => { void privy.signInWithGoogle(); }}>Sign in with Google</button>
            </div>
          </section>
        ) : loading && !summary ? (
          <p className="pt-empty"><Loader2 size={16} className="pt-spin" /> Loading your points…</p>
        ) : needsOnboarding || !summary ? (
          <p className="pt-empty">We are setting up your account. Refresh this page in a moment.</p>
        ) : (
          <>
            {/* Points, level and the daily drop */}
            <section className="pt-hero">
              <div className="pt-card pt-total">
                <p className="pt-kicker">Your points</p>
                <p className="pt-big">{(summary.totalPoints ?? 0).toLocaleString()}</p>
                <div className="pt-level">
                  <span className="pt-level-icon"><LevelIcon size={18} /></span>
                  <div><b>{level.name}</b><small>{next ? `${(next.from - lifetime).toLocaleString()} more points to ${next.name}` : 'Top level reached'}</small></div>
                </div>
                <div className="pt-bar"><i style={{ width: `${progress}%` }} /></div>
              </div>
              <div className="pt-card pt-daily">
                <p className="pt-kicker">Daily points</p>
                <p className="pt-daily-n">+{summary.projectedNextClaim ?? summary.baseDailyClaim ?? 10}</p>
                <p className="pt-muted">Come back every day. A streak raises your daily points (now ×{(summary.claimMultiplier ?? 1).toFixed(2)}).</p>
                <button className="pt-btn pt-btn--wide" onClick={() => void claimDaily()} disabled={busy === 'daily' || countdown > 0}>
                  {busy === 'daily' ? <><Loader2 size={15} className="pt-spin" /> Collecting…</> : countdown > 0 ? `Next in ${fmtTime(countdown)}` : 'Collect today’s points'}
                </button>
              </div>
            </section>

            {/* Levels ladder + badges */}
            <section>
              <h2 className="pt-h2">Levels</h2>
              <div className="pt-ladder">
                {LEVELS.map((l, i) => (
                  <div key={l.name} className={i < li ? 'pt-step done' : i === li ? 'pt-step now' : 'pt-step'}>
                    <span>{i < li ? <Check size={14} /> : <l.icon size={15} />}</span><b>{l.name}</b><small>{l.from.toLocaleString()}+ points</small>
                  </div>
                ))}
              </div>
              <p className="pt-muted" style={{ marginTop: 10 }}>Points will later turn into badges, achievements and rewards for active members.</p>
              {badges.length > 0 && (
                <div className="pt-badges">
                  {badges.map((b) => <span key={b.id} className="pt-badge"><Medal size={14} /> {MISSION_WORDS[b.id] ?? b.name}</span>)}
                </div>
              )}
            </section>

            {/* Tabs */}
            <section>
              <div className="pt-tabs" role="tablist">
                {([['missions', 'Missions'], ['history', 'History'], ['friends', 'Invite'], ['leaders', 'Leaders']] as const).map(([id, l]) => (
                  <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{l}</button>
                ))}
              </div>

              {tab === 'missions' && (
                <div className="pt-list">
                  {shownMissions.map((m) => (
                    <div key={m.id} className="pt-row">
                      <span className="pt-row-icon"><Award size={17} /></span>
                      <div className="pt-row-text">
                        <b>{MISSION_WORDS[m.id] ?? m.name}</b>
                        <small>{m.description}</small>
                        {m.progress && <small>{m.progress.current} of {m.progress.total}</small>}
                      </div>
                      <div className="pt-row-side">
                        <span className="pt-pts">+{m.rewardPoints}</span>
                        {m.status === 'CLAIMED' ? <span className="pt-done"><Check size={14} /> Done</span>
                          : m.status === 'COMPLETED' ? <button className="pt-btn pt-btn--small" onClick={() => void claimMission(m.id)} disabled={busy === m.id}>{busy === m.id ? '…' : 'Collect'}</button>
                          : m.actionUrl ? <Link className="pt-go" href={m.actionUrl} prefetch={false}>Do it <ChevronRight size={14} /></Link>
                          : <span className="pt-todo">To do</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'history' && (
                ledger.length === 0 ? <p className="pt-empty">No points yet. Collect your daily points to start.</p> : (
                  <div className="pt-list">
                    {ledger.slice(0, 30).map((e) => (
                      <div key={e.id} className="pt-row">
                        <div className="pt-row-text"><b>{e.title}</b><small>{new Date(e.createdAt).toLocaleString()}</small></div>
                        <span className="pt-pts">{e.points >= 0 ? '+' : ''}{e.points}</span>
                      </div>
                    ))}
                  </div>
                )
              )}

              {tab === 'friends' && (
                <div className="pt-card pt-invite">
                  <p className="pt-muted" style={{ marginTop: 0 }}>Share your link. You earn points when a friend joins and when they become active.</p>
                  <div className="pt-link"><code>{summary.referralLink}</code><button className="pt-btn pt-btn--small" onClick={() => void copyLink()}>{copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}</button></div>
                  <p className="pt-muted"><Users size={14} /> {summary.totalReferrals} invited · {summary.activeReferrals} active</p>
                  {referrals.slice(0, 20).map((r) => (
                    <div key={r.id} className="pt-row"><div className="pt-row-text"><b>{r.nameMasked}</b><small>Joined {new Date(r.joinedAt).toLocaleDateString()}</small></div><span className="pt-todo">{r.status.toLowerCase()}</span></div>
                  ))}
                </div>
              )}

              {tab === 'leaders' && (
                <div className="pt-list">
                  {board.slice(0, 20).map((b) => (
                    <div key={b.rank} className={b.isYou ? 'pt-row you' : 'pt-row'}>
                      <span className="pt-rank">{b.rank}</span>
                      <div className="pt-row-text"><b>{b.isYou ? `${b.name} (you)` : b.name}</b><small>{b.referrals} friends invited</small></div>
                      <span className="pt-pts">{b.totalPower.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <Link href="/sdg" className="pt-more" prefetch={false}>See your SDG Impact points <ChevronRight size={15} /></Link>
          </>
        )}
      </div>

      <style>{`
        .pt { min-height: 100dvh; background: ${C.bg}; color: ${C.paper}; font-family: 'Inter', system-ui, sans-serif; padding-bottom: 110px; }
        .pt-wrap { width: min(1000px, calc(100% - 32px)); margin: 0 auto; }
        .pt-top { position: sticky; top: 0; z-index: 30; background: ${C.band}; border-bottom: 1px solid ${C.line}; }
        .pt-top-inner { display: flex; align-items: center; gap: 12px; padding: 12px 0; }
        .pt-back { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; color: ${C.paper}; background: rgba(246,242,231,0.06); flex-shrink: 0; }
        .pt-title { margin: 0; font-size: 18px; font-weight: 700; }
        .pt-sub { margin: 1px 0 0; font-size: 12.5px; color: ${C.ink}; }
        .pt-body { display: grid; grid-template-columns: minmax(0, 1fr); gap: 26px; padding-top: 20px; }
        .pt-body > * { min-width: 0; }
        .pt-card { padding: 20px; border-radius: 18px; background: ${C.band}; box-sizing: border-box; }
        .pt-hello { display: grid; gap: 8px; justify-items: start; }
        .pt-hello h2 { margin: 6px 0 0; font-size: 22px; }
        .pt-hello p { margin: 0; color: ${C.dim}; line-height: 1.55; }
        .pt-btns { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
        .pt-hero { display: grid; gap: 12px; grid-template-columns: 1fr; }
        @media (min-width: 760px) { .pt-hero { grid-template-columns: 1.3fr 1fr; } }
        .pt-kicker { margin: 0; font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: ${C.ink}; }
        .pt-big { margin: 4px 0 14px; font-size: 46px; font-weight: 800; line-height: 1; color: ${C.goldLight}; font-variant-numeric: tabular-nums; }
        .pt-level { display: flex; align-items: center; gap: 10px; }
        .pt-level b { display: block; font-size: 16px; }
        .pt-level small { display: block; color: ${C.dim}; font-size: 13px; }
        .pt-level-icon { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 50%; background: rgba(125,195,131,0.16); color: ${C.green}; }
        .pt-bar { margin-top: 14px; height: 8px; border-radius: 999px; background: rgba(246,242,231,0.08); overflow: hidden; }
        .pt-bar i { display: block; height: 100%; background: ${C.gold}; border-radius: 999px; }
        .pt-daily { display: grid; gap: 6px; align-content: start; }
        .pt-daily-n { margin: 2px 0 0; font-size: 34px; font-weight: 800; color: ${C.green}; }
        .pt-muted { margin: 0; color: ${C.dim}; font-size: 13.5px; line-height: 1.5; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .pt-h2 { margin: 0 0 12px; font-size: 19px; }
        .pt-ladder { display: grid; gap: 8px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
        @media (min-width: 720px) { .pt-ladder { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
        .pt-step { display: grid; grid-template-columns: auto 1fr; column-gap: 8px; align-items: center; padding: 10px; border-radius: 12px; background: ${C.card}; border: 1.5px solid transparent; }
        .pt-step span { grid-row: span 2; display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; background: rgba(246,242,231,0.08); color: ${C.ink}; }
        .pt-step b { font-size: 13.5px; }
        .pt-step small { font-size: 12px; color: ${C.ink}; }
        .pt-step.now { border-color: ${C.gold}; }
        .pt-step.now span { background: rgba(200,155,60,0.2); color: ${C.goldLight}; }
        .pt-step.done span { background: ${C.green}; color: #10231A; }
        .pt-badges { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
        .pt-badge { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: 999px; background: rgba(200,155,60,0.14); color: ${C.goldLight}; font-size: 13px; font-weight: 600; }
        .pt-tabs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px; padding: 4px; border-radius: 12px; background: ${C.band}; margin-bottom: 12px; }
        .pt-tabs button { padding: 10px 4px; border-radius: 9px; border: none; background: none; color: ${C.dim}; font-weight: 700; font-size: 13.5px; cursor: pointer; font-family: inherit; }
        .pt-tabs button.on { background: ${C.gold}; color: #1B1A14; }
        .pt-list { display: grid; gap: 8px; }
        .pt-row { display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: 14px; background: ${C.card}; }
        .pt-row.you { outline: 1.5px solid ${C.gold}; }
        .pt-row-icon { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; background: rgba(200,155,60,0.14); color: ${C.goldLight}; flex-shrink: 0; }
        .pt-row-text { flex: 1; min-width: 0; display: grid; gap: 2px; }
        .pt-row-text b { font-size: 14.5px; }
        .pt-row-text small { color: ${C.ink}; font-size: 12.5px; line-height: 1.4; }
        .pt-row-side { display: grid; justify-items: end; gap: 6px; flex-shrink: 0; }
        .pt-pts { font-weight: 800; color: ${C.goldLight}; font-variant-numeric: tabular-nums; }
        .pt-done { display: inline-flex; align-items: center; gap: 4px; color: ${C.green}; font-size: 13px; font-weight: 600; }
        .pt-todo { color: ${C.ink}; font-size: 13px; text-transform: capitalize; }
        .pt-go { display: inline-flex; align-items: center; gap: 4px; color: ${C.goldLight}; font-size: 13.5px; font-weight: 600; text-decoration: none; }
        .pt-rank { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; background: rgba(246,242,231,0.08); font-weight: 700; flex-shrink: 0; }
        .pt-invite { display: grid; gap: 10px; }
        .pt-link { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 12px; background: ${C.bg}; }
        .pt-link code { flex: 1; min-width: 0; overflow-wrap: anywhere; font-size: 13px; color: ${C.goldLight}; }
        .pt-btn { display: inline-flex; align-items: center; justify-content: center; gap: 7px; padding: 12px 20px; border-radius: 999px; border: none; background: ${C.gold}; color: #1B1A14; font-weight: 700; font-size: 14.5px; cursor: pointer; font-family: inherit; min-height: 46px; }
        .pt-btn:disabled { opacity: .6; cursor: default; }
        .pt-btn--wide { width: 100%; margin-top: 6px; }
        .pt-btn--ghost { background: rgba(246,242,231,0.08); color: ${C.paper}; }
        .pt-btn--small { padding: 7px 14px; min-height: 36px; font-size: 13px; }
        .pt-empty { display: flex; align-items: center; gap: 8px; margin: 0; padding: 16px; border-radius: 14px; background: ${C.band}; color: ${C.dim}; }
        .pt-more { display: inline-flex; align-items: center; gap: 6px; color: ${C.goldLight}; font-weight: 600; text-decoration: none; }
        .pt-toast { position: fixed; top: 72px; left: 50%; transform: translateX(-50%); z-index: 100; max-width: calc(100% - 32px); padding: 11px 20px; border-radius: 999px; background: ${C.cardHi}; color: ${C.green}; font-weight: 600; font-size: 14px; box-shadow: 0 8px 24px rgba(0,0,0,.35); }
        .pt-toast--bad { color: ${C.red}; }
        .pt-spin { animation: pt-spin 1s linear infinite; }
        @keyframes pt-spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}
