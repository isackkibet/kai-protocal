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
import {
  Trees, Store, Users, FlaskConical, ScanLine,
  Droplets, ImageIcon, Lock, Globe, LayoutGrid, Gift,
  Bot, Copy, RefreshCw, ChevronRight, TrendingUp,
  ShieldCheck, Coins, Wallet,
  CircleDollarSign, BarChart3, Activity, Zap, X,
} from 'lucide-react';

// ── Ticker tokens ─────────────────────────────────────────────────────────────
// (uses TICKER_TOKENS from lib)

// ── Quick actions ─────────────────────────────────────────────────────────────
const QUICK = [
  { name: 'AI Agent',   href: '/ai',         icon: Bot,        color: '#10b981', bg: 'rgba(16,185,129,0.10)' },
  { name: 'Playground', href: '/nuvari',     icon: FlaskConical,color:'#10b981', bg: 'rgba(16,185,129,0.10)' },
  { name: 'Scan & Pay', href: '/pay',        icon: ScanLine,   color: '#34d399', bg: 'rgba(52,211,153,0.10)' },
  { name: 'Securities', href: '/securities', icon: ShieldCheck,color: '#22d3ee', bg: 'rgba(34,211,238,0.10)' },
  { name: 'NFT Mkt',    href: '/connft',     icon: ImageIcon,  color: '#06b6d4', bg: 'rgba(6,182,212,0.10)' },
  { name: 'Pools',      href: '/pools',      icon: Droplets,   color: '#059669', bg: 'rgba(5,150,105,0.10)' },
  { name: 'Vaults',     href: '/vaults',     icon: Lock,       color: '#a3e635', bg: 'rgba(163,230,53,0.10)' },
  { name: 'Airdrop',    href: '/mine',       icon: Gift,       color: '#f59e0b', bg: 'rgba(245,158,11,0.10)' },
  { name: 'KAI Web',    href: '/kai',        icon: Globe,      color: '#10b981', bg: 'rgba(16,185,129,0.10)' },
  { name: 'TaaS',       href: '/taas',       icon: LayoutGrid, color: '#a855f7', bg: 'rgba(139,92,246,0.10)' },
];

