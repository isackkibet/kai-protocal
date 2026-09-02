'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount, useBalance, useDisconnect, useReadContracts } from 'wagmi';
import { formatUnits } from 'viem';
import { useKaivaxStore } from '@/store/useKaivaxStore';
import WalletConnectModal from '@/components/WalletConnectModal';
import { ECOSYSTEM_TOKENS, TICKER_TOKENS } from '@/lib/tokens';
import { ERC20_ABI } from '@/lib/erc20abi';
import {
  Copy, RefreshCw, Wallet,
} from 'lucide-react';

const quickActions = [
  { name: 'AI Agent',    href: '/ai',         emoji: '🤖',  color: '#7c3aed' },
  { name: 'Playground',  href: '/nuvari',     emoji: '⚗️',  color: '#c9a24b' },
  { name: 'Pay & QR',   href: '/pay',        emoji: '💳',  color: '#22c55e' },
  { name: 'Securities',  href: '/securities', emoji: '🏛️',  color: '#a78bfa' },
  { name: 'NFT Mkt',     href: '/connft',     emoji: '🍃',  color: '#3b82f6' },
  { name: 'Pools',       href: '/pools',      emoji: '🫧',  color: '#34d399' },
  { name: 'Vaults',      href: '/vaults',     emoji: '🏦',  color: '#f59e0b' },
  { name: 'Airdrop',     href: '/mine',       emoji: '⛏️',  color: '#f97316' },
  { name: 'KAI Web',     href: '/kai',        emoji: '📖',  color: '#e84142' },
];

