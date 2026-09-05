'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import WalletConnectModal from '@/components/WalletConnectModal';
import { useKaivaxStore } from '@/store/useKaivaxStore';
import {
  CheckCircle, Users, UserPlus, ArrowLeft,
  CircleCheck, Flame, Gift, Sparkles, Coins,
} from 'lucide-react';

/* ── shared styles ── */
const Rs: React.CSSProperties = { textShadow: '0 1px 4px rgba(0,0,0,0.88)' };
const HL = {
  green:  { color:'#34d399', fontWeight:700 } as React.CSSProperties,
  amber:  { color:'#fbbf24', fontWeight:700 } as React.CSSProperties,
  purple: { color:'#c084fc', fontWeight:700 } as React.CSSProperties,
  cyan:   { color:'#22d3ee', fontWeight:700 } as React.CSSProperties,
};

const POOLS = [
  { name:'AVAX Alpha Miners', spots:'247/500', badge:'Hot',    open:true,  reward:'500 NVR'   },
  { name:'NVR Launch Pool',   spots:'89/200',  badge:'Early',  open:true,  reward:'1,000 NVR' },
  { name:'Core Wallet Promo', spots:'500/500', badge:'Closed', open:false, reward:'200 NVR'   },
];

const TOKEN_DROPS = [
  { symbol:'NVR',    name:'Nuvari',      reward:'10 NVR',    color:'#10b981' },
  { symbol:'YBOB',   name:'Stablecoin',  reward:'2 YBOB',    color:'#22c55e' },
  { symbol:'YTOKEN', name:'Yield Token', reward:'1 YTOKEN',  color:'#60a5fa' },
  { symbol:'GAMI',   name:'Community',   reward:'5 GAMI',    color:'#f59e0b' },
];

const TASKS = [
  { id:'checkin',   title:'Daily Check-in',    reward:'5 NVR',    icon:Gift      },
  { id:'policy',   title:'Explore Policy',     reward:'2 YBOB',   icon:Sparkles  },
  { id:'agent',    title:'Ask KAI Agent',      reward:'1 GAMI',   icon:Coins     },
  { id:'community',title:'Join Community',     reward:'1 YTOKEN', icon:UserPlus  },
];

function Bar({ v, max, c }: { v:number; max:number; c:string }) {
  return (
    <div style={{ height:3, borderRadius:3, background:'rgba(255,255,255,0.07)', overflow:'hidden' }}>
      <motion.div initial={{ width:0 }} animate={{ width:`${Math.min(v/max*100,100)}%` }}
        transition={{ duration:0.8, ease:'easeOut' }}
        style={{ height:'100%', borderRadius:3, background:c, boxShadow:`0 0 6px ${c}80` }} />
    </div>
  );
}

/* wide centred container */
const W: React.CSSProperties = { width:'100%', maxWidth:1280, margin:'0 auto', padding:'0 40px' };

