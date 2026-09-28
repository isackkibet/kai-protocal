'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Check, X, AlertTriangle, RefreshCw, Sparkles, Loader,
  ShieldCheck, ChevronDown, ChevronUp, Inbox, Lock, PenLine, Send, MessageSquare,
} from 'lucide-react';
import { usePrivyAuth } from '@/lib/privy-auth';
import { HUB_THEME, MONO, SERIF } from '@/lib/hub-theme';
import type { ContentPost } from '@/lib/sihu-types';

const T = HUB_THEME;

const STATUS_LABEL: Partial<Record<ContentPost['status'], { label: string; color: string }>> = {
  SUBMITTED:         { label: 'Waiting for review', color: T.goldLight },
  CHANGES_REQUESTED: { label: 'Sent back for changes', color: T.gold },
  APPROVED:          { label: 'Approved', color: T.pineLight },
};
const VERDICT: Record<string, { label: string; color: string }> = {
  READY:     { label: 'Looks ready', color: T.pineLight },
  REVISE:    { label: 'Needs small fixes', color: T.gold },
  NOT_READY: { label: 'Needs work', color: T.clay },
};
const humanize = (t: string) => (t ? t.charAt(0) + t.slice(1).toLowerCase().replace(/_/g, ' ') : '');

type Decision = 'PUBLISH' | 'REJECT' | 'REQUIRE_CHANGES';

