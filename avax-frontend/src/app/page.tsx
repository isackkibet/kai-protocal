'use client';

import { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useBalance, useReadContracts } from 'wagmi';
import { formatUnits } from 'viem';
import { useKaivaxStore } from '@/store/useKaivaxStore';
import { useAIChatStore } from '@/store/useAIChatStore';
const WalletConnectModal = dynamic(() => import('@/components/WalletConnectModal'), { ssr: false });
import { ECOSYSTEM_TOKENS, TICKER_TOKENS } from '@/lib/tokens';
import { ERC20_ABI } from '@/lib/erc20abi';
import { formatChat } from '@/lib/formatChat';
import { usePrivyAuth } from '@/lib/privy-auth';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import {
  Trees, Store, Users, FlaskConical, ScanLine,
  Droplets, ImageIcon, Lock, Globe, LayoutGrid, Gift,
  Bot, Copy, RefreshCw,
  ShieldCheck, CircleDollarSign,
  Link2, Mic,
} from 'lucide-react';

/* Same editorial system as /hub: solid pine background, one gold accent,
   serif display type for values/headlines, mono for small-caps labels. */
const C = {
  bg:        '#0B1C14',
  pineDeep:  '#0A2A20',
  pineLight: '#2D5A3D',
  gold:      '#C89B3C',
  goldLight: '#E4C878',
  paper:     '#F6F2E7',
  paperDim:  '#EFE9D9',
  ink:       '#1B1A14',
  inkLight:  '#9BA396',
  hairline:  'rgba(200,155,60,0.14)',
};
const MONO  = { fontFamily: "'IBM Plex Mono', monospace" } as const;
/* Poppins for headings/values (bold) + body (regular) — editorial style only,
   palette stays pine/gold/paper. */
const SERIF = { fontFamily: "'Poppins', sans-serif" } as const;

const HL = {
  green: { color: C.goldLight, fontWeight: 700 } as React.CSSProperties,
};

/* Small-caps mono eyebrow label, matching /hub's section labels. */
const label: React.CSSProperties = { ...MONO, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: C.goldLight, fontWeight: 600, margin: '0 0 10px' };

const QUICK = [
  { name: 'Voice Agent', href: '/voice',     icon: Mic },
  { name: 'AI Agent',    href: '/ai',        icon: Bot },
  { name: 'Playground',  href: '/nuvari',     icon: FlaskConical },
  { name: 'Scan & Pay',  href: '/pay',        icon: ScanLine },
  { name: 'Products',    href: '/products',   icon: CircleDollarSign },
  { name: 'SDG Impact',  href: '/sdg',        icon: Globe },
  { name: 'Securities',  href: '/securities', icon: ShieldCheck },
  { name: 'NFT Mkt',     href: '/connft',     icon: ImageIcon },
  { name: 'Pools',       href: '/pools',      icon: Droplets },
  { name: 'Vaults',      href: '/vaults',     icon: Lock },
  { name: 'Airdrop',     href: '/mine',       icon: Gift },
  { name: 'KAI Web',     href: '/kai',        icon: Globe },
  { name: 'TaaS',        href: '/taas',       icon: LayoutGrid },
];

