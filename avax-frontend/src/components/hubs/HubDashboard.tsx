'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Camera, CalendarDays, CheckCircle2, ExternalLink, Eye, EyeOff, FileText, ImagePlus, Loader2,
  Mic, Newspaper, Pencil, PlayCircle, Plus, Search, Trash2, X, type LucideIcon,
} from 'lucide-react';
import { usePrivyAuth } from '@/lib/auth/privy-auth';
import SignInOnProfile from '@/components/shared/SignInOnProfile';
import { HUB_SITE_URL } from '@/lib/hubs/hub-links';

/**
 * The Information Hub admin dashboard: hub managers create, edit, hide and
 * delete what the hub's website shows. Everything is stored in KAI's
 * database (hub_items) and read by the hub site through /api/hubs/<hub>/items.
 */

type Kind = 'news' | 'story' | 'activity' | 'photo' | 'video' | 'podcast';
interface Item {
  id: string; kind: Kind; title: string; summary: string | null; url: string | null; hasImage: boolean; hasBody: boolean;
  happenedOn: string | null; authorName: string | null; createdAt: string; updatedAt: string; published: boolean;
}
interface Draft {
  id?: string; kind: Kind; title: string; summary: string; body: string; url: string; happenedOn: string;
  published: boolean; image: File | null; preview: string | null; hadImage: boolean; removeImage: boolean;
}

const KINDS: { id: Kind; label: string; plural: string; Icon: LucideIcon; hint: string }[] = [
  { id: 'news', label: 'News article', plural: 'News', Icon: Newspaper, hint: 'A full article with a headline, picture and text.' },
  { id: 'story', label: 'Story or update', plural: 'Stories', Icon: FileText, hint: 'A shorter story, community update or announcement.' },
  { id: 'activity', label: 'Activity or event', plural: 'Activities', Icon: CalendarDays, hint: 'Something that happened or will happen, with a date.' },
  { id: 'photo', label: 'Photo', plural: 'Photos', Icon: Camera, hint: 'A picture with a caption.' },
  { id: 'video', label: 'Video', plural: 'Videos', Icon: PlayCircle, hint: 'A YouTube, Facebook or other video link.' },
  { id: 'podcast', label: 'Podcast or audio', plural: 'Podcasts', Icon: Mic, hint: 'A link to an episode or audio.' },
];
const KIND = Object.fromEntries(KINDS.map((k) => [k.id, k])) as Record<Kind, (typeof KINDS)[number]>;

const C = {
  bg: '#0E2418', band: '#12301F', card: '#15352A', gold: '#C89B3C', goldLight: '#E4C878', paper: '#F6F2E7',
  paperDim: '#C9CFC2', ink: '#1B1A14', inkLight: '#9BA396', green: '#7DC383', red: '#E88C7D', line: 'rgba(246,242,231,0.09)',
};

const emptyDraft = (kind: Kind = 'news'): Draft => ({
  kind, title: '', summary: '', body: '', url: '', happenedOn: '', published: true, image: null, preview: null, hadImage: false, removeImage: false,
});
const youtubeId = (url: string) => url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/)?.[1] ?? null;
const imgUrl = (hub: string, it: Pick<Item, 'id' | 'updatedAt'>) => `/api/hubs/${hub}/items/${it.id}/image?v=${encodeURIComponent(it.updatedAt)}`;
const dateWords = (iso: string) => new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });

