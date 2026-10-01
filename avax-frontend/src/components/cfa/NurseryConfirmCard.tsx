'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Loader2, Sprout, X } from 'lucide-react';
import { usePrivyAuth } from '@/lib/auth/privy-auth';
import { authHeader } from '@/lib/ai/client';
import { isNurseryPlan, type NurseryPlan } from '@/lib/nursery/agent-logic';

/**
 * "Confirm and save" card for a nursery draft the KAI agent prepared
 * (lib/ai/nursery-agent.ts). Nothing is saved until the user presses
 * Confirm; then THIS browser sends the draft, with the user's own sign-in,
 * to the /api/cfa/* route, which re-checks membership and validates it.
 */
export default function NurseryConfirmCard({ plan }: { plan: NurseryPlan }) {
  const { getAccessToken } = usePrivyAuth();
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'cancelled' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // Defence in depth: only the known nursery endpoints, never a URL from text.
  if (!isNurseryPlan(plan)) return null;

  const confirm = async () => {
    setState('saving');
    try {
      const res = await fetch(plan.endpoint, {
        method: plan.method,
        headers: { 'Content-Type': 'application/json', ...(await authHeader(getAccessToken)) },
        body: JSON.stringify(plan.body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; pointsEarned?: number };
      if (!res.ok) {
        setState('error');
        setMessage(data.error ?? `Could not save (error ${res.status}).`);
        return;
      }
      setState('saved');
      setMessage(data.pointsEarned ? `Saved. +${data.pointsEarned} Kai Bar points.` : 'Saved.');
    } catch {
      setState('error');
      setMessage('Network problem. Nothing was saved; please try again.');
    }
  };

  const border = state === 'saved' ? 'rgba(34,197,94,0.5)' : state === 'error' ? 'rgba(248,113,113,0.5)' : 'rgba(16,185,129,0.3)';
  return (
    <div style={{ marginTop: 8, padding: 12, borderRadius: 14, border: `1px solid ${border}`, background: 'rgba(16,185,129,0.06)', fontSize: 13, color: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, marginBottom: 6 }}>
        <Sprout size={15} color="#34d399" /> {plan.endpoint.startsWith('/api/mrv') ? 'Verification decision' : 'Nursery record'} — not saved yet
      </div>
      <div style={{ lineHeight: 1.5 }}>{plan.summary}</div>
      {plan.assumptions.length > 0 && (
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
          {plan.assumptions.map((a) => <li key={a}>{a}</li>)}
        </ul>
      )}

      {state === 'idle' || state === 'saving' ? (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button
            onClick={confirm}
            disabled={state === 'saving'}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, border: 'none', background: '#10b981', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
          >
            {state === 'saving' ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Confirm and save
          </button>
          <button
            onClick={() => setState('cancelled')}
            disabled={state === 'saving'}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer' }}
          >
            <X size={14} /> Cancel
          </button>
        </div>
      ) : (
        <div style={{ marginTop: 8, color: state === 'saved' ? '#4ade80' : state === 'error' ? '#f87171' : 'rgba(255,255,255,0.6)' }}>
          {state === 'cancelled' ? 'Cancelled. Nothing was saved.' : message}
          {state === 'saved' && <> See it on <Link href="/nursery" style={{ color: '#34d399' }}>/nursery</Link>.</>}
        </div>
      )}
    </div>
  );
}