const DASHBOARDS = [
  { id:'cfa',    href:'/cfa',    icon:Trees, label:'CFA Dashboard',  hl:'Community Forest',   sub:'Treasury and governance'  },
  { id:'sme',    href:'/sme',    icon:Store, label:'SME Dashboard',   hl:'Digitise Cash',      sub:'Loans and inventory'      },
  { id:'saving', href:'/saving', icon:Users, label:'Saving Group',    hl:'Pool Funds & Yield', sub:'Decentralised savings'  },
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

/* No price oracle is wired up yet — these are manually maintained estimates,
   not a live feed. Keep the UI label ("Estimated portfolio value") honest about that. */
const ESTIMATED_USD_RATES: Record<string, number> = {
  avax: 26, ybob: 1, nvr: 0.12, ygold: 2.01, ytoken: 0.27, gami: 0.056, cents: 0.009,
};

export default function Home() {
  const router = useRouter();
  const { address, isConnected } = useActiveAccount();
  const { authenticated: privyAuthenticated, address: privyAddress } = usePrivyAuth();
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const connected = mounted && isConnected;
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
    { symbol:'AVAX', value:avaxAmt, deployed:true },
    ...ECOSYSTEM_TOKENS.map(t => ({ symbol:t.symbol, value:tokenBals[t.symbol.toLowerCase()]??0, deployed:!!t.address })),
  ];
  const totalUsd = avaxAmt*ESTIMATED_USD_RATES.avax
    + (tokenBals.ybob??0)*ESTIMATED_USD_RATES.ybob
    + (tokenBals.nvr??0)*ESTIMATED_USD_RATES.nvr
    + (tokenBals.ygold??0)*ESTIMATED_USD_RATES.ygold
    + (tokenBals.ytoken??0)*ESTIMATED_USD_RATES.ytoken
    + (tokenBals.gami??0)*ESTIMATED_USD_RATES.gami
    + (tokenBals.cents??0)*ESTIMATED_USD_RATES.cents;
  const activeTokenCount = allTokens.filter(b => b.value > 0).length;
  const balancesLoading = connected && tokenData === undefined;
  const displayName = mounted ? (profile?.displayName || profile?.name || (address ? `${address.slice(0,6)}…${address.slice(-4)}` : '')) : '';

  /* Wallet context sent alongside every question so the agent can answer
     "what's my portfolio worth" / "best yield for me" with real balances
     instead of generic copy. */
  const agentContext = {
    connected,
    address,
    network: 'Fuji',
    totalUsd,
    balances: allTokens.filter(b => b.value > 0).map(b => ({ symbol: b.symbol, value: b.value })),
  };

  const askAgent = async () => {
    if (!agentQ.trim() || agentBusy) return;
    setAgentBusy(true); setAgentA('');
    try {
      const r = await fetch('/api/chat', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ message: agentQ, rag: true, stream: false, context: agentContext }) });
      const d = await r.json();
      setAgentA(d.text || d.response || 'No answer returned.');
    } catch { setAgentA('Agent offline. Start the server.'); }
    finally { setAgentBusy(false); }
  };

  return (
    <main style={{ minHeight:'100dvh', background:C.bg, color:C.paper, fontFamily:"'Poppins', 'IBM Plex Sans', var(--font-sans)", position:'relative', paddingBottom:80 }}>
      {/* kaiweb fonts — Poppins display + IBM Plex Mono small-caps labels */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
      `}</style>

      {/* TICKER */}
      <div className="ticker-wrap" style={{ padding:'6px 0', position:'relative', zIndex:5, borderBottom:`1px solid ${C.hairline}` }}>
        <div className="ticker-track" style={{ display:'inline-flex', gap:36, paddingLeft:20, whiteSpace:'nowrap' }}>
          {[...TICKER_TOKENS,...TICKER_TOKENS,...TICKER_TOKENS].map((t,i) => (
            <span key={i} style={{ ...MONO, fontSize:11, fontWeight:500 }}>
              <span style={{ color:C.inkLight }}>{t.s} </span>
              <span style={{ color:C.paperDim, fontWeight:600 }}>{t.p} </span>
              <span style={{ color:C.goldLight, fontWeight:700 }}>{t.c}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Bottom nav (site-wide) is the one and only navigation on this page —
          no second, competing top tab bar. */}

      <div className="home-container" style={{ position:'relative', zIndex:5 }}>

        {/* HERO — full-screen photo, dark fade left→right so the copy reads.
            Colors are the original KAI palette only; the photo is a mask */}
        <div style={{
          width: '100vw', marginLeft: '50%', transform: 'translateX(-50%)',
          position: 'relative', zIndex: 5,
          padding: '88px 0 100px',
          backgroundImage:
            `linear-gradient(180deg, rgba(11,28,20,0.15) 0%, rgba(11,28,20,0.65) 55%, ${C.bg} 100%),` +
            `linear-gradient(90deg, rgba(11,28,20,0.97) 0%, rgba(11,28,20,0.80) 32%, rgba(11,28,20,0.32) 64%, rgba(11,28,20,0.10) 100%),` +
            'url("/images/home-hero.jpg")',
          backgroundSize: 'cover', backgroundPosition: 'center',
          textAlign: 'left',
          borderBottom: `1px solid ${C.hairline}`,
        }}>
          <div style={{ maxWidth: 1120, marginInline: 'auto', paddingInline: 24, boxSizing: 'border-box', position: 'relative', zIndex: 2 }}>
            {/* Pill badge — original gold dot, not the screenshot's orange */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '7px 16px', borderRadius: 999, background: 'rgba(246,242,231,0.06)', border: `1px solid rgba(228,200,120,0.28)` }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.goldLight, boxShadow: '0 0 10px rgba(228,200,120,0.9)' }} />
              <span style={{ ...MONO, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: C.goldLight, fontWeight: 600 }}>Avalanche C-Chain · Forest Finance</span>
            </div>

            <h1 style={{ ...SERIF, fontSize: 44, fontWeight: 700, margin: '18px 0 12px', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
              <span style={HL.green}>KAI</span> <span style={{ color: C.paper }}>Nuvari</span>
            </h1>
            <p style={{ fontSize: 16, color: C.paperDim, margin: 0, maxWidth: 520, lineHeight: 1.65 }}>
              A DeFi ecosystem on Avalanche C-Chain with six tokens, yield vaults, liquidity pools, and DAO governance.
            </p>

            <motion.button whileTap={{ scale: 0.98 }} onClick={() => {
              if (privyAuthenticated) { router.push('/wallet'); return; }
              setShowModal(true);
            }}
              style={{
                marginTop: 26, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                padding: '13px 30px', borderRadius: 999, cursor: 'pointer', border: 'none',
                background: C.gold,
                fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: 'inherit',
              }}>
              <Link2 size={16}/>
              {connected
                ? `Connected: ${address?.slice(0,6)}…${address?.slice(-4)}`
                : privyAuthenticated && privyAddress
                  ? `Your Wallet: ${privyAddress.slice(0,6)}…${privyAddress.slice(-4)}`
                  : 'Connect Wallet'}
              {(connected || privyAuthenticated) && <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.ink }} />}
            </motion.button>

            <p style={{ marginTop: 18, ...MONO, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: C.inkLight }}>MetaMask and Core Wallet supported</p>
          </div>
        </div>

        {/* TWO-COLUMN LAYOUT — wallet/profile + agent on the right (sticky on
            desktop), portfolio/dashboards/actions on the left */}
        <div className="home-grid" style={{ marginTop:56 }}>

          <div className="home-aside">
            {/* PROFILE */}
            <section className="home-section" aria-label="Profile">
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
                <div style={{ position:'relative', flexShrink:0 }}>
                  <div style={{
                    width:52, height:52, borderRadius:'50%', background:C.gold,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    ...SERIF, fontSize:20, fontWeight:600, color:C.ink,
                  }}>{(displayName || 'K').charAt(0).toUpperCase()}</div>
                  <span style={{ position:'absolute', bottom:1, right:0, width:11, height:11, borderRadius:'50%', background:C.pineLight, border:`2px solid ${C.bg}` }} />
                </div>
                <div>
                  <p style={{ ...SERIF, fontSize:18, fontWeight:600, margin:0, color:C.paper }}>
                    {connected || privyAuthenticated ? (displayName || 'KAI Member') : 'Not connected'}
                  </p>
                  <p style={{ fontSize:14, color:C.inkLight, margin:'3px 0 0', lineHeight:1.5 }}>
                    {connected || privyAuthenticated
                      ? "You're an active KAI Nuvari member on Avalanche Fuji, based in Kenya."
                      : 'Connect a wallet to see your profile.'}
                  </p>
                  {connected && !profile && (
                    <Link href="/profile" className="text-link" style={{ fontSize:12 }}>Complete your profile</Link>
                  )}
                </div>
              </div>

              <div className="home-stats">
                {[
                  { l:'Est. value', v: connected ? (balancesLoading ? '…' : `$${totalUsd.toFixed(2)}`) : '$0.00', color:C.goldLight },
                  { l:'Network',   v:'Fuji',   color:null },
                  { l:'Tokens',    v:connected ? (balancesLoading ? '…' : String(activeTokenCount)) : '0', color:null },
                  { l:'Status',    v:connected ? 'Active' : 'Idle', color:connected ? C.goldLight : null },
                ].map(s => (
                  <div key={s.l} className="home-stat">
                    <p className="home-stat-value" style={{ color: s.color ?? C.paper }}>{s.v}</p>
                    <p className="home-stat-label">{s.l}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* KAI AGENT */}
            <section className="home-section" id="agent"
              style={{ scrollMarginTop:70 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                <Bot size={18} color={C.goldLight} />
                <p style={{ ...SERIF, fontSize:18, fontWeight:600, margin:0, color:C.paper }}>
                  <span style={HL.green}>KAI</span> Intelligence
                </p>
              </div>
              <p style={{ fontSize:14, color:C.inkLight, margin:'0 0 6px', lineHeight:1.6 }}>
                Live and ready to help, powered by Qwen3 RAG. Best for quick questions.{' '}
                <button onClick={openAIChat} className="text-link" style={{ background:'none', border:'none', cursor:'pointer', padding:0, font:'inherit', fontSize:'inherit' }}>Open the full chat</button>
              </p>
              <p style={{ fontSize:13, color:C.inkLight, opacity:0.85, margin:'0 0 18px', lineHeight:1.6 }}>
                Need to check balances or make a swap by talking? Try the{' '}
                <Link href="/voice" className="text-link">Voice Agent</Link>
              </p>

              <p style={label}>Quick ask</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'6px 22px', marginBottom:18 }}>
                {(connected
                  ? ["What's my portfolio worth?", 'Best yield for me?', 'What tokens does KAI have?', 'How to get started?']
                  : ['What tokens does KAI have?','Best yield now?','How to get started?','Pool rates?']
                ).map(q => (
                  <button key={q} onClick={() => setAgentQ(q)} style={{ background:'none', border:'none', cursor:'pointer', padding:0, font:'inherit', fontSize:13, fontWeight:600, textAlign:'left', color: agentQ===q ? C.goldLight : C.inkLight }}>{q}</button>
                ))}
              </div>

              <div style={{ display:'flex', gap:9, marginBottom: agentA ? 16 : 0, alignItems:'flex-end' }}>
                <textarea ref={agentRef} value={agentQ}
                  onChange={e => setAgentQ(e.target.value)}
                  onKeyDown={e => e.key==='Enter' && !e.shiftKey && (e.preventDefault(), askAgent())}
                  placeholder="Ask KAI anything…" rows={2}
                  style={{ flex:1, background:'none', border:'none', borderBottom:`1px solid ${C.hairline}`, borderRadius:0, padding:'8px 2px', fontSize:13, color:C.paper, outline:'none', fontFamily:'inherit', resize:'none', lineHeight:1.5, caretColor:C.goldLight, transition:'border-color 0.15s ease' }}
                  onFocus={e => (e.target.style.borderColor=C.gold)}
                  onBlur={e  => (e.target.style.borderColor=C.hairline)}
                />
                <button onClick={askAgent} disabled={agentBusy||!agentQ.trim()} style={{
                  padding:'0 20px', borderRadius:999, flexShrink:0, border:'none', height:38,
                  background:agentQ.trim()&&!agentBusy?C.gold:'transparent',
                  color:agentQ.trim()&&!agentBusy?C.ink:C.inkLight,
                  cursor:agentQ.trim()?'pointer':'not-allowed',
                  fontSize:13, fontWeight:700, fontFamily:'inherit',
                }}>
                  {agentBusy ? 'Asking…' : 'Send'}
                </button>
              </div>

              <AnimatePresence>
                {agentA && (
                  <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
                    style={{ paddingLeft:14, borderLeft:`2px solid ${C.gold}`, fontSize:13, color:C.paperDim, lineHeight:1.65, maxHeight:200, overflowY:'auto' }}>
                    <span dangerouslySetInnerHTML={{ __html:formatChat(agentA) }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </div>

          <div className="home-main">
            {/* PORTFOLIO */}
            <section className="home-section" aria-label="Portfolio">
              <p style={label}>Estimated portfolio value</p>
              {balancesLoading ? (
                <p style={{ fontSize:14, color:C.inkLight, marginBottom:16 }}>Loading…</p>
              ) : (
                <div style={{ display:'flex', alignItems:'baseline', gap:12, marginBottom:22 }}>
                  <span style={{ ...SERIF, fontSize:44, fontWeight:600, letterSpacing:'-1px', color:connected?C.paper:C.inkLight, lineHeight:1 }}>
                    ${connected ? totalUsd.toFixed(2) : '0.00'}
                  </span>
                  {connected && totalUsd>0 && <span style={{ fontSize:13, ...HL.green }}>+0.00%</span>}
                </div>
              )}

              {connected ? (
                <>
                  {balancesLoading ? (
                    <p style={{ fontSize:13, color:C.inkLight, marginBottom:20 }}>Loading balances…</p>
                  ) : (
                    <div className="home-tokens" style={{ marginBottom:20 }}>
                      {allTokens.map(b => {
                        const tint = b.symbol === 'AVAX' ? C.goldLight : C.paperDim;
                        return (
                          <div key={b.symbol} className="home-token">
                            <p style={{ ...MONO, fontSize:9, letterSpacing:0.5, textTransform:'uppercase', color:C.inkLight, margin:'0 0 4px', fontWeight:600 }}>{b.symbol}</p>
                            <p style={{ ...SERIF, fontSize:16, fontWeight:600, color:tint, margin:0 }}>
                              {b.value>=1000?`${(b.value/1000).toFixed(1)}K`:b.value>=0.001?b.value.toFixed(3):'0.000'}
                            </p>
                            {!b.deployed && <p style={{ fontSize:8, color:C.inkLight, opacity:0.7, fontWeight:600, margin:'3px 0 0' }}>Coming soon</p>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap', paddingTop:16, borderTop:`1px solid ${C.hairline}` }}>
                    <span style={{ ...MONO, fontSize:12, color:C.inkLight, wordBreak:'break-all' }}>{address}</span>
                    <button onClick={copyAddress} style={{ background:'none', border:'none', cursor:'pointer', color:copied?C.goldLight:C.inkLight, fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:4, padding:0 }}>
                      {copied?'Copied':(<><Copy size={12}/> Copy</>)}
                    </button>
                    <button onClick={handleRefresh} style={{ background:'none', border:'none', cursor:'pointer', color:C.inkLight, fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:4, padding:0 }}>
                      <RefreshCw size={12} style={{ animation:refreshing?'spin 1s linear infinite':'none' }} /> Refresh
                    </button>
                  </div>
                </>
              ) : (
                <button onClick={() => setShowModal(true)} className="text-link" style={{ background:'none', border:'none', cursor:'pointer', padding:0, font:'inherit', fontSize:14 }}>
                  Connect a wallet to see your balances
                </button>
              )}
            </section>

            {/* DASHBOARDS */}
            <section className="home-section" id="dashboards"
              style={{ scrollMarginTop:70 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                <p style={{ ...label, margin:0 }}>Dashboards</p>
                <span style={{ ...MONO, fontSize:11, fontWeight:600, color:C.goldLight }}>● 3 active</span>
              </div>
              <div>
                {DASHBOARDS.map((d) => {
                  const Icon = d.icon;
                  return (
                    <Link key={d.id} href={d.href} className="dash-row">
                      <Icon size={20} className="action-icon" strokeWidth={1.6} style={{ flexShrink:0 }}/>
                      <div style={{ flex:1 }}>
                        <p className="dash-title" style={{ ...SERIF, fontSize:17, fontWeight:600, margin:'0 0 2px', color:C.paper, transition:'color 0.15s ease' }}>{d.hl}</p>
                        <p style={{ fontSize:12, color:C.inkLight, margin:'0 0 2px' }}>{d.label}</p>
                        <p style={{ fontSize:11, color:C.inkLight, opacity:0.75, margin:0 }}>{d.sub}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* QUICK ACTIONS — a link list, not a grid of icon tiles */}
            <section className="home-section" id="actions"
              style={{ scrollMarginTop:70 }}>
              <p style={label}>Quick actions</p>
              <div className="qa-list">
                {QUICK.map((a) => {
                  const Icon = a.icon;
                  const isAgent = a.href === '/ai';
                  const content = (
                    <>
                      <Icon size={18} className="action-icon" strokeWidth={1.6}/>
                      <span className="qa-label">{a.name}</span>
                    </>
                  );
                  return isAgent ? (
                    <button key={a.name} onClick={openAIChat} className="qa-row">{content}</button>
                  ) : (
                    <Link key={a.name} href={a.href} className="qa-row">{content}</Link>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>

      {showModal && <WalletConnectModal onClose={() => setShowModal(false)} />}
    </main>
  );
}
