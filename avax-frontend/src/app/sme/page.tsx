'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Store, TrendingUp,
  CreditCard, ShieldCheck, Package, ExternalLink, RefreshCw,
  ArrowUpRight, ArrowDownRight, AlertCircle,
  ChevronRight, Activity,
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
  red:       '#E88C7D',
};
const MONO: React.CSSProperties = { fontFamily: 'var(--font-plex-mono), monospace' };
const SERIF: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const label: React.CSSProperties = { ...MONO, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: C.goldLight, fontWeight: 600, margin: 0 };

interface SMEData {
  business: {
    businessName: string; ownerName: string; phoneNumber: string;
    category: string; location: string; cashFlowScore: number;
    creditLimit: number; walletAddress: string;
  };
  stats: {
    totalIncomeKes: number; totalExpenseKes: number; netProfitKes: number;
    creditGivenKes: number; debtOwedKes: number; cashFlowScore: number;
    activeLoans: number; activeCashFlowTokens: number;
  };
  ledger: { id: string; type: string; amountKes: number; counterparty: string; description: string; categoryTag: string; paymentMethod: string; timestamp: string }[];
  cashFlowTokens: { id: string; tokenRef: string; invoiceAmountKes: number; discountPriceKes: number; debtorName: string; maturityDate: string; status: string }[];
  monthlyFlow: { month: string; income: number; expense: number }[];
  products: { icon: string; name: string; rate: string; token: string; status: string; cap: string }[];
}

const ENTRY_CONFIG: Record<string, { color: string; icon: React.ReactNode; sign: string }> = {
  INCOME:       { color: '#7DC383', icon: <ArrowUpRight size={14} color="#7DC383" />,   sign: '+' },
  EXPENSE:      { color: C.red,     icon: <ArrowDownRight size={14} color={C.red} />,   sign: '-' },
  CREDIT_GIVEN: { color: '#6FA8DC', icon: <ArrowUpRight size={14} color="#6FA8DC" />,    sign: '→' },
  DEBT_OWED:    { color: C.gold,    icon: <AlertCircle size={14} color={C.gold} />,      sign: '!' },
};

const TOKEN_STATUS_COLOR: Record<string, string> = {
  FUNDED:             '#7DC383',
  LISTED_FOR_FUNDING: '#6FA8DC',
  DRAFT:              C.gold,
  SETTLED_PAID:       '#C48FE0',
  DEFAULTED:          C.red,
};

function ScoreRing({ score }: { score: number }) {
  const pct   = score / 100;
  const r     = 30;
  const circ  = 2 * Math.PI * r;
  const dash  = pct * circ;
  const color = score >= 70 ? '#7DC383' : score >= 45 ? C.gold : C.red;
  return (
    <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
      <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="36" cy="36" r={r} fill="none" stroke={C.hairline} strokeWidth="4" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ ...SERIF, fontSize: 16, fontWeight: 600, color, lineHeight: 1 }}>{score.toFixed(0)}</span>
        <span style={{ ...MONO, fontSize: 8, color: C.inkLight, fontWeight: 600 }}>/ 100</span>
      </div>
    </div>
  );
}

function KPICell({ icon, value, label: l, color }: { icon: React.ReactNode; value: string; label: string; color: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '0 4px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>{icon}</div>
      <p style={{ ...SERIF, fontSize: 18, fontWeight: 600, color, margin: '0 0 3px' }}>{value}</p>
      <p style={{ ...MONO, fontSize: 9, color: C.inkLight, margin: 0, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase' }}>{l}</p>
    </div>
  );
}

function FlowBars({ data }: { data: { month: string; income: number; expense: number }[] }) {
  const max = Math.max(...data.map(d => d.income));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 72 }}>
      {data.map(d => (
        <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ width: '100%', display: 'flex', gap: 3, alignItems: 'flex-end', height: 58 }}>
            <div style={{ flex: 1, borderRadius: 2, background: '#7DC383', height: `${Math.round((d.income / max) * 56)}px`, minHeight: 3 }} />
            <div style={{ flex: 1, borderRadius: 2, background: C.gold, height: `${Math.round((d.expense / max) * 56)}px`, minHeight: 3, opacity: 0.7 }} />
          </div>
          <p style={{ ...MONO, fontSize: 9, color: C.inkLight, margin: 0, fontWeight: 600 }}>{d.month}</p>
        </div>
      ))}
    </div>
  );
}

