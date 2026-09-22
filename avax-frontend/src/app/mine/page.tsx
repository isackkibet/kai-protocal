'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import WalletConnectModal from '@/components/WalletConnectModal';
import { useKaivaxStore } from '@/store/useKaivaxStore';
import { usePrivyAuth } from '@/lib/privy-auth';
import {
  ArrowLeft, CheckCircle, Clock, Coins, Gift,
  Layers, Sparkles, Star, Timer, TrendingUp,
  UserPlus, Zap,
} from 'lucide-react';
import SDGImpactCard from '@/components/SDGImpactCard';

/* Same editorial system as the rest of the app — pine + gold + paper,
   flat sections separated by a hairline, no card shells. This page used
   to run its own black/white/Avalanche-red theme with bordered/filled
   "surface" boxes around every stat and task; that mismatch, plus the
   boxes themselves, is what read as inconsistent and impersonal. */
const C = {
  bg:        '#0B1C14',
  gold:      '#C89B3C',
  goldLight: '#E4C878',
  paper:     '#F6F2E7',
  paperDim:  '#EFE9D9',
  inkLight:  '#9BA396',
  hairline:  'rgba(200,155,60,0.14)',
};
const MONO: React.CSSProperties = { fontFamily: 'var(--font-plex-mono), monospace' };
const SERIF: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const label: React.CSSProperties = { ...MONO, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: C.goldLight, fontWeight: 600, margin: 0 };
const h2: React.CSSProperties = { ...SERIF, fontSize: 17, fontWeight: 600, color: C.paper, margin: 0 };
const sub: React.CSSProperties = { fontSize: 12.5, color: C.inkLight, margin: '3px 0 0' };
const W: React.CSSProperties = { width: '100%', maxWidth: 1120, margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' };

const POOLS = [
  { name:'AVAX Alpha Miners', spots:'247/500', pct:49, open:true,  reward:500,  unit:'NVR' },
  { name:'NVR Launch Pool',   spots:'89/200',  pct:45, open:true,  reward:1000, unit:'NVR' },
  { name:'Core Wallet Promo', spots:'500/500', pct:100,open:false, reward:200,  unit:'NVR' },
];

const TOKEN_DROPS = [
  { symbol:'NVR',    name:'Nuvari Token',  reward:10, unit:'NVR',    color:'#E4C878' },
  { symbol:'YBOB',   name:'Stablecoin',    reward:2,  unit:'YBOB',   color:'#7DC383' },
  { symbol:'YTOKEN', name:'Yield Token',   reward:1,  unit:'YTOKEN', color:'#6FA8DC' },
  { symbol:'GAMI',   name:'Community',     reward:5,  unit:'GAMI',   color:'#C89B3C' },
];

const TASKS = [
  { id:'checkin',   title:'Daily check-in',  desc:'Open the app today',       reward:5,    unit:'NVR',    color:'#E4C878' },
  { id:'policy',    title:'Explore policy',  desc:'Open any policy template', reward:2,    unit:'YBOB',   color:'#7DC383' },
  { id:'agent',     title:'Ask KAI agent',   desc:'Chat with KAI once',       reward:1,    unit:'GAMI',   color:'#C89B3C' },
  { id:'community', title:'Join community',  desc:'Follow ecosystem updates', reward:1,    unit:'YTOKEN', color:'#6FA8DC' },
];

/* Numbers that visibly count up when they change feel alive, not just swapped */
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

/* Flat, neutral progress bar — no token colour, no glow. */
function Bar({ v, max }: { v:number; max:number }) {
  return (
    <div style={{ height:3, borderRadius:2, background:C.hairline, overflow:'hidden' }}>
      <motion.div initial={{ width:0 }} animate={{ width:`${Math.min(v/max*100,100)}%` }}
        transition={{ duration:0.9, ease:'easeOut' }}
        style={{ height:'100%', borderRadius:2, background:C.gold }} />
    </div>
  );
}

export default function MinePage() {
  const { isConnected } = useAccount();
  const privy = usePrivyAuth();
  const setTokenBalance = useKaivaxStore(s => s.setTokenBalance);

  const [showModal,  setShowModal]  = useState(false);
  const [claimed,    setClaimed]    = useState(false);
  const [claiming,   setClaiming]   = useState(false);
  const [countdown,  setCountdown]  = useState(86400);
  const [joinedWait, setJoinedWait] = useState(false);
  const [joiningWait,setJoiningWait]= useState(false);
  const [wlMsg,      setWlMsg]      = useState('');
  const [showMint,   setShowMint]   = useState(false);
  const [minted,     setMinted]     = useState<string|null>(null);
  const [mintName,   setMintName]   = useState('');
  const [mintSym,    setMintSym]    = useState('');
  const [mintSupply, setMintSupply] = useState('');
  const [doneTasks,  setDoneTasks]  = useState<string[]>([]);
  const [taskMsg,    setTaskMsg]    = useState('');
  const [agentOn,    setAgentOn]    = useState(false);
  const [activePool, setActivePool] = useState<number|null>(null);
  const [heroMsg,    setHeroMsg]    = useState('');
  const [minedAmount,setMinedAmount]= useState(0);

  useEffect(() => {
    const id = setInterval(() => setCountdown(c => Math.max(0,c-1)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!agentOn) return;
    const id = setInterval(() => setMinedAmount(m => m + 0.003), 1000);
    return () => clearInterval(id);
  }, [agentOn]);

  const pts = doneTasks.length * 5 + (claimed ? 10 : 0);
  const displayPts = useCountUp(pts);
  /* Streak stays honest: it starts at 0 and only ticks once you engage. */
  const streak = claimed || doneTasks.length > 0 ? 1 : 0;

  const fmt = (s:number) => {
    const h   = Math.floor(s/3600).toString().padStart(2,'0');
    const m   = Math.floor((s%3600)/60).toString().padStart(2,'0');
    const sec = (s%60).toString().padStart(2,'0');
    return `${h}:${m}:${sec}`;
  };

  const claim = async () => {
    if (!isConnected) { setShowModal(true); return; }
    setClaiming(true);
    await new Promise(r => setTimeout(r,1400));
    setTokenBalance('nvr', useKaivaxStore.getState().balances.nvr + 10);
    setClaimed(true); setClaiming(false);
    setHeroMsg('10 NVR added to your wallet.');
    setTimeout(() => setHeroMsg(''), 4000);
  };

  const doTask = (id:string, reward:number, unit:string) => {
    if (!isConnected) { setShowModal(true); return; }
    if (doneTasks.includes(id)) return;
    const k = unit.toLowerCase() as 'nvr'|'ybob'|'ytoken'|'gami';
    setTokenBalance(k, useKaivaxStore.getState().balances[k] + reward);
    setDoneTasks(t => [...t, id]);
    setTaskMsg(`+${reward} ${unit} added to wallet`);
    setTimeout(() => setTaskMsg(''), 3000);
  };

  const mintToken = () => {
    if (!mintName||!mintSym||!mintSupply) return;
    setMinted(`0x${Math.random().toString(16).slice(2,12).toUpperCase()}`);
  };

  const joinWaitlist = async () => {
    if (joiningWait) return;
    setJoiningWait(true);
    setWlMsg('');
    try {
      const token = await privy.getAccessToken();
      const r = await fetch('/api/whitelist', { method: 'POST', headers: token ? { authorization: `Bearer ${token}` } : {} });
      const d = await r.json();
      if (r.ok) setJoinedWait(true);
      else setWlMsg(String(d.error ?? 'Could not join — try again'));
    } catch {
      setWlMsg('Network error — try again');
    }
    setJoiningWait(false);
  };

  return (
    <main style={{ minHeight:'100dvh', background:C.bg, color:C.paper, fontFamily:"'Poppins', 'IBM Plex Sans', var(--font-sans)", position:'relative', paddingBottom:88 }}>
      <style>{`.airdrop-row:hover:not(:disabled) { background: rgba(200,155,60,0.06); }`}</style>
      <div style={{ ...W, paddingTop:32 }}>
        <Link href="/" style={{ display:'inline-flex', alignItems:'center', gap:8, textDecoration:'none', color:C.inkLight, fontSize:13, marginBottom:32, transition:'color 0.15s ease' }}
          onMouseEnter={e => (e.currentTarget.style.color=C.goldLight)}
          onMouseLeave={e => (e.currentTarget.style.color=C.inkLight)}>
          <ArrowLeft size={14}/> Back to Home
        </Link>

        {/* HERO — centred, flat. The claim action is the one loud thing on the page. */}
        <div style={{ textAlign:'center', maxWidth:600, margin:'0 auto' }}>
          <p style={{ ...label, display:'inline-flex', alignItems:'center', gap:8, marginBottom:20 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:C.goldLight }} /> Live rewards · Fuji testnet
          </p>

          <h1 style={{ ...SERIF, fontSize:'clamp(30px,4vw,42px)', fontWeight:700, letterSpacing:'-1px', lineHeight:1.1, color:C.paper, margin:'0 0 14px' }}>
            Claim <span style={{ color:C.goldLight }}>10 NVR</span> daily
          </h1>
          <p style={{ fontSize:15, lineHeight:1.65, color:C.inkLight, margin:'0 auto', maxWidth:440 }}>
            Complete tasks to earn <span style={{ color:C.paper, fontWeight:700 }}>Kai Bar points</span> toward the <span style={{ color:C.paper, fontWeight:700 }}>KAI airdrop</span>.
          </p>

          <p style={{ marginTop:18, fontSize:13, fontWeight:500, color:C.inkLight }}>
            <span style={{ ...MONO, fontSize:19, fontWeight:700, color:C.goldLight }}>{displayPts} pts</span>
            &ensp;·&ensp;<span style={MONO}>{streak}-day streak</span>&ensp;·&ensp;<span style={MONO}>{doneTasks.length}/{TASKS.length} today</span>
          </p>

          <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:14, flexWrap:'wrap', marginTop:26 }}>
            <motion.button
              whileTap={claimed||claiming?{}:{ scale:0.98 }}
              onClick={claim} disabled={claimed||claiming}
              style={{
                display:'inline-flex', alignItems:'center', gap:10,
                padding:'16px 32px', borderRadius:999, border:'none',
                cursor: claimed||claiming?'default':'pointer',
                background: claimed?'rgba(200,155,60,0.16)':C.gold,
                color: claimed?C.goldLight:'#1B1A14',
                fontSize:15, fontWeight:700, fontFamily:'inherit',
              }}>
              {claiming
                ? <><Clock size={18} style={{ animation:'spin 1s linear infinite' }}/> Processing…</>
                : claimed
                  ? <><CheckCircle size={18}/> Claimed · next in <span style={MONO}>{fmt(countdown)}</span></>
                  : <><Gift size={18}/> Claim 10 NVR</>
              }
            </motion.button>
            <Link href="/kai-bar" style={{ fontSize:13.5, fontWeight:600, color:C.goldLight, textDecoration:'none' }}>
              View Kai Bar →
            </Link>
          </div>

          <AnimatePresence>
            {heroMsg && (
              <motion.p initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                style={{ margin:'16px 0 0', fontSize:12.5, color:C.goldLight, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                <CheckCircle size={13}/> {heroMsg}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* MAIN CONTENT GRID */}
        <div className="airdrop-main-grid" style={{ marginTop:48, display:'grid', gridTemplateColumns:'1fr 1fr', gap:56, alignItems:'start' }}>

          {/* LEFT COLUMN */}
          <div style={{ minWidth:0 }}>

            {/* TOKEN DROPS */}
            <section>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                <div>
                  <h2 style={h2}>Ecosystem token drops</h2>
                  <p style={sub}>Rotating rewards for active members</p>
                </div>
                <span style={{ fontSize:11.5, color:C.inkLight, fontWeight:500 }}>4 tokens</span>
              </div>
              <div className="airdrop-token-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'22px 24px' }}>
                {TOKEN_DROPS.map(t => (
                  <div key={t.symbol}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                      <span style={{ width:7, height:7, borderRadius:'50%', background:t.color, flexShrink:0 }} />
                      <p style={{ fontSize:13, fontWeight:700, color:C.paper, margin:0 }}>{t.symbol}</p>
                      <p style={{ fontSize:11, color:C.inkLight, margin:0 }}>{t.name}</p>
                    </div>
                    <p style={{ ...SERIF, fontSize:22, fontWeight:600, color:C.goldLight, margin:'0 0 4px' }}>
                      {t.reward.toLocaleString()}<span style={{ fontSize:12, color:C.inkLight, fontWeight:400, marginLeft:6 }}>{t.unit}</span>
                    </p>
                    <p style={{ ...MONO, fontSize:10, color:C.inkLight, fontWeight:600, margin:0 }}>Per claim cycle</p>
                  </div>
                ))}
              </div>
            </section>

            {/* LAUNCHPOOLS */}
            <section style={{ marginTop:36, paddingTop:32, borderTop:`1px solid ${C.hairline}` }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                <div>
                  <h2 style={h2}>Active launchpools</h2>
                  <p style={sub}>Join early for maximum rewards</p>
                </div>
                <span style={{ fontSize:11.5, color:C.inkLight, fontWeight:500 }}>{POOLS.filter(p=>p.open).length} open</span>
              </div>
              {POOLS.map((p,i) => (
                <div key={i}
                  onClick={() => setActivePool(activePool===i?null:i)}
                  className="airdrop-row"
                  style={{ padding:'12px 8px', margin:'0 -8px', borderRadius:10, cursor:'pointer' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                    <Layers size={17} color={C.goldLight} strokeWidth={1.7} style={{ flexShrink:0 }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <p style={{ fontSize:13.5, fontWeight:700, color:C.paper, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</p>
                        <span style={{ ...MONO, fontSize:9.5, fontWeight:700, color: p.open?C.goldLight:C.inkLight, letterSpacing:0.4, flexShrink:0 }}>
                          {p.open ? 'OPEN' : 'CLOSED'}
                        </span>
                      </div>
                      <div style={{ display:'flex', gap:14, alignItems:'center', margin:'5px 0 8px' }}>
                        <span style={{ ...MONO, fontSize:11.5, color:C.inkLight }}>{p.spots}&nbsp;joined</span>
                        <span style={{ ...MONO, fontSize:11.5, fontWeight:700, color:C.goldLight }}>{p.reward.toLocaleString()}&nbsp;{p.unit}</span>
                      </div>
                      <Bar v={p.pct} max={100} />
                    </div>
                    <button
                      disabled={!p.open}
                      onClick={e => { e.stopPropagation(); if(!isConnected) setShowModal(true); }}
                      style={{
                        padding:'8px 18px', borderRadius:999, fontSize:12, fontWeight:700, flexShrink:0, fontFamily:'inherit',
                        border: `1px solid ${p.open ? C.hairline : 'transparent'}`, background:'none',
                        color: p.open ? C.paperDim : C.inkLight, cursor: p.open ? 'pointer' : 'default',
                      }}>
                      {p.open ? 'Join' : 'Closed'}
                    </button>
                  </div>
                </div>
              ))}
            </section>

            {/* AUTO-DROP AGENT */}
            <section style={{ marginTop:36, paddingTop:32, borderTop:`1px solid ${C.hairline}` }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                <div style={{ display:'flex', alignItems:'center', gap:11 }}>
                  <Zap size={17} color={C.goldLight} strokeWidth={1.7} />
                  <div>
                    <p style={{ fontSize:14, fontWeight:700, color:C.paper, margin:0 }}>Auto-Drop Agent</p>
                    <p style={{ fontSize:11.5, color:C.inkLight, margin:'2px 0 0' }}>Mines <span style={{ color:C.paper, fontWeight:700 }}>NVR</span> while you&apos;re away</p>
                  </div>
                </div>
                <motion.button whileTap={{ scale:0.94 }}
                  onClick={() => { if (!isConnected) setShowModal(true); else setAgentOn(v=>!v); }}
                  aria-pressed={agentOn}
                  style={{ width:44, height:24, borderRadius:12, border:`1px solid ${agentOn?C.gold:C.hairline}`, cursor:'pointer', position:'relative', background: agentOn?'rgba(200,155,60,0.18)':'none', transition:'all 0.2s', flexShrink:0 }}>
                  <motion.div animate={{ left:agentOn?22:2 }} transition={{ type:'spring', stiffness:500, damping:30 }}
                    style={{ width:18, height:18, borderRadius:'50%', background: agentOn?C.goldLight:C.inkLight, position:'absolute', top:2 }} />
                </motion.button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                {[
                  { l:'Mining rate', v:agentOn?'0.003/s':'0.000/s', color:C.paper },
                  { l:'Total mined',  v:`${minedAmount.toFixed(3)} NVR`, color:C.goldLight },
                  { l:'Status',       v:agentOn?'Active':'Idle', color: agentOn?C.goldLight:C.paper },
                ].map(s => (
                  <div key={s.l} style={{ textAlign:'center' }}>
                    <p style={{ ...MONO, fontSize:9.5, color:C.inkLight, margin:'0 0 6px', textTransform:'uppercase', letterSpacing:0.5 }}>{s.l}</p>
                    <p style={{ ...SERIF, fontSize:15, fontWeight:600, color:s.color, margin:0 }}>{s.v}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ minWidth:0 }}>

            {/* DAILY TASKS */}
            <section>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                <div>
                  <h2 style={h2}>Today&apos;s tasks</h2>
                  <p style={sub}>Complete all four for the daily drop</p>
                </div>
                <AnimatePresence>
                  {taskMsg && (
                    <motion.span initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                      style={{ fontSize:11.5, color:C.goldLight, fontWeight:600 }}>
                      {taskMsg}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontSize:11, color:C.inkLight }}>Progress</span>
                <span style={{ ...MONO, fontSize:11, color:C.paperDim }}>{doneTasks.length}/{TASKS.length}</span>
              </div>
              <Bar v={doneTasks.length} max={TASKS.length} />

              <div style={{ marginTop:20 }}>
                {TASKS.map((task) => {
                  const done = doneTasks.includes(task.id);
                  return (
                    <button key={task.id}
                      onClick={() => doTask(task.id, task.reward, task.unit)} disabled={done}
                      className={done ? undefined : 'airdrop-row'}
                      style={{ width:'100%', textAlign:'left', display:'flex', alignItems:'center', gap:14, padding:'11px 8px', margin:'0 -8px', borderRadius:10, cursor:done?'default':'pointer', background:'none', border:'none', color:C.paper, opacity:done?0.6:1, fontFamily:'inherit' }}>
                      {done ? <CheckCircle size={17} style={{ color:C.goldLight, flexShrink:0 }}/> : <TaskIcon id={task.id} color={C.goldLight}/>}
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:13.5, fontWeight:700, color:C.paper, margin:0 }}>{task.title}</p>
                        <p style={{ fontSize:11, color:C.inkLight, margin:'2px 0 0' }}>{done ? 'Completed today' : task.desc}</p>
                      </div>
                      {!done && <span style={{ ...MONO, fontSize:12.5, fontWeight:700, color:C.goldLight, flexShrink:0 }}>+{task.reward}&nbsp;{task.unit}</span>}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* EARLY ACCESS + MINT */}
            <div className="airdrop-side-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px 32px', marginTop:36, paddingTop:32, borderTop:`1px solid ${C.hairline}` }}>

              {/* EARLY ACCESS */}
              <div>
                <Star size={16} color={C.goldLight} style={{ marginBottom:10 }} />
                <p style={{ fontSize:14, fontWeight:700, color:C.paper, margin:'0 0 5px' }}>Early access</p>
                <p style={{ fontSize:12, color:C.inkLight, margin:'0 0 14px', lineHeight:1.5 }}>
                  Higher reward tiers at launch.
                </p>
                <AnimatePresence mode="wait">
                  {!joinedWait ? (
                    <motion.button key="join"
                      onClick={joinWaitlist}
                      disabled={joiningWait}
                      style={{ padding:'9px 20px', borderRadius:999, border:`1px solid ${C.hairline}`, background:'none', color:C.paperDim, fontWeight:700, fontSize:12, fontFamily:'inherit', cursor:'pointer', opacity:joiningWait?0.7:1 }}>
                      {joiningWait ? 'Joining…' : 'Join waitlist'}
                    </motion.button>
                  ) : (
                    <motion.div key="done" initial={{ opacity:0 }} animate={{ opacity:1 }}
                      style={{ display:'flex', alignItems:'center', gap:7, color:C.goldLight, fontWeight:600, fontSize:12.5 }}>
                      <CheckCircle size={14}/> You&apos;re on the list.
                    </motion.div>
                  )}
                </AnimatePresence>
                {wlMsg && <p style={{ fontSize:11, color:C.inkLight, margin:'8px 0 0' }}>{wlMsg}</p>}
              </div>

              {/* MINT TOKEN — quiet entry point; the form opens on request */}
              <div>
                <TrendingUp size={16} color={C.goldLight} style={{ marginBottom:10 }} />
                <p style={{ fontSize:14, fontWeight:700, color:C.paper, margin:'0 0 5px' }}>Mint a token</p>
                <p style={{ fontSize:12, color:C.inkLight, margin:'0 0 14px', lineHeight:1.5 }}>
                  Deploy your own ERC-20 on Fuji.
                </p>
                <AnimatePresence mode="wait">
                  {!minted ? (
                    <motion.div key="inner" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                      {showMint ? (
                        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                          {[
                            { v:mintName,   s:setMintName,   p:'Token name',  t:'text'   },
                            { v:mintSym,    s:setMintSym,    p:'Symbol (TKN)', t:'text'   },
                            { v:mintSupply, s:setMintSupply, p:'Total supply', t:'number' },
                          ].map(({ v,s,p,t }) => (
                            <input key={p} value={v} onChange={e => s(e.target.value)} placeholder={p} type={t}
                              style={{ background:'none', border:'none', borderBottom:`1px solid ${C.hairline}`, borderRadius:0, padding:'6px 2px', fontSize:12.5, color:C.paper, outline:'none', fontFamily:'inherit', width:'100%', boxSizing:'border-box', transition:'border-color 0.15s' }}
                              onFocus={e => (e.target.style.borderColor=C.gold)}
                              onBlur={e  => (e.target.style.borderColor=C.hairline)}
                            />
                          ))}
                          <button onClick={mintToken}
                            disabled={!(mintName&&mintSym&&mintSupply)}
                            style={{ marginTop:4, padding:'9px 0', borderRadius:999, border:'none', background: (mintName&&mintSym&&mintSupply)?C.gold:'rgba(200,155,60,0.18)', color: (mintName&&mintSym&&mintSupply)?'#1B1A14':C.inkLight, fontWeight:700, fontSize:12.5, fontFamily:'inherit', cursor:(mintName&&mintSym&&mintSupply)?'pointer':'default' }}>
                            Deploy on Fuji
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setShowMint(true)}
                          style={{ background:'none', border:'none', padding:0, font:'inherit', fontSize:12.5, color:C.goldLight, cursor:'pointer' }}>
                          Deploy on Fuji →
                        </button>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div key="success" initial={{ opacity:0 }} animate={{ opacity:1 }}>
                      <p style={{ fontSize:12.5, fontWeight:700, color:C.paper, margin:'0 0 6px' }}>Token deployed</p>
                      <p style={{ ...MONO, fontSize:10.5, color:C.inkLight, margin:'0 0 10px', wordBreak:'break-all' }}>{minted}</p>
                      <button onClick={() => { setMinted(null); setShowMint(false); setMintName(''); setMintSym(''); setMintSupply(''); }}
                        style={{ fontSize:11.5, background:'none', border:'none', padding:0, font:'inherit', color:C.goldLight, cursor:'pointer' }}>
                        Deploy another
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* SDG IMPACT & EFFORT SCORE */}
            <div style={{ marginTop:36, paddingTop:32, borderTop:`1px solid ${C.hairline}` }}>
              <SDGImpactCard />
            </div>

            {/* COUNTDOWN */}
            <div style={{ marginTop:36, paddingTop:32, borderTop:`1px solid ${C.hairline}`, display:'flex', alignItems:'center', gap:20 }}>
              <Timer size={19} color={C.goldLight} strokeWidth={1.7} style={{ flexShrink:0 }} />
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:11.5, color:C.inkLight, margin:'0 0 4px', lineHeight:1.35 }}>
                  {claimed ? 'Next claim available in' : 'Daily claim resets in'}
                </p>
                <p style={{ ...SERIF, fontSize:24, fontWeight:600, color:C.paper, margin:0, letterSpacing:1 }}>
                  {fmt(countdown)}
                </p>
              </div>
              <div style={{ minWidth:80, flexShrink:0, textAlign:'right' }}>
                <p style={{ fontSize:11, color:C.inkLight, margin:'0 0 4px' }}>Streak</p>
                <p style={{ ...SERIF, fontSize:16, fontWeight:600, color:C.paper, margin:0 }}>
                  {streak} {streak === 1 ? 'day' : 'days'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && <WalletConnectModal onClose={() => setShowModal(false)} />}
    </main>
  );
}

/* Neutral icon per task type — colour stays off the chrome. */
function TaskIcon({ id, color }: { id:string; color:string }) {
  const common = { size:17, color, strokeWidth:1.7 };
  switch (id) {
    case 'checkin':   return <Gift {...common}/>;
    case 'policy':    return <Sparkles {...common}/>;
    case 'community': return <UserPlus {...common}/>;
    default:          return <Coins {...common}/>;
  }
}
