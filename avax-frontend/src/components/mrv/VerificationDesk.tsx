'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Anchor, CheckCircle2, ClipboardCheck, Loader2, PencilLine, ShieldCheck, Undo2, XCircle } from 'lucide-react';
import { useAccount, useSendTransaction, useSwitchChain } from 'wagmi';
import { usePrivyAuth } from '@/lib/auth/privy-auth';
import { EXPLORER_BASE } from '@/lib/blockchain/addresses';
import EvidencePanel from '@/components/cfa/EvidencePanel';
import type { EvidenceEntity } from '@/lib/nursery/evidence-rules';

/**
 * Verification desk (Kanuvari Tools & Agents PRD §4.9-§4.11, §6.4):
 *   Review  — verifiers/admins take submitted records, look at the data,
 *             versions, integrity and evidence, and decide.
 *   Fix     — a member's records sent back for correction: edit and resubmit
 *             (a new version; the original is kept).
 *   Anchor  — admins/verifiers batch verified records and write the Merkle
 *             root to Avalanche Fuji from their own wallet.
 */

const C = {
  bg: '#0E2418', gold: '#C89B3C', goldLight: '#E4C878', paper: '#F6F2E7', paperDim: '#EFE9D9',
  inkLight: '#9BA396', hairline: 'rgba(200,155,60,0.14)', red: '#E88C7D', green: '#7DC383',
};
const MONO: React.CSSProperties = { fontFamily: 'var(--font-plex-mono), monospace' };
const label: React.CSSProperties = { ...MONO, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: C.goldLight, fontWeight: 600, margin: 0 };
const input: React.CSSProperties = { padding: '8px 2px', border: 'none', borderBottom: `1px solid ${C.hairline}`, background: 'none', color: C.paper, fontSize: 13.5, outline: 'none', fontFamily: 'inherit', width: '100%' };

interface QueueRecord {
  id: string; recordType: string; currentVersion: number; dataHash: string; verificationStatus: string; anchorStatus: string;
  createdAt: string; data: Record<string, unknown> | null; lastReview: { decision: string; reason: string | null; createdAt: string } | null;
}
interface RecordDetail {
  record: { id: string; recordType: string; currentVersion: number; verificationStatus: string; sourceTable: string | null; sourceId: string | null; versions: { version: number; reason: string | null; createdAt: string; data: unknown }[] };
  integrity: { ok: boolean; problems: string[] } | null;
  reviews: { decision: string; reason: string | null; reviewer: string; createdAt: string; recordVersion: number }[];
}
interface Batch { id: string; merkleRoot: string; recordCount: number; status: string; txHash: string | null; createdAt: string; anchoredAt: string | null; calldata: `0x${string}`; chainId: number }

const STATUS_COLOR: Record<string, string> = { SUBMITTED: C.goldLight, UNDER_REVIEW: '#6FA8DC', VERIFIED: C.green, REJECTED: C.red, CORRECTION_REQUIRED: C.red };

function describe(r: { recordType: string; data: Record<string, unknown> | null }) {
  const d = r.data ?? {};
  const species = (d.species as { name?: string } | undefined)?.name ?? 'seedlings';
  if (r.recordType === 'SURVIVAL_CHECK') return `${d.aliveQuantity}/${d.initialQuantity} ${species} alive · ${d.observedOn}`;
  if (r.recordType === 'PLANTING') return `${d.quantity} ${species} planted · ${String(d.plantedAt ?? '').slice(0, 10)}`;
  return r.recordType;
}

function Button({ onClick, children, kind = 'primary', disabled }: { onClick: () => void; children: React.ReactNode; kind?: 'primary' | 'ghost' | 'danger'; disabled?: boolean }) {
  const styles = {
    primary: { background: C.gold, border: 'none', color: '#1B1A14' },
    ghost: { background: 'none', border: `1px solid ${C.gold}`, color: C.goldLight },
    danger: { background: 'none', border: `1px solid ${C.red}`, color: C.red },
  }[kind];
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...styles, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, fontSize: 12.5, fontWeight: 700, cursor: disabled ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: disabled ? 0.6 : 1 }}>
      {children}
    </button>
  );
}

