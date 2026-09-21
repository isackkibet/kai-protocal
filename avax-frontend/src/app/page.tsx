'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { useBalance, useReadContracts } from 'wagmi';
import { formatUnits } from 'viem';
import { useKaivaxStore } from '@/store/useKaivaxStore';
const WalletConnectModal = dynamic(() => import('@/components/WalletConnectModal'), { ssr: false });
import { ECOSYSTEM_TOKENS, TICKER_TOKENS } from '@/lib/tokens';
import { ERC20_ABI } from '@/lib/erc20abi';
import { usePrivyAuth } from '@/lib/privy-auth';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import {
  Mic, Bot, FlaskConical, ScanLine, CircleDollarSign,
  Globe, ShieldCheck, ImageIcon, Droplets, Lock, Gift,
  LayoutGrid, Copy, RefreshCw, Link2, UserRound,
  type LucideIcon,
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

/* Every section opens the same way — icon + eyebrow label, optional status
   badge on the right — so the page reads as clearly split sections instead
   of one long scroll, the same clarity the hero's Connect Wallet button has. */
function SectionHeader({ icon: Icon, eyebrow, badge }: { icon: LucideIcon; eyebrow: string; badge?: string }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
      <div style={{ display:'flex', alignItems:'center', gap:9 }}>
        <Icon size={14} color={C.goldLight} strokeWidth={2} />
        <p style={{ ...label, margin:0 }}>{eyebrow}</p>
      </div>
      {badge && <span style={{ ...MONO, fontSize:11, fontWeight:600, color:C.goldLight }}>{badge}</span>}
    </div>
  );
}

/* Sections render fully visible on load — no hide-until-scroll animation,
   so everything is on the page at once. */
const reveal = {} as const;

