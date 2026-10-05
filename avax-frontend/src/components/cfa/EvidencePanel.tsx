'use client';

import { useCallback, useEffect, useState } from 'react';
import { Camera, FileText, Loader2 } from 'lucide-react';
import { usePrivyAuth } from '@/lib/auth/privy-auth';
import { MAX_EVIDENCE_BYTES, type EvidenceEntity } from '@/lib/nursery/evidence-rules';
import { dHash } from '@/lib/workspace/image-hash';

/**
 * Photos and documents attached to a nursery row or conservation record
 * (Kanuvari Tools & Agents PRD §4.8). Anyone sees the list and each file's
 * SHA-256; signed-in CFA members see the photos and can add more.
 */

interface EvidenceItem { id: string; fileName: string; mimeType: string; sizeBytes: number; sha256: string; caption: string | null; createdAt: string; url: string }

const C = { gold: '#C89B3C', goldLight: '#E4C878', paperDim: '#EFE9D9', inkLight: '#9BA396', hairline: 'rgba(200,155,60,0.14)', red: '#E88C7D' };
const MONO: React.CSSProperties = { fontFamily: "'Inter', system-ui, sans-serif" };

/** Phone photos are often 4-8 MB: re-encode big ones as JPEG, max 1600 px. */
async function shrinkIfNeeded(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.size <= 2.5 * 1024 * 1024) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob: Blob = await new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode'))), 'image/jpeg', 0.82));
  return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
}

export default function EvidencePanel({ entityType, entityId, canUpload, quietWhenEmpty }: {
  entityType: EvidenceEntity; entityId: string; canUpload: boolean;
  /** Render nothing when there is no evidence and no upload button (for secondary lists). */
  quietWhenEmpty?: boolean;
}) {
  const { authenticated, getAccessToken } = usePrivyAuth();
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [caption, setCaption] = useState('');
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/cfa/evidence?entityType=${entityType}&entityId=${encodeURIComponent(entityId)}`);
      const d = await res.json();
      setItems(d.evidence ?? []);
    } catch {
      /* offline: keep the old list */
    }
  }, [entityType, entityId]);

  // Fetch-on-mount: the evidence list for this row.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  // Photos need the member's sign-in, so they are fetched with the token and
  // shown from blob: URLs (an <img src> can't send an Authorization header).
  useEffect(() => {
    if (!authenticated) return;
    let cancelled = false;
    const urls: string[] = [];
    (async () => {
      const token = await getAccessToken().catch(() => null);
      if (!token) return;
      const next: Record<string, string> = {};
      for (const e of items.filter((i) => i.mimeType.startsWith('image/'))) {
        const res = await fetch(e.url, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
        if (!res?.ok) continue;
        const u = URL.createObjectURL(await res.blob());
        urls.push(u);
        next[e.id] = u;
      }
      if (!cancelled) setPreviews(next);
    })();
    return () => { cancelled = true; urls.forEach((u) => URL.revokeObjectURL(u)); };
  }, [items, authenticated, getAccessToken]);

  const openFile = async (e: EvidenceItem) => {
    const token = await getAccessToken().catch(() => null);
    const res = await fetch(e.url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) { setMessage({ text: 'Sign in as a CFA member to open files.', error: true }); return; }
    const u = URL.createObjectURL(await res.blob());
    window.open(u, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(u), 60_000);
  };

  const upload = async (picked: File | undefined) => {
    if (!picked) return;
    setBusy(true);
    setMessage(null);
    try {
      const file = await shrinkIfNeeded(picked);
      if (file.size > MAX_EVIDENCE_BYTES) { setMessage({ text: 'The file is larger than 3 MB.', error: true }); return; }
      const form = new FormData();
      form.append('file', file);
      form.append('entityType', entityType);
      form.append('entityId', entityId);
      if (caption.trim()) form.append('caption', caption.trim());
      const hash = await dHash(file);
      if (hash) form.append('dhash', hash);
      const token = await getAccessToken();
      const res = await fetch('/api/cfa/evidence', { method: 'POST', body: form, headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setMessage({ text: d.error ?? 'Upload failed.', error: true }); return; }
      setCaption('');
      setMessage(d.warning
        ? { text: d.warning, error: true }
        : { text: `Saved. Fingerprint ${String(d.evidence?.sha256 ?? '').slice(0, 12)}…` });
      await load();
    } catch {
      setMessage({ text: 'Could not read or send that file.', error: true });
    } finally {
      setBusy(false);
    }
  };

  if (quietWhenEmpty && !canUpload && items.length === 0) return null;
  return (
    <div>
      {items.length === 0 && <p style={{ fontSize: 12, color: C.inkLight, margin: '0 0 8px' }}>No photos or documents yet.</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: items.length ? 10 : 0 }}>
        {items.map((e) => (
          <button key={e.id} onClick={() => openFile(e)} title={`SHA-256 ${e.sha256}`}
            style={{ width: 104, background: 'none', border: `1px solid ${C.hairline}`, borderRadius: 8, padding: 6, cursor: 'pointer', color: C.paperDim, textAlign: 'left', fontFamily: 'inherit' }}>
            {previews[e.id]
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={previews[e.id]} alt={e.caption ?? e.fileName} style={{ width: '100%', height: 70, objectFit: 'cover', borderRadius: 4 }} />
              : <div style={{ height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{e.mimeType === 'application/pdf' ? <FileText size={22} color={C.goldLight} /> : <Camera size={22} color={C.goldLight} />}</div>}
            <p style={{ fontSize: 12.5, margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.caption || e.fileName}</p>
            <p style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 11.5, margin: 0, color: C.inkLight }}>{e.sha256.slice(0, 10)}…</p>
          </button>
        ))}
      </div>

      {canUpload && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption (optional)" maxLength={500}
            style={{ flex: '1 1 160px', padding: '7px 2px', border: 'none', borderBottom: `1px solid ${C.hairline}`, background: 'none', color: C.paperDim, fontSize: 12.5, outline: 'none', fontFamily: 'inherit' }} />
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 999, border: `1px solid ${C.gold}`, color: C.goldLight, fontSize: 12, fontWeight: 700, cursor: busy ? 'wait' : 'pointer' }}>
            {busy ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />} {busy ? 'Uploading…' : 'Add photo / PDF'}
            <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" capture="environment" hidden disabled={busy}
              onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
        </div>
      )}
      {message && <p style={{ fontSize: 11.5, margin: '6px 0 0', color: message.error ? C.red : C.goldLight }}>{message.text}</p>}
    </div>
  );
}