export default function VerificationDesk() {
  const { authenticated, getAccessToken, signInWithGoogle } = usePrivyAuth();
  const [tab, setTab] = useState<'review' | 'fix' | 'anchor'>('review');
  const [queue, setQueue] = useState<{ role: string; canReview: boolean; queue: QueueRecord[]; mine: QueueRecord[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const authed = useCallback(async (): Promise<Record<string, string>> => {
    const t = await getAccessToken().catch(() => null);
    return t ? { Authorization: `Bearer ${t}` } : {};
  }, [getAccessToken]);

  const loadQueue = useCallback(async () => {
    if (!authenticated) return;
    try {
      const res = await fetch('/api/mrv/queue', { headers: await authed() });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? 'Could not load.'); return; }
      setError(null);
      setQueue(d);
    } catch {
      setError('Network error.');
    }
  }, [authenticated, authed]);

  // Fetch-on-mount once signed in.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadQueue(); }, [loadQueue]);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 4000); };

  if (!authenticated) {
    return (
      <div style={{ padding: '20px 0' }}>
        <p style={{ fontSize: 13.5, color: C.paperDim, marginBottom: 12 }}>Sign in with your CFA account to use the verification desk.</p>
        <Button onClick={() => { void signInWithGoogle(); }}>Continue with Google</Button>
      </div>
    );
  }
  if (error) return <p style={{ color: C.red, fontSize: 13 }}>{error} {error.includes('Join') && <Link href="/nursery" style={{ color: C.goldLight }}>Open /nursery</Link>}</p>;
  if (!queue) return <p style={{ color: C.inkLight, fontSize: 13 }}><Loader2 size={14} className="animate-spin" /> Loading…</p>;

  const canAnchor = queue.role === 'admin' || queue.role === 'verifier';
  const tabs: { id: typeof tab; label: string; show: boolean }[] = [
    { id: 'review', label: `Review (${queue.queue.length})`, show: queue.canReview },
    { id: 'fix', label: `Fix my records (${queue.mine.length})`, show: true },
    { id: 'anchor', label: 'Anchor on Avalanche', show: canAnchor },
  ];
  const current = tabs.find((t) => t.id === tab && t.show) ? tab : tabs.find((t) => t.show)!.id;

  return (
    <div>
      <div style={{ display: 'flex', gap: 18, borderBottom: `1px solid ${C.hairline}`, marginBottom: 20, flexWrap: 'wrap' }}>
        {tabs.filter((t) => t.show).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: 'none', border: 'none', padding: '10px 0', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
            color: current === t.id ? C.goldLight : C.inkLight, borderBottom: current === t.id ? `2px solid ${C.gold}` : '2px solid transparent',
          }}>{t.label}</button>
        ))}
      </div>

      {current === 'review' && <ReviewTab records={queue.queue} authed={authed} onDone={(m) => { flash(m); void loadQueue(); }} />}
      {current === 'fix' && <FixTab records={queue.mine} authed={authed} onDone={(m) => { flash(m); void loadQueue(); }} />}
      {current === 'anchor' && <AnchorTab authed={authed} flash={flash} />}
      {!queue.canReview && (
        <p style={{ fontSize: 12, color: C.inkLight, marginTop: 24 }}>Only CFA verifiers and admins review records. An admin can make you a verifier on /nursery.</p>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 96, left: '50%', transform: 'translateX(-50%)', zIndex: 60, padding: '11px 22px', borderRadius: 999, fontSize: 13, fontWeight: 700, maxWidth: 'calc(100vw - 32px)', background: C.bg, border: `1px solid ${C.hairline}`, color: C.goldLight, textAlign: 'center' }}>{toast}</div>
      )}
    </div>
  );
}

