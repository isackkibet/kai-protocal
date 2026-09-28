'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import WalletConnectModal from '@/components/WalletConnectModal';
import ClaimCelebration from '@/components/ClaimCelebration';
import { usePrivyAuth } from '@/lib/privy-auth';
import {
  AlertCircle, ArrowLeft, CheckCircle, Clock, Gift,
  Sparkles, TrendingUp, Zap, Copy, Check, ShieldCheck,
  Users, Activity, Award, Flame, Lock, Info
} from 'lucide-react';
import type { AirdropSummary, ReferralItem, LedgerActivityItem, MissionItem, LeaderboardEntry } from '@/lib/airdrop-engine';

const C = {
  bg:        '#06140D',
  bgSoft:    '#0B2418',
  card:      '#0D2B1D',
  cardAlt:   '#113725',
  gold:      '#C89B3C',
  goldLight: '#E4C878',
  emerald:   '#10B981',
  emeraldLight: '#34D399',
  paper:     '#F6F2E7',
  paperDim:  '#EFE9D9',
  inkLight:  '#9BA396',
  hairline:  'rgba(200,155,60,0.18)',
  hairlineGreen: 'rgba(16,185,129,0.22)',
};

const MONO: React.CSSProperties = { fontFamily: "'IBM Plex Mono', var(--font-plex-mono), monospace" };
const SERIF: React.CSSProperties = { fontFamily: "'Fraunces', 'Poppins', serif" };

