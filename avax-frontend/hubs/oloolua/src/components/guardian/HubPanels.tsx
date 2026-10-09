'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw, Search, Check, X, AlertCircle } from 'lucide-react';
import { ACTIVITY_TYPES, ACTIVITY_TYPE_KEYS, ROLES, ROLE_LABELS, STATUS_LABELS, type ActivityType, type Role, type RecordStatus } from '@/lib/guardian/constants';
import DraftCard from './DraftCard';
import { api, fmt, formatDate, readTool, writeTool, type DraftView } from './api';

const card = 'rounded-2xl bg-[#122b1f] border border-[#e4c878]/20 p-4 sm:p-5';
const th = 'py-2 px-2 text-left text-[10px] uppercase tracking-wide text-gray-400 font-semibold';
const td = 'py-2 px-2 align-top';
const input = 'bg-[#0b1c14] border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#e4c878]/60';

function useLoad<T>(loader: () => Promise<{ ok: boolean; data: any }>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    const r = await loader();
    setLoading(false);
    if (r.ok) setData(r.data.data as T);
    else setError(r.data?.message ?? r.data?.error ?? 'Could not load.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { void load(); }, [load]);
  return { data, error, loading, reload: load };
}

function Status({ status }: { status: RecordStatus }) {
  const style = {
    confirmed: 'bg-amber-950 text-amber-300 border-amber-800',
    verified: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    rejected: 'bg-red-950 text-red-300 border-red-800',
    corrected: 'bg-white/5 text-gray-400 border-white/10',
  }[status];
  return <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${style}`}>{STATUS_LABELS[status]}</span>;
}

function DashRow({ cols, text }: { cols: number; text?: string }) {
  return <tr><td colSpan={cols} className="py-3 px-2 text-center text-gray-500">{text ?? '-'}</td></tr>;
}

function Problem({ text }: { text: string }) {
  return <p role="alert" className="flex items-center gap-1.5 text-xs text-red-300"><AlertCircle className="w-3.5 h-3.5" />{text}</p>;
}

// ── Nursery ──────────────────────────────────────────────────────────────────

export function NurseryPanel({ refreshKey }: { refreshKey: number }) {
  const summary = useLoad<any>(() => readTool('get_nursery_summary'), [refreshKey]);
  const beds = useLoad<any[]>(() => readTool('get_seedbeds'), [refreshKey]);
  const species = useLoad<{ count: number; species: { id: string; name: string; scientificName: string | null }[] }>(() => readTool('get_species'), [refreshKey]);
  const s = summary.data;

  return (
    <div className="space-y-4">
      <div className={card}>
        <h3 className="font-bold text-white mb-3">{s?.nurseryName ?? 'Nursery'} summary</h3>
        {summary.error && <Problem text={summary.error} />}
        {summary.loading && !s ? <Loader2 className="w-5 h-5 animate-spin text-[#e4c878]" /> : s && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                ['Currently ready', fmt(s.readyStockVerified), 'Verified ready stock'],
                ['Nursery capacity', s.capacity !== null ? fmt(s.capacity) : '-', 'Capacity, not current stock'],
                ['Cataloged species', String(s.speciesCount), 'Species records'],
                ['Active seedbeds', String(s.activeSeedbeds), 'Seedbed records'],
              ].map(([k, v, hint]) => (
                <div key={k} className="rounded-xl bg-[#0b1c14] border border-white/10 p-3">
                  <div className="text-[10px] uppercase tracking-wide text-gray-400">{k}</div>
                  <div className="text-2xl font-black text-white tabular-nums">{v}</div>
                  <div className="text-[10px] text-emerald-400">{hint}</div>
                </div>
              ))}
            </div>
            {s.readyStockPendingNet !== 0 && (
              <p className="text-xs text-amber-200 mt-2">Confirmed records not yet verified would change ready stock by {s.readyStockPendingNet > 0 ? '+' : ''}{fmt(s.readyStockPendingNet)}.</p>
            )}
            {s.baseline && <p className="text-[11px] text-gray-500 mt-2">Baseline as of {formatDate(s.baseline.asOf)}. Source: {s.baseline.source}.</p>}
          </>
        )}
      </div>

      <div className={card}>
        <h3 className="font-bold text-white mb-3">Seedbeds</h3>
        {beds.error && <Problem text={beds.error} />}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-white/10"><th className={th}>Bed</th><th className={th}>Method</th><th className={th}>Manager</th><th className={th}>Capacity</th><th className={th}>Verified stock</th><th className={th}>Status</th></tr></thead>
            <tbody className="divide-y divide-white/5 text-gray-200">
              {beds.data && beds.data.length > 0 ? beds.data.map((b) => (
                <tr key={b.id}>
                  <td className={`${td} font-bold text-white`}>Bed {b.bedNumber}</td>
                  <td className={td}>{b.method ?? '-'}</td>
                  <td className={td}>{b.manager ?? <span className="text-gray-500">Not assigned</span>}</td>
                  <td className={td}>{b.capacityMax !== null ? `Up to ${fmt(b.capacityMax)}` : '-'}</td>
                  <td className={td}>{b.currentStock !== null ? fmt(b.currentStock) : <span className="text-gray-500">None recorded</span>}</td>
                  <td className={td}>{b.status}</td>
                </tr>
              )) : <DashRow cols={6} />}
            </tbody>
          </table>
        </div>
      </div>

      <div className={card}>
        <h3 className="font-bold text-white mb-3">Cataloged species {species.data ? `(${species.data.count})` : ''}</h3>
        {species.error && <Problem text={species.error} />}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
          {species.data?.species.length ? species.data.species.map((sp) => (
            <div key={sp.id} className="rounded-lg bg-[#0b1c14] border border-white/5 px-3 py-2">
              <div className="font-semibold text-white">{sp.name}</div>
              <div className="italic text-gray-400">{sp.scientificName}</div>
            </div>
          )) : <p className="text-gray-500">-</p>}
        </div>
      </div>
    </div>
  );
}

// ── Keeper Diary ─────────────────────────────────────────────────────────────

export function DiaryPanel({ refreshKey }: { refreshKey: number }) {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const diary = useLoad<{ entries: any[] }>(() => readTool('search_keeper_diary', { query: submitted || undefined, limit: 50 }), [submitted, refreshKey]);

  return (
    <div className={card}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <h3 className="font-bold text-white">Keeper Diary</h3>
          <p className="text-[11px] text-gray-400">The append-only log of confirmed events. Entries are never edited or deleted.</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setSubmitted(query.trim()); }} className="flex gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the diary" aria-label="Search the diary" className={`${input} pl-8`} />
          </div>
          <button className="px-3 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold">Search</button>
        </form>
      </div>
      {diary.error && <Problem text={diary.error} />}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="border-b border-white/10"><th className={th}>When</th><th className={th}>Event</th><th className={th}>What</th><th className={th}>By</th></tr></thead>
          <tbody className="divide-y divide-white/5 text-gray-200">
            {diary.loading && !diary.data ? <DashRow cols={4} text="Loading..." /> : diary.data?.entries.length ? diary.data.entries.map((e) => (
              <tr key={e.id}>
                <td className={`${td} whitespace-nowrap`}>{formatDate(e.ts)}</td>
                <td className={`${td} capitalize`}>{e.eventType}</td>
                <td className={td}>{e.description}</td>
                <td className={td}>{e.actor ?? '-'}</td>
              </tr>
            )) : <DashRow cols={4} text={submitted ? 'No verified Guardian records were found for this request.' : '-'} />}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Record (structured form, same draft/confirm flow as the AI) ──────────────

export function RecordPanel({ onSaved }: { onSaved: () => void }) {
  const [form, setForm] = useState({ type: '', quantity: '', date: '', species: '', seedbed: '', toSeedbed: '', destination: '', notes: '' });
  const [draft, setDraft] = useState<DraftView | null>(null);
  const [problem, setProblem] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState('');
  const species = useLoad<{ species: { id: string; name: string }[] }>(() => readTool('get_species'));
  const beds = useLoad<any[]>(() => readTool('get_seedbeds'));
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const type = form.type as ActivityType | '';
  const needs = (field: string) => !!type && (ACTIVITY_TYPES[type].required as readonly string[]).includes(field);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setProblem(''); setSaved('');
    const r = await api<{ draft: DraftView; problem?: string; error?: string }>('/api/guardian/drafts', { body: form });
    setBusy(false);
    if (!r.ok) { setProblem(r.data?.error ?? 'Could not create the draft.'); return; }
    setDraft(r.data.draft);
    if (r.data.problem) setProblem(r.data.problem);
    else if (r.data.draft.status === 'draft' && r.data.draft.question) setProblem(r.data.draft.question);
  };

  return (
    <div className={card}>
      <h3 className="font-bold text-white">Record an activity</h3>
      <p className="text-[11px] text-gray-400 mb-3">Creates a draft. You review it and confirm before anything is saved. Using this form does not use a prompt.</p>
      <form onSubmit={submit} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
        <label className="space-y-1"><span className="text-gray-300 font-semibold">Activity type</span>
          <select required value={form.type} onChange={set('type')} className={`${input} w-full`}>
            <option value="">Choose...</option>
            {ACTIVITY_TYPE_KEYS.map((k) => <option key={k} value={k}>{ACTIVITY_TYPES[k].label}</option>)}
          </select>
        </label>
        <label className="space-y-1"><span className="text-gray-300 font-semibold">Quantity (seedlings)</span>
          <input type="number" min={1} required value={form.quantity} onChange={set('quantity')} className={`${input} w-full`} />
        </label>
        <label className="space-y-1"><span className="text-gray-300 font-semibold">Date</span>
          <input type="date" required value={form.date} onChange={set('date')} className={`${input} w-full`} />
        </label>
        <label className="space-y-1"><span className="text-gray-300 font-semibold">Species (optional)</span>
          <select value={form.species} onChange={set('species')} className={`${input} w-full`}>
            <option value="">Not specified</option>
            {species.data?.species.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
        </label>
        <label className="space-y-1"><span className="text-gray-300 font-semibold">{type === 'transfer' ? 'From bed' : 'Seedbed'}{needs('seedbed') ? '' : ' (optional)'}</span>
          <select required={needs('seedbed')} value={form.seedbed} onChange={set('seedbed')} className={`${input} w-full`}>
            <option value="">Not specified</option>
            {beds.data?.map((b) => <option key={b.id} value={b.bedNumber}>Bed {b.bedNumber}</option>)}
          </select>
        </label>
        {type === 'transfer' && (
          <label className="space-y-1"><span className="text-gray-300 font-semibold">To bed</span>
            <select required value={form.toSeedbed} onChange={set('toSeedbed')} className={`${input} w-full`}>
              <option value="">Choose...</option>
              {beds.data?.map((b) => <option key={b.id} value={b.bedNumber}>Bed {b.bedNumber}</option>)}
            </select>
          </label>
        )}
        {(type === 'dispatch' || type === 'out_planting') && (
          <label className="space-y-1"><span className="text-gray-300 font-semibold">Destination</span>
            <input required value={form.destination} onChange={set('destination')} maxLength={120} placeholder="School, buyer or planting site" className={`${input} w-full`} />
          </label>
        )}
        <label className="space-y-1 sm:col-span-2 lg:col-span-3"><span className="text-gray-300 font-semibold">Notes (optional)</span>
          <input value={form.notes} onChange={set('notes')} maxLength={500} className={`${input} w-full`} />
        </label>
        <div className="sm:col-span-2 lg:col-span-3">
          <button disabled={busy} className="px-4 py-2 rounded-lg bg-[#e4c878] hover:bg-amber-300 text-neutral-950 font-bold disabled:opacity-50 flex items-center gap-1.5">
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Review draft
          </button>
        </div>
      </form>
      {problem && <div className="mt-3"><Problem text={problem} /></div>}
      {saved && <p className="mt-3 text-xs text-emerald-300 font-semibold">{saved}</p>}
      {draft && (draft.status === 'pending' || draft.status === 'draft') && (
        <DraftCard
          draft={draft}
          onSaved={(r) => { setDraft(null); setProblem(''); setSaved(`Saved: ${r.description}. Status: Confirmed.`); onSaved(); }}
          onCancelled={() => { setDraft(null); setProblem(''); }}
        />
      )}
    </div>
  );
}

// ── Verification queue ───────────────────────────────────────────────────────

export function VerifyPanel({ refreshKey, onChanged }: { refreshKey: number; onChanged: () => void }) {
  const records = useLoad<{ records: any[] }>(() => readTool('get_activity_records', { status: 'confirmed', limit: 100 }), [refreshKey]);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<Record<string, string>>({});

  const review = async (id: string, decision: 'verify' | 'reject') => {
    const r = await writeTool('review_activity_record', { record_id: id, decision, reason: reasons[id] ?? '' });
    if (r.ok) { onChanged(); void records.reload(); }
    else setMsg((m) => ({ ...m, [id]: r.data?.message ?? 'Could not review.' }));
  };

  return (
    <div className={card}>
      <h3 className="font-bold text-white">Verification queue</h3>
      <p className="text-[11px] text-gray-400 mb-3">Confirmed records waiting for review. You cannot verify or reject a record you recorded yourself.</p>
      {records.error && <Problem text={records.error} />}
      <div className="space-y-2">
        {records.data?.records.length ? records.data.records.map((r) => {
          const own = r.recordedByYou === true;
          return (
            <div key={r.id} className="rounded-xl bg-[#0b1c14] border border-white/10 p-3 text-xs space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Status status={r.status} />
                <span className="font-semibold text-white">{ACTIVITY_TYPES[r.type as ActivityType]?.label}: {fmt(r.quantity)} seedlings</span>
                <span className="text-gray-400">{formatDate(r.date)}</span>
                {r.species && <span className="text-gray-300">{r.species}</span>}
                {r.seedbed && <span className="text-gray-300">Bed {r.seedbed}{r.toSeedbed ? ` to bed ${r.toSeedbed}` : ''}</span>}
                {r.destination && <span className="text-gray-300">to {r.destination}</span>}
                <span className="text-gray-400">by {r.recordedBy}</span>
                {r.version > 1 && <span className="text-gray-400">version {r.version}</span>}
              </div>
              {own ? <p className="text-amber-200">You recorded this, so another authorised person must review it.</p> : (
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => review(r.id, 'verify')} className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Verify</button>
                  <input value={reasons[r.id] ?? ''} onChange={(e) => setReasons((x) => ({ ...x, [r.id]: e.target.value }))} placeholder="Reason (required to reject)" className={`${input} flex-1 min-w-[160px]`} />
                  <button onClick={() => review(r.id, 'reject')} className="px-2.5 py-1.5 rounded-lg border border-red-700 text-red-200 hover:bg-red-950 font-bold flex items-center gap-1"><X className="w-3.5 h-3.5" /> Reject</button>
                </div>
              )}
              {msg[r.id] && <Problem text={msg[r.id]} />}
            </div>
          );
        }) : <p className="text-xs text-gray-500 py-3 text-center">{records.loading ? 'Loading...' : 'No records are waiting for review.'}</p>}
      </div>
    </div>
  );
}

// ── Audit trail ──────────────────────────────────────────────────────────────

export function AuditPanel({ refreshKey }: { refreshKey: number }) {
  const audit = useLoad<{ entries: any[] }>(() => readTool('get_audit_trail'), [refreshKey]);
  return (
    <div className={card}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-white">Audit trail</h3>
          <p className="text-[11px] text-gray-400">Every write, denial and review. Append-only.</p>
        </div>
        <button onClick={() => audit.reload()} className="p-2 rounded-lg hover:bg-white/10" aria-label="Refresh"><RefreshCw className="w-4 h-4" /></button>
      </div>
      {audit.error && <Problem text={audit.error} />}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="border-b border-white/10"><th className={th}>When</th><th className={th}>User</th><th className={th}>Tool</th><th className={th}>Result</th><th className={th}>Request</th><th className={th}>Channel</th></tr></thead>
          <tbody className="divide-y divide-white/5 text-gray-200">
            {audit.data?.entries.length ? audit.data.entries.map((a) => (
              <tr key={a.id}>
                <td className={`${td} whitespace-nowrap`}>{new Date(a.ts).toLocaleString('en-GB', { timeZone: 'Africa/Nairobi' })}</td>
                <td className={td}>{a.user_name ?? '-'}</td>
                <td className={`${td} font-mono`}>{a.tool}</td>
                <td className={td}>{a.result}{a.confirmation ? ` (${a.confirmation})` : ''}</td>
                <td className={`${td} max-w-[260px] truncate`} title={a.request_text ?? ''}>{a.request_text ?? '-'}</td>
                <td className={td}>{a.channel ?? '-'}</td>
              </tr>
            )) : <DashRow cols={6} text={audit.loading ? 'Loading...' : '-'} />}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Team (Admin) ─────────────────────────────────────────────────────────────

export function TeamPanel({ myUserId }: { myUserId: string }) {
  const team = useLoad<{ members: any[]; seedbeds: any[] }>(() => readTool('list_team'));
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');

  const update = async (args: Record<string, unknown>) => {
    setMsg('');
    const r = await writeTool('update_member', args);
    if (!r.ok) setMsg(r.data?.message ?? 'Could not update.');
    void team.reload();
  };
  const assign = async (seedbedId: string, managerId: string) => {
    setMsg('');
    const r = await writeTool('assign_seedbed_manager', { seedbed_id: seedbedId, manager_id: managerId || null });
    if (!r.ok) setMsg(r.data?.message ?? 'Could not assign.');
    void team.reload();
  };

  const active = team.data?.members.filter((m) => m.status === 'active') ?? [];

  return (
    <div className="space-y-4">
      <div className={card}>
        <h3 className="font-bold text-white">Team and roles</h3>
        <p className="text-[11px] text-gray-400 mb-3">New sign-ups start as Pending. Approve them by choosing a role. Seeded team members sign in once you set their email.</p>
        {msg && <div className="mb-2"><Problem text={msg} /></div>}
        {team.error && <Problem text={team.error} />}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-white/10"><th className={th}>Name</th><th className={th}>Email</th><th className={th}>Role</th><th className={th}>Access</th></tr></thead>
            <tbody className="divide-y divide-white/5 text-gray-200">
              {team.data?.members.length ? team.data.members.map((m) => {
                const me = m.id === myUserId;
                return (
                  <tr key={m.id}>
                    <td className={td}>
                      <div className="font-semibold text-white">{m.name}{me ? ' (you)' : ''}</div>
                      {m.user_status === 'unclaimed' && <div className="text-[10px] text-amber-300">Has not signed in yet</div>}
                    </td>
                    <td className={td}>
                      {m.user_status === 'unclaimed' && !m.email ? (
                        <form onSubmit={(e) => { e.preventDefault(); void update({ user_id: m.id, email: emails[m.id] }); }} className="flex gap-1">
                          <input type="email" required value={emails[m.id] ?? ''} onChange={(e) => setEmails((x) => ({ ...x, [m.id]: e.target.value }))} placeholder="Their Google email" className={`${input} w-44`} />
                          <button className="px-2 rounded-lg bg-white/10 hover:bg-white/20 font-semibold">Set</button>
                        </form>
                      ) : (m.email ?? '-')}
                    </td>
                    <td className={td}>
                      <select disabled={me} value={m.role} onChange={(e) => update({ user_id: m.id, role: e.target.value, status: 'active' })} className={input} aria-label={`Role for ${m.name}`}>
                        {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r as Role]}</option>)}
                      </select>
                    </td>
                    <td className={td}>
                      {me ? 'active' : (
                        <select value={m.status} onChange={(e) => update({ user_id: m.id, status: e.target.value })} className={input} aria-label={`Access for ${m.name}`}>
                          <option value="active">Active</option>
                          <option value="pending">Pending</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      )}
                    </td>
                  </tr>
                );
              }) : <DashRow cols={4} text={team.loading ? 'Loading...' : '-'} />}
            </tbody>
          </table>
        </div>
      </div>

      <div className={card}>
        <h3 className="font-bold text-white mb-3">Seedbed managers</h3>
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          {team.data?.seedbeds.map((b) => (
            <label key={b.id} className="flex items-center justify-between gap-2 rounded-lg bg-[#0b1c14] border border-white/10 p-3">
              <span className="font-semibold text-white">Bed {b.bedNumber}</span>
              <select value={active.find((m) => m.name === b.manager)?.id ?? ''} onChange={(e) => assign(b.id, e.target.value)} className={input}>
                <option value="">Not assigned</option>
                {active.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
