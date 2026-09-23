'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Check, X, AlertTriangle, RefreshCw, Sparkles,
  Loader, MessageSquareWarning, ChevronDown, ChevronUp,
} from 'lucide-react';
import { usePrivyAuth } from '@/lib/privy-auth';
import { HUB_THEME, labelStyle, MONO, SERIF, SANS } from '@/lib/hub-theme';
import type { ContentPost } from '@/lib/sihu-types';

export default function ReviewPage() {
  const { authenticated, ready, signInWithEmail, getAccessToken } = usePrivyAuth();
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [authMsg, setAuthMsg] = useState('');

  const bearer = async () => {
    const t = await getAccessToken();
    return t ? `Bearer ${t}` : '';
  };

  const load = async () => {
    const b = await bearer();
    if (!b) return;
    setLoading(true);
    try {
      const r = await fetch('/api/hub/editor', { headers: { Authorization: b } });
      const d = await r.json();
      if (r.ok) setPosts(d.posts ?? []);
      else setAuthMsg(d.error ?? 'Could not load the review queue.');
    } catch {
      setAuthMsg('Could not reach the review queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (authenticated) load(); }, [authenticated]);

  const decide = async (post: ContentPost, decision: 'PUBLISH' | 'REJECT' | 'REQUIRE_CHANGES') => {
    setBusy(post.id);
    setAuthMsg('');
    try {
      const b = await bearer();
      const r = await fetch(`/api/hub/editor/${post.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: b },
        body: JSON.stringify({ decision, note: notes[post.id] || undefined }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Decision failed.');
      setNotes(n => { const nxt = { ...n }; delete nxt[post.id]; return nxt; });
      load();
    } catch (e) {
      setAuthMsg(e instanceof Error ? e.message.slice(0, 200) : 'Decision failed.');
    } finally {
      setBusy(null);
    }
  };

  if (!ready) return <main style={{ minHeight: '100dvh', background: HUB_THEME.bg, color: HUB_THEME.paper }} />;

  return (
    <main style={{ minHeight: '100dvh', background: HUB_THEME.bg, color: HUB_THEME.paper, fontFamily: "'IBM Plex Sans', sans-serif", paddingBottom: 90 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@0,9..144,300..700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
      `}</style>
      <style>{`.spin { animation: spin 0.9s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 28px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '30px 0 20px' }}>
          <Link href="/hub" style={{ ...MONO, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: HUB_THEME.goldLight, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={14} /> SIHU
          </Link>
          <Link href="/hub/create" style={{ ...MONO, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: HUB_THEME.goldLight, textDecoration: 'none' }}>
            + Contributor desk
          </Link>
        </header>

        <section style={{ borderTop: `1px solid ${HUB_THEME.hairline}`, padding: '36px 0 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: HUB_THEME.gold, color: HUB_THEME.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquareWarning size={18} />
          </div>
          <div>
            <h1 style={{ ...SERIF, fontSize: 30, fontWeight: 600, margin: 0 }}>Editor desk</h1>
            <p style={{ ...MONO, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: HUB_THEME.inkLight, margin: '4px 0 0' }}>
              HUMAN EDITORIAL AUTHORITY · AI NEVER PUBLISHES
            </p>
          </div>
          <motion.button whileTap={{ scale: 0.94 }} onClick={load}
            style={{ marginLeft: 'auto', background: 'none', border: `1px solid ${HUB_THEME.hairline}`, borderRadius: 999, padding: '9px 16px', cursor: 'pointer', color: HUB_THEME.goldLight, fontFamily: 'inherit', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh queue
          </motion.button>
        </section>

        {!authenticated ? (
          <section style={{ padding: '80px 0', textAlign: 'center' }}>
            <p style={{ ...SERIF, fontSize: 22, fontWeight: 600 }}>Editors sign in to review submissions</p>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => { signInWithEmail(); }}
              style={{ marginTop: 22, padding: '14px 34px', borderRadius: 9, border: 'none', cursor: 'pointer', background: HUB_THEME.gold, color: HUB_THEME.ink, fontWeight: 700, fontSize: 15, fontFamily: 'inherit' }}>
              Sign in with email
            </motion.button>
          </section>
        ) : (
          <>
            {authMsg && <p style={{ fontSize: 13, color: HUB_THEME.clay, margin: '12px 0 0' }}>{authMsg}</p>}

            {posts.length === 0 && !loading ? (
              <section style={{ padding: '90px 0', textAlign: 'center', color: HUB_THEME.inkLight }}>
                <p style={{ ...SERIF, fontSize: 22, fontWeight: 600, color: HUB_THEME.paper }}>Queue is clear</p>
                <p style={{ fontSize: 14 }}>New submissions from contributors land here with their AI pre-review attached.</p>
              </section>
            ) : (
              posts.map((post, i) => {
                const isOpen = expanded === post.id;
                const report = post.aiReport;
                return (
                  <motion.section key={post.id}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    style={{ borderTop: `1px solid ${HUB_THEME.hairline}`, padding: '28px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                          <span style={{ ...MONO, fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', color: HUB_THEME.goldLight }}>{post.contentType.replaceAll('_', ' ')}</span>
                          <span style={{ ...MONO, fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', color: HUB_THEME.inkLight }}>{post.category}</span>
                          <span style={{ ...MONO, fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', color: post.status === 'APPROVED' ? HUB_THEME.pineLight : post.status === 'CHANGES_REQUESTED' ? HUB_THEME.goldLight : HUB_THEME.inkLight }}>{post.status}</span>
                        </div>
                        <h2 style={{ ...SERIF, fontSize: 24, fontWeight: 600, margin: '0 0 8px' }}>{post.title}</h2>
                        <p style={{ fontSize: 13, color: HUB_THEME.inkLight, margin: 0 }}>
                          By {post.creatorName} · {post.language === 'SW' ? 'Swahili' : 'English'} · tags: {post.tags.join(', ') || '—'}
                        </p>
                        <p style={{ fontSize: 14, color: 'rgba(246,242,231,0.7)', lineHeight: 1.6, margin: '12px 0 0', whiteSpace: 'pre-wrap', maxHeight: isOpen ? 320 : 110, overflow: 'hidden' }}>
                          {post.body}
                        </p>

                        {/* AI report card */}
                        {report && (
                          <div style={{ marginTop: 16, border: `1px solid ${HUB_THEME.hairline}`, borderRadius: 10, padding: '16px 18px', background: HUB_THEME.card }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <Sparkles size={14} color={HUB_THEME.goldLight} />
                              <span style={{ ...MONO, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: HUB_THEME.goldLight }}>AI pre-review · {report.score}/100 · {report.verdict}</span>
                              <button onClick={() => setExpanded(isOpen ? null : post.id)}
                                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: HUB_THEME.inkLight, display: 'flex', alignItems: 'center' }}>
                                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                            </div>
                            {isOpen && (
                              <div style={{ marginTop: 10 }}>
                                <p style={{ fontSize: 12, color: HUB_THEME.inkLight, lineHeight: 1.6, margin: '0 0 6px' }}>{report.summary}</p>
                                {report.checks.map(c => (
                                  <div key={c.code} style={{ display: 'flex', gap: 10, padding: '7px 0', borderTop: `1px solid ${HUB_THEME.hairline}` }}>
                                    {c.status === 'FAIL' ? <X size={13} color={HUB_THEME.clay} style={{ marginTop: 2 }} />
                                      : c.status === 'WARN' ? <AlertTriangle size={13} color={HUB_THEME.gold} style={{ marginTop: 2 }} />
                                      : <Check size={13} color={HUB_THEME.pineLight} style={{ marginTop: 2 }} />}
                                    <div>
                                      <b style={{ fontSize: 12, color: HUB_THEME.paper }}>{c.label}</b>
                                      <p style={{ fontSize: 12, color: HUB_THEME.inkLight, margin: '1px 0 0' }}>{c.detail}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Decision area */}
                        <div style={{ display: 'flex', gap: 12, marginTop: 18, flexWrap: 'wrap', alignItems: 'center' }}>
                          <input value={notes[post.id] ?? ''} onChange={e => setNotes(n => ({ ...n, [post.id]: e.target.value }))}
                            placeholder="Editor note to the contributor (optional)"
                            style={{ flex: 1, minWidth: 220, background: 'rgba(255,255,255,0.04)', border: `1px solid ${HUB_THEME.hairline}`, borderRadius: 8, padding: '11px 14px', fontSize: 13, color: HUB_THEME.paper, outline: 'none', fontFamily: 'inherit' }} />
                          <motion.button whileTap={{ scale: 0.96 }} onClick={() => decide(post, 'PUBLISH')} disabled={busy === post.id}
                            style={{ ...decisionBtn, background: HUB_THEME.pineLight, color: HUB_THEME.paper }}>
                            {busy === post.id ? <Loader size={14} className="spin" /> : <Check size={14} />} Approve &amp; publish
                          </motion.button>
                          <motion.button whileTap={{ scale: 0.96 }} onClick={() => decide(post, 'REQUIRE_CHANGES')} disabled={busy === post.id}
                            style={{ ...decisionBtn, background: 'transparent', color: HUB_THEME.goldLight, border: `1px solid ${HUB_THEME.gold}` }}>
                            Request changes
                          </motion.button>
                          <motion.button whileTap={{ scale: 0.96 }} onClick={() => decide(post, 'REJECT')} disabled={busy === post.id}
                            style={{ ...decisionBtn, background: HUB_THEME.clay, color: HUB_THEME.paper }}>
                            Reject
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.section>
                );
              })
            )}
          </>
        )}
      </div>
    </main>
  );
}

const decisionBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 18px', borderRadius: 8,
  border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
};