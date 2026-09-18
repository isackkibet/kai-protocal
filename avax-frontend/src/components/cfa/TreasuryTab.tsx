'use client';

import { useEffect, useState } from 'react';
import {
  Coins, TrendingDown, ShieldCheck, AlertTriangle,
  FileCheck, Clock, ArrowDownLeft, ArrowUpRight, Scale, Loader2,
} from 'lucide-react';

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

const STATUS_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  AUDITED: { color: '#4ade80', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.28)' },
  APPROVED: { color: '#22d3ee', bg: 'rgba(34,211,238,0.10)', border: 'rgba(34,211,238,0.28)' },
  PENDING: { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.30)' },
  REJECTED: { color: '#f87171', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.28)' },
};

const GUARDRAIL_LABEL: Record<string, string> = {
  APPROVAL: 'Single approval',
  CAP: 'Budget cap',
  DUAL: 'Two approvers',
  NONE: 'Committee',
};

function KPI({ icon, value, label, color, sub }: { icon: React.ReactNode; value: string; label: string; color: string; sub?: string }) {
  return (
    <div style={{
      borderRadius: 18, padding: '16px 14px', textAlign: 'center',
      background: `linear-gradient(145deg, ${color}10 0%, rgba(10,10,12,0.92) 100%)`,
      border: `1px solid ${color}28`, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }} />
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>{icon}</div>
      <p style={{ fontSize: 20, fontWeight: 900, color, margin: '0 0 3px', letterSpacing: -1 }}>{value}</p>
      <p style={{ fontSize: 9, color: 'rgba(248,248,250,0.40)', margin: sub ? '0 0 2px' : 0, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase' }}>{label}</p>
      {sub && <p style={{ fontSize: 10, color, fontWeight: 700, margin: 0 }}>{sub}</p>}
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
      <div style={{ padding: '40px 0', textAlign: 'center', color: 'rgba(248,248,250,0.4)', fontSize: 12 }}>
        <Loader2 className="animate-spin" size={20} color="#f59e0b" style={{ marginBottom: 8 }} />
        <p>Loading treasury…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: '36px 18px', textAlign: 'center' }}>
        <AlertTriangle size={22} color="#fbbf24" style={{ marginBottom: 8 }} />
        <p style={{ fontSize: 13, fontWeight: 800, color: '#f8f8fa', margin: '0 0 4px' }}>Treasury unavailable</p>
        <p style={{ fontSize: 11, color: 'rgba(248,248,250,0.45)', margin: '0 0 14px' }}>We couldn&apos;t load the treasury data right now.</p>
        <button onClick={load} style={{ padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#f59e0b,#b45309)', color: '#fff', fontSize: 12, fontWeight: 800 }}>
          Retry
        </button>
      </div>
    );
  }

  const { treasury: t, allocations, ledger, guardrails } = data;
  const net = t.incoming30d - t.outgoing30d;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Wallet + trust strip */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '14px 16px', borderRadius: 16, background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(10,10,12,0.92) 100%)', border: '1px solid rgba(245,158,11,0.20)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Coins size={15} color="#fbbf24" />
          <p style={{ fontSize: 11, fontWeight: 800, color: '#fbbf24', margin: 0, fontFamily: 'monospace' }}>{t.walletAddress}</p>
        </div>
        <p style={{ fontSize: 10, color: 'rgba(248,248,250,0.45)', margin: 0, lineHeight: 1.6 }}>
          Guarded treasury · every movement below is logged with an initiator and a different approver, capped per category, and audited quarterly.
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
        <KPI icon={<Coins size={18} color="#f59e0b" strokeWidth={1.8} />} value={fmtKes(t.totalBalanceKes)} label="Balance" color="#f59e0b" sub={`Net 30d: ${net >= 0 ? '+' : ''}${fmtKes(net)}`} />
        <KPI icon={<ArrowDownLeft size={18} color="#22c55e" strokeWidth={1.8} />} value={fmtKes(t.incoming30d)} label="Incoming / 30d" color="#22c55e" />
        <KPI icon={<ArrowUpRight size={18} color="#3b82f6" strokeWidth={1.8} />} value={fmtKes(t.outgoing30d)} label="Outgoing / 30d" color="#3b82f6" />
        <KPI icon={<ShieldCheck size={18} color="#a855f7" strokeWidth={1.8} />} value={t.pendingApprovals.toString()} label="Awaiting approval" color="#a855f7" sub={t.pendingApprovals > 0 ? 'Action required' : 'All clear'} />
        <KPI icon={<FileCheck size={18} color="#06b6d4" strokeWidth={1.8} />} value={t.auditCount.toString()} label="Audits done" color="#06b6d4" />
        <KPI icon={<Clock size={18} color="#f59e0b" strokeWidth={1.8} />} value={new Date(t.lastAuditAt).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })} label="Last audit" color="#f59e0b" sub={t.lastAuditBy} />
      </div>

      {/* Inflow sources */}
      <section>
        <p className="label-caps" style={{ marginBottom: 12 }}>Where funds come from</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.breakdown.filter(b => b.type === 'IN').map((b) => (
            <div key={b.id} style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.16)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <TrendingDown size={14} color="#22c55e" style={{ transform: 'rotate(180deg)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <p style={{ fontSize: 12, fontWeight: 800, color: '#f8f8fa', margin: 0 }}>{b.category}</p>
                  <p style={{ fontSize: 12, fontWeight: 900, color: '#4ade80', margin: 0 }}>{fmtKes(b.amountKes)}</p>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${b.pct}%`, borderRadius: 2, background: 'linear-gradient(90deg,#22c55e,#4ade80)' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Budget guardrails */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p className="label-caps" style={{ margin: 0 }}>Responsible budgets</p>
          <span style={{ fontSize: 9, fontWeight: 800, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Scale size={11} /> Capped &amp; approved by role
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {allocations.map((a) => {
            const pct = Math.min(100, Math.round((a.spentKes / a.budgetKes) * 100));
            const atRisk = pct >= 90;
            return (
              <div key={a.id} style={{ borderRadius: 16, padding: '13px 15px', background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(10,10,12,0.92) 100%)', border: `1px solid ${atRisk ? 'rgba(248,113,113,0.3)' : 'rgba(255,255,255,0.08)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: '#f8f8fa', margin: 0 }}>{a.category}</p>
                    {atRisk && <AlertTriangle size={12} color="#f87171" style={{ flexShrink: 0 }} />}
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: `${atRisk ? 'rgba(248,113,113,0.14)' : 'rgba(245,158,11,0.12)'}`, color: atRisk ? '#f87171' : '#fbbf24', border: `1px solid ${atRisk ? 'rgba(248,113,113,0.30)' : 'rgba(245,158,11,0.28)'}`, letterSpacing: 0.3, flexShrink: 0 }}>
                    {GUARDRAIL_LABEL[a.guardrail]}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <p style={{ fontSize: 10, color: 'rgba(248,248,250,0.42)', margin: 0 }}>{fmtKes(a.spentKes)} of {fmtKes(a.budgetKes)} · approved by {a.approverRole}</p>
                  <p style={{ fontSize: 10, fontWeight: 800, color: atRisk ? '#f87171' : '#4ade80', margin: 0 }}>{pct}%</p>
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: atRisk ? 'linear-gradient(90deg,#f87171,#fb923c)' : 'linear-gradient(90deg,#10b981,#f59e0b)' }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Ledger */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p className="label-caps" style={{ margin: 0 }}>Movement ledger</p>
          <span style={{ fontSize: 9, color: 'rgba(248,248,250,0.35)', fontWeight: 700 }}>{ledger.length} entries · latest first</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {ledger.map((l) => {
            const st = STATUS_STYLE[l.status];
            const inbound = l.type === 'IN';
            return (
              <div key={l.id} style={{ borderRadius: 16, padding: '14px 15px', background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(10,10,12,0.92) 100%)', border: `1px solid ${inbound ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.08)'}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                    {inbound
                      ? <ArrowDownLeft size={15} color="#22c55e" style={{ flexShrink: 0 }} />
                      : <ArrowUpRight size={15} color="#3b82f6" style={{ flexShrink: 0 }} />}
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 800, color: '#f8f8fa', margin: '0 0 2px' }}>{l.purpose}</p>
                      <p style={{ fontSize: 9, color: 'rgba(248,248,250,0.38)', margin: 0, fontFamily: 'monospace' }}>
                        {l.ref} · {l.category} · {l.at}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 900, color: inbound ? '#4ade80' : '#f8f8fa', margin: '0 0 3px' }}>
                      {inbound ? '+' : '−'}{fmtKes(l.amountKes)}
                    </p>
                    <span style={{ fontSize: 8, fontWeight: 800, padding: '2px 7px', borderRadius: 5, background: st.bg, color: st.color, border: `1px solid ${st.border}`, letterSpacing: 0.4 }}>{l.status}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <ShieldCheck size={10} color="rgba(248,248,250,0.35)" />
                  <p style={{ fontSize: 9, color: 'rgba(248,248,250,0.42)', margin: 0, lineHeight: 1.5 }}>
                    Raised by <b style={{ color: 'rgba(248,248,250,0.7)' }}>{l.initiatorRole}</b> → approved by <b style={{ color: 'rgba(248,248,250,0.7)' }}>{l.approverRole}</b>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Guardrails / rules */}
      <section>
        <p className="label-caps" style={{ marginBottom: 12 }}>Responsible governance rules</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {guardrails.map((g) => (
            <div key={g.rule} style={{ display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 14, background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.16)' }}>
              <ShieldCheck size={15} color="#10b981" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: 12, fontWeight: 800, color: '#f8f8fa', margin: '0 0 3px' }}>{g.rule}</p>
                <p style={{ fontSize: 10, color: 'rgba(248,248,250,0.5)', margin: 0, lineHeight: 1.6 }}>{g.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}