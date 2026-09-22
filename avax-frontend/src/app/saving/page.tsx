'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Users, TrendingUp, Lock, Gift, BarChart3,
  Vote, ExternalLink, RefreshCw, ChevronRight,
  CheckCircle, Clock, Shield,
} from 'lucide-react';

/* Same editorial system as the rest of the app — pine + gold + paper,
   flat sections separated by a hairline, no gradient card shells. */
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

interface SavingData {
  chama: {
    groupName: string; registrationNumber: string; cyclePeriodDays: number;
    contributionAmount: number; totalPoolBalanceKes: number;
    yieldAllocatedKes: number; activeVaultStrategy: string; groupWallet: string;
  };
  stats: {
    totalMembers: number; totalPoolKes: number; yieldEarnedKes: number;
    bestApyPercent: number; activePools: number; cycleNumber: number; nextPayoutDays: number;
  };
  members: { id: string; name: string; role: string; totalContributed: number; sharePercent: number; phone: string }[];
  recentContributions: { memberName: string; amountKes: number; paymentRef: string; status: string; timestamp: string }[];
  yieldLogs: { id: string; amountInvested: number; yieldEarnedKes: number; strategyUsed: string; txHash: string; generatedAt: string }[];
  vaultStrategies: { key: string; label: string; apy: number; risk: string; color: string; token: string; desc: string }[];
  pools: { name: string; icon: string; apy: string; tvl: string; members: number; color: string }[];
  monthlyYield: { month: string; yieldKes: number }[];
}

const ROLE_COLOR: Record<string, string> = {
  CHAIRPERSON: C.goldLight,
  TREASURER:   '#E4C878',
  SECRETARY:   '#6FA8DC',
  MEMBER:      '#C48FE0',
};

const STRATEGY_LABEL: Record<string, string> = {
  BALANCED_YBOB_VAULT:     'Balanced yBOB',
  CONSERVATIVE_KES_STABLE: 'Conservative KES',
  HIGH_YIELD_AVAX_POOL:    'High Yield AVAX',
};

function KPICell({ icon, value, label: l, color }: { icon: React.ReactNode; value: string; label: string; color: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '0 4px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>{icon}</div>
      <p style={{ ...SERIF, fontSize: 19, fontWeight: 600, color, margin: '0 0 3px' }}>{value}</p>
      <p style={{ ...MONO, fontSize: 9, color: C.inkLight, margin: 0, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase' }}>{l}</p>
    </div>
  );
}

function YieldBar({ data }: { data: { month: string; yieldKes: number }[] }) {
  const max = Math.max(...data.map(d => d.yieldKes));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 68 }}>
      {data.map((d, i) => {
        const pct = Math.round((d.yieldKes / max) * 56);
        const isLast = i === data.length - 1;
        return (
          <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: '100%', borderRadius: 2, height: `${pct}px`, minHeight: 3,
              background: isLast ? C.goldLight : C.gold,
              opacity: isLast ? 1 : 0.55,
            }} />
            <p style={{ ...MONO, fontSize: 9, color: isLast ? C.goldLight : C.inkLight, margin: 0, fontWeight: isLast ? 700 : 600 }}>{d.month}</p>
          </div>
        );
      })}
    </div>
  );
}

const TABS = ['overview', 'members', 'yield', 'pools'] as const;

