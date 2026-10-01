'use client';

import { useCallback, useEffect, useState } from 'react';
import { BadgeCheck, CheckCircle2, Loader2, PenLine, XCircle } from 'lucide-react';
import { useAccount, useSignTypedData, useSwitchChain } from 'wagmi';
import { usePrivyAuth } from '@/lib/auth/privy-auth';

/**
 * Verifiable credentials for one record (Ecosystem PRD v1.1 §4.17):
 * anyone can check them; a CFA admin/verifier can issue one by signing
 * (EIP-712) in their own wallet; an admin can revoke. The server re-checks
 * every signature and never holds a key.
 */
interface Cred { id: string; status: string; issuedAt: string; signer: string; w3c: { issuer: string; type: string[] } }
interface Check { valid: boolean; steps: { step: string; ok: boolean; detail: string }[] }

const C = { gold: '#C89B3C', goldLight: '#E4C878', paperDim: '#EFE9D9', inkLight: '#9BA396', hairline: 'rgba(200,155,60,0.14)', red: '#E88C7D', green: '#7DC383' };
const btn = (primary: boolean): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 999, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  ...(primary ? { background: C.gold, border: 'none', color: '#1B1A14' } : { background: 'none', border: `1px solid ${C.gold}`, color: C.goldLight }),
});

export default function CredentialsPanel({ recordId, verified }: { recordId: string; verified: boolean }) {
  const { authenticated, getAccessToken } = usePrivyAuth();
  const { address, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { signTypedDataAsync } = useSignTypedData();
  const [creds, setCreds] = useState<Cred[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [checks, setChecks] = useState<Record<string, Check>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const auth = useCallback(async (): Promise<Record<string, string>> => {
    const t = await getAccessToken().catch(() => null);
    return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  }, [getAccessToken]);

  const load = useCallback(async () => {
    const d = await fetch(`/api/identity/credentials?recordId=${encodeURIComponent(recordId)}`).then((r) => r.json()).catch(() => ({}));
    setCreds(d.credentials ?? []);
  }, [recordId]);

  // Fetch-on-mount: the record's credentials, and the viewer's CFA role.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!authenticated) return;
    let live = true;
    (async () => {
      const d = await fetch('/api/cfa/join', { headers: await auth() }).then((r) => r.json()).catch(() => ({}));
      if (live) setRole(d.member?.status === 'active' ? d.member.role : null);
    })();
    return () => { live = false; };
  }, [authenticated, auth]);

  const check = async (id: string) => {
    setBusy(id);
    const d = await fetch(`/api/identity/credentials/${id}/verify`).then((r) => r.json()).catch(() => null);
    if (d?.steps) setChecks((c) => ({ ...c, [id]: d }));
    setBusy(null);
  };

  const issue = async () => {
    setMsg(null);
    if (!isConnected || !address) { setMsg({ text: 'Connect your wallet first (Wallet page). It signs the credential.', error: true }); return; }
    setBusy('issue');
    try {
      const prep = await fetch('/api/identity/credentials/prepare', { method: 'POST', headers: await auth(), body: JSON.stringify({ recordId }) });
      const p = await prep.json();
      if (!prep.ok) { setMsg({ text: p.error ?? 'Could not prepare.', error: true }); return; }
      await switchChainAsync({ chainId: 43113 });
      const signature = await signTypedDataAsync({ ...p.typedData, account: address });
      const res = await fetch('/api/identity/credentials', {
        method: 'POST', headers: await auth(),
        body: JSON.stringify({ recordId, issuedAt: p.typedData.message.issuedAt, signer: address, signature }),
      });
      const d = await res.json();
      if (!res.ok) { setMsg({ text: d.error ?? 'Could not issue.', error: true }); return; }
      setMsg({ text: 'Credential issued and signed by your wallet.' });
      await load();
    } catch (e) {
      setMsg({ text: e instanceof Error && /reject|denied/i.test(e.message) ? 'You rejected the signature.' : 'Signing failed. Try again.', error: true });
    } finally {
      setBusy(null);
    }
  };

  const revoke = async (id: string) => {
    const reason = (document.getElementById(`revoke-${id}`) as HTMLInputElement | null)?.value?.trim() ?? '';
    if (!reason) { setMsg({ text: 'Write why you are revoking it.', error: true }); return; }
    setBusy(id);
    const res = await fetch(`/api/identity/credentials/${id}/revoke`, { method: 'POST', headers: await auth(), body: JSON.stringify({ reason }) });
    const d = await res.json().catch(() => ({}));
    setMsg(res.ok ? { text: 'Credential revoked.' } : { text: d.error ?? 'Could not revoke.', error: true });
    setBusy(null);
    await load();
  };

  const canIssue = verified && (role === 'admin' || role === 'verifier') && !creds.some((c) => c.status === 'active');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {creds.length === 0 && <p style={{ fontSize: 13, color: C.inkLight, margin: 0 }}>No credential has been issued for this record.</p>}
      {creds.map((c) => (
        <div key={c.id} style={{ border: `1px solid ${C.hairline}`, borderRadius: 12, padding: 12 }}>
          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, display: 'flex', gap: 6, alignItems: 'center', color: c.status === 'active' ? C.paperDim : C.inkLight }}>
            <BadgeCheck size={15} color={c.status === 'active' ? C.green : C.inkLight} /> {c.w3c.type[1] ?? 'Credential'} · {c.status}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 11.5, color: C.inkLight, wordBreak: 'break-all' }}>
            Issuer {c.w3c.issuer} · signed by {c.signer} · {new Date(c.issuedAt).toLocaleDateString()}
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={() => check(c.id)} disabled={busy === c.id} style={btn(false)}>{busy === c.id ? <Loader2 size={13} className="animate-spin" /> : null} Check this credential</button>
            {role === 'admin' && c.status === 'active' && (
              <>
                <input id={`revoke-${c.id}`} placeholder="Reason to revoke" style={{ flex: '1 1 140px', padding: '6px 2px', border: 'none', borderBottom: `1px solid ${C.hairline}`, background: 'none', color: C.paperDim, fontSize: 12, outline: 'none' }} />
                <button onClick={() => revoke(c.id)} style={{ ...btn(false), borderColor: C.red, color: C.red }}>Revoke</button>
              </>
            )}
          </div>
          {checks[c.id] && (
            <div style={{ marginTop: 8 }}>
              <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: checks[c.id].valid ? C.green : C.red }}>{checks[c.id].valid ? 'Valid' : 'Not valid'}</p>
              {checks[c.id].steps.map((s) => (
                <p key={s.step} style={{ margin: '3px 0 0', fontSize: 11.5, color: C.inkLight, display: 'flex', gap: 6 }}>
                  {s.ok ? <CheckCircle2 size={13} color={C.green} /> : <XCircle size={13} color={C.red} />} <span><strong style={{ color: C.paperDim }}>{s.step}</strong> — {s.detail}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      ))}
      {canIssue && (
        <div>
          <button onClick={issue} disabled={busy === 'issue'} style={btn(true)}>
            {busy === 'issue' ? <Loader2 size={13} className="animate-spin" /> : <PenLine size={13} />} Issue credential (sign with my wallet)
          </button>
          <p style={{ fontSize: 11.5, color: C.inkLight, margin: '6px 0 0' }}>Your wallet signs a statement that this record was verified. No funds move and no gas is paid.</p>
        </div>
      )}
      {msg && <p style={{ fontSize: 12.5, margin: 0, color: msg.error ? C.red : C.green }}>{msg.text}</p>}
    </div>
  );
}
