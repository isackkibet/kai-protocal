'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Bookmark, Flag, Pause, Loader,
  Share2, Mic, DollarSign,
} from 'lucide-react';
import { usePrivyAuth } from '@/lib/privy-auth';
import { HUB_THEME, labelStyle, MONO, SERIF, SANS } from '@/lib/hub-theme';
import type { ContentPost, PostComment } from '@/lib/sihu-types';

function guestKey(): string {
  if (typeof window === 'undefined') return '';
  const KEY = 'sihu-guest-key';
  let k = window.sessionStorage.getItem(KEY);
  if (!k) {
    k = `g-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
    window.sessionStorage.setItem(KEY, k);
  }
  return k;
}

function useAuthHeader() {
  const { authenticated, getAccessToken, email, name } = usePrivyAuth();
  return {
    authenticated,
    email,
    name,
    bearer: async () => {
      if (!authenticated) return undefined;
      const t = await getAccessToken();
      return t ? `Bearer ${t}` : undefined;
    },
  };
}

export default function ArticleEngage({ post }: { post: ContentPost }) {
  const { authenticated, signInWithEmail } = usePrivyAuth();
  const auth = useAuthHeader();
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likesCount);
  const [saved, setSaved] = useState(false);
  const [comments, setComments] = useState<PostComment[]>(post.comments ?? []);
  const [comment, setComment] = useState('');
  const [commentName, setCommentName] = useState(auth.name ?? '');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Misinformation');
  const [reported, setReported] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [tip, setTip] = useState<{ open: boolean; amount: string; email: string; status: string; info: string }>({
    open: false, amount: '100', email: '', status: 'idle', info: '',
  });

  // ── Text-to-speech ("Listen", PRD Part A §5) ─────────────────────
  const [speaking, setSpeaking] = useState(false);
  const speechText = useMemo(() => `${post.title}. ${post.summary ?? ''}. ${post.body}`, [post]);

  const toggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setMsg('Listen is not supported in this browser yet.');
      return;
    }
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(speechText);
    u.lang = post.language === 'SW' ? 'sw-KE' : 'en-KE';
    u.rate = 1;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    synth.cancel();
    synth.speak(u);
    setSpeaking(true);
  };

  useEffect(() => () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  // ── Actions ──────────────────────────────────────────────────────
  const act = async (action: 'like' | 'save' | 'comment' | 'report', extra?: Record<string, unknown>) => {
    setBusy(action);
    setMsg(null);
    try {
      const bearer = await auth.bearer();
      const res = await fetch(`/api/hub/articles/${post.slug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(bearer ? { Authorization: bearer } : {}),
        },
        body: JSON.stringify({
          action,
          name: commentName || auth.name || (authenticated ? undefined : undefined),
          guestKey: guestKey(),
          ...extra,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Request failed');
      if (action === 'like') { setLiked(data.liked); setLikes(data.likesCount); }
      if (action === 'save') { setSaved(data.saved); }
      if (action === 'comment') {
        setComments(c => [...c, data.comment]);
        setComment('');
        setMsg('Comment posted.');
      }
      if (action === 'report') { setReported(true); setReportOpen(false); setMsg('Report filed. Our editors will review it.'); }
    } catch (e) {
      setMsg(e instanceof Error ? e.message.slice(0, 160) : 'Action failed.');
    } finally {
      setBusy(null);
    }
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) { await navigator.share({ title: post.title, url }); return; }
      await navigator.clipboard.writeText(url);
      setMsg('Link copied to clipboard.');
    } catch {
      setMsg('Could not share the link.');
    }
  };

  const startTip = async () => {
    setTip(t => ({ ...t, status: 'paying', info: 'Opening secure payment...' }));
    try {
      const res = await fetch('/api/hub/tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: tip.email,
          amountKes: Math.round(Number(tip.amount)),
          creator: post.creatorName,
          postTitle: post.title,
          slug: post.slug,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment could not be started');
      window.open(data.authorizationUrl, '_blank');
      setTip(t => ({ ...t, status: 'awaiting', info: `Complete payment for KES ${data.amountKes} in the Paystack tab (M-Pesa or card).` }));
      let attempts = 0;
      const id = setInterval(async () => {
        attempts++;
        try {
          const r = await fetch(`/api/paystack/verify?reference=${data.reference}`);
          const poll = await r.json();
          if (poll.status === 'success') {
            clearInterval(id);
            setTip(t => ({ ...t, status: 'done', info: `Tip confirmed! KES ${poll.amountKes?.toLocaleString() ?? data.amountKes} goes to ${post.creatorName}.` }));
          } else if (['failed', 'abandoned'].includes(poll.status)) {
            clearInterval(id);
            setTip(t => ({ ...t, status: 'error', info: `Payment ${poll.status}. You can try again.` }));
          } else if (attempts >= 18) {
            clearInterval(id);
            setTip(t => ({ ...t, status: 'awaiting', info: 'Waiting for confirmation. Check your email for the Paystack receipt.' }));
          }
        } catch { /* ignore */ }
      }, 5000);
    } catch (e) {
      setTip(t => ({ ...t, status: 'error', info: e instanceof Error ? e.message.slice(0, 160) : 'Payment could not be started.' }));
    }
  };

  return (
    <div style={{ marginTop: 26 }}>
      {/* Disclosure line */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 22 }}>
        <span style={{
          ...MONO, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase',
          color: post.aiDisclosure === 'AI_ASSISTED' ? HUB_THEME.clay : HUB_THEME.pineLight,
          border: `1px solid ${post.aiDisclosure === 'AI_ASSISTED' ? 'rgba(156,75,45,0.35)' : HUB_THEME.hairline}`,
          padding: '5px 10px', borderRadius: 999,
        }}>
          {post.aiDisclosure === 'AI_ASSISTED' ? 'AI-assisted — editor-reviewed' : 'Human-authored'}
        </span>
        {post.tags.map(t => (
          <span key={t} style={{ ...MONO, fontSize: 10, color: HUB_THEME.inkLight }}>#{t}</span>
        ))}
      </div>

      {/* Action bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap', borderTop: `1px solid ${HUB_THEME.hairline}`, borderBottom: `1px solid ${HUB_THEME.hairline}`, padding: '18px 0' }}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => act('like')} disabled={busy !== null}
          style={actionBtn} aria-label="Like">
          {busy === 'like' ? <Loader size={16} className="spin" /> :
            <Heart size={16} color={liked ? HUB_THEME.clay : HUB_THEME.goldLight} style={{ fill: liked ? HUB_THEME.clay : 'none' }} />}
          <span style={{ fontSize: 14, fontWeight: 700, color: HUB_THEME.paper }}>{likes}</span>
          <span style={{ ...MONO, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: HUB_THEME.inkLight }}>Like</span>
        </motion.button>

        <motion.button whileTap={{ scale: 0.9 }} onClick={() => act('save')} disabled={busy !== null}
          style={actionBtn} aria-label="Save">
          {busy === 'save' ? <Loader size={16} className="spin" /> :
            <Bookmark size={16} color={saved ? HUB_THEME.gold : HUB_THEME.goldLight} style={{ fill: saved ? HUB_THEME.gold : 'none' }} />}
          <span style={{ fontSize: 14, fontWeight: 700, color: HUB_THEME.paper }}>{saved ? 'Saved' : 'Save'}</span>
        </motion.button>

        <motion.button whileTap={{ scale: 0.9 }} onClick={toggleSpeech} style={actionBtn} aria-label="Listen">
          {speaking ? <Pause size={16} color={HUB_THEME.gold} /> : <Mic size={16} color={HUB_THEME.goldLight} />}
          <span style={{ fontSize: 14, fontWeight: 700, color: HUB_THEME.paper }}>{speaking ? 'Pause' : 'Listen'}</span>
          <span style={{ ...MONO, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: HUB_THEME.inkLight }}>text-to-speech</span>
        </motion.button>

        <motion.button whileTap={{ scale: 0.9 }} onClick={share} style={actionBtn} aria-label="Share">
          <Share2 size={16} color={HUB_THEME.goldLight} />
          <span style={{ fontSize: 14, fontWeight: 700, color: HUB_THEME.paper }}>Share</span>
        </motion.button>

        <motion.button whileTap={{ scale: 0.9 }} onClick={() => { if (!authenticated) { signInWithEmail(); return; } setTip(t => ({ ...t, open: true })); }}
          style={{ ...actionBtn, marginLeft: 'auto', background: HUB_THEME.gold, color: HUB_THEME.ink, borderRadius: 8, padding: '9px 16px' }}>
          <DollarSign size={14} color={HUB_THEME.ink} />
          <span style={{ fontSize: 13, fontWeight: 700 }}>Tip {post.creatorName.split(' ')[0]}</span>
        </motion.button>
      </div>

      {/* Feedbacks */}
      {msg && <p style={{ ...SANS, fontSize: 13, color: HUB_THEME.goldLight, margin: '12px 0 0' }}>{msg}</p>}

      {/* Tip modal */}
      <AnimatePresence>
        {tip.open && (
          <TipCard post={post} tip={tip} setTip={setTip} onStart={startTip} onClose={() => setTip(t => ({ ...t, open: false }))} />
        )}
      </AnimatePresence>

      {/* Comments */}
      <section style={{ marginTop: 34 }}>
        <p style={labelStyle()}>Comments ({comments.length})</p>
        <div style={{ display: 'flex', gap: 10, margin: '14px 0 6px' }}>
          <input value={(authenticated ? auth.name ?? '' : commentName)}
            onChange={e => setCommentName(e.target.value)}
            placeholder="Your name"
            disabled={authenticated}
            style={inputStyle} />
          <input value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Share a thought…"
            style={inputStyle}
            onKeyDown={e => { if (e.key === 'Enter') { if (!authenticated) { signInWithEmail(); return; } act('comment', { text: comment }); } }} />
          <motion.button whileTap={{ scale: 0.95 }}
            onClick={() => { if (!authenticated) { signInWithEmail(); return; } act('comment', { text: comment }); }}
            disabled={busy === 'comment'}
            style={{ padding: '0 18px', borderRadius: 8, border: 'none', cursor: 'pointer', background: HUB_THEME.gold, color: HUB_THEME.ink, fontWeight: 700, fontFamily: 'inherit', fontSize: 14 }}>
            {busy === 'comment' ? '…' : 'Post'}
          </motion.button>
        </div>
        {!authenticated && (
          <p style={{ ...SANS, fontSize: 12, color: HUB_THEME.inkLight, margin: '0 0 14px' }}>
            Sign in to comment with your KAI account — reading and browsing always work without one.
          </p>
        )}

        <div>
          {comments.length === 0 && (
            <p style={{ ...SANS, fontSize: 14, color: HUB_THEME.inkLight, padding: '10px 0' }}>No comments yet. Start the conversation.</p>
          )}
          {comments.map(c => (
            <div key={c.id} style={{ borderBottom: `1px solid ${HUB_THEME.hairline}`, padding: '14px 0' }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: HUB_THEME.pineLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: HUB_THEME.paper, flexShrink: 0 }}>
                  {c.authorName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <b style={{ fontSize: 13, color: HUB_THEME.paper }}>{c.authorName}</b>
                    <span style={{ ...MONO, fontSize: 10, color: HUB_THEME.inkLight }}>{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p style={{ ...SANS, fontSize: 14, color: 'rgba(246,242,231,0.8)', lineHeight: 1.6, margin: '4px 0 0' }}>{c.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Report */}
      <div style={{ marginTop: 30 }}>
        <motion.button whileTap={{ scale: 0.96 }} onClick={() => setReportOpen(o => !o)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: HUB_THEME.inkLight, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
          <Flag size={13} /> {reported ? 'Reported' : 'Report this article'}
        </motion.button>
        <AnimatePresence>
          {reportOpen && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ marginTop: 10, padding: '16px 18px', background: HUB_THEME.bgSoft, borderRadius: 10, maxWidth: 460 }}>
              <select value={reportReason} onChange={e => setReportReason(e.target.value)} style={inputStyle}>
                {['Misinformation', 'Unverifiable claims', 'Plagiarism', 'Harassment', 'Spam', 'Other'].map(r => (
                  <option key={r} value={r} style={{ color: HUB_THEME.ink }}>{r}</option>
                ))}
              </select>
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => act('report', { reason: reportReason })}
                disabled={busy === 'report'}
                style={{ marginTop: 10, padding: '9px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: HUB_THEME.clay, color: HUB_THEME.paper, fontWeight: 700, fontFamily: 'inherit', fontSize: 13 }}>
                {busy === 'report' ? 'Filing…' : 'Submit report'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const actionBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
};

const inputStyle: React.CSSProperties = {
  flex: 1, background: 'rgba(255,255,255,0.05)', border: `1px solid ${HUB_THEME.hairline}`,
  borderRadius: 8, padding: '11px 14px', fontSize: 14, color: HUB_THEME.paper,
  outline: 'none', fontFamily: 'inherit', minWidth: 0,
};

interface TipState {
  open: boolean;
  amount: string;
  email: string;
  status: string;
  info: string;
}

function TipCard({ post, tip, setTip, onStart, onClose }: {
  post: ContentPost;
  tip: TipState;
  setTip: React.Dispatch<React.SetStateAction<TipState>>;
  onStart: () => void;
  onClose: () => void;
}) {
  const disabled = tip.status === 'paying' || tip.status === 'awaiting' || tip.status === 'done';
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,10,7,0.8)', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        style={{ width: '100%', maxWidth: 440, background: HUB_THEME.card, borderRadius: 14, padding: '28px 24px' }}>
        <p style={{ ...SERIF, fontSize: 20, fontWeight: 600, color: HUB_THEME.paper, margin: '0 0 4px' }}>Support {post.creatorName}</p>
        <p style={{ fontSize: 12, color: HUB_THEME.inkLight, margin: '0 0 18px' }}>{post.title.slice(0, 60)}…</p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {['50', '100', '250', '500'].map(a => (
            <motion.button key={a} whileTap={{ scale: 0.94 }} onClick={() => setTip(t => ({ ...t, amount: a }))} disabled={disabled}
              style={{ flex: 1, padding: '11px 0', borderRadius: 8, border: 'none', cursor: 'pointer', background: tip.amount === a ? HUB_THEME.gold : 'rgba(255,255,255,0.05)', color: tip.amount === a ? HUB_THEME.ink : HUB_THEME.paperDim, fontWeight: 700, fontFamily: 'inherit' }}>
              KES {a}
            </motion.button>
          ))}
        </div>
        <input value={tip.amount} onChange={e => setTip(t => ({ ...t, amount: e.target.value }))} placeholder="Custom amount" disabled={disabled} style={inputStyle} />
        <input value={tip.email} onChange={e => setTip(t => ({ ...t, email: e.target.value }))} placeholder="Your email (for the receipt)" disabled={disabled} type="email" style={{ ...inputStyle, marginTop: 10 }} />

        {tip.info && <p style={{ fontSize: 12, lineHeight: 1.5, color: tip.status === 'error' ? HUB_THEME.clay : HUB_THEME.goldLight, margin: '12px 0 0' }}>{tip.info}</p>}

        <motion.button whileTap={!disabled ? { scale: 0.98 } : {}} onClick={onStart} disabled={disabled}
          style={{ width: '100%', marginTop: 16, padding: '14px 0', borderRadius: 9, border: 'none', cursor: disabled ? 'default' : 'pointer', background: HUB_THEME.gold, color: HUB_THEME.ink, fontSize: 15, fontWeight: 700, fontFamily: 'inherit' }}>
          {tip.status === 'done' ? 'Tip sent!' : tip.status === 'paying' ? 'Starting payment…' : tip.status === 'awaiting' ? 'Waiting for payment…' : `Pay KES ${tip.amount || 0} with M-Pesa / Card`}
        </motion.button>
        <button onClick={onClose} disabled={disabled} style={{ width: '100%', marginTop: 8, padding: '12px 0', borderRadius: 9, border: 'none', background: 'rgba(255,255,255,0.05)', color: HUB_THEME.paperDim, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          Cancel
        </button>
      </motion.div>
    </motion.div>
  );
}