'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, PenLine, Check, AlertTriangle, X, Sparkles, Send,
  RotateCcw, Info, ShieldAlert,
} from 'lucide-react';
import { usePrivyAuth } from '@/lib/privy-auth';
import { HUB_THEME, labelStyle, MONO, SERIF, SANS } from '@/lib/hub-theme';
import type { AiReviewReport, ContentPost, PostDraftInput, SihuContentType } from '@/lib/sihu-types';

const CONTENT_TYPES: { id: SihuContentType; label: string }[] = [
  { id: 'ARTICLE', label: 'Article' },
  { id: 'FIELD_JOURNAL', label: 'Field journal' },
  { id: 'EDUCATIONAL_GUIDE', label: 'Educational guide' },
  { id: 'NEWS_UPDATE', label: 'News / update' },
  { id: 'CONSERVATION_IMPACT', label: 'Conservation impact' },
  { id: 'MARKET_NEWS', label: 'Market news' },
  { id: 'AUDIO_PODCAST', label: 'Podcast' },
  { id: 'REPORT', label: 'Report' },
];

const CATEGORIES = ['FORESTRY_MRV', 'CONSERVATION', 'CLIMATE', 'MSME_GROWTH', 'CHAMA_SAVINGS', 'AGRI_MARKET', 'COMMUNITY'];

const STATUS_STEPS: { status: ContentPost['status']; label: string }[] = [
  { status: 'DRAFT', label: 'Draft' },
  { status: 'SUBMITTED', label: 'Submitted' },
  { status: 'CHANGES_REQUESTED', label: 'Changes requested' },
  { status: 'APPROVED', label: 'Approved' },
  { status: 'PUBLISHED', label: 'Published' },
];

