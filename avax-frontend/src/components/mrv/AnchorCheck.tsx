'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

/**
 * "Check on Avalanche" for a record (PRD §4.11 verify_onchain_anchor): the
 * server re-derives data → SHA-256 → Merkle proof → root → Fuji transaction
 * and reports each step.
 */
interface Check { anchored: boolean; steps: { step: string; ok: boolean; detail: string }[] }

export default function AnchorCheck({ recordId }: { recordId: string }) {
  const [state, setState] = useState<'idle' | 'checking' | 'done' | 'error'>('idle');
  const [check, setCheck] = useState<Check | null>(null);

  const run = async () => {
    setState('checking');
    try {
      const res = await fetch(`/api/mrv/records/${encodeURIComponent(recordId)}/proof`);
      if (!res.ok) throw new Error();
      setCheck(await res.json());
      setState('done');
    } catch {
      setState('error');
    }
  };

  return (
    <div>
      <button onClick={run} disabled={state === 'checking'}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 999, border: '1px solid #C89B3C', background: 'none', color: '#E4C878', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
        {state === 'checking' && <Loader2 size={13} className="animate-spin" />} Check the proof on Avalanche
      </button>
      {state === 'error' && <p style={{ fontSize: 12.5, color: '#E88C7D', margin: '8px 0 0' }}>Could not run the check. Try again.</p>}
      {check && state === 'done' && (
        <div style={{ marginTop: 10 }}>
          {check.steps.map((s) => (
            <div key={s.step} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '6px 0' }}>
              {s.ok ? <CheckCircle2 size={15} color="#7DC383" style={{ flexShrink: 0, marginTop: 2 }} /> : <XCircle size={15} color="#E88C7D" style={{ flexShrink: 0, marginTop: 2 }} />}
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{s.step}</p>
                <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#9BA396', wordBreak: 'break-all' }}>{s.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
