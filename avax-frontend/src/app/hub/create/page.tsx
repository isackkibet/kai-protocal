'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, PenLine, Check, AlertTriangle, X, Sparkles, Send,
  Save, Info, ShieldCheck, Coins, Plus, Lock, FileText,
} from 'lucide-react';
import { usePrivyAuth } from '@/lib/auth/privy-auth';
import { HUB_THEME, MONO, SERIF } from '@/lib/hubs/hub-theme';
import type { AiReviewReport, ContentPost, PostDraftInput, SihuContentType } from '@/lib/hubs/sihu-types';

const T = HUB_THEME;

const CONTENT_TYPES: { id: SihuContentType; label: string }[] = [
  { id: 'ARTICLE', label: 'Article' },
  { id: 'NEWS_UPDATE', label: 'News update' },
  { id: 'FIELD_JOURNAL', label: 'Field journal' },
  { id: 'EDUCATIONAL_GUIDE', label: 'How-to guide' },
  { id: 'CONSERVATION_IMPACT', label: 'Conservation impact' },
  { id: 'MARKET_NEWS', label: 'Market news' },
  { id: 'AUDIO_PODCAST', label: 'Podcast' },
  { id: 'REPORT', label: 'Report' },
];

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'CONSERVATION', label: 'Conservation' },
  { id: 'FORESTRY_MRV', label: 'Forestry and tree records' },
  { id: 'CLIMATE', label: 'Climate' },
  { id: 'COMMUNITY', label: 'Community' },
  { id: 'AGRI_MARKET', label: 'Farming and markets' },
  { id: 'MSME_GROWTH', label: 'Small business' },
  { id: 'CHAMA_SAVINGS', label: 'Chama and savings' },
];

/** What each status means to the writer, in plain words. */
const STATUS_INFO: Record<ContentPost['status'], { label: string; color: string; note: string }> = {
  DRAFT:             { label: 'Draft',             color: T.inkLight,  note: 'Only you can see this. Keep editing, then submit when ready.' },
  CHANGES_REQUESTED: { label: 'Changes requested', color: T.gold,      note: 'The editor asked for changes. Edit your story and submit again.' },
  SUBMITTED:         { label: 'In review',         color: T.goldLight, note: 'An editor is reviewing your story. You cannot edit it while it is in review.' },
  APPROVED:          { label: 'Approved',          color: T.pineLight, note: 'Approved by the editor and about to go live.' },
  PUBLISHED:         { label: 'Published',         color: T.pineLight, note: 'Your story is live. Readers can now read and tip it.' },
  REJECTED:          { label: 'Not accepted',      color: T.clay,      note: 'The editor did not accept this story. You can start a new one.' },
};

const EDITABLE: ContentPost['status'][] = ['DRAFT', 'CHANGES_REQUESTED'];

