'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Frame, ImageIcon, Loader2, Plus, ShieldCheck, X } from 'lucide-react';
import { usePrivyAuth } from '@/lib/auth/privy-auth';

/**
 * /murals — conservation murals and portraits. Each one is linked to
 * verified conservation records of a CFA; its page shows that provenance.
 * CFA admins also see "Add a mural" (choose verified records, upload the
 * picture) and the enquiries people sent.
 */

const C = {
  bg: '#0E2418', band: '#12301F', card: '#15352A', cardHi: '#1B4032', line: 'rgba(246,242,231,0.08)',
  paper: '#F6F2E7', dim: '#C9CFC2', ink: '#9BA396', gold: '#C89B3C', goldLight: '#E4C878', green: '#7DC383', red: '#E88C7D',
};

interface MuralCard { slug: string; title: string; artist: string; priceKes: number; status: string; sizeLabel: string | null; hasImage: boolean; recordCount: number }
interface RecordOption { id: string; recordType: string; description: string; anchorStatus: string; createdAt: string }
interface Enquiry { id: string; name: string; phone: string | null; email: string | null; message: string | null; createdAt: string; mural: { slug: string; title: string } }
interface Manage { admin: boolean; murals?: MuralCard[]; records?: RecordOption[]; enquiries?: Enquiry[] }

const STATUS_WORDS: Record<string, string> = { available: 'Available', reserved: 'Reserved', sold: 'Sold', draft: 'Draft (hidden)' };
const kes = (n: number) => `KES ${n.toLocaleString()}`;

