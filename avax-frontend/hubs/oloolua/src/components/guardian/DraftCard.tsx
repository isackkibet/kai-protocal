'use client';

import { useState } from 'react';
import { AlertTriangle, Check, Loader2, X, FileEdit } from 'lucide-react';
import { ACTIVITY_TYPES, type ActivityType } from '@/lib/guardian/constants';
import { api, formatDate, fmt, type DraftView } from './api';

interface Props {
  draft: DraftView;
  onSaved: (saved: { recordId: string; status: string; version: number; description: string }) => void;
  onCancelled: () => void;
}

/** B5 review step: the exact values are shown before anything is saved. */
export default function DraftCard({ draft, onSaved, onCancelled }: Props) {
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState<'save' | 'cancel' | null>(null);
  const [error, setError] = useState('');
  const f = draft.fields;
  const type = f.type && f.type in ACTIVITY_TYPES ? ACTIVITY_TYPES[f.type as ActivityType].label : null;

  const rows: [string, string | null][] = [
    ['Activity', type],
    ['Quantity', f.quantity !== undefined ? `${fmt(f.quantity)} seedlings` : null],
    ['Location', 'Turako Nursery'],
    ['Date', f.date ? formatDate(f.date) : null],
    ['Species', f.species ?? null],
    [f.type === 'transfer' ? 'From bed' : 'Seedbed', f.seedbed ? `Bed ${f.seedbed}` : null],
    ...(f.type === 'transfer' ? [['To bed', f.toSeedbed ? `Bed ${f.toSeedbed}` : null] as [string, string | null]] : []),
    ...(f.type === 'dispatch' || f.type === 'out_planting' ? [['Destination', f.destination ?? null] as [string, string | null]] : []),
    ...(f.notes ? [['Notes', f.notes] as [string, string | null]] : []),
  ];

  const save = async () => {
    setBusy('save'); setError('');
    const r = await api(`/api/guardian/drafts/${draft.id}/confirm`, { body: { acknowledged: ack } });
    setBusy(null);
    if (r.ok) onSaved(r.data.saved);
    else setError(r.data?.error ?? 'Could not save. Please try again.');
  };
  const cancel = async () => {
    setBusy('cancel'); setError('');
    await api(`/api/guardian/drafts/${draft.id}/cancel`, { body: {} });
    setBusy(null);
    onCancelled();
  };

  const pending = draft.status === 'pending';
  const canSave = pending && (!draft.needsAcknowledgement || ack) && !busy;

  return (
    <div className="mt-2 rounded-xl border border-[#e4c878]/40 bg-[#0b1c14] p-3 sm:p-4 text-xs space-y-3" aria-label="Activity draft">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 font-bold text-[#e4c878]">
          <FileEdit className="w-4 h-4" />
          {draft.correctionOf ? 'Correction draft (new version)' : 'Activity draft'}
        </span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${pending ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-white/5 text-gray-300 border-white/10'}`}>
          {pending ? 'Pending Confirmation' : 'Draft: answer the question to continue'}
        </span>
      </div>

      <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-gray-400">{k}</dt>
            <dd className={v ? 'text-white font-semibold' : 'text-gray-500 italic'}>{v ?? 'not given yet'}</dd>
          </div>
        ))}
        {draft.correctionReason && (
          <div className="contents">
            <dt className="text-gray-400">Reason</dt>
            <dd className="text-white">{draft.correctionReason}</dd>
          </div>
        )}
      </dl>

      {pending && draft.warnings.length > 0 && (
        <div className="rounded-lg border border-amber-700/60 bg-amber-950/40 p-2.5 space-y-1.5">
          {draft.warnings.map((w) => (
            <p key={w} className="flex items-start gap-1.5 text-amber-100"><AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />{w}</p>
          ))}
          <label className="flex items-center gap-2 text-amber-100 font-semibold cursor-pointer pt-1">
            <input type="checkbox" checked={ack || !!f.acknowledged} onChange={(e) => setAck(e.target.checked)} className="accent-[#e4c878]" />
            I have checked these warnings
          </label>
        </div>
      )}

      {error && <p role="alert" className="text-red-300">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {pending && (
          <button
            type="button"
            onClick={save}
            disabled={!canSave}
            className="px-3 py-2 rounded-lg bg-[#e4c878] hover:bg-amber-300 disabled:opacity-40 text-neutral-950 font-bold flex items-center gap-1.5"
          >
            {busy === 'save' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Yes, save it
          </button>
        )}
        <button
          type="button"
          onClick={cancel}
          disabled={!!busy}
          className="px-3 py-2 rounded-lg border border-white/15 hover:bg-white/10 font-semibold flex items-center gap-1.5"
        >
          {busy === 'cancel' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
          Cancel
        </button>
      </div>
      <p className="text-[10px] text-gray-500">Nothing is saved until you confirm. Saving or cancelling does not use a prompt.</p>
    </div>
  );
}
