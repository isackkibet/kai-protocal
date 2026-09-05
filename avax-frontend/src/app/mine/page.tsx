'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import WalletConnectModal from '@/components/WalletConnectModal';
import { useKaivaxStore } from '@/store/useKaivaxStore';
import {
  CheckCircle, Users, UserPlus, ArrowLeft, Coins,
  CircleCheck, Flame, Gift, Sparkles,
} from 'lucide-react';

const WHITELIST = [
  { name: 'AVAX Alpha Miners',  spots: '247 / 500', badge: 'Hot',    status: 'open',   reward: '500 NVR'   },
  { name: 'NVR Launch Pool',    spots: '89 / 200',  badge: 'Early',  status: 'open',   reward: '1,000 NVR' },
  { name: 'Core Wallet Promo', spots: '500 / 500', badge: 'Closed', status: 'closed', reward: '200 NVR'   },
];

const ECOSYSTEM_REWARDS = [
  { symbol: 'NVR',    name: 'Nuvari',      reward: '10 NVR',    color: '#10b981' },
  { symbol: 'YBOB',   name: 'Stablecoin',  reward: '2 YBOB',   color: '#22c55e' },
  { symbol: 'YTOKEN', name: 'Yield Token', reward: '1 YTOKEN', color: '#60a5fa' },
  { symbol: 'GAMI',   name: 'Community',   reward: '5 GAMI',   color: '#f59e0b' },
];

const DAILY_TASKS = [
  { id: 'daily-checkin',   title: 'Daily check-in',      detail: 'Open the rewards desk today',                        reward: '5 NVR',    icon: Gift     },
  { id: 'explore-policy',  title: 'Explore a policy',    detail: 'Open a pension, trust, or insurance template',       reward: '2 YBOB',   icon: Sparkles },
  { id: 'ask-agent',       title: 'Ask the KAI agent',   detail: 'Get one answer about the ecosystem',                 reward: '1 GAMI',   icon: Users    },
  { id: 'join-community',  title: 'Join the community',  detail: 'Follow the latest ecosystem update',                 reward: '1 YTOKEN', icon: UserPlus },
];

/* ── tiny progress bar ── */
function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{
      width: '100%', height: 4, borderRadius: 4,
      background: 'rgba(255,255,255,0.07)',
      overflow: 'hidden',
    }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        style={{ height: '100%', borderRadius: 4, background: color,
          boxShadow: `0 0 8px ${color}88` }}
      />
    </div>
  );
}

