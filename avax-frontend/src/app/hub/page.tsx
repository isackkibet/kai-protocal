'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Newspaper, Mic, BookOpen,
  Play, Pause, Heart, DollarSign,
  Search, RefreshCw, ChevronRight, Zap,
  Leaf, TrendingUp, Eye,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────
type ContentType = 'ARTICLE' | 'FIELD_JOURNAL' | 'AUDIO_PODCAST' | 'MARKET_NEWS' | 'EDUCATIONAL_GUIDE';
type Category    = 'ALL' | 'FORESTRY_MRV' | 'MSME_GROWTH' | 'CHAMA_SAVINGS' | 'AGRI_MARKET';

interface Post {
  id: string; slug: string; title: string; summary: string;
  contentType: ContentType; category: Category;
  creator: string; badge: string; publishedAt: string;
  viewsCount: number; likesCount: number; tipsEarnedKes: number;
  audioDurationSeconds?: number; audioUrl?: string;
  language: string; tags: string[];
}

// ── Design tokens (kaiweb style) ───────────────────────────────────────────
const C = {
  bg:        '#0A1912',
  card:      '#12241B',
  cardHover: '#182E23',
  pine:      '#0F3D2E',
  pineDeep:  '#0A2A20',
  pineLight: '#2D5A3D',
  gold:      '#C89B3C',
  goldLight: '#E4C878',
  clay:      '#9C4B2D',
  paper:     '#F6F2E7',
  paperDim:  '#EFE9D9',
  ink:       '#1B1A14',
  inkSoft:   '#4B4A3F',
  inkLight:  '#A3A295',
  border:    'rgba(200,155,60,0.2)',
};

const MONO = { fontFamily: "'IBM Plex Mono', monospace" } as const;
const SERIF = { fontFamily: "'Fraunces', serif" } as const;

// ── Seed data ──────────────────────────────────────────────────────────────
const SEED_POSTS: Post[] = [
  { id:'p1', slug:'bamboo-dry-season-care', title:'Protecting Bamboo Seedlings in the Dry Season',
    summary:'Practical tips from Mau Forest guardians on how to keep bamboo alive through Kenya\'s October dry spell — mulching, watering schedules, and shading techniques.',
    contentType:'FIELD_JOURNAL', category:'FORESTRY_MRV', creator:'Grace Wangari', badge:'COMMUNITY_REPORTER', publishedAt:'2026-08-28', viewsCount:341, likesCount:47, tipsEarnedKes:1200, language:'EN', tags:['Bamboo','MRV','Dry Season'] },
  { id:'p2', slug:'ybob-chama-yield', title:'How Our Chama Earned 18% APY With yBOB Vault',
    summary:'Mwanzo Mpya Women Chama shares their experience depositing group savings into KAI\'s yBOB yield vault and receiving KES payouts every month.',
    contentType:'ARTICLE', category:'CHAMA_SAVINGS', creator:'Wanjiru Kamau', badge:'CHAMA_MENTOR', publishedAt:'2026-08-27', viewsCount:512, likesCount:89, tipsEarnedKes:2400, language:'SW', tags:['yBOB','Chama','Yield'] },
  { id:'p3', slug:'dap-fertiliser-market-aug26', title:'DAP Fertiliser Price Alert — Eldoret Market',
    summary:'DAP prices surged 12% this week. Our market reporter traces the cause to supply chain delays at Mombasa port and suggests farmer co-op bulk purchasing strategies.',
    contentType:'MARKET_NEWS', category:'AGRI_MARKET', creator:'Daniel Ruto', badge:'JOURNALIST', publishedAt:'2026-08-26', viewsCount:728, likesCount:130, tipsEarnedKes:3100, language:'EN', tags:['Fertiliser','Prices','Market'] },
  { id:'p4', slug:'kai-ledger-voice-guide', title:'KAI Smart Ledger — Voice Guide for Traders',
    summary:'Audio tutorial: Learn how to record your daily sales, credit given, and stock value using KAI\'s MSME Intelligent Ledger — no internet required for voice input.',
    contentType:'AUDIO_PODCAST', category:'MSME_GROWTH', creator:'Beatrice Mutua', badge:'AGRI_EXPERT', publishedAt:'2026-08-25', viewsCount:215, likesCount:38, tipsEarnedKes:900, audioDurationSeconds:482, language:'SW', tags:['Ledger','Voice','MSME'] },
  { id:'p5', slug:'rwa-invoice-token-guide', title:'Tokenise Your Unpaid Invoice — Step by Step',
    summary:'A comprehensive guide for small business owners on how to turn accounts receivable into on-chain RWA tokens on Avalanche Fuji and receive instant KES working capital.',
    contentType:'EDUCATIONAL_GUIDE', category:'MSME_GROWTH', creator:'Joseph Kimani', badge:'AGRI_EXPERT', publishedAt:'2026-08-24', viewsCount:403, likesCount:62, tipsEarnedKes:1800, language:'EN', tags:['RWA','Invoice','Finance'] },
  { id:'p6', slug:'honey-reserve-season-2026', title:'Honey Harvest Season: Turkana Beekeepers Join KAI',
    summary:'The Turkana Beekeepers Cooperative has registered 500kg of certified honey on KAI\'s forest product registry, unlocking the GAMI vault (14% APY) for members.',
    contentType:'FIELD_JOURNAL', category:'FORESTRY_MRV', creator:'Fatuma Hassan', badge:'COMMUNITY_REPORTER', publishedAt:'2026-08-23', viewsCount:290, likesCount:54, tipsEarnedKes:1500, language:'EN', tags:['Honey','GAMI','Forest'] },
  { id:'p7', slug:'carbon-credits-mau-2026', title:'Mau Forest CFA Earns 8,420 Carbon Credits on Avalanche',
    summary:'How the Mau Forest Guardians Group A anchored their patrol logs on-chain, triggering automatic carbon credit minting through KAI\'s dMRV smart contract.',
    contentType:'ARTICLE', category:'FORESTRY_MRV', creator:'Agnes Chebet', badge:'COMMUNITY_REPORTER', publishedAt:'2026-08-22', viewsCount:617, likesCount:98, tipsEarnedKes:2800, language:'EN', tags:['Carbon','Blockchain','MRV'] },
  { id:'p8', slug:'chama-investment-pool-podcast', title:'Group Investment Basics for SACCO Members',
    summary:'Podcast episode covering the basics of DeFi group savings: how M-Pesa contributions are converted to yBOB, routed to vaults, and distributed back monthly.',
    contentType:'AUDIO_PODCAST', category:'CHAMA_SAVINGS', creator:'Akinyi Odhiambo', badge:'CHAMA_MENTOR', publishedAt:'2026-08-21', viewsCount:189, likesCount:29, tipsEarnedKes:700, audioDurationSeconds:720, language:'SW', tags:['SACCO','DeFi','Audio'] },
];