// ── Review ───────────────────────────────────────────────────────────────────
function ReviewTab({ records, authed, onDone }: { records: QueueRecord[]; authed: () => Promise<Record<string, string>>; onDone: (m: string) => void }) {
  const [openId, setOpenId] = useState<string | null>(null);
  if (!records.length) return <p style={{ fontSize: 13, color: C.inkLight }}>Nothing is waiting for review. Your own submissions never appear here.</p>;
  return (
    <div>
      {records.map((r) => (
        <div key={r.id} style={{ borderBottom: `1px solid ${C.hairline}`, padding: '12px 0' }}>
          <button onClick={() => setOpenId(openId === r.id ? null : r.id)} style={{ width: '100%', display: 'flex', gap: 10, alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: C.paperDim, textAlign: 'left', fontFamily: 'inherit', padding: 0 }}>
            <ClipboardCheck size={15} color={STATUS_COLOR[r.verificationStatus]} />
            <span style={{ flex: 1, fontSize: 13 }}>{describe(r)}{r.currentVersion > 1 ? ` · v${r.currentVersion}` : ''}</span>
            <span style={{ ...MONO, fontSize: 10, color: STATUS_COLOR[r.verificationStatus] }}>{r.verificationStatus.replace('_', ' ')}</span>
          </button>
          {openId === r.id && <ReviewDetail summary={r} authed={authed} onDone={onDone} />}
        </div>
      ))}
    </div>
  );
}

function ReviewDetail({ summary, authed, onDone }: { summary: QueueRecord; authed: () => Promise<Record<string, string>>; onDone: (m: string) => void }) {
  const [detail, setDetail] = useState<RecordDetail | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetch(`/api/mrv/records/${summary.id}`).then((r) => r.json()).then((d) => { if (live) setDetail(d); }).catch(() => { if (live) setErr('Could not load the record.'); });
    return () => { live = false; };
  }, [summary.id]);

  const decide = async (decision: string) => {
    if ((decision === 'REJECTED' || decision === 'CORRECTION_REQUIRED') && !reason.trim()) { setErr('Write the reason first. The submitter will see it.'); return; }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/mrv/records/${summary.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authed()) },
        body: JSON.stringify({ decision, reason: reason.trim() || null, expectedVersion: summary.currentVersion }),
      });
      const d = await res.json();
      if (!res.ok) { setErr(d.error ?? 'Could not save.'); return; }
      onDone(decision === 'VERIFIED' ? 'Record verified.' : decision === 'UNDER_REVIEW' ? 'Review started.' : 'Decision saved; the submitter will see your reason.');
    } finally {
      setBusy(false);
    }
  };

  if (err && !detail) return <p style={{ color: C.red, fontSize: 12.5 }}>{err}</p>;
  if (!detail) return <p style={{ color: C.inkLight, fontSize: 12.5 }}>Loading…</p>;
  const latest = detail.record.versions[detail.record.versions.length - 1];
  return (
    <div style={{ padding: '12px 0 4px 25px' }}>
      <p style={{ fontSize: 12.5, margin: '0 0 8px', color: detail.integrity?.ok ? C.green : C.red, display: 'flex', gap: 6, alignItems: 'center' }}>
        {detail.integrity?.ok ? <ShieldCheck size={14} /> : <XCircle size={14} />}
        {detail.integrity?.ok ? 'Data matches its fingerprint.' : `Integrity problem: ${detail.integrity?.problems.join('; ')}`}
      </p>
      <p style={{ ...label, margin: '10px 0 6px' }}>Recorded data (version {latest?.version})</p>
      <pre style={{ ...MONO, fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: C.paperDim, margin: 0, maxHeight: 220, overflow: 'auto' }}>{JSON.stringify(latest?.data, null, 2)}</pre>
      {detail.record.versions.length > 1 && (
        <p style={{ fontSize: 12, color: C.inkLight, margin: '8px 0 0' }}>
          Corrected: {detail.record.versions.slice(1).map((v) => `v${v.version} (${v.reason})`).join(', ')}. <Link href={`/verify/${detail.record.id}`} style={{ color: C.goldLight }}>Compare versions</Link>
        </p>
      )}
      {detail.reviews.length > 0 && (
        <>
          <p style={{ ...label, margin: '14px 0 6px' }}>History</p>
          {detail.reviews.map((r, i) => <p key={i} style={{ fontSize: 12, color: C.paperDim, margin: '2px 0' }}>{r.decision.replace('_', ' ')} by {r.reviewer}{r.reason ? ` — ${r.reason}` : ''}</p>)}
        </>
      )}
      <p style={{ ...label, margin: '14px 0 8px' }}>Evidence</p>
      {detail.record.sourceTable && detail.record.sourceId && (
        <EvidencePanel entityType={detail.record.sourceTable as EvidenceEntity} entityId={detail.record.sourceId} canUpload={false} />
      )}

      <p style={{ ...label, margin: '16px 0 6px' }}>Your decision</p>
      <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (required to reject or send back)" rows={2} maxLength={2000} style={{ ...input, resize: 'vertical' }} />
      {err && <p style={{ color: C.red, fontSize: 12, margin: '6px 0 0' }}>{err}</p>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        {summary.verificationStatus === 'SUBMITTED' && <Button kind="ghost" disabled={busy} onClick={() => decide('UNDER_REVIEW')}>Start review</Button>}
        <Button disabled={busy || !detail.integrity?.ok} onClick={() => decide('VERIFIED')}><CheckCircle2 size={14} /> Verify</Button>
        <Button kind="ghost" disabled={busy} onClick={() => decide('CORRECTION_REQUIRED')}><Undo2 size={14} /> Send back</Button>
        <Button kind="danger" disabled={busy} onClick={() => decide('REJECTED')}><XCircle size={14} /> Reject</Button>
      </div>
    </div>
  );
}