export default function MinePage() {
  const { isConnected } = useAccount();
  const setTokenBalance = useKaivaxStore(s => s.setTokenBalance);

  const [showModal,       setShowModal]       = useState(false);
  const [claimed,         setClaimed]         = useState(false);
  const [claimProgress,   setClaimProgress]   = useState(0);
  const [countdown,       setCountdown]       = useState(86400);
  const [joinedWaitlist,  setJoinedWaitlist]  = useState(false);
  const [minted,          setMinted]          = useState<string | null>(null);
  const [mintName,        setMintName]        = useState('');
  const [mintSym,         setMintSym]         = useState('');
  const [mintSupply,      setMintSupply]      = useState('');
  const [completedTasks,  setCompletedTasks]  = useState<string[]>([]);
  const [taskMessage,     setTaskMessage]     = useState('');
  const [agentOn,         setAgentOn]         = useState(false);

  useEffect(() => {
    const id = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const fmtTime = (s: number) => {
    const h   = Math.floor(s / 3600).toString().padStart(2, '0');
    const m   = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  const handleClaim = async () => {
    if (!isConnected) { setShowModal(true); return; }
    setClaimProgress(1);
    await new Promise(r => setTimeout(r, 1500));
    setTokenBalance('nvr', useKaivaxStore.getState().balances.nvr + 10);
    setClaimed(true);
    setClaimProgress(2);
  };

  const completeTask = (taskId: string, reward: string) => {
    if (!isConnected) { setShowModal(true); return; }
    if (completedTasks.includes(taskId)) return;
    const [amountText, symbol] = reward.split(' ');
    const key = symbol.toLowerCase() as 'nvr' | 'ybob' | 'ytoken' | 'gami';
    setTokenBalance(key, useKaivaxStore.getState().balances[key] + Number(amountText));
    setCompletedTasks(t => [...t, taskId]);
    setTaskMessage(`+${reward} added to your balance`);
    setTimeout(() => setTaskMessage(''), 2800);
  };

  const mint = () => {
    if (!mintName || !mintSym || !mintSupply) return;
    setMinted(`0x${Math.random().toString(16).slice(2, 12).toUpperCase()}`);
  };

  const totalPoints = completedTasks.length * 5 + (claimed ? 10 : 0);

  return (
    <main style={{
      width: '100%', maxWidth: 1040, margin: '0 auto',
      padding: '24px 18px 110px',
      display: 'flex', flexDirection: 'column', gap: 20,
      position: 'relative',
    }}>

      {/* ── Ambient orbs ── */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: '5%', right: '-8%',
          width: 380, height: 380, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.09) 0%, transparent 70%)',
          animation: 'orb-drift-a 13s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '25%', left: '-6%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)',
          animation: 'orb-drift-b 17s ease-in-out infinite',
        }} />
      </div>

      {/* ── HEADER ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ paddingTop: 12, display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 2 }}
      >
        <Link href="/" style={{
          width: 38, height: 38, borderRadius: '50%',
          background: 'rgba(16,185,129,0.10)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 0 0 1px rgba(16,185,129,0.22) inset',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          textDecoration: 'none',
        }}>
          <ArrowLeft size={17} color="#10b981" />
        </Link>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>
            Mining & Airdrops
          </h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: '3px 0 0' }}>
            Claim daily rewards · Participate in Avalanche launchpools
          </p>
        </div>
      </motion.div>

      {/* ── SUMMARY STRIP ── */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="airdrop-summary-grid"
        style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 12, position: 'relative', zIndex: 2 }}
      >
        {/* Reward points */}
        <div style={{
          padding: '20px 18px', borderRadius: 22,
          background: 'linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(8,8,14,0.55) 100%)',
          backdropFilter: 'blur(22px)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.08) inset, 0 8px 32px rgba(0,0,0,0.35)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -30, right: -30, width: 100, height: 100,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            <Coins size={14} /> Ecosystem rewards
          </div>
          <strong style={{ display: 'block', fontSize: 32, color: '#fff', fontWeight: 900, letterSpacing: -1 }}>
            {totalPoints}
          </strong>
          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>reward points earned</span>
          <div style={{ marginTop: 12 }}>
            <ProgressBar value={totalPoints} max={50} color="#10b981" />
          </div>
        </div>

        {/* Streak */}
        <div style={{
          padding: '20px 16px', borderRadius: 22,
          background: 'rgba(8,8,14,0.52)',
          backdropFilter: 'blur(22px)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.07) inset, 0 8px 28px rgba(0,0,0,0.32)',
        }}>
          <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Flame size={13} /> Streak
          </div>
          <strong style={{ display: 'block', fontSize: 30, color: '#fff', fontWeight: 900, letterSpacing: -1 }}>
            3 days
          </strong>
          <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: 11 }}>Keep checking in</span>
          <div style={{ marginTop: 12 }}>
            <ProgressBar value={3} max={7} color="#f59e0b" />
          </div>
        </div>

        {/* Tasks */}
        <div style={{
          padding: '20px 16px', borderRadius: 22,
          background: 'rgba(8,8,14,0.52)',
          backdropFilter: 'blur(22px)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.07) inset, 0 8px 28px rgba(0,0,0,0.32)',
        }}>
          <div style={{ color: '#60a5fa', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
            Daily progress
          </div>
          <strong style={{ display: 'block', fontSize: 30, color: '#fff', fontWeight: 900, letterSpacing: -1 }}>
            {completedTasks.length}<span style={{ fontSize: 16, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>/{DAILY_TASKS.length}</span>
          </strong>
          <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: 11 }}>tasks completed</span>
          <div style={{ marginTop: 12 }}>
            <ProgressBar value={completedTasks.length} max={DAILY_TASKS.length} color="#60a5fa" />
          </div>
        </div>
      </motion.section>

      {/* ── DAILY CLAIM HERO ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.14 }}
        style={{
          padding: '22px 20px', borderRadius: 24,
          background: 'linear-gradient(135deg, rgba(16,185,129,0.14) 0%, rgba(6,6,10,0.58) 100%)',
          backdropFilter: 'blur(26px)',
          boxShadow: '0 1px 0 rgba(100,255,180,0.09) inset, 0 0 0 0.5px rgba(16,185,129,0.16) inset, 0 16px 50px rgba(0,0,0,0.40)',
          position: 'relative', overflow: 'hidden', zIndex: 2,
        }}
      >
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 160, height: 160,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.16) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          <div>
            <span style={{ fontSize: 10, color: '#10b981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
              DAILY REWARD
            </span>
            <h2 style={{ fontSize: 22, fontWeight: 900, margin: '4px 0 6px', color: '#fff', letterSpacing: '-0.4px' }}>
              Claim 10 NVR Tokens
            </h2>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', margin: 0 }}>
              Free claim once every 24 hours for C-Chain wallets.
            </p>
          </div>
          <span style={{ fontSize: 36, flexShrink: 0 }}>🎁</span>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 16 }} />

        <AnimatePresence mode="wait">
          {claimed ? (
            <motion.div
              key="claimed"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 15px', borderRadius: 14,
                background: 'rgba(34,197,94,0.08)',
                boxShadow: '0 0 0 1px rgba(34,197,94,0.22) inset',
              }}
            >
              <CheckCircle size={18} color="#4ade80" />
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, margin: 0, fontSize: 13, color: '#4ade80' }}>Tokens Claimed!</p>
                <p style={{ fontSize: 10, color: 'rgba(74,222,128,0.65)', margin: 0 }}>
                  Come back in {fmtTime(countdown)} to claim again.
                </p>
              </div>
              <div style={{
                padding: '5px 11px', borderRadius: 9,
                background: 'rgba(34,197,94,0.10)',
                boxShadow: '0 0 0 1px rgba(34,197,94,0.25) inset',
                fontSize: 11, color: '#22c55e', fontWeight: 700,
              }}>
                Streak: 3
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="claim-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleClaim}
              disabled={claimProgress === 1}
              className="btn-primary"
              style={{ width: '100%', padding: '15px', borderRadius: 14, fontSize: 14, fontWeight: 800 }}
            >
              {claimProgress === 1 ? '⏳ Processing…' : '🎁 Claim 10 NVR Now'}
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── ECOSYSTEM TOKEN DROPS ── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        style={{ position: 'relative', zIndex: 2 }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff' }}>Ecosystem drops</h2>
            <p style={{ margin: '3px 0 0', color: 'rgba(255,255,255,0.40)', fontSize: 11 }}>
              A rotating mix of tokens for active community members.
            </p>
          </div>
          <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 700 }}>Fuji rewards desk</span>
        </div>

        <div className="airdrop-token-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
          {ECOSYSTEM_REWARDS.map((token, i) => (
            <motion.div
              key={token.symbol}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.20 + i * 0.06 }}
              whileHover={{ y: -4, scale: 1.04 }}
              style={{
                padding: '14px 13px', borderRadius: 18,
                background: `linear-gradient(145deg, ${token.color}10 0%, rgba(6,6,12,0.52) 100%)`,
                backdropFilter: 'blur(18px)',
                boxShadow: `0 0 0 0.5px ${token.color}20 inset, 0 6px 20px rgba(0,0,0,0.30)`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: `${token.color}20`,
                  display: 'grid', placeItems: 'center',
                  fontWeight: 900, fontSize: 10, color: token.color,
                  boxShadow: `0 0 10px ${token.color}30`,
                }}>
                  {token.symbol.slice(0, 2)}
                </span>
                <div>
                  <strong style={{ display: 'block', fontSize: 12, color: '#fff' }}>{token.symbol}</strong>
                  <span style={{ display: 'block', fontSize: 10, color: 'rgba(255,255,255,0.40)' }}>{token.name}</span>
                </div>
              </div>
              <div style={{ color: token.color, fontWeight: 900, fontSize: 16 }}>{token.reward}</div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── DAILY TASKS ── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        style={{
          padding: '20px', borderRadius: 22,
          background: 'rgba(8,8,14,0.52)',
          backdropFilter: 'blur(22px)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.07) inset, 0 8px 32px rgba(0,0,0,0.32)',
          position: 'relative', zIndex: 2,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff' }}>Today&apos;s tasks</h2>
            <p style={{ margin: '3px 0 0', color: 'rgba(255,255,255,0.40)', fontSize: 11 }}>
              Click a task when you finish it.
            </p>
          </div>
          <AnimatePresence>
            {taskMessage && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                style={{ color: '#4ade80', fontSize: 11, fontWeight: 700 }}
              >
                {taskMessage}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="airdrop-task-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
          {DAILY_TASKS.map((task, i) => {
            const Icon = task.icon;
            const done = completedTasks.includes(task.id);
            return (
              <motion.button
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24 + i * 0.05 }}
                whileHover={done ? {} : { y: -2, scale: 1.02 }}
                whileTap={done ? {} : { scale: 0.97 }}
                onClick={() => completeTask(task.id, task.reward)}
                disabled={done}
                style={{
                  textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 13px', borderRadius: 16, border: 'none', cursor: done ? 'default' : 'pointer',
                  background: done
                    ? 'rgba(34,197,94,0.07)'
                    : 'rgba(255,255,255,0.04)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: done
                    ? '0 0 0 0.5px rgba(34,197,94,0.25) inset'
                    : '0 0 0 0.5px rgba(255,255,255,0.08) inset',
                  color: '#fff',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{
                  width: 36, height: 36, borderRadius: 11, flexShrink: 0,
                  display: 'grid', placeItems: 'center',
                  background: done ? 'rgba(34,197,94,0.18)' : 'rgba(16,185,129,0.12)',
                  boxShadow: done ? '0 0 12px rgba(34,197,94,0.25)' : 'none',
                  color: done ? '#4ade80' : '#10b981',
                }}>
                  {done ? <CircleCheck size={18} /> : <Icon size={18} />}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ display: 'block', fontSize: 12, color: done ? 'rgba(255,255,255,0.55)' : '#fff' }}>
                    {task.title}
                  </strong>
                  <span style={{ display: 'block', marginTop: 2, color: 'rgba(255,255,255,0.38)', fontSize: 10, lineHeight: 1.35 }}>
                    {done ? 'Completed today ✓' : task.detail}
                  </span>
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 800, flexShrink: 0,
                  color: done ? '#4ade80' : '#f59e0b',
                }}>
                  {done ? 'Done' : `+${task.reward}`}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.section>

      {/* ── AUTO-DROP AGENT ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.26 }}
        style={{
          padding: '18px 18px', borderRadius: 22,
          background: 'rgba(8,8,14,0.52)',
          backdropFilter: 'blur(22px)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.06) inset, 0 8px 28px rgba(0,0,0,0.30)',
          position: 'relative', zIndex: 2,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#10b981', margin: 0 }}>Auto-Drop Agent</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', margin: '3px 0 0' }}>
              AI bot mines tokens for you 24/7 on Avalanche Fuji
            </p>
          </div>
          {/* Toggle */}
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => { if (!isConnected) setShowModal(true); else setAgentOn(v => !v); }}
            style={{
              width: 54, height: 30, borderRadius: 15, border: 'none', cursor: 'pointer',
              position: 'relative', transition: 'background 0.3s',
              background: agentOn ? 'rgba(16,185,129,0.40)' : 'rgba(255,255,255,0.08)',
              boxShadow: agentOn ? '0 0 12px rgba(16,185,129,0.35)' : 'none',
            }}
          >
            <motion.div
              animate={{ left: agentOn ? 26 : 3 }}
              transition={{ type: 'spring', stiffness: 500, damping: 32 }}
              style={{
                width: 24, height: 24, borderRadius: '50%', background: '#fff',
                position: 'absolute', top: 3,
                boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
              }}
            />
          </motion.button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { l: 'Mining Rate', v: agentOn ? '0.003 /s' : '0.000 /s', c: '#10b981' },
            { l: 'Total Mined',  v: agentOn ? '0.2 NVR' : '0.0 NVR',  c: '#10b981' },
            { l: 'Status',       v: agentOn ? 'Active'  : 'Idle',      c: agentOn ? '#4ade80' : '#f59e0b' },
          ].map(s => (
            <div key={s.l} style={{
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 0 0 0.5px rgba(255,255,255,0.07) inset',
              borderRadius: 11, padding: '9px 11px',
            }}>
              <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.38)', margin: '0 0 4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {s.l}
              </p>
              <p style={{ fontSize: 13, fontWeight: 800, color: s.c, margin: 0 }}>{s.v}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── EARLY ACCESS WAITLIST ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.30 }}
        style={{
          padding: '20px 18px', borderRadius: 22,
          background: 'linear-gradient(135deg, rgba(167,139,250,0.10) 0%, rgba(8,8,14,0.55) 100%)',
          backdropFilter: 'blur(22px)',
          boxShadow: '0 0 0 0.5px rgba(167,139,250,0.22) inset, 0 8px 32px rgba(0,0,0,0.32)',
          position: 'relative', zIndex: 2,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#a78bfa', margin: '0 0 4px' }}>
              Early Access Waitlist
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
              Join to unlock advanced mining tiers, higher rewards &amp; exclusive drops.
            </p>
          </div>
          <AnimatePresence mode="wait">
            {!joinedWaitlist ? (
              <motion.button
                key="join"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setJoinedWaitlist(true)}
                style={{
                  background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                  color: '#fff', fontWeight: 700, fontSize: 13,
                  padding: '10px 18px', borderRadius: 12, border: 'none',
                  cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                  boxShadow: '0 4px 18px rgba(139,92,246,0.45)',
                }}
              >
                Join
              </motion.button>
            ) : (
              <motion.div
                key="joined"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#22c55e', fontWeight: 700, fontSize: 13, flexShrink: 0 }}
              >
                <CheckCircle size={16} /> Joined!
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── MINT TOKEN ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.34 }}
        style={{
          padding: '20px 18px', borderRadius: 22,
          background: 'rgba(8,8,14,0.52)',
          backdropFilter: 'blur(22px)',
          boxShadow: '0 0 0 0.5px rgba(167,139,250,0.16) inset, 0 8px 28px rgba(0,0,0,0.30)',
          position: 'relative', zIndex: 2,
        }}
      >
        <p style={{ fontSize: 14, fontWeight: 800, color: '#a78bfa', margin: '0 0 4px' }}>Mint New Token</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', margin: '0 0 16px' }}>
          Deploy your own ERC-20 token on Avalanche
        </p>

        <AnimatePresence mode="wait">
          {!minted ? (
            <motion.div key="form" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                value={mintName}
                onChange={e => setMintName(e.target.value)}
                placeholder="Token name (e.g. FarmCoin)"
                style={{
                  background: 'rgba(255,255,255,0.05)', border: 'none',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.09) inset',
                  borderRadius: 12, padding: '12px 15px',
                  fontSize: 13, color: '#fff', outline: 'none', fontFamily: 'inherit',
                  transition: 'box-shadow 0.2s',
                }}
                onFocus={e => (e.target.style.boxShadow = '0 0 0 1.5px rgba(167,139,250,0.50) inset')}
                onBlur={e  => (e.target.style.boxShadow = '0 0 0 1px rgba(255,255,255,0.09) inset')}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { v: mintSym,    s: setMintSym,    p: 'Symbol (FRM)' },
                  { v: mintSupply, s: setMintSupply, p: 'Supply', t: 'number' },
                ].map(({ v, s, p, t }) => (
                  <input
                    key={p}
                    value={v}
                    onChange={e => s(e.target.value)}
                    placeholder={p}
                    type={t || 'text'}
                    style={{
                      flex: 1, background: 'rgba(255,255,255,0.05)', border: 'none',
                      boxShadow: '0 0 0 1px rgba(255,255,255,0.09) inset',
                      borderRadius: 12, padding: '12px 15px',
                      fontSize: 13, color: '#fff', outline: 'none', fontFamily: 'inherit',
                      transition: 'box-shadow 0.2s',
                    }}
                    onFocus={e => (e.target.style.boxShadow = '0 0 0 1.5px rgba(167,139,250,0.50) inset')}
                    onBlur={e  => (e.target.style.boxShadow = '0 0 0 1px rgba(255,255,255,0.09) inset')}
                  />
                ))}
              </div>
              <motion.button
                whileHover={mintName && mintSym && mintSupply ? { scale: 1.02 } : {}}
                whileTap={mintName && mintSym && mintSupply ? { scale: 0.97 } : {}}
                onClick={mint}
                style={{
                  background: mintName && mintSym && mintSupply
                    ? 'linear-gradient(135deg, #a78bfa, #7c3aed)'
                    : 'rgba(255,255,255,0.07)',
                  color: mintName && mintSym && mintSupply ? '#fff' : 'rgba(255,255,255,0.28)',
                  fontWeight: 700, fontSize: 14, padding: '13px', borderRadius: 13,
                  border: 'none', cursor: mintName ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
                  boxShadow: mintName && mintSym && mintSupply ? '0 4px 18px rgba(139,92,246,0.40)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                Mint on Avalanche Fuji
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: 'center', padding: '14px 0' }}
            >
              <div style={{ fontSize: 38, marginBottom: 10 }}>🎉</div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#22c55e', margin: 0 }}>Token Minted!</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', margin: '6px 0 4px' }}>Contract Address</p>
              <p style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#10b981', margin: '0 0 14px' }}>
                {minted}
              </p>
              <button
                onClick={() => { setMinted(null); setMintName(''); setMintSym(''); setMintSupply(''); }}
                style={{
                  fontSize: 12, color: 'rgba(255,255,255,0.45)', background: 'transparent', border: 'none',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.10) inset',
                  borderRadius: 9, padding: '7px 16px', cursor: 'pointer',
                }}
              >
                Mint another
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── LAUNCHPOOLS ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38 }}
        style={{ position: 'relative', zIndex: 2 }}
      >
        <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.65)', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <UserPlus size={15} color="#10b981" /> Active Launchpools
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {WHITELIST.map((w, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.40 + i * 0.07 }}
              whileHover={{ x: 4 }}
              style={{
                padding: '14px 16px', borderRadius: 18,
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'rgba(8,8,14,0.52)',
                backdropFilter: 'blur(18px)',
                boxShadow: '0 0 0 0.5px rgba(255,255,255,0.07) inset, 0 6px 22px rgba(0,0,0,0.28)',
              }}
            >
              <div style={{
                width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                background: 'rgba(16,185,129,0.10)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
              }}>🏊</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0 }}>{w.name}</p>
                <div style={{ display: 'flex', gap: 10, marginTop: 3 }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)' }}>
                    <Users size={9} style={{ display: 'inline', marginRight: 3 }} />{w.spots}
                  </span>
                  <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 700 }}>{w.reward}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: w.status === 'open' ? '#22c55e' : '#f87171' }}>
                  {w.badge}
                </span>
                <motion.button
                  whileHover={w.status === 'open' ? { scale: 1.05 } : {}}
                  whileTap={w.status === 'open' ? { scale: 0.95 } : {}}
                  disabled={w.status === 'closed'}
                  style={{
                    fontSize: 11, fontWeight: 700, padding: '6px 13px', borderRadius: 9, border: 'none',
                    background: w.status === 'open'
                      ? 'linear-gradient(135deg, #10b981, #047857)'
                      : 'rgba(255,255,255,0.05)',
                    color: w.status === 'open' ? '#fff' : 'rgba(255,255,255,0.25)',
                    cursor: w.status === 'open' ? 'pointer' : 'not-allowed',
                    boxShadow: w.status === 'open' ? '0 0 14px rgba(16,185,129,0.35)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  {w.status === 'open' ? 'Join' : 'Closed'}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {showModal && <WalletConnectModal onClose={() => setShowModal(false)} />}
    </main>
  );
}
