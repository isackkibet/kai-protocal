'use client';

import { useEffect, useState } from 'react';
import {
  Coins, TrendingDown, ShieldCheck, AlertTriangle,
  FileCheck, Clock, ArrowDownLeft, ArrowUpRight, Scale, Loader2,
} from 'lucide-react';

/* Same editorial system as the rest of the app — pine + gold + paper,
   flat rows separated by a hairline, no gradient card shells. Status
   colour is kept as plain text, not a bordered glowing pill. */
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

// ── Types ─────────────────────────────────────────────────────────
interface TreasuryData {
  treasury: {
    walletAddress: string;
    currency: string;
    totalBalanceKes: number;
    incoming30d: number;
    outgoing30d: number;
    pendingApprovals: number;
    auditCount: number;
    lastAuditAt: string;
    lastAuditBy: string;
  };
  breakdown: { id: string; category: string; amountKes: number; type: 'IN' | 'OUT'; pct: number }[];
  allocations: {
    id: string; category: string; budgetKes: number; spentKes: number;
    guardrail: 'APPROVAL' | 'CAP' | 'DUAL' | 'NONE'; approverRole: string;
  }[];
  ledger: {
    id: string; ref: string; type: 'IN' | 'OUT'; purpose: string; category: string;
    amountKes: number; initiatorRole: string; approverRole: string;
    status: 'AUDITED' | 'APPROVED' | 'PENDING' | 'REJECTED'; at: string;
  }[];
  guardrails: { rule: string; description: string }[];
}

const fmtKes = (n: number) =>
  n >= 1000 ? `KES ${(n / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}K` : `KES ${n.toLocaleString()}`;

const STATUS_COLOR: Record<string, string> = {
  AUDITED: '#7DC383',
  APPROVED: '#6FA8DC',
  PENDING: C.gold,
  REJECTED: C.red,
};

const GUARDRAIL_LABEL: Record<string, string> = {
  APPROVAL: 'Single approval',
  CAP: 'Budget cap',
  DUAL: 'Two approvers',
  NONE: 'Committee',
};