// ── Fix my records ───────────────────────────────────────────────────────────
function FixTab({ records, authed, onDone }: { records: QueueRecord[]; authed: () => Promise<Record<string, string>>; onDone: (m: string) => void }) {
  if (!records.length) return <p style={{ fontSize: 13, color: C.inkLight }}>None of your records need a correction.</p>;
  return <div>{records.map((r) => <FixForm key={r.id} record={r} authed={authed} onDone={onDone} />)}</div>;
}

function FixForm({ record, authed, onDone }: { record: QueueRecord; authed: () => Promise<Record<string, string>>; onDone: (m: string) => void }) {
  const d = record.data ?? {};
  const planting = record.recordType === 'PLANTING';
  const [quantity, setQuantity] = useState(String(d.quantity ?? ''));
  const [date, setDate] = useState(String(planting ? d.plantedAt ?? '' : d.observedOn ?? '').slice(0, 10));
  const [alive, setAlive] = useState(String(d.aliveQuantity ?? ''));
  const [dead, setDead] = useState(String(d.deadQuantity ?? ''));
  const [initial, setInitial] = useState(String(d.initialQuantity ?? ''));
  const [note, setNote] = useState(String((planting ? d.activity : d.notes) ?? ''));
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!reason.trim()) { setErr('Say what you corrected.'); return; }
    // The full corrected document: same shape, only the editable fields change.
    const corrected = planting
      ? { ...d, quantity: Number(quantity), plantedAt: new Date(`${date}T00:00:00Z`).toISOString(), activity: note.trim() || null }
      : { ...d, initialQuantity: Number(initial), aliveQuantity: Number(alive), deadQuantity: Number(dead), observedOn: date, notes: note.trim() || null };
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/mrv/records/${record.id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authed()) },
        body: JSON.stringify({ data: corrected, reason: reason.trim() }),
      });
      const out = await res.json();
      if (!res.ok) { setErr(out.error ?? 'Could not save.'); return; }
      onDone('Corrected version saved and resubmitted for verification.');
    } finally {
      setBusy(false);
    }
  };

  const field = (l: string, el: React.ReactNode) => (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 120px' }}>
      <span style={{ ...MONO, fontSize: 9.5, color: C.inkLight, textTransform: 'uppercase' }}>{l}</span>{el}
    </label>
  );
  return (
    <div style={{ borderBottom: `1px solid ${C.hairline}`, padding: '14px 0' }}>
      <p style={{ fontSize: 13.5, fontWeight: 700, margin: 0 }}>{describe(record)}</p>
      <p style={{ fontSize: 12.5, color: C.red, margin: '4px 0 10px' }}>
        {record.verificationStatus === 'REJECTED' ? 'Rejected' : 'Sent back'}{record.lastReview?.reason ? `: ${record.lastReview.reason}` : ''}
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {planting
          ? field('Seedlings planted', <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} style={input} />)
          : <>
              {field('Initial', <input type="number" min={0} value={initial} onChange={(e) => setInitial(e.target.value)} style={input} />)}
              {field('Alive', <input type="number" min={0} value={alive} onChange={(e) => setAlive(e.target.value)} style={input} />)}
              {field('Dead', <input type="number" min={0} value={dead} onChange={(e) => setDead(e.target.value)} style={input} />)}
            </>}
        {field(planting ? 'Planting date' : 'Date of check', <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={input} />)}
      </div>
      <div style={{ marginTop: 10 }}>{field('Notes', <input value={note} onChange={(e) => setNote(e.target.value)} style={input} />)}</div>
      <div style={{ marginTop: 10 }}>{field('What did you correct? (required)', <input value={reason} onChange={(e) => setReason(e.target.value)} style={input} />)}</div>
      {err && <p style={{ color: C.red, fontSize: 12, margin: '6px 0 0' }}>{err}</p>}
      <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button disabled={busy} onClick={submit}><PencilLine size={14} /> Save correction</Button>
        <span style={{ fontSize: 11.5, color: C.inkLight }}>The original stays in the history; this becomes version {record.currentVersion + 1}.</span>
      </div>
    </div>
  );
}

