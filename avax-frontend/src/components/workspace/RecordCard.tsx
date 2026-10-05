'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, CloudOff, Loader2, Paperclip, Pencil, X } from 'lucide-react';
import { isNurseryPlan, type NurseryPlan } from '@/lib/nursery/agent-logic';

/**
 * "New conservation record" card for the workspace (Guardian Setup & AI
 * Architecture §2.4: Understand → Validate → Preview → Confirm → Save →
 * Audit). The AI's draft can be corrected inline (quantity, dates, species,
 * notes) before saving; the /api/cfa route re-validates everything. After
 * saving it shows the record's id. Offline, the confirmed record is queued
 * and sent when the signal returns.
 */
export interface SavedResult { entityType: string | null; entityId: string | null; label: string }

interface Props {
  plan: NurseryPlan;
  project: string | null;
  species: { id: string; commonName: string; scientificName: string }[];
  attachmentNames: string[];
  authHeader: () => Promise<Record<string, string>>;
  onSaved: (r: SavedResult) => Promise<void> | void;
  onQueued: () => void;
  onDone: () => void;
}

const C = { gold: '#C89B3C', goldLight: '#E4C878', paper: '#F6F2E7', paperDim: '#EFE9D9', inkLight: '#9BA396', hairline: 'rgba(200,155,60,0.18)', red: '#E88C7D', green: '#7DC383', bg: '#0E2418' };
const input: React.CSSProperties = { padding: '5px 2px', border: 'none', borderBottom: `1px solid ${C.hairline}`, background: 'none', color: C.paper, fontSize: 13.5, outline: 'none', fontFamily: 'inherit', width: '100%' };

const FIELD_LABEL: Record<string, string> = {
  quantity: 'Quantity', quantityAffected: 'Seedlings', dateReceived: 'Date received', plantingDate: 'Planting date', lossDate: 'Date lost',
  activityDate: 'Date', observationDate: 'Date of check', transferDate: 'Date', aliveQuantity: 'Alive', deadQuantity: 'Dead', initialQuantity: 'Initial',
  notes: 'Notes', description: 'Notes', source: 'Source', destination: 'Destination', reason: 'Reason', activityType: 'Activity',
};
const EDITABLE = new Set(Object.keys(FIELD_LABEL));
const TITLE: Record<string, string> = {
  '/api/cfa/inventory': 'Seedlings received', '/api/cfa/planting': 'Seedling planting', '/api/cfa/loss': 'Seedlings lost',
  '/api/cfa/transfer': 'Seedling transfer', '/api/cfa/activities': 'Nursery work', '/api/cfa/survival': 'Survival check',
};

/** The id of what the route created, from its response (batch, activity, observation, record). */
function savedIdentity(endpoint: string, d: Record<string, { id?: string } | undefined>): SavedResult {
  const map: [string, string, string][] = [
    ['batch', 'seedling_inventory', 'NR'], ['activity', 'nursery_activities', 'NA'], ['observation', 'survival_observations', 'SC'],
    ['location', 'nursery_locations', 'NL'], ['species', 'species', 'SP'], ['member', 'members', 'MB'],
  ];
  for (const [k, entityType, prefix] of map) {
    const id = d[k]?.id;
    if (id) return { entityType, entityId: id, label: `${prefix}-${id.replace(/-/g, '').slice(0, 6).toUpperCase()}` };
  }
  return { entityType: null, entityId: null, label: endpoint.startsWith('/api/mrv') ? 'decision saved' : 'saved' };
}

