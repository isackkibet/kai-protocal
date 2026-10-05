'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { usePrivyAuth } from '@/lib/auth/privy-auth';

/**
 * Managers' panel at the bottom of a hub landing page: edit About / Mission
 * and add or remove news, activities, photos, videos and podcasts. Shown only
 * to hub managers (Oloolua: CFA admins; SIHU: SIHU editors). Everyone else
 * sees a small "manage this hub" sign-in line.
 */
const KINDS = [
  ['news', 'News'], ['activity', 'Activity'], ['photo', 'Photo'], ['video', 'Video (link)'], ['podcast', 'Podcast (link)'],
] as const;
type Kind = (typeof KINDS)[number][0];

const S = {
  card: { padding: 18, borderRadius: 16, background: '#12301F', border: '1px solid rgba(200,155,60,0.3)', display: 'grid', gap: 14 } as React.CSSProperties,
  label: { display: 'grid', gap: 6, fontSize: 13.5, fontWeight: 600, color: '#C9CFC2' } as React.CSSProperties,
  input: { boxSizing: 'border-box', width: '100%', padding: '11px 12px', borderRadius: 10, border: '1px solid rgba(246,242,231,0.14)', background: '#0E2418', color: '#F6F2E7', fontSize: 15, fontFamily: 'inherit' } as React.CSSProperties,
  btn: { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 18px', borderRadius: 999, border: 'none', background: '#C89B3C', color: '#1B1A14', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', width: 'fit-content' } as React.CSSProperties,
  ghost: { background: 'rgba(246,242,231,0.08)', color: '#F6F2E7' } as React.CSSProperties,
};

export default function HubAdmin({ hub, managers, about, mission, items }: {
  hub: 'oloolua' | 'sihu'; managers: string; about: string; mission: string; items: { id: string; kind: string; title: string }[];
}) {
  const router = useRouter();
  const { authenticated, getAccessToken, signInWithEmail, signInWithGoogle } = usePrivyAuth();
  const [admin, setAdmin] = useState(false);
  const [aboutText, setAbout] = useState(about);
  const [missionText, setMission] = useState(mission);
  const [kind, setKind] = useState<Kind>('news');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [url, setUrl] = useState('');
  const [date, setDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (!authenticated) return;
    let on = true;
    getAccessToken().then((t) => fetch(`/api/hubs/${hub}/manage`, { headers: t ? { Authorization: `Bearer ${t}` } : {} }))
      .then((r) => r.json()).then((d) => { if (on) setAdmin(!!d.admin); }).catch(() => {});
    return () => { on = false; };
  }, [authenticated, getAccessToken, hub]);

  const auth = async (): Promise<Record<string, string>> => { const t = await getAccessToken(); return t ? { Authorization: `Bearer ${t}` } : {}; };
  const done = (text: string, ok = true) => { setMsg({ text, ok }); if (ok) router.refresh(); };

  const saveAbout = async () => {
    setBusy('about'); setMsg(null);
    try {
      const res = await fetch(`/api/hubs/${hub}/profile`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(await auth()) }, body: JSON.stringify({ about: aboutText, mission: missionText }) });
      const d = await res.json().catch(() => ({}));
      done(res.ok ? 'About and mission saved.' : d.error ?? 'Could not save.', res.ok);
    } catch { done('Network problem. Try again.', false); } finally { setBusy(null); }
  };

  const addItem = async () => {
    setBusy('add'); setMsg(null);
    try {
      const form = new FormData();
      form.set('kind', kind); form.set('title', title); form.set('summary', summary); form.set('url', url); form.set('happenedOn', date);
      if (file) form.set('image', file);
      const res = await fetch(`/api/hubs/${hub}/items`, { method: 'POST', headers: await auth(), body: form });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { done(d.error ?? 'Could not add it.', false); return; }
      setTitle(''); setSummary(''); setUrl(''); setDate(''); setFile(null);
      done('Added to the hub.');
    } catch { done('Network problem. Try again.', false); } finally { setBusy(null); }
  };

  const remove = async (id: string) => {
    setBusy(id); setMsg(null);
    try {
      const res = await fetch(`/api/hubs/${hub}/items/${id}`, { method: 'DELETE', headers: await auth() });
      done(res.ok ? 'Removed from the hub.' : 'Could not remove it.', res.ok);
    } catch { done('Network problem. Try again.', false); } finally { setBusy(null); }
  };

  if (!admin) {
    return (
      <p style={{ margin: 0, fontSize: 13.5, color: '#9BA396' }}>
        Do you manage this hub ({managers})?{' '}
        {!authenticated
          ? <>Sign in to add news and photos:{' '}
              <button onClick={() => { void signInWithGoogle(); }} style={{ border: 'none', background: 'none', padding: 0, color: '#E4C878', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5 }}>Google</button>
              {' · '}
              <button onClick={() => { void signInWithEmail(); }} style={{ border: 'none', background: 'none', padding: 0, color: '#E4C878', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5 }}>Email</button></>
          : 'Your account cannot manage it. Ask an admin.'}
      </p>
    );
  }

  return (
    <section id="manage" style={{ display: 'grid', gap: 16 }}>
      <h2 style={{ margin: 0, fontSize: 22 }}>Manage this hub</h2>
      {msg && <p style={{ margin: 0, fontSize: 14, color: msg.ok ? '#7DC383' : '#E88C7D' }}>{msg.text}</p>}

      <div style={S.card}>
        <b>About and mission</b>
        <label style={S.label}>About the organisation<textarea rows={4} style={S.input} value={aboutText} onChange={(e) => setAbout(e.target.value)} /></label>
        <label style={S.label}>Mission<textarea rows={3} style={S.input} value={missionText} onChange={(e) => setMission(e.target.value)} /></label>
        <button style={S.btn} onClick={() => void saveAbout()} disabled={busy === 'about'}>{busy === 'about' ? <Loader2 size={15} className="animate-spin" /> : null} Save</button>
      </div>

      <div style={S.card}>
        <b>Add to the hub</b>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {KINDS.map(([k, l]) => (
            <button key={k} onClick={() => setKind(k)} style={{ ...S.btn, ...(kind === k ? {} : S.ghost), padding: '8px 14px', fontSize: 13.5 }}>{l}</button>
          ))}
        </div>
        <label style={S.label}>Title<input style={S.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={kind === 'photo' ? 'What the photo shows' : 'A short headline'} /></label>
        {kind !== 'photo' && <label style={S.label}>Short text (optional)<textarea rows={3} style={S.input} value={summary} onChange={(e) => setSummary(e.target.value)} /></label>}
        {kind !== 'photo' && <label style={S.label}>{kind === 'video' ? 'Video link (YouTube or other, https://)' : kind === 'podcast' ? 'Podcast link (https://)' : 'Link to read more (optional, https://)'}<input style={S.input} value={url} onChange={(e) => setUrl(e.target.value)} inputMode="url" placeholder="https://" /></label>}
        <label style={S.label}>Date (optional)<input type="date" style={S.input} value={date} onChange={(e) => setDate(e.target.value)} /></label>
        {(kind === 'photo' || kind === 'news' || kind === 'activity') && (
          <label style={S.label}>{kind === 'photo' ? 'Photo (JPEG, PNG or WebP, up to 3 MB)' : 'Picture (optional, up to 3 MB)'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label>
        )}
        <button style={S.btn} onClick={() => void addItem()} disabled={busy === 'add'}>{busy === 'add' ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Add</button>
      </div>

      {items.length > 0 && (
        <div style={S.card}>
          <b>On the hub now</b>
          {items.map((i) => (
            <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14 }}><span style={{ color: '#9BA396' }}>{i.kind}</span> · {i.title}</span>
              <button onClick={() => void remove(i.id)} disabled={busy === i.id} style={{ ...S.btn, ...S.ghost, padding: '6px 12px', fontSize: 13 }}><Trash2 size={13} /> Remove</button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