export default function HubDashboard({ hub, name, org }: { hub: 'oloolua' | 'sihu'; name: string; org: string }) {
  const privy = usePrivyAuth();
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Kind | 'all'>('all');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<{ text: string; field?: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Item | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const site = HUB_SITE_URL[hub];

  const headers = useCallback(async (): Promise<Record<string, string>> => {
    const t = await privy.getAccessToken().catch(() => null);
    return t ? { authorization: `Bearer ${t}` } : {};
  }, [privy]);

  const say = (text: string) => { setToast(text); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const h = await headers();
      const m = await fetch(`/api/hubs/${hub}/manage`, { headers: h }).then((r) => r.json()).catch(() => ({ admin: false }));
      setAdmin(!!m.admin);
      if (m.admin) {
        const r = await fetch(`/api/hubs/${hub}/items?all=1`, { headers: h });
        if (r.ok) setItems(((await r.json()).items ?? []) as Item[]);
      }
    } finally { setLoading(false); }
  }, [headers, hub]);

  // Load once signed in: the session token comes after an async boundary.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (privy.authenticated) void load(); }, [privy.authenticated, load]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    for (const it of items) c[it.kind] = (c[it.kind] ?? 0) + 1;
    return c;
  }, [items]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => (filter === 'all' || it.kind === filter) && (!q || it.title.toLowerCase().includes(q) || (it.summary ?? '').toLowerCase().includes(q)));
  }, [items, filter, query]);

  const startNew = (kind: Kind = filter === 'all' ? 'news' : filter) => { setError(null); setDraft(emptyDraft(kind)); };

  const startEdit = async (it: Item) => {
    setError(null);
    const base: Draft = {
      id: it.id, kind: it.kind, title: it.title, summary: it.summary ?? '', body: '', url: it.url ?? '', happenedOn: it.happenedOn ?? '',
      published: it.published, image: null, preview: it.hasImage ? imgUrl(hub, it) : null, hadImage: it.hasImage, removeImage: false,
    };
    setDraft(base);
    if (it.hasBody) {
      const r = await fetch(`/api/hubs/${hub}/items/${it.id}?all=1`, { headers: await headers() });
      const d = await r.json().catch(() => null);
      if (d?.item) setDraft((cur) => (cur && cur.id === it.id ? { ...cur, body: d.item.body ?? '' } : cur));
    }
  };

  const pickImage = (f: File | null) => {
    if (!f) return;
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { setError({ text: 'Use a JPEG, PNG or WebP picture.', field: 'image' }); return; }
    if (f.size > 3 * 1024 * 1024) { setError({ text: 'The picture is larger than 3 MB. Please use a smaller one.', field: 'image' }); return; }
    setError(null);
    setDraft((d) => d && { ...d, image: f, preview: URL.createObjectURL(f), removeImage: false });
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true); setError(null);
    try {
      const form = new FormData();
      form.set('kind', draft.kind);
      form.set('title', draft.title);
      form.set('summary', draft.summary);
      form.set('body', draft.body);
      form.set('url', draft.url.trim());
      form.set('happenedOn', draft.happenedOn);
      form.set('published', draft.published ? '1' : '0');
      if (draft.image) form.set('image', draft.image);
      else if (draft.removeImage) form.set('removeImage', '1');
      const r = await fetch(draft.id ? `/api/hubs/${hub}/items/${draft.id}` : `/api/hubs/${hub}/items`, {
        method: draft.id ? 'PATCH' : 'POST', headers: await headers(), body: form,
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setError({ text: d.error ?? 'Could not save. Try again.', field: d.field }); return; }
      say(draft.id ? 'Changes saved' : draft.published ? 'Published on the hub' : 'Saved as hidden');
      setDraft(null);
      await load();
    } catch { setError({ text: 'No connection. Try again.' }); } finally { setSaving(false); }
  };

  const toggle = async (it: Item) => {
    const form = new FormData();
    form.set('published', it.published ? '0' : '1');
    const r = await fetch(`/api/hubs/${hub}/items/${it.id}`, { method: 'PATCH', headers: await headers(), body: form });
    if (r.ok) { say(it.published ? 'Hidden from the hub' : 'Shown on the hub'); setItems((xs) => xs.map((x) => (x.id === it.id ? { ...x, published: !x.published } : x))); }
    else say('Could not change it. Try again.');
  };

  const remove = async (it: Item) => {
    const r = await fetch(`/api/hubs/${hub}/items/${it.id}?forever=1`, { method: 'DELETE', headers: await headers() });
    setConfirmDelete(null);
    if (r.ok) { say('Deleted'); setItems((xs) => xs.filter((x) => x.id !== it.id)); } else say('Could not delete. Try again.');
  };

  const needsBody = draft && (draft.kind === 'news' || draft.kind === 'story');
  const needsUrl = draft && (draft.kind === 'video' || draft.kind === 'podcast');
  const ytId = draft && draft.kind === 'video' ? youtubeId(draft.url) : null;
  const words = draft?.body.trim() ? draft.body.trim().split(/\s+/).length : 0;

  return (
    <main className="hd">
      <style>{CSS}</style>
      <div className="hd-wrap">
        <header className="hd-top">
          <Link href="/profile" prefetch={false} className="hd-back" aria-label="Back to your profile"><ArrowLeft size={18} /></Link>
          <div className="hd-title">
            <span className="hd-eyebrow">Information Hub admin</span>
            <h1>{name}</h1>
            <p>{org} · what you publish here appears on the hub website.</p>
          </div>
          <a href={site} target="_blank" rel="noopener noreferrer" className="hd-btn hd-btn--ghost"><ExternalLink size={15} /> View the hub</a>
        </header>

        {!privy.authenticated ? (
          <section className="hd-empty">
            <h2>Sign in to manage the hub</h2>
            <p>Hub managers sign in with the email or Google account the hub knows.</p>
            <SignInOnProfile className="hd-btn" />
          </section>
        ) : admin === null || (loading && !items.length && admin !== false) ? (
          <section className="hd-empty"><Loader2 size={22} className="hd-spin" /><p>Loading the hub…</p></section>
        ) : !admin ? (
          <section className="hd-empty">
            <h2>Your account cannot manage this hub</h2>
            <p>You are signed in as <b>{privy.email ?? 'this account'}</b>. Ask the platform admin to add this email as a manager of {name}.</p>
            <a href={site} className="hd-btn hd-btn--ghost" target="_blank" rel="noopener noreferrer"><ExternalLink size={15} /> Visit the hub instead</a>
          </section>
        ) : (
          <>
            {/* Quick add */}
            <section className="hd-quick" aria-label="Add to the hub">
              {KINDS.map((k) => (
                <button key={k.id} type="button" className="hd-quick-btn" onClick={() => startNew(k.id)}>
                  <span><k.Icon size={18} /></span>
                  <b>Add {k.label.toLowerCase()}</b>
                  <small>{counts[k.id] ?? 0} so far</small>
                </button>
              ))}
            </section>

            {/* Filter and search */}
            <div className="hd-bar">
              <div className="hd-tabs" role="tablist" aria-label="Show">
                {([{ id: 'all', plural: 'All' }, ...KINDS] as { id: Kind | 'all'; plural: string }[]).map((k) => (
                  <button key={k.id} role="tab" aria-selected={filter === k.id} className={filter === k.id ? 'is-on' : ''} onClick={() => setFilter(k.id)}>
                    {k.plural} <span>{counts[k.id] ?? 0}</span>
                  </button>
                ))}
              </div>
              <label className="hd-search">
                <Search size={15} />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search titles" aria-label="Search titles" />
              </label>
              <button className="hd-btn" onClick={() => startNew()}><Plus size={16} /> New post</button>
            </div>

            {/* List */}
            {shown.length === 0 ? (
              <section className="hd-empty hd-empty--small">
                <p>{items.length ? 'Nothing matches.' : 'Nothing published yet. Add the first news article, photo or video.'}</p>
                {!items.length && <button className="hd-btn" onClick={() => startNew('news')}><Plus size={16} /> Write the first article</button>}
              </section>
            ) : (
              <ul className="hd-list">
                {shown.map((it) => {
                  const k = KIND[it.kind];
                  const yt = it.kind === 'video' && it.url ? youtubeId(it.url) : null;
                  const thumb = it.hasImage ? imgUrl(hub, it) : yt ? `https://img.youtube.com/vi/${yt}/mqdefault.jpg` : null;
                  return (
                    <li key={it.id} className={it.published ? '' : 'is-hidden'}>
                      <button type="button" className="hd-thumb" onClick={() => { void startEdit(it); }} aria-label={`Edit ${it.title}`}>
                        {thumb ? <img src={thumb} alt="" loading="lazy" /> : <k.Icon size={22} />}
                      </button>
                      <div className="hd-info">
                        <div className="hd-meta">
                          <span className={`hd-kind hd-kind--${it.kind}`}><k.Icon size={12} /> {k.label}</span>
                          {!it.published && <span className="hd-hidden"><EyeOff size={12} /> Hidden</span>}
                        </div>
                        <button type="button" className="hd-item-title" onClick={() => { void startEdit(it); }}>{it.title}</button>
                        <small>{it.happenedOn ? dateWords(it.happenedOn) : dateWords(it.createdAt)}{it.authorName ? ` · by ${it.authorName}` : ''}</small>
                      </div>
                      <div className="hd-actions">
                        <button type="button" onClick={() => { void startEdit(it); }} title="Edit"><Pencil size={16} /><span>Edit</span></button>
                        <button type="button" onClick={() => { void toggle(it); }} title={it.published ? 'Hide from the hub' : 'Show on the hub'}>
                          {it.published ? <><EyeOff size={16} /><span>Hide</span></> : <><Eye size={16} /><span>Show</span></>}
                        </button>
                        <button type="button" className="is-danger" onClick={() => setConfirmDelete(it)} title="Delete"><Trash2 size={16} /><span>Delete</span></button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>

      {/* Editor */}
      {draft && (
        <div className="hd-sheet" role="dialog" aria-modal="true" aria-label={draft.id ? 'Edit post' : 'New post'} onClick={(e) => { if (e.target === e.currentTarget && !saving) setDraft(null); }}>
          <div className="hd-panel">
            <div className="hd-panel-top">
              <h2>{draft.id ? 'Edit' : 'New'} {KIND[draft.kind].label.toLowerCase()}</h2>
              <button type="button" className="hd-icon" onClick={() => setDraft(null)} aria-label="Close" disabled={saving}><X size={18} /></button>
            </div>

            {!draft.id && (
              <div className="hd-kinds" role="radiogroup" aria-label="What are you adding?">
                {KINDS.map((k) => (
                  <button key={k.id} type="button" role="radio" aria-checked={draft.kind === k.id} className={draft.kind === k.id ? 'is-on' : ''} onClick={() => setDraft({ ...draft, kind: k.id })}>
                    <k.Icon size={16} /> {k.plural}
                  </button>
                ))}
              </div>
            )}
            <p className="hd-hint">{KIND[draft.kind].hint}</p>

            <label className="hd-field">
              <span>{draft.kind === 'photo' ? 'Caption' : 'Title'}</span>
              <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} maxLength={160}
                placeholder={draft.kind === 'news' ? 'e.g. Fishermen in Sango restock Lake Victoria' : draft.kind === 'photo' ? 'e.g. Tree planting at Sango beach' : 'A clear, short title'}
                aria-invalid={error?.field === 'title'} autoFocus />
            </label>

            {needsUrl && (
              <label className="hd-field">
                <span>{draft.kind === 'video' ? 'Video link' : 'Podcast or audio link'}</span>
                <input value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} placeholder="https://www.youtube.com/watch?v=…" inputMode="url" aria-invalid={error?.field === 'url'} />
                {ytId && <img className="hd-yt" src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} alt="Video preview" />}
              </label>
            )}

            <label className="hd-field">
              <span>{needsBody ? 'Short summary (shown on the card)' : 'Description (optional)'}</span>
              <textarea value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} rows={3} maxLength={2000}
                placeholder={needsBody ? 'One or two sentences that make people want to read.' : 'What is it about? Where and when?'} />
            </label>

            {needsBody && (
              <label className="hd-field">
                <span>Full text <em>{words ? `${words} words · about ${Math.max(1, Math.round(words / 200))} min read` : ''}</em></span>
                <textarea className="hd-body" value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} rows={12} maxLength={60000}
                  placeholder={'Write the article here.\n\nLeave an empty line between paragraphs.'} aria-invalid={error?.field === 'body'} />
              </label>
            )}

            {!needsUrl && !needsBody && draft.kind !== 'photo' && (
              <label className="hd-field">
                <span>Link (optional)</span>
                <input value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} placeholder="https://…" inputMode="url" aria-invalid={error?.field === 'url'} />
              </label>
            )}

            <div className="hd-row">
              <label className="hd-field">
                <span>{draft.kind === 'activity' ? 'Date of the activity' : 'Date (optional)'}</span>
                <input type="date" value={draft.happenedOn} onChange={(e) => setDraft({ ...draft, happenedOn: e.target.value })} />
              </label>
              <label className="hd-switch">
                <input type="checkbox" checked={draft.published} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} />
                <span aria-hidden="true" />
                <b>{draft.published ? 'Live on the hub' : 'Hidden (draft)'}</b>
              </label>
            </div>

            <div className="hd-field">
              <span>{draft.kind === 'photo' ? 'Photo' : 'Picture (optional)'}</span>
              {draft.preview && !draft.removeImage ? (
                <div className="hd-preview">
                  <img src={draft.preview} alt="Chosen picture" />
                  <div>
                    <button type="button" className="hd-btn hd-btn--ghost hd-btn--small" onClick={() => fileRef.current?.click()}><ImagePlus size={15} /> Change</button>
                    {draft.kind !== 'photo' && <button type="button" className="hd-btn hd-btn--text hd-btn--small" onClick={() => setDraft({ ...draft, image: null, preview: null, removeImage: draft.hadImage })}>Remove</button>}
                  </div>
                </div>
              ) : (
                <button type="button" className={`hd-drop${error?.field === 'image' ? ' is-bad' : ''}`} onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pickImage(e.dataTransfer.files?.[0] ?? null); }}>
                  <ImagePlus size={22} />
                  <b>Choose a picture</b>
                  <small>or drag it here · JPEG, PNG or WebP · up to 3 MB</small>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { pickImage(e.target.files?.[0] ?? null); e.target.value = ''; }} />
            </div>

            {error && <p className="hd-error" role="alert">{error.text}</p>}

            <div className="hd-panel-foot">
              <button type="button" className="hd-btn hd-btn--text" onClick={() => setDraft(null)} disabled={saving}>Cancel</button>
              <button type="button" className="hd-btn" onClick={() => { void save(); }} disabled={saving}>
                {saving ? <><Loader2 size={16} className="hd-spin" /> Saving…</> : <><CheckCircle2 size={16} /> {draft.id ? 'Save changes' : draft.published ? 'Publish' : 'Save hidden'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="hd-sheet hd-sheet--center" role="alertdialog" aria-modal="true" aria-label="Delete this post?">
          <div className="hd-confirm">
            <h2>Delete this post?</h2>
            <p>&ldquo;{confirmDelete.title}&rdquo; will be removed for good. To take it off the hub but keep it, choose Hide instead.</p>
            <div>
              <button className="hd-btn hd-btn--ghost" onClick={() => { const it = confirmDelete; setConfirmDelete(null); if (it.published) void toggle(it); }}>Hide instead</button>
              <button className="hd-btn hd-btn--danger" onClick={() => { void remove(confirmDelete); }}><Trash2 size={15} /> Delete</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="hd-toast" role="status"><CheckCircle2 size={15} /> {toast}</div>}
    </main>
  );
}

const CSS = `
.hd { min-height: 100dvh; background: ${C.bg}; color: ${C.paper}; font-family: 'Inter', system-ui, sans-serif; padding-bottom: 120px; }
.hd-wrap { max-width: 1080px; margin: 0 auto; padding: 28px 24px 0; }
.hd h1, .hd h2 { margin: 0; letter-spacing: -0.01em; }
.hd-spin { animation: hd-spin 1s linear infinite; }
@keyframes hd-spin { to { transform: rotate(360deg); } }

.hd-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 18px; min-height: 42px; border-radius: 999px; border: 0; background: ${C.gold}; color: ${C.ink}; font: 700 14px 'Inter', system-ui, sans-serif; cursor: pointer; text-decoration: none; white-space: nowrap; transition: background-color .15s ease; }
.hd-btn:hover { background: ${C.goldLight}; }
.hd-btn:disabled { opacity: .6; cursor: default; }
.hd-btn--ghost { background: rgba(246,242,231,.06); color: ${C.paper}; border: 1px solid ${C.line}; }
.hd-btn--ghost:hover { background: rgba(246,242,231,.12); }
.hd-btn--text { background: none; color: ${C.paperDim}; }
.hd-btn--text:hover { background: rgba(246,242,231,.08); }
.hd-btn--danger { background: ${C.red}; color: ${C.ink}; }
.hd-btn--danger:hover { background: #f0a497; }
.hd-btn--small { padding: 7px 14px; min-height: 34px; font-size: 13px; }

.hd-top { display: flex; align-items: center; gap: 16px; padding-bottom: 24px; border-bottom: 1px solid ${C.line}; }
.hd-back { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; color: ${C.paper}; background: rgba(246,242,231,.06); flex-shrink: 0; }
.hd-title { flex: 1; min-width: 0; }
.hd-eyebrow { font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: ${C.goldLight}; }
.hd-title h1 { font-size: clamp(22px, 3vw, 30px); margin-top: 2px; }
.hd-title p { margin: 4px 0 0; color: ${C.inkLight}; font-size: 14px; }

.hd-empty { margin: 48px auto; max-width: 460px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px; color: ${C.paperDim}; }
.hd-empty h2 { font-size: 22px; color: ${C.paper}; }
.hd-empty p { margin: 0; line-height: 1.6; }
.hd-empty--small { margin: 32px auto; }

.hd-quick { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 10px; margin-top: 24px; }
.hd-quick-btn { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; padding: 14px; border-radius: 16px; border: 1px solid ${C.line}; background: rgba(246,242,231,.03); color: ${C.paper}; cursor: pointer; text-align: left; font-family: inherit; transition: border-color .15s ease, background-color .15s ease; }
.hd-quick-btn:hover { border-color: rgba(228,200,120,.45); background: rgba(228,200,120,.06); }
.hd-quick-btn span { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; background: rgba(228,200,120,.12); color: ${C.goldLight}; margin-bottom: 6px; }
.hd-quick-btn b { font-size: 13.5px; }
.hd-quick-btn small { font-size: 12px; color: ${C.inkLight}; }

.hd-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin: 28px 0 14px; }
.hd-tabs { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; flex: 1 1 auto; min-width: 0; }
.hd-tabs button { padding: 8px 14px; border-radius: 999px; border: 1px solid ${C.line}; background: none; color: ${C.paperDim}; font: 600 13px 'Inter', system-ui, sans-serif; cursor: pointer; white-space: nowrap; }
.hd-tabs button span { opacity: .6; margin-left: 3px; }
.hd-tabs button.is-on { background: ${C.paper}; color: ${C.ink}; border-color: ${C.paper}; }
.hd-search { display: flex; align-items: center; gap: 8px; padding: 0 14px; min-height: 42px; border-radius: 999px; border: 1px solid ${C.line}; background: rgba(246,242,231,.04); color: ${C.inkLight}; }
.hd-search input { background: none; border: 0; outline: none; color: ${C.paper}; font: 500 14px 'Inter', system-ui, sans-serif; width: 160px; }

.hd-list { list-style: none; margin: 0; padding: 0; border-top: 1px solid ${C.line}; }
.hd-list li { display: flex; align-items: center; gap: 16px; padding: 14px 0; border-bottom: 1px solid ${C.line}; }
.hd-list li.is-hidden { opacity: .62; }
.hd-thumb { width: 92px; height: 66px; flex-shrink: 0; border-radius: 12px; overflow: hidden; border: 0; padding: 0; background: rgba(246,242,231,.06); color: ${C.inkLight}; display: grid; place-items: center; cursor: pointer; }
.hd-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.hd-info { flex: 1; min-width: 0; }
.hd-meta { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 4px; }
.hd-kind, .hd-hidden { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; font-weight: 700; padding: 3px 9px; border-radius: 999px; background: rgba(228,200,120,.12); color: ${C.goldLight}; }
.hd-kind--photo, .hd-kind--video { background: rgba(111,168,220,.14); color: #9cc5ea; }
.hd-kind--activity { background: rgba(125,195,131,.14); color: ${C.green}; }
.hd-hidden { background: rgba(246,242,231,.08); color: ${C.paperDim}; }
.hd-item-title { display: block; width: 100%; text-align: left; background: none; border: 0; padding: 0; color: ${C.paper}; font: 650 15.5px 'Inter', system-ui, sans-serif; cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hd-item-title:hover { color: ${C.goldLight}; }
.hd-info small { font-size: 12.5px; color: ${C.inkLight}; }
.hd-actions { display: flex; gap: 4px; flex-shrink: 0; }
.hd-actions button { display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 10px; border: 0; background: none; color: ${C.paperDim}; font: 600 13px 'Inter', system-ui, sans-serif; cursor: pointer; }
.hd-actions button:hover { background: rgba(246,242,231,.07); color: ${C.paper}; }
.hd-actions button.is-danger:hover { color: ${C.red}; }

.hd-sheet { position: fixed; inset: 0; z-index: 80; background: rgba(4,14,8,.66); display: flex; justify-content: flex-end; }
.hd-sheet--center { align-items: center; justify-content: center; padding: 16px; }
.hd-panel { width: min(620px, 100%); height: 100%; overflow-y: auto; background: ${C.band}; border-left: 1px solid ${C.line}; padding: 22px 24px 28px; box-sizing: border-box; display: flex; flex-direction: column; gap: 16px; animation: hd-in .22s ease; }
@keyframes hd-in { from { transform: translateX(30px); opacity: 0; } to { transform: none; opacity: 1; } }
.hd-panel-top { display: flex; align-items: center; justify-content: space-between; }
.hd-panel-top h2 { font-size: 20px; }
.hd-icon { width: 38px; height: 38px; border-radius: 50%; border: 0; background: rgba(246,242,231,.07); color: ${C.paper}; display: grid; place-items: center; cursor: pointer; }
.hd-kinds { display: flex; flex-wrap: wrap; gap: 6px; }
.hd-kinds button { display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 999px; border: 1px solid ${C.line}; background: none; color: ${C.paperDim}; font: 600 13px 'Inter', system-ui, sans-serif; cursor: pointer; }
.hd-kinds button.is-on { border-color: ${C.gold}; color: ${C.goldLight}; background: rgba(200,155,60,.12); }
.hd-hint { margin: -6px 0 0; font-size: 13px; color: ${C.inkLight}; }
.hd-field { display: flex; flex-direction: column; gap: 7px; flex: 1; min-width: 0; }
.hd-field > span { font-size: 12px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: ${C.inkLight}; display: flex; justify-content: space-between; gap: 8px; }
.hd-field > span em { font-style: normal; text-transform: none; letter-spacing: 0; font-weight: 500; }
.hd-field input, .hd-field textarea { width: 100%; box-sizing: border-box; padding: 12px 14px; border-radius: 12px; border: 1px solid ${C.line}; background: rgba(246,242,231,.04); color: ${C.paper}; font: 500 15px/1.5 'Inter', system-ui, sans-serif; outline: none; resize: vertical; }
.hd-field input:focus, .hd-field textarea:focus { border-color: ${C.gold}; box-shadow: 0 0 0 3px rgba(200,155,60,.18); }
.hd-field input[aria-invalid="true"], .hd-field textarea[aria-invalid="true"] { border-color: rgba(232,140,125,.7); }
.hd-field input[type="date"] { color-scheme: dark; }
.hd-body { min-height: 240px; font-size: 15.5px; line-height: 1.7; }
.hd-yt { width: 100%; max-width: 320px; border-radius: 10px; margin-top: 4px; }
.hd-row { display: flex; gap: 16px; align-items: flex-end; flex-wrap: wrap; }
.hd-switch { display: inline-flex; align-items: center; gap: 10px; cursor: pointer; padding-bottom: 10px; }
.hd-switch input { position: absolute; opacity: 0; width: 1px; height: 1px; }
.hd-switch span { width: 44px; height: 26px; border-radius: 13px; background: rgba(246,242,231,.12); position: relative; transition: background-color .2s ease; flex-shrink: 0; }
.hd-switch span::after { content: ''; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: ${C.paperDim}; transition: transform .2s ease, background-color .2s ease; }
.hd-switch input:checked + span { background: rgba(125,195,131,.35); }
.hd-switch input:checked + span::after { transform: translateX(18px); background: ${C.green}; }
.hd-switch input:focus-visible + span { outline: 2px solid ${C.goldLight}; outline-offset: 2px; }
.hd-switch b { font-size: 14px; }
.hd-drop { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 26px 16px; border-radius: 14px; border: 1.5px dashed rgba(228,200,120,.35); background: rgba(228,200,120,.04); color: ${C.goldLight}; cursor: pointer; font-family: inherit; }
.hd-drop:hover { background: rgba(228,200,120,.08); }
.hd-drop.is-bad { border-color: rgba(232,140,125,.7); }
.hd-drop b { color: ${C.paper}; font-size: 14.5px; }
.hd-drop small { color: ${C.inkLight}; font-size: 12.5px; }
.hd-preview { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; }
.hd-preview img { width: 180px; height: 120px; object-fit: cover; border-radius: 12px; }
.hd-preview div { display: flex; flex-direction: column; gap: 6px; }
.hd-error { margin: 0; padding: 10px 14px; border-radius: 12px; background: rgba(232,140,125,.12); color: ${C.red}; font-size: 14px; font-weight: 600; }
.hd-panel-foot { display: flex; justify-content: flex-end; gap: 8px; margin-top: auto; padding-top: 12px; position: sticky; bottom: -28px; background: ${C.band}; padding-bottom: 4px; }
.hd-confirm { width: min(420px, 100%); background: ${C.band}; border: 1px solid ${C.line}; border-radius: 20px; padding: 24px; }
.hd-confirm h2 { font-size: 20px; }
.hd-confirm p { color: ${C.paperDim}; line-height: 1.6; font-size: 14.5px; }
.hd-confirm > div { display: flex; justify-content: flex-end; gap: 8px; flex-wrap: wrap; }
.hd-toast { position: fixed; left: 0; right: 0; margin: 0 auto; width: max-content; max-width: calc(100% - 24px); bottom: 96px; z-index: 90; display: flex; align-items: center; gap: 8px; padding: 11px 20px; border-radius: 999px; background: ${C.band}; border: 1px solid ${C.line}; color: ${C.green}; font-size: 14px; font-weight: 600; }

@media (max-width: 900px) { .hd-quick { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 640px) {
  .hd-wrap { padding: 20px 16px 0; }
  .hd-top { flex-wrap: wrap; }
  .hd-top > .hd-btn { width: 100%; }
  .hd-quick { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .hd-search { flex: 1; }
  .hd-search input { width: 100%; }
  .hd-list li { flex-wrap: wrap; gap: 12px; }
  .hd-thumb { width: 72px; height: 56px; }
  .hd-info { flex-basis: calc(100% - 90px); }
  .hd-actions { width: 100%; justify-content: flex-end; }
  .hd-panel { border-left: 0; padding: 18px 16px 24px; }
}
`;