export default function RecordCard({ plan, project, species, attachmentNames, authHeader, onSaved, onQueued, onDone }: Props) {
  const [body, setBody] = useState<Record<string, unknown>>(() => ({ ...plan.body }));
  const [editing, setEditing] = useState(false);
  const [state, setState] = useState<'review' | 'saving' | 'saved' | 'queued' | 'cancelled' | 'error'>('review');
  const [msg, setMsg] = useState('');
  const [mrv, setMrv] = useState<string | null>(null);
  if (!isNurseryPlan(plan)) return null;

  const fields = Object.entries(body).filter(([k, v]) => EDITABLE.has(k) && (typeof v === 'string' || typeof v === 'number' || v === null));
  const changed = JSON.stringify(body) !== JSON.stringify(plan.body);
  const speciesName = typeof body.speciesId === 'string' ? species.find((s) => s.id === body.speciesId)?.commonName : null;

  const confirm = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const { enqueue } = await import('@/lib/workspace/storage');
      enqueue({ method: plan.method, endpoint: plan.endpoint, body, summary: plan.summary });
      setState('queued');
      onQueued();
      onDone();
      return;
    }
    setState('saving');
    try {
      const res = await fetch(plan.endpoint, { method: plan.method, headers: { 'Content-Type': 'application/json', ...(await authHeader()) }, body: JSON.stringify(body) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setState('error'); setMsg(d.error ?? `Could not save (error ${res.status}).`); return; }
      const saved = savedIdentity(plan.endpoint, d);
      if (d.mrvRecord?.id) setMrv(d.mrvRecord.id);
      setState('saved');
      setMsg(`Saved as conservation record ${saved.label}.${d.pointsEarned ? ` +${d.pointsEarned} points.` : ''}`);
      await onSaved(saved);
      onDone();
    } catch {
      setState('error');
      setMsg('Network problem. Nothing was saved; try again.');
    }
  };

  const done = state === 'saved' || state === 'queued' || state === 'cancelled';
  return (
    <div style={{ border: `1px solid ${state === 'error' ? C.red : done ? C.hairline : C.gold}`, borderRadius: 14, padding: 14, background: 'rgba(200,155,60,0.05)', marginTop: 8 }}>
      <p style={{ margin: 0, fontSize: 12.5, letterSpacing: 1.3, fontWeight: 700, color: C.goldLight }}>
        {plan.endpoint.startsWith('/api/mrv') ? 'VERIFICATION DECISION' : plan.endpoint.startsWith('/api/cfa/members') || plan.endpoint.startsWith('/api/cfa/profile') ? 'CFA CHANGE' : 'NEW CONSERVATION RECORD'}
      </p>
      <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 14px', margin: '10px 0 0', fontSize: 13.5 }}>
        {project && <><dt style={{ color: C.inkLight }}>Project</dt><dd style={{ margin: 0 }}>{project}</dd></>}
        {TITLE[plan.endpoint] && <><dt style={{ color: C.inkLight }}>Activity</dt><dd style={{ margin: 0 }}>{TITLE[plan.endpoint]}</dd></>}
        {typeof body.speciesId === 'string' && (
          <>
            <dt style={{ color: C.inkLight }}>Species</dt>
            <dd style={{ margin: 0 }}>
              {editing && species.length ? (
                <select aria-label="Species" value={String(body.speciesId)} onChange={(e) => setBody({ ...body, speciesId: e.target.value })} style={{ ...input, cursor: 'pointer' }}>
                  {species.map((s) => <option key={s.id} value={s.id} style={{ background: C.bg }}>{s.commonName} ({s.scientificName})</option>)}
                </select>
              ) : speciesName ?? 'as in the summary'}
            </dd>
          </>
        )}
        {fields.map(([k, v]) => (
          <div key={k} style={{ display: 'contents' }}>
            <dt style={{ color: C.inkLight }}>{FIELD_LABEL[k]}</dt>
            <dd style={{ margin: 0 }}>
              {editing && k !== 'reason' && k !== 'activityType' ? (
                <input aria-label={FIELD_LABEL[k]} value={v == null ? '' : String(v)} style={input}
                  type={/Date$/.test(k) ? 'date' : /quantity|Quantity/.test(k) ? 'number' : 'text'}
                  onChange={(e) => setBody({ ...body, [k]: /quantity|Quantity/.test(k) ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value || null })} />
              ) : v == null || v === '' ? <span style={{ color: C.inkLight }}>—</span> : String(v)}
            </dd>
          </div>
        ))}
        <dt style={{ color: C.inkLight }}>Evidence</dt>
        <dd style={{ margin: 0 }}>{attachmentNames.length ? attachmentNames.join(', ') : <span style={{ color: C.inkLight }}>None attached</span>}</dd>
      </dl>
      <p style={{ fontSize: 12.5, color: C.paperDim, margin: '10px 0 0', lineHeight: 1.5 }}>{plan.summary}{changed ? ' (edited by you)' : ''}</p>
      {plan.assumptions.length > 0 && (
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 12, color: C.inkLight }}>{plan.assumptions.map((a) => <li key={a}>{a}</li>)}</ul>
      )}

      {!done && state !== 'saving' && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <button onClick={() => { setState('cancelled'); onDone(); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 999, border: `1px solid ${C.hairline}`, background: 'none', color: C.paperDim, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', minHeight: 40 }}>
            <X size={14} /> Cancel
          </button>
          <button onClick={() => setEditing((e) => !e)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 999, border: `1px solid ${C.gold}`, background: 'none', color: C.goldLight, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', minHeight: 40 }}>
            <Pencil size={14} /> {editing ? 'Done editing' : 'Edit'}
          </button>
          <button onClick={confirm} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 999, border: 'none', background: C.gold, color: '#1B1A14', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', minHeight: 40 }}>
            <Check size={14} /> Confirm &amp; Save
          </button>
        </div>
      )}
      {state === 'saving' && <p style={{ fontSize: 12.5, color: C.goldLight, margin: '10px 0 0' }}><Loader2 size={13} className="animate-spin" /> Saving…</p>}
      {state === 'queued' && <p style={{ fontSize: 12.5, color: C.goldLight, margin: '10px 0 0', display: 'flex', gap: 6 }}><CloudOff size={14} /> No signal: saved on this phone and will be sent when you are back online.</p>}
      {state === 'cancelled' && <p style={{ fontSize: 12.5, color: C.inkLight, margin: '10px 0 0' }}>Cancelled. Nothing was saved.</p>}
      {(state === 'saved' || state === 'error') && (
        <p style={{ fontSize: 12.5, margin: '10px 0 0', color: state === 'saved' ? C.green : C.red }}>
          {msg}
          {state === 'saved' && attachmentNames.length > 0 && <> <Paperclip size={12} /> Photos attached as evidence.</>}
          {mrv && <> <Link href={`/verify/${mrv}`} style={{ color: C.goldLight }}>See its proof page</Link>.</>}
        </p>
      )}
    </div>
  );
}