export default function CreatePage() {
  const { authenticated, ready, signInWithEmail, getAccessToken } = usePrivyAuth();
  // Sign-in can be slow to report ready (the wallet layer loads last). Stop
  // waiting after a moment so people never stare at a blank page.
  const [waitedEnough, setWaitedEnough] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setWaitedEnough(true), 1800);
    return () => clearTimeout(t);
  }, []);

  const [postId, setPostId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [body, setBody] = useState('');
  const [contentType, setContentType] = useState<SihuContentType>('ARTICLE');
  const [category, setCategory] = useState('CONSERVATION');
  const [language, setLanguage] = useState('EN');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState<ContentPost['status'] | null>(null);
  const [aiReport, setAiReport] = useState<AiReviewReport | null>(null);
  const [busy, setBusy] = useState<'save' | 'ai' | 'submit' | null>(null);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err' | 'warn'; text: string } | null>(null);
  const [drafts, setDrafts] = useState<ContentPost[]>([]);
  const [dirty, setDirty] = useState(false);
  const [editorNote, setEditorNote] = useState<string | null>(null);

  const editable = !status || EDITABLE.includes(status);
  const words = body.trim() ? body.trim().split(/\s+/).length : 0;
  const readMins = Math.max(1, Math.round(words / 200));

  const bearer = async () => {
    const t = await getAccessToken();
    return t ? `Bearer ${t}` : '';
  };

  const loadMine = async () => {
    const b = await bearer();
    if (!b) return;
    try {
      const r = await fetch('/api/hub/articles', { headers: { Authorization: b } });
      const d = await r.json();
      if (r.ok) setDrafts(d.posts ?? []);
    } catch { /* the list is optional */ }
  };

  useEffect(() => {
    if (!authenticated) return;
    void (async () => {
      const t = await getAccessToken();
      if (!t) return;
      try {
        const r = await fetch('/api/hub/articles', { headers: { Authorization: `Bearer ${t}` } });
        const d = await r.json();
        if (r.ok) setDrafts(d.posts ?? []);
      } catch { /* the list is optional */ }
    })();
  }, [authenticated, getAccessToken]);

  /* Any edit marks the draft as unsaved. */
  const edit = <V,>(set: (v: V) => void) => (v: V) => { set(v); setDirty(true); };

  const payload = (): PostDraftInput => ({
    title, summary, body, contentType, category, language,
    tags: tags.split(',').map(t => t.trim()).filter(Boolean),
  });

  /**
   * Saves the current text and returns the post id. The AI check and submit
   * call this first, so they always act on what is on screen, never on an
   * older saved copy.
   */
  const persist = async (): Promise<string | null> => {
    if (!title.trim() || !body.trim()) {
      setMsg({ kind: 'err', text: 'Add a title and your story before saving.' });
      return null;
    }
    if (postId && !dirty) return postId;
    const b = await bearer();
    const r = await fetch(postId ? `/api/hub/articles/manage/${postId}` : '/api/hub/articles', {
      method: postId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: b },
      body: JSON.stringify(payload()),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Could not save');
    setPostId(d.post.id);
    setStatus(d.post.status);
    setDirty(false);
    return d.post.id as string;
  };

  const save = async () => {
    setBusy('save'); setMsg(null);
    try {
      const id = await persist();
      if (id) { setMsg({ kind: 'ok', text: 'Draft saved.' }); void loadMine(); }
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message.slice(0, 200) : 'Save failed.' });
    } finally { setBusy(null); }
  };

  const aiCheck = async () => {
    setBusy('ai'); setMsg(null);
    try {
      const id = await persist();
      if (!id) return;
      const r = await fetch(`/api/hub/articles/manage/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: await bearer() },
        body: JSON.stringify({ action: 'preview' }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'The check failed.');
      setAiReport(d.report);
      setStatus(d.post.status);
      setMsg({ kind: 'ok', text: 'Check complete. See the results below your story.' });
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message.slice(0, 200) : 'The check failed.' });
    } finally { setBusy(null); }
  };

  const submit = async () => {
    setBusy('submit'); setMsg(null);
    try {
      const id = await persist();
      if (!id) return;
      const r = await fetch(`/api/hub/articles/manage/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: await bearer() },
        body: JSON.stringify({ action: 'submit' }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Could not submit.');
      setStatus(d.post.status);
      setMsg({ kind: 'ok', text: 'Sent to the editor. You will see the result here.' });
      void loadMine();
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message.slice(0, 200) : 'Submit failed.' });
    } finally { setBusy(null); }
  };

  const openDraft = (d: ContentPost) => {
    setPostId(d.id); setTitle(d.title); setSummary(d.summary ?? ''); setBody(d.body);
    setContentType(d.contentType); setCategory(d.category); setLanguage(d.language);
    setTags(d.tags.join(', ')); setStatus(d.status); setAiReport(d.aiReport);
    setEditorNote(d.editorNote); setDirty(false); setMsg(null);
  };

  const newStory = () => {
    setPostId(null); setTitle(''); setSummary(''); setBody('');
    setContentType('ARTICLE'); setCategory('CONSERVATION'); setLanguage('EN'); setTags('');
    setStatus(null); setAiReport(null); setEditorNote(null); setDirty(false); setMsg(null);
  };

  /* Checklist state: 1 write, 2 check, 3 submit */
  const step1 = !!postId && !dirty;
  const step2 = !!aiReport;
  const step3 = !!status && !EDITABLE.includes(status);

  if (!ready && !waitedEnough) {
    return (
      <main style={{ minHeight: '100dvh', background: T.bg, color: T.inkLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Sans', sans-serif" }}>
        Loading...
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100dvh', background: T.bg, color: T.paper, fontFamily: "'IBM Plex Sans', sans-serif", paddingBottom: 110 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..700&family=IBM+Plex+Mono:wght@500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
        .ws-wrap { max-width: 1080px; margin: 0 auto; padding: 0 24px; }
        .ws-grid { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 28px; align-items: start; }
        .ws-side { position: sticky; top: 20px; display: flex; flex-direction: column; gap: 16px; }
        .ws-steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        .ws-field:focus { border-color: ${T.gold} !important; }
        .ws-btn:disabled { opacity: 0.55; cursor: default; }
        .spin { animation: ws-spin 0.9s linear infinite; } @keyframes ws-spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .ws-grid { grid-template-columns: 1fr; }
          .ws-side { position: static; }
        }
        @media (max-width: 640px) {
          .ws-wrap { padding: 0 16px; }
          .ws-steps { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <div className="ws-wrap">
        {/* Top bar */}
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 0 18px', gap: 12 }}>
          <Link href="/hub" style={topLink}><ArrowLeft size={14} /> Info Hub</Link>
          <Link href="/hub/review" style={topLink}>Editor desk</Link>
        </nav>

        {/* Intro */}
        <header style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ width: 40, height: 40, borderRadius: 12, background: T.gold, color: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <PenLine size={19} />
            </span>
            <h1 style={{ ...SERIF, fontSize: 'clamp(26px, 5vw, 34px)', fontWeight: 700, margin: 0 }}>Write a story</h1>
          </div>
          <p style={{ fontSize: 15, color: T.inkLight, lineHeight: 1.6, maxWidth: 640, margin: 0 }}>
            Share news, a field report or a how-to guide with your community. An editor reviews every story before it goes live,
            and readers can <strong style={{ color: T.goldLight }}>tip published stories in KES</strong>.
          </p>
        </header>

        {/* How it works */}
        <ol className="ws-steps" style={{ listStyle: 'none', padding: 0, margin: '0 0 26px' }}>
          {[
            { icon: PenLine, t: 'Write', d: 'Title and story' },
            { icon: Sparkles, t: 'Check', d: 'Free AI check' },
            { icon: Send, t: 'Submit', d: 'Send to editor' },
            { icon: Coins, t: 'Go live', d: 'Readers can tip' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <li key={s.t} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.hairline}` }}>
                <span style={{ ...MONO, width: 26, height: 26, borderRadius: '50%', background: 'rgba(200,155,60,0.16)', color: T.goldLight, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 700 }}><Icon size={13} color={T.goldLight} />{s.t}</span>
                  <span style={{ display: 'block', fontSize: 11.5, color: T.inkLight }}>{s.d}</span>
                </span>
              </li>
            );
          })}
        </ol>

        {!authenticated ? (
          <section style={{ ...card, textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ ...SERIF, fontSize: 24, fontWeight: 600, margin: 0 }}>Sign in to start writing</p>
            <p style={{ color: T.inkLight, margin: '10px auto 24px', maxWidth: 420, lineHeight: 1.6 }}>
              We only need your email. Reading stories never needs an account or a wallet.
            </p>
            <button onClick={() => { signInWithEmail(); }} className="ws-btn" style={{ ...btnPrimary, margin: '0 auto' }}>
              Continue with email
            </button>
          </section>
        ) : (
          <>
            {/* Your stories */}
            {drafts.length > 0 && (
              <section style={{ marginBottom: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <p style={sectionLabel}>Your stories</p>
                  <button onClick={newStory} style={{ ...btnGhost, padding: '6px 12px', fontSize: 12.5 }}><Plus size={14} /> New story</button>
                </div>
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                  {drafts.map(d => {
                    const info = STATUS_INFO[d.status];
                    const active = postId === d.id;
                    return (
                      <button key={d.id} onClick={() => openDraft(d)} style={{
                        border: `1px solid ${active ? T.gold : T.hairline}`, background: active ? T.card : 'rgba(255,255,255,0.02)',
                        borderRadius: 12, padding: '12px 14px', cursor: 'pointer', textAlign: 'left', minWidth: 210, maxWidth: 240, fontFamily: 'inherit', color: T.paper,
                      }}>
                        <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, marginBottom: 6, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{d.title || 'Untitled'}</span>
                        <span style={{ ...MONO, fontSize: 10.5, fontWeight: 600, color: info.color }}>{info.label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            <div className="ws-grid">
              {/* Writing area */}
              <section style={{ ...card, padding: '22px 22px 18px' }}>
                {!editable && status && (
                  <p style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: STATUS_INFO[status].color, background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: '10px 12px', margin: '0 0 16px' }}>
                    <Lock size={14} style={{ marginTop: 2, flexShrink: 0 }} /> {STATUS_INFO[status].note}
                  </p>
                )}

                {editorNote && (status === 'CHANGES_REQUESTED' || status === 'REJECTED') && (
                  <div style={{ borderRadius: 12, padding: '12px 14px', margin: '0 0 16px', background: 'rgba(200,155,60,0.10)', border: `1px solid ${T.gold}55` }}>
                    <p style={{ ...MONO, fontSize: 10.5, letterSpacing: 1.2, textTransform: 'uppercase', color: T.goldLight, fontWeight: 600, margin: '0 0 4px' }}>Note from the editor</p>
                    <p style={{ fontSize: 14, lineHeight: 1.55, margin: 0, whiteSpace: 'pre-wrap' }}>{editorNote}</p>
                  </div>
                )}

                <label style={fieldLabel} htmlFor="ws-title">Title</label>
                <input id="ws-title" className="ws-field" value={title} onChange={e => edit(setTitle)(e.target.value)} disabled={!editable}
                  placeholder="A clear, honest headline" maxLength={140}
                  style={{ ...field, ...SERIF, fontSize: 22, fontWeight: 600, padding: '12px 14px' }} />

                <label style={{ ...fieldLabel, marginTop: 16 }} htmlFor="ws-summary">
                  Short summary <span style={optional}>optional, shown in the story list</span>
                </label>
                <textarea id="ws-summary" className="ws-field" value={summary} onChange={e => edit(setSummary)(e.target.value)} disabled={!editable}
                  rows={2} maxLength={280} placeholder="One or two sentences that make people want to read more"
                  style={{ ...field, resize: 'vertical', minHeight: 60 }} />

                <label style={{ ...fieldLabel, marginTop: 16 }} htmlFor="ws-body">Your story</label>
                <textarea id="ws-body" className="ws-field" value={body} onChange={e => edit(setBody)(e.target.value)} disabled={!editable}
                  rows={16} placeholder={'Write your story here.\n\nLeave an empty line between paragraphs.'}
                  style={{ ...field, resize: 'vertical', minHeight: 320, lineHeight: 1.75, fontSize: 15 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, ...MONO, fontSize: 11, color: T.inkLight }}>
                  <span>{words} words · about {readMins} min read</span>
                  <span style={{ color: dirty ? T.gold : T.inkLight }}>{dirty ? 'Unsaved changes' : postId ? 'All changes saved' : 'Not saved yet'}</span>
                </div>

                {/* AI check results */}
                {aiReport && (
                  <div style={{ marginTop: 22, border: `1px solid ${T.hairline}`, borderRadius: 14, padding: '18px 18px 8px', background: 'rgba(0,0,0,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                      <Sparkles size={16} color={T.goldLight} />
                      <p style={{ ...SERIF, fontSize: 18, fontWeight: 600, margin: 0 }}>AI check results</p>
                      <span style={{ marginLeft: 'auto', ...MONO, fontSize: 12, fontWeight: 700, color: aiReport.score >= 75 ? T.pineLight : aiReport.score >= 50 ? T.gold : T.clay }}>
                        {aiReport.score}/100 ready
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: T.inkLight, margin: '0 0 8px', lineHeight: 1.5 }}>{aiReport.summary}</p>
                    {aiReport.checks.map(c => (
                      <div key={c.code} style={{ display: 'flex', gap: 10, padding: '9px 0', borderTop: `1px solid ${T.hairline}` }}>
                        {c.status === 'FAIL' ? <X size={15} color={T.clay} style={{ marginTop: 2, flexShrink: 0 }} />
                          : c.status === 'WARN' ? <AlertTriangle size={15} color={T.gold} style={{ marginTop: 2, flexShrink: 0 }} />
                          : <Check size={15} color={T.pineLight} style={{ marginTop: 2, flexShrink: 0 }} />}
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>{c.label}</p>
                          <p style={{ fontSize: 12, color: T.inkLight, margin: '2px 0 0', lineHeight: 1.5 }}>{c.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Sidebar: details + next steps */}
              <aside className="ws-side">
                <section style={card}>
                  <p style={sectionLabel}>Story details</p>
                  <label style={fieldLabel} htmlFor="ws-type">Type</label>
                  <select id="ws-type" className="ws-field" value={contentType} onChange={e => edit(setContentType)(e.target.value as SihuContentType)} disabled={!editable} style={field}>
                    {CONTENT_TYPES.map(t => <option key={t.id} value={t.id} style={{ color: T.ink }}>{t.label}</option>)}
                  </select>
                  <label style={{ ...fieldLabel, marginTop: 12 }} htmlFor="ws-cat">Topic</label>
                  <select id="ws-cat" className="ws-field" value={category} onChange={e => edit(setCategory)(e.target.value)} disabled={!editable} style={field}>
                    {CATEGORIES.map(c => <option key={c.id} value={c.id} style={{ color: T.ink }}>{c.label}</option>)}
                  </select>
                  <label style={{ ...fieldLabel, marginTop: 12 }} htmlFor="ws-lang">Language</label>
                  <select id="ws-lang" className="ws-field" value={language} onChange={e => edit(setLanguage)(e.target.value)} disabled={!editable} style={field}>
                    <option value="EN" style={{ color: T.ink }}>English</option>
                    <option value="SW" style={{ color: T.ink }}>Swahili</option>
                  </select>
                  <label style={{ ...fieldLabel, marginTop: 12 }} htmlFor="ws-tags">Tags <span style={optional}>optional</span></label>
                  <input id="ws-tags" className="ws-field" value={tags} onChange={e => edit(setTags)(e.target.value)} disabled={!editable}
                    placeholder="e.g. Nursery, Water, Bamboo" style={field} />
                </section>

                <section style={card}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <p style={{ ...sectionLabel, margin: 0 }}>Next steps</p>
                    {status && (
                      <span style={{ ...MONO, fontSize: 10.5, fontWeight: 700, color: STATUS_INFO[status].color, border: `1px solid ${STATUS_INFO[status].color}55`, padding: '2px 8px', borderRadius: 999 }}>
                        {STATUS_INFO[status].label}
                      </span>
                    )}
                  </div>

                  <Step n={1} done={step1} title="Save your draft" hint="Keep your work. Only you can see it." />
                  <Step n={2} done={step2} title="Run the free AI check" hint="Finds missing sources, copied text and unclear claims." />
                  <Step n={3} done={step3} title="Submit to the editor" hint="A person reviews it. The AI never publishes on its own." />

                  {msg && (
                    <p role={msg.kind === 'err' ? 'alert' : 'status'} style={{
                      fontSize: 12.5, display: 'flex', alignItems: 'flex-start', gap: 7, margin: '12px 0 0', lineHeight: 1.5,
                      color: msg.kind === 'ok' ? T.pineLight : msg.kind === 'err' ? T.clay : T.gold,
                    }}>
                      {msg.kind === 'err' ? <X size={14} style={{ marginTop: 2, flexShrink: 0 }} /> : <Info size={14} style={{ marginTop: 2, flexShrink: 0 }} />}
                      {msg.text}
                    </p>
                  )}

                  {editable ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
                      <button onClick={submit} disabled={busy !== null} className="ws-btn" style={btnPrimary}>
                        {busy === 'submit' ? 'Sending...' : <><Send size={15} /> Submit to editor</>}
                      </button>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <button onClick={aiCheck} disabled={busy !== null} className="ws-btn" style={btnGhost}>
                          {busy === 'ai' ? 'Checking...' : <><Sparkles size={14} /> AI check</>}
                        </button>
                        <button onClick={save} disabled={busy !== null} className="ws-btn" style={btnGhost}>
                          {busy === 'save' ? 'Saving...' : <><Save size={14} /> Save draft</>}
                        </button>
                      </div>
                      <p style={{ fontSize: 11.5, color: T.inkLight, margin: '4px 0 0', lineHeight: 1.5 }}>
                        The AI check and Submit save your latest changes first.
                      </p>
                    </div>
                  ) : (
                    <button onClick={newStory} className="ws-btn" style={{ ...btnPrimary, marginTop: 14, width: '100%' }}>
                      <Plus size={15} /> Write another story
                    </button>
                  )}
                </section>

                <p style={{ display: 'flex', gap: 8, fontSize: 12, color: T.inkLight, lineHeight: 1.5, margin: '0 4px' }}>
                  <ShieldCheck size={15} color={T.goldLight} style={{ flexShrink: 0, marginTop: 1 }} />
                  Write what you saw or know. Name your sources, and say if AI helped you write.
                </p>
              </aside>
            </div>

            {drafts.length === 0 && postId === null && (
              <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: T.inkLight, marginTop: 18 }}>
                <FileText size={14} /> Once you save, your stories are listed at the top of this page so you can come back to them.
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function Step({ n, done, title, hint }: { n: number; done: boolean; title: string; hint: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, padding: '8px 0' }}>
      <span style={{
        ...MONO, width: 22, height: 22, borderRadius: '50%', flexShrink: 0, fontSize: 11, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: done ? T.pineLight : 'rgba(255,255,255,0.06)', color: done ? T.paper : T.inkLight,
      }}>
        {done ? <Check size={12} /> : n}
      </span>
      <span>
        <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: done ? T.paper : T.paperDim }}>{title}</span>
        <span style={{ display: 'block', fontSize: 11.5, color: T.inkLight, lineHeight: 1.45 }}>{hint}</span>
      </span>
    </div>
  );
}

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.025)', border: `1px solid ${T.hairline}`, borderRadius: 16, padding: '18px 18px',
};
const field: React.CSSProperties = {
  width: '100%', background: 'rgba(0,0,0,0.25)', border: `1px solid ${T.hairline}`,
  borderRadius: 10, padding: '11px 13px', fontSize: 14, color: T.paper,
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
};
const fieldLabel: React.CSSProperties = { display: 'block', fontSize: 12.5, fontWeight: 600, color: T.paperDim, margin: '0 0 6px' };
const optional: React.CSSProperties = { fontWeight: 400, color: T.inkLight, marginLeft: 4 };
const sectionLabel: React.CSSProperties = { ...MONO, fontSize: 10.5, letterSpacing: 1.3, textTransform: 'uppercase', color: T.goldLight, fontWeight: 600, margin: '0 0 12px' };
const topLink: React.CSSProperties = { ...MONO, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: T.goldLight, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 };
const btnPrimary: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 20px', borderRadius: 10,
  border: 'none', cursor: 'pointer', background: T.gold, color: T.ink, fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
};
const btnGhost: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px 12px', borderRadius: 10,
  border: `1px solid ${T.hairline}`, cursor: 'pointer', background: 'transparent', color: T.goldLight, fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
};