const TABS = ['overview','ledger','rwa','products'] as const;

export default function SMEPage() {
  const [data, setData]     = useState<SMEData | null>(null);
  const [loading, setLoad]  = useState(true);
  const [tab, setTab]       = useState<typeof TABS[number]>('overview');

  const load = async () => {
    setLoad(true);
    try { const r = await fetch('/api/sme/stats'); setData(await r.json()); }
    catch { /* offline */ }
    finally { setLoad(false); }
  };
  useEffect(() => { load(); }, []);

  if (loading) return (
    <div style={{ minHeight: '100dvh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <Store size={28} color={C.goldLight} />
      <p style={{ color: C.inkLight, fontSize: 13, fontWeight: 600 }}>Loading SME data...</p>
    </div>
  );

  const d = data!;

  return (
    <main style={{ minHeight: '100dvh', background: C.bg, color: C.paper, paddingBottom: 96, fontFamily: "'Poppins', 'IBM Plex Sans', var(--font-sans)" }}>

      <style>{`
        .sme-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px 8px; margin-bottom: 20px; }
        @media (max-width: 560px) { .sme-kpi-grid { grid-template-columns: repeat(2, 1fr); } }
        .sme-tabbar { scrollbar-width: none; }
        .sme-tabbar::-webkit-scrollbar { display: none; }
        .sme-quicklink:hover .sme-quicklink-title { color: ${C.goldLight}; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ padding: '24px 20px 0', borderBottom: `1px solid ${C.hairline}` }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', color: C.inkLight, flexShrink: 0 }}>
              <ArrowLeft size={18} />
            </Link>
            <Store size={20} color={C.goldLight} strokeWidth={1.7} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ ...SERIF, fontSize: 19, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: C.paper }}>{d.business.businessName}</h1>
              <p style={{ fontSize: 11, color: C.inkLight, margin: '2px 0 0' }}>{d.business.ownerName} · {d.business.location}</p>
            </div>
            <button onClick={load} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkLight, display: 'flex', flexShrink: 0 }}>
              <RefreshCw size={15} />
            </button>
          </div>

          {/* Cash flow score */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 24, paddingBottom: 24, borderBottom: `1px solid ${C.hairline}` }}>
            <ScoreRing score={d.stats.cashFlowScore} />
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.paper, margin: '0 0 3px' }}>Cash Flow Score</p>
              <p style={{ fontSize: 11.5, color: C.inkLight, margin: '0 0 8px' }}>AI-assessed creditworthiness</p>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#7DC383' }}>
                Credit: KES {(d.business.creditLimit / 1000).toFixed(0)}K
              </span>
            </div>
          </div>

          {/* 4 KPI cells */}
          <div className="sme-kpi-grid">
            <KPICell icon={<ArrowUpRight size={16} color="#7DC383" strokeWidth={1.7} />} value={`KES ${(d.stats.totalIncomeKes/1000).toFixed(0)}K`} label="Income" color="#7DC383" />
            <KPICell icon={<ArrowDownRight size={16} color={C.red} strokeWidth={1.7} />} value={`KES ${(d.stats.totalExpenseKes/1000).toFixed(0)}K`} label="Expense" color={C.red} />
            <KPICell icon={<TrendingUp size={16} color="#6FA8DC" strokeWidth={1.7} />} value={`KES ${(d.stats.netProfitKes/1000).toFixed(0)}K`} label="Net Profit" color="#6FA8DC" />
            <KPICell icon={<Activity size={16} color={C.gold} strokeWidth={1.7} />} value={`KES ${(d.stats.creditGivenKes/1000).toFixed(0)}K`} label="Credit Given" color={C.gold} />
          </div>

          {/* Tabs */}
          <div className="sme-tabbar" style={{ display: 'flex', gap: 24, overflowX: 'auto' }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flexShrink: 0, padding: '10px 2px', cursor: 'pointer', border: 'none', background: 'none',
                borderBottom: tab === t ? `2px solid ${C.gold}` : '2px solid transparent', marginBottom: -1,
                color: tab === t ? C.goldLight : C.inkLight,
                fontSize: 13, fontWeight: tab === t ? 700 : 500, fontFamily: 'inherit', textTransform: 'capitalize',
              }}>{t === 'rwa' ? 'RWA Tokens' : t}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '28px 20px 0' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div>
            {/* flow chart */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <p style={label}>Monthly Cash Flow</p>
                <div style={{ display: 'flex', gap: 14 }}>
                  <span style={{ fontSize: 11, color: '#7DC383', fontWeight: 600 }}>● Income</span>
                  <span style={{ fontSize: 11, color: C.gold, fontWeight: 600 }}>● Expense</span>
                </div>
              </div>
              <FlowBars data={d.monthlyFlow} />
            </section>

            {/* debt owed warning */}
            {d.stats.debtOwedKes > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 28, paddingTop: 24, borderTop: `1px solid ${C.hairline}` }}>
                <AlertCircle size={18} color={C.gold} style={{ flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: C.gold, margin: '0 0 2px' }}>Debt Owed</p>
                  <p style={{ fontSize: 11.5, color: C.inkLight, margin: 0 }}>KES {d.stats.debtOwedKes.toLocaleString()} payable to suppliers</p>
                </div>
              </div>
            )}

            {/* recent ledger preview */}
            <section style={{ marginTop: 32, paddingTop: 28, borderTop: `1px solid ${C.hairline}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <p style={label}>Recent Ledger</p>
                <button onClick={() => setTab('ledger')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.goldLight, fontSize: 11.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'inherit' }}>
                  All entries <ChevronRight size={12} />
                </button>
              </div>
              {d.ledger.slice(0, 4).map(e => {
                const ec = ENTRY_CONFIG[e.type] ?? ENTRY_CONFIG.INCOME;
                return (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: `1px solid ${C.hairline}` }}>
                    {ec.icon}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: C.paper, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description}</p>
                      <p style={{ fontSize: 10.5, color: C.inkLight, margin: 0 }}>{e.categoryTag} · {e.paymentMethod}</p>
                    </div>
                    <p style={{ fontSize: 13.5, fontWeight: 700, color: ec.color, margin: 0, flexShrink: 0 }}>
                      {ec.sign}KES {(e.amountKes / 1000).toFixed(1)}K
                    </p>
                  </div>
                );
              })}
            </section>
          </div>
        )}

        {/* ── FULL LEDGER ── */}
        {tab === 'ledger' && (
          <div>
            <p style={{ ...label, marginBottom: 16 }}>Ledger Entries ({d.ledger.length})</p>
            {d.ledger.map(e => {
              const ec = ENTRY_CONFIG[e.type] ?? ENTRY_CONFIG.INCOME;
              return (
                <div key={e.id} style={{ padding: '14px 0', borderBottom: `1px solid ${C.hairline}` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      {ec.icon}
                      <div>
                        <p style={{ fontSize: 13.5, fontWeight: 700, color: C.paper, margin: '0 0 2px' }}>{e.description}</p>
                        <p style={{ fontSize: 11, color: C.inkLight, margin: 0 }}>{e.counterparty}</p>
                      </div>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: ec.color, margin: 0 }}>
                      {ec.sign}KES {e.amountKes.toLocaleString()}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <span style={{ fontSize: 11, color: C.inkLight, fontWeight: 600 }}>{e.categoryTag}</span>
                      <span style={{ fontSize: 11, color: ec.color, fontWeight: 600 }}>{e.paymentMethod}</span>
                    </div>
                    <span style={{ fontSize: 10.5, color: C.inkLight }}>{new Date(e.timestamp).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── RWA TOKENS ── */}
        {tab === 'rwa' && (
          <div>
            <p style={{ ...label, marginBottom: 6 }}>Cash Flow Tokenisation (RWA)</p>
            <p style={{ fontSize: 12, color: C.inkLight, marginBottom: 20, lineHeight: 1.5 }}>
              Turn unpaid invoices into on-chain tokens. Investors fund KES upfront, you repay at maturity.
            </p>
            {d.cashFlowTokens.map(t => {
              const tc = TOKEN_STATUS_COLOR[t.status] ?? C.gold;
              const yieldPct = (((t.invoiceAmountKes - t.discountPriceKes) / t.discountPriceKes) * 100).toFixed(1);
              return (
                <div key={t.id} style={{ padding: '18px 0', borderBottom: `1px solid ${C.hairline}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div>
                      <p style={{ ...MONO, fontSize: 10.5, fontWeight: 700, color: C.goldLight, margin: '0 0 4px' }}>{t.tokenRef}</p>
                      <p style={{ fontSize: 15, fontWeight: 700, color: C.paper, margin: 0 }}>{t.debtorName}</p>
                    </div>
                    <span style={{ ...MONO, fontSize: 9.5, fontWeight: 700, color: tc, letterSpacing: 0.4 }}>
                      {t.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                    {[
                      { l: 'Face Value',     v: `KES ${(t.invoiceAmountKes/1000).toFixed(0)}K`, color: C.paper },
                      { l: 'Funded At',      v: `KES ${(t.discountPriceKes/1000).toFixed(0)}K`,  color: '#6FA8DC' },
                      { l: 'Investor Yield', v: `${yieldPct}%`,                                  color: '#7DC383' },
                    ].map(s => (
                      <div key={s.l} style={{ textAlign: 'center' }}>
                        <p style={{ ...SERIF, fontSize: 15, fontWeight: 600, color: s.color, margin: '0 0 2px' }}>{s.v}</p>
                        <p style={{ ...MONO, fontSize: 8.5, color: C.inkLight, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', margin: 0 }}>{s.l}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11.5, color: C.inkLight }}>Maturity: <span style={{ color: C.paperDim, fontWeight: 600 }}>{t.maturityDate.slice(0,10)}</span></span>
                    <Link href="/connft" style={{ fontSize: 11.5, color: C.goldLight, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>View NFT <ExternalLink size={10} /></Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── PRODUCTS ── */}
        {tab === 'products' && (
          <div>
            <p style={{ ...label, marginBottom: 16 }}>Financial Products</p>
            {d.products.map(p => {
              const sc = p.status === 'Active' ? '#7DC383' : p.status === 'Available' ? '#6FA8DC' : C.gold;
              return (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0', borderBottom: `1px solid ${C.hairline}` }}>
                  <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1 }}>{p.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: C.paper, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                    <p style={{ fontSize: 11, color: C.inkLight, margin: 0 }}>Cap: <span style={{ color: C.paperDim, fontWeight: 600 }}>{p.cap}</span> · {p.token}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ ...SERIF, fontSize: 16, fontWeight: 600, color: '#7DC383', margin: '0 0 4px' }}>{p.rate}</p>
                    <span style={{ ...MONO, fontSize: 9.5, fontWeight: 700, color: sc, letterSpacing: 0.3 }}>{p.status}</span>
                  </div>
                </div>
              );
            })}

            <p style={{ ...label, margin: '32px 0 16px' }}>Quick Access</p>
            {[
              { label: 'Scan & Pay', href: '/pay',    icon: CreditCard  },
              { label: 'Vaults',     href: '/vaults', icon: TrendingUp  },
              { label: 'Policies',   href: '/nuvari', icon: ShieldCheck },
              { label: 'NFT Market', href: '/connft', icon: Package     },
            ].map(l => (
              <Link key={l.label} href={l.href} className="sme-quicklink" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: `1px solid ${C.hairline}` }}>
                <l.icon size={16} color={C.goldLight} strokeWidth={1.7} />
                <span className="sme-quicklink-title" style={{ fontSize: 13.5, fontWeight: 600, color: C.paperDim, transition: 'color 0.15s ease' }}>{l.label}</span>
                <ChevronRight size={13} color={C.inkLight} style={{ marginLeft: 'auto' }} />
              </Link>
            ))}
          </div>
        )}
        </div>
      </div>
    </main>
  );
}