// ── Anchor on Avalanche ──────────────────────────────────────────────────────
function AnchorTab({ authed, flash }: { authed: () => Promise<Record<string, string>>; flash: (m: string) => void }) {
  const { address, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { sendTransactionAsync } = useSendTransaction();
  const [state, setState] = useState<{ verifiedWaiting: number; batches: Batch[] } | null>(null);
  const [step, setStep] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/mrv/anchor');
    setState(await res.json());
  }, []);
  // Fetch-on-mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const post = async (url: string, body: object) => {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(await authed()) }, body: JSON.stringify(body) });
    return { res, data: await res.json().catch(() => ({})) };
  };

  /** Confirm with the server, retrying while the transaction is being mined. */
  const confirm = async (batchId: string, txHash: string) => {
    for (let i = 0; i < 20; i++) {
      setStep(`Waiting for Avalanche to confirm the transaction… (${i + 1})`);
      const { res, data } = await post(`/api/mrv/anchor/${batchId}`, { action: 'confirm', txHash });
      if (res.ok) return true;
      if (res.status !== 202) { setErr(data.error ?? 'Could not confirm.'); return false; }
      await new Promise((r) => setTimeout(r, 3000));
    }
    setErr('Still not confirmed. Press "Confirm again" in a minute.');
    return false;
  };

  const anchor = async (existing?: Batch) => {
    setErr(null);
    if (!isConnected || !address) { setErr('Connect your wallet (MetaMask or Core) first, from the Wallet page.'); return; }
    try {
      let batch = existing;
      if (!batch) {
        setStep('Building the batch…');
        const { res, data } = await post('/api/mrv/anchor', {});
        if (!res.ok) { setErr(data.error ?? 'Could not build the batch.'); setStep(null); return; }
        batch = data.batch as Batch;
      }
      setStep('Switching your wallet to Avalanche Fuji…');
      await switchChainAsync({ chainId: batch.chainId });
      setStep('Approve the transaction in your wallet (0 AVAX + a small gas fee)…');
      // To your own address: the transaction only carries the root in its data.
      const txHash = await sendTransactionAsync({ to: address, value: BigInt(0), data: batch.calldata, chainId: batch.chainId });
      if (await confirm(batch.id, txHash)) flash(`Anchored ${batch.recordCount} record(s) on Avalanche.`);
    } catch (e) {
      setErr(e instanceof Error && /reject|denied/i.test(e.message) ? 'You rejected the transaction. The batch is kept; try again or cancel it.' : 'The wallet step failed. Try again.');
    } finally {
      setStep(null);
      await load();
    }
  };

  const cancel = async (b: Batch) => {
    const { res, data } = await post(`/api/mrv/anchor/${b.id}`, { action: 'cancel' });
    if (!res.ok) setErr(data.error ?? 'Could not cancel.');
    await load();
  };

  if (!state) return <p style={{ color: C.inkLight, fontSize: 13 }}>Loading…</p>;
  const pending = state.batches.find((b) => b.status === 'PENDING');
  return (
    <div>
      <p style={{ fontSize: 13, color: C.paperDim, lineHeight: 1.6, margin: '0 0 14px' }}>
        Verified records are grouped into a batch. One Avalanche Fuji transaction, signed by <strong>your own wallet</strong>, stores the
        batch&apos;s Merkle root. Each record keeps a short proof linking it to that root, so anyone can check it on its /verify page.
      </p>
      {pending ? (
        <div style={{ border: `1px solid ${C.hairline}`, borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700 }}>A batch of {pending.recordCount} record(s) is waiting for its transaction.</p>
          <p style={{ ...MONO, fontSize: 10.5, color: C.inkLight, margin: '6px 0 10px', wordBreak: 'break-all' }}>root {pending.merkleRoot}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button disabled={!!step} onClick={() => anchor(pending)}><Anchor size={14} /> Sign with my wallet</Button>
            <Button kind="danger" disabled={!!step} onClick={() => cancel(pending)}>Cancel batch</Button>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13.5, margin: '0 0 10px' }}><strong>{state.verifiedWaiting}</strong> verified record(s) waiting to be anchored.</p>
          <Button disabled={!!step || state.verifiedWaiting === 0} onClick={() => anchor()}><Anchor size={14} /> Anchor them on Avalanche</Button>
        </div>
      )}
      {step && <p style={{ fontSize: 12.5, color: C.goldLight }}><Loader2 size={13} className="animate-spin" /> {step}</p>}
      {err && <p style={{ fontSize: 12.5, color: C.red }}>{err}</p>}

      <p style={{ ...label, margin: '18px 0 8px' }}>Batches</p>
      {state.batches.length === 0 && <p style={{ fontSize: 12.5, color: C.inkLight }}>No batches yet.</p>}
      {state.batches.map((b) => (
        <div key={b.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.hairline}`, fontSize: 12.5 }}>
          <span style={{ flex: 1 }}>{b.recordCount} record(s) · {new Date(b.createdAt).toLocaleDateString()}</span>
          <span style={{ ...MONO, fontSize: 10, color: b.status === 'ANCHORED' ? C.green : b.status === 'PENDING' ? C.goldLight : C.inkLight }}>{b.status}</span>
          {b.txHash && <a href={`${EXPLORER_BASE}/tx/${b.txHash}`} target="_blank" rel="noreferrer" style={{ color: C.goldLight, fontSize: 11.5 }}>Transaction</a>}
        </div>
      ))}
    </div>
  );
}
