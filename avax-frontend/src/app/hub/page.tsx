'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Newspaper, Mic, Trees, Store, Users, BarChart3, BookOpen,
  Play, Pause, Heart, DollarSign, MessageCircle, Share2,
  Search, Filter, ArrowLeft, ChevronRight, RefreshCw,
  Leaf, TrendingUp, Globe, Zap, Clock, Eye,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────
type ContentType = 'ARTICLE' | 'FIELD_JOURNAL' | 'AUDIO_PODCAST' | 'MARKET_NEWS' | 'EDUCATIONAL_GUIDE';
type Category    = 'ALL' | 'FORESTRY_MRV' | 'MSME_GROWTH' | 'CHAMA_SAVINGS' | 'AGRI_MARKET';

interface Post {
  id: string;
  slug: string;
  title: string;
  summary: string;
  contentType: ContentType;
  category: Category;
  creator: string;
  badge: string;
  publishedAt: string;
  viewsCount: number;
  likesCount: number;
  tipsEarnedKes: number;
  audioDurationSeconds?: number;
  audioUrl?: string;
  language: string;
  tags: string[];
}

// ── Mock seed data (replaced by /api/hub/feed once DB is wired) ─────────────
const SEED_POSTS: Post[] = [
  {
    id: 'p1', slug: 'bamboo-dry-season-care', title: 'Protecting Bamboo Seedlings in the Dry Season',
    summary: 'Practical tips from Mau Forest guardians on how to keep bamboo alive through Kenya\'s October dry spell - mulching, watering schedules, and shading techniques.',
    contentType: 'FIELD_JOURNAL', category: 'FORESTRY_MRV',
    creator: 'Grace Wangari', badge: 'COMMUNITY_REPORTER', publishedAt: '2026-08-28', viewsCount: 341, likesCount: 47, tipsEarnedKes: 1200, language: 'EN', tags: ['Bamboo','MRV','Dry Season'],
  },
  {
    id: 'p2', slug: 'ybob-chama-yield', title: 'How Our Chama Earned 18% APY With yBOB Vault',
    summary: 'Mwanzo Mpya Women Chama shares their experience depositing group savings into KAI\'s yBOB yield vault and receiving KES payouts every month.',
    contentType: 'ARTICLE', category: 'CHAMA_SAVINGS',
    creator: 'Wanjiru Kamau', badge: 'CHAMA_MENTOR', publishedAt: '2026-08-27', viewsCount: 512, likesCount: 89, tipsEarnedKes: 2400, language: 'SW', tags: ['yBOB','Chama','Yield'],
  },
  {
    id: 'p3', slug: 'dap-fertiliser-market-aug26',     title: 'DAP Fertiliser Price Alert - Eldoret Market',
    summary: 'DAP prices surged 12% this week. Our market reporter traces the cause to supply chain delays at Mombasa port and suggests farmer co-op bulk purchasing strategies.',
    contentType: 'MARKET_NEWS', category: 'AGRI_MARKET',
    creator: 'Daniel Ruto', badge: 'JOURNALIST', publishedAt: '2026-08-26', viewsCount: 728, likesCount: 130, tipsEarnedKes: 3100, language: 'EN', tags: ['Fertiliser','Prices','Market'],
  },
  {
    id: 'p4', slug: 'kai-ledger-voice-guide',     title: 'KAI Smart Ledger - Voice Guide for Traders',
    summary: 'Audio tutorial: Learn how to record your daily sales, credit given, and stock value using KAI\'s MSME Intelligent Ledger - no internet required for voice input.',
    contentType: 'AUDIO_PODCAST', category: 'MSME_GROWTH',
    creator: 'Beatrice Mutua', badge: 'AGRI_EXPERT', publishedAt: '2026-08-25', viewsCount: 215, likesCount: 38, tipsEarnedKes: 900, audioDurationSeconds: 482, language: 'SW', tags: ['Ledger','Voice','MSME'],
  },
  {
    id: 'p5', slug: 'rwa-invoice-token-guide', title: 'Tokenise Your Unpaid Invoice — Step by Step',
    summary: 'A comprehensive guide for small business owners on how to turn accounts receivable into on-chain RWA tokens on Avalanche Fuji and receive instant KES working capital.',
    contentType: 'EDUCATIONAL_GUIDE', category: 'MSME_GROWTH',
    creator: 'Joseph Kimani', badge: 'AGRI_EXPERT', publishedAt: '2026-08-24', viewsCount: 403, likesCount: 62, tipsEarnedKes: 1800, language: 'EN', tags: ['RWA','Invoice','Finance'],
  },
  {
    id: 'p6', slug: 'honey-reserve-season-2026', title: 'Honey Harvest Season: Turkana Beekeepers Join KAI',
    summary: 'The Turkana Beekeepers Cooperative has registered 500kg of certified honey on KAI\'s forest product registry, unlocking the GAMI vault (14% APY) for members.',
    contentType: 'FIELD_JOURNAL', category: 'FORESTRY_MRV',
    creator: 'Fatuma Hassan', badge: 'COMMUNITY_REPORTER', publishedAt: '2026-08-23', viewsCount: 290, likesCount: 54, tipsEarnedKes: 1500, language: 'EN', tags: ['Honey','GAMI','Forest'],
  },
  {
    id: 'p7', slug: 'carbon-credits-mau-2026', title: 'Mau Forest CFA Earns 8,420 Carbon Credits on Avalanche',
    summary: 'How the Mau Forest Guardians Group A anchored their patrol logs on-chain, triggering automatic carbon credit minting through KAI\'s dMRV smart contract.',
    contentType: 'ARTICLE', category: 'FORESTRY_MRV',
    creator: 'Agnes Chebet', badge: 'COMMUNITY_REPORTER', publishedAt: '2026-08-22', viewsCount: 617, likesCount: 98, tipsEarnedKes: 2800, language: 'EN', tags: ['Carbon','Blockchain','MRV'],
  },
  {
    id: 'p8', slug: 'chama-investment-pool-podcast',     title: 'Group Investment Basics for SACCO Members',
    summary: 'Podcast episode covering the basics of DeFi group savings: how M-Pesa contributions are converted to yBOB, routed to vaults, and distributed back monthly.',
    contentType: 'AUDIO_PODCAST', category: 'CHAMA_SAVINGS',
    creator: 'Akinyi Odhiambo', badge: 'CHAMA_MENTOR', publishedAt: '2026-08-21', viewsCount: 189, likesCount: 29, tipsEarnedKes: 700, audioDurationSeconds: 720, language: 'SW', tags: ['SACCO','DeFi','Audio'],
  },
];