const QUICK_GROUPS = [
  {
    title: 'Agents',
    items: [
      { name: 'Voice Agent', href: '/voice', icon: Mic },
      { name: 'AI Agent',    href: '/ai',    icon: Bot },
    ],
  },
  {
    title: 'DeFi · Earn',
    items: [
      { name: 'Securities', href: '/securities', icon: ShieldCheck },
      { name: 'Pools',      href: '/pools',      icon: Droplets },
      { name: 'Vaults',     href: '/vaults',     icon: Lock },
      { name: 'TaaS',       href: '/taas',       icon: LayoutGrid },
    ],
  },
  {
    title: 'Shop · Pay',
    items: [
      { name: 'Scan & Pay', href: '/pay',      icon: ScanLine },
      { name: 'Products',   href: '/products', icon: CircleDollarSign },
      { name: 'NFT Mkt',    href: '/connft',   icon: ImageIcon },
      { name: 'Airdrop',    href: '/mine',     icon: Gift },
    ],
  },
  {
    title: 'Explore',
    items: [
      { name: 'Playground', href: '/nuvari', icon: FlaskConical },
      { name: 'SDG Impact', href: '/sdg',    icon: Globe },
      { name: 'KAI Web',    href: '/kai',    icon: Link2 },
    ],
  },
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

  const [showModal,  setShowModal]  = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copied,     setCopied]     = useState(false);
  const [profile,    setProfile]    = useState<{ name?: string; displayName?: string } | null>(null);

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

      <div className="home-container" style={{ position:'relative', zIndex:5 }}>

        {/* SECTION 1 — CONNECT WALLET (hero photo). Colors are the original
            KAI palette only; the photo is a mask. */}
        <div style={{
          width: '100vw', marginLeft: '50%', transform: 'translateX(-50%)',
          position: 'relative', zIndex: 5,
          minHeight: 'clamp(420px, 56vh, 560px)',
          display: 'flex', alignItems: 'flex-start',
          padding: '80px 0 56px',
          boxSizing: 'border-box',
          backgroundImage:
            `linear-gradient(180deg, rgba(11,28,20,0.15) 0%, rgba(11,28,20,0.65) 55%, ${C.bg} 100%),` +
            `linear-gradient(90deg, rgba(11,28,20,0.97) 0%, rgba(11,28,20,0.80) 32%, rgba(11,28,20,0.32) 64%, rgba(11,28,20,0.10) 100%),` +
            'url("/images/home-hero.jpg")',
          backgroundSize: 'cover', backgroundPosition: 'center 30%',
          textAlign: 'left',
          borderBottom: `1px solid ${C.hairline}`,
        }}>
          <div style={{ width: 'min(1150px, calc(100% - 48px))', marginInline: 'auto', boxSizing: 'border-box', position: 'relative', zIndex: 2 }}>
            <div style={{ maxWidth: 660 }}>
              {/* Pill badge — original gold dot, not the screenshot's orange */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '7px 14px', borderRadius: 999, background: 'rgba(246,242,231,0.06)', border: `1px solid rgba(228,200,120,0.28)` }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.goldLight, boxShadow: '0 0 10px rgba(228,200,120,0.9)' }} />
                <span style={{ ...MONO, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: C.goldLight, fontWeight: 600 }}>Avalanche C-Chain · Forest Finance</span>
              </div>

              <h1 style={{ ...SERIF, fontSize: 'clamp(2.6rem, 1.9rem + 3vw, 4.3rem)', fontWeight: 700, margin: '24px 0 0', letterSpacing: '-0.5px', lineHeight: 1.08 }}>
                <span style={HL.green}>KAI</span> <span style={{ color: C.paper }}>Nuvari</span>
              </h1>
              <p style={{ fontSize: 16, color: C.paperDim, margin: '32px 0 0', maxWidth: 490, lineHeight: 1.6 }}>
                A DeFi ecosystem on Avalanche C-Chain with six tokens, yield vaults, liquidity pools, and DAO governance,
                plus community savings groups and a KAI agent that can check balances and find yield for you.
                Connect a wallet to see your portfolio, join a dashboard, and get started.
              </p>

              <motion.button whileTap={{ scale: 0.98 }} onClick={() => {
                if (privyAuthenticated) { router.push('/wallet'); return; }
                setShowModal(true);
              }}
                style={{
                  marginTop: 40, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  padding: '16px 32px', borderRadius: 999, cursor: 'pointer', border: 'none',
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
        </div>

        {/* SECTION 2 — PROFILE */}
        <motion.section className="home-section" aria-label="Profile" style={{ marginTop: 40 }} {...reveal}>
          <SectionHeader icon={UserRound} eyebrow="Profile" badge={connected ? '● Active' : undefined} />
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:24 }}>
            <div style={{ position:'relative', flexShrink:0 }}>
              <div style={{
                width:52, height:52, borderRadius:'50%', background:C.gold,
                display:'flex', alignItems:'center', justifyContent:'center',
                ...SERIF, fontSize:20, fontWeight:600, color:C.ink,
              }}>{(displayName || 'K').charAt(0).toUpperCase()}</div>
              <span style={{ position:'absolute', bottom:1, right:0, width:11, height:11, borderRadius:'50%', background:C.pineLight, border:`2px solid ${C.bg}` }} />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
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

          {connected ? (
            <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap', marginTop:18, paddingTop:16, borderTop:`1px solid ${C.hairline}` }}>
              <span style={{ ...MONO, fontSize:12, color:C.inkLight, wordBreak:'break-all' }}>{address}</span>
              <button onClick={copyAddress} style={{ background:'none', border:'none', cursor:'pointer', color:copied?C.goldLight:C.inkLight, fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:4, padding:0 }}>
                {copied?'Copied':(<><Copy size={12}/> Copy</>)}
              </button>
              <button onClick={handleRefresh} style={{ background:'none', border:'none', cursor:'pointer', color:C.inkLight, fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:4, padding:0 }}>
                <RefreshCw size={12} style={{ animation:refreshing?'spin 1s linear infinite':'none' }} /> Refresh
              </button>
            </div>
          ) : (
            <button onClick={() => setShowModal(true)} className="text-link" style={{ background:'none', border:'none', cursor:'pointer', padding:0, font:'inherit', fontSize:14, marginTop:18 }}>
              Connect a wallet to see your balances
            </button>
          )}
        </motion.section>

        {/* SECTION 3 — QUICK ACTIONS, arranged in groups so all 13 are
            visible at once and easy to scan. */}
        <motion.section className="home-section" id="actions"
          style={{ scrollMarginTop:70 }} {...reveal}>
          <SectionHeader icon={LayoutGrid} eyebrow="Quick actions" badge="● 13 apps" />
          <div className="qa-groups">
            {QUICK_GROUPS.map(g => (
              <div key={g.title} className="qa-group">
                <p className="qa-group-title">{g.title}</p>
                <div className="qa-grid">
                  {g.items.map(a => {
                    const Icon = a.icon;
                    return (
                      <Link key={a.name} href={a.href} className="qa-tile">
                        <Icon size={18} className="qa-tile-icon" strokeWidth={1.6}/>
                        <span className="qa-tile-label">{a.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      </div>

      {showModal && <WalletConnectModal onClose={() => setShowModal(false)} />}
    </main>
  );
}