// ── Config ─────────────────────────────────────────────────────────────────
const CATEGORIES: { id: Category; label: string }[] = [
  { id:'ALL',           label:'All' },
  { id:'FORESTRY_MRV',  label:'Forest' },
  { id:'MSME_GROWTH',   label:'Business' },
  { id:'CHAMA_SAVINGS', label:'Chama' },
  { id:'AGRI_MARKET',   label:'Market' },
];

const TYPE_CFG: Record<ContentType, { icon: React.ReactNode; label: string; color: string }> = {
  ARTICLE:           { icon:<Newspaper size={11} />,  label:'Article',  color:C.goldLight },
  FIELD_JOURNAL:     { icon:<Leaf size={11} />,        label:'Journal',  color:C.goldLight },
  AUDIO_PODCAST:     { icon:<Mic size={11} />,         label:'Podcast',  color:C.goldLight },
  MARKET_NEWS:       { icon:<TrendingUp size={11} />,  label:'Market',   color:C.goldLight },
  EDUCATIONAL_GUIDE: { icon:<BookOpen size={11} />,    label:'Guide',    color:C.goldLight },
};

const BADGE_LABEL: Record<string, string> = {
  COMMUNITY_REPORTER:'Reporter', AGRI_EXPERT:'Expert',
  CHAMA_MENTOR:'Mentor',         JOURNALIST:'Journalist',
};

