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

/* ─── shared text-shadow so words pop over background image ─── */
const readable: React.CSSProperties = {
  textShadow: '0 1px 8px rgba(0,0,0,0.85), 0 0 24px rgba(0,0,0,0.60)',
};
const readableSm: React.CSSProperties = {
  textShadow: '0 1px 5px rgba(0,0,0,0.90)',
};

/* ─── highlight spans ──────────────────────────────────────── */
const HL = {
  green:  { color: '#34d399', fontWeight: 900, textShadow: '0 0 16px rgba(52,211,153,0.55)' } as React.CSSProperties,
  cyan:   { color: '#22d3ee', fontWeight: 900, textShadow: '0 0 16px rgba(34,211,238,0.50)' } as React.CSSProperties,
  amber:  { color: '#fbbf24', fontWeight: 900, textShadow: '0 0 16px rgba(251,191,36,0.50)' } as React.CSSProperties,
  purple: { color: '#c084fc', fontWeight: 900, textShadow: '0 0 16px rgba(192,132,252,0.45)' } as React.CSSProperties,
  white:  { color: '#ffffff', fontWeight: 900, textShadow: '0 0 10px rgba(255,255,255,0.35)' } as React.CSSProperties,
};

const QUICK = [
  { name: 'AI Agent',    href: '/ai',         icon: Bot,         color: '#10b981', bg: 'rgba(16,185,129,0.14)' },
  { name: 'Playground',  href: '/nuvari',      icon: FlaskConical,color: '#34d399', bg: 'rgba(52,211,153,0.14)' },
  { name: 'Scan & Pay',  href: '/pay',         icon: ScanLine,    color: '#22d3ee', bg: 'rgba(34,211,238,0.14)' },
  { name: 'Securities',  href: '/securities',  icon: ShieldCheck, color: '#06b6d4', bg: 'rgba(6,182,212,0.14)'  },
  { name: 'NFT Mkt',     href: '/connft',      icon: ImageIcon,   color: '#a855f7', bg: 'rgba(168,85,247,0.14)' },
  { name: 'Pools',       href: '/pools',       icon: Droplets,    color: '#059669', bg: 'rgba(5,150,105,0.14)'  },
  { name: 'Vaults',      href: '/vaults',      icon: Lock,        color: '#a3e635', bg: 'rgba(163,230,53,0.14)' },
  { name: 'Airdrop',     href: '/mine',        icon: Gift,        color: '#f59e0b', bg: 'rgba(245,158,11,0.14)' },
  { name: 'KAI Web',     href: '/kai',         icon: Globe,       color: '#10b981', bg: 'rgba(16,185,129,0.14)' },
  { name: 'TaaS',        href: '/taas',        icon: LayoutGrid,  color: '#ec4899', bg: 'rgba(236,72,153,0.14)' },
];