function KPICell({ icon, value, label: l, color, sub }: { icon: React.ReactNode; value: string; label: string; color: string; sub?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '0 4px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>{icon}</div>
      <p style={{ ...SERIF, fontSize: 17, fontWeight: 600, color, margin: '0 0 3px' }}>{value}</p>
      <p style={{ ...MONO, fontSize: 8.5, color: C.inkLight, margin: sub ? '0 0 2px' : 0, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>{l}</p>
      {sub && <p style={{ fontSize: 10, color, fontWeight: 600, margin: 0 }}>{sub}</p>}
    </div>
  );
}

export default function TreasuryTab() {
  const [data, setData] = useState<TreasuryData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/cfa/treasury');
      if (!r.ok) throw new Error(`treasury ${r.status}`);
      setData(await r.json());
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch-on-mount: loads treasury snapshot once. load() awaits an async fetch,
  // so the setState inside it fires after the effect body resolves.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  if (loading && !data) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: C.inkLight, fontSize: 12 }}>
        <Loader2 className="animate-spin" size={20} color={C.goldLight} style={{ marginBottom: 8 }} />
        <p>Loading treasury…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: '36px 0', textAlign: 'center' }}>
        <AlertTriangle size={22} color={C.gold} style={{ marginBottom: 8 }} />
        <p style={{ fontSize: 13, fontWeight: 700, color: C.paper, margin: '0 0 4px' }}>Treasury unavailable</p>
        <p style={{ fontSize: 11.5, color: C.inkLight, margin: '0 0 16px' }}>We couldn&apos;t load the treasury data right now.</p>
        <button onClick={load} style={{ padding: '10px 20px', borderRadius: 999, border: 'none', cursor: 'pointer', background: C.gold, color: '#1B1A14', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>
          Retry
        </button>
      </div>
    );
  }

  const { treasury: t, allocations, ledger, guardrails } = data;
  const net = t.incoming30d - t.outgoing30d;

  return (
    <div>
      {/* Wallet + trust strip */}
      <div style={{ paddingBottom: 20, marginBottom: 28, borderBottom: `1px solid ${C.hairline}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Coins size={15} color={C.goldLight} />
          <p style={{ ...MONO, fontSize: 11, fontWeight: 700, color: C.goldLight, margin: 0 }}>{t.walletAddress}</p>
        </div>
        <p style={{ fontSize: 11.5, color: C.inkLight, margin: 0, lineHeight: 1.6 }}>
          Guarded treasury: every movement below is logged with an initiator and a different approver, capped per category, and audited quarterly.
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px 8px', marginBottom: 28, paddingBottom: 28, borderBottom: `1px solid ${C.hairline}` }}>
        <KPICell icon={<Coins size={16} color={C.gold} strokeWidth={1.7} />} value={fmtKes(t.totalBalanceKes)} label="Balance" color={C.gold} sub={`Net 30d: ${net >= 0 ? '+' : ''}${fmtKes(net)}`} />
        <KPICell icon={<ArrowDownLeft size={16} color="#7DC383" strokeWidth={1.7} />} value={fmtKes(t.incoming30d)} label="In / 30d" color="#7DC383" />
        <KPICell icon={<ArrowUpRight size={16} color="#6FA8DC" strokeWidth={1.7} />} value={fmtKes(t.outgoing30d)} label="Out / 30d" color="#6FA8DC" />
        <KPICell icon={<ShieldCheck size={16} color="#C48FE0" strokeWidth={1.7} />} value={t.pendingApprovals.toString()} label="Awaiting" color="#C48FE0" sub={t.pendingApprovals > 0 ? 'Action needed' : 'All clear'} />
        <KPICell icon={<FileCheck size={16} color={C.goldLight} strokeWidth={1.7} />} value={t.auditCount.toString()} label="Audits" color={C.goldLight} />
        <KPICell icon={<Clock size={16} color={C.gold} strokeWidth={1.7} />} value={new Date(t.lastAuditAt).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })} label="Last audit" color={C.gold} sub={t.lastAuditBy} />
      </div>

      {/* Inflow sources */}
      <section style={{ marginBottom: 28, paddingBottom: 28, borderBottom: `1px solid ${C.hairline}` }}>
        <p style={{ ...label, marginBottom: 16 }}>Where funds come from</p>
        {data.breakdown.filter(b => b.type === 'IN').map((b) => (
          <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
            <TrendingDown size={13} color="#7DC383" style={{ transform: 'rotate(180deg)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.paper, margin: 0 }}>{b.category}</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#7DC383', margin: 0 }}>{fmtKes(b.amountKes)}</p>
              </div>
              <div style={{ height: 3, background: C.hairline, borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${b.pct}%`, borderRadius: 2, background: '#7DC383' }} />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Budget guardrails */}
      <section style={{ marginBottom: 28, paddingBottom: 28, borderBottom: `1px solid ${C.hairline}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <p style={{ ...label, margin: 0 }}>Responsible budgets</p>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: C.gold, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Scale size={11} /> Capped &amp; approved by role
          </span>
        </div>
        {allocations.map((a) => {
          const pct = Math.min(100, Math.round((a.spentKes / a.budgetKes) * 100));
          const atRisk = pct >= 90;
          const barColor = atRisk ? C.red : C.gold;
          return (
            <div key={a.id} style={{ padding: '13px 0', borderTop: `1px solid ${C.hairline}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: C.paper, margin: 0 }}>{a.category}</p>
                  {atRisk && <AlertTriangle size={12} color={C.red} style={{ flexShrink: 0 }} />}
                </div>
                <span style={{ ...MONO, fontSize: 9.5, fontWeight: 700, color: atRisk ? C.red : C.gold, letterSpacing: 0.3, flexShrink: 0 }}>
                  {GUARDRAIL_LABEL[a.guardrail]}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <p style={{ fontSize: 11, color: C.inkLight, margin: 0 }}>{fmtKes(a.spentKes)} of {fmtKes(a.budgetKes)}, approved by {a.approverRole}</p>
                <p style={{ fontSize: 11, fontWeight: 700, color: atRisk ? C.red : '#7DC383', margin: 0 }}>{pct}%</p>
              </div>
              <div style={{ height: 3, background: C.hairline, borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${pct}%`, borderRadius: 2, background: barColor }} />
              </div>
            </div>
          );
        })}
      </section>

      {/* Ledger */}
      <section style={{ marginBottom: 28, paddingBottom: 28, borderBottom: `1px solid ${C.hairline}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <p style={{ ...label, margin: 0 }}>Movement ledger</p>
          <span style={{ fontSize: 11, color: C.inkLight, fontWeight: 600 }}>{ledger.length} entries, latest first</span>
        </div>
        {ledger.map((l) => {
          const sc = STATUS_COLOR[l.status];
          const inbound = l.type === 'IN';
          return (
            <div key={l.id} style={{ padding: '14px 0', borderTop: `1px solid ${C.hairline}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                  {inbound
                    ? <ArrowDownLeft size={15} color="#7DC383" style={{ flexShrink: 0 }} />
                    : <ArrowUpRight size={15} color="#6FA8DC" style={{ flexShrink: 0 }} />}
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 700, color: C.paper, margin: '0 0 2px' }}>{l.purpose}</p>
                    <p style={{ ...MONO, fontSize: 9.5, color: C.inkLight, margin: 0 }}>
                      {l.ref} · {l.category} · {l.at}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: inbound ? '#7DC383' : C.paper, margin: '0 0 3px' }}>
                    {inbound ? '+' : '−'}{fmtKes(l.amountKes)}
                  </p>
                  <span style={{ ...MONO, fontSize: 9, fontWeight: 700, color: sc, letterSpacing: 0.4 }}>{l.status}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldCheck size={11} color={C.inkLight} />
                <p style={{ fontSize: 11, color: C.inkLight, margin: 0, lineHeight: 1.5 }}>
                  Raised by <b style={{ color: C.paperDim }}>{l.initiatorRole}</b> → approved by <b style={{ color: C.paperDim }}>{l.approverRole}</b>
                </p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Guardrails / rules */}
      <section>
        <p style={{ ...label, marginBottom: 16 }}>Responsible governance rules</p>
        {guardrails.map((g) => (
          <div key={g.rule} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: `1px solid ${C.hairline}` }}>
            <ShieldCheck size={15} color={C.goldLight} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.paper, margin: '0 0 3px' }}>{g.rule}</p>
              <p style={{ fontSize: 11.5, color: C.inkLight, margin: 0, lineHeight: 1.6 }}>{g.description}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