// Build wagmi contract read calls from token list (only for deployed tokens)
function buildContractCalls(address: `0x${string}` | undefined) {
  if (!address) return [];
  return ECOSYSTEM_TOKENS
    .filter(t => t.address)
    .map(t => ({
      address: t.address as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'balanceOf' as const,
      args: [address],
    }));
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: avaxBalance, refetch: refetchAvax } = useBalance({ address });

  const { connectWallet, disconnectWallet, setAvaxBalance, setAllBalances } = useKaivaxStore();

  const [showModal, setShowModal]     = useState(false);
  const [tickerOffset, setTickerOffset] = useState(0);
  const [refreshing, setRefreshing]   = useState(false);
  const [copied, setCopied]           = useState(false);

  // Keep Zustand in sync with wagmi account
  useEffect(() => {
    if (isConnected && address) {
      connectWallet('metamask', address);
    } else {
      disconnectWallet();
    }
  }, [isConnected, address]);

  // Sync AVAX balance into store
  useEffect(() => {
    if (avaxBalance) {
      setAvaxBalance(Number(formatUnits(avaxBalance.value, avaxBalance.decimals)));
    }
  }, [avaxBalance]);

  // Read on-chain balances for all deployed ecosystem tokens
  const contractCalls = buildContractCalls(address);
  const { data: tokenData, refetch: refetchTokens } = useReadContracts({
    contracts: contractCalls,
  });

  // Parse token balances from results
  const tokenBalances = (() => {
    const out: Record<string, number> = {};
    const deployedTokens = ECOSYSTEM_TOKENS.filter(t => t.address);
    if (tokenData) {
      deployedTokens.forEach((token, idx) => {
        const result = tokenData[idx];
        if (result?.status === 'success' && result.result !== undefined) {
          out[token.symbol.toLowerCase()] = Number(formatUnits(result.result as bigint, 18));
        } else {
          out[token.symbol.toLowerCase()] = 0;
        }
      });
    } else {
      deployedTokens.forEach(t => { out[t.symbol.toLowerCase()] = 0; });
    }
    // Tokens without a deployed address show 0
    ECOSYSTEM_TOKENS.filter(t => !t.address).forEach(t => {
      out[t.symbol.toLowerCase()] = 0;
    });
    return out;
  })();

  // Sync ecosystem token balances into Zustand store
  useEffect(() => {
    if (isConnected) {
      setAllBalances({
        nvr:    tokenBalances['nvr']    ?? 0,
        ybob:   tokenBalances['ybob']   ?? 0,
        ytoken: tokenBalances['ytoken'] ?? 0,
        ygold:  tokenBalances['ygold']  ?? 0,
        gami:   tokenBalances['gami']   ?? 0,
        cents:  tokenBalances['cents']  ?? 0,
      });
    }
  }, [JSON.stringify(tokenBalances), isConnected]);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await Promise.allSettled([refetchAvax(), refetchTokens()]);
    setRefreshing(false);
  };

  // Ticker scroll
  useEffect(() => {
    const id = setInterval(() => setTickerOffset(o => (o - 1) % 600), 30);
    return () => clearInterval(id);
  }, []);

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const avaxAmt = avaxBalance
    ? Number(formatUnits(avaxBalance.value, avaxBalance.decimals))
    : 0;

  // All tokens for balance display: AVAX + 5 ecosystem tokens
  const allTokenDisplays = [
    { symbol: 'AVAX',   value: avaxAmt,                          color: '#e84142', emoji: '⛰️',  deployed: true },
    ...ECOSYSTEM_TOKENS.map(t => ({
      symbol:   t.symbol,
      value:    tokenBalances[t.symbol.toLowerCase()] ?? 0,
      color:    t.color,
      emoji:    t.emoji,
      deployed: !!t.address,
    })),
  ];

  return (
    <main className="flex flex-col min-h-[100dvh] w-full max-w-md mx-auto relative pb-24">

      {/* ── TICKER ── */}
      <div style={{ background:'rgba(0,0,0,0.5)', borderBottom:'1px solid rgba(232,65,66,0.15)', padding:'5px 0', overflow:'hidden', flexShrink:0 }}>
        <div style={{ display:'inline-flex', gap:32, paddingLeft:16, transform:`translateX(${tickerOffset}px)`, whiteSpace:'nowrap' }}>
          {[...TICKER_TOKENS, ...TICKER_TOKENS, ...TICKER_TOKENS].map((t, i) => (
            <span key={i} style={{ fontSize:11, fontWeight:600 }}>
              <span style={{ color:'rgba(255,255,255,0.5)' }}>{t.s} </span>
              <span style={{ color:'#fff' }}>{t.p} </span>
              <span style={{ color:'#22c55e' }}>{t.c}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── HEADER ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px 8px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div className="float" style={{
            width:40, height:40, borderRadius:'50%',
            background:'linear-gradient(135deg,#e84142,#7c1d1d)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 0 18px rgba(232,65,66,0.55)',
          }}>
            <span style={{ color:'#fff', fontWeight:900, fontSize:18 }}>K</span>
          </div>
          <div>
            <span className="shimmer-text" style={{ fontSize:20, fontWeight:900, letterSpacing:2 }}>KAI NUVARI</span>
            <p style={{ fontSize:9, color:'rgba(255,255,255,0.4)', margin:0, letterSpacing:1 }}>
              AVAX C-CHAIN · DEFI ECOSYSTEM
            </p>
          </div>
        </div>

        {/* Wallet Btn */}
        <button
          onClick={() => setShowModal(true)}
          style={{
            background: isConnected ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'linear-gradient(135deg,#e84142,#7c1d1d)',
            color:'#fff', fontWeight:700, fontSize:11, padding:'8px 14px',
            borderRadius:999, border:'none', cursor:'pointer',
            boxShadow: isConnected ? '0 0 12px rgba(34,197,94,0.4)' : '0 0 12px rgba(232,65,66,0.4)',
          }}
        >
          {isConnected ? `✓ ${address?.slice(0,6)}…${address?.slice(-4)}` : '🔗 Connect Wallet'}
        </button>
      </div>

      {/* ── NETWORK BADGE ── */}
      <div style={{
        margin:'0 16px 12px', padding:'10px 14px', borderRadius:12,
        background:'rgba(232,65,66,0.07)', border:'1px solid rgba(232,65,66,0.22)',
        display:'flex', alignItems:'center', gap:10,
      }}>
        <div style={{ fontSize:20 }}>⛰️</div>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:11, fontWeight:700, color:'#e84142', margin:0 }}>
            Avalanche C-Chain · MetaMask &amp; Core Wallet
          </p>
          <p style={{ fontSize:10, color:'rgba(255,255,255,0.4)', margin:'2px 0 0' }}>
            6 Ecosystem Tokens · DeFi Vaults · DAO Governance
          </p>
        </div>
        <div style={{ display:'flex', gap:4 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width:6, height:6, borderRadius:'50%', background:'#e84142',
              animation:`pulse-gold ${1+i*0.3}s ease-in-out infinite`,
              opacity: 0.5+i*0.2
            }}/>
          ))}
        </div>
      </div>

      {/* ── PROFILE CARD ── */}
      <div className="glass" style={{ margin:'0 16px 14px', padding:20, borderRadius:16, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background:'rgba(232,65,66,0.08)', filter:'blur(20px)' }}/>

        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,#e84142,#7c1d1d)', padding:2 }}>
              <div style={{ width:'100%', height:'100%', borderRadius:'50%', background:'#0a0a0c', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:900, color:'#e84142' }}>
                A
              </div>
            </div>
            <div>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.4)', margin:'0 0 2px' }}>Good day,</p>
              <h2 style={{ fontSize:17, fontWeight:900, margin:'0 0 2px', color:'#fff' }}>AUSTIN NAMUYE</h2>
              <p style={{ fontSize:10, color:'rgba(255,255,255,0.35)', margin:0 }}>@drekahshi · 🇰🇪 Kenya</p>
            </div>
          </div>
          <div style={{ background:'rgba(232,65,66,0.1)', border:'1px solid rgba(232,65,66,0.3)', borderRadius:999, padding:'5px 10px', fontSize:11, color:'#e84142', fontWeight:600 }}>
            ⛰️ AVAX
          </div>
        </div>

        {/* ── Token Balances ── */}
        {isConnected ? (
          <>
            {/* Scrollable token balance strip */}
            <div style={{ overflowX:'auto', scrollbarWidth:'none', marginBottom:10 }}>
              <div style={{ display:'flex', gap:8, paddingBottom:4, minWidth:'max-content' }}>
                {allTokenDisplays.map(b => (
                  <div key={b.symbol} style={{
                    background:'rgba(255,255,255,0.04)', borderRadius:12, padding:'10px 12px',
                    border:`1px solid ${b.color}30`, textAlign:'center', minWidth:80, flexShrink:0,
                    position:'relative',
                  }}>
                    <div style={{ fontSize:16, marginBottom:2 }}>{b.emoji}</div>
                    <p style={{ fontSize:9, color:'rgba(255,255,255,0.4)', margin:'0 0 2px', fontWeight:700 }}>{b.symbol}</p>
                    <p style={{ fontSize:15, fontWeight:900, color:b.color, margin:0 }}>
                      {b.value >= 1000
                        ? `${(b.value / 1000).toFixed(1)}K`
                        : b.value >= 0.0001
                          ? b.value.toFixed(3)
                          : '0.000'}
                    </p>
                    {!b.deployed && (
                      <div style={{ position:'absolute', top:4, right:4, fontSize:7, color:'rgba(255,255,255,0.25)', background:'rgba(0,0,0,0.4)', borderRadius:3, padding:'1px 3px' }}>
                        SOON
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Rate hint */}
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', marginBottom:10, textAlign:'center' }}>
              Rate: 1 AVAX = 100 ecosystem tokens &nbsp;·&nbsp; Scroll to see all tokens →
            </div>

            {/* Address row */}
            <div style={{ display:'flex', gap:6, marginBottom:10 }}>
              <div style={{ flex:1, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'7px 10px', fontFamily:'monospace', fontSize:10, color:'rgba(255,255,255,0.55)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {address}
              </div>
              <button onClick={copyAddress} title="Copy address" style={{ padding:'7px 10px', borderRadius:10, background:'rgba(232,65,66,0.1)', border:'1px solid rgba(232,65,66,0.25)', cursor:'pointer', color: copied ? '#22c55e' : '#e84142', fontSize:11, fontWeight:700 }}>
                {copied ? '✓' : <Copy size={14} />}
              </button>
            </div>

            <button onClick={handleRefresh} style={{ width:'100%', padding:8, borderRadius:10, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontSize:11, color:'rgba(255,255,255,0.7)' }}>
              <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              Refresh Balances
            </button>
          </>
        ) : (
          <button onClick={() => setShowModal(true)} style={{ width:'100%', background:'rgba(232,65,66,0.08)', borderRadius:12, padding:'14px 10px', border:'1px dashed rgba(232,65,66,0.35)', textAlign:'center', cursor:'pointer', color:'#e84142', fontSize:12, fontWeight:700 }}>
            Connect MetaMask / Core Wallet to view balances
          </button>
        )}
      </div>

      {/* ── ACTION GRID ── */}
      <div style={{ padding:'0 16px 16px' }}>
        <p style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginBottom:10, fontWeight:700, letterSpacing:1 }}>QUICK ACTIONS</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {quickActions.map((a) => {
            const hexColor = a.color;
            // Parse hex to rgb for rgba backgrounds
            const r = parseInt(hexColor.slice(1,3),16);
            const g = parseInt(hexColor.slice(3,5),16);
            const b = parseInt(hexColor.slice(5,7),16);
            return (
              <Link href={a.href} key={a.name} style={{ textDecoration:'none' }}>
                <div className="glass" style={{
                  padding:'20px 16px', borderRadius:20,
                  display:'flex', flexDirection:'column', alignItems:'center', gap:10, cursor:'pointer',
                  border:`1px solid ${a.color}25`,
                  background:`rgba(${r},${g},${b},0.06)`,
                }}>
                  <div style={{
                    width:48, height:48, borderRadius:'50%',
                    background:`${a.color}20`, border:`2px solid ${a.color}50`,
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:22,
                    boxShadow:`0 0 16px ${a.color}30`,
                  }}>{a.emoji}</div>
                  <span style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.9)', textAlign:'center' }}>{a.name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── FOOTER STATS ── */}
      <div style={{ margin:'0 16px', padding:'12px 16px', borderRadius:14, background:'rgba(232,65,66,0.06)', border:'1px solid rgba(232,65,66,0.15)', display:'flex', gap:16, justifyContent:'space-around' }}>
        {[
          { label:'Chain',  value:'Fuji Testnet',  icon:'⛰️' },
          { label:'Tokens', value:'6 Active',       icon:'🪙'  },
          { label:'AI',     value:'Qwen3 RAG',      icon:'🤖' },
        ].map(s => (
          <div key={s.label} style={{ textAlign:'center' }}>
            <div style={{ fontSize:18 }}>{s.icon}</div>
            <p style={{ fontSize:8, color:'rgba(255,255,255,0.35)', margin:'2px 0 0', fontWeight:700, letterSpacing:0.5 }}>{s.label}</p>
            <p style={{ fontSize:9, color:'#e84142', margin:0, fontWeight:700 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Wallet Modal */}
      {showModal && <WalletConnectModal onClose={() => setShowModal(false)} />}

    </main>
  );
}
