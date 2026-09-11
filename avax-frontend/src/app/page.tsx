'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useBalance, useReadContracts } from 'wagmi';
import { formatUnits } from 'viem';
import { useKaivaxStore } from '@/store/useKaivaxStore';
import { useAIChatStore } from '@/store/useAIChatStore';
const WalletConnectModal = dynamic(() => import('@/components/WalletConnectModal'), { ssr: false });
import { ECOSYSTEM_TOKENS, TICKER_TOKENS } from '@/lib/tokens';
import { ERC20_ABI } from '@/lib/erc20abi';
import { formatChat } from '@/lib/formatChat';
import {
  Trees, Store, Users, FlaskConical, ScanLine,
  Droplets, ImageIcon, Lock, Globe, LayoutGrid, Gift,
  Bot, Copy, RefreshCw, ChevronRight, TrendingUp,
  ShieldCheck, Coins, Wallet,
  CircleDollarSign, BarChart3, Activity, Zap,
  Mountain, Link2, Sparkles,
} from 'lucide-react';

/* text-shadow so words are always readable over bg image */
const R:  React.CSSProperties = { textShadow: '0 1px 6px rgba(0,0,0,0.90)' };
const Rs: React.CSSProperties = { textShadow: '0 1px 4px rgba(0,0,0,0.88)' };

/* Colour is reserved for the brand name, the portfolio value, and active/live status —
   everything else reads as plain, professional white/gray text. */
const HL = {
  green: { color: '#34d399', fontWeight: 700 } as React.CSSProperties,
};

/* Flat panel — replaces the old blurred/glowing "glass" card look.
   Same grouping, no backdrop-filter, no neon box-shadow. */
const flat: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', boxShadow: '0 0 0 1px rgba(255,255,255,0.08) inset' };
const flatDivider = '1px solid rgba(255,255,255,0.08)';

const QUICK = [
  { name: 'AI Agent',   href: '/ai',        icon: Bot,         color: '#10b981' },
  { name: 'Playground', href: '/nuvari',     icon: FlaskConical,color: '#34d399' },
  { name: 'Scan & Pay', href: '/pay',        icon: ScanLine,    color: '#22d3ee' },
  { name: 'Securities', href: '/securities', icon: ShieldCheck, color: '#06b6d4' },
  { name: 'NFT Mkt',    href: '/connft',     icon: ImageIcon,   color: '#a855f7' },
  { name: 'Pools',      href: '/pools',      icon: Droplets,    color: '#059669' },
  { name: 'Vaults',     href: '/vaults',     icon: Lock,        color: '#a3e635' },
  { name: 'Airdrop',    href: '/mine',       icon: Gift,        color: '#f59e0b' },
  { name: 'KAI Web',    href: '/kai',        icon: Globe,       color: '#10b981' },
  { name: 'TaaS',       href: '/taas',       icon: LayoutGrid,  color: '#ec4899' },
];