export default function CreatePage() {
  const { authenticated, ready, signInWithEmail, getAccessToken } = usePrivyAuth();

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
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err' | 'warn'; text: string } | null>(null);
  const [drafts, setDrafts] = useState<ContentPost[]>([]);

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
      setDrafts(d.posts ?? []);
    } catch { /* ignore */ }
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
      } catch { /* ignore */ }
    })();
  }, [authenticated, getAccessToken]);

  const payload = (): PostDraftInput => ({
    title,
    summary,
    body,
    contentType,
    category,
    language,
    tags: tags.split(',').map(t => t.trim()).filter(Boolean),
  });

  const save = async () => {
    if (!title.trim() || !body.trim()) {
      setMsg({ kind: 'err', text: 'Title and body are required.' });
      return;
    }
    setBusy('save');
    setMsg(null);
    try {
      const b = await bearer();
      const url = postId
        ? `/api/hub/articles/manage/${postId}`
        : '/api/hub/articles';
      const r = await fetch(url, {
        method: postId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: b },
        body: JSON.stringify(payload()),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Could not save');
      setPostId(d.post.id);
      setStatus(d.post.status);
      setMsg({ kind: 'ok', text: postId ? 'Draft updated.' : 'Draft created. You can run an AI pre-check before submitting.' });
      loadMine();
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message.slice(0, 200) : 'Save failed.' });
    } finally { setBusy(null); }
  };

  const aiCheck = async () => {
    if (!postId) {
      setMsg({ kind: 'warn', text: 'Save a draft first, then run the AI pre-check.' });
      return;
    }
    setBusy('ai');
    setMsg(null);
    try {
      const b = await bearer();
      const r = await fetch(`/api/hub/articles/manage/${postId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: b },
        body: JSON.stringify({ action: 'preview' }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Pre-check failed.');
      setAiReport(d.report);
      setStatus(d.post.status);
      setMsg({ kind: 'ok', text: 'AI pre-review complete — the editor makes the final decision.' });
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message.slice(0, 200) : 'Pre-check failed.' });
    } finally { setBusy(null); }
  };

  const submit = async () => {
    if (!postId) {
      setMsg({ kind: 'warn', text: 'Save the draft first, then submit for review.' });
      return;
    }
    setBusy('submit');
    setMsg(null);
    try {
      const b = await bearer();
      const r = await fetch(`/api/hub/articles/manage/${postId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: b },
        body: JSON.stringify({ action: 'submit' }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Could not submit.');
      setStatus(d.post.status);
      setMsg({ kind: 'ok', text: 'Submitted for editorial review. An editor will publish it — the AI never publishes alone.' });
      loadMine();
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message.slice(0, 200) : 'Submit failed.' });
    } finally { setBusy(null); }
  };

  const selectDraft = (d: ContentPost) => {
    setPostId(d.id);
    setTitle(d.title);
    setSummary(d.summary ?? '');
    setBody(d.body);
    setContentType(d.contentType);
    setCategory(d.category);
    setLanguage(d.language);
    setTags(d.tags.join(', '));
    setStatus(d.status);
    setAiReport(d.aiReport);
  };

  const statusIdx = status ? STATUS_STEPS.findIndex(s => s.status === status) : -1;

  if (!ready) {
    return <main style={{ minHeight: '100dvh', background: HUB_THEME.bg, color: HUB_THEME.paper }} />;
  }

  return (
    <main style={{ minHeight: '100dvh', background: HUB_THEME.bg, color: HUB_THEME.paper, fontFamily: "'IBM Plex Sans', sans-serif", paddingBottom: 90 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@0,9..144,300..700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
      `}</style>
      <style>{`.spin { animation: spin 0.9s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 28px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '30px 0 20px' }}>
          <Link href="/hub" style={{ ...MONO, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: HUB_THEME.goldLight, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={14} /> Back to SIHU
          </Link>
          <Link href="/hub/review" style={{ ...MONO, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: HUB_THEME.goldLight, textDecoration: 'none' }}>
            Editor desk →
          </Link>
        </header>

        <section style={{ borderTop: `1px solid ${HUB_THEME.hairline}`, padding: '36px 0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: HUB_THEME.gold, color: HUB_THEME.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PenLine size={18} />
            </div>
            <div>
              <h1 style={{ ...SERIF, fontSize: 30, fontWeight: 600, margin: 0 }}>Publish on SIHU</h1>
              <p style={{ ...MONO, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: HUB_THEME.inkLight, margin: '4px 0 0' }}>
                CONTRIBUTE → AI PRE-CHECK → EDITOR APPROVAL → PUBLIC PAGE
              </p>
            </div>
          </div>
          <p style={{ ...SANS, fontSize: 15, color: HUB_THEME.inkLight, lineHeight: 1.7, maxWidth: 640, margin: 0 }}>
            Write a story or guide for the community. The AI checks your draft for issues; a human editor makes the publishing decision.
          </p>
        </section>

        {!authenticated ? (
          <section style={{ padding: '70px 0', textAlign: 'center' }}>
            <p style={{ ...SERIF, fontSize: 24, fontWeight: 600 }}>Sign in to contribute</p>
            <p style={{ color: HUB_THEME.inkLight, margin: '10px 0 26px' }}>Email-only sign in — reading and browsing always stay wallet-free.</p>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => { signInWithEmail(); }}
              style={{ padding: '14px 34px', borderRadius: 9, border: 'none', cursor: 'pointer', background: HUB_THEME.gold, color: HUB_THEME.ink, fontWeight: 700, fontSize: 15, fontFamily: 'inherit' }}>
              Sign up with email
            </motion.button>
          </section>
        ) : (
          <>
            {drafts.length > 0 && (
              <section style={{ borderTop: `1px solid ${HUB_THEME.hairline}`, padding: '22px 0' }}>
                <p style={labelStyle()}>Continue a draft or submitted story</p>
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '10px 0' }}>
                  {drafts.map(d => (
                    <motion.button key={d.id} whileTap={{ scale: 0.97 }} onClick={() => selectDraft(d)}
                      style={{ border: `1px solid ${postId === d.id ? HUB_THEME.gold : HUB_THEME.hairline}`, background: postId === d.id ? HUB_THEME.card : 'transparent', borderRadius: 10, padding: '12px 16px', cursor: 'pointer', textAlign: 'left', minWidth: 220, fontFamily: 'inherit' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: HUB_THEME.paper, margin: '0 0 6px' }}>{d.title.slice(0, 44)}</p>
                      <p style={{ ...MONO, fontSize: 10, color: d.status === 'PUBLISHED' ? HUB_THEME.pineLight : d.status === 'SUBMITTED' ? HUB_THEME.goldLight : HUB_THEME.inkLight, margin: 0 }}>
                        {d.status} · {d.category}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </section>
            )}

            {/* Status rail */}
            {status && (
              <section style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '22px 0', borderTop: `1px solid ${HUB_THEME.hairline}` }}>
                {STATUS_STEPS.map((s, i) => (
                  <div key={s.status} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%',
                        background: i <= statusIdx ? HUB_THEME.gold : 'rgba(255,255,255,0.06)',
                        color: i <= statusIdx ? HUB_THEME.ink : HUB_THEME.inkLight,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                      }}>
                        {i < statusIdx ? <Check size={12} /> : i + 1}
                      </div>
                      <span style={{ ...MONO, fontSize: 9, letterSpacing: 0.6, textTransform: 'uppercase', color: i <= statusIdx ? HUB_THEME.paper : HUB_THEME.inkLight, whiteSpace: 'nowrap' }}>
                        {s.label}
                      </span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: i < statusIdx ? HUB_THEME.gold : HUB_THEME.hairline, margin: '0 10px' }} />}
                  </div>
                ))}
              </section>
            )}

            {/* Editor form */}
            <section style={{ borderTop: `1px solid ${HUB_THEME.hairline}`, padding: '28px 0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 18, alignItems: 'start' }}>
                <p style={labelStyle()}>Title</p>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="A clear, honest headline"
                  style={field} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 18, alignItems: 'start', marginTop: 20 }}>
                <p style={labelStyle()}>Summary</p>
                <textarea value={summary} onChange={e => setSummary(e.target.value)} rows={2} placeholder="One or two lines for the feed preview"
                  style={{ ...field, resize: 'vertical', minHeight: 64 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 18, alignItems: 'start', marginTop: 20 }}>
                <p style={labelStyle()}>Body</p>
                <textarea value={body} onChange={e => setBody(e.target.value)} rows={16} placeholder="Write your story. Separate paragraphs with a blank line."
                  style={{ ...field, resize: 'vertical', minHeight: 280, lineHeight: 1.7 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 18, alignItems: 'start', marginTop: 20 }}>
                <p style={labelStyle()}>Type &amp; category</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <select value={contentType} onChange={e => setContentType(e.target.value as SihuContentType)} style={field}>
                    {CONTENT_TYPES.map(t => <option key={t.id} value={t.id} style={{ color: HUB_THEME.ink }}>{t.label}</option>)}
                  </select>
                  <select value={category} onChange={e => setCategory(e.target.value)} style={field}>
                    {CATEGORIES.map(c => <option key={c} value={c} style={{ color: HUB_THEME.ink }}>{c.replaceAll('_', ' ')}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 18, alignItems: 'start', marginTop: 20 }}>
                <p style={labelStyle()}>Tags &amp; language</p>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                  <input value={tags} onChange={e => setTags(e.target.value)} placeholder="Comma separated, e.g. Nursery, Water, Bamboo"
                    style={field} />
                  <select value={language} onChange={e => setLanguage(e.target.value)} style={field}>
                    <option value="EN" style={{ color: HUB_THEME.ink }}>English</option>
                    <option value="SW" style={{ color: HUB_THEME.ink }}>Swahili</option>
                  </select>
                </div>
              </div>

              {/* AI report */}
              <AnimatePresence>
                {aiReport && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ marginTop: 26, border: `1px solid ${HUB_THEME.hairline}`, borderRadius: 12, padding: '22px 24px', background: HUB_THEME.card }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <Sparkles size={17} color={HUB_THEME.goldLight} />
                      <p style={{ ...SERIF, fontSize: 19, fontWeight: 600, margin: 0 }}>AI pre-review report</p>
                      <span style={{ marginLeft: 'auto', ...MONO, fontSize: 11, color: HUB_THEME.goldLight }}>
                        Readiness {aiReport.score}/100
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: HUB_THEME.inkLight, margin: '0 0 14px' }}>{aiReport.summary}</p>
                    {aiReport.checks.map(c => (
                      <div key={c.code} style={{ display: 'flex', gap: 12, padding: '9px 0', borderTop: `1px solid ${HUB_THEME.hairline}` }}>
                        {c.status === 'FAIL' ? <X size={15} color={HUB_THEME.clay} style={{ marginTop: 2 }} />
                          : c.status === 'WARN' ? <AlertTriangle size={15} color={HUB_THEME.gold} style={{ marginTop: 2 }} />
                          : <Check size={15} color={HUB_THEME.pineLight} style={{ marginTop: 2 }} />}
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, margin: 0, color: HUB_THEME.paper }}>{c.label}</p>
                          <p style={{ fontSize: 12, color: HUB_THEME.inkLight, margin: '2px 0 0', lineHeight: 1.5 }}>{c.detail}</p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {msg && (
                <p style={{
                  fontSize: 13, display: 'flex', alignItems: 'flex-start', gap: 8, margin: '18px 0 0',
                  color: msg.kind === 'ok' ? HUB_THEME.pineLight : msg.kind === 'err' ? HUB_THEME.clay : HUB_THEME.gold,
                }}>
                  {msg.kind === 'err' ? <X size={14} style={{ marginTop: 2 }} /> : <Info size={14} style={{ marginTop: 2 }} />}
                  {msg.text}
                </p>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap', alignItems: 'center' }}>
                <motion.button whileTap={{ scale: 0.97 }} onClick={save} disabled={busy !== null}
                  style={{ ...primary, opacity: busy === 'save' ? 0.6 : 1 }}>
                  {busy === 'save' ? 'Saving…' : <><RotateCcw size={14} /> {postId ? 'Save changes' : 'Save draft'}</>}
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={aiCheck} disabled={busy !== null}
                  style={{ ...primary, background: 'transparent', color: HUB_THEME.goldLight, border: `1px solid ${HUB_THEME.hairline}` }}>
                  {busy === 'ai' ? 'Running checks…' : <><Sparkles size={14} /> Run AI pre-check</>}
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={submit} disabled={busy !== null}
                  style={{ ...primary, marginLeft: 'auto' }}>
                  {busy === 'submit' ? 'Submitting…' : <><Send size={14} /> Submit for editorial review</>}
                </motion.button>
              </div>

              <p style={{ ...MONO, fontSize: 10, letterSpacing: 0.8, color: HUB_THEME.inkLight, margin: '18px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldAlert size={12} /> The AI flags and prepares — only a human editor can publish your story.
              </p>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

const field: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${HUB_THEME.hairline}`,
  borderRadius: 9, padding: '12px 14px', fontSize: 14, color: HUB_THEME.paper,
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
};

const primary: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 24px', borderRadius: 9,
  border: 'none', cursor: 'pointer', background: HUB_THEME.gold, color: HUB_THEME.ink,
  fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
};