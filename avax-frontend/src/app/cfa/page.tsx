'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Trees, Users, Leaf, TrendingUp, ShieldCheck,
  FileText, Globe, ExternalLink, Vote, MapPin, Clock,
  AlertTriangle, CheckCircle, Activity, Coins, RefreshCw,
  ChevronRight,
} from 'lucide-react';
import NurseryTab from '@/components/cfa/NurseryTab';
import TreasuryTab from '@/components/cfa/TreasuryTab';

// ── Types ─────────────────────────────────────────────────────────
interface CFAData {
  forest: {
    name: string; did: string; locationRegion: string;
    establishedAt: string; totalHectares: number;
    carbonCredits: number; treasuryWallet: string;
  };
  stats: {
    totalMembers: number; activeZones: number; treesPlanted: number;
    patrols30d: number; carbonCreditsEarned: number;
    treasuryTvlKes: number; proposalsActive: number;
  };
  members: { id: string; name: string; role: string; wallet: string | null; patrols: number; joinedAt: string }[];
  zones: { id: string; zoneName: string; areaHa: number; treeCount: number; status: string }[];
  recentPatrols: { id: string; memberName: string; zone: string; durationMins: number; treesPlanted: number; status: string; patrolDate: string; incidentType?: string }[];
  products: { id: string; name: string; category: string; apyPercent: number; token: string; status: string; memberCount: number; tvlKes: number }[];
  proposals: { id: string; proposalRef: string; title: string; votesFor: number; votesAgainst: number; status: string; deadline: string }[];
  monthlyTrend: { month: string; trees: number; patrols: number }[];
}

/* Same editorial system as the rest of the app — pine + gold + paper,
   flat sections separated by a hairline, no gradient card shells. Status
   and role colours are kept (they help you scan a list at a glance) but
   applied as plain text/icon colour, not a glowing bordered box. */
const C = {
  bg:        '#0B1C14',
  gold:      '#C89B3C',
  goldLight: '#E4C878',
  paper:     '#F6F2E7',
  paperDim:  '#EFE9D9',
  inkLight:  '#9BA396',
  hairline:  'rgba(200,155,60,0.14)',
  red:       '#E88C7D',
};
const MONO: React.CSSProperties = { fontFamily: 'var(--font-plex-mono), monospace' };
const SERIF: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const label: React.CSSProperties = { ...MONO, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: C.goldLight, fontWeight: 600, margin: 0 };

const ZONE_COLOR: Record<string, string> = {
  PROTECTED:    '#7DC383',
  ACTIVE:       '#6FA8DC',
  RESTORED:     '#C48FE0',
  UNDER_THREAT: '#E88C7D',
};

const ROLE_COLOR: Record<string, string> = {
  ADMIN:     C.goldLight,
  TREASURER: '#E4C878',
  AUDITOR:   '#C48FE0',
  GUARDIAN:  '#7DC383',
};

const TABS = ['overview','nursery','members','patrol','products','treasury','gov'] as const;

function KPICell({ icon, value, label: l, color }: { icon: React.ReactNode; value: string; label: string; color: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '0 4px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>{icon}</div>
      <p style={{ ...SERIF, fontSize: 19, fontWeight: 600, color, margin: '0 0 3px' }}>{value}</p>
      <p style={{ ...MONO, fontSize: 9, color: C.inkLight, margin: 0, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase' }}>{l}</p>
    </div>
  );
}

// Mini bar chart
function MiniBar({ data }: { data: { month: string; trees: number; patrols: number }[] }) {
  const maxTrees = Math.max(...data.map(d => d.trees));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 64, padding: '0 2px' }}>
      {data.map(d => (
        <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: '100%', borderRadius: 2,
            height: `${Math.round((d.trees / maxTrees) * 52)}px`,
            background: C.gold, minHeight: 3,
          }} />
          <p style={{ ...MONO, fontSize: 9, color: C.inkLight, margin: 0, fontWeight: 600 }}>{d.month}</p>
        </div>
      ))}
    </div>
  );
}