function fmt(secs: number) {
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// ── Audio hook ─────────────────────────────────────────────────────────────
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

// ── Post card (kaiweb editorial style) ─────────────────────────────────────
function PostCard({ post, idx, onLike, onTip }: { post: Post; idx: number; onLike:(id:string)=>void; onTip:(p:Post)=>void }) {
  const tc  = TYPE_CFG[post.contentType];
  const cat = CATEGORIES.find(c => c.id === post.category);
  const { playing, toggle } = useAudio(post.audioUrl);
  const isPodcast = post.contentType === 'AUDIO_PODCAST';
  const [liked, setLiked] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 + idx * 0.05, duration: 0.3 }}
      whileHover={{ y: -3 }}
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: '22px 24px',
        transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = C.cardHover;
        e.currentTarget.style.borderColor = 'rgba(200,155,60,0.38)';
        e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.35)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = C.card;
        e.currentTarget.style.borderColor = C.border;
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        <span style={{ ...MONO, fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', color: tc.color }}>
          {tc.label}
        </span>
        <span style={{ fontSize: 11, color: 'rgba(246,242,231,0.55)' }}>
          {post.publishedAt}
        </span>
        {cat && cat.id !== 'ALL' && (
          <span style={{ ...MONO, marginLeft: 'auto', fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase', color: C.inkLight }}>
            {cat.label}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 style={{ ...SERIF, fontSize: 20, fontWeight: 600, color: C.paper, margin: '0 0 10px', lineHeight: 1.3 }}>
        {post.title}
      </h3>

      {/* Summary */}
      <p style={{ fontSize: 14, color: 'rgba(246,242,231,0.72)', lineHeight: 1.65, margin: '0 0 16px' }}>
        {post.summary}
      </p>

      {/* Podcast player */}
      {isPodcast && (
        <motion.div
          whileHover={{ scale: 1.01 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '11px 14px', borderRadius: 10, marginBottom: 16,
            background: C.pineDeep, border: `1px solid ${C.border}`,
          }}
        >
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={toggle}
            style={{
              width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: playing ? C.pineLight : C.gold,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            {playing ? <Pause size={15} color="#0A1912" /> : <Play size={15} color="#0A1912" style={{ marginLeft: 2 }} />}
          </motion.button>
          <div style={{ flex: 1 }}>
            <p style={{ ...MONO, fontSize: 11, fontWeight: 600, color: C.goldLight, margin: '0 0 2px' }}>Audio Journal</p>
            <p style={{ fontSize: 11, color: 'rgba(246,242,231,0.55)', margin: 0 }}>
              {post.audioDurationSeconds ? fmt(post.audioDurationSeconds) : '—'} · {post.language === 'SW' ? 'Swahili' : 'English'}
            </p>
          </div>
          <Mic size={13} color="rgba(200,155,60,0.6)" />
        </motion.div>
      )}

      {/* Creator + tags */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: C.pineLight,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: C.paper,
        }}>
          {post.creator.charAt(0)}
        </div>
        <div style={{ overflow: 'hidden' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.paper, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {post.creator}
          </p>
          <p style={{ fontSize: 10, color: C.inkLight, margin: 0 }}>
            {BADGE_LABEL[post.badge] ?? post.badge}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end', marginLeft: 'auto' }}>
          {post.tags.slice(0, 2).map(t => (
            <span key={t} style={{ ...MONO, fontSize: 9, padding: '2px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', color: C.inkLight, whiteSpace: 'nowrap' }}>
              #{t}
            </span>
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: C.border, marginBottom: 14 }} />

      {/* Engagement bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: C.inkLight }}>
          <Eye size={13} /> {post.viewsCount.toLocaleString()}
        </span>
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.88 }}
          onClick={() => { setLiked(v => !v); onLike(post.id); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
            background: 'none', border: 'none', padding: 0,
            color: liked ? C.clay : C.inkLight,
            fontFamily: 'inherit',
            transition: 'color 0.15s',
          }}
        >
          <Heart size={13} style={{ fill: liked ? C.clay : 'none', transition: 'fill 0.15s' }} />
          {post.likesCount + (liked ? 1 : 0)}
        </motion.button>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: C.goldLight }}>
          <DollarSign size={12} /> KES {post.tipsEarnedKes.toLocaleString()}
        </span>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => onTip(post)}
          style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: C.gold, color: C.ink, fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
          }}
        >
          <DollarSign size={12} /> Tip
        </motion.button>
      </div>
    </motion.article>
  );
}

// ── Tip modal ──────────────────────────────────────────────────────────────
function TipModal({ post, onClose }: { post: Post; onClose: () => void }) {
  const [amount, setAmount] = useState('100');
  const [sent, setSent]     = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 80,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(4,10,7,0.75)',
        padding: 20,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0,  opacity: 1 }}
        exit={{ y: 24,    opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        style={{
          width: '100%', maxWidth: 460,
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: '28px 26px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 20 }}>
          <div style={{
            width: 46, height: 46, borderRadius: '50%',
            background: C.pineLight,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 19, fontWeight: 700, color: C.paper,
          }}>
            {post.creator.charAt(0)}
          </div>
          <div>
            <p style={{ ...SERIF, fontSize: 15, fontWeight: 600, color: C.paper, margin: 0 }}>Tip {post.creator}</p>
            <p style={{ fontSize: 11, color: C.inkLight, margin: 0 }}>{post.title.slice(0, 42)}…</p>
          </div>
        </div>

        <p style={{ ...MONO, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: C.inkLight, marginBottom: 10 }}>Amount (KES)</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {['50','100','250','500'].map(a => (
            <motion.button
              key={a}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setAmount(a)}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: amount === a ? C.gold : 'rgba(255,255,255,0.05)',
                color: amount === a ? C.ink : C.paperDim,
                fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                transition: 'background 0.15s, color 0.15s',
              }}
            >KES {a}</motion.button>
          ))}
        </div>

        <input
          value={amount}
          onChange={e => setAmount(e.target.value)}
          type="number"
          placeholder="Custom amount"
          style={{
            width: '100%', background: C.pineDeep, border: `1px solid ${C.border}`,
            borderRadius: 8, padding: '11px 14px',
            fontSize: 14, color: C.paper, outline: 'none',
            fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 14,
          }}
        />

        <motion.button
          whileHover={!sent ? { scale: 1.02 } : {}}
          whileTap={!sent ? { scale: 0.97 } : {}}
          onClick={() => { setSent(true); setTimeout(onClose, 1800); }}
          disabled={sent}
          style={{
            width: '100%', padding: '13px 0', borderRadius: 9, border: 'none',
            cursor: sent ? 'default' : 'pointer',
            background: sent ? C.pineLight : C.gold,
            color: sent ? C.paper : C.ink,
            fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
          }}
        >
          {sent ? '✓ Tip Sent!' : `Send KES ${amount} via M-Pesa / yBOB`}
        </motion.button>

        <button
          onClick={onClose}
          style={{
            width: '100%', marginTop: 10, padding: '11px 0', borderRadius: 9, border: 'none',
            background: 'rgba(255,255,255,0.05)',
            color: C.paperDim, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >Cancel</button>
      </motion.div>
    </motion.div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function HubPage() {
  const [category, setCategory] = useState<Category>('ALL');
  const [search,   setSearch]   = useState('');
  const [posts,    setPosts]    = useState<Post[]>(SEED_POSTS);
  const [loading,  setLoading]  = useState(false);
  const [tipPost,  setTipPost]  = useState<Post | null>(null);

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
    const q = search.trim().toLowerCase();
    const matchQ = !q || p.title.toLowerCase().includes(q) || p.summary.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  const handleLike = (id: string) =>
    setPosts(ps => ps.map(p => p.id === id ? { ...p, likesCount: p.likesCount + 1 } : p));

  const featuredPost = filtered[0];
  const feedPosts    = filtered.slice(1);

  // div wrapper style to neutralize app-wide glass body bg on this page
  return (
    <main style={{
      minHeight: '100dvh', background: C.bg,
      color: C.paper, fontFamily: "'IBM Plex Sans', sans-serif",
      paddingBottom: 80,
    }}
    >
      {/* kaiweb fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
      `}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>

        {/* ── Header / masthead ── */}
        <header style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '28px 0', borderBottom: `1px solid ${C.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: C.gold, color: C.ink, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
            }}>K</div>
            <div>
              <h1 style={{ ...SERIF, fontSize: 22, fontWeight: 600, color: C.paper, margin: 0, lineHeight: 1.1 }}>
                Community Info Hub
              </h1>
              <p style={{ ...MONO, fontSize: 10, letterSpacing: 1, color: C.goldLight, margin: '2px 0 0' }}>
                JOURNAL · NEWS · GUIDES · PODCASTS
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: '8px 12px',
            }}>
              <Search size={14} color={C.inkLight} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search the hub…"
                style={{
                  background: 'none', border: 'none', outline: 'none',
                  flex: 1, fontSize: 13, color: C.paper, fontFamily: 'inherit',
                  minWidth: 180,
                }}
              />
            </div>
            <motion.button
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.4 }}
              onClick={load}
              style={{
                width: 36, height: 36, borderRadius: 8, border: `1px solid ${C.border}`,
                cursor: 'pointer', background: C.card, color: C.goldLight,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </motion.button>
          </div>
        </header>

        {/* ── Category nav ── */}
        <nav style={{
          display: 'flex', gap: 8, flexWrap: 'wrap', padding: '22px 0 10px',
        }}>
          {CATEGORIES.map(c => (
            <motion.button
              key={c.id}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setCategory(c.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 18px', borderRadius: 6,
                border: category === c.id ? `1px solid ${C.gold}` : `1px solid ${C.border}`,
                cursor: 'pointer',
                background: category === c.id ? C.gold : C.card,
                color: category === c.id ? C.ink : C.paperDim,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase',
                fontWeight: 600, transition: 'all 0.18s',
              }}
            >
              {c.label}
            </motion.button>
          ))}
          <Link href="/hub/create" style={{
            ...MONO, marginLeft: 'auto', fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase',
            color: C.goldLight, fontWeight: 600, textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '8px 6px',
          }}>
            + Publish <ChevronRight size={12} />
          </Link>
        </nav>

        {/* ── FEATURED ── */}
        <AnimatePresence mode="wait">
          {featuredPost && (
            <motion.section
              key={featuredPost.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                margin: '14px 0 28px',
                background: `linear-gradient(135deg, ${C.pine} 0%, ${C.pineDeep} 100%)`,
                border: `1px solid ${C.border}`,
                borderRadius: 14, padding: '30px 32px',
                position: 'relative', overflow: 'hidden',
              }}
            >
              <div style={{
                position: 'absolute', top: -60, right: -60, width: 220, height: 220,
                borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,155,60,0.20) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />
              <div style={{ ...MONO, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: C.goldLight, marginBottom: 12 }}>
                ★ Featured · {TYPE_CFG[featuredPost.contentType].label}
              </div>
              <h2 style={{ ...SERIF, fontSize: 26, fontWeight: 600, color: C.paper, margin: '0 0 12px', lineHeight: 1.25, maxWidth: '80%' }}>
                {featuredPost.title}
              </h2>
              <p style={{ fontSize: 14, color: 'rgba(246,242,231,0.72)', lineHeight: 1.7, margin: '0 0 20px', maxWidth: '86%' }}>
                {featuredPost.summary.slice(0, 150)}…
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ ...MONO, fontSize: 11, color: C.goldLight, margin: 0 }}>
                  By {featuredPost.creator} · {featuredPost.publishedAt}
                </p>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setTipPost(featuredPost)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: C.gold, color: C.ink, fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
                  }}
                >
                  <DollarSign size={13} /> Tip Creator
                </motion.button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── Section label ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <p style={{ ...MONO, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: C.goldLight }}>
            {filtered.length} {category === 'ALL' ? 'Posts' : CATEGORIES.find(c => c.id === category)?.label}
          </p>
        </div>

        {/* ── FEED GRID ── */}
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '60px 20px', color: C.inkLight, fontSize: 14 }}
          >
            No posts found. Try a different category or search term.
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {feedPosts.map((p, i) => (
              <PostCard key={p.id} post={p} idx={i} onLike={handleLike} onTip={setTipPost} />
            ))}
          </div>
        )}

        {/* ── KAI ONBOARDING CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            marginTop: 40, borderRadius: 14, padding: '26px 30px',
            background: `linear-gradient(135deg, ${C.pine} 0%, ${C.pineDeep} 100%)`,
            border: `1px solid ${C.border}`,
            position: 'relative', overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute', top: -40, right: -40, width: 160, height: 160,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200,155,60,0.22) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: C.gold, color: C.ink,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Zap size={19} />
            </div>
            <div>
              <p style={{ ...SERIF, fontSize: 16, fontWeight: 600, color: C.paper, margin: 0 }}>KAI Onboarding Agent</p>
              <p style={{ ...MONO, fontSize: 10, letterSpacing: 0.8, color: C.goldLight, margin: '2px 0 0' }}>
                FOREST GUARDIAN · MSME MERCHANT · CHAMA SAVER
              </p>
            </div>
          </div>

          <p style={{ fontSize: 14, color: 'rgba(246,242,231,0.72)', lineHeight: 1.6, margin: '0 0 18px', maxWidth: '92%' }}>
            Not sure where to start? Ask KAI to analyse your profile and recommend the best vault strategy, CFA group, or Chama to join.
          </p>

          <Link href="/ai" style={{ textDecoration: 'none' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: '13px 28px', borderRadius: 9, border: 'none', cursor: 'pointer',
                background: C.gold, color: C.ink, fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
              }}
            >
              Ask KAI to Onboard Me →
            </motion.button>
          </Link>
        </motion.div>
      </div>

      {/* ── TIP MODAL ── */}
      <AnimatePresence>
        {tipPost && <TipModal post={tipPost} onClose={() => setTipPost(null)} />}
      </AnimatePresence>
    </main>
  );
}