const DASHBOARDS = [
  { id:'cfa',    href:'/cfa',    icon:Trees, color:'#10b981', label:'CFA Dashboard',  hl:'Community Forest',   sub:'Treasury · Governance'  },
  { id:'sme',    href:'/sme',    icon:Store, color:'#22d3ee', label:'SME Dashboard',   hl:'Digitise Cash',      sub:'Loans · Inventory'      },
  { id:'saving', href:'/saving', icon:Users, color:'#a855f7', label:'Saving Group',    hl:'Pool Funds & Yield', sub:'Decentralised Savings'  },
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

const TOKEN_ICON: Record<string, React.ComponentType<{ size:number; color:string; strokeWidth:number }>> = {
  AVAX: Activity, NVR: Zap, yBOB: CircleDollarSign,
  YTOKEN: TrendingUp, YGOLD: BarChart3, GAMI: Coins, CENTS: CircleDollarSign,
};

/* No price oracle is wired up yet — these are manually maintained estimates,
   not a live feed. Keep the UI label ("Est. Portfolio Value") honest about that. */
const ESTIMATED_USD_RATES: Record<string, number> = {
  avax: 26, ybob: 1, nvr: 0.12, ygold: 2.01, ytoken: 0.27, gami: 0.056, cents: 0.009,
};

export default function Home() {
  const { address, isConnected } = useAccount();
  const { data: avaxBal, refetch: refetchAvax } = useBalance({ address });
  const { connectWallet, disconnectWallet, setAvaxBalance, setAllBalances } = useKaivaxStore();
  const openAIChat = useAIChatStore(s => s.open);

  const [showModal,  setShowModal]  = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copied,     setCopied]     = useState(false);
  const [agentQ,     setAgentQ]     = useState('');
  const [agentA,     setAgentA]     = useState('');
  const [agentBusy,  setAgentBusy]  = useState(false);
  const [profile,    setProfile]    = useState<{ name?: string; displayName?: string } | null>(null);
  const agentRef = useRef<HTMLTextAreaElement>(null);

  const [activeSection, setActiveSection] = useState('overview');
  const overviewRef   = useRef<HTMLDivElement>(null);
  const agentSectionRef = useRef<HTMLDivElement>(null);
  const dashboardsRef = useRef<HTMLDivElement>(null);
  const actionsRef    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sections: [string, React.RefObject<HTMLDivElement | null>][] = [
      ['overview', overviewRef], ['agent', agentSectionRef],
      ['dashboards', dashboardsRef], ['actions', actionsRef],
    ];
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const match = sections.find(([, ref]) => ref.current === entry.target);
          if (match) setActiveSection(match[0]);
        }
      });
    }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
    sections.forEach(([, ref]) => ref.current && observer.observe(ref.current));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    isConnected && address ? connectWallet('metamask', address) : disconnectWallet();
  }, [isConnected, address]);

  useEffect(() => {
    if (!address) { setProfile(null); return; }
    fetch(`/api/profile?wallet=${address}`)
      .then(r => r.json())
      .then(d => setProfile(d.profile ?? null))
      .catch(() => setProfile(null));
  }, [address]);

  useEffect(() => {
    if (avaxBal) setAvaxBalance(Number(formatUnits(avaxBal.value, avaxBal.decimals)));
  }, [avaxBal]);

  const contractCalls = buildCalls(address);
  const { data: tokenData, refetch: refetchTokens } = useReadContracts({ contracts: contractCalls });

  const tokenBals: Record<string,number> = (() => {
    const out: Record<string,number> = {};
    ECOSYSTEM_TOKENS.filter(t => t.address).forEach((t,i) => {
      const r = tokenData?.[i];
      out[t.symbol.toLowerCase()] = r?.status==='success' && r.result!==undefined
        ? Number(formatUnits(r.result as bigint,18)) : 0;
    });
    ECOSYSTEM_TOKENS.filter(t => !t.address).forEach(t => { out[t.symbol.toLowerCase()] = 0; });
    return out;
  })();

  useEffect(() => {
    if (isConnected)
      setAllBalances({ nvr:tokenBals.nvr??0, ybob:tokenBals.ybob??0, ytoken:tokenBals.ytoken??0, ygold:tokenBals.ygold??0, gami:tokenBals.gami??0, cents:tokenBals.cents??0 });
  }, [JSON.stringify(tokenBals), isConnected]);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await Promise.allSettled([refetchAvax(), refetchTokens()]);
    setRefreshing(false);
  };

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const avaxAmt = avaxBal ? Number(formatUnits(avaxBal.value, avaxBal.decimals)) : 0;
  const allTokens = [
    { symbol:'AVAX', value:avaxAmt, color:'#10b981', deployed:true },
    ...ECOSYSTEM_TOKENS.map(t => ({ symbol:t.symbol, value:tokenBals[t.symbol.toLowerCase()]??0, color:t.color, deployed:!!t.address })),
  ];
  const totalUsd = avaxAmt*ESTIMATED_USD_RATES.avax
    + (tokenBals.ybob??0)*ESTIMATED_USD_RATES.ybob
    + (tokenBals.nvr??0)*ESTIMATED_USD_RATES.nvr
    + (tokenBals.ygold??0)*ESTIMATED_USD_RATES.ygold
    + (tokenBals.ytoken??0)*ESTIMATED_USD_RATES.ytoken
    + (tokenBals.gami??0)*ESTIMATED_USD_RATES.gami
    + (tokenBals.cents??0)*ESTIMATED_USD_RATES.cents;
  const activeTokenCount = allTokens.filter(b => b.value > 0).length;
  const balancesLoading = isConnected && tokenData === undefined;
  const displayName = profile?.displayName || profile?.name || (address ? `${address.slice(0,6)}…${address.slice(-4)}` : '');

  const askAgent = async () => {
    if (!agentQ.trim() || agentBusy) return;
    setAgentBusy(true); setAgentA('');
    try {
      const r = await fetch('/api/chat', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ message:agentQ, rag:true }) });
      const d = await r.json();
      setAgentA(d.text || d.response || 'No answer returned.');
    } catch { setAgentA('Agent offline. Start the server.'); }
    finally { setAgentBusy(false); }
  };

  /* ── Centred column, max 1280px, comfortable desktop padding ── */
  const W: React.CSSProperties = { width:'100%', maxWidth:1280, margin:'0 auto', padding:'0 40px' };

  return (
    <main style={{ minHeight:'100dvh', color:'#fff', fontFamily:'var(--font-sans)', position:'relative', paddingBottom:80 }}>

      {/* 1 ── TICKER */}
      <div className="ticker-wrap" style={{ padding:'6px 0', position:'relative', zIndex:5 }}>
        <div className="ticker-track" style={{ display:'inline-flex', gap:36, paddingLeft:20, whiteSpace:'nowrap' }}>
          {[...TICKER_TOKENS,...TICKER_TOKENS,...TICKER_TOKENS].map((t,i) => (
            <span key={i} style={{ fontSize:11, fontWeight:600 }}>
              <span style={{ color:'rgba(255,255,255,0.40)' }}>{t.s} </span>
              <span style={{ color:'rgba(255,255,255,0.85)', fontWeight:700 }}>{t.p} </span>
              <span style={{ color:'#34d399', fontWeight:800 }}>{t.c}</span>
            </span>
          ))}
        </div>
      </div>

      {/* 1.5 ── STICKY SECTION NAV — jump between sections, tracks scroll position */}
      <div style={{
        position:'sticky', top:0, zIndex:15, padding:'10px 0',
        background:'rgba(4,4,8,0.92)',
        borderBottom: flatDivider,
      }}>
        <div style={{ ...W, display:'flex', gap:20, overflowX:'auto', scrollbarWidth:'none' }}>
          {[
            { id:'overview',   label:'Overview' },
            { id:'agent',      label:'KAI Agent' },
            { id:'dashboards', label:'Dashboards' },
            { id:'actions',    label:'Quick Actions' },
          ].map(s => (
            <a key={s.id} href={`#${s.id}`} style={{
              padding:'7px 0', fontSize:12, fontWeight:700,
              whiteSpace:'nowrap', textDecoration:'none', transition:'color 0.2s', flexShrink:0,
              color:      activeSection===s.id ? '#34d399' : 'rgba(255,255,255,0.55)',
              borderBottom: activeSection===s.id ? '2px solid #34d399' : '2px solid transparent',
            }}>{s.label}</a>
          ))}
        </div>
      </div>

      {/* 2 ── BRAND HERO */}
      <motion.div id="overview" ref={overviewRef}
        initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}
        style={{ ...W, paddingTop:28, textAlign:'center', position:'relative', zIndex:5, scrollMarginTop:70 }}>
        <div className="float" style={{
          width:68, height:68, borderRadius:'50%', margin:'0 auto 12px',
          background:'rgba(16,185,129,0.16)',
          boxShadow:'0 0 0 1.5px rgba(16,185,129,0.35) inset',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}><Mountain size={30} color="#6ee7b7" strokeWidth={1.8}/></div>
        <h1 style={{ fontSize:32, fontWeight:900, margin:'0 0 5px', letterSpacing:'-1px', ...R }}>
          <span style={HL.green}>KAI</span> <span style={{ color:'#fff' }}>NUVARI</span>
        </h1>
        <p style={{ fontSize:11, fontWeight:700, letterSpacing:2.8, textTransform:'uppercase', color:'rgba(255,255,255,0.52)', margin:0, ...Rs }}>
          AVAX C-CHAIN · DEFI ECOSYSTEM
        </p>
      </motion.div>

      {/* 3 ── CONNECT WALLET */}
      <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.10 }}
        style={{ ...W, marginTop:16, position:'relative', zIndex:5 }}>
        <motion.button whileTap={{ scale:0.98 }} onClick={() => setShowModal(true)}
          style={{
            width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:10,
            padding:'13px 24px', borderRadius:12, cursor:'pointer', border:'none',
            background:'#047857',
            fontSize:15, fontWeight:800, color:'#fff',
          }}>
          <Link2 size={16}/>
          {isConnected ? `Connected: ${address?.slice(0,6)}…${address?.slice(-4)}` : 'Connect Wallet'}
          {isConnected && <span style={{ width:8, height:8, borderRadius:'50%', background:'#6ee7b7' }} />}
        </motion.button>
      </motion.div>

      {/* 4 ── NETWORK STRIP */}
      <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.14 }}
        style={{ ...W, marginTop:12, position:'relative', zIndex:5 }}>
        <div style={{
          padding:'12px 20px', borderRadius:12,
          ...flat,
          display:'flex', alignItems:'center', gap:14,
        }}>
          <Mountain size={22} color="rgba(255,255,255,0.85)" strokeWidth={1.7} style={{ flexShrink:0 }}/>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:14, fontWeight:800, margin:'0 0 2px', color:'rgba(255,255,255,0.92)', ...R }}>
              Avalanche C-Chain
              <span style={{ color:'rgba(255,255,255,0.55)', fontWeight:500 }}> · MetaMask &amp; Core Wallet</span>
            </p>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.50)', margin:0, ...Rs }}>
              6 Ecosystem Tokens · DeFi Vaults · DAO Governance
            </p>
          </div>
          <div style={{ display:'flex', gap:4, flexShrink:0 }}>
            {[0,1,2].map(i => <div key={i} style={{ width:7, height:7, borderRadius:'50%', background:'#34d399', opacity:0.4+i*0.22 }} />)}
          </div>
        </div>
      </motion.div>

      {/* 5 ── PROFILE HERO */}
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.18 }}
        style={{ ...W, marginTop:12, position:'relative', zIndex:5 }}>
        <div style={{ borderRadius:16, overflow:'hidden', ...flat }}>

          {/* cover */}
          <div style={{
            height:100,
            background:'linear-gradient(135deg,rgba(4,78,59,0.88) 0%,rgba(6,182,212,0.32) 50%,rgba(168,85,247,0.25) 100%)',
            position:'relative', overflow:'hidden',
          }}>
            {/* KAI member badge */}
            <div style={{
              position:'absolute', top:12, right:14,
              display:'flex', alignItems:'center', gap:5,
              padding:'4px 11px', borderRadius:999,
              background:'rgba(16,185,129,0.20)',
              boxShadow:'0 0 0 1px rgba(16,185,129,0.36) inset',
              fontSize:11, fontWeight:800, color:'#34d399',
            }}><Sparkles size={12}/> KAI Member</div>
          </div>

          {/* body */}
          <div style={{ background:'rgba(8,8,16,0.60)', padding:'0 24px 20px' }}>

            {/* avatar row */}
            <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginTop:-40 }}>
              <div style={{ position:'relative', flexShrink:0 }}>
                <div style={{
                  width:82, height:82, borderRadius:'50%',
                  background:'linear-gradient(135deg,#10b981,#22d3ee,#a855f7)',
                  padding:2.5,
                }}>
                  <div style={{
                    width:'100%', height:'100%', borderRadius:'50%',
                    background:'#0a2e22',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:32, fontWeight:900, color:'#6ee7b7',
                  }}>{(displayName || 'K').charAt(0).toUpperCase()}</div>
                </div>
                <span style={{
                  position:'absolute', bottom:4, right:2, width:14, height:14, borderRadius:'50%',
                  background:'#22c55e', border:'2.5px solid rgba(8,8,16,0.88)',
                  display:'block',
                }} />
              </div>
              {/* status pills */}
              <div style={{ display:'flex', gap:8, marginBottom:6 }}>
                <span style={{ padding:'5px 12px', borderRadius:8, background:'rgba(16,185,129,0.14)', fontSize:12, fontWeight:700, color:'#34d399' }}>● Active</span>
                <span style={{ padding:'5px 12px', borderRadius:8, background:'rgba(255,255,255,0.06)', fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.58)' }}>Kenya</span>
              </div>
            </div>

            {/* name + handle */}
            <div style={{ marginTop:10, marginBottom:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                <h2 style={{ fontSize:22, fontWeight:900, margin:0, letterSpacing:'-0.4px', color:'#fff', ...R }}>
                  {isConnected ? (displayName || 'KAI Member') : 'Not Connected'}
                </h2>
                {isConnected && <span style={{ width:20, height:20, borderRadius:'50%', background:'#047857', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, flexShrink:0 }}>✓</span>}
              </div>
              {isConnected && !profile && (
                <Link href="/profile" style={{ fontSize:12, color:'#34d399', margin:'0 0 5px', textDecoration:'none', ...Rs }}>
                  Complete your profile →
                </Link>
              )}
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.60)', margin:'4px 0 0', lineHeight:1.55, ...Rs }}>
                {isConnected ? 'KAI Nuvari member · Avalanche Fuji' : 'Connect a wallet to see your profile'}
              </p>
            </div>

            {/* stats strip */}
            <div style={{
              display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10,
              padding:'13px 16px', borderRadius:12,
              borderTop: flatDivider,
            }}>
              {[
                { label:'Est. Value', value: isConnected ? (balancesLoading ? '…' : `$${totalUsd.toFixed(2)}`) : '$0.00', color:'#34d399', icon:Wallet },
                { label:'Network',   value:'Fuji',   color:null,      icon:Mountain },
                { label:'Tokens',    value:isConnected ? (balancesLoading ? '…' : String(activeTokenCount)) : '0', color:null, icon:Coins },
                { label:'Status',    value:isConnected ? 'Active' : 'Idle', color:isConnected ? '#34d399' : null, icon:Zap },
              ].map(s => (
                <div key={s.label} style={{ textAlign:'center' }}>
                  <s.icon size={18} color={s.color ?? 'rgba(255,255,255,0.75)'} strokeWidth={1.8} style={{ display:'block', margin:'0 auto 4px' }}/>
                  <p style={{ fontSize:15, fontWeight:800, color:s.color ?? 'rgba(255,255,255,0.90)', margin:'0 0 2px', ...Rs }}>{s.value}</p>
                  <p style={{ fontSize:10, color:'rgba(255,255,255,0.38)', fontWeight:700, letterSpacing:0.6, textTransform:'uppercase', margin:0 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* 6 ── PORTFOLIO */}
      <motion.div initial={{ opacity:0, scale:0.98 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.22, duration:0.35 }}
        style={{ ...W, marginTop:12, position:'relative', zIndex:5 }}>
        <div style={{
          borderRadius:16, padding:'22px 26px 18px',
          ...flat,
        }}>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:1.4, textTransform:'uppercase', color:'rgba(255,255,255,0.48)', marginBottom:6, ...Rs }}>Est. Portfolio Value</p>
          {balancesLoading ? (
            <div className="skeleton-sweep" style={{ width:180, height:40, borderRadius:10, marginBottom:16 }} />
          ) : (
            <div style={{ display:'flex', alignItems:'baseline', gap:12, marginBottom:16 }}>
              <span style={{ fontSize:40, fontWeight:900, letterSpacing:-2, color:isConnected?'#fff':'rgba(255,255,255,0.20)', lineHeight:1, ...R }}>
                ${isConnected ? totalUsd.toFixed(2) : '0.00'}
              </span>
              {isConnected && totalUsd>0 && <span style={{ fontSize:13, ...HL.green }}>+0.00%</span>}
            </div>
          )}

          {isConnected ? (
            <>
              <div style={{ overflowX:'auto', scrollbarWidth:'none', marginBottom:14 }}>
                <div style={{ display:'flex', gap:8, minWidth:'max-content' }}>
                  {balancesLoading ? Array.from({ length:7 }).map((_,i) => (
                    <div key={i} className="skeleton-sweep" style={{ minWidth:78, height:74, borderRadius:12 }} />
                  )) : allTokens.map(b => {
                    const Icon = TOKEN_ICON[b.symbol] || Coins;
                    return (
                      <div key={b.symbol} style={{
                        minWidth:78, padding:'9px 8px', borderRadius:12, textAlign:'center',
                        background:'rgba(255,255,255,0.03)',
                        boxShadow:`0 0 0 1px ${b.color}30 inset`,
                        position:'relative', cursor:'default',
                      }}>
                        <span style={{ display:'block', margin:'0 auto 4px' }}><Icon size={15} color={b.color} strokeWidth={1.8} /></span>
                        <p style={{ fontSize:9, color:'rgba(255,255,255,0.50)', margin:'0 0 2px', fontWeight:700, letterSpacing:0.3 }}>{b.symbol}</p>
                        <p style={{ fontSize:13, fontWeight:800, color:b.color, margin:0 }}>
                          {b.value>=1000?`${(b.value/1000).toFixed(1)}K`:b.value>=0.001?b.value.toFixed(3):'0.000'}
                        </p>
                        {!b.deployed && <div style={{ position:'absolute', top:2, right:4, fontSize:6, color:'rgba(255,255,255,0.25)', fontWeight:700 }}>SOON</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{ display:'flex', gap:7 }}>
                <div style={{ flex:1, background:'rgba(255,255,255,0.04)', borderRadius:8, padding:'7px 12px', fontFamily:'monospace', fontSize:10, color:'rgba(255,255,255,0.48)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{address}</div>
                <button onClick={copyAddress} style={{ padding:'7px 12px', borderRadius:8, border:'none', cursor:'pointer', background:copied?'rgba(52,211,153,0.16)':'rgba(255,255,255,0.05)', color:copied?'#34d399':'rgba(255,255,255,0.48)', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', gap:4, transition:'all 0.2s' }}>
                  {copied?'✓':(<><Copy size={12}/> Copy</>)}
                </button>
                <button onClick={handleRefresh} style={{ padding:'7px 10px', borderRadius:8, border:'none', cursor:'pointer', background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.48)' }}>
                  <RefreshCw size={12} style={{ animation:refreshing?'spin 1s linear infinite':'none' }} />
                </button>
              </div>
            </>
          ) : (
            <button onClick={() => setShowModal(true)} style={{
              width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:9,
              background:'rgba(16,185,129,0.10)',
              borderRadius:10, padding:'12px 0', cursor:'pointer', border:'none',
              fontSize:14, fontWeight:700, ...HL.green,
            }}>
              <Wallet size={16}/> Connect MetaMask / Core Wallet to view balances
            </button>
          )}
        </div>
      </motion.div>

      {/* 7 ── STAT PILLS */}
      <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.26 }}
        style={{ ...W, marginTop:12, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, position:'relative', zIndex:5 }}>
        {[
          { icon:Mountain, label:'Chain',  value:'Fuji Testnet', color:'#34d399' },
          { icon:Coins,    label:'Tokens', value:'6 Active',     color:'#fbbf24' },
          { icon:Bot,      label:'AI',     value:'Qwen3 RAG',   color:'#c084fc' },
        ].map((s,i) => (
          <motion.div key={s.label}
            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.28+i*0.05 }}
            style={{
              padding:'14px 12px', borderRadius:12, textAlign:'center',
              background:'rgba(255,255,255,0.03)',
              boxShadow:`0 0 0 1px ${s.color}30 inset`,
            }}>
            <s.icon size={22} color={s.color} strokeWidth={1.7} style={{ display:'block', margin:'0 auto 6px' }}/>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:1.0, textTransform:'uppercase', color:'rgba(255,255,255,0.40)', margin:'0 0 3px' }}>{s.label}</p>
            <p style={{ fontSize:14, fontWeight:800, color:'rgba(255,255,255,0.90)', margin:0 }}>{s.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* 8 ── KAI AGENT */}
      <motion.div id="agent" ref={agentSectionRef}
        initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:'-60px' }} transition={{ duration:0.4 }}
        style={{ ...W, marginTop:12, position:'relative', zIndex:5, scrollMarginTop:70 }}>
        <div style={{
          borderRadius:16,
          ...flat,
          overflow:'hidden',
        }}>
          {/* header */}
          <div style={{ padding:'14px 22px', borderBottom: flatDivider, display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:38, height:38, borderRadius:'50%', background:'#065f46', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Bot size={19} color="#fff" />
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:15, fontWeight:800, margin:'0 0 2px', color:'#fff', ...Rs }}>
                <span style={HL.green}>KAI</span> Intelligence
              </p>
              <p style={{ fontSize:10, color:'#34d399', margin:0, fontWeight:700 }}>● RAG Agent · Qwen3 · Live</p>
            </div>
            <button onClick={openAIChat} style={{ fontSize:12, color:'rgba(255,255,255,0.48)', background:'none', border:'none', cursor:'pointer', fontWeight:700, display:'flex', alignItems:'center', gap:3, flexShrink:0 }}>
              Full chat <ChevronRight size={13}/>
            </button>
          </div>

          {/* chips */}
          <div style={{ padding:'12px 22px 0' }}>
            <p style={{ fontSize:9, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', color:'rgba(255,255,255,0.38)', marginBottom:9 }}>Quick Ask</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginBottom:12 }}>
              {['What tokens does KAI have?','Best yield now?','How to get started?','Pool rates?'].map(q => (
                <button key={q} onClick={() => setAgentQ(q)} style={{
                  padding:'6px 13px', borderRadius:8, border:'none', cursor:'pointer',
                  background:agentQ===q?'rgba(16,185,129,0.16)':'rgba(255,255,255,0.05)',
                  color:agentQ===q?'#34d399':'rgba(255,255,255,0.65)',
                  fontSize:12, fontWeight:600, transition:'all 0.14s',
                }}>{q}</button>
              ))}
            </div>
          </div>

          {/* input */}
          <div style={{ padding:'0 22px 18px', display:'flex', gap:9 }}>
            <textarea ref={agentRef} value={agentQ}
              onChange={e => setAgentQ(e.target.value)}
              onKeyDown={e => e.key==='Enter' && !e.shiftKey && (e.preventDefault(), askAgent())}
              placeholder="Ask KAI anything about the ecosystem…" rows={2}
              style={{ flex:1, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:10, padding:'10px 13px', fontSize:13, color:'#fff', outline:'none', fontFamily:'inherit', resize:'none', lineHeight:1.5, caretColor:'#34d399' }}
              onFocus={e => (e.target.style.borderColor='rgba(52,211,153,0.55)')}
              onBlur={e  => (e.target.style.borderColor='rgba(255,255,255,0.10)')}
            />
            <button onClick={askAgent} disabled={agentBusy||!agentQ.trim()} style={{
              width:44, height:44, borderRadius:10, alignSelf:'flex-end', flexShrink:0, border:'none',
              background:agentQ.trim()&&!agentBusy?'#047857':'rgba(255,255,255,0.06)',
              cursor:agentQ.trim()?'pointer':'not-allowed',
              display:'flex', alignItems:'center', justifyContent:'center',
              transition:'all 0.2s',
            }}>
              <Activity size={19} color={agentQ.trim()&&!agentBusy?'#fff':'rgba(255,255,255,0.20)'} />
            </button>
          </div>

          <AnimatePresence>
            {agentA && (
              <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
                style={{ margin:'0 22px 18px', padding:'12px 15px', borderLeft:'2px solid #34d399', borderRadius:6, fontSize:13, color:'rgba(255,255,255,0.85)', lineHeight:1.65, maxHeight:200, overflowY:'auto' }}>
                <span dangerouslySetInnerHTML={{ __html:formatChat(agentA) }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* 9 ── DASHBOARDS */}
      <motion.div id="dashboards" ref={dashboardsRef}
        initial={{ opacity:0, y:12 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:'-60px' }} transition={{ duration:0.4 }}
        style={{ ...W, marginTop:24, position:'relative', zIndex:5, scrollMarginTop:70 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:1.4, textTransform:'uppercase', color:'rgba(255,255,255,0.52)', margin:0 }}>Dashboards</p>
          <span className="badge badge-live">3 Active</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:14 }}>
          {DASHBOARDS.map((d,i) => {
            const Icon = d.icon;
            return (
              <motion.div key={d.id}
                initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:'-40px' }} transition={{ delay:i*0.08, duration:0.4 }}>
                <Link href={d.href} style={{ textDecoration:'none' }}>
                  <div style={{
                    borderRadius:14, padding:'20px 20px 16px', height:'100%',
                    display:'flex', flexDirection:'column', gap:12,
                    background:'rgba(255,255,255,0.03)',
                    boxShadow:`0 0 0 1px ${d.color}25 inset`,
                    boxSizing:'border-box',
                  }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ width:48, height:48, borderRadius:12, flexShrink:0, background:`${d.color}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Icon size={23} color={d.color} strokeWidth={1.65}/>
                      </div>
                      <ChevronRight size={16} color="rgba(255,255,255,0.25)"/>
                    </div>
                    <div>
                      <p style={{ fontSize:16, fontWeight:800, margin:'0 0 3px', color:'rgba(255,255,255,0.95)', ...R }}>{d.hl}</p>
                      <p style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.75)', margin:'0 0 6px', ...Rs }}>{d.label}</p>
                      <p style={{ fontSize:11, color:'rgba(255,255,255,0.45)', margin:0 }}>{d.sub}</p>
                    </div>
                    <div style={{ marginTop:'auto', paddingTop:10, borderTop:`1px solid ${d.color}20`, display:'flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700, color:d.color }}>
                      Open dashboard <ChevronRight size={12}/>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* 10 ── QUICK ACTIONS */}
      <motion.div id="actions" ref={actionsRef}
        initial={{ opacity:0, y:12 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:'-60px' }} transition={{ duration:0.4 }}
        style={{ ...W, marginTop:24, paddingBottom:40, position:'relative', zIndex:5, scrollMarginTop:70 }}>
        <p style={{ fontSize:10, fontWeight:700, letterSpacing:1.4, textTransform:'uppercase', color:'rgba(255,255,255,0.52)', margin:'0 0 14px' }}>
          Quick Actions
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:12 }}>
          {QUICK.map((a,i) => {
            const Icon = a.icon;
            const isAgent = a.href === '/ai';
            const tile = (
              <div style={{
                display:'flex', flexDirection:'column', alignItems:'center', gap:9,
                padding:'18px 10px', borderRadius:14, cursor:'pointer',
                background:'rgba(255,255,255,0.03)',
                boxShadow:`0 0 0 1px ${a.color}25 inset`,
              }}>
                <div style={{
                  width:50, height:50, borderRadius:14, flexShrink:0,
                  background:`${a.color}18`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <Icon size={23} color={a.color} strokeWidth={1.6}/>
                </div>
                <span style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.88)', textAlign:'center', lineHeight:1.2, textShadow:'0 1px 5px rgba(0,0,0,0.85)' }}>
                  {a.name}
                </span>
              </div>
            );
            return (
              <motion.div key={a.name}
                initial={{ opacity:0, y:14 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:'-40px' }} transition={{ delay:i*0.03, duration:0.35 }}>
                {isAgent ? (
                  <button onClick={openAIChat} style={{ textDecoration:'none', background:'none', border:'none', padding:0, width:'100%', font:'inherit' }}>
                    {tile}
                  </button>
                ) : (
                  <Link href={a.href} style={{ textDecoration:'none' }}>
                    {tile}
                  </Link>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {showModal && <WalletConnectModal onClose={() => setShowModal(false)} />}
    </main>
  );
}