const DASHBOARDS = [
  { id:'cfa',    href:'/cfa',    icon:Trees, color:'#10b981',
    label:'CFA Dashboard',
    highlight:'Community Forest',
    sub:'Treasury · Governance' },
  { id:'sme',    href:'/sme',    icon:Store, color:'#22d3ee',
    label:'SME Dashboard',
    highlight:'Digitise Cash',
    sub:'Loans · Inventory' },
  { id:'saving', href:'/saving', icon:Users, color:'#a855f7',
    label:'Saving Group',
    highlight:'Pool Funds & Yield',
    sub:'Decentralised Savings' },
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
    { symbol:'AVAX',  value: avaxAmt,  color:'#10b981', deployed: true  },
    ...ECOSYSTEM_TOKENS.map(t => ({
      symbol: t.symbol,
      value: tokenBals[t.symbol.toLowerCase()] ?? 0,
      color: t.color,
      deployed: !!t.address,
    })),
  ];

  const totalUsd = (
    avaxAmt                 * 26.00 +
    (tokenBals.ybob  ?? 0)  *  1.00 +
    (tokenBals.nvr   ?? 0)  *  0.12 +
    (tokenBals.ygold ?? 0)  *  2.01 +
    (tokenBals.ytoken?? 0)  *  0.27 +
    (tokenBals.gami  ?? 0)  *  0.056 +
    (tokenBals.cents ?? 0)  *  0.009
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
    <main style={{ minHeight: '100dvh', color: '#fff', fontFamily: 'var(--font-sans)', position: 'relative' }}>

      {/* ── Fixed ambient orbs ── */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position:'absolute', top:'8%', right:'-12%', width:420, height:420, borderRadius:'50%', background:'radial-gradient(circle,rgba(16,185,129,0.11) 0%,transparent 68%)', animation:'orb-drift-a 12s ease-in-out infinite' }} />
        <div style={{ position:'absolute', bottom:'30%', left:'-10%', width:340, height:340, borderRadius:'50%', background:'radial-gradient(circle,rgba(6,182,212,0.08) 0%,transparent 68%)', animation:'orb-drift-b 15s ease-in-out infinite' }} />
        <div style={{ position:'absolute', top:'55%', right:'5%', width:220, height:220, borderRadius:'50%', background:'radial-gradient(circle,rgba(168,85,247,0.07) 0%,transparent 68%)', animation:'orb-drift-a 18s ease-in-out infinite reverse' }} />
      </div>

      {/* ── TICKER ── */}
      <div className="ticker-wrap" style={{ padding:'7px 0', position:'relative', zIndex:5 }}>
        <div style={{ display:'inline-flex', gap:36, paddingLeft:16, transform:`translateX(${tickerOff}px)`, whiteSpace:'nowrap', transition:'none' }}>
          {[...TICKER_TOKENS,...TICKER_TOKENS,...TICKER_TOKENS].map((t,i) => (
            <span key={i} style={{ fontSize:11, fontWeight:600, letterSpacing:0.4 }}>
              <span style={{ color:'rgba(255,255,255,0.45)' }}>{t.s} </span>
              <span style={{ color:'rgba(255,255,255,0.85)', fontWeight:700 }}>{t.p} </span>
              <span style={{ color:'#34d399', fontWeight:900 }}>{t.c}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════
          DESKTOP TWO-COLUMN GRID
          On ≥1024px: left col = header+portfolio+hero text
                      right col = dashboards+quick actions
          On <1024px: single column stack as before
          ════════════════════════════════════════════ */}
      <div style={{
        display: 'grid',
        /* mobile: 1 col — desktop: 2 equal cols */
        gridTemplateColumns: 'repeat(1, 1fr)',
        maxWidth: 1440,
        margin: '0 auto',
        padding: '0 0 100px',
      }}
        /* Can't do real @media in inline style, so we use a global class
           that's already defined in globals.css for the grid switch */
        className="home-page-grid"
      >
        {/* ══ LEFT COLUMN ══ */}
        <div style={{ minWidth: 0 }}>

          {/* HEADER */}
          <motion.header
            initial={{ opacity:0, y:-14 }}
            animate={{ opacity:1, y:0 }}
            transition={{ delay:0.05, duration:0.4 }}
            style={{ position:'relative', zIndex:5, padding:'24px 20px 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}
          >
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div className="float" style={{
                width:54, height:54, borderRadius:'50%', flexShrink:0,
                background:'linear-gradient(135deg,rgba(16,185,129,0.35) 0%,rgba(4,78,59,0.65) 100%)',
                backdropFilter:'blur(14px)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:22, fontWeight:900, color:'#6ee7b7',
                boxShadow:'0 0 26px rgba(16,185,129,0.35), 0 0 0 1.5px rgba(16,185,129,0.28) inset',
              }}>A</div>

              <div>
                <p style={{ fontSize:10, color:'rgba(255,255,255,0.55)', margin:'0 0 2px', letterSpacing:1.4, textTransform:'uppercase', fontWeight:700, ...readableSm }}>
                  Good day
                </p>
                <h1 style={{ fontSize:'clamp(18px,2.5vw,28px)', fontWeight:900, margin:'0 0 2px', letterSpacing:'-0.5px', ...readable }}>
                  AUSTIN NAMUYE
                </h1>
                <p style={{ fontSize:'clamp(11px,1.1vw,13px)', color:'rgba(255,255,255,0.65)', margin:0, ...readableSm }}>
                  @drekahshi ·{' '}
                  <span style={HL.green}>Kenya</span>
                </p>
              </div>
            </div>

            {/* Connect wallet pill */}
            <motion.button
              whileHover={{ scale:1.06 }}
              whileTap={{ scale:0.95 }}
              onClick={() => setShowModal(true)}
              style={{
                display:'flex', alignItems:'center', gap:8,
                padding:'10px 18px', borderRadius:999, cursor:'pointer', border:'none',
                background:'rgba(16,185,129,0.14)',
                backdropFilter:'blur(16px)',
                boxShadow:'0 0 0 1.5px rgba(16,185,129,0.40) inset, 0 4px 20px rgba(0,0,0,0.40)',
                color:'#34d399',
                fontSize:'clamp(11px,1vw,13px)', fontWeight:900,
                ...readable,
              }}
            >
              <span style={{
                width:8, height:8, borderRadius:'50%', flexShrink:0,
                background: isConnected ? '#34d399' : '#047857',
                boxShadow: isConnected ? '0 0 10px #34d399' : 'none',
                animation: isConnected ? 'pulse-dot 2s ease-in-out infinite' : 'none',
              }} />
              {isConnected ? `${address?.slice(0,6)}…${address?.slice(-4)}` : 'Connect Wallet'}
            </motion.button>
          </motion.header>

          {/* NETWORK STRIP */}
          <motion.div
            initial={{ opacity:0, y:10 }}
            animate={{ opacity:1, y:0 }}
            transition={{ delay:0.15 }}
            style={{
              position:'relative', zIndex:5,
              margin:'16px 20px 0',
              padding:'12px 16px',
              borderRadius:16,
              background:'rgba(16,185,129,0.08)',
              backdropFilter:'blur(18px)',
              boxShadow:'0 0 0 1px rgba(16,185,129,0.22) inset, 0 4px 24px rgba(0,0,0,0.35)',
              display:'flex', alignItems:'center', gap:12,
            }}
          >
            <div style={{
              width:38, height:38, borderRadius:12, flexShrink:0,
              background:'rgba(16,185,129,0.18)', backdropFilter:'blur(8px)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:18, fontWeight:900, color:'#34d399',
              boxShadow:'0 0 16px rgba(16,185,129,0.30)',
            }}>K</div>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:'clamp(12px,1.1vw,14px)', fontWeight:900, margin:0, ...readable }}>
                <span style={HL.green}>Avalanche C-Chain</span>
                <span style={{ color:'rgba(255,255,255,0.70)', fontWeight:600 }}> · Fuji Testnet</span>
              </p>
              <p style={{ fontSize:'clamp(10px,0.9vw,12px)', color:'rgba(255,255,255,0.65)', margin:0, ...readableSm }}>
                <span style={HL.amber}>6 Ecosystem Tokens</span>
                <span style={{ color:'rgba(255,255,255,0.55)' }}> · DeFi Vaults · DAO</span>
              </p>
            </div>
            <div style={{ display:'flex', gap:4 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width:7, height:7, borderRadius:'50%', background:'#34d399', opacity:0.4+i*0.22, animation:`pulse-gold ${0.9+i*0.22}s ease-in-out infinite` }} />
              ))}
            </div>
          </motion.div>

          {/* PORTFOLIO HERO */}
          <motion.div
            initial={{ opacity:0, scale:0.97 }}
            animate={{ opacity:1, scale:1 }}
            transition={{ delay:0.18, duration:0.45 }}
            style={{
              position:'relative', zIndex:5,
              margin:'16px 20px',
              borderRadius:28,
              padding:'26px 22px 20px',
              background:'linear-gradient(145deg,rgba(10,20,16,0.72) 0%,rgba(6,6,14,0.65) 100%)',
              backdropFilter:'blur(30px) saturate(1.9)',
              boxShadow:'0 1px 0 rgba(255,255,255,0.10) inset, 0 0 0 0.5px rgba(16,185,129,0.16) inset, 0 28px 70px rgba(0,0,0,0.55), 0 0 100px rgba(16,185,129,0.07)',
              overflow:'hidden',
            }}
          >
            <div style={{ position:'absolute', top:-60, right:-60, width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle,rgba(16,185,129,0.16) 0%,transparent 70%)', pointerEvents:'none' }} />
            <div style={{ position:'absolute', bottom:-50, left:-50, width:150, height:150, borderRadius:'50%', background:'radial-gradient(circle,rgba(6,182,212,0.09) 0%,transparent 70%)', pointerEvents:'none' }} />

            {/* Portfolio label + value */}
            <div style={{ position:'relative', marginBottom:20 }}>
              <p style={{ fontSize:10, fontWeight:800, letterSpacing:1.6, textTransform:'uppercase', color:'rgba(255,255,255,0.55)', marginBottom:6, ...readableSm }}>
                Portfolio Value
              </p>
              <div style={{ display:'flex', alignItems:'baseline', gap:12 }}>
                <span style={{
                  fontSize:'clamp(38px,4.5vw,56px)', fontWeight:900, letterSpacing:-2,
                  color: isConnected ? '#fff' : 'rgba(255,255,255,0.20)',
                  lineHeight:1, ...readable,
                }}>
                  ${isConnected ? totalUsd.toFixed(2) : '0.00'}
                </span>
                {isConnected && totalUsd > 0 && (
                  <span style={{ fontSize:'clamp(12px,1.1vw,15px)', ...HL.green }}>+0.00%</span>
                )}
              </div>
              {!isConnected && (
                <p style={{ fontSize:'clamp(11px,1vw,13px)', color:'rgba(255,255,255,0.45)', marginTop:6, ...readableSm }}>
                  <span style={HL.green}>Connect your wallet</span> to see live balances
                </p>
              )}
            </div>

            {isConnected ? (
              <>
                {/* Token pills */}
                <div style={{ overflowX:'auto', scrollbarWidth:'none', marginBottom:18 }}>
                  <div style={{ display:'flex', gap:9, paddingBottom:2, minWidth:'max-content' }}>
                    {allTokens.map(b => {
                      const Icon = TOKEN_ICON[b.symbol] || Coins;
                      return (
                        <motion.div
                          key={b.symbol}
                          whileHover={{ y:-4, scale:1.06 }}
                          whileTap={{ scale:0.97 }}
                          style={{
                            minWidth:80, padding:'11px 11px',
                            borderRadius:18, textAlign:'center',
                            background:`linear-gradient(145deg,${b.color}12 0%,rgba(6,6,10,0.55) 100%)`,
                            backdropFilter:'blur(14px)',
                            boxShadow:`0 0 0 0.5px ${b.color}28 inset, 0 4px 18px rgba(0,0,0,0.35)`,
                            position:'relative', cursor:'default',
                          }}
                        >
                          <div style={{ display:'flex', justifyContent:'center', marginBottom:6 }}>
                            <Icon size={17} color={b.color} strokeWidth={1.8} />
                          </div>
                          <p style={{ fontSize:10, color:'rgba(255,255,255,0.55)', margin:'0 0 3px', fontWeight:800, letterSpacing:0.5, ...readableSm }}>
                            {b.symbol}
                          </p>
                          <p style={{ fontSize:15, fontWeight:900, color:b.color, margin:0, textShadow:`0 0 12px ${b.color}88` }}>
                            {b.value>=1000 ? `${(b.value/1000).toFixed(1)}K`
                              : b.value>=0.001 ? b.value.toFixed(3) : '0.000'}
                          </p>
                          {!b.deployed && (
                            <div style={{ position:'absolute', top:3, right:5, fontSize:7, color:'rgba(255,255,255,0.30)', fontWeight:700 }}>SOON</div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Address row */}
                <div style={{ display:'flex', gap:7 }}>
                  <div style={{
                    flex:1, background:'rgba(255,255,255,0.05)', backdropFilter:'blur(10px)',
                    boxShadow:'0 0 0 0.5px rgba(255,255,255,0.09) inset',
                    borderRadius:12, padding:'8px 13px',
                    fontFamily:'monospace', fontSize:10,
                    color:'rgba(255,255,255,0.55)',
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                  }}>{address}</div>
                  <motion.button whileTap={{ scale:0.93 }} onClick={copyAddress} style={{
                    padding:'8px 13px', borderRadius:12, border:'none', cursor:'pointer',
                    background: copied ? 'rgba(52,211,153,0.16)' : 'rgba(255,255,255,0.06)',
                    backdropFilter:'blur(10px)',
                    boxShadow: copied ? '0 0 14px rgba(52,211,153,0.30)' : '0 0 0 0.5px rgba(255,255,255,0.09) inset',
                    color: copied ? '#34d399' : 'rgba(255,255,255,0.55)',
                    fontSize:11, fontWeight:700,
                    display:'flex', alignItems:'center', gap:4, transition:'all 0.2s',
                  }}>
                    {copied ? 'Copied' : <Copy size={13} />}
                  </motion.button>
                  <motion.button whileTap={{ scale:0.93 }} onClick={handleRefresh} style={{
                    padding:'8px 12px', borderRadius:12, border:'none', cursor:'pointer',
                    background:'rgba(255,255,255,0.06)', backdropFilter:'blur(10px)',
                    boxShadow:'0 0 0 0.5px rgba(255,255,255,0.09) inset',
                    color:'rgba(255,255,255,0.55)',
                  }}>
                    <RefreshCw size={13} style={{ animation:refreshing ? 'spin 1s linear infinite' : 'none' }} />
                  </motion.button>
                </div>
              </>
            ) : (
              <motion.button
                whileHover={{ scale:1.02 }}
                whileTap={{ scale:0.97 }}
                onClick={() => setShowModal(true)}
                style={{
                  width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:11,
                  background:'rgba(16,185,129,0.09)', backdropFilter:'blur(16px)',
                  boxShadow:'0 0 0 1.5px rgba(16,185,129,0.30) inset, 0 0 30px rgba(16,185,129,0.10)',
                  borderRadius:18, padding:'16px 0',
                  cursor:'pointer', border:'none',
                  fontSize:'clamp(13px,1.1vw,15px)', fontWeight:800,
                  ...HL.green,
                }}
              >
                <Wallet size={20} />
                Connect Wallet to View Balances
              </motion.button>
            )}
          </motion.div>

          {/* KEY INFO BLURB — visible, bold, helpful */}
          <motion.div
            initial={{ opacity:0, y:12 }}
            animate={{ opacity:1, y:0 }}
            transition={{ delay:0.25 }}
            style={{
              position:'relative', zIndex:5,
              margin:'0 20px 20px',
              padding:'18px 20px',
              borderRadius:20,
              background:'linear-gradient(135deg,rgba(16,185,129,0.10) 0%,rgba(6,6,12,0.55) 100%)',
              backdropFilter:'blur(22px)',
              boxShadow:'0 0 0 0.5px rgba(16,185,129,0.18) inset, 0 8px 30px rgba(0,0,0,0.35)',
            }}
          >
            <p style={{ fontSize:'clamp(11px,1vw,13px)', lineHeight:1.85, margin:0, color:'rgba(255,255,255,0.82)', ...readableSm }}>
              <span style={HL.green}>KAI Protocol</span> is a{' '}
              <span style={HL.amber}>DeFi ecosystem</span> on{' '}
              <span style={HL.cyan}>Avalanche C-Chain</span>. Earn yield with{' '}
              <span style={HL.green}>yBOB Stablecoin</span>,{' '}
              <span style={HL.amber}>YGOLD</span> &{' '}
              <span style={HL.cyan}>YTOKEN vaults</span>, join{' '}
              <span style={HL.green}>CFA forest groups</span>, digitise your{' '}
              <span style={HL.amber}>SME business</span>, or grow with a{' '}
              <span style={HL.purple}>Chama saving group</span> — all powered by the{' '}
              <span style={HL.white}>NVR token</span>.
            </p>
          </motion.div>
        </div>

        {/* ══ RIGHT COLUMN (stacks below left on mobile) ══ */}
        <div style={{ minWidth:0 }}>

          {/* DASHBOARDS */}
          <section style={{ padding:'24px 20px 0', position:'relative', zIndex:5 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <p style={{ fontSize:10, fontWeight:800, letterSpacing:1.6, textTransform:'uppercase', color:'rgba(255,255,255,0.55)', margin:0, ...readableSm }}>
                Dashboards
              </p>
              <span className="badge badge-live">3 Active</span>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:11 }}>
              {DASHBOARDS.map((d,i) => {
                const Icon = d.icon;
                return (
                  <motion.div
                    key={d.id}
                    initial={{ opacity:0, x:-18 }}
                    animate={{ opacity:1, x:0 }}
                    transition={{ delay:0.20+i*0.07 }}
                    whileHover={{ x:5 }}
                  >
                    <Link href={d.href} style={{ textDecoration:'none' }}>
                      <div className="hover-shine" style={{
                        borderRadius:20, padding:'17px 18px',
                        display:'flex', alignItems:'center', gap:16,
                        background:`linear-gradient(110deg,${d.color}10 0%,rgba(6,6,14,0.58) 100%)`,
                        backdropFilter:'blur(22px)',
                        boxShadow:`0 0 0 0.5px ${d.color}20 inset, 0 8px 30px rgba(0,0,0,0.35)`,
                        transition:'box-shadow 0.25s',
                      }}>
                        <div style={{
                          width:52, height:52, borderRadius:16, flexShrink:0,
                          background:`${d.color}16`, backdropFilter:'blur(10px)',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          boxShadow:`0 0 22px ${d.color}28`,
                        }}>
                          <Icon size={24} color={d.color} strokeWidth={1.7} />
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          {/* Bold highlighted label */}
                          <p style={{ fontSize:'clamp(14px,1.2vw,16px)', fontWeight:900, margin:'0 0 3px', ...readable }}>
                            <span style={{ color:d.color, textShadow:`0 0 14px ${d.color}88` }}>
                              {d.highlight}
                            </span>
                          </p>
                          <p style={{ fontSize:'clamp(11px,0.9vw,12px)', fontWeight:700, color:'rgba(255,255,255,0.88)', margin:'0 0 2px', ...readableSm }}>
                            {d.label}
                          </p>
                          <p style={{ fontSize:'clamp(10px,0.85vw,11px)', color:'rgba(255,255,255,0.52)', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', ...readableSm }}>
                            {d.sub}
                          </p>
                        </div>
                        <ChevronRight size={17} color="rgba(255,255,255,0.25)" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* QUICK ACTIONS */}
          <section style={{ padding:'22px 20px 0', position:'relative', zIndex:5 }}>
            <p style={{ fontSize:10, fontWeight:800, letterSpacing:1.6, textTransform:'uppercase', color:'rgba(255,255,255,0.55)', margin:'0 0 14px', ...readableSm }}>
              Quick Actions
            </p>
            <div style={{
              display:'grid',
              gridTemplateColumns:'repeat(auto-fill, minmax(110px,1fr))',
              gap:10,
            }} className="quick-grid">
              {QUICK.map((a,i) => {
                const Icon = a.icon;
                return (
                  <motion.div
                    key={a.name}
                    initial={{ opacity:0, y:18 }}
                    animate={{ opacity:1, y:0 }}
                    transition={{ delay:0.28+i*0.04 }}
                    whileHover={{ y:-6, scale:1.04 }}
                    whileTap={{ scale:0.95 }}
                  >
                    <Link href={a.href} style={{ textDecoration:'none' }}>
                      <div className="hover-shine" style={{
                        display:'flex', flexDirection:'column', alignItems:'center', gap:10,
                        padding:'20px 10px',
                        borderRadius:22, cursor:'pointer',
                        background:'rgba(4,4,10,0.50)',
                        backdropFilter:'blur(20px)',
                        boxShadow:`0 0 0 0.5px ${a.color}20 inset, 0 6px 24px rgba(0,0,0,0.40)`,
                        transition:'box-shadow 0.25s',
                      }}>
                        <div style={{
                          width:52, height:52, borderRadius:16, flexShrink:0,
                          background:`linear-gradient(145deg,${a.bg} 0%,rgba(4,4,10,0.65) 100%)`,
                          backdropFilter:'blur(12px)',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          boxShadow:`0 4px 18px ${a.color}22, 0 0 0 0.5px ${a.color}28 inset`,
                        }}>
                          <Icon size={24} color={a.color} strokeWidth={1.7} />
                        </div>
                        <span style={{
                          fontSize:'clamp(11px,0.9vw,13px)', fontWeight:800,
                          color:'rgba(255,255,255,0.90)',
                          textAlign:'center', lineHeight:1.2,
                          textShadow:'0 1px 6px rgba(0,0,0,0.80)',
                        }}>{a.name}</span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </section>

        </div>
      </div>

      {/* ── FLOATING AGENT FAB ── */}
      <motion.div
        initial={{ opacity:0, scale:0.7 }}
        animate={{ opacity:1, scale:1 }}
        transition={{ delay:0.55 }}
        style={{ position:'fixed', bottom:88, right:20, zIndex:40 }}
      >
        <AnimatePresence>
          {agentOpen && (
            <motion.div
              initial={{ opacity:0, y:18, scale:0.92 }}
              animate={{ opacity:1, y:0, scale:1 }}
              exit={{ opacity:0, y:18, scale:0.92 }}
              transition={{ duration:0.22 }}
              style={{
                position:'absolute', bottom:64, right:0,
                width:'clamp(290px,22vw,340px)',
                background:'rgba(6,6,14,0.90)',
                backdropFilter:'blur(30px) saturate(1.9)',
                borderRadius:24,
                boxShadow:'0 0 0 0.5px rgba(16,185,129,0.25) inset, 0 24px 60px rgba(0,0,0,0.70)',
                overflow:'hidden',
              }}
            >
              {/* Header */}
              <div style={{ padding:'13px 16px', background:'rgba(16,185,129,0.06)', boxShadow:'0 1px 0 rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#10b981,#064e3b)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 14px rgba(16,185,129,0.45)' }}>
                    <Bot size={16} color="#fff" />
                  </div>
                  <div>
                    <p style={{ fontSize:'clamp(12px,1vw,14px)', fontWeight:900, margin:0, color:'#fff', ...readableSm }}>
                      <span style={HL.green}>KAI</span> Intelligence
                    </p>
                    <p style={{ fontSize:9, color:'#34d399', margin:0, fontWeight:700 }}>● RAG Agent · Live</p>
                  </div>
                </div>
                <button onClick={() => setAgentOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.45)', padding:4 }}>
                  <X size={15} />
                </button>
              </div>

              {/* Quick asks */}
              <div style={{ padding:'11px 14px 0' }}>
                <p style={{ fontSize:9, fontWeight:800, letterSpacing:1.4, textTransform:'uppercase', color:'rgba(255,255,255,0.45)', marginBottom:9 }}>Quick Ask</p>
                <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:11 }}>
                  {[
                    'What tokens does KAI have?',
                    'Best yield opportunity now?',
                    'How do I get started with KAI?',
                    'Check ecosystem pool rates',
                  ].map(q => (
                    <motion.button
                      key={q}
                      whileHover={{ x:4 }}
                      whileTap={{ scale:0.97 }}
                      onClick={() => setAgentQ(q)}
                      style={{
                        textAlign:'left', padding:'8px 12px', borderRadius:11,
                        cursor:'pointer', width:'100%', border:'none',
                        background: agentQ===q ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.05)',
                        backdropFilter:'blur(8px)',
                        boxShadow: agentQ===q ? '0 0 0 1px rgba(52,211,153,0.35) inset' : '0 0 0 0.5px rgba(255,255,255,0.08) inset',
                        color: agentQ===q ? '#34d399' : 'rgba(255,255,255,0.72)',
                        fontSize:'clamp(11px,0.9vw,12px)', fontWeight:500, lineHeight:1.4, transition:'all 0.15s',
                      }}
                    >{q}</motion.button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div style={{ padding:'0 14px 14px', display:'flex', gap:8 }}>
                <textarea
                  ref={agentRef}
                  value={agentQ}
                  onChange={e => setAgentQ(e.target.value)}
                  onKeyDown={e => e.key==='Enter' && !e.shiftKey && (e.preventDefault(), askAgent())}
                  placeholder="Ask KAI anything…"
                  rows={2}
                  style={{
                    flex:1, background:'rgba(255,255,255,0.06)', border:'none',
                    boxShadow:'0 0 0 1px rgba(255,255,255,0.09) inset',
                    borderRadius:12, padding:'9px 11px',
                    fontSize:'clamp(11px,0.9vw,12px)', color:'#fff', outline:'none',
                    fontFamily:'inherit', resize:'none', lineHeight:1.5, caretColor:'#34d399',
                  }}
                  onFocus={e => (e.target.style.boxShadow='0 0 0 1.5px rgba(52,211,153,0.50) inset')}
                  onBlur={e  => (e.target.style.boxShadow='0 0 0 1px rgba(255,255,255,0.09) inset')}
                />
                <motion.button
                  whileHover={{ scale:1.09 }}
                  whileTap={{ scale:0.91 }}
                  onClick={askAgent}
                  disabled={agentBusy || !agentQ.trim()}
                  style={{
                    width:40, height:40, borderRadius:12, alignSelf:'flex-end', flexShrink:0, border:'none',
                    background: agentQ.trim() && !agentBusy ? 'linear-gradient(135deg,#34d399,#047857)' : 'rgba(255,255,255,0.06)',
                    cursor: agentQ.trim() ? 'pointer' : 'not-allowed',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    boxShadow: agentQ.trim() && !agentBusy ? '0 0 16px rgba(52,211,153,0.45)' : 'none',
                    transition:'all 0.2s',
                  }}
                >
                  <Activity size={16} color={agentQ.trim() && !agentBusy ? '#fff' : 'rgba(255,255,255,0.20)'} />
                </motion.button>
              </div>

              {/* Answer */}
              <AnimatePresence>
                {agentA && (
                  <motion.div
                    initial={{ opacity:0, height:0 }}
                    animate={{ opacity:1, height:'auto' }}
                    exit={{ opacity:0, height:0 }}
                    style={{
                      margin:'0 14px 14px', padding:'11px 13px',
                      background:'rgba(16,185,129,0.07)',
                      boxShadow:'0 0 0 1px rgba(52,211,153,0.18) inset',
                      borderRadius:12, fontSize:'clamp(11px,0.9vw,12px)',
                      color:'rgba(255,255,255,0.82)',
                      lineHeight:1.60, maxHeight:140, overflowY:'auto',
                    }}
                  >
                    <span dangerouslySetInnerHTML={{ __html: formatChat(agentA) }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAB */}
        <motion.button
          whileHover={{ scale:1.13, rotate: agentOpen ? 0 : 9 }}
          whileTap={{ scale:0.87 }}
          onClick={() => setAgentOpen(v => !v)}
          className="glow-pulse"
          style={{
            width:56, height:56, borderRadius:'50%', border:'none', cursor:'pointer',
            background: agentOpen ? 'rgba(4,78,59,0.92)' : 'linear-gradient(135deg,#34d399 0%,#10b981 50%,#047857 100%)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 6px 26px rgba(16,185,129,0.55), 0 1px 0 rgba(255,255,255,0.20) inset',
            transition:'all 0.22s',
            transform: agentOpen ? 'rotate(45deg) scale(0.88)' : 'none',
          }}
        >
          <Bot size={26} color="#fff" />
        </motion.button>
      </motion.div>

      {/* Desktop two-column override via a style tag — avoids globals.css changes */}
      <style>{`
        @media (min-width: 1024px) {
          .home-page-grid {
            grid-template-columns: 1fr 1fr !important;
            padding: 0 32px !important;
            gap: 0 32px !important;
          }
        }
        @media (min-width: 1280px) {
          .home-page-grid {
            grid-template-columns: 1.05fr 0.95fr !important;
            padding: 0 48px !important;
            gap: 0 40px !important;
          }
        }
        @media (min-width: 1536px) {
          .home-page-grid {
            grid-template-columns: 1fr 1fr !important;
            padding: 0 72px !important;
            gap: 0 52px !important;
          }
        }
      `}</style>

      {showModal && <WalletConnectModal onClose={() => setShowModal(false)} />}
    </main>
  );
}