export default function MinePage() {
  const { isConnected } = useAccount();
  const setTokenBalance = useKaivaxStore(s => s.setTokenBalance);

  const [showModal,      setShowModal]      = useState(false);
  const [claimed,        setClaimed]        = useState(false);
  const [claiming,       setClaiming]       = useState(false);
  const [countdown,      setCountdown]      = useState(86400);
  const [joinedWait,     setJoinedWait]     = useState(false);
  const [minted,         setMinted]         = useState<string|null>(null);
  const [mintName,       setMintName]       = useState('');
  const [mintSym,        setMintSym]        = useState('');
  const [mintSupply,     setMintSupply]     = useState('');
  const [doneTasks,      setDoneTasks]      = useState<string[]>([]);
  const [taskMsg,        setTaskMsg]        = useState('');
  const [agentOn,        setAgentOn]        = useState(false);

  useEffect(() => {
    const id = setInterval(() => setCountdown(c => Math.max(0,c-1)), 1000);
    return () => clearInterval(id);
  }, []);

  const fmt = (s:number) => {
    const h = Math.floor(s/3600).toString().padStart(2,'0');
    const m = Math.floor((s%3600)/60).toString().padStart(2,'0');
    const sec = (s%60).toString().padStart(2,'0');
    return `${h}:${m}:${sec}`;
  };

  const claim = async () => {
    if (!isConnected) { setShowModal(true); return; }
    setClaiming(true);
    await new Promise(r => setTimeout(r,1400));
    setTokenBalance('nvr', useKaivaxStore.getState().balances.nvr + 10);
    setClaimed(true); setClaiming(false);
  };

  const doTask = (id:string, reward:string) => {
    if (!isConnected) { setShowModal(true); return; }
    if (doneTasks.includes(id)) return;
    const [amt, sym] = reward.split(' ');
    const k = sym.toLowerCase() as 'nvr'|'ybob'|'ytoken'|'gami';
    setTokenBalance(k, useKaivaxStore.getState().balances[k] + Number(amt));
    setDoneTasks(t => [...t, id]);
    setTaskMsg(`+${reward} added`);
    setTimeout(() => setTaskMsg(''), 2500);
  };

  const mintToken = () => {
    if (!mintName||!mintSym||!mintSupply) return;
    setMinted(`0x${Math.random().toString(16).slice(2,12).toUpperCase()}`);
  };

  const pts = doneTasks.length*5 + (claimed?10:0);

  return (
    <main style={{ minHeight:'100dvh', color:'#fff', fontFamily:'var(--font-sans)', position:'relative', paddingBottom:80 }}>

      {/* orbs */}
      <div aria-hidden style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }}>
        <div style={{ position:'absolute', top:'6%', right:'-8%', width:360, height:360, borderRadius:'50%', background:'radial-gradient(circle,rgba(16,185,129,0.09) 0%,transparent 70%)', animation:'orb-drift-a 13s ease-in-out infinite' }} />
        <div style={{ position:'absolute', bottom:'25%', left:'-6%', width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle,rgba(245,158,11,0.06) 0%,transparent 70%)', animation:'orb-drift-b 17s ease-in-out infinite' }} />
      </div>

      {/* ── HEADER ── */}
      <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
        style={{ ...W, paddingTop:24, display:'flex', alignItems:'center', gap:14, position:'relative', zIndex:5 }}>
        <Link href="/" style={{ width:36, height:36, borderRadius:'50%', background:'rgba(16,185,129,0.10)', backdropFilter:'blur(10px)', boxShadow:'0 0 0 1px rgba(16,185,129,0.20) inset', display:'flex', alignItems:'center', justifyContent:'center', textDecoration:'none', flexShrink:0 }}>
          <ArrowLeft size={15} color="#10b981" />
        </Link>
        <div>
          <h1 style={{ fontSize:22, fontWeight:900, color:'#fff', margin:0, letterSpacing:'-0.4px', ...Rs }}>
            Mining &amp; <span style={HL.green}>Airdrops</span>
          </h1>
          <p style={{ fontSize:12, color:'rgba(255,255,255,0.45)', margin:'2px 0 0', ...Rs }}>
            <span style={HL.green}>Avalanche Fuji</span> · Claim daily · Join launchpools
          </p>
        </div>
      </motion.div>

      {/* ── TOP STATS ROW ── */}
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.08 }}
        style={{ ...W, marginTop:16, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, position:'relative', zIndex:5 }}>
        {[
          { icon:'🏆', label:'Reward Points', value:pts,                     max:50,  color:'#10b981' },
          { icon:'🔥', label:'Day Streak',     value:3,    display:'3 days', max:7,   color:'#f59e0b' },
          { icon:'✅', label:'Tasks Today',    value:doneTasks.length, display:`${doneTasks.length}/${TASKS.length}`, max:TASKS.length, color:'#60a5fa' },
        ].map((s,i) => (
          <motion.div key={s.label}
            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.10+i*0.05 }}
            style={{ padding:'14px 16px', borderRadius:16, background:'rgba(8,8,14,0.58)', backdropFilter:'blur(18px)', boxShadow:`0 0 0 0.5px ${s.color}22 inset, 0 6px 24px rgba(0,0,0,0.35)` }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <span style={{ fontSize:18 }}>{s.icon}</span>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:0.8, textTransform:'uppercase', color:'rgba(255,255,255,0.45)', margin:0 }}>{s.label}</p>
            </div>
            <p style={{ fontSize:22, fontWeight:900, color:s.color, margin:'0 0 8px', textShadow:`0 0 10px ${s.color}70` }}>
              {'display' in s ? (s as {display:string}).display : s.value}
            </p>
            <Bar v={s.value} max={s.max} c={s.color} />
          </motion.div>
        ))}
      </motion.div>

      {/* ── TWO COLUMN MAIN ── */}
      <div style={{ ...W, marginTop:14, display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, position:'relative', zIndex:5 }}>

        {/* LEFT col */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {/* DAILY CLAIM */}
          <motion.div initial={{ opacity:0, scale:0.98 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.14 }}
            style={{ padding:'18px 20px', borderRadius:18, background:'linear-gradient(135deg,rgba(16,185,129,0.13) 0%,rgba(6,6,10,0.60) 100%)', backdropFilter:'blur(22px)', boxShadow:'0 0 0 0.5px rgba(16,185,129,0.18) inset, 0 10px 36px rgba(0,0,0,0.38)', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%', background:'radial-gradient(circle,rgba(16,185,129,0.16) 0%,transparent 70%)', pointerEvents:'none' }} />

            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div>
                <p style={{ fontSize:10, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', color:'#10b981', margin:'0 0 4px' }}>Daily Reward</p>
                <p style={{ fontSize:18, fontWeight:900, color:'#fff', margin:0, ...Rs }}>
                  Claim <span style={HL.green}>10 NVR</span>
                </p>
              </div>
              <span style={{ fontSize:28 }}>🎁</span>
            </div>

            <AnimatePresence mode="wait">
              {claimed ? (
                <motion.div key="claimed" initial={{ opacity:0 }} animate={{ opacity:1 }}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:12, background:'rgba(34,197,94,0.08)', boxShadow:'0 0 0 1px rgba(34,197,94,0.20) inset' }}>
                  <CheckCircle size={16} color="#4ade80" />
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:12, fontWeight:700, color:'#4ade80', margin:0 }}>Claimed! Next in {fmt(countdown)}</p>
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, color:'#22c55e' }}>Streak 🔥3</span>
                </motion.div>
              ) : (
                <motion.button key="claim" whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                  onClick={claim} disabled={claiming}
                  className="btn-primary"
                  style={{ width:'100%', padding:'12px', borderRadius:12, fontSize:14, fontWeight:800 }}>
                  {claiming ? '⏳ Processing…' : '🎁 Claim 10 NVR Now'}
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

          {/* TOKEN DROPS */}
          <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.18 }}
            style={{ borderRadius:18, background:'rgba(8,8,14,0.55)', backdropFilter:'blur(20px)', boxShadow:'0 0 0 0.5px rgba(255,255,255,0.07) inset, 0 8px 28px rgba(0,0,0,0.32)', overflow:'hidden' }}>
            <div style={{ padding:'13px 18px 11px', boxShadow:'0 1px 0 rgba(255,255,255,0.05)' }}>
              <p style={{ fontSize:11, fontWeight:800, letterSpacing:1.0, textTransform:'uppercase', color:'rgba(255,255,255,0.52)', margin:0 }}>
                Ecosystem <span style={HL.amber}>Drops</span>
              </p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1 }}>
              {TOKEN_DROPS.map((t,i) => (
                <motion.div key={t.symbol}
                  initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.20+i*0.04 }}
                  style={{ padding:'12px 16px', background:`linear-gradient(135deg,${t.color}0e,rgba(6,6,12,0.55))`, backdropFilter:'blur(12px)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                    <span style={{ width:28, height:28, borderRadius:8, background:`${t.color}1a`, display:'grid', placeItems:'center', fontSize:9, fontWeight:800, color:t.color }}>{t.symbol.slice(0,2)}</span>
                    <div>
                      <p style={{ fontSize:12, fontWeight:800, color:'#fff', margin:0 }}>{t.symbol}</p>
                      <p style={{ fontSize:10, color:'rgba(255,255,255,0.40)', margin:0 }}>{t.name}</p>
                    </div>
                  </div>
                  <p style={{ fontSize:14, fontWeight:900, color:t.color, margin:0 }}>{t.reward}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* AUTO-DROP AGENT */}
          <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.22 }}
            style={{ padding:'14px 18px', borderRadius:18, background:'rgba(8,8,14,0.55)', backdropFilter:'blur(20px)', boxShadow:'0 0 0 0.5px rgba(255,255,255,0.07) inset, 0 6px 22px rgba(0,0,0,0.30)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <div>
                <p style={{ fontSize:13, fontWeight:800, color:'#10b981', margin:0 }}>Auto-Drop Agent</p>
                <p style={{ fontSize:11, color:'rgba(255,255,255,0.42)', margin:'2px 0 0' }}>AI mines <span style={HL.green}>NVR</span> 24/7 on Fuji</p>
              </div>
              <motion.button whileTap={{ scale:0.94 }}
                onClick={() => { if (!isConnected) setShowModal(true); else setAgentOn(v=>!v); }}
                style={{ width:50, height:28, borderRadius:14, border:'none', cursor:'pointer', position:'relative', transition:'background 0.28s', background:agentOn?'rgba(16,185,129,0.38)':'rgba(255,255,255,0.08)', boxShadow:agentOn?'0 0 10px rgba(16,185,129,0.30)':'none' }}>
                <motion.div animate={{ left:agentOn?24:3 }} transition={{ type:'spring', stiffness:500, damping:30 }}
                  style={{ width:22, height:22, borderRadius:'50%', background:'#fff', position:'absolute', top:3, boxShadow:'0 2px 6px rgba(0,0,0,0.30)' }} />
              </motion.button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
              {[
                { l:'Rate',   v:agentOn?'0.003/s':'0.000/s', c:'#10b981' },
                { l:'Mined',  v:agentOn?'0.2 NVR':'0.0 NVR', c:'#10b981' },
                { l:'Status', v:agentOn?'Active':'Idle',      c:agentOn?'#4ade80':'#f59e0b' },
              ].map(s => (
                <div key={s.l} style={{ background:'rgba(255,255,255,0.04)', backdropFilter:'blur(6px)', boxShadow:'0 0 0 0.5px rgba(255,255,255,0.07) inset', borderRadius:10, padding:'8px 10px' }}>
                  <p style={{ fontSize:9, color:'rgba(255,255,255,0.36)', margin:'0 0 3px', fontWeight:700, textTransform:'uppercase', letterSpacing:0.5 }}>{s.l}</p>
                  <p style={{ fontSize:13, fontWeight:800, color:s.c, margin:0 }}>{s.v}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* RIGHT col */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {/* DAILY TASKS */}
          <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.16 }}
            style={{ padding:'16px 18px', borderRadius:18, background:'rgba(8,8,14,0.55)', backdropFilter:'blur(20px)', boxShadow:'0 0 0 0.5px rgba(255,255,255,0.07) inset, 0 8px 28px rgba(0,0,0,0.32)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <p style={{ fontSize:11, fontWeight:800, letterSpacing:1.0, textTransform:'uppercase', color:'rgba(255,255,255,0.52)', margin:0 }}>
                Today&apos;s <span style={HL.amber}>Tasks</span>
              </p>
              <AnimatePresence>
                {taskMsg && (
                  <motion.span initial={{ opacity:0, x:8 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0 }}
                    style={{ fontSize:11, fontWeight:700, color:'#4ade80' }}>{taskMsg}</motion.span>
                )}
              </AnimatePresence>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {TASKS.map((task,i) => {
                const Icon = task.icon;
                const done = doneTasks.includes(task.id);
                return (
                  <motion.button key={task.id}
                    initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.18+i*0.04 }}
                    whileHover={done?{}:{ x:3 }} whileTap={done?{}:{ scale:0.98 }}
                    onClick={() => doTask(task.id, task.reward)} disabled={done}
                    style={{ textAlign:'left', display:'flex', alignItems:'center', gap:11, padding:'11px 13px', borderRadius:13, border:'none', cursor:done?'default':'pointer', background:done?'rgba(34,197,94,0.06)':'rgba(255,255,255,0.04)', backdropFilter:'blur(8px)', boxShadow:done?'0 0 0 0.5px rgba(34,197,94,0.20) inset':'0 0 0 0.5px rgba(255,255,255,0.07) inset', color:'#fff', transition:'all 0.18s' }}>
                    <span style={{ width:32, height:32, borderRadius:10, flexShrink:0, display:'grid', placeItems:'center', background:done?'rgba(34,197,94,0.15)':'rgba(16,185,129,0.10)', color:done?'#4ade80':'#10b981' }}>
                      {done ? <CircleCheck size={16}/> : <Icon size={16}/>}
                    </span>
                    <span style={{ flex:1 }}>
                      <strong style={{ display:'block', fontSize:13, fontWeight:700, color:done?'rgba(255,255,255,0.50)':'#fff' }}>{task.title}</strong>
                    </span>
                    <span style={{ fontSize:11, fontWeight:800, color:done?'#4ade80':'#f59e0b', flexShrink:0 }}>
                      {done?'✓':`+${task.reward}`}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* LAUNCHPOOLS */}
          <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.20 }}
            style={{ borderRadius:18, background:'rgba(8,8,14,0.55)', backdropFilter:'blur(20px)', boxShadow:'0 0 0 0.5px rgba(255,255,255,0.07) inset, 0 8px 28px rgba(0,0,0,0.30)', overflow:'hidden' }}>
            <div style={{ padding:'12px 18px 10px', boxShadow:'0 1px 0 rgba(255,255,255,0.05)' }}>
              <p style={{ fontSize:11, fontWeight:800, letterSpacing:1.0, textTransform:'uppercase', color:'rgba(255,255,255,0.52)', margin:0, display:'flex', alignItems:'center', gap:6 }}>
                <UserPlus size={13} color="#10b981"/> Active <span style={HL.green}>Launchpools</span>
              </p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
              {POOLS.map((p,i) => (
                <motion.div key={i}
                  initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.22+i*0.05 }}
                  whileHover={{ x:3 }}
                  style={{ padding:'12px 18px', display:'flex', alignItems:'center', gap:12, background:'rgba(255,255,255,0.02)', backdropFilter:'blur(8px)' }}>
                  <span style={{ fontSize:18, flexShrink:0 }}>🏊</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:13, fontWeight:700, color:'#fff', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</p>
                    <div style={{ display:'flex', gap:8, marginTop:2 }}>
                      <span style={{ fontSize:10, color:'rgba(255,255,255,0.38)' }}><Users size={8} style={{ display:'inline', marginRight:2 }}/>{p.spots}</span>
                      <span style={{ fontSize:10, fontWeight:700, color:'#22c55e' }}>{p.reward}</span>
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                    <span style={{ fontSize:10, fontWeight:800, color:p.open?'#22c55e':'#f87171' }}>{p.badge}</span>
                    <motion.button whileHover={p.open?{ scale:1.05 }:{}} whileTap={p.open?{ scale:0.95 }:{}} disabled={!p.open}
                      style={{ fontSize:11, fontWeight:700, padding:'5px 12px', borderRadius:8, border:'none', background:p.open?'linear-gradient(135deg,#10b981,#047857)':'rgba(255,255,255,0.05)', color:p.open?'#fff':'rgba(255,255,255,0.22)', cursor:p.open?'pointer':'not-allowed', boxShadow:p.open?'0 0 12px rgba(16,185,129,0.30)':'none', transition:'all 0.18s' }}>
                      {p.open?'Join':'Closed'}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* WAITLIST + MINT — side by side */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>

            {/* WAITLIST */}
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.26 }}
              style={{ padding:'14px 16px', borderRadius:18, background:'linear-gradient(135deg,rgba(167,139,250,0.09) 0%,rgba(8,8,14,0.58) 100%)', backdropFilter:'blur(18px)', boxShadow:'0 0 0 0.5px rgba(167,139,250,0.18) inset, 0 6px 22px rgba(0,0,0,0.30)' }}>
              <p style={{ fontSize:13, fontWeight:800, color:'#a78bfa', margin:'0 0 4px' }}>Early Access</p>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.48)', margin:'0 0 12px', lineHeight:1.4 }}>
                Unlock <span style={HL.purple}>higher rewards</span>
              </p>
              <AnimatePresence mode="wait">
                {!joinedWait ? (
                  <motion.button key="join" whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }} onClick={() => setJoinedWait(true)}
                    style={{ width:'100%', background:'linear-gradient(135deg,#a78bfa,#7c3aed)', color:'#fff', fontWeight:700, fontSize:13, padding:'9px', borderRadius:10, border:'none', cursor:'pointer', boxShadow:'0 4px 14px rgba(139,92,246,0.40)' }}>
                    Join Waitlist
                  </motion.button>
                ) : (
                  <motion.div key="done" initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }}
                    style={{ display:'flex', alignItems:'center', gap:6, color:'#22c55e', fontWeight:700, fontSize:13 }}>
                    <CheckCircle size={15}/> Joined!
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* MINT TOKEN */}
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.28 }}
              style={{ padding:'14px 16px', borderRadius:18, background:'rgba(8,8,14,0.55)', backdropFilter:'blur(18px)', boxShadow:'0 0 0 0.5px rgba(167,139,250,0.14) inset, 0 6px 22px rgba(0,0,0,0.28)' }}>
              <p style={{ fontSize:13, fontWeight:800, color:'#a78bfa', margin:'0 0 4px' }}>Mint Token</p>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.48)', margin:'0 0 10px' }}>Deploy <span style={HL.purple}>ERC-20</span> on Fuji</p>
              <AnimatePresence mode="wait">
                {!minted ? (
                  <motion.div key="form" style={{ display:'flex', flexDirection:'column', gap:7 }}>
                    {[
                      { v:mintName, s:setMintName, p:'Name' },
                      { v:mintSym,  s:setMintSym,  p:'Symbol' },
                      { v:mintSupply,s:setMintSupply,p:'Supply',t:'number' },
                    ].map(({ v,s,p,t }) => (
                      <input key={p} value={v} onChange={e => s(e.target.value)} placeholder={p} type={t||'text'}
                        style={{ background:'rgba(255,255,255,0.05)', border:'none', boxShadow:'0 0 0 1px rgba(255,255,255,0.08) inset', borderRadius:9, padding:'8px 11px', fontSize:12, color:'#fff', outline:'none', fontFamily:'inherit', transition:'box-shadow 0.18s' }}
                        onFocus={e => (e.target.style.boxShadow='0 0 0 1.5px rgba(167,139,250,0.45) inset')}
                        onBlur={e  => (e.target.style.boxShadow='0 0 0 1px rgba(255,255,255,0.08) inset')}
                      />
                    ))}
                    <motion.button whileHover={(mintName&&mintSym&&mintSupply)?{ scale:1.02 }:{}} whileTap={(mintName&&mintSym&&mintSupply)?{ scale:0.97 }:{}} onClick={mintToken}
                      style={{ background:(mintName&&mintSym&&mintSupply)?'linear-gradient(135deg,#a78bfa,#7c3aed)':'rgba(255,255,255,0.06)', color:(mintName&&mintSym&&mintSupply)?'#fff':'rgba(255,255,255,0.25)', fontWeight:700, fontSize:12, padding:'9px', borderRadius:9, border:'none', cursor:mintName?'pointer':'not-allowed', fontFamily:'inherit', boxShadow:(mintName&&mintSym&&mintSupply)?'0 4px 14px rgba(139,92,246,0.35)':'none', transition:'all 0.18s' }}>
                      Mint on Fuji
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div key="success" initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
                    style={{ textAlign:'center', padding:'8px 0' }}>
                    <div style={{ fontSize:28, marginBottom:6 }}>🎉</div>
                    <p style={{ fontSize:12, fontWeight:700, color:'#22c55e', margin:'0 0 4px' }}>Token Minted!</p>
                    <p style={{ fontFamily:'monospace', fontSize:10, color:'#10b981', margin:'0 0 8px', wordBreak:'break-all' }}>{minted}</p>
                    <button onClick={() => { setMinted(null); setMintName(''); setMintSym(''); setMintSupply(''); }}
                      style={{ fontSize:11, color:'rgba(255,255,255,0.40)', background:'transparent', border:'none', boxShadow:'0 0 0 1px rgba(255,255,255,0.09) inset', borderRadius:8, padding:'5px 12px', cursor:'pointer' }}>
                      Mint another
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>

      {showModal && <WalletConnectModal onClose={() => setShowModal(false)} />}
    </main>
  );
}