export default function MuralsPage() {
  const router = useRouter();
  const { authenticated, getAccessToken, signInWithGoogle, signInWithEmail, email, logout } = usePrivyAuth();
  const [murals, setMurals] = useState<MuralCard[] | null>(null);
  const [manage, setManage] = useState<Manage>({ admin: false });
  const [checked, setChecked] = useState(false);
  const [adding, setAdding] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let on = true;
    fetch('/api/murals').then((r) => r.json()).then((d) => { if (on) setMurals(d?.murals ?? []); }).catch(() => on && setMurals([]));
    return () => { on = false; };
  }, [reload]);

  useEffect(() => {
    if (!authenticated) return;
    let on = true;
    getAccessToken().then((token) => fetch('/api/murals/manage', { headers: token ? { Authorization: `Bearer ${token}` } : {} }))
      .then((r) => r.json()).then((d: Manage) => { if (on) { setManage(d); setChecked(true); } }).catch(() => { if (on) setChecked(true); });
    return () => { on = false; };
  }, [authenticated, getAccessToken, reload]);

  const shown = manage.admin ? manage.murals ?? [] : murals ?? [];

  return (
    <main className="mu">
      <header className="mu-top">
        <div className="mu-wrap mu-top-inner">
          <Link href="/" className="mu-back" aria-label="Back to home"><ArrowLeft size={18} /></Link>
          <div>
            <h1 className="mu-title">Murals</h1>
            <p className="mu-sub">Art with a verified conservation story</p>
          </div>
          {manage.admin && !adding && <button className="mu-btn mu-btn--small" onClick={() => setAdding(true)}><Plus size={15} /> Add a mural</button>}
        </div>
      </header>

      <div className="mu-wrap mu-body">
        <p className="mu-lead">
          Every mural and portrait is linked to real conservation work: the CFA, the nursery group, who planted the trees and when.
          Each record was checked by a CFA verifier and its fingerprint is timestamped on Avalanche, so the story behind the art can be proven.
        </p>

        {/* CFA admins add murals; tell everyone else how to get there. */}
        {!authenticated ? (
          <div className="mu-signin">
            <div><b>Are you a CFA admin?</b><small>Sign in to add a mural and see who wants to buy.</small></div>
            <div className="mu-signin-btns">
              <button className="mu-btn mu-btn--small" onClick={() => { void signInWithGoogle(); }}>Sign in with Google</button>
              <button className="mu-btn mu-btn--small mu-btn--ghost" onClick={() => { void signInWithEmail(); }}>Sign in with email</button>
            </div>
          </div>
        ) : checked && !manage.admin ? (
          <div className="mu-signin">
            <div>
              <b>Signed in as {email ?? 'this account'}</b>
              <small>This account is not a CFA admin, so it cannot add murals. Sign out, then sign in with an admin account.</small>
            </div>
            <button className="mu-btn mu-btn--small" onClick={() => { void logout(); }}>Sign out</button>
          </div>
        ) : manage.admin && !adding ? (
          <div className="mu-signin">
            <div><b>You are a CFA admin{email ? ` (${email})` : ''}.</b><small>Add a mural and link it to your verified records.</small></div>
            <div className="mu-signin-btns">
              <button className="mu-btn mu-btn--small" onClick={() => setAdding(true)}><Plus size={15} /> Add a mural</button>
              <button className="mu-btn mu-btn--small mu-btn--ghost" onClick={() => { void logout(); }}>Sign out</button>
            </div>
          </div>
        ) : null}

        {adding && manage.admin && (
          <AddMural records={manage.records ?? []} getAccessToken={getAccessToken}
            onDone={(slug) => { setAdding(false); setReload((x) => x + 1); if (slug) router.push(`/murals/${slug}`); }} />
        )}

        {murals === null && !manage.admin ? (
          <p className="mu-empty"><Loader2 size={16} className="mu-spin" /> Loading…</p>
        ) : shown.length === 0 ? (
          <div className="mu-empty">
            <Frame size={20} />
            <p>No murals yet. {manage.admin ? 'Add the first one, linked to your verified records.' : 'The first conservation murals are coming soon.'}</p>
          </div>
        ) : (
          <div className="mu-grid">
            {shown.map((m) => (
              <Link key={m.slug} href={`/murals/${m.slug}`} className="mu-card" prefetch={false}>
                <span className="mu-pic">
                  {m.hasImage && m.status !== 'draft' ? <img src={`/api/murals/${m.slug}/image`} alt={m.title} loading="lazy" /> : <ImageIcon size={30} />}
                  <em className={`mu-status mu-status--${m.status}`}>{STATUS_WORDS[m.status] ?? m.status}</em>
                </span>
                <span className="mu-card-body">
                  <b>{m.title}</b>
                  <small>by {m.artist}{m.sizeLabel ? ` · ${m.sizeLabel}` : ''}</small>
                  <span className="mu-card-foot">
                    <strong>{kes(m.priceKes)}</strong>
                    <span><ShieldCheck size={13} /> {m.recordCount} verified record{m.recordCount === 1 ? '' : 's'}</span>
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}

        {manage.admin && (manage.enquiries?.length ?? 0) > 0 && (
          <section>
            <h2 className="mu-h2">Enquiries</h2>
            <ul className="mu-enq">
              {manage.enquiries!.map((e) => (
                <li key={e.id}>
                  <b>{e.name}</b> about <Link href={`/murals/${e.mural.slug}`}>{e.mural.title}</Link>
                  <small>{new Date(e.createdAt).toLocaleString()} · {[e.phone, e.email].filter(Boolean).join(' · ')}</small>
                  {e.message && <p>{e.message}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <style>{CSS}</style>
    </main>
  );
}

function AddMural({ records, getAccessToken, onDone }: { records: RecordOption[]; getAccessToken: () => Promise<string | null>; onDone: (slug?: string) => void }) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [price, setPrice] = useState('15000');
  const [size, setSize] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('available');
  const [picked, setPicked] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const save = async () => {
    setError(null);
    if (picked.length === 0) { setError('Choose at least one verified record. That is the mural’s story.'); return; }
    setBusy(true);
    try {
      const form = new FormData();
      form.set('title', title); form.set('artist', artist); form.set('priceKes', price); form.set('sizeLabel', size);
      form.set('description', description); form.set('status', status); form.set('recordIds', picked.join(','));
      if (file) form.set('image', file);
      const token = await getAccessToken();
      const res = await fetch('/api/murals', { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setError(d.error ?? `Could not save (error ${res.status}).`); return; }
      onDone(d.mural?.slug);
    } catch {
      setError('Network problem. Nothing was saved; try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mu-add">
      <div className="mu-add-head">
        <h2 className="mu-h2" style={{ margin: 0 }}>Add a mural</h2>
        <button className="mu-x" onClick={() => onDone()} aria-label="Close"><X size={16} /></button>
      </div>
      <div className="mu-fields">
        <label><span>Title</span><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Guardians of Oloolua" /></label>
        <label><span>Artist</span><input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Who painted it" /></label>
        <label><span>Price (KES)</span><input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))} /></label>
        <label><span>Size (optional)</span><input value={size} onChange={(e) => setSize(e.target.value)} placeholder="e.g. 120 × 80 cm" /></label>
        <label className="mu-wide"><span>About the mural (optional)</span><textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What it shows and why" /></label>
        <label><span>Picture (JPEG, PNG or WebP, up to 3 MB)</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label>
        <label><span>Show it as</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="available">Available</option><option value="reserved">Reserved</option><option value="sold">Sold</option><option value="draft">Draft (hidden)</option>
          </select>
        </label>
      </div>

      <p className="mu-label">Its conservation story: choose verified records</p>
      {records.length === 0 ? (
        <p className="mu-empty" style={{ margin: 0 }}>There are no verified records yet. Records appear here after a CFA verifier approves them on the Verifier desk.</p>
      ) : (
        <div className="mu-recs">
          {records.map((r) => (
            <button key={r.id} type="button" className={picked.includes(r.id) ? 'mu-rec on' : 'mu-rec'} onClick={() => toggle(r.id)} aria-pressed={picked.includes(r.id)}>
              <span className="mu-check">{picked.includes(r.id) && <Check size={13} />}</span>
              <span><b>{r.description}</b><small>Recorded {new Date(r.createdAt).toLocaleDateString()} · {r.anchorStatus === 'ANCHORED' ? 'On Avalanche' : 'Waiting for Avalanche timestamp'}</small></span>
            </button>
          ))}
        </div>
      )}

      {error && <p className="mu-err">{error}</p>}
      <button className="mu-btn" onClick={() => void save()} disabled={busy}>{busy ? <><Loader2 size={15} className="mu-spin" /> Saving…</> : <>Save mural <ArrowRight size={15} /></>}</button>
    </section>
  );
}

const CSS = `
  .mu { min-height: 100dvh; background: ${C.bg}; color: ${C.paper}; font-family: 'Inter', system-ui, sans-serif; padding-bottom: 110px; }
  .mu-wrap { width: min(1080px, calc(100% - 32px)); margin: 0 auto; }
  .mu-top { position: sticky; top: 0; z-index: 30; background: ${C.band}; border-bottom: 1px solid ${C.line}; }
  .mu-top-inner { display: flex; align-items: center; gap: 12px; padding: 12px 0; }
  .mu-top-inner > div { flex: 1; min-width: 0; }
  .mu-back, .mu-x { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; border: none; color: ${C.paper}; background: rgba(246,242,231,0.06); flex-shrink: 0; cursor: pointer; }
  .mu-title { margin: 0; font-size: 18px; font-weight: 700; }
  .mu-sub { margin: 1px 0 0; font-size: 12.5px; color: ${C.ink}; }
  .mu-body { display: grid; grid-template-columns: minmax(0, 1fr); gap: 24px; padding-top: 22px; }
  .mu-body > * { min-width: 0; }
  .mu-lead { margin: 0; color: ${C.dim}; font-size: 16px; line-height: 1.6; max-width: 72ch; }
  .mu-h2 { margin: 0 0 12px; font-size: 19px; }
  .mu-empty { display: flex; align-items: center; gap: 10px; margin: 0; padding: 18px; border-radius: 14px; background: ${C.band}; color: ${C.dim}; font-size: 14.5px; }
  .mu-empty p { margin: 0; }

  .mu-grid { display: grid; gap: 14px; grid-template-columns: 1fr; }
  @media (min-width: 640px) { .mu-grid { grid-template-columns: 1fr 1fr; } }
  @media (min-width: 980px) { .mu-grid { grid-template-columns: repeat(3, 1fr); } }
  .mu-card { display: grid; border-radius: 18px; overflow: hidden; background: ${C.card}; text-decoration: none; color: ${C.paper}; }
  .mu-card:hover { background: ${C.cardHi}; }
  .mu-pic { position: relative; display: grid; place-items: center; aspect-ratio: 4 / 3; background: ${C.band}; color: ${C.ink}; }
  .mu-pic img { width: 100%; height: 100%; object-fit: cover; }
  .mu-status { position: absolute; top: 10px; left: 10px; font-style: normal; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 999px; background: ${C.bg}; color: ${C.paper}; }
  .mu-status--available { background: ${C.green}; color: #10231A; }
  .mu-status--sold { background: ${C.red}; color: #2A1410; }
  .mu-card-body { display: grid; gap: 4px; padding: 16px; }
  .mu-card-body b { font-size: 16.5px; }
  .mu-card-body small { color: ${C.ink}; font-size: 13px; }
  .mu-card-foot { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-top: 8px; font-size: 13px; color: ${C.dim}; flex-wrap: wrap; }
  .mu-card-foot strong { color: ${C.goldLight}; font-size: 16px; }
  .mu-card-foot span { display: inline-flex; align-items: center; gap: 5px; }

  .mu-btn { display: inline-flex; align-items: center; justify-content: center; gap: 7px; padding: 12px 20px; border-radius: 999px; border: none; background: ${C.gold}; color: #1B1A14; font-weight: 700; font-size: 14.5px; cursor: pointer; font-family: inherit; min-height: 46px; width: fit-content; }
  .mu-btn:disabled { opacity: .6; cursor: default; }
  .mu-btn--ghost { background: rgba(246,242,231,0.08); color: ${C.paper}; }
  .mu-signin { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 18px; border-radius: 16px; background: ${C.band}; border-left: 3px solid ${C.gold}; }
  .mu-signin b { display: block; font-size: 15.5px; }
  .mu-signin small { display: block; color: ${C.dim}; font-size: 13.5px; margin-top: 2px; }
  .mu-signin-btns { display: flex; flex-wrap: wrap; gap: 8px; }
  .mu-note { margin: 0; padding: 14px 16px; border-radius: 14px; background: ${C.band}; color: ${C.dim}; font-size: 14px; }
  .mu-btn--small { padding: 9px 14px; min-height: 40px; font-size: 13.5px; }
  .mu-add { display: grid; gap: 14px; padding: 18px; border-radius: 18px; background: ${C.band}; border: 1px solid rgba(200,155,60,0.3); }
  .mu-add-head { display: flex; align-items: center; justify-content: space-between; }
  .mu-fields { display: grid; gap: 12px; grid-template-columns: 1fr; }
  @media (min-width: 720px) { .mu-fields { grid-template-columns: 1fr 1fr; } .mu-wide { grid-column: 1 / -1; } }
  .mu-fields label { display: grid; gap: 6px; font-size: 13.5px; font-weight: 600; color: ${C.dim}; }
  .mu-fields input, .mu-fields textarea, .mu-fields select { box-sizing: border-box; width: 100%; padding: 11px 12px; border-radius: 10px; border: 1px solid rgba(246,242,231,0.14); background: ${C.bg}; color: ${C.paper}; font-size: 15px; font-family: inherit; }
  .mu-label { margin: 4px 0 0; font-size: 14px; font-weight: 700; }
  .mu-recs { display: grid; gap: 8px; }
  .mu-rec { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 12px; border: 1.5px solid transparent; background: ${C.card}; color: ${C.paper}; text-align: left; cursor: pointer; font-family: inherit; }
  .mu-rec.on { border-color: ${C.gold}; }
  .mu-rec b { display: block; font-size: 14.5px; }
  .mu-rec small { display: block; color: ${C.ink}; font-size: 12.5px; }
  .mu-check { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 6px; border: 1.5px solid ${C.ink}; flex-shrink: 0; color: #1B1A14; }
  .mu-rec.on .mu-check { background: ${C.gold}; border-color: ${C.gold}; }
  .mu-err { margin: 0; color: ${C.red}; font-size: 14px; }
  .mu-enq { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .mu-enq li { padding: 14px; border-radius: 12px; background: ${C.card}; font-size: 14px; }
  .mu-enq a { color: ${C.goldLight}; }
  .mu-enq small { display: block; color: ${C.ink}; margin-top: 2px; }
  .mu-enq p { margin: 6px 0 0; color: ${C.dim}; }
  .mu-spin { animation: mu-spin 1s linear infinite; }
  @keyframes mu-spin { to { transform: rotate(360deg); } }
`;
