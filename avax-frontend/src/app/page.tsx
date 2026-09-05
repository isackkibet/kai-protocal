'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useBalance, useReadContracts } from 'wagmi';
import { formatUnits } from 'viem';
import { useKaivaxStore } from '@/store/useKaivaxStore';
import WalletConnectModal from '@/components/WalletConnectModal';
import { ECOSYSTEM_TOKENS, TICKER_TOKENS } from '@/lib/tokens';
import { ERC20_ABI } from '@/lib/erc20abi';
import { formatChat } from '@/lib/formatChat';
import {
  Trees, Store, Users, FlaskConical, ScanLine,
  Droplets, ImageIcon, Lock, Globe, LayoutGrid, Gift,
  Bot, Copy, RefreshCw, ChevronRight, TrendingUp,
  ShieldCheck, Coins, Wallet,
  CircleDollarSign, BarChart3, Activity, Zap, X,
} from 'lucide-react';

const QUICK = [
  { name: 'AI Agent',    href: '/ai',         icon: Bot,         color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  { name: 'Playground',  href: '/nuvari',      icon: FlaskConical,color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  { name: 'Scan & Pay',  href: '/pay',         icon: ScanLine,    color: '#22d3ee', bg: 'rgba(34,211,238,0.12)' },
  { name: 'Securities',  href: '/securities',  icon: ShieldCheck, color: '#06b6d4', bg: 'rgba(6,182,212,0.12)'  },
  { name: 'NFT Mkt',     href: '/connft',      icon: ImageIcon,   color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  { name: 'Pools',       href: '/pools',       icon: Droplets,    color: '#059669', bg: 'rgba(5,150,105,0.12)'  },
  { name: 'Vaults',      href: '/vaults',      icon: Lock,        color: '#a3e635', bg: 'rgba(163,230,53,0.12)' },
  { name: 'Airdrop',     href: '/mine',        icon: Gift,        color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { name: 'KAI Web',     href: '/kai',         icon: Globe,       color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  { name: 'TaaS',        href: '/taas',        icon: LayoutGrid,  color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
];

const DASHBOARDS = [
  { id: 'cfa',    href: '/cfa',    icon: Trees,  color: '#10b981', label: 'CFA Dashboard',  sub: 'Community Forest · Treasury · Governance' },
  { id: 'sme',    href: '/sme',    icon: Store,  color: '#22d3ee', label: 'SME Dashboard',   sub: 'Digitise Cash · Loans · Inventory'         },
  { id: 'saving', href: '/saving', icon: Users,  color: '#a855f7', label: 'Saving Group',    sub: 'Pool Funds · Yield · Decentralised'        },
];

function buildCalls(addr: `0x${string}` | undefined) {
  if (!addr) return [];
  return ECOSYSTEM_TOKENS.filter(t => t.address).map(t => ({
    address: t.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf' as const,
    args: [addr],
  }));
}

const TOKEN_ICON: Record<string, React.ComponentType<{ size: number; color: string; strokeWidth: number }>> = {
  AVAX: Activity, NVR: Zap, yBOB: CircleDollarSign,
  YTOKEN: TrendingUp, YGOLD: BarChart3, GAMI: Coins, CENTS: CircleDollarSign,
};

export default function Home() {
  const { address, isConnected } = useAccount();
  const { data: avaxBal, refetch: refetchAvax } = useBalance({ address });
  const { connectWallet, disconnectWallet, setAvaxBalance, setAllBalances } = useKaivaxStore();

  const [showModal,  setShowModal]  = useState(false);
  const [tickerOff,  setTickerOff]  = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [copied,     setCopied]     = useState(false);
  const [agentOpen,  setAgentOpen]  = useState(false);
  const [agentQ,     setAgentQ]     = useState('');
  const [agentA,     setAgentA]     = useState('');
  const [agentBusy,  setAgentBusy]  = useState(false);
  const agentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    isConnected && address ? connectWallet('metamask', address) : disconnectWallet();
  }, [isConnected, address]);

  useEffect(() => {
    if (avaxBal) setAvaxBalance(Number(formatUnits(avaxBal.value, avaxBal.decimals)));
  }, [avaxBal]);

  const contractCalls = buildCalls(address);
  const { data: tokenData, refetch: refetchTokens } = useReadContracts({ contracts: contractCalls });

  const tokenBals: Record<string, number> = (() => {
    const out: Record<string, number> = {};
    ECOSYSTEM_TOKENS.filter(t => t.address).forEach((t, i) => {
      const r = tokenData?.[i];
      out[t.symbol.toLowerCase()] = r?.status === 'success' && r.result !== undefined
        ? Number(formatUnits(r.result as bigint, 18)) : 0;
    });
    ECOSYSTEM_TOKENS.filter(t => !t.address).forEach(t => { out[t.symbol.toLowerCase()] = 0; });
    return out;
  })();

  useEffect(() => {
    if (isConnected)
      setAllBalances({
        nvr: tokenBals.nvr ?? 0, ybob: tokenBals.ybob ?? 0,
        ytoken: tokenBals.ytoken ?? 0, ygold: tokenBals.ygold ?? 0,
        gami: tokenBals.gami ?? 0, cents: tokenBals.cents ?? 0,
      });
  }, [JSON.stringify(tokenBals), isConnected]);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await Promise.allSettled([refetchAvax(), refetchTokens()]);
    setRefreshing(false);
  };

  useEffect(() => {
    const id = setInterval(() => setTickerOff(o => (o - 1) % 800), 26);
    return () => clearInterval(id);
  }, []);

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const avaxAmt  = avaxBal ? Number(formatUnits(avaxBal.value, avaxBal.decimals)) : 0;
  const allTokens = [
    { symbol: 'AVAX',  value: avaxAmt,                                color: '#10b981', deployed: true  },
    ...ECOSYSTEM_TOKENS.map(t => ({
      symbol: t.symbol,
      value: tokenBals[t.symbol.toLowerCase()] ?? 0,
      color: t.color,
      deployed: !!t.address,
    })),
  ];

  const totalUsd = (
    avaxAmt                        * 26.00 +
    (tokenBals.ybob   ?? 0)        *  1.00 +
    (tokenBals.nvr    ?? 0)        *  0.12 +
    (tokenBals.ygold  ?? 0)        *  2.01 +
    (tokenBals.ytoken ?? 0)        *  0.27 +
    (tokenBals.gami   ?? 0)        *  0.056 +
    (tokenBals.cents  ?? 0)        *  0.009
  );

  const askAgent = async () => {
    if (!agentQ.trim() || agentBusy) return;
    setAgentBusy(true); setAgentA('');
    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: agentQ, rag: true, stream: false }),
      });
      const d = await r.json();
      setAgentA(d.text || d.response || 'No answer returned.');
    } catch {
      setAgentA('Agent offline. Start the server.');
    } finally {
      setAgentBusy(false);
    }
  };

  return (
    <main style={{
      minHeight: '100dvh',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-sans)',
      position: 'relative',
    }}>

      {/* ── Ambient depth orbs (no background override — image shows) ── */}
      <div aria-hidden style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
      }}>
        <div style={{
          position: 'absolute', top: '8%', right: '-12%',
          width: 420, height: 420, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 68%)',
          animation: 'orb-drift-a 12s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '30%', left: '-10%',
          width: 340, height: 340, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 68%)',
          animation: 'orb-drift-b 15s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', top: '55%', right: '5%',
          width: 220, height: 220, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 68%)',
          animation: 'orb-drift-a 18s ease-in-out infinite reverse',
        }} />
      </div>

      {/* ── TICKER ── */}
      <div className="ticker-wrap" style={{ padding: '6px 0', position: 'relative', zIndex: 5 }}>
        <div style={{
          display: 'inline-flex', gap: 32, paddingLeft: 16,
          transform: `translateX(${tickerOff}px)`,
          whiteSpace: 'nowrap', transition: 'none',
        }}>
          {[...TICKER_TOKENS, ...TICKER_TOKENS, ...TICKER_TOKENS].map((t, i) => (
            <span key={i} style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.3 }}>
              <span style={{ color: 'var(--text-dim)' }}>{t.s} </span>
              <span style={{ color: 'var(--white-70)' }}>{t.p} </span>
              <span style={{ color: 'var(--green)', fontWeight: 800 }}>{t.c}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── HEADER ── */}
      <motion.header
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        style={{
          position: 'relative', zIndex: 5,
          padding: '20px 18px 0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Avatar */}
          <div className="float" style={{
            width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(16,185,129,0.30) 0%, rgba(4,78,59,0.60) 100%)',
            backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 900, color: '#6ee7b7',
            boxShadow: '0 0 22px rgba(16,185,129,0.28), 0 0 0 1px rgba(16,185,129,0.20) inset',
          }}>A</div>

          <div>
            <p style={{ fontSize: 10, color: 'var(--text-dim)', margin: '0 0 2px', letterSpacing: 1.3, textTransform: 'uppercase', fontWeight: 700 }}>
              Good day
            </p>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 1px', color: 'var(--white)', letterSpacing: '-0.5px' }}>
              AUSTIN NAMUYE
            </h1>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
              @drekahshi · Kenya
            </p>
          </div>
        </div>

        {/* Connect pill */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 15px', borderRadius: 999, cursor: 'pointer', border: 'none',
            background: 'rgba(16,185,129,0.12)',
            backdropFilter: 'blur(14px)',
            boxShadow: '0 0 0 1px rgba(16,185,129,0.28) inset, 0 4px 18px rgba(0,0,0,0.30)',
            color: 'var(--green)',
            fontSize: 11, fontWeight: 800,
          }}
        >
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: isConnected ? 'var(--green)' : 'var(--green-dark)',
            boxShadow: isConnected ? '0 0 8px var(--green)' : 'none',
            animation: isConnected ? 'pulse-dot 2s ease-in-out infinite' : 'none',
          }} />
          {isConnected ? `${address?.slice(0,6)}…${address?.slice(-4)}` : 'Connect Wallet'}
        </motion.button>
      </motion.header>

      {/* ── NETWORK STRIP ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        style={{
          position: 'relative', zIndex: 5,
          margin: '14px 18px 0',
          padding: '11px 15px',
          borderRadius: 14,
          background: 'rgba(16,185,129,0.06)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 0 0 1px rgba(16,185,129,0.14) inset, 0 4px 20px rgba(0,0,0,0.25)',
          display: 'flex', alignItems: 'center', gap: 11,
        }}
      >
        <div style={{
          width: 34, height: 34, borderRadius: 11,
          background: 'rgba(16,185,129,0.14)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 900, color: '#10b981', flexShrink: 0,
          boxShadow: '0 0 12px rgba(16,185,129,0.20)',
        }}>K</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--green)', margin: 0 }}>
            Avalanche C-Chain · Fuji Testnet
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
            6 Ecosystem Tokens · DeFi Vaults · DAO
          </p>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--green)',
              opacity: 0.4 + i * 0.22,
              animation: `pulse-gold ${0.9 + i * 0.22}s ease-in-out infinite`,
            }} />
          ))}
        </div>
      </motion.div>

      {/* ── PORTFOLIO HERO ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.18, duration: 0.45 }}
        style={{
          position: 'relative', zIndex: 5,
          margin: '14px 18px',
          borderRadius: 26,
          padding: '22px 20px 18px',
          background: 'linear-gradient(145deg, rgba(12,24,18,0.65) 0%, rgba(8,8,16,0.58) 100%)',
          backdropFilter: 'blur(28px) saturate(1.8)',
          boxShadow:
            '0 1px 0 rgba(255,255,255,0.08) inset, 0 0 0 0.5px rgba(16,185,129,0.12) inset, 0 24px 60px rgba(0,0,0,0.45), 0 0 80px rgba(16,185,129,0.06)',
          overflow: 'hidden',
        }}
      >
        {/* Subtle inner glow blob */}
        <div style={{
          position: 'absolute', top: -50, right: -50, width: 180, height: 180,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.14) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -40, left: -40, width: 130, height: 130,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Value */}
        <div style={{ position: 'relative', marginBottom: 18 }}>
          <p className="label-caps" style={{ marginBottom: 5 }}>Portfolio Value</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{
              fontSize: 48, fontWeight: 900, letterSpacing: -2,
              color: isConnected ? 'var(--white)' : 'rgba(255,255,255,0.18)',
              lineHeight: 1,
            }}>
              ${isConnected ? totalUsd.toFixed(2) : '0.00'}
            </span>
            {isConnected && totalUsd > 0 && (
              <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 800 }}>+0.00%</span>
            )}
          </div>
        </div>

        {isConnected ? (
          <>
            {/* Token strip — no boxes, just glowing pills */}
            <div style={{ overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8, paddingBottom: 2, minWidth: 'max-content' }}>
                {allTokens.map(b => {
                  const Icon = TOKEN_ICON[b.symbol] || Coins;
                  return (
                    <motion.div
                      key={b.symbol}
                      whileHover={{ y: -3, scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        minWidth: 76, padding: '10px 10px',
                        borderRadius: 16, textAlign: 'center',
                        background: `linear-gradient(145deg, ${b.color}10 0%, rgba(6,6,10,0.50) 100%)`,
                        backdropFilter: 'blur(12px)',
                        boxShadow: `0 0 0 0.5px ${b.color}22 inset, 0 4px 16px rgba(0,0,0,0.30)`,
                        position: 'relative', cursor: 'default',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 5 }}>
                        <Icon size={16} color={b.color} strokeWidth={1.8} />
                      </div>
                      <p style={{ fontSize: 10, color: 'var(--text-dim)', margin: '0 0 2px', fontWeight: 800, letterSpacing: 0.4 }}>
                        {b.symbol}
                      </p>
                      <p style={{ fontSize: 14, fontWeight: 900, color: b.color, margin: 0 }}>
                        {b.value >= 1000 ? `${(b.value/1000).toFixed(1)}K`
                          : b.value >= 0.001 ? b.value.toFixed(3) : '0.000'}
                      </p>
                      {!b.deployed && (
                        <div style={{ position: 'absolute', top: 3, right: 5, fontSize: 7, color: 'var(--white-20)', fontWeight: 700 }}>
                          SOON
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Address row */}
            <div style={{ display: 'flex', gap: 7 }}>
              <div style={{
                flex: 1,
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 0 0 0.5px rgba(255,255,255,0.07) inset',
                borderRadius: 11, padding: '7px 12px',
                fontFamily: 'monospace', fontSize: 10,
                color: 'rgba(255,255,255,0.40)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{address}</div>
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={copyAddress}
                style={{
                  padding: '7px 12px', borderRadius: 11, border: 'none', cursor: 'pointer',
                  background: copied ? 'rgba(34,197,94,0.14)' : 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: copied ? '0 0 12px rgba(34,197,94,0.25)' : '0 0 0 0.5px rgba(255,255,255,0.07) inset',
                  color: copied ? 'var(--green)' : 'rgba(255,255,255,0.40)',
                  fontSize: 11, fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 4,
                  transition: 'all 0.2s',
                }}
              >
                {copied ? 'Copied' : <Copy size={13} />}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={handleRefresh}
                style={{
                  padding: '7px 11px', borderRadius: 11, border: 'none', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)',
                  boxShadow: '0 0 0 0.5px rgba(255,255,255,0.07) inset',
                  color: 'rgba(255,255,255,0.40)',
                }}
              >
                <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              </motion.button>
            </div>
          </>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowModal(true)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 10,
              background: 'rgba(16,185,129,0.07)',
              backdropFilter: 'blur(14px)',
              boxShadow: '0 0 0 1px rgba(16,185,129,0.20) inset',
              borderRadius: 16, padding: '14px 0',
              cursor: 'pointer', color: 'var(--green)',
              fontSize: 13, fontWeight: 700, border: 'none',
            }}
          >
            <Wallet size={18} />
            Connect wallet to view balances
          </motion.button>
        )}
      </motion.div>

      {/* ── DASHBOARDS ── */}
      <section style={{ padding: '0 18px', marginBottom: 24, position: 'relative', zIndex: 5 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 }}>
          <p className="label-caps">Dashboards</p>
          <span className="badge badge-live">3 Active</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {DASHBOARDS.map((d, i) => {
            const Icon = d.icon;
            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.20 + i * 0.07, duration: 0.35 }}
                whileHover={{ x: 4 }}
              >
                <Link href={d.href} style={{ textDecoration: 'none' }}>
                  <div className="hover-shine" style={{
                    borderRadius: 18, padding: '15px 16px',
                    display: 'flex', alignItems: 'center', gap: 14,
                    background: `linear-gradient(110deg, ${d.color}09 0%, rgba(8,8,14,0.52) 100%)`,
                    backdropFilter: 'blur(20px)',
                    boxShadow: `0 0 0 0.5px ${d.color}18 inset, 0 8px 28px rgba(0,0,0,0.30)`,
                    transition: 'box-shadow 0.25s',
                  }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                      background: `${d.color}14`,
                      backdropFilter: 'blur(8px)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: `0 0 18px ${d.color}22`,
                    }}>
                      <Icon size={22} color={d.color} strokeWidth={1.8} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--white)', margin: '0 0 2px' }}>
                        {d.label}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {d.sub}
                      </p>
                    </div>
                    <ChevronRight size={16} color="rgba(255,255,255,0.18)" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── QUICK ACTIONS ── */}
      <section style={{ padding: '0 18px', marginBottom: 28, position: 'relative', zIndex: 5 }}>
        <p className="label-caps" style={{ marginBottom: 13 }}>Quick Actions</p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: 10,
          }}
          className="quick-grid"
        >
          {QUICK.map((a, i) => {
            const Icon = a.icon;
            return (
              <motion.div
                key={a.name}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 + i * 0.04 }}
                whileHover={{ y: -5, scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
              >
                <Link href={a.href} style={{ textDecoration: 'none' }}>
                  <div className="hover-shine" style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 10,
                    padding: '18px 10px',
                    borderRadius: 20, cursor: 'pointer',
                    background: 'rgba(6,6,12,0.42)',
                    backdropFilter: 'blur(18px)',
                    boxShadow: `0 0 0 0.5px ${a.color}18 inset, 0 6px 22px rgba(0,0,0,0.30)`,
                    transition: 'box-shadow 0.25s',
                  }}>
                    <div style={{
                      width: 50, height: 50, borderRadius: 15, flexShrink: 0,
                      background: `linear-gradient(145deg, ${a.bg} 0%, rgba(6,6,12,0.60) 100%)`,
                      backdropFilter: 'blur(10px)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: `0 4px 16px ${a.color}20, 0 0 0 0.5px ${a.color}25 inset`,
                      transition: 'transform 0.25s, box-shadow 0.25s',
                    }}>
                      <Icon size={23} color={a.color} strokeWidth={1.7} />
                    </div>
                    <span style={{
                      fontSize: 12, fontWeight: 700,
                      color: 'rgba(255,255,255,0.75)',
                      textAlign: 'center', lineHeight: 1.2,
                    }}>{a.name}</span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── FLOATING AGENT FAB ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.55 }}
        style={{ position: 'fixed', bottom: 88, right: 16, zIndex: 40 }}
      >
        <AnimatePresence>
          {agentOpen && (
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.92 }}
              transition={{ duration: 0.22 }}
              style={{
                position: 'absolute', bottom: 62, right: 0, width: 295,
                background: 'rgba(10,10,18,0.85)',
                backdropFilter: 'blur(28px) saturate(1.8)',
                borderRadius: 22,
                boxShadow: '0 0 0 0.5px rgba(16,185,129,0.22) inset, 0 20px 50px rgba(0,0,0,0.65)',
                overflow: 'hidden',
              }}
            >
              {/* Panel header */}
              <div style={{
                padding: '12px 14px',
                background: 'rgba(16,185,129,0.05)',
                boxShadow: '0 1px 0 rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#10b981,#064e3b)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 12px rgba(16,185,129,0.40)',
                  }}>
                    <Bot size={15} color="#fff" />
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 800, margin: 0, color: 'var(--white)' }}>KAI Intelligence</p>
                    <p style={{ fontSize: 9, color: 'var(--green)', margin: 0, fontWeight: 700 }}>● RAG Agent</p>
                  </div>
                </div>
                <button onClick={() => setAgentOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.40)', padding: 4 }}>
                  <X size={15} />
                </button>
              </div>

              {/* Quick asks */}
              <div style={{ padding: '10px 13px 0' }}>
                <p className="label-caps" style={{ marginBottom: 8 }}>Quick Ask</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
                  {[
                    'What tokens does KAI have?',
                    'Best yield opportunity now?',
                    'How do I get started with KAI?',
                    'Check ecosystem pool rates',
                  ].map(q => (
                    <motion.button
                      key={q}
                      whileHover={{ x: 3 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setAgentQ(q)}
                      style={{
                        textAlign: 'left', padding: '7px 11px', borderRadius: 10,
                        cursor: 'pointer', width: '100%', border: 'none',
                        background: agentQ === q ? 'rgba(16,185,129,0.10)' : 'rgba(255,255,255,0.04)',
                        backdropFilter: 'blur(8px)',
                        boxShadow: agentQ === q
                          ? '0 0 0 1px rgba(16,185,129,0.30) inset'
                          : '0 0 0 0.5px rgba(255,255,255,0.07) inset',
                        color: agentQ === q ? 'var(--green-bright)' : 'rgba(255,255,255,0.65)',
                        fontSize: 11, fontWeight: 500, lineHeight: 1.35, transition: 'all 0.15s',
                      }}
                    >{q}</motion.button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div style={{ padding: '0 13px 13px', display: 'flex', gap: 7 }}>
                <textarea
                  ref={agentRef}
                  value={agentQ}
                  onChange={e => setAgentQ(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), askAgent())}
                  placeholder="Ask KAI anything…"
                  rows={2}
                  style={{
                    flex: 1, background: 'rgba(255,255,255,0.05)', border: 'none',
                    boxShadow: '0 0 0 1px rgba(255,255,255,0.08) inset',
                    borderRadius: 11, padding: '8px 10px',
                    fontSize: 12, color: 'var(--white)', outline: 'none',
                    fontFamily: 'inherit', resize: 'none', lineHeight: 1.4,
                    caretColor: 'var(--green)',
                  }}
                  onFocus={e => (e.target.style.boxShadow = '0 0 0 1.5px rgba(16,185,129,0.45) inset')}
                  onBlur={e  => (e.target.style.boxShadow = '0 0 0 1px rgba(255,255,255,0.08) inset')}
                />
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={askAgent}
                  disabled={agentBusy || !agentQ.trim()}
                  style={{
                    width: 38, height: 38, borderRadius: 11,
                    alignSelf: 'flex-end', flexShrink: 0, border: 'none',
                    background: agentQ.trim() && !agentBusy
                      ? 'linear-gradient(135deg,#10b981,#047857)'
                      : 'rgba(255,255,255,0.05)',
                    cursor: agentQ.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: agentQ.trim() && !agentBusy ? '0 0 14px rgba(16,185,129,0.40)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  <Activity size={16} color={agentQ.trim() && !agentBusy ? '#fff' : 'rgba(255,255,255,0.18)'} />
                </motion.button>
              </div>

              {/* Answer */}
              <AnimatePresence>
                {agentA && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ margin: '0 13px 13px', padding: '10px 12px',
                      background: 'rgba(16,185,129,0.06)',
                      boxShadow: '0 0 0 1px rgba(16,185,129,0.14) inset',
                      borderRadius: 11, fontSize: 11, color: 'rgba(255,255,255,0.70)',
                      lineHeight: 1.55, maxHeight: 130, overflowY: 'auto',
                    }}
                  >
                    <span dangerouslySetInnerHTML={{ __html: formatChat(agentA) }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAB button */}
        <motion.button
          whileHover={{ scale: 1.12, rotate: agentOpen ? 0 : 8 }}
          whileTap={{ scale: 0.88 }}
          onClick={() => setAgentOpen(v => !v)}
          className="glow-pulse"
          style={{
            width: 54, height: 54, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: agentOpen
              ? 'rgba(4,78,59,0.90)'
              : 'linear-gradient(135deg,#34d399 0%,#10b981 50%,#047857 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 24px rgba(16,185,129,0.52), 0 1px 0 rgba(255,255,255,0.18) inset',
            transition: 'all 0.22s',
            transform: agentOpen ? 'rotate(45deg) scale(0.90)' : 'none',
          }}
        >
          <Bot size={24} color="#fff" />
        </motion.button>
      </motion.div>

      {showModal && <WalletConnectModal onClose={() => setShowModal(false)} />}
    </main>
  );
}
