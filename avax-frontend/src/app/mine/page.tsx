'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import WalletConnectModal from '@/components/WalletConnectModal';
import { useKaivaxStore } from '@/store/useKaivaxStore';
import { CheckCircle, Users, UserPlus, ArrowLeft, Coins, CircleCheck, Flame, Gift, Sparkles } from 'lucide-react';

const WHITELIST = [
  { name: 'AVAX Alpha Miners',  spots: '247 / 500', badge: 'Hot',    status: 'open',   reward: '500 NVR' },
  { name: 'NVR Launch Pool',    spots: '89 / 200',  badge: 'Early',  status: 'open',   reward: '1,000 NVR' },
  { name: 'Core Wallet Promo', spots: '500 / 500', badge: 'Closed', status: 'closed', reward: '200 NVR' },
];

const ECOSYSTEM_REWARDS = [
  { symbol: 'NVR', name: 'Nuvari', reward: '10 NVR', color: '#10b981' },
  { symbol: 'YBOB', name: 'Stablecoin', reward: '2 YBOB', color: '#22c55e' },
  { symbol: 'YTOKEN', name: 'Yield Token', reward: '1 YTOKEN', color: '#60a5fa' },
  { symbol: 'GAMI', name: 'Community', reward: '5 GAMI', color: '#f59e0b' },
];

const DAILY_TASKS = [
  { id: 'daily-checkin', title: 'Daily check-in', detail: 'Open the rewards desk today', reward: '5 NVR', icon: Gift },
  { id: 'explore-policy', title: 'Explore a policy', detail: 'Open a pension, trust, or insurance template', reward: '2 YBOB', icon: Sparkles },
  { id: 'ask-agent', title: 'Ask the KAI agent', detail: 'Get one answer about the ecosystem', reward: '1 GAMI', icon: Users },
  { id: 'join-community', title: 'Join the community', detail: 'Follow the latest ecosystem update', reward: '1 YTOKEN', icon: UserPlus },
];