export default function SavingGroupPage() {
  const [data, setData]   = useState<SavingData | null>(null);
  const [loading, setLoad]= useState(true);
  const [tab, setTab]     = useState<typeof TABS[number]>('overview');

  const load = async () => {
    setLoad(true);
    try { const r = await fetch('/api/saving/stats'); setData(await r.json()); }
    catch { /* offline */ }
    finally { setLoad(false); }
  };
  useEffect(() => { load(); }, []);

  if (loading) return (
    <div style={{ minHeight: '100dvh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <Users size={28} color={C.goldLight} />
      <p style={{ color: C.inkLight, fontSize: 13, fontWeight: 600 }}>Loading Chama data…</p>
    </div>
  );

  const d = data!;
  const totalPool    = d.stats.totalPoolKes;
  const yieldPct     = (d.stats.yieldEarnedKes / totalPool) * 100;
  const activeStrategy = d.vaultStrategies.find(v => v.key === d.chama.activeVaultStrategy) ?? d.vaultStrategies[1];

  return (
    <main style={{ minHeight: '100dvh', background: C.bg, color: C.paper, paddingBottom: 96, fontFamily: "'Poppins', 'IBM Plex Sans', var(--font-sans)" }}>

      <style>{`
        .saving-kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px 8px; margin-bottom: 20px; }
        .saving-tabbar { scrollbar-width: none; }
        .saving-tabbar::-webkit-scrollbar { display: none; }
        .saving-quicklink:hover .saving-quicklink-title { color: ${C.goldLight}; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ padding: '24px 20px 0', borderBottom: `1px solid ${C.hairline}` }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', color: C.inkLight, flexShrink: 0 }}>
              <ArrowLeft size={18} />
            </Link>
            <Users size={20} color={C.goldLight} strokeWidth={1.7} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ ...SERIF, fontSize: 19, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: C.paper }}>{d.chama.groupName}</h1>
              <p style={{ fontSize: 11, color: C.inkLight, margin: '2px 0 0' }}>Reg: {d.chama.registrationNumber} · Cycle #{d.stats.cycleNumber}</p>
            </div>
            <button onClick={load} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkLight, display: 'flex', flexShrink: 0 }}>
              <RefreshCw size={15} />
            </button>
          </div>

          {/* Pool balance */}
          <div style={{ marginBottom: 24 }}>
            <p style={label}>Total Pool Balance</p>
            <p style={{ ...SERIF, fontSize: 38, fontWeight: 600, color: C.paper, margin: '10px 0 4px', letterSpacing: '-1px' }}>
              KES {totalPool.toLocaleString()}
            </p>
            <p style={{ fontSize: 13, color: C.goldLight, fontWeight: 600, margin: '0 0 16px' }}>
              + KES {d.stats.yieldEarnedKes.toLocaleString()} yield ({yieldPct.toFixed(1)}% earned)
            </p>

            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: C.goldLight, fontWeight: 600 }}>Yield earned</span>
                <span style={{ fontSize: 11, color: C.inkLight, fontWeight: 600 }}>Target: KES 50K</span>
              </div>
              <div style={{ height: 3, background: C.hairline, borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${Math.min(100, Math.round((d.stats.yieldEarnedKes / 50000) * 100))}%`, borderRadius: 2, background: C.gold, transition: 'width 0.7s ease' }} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Shield size={12} color={activeStrategy.color} />
                <span style={{ fontSize: 11.5, fontWeight: 600, color: activeStrategy.color }}>{activeStrategy.label} · {activeStrategy.apy}% APY</span>
              </div>
              <span style={{ fontSize: 11.5, color: C.inkLight, fontWeight: 600 }}>{d.stats.nextPayoutDays}d to payout</span>
            </div>
          </div>

          {/* KPI strip */}
          <div className="saving-kpi-grid">
            <KPICell icon={<Users size={17} color={C.goldLight} strokeWidth={1.7} />} value={d.stats.totalMembers.toString()} label="Members" color={C.goldLight} />
            <KPICell icon={<TrendingUp size={17} color="#7DC383" strokeWidth={1.7} />} value={`${d.stats.bestApyPercent}%`} label="Best APY" color="#7DC383" />
            <KPICell icon={<BarChart3 size={17} color="#6FA8DC" strokeWidth={1.7} />} value={d.stats.activePools.toString()} label="Active Pools" color="#6FA8DC" />
          </div>

          {/* Tabs */}
          <div className="saving-tabbar" style={{ display: 'flex', gap: 24, overflowX: 'auto' }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flexShrink: 0, padding: '10px 2px', cursor: 'pointer', border: 'none', background: 'none',
                borderBottom: tab === t ? `2px solid ${C.gold}` : '2px solid transparent', marginBottom: -1,
                color: tab === t ? C.goldLight : C.inkLight,
                fontSize: 13, fontWeight: tab === t ? 700 : 500, fontFamily: 'inherit', textTransform: 'capitalize',
              }}>{t}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '28px 20px 0' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div>
            {/* yield bar chart */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <p style={label}>Monthly Yield Earned</p>
                <span style={{ fontSize: 11, color: C.goldLight, fontWeight: 600 }}>● Latest month highlighted</span>
              </div>
              <YieldBar data={d.monthlyYield} />
            </section>

            {/* vault strategies */}
            <section style={{ marginTop: 32, paddingTop: 28, borderTop: `1px solid ${C.hairline}` }}>
              <p style={{ ...label, marginBottom: 16 }}>Vault Strategies</p>
              {d.vaultStrategies.map(v => {
                const isActive = v.key === d.chama.activeVaultStrategy;
                return (
                  <div key={v.key} style={{ padding: '14px 0', borderBottom: `1px solid ${C.hairline}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                        <Shield size={17} color={v.color} strokeWidth={1.7} />
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 700, color: C.paper, margin: '0 0 2px' }}>{v.label}</p>
                          <p style={{ fontSize: 11.5, color: C.inkLight, margin: 0 }}>{v.desc}</p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ ...SERIF, fontSize: 20, fontWeight: 600, color: v.color, margin: '0 0 2px' }}>{v.apy}%</p>
                        <p style={{ fontSize: 10, color: C.inkLight, margin: 0, fontWeight: 600 }}>APY</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: C.inkLight, fontWeight: 600 }}>Risk: {v.risk}</span>
                      {isActive && <span style={{ ...MONO, fontSize: 9.5, color: v.color, fontWeight: 700, letterSpacing: 0.4 }}>✓ ACTIVE STRATEGY</span>}
                    </div>
                  </div>
                );
              })}
            </section>

            {/* recent contributions */}
            <section style={{ marginTop: 32, paddingTop: 28, borderTop: `1px solid ${C.hairline}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <p style={label}>Recent Contributions</p>
                <button onClick={() => setTab('members')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.goldLight, fontSize: 11.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'inherit' }}>
                  All members <ChevronRight size={12} />
                </button>
              </div>
              {d.recentContributions.slice(0, 4).map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: `1px solid ${C.hairline}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {c.status === 'SUCCESS'
                      ? <CheckCircle size={14} color="#7DC383" />
                      : <Clock size={14} color={C.gold} />}
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: C.paper, margin: '0 0 1px' }}>{c.memberName}</p>
                      <p style={{ ...MONO, fontSize: 10, color: C.inkLight, margin: 0 }}>{c.paymentRef}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 13.5, fontWeight: 700, color: '#7DC383', margin: '0 0 2px' }}>+KES {c.amountKes.toLocaleString()}</p>
                    <p style={{ fontSize: 10.5, color: C.inkLight, margin: 0 }}>{new Date(c.timestamp).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}</p>
                  </div>
                </div>
              ))}
            </section>
          </div>
        )}

        {/* ── MEMBERS ── */}
        {tab === 'members' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <p style={label}>Members ({d.members.length})</p>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: C.goldLight }}>
                KES {d.chama.contributionAmount.toLocaleString()} / cycle
              </span>
            </div>
            {d.members.map((m, i) => {
              const rc = ROLE_COLOR[m.role] ?? C.goldLight;
              const barW = Math.min(100, Math.round((m.totalContributed / 40000) * 100));
              return (
                <div key={m.id} style={{ padding: '14px 0', borderBottom: `1px solid ${C.hairline}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 10 }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${rc}1f`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: rc }}>
                        {m.name.charAt(0)}
                      </div>
                      <div style={{ position: 'absolute', bottom: -2, right: -2, width: 15, height: 15, borderRadius: '50%', background: C.bg, border: `1px solid ${rc}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: rc }}>
                        {i+1}
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <p style={{ fontSize: 13.5, fontWeight: 700, color: C.paper, margin: 0 }}>{m.name}</p>
                        <span style={{ ...MONO, fontSize: 9, fontWeight: 700, color: rc, letterSpacing: 0.4, textTransform: 'uppercase' }}>{m.role}</span>
                      </div>
                      <p style={{ fontSize: 11, color: C.inkLight, margin: 0 }}>
                        {m.sharePercent}% share · {m.phone}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#7DC383', margin: '0 0 2px' }}>KES {(m.totalContributed/1000).toFixed(0)}K</p>
                      <p style={{ fontSize: 10, color: C.inkLight, margin: 0 }}>contributed</p>
                    </div>
                  </div>
                  <div style={{ height: 3, background: C.hairline, borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${barW}%`, borderRadius: 2, background: rc, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── YIELD LOGS ── */}
        {tab === 'yield' && (
          <div>
            <p style={{ ...label, marginBottom: 6 }}>Vault Yield History</p>
            <p style={{ fontSize: 12, color: C.inkLight, marginBottom: 20, lineHeight: 1.5 }}>
              Monthly returns auto-routed from Nuvari vaults back to the group pool.
            </p>
            {d.yieldLogs.map(y => {
              const strat = d.vaultStrategies.find(v => v.key === y.strategyUsed);
              const color = strat?.color ?? C.goldLight;
              const roi   = ((y.yieldEarnedKes / y.amountInvested) * 100).toFixed(2);
              return (
                <div key={y.id} style={{ padding: '18px 0', borderBottom: `1px solid ${C.hairline}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: C.inkLight, margin: '0 0 3px' }}>{y.generatedAt}</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: C.paper, margin: 0 }}>{STRATEGY_LABEL[y.strategyUsed] ?? y.strategyUsed}</p>
                    </div>
                    <p style={{ ...SERIF, fontSize: 22, fontWeight: 600, color: '#7DC383', margin: 0 }}>
                      +KES {y.yieldEarnedKes.toLocaleString()}
                    </p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                    {[
                      { l: 'Invested', v: `KES ${(y.amountInvested/1000).toFixed(0)}K`, color: C.paper },
                      { l: 'ROI',      v: `${roi}%`,                                     color: '#7DC383' },
                      { l: 'Strategy', v: strat?.risk ?? '-',                            color },
                    ].map(s => (
                      <div key={s.l} style={{ textAlign: 'center' }}>
                        <p style={{ ...SERIF, fontSize: 15, fontWeight: 600, color: s.color, margin: '0 0 2px' }}>{s.v}</p>
                        <p style={{ ...MONO, fontSize: 8.5, color: C.inkLight, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', margin: 0 }}>{s.l}</p>
                      </div>
                    ))}
                  </div>
                  {y.txHash && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ ...MONO, fontSize: 10, color: C.inkLight }}>tx: {y.txHash}</span>
                      <a href={`https://testnet.snowtrace.io/tx/${y.txHash}`} target="_blank" rel="noreferrer" style={{ fontSize: 10.5, color: C.goldLight, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                        Snowtrace <ExternalLink size={10} />
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── POOLS ── */}
        {tab === 'pools' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <p style={label}>Liquidity Pools</p>
              <Link href="/pools" style={{ fontSize: 11.5, color: C.goldLight, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                Add Liquidity <ExternalLink size={10} />
              </Link>
            </div>
            {d.pools.map(p => (
              <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: `1px solid ${C.hairline}` }}>
                <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0 }}>{p.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.paper, margin: '0 0 3px' }}>{p.name}</p>
                  <p style={{ fontSize: 11, color: C.inkLight, margin: 0 }}>
                    TVL: <span style={{ color: C.paperDim, fontWeight: 600 }}>{p.tvl}</span> · {p.members} LPs
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ ...SERIF, fontSize: 20, fontWeight: 600, color: p.color, margin: '0 0 2px' }}>{p.apy}</p>
                  <p style={{ fontSize: 10, color: C.inkLight, fontWeight: 600, margin: 0 }}>Fee yield</p>
                </div>
              </div>
            ))}

            <p style={{ ...label, margin: '32px 0 16px' }}>Group Products</p>
            {[
              { label: 'Micro Pension', href: '/securities', icon: Lock,  desc: '12.8% APY' },
              { label: 'Group Pool',    href: '/pools',      icon: Users, desc: 'Add LP'    },
              { label: 'Daily Airdrop', href: '/mine',       icon: Gift,  desc: 'Free NVR'  },
              { label: 'DAO Vote',      href: '/nuvari',     icon: Vote,  desc: 'NVR power' },
            ].map(l => (
              <Link key={l.label} href={l.href} className="saving-quicklink" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: `1px solid ${C.hairline}` }}>
                <l.icon size={16} color={C.goldLight} strokeWidth={1.7} />
                <span className="saving-quicklink-title" style={{ fontSize: 13.5, fontWeight: 600, color: C.paperDim, transition: 'color 0.15s ease', flex: 1 }}>{l.label}</span>
                <span style={{ fontSize: 11.5, color: C.inkLight, fontWeight: 600 }}>{l.desc}</span>
                <ChevronRight size={13} color={C.inkLight} />
              </Link>
            ))}
          </div>
        )}
        </div>
      </div>
    </main>
  );
}