function useCountUp(target: number, duration = 600) {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);
  useEffect(() => {
    const from = prevRef.current;
    const to = target;
    if (from === to) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else prevRef.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return display;
}

export default function MinePage() {
  const { address } = useAccount();
  const privy = usePrivyAuth();

  const [activeTab, setActiveTab] = useState<'claim' | 'referrals' | 'missions' | 'ledger' | 'leaderboard'>('claim');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Core Engine Data State
  const [summary, setSummary] = useState<AirdropSummary | null>(null);
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [ledger, setLedger] = useState<LedgerActivityItem[]>([]);
  const [missions, setMissions] = useState<MissionItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Action states
  const [claiming, setClaiming] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [claimingMissionId, setClaimingMissionId] = useState<string | null>(null);
  const [walletInput, setWalletInput] = useState('');
  const [celebration, setCelebration] = useState<{ amount: number; multiplier: number; streak: number; balance?: number } | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [linkingWallet, setLinkingWallet] = useState(false);

  // Fetch all Airdrop Engine state. `isStale` lets an effect drop a response
  // that arrives after the user signed in/out, so it never paints over newer data.
  const loadAirdropData = useCallback(async (isStale: () => boolean = () => false) => {
    try {
      const token = await privy.getAccessToken();
      const headers: Record<string, string> = token ? { authorization: `Bearer ${token}` } : {};

      const [summaryRes, referralsRes, ledgerRes, missionsRes, lbRes] = await Promise.all([
        fetch('/api/airdrop/me', { headers }),
        fetch('/api/airdrop/referrals', { headers }),
        fetch('/api/airdrop/activity', { headers }),
        fetch('/api/airdrop/missions', { headers }),
        fetch('/api/airdrop/leaderboard', { headers }),
      ]);
      if (isStale()) return;

      setNeedsOnboarding(summaryRes.status === 404);
      if (summaryRes.ok) {
        const s = await summaryRes.json();
        if (s.data) {
          setSummary(s.data);
          setCountdown(s.data.dailyClaimCooldownSeconds || 0);
        }
      } else if (summaryRes.status === 401) {
        // Signed out: clear the previous member's data instead of leaving it on screen.
        setSummary(null);
        setReferrals([]);
        setLedger([]);
        setMissions([]);
        setCountdown(0);
      }

      if (referralsRes.ok) {
        const r = await referralsRes.json();
        if (r.data) setReferrals(r.data);
      }

      if (ledgerRes.ok) {
        const l = await ledgerRes.json();
        if (l.data) setLedger(l.data);
      }

      if (missionsRes.ok) {
        const m = await missionsRes.json();
        if (m.data) setMissions(m.data);
      }

      if (lbRes.ok) {
        const lb = await lbRes.json();
        if (lb.data) setLeaderboard(lb.data);
      }
    } catch (err) {
      console.error('Failed to load airdrop engine data:', err);
    }
  }, [privy]);

  useEffect(() => {
    let stale = false;
    const id = setTimeout(() => { void loadAirdropData(() => stale); }, 0);
    return () => { stale = true; clearTimeout(id); };
  }, [loadAirdropData, privy.authenticated]);

  // Countdown ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(c => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-Miner Engine (0.05 pts/sec, 30s flush). Mines only for signed-in
  // members while the tab is visible; the server measures the time itself and
  // never credits more than that, so the client number is only an upper bound.
  const minerBuffer = useRef(0);
  const [minerActive, setMinerActive] = useState(false);
  const [minerBuffered, setMinerBuffered] = useState(0);
  const canMine = privy.authenticated && !needsOnboarding;
  const { getAccessToken } = privy;

  useEffect(() => {
    if (!canMine) return;

    const flush = async (keepalive = false) => {
      const pts = minerBuffer.current;
      if (pts < 0.05) return; // nothing meaningful to flush
      minerBuffer.current = 0; // reset before async call (prevents double-flush)
      try {
        const token = await getAccessToken();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers.authorization = `Bearer ${token}`;
        const res = await fetch('/api/airdrop/mine', {
          method: 'POST',
          headers,
          keepalive,
          body: JSON.stringify({ accumulatedPoints: pts }),
        });
        if (!res.ok) throw new Error(String(res.status));
        if (keepalive) return;
        // Quietly refresh summary to reflect new balance
        const summaryRes = await fetch('/api/airdrop/me', { headers: token ? { authorization: `Bearer ${token}` } : {} });
        if (summaryRes.ok) {
          const s = await summaryRes.json();
          if (s.data) setSummary(s.data);
        }
      } catch {
        // Non-critical: will retry on next flush cycle
        minerBuffer.current += pts; // restore on error
      }
    };

    const accumulatorTick = setInterval(() => {
      const visible = typeof document === 'undefined' || document.visibilityState === 'visible';
      if (visible) minerBuffer.current += 0.05;
      setMinerActive(visible);
      setMinerBuffered(minerBuffer.current);
    }, 1000);
    const flushInterval = setInterval(() => { void flush(); }, 30_000);
    // Send what was mined before the tab goes to the background or closes.
    const onHide = () => { if (document.visibilityState === 'hidden') void flush(true); };
    document.addEventListener('visibilitychange', onHide);

    return () => {
      clearInterval(accumulatorTick);
      clearInterval(flushInterval);
      document.removeEventListener('visibilitychange', onHide);
      void flush(true);
      setMinerActive(false);
    };
  }, [canMine, getAccessToken]);

  const formatCountdown = (secs: number) => {
    const h = Math.floor(secs / 3600).toString().padStart(2, '0');
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 4500);
  };

  // Perform Daily Claim Ritual (§5.5)
  const handleDailyClaim = async () => {
    if (!privy.authenticated) { setShowWalletModal(true); return; }
    if (claiming || countdown > 0) return;
    setClaiming(true);
    try {
      const token = await privy.getAccessToken();
      if (!token) { showToast('Your session expired. Please sign in again.', 'error'); return; }
      const res = await fetch('/api/airdrop/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        // Already claimed elsewhere (other tab, double tap): sync the timer too.
        if (res.status === 409 && data.remainingSeconds) setCountdown(Number(data.remainingSeconds));
        showToast(data.error || 'Daily claim failed. Please try again.', 'error');
        return;
      }

      const d = data.data;
      setCountdown(Number(d.remainingSeconds ?? 86400));
      setCelebration({
        amount: Number(d.claimPoints ?? 0),
        multiplier: Number(d.multiplier ?? 1),
        streak: Number(d.streak ?? 1),
        balance: d.totalPoints != null ? Number(d.totalPoints) : undefined,
      });
      loadAirdropData();
    } catch {
      showToast('Network error. Check your connection and try again.', 'error');
    } finally {
      setClaiming(false);
    }
  };

  // Claim Mission Reward (§17)
  const handleClaimMission = async (missionId: string) => {
    if (!privy.authenticated) { setShowWalletModal(true); return; }
    if (claimingMissionId) return;
    setClaimingMissionId(missionId);
    try {
      const token = await privy.getAccessToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.authorization = `Bearer ${token}`;

      const res = await fetch(`/api/airdrop/missions/${missionId}/claim`, { method: 'POST', headers });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        showToast(data.error || 'Could not claim mission', 'error');
        return;
      }

      showToast(`Mission complete! +${data.data.rewardPoints} points added to your ledger.`, 'success');
      loadAirdropData();
    } catch {
      showToast('Network error claiming mission', 'error');
    } finally {
      setClaimingMissionId(null);
    }
  };

  // Link Wallet for Snapshot (§25a)
  const handleLinkWallet = async (addrToLink?: string) => {
    if (!privy.authenticated) { setShowWalletModal(true); return; }
    const targetAddr = addrToLink || walletInput || address;
    if (!targetAddr) {
      showToast('Please enter or connect a valid EVM address', 'error');
      return;
    }

    setLinkingWallet(true);
    try {
      const token = await privy.getAccessToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.authorization = `Bearer ${token}`;

      const res = await fetch('/api/airdrop/link-wallet', {
        method: 'POST',
        headers,
        body: JSON.stringify({ walletAddress: targetAddr }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        showToast(data.error || 'Failed to link wallet', 'error');
        return;
      }

      showToast(`Wallet linked: ${targetAddr.slice(0, 6)}...${targetAddr.slice(-4)}`, 'success');
      setWalletInput('');
      loadAirdropData();
    } catch {
      showToast('Network error linking wallet', 'error');
    } finally {
      setLinkingWallet(false);
    }
  };

  const copyReferralLink = () => {
    if (!summary?.referralLink) return;
    navigator.clipboard.writeText(summary.referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    showToast('Referral link copied to clipboard!');
  };

  const copyReferralCode = () => {
    if (!summary?.referralCode) return;
    navigator.clipboard.writeText(summary.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    showToast('Referral code copied to clipboard!');
  };

  const displayTotalPower = useCountUp(summary?.totalPower ?? 0);
  const displayActivePower = summary?.activePower ?? 0;
  const displayMultiplier = summary?.claimMultiplier ?? 1;
  const displayNextClaim = summary?.projectedNextClaim ?? summary?.baseDailyClaim ?? 10;
  const signedOut = !privy.authenticated;

  return (
    <main style={{
      minHeight: '100dvh',
      background: 'linear-gradient(180deg, #041009 0%, #06180E 50%, #030D07 100%)',
      color: C.paper,
      fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
      paddingBottom: 'max(110px, env(safe-area-inset-bottom, 110px))',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..700&family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap');
        .glow-gold { box-shadow: 0 0 35px rgba(200, 155, 60, 0.25); }
        .glow-emerald { box-shadow: 0 0 35px rgba(16, 185, 129, 0.25); }
        .tab-btn:hover { background: rgba(255,255,255,0.06); }
        .tab-btn:active { transform: scale(0.96); }
        .interactive-card { transition: all 0.2s ease; }
        .interactive-card:hover { transform: translateY(-2px); border-color: rgba(200,155,60,0.35) !important; }
        .interactive-card:active { transform: scale(0.98); }

        .mine-container {
          width: 100%;
          max-width: 1140px;
          margin: 0 auto;
          padding: 0 24px;
          padding-top: 28px;
        }
        .mine-hero-box {
          background: linear-gradient(135deg, #0F3322 0%, #081D13 60%, #05140D 100%);
          border-radius: 24px;
          border: 1px solid rgba(200, 155, 60, 0.32);
          padding: 36px 32px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 25px 60px -15px rgba(0,0,0,0.8), 0 0 35px rgba(200, 155, 60, 0.12);
          margin-bottom: 32px;
        }
        .mine-hero-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 32px;
          align-items: center;
        }
        .mine-formula-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        .mine-tabs-bar {
          display: flex;
          gap: 8px;
          border-bottom: 1px solid ${C.hairline};
          padding-bottom: 12px;
          margin-bottom: 28px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .mine-tabs-bar::-webkit-scrollbar { display: none; }
        .tab-btn {
          flex-shrink: 0;
          white-space: nowrap;
        }
        .mine-two-col {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 32px;
        }
        .mine-token-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .mine-referral-header {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 28px;
          align-items: center;
        }
        .mine-missions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
        }

        @media (max-width: 860px) {
          .mine-container { padding: 0 16px; padding-top: 18px; }
          .mine-hero-box { padding: 24px 18px; border-radius: 20px; margin-bottom: 24px; }
          .mine-hero-grid { grid-template-columns: 1fr; gap: 24px; }
          .mine-two-col { grid-template-columns: 1fr; gap: 20px; }
          .mine-referral-header { grid-template-columns: 1fr; gap: 20px; }
        }
        @media (max-width: 640px) {
          .mine-formula-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .mine-missions-grid { grid-template-columns: 1fr; gap: 12px; }
        }
        @media (max-width: 480px) {
          .mine-token-grid { grid-template-columns: 1fr; gap: 10px; }
          .mine-formula-grid { grid-template-columns: 1fr 1fr; gap: 6px; }
        }
      `}</style>

      <div className="mine-container">
        
        {/* Navigation / Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: C.inkLight, fontSize: 13, transition: 'color 0.15s', minHeight: 40 }}>
            <ArrowLeft size={16} /> Back to Ecosystem
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              ...MONO, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase',
              background: 'rgba(200,155,60,0.14)', color: C.goldLight,
              padding: '5px 10px', borderRadius: 6, border: `1px solid ${C.hairline}`,
              fontWeight: 700,
            }}>
              Pre-mainnet season
            </span>
            <span style={{
              ...MONO, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase',
              background: summary?.tier === 'DIAMOND' ? 'rgba(56,189,248,0.2)' : 'rgba(16,185,129,0.15)',
              color: summary?.tier === 'DIAMOND' ? '#7DD3FC' : C.emeraldLight,
              padding: '5px 10px', borderRadius: 6, border: `1px solid ${C.hairlineGreen}`,
              fontWeight: 700,
            }}>
              {summary ? `${summary.tier} Contributor · Rank #${summary.rank}` : signedOut ? 'Sign in to see your rank' : 'Loading your rank'}
            </span>
          </div>
        </div>

        {/* ── HERO BANNER: Power Score & Claim Drop Ritual ── */}
        <div className="mine-hero-box">
          {/* Top Accent line */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #C89B3C, #10B981, #C89B3C)' }} />

          <div className="mine-hero-grid">
            
            {/* Left: Total Power Metric */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Sparkles size={16} color={C.goldLight} />
                <span style={{ ...MONO, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: C.goldLight, fontWeight: 700 }}>
                  Airdrop & Referral Power Engine
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, margin: '6px 0 12px', flexWrap: 'wrap' }}>
                <span style={{ ...SERIF, fontSize: 'clamp(38px, 6vw, 56px)', fontWeight: 800, color: C.paper, lineHeight: 1 }}>
                  {displayTotalPower.toLocaleString()}
                </span>
                <span style={{ ...MONO, fontSize: 16, color: C.goldLight, fontWeight: 700 }}>
                  TOTAL POWER
                </span>
              </div>

              <p style={{ fontSize: 13.5, color: C.inkLight, margin: '0 0 18px', lineHeight: 1.55, maxWidth: 500 }}>
                Your pre-mainnet snapshot weight is determined by verified personal contribution, active network referrals, and non-decaying lifetime activity.
              </p>

              {/* Formula Breakdown Cards (§5.2) */}
              <div className="mine-formula-grid">
                {[
                  { label: 'Personal Power', value: summary?.personalPower ?? 0, color: C.paper, icon: Award },
                  { label: 'Referral Power (20%)', value: summary?.referralPower ?? 0, color: C.emeraldLight, icon: Users },
                  { label: 'Campaign Bonus', value: summary?.bonusPower ?? 0, color: C.goldLight, icon: Gift },
                  { label: 'Active Power (Decaying)', value: `${displayActivePower} HP`, color: '#7DD3FC', icon: Zap },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} style={{
                      background: 'rgba(0,0,0,0.35)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 12,
                      padding: '10px 12px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                        <Icon size={12} color={item.color} />
                        <span style={{ ...MONO, fontSize: 9, textTransform: 'uppercase', color: C.inkLight, letterSpacing: 0.5 }}>
                          {item.label}
                        </span>
                      </div>
                      <span style={{ ...MONO, fontSize: 13.5, fontWeight: 700, color: item.color }}>
                        {item.value.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Daily Claim Drop Ritual Box (§5.5) */}
            <div style={{
              background: 'linear-gradient(180deg, rgba(8,29,19,0.95) 0%, rgba(4,16,10,0.95) 100%)',
              border: '1px solid rgba(200,155,60,0.28)',
              borderRadius: 20,
              padding: '24px 20px',
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ ...MONO, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: C.goldLight, fontWeight: 700 }}>
                  24H Claim Ritual
                </span>
                <span style={{
                  ...MONO, fontSize: 10, color: countdown === 0 ? C.emeraldLight : C.goldLight,
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: countdown === 0 ? C.emeraldLight : C.goldLight }} />
                  {countdown === 0 ? 'READY TO CLAIM' : `COOLDOWN ${formatCountdown(countdown)}`}
                </span>
              </div>

              <div style={{ margin: '14px 0 16px' }}>
                <p style={{ ...MONO, fontSize: 11, color: C.inkLight, textTransform: 'uppercase', margin: 0 }}>
                  Daily Drop Yield
                </p>
                <h3 style={{ ...SERIF, fontSize: 36, fontWeight: 800, color: C.goldLight, margin: '4px 0 2px' }}>
                  {displayNextClaim} points
                </h3>
                <p style={{ fontSize: 12, color: C.paperDim, margin: 0 }}>
                  Floor {summary?.baseDailyClaim ?? 10} × <strong style={{ color: C.emeraldLight }}>{displayMultiplier.toFixed(2)}x Active Multiplier</strong>
                </p>
                <p style={{ fontSize: 11.5, color: C.inkLight, margin: '8px 0 0', lineHeight: 1.45 }}>
                  Points are saved to your account and convert to NVR tokens at the mainnet snapshot.
                </p>
              </div>

              <motion.button
                whileHover={countdown === 0 && !claiming ? { scale: 1.02 } : {}}
                whileTap={countdown === 0 && !claiming ? { scale: 0.98 } : {}}
                onClick={handleDailyClaim}
                disabled={countdown > 0 || claiming}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  borderRadius: 14,
                  border: 'none',
                  background: countdown === 0 ? 'linear-gradient(90deg, #C89B3C, #E4C878)' : 'rgba(255,255,255,0.06)',
                  color: countdown === 0 ? '#102217' : C.inkLight,
                  fontWeight: 800,
                  fontSize: 15,
                  cursor: countdown === 0 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontFamily: 'inherit',
                  boxShadow: countdown === 0 ? '0 0 25px rgba(200, 155, 60, 0.4)' : 'none',
                }}
              >
                {signedOut ? (
                  <><Lock size={16} /> Sign in to claim</>
                ) : claiming ? (
                  <><Clock size={17} className="animate-spin" /> Processing Claim...</>
                ) : countdown === 0 ? (
                  <><Gift size={18} /> Claim {displayNextClaim} points</>
                ) : (
                  <><Clock size={16} /> Next Drop in {formatCountdown(countdown)}</>
                )}
              </motion.button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 }}>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: minerActive ? C.emeraldLight : C.inkLight,
                  animation: minerActive ? 'pulse 1.5s infinite' : 'none',
                }} />
                <p style={{ ...MONO, fontSize: 10, color: minerActive ? C.emeraldLight : C.inkLight, margin: 0 }}>
                  {!canMine ? (needsOnboarding ? 'Finish signing up to start the Auto-Miner' : 'Sign in to start the Auto-Miner')
                    : minerActive ? `Auto-Miner Active · +${minerBuffered.toFixed(2)} pts buffered` : 'Auto-Miner paused while this tab is hidden'}
                </p>
              </div>
              {summary && summary.streak > 0 && (
                <p style={{ ...MONO, fontSize: 10.5, color: C.goldLight, margin: '8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  <Flame size={12} /> {summary.streak}-day claim streak
                </p>
              )}
              <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }`}</style>
            </div>
          </div>
        </div>

        {needsOnboarding && (
          <div style={{ marginBottom: 24, padding: '12px 20px', borderRadius: 12, background: 'rgba(200,155,60,0.12)', border: `1px solid ${C.hairline}`, color: C.goldLight, display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
            <Info size={16} />
            <span>Your account is still being set up. Finish onboarding to start earning airdrop points.</span>
          </div>
        )}

        {/* Action Toast Feedback */}
        <AnimatePresence>
          {actionMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                marginBottom: 24,
                padding: '12px 20px',
                borderRadius: 12,
                background: actionMsg.type === 'success' ? 'rgba(16,185,129,0.18)' : 'rgba(239,68,68,0.18)',
                border: `1px solid ${actionMsg.type === 'success' ? C.emerald : '#EF4444'}`,
                color: actionMsg.type === 'success' ? C.emeraldLight : '#FCA5A5',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {actionMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              <span role={actionMsg.type === 'error' ? 'alert' : 'status'}>{actionMsg.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Navigation Tabs ── */}
        <div className="mine-tabs-bar">
          {[
            { id: 'claim', label: 'Ecosystem Rewards', icon: Sparkles },
            { id: 'referrals', label: `Referral Network (${summary?.totalReferrals ?? 0})`, icon: Users },
            { id: 'missions', label: `Missions (${missions.filter(m => m.status === 'CLAIMED').length}/${missions.length})`, icon: Award },
            { id: 'ledger', label: 'Activity Ledger', icon: Activity },
            { id: 'leaderboard', label: 'Leaderboard', icon: TrendingUp },
          ].map(tab => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className="tab-btn"
                style={{
                  padding: '10px 18px',
                  borderRadius: 10,
                  border: `1px solid ${active ? C.gold : 'transparent'}`,
                  background: active ? 'rgba(200,155,60,0.14)' : 'transparent',
                  color: active ? C.goldLight : C.inkLight,
                  fontWeight: active ? 700 : 500,
                  fontSize: 13.5,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── TAB 1: ECOSYSTEM REWARDS & TOKEN LAUNCHPOOLS ── */}
        {activeTab === 'claim' && (
          <div className="mine-two-col">
            <div>
              {/* Token Drop Allocations */}
              <div style={{
                background: C.card,
                borderRadius: 18,
                border: `1px solid ${C.hairline}`,
                padding: '24px 20px',
                marginBottom: 24,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <h3 style={{ ...SERIF, fontSize: 19, fontWeight: 700, margin: 0, color: C.paper }}>
                      Your Points & Future Tokens
                    </h3>
                    <p style={{ fontSize: 12.5, color: C.inkLight, margin: '3px 0 0' }}>
                      You earn points now. At the mainnet snapshot, points convert into ecosystem tokens.
                    </p>
                  </div>
                  <span style={{ ...MONO, fontSize: 10, color: C.goldLight, background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: 4 }}>
                    4 ASSETS
                  </span>
                </div>

                <div className="mine-token-grid">
                  {[
                    { symbol: 'POINTS', name: 'Earned so far', amount: summary ? summary.totalPoints.toLocaleString() : '0', color: C.goldLight, note: 'Convert to NVR at the snapshot' },
                    { symbol: 'YBOB', name: 'Stable Yield Token', amount: 'At snapshot', color: '#7DC383', note: 'DeFi Liquidity & Lending' },
                    { symbol: 'GAMI', name: 'Community Governance', amount: 'At snapshot', color: '#6FA8DC', note: 'DAO Voting & Proposal Rights' },
                    { symbol: 'CFA-C', name: 'Conservation Credit', amount: 'At snapshot', color: C.emeraldLight, note: 'Verified Tree Carbon Proofs' },
                  ].map(t => (
                    <div key={t.symbol} className="interactive-card" style={{
                      background: 'rgba(0,0,0,0.35)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 14,
                      padding: '14px 14px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.color }} />
                        <strong style={{ fontSize: 13.5, color: C.paper }}>{t.symbol}</strong>
                        <span style={{ fontSize: 11, color: C.inkLight }}>{t.name}</span>
                      </div>
                      <p style={{ ...SERIF, fontSize: 22, fontWeight: 700, color: t.color, margin: '4px 0 2px' }}>
                        {t.amount}
                      </p>
                      <p style={{ ...MONO, fontSize: 9.5, color: C.inkLight, margin: 0 }}>
                        {t.note}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mainnet Snapshot Eligibility Banner (§24 & §25) */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.14), rgba(4,21,14,0.95))',
                borderRadius: 18,
                border: `1px solid ${C.hairlineGreen}`,
                padding: '22px 20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.emeraldLight, flexShrink: 0 }}>
                    <ShieldCheck size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: C.paper }}>
                      Mainnet Airdrop Snapshot Status
                    </h4>
                    <p style={{ fontSize: 12.5, color: C.paperDim, lineHeight: 1.5, margin: '6px 0 14px' }}>
                      Snapshot calculates proportional token allocations from non-decaying Lifetime Points and verified Referral Power. Link your Avalanche wallet to secure your spot.
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      {summary?.walletAddress ? (
                        <span style={{ ...MONO, fontSize: 12, color: C.emeraldLight, background: 'rgba(0,0,0,0.4)', padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.hairlineGreen}` }}>
                          Linked: {summary.walletAddress.slice(0, 6)}...{summary.walletAddress.slice(-4)}
                        </span>
                      ) : (
                        <div style={{ display: 'flex', gap: 8, flex: 1, minWidth: 240, maxWidth: 380 }}>
                          <input
                            placeholder="0x... Avalanche address"
                            value={walletInput}
                            onChange={e => setWalletInput(e.target.value)}
                            style={{
                              flex: 1,
                              background: 'rgba(0,0,0,0.5)',
                              border: `1px solid ${C.hairline}`,
                              borderRadius: 8,
                              padding: '8px 12px',
                              color: C.paper,
                              fontSize: 12,
                              fontFamily: 'inherit',
                              minWidth: 0,
                            }}
                          />
                          <button
                            onClick={() => handleLinkWallet()}
                            disabled={linkingWallet}
                            style={{
                              padding: '8px 14px',
                              borderRadius: 8,
                              border: 'none',
                              background: C.gold,
                              color: '#06140D',
                              fontWeight: 700,
                              fontSize: 12,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {linkingWallet ? 'Linking...' : 'Link Wallet'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Quick Launchpools & Quick Actions */}
            <div>
              <div style={{
                background: C.card,
                borderRadius: 18,
                border: `1px solid ${C.hairline}`,
                padding: '24px 22px',
                marginBottom: 24,
              }}>
                <h4 style={{ ...SERIF, fontSize: 18, fontWeight: 700, margin: '0 0 4px', color: C.paper }}>
                  Active Early Contributor Pools
                </h4>
                <p style={{ fontSize: 12.5, color: C.inkLight, margin: '0 0 16px' }}>
                  Pre-mainnet pools with guaranteed allocation multipliers.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { name: 'AVAX Alpha Guardians', spots: '247/500', pct: 49, open: true, reward: '500 NVR' },
                    { name: 'Sango Basin Early Authors', spots: '89/200', pct: 45, open: true, reward: '1,000 NVR' },
                    { name: 'Oloolua CFA Seedling Planters', spots: '420/500', pct: 84, open: true, reward: '750 NVR' },
                  ].map((pool, idx) => (
                    <div key={idx} style={{
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 12,
                      padding: '12px 14px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <strong style={{ fontSize: 13, color: C.paper }}>{pool.name}</strong>
                        <span style={{ ...MONO, fontSize: 11, color: C.goldLight, fontWeight: 700 }}>{pool.reward}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.inkLight, marginBottom: 6 }}>
                        <span>{pool.spots} joined</span>
                        <span>{pool.pct}% filled</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                        <div style={{ width: `${pool.pct}%`, height: '100%', background: C.gold }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: REFERRAL NETWORK (§5.3, §6, §7, §8, §19a) ── */}
        {activeTab === 'referrals' && (
          <div>
            {/* Referral Sharing Header */}
            <div style={{
              background: C.card,
              borderRadius: 20,
              border: `1px solid ${C.hairline}`,
              padding: '24px 20px',
              marginBottom: 24,
            }}>
              <div className="mine-referral-header">
                <div>
                  <span style={{ ...MONO, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: C.goldLight, fontWeight: 700 }}>
                    Rule 1: Direct Attribution Locked At Registration
                  </span>
                  <h3 style={{ ...SERIF, fontSize: 22, fontWeight: 700, margin: '6px 0 8px', color: C.paper }}>
                    Invite Contributors & Earn 20% Power
                  </h3>
                  <p style={{ fontSize: 13.5, color: C.inkLight, margin: 0, lineHeight: 1.55 }}>
                    Every friend who registers with your link permanently links to your account. When they verify, complete onboarding, and perform conservation or news activity, <strong style={{ color: C.emeraldLight }}>20% of their qualifying power</strong> flows to your total score.
                  </p>
                </div>

                {/* Share Link Box */}
                <div style={{
                  background: 'rgba(0,0,0,0.4)',
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '16px 16px',
                }}>
                  <p style={{ ...MONO, fontSize: 10, textTransform: 'uppercase', color: C.inkLight, margin: '0 0 6px' }}>
                    Your Unique Referral Link
                  </p>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                    <input
                      readOnly
                      value={summary?.referralLink || 'Sign in to get your referral link'}
                      style={{
                        flex: 1,
                        minWidth: 180,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 8,
                        padding: '8px 12px',
                        color: C.paper,
                        fontSize: 12,
                        ...MONO,
                      }}
                    />
                    <button
                      onClick={copyReferralLink}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 8,
                        border: 'none',
                        background: C.gold,
                        color: '#06140D',
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                      {copiedLink ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ fontSize: 12, color: C.paperDim }}>
                      Referral Code: <strong style={{ color: C.goldLight, ...MONO }}>{summary?.referralCode || '--'}</strong>
                    </span>
                    <button
                      onClick={copyReferralCode}
                      style={{ background: 'none', border: 'none', color: C.goldLight, fontSize: 11, cursor: 'pointer', ...MONO, padding: 0 }}
                    >
                      {copiedCode ? 'Copied code!' : 'Copy code only'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Invited Friends List Table (§19a Privacy Masking) */}
            <div style={{
              background: C.card,
              borderRadius: 20,
              border: `1px solid ${C.hairline}`,
              padding: '22px 20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h4 style={{ ...SERIF, fontSize: 18, fontWeight: 700, margin: 0, color: C.paper }}>
                    Your Invited Contributors ({referrals.length})
                  </h4>
                  <p style={{ fontSize: 12.5, color: C.inkLight, margin: '2px 0 0' }}>
                    Identities are masked for privacy. Power flows once the referral reaches the ACTIVE state.
                  </p>
                </div>
                <span style={{ ...MONO, fontSize: 10.5, color: C.emeraldLight, background: 'rgba(16,185,129,0.12)', padding: '4px 10px', borderRadius: 6 }}>
                  Total Flow: +{summary?.referralPower ?? 0} Referral Power
                </span>
              </div>

              {referrals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 16px', color: C.inkLight }}>
                  <Users size={32} style={{ marginBottom: 10, opacity: 0.5 }} />
                  <p style={{ fontSize: 15, color: C.paper }}>No referrals yet.</p>
                  <p style={{ fontSize: 13 }}>Share your link above to start earning 20% of your network&apos;s contribution power.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {referrals.map((ref, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 12,
                      flexWrap: 'wrap',
                      gap: 12,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(200,155,60,0.15)', color: C.goldLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                          {ref.nameMasked.slice(0, 2)}
                        </div>
                        <div>
                          <strong style={{ fontSize: 13.5, color: C.paper }}>{ref.nameMasked}</strong>
                          <p style={{ ...MONO, fontSize: 10.5, color: C.inkLight, margin: '2px 0 0' }}>
                            Joined {new Date(ref.joinedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginLeft: 'auto' }}>
                        <span style={{
                          ...MONO, fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase',
                          padding: '3px 7px', borderRadius: 4,
                          background: ref.status === 'ACTIVE' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)',
                          color: ref.status === 'ACTIVE' ? C.emeraldLight : C.inkLight,
                        }}>
                          {ref.status}
                        </span>

                        <div style={{ textAlign: 'right', minWidth: 100 }}>
                          <span style={{ ...MONO, fontSize: 13, fontWeight: 700, color: ref.status === 'ACTIVE' ? C.emeraldLight : C.inkLight }}>
                            +{ref.contributedPower} Power
                          </span>
                          <p style={{ ...MONO, fontSize: 9.5, color: C.inkLight, margin: 0 }}>
                            (20% of {ref.qualifyingPower})
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 3: MISSIONS ENGINE (§17) ── */}
        {activeTab === 'missions' && (
          <div>
            <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ ...SERIF, fontSize: 21, fontWeight: 700, margin: 0, color: C.paper }}>
                  Contributor Missions & Challenges
                </h3>
                <p style={{ fontSize: 13, color: C.inkLight, margin: '3px 0 0' }}>
                  Complete ecosystem tasks to earn permanent Points and increase your Active Power multiplier.
                </p>
              </div>
              <span style={{ ...MONO, fontSize: 10.5, color: C.goldLight, background: C.card, padding: '5px 10px', borderRadius: 8, border: `1px solid ${C.hairline}` }}>
                {missions.filter(m => m.status === 'CLAIMED').length} of {missions.length} Completed
              </span>
            </div>

            <div className="mine-missions-grid">
              {missions.map(mission => {
                const isClaimed = mission.status === 'CLAIMED';
                const isReady = mission.status === 'COMPLETED';
                const isClaimingThis = claimingMissionId === mission.id;

                return (
                  <div
                    key={mission.id}
                    className="interactive-card"
                    style={{
                      background: isClaimed ? 'rgba(10,36,24,0.6)' : C.card,
                      border: `1px solid ${isClaimed ? C.hairlineGreen : C.hairline}`,
                      borderRadius: 16,
                      padding: '18px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      opacity: isClaimed ? 0.75 : 1,
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <span style={{
                          ...MONO, fontSize: 9.5, letterSpacing: 1, textTransform: 'uppercase',
                          color: isClaimed ? C.emeraldLight : C.goldLight,
                          background: 'rgba(0,0,0,0.35)', padding: '2px 7px', borderRadius: 4,
                          fontWeight: 700,
                        }}>
                          {mission.category}
                        </span>
                        <span style={{ ...MONO, fontSize: 13, fontWeight: 800, color: C.goldLight }}>
                          +{mission.rewardPoints} PTS
                        </span>
                      </div>

                      <h4 style={{ fontSize: 14.5, fontWeight: 700, color: C.paper, margin: '0 0 4px' }}>
                        {mission.name}
                      </h4>
                      <p style={{ fontSize: 12, color: C.inkLight, lineHeight: 1.5, margin: 0 }}>
                        {mission.description}
                      </p>
                    </div>

                    <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <span style={{ ...MONO, fontSize: 10.5, color: C.inkLight }}>
                        +{mission.rewardPower} Power Impact
                      </span>

                      <button
                        onClick={() => handleClaimMission(mission.id)}
                        disabled={isClaimed || isClaimingThis}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 8,
                          border: 'none',
                          background: isClaimed ? 'rgba(16,185,129,0.2)' : isReady ? C.gold : 'rgba(255,255,255,0.08)',
                          color: isClaimed ? C.emeraldLight : isReady ? '#06140D' : C.paperDim,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: isClaimed ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontFamily: 'inherit',
                        }}
                      >
                        {isClaimingThis ? (
                          <><Clock size={13} className="animate-spin" /> Claiming...</>
                        ) : isClaimed ? (
                          <><CheckCircle size={13} /> Completed</>
                        ) : isReady ? (
                          'Claim reward'
                        ) : (
                          'Check progress'
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB 4: ACTIVITY LEDGER (§9 & §12) ── */}
        {activeTab === 'ledger' && (
          <div style={{
            background: C.card,
            borderRadius: 20,
            border: `1px solid ${C.hairline}`,
            padding: '22px 20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ ...SERIF, fontSize: 20, fontWeight: 700, margin: 0, color: C.paper }}>
                  Append-Only Activity & Reward Ledger
                </h3>
                <p style={{ fontSize: 12.5, color: C.inkLight, margin: '2px 0 0' }}>
                  Every reward event carries an auditable source ID. Reversals are negative entries.
                </p>
              </div>
              <span style={{ ...MONO, fontSize: 10.5, color: C.goldLight, background: 'rgba(0,0,0,0.3)', padding: '4px 10px', borderRadius: 6 }}>
                {ledger.length} Verified Entries
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ledger.length === 0 && (
                <p style={{ textAlign: 'center', padding: '32px 16px', color: C.inkLight, fontSize: 13.5, margin: 0 }}>
                  {signedOut ? 'Sign in to see your reward history.' : 'No rewards yet. Claim your first daily drop to get started.'}
                </p>
              )}
              {ledger.map((entry, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 10,
                  flexWrap: 'wrap',
                  gap: 10,
                }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: 13, color: C.paper }}>{entry.title}</strong>
                      <span style={{ ...MONO, fontSize: 9, color: C.inkLight, background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 3 }}>
                        {entry.eventType}
                      </span>
                    </div>
                    <span style={{ ...MONO, fontSize: 10, color: C.inkLight }}>
                      ID: {entry.sourceId} · {new Date(entry.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <span style={{
                    ...MONO, fontSize: 13.5, fontWeight: 700,
                    color: entry.points >= 0 ? C.emeraldLight : '#EF4444',
                    marginLeft: 'auto',
                  }}>
                    {entry.points >= 0 ? `+${entry.points}` : entry.points} PTS
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 5: LEADERBOARD ── */}
        {activeTab === 'leaderboard' && (
          <div style={{
            background: C.card,
            borderRadius: 20,
            border: `1px solid ${C.hairline}`,
            padding: '22px 20px',
          }}>
            <h3 style={{ ...SERIF, fontSize: 20, fontWeight: 700, margin: '0 0 4px', color: C.paper }}>
              Community Power Leaderboard
            </h3>
            <p style={{ fontSize: 12.5, color: C.inkLight, margin: '0 0 18px' }}>
              Top contributors across Lake Victoria Basin, Oloolua Forest CFA, and the broader KAI ecosystem.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {leaderboard.map((user, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: user.isYou ? 'rgba(200,155,60,0.12)' : 'rgba(0,0,0,0.25)',
                  border: `1px solid ${user.isYou ? C.hairline : 'rgba(255,255,255,0.05)'}`,
                  borderRadius: 12,
                  flexWrap: 'wrap',
                  gap: 10,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{
                      ...MONO, fontSize: 13, fontWeight: 800, width: 24, textAlign: 'center',
                      color: user.rank === 1 ? '#F59E0B' : user.rank === 2 ? C.goldLight : user.rank === 3 ? '#A7F3D0' : C.inkLight,
                    }}>
                      #{user.rank}
                    </span>
                    <div>
                      <strong style={{ fontSize: 13.5, color: user.isYou ? C.goldLight : C.paper }}>
                        {user.name}
                      </strong>
                      <p style={{ ...MONO, fontSize: 10.5, color: C.inkLight, margin: '2px 0 0' }}>
                        {user.referrals} Direct Referrals · {user.tier} Tier
                      </p>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', marginLeft: 'auto' }}>
                    <span style={{ ...MONO, fontSize: 13.5, fontWeight: 800, color: C.goldLight }}>
                      {user.totalPower.toLocaleString()} POWER
                    </span>
                    <p style={{ ...MONO, fontSize: 9.5, color: '#7DD3FC', margin: 0 }}>
                      {user.activePower} Active HP
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      <AnimatePresence>
        {celebration && (
          <ClaimCelebration
            amount={celebration.amount}
            multiplier={celebration.multiplier}
            streak={celebration.streak}
            balance={celebration.balance}
            onClose={() => setCelebration(null)}
          />
        )}
      </AnimatePresence>

      {showWalletModal && <WalletConnectModal onClose={() => setShowWalletModal(false)} />}
    </main>
  );
}