// ── Config ─────────────────────────────────────────────────────────────────
const CATEGORIES: { id: Category; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'ALL',          label: 'All',        icon: <Globe size={13} />,      color: '#10b981' },
  { id: 'FORESTRY_MRV', label: 'Forest',     icon: <Trees size={13} />,      color: '#22c55e' },
  { id: 'MSME_GROWTH',  label: 'Business',   icon: <Store size={13} />,      color: '#3b82f6' },
  { id: 'CHAMA_SAVINGS',label: 'Chama',      icon: <Users size={13} />,      color: '#a855f7' },
  { id: 'AGRI_MARKET',  label: 'Market',     icon: <BarChart3 size={13} />,  color: '#f59e0b' },
];

const TYPE_CONFIG: Record<ContentType, { icon: React.ReactNode; label: string; color: string }> = {
  ARTICLE:           { icon: <Newspaper size={11} />,  label: 'Article',    color: '#10b981' },
  FIELD_JOURNAL:     { icon: <Leaf size={11} />,        label: 'Journal',   color: '#22c55e' },
  AUDIO_PODCAST:     { icon: <Mic size={11} />,         label: 'Podcast',   color: '#a855f7' },
  MARKET_NEWS:       { icon: <TrendingUp size={11} />,  label: 'Market',    color: '#f59e0b' },
  EDUCATIONAL_GUIDE: { icon: <BookOpen size={11} />,    label: 'Guide',     color: '#3b82f6' },
};