export default function CFAPage() {
  const [data, setData]       = useState<CFAData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<typeof TABS[number]>('overview');

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/cfa/stats');
      if (!r.ok) throw new Error(`stats ${r.status}`);
      setData(await r.json());
    } catch { /* offline — data stays null */ }
    finally { setLoading(false); }
  };
  // Fetch-on-mount: loads CFA stats once. load() awaits an async fetch, so the
  // setState inside it fires after the effect body resolves.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  if (loading) return (
    <div style={{ minHeight: '100dvh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <Trees size={28} color={C.goldLight} />
      <p style={{ color: C.inkLight, fontSize: 13, fontWeight: 600 }}>Loading CFA data...</p>
    </div>
  );

  if (!data) return (
    <div style={{ minHeight: '100dvh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14, padding: 24, textAlign: 'center' }}>
      <AlertTriangle size={28} color={C.gold} />
      <p style={{ color: C.paper, fontSize: 15, fontWeight: 700, margin: 0 }}>Treasury dashboard could not load</p>
      <p style={{ color: C.inkLight, fontSize: 12.5, margin: 0, maxWidth: 320, lineHeight: 1.6 }}>
        We couldn&apos;t reach the community forest data. Your funds are safe, please try again.
      </p>
      <button onClick={load} style={{ marginTop: 4, padding: '11px 24px', borderRadius: 999, border: 'none', cursor: 'pointer', background: C.gold, color: '#1B1A14', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>
        Try again
      </button>
    </div>
  );

  const d = data;
  const treasuryWallet = typeof d.forest.treasuryWallet === 'string' ? d.forest.treasuryWallet : '';
  const totalVotes = (p: typeof d.proposals[0]) => p.votesFor + p.votesAgainst;

  return (
    <main style={{ minHeight: '100dvh', background: C.bg, color: C.paper, paddingBottom: 96, fontFamily: "'Poppins', 'IBM Plex Sans', var(--font-sans)" }}>

      <style>{`
        .cfa-kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px 8px; margin-bottom: 20px; }
        @media (min-width: 900px) {
          .cfa-kpi-grid { grid-template-columns: repeat(6, 1fr); }
        }
        .cfa-tabbar { scrollbar-width: none; }
        .cfa-tabbar::-webkit-scrollbar { display: none; }
        .cfa-quicklink:hover .cfa-quicklink-title { color: ${C.goldLight}; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ padding: '24px 20px 0', borderBottom: `1px solid ${C.hairline}` }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', color: C.inkLight, flexShrink: 0 }}>
              <ArrowLeft size={18} />
            </Link>
            <Trees size={20} color={C.goldLight} strokeWidth={1.7} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ ...SERIF, fontSize: 19, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: C.paper }}>{d.forest.name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <MapPin size={10} color={C.inkLight} />
                <p style={{ fontSize: 11, color: C.inkLight, margin: 0 }}>{d.forest.locationRegion}</p>
              </div>
            </div>
            <button onClick={load} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkLight, display: 'flex', flexShrink: 0 }}>
              <RefreshCw size={15} />
            </button>
          </div>

          {/* DID + wallet strip */}
          <div style={{ display: 'flex', gap: 18, marginBottom: 20, overflowX: 'auto', scrollbarWidth: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <ShieldCheck size={12} color={C.goldLight} />
              <span style={{ ...MONO, fontSize: 10.5, fontWeight: 600, color: C.goldLight }}>{d.forest.did}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <Coins size={12} color={C.inkLight} />
              <span style={{ ...MONO, fontSize: 10.5, fontWeight: 600, color: C.inkLight }}>
                {treasuryWallet ? `${treasuryWallet.slice(0, 18)}…` : 'Treasury not linked'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <Clock size={12} color={C.inkLight} />
              <span style={{ fontSize: 10.5, fontWeight: 600, color: C.inkLight }}>Est. {new Date(d.forest.establishedAt).getFullYear()}</span>
            </div>
          </div>

          {/* 6 KPI cells */}
          <div className="cfa-kpi-grid">
            <KPICell icon={<Users size={17} color={C.goldLight} strokeWidth={1.7} />}    value={d.stats.totalMembers.toLocaleString()}              label="Members" color={C.goldLight} />
            <KPICell icon={<Trees size={17} color="#7DC383" strokeWidth={1.7} />}         value={(d.stats.treesPlanted/1000).toFixed(1)+'K'}          label="Trees" color="#7DC383" />
            <KPICell icon={<Leaf size={17} color="#C48FE0" strokeWidth={1.7} />}          value={d.stats.carbonCreditsEarned.toLocaleString()}       label="Carbon Cr." color="#C48FE0" />
            <KPICell icon={<Activity size={17} color="#6FA8DC" strokeWidth={1.7} />}      value={d.stats.patrols30d.toString()}                       label="Patrols/30d" color="#6FA8DC" />
            <KPICell icon={<TrendingUp size={17} color={C.gold} strokeWidth={1.7} />}     value={'KES '+Math.round(d.stats.treasuryTvlKes/1000)+'K'} label="Treasury" color={C.gold} />
            <KPICell icon={<Vote size={17} color="#6FA8DC" strokeWidth={1.7} />}          value={d.stats.proposalsActive.toString()}                  label="Active DAO" color="#6FA8DC" />
          </div>

          {/* Tabs */}
          <div className="cfa-tabbar" style={{ display: 'flex', gap: 24, overflowX: 'auto' }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flexShrink: 0, padding: '10px 2px', cursor: 'pointer', border: 'none', background: 'none',
                borderBottom: tab === t ? `2px solid ${C.gold}` : '2px solid transparent', marginBottom: -1,
                color: tab === t ? C.goldLight : C.inkLight,
                fontSize: 13, fontWeight: tab === t ? 700 : 500, fontFamily: 'inherit', textTransform: 'capitalize',
              }}>{t === 'gov' ? 'DAO' : t === 'patrol' ? 'Patrols' : t}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── TAB CONTENT ── */}
      <div style={{ padding: '28px 20px 0' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div>

            {/* Monthly bar chart */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <p style={label}>Monthly Trees Planted</p>
                <span style={{ fontSize: 11, color: C.gold, fontWeight: 600 }}>● Trees</span>
              </div>
              <MiniBar data={d.monthlyTrend} />
            </section>

            {/* Zones */}
            <section style={{ marginTop: 32, paddingTop: 28, borderTop: `1px solid ${C.hairline}` }}>
              <p style={{ ...label, marginBottom: 16 }}>Forest Zones</p>
              {d.zones.map(z => {
                const zc = ZONE_COLOR[z.status] ?? '#6FA8DC';
                const pct = Math.min(100, Math.round((z.treeCount / 5000) * 100));
                return (
                  <div key={z.id} style={{ padding: '13px 0', borderBottom: `1px solid ${C.hairline}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: zc, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: C.paper, margin: '0 0 2px' }}>{z.zoneName}</p>
                        <p style={{ fontSize: 11.5, color: C.inkLight, margin: 0 }}>{z.areaHa} ha, {z.treeCount.toLocaleString()} trees</p>
                      </div>
                      <span style={{ ...MONO, fontSize: 9.5, fontWeight: 700, color: zc, letterSpacing: 0.4, flexShrink: 0 }}>{z.status.replace('_',' ')}</span>
                    </div>
                    <div style={{ height: 3, background: C.hairline, borderRadius: 2, marginLeft: 19 }}>
                      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 2, background: zc, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                );
              })}
            </section>

            {/* Latest patrol snapshot */}
            <section style={{ marginTop: 32, paddingTop: 28, borderTop: `1px solid ${C.hairline}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <p style={label}>Latest Patrol</p>
                <button onClick={() => setTab('patrol')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.goldLight, fontSize: 11.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'inherit' }}>
                  See all <ChevronRight size={12} />
                </button>
              </div>
              {d.recentPatrols.slice(0, 2).map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `1px solid ${C.hairline}` }}>
                  {p.status === 'FLAGGED' ? <AlertTriangle size={15} color={C.gold} /> : <CheckCircle size={15} color="#7DC383" />}
                  <p style={{ fontSize: 13.5, fontWeight: 600, color: C.paper, margin: 0, flex: 1 }}>{p.memberName} · {p.zone}</p>
                  <span style={{ fontSize: 11, color: C.inkLight }}>{p.patrolDate}</span>
                </div>
              ))}
              {d.recentPatrols.some(p => p.incidentType) && d.recentPatrols.slice(0,2).map(p => p.incidentType && (
                <p key={p.id + '-inc'} style={{ fontSize: 12, color: C.red, margin: '8px 0 0 25px', fontWeight: 600 }}>Warning: {p.incidentType}</p>
              ))}
            </section>
          </div>
        )}

        {/* ── NURSERY ── */}
        {tab === 'nursery' && <NurseryTab />}

        {/* ── TREASURY ── */}
        {tab === 'treasury' && <TreasuryTab />}

        {/* ── MEMBERS ── */}
        {tab === 'members' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <p style={label}>Forest Members ({d.members.length})</p>
              <span style={{ fontSize: 11, color: C.goldLight, fontWeight: 600 }}>● Active</span>
            </div>
            {d.members.map((m, i) => {
              const rc = ROLE_COLOR[m.role] ?? C.goldLight;
              return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: `1px solid ${C.hairline}` }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                    background: `${rc}1f`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, color: rc,
                  }}>
                    {m.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 700, color: C.paper, margin: 0 }}>{m.name}</p>
                      <span style={{ ...MONO, fontSize: 9, fontWeight: 700, color: rc, letterSpacing: 0.4, textTransform: 'uppercase' }}>{m.role}</span>
                    </div>
                    <p style={{ fontSize: 11, color: C.inkLight, margin: 0 }}>
                      {m.patrols} patrols · Joined {new Date(m.joinedAt).toLocaleDateString('en-KE', { year: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ ...SERIF, fontSize: 16, fontWeight: 600, color: rc, margin: '0 0 2px' }}>#{i + 1}</p>
                    {m.wallet ? (
                      <p style={{ ...MONO, fontSize: 9.5, color: C.inkLight, margin: 0 }}>{m.wallet.slice(0,10)}…</p>
                    ) : (
                      <p style={{ fontSize: 9.5, color: C.inkLight, opacity: 0.6, margin: 0 }}>No wallet</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── PATROL LOGS ── */}
        {tab === 'patrol' && (
          <div>
            <p style={{ ...label, marginBottom: 16 }}>Recent Patrol Logs</p>
            {d.recentPatrols.map(p => {
              const ok = p.status !== 'FLAGGED';
              const sc = ok ? '#7DC383' : C.gold;
              return (
                <div key={p.id} style={{ padding: '16px 0', borderBottom: `1px solid ${C.hairline}` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      {ok ? <CheckCircle size={17} color={sc} /> : <AlertTriangle size={17} color={sc} />}
                      <div>
                        <p style={{ fontSize: 13.5, fontWeight: 700, color: C.paper, margin: '0 0 2px' }}>{p.memberName}</p>
                        <p style={{ fontSize: 11, color: C.inkLight, margin: 0 }}>{p.zone} · {p.patrolDate}</p>
                      </div>
                    </div>
                    <span style={{ ...MONO, fontSize: 9.5, fontWeight: 700, color: sc, letterSpacing: 0.4 }}>{p.status}</span>
                  </div>

                  {p.incidentType && (
                    <p style={{ fontSize: 12, color: C.red, fontWeight: 600, margin: '0 0 12px' }}>Incident: {p.incidentType}</p>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {[
                      { l: 'Duration', v: `${p.durationMins} min`, color: '#6FA8DC' },
                      { l: 'Trees Planted', v: p.treesPlanted.toString(), color: '#7DC383' },
                      { l: 'Status', v: p.status, color: sc },
                    ].map(s => (
                      <div key={s.l} style={{ textAlign: 'center' }}>
                        <p style={{ ...SERIF, fontSize: 15, fontWeight: 600, color: s.color, margin: '0 0 2px' }}>{s.v}</p>
                        <p style={{ ...MONO, fontSize: 8.5, color: C.inkLight, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', margin: 0 }}>{s.l}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── PRODUCTS ── */}
        {tab === 'products' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <p style={label}>Forest Products ({d.products.length})</p>
              <Link href="/securities" style={{ fontSize: 11.5, color: C.goldLight, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                Manage <ExternalLink size={11} />
              </Link>
            </div>
            {d.products.map(p => {
              const pc = p.status === 'Active' ? '#7DC383' : C.gold;
              return (
                <div key={p.id} style={{ padding: '16px 0', borderBottom: `1px solid ${C.hairline}` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      <p style={{ fontSize: 14.5, fontWeight: 700, color: C.paper, margin: '0 0 4px' }}>{p.name}</p>
                      <span style={{ ...MONO, fontSize: 9.5, color: C.inkLight, fontWeight: 600 }}>{p.category}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ ...SERIF, fontSize: 20, fontWeight: 600, color: C.goldLight, margin: '0 0 2px' }}>{p.apyPercent}%</p>
                      <p style={{ fontSize: 10, color: C.inkLight, margin: 0, fontWeight: 600 }}>APY</p>
                    </div>
                  </div>
                  <div style={{ height: 3, background: C.hairline, borderRadius: 2, marginBottom: 12 }}>
                    <div style={{ height: '100%', width: `${Math.min(100, Math.round(p.tvlKes / 6000))}%`, borderRadius: 2, background: C.gold }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 18 }}>
                      <div>
                        <p style={{ fontSize: 12.5, fontWeight: 700, color: C.paper, margin: '0 0 1px' }}>KES {(p.tvlKes / 1000).toFixed(0)}K</p>
                        <p style={{ ...MONO, fontSize: 8.5, color: C.inkLight, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', margin: 0 }}>TVL</p>
                      </div>
                      <div>
                        <p style={{ fontSize: 12.5, fontWeight: 700, color: C.paper, margin: '0 0 1px' }}>{p.memberCount}</p>
                        <p style={{ ...MONO, fontSize: 8.5, color: C.inkLight, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', margin: 0 }}>Members</p>
                      </div>
                      <div>
                        <p style={{ fontSize: 12.5, fontWeight: 700, color: C.paper, margin: '0 0 1px' }}>{p.token}</p>
                        <p style={{ ...MONO, fontSize: 8.5, color: C.inkLight, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', margin: 0 }}>Token</p>
                      </div>
                    </div>
                    <span style={{ ...MONO, fontSize: 9.5, fontWeight: 700, color: pc, letterSpacing: 0.4 }}>{p.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── DAO GOVERNANCE ── */}
        {tab === 'gov' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <p style={label}>DAO Proposals</p>
              <Link href="/nuvari" style={{ fontSize: 11.5, color: C.goldLight, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                Draft <FileText size={11} />
              </Link>
            </div>
            {d.proposals.map(p => {
              const total = totalVotes(p);
              const forPct = total > 0 ? Math.round((p.votesFor / total) * 100) : 0;
              const sc = p.status === 'ACTIVE' ? C.goldLight : p.status === 'PASSED' ? '#7DC383' : C.gold;
              return (
                <div key={p.id} style={{ padding: '18px 0', borderBottom: `1px solid ${C.hairline}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ ...MONO, fontSize: 10.5, fontWeight: 700, color: C.goldLight }}>{p.proposalRef}</span>
                    <span style={{ ...MONO, fontSize: 9.5, fontWeight: 700, color: sc, letterSpacing: 0.4 }}>{p.status}</span>
                  </div>
                  <p style={{ fontSize: 14.5, fontWeight: 700, color: C.paper, margin: '0 0 12px', lineHeight: 1.45 }}>{p.title}</p>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 11, color: '#7DC383', fontWeight: 600 }}>For: {p.votesFor} NVR ({forPct}%)</span>
                      <span style={{ fontSize: 11, color: C.red, fontWeight: 600 }}>Against: {p.votesAgainst} NVR</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(232,140,125,0.25)', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${forPct}%`, borderRadius: 2, background: '#7DC383', transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: C.inkLight, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Vote size={12} /> {total} NVR total
                    </span>
                    <span style={{ fontSize: 11, color: C.inkLight, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Clock size={11} /> {p.deadline}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Quick links */}
            <div style={{ marginTop: 12 }}>
              {[
                { label: 'Securities',     href: '/securities', icon: ShieldCheck },
                { label: 'Pools',          href: '/pools',      icon: TrendingUp  },
                { label: 'AI Advisor',     href: '/ai',         icon: Globe       },
                { label: 'Policy Builder', href: '/nuvari',     icon: FileText    },
              ].map(l => (
                <Link key={l.label} href={l.href} className="cfa-quicklink" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: `1px solid ${C.hairline}` }}>
                  <l.icon size={16} color={C.goldLight} strokeWidth={1.7} />
                  <span className="cfa-quicklink-title" style={{ fontSize: 13.5, fontWeight: 600, color: C.paperDim, transition: 'color 0.15s ease' }}>{l.label}</span>
                  <ChevronRight size={13} color={C.inkLight} style={{ marginLeft: 'auto' }} />
                </Link>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>
    </main>
  );
}