// ── Dashboards ────────────────────────────────────────────────────────────────
const DASHBOARDS = [
  { id:'cfa',    href:'/cfa',    icon:Trees, color:'#10b981', label:'CFA Dashboard',     sub:'Community Forest · Treasury · Governance' },
  { id:'sme',    href:'/sme',    icon:Store, color:'#22d3ee', label:'SME Dashboard',      sub:'Digitise Cash · Loans · Inventory'         },
  { id:'saving', href:'/saving', icon:Users, color:'#059669', label:'Saving Group',       sub:'Pool Funds · Yield · Decentralised'        },
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

  const [showModal,    setShowModal]  = useState(false);
  const [tickerOff,   setTickerOff]  = useState(0);
  const [refreshing,  setRefreshing] = useState(false);
  const [copied,      setCopied]     = useState(false);
  const [agentOpen,   setAgentOpen]  = useState(false);
  const [agentQ,      setAgentQ]     = useState('');
  const [agentA,      setAgentA]     = useState('');
  const [agentBusy,   setAgentBusy]  = useState(false);
  const agentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { isConnected && address ? connectWallet('metamask', address) : disconnectWallet(); }, [isConnected, address]);
  useEffect(() => { if (avaxBal) setAvaxBalance(Number(formatUnits(avaxBal.value, avaxBal.decimals))); }, [avaxBal]);

  const contractCalls = buildCalls(address);
  const { data: tokenData, refetch: refetchTokens } = useReadContracts({ contracts: contractCalls });

  const tokenBals: Record<string, number> = (() => {
    const out: Record<string, number> = {};
    ECOSYSTEM_TOKENS.filter(t => t.address).forEach((t, i) => {
      const r = tokenData?.[i];
      out[t.symbol.toLowerCase()] = r?.status === 'success' && r.result !== undefined ? Number(formatUnits(r.result as bigint, 18)) : 0;
    });
    ECOSYSTEM_TOKENS.filter(t => !t.address).forEach(t => { out[t.symbol.toLowerCase()] = 0; });
    return out;
  })();

  useEffect(() => {
    if (isConnected) setAllBalances({ nvr: tokenBals.nvr ?? 0, ybob: tokenBals.ybob ?? 0, ytoken: tokenBals.ytoken ?? 0, ygold: tokenBals.ygold ?? 0, gami: tokenBals.gami ?? 0, cents: tokenBals.cents ?? 0 });
  }, [JSON.stringify(tokenBals), isConnected]);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await Promise.allSettled([refetchAvax(), refetchTokens()]);
    setRefreshing(false);
  };

  useEffect(() => { const id = setInterval(() => setTickerOff(o => (o - 1) % 600), 28); return () => clearInterval(id); }, []);

  const copyAddress = () => { if (!address) return; navigator.clipboard.writeText(address); setCopied(true); setTimeout(() => setCopied(false), 1600); };

  const avaxAmt = avaxBal ? Number(formatUnits(avaxBal.value, avaxBal.decimals)) : 0;

  const allTokens = [
    { symbol: 'AVAX',  value: avaxAmt,                              color: '#e84142', deployed: true  },
    ...ECOSYSTEM_TOKENS.map(t => ({ symbol: t.symbol, value: tokenBals[t.symbol.toLowerCase()] ?? 0, color: t.color, deployed: !!t.address })),
  ];

  const totalUsd = (
    avaxAmt * 26.0 +
    (tokenBals.ybob   ?? 0) * 1.00 +
    (tokenBals.nvr    ?? 0) * 0.12 +
    (tokenBals.ygold  ?? 0) * 2.01 +
    (tokenBals.ytoken ?? 0) * 0.27 +
    (tokenBals.gami   ?? 0) * 0.056 +
    (tokenBals.cents  ?? 0) * 0.009
  );

  const askAgent = async () => {
    if (!agentQ.trim() || agentBusy) return;
    setAgentBusy(true); setAgentA('');
    try {
      const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: agentQ, rag: true, stream: false }) });
      const d = await r.json();
      setAgentA(d.text || d.response || 'No answer returned.');
    } catch { setAgentA('Agent offline — start the server.'); }
    finally { setAgentBusy(false); }
  };

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--bg)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>

      {/* ── TICKER ─────────────────────────────────────── */}
      <div className="ticker-wrap" style={{ padding: '5px 0' }}>
        <div style={{ display: 'inline-flex', gap: 28, paddingLeft: 16, transform: `translateX(${tickerOff}px)`, whiteSpace: 'nowrap', transition: 'none' }}>
          {[...TICKER_TOKENS, ...TICKER_TOKENS, ...TICKER_TOKENS].map((t, i) => (
            <span key={i} style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.3 }}>
              <span style={{ color: 'var(--text-dim)' }}>{t.s} </span>
              <span style={{ color: 'var(--white-70)' }}>{t.p} </span>
              <span style={{ color: 'var(--green)', fontWeight: 800 }}>{t.c}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── HEADER ─────────────────────────────────────── */}
      <header style={{ padding: '18px 18px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          {/* Avatar */}
          <div style={{
            width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
            border: '1.5px solid rgba(16,185,129,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 19, fontWeight: 900, color: '#6ee7b7',
            boxShadow: '0 0 18px rgba(16,185,129,0.22)',
          }}>A</div>
          <div>
            <p style={{ fontSize: 9, color: 'var(--text-dim)', margin: '0 0 1px', letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 700 }}>Good day</p>
            <h1 style={{ fontSize: 16, fontWeight: 900, margin: '0 0 1px', color: 'var(--white)' }}>AUSTIN NAMUYE</h1>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>@drekahshi · 🇰🇪 Kenya</p>
          </div>
        </div>

        {/* Connect button */}
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 14px', borderRadius: 999, cursor: 'pointer', border: 'none',
            background: isConnected
              ? 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(5,150,105,0.12))'
              : 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(4,120,88,0.12))',
            boxShadow: `0 0 0 1px ${isConnected ? 'rgba(16,185,129,0.35)' : 'rgba(16,185,129,0.35)'}`,
            color: isConnected ? 'var(--green)' : 'var(--green)',
            fontSize: 11, fontWeight: 800,
          }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: isConnected ? 'var(--green)' : 'var(--red)', boxShadow: `0 0 8px ${isConnected ? 'var(--green)' : 'var(--red)'}` }} />
          {isConnected ? `${address?.slice(0,6)}…${address?.slice(-4)}` : 'Connect Wallet'}
        </button>
      </header>

      {/* ── NETWORK STRIP ──────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={{ margin: '14px 18px 0', padding: '10px 14px', borderRadius: 12, background: 'rgba(16,185,129,0.055)', border: '1px solid rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>⛰️</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--green)', margin: 0 }}>Avalanche C-Chain · Fuji Testnet</p>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>6 Ecosystem Tokens · DeFi Vaults · DAO</p>
        </div>
        <div style={{ display: 'flex', gap: 3 }}>
          {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', opacity: 0.4 + i*0.2, animation: `pulse-gold ${1+i*0.25}s ease-in-out infinite` }} />)}
        </div>
      </motion.div>

      {/* ── PORTFOLIO CARD ─────────────────────────────── */}
      <div className="glass-elevated" style={{ margin: '14px 18px', borderRadius: 22, padding: '20px 18px', position: 'relative', overflow: 'hidden' }}>
        {/* Green glow blob */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -30, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(5,150,105,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Portfolio value */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <p className="label-caps" style={{ marginBottom: 4 }}>Portfolio Value</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 34, fontWeight: 900, letterSpacing: -1.5, color: isConnected ? 'var(--white)' : 'var(--white-20)' }}>
              ${isConnected ? totalUsd.toFixed(2) : '0.00'}
            </span>
            {isConnected && totalUsd > 0 && <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700 }}>+0.00%</span>}
          </div>
        </div>

        {isConnected ? (
          <>
            {/* Token strip */}
            <div style={{ overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 8, paddingBottom: 2, minWidth: 'max-content' }}>
                {allTokens.map(b => {
                  const Icon = TOKEN_ICON[b.symbol] || Coins;
                  return (
                    <div key={b.symbol} style={{
                      background: 'rgba(255,255,255,0.04)', borderRadius: 14,
                      border: `1px solid ${b.color}28`,
                      padding: '9px 11px', textAlign: 'center', minWidth: 72, flexShrink: 0,
                      position: 'relative',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
                        <Icon size={15} color={b.color} strokeWidth={1.8} />
                      </div>
                      <p style={{ fontSize: 9, color: 'var(--text-dim)', margin: '0 0 2px', fontWeight: 800, letterSpacing: 0.4 }}>{b.symbol}</p>
                      <p style={{ fontSize: 13, fontWeight: 900, color: b.color, margin: 0 }}>
                        {b.value >= 1000 ? `${(b.value/1000).toFixed(1)}K` : b.value >= 0.001 ? b.value.toFixed(3) : '0.000'}
                      </p>
                      {!b.deployed && <div style={{ position: 'absolute', top: 3, right: 4, fontSize: 7, color: 'var(--white-20)', fontWeight: 700 }}>SOON</div>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Address row */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
              <div style={{
                flex: 1, background: 'var(--white-04)', border: '1px solid var(--white-08)',
                borderRadius: 10, padding: '7px 11px', fontFamily: 'monospace',
                fontSize: 10, color: 'var(--white-45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{address}</div>
              <button onClick={copyAddress} style={{ padding: '7px 11px', borderRadius: 10, background: copied ? 'rgba(34,197,94,0.12)' : 'var(--white-04)', border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'var(--white-08)'}`, cursor: 'pointer', color: copied ? 'var(--green)' : 'var(--white-45)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                {copied ? '✓' : <Copy size={13} />}
              </button>
              <button onClick={handleRefresh} style={{ padding: '7px 11px', borderRadius: 10, background: 'var(--white-04)', border: '1px solid var(--white-08)', cursor: 'pointer', color: 'var(--white-45)' }}>
                <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              </button>
            </div>
          </>
        ) : (
          <button onClick={() => setShowModal(true)} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
            background: 'rgba(232,65,66,0.08)', border: '1px dashed rgba(232,65,66,0.30)',
            borderRadius: 14, padding: '13px 0', cursor: 'pointer', color: 'var(--red)',
            fontSize: 13, fontWeight: 700,
          }}>
            <Wallet size={18} /> Connect wallet to view balances
          </button>
        )}
      </div>

      {/* ── DASHBOARDS ─────────────────────────────────── */}
      <section style={{ padding: '0 18px', marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p className="label-caps">Dashboards</p>
          <span className="badge badge-live">3 Active</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {DASHBOARDS.map(d => {
            const Icon = d.icon;
            return (
              <Link key={d.id} href={d.href} style={{ textDecoration: 'none' }}>
                <div className="glass" style={{
                  borderRadius: 16, padding: '13px 15px',
                  display: 'flex', alignItems: 'center', gap: 13,
                  borderColor: `${d.color}20`,
                  background: `linear-gradient(90deg, ${d.color}07 0%, rgba(14,14,18,0.80) 100%)`,
                }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 13, flexShrink: 0,
                    background: `${d.color}12`,
                    border: `1px solid ${d.color}28`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={21} color={d.color} strokeWidth={1.8} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--white)', margin: '0 0 2px' }}>{d.label}</p>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.sub}</p>
                  </div>
                  <ChevronRight size={16} color="var(--white-20)" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── QUICK ACTIONS ──────────────────────────────── */}
      <section style={{ padding: '0 18px', marginBottom: 24 }}>
        <p className="label-caps" style={{ marginBottom: 12 }}>Quick Actions</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
          {QUICK.map(a => {
            const Icon = a.icon;
            return (
              <Link key={a.name} href={a.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9,
                  padding: '17px 12px', borderRadius: 18, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${a.color}18`,
                  transition: 'all 0.2s',
                  boxShadow: `0 2px 16px rgba(0,0,0,0.30)`,
                }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                    background: `linear-gradient(145deg, ${a.bg} 0%, rgba(14,14,18,0.80) 100%)`,
                    border: `1px solid ${a.color}28`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 4px 14px ${a.color}18`,
                  }}>
                    <Icon size={22} color={a.color} strokeWidth={1.8} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--white-70)', textAlign: 'center', lineHeight: 1.2 }}>{a.name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── FLOATING AGENT ─────────────────────────────── */}
      <div style={{ position: 'fixed', bottom: 84, right: 16, zIndex: 40 }}>
        {agentOpen && (
          <div className="scale-in" style={{
            position: 'absolute', bottom: 58, right: 0, width: 290,
            background: 'var(--surface-2)', border: '1px solid rgba(232,65,66,0.25)',
            borderRadius: 20, boxShadow: '0 16px 48px rgba(0,0,0,0.60)', overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(232,65,66,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(232,65,66,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#e84142,#7c1d1d)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={14} color="#fff" />
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 800, margin: 0, color: 'var(--white)' }}>KAI Intelligence</p>
                  <p style={{ fontSize: 9, color: 'var(--red)', margin: 0, fontWeight: 700 }}>● RAG Agent</p>
                </div>
              </div>
              <button onClick={() => setAgentOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--white-45)' }}><X size={16} /></button>
            </div>

            {/* Quick asks */}
            <div style={{ padding: '10px 12px 0' }}>
              <p className="label-caps" style={{ marginBottom: 7 }}>Quick Ask</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
                {[
                  'What tokens does KAI have?',
                  'Best yield opportunity now?',
                  'How do I get started with KAI?',
                  'Check ecosystem pool rates',
                ].map(q => (
                  <button key={q} onClick={() => setAgentQ(q)} style={{
                    textAlign: 'left', padding: '7px 10px', borderRadius: 9, cursor: 'pointer', width: '100%',
                    background: 'var(--white-04)', border: '1px solid var(--white-08)',
                    color: 'var(--white-70)', fontSize: 11, fontWeight: 500, lineHeight: 1.3,
                    transition: 'all 0.15s',
                  }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div style={{ padding: '0 12px 12px', display: 'flex', gap: 7 }}>
              <textarea
                ref={agentRef}
                value={agentQ}
                onChange={e => setAgentQ(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), askAgent())}
                placeholder="Ask KAI anything…"
                rows={2}
                style={{
                  flex: 1, background: 'var(--white-04)', border: '1px solid var(--white-08)',
                  borderRadius: 10, padding: '8px 10px', fontSize: 12, color: 'var(--white)',
                  outline: 'none', fontFamily: 'inherit', resize: 'none', lineHeight: 1.4,
                  caretColor: 'var(--red)',
                }}
                onFocus={e => (e.target.style.borderColor = 'rgba(232,65,66,0.45)')}
                onBlur={e  => (e.target.style.borderColor = 'var(--white-08)')}
              />
              <button onClick={askAgent} disabled={agentBusy || !agentQ.trim()} style={{
                width: 38, height: 38, borderRadius: 10, alignSelf: 'flex-end', flexShrink: 0,
                background: agentQ.trim() && !agentBusy ? 'linear-gradient(135deg,#e84142,#b91c1c)' : 'var(--white-04)',
                border: 'none', cursor: agentQ.trim() ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}>
                <Activity size={16} color={agentQ.trim() && !agentBusy ? '#fff' : 'var(--white-20)'} />
              </button>
            </div>

            {/* Answer */}
            {agentA && (
              <div style={{ margin: '0 12px 12px', padding: '10px 12px', background: 'rgba(232,65,66,0.05)', border: '1px solid rgba(232,65,66,0.15)', borderRadius: 10, fontSize: 11, color: 'var(--white-70)', lineHeight: 1.55, maxHeight: 130, overflowY: 'auto' }}>
                {agentA}
              </div>
            )}
          </div>
        )}

        {/* FAB */}
        <button
          onClick={() => setAgentOpen(v => !v)}
          className="glow-pulse"
          style={{
            width: 52, height: 52, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: agentOpen ? 'rgba(185,28,28,0.9)' : 'linear-gradient(135deg,#ff5a5b 0%,#e84142 50%,#b91c1c 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(232,65,66,0.50), 0 1px 0 rgba(255,255,255,0.20) inset',
            transition: 'all 0.2s',
            transform: agentOpen ? 'scale(0.90) rotate(45deg)' : 'scale(1)',
          }}>
          <Bot size={24} color="#fff" />
        </button>
      </div>

      {showModal && <WalletConnectModal onClose={() => setShowModal(false)} />}
    </main>
  );
}