const BADGE_LABEL: Record<string, string> = {
  COMMUNITY_REPORTER: 'Reporter',
  AGRI_EXPERT:        'Expert',
  CHAMA_MENTOR:       'Mentor',
  JOURNALIST:         'Journalist',
};

function fmt(secs: number) {
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// ── Audio Player hook ───────────────────────────────────────────────────────
function useAudio(url?: string) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const toggle = () => {
    if (!ref.current) { ref.current = new Audio(url); ref.current.onended = () => setPlaying(false); }
    if (playing) { ref.current.pause(); setPlaying(false); }
    else         { ref.current.play().catch(() => {}); setPlaying(true); }
  };
  return { playing, toggle };
}

// ── Post card ───────────────────────────────────────────────────────────────
function PostCard({ post, onLike, onTip }: { post: Post; onLike: (id: string) => void; onTip: (post: Post) => void }) {
  const tc = TYPE_CONFIG[post.contentType];
  const cat = CATEGORIES.find(c => c.id === post.category);
  const { playing, toggle } = useAudio(post.audioUrl);
  const isPodcast = post.contentType === 'AUDIO_PODCAST';
  const [liked, setLiked] = useState(false);

  return (
    <article style={{
      borderRadius: 20, overflow: 'hidden',
      background: `linear-gradient(145deg, ${cat?.color ?? '#10b981'}07 0%, rgba(10,10,12,0.92) 100%)`,
      border: `1px solid ${cat?.color ?? '#10b981'}18`,
      marginBottom: 12, position: 'relative',
    }}>
      {/* Top accent line */}
      <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${tc.color}70, transparent)` }} />

      <div style={{ padding: '14px 15px' }}>
        {/* Type + category badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: `${tc.color}16`, color: tc.color, border: `1px solid ${tc.color}30`, textTransform: 'uppercase', letterSpacing: 0.4 }}>
            {tc.icon} {tc.label}
          </span>
          {cat && cat.id !== 'ALL' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: `${cat.color}10`, color: cat.color, border: `1px solid ${cat.color}22`, letterSpacing: 0.3 }}>
              {cat.icon} {cat.label}
            </span>
          )}
          <span style={{ fontSize: 9, color: 'rgba(248,248,250,0.30)', marginLeft: 'auto' }}>{post.publishedAt}</span>
        </div>

        {/* Title */}
        <h3 style={{ fontSize: 15, fontWeight: 900, color: '#f8f8fa', margin: '0 0 7px', lineHeight: 1.35 }}>{post.title}</h3>

        {/* Summary */}
        <p style={{ fontSize: 12, color: 'rgba(248,248,250,0.58)', lineHeight: 1.6, margin: '0 0 11px' }}>{post.summary}</p>

        {/* Podcast player */}
        {isPodcast && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.20)', marginBottom: 11 }}>
            <button onClick={toggle} style={{
              width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: playing ? 'rgba(168,85,247,0.30)' : 'linear-gradient(135deg,#a855f7,#7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              boxShadow: playing ? '0 0 12px rgba(168,85,247,0.45)' : 'none',
            }}>
              {playing ? <Pause size={16} color="#fff" /> : <Play size={16} color="#fff" style={{ marginLeft: 2 }} />}
            </button>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#c084fc', margin: '0 0 2px' }}>🎙️ Audio Journal</p>
              <p style={{ fontSize: 10, color: 'rgba(248,248,250,0.40)', margin: 0 }}>
                {post.audioDurationSeconds ? fmt(post.audioDurationSeconds) : '—'} · {post.language === 'SW' ? 'Swahili' : 'English'}
              </p>
            </div>
            <Mic size={14} color="rgba(168,85,247,0.55)" />
          </div>
        )}

        {/* Creator row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${tc.color}20`, border: `1.5px solid ${tc.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: tc.color, flexShrink: 0 }}>
            {post.creator.charAt(0)}
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 800, color: '#f8f8fa', margin: 0 }}>{post.creator}</p>
            <p style={{ fontSize: 9, color: 'rgba(248,248,250,0.38)', margin: 0 }}>{BADGE_LABEL[post.badge] ?? post.badge}</p>
          </div>
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
          {post.tags.map(t => (
            <span key={t} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 5, background: 'rgba(255,255,255,0.05)', color: 'rgba(248,248,250,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}>#{t}</span>
          ))}
        </div>

        {/* Engagement bar */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 11 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Views */}
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'rgba(248,248,250,0.35)' }}>
            <Eye size={11} /> {post.viewsCount.toLocaleString()}
          </span>
          {/* Like */}
          <button onClick={() => { setLiked(v => !v); onLike(post.id); }} style={{
            display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, cursor: 'pointer',
            background: 'none', border: 'none', padding: 0,
            color: liked ? '#f87171' : 'rgba(248,248,250,0.45)',
            transition: 'color 0.15s',
          }}>
            <Heart size={13} style={{ fill: liked ? '#f87171' : 'none', transition: 'fill 0.15s' }} />
            {post.likesCount + (liked ? 1 : 0)}
          </button>
          {/* Tips */}
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#4ade80' }}>
            <DollarSign size={11} /> KES {post.tipsEarnedKes.toLocaleString()}
          </span>
          {/* Tip button */}
          <button onClick={() => onTip(post)} style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 12px', borderRadius: 9, border: 'none', cursor: 'pointer',
            background: 'rgba(34,197,94,0.12)', color: '#4ade80', fontSize: 10, fontWeight: 800,
            outline: '1px solid rgba(34,197,94,0.25)', transition: 'all 0.15s',
          }}>
            <DollarSign size={11} /> Tip Creator
          </button>
          {/* Share */}
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(248,248,250,0.28)', padding: 0 }}>
            <Share2 size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}

// ── Tip modal ──────────────────────────────────────────────────────────────
function TipModal({ post, onClose }: { post: Post; onClose: () => void }) {
  const [amount, setAmount] = useState('100');
  const [sent, setSent]     = useState(false);
  const tc = TYPE_CONFIG[post.contentType];

  const handleTip = async () => {
    setSent(true);
    // TODO: call /api/hub/tip with Paystack/yBOB
    setTimeout(onClose, 1800);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 80, display: 'flex', alignItems: 'flex-end', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}>
      <div className="scale-in" style={{ width: '100%', maxWidth: 520, margin: '0 auto', background: 'var(--surface-2)', borderRadius: '24px 24px 0 0', padding: 24, border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${tc.color}20`, border: `1.5px solid ${tc.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: tc.color }}>
            {post.creator.charAt(0)}
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 900, color: '#f8f8fa', margin: 0 }}>Tip {post.creator}</p>
            <p style={{ fontSize: 10, color: 'rgba(248,248,250,0.40)', margin: 0 }}>{post.title.slice(0, 40)}…</p>
          </div>
        </div>
        <p className="label-caps" style={{ marginBottom: 10 }}>Amount (KES)</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {['50','100','250','500'].map(a => (
            <button key={a} onClick={() => setAmount(a)} style={{
              flex: 1, padding: '9px 0', borderRadius: 10, border: `1px solid ${amount === a ? 'rgba(34,197,94,0.45)' : 'rgba(255,255,255,0.08)'}`,
              background: amount === a ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)',
              color: amount === a ? '#4ade80' : 'rgba(248,248,250,0.55)', fontSize: 13, fontWeight: 800, cursor: 'pointer',
            }}>KES {a}</button>
          ))}
        </div>
        <input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="Custom amount"
          style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, padding: '10px 13px', fontSize: 14, color: '#f8f8fa', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 14 }} />
        <button onClick={handleTip} disabled={sent} style={{
          width: '100%', padding: '13px 0', borderRadius: 14, border: 'none', cursor: sent ? 'default' : 'pointer',
          background: sent ? 'rgba(34,197,94,0.18)' : 'linear-gradient(135deg,#22c55e,#16a34a)',
          color: sent ? '#4ade80' : '#fff', fontSize: 14, fontWeight: 800, transition: 'all 0.2s',
        }}>
          {sent ? '✓ Tip Sent!' : `Send KES ${amount} via M-Pesa / yBOB`}
        </button>
        <button onClick={onClose} style={{ width: '100%', marginTop: 10, padding: '11px 0', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'rgba(248,248,250,0.40)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function HubPage() {
  const [category,  setCategory]  = useState<Category>('ALL');
  const [search,    setSearch]    = useState('');
  const [posts,     setPosts]     = useState<Post[]>(SEED_POSTS);
  const [loading,   setLoading]   = useState(false);
  const [tipPost,   setTipPost]   = useState<Post | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== 'ALL') params.set('category', category);
      if (search.trim())       params.set('q', search.trim());
      const r = await fetch(`/api/hub/feed?${params}`);
      if (r.ok) { const d = await r.json(); if (d.posts?.length) setPosts(d.posts); }
    } catch { /* use seed */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [category]);

  const filtered = posts.filter(p => {
    const matchCat = category === 'ALL' || p.category === category;
    const matchQ   = !search.trim() || p.title.toLowerCase().includes(search.toLowerCase()) || p.summary.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQ;
  });

  const handleLike = (id: string) => setPosts(ps => ps.map(p => p.id === id ? { ...p, likesCount: p.likesCount + 1 } : p));

  return (
    <main style={{
      minHeight: '100dvh', paddingBottom: 96,
      background: 'radial-gradient(ellipse 80% 50% at 50% -5%, rgba(16,185,129,0.09) 0%, transparent 60%), #08080a',
      color: '#f8f8fa', fontFamily: 'var(--font-sans)',
    }}>

      {/* ── HEADER ── */}
      <div style={{ padding: '22px 18px 0', borderBottom: '1px solid rgba(16,185,129,0.13)', background: 'linear-gradient(180deg,rgba(16,185,129,0.07) 0%,transparent 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 15, background: 'linear-gradient(135deg,rgba(16,185,129,0.25),rgba(5,150,105,0.14))', border: '1.5px solid rgba(16,185,129,0.40)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 18px rgba(16,185,129,0.18)', flexShrink: 0 }}>
            <Newspaper size={22} color="#10b981" strokeWidth={1.8} />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 20, fontWeight: 900, margin: '0 0 2px', letterSpacing: -0.5 }}>Community Info Hub</h1>
            <p style={{ fontSize: 10, color: 'rgba(248,248,250,0.40)', margin: 0 }}>Field journals · Market news · Audio guides · Chama tips</p>
          </div>
          <button onClick={load} style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RefreshCw size={13} color="rgba(255,255,255,0.40)" style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, padding: '9px 13px', marginBottom: 14 }}>
          <Search size={14} color="rgba(248,248,250,0.30)" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search articles, guides, market news…"
            style={{ background: 'none', border: 'none', outline: 'none', flex: 1, fontSize: 13, color: '#f8f8fa', fontFamily: 'inherit' }} />
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 1 }}>
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setCategory(c.id)} style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 13px', borderRadius: '10px 10px 0 0', border: 'none', cursor: 'pointer',
              background: category === c.id ? `${c.color}16` : 'rgba(255,255,255,0.03)',
              borderTop: category === c.id ? `1.5px solid ${c.color}55` : '1.5px solid transparent',
              color: category === c.id ? c.color : 'rgba(248,248,250,0.38)',
              fontSize: 11, fontWeight: category === c.id ? 800 : 600, transition: 'all 0.18s',
            }}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── STATS STRIP ── */}
      <div style={{ display: 'flex', gap: 0, background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {[
          { label: 'Articles',  value: posts.filter(p => p.contentType === 'ARTICLE').length,         color: '#10b981' },
          { label: 'Journals',  value: posts.filter(p => p.contentType === 'FIELD_JOURNAL').length,   color: '#22c55e' },
          { label: 'Podcasts',  value: posts.filter(p => p.contentType === 'AUDIO_PODCAST').length,   color: '#a855f7' },
          { label: 'Markets',   value: posts.filter(p => p.contentType === 'MARKET_NEWS').length,     color: '#f59e0b' },
        ].map((s, i) => (
          <div key={s.label} style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <p style={{ fontSize: 16, fontWeight: 900, color: s.color, margin: '0 0 2px', letterSpacing: -0.5 }}>{s.value}</p>
            <p style={{ fontSize: 8, color: 'rgba(248,248,250,0.35)', fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── FEATURED BANNER ── */}
      {filtered.length > 0 && (
        <div style={{ margin: '16px 18px 0' }}>
          <p className="label-caps" style={{ marginBottom: 10 }}>Featured</p>
          <div style={{
            borderRadius: 22, padding: '18px 17px', position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(135deg,rgba(16,185,129,0.16) 0%,rgba(10,10,12,0.95) 100%)',
            border: '1.5px solid rgba(16,185,129,0.30)',
            boxShadow: '0 8px 32px rgba(16,185,129,0.10)',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#10b981,transparent)' }} />
            <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle,rgba(16,185,129,0.12) 0%,transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              {TYPE_CONFIG[filtered[0].contentType].icon}
              <span style={{ fontSize: 9, fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {TYPE_CONFIG[filtered[0].contentType].label}
              </span>
              <span className="badge badge-live" style={{ marginLeft: 'auto' }}>New</span>
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 900, color: '#f8f8fa', margin: '0 0 8px', lineHeight: 1.3 }}>{filtered[0].title}</h2>
            <p style={{ fontSize: 12, color: 'rgba(248,248,250,0.58)', lineHeight: 1.6, margin: '0 0 12px' }}>{filtered[0].summary.slice(0, 120)}…</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 11, color: 'rgba(248,248,250,0.45)', margin: 0 }}>
                {filtered[0].creator} · {filtered[0].publishedAt}
              </p>
              <button onClick={() => setTipPost(filtered[0])} style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: 'rgba(34,197,94,0.14)', color: '#4ade80', fontSize: 10, fontWeight: 800, outline: '1px solid rgba(34,197,94,0.28)',
              }}>
                <DollarSign size={11} /> Tip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FEED ── */}
      <div style={{ padding: '16px 18px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p className="label-caps">{filtered.length} {category === 'ALL' ? 'Posts' : CATEGORIES.find(c => c.id === category)?.label}</p>
          <Link href="/hub/create" style={{ fontSize: 10, color: '#10b981', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
            + Publish <ChevronRight size={10} />
          </Link>
        </div>

        {filtered.length === 0
          ? <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(248,248,250,0.30)', fontSize: 13 }}>
              No posts found. Try a different category or search term.
            </div>
          : filtered.map(p => <PostCard key={p.id} post={p} onLike={handleLike} onTip={setTipPost} />)
        }

        {/* Onboarding AI agent CTA */}
        <div style={{ marginTop: 8, borderRadius: 18, padding: '16px 16px', background: 'linear-gradient(135deg,rgba(168,85,247,0.10) 0%,rgba(10,10,12,0.90) 100%)', border: '1px solid rgba(168,85,247,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(168,85,247,0.18)', border: '1px solid rgba(168,85,247,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={18} color="#a855f7" />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 900, color: '#f8f8fa', margin: 0 }}>KAI Onboarding Agent</p>
              <p style={{ fontSize: 10, color: 'rgba(248,248,250,0.40)', margin: 0 }}>Forest Guardian · MSME Merchant · Chama Saver</p>
            </div>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(248,248,250,0.58)', lineHeight: 1.55, margin: '0 0 12px' }}>
            Not sure where to start? Ask KAI to analyse your profile and recommend the best vault strategy, CFA group, or Chama to join.
          </p>
          <Link href="/ai" style={{ textDecoration: 'none' }}>
            <button style={{
              width: '100%', padding: '12px 0', borderRadius: 13, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg,#a855f7,#7c3aed)', color: '#fff', fontSize: 13, fontWeight: 800,
            }}>
              Ask KAI to Onboard Me →
            </button>
          </Link>
        </div>
      </div>

      {tipPost && <TipModal post={tipPost} onClose={() => setTipPost(null)} />}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