export default function MinePage() {
  const { isConnected } = useAccount();
  const setTokenBalance = useKaivaxStore(state => state.setTokenBalance);
  const [showModal, setShowModal] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [claimProgress, setClaimProgress] = useState(0);
  const [countdown, setCountdown] = useState(86400);
  const [joinedWaitlist, setJoinedWaitlist] = useState(false);
  const [minted, setMinted] = useState<string | null>(null);
  const [mintName, setMintName] = useState('');
  const [mintSym, setMintSym] = useState('');
  const [mintSupply, setMintSupply] = useState('');
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [taskMessage, setTaskMessage] = useState('');

  useEffect(() => {
    const id = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const fmtTime = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
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
    const tokenKey = symbol.toLowerCase() as 'nvr' | 'ybob' | 'ytoken' | 'gami';
    setTokenBalance(tokenKey, useKaivaxStore.getState().balances[tokenKey] + Number(amountText));
    setCompletedTasks(tasks => [...tasks, taskId]);
    setTaskMessage(`${reward} added to your rewards balance.`);
  };

  const mint = () => {
    if (!mintName || !mintSym || !mintSupply) return;
    setMinted(`0x${Math.random().toString(16).slice(2, 12).toUpperCase()}`);
  };

  return (
    <main style={{ width: '100%', maxWidth: 1040, margin: '0 auto', padding: '24px 24px 110px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ paddingTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/" style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', border: '1px solid rgba(16,185,129,0.3)' }}>
          <ArrowLeft size={18} color="#10b981" />
        </Link>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: 0 }}>Mining & Airdrops</h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>
            Claim daily rewards · Participate in Avalanche launchpools
          </p>
        </div>
      </div>

      {/* Rewards summary */}
      <section className="airdrop-summary-grid" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 12 }}>
        <div className="glass" style={{ padding: 20, borderRadius: 20, background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(26,26,32,0.55))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}><Coins size={15} /> Ecosystem rewards</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 10 }}><strong style={{ fontSize: 30, color: '#fff' }}>{completedTasks.length * 5 + (claimed ? 10 : 0)}</strong><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>reward points earned</span></div>
          <p style={{ margin: '5px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Complete simple tasks to unlock ecosystem drops.</p>
        </div>
        <div className="glass" style={{ padding: 20, borderRadius: 20 }}><div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}><Flame size={15} style={{ verticalAlign: 'middle', marginRight: 5 }} /> Streak</div><strong style={{ display: 'block', fontSize: 26, marginTop: 10 }}>3 days</strong><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Keep checking in</span></div>
        <div className="glass" style={{ padding: 20, borderRadius: 20 }}><div style={{ color: '#60a5fa', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Daily progress</div><strong style={{ display: 'block', fontSize: 26, marginTop: 10 }}>{completedTasks.length}/{DAILY_TASKS.length}</strong><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>tasks completed</span></div>
      </section>

      {/* Ecosystem token drops */}
      <section>
        <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', marginBottom: 10 }}><div><h2 style={{ margin: 0, fontSize: 17 }}>Ecosystem drops</h2><p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>A rotating mix of tokens for active community members.</p></div><span style={{ fontSize: 10, color: '#22c55e' }}>Fuji rewards desk</span></div>
        <div className="airdrop-token-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
          {ECOSYSTEM_REWARDS.map(token => <div key={token.symbol} className="glass" style={{ padding: 14, borderRadius: 16, borderColor: `${token.color}45` }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 30, height: 30, borderRadius: 10, background: `${token.color}25`, color: token.color, display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 10 }}>{token.symbol.slice(0, 2)}</span><div><strong style={{ display: 'block', fontSize: 12 }}>{token.symbol}</strong><span style={{ display: 'block', fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>{token.name}</span></div></div><div style={{ marginTop: 12, color: token.color, fontWeight: 800, fontSize: 15 }}>{token.reward}</div></div>)}
        </div>
      </section>

      {/* Daily task board */}
      <section className="glass" style={{ padding: 20, borderRadius: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}><div><h2 style={{ margin: 0, fontSize: 17 }}>Today&apos;s tasks</h2><p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>Click a task when you finish it. No forms or terminal commands.</p></div>{taskMessage && <span style={{ color: '#4ade80', fontSize: 11 }}>{taskMessage}</span>}</div>
        <div className="airdrop-task-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
          {DAILY_TASKS.map(task => { const Icon = task.icon; const done = completedTasks.includes(task.id); return <button key={task.id} onClick={() => completeTask(task.id, task.reward)} disabled={done} style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, border: `1px solid ${done ? 'rgba(34,197,94,0.35)' : 'rgba(255,255,255,0.1)'}`, background: done ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.035)', color: '#fff', cursor: done ? 'default' : 'pointer' }}><span style={{ width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center', background: done ? 'rgba(34,197,94,0.2)' : 'rgba(16,185,129,0.14)', color: done ? '#4ade80' : '#10b981' }}>{done ? <CircleCheck size={18} /> : <Icon size={18} />}</span><span style={{ flex: 1 }}><strong style={{ display: 'block', fontSize: 12 }}>{task.title}</strong><span style={{ display: 'block', marginTop: 3, color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>{done ? 'Completed today' : task.detail}</span></span><span style={{ color: done ? '#4ade80' : '#f59e0b', fontWeight: 800, fontSize: 11 }}>{done ? 'Done' : `+${task.reward}`}</span></button>; })}
        </div>
      </section>

      {/* Early Access Waitlist */}
      <div className="glass" style={{
        padding: 20, borderRadius: 20, border: '1px solid rgba(167,139,250,0.35)',
        background: 'linear-gradient(135deg, rgba(167,139,250,0.1), rgba(124,58,237,0.05))',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#a78bfa', margin: '0 0 4px' }}>
              Early Access Waitlist
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
              Join the waitlist to unlock advanced mining tiers, higher rewards, and exclusive drops!
            </p>
          </div>
          {!joinedWaitlist ? (
            <button onClick={() => setJoinedWaitlist(true)} style={{
              background: 'linear-gradient(135deg,#a78bfa,#7c3aed)',
              color: '#fff', fontWeight: 700, fontSize: 13, padding: '10px 16px',
              borderRadius: 12, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              Join
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#22c55e', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
              <CheckCircle size={16} /> Joined!
            </div>
          )}
        </div>
      </div>

      {/* Daily Claim Card */}
      <div className="glass" style={{
        padding: 20, borderRadius: 20,
        border: '1px solid rgba(16,185,129,0.35)',
        background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(10,10,12,0.6))',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', filter: 'blur(20px)' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
          <div>
            <span style={{ fontSize: 10, color: '#10b981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>DAILY REWARD</span>
            <h2 style={{ fontSize: 20, fontWeight: 900, margin: '2px 0 6px', color: '#fff' }}>Claim 10 NVR Tokens</h2>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Free claim once every 24 hours for C-Chain wallets.</p>
          </div>
          <div style={{ fontSize: 32 }}></div>
        </div>

        <div style={{ margin: '16px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }} />

        {claimed ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 12, padding: '12px 14px', marginBottom: 10 }}>
              <CheckCircle size={16} color="#4ade80" />
              <div>
                <p style={{ fontWeight: 700, margin: 0, fontSize: 13, color: '#4ade80' }}>Tokens Claimed!</p>
                <p style={{ fontSize: 10, color: 'rgba(74,222,128,0.7)', margin: 0 }}>Come back in {fmtTime(countdown)} to claim again.</p>
              </div>
              <div style={{ marginLeft: 'auto', padding: '6px 12px', borderRadius: 10, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', fontSize: 11, color: '#22C55E', fontWeight: 700 }}>
                Streak: 3
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={handleClaim}
            disabled={claimProgress === 1}
            className="btn-primary"
            style={{ width: '100%', padding: '14px', borderRadius: 12, fontSize: 14, fontWeight: 800 }}
          >
            {claimProgress === 1 ? 'Processing...' : 'Claim 10 NVR Now'}
          </button>
        )}
      </div>

      {/* Auto-Drop Agent */}
      <div className="glass" style={{
        padding: 18, borderRadius: 20,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(16,185,129,0.18)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#10b981', margin: 0 }}>Auto-Drop Agent</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: '3px 0 0' }}>
              AI bot mines tokens for you 24/7 on Avalanche Fuji
            </p>
          </div>
          <button onClick={() => setShowModal(true)}
            style={{ width: 56, height: 30, borderRadius: 14, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', position: 'relative', transition: 'all 0.3s ease' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#fff', position: 'absolute', transition: 'left 0.3s ease', top: 3, left: 3, boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }} />
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { l: 'Mining Rate', v: '0.000 /s', c: '#10b981' },
            { l: 'Total Mined',  v: '0.0 NVR',   c: '#10b981' },
            { l: 'Status',       v: 'Idle',    c: '#22C55E' },
          ].map(s => (
            <div key={s.l} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '8px 10px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', margin: '0 0 3px', fontWeight: 700 }}>{s.l}</p>
              <p style={{ fontSize: 12, fontWeight: 800, color: s.c, margin: 0 }}>{s.v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mint Token */}
      <div className="glass" style={{ padding: 20, borderRadius: 20, border: '1px solid rgba(167,139,250,0.3)' }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: '#a78bfa', margin: '0 0 4px' }}>Mint New Token</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: '0 0 14px' }}>
          Deploy your own ERC-20 token on Avalanche
        </p>
        {!minted ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input value={mintName} onChange={e => setMintName(e.target.value)}
              placeholder="Token name (e.g. FarmCoin)"
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#fff', outline: 'none', fontFamily: 'inherit' }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <input value={mintSym} onChange={e => setMintSym(e.target.value)}
                placeholder="Symbol (FRM)"
                style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#fff', outline: 'none', fontFamily: 'inherit' }} />
              <input value={mintSupply} onChange={e => setMintSupply(e.target.value)}
                type="number" placeholder="Supply"
                style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#fff', outline: 'none', fontFamily: 'inherit' }} />
            </div>
            <button onClick={mint}
              style={{
                background: mintName && mintSym && mintSupply ? 'linear-gradient(135deg,#a78bfa,#7c3aed)' : 'rgba(255,255,255,0.1)',
                color: mintName && mintSym && mintSupply ? '#fff' : 'rgba(255,255,255,0.3)',
                fontWeight: 700, fontSize: 14, padding: '12px', borderRadius: 12,
                border: 'none', cursor: mintName ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
              }}>
              Mint on Avalanche Fuji
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}></div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#22C55E', margin: 0 }}>Token Minted!</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: '6px 0 0' }}>Contract Address:</p>
            <p style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#10b981', margin: '4px 0 12px' }}>{minted}</p>
            <button onClick={() => { setMinted(null); setMintName(''); setMintSym(''); setMintSupply(''); }}
              style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>
              Mint another
            </button>
          </div>
        )}
      </div>

      {/* Whitelist / Launchpools */}
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <UserPlus size={15} color="#10b981" /> Active Launchpools
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {WHITELIST.map((w, i) => (
            <div key={i} className="glass" style={{ padding: '14px 16px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}></div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0 }}>{w.name}</p>
                <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                    <Users size={10} style={{ display: 'inline', marginRight: 3 }} />{w.spots}
                  </span>
                  <span style={{ fontSize: 10, color: '#22C55E' }}>{w.reward}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: w.status === 'open' ? '#22C55E' : '#E63946' }}>{w.badge}</span>
                <button
                  disabled={w.status === 'closed'}
                  style={{
                    fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 8,
                    background: w.status === 'open' ? 'linear-gradient(135deg,#10b981,#064e3b)' : 'rgba(255,255,255,0.05)',
                    color: w.status === 'open' ? '#fff' : 'rgba(255,255,255,0.3)',
                    border: 'none', cursor: w.status === 'open' ? 'pointer' : 'not-allowed',
                  }}>
                  {w.status === 'open' ? 'Join' : 'Closed'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && <WalletConnectModal onClose={() => setShowModal(false)} />}
    </main>
  );
}
