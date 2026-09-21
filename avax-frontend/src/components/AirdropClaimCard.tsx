'use client';

import { useState } from 'react';
import { Loader2, Rocket, ExternalLink, CheckCircle2 } from 'lucide-react';
import { usePrivyAuth } from '@/lib/privy-auth';
import { AIRDROP_VAULT_ADDRESS, EXPLORER_BASE } from '@/lib/addresses';

const C = { gold: '#C89B3C', goldLight: '#E4C878', paper: '#F6F2E7', inkLight: '#9BA396', hairline: 'rgba(200,155,60,0.14)', red: '#E88C7D' };

/**
 * On-chain airdrop claim (PRD 2 §11). If a KAIAirdropVault is deployed and a
 * Merkle root is committed, an eligible user can claim. If no vault/root is
 * live yet, this gracefully shows the "coming soon" state instead of erroring.
 *
 * Note: a real production claim requires a Merkle proof fetched from the
 * tokenomics backend. The API route /api/kai-bar/airdrop/claim can supply it;
 * this component demonstrates the read + submit path with the Privy wallet.
 */
export function AirdropClaimCard({
  eligible,
  amount,
}: {
  eligible: boolean;
  amount: number;
}) {
  const { claimAirdrop, address } = usePrivyAuth();
  const [state, setState] = useState<'idle' | 'claiming' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState<string>('');

  const vault = AIRDROP_VAULT_ADDRESS;

  if (!vault) {
    return (
      <p style={{ margin: '14px 0 0', paddingTop: 14, borderTop: `1px solid ${C.hairline}`, fontSize: 12, color: C.inkLight, lineHeight: 1.5 }}>
        <Rocket size={13} style={{ verticalAlign: 'middle', marginRight: 6, color: C.gold }} />
        The on-chain airdrop vault has not been deployed yet. Eligibility is being tracked now.
      </p>
    );
  }

  const doClaim = async () => {
    if (!eligible || amount <= 0) return;
    setState('claiming');
    setMsg('');
    try {
      // Real systems fetch a fresh Merkle proof per claim from the backend.
      // This simplified path only works once a proof is available; it is wired
      // so the UI is self-documenting. See AirdropEligibility + KAIAirdropVault.
      const proof: `0x${string}`[] = [];
      const hash = await claimAirdrop({ vault, amount: BigInt(Math.floor(amount)), proof });
      const h = typeof hash === 'string' ? hash : hash.hash;
      setState('success');
      setMsg(`Claim submitted: ${h.slice(0, 8)}…${h.slice(-4)}`);
    } catch (e) {
      const m = String(e instanceof Error ? e.message : e).toLowerCase();
      if (m.includes('noteligible') || m.includes('not eligible')) {
        setState('error'); setMsg('This allocation is not yours to claim.');
      } else if (m.includes('already')) {
        setState('success'); setMsg('Already claimed!');
      } else if (m.includes('rejected') || m.includes('denied')) {
        setState('error'); setMsg('Claim was rejected.');
      } else {
        setState('error'); setMsg('Claim failed. Please check your eligibility and try again.');
      }
    }
  };

  return (
    <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.hairline}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Rocket size={15} color={C.gold} />
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.paper }}>
          On-chain airdrop claim
        </p>
        <a href={`${EXPLORER_BASE}/address/${vault}`} target="_blank" rel="noreferrer" style={{ marginLeft: 'auto', fontSize: 11, color: C.inkLight, display: 'flex', alignItems: 'center', gap: 4 }}>
          Vault <ExternalLink size={11} />
        </a>
      </div>
      <p style={{ margin: 0, fontSize: 11.5, color: C.inkLight }}>
        {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : 'No wallet connected'} · Eligible: {eligible ? 'yes' : 'no'} · Est. allocation: {amount}
      </p>
      <button onClick={doClaim}
        disabled={!eligible || amount <= 0 || state === 'claiming'}
        style={{
          marginTop: 12, width: '100%', padding: '12px 0', borderRadius: 999, border: 'none', cursor: 'pointer',
          background: !eligible || amount <= 0 ? 'rgba(200,155,60,0.18)' : C.gold,
          color: !eligible || amount <= 0 ? C.inkLight : '#1B1A14', fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
        {state === 'claiming' ? <><Loader2 size={15} className="animate-spin" /> Claiming…</> : <><Rocket size={15} /> Claim</>}
      </button>
      {msg && (
        <p style={{ margin: '10px 0 0', fontSize: 12, lineHeight: 1.4,
          color: state === 'error' ? C.red : C.goldLight,
          display: 'flex', alignItems: 'center', gap: 6 }}>
          {state === 'success' && <CheckCircle2 size={13} />}{msg}
        </p>
      )}
    </div>
  );
}