export default function ReviewPage() {
  const { authenticated, ready, signInWithEmail, getAccessToken } = usePrivyAuth();
  // Sign-in can be slow to report ready (the wallet layer loads last). Stop
  // waiting after a moment so people never stare at a blank page.
  const [waitedEnough, setWaitedEnough] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setWaitedEnough(true), 1800);
    return () => clearTimeout(t);
  }, []);
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notEditor, setNotEditor] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [confirmReject, setConfirmReject] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const load = useCallback(async (isStale: () => boolean = () => false) => {
    const t = await getAccessToken();
    if (!t || isStale()) return;
    setLoading(true);
    try {
      const r = await fetch('/api/hub/editor', { headers: { Authorization: `Bearer ${t}` } });
      const d = await r.json();
      if (isStale()) return;
      if (r.status === 403 && d.notEditor) { setNotEditor(true); setPosts([]); }
      else if (r.ok) { setNotEditor(false); setPosts(d.posts ?? []); }
      else setMsg({ kind: 'err', text: d.error ?? 'Could not load the stories waiting for review.' });
    } catch {
      if (!isStale()) setMsg({ kind: 'err', text: 'Could not reach the server. Check your connection and refresh.' });
    } finally {
      if (!isStale()) { setLoading(false); setLoaded(true); }
    }
  }, [getAccessToken]);

  useEffect(() => {
    if (!authenticated) return;
    let stale = false;
    const id = setTimeout(() => { void load(() => stale); }, 0);
    return () => { stale = true; clearTimeout(id); };
  }, [authenticated, load]);

  const decide = async (post: ContentPost, decision: Decision) => {
    const note = notes[post.id]?.trim();
    if ((decision === 'REJECT' || decision === 'REQUIRE_CHANGES') && !note) {
      setMsg({ kind: 'err', text: 'Write a short note first so the writer knows what to fix.' });
      return;
    }
    if (decision === 'REJECT' && confirmReject !== post.id) { setConfirmReject(post.id); return; }
    setBusy(post.id); setMsg(null); setConfirmReject(null);
    try {
      const t = await getAccessToken();
      const r = await fetch(`/api/hub/editor/${post.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: t ? `Bearer ${t}` : '' },
        body: JSON.stringify({ decision, note: note || undefined }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'The decision could not be saved.');
      setNotes(n => { const nxt = { ...n }; delete nxt[post.id]; return nxt; });
      setMsg({
        kind: 'ok',
        text: decision === 'PUBLISH' ? `"${post.title}" is now live.`
          : decision === 'REQUIRE_CHANGES' ? `"${post.title}" was sent back to the writer with your note.`
          : `"${post.title}" was not accepted. The writer can see your note.`,
      });
      void load();
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message.slice(0, 200) : 'The decision could not be saved.' });
    } finally { setBusy(null); }
  };

  if (!ready && !waitedEnough) {
    return (
      <main style={{ minHeight: '100dvh', background: T.bg, color: T.inkLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Sans', sans-serif" }}>
        Loading...
      </main>
    );
  }const waiting = posts.filter(p => p.status === 'SUBMITTED').length;

  return (
    <main style={{ minHeight: '100dvh', background: T.bg, color: T.paper, fontFamily: "'IBM Plex Sans', sans-serif", paddingBottom: 110 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..700&family=IBM+Plex+Mono:wght@500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
        .ed-wrap { max-width: 920px; margin: 0 auto; padding: 0 24px; }
        .ed-rules { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .ed-actions { display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 8px; }
        .ed-btn:disabled { opacity: 0.55; cursor: default; }
        .spin { animation: ed-spin 0.9s linear infinite; } @keyframes ed-spin { to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          .ed-wrap { padding: 0 16px; }
          .ed-rules, .ed-actions { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="ed-wrap">
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 0 18px', gap: 12 }}>
          <Link href="/hub" style={topLink}><ArrowLeft size={14} /> Info Hub</Link>
          <Link href="/hub/create" style={topLink}><PenLine size={13} /> Write a story</Link>
        </nav>

        <header style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
          <span style={{ width: 40, height: 40, borderRadius: 12, background: T.gold, color: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ShieldCheck size={19} />
          </span>
          <div style={{ flex: 1, minWidth: 220 }}>
            <h1 style={{ ...SERIF, fontSize: 'clamp(26px, 5vw, 32px)', fontWeight: 700, margin: 0 }}>Editor desk</h1>
            <p style={{ fontSize: 14.5, color: T.inkLight, lineHeight: 1.6, margin: '6px 0 0', maxWidth: 600 }}>
              Stories sent by writers wait here. Read each one, look at the AI check, then decide. Nothing goes live until an editor publishes it.
            </p>
          </div>
          {authenticated && !notEditor && (
            <button onClick={() => void load()} className="ed-btn" disabled={loading} style={btnGhost}>
              <RefreshCw size={13} className={loading ? 'spin' : undefined} /> Refresh
            </button>
          )}
        </header>

        {/* The three choices, explained once */}
        <ul className="ed-rules" style={{ listStyle: 'none', padding: 0, margin: '0 0 24px' }}>
          {[
            { icon: Send, color: T.pineLight, t: 'Publish', d: 'The story goes live for everyone to read and tip.' },
            { icon: MessageSquare, color: T.gold, t: 'Ask for changes', d: 'The writer gets your note, fixes it and sends it again.' },
            { icon: X, color: T.clay, t: 'Reject', d: 'The story is not published. Your note tells the writer why.' },
          ].map(r => {
            const Icon = r.icon;
            return (
              <li key={r.t} style={{ display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.hairline}` }}>
                <Icon size={16} color={r.color} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>
                  <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700 }}>{r.t}</span>
                  <span style={{ display: 'block', fontSize: 12, color: T.inkLight, lineHeight: 1.45 }}>{r.d}</span>
                </span>
              </li>
            );
          })}
        </ul>

        {msg && (
          <p role={msg.kind === 'err' ? 'alert' : 'status'} style={{
            display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13.5, lineHeight: 1.5, margin: '0 0 16px', padding: '10px 14px', borderRadius: 10,
            color: msg.kind === 'ok' ? T.pineLight : T.clay, background: 'rgba(0,0,0,0.25)',
          }}>
            {msg.kind === 'ok' ? <Check size={15} style={{ marginTop: 2, flexShrink: 0 }} /> : <AlertTriangle size={15} style={{ marginTop: 2, flexShrink: 0 }} />}
            {msg.text}
          </p>
        )}

        {!authenticated ? (
          <section style={{ ...card, textAlign: 'center', padding: '44px 24px' }}>
            <Lock size={22} color={T.goldLight} style={{ margin: '0 auto' }} />
            <p style={{ ...SERIF, fontSize: 22, fontWeight: 600, margin: '10px 0 6px' }}>Editors, please sign in</p>
            <p style={{ color: T.inkLight, margin: '0 auto 22px', maxWidth: 420, lineHeight: 1.6 }}>Only SIHU editors can review stories. Writers can follow their own stories on the Write a story page.</p>
            <button onClick={() => { signInWithEmail(); }} className="ed-btn" style={{ ...btnPrimary, margin: '0 auto' }}>Continue with email</button>
          </section>
        ) : notEditor ? (
          <section style={{ ...card, textAlign: 'center', padding: '44px 24px' }}>
            <Lock size={22} color={T.goldLight} style={{ margin: '0 auto' }} />
            <p style={{ ...SERIF, fontSize: 22, fontWeight: 600, margin: '10px 0 6px' }}>This desk is for editors</p>
            <p style={{ color: T.inkLight, margin: '0 auto 22px', maxWidth: 440, lineHeight: 1.6 }}>
              Your account is not on the SIHU editor list. To become an editor, ask a SIHU admin to add your email.
              You can still write stories and follow them from your writing page.
            </p>
            <Link href="/hub/create" style={{ ...btnPrimary, textDecoration: 'none', margin: '0 auto' }}><PenLine size={15} /> Write a story</Link>
          </section>
        ) : !loaded ? (
          <section style={{ ...card, textAlign: 'center', padding: '44px 24px', color: T.inkLight }}>
            <Loader size={20} className="spin" style={{ margin: '0 auto' }} /> <p style={{ margin: '10px 0 0' }}>Loading stories...</p>
          </section>
        ) : posts.length === 0 ? (
          <section style={{ ...card, textAlign: 'center', padding: '44px 24px' }}>
            <Inbox size={24} color={T.goldLight} style={{ margin: '0 auto' }} />
            <p style={{ ...SERIF, fontSize: 22, fontWeight: 600, margin: '10px 0 6px' }}>All caught up</p>
            <p style={{ color: T.inkLight, margin: 0, lineHeight: 1.6 }}>No stories are waiting. New ones appear here with their AI check attached.</p>
          </section>
        ) : (
          <>
            <p style={{ ...MONO, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: T.goldLight, fontWeight: 600, margin: '0 0 12px' }}>
              {waiting} waiting for review{posts.length > waiting ? ` · ${posts.length - waiting} other` : ''}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {posts.map(post => {
                const isOpen = !!open[post.id];
                const report = post.aiReport;
                const st = STATUS_LABEL[post.status] ?? { label: humanize(post.status), color: T.inkLight };
                const verdict = report ? VERDICT[report.verdict] ?? { label: humanize(report.verdict), color: T.inkLight } : null;
                const isBusy = busy === post.id;
                return (
                  <article key={post.id} style={{ ...card, padding: '20px 20px 18px' }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ ...MONO, fontSize: 10.5, fontWeight: 700, color: st.color, border: `1px solid ${st.color}55`, padding: '2px 8px', borderRadius: 999 }}>{st.label}</span>
                      <span style={{ ...MONO, fontSize: 10.5, color: T.inkLight }}>{humanize(post.contentType)} · {humanize(post.category)} · {post.language === 'SW' ? 'Swahili' : 'English'}</span>
                    </div>
                    <h2 style={{ ...SERIF, fontSize: 22, fontWeight: 600, margin: '0 0 4px', lineHeight: 1.3 }}>{post.title}</h2>
                    <p style={{ fontSize: 13, color: T.inkLight, margin: 0 }}>
                      By <strong style={{ color: T.paperDim }}>{post.creatorName}</strong>
                      {post.tags.length > 0 && <> · {post.tags.join(', ')}</>}
                    </p>

                    {/* The story itself */}
                    <div style={{ position: 'relative', marginTop: 12 }}>
                      <p style={{ fontSize: 14.5, color: 'rgba(246,242,231,0.82)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap', maxHeight: isOpen ? 'none' : 120, overflow: 'hidden' }}>
                        {post.body}
                      </p>
                      {!isOpen && <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 48, background: 'linear-gradient(transparent, #0f2419)' }} />}
                    </div>
                    <button onClick={() => setOpen(o => ({ ...o, [post.id]: !isOpen }))} style={{ ...linkBtn, marginTop: 8 }}>
                      {isOpen ? <><ChevronUp size={15} /> Show less</> : <><ChevronDown size={15} /> Read the full story and AI check</>}
                    </button>

                    {/* AI check */}
                    {report ? (
                      <div style={{ marginTop: 12, border: `1px solid ${T.hairline}`, borderRadius: 12, padding: '12px 14px', background: 'rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <Sparkles size={14} color={T.goldLight} />
                          <span style={{ fontSize: 13, fontWeight: 700 }}>AI check</span>
                          <span style={{ ...MONO, fontSize: 11, fontWeight: 700, color: verdict!.color }}>{verdict!.label} · {report.score}/100</span>
                        </div>
                        {isOpen && (
                          <div style={{ marginTop: 8 }}>
                            <p style={{ fontSize: 12.5, color: T.inkLight, lineHeight: 1.55, margin: '0 0 6px' }}>{report.summary}</p>
                            {report.checks.map(c => (
                              <div key={c.code} style={{ display: 'flex', gap: 10, padding: '7px 0', borderTop: `1px solid ${T.hairline}` }}>
                                {c.status === 'FAIL' ? <X size={14} color={T.clay} style={{ marginTop: 2, flexShrink: 0 }} />
                                  : c.status === 'WARN' ? <AlertTriangle size={14} color={T.gold} style={{ marginTop: 2, flexShrink: 0 }} />
                                  : <Check size={14} color={T.pineLight} style={{ marginTop: 2, flexShrink: 0 }} />}
                                <div>
                                  <b style={{ fontSize: 12.5 }}>{c.label}</b>
                                  <p style={{ fontSize: 12, color: T.inkLight, margin: '1px 0 0', lineHeight: 1.45 }}>{c.detail}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p style={{ fontSize: 12.5, color: T.inkLight, margin: '12px 0 0' }}>The writer did not run the AI check. Read carefully before deciding.</p>
                    )}

                    {/* Decision */}
                    <label htmlFor={`note-${post.id}`} style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: T.paperDim, margin: '16px 0 6px' }}>
                      Note to the writer <span style={{ fontWeight: 400, color: T.inkLight }}>needed if you ask for changes or reject</span>
                    </label>
                    <textarea id={`note-${post.id}`} rows={2} value={notes[post.id] ?? ''}
                      onChange={e => setNotes(n => ({ ...n, [post.id]: e.target.value }))}
                      placeholder="e.g. Please add where and when this happened, and who you spoke to."
                      style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.25)', border: `1px solid ${T.hairline}`, borderRadius: 10, padding: '10px 12px', fontSize: 13.5, color: T.paper, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} />

                    <div className="ed-actions" style={{ marginTop: 10 }}>
                      <button onClick={() => decide(post, 'PUBLISH')} disabled={isBusy} className="ed-btn" style={{ ...btnPrimary, background: T.pineLight, color: T.paper }}>
                        {isBusy ? <Loader size={14} className="spin" /> : <Send size={14} />} Publish
                      </button>
                      <button onClick={() => decide(post, 'REQUIRE_CHANGES')} disabled={isBusy} className="ed-btn" style={{ ...btnGhost, color: T.goldLight, borderColor: T.gold }}>
                        <MessageSquare size={14} /> Ask for changes
                      </button>
                      <button onClick={() => decide(post, 'REJECT')} disabled={isBusy} className="ed-btn" style={{
                        ...btnGhost, color: confirmReject === post.id ? T.paper : T.clay, borderColor: T.clay,
                        background: confirmReject === post.id ? T.clay : 'transparent',
                      }}>
                        <X size={14} /> {confirmReject === post.id ? 'Tap again to reject' : 'Reject'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.025)', border: `1px solid ${T.hairline}`, borderRadius: 16, padding: '18px 18px',
};
const topLink: React.CSSProperties = { ...MONO, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: T.goldLight, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 };
const btnPrimary: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 18px', borderRadius: 10,
  border: 'none', cursor: 'pointer', background: T.gold, color: T.ink, fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
};
const btnGhost: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px 14px', borderRadius: 10,
  border: `1px solid ${T.hairline}`, cursor: 'pointer', background: 'transparent', color: T.goldLight, fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
};
const linkBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', padding: 0, cursor: 'pointer',
  color: T.goldLight, fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
};
