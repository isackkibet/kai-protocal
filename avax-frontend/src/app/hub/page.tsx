'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Newspaper, Mic, Trees, Store, Users, BarChart3, BookOpen,
  Play, Pause, Heart, DollarSign, MessageCircle, Share2,
  Search, RefreshCw, ChevronRight, Zap,
  Leaf, TrendingUp, Globe, Clock, Eye,
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
const CATEGORIES: { id: Category; label: string; icon: React.ReactNode; color: string }[] = [
  { id:'ALL',           label:'All',      icon:<Globe size={12} />,     color:'#10b981' },
  { id:'FORESTRY_MRV',  label:'Forest',   icon:<Trees size={12} />,     color:'#22c55e' },
  { id:'MSME_GROWTH',   label:'Business', icon:<Store size={12} />,     color:'#3b82f6' },
  { id:'CHAMA_SAVINGS', label:'Chama',    icon:<Users size={12} />,     color:'#a855f7' },
  { id:'AGRI_MARKET',   label:'Market',   icon:<BarChart3 size={12} />, color:'#f59e0b' },
];

const TYPE_CFG: Record<ContentType, { icon: React.ReactNode; label: string; color: string }> = {
  ARTICLE:           { icon:<Newspaper size={11} />,  label:'Article',  color:'#10b981' },
  FIELD_JOURNAL:     { icon:<Leaf size={11} />,        label:'Journal',  color:'#22c55e' },
  AUDIO_PODCAST:     { icon:<Mic size={11} />,         label:'Podcast',  color:'#a855f7' },
  MARKET_NEWS:       { icon:<TrendingUp size={11} />,  label:'Market',   color:'#f59e0b' },
  EDUCATIONAL_GUIDE: { icon:<BookOpen size={11} />,    label:'Guide',    color:'#3b82f6' },
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

// ── Post card ──────────────────────────────────────────────────────────────
function PostCard({ post, idx, onLike, onTip }: { post: Post; idx: number; onLike:(id:string)=>void; onTip:(p:Post)=>void }) {
  const tc  = TYPE_CFG[post.contentType];
  const cat = CATEGORIES.find(c => c.id === post.category);
  const { playing, toggle } = useAudio(post.audioUrl);
  const isPodcast = post.contentType === 'AUDIO_PODCAST';
  const [liked, setLiked] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 + idx * 0.05, duration: 0.35 }}
      whileHover={{ y: -2 }}
      style={{
        borderRadius: 22, overflow: 'hidden',
        background: `linear-gradient(150deg, ${cat?.color ?? '#10b981'}08 0%, rgba(6,6,12,0.55) 100%)`,
        backdropFilter: 'blur(22px)',
        boxShadow: `0 0 0 0.5px ${tc.color}16 inset, 0 8px 30px rgba(0,0,0,0.32)`,
        marginBottom: 12, position: 'relative',
        transition: 'box-shadow 0.25s',
      }}
    >
      {/* Top color stripe — replaces the box border visually */}
      <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${tc.color}80, transparent)` }} />

      <div style={{ padding: '14px 16px' }}>
        {/* Type + category pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 9, fontWeight: 800, padding: '3px 9px', borderRadius: 7,
            background: `${tc.color}14`, color: tc.color,
            boxShadow: `0 0 0 0.5px ${tc.color}30 inset`,
            textTransform: 'uppercase', letterSpacing: 0.5,
          }}>
            {tc.icon} {tc.label}
          </span>
          {cat && cat.id !== 'ALL' && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 9, fontWeight: 700, padding: '3px 9px', borderRadius: 7,
              background: `${cat.color}10`, color: cat.color,
              boxShadow: `0 0 0 0.5px ${cat.color}20 inset`,
              letterSpacing: 0.3,
            }}>
              {cat.icon} {cat.label}
            </span>
          )}
          <span style={{ fontSize: 9, color: 'rgba(248,248,250,0.28)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Clock size={9} /> {post.publishedAt}
          </span>
        </div>

        {/* Title */}
        <h3 style={{ fontSize: 15, fontWeight: 900, color: '#f8f8fa', margin: '0 0 7px', lineHeight: 1.35 }}>
          {post.title}
        </h3>

        {/* Summary */}
        <p style={{ fontSize: 12, color: 'rgba(248,248,250,0.55)', lineHeight: 1.65, margin: '0 0 12px' }}>
          {post.summary}
        </p>

        {/* Podcast player */}
        {isPodcast && (
          <motion.div
            whileHover={{ scale: 1.01 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 11,
              padding: '10px 13px', borderRadius: 14, marginBottom: 12,
              background: 'rgba(168,85,247,0.07)',
              boxShadow: '0 0 0 0.5px rgba(168,85,247,0.22) inset',
            }}
          >
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={toggle}
              style={{
                width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: playing
                  ? 'rgba(168,85,247,0.30)'
                  : 'linear-gradient(135deg,#a855f7,#7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                boxShadow: playing ? '0 0 16px rgba(168,85,247,0.50)' : '0 4px 14px rgba(168,85,247,0.35)',
                transition: 'all 0.2s',
              }}
            >
              {playing ? <Pause size={15} color="#fff" /> : <Play size={15} color="#fff" style={{ marginLeft: 2 }} />}
            </motion.button>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#c084fc', margin: '0 0 2px' }}>Audio Journal</p>
              <p style={{ fontSize: 10, color: 'rgba(248,248,250,0.38)', margin: 0 }}>
                {post.audioDurationSeconds ? fmt(post.audioDurationSeconds) : '—'} · {post.language === 'SW' ? 'Swahili' : 'English'}
              </p>
            </div>
            <Mic size={13} color="rgba(168,85,247,0.50)" />
          </motion.div>
        )}

        {/* Creator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 11 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: `${tc.color}18`,
            boxShadow: `0 0 0 1.5px ${tc.color}30 inset`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 900, color: tc.color,
          }}>
            {post.creator.charAt(0)}
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 800, color: '#f8f8fa', margin: 0 }}>{post.creator}</p>
            <p style={{ fontSize: 9, color: 'rgba(248,248,250,0.35)', margin: 0 }}>{BADGE_LABEL[post.badge] ?? post.badge}</p>
          </div>
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
          {post.tags.map(t => (
            <span key={t} style={{
              fontSize: 9, padding: '2px 8px', borderRadius: 6,
              background: 'rgba(255,255,255,0.04)',
              boxShadow: '0 0 0 0.5px rgba(255,255,255,0.08) inset',
              color: 'rgba(248,248,250,0.42)',
            }}>#{t}</span>
          ))}
        </div>

        {/* Engagement bar */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 11 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'rgba(248,248,250,0.32)' }}>
            <Eye size={11} /> {post.viewsCount.toLocaleString()}
          </span>

          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.88 }}
            onClick={() => { setLiked(v => !v); onLike(post.id); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 10, fontWeight: 700, cursor: 'pointer',
              background: 'none', border: 'none', padding: 0,
              color: liked ? '#f87171' : 'rgba(248,248,250,0.42)',
              transition: 'color 0.15s',
            }}
          >
            <Heart size={13} style={{ fill: liked ? '#f87171' : 'none', transition: 'fill 0.15s' }} />
            {post.likesCount + (liked ? 1 : 0)}
          </motion.button>

          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#4ade80' }}>
            <DollarSign size={11} /> KES {post.tipsEarnedKes.toLocaleString()}
          </span>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onTip(post)}
            style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 9, border: 'none', cursor: 'pointer',
              background: 'rgba(34,197,94,0.10)',
              boxShadow: '0 0 0 0.5px rgba(34,197,94,0.28) inset',
              color: '#4ade80', fontSize: 10, fontWeight: 800, transition: 'all 0.15s',
            }}
          >
            <DollarSign size={11} /> Tip
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.88 }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(248,248,250,0.25)', padding: 0 }}
          >
            <Share2 size={13} />
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}

// ── Tip modal ──────────────────────────────────────────────────────────────
function TipModal({ post, onClose }: { post: Post; onClose: () => void }) {
  const [amount, setAmount] = useState('100');
  const [sent, setSent]     = useState(false);
  const tc = TYPE_CFG[post.contentType];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 80,
        display: 'flex', alignItems: 'flex-end',
        background: 'rgba(0,0,0,0.60)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0,  opacity: 1 }}
        exit={{ y: 60,    opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        style={{
          width: '100%', maxWidth: 520, margin: '0 auto',
          background: 'rgba(10,10,18,0.92)',
          backdropFilter: 'blur(32px)',
          borderRadius: '24px 24px 0 0',
          padding: '24px 20px',
          boxShadow: '0 0 0 0.5px rgba(255,255,255,0.08) inset, 0 -16px 50px rgba(0,0,0,0.60)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 20 }}>
          <div style={{
            width: 46, height: 46, borderRadius: '50%',
            background: `${tc.color}18`,
            boxShadow: `0 0 0 1.5px ${tc.color}35 inset, 0 0 16px ${tc.color}25`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 19, fontWeight: 900, color: tc.color,
          }}>
            {post.creator.charAt(0)}
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 900, color: '#f8f8fa', margin: 0 }}>Tip {post.creator}</p>
            <p style={{ fontSize: 10, color: 'rgba(248,248,250,0.38)', margin: 0 }}>{post.title.slice(0, 42)}…</p>
          </div>
        </div>

        <p className="label-caps" style={{ marginBottom: 10 }}>Amount (KES)</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {['50','100','250','500'].map(a => (
            <motion.button
              key={a}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setAmount(a)}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: amount === a ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(8px)',
                boxShadow: amount === a
                  ? '0 0 0 1px rgba(34,197,94,0.45) inset, 0 0 14px rgba(34,197,94,0.18)'
                  : '0 0 0 0.5px rgba(255,255,255,0.09) inset',
                color: amount === a ? '#4ade80' : 'rgba(248,248,250,0.50)',
                fontSize: 13, fontWeight: 800, transition: 'all 0.15s',
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
            width: '100%', background: 'rgba(255,255,255,0.04)', border: 'none',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.09) inset',
            borderRadius: 12, padding: '11px 14px',
            fontSize: 14, color: '#f8f8fa', outline: 'none',
            fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 14,
            caretColor: '#10b981', transition: 'box-shadow 0.2s',
          }}
          onFocus={e => (e.target.style.boxShadow = '0 0 0 1.5px rgba(34,197,94,0.50) inset')}
          onBlur={e  => (e.target.style.boxShadow = '0 0 0 1px rgba(255,255,255,0.09) inset')}
        />

        <motion.button
          whileHover={!sent ? { scale: 1.02 } : {}}
          whileTap={!sent ? { scale: 0.97 } : {}}
          onClick={() => { setSent(true); setTimeout(onClose, 1800); }}
          disabled={sent}
          style={{
            width: '100%', padding: '14px 0', borderRadius: 15, border: 'none',
            cursor: sent ? 'default' : 'pointer',
            background: sent ? 'rgba(34,197,94,0.18)' : 'linear-gradient(135deg,#22c55e,#16a34a)',
            color: sent ? '#4ade80' : '#fff',
            fontSize: 14, fontWeight: 800, transition: 'all 0.2s',
            boxShadow: sent ? 'none' : '0 6px 22px rgba(34,197,94,0.38)',
          }}
        >
          {sent ? '✓ Tip Sent!' : `Send KES ${amount} via M-Pesa / yBOB`}
        </motion.button>

        <button
          onClick={onClose}
          style={{
            width: '100%', marginTop: 10, padding: '12px 0', borderRadius: 13, border: 'none',
            background: 'rgba(255,255,255,0.04)',
            boxShadow: '0 0 0 0.5px rgba(255,255,255,0.08) inset',
            color: 'rgba(248,248,250,0.38)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
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
  const [focused,  setFocused]  = useState(false);

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

  return (
    <main style={{
      minHeight: '100dvh', paddingBottom: 96,
      color: '#f8f8fa', fontFamily: 'var(--font-sans)',
      position: 'relative',
    }}>

      {/* ── Ambient orbs ── */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: '6%', right: '-10%',
          width: 360, height: 360, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
          animation: 'orb-drift-a 14s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '20%', left: '-8%',
          width: 280, height: 280, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)',
          animation: 'orb-drift-b 18s ease-in-out infinite',
        }} />
      </div>

      {/* ── STICKY HEADER ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'rgba(4,4,8,0.80)',
        backdropFilter: 'blur(28px) saturate(1.8)',
        boxShadow: '0 1px 0 rgba(16,185,129,0.10)',
      }}>
        {/* Title row */}
        <div style={{ padding: '18px 18px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 14, flexShrink: 0,
            background: 'rgba(16,185,129,0.14)',
            backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 18px rgba(16,185,129,0.20)',
          }}>
            <Newspaper size={20} color="#10b981" strokeWidth={1.8} />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 19, fontWeight: 900, margin: '0 0 1px', letterSpacing: '-0.4px' }}>
              Community Info Hub
            </h1>
            <p style={{ fontSize: 10, color: 'rgba(248,248,250,0.38)', margin: 0 }}>
              Field journals · Market news · Audio guides · Chama tips
            </p>
          </div>
          <motion.button
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.4 }}
            onClick={load}
            style={{
              width: 34, height: 34, borderRadius: 10, border: 'none', cursor: 'pointer',
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 0 0 0.5px rgba(255,255,255,0.08) inset',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <RefreshCw size={13} color="rgba(248,248,250,0.38)"
              style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </motion.button>
        </div>

        {/* Search bar */}
        <motion.div
          animate={{
            boxShadow: focused
              ? '0 0 0 1.5px rgba(16,185,129,0.45) inset, 0 4px 16px rgba(16,185,129,0.12)'
              : '0 0 0 0.5px rgba(255,255,255,0.08) inset',
          }}
          transition={{ duration: 0.2 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 9,
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(12px)',
            borderRadius: 13, padding: '9px 13px',
            margin: '12px 18px 0',
          }}
        >
          <Search size={13} color="rgba(248,248,250,0.30)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search articles, guides, market news…"
            style={{
              background: 'none', border: 'none', outline: 'none',
              flex: 1, fontSize: 13, color: '#f8f8fa',
              fontFamily: 'inherit', caretColor: '#10b981',
            }}
          />
        </motion.div>

        {/* Category pills */}
        <div style={{
          display: 'flex', gap: 5, overflowX: 'auto',
          scrollbarWidth: 'none', padding: '10px 18px 0',
        }}>
          {CATEGORIES.map(c => (
            <motion.button
              key={c.id}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCategory(c.id)}
              style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 14px',
                borderRadius: category === c.id ? '10px 10px 0 0' : 10,
                border: 'none', cursor: 'pointer',
                background: category === c.id ? `${c.color}14` : 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(8px)',
                boxShadow: category === c.id
                  ? `0 -1px 0 ${c.color}60 inset`
                  : '0 0 0 0.5px rgba(255,255,255,0.06) inset',
                color: category === c.id ? c.color : 'rgba(248,248,250,0.38)',
                fontSize: 11, fontWeight: category === c.id ? 800 : 600,
                transition: 'all 0.18s',
              }}
            >
              {c.icon} {c.label}
            </motion.button>
          ))}
        </div>

        {/* Stats strip */}
        <div style={{
          display: 'flex', gap: 0,
          background: 'rgba(255,255,255,0.02)',
          boxShadow: '0 -1px 0 rgba(255,255,255,0.04) inset',
          marginTop: 8,
        }}>
          {[
            { label:'Articles', value: posts.filter(p=>p.contentType==='ARTICLE').length,         color:'#10b981' },
            { label:'Journals', value: posts.filter(p=>p.contentType==='FIELD_JOURNAL').length,   color:'#22c55e' },
            { label:'Podcasts', value: posts.filter(p=>p.contentType==='AUDIO_PODCAST').length,   color:'#a855f7' },
            { label:'Markets',  value: posts.filter(p=>p.contentType==='MARKET_NEWS').length,     color:'#f59e0b' },
          ].map((s, i, arr) => (
            <div key={s.label} style={{
              flex: 1, textAlign: 'center', padding: '9px 0',
              boxShadow: i < arr.length - 1 ? '1px 0 0 rgba(255,255,255,0.04)' : 'none',
            }}>
              <p style={{ fontSize: 15, fontWeight: 900, color: s.color, margin: '0 0 1px', letterSpacing: -0.5 }}>
                {s.value}
              </p>
              <p style={{ fontSize: 8, color: 'rgba(248,248,250,0.30)', fontWeight: 700, letterSpacing: 0.7, textTransform: 'uppercase', margin: 0 }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURED BANNER ── */}
      <AnimatePresence mode="wait">
        {featuredPost && (
          <motion.div
            key={featuredPost.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={{ margin: '18px 18px 0', position: 'relative', zIndex: 2 }}
          >
            <p className="label-caps" style={{ marginBottom: 10 }}>Featured</p>
            <motion.div
              whileHover={{ y: -3 }}
              style={{
                borderRadius: 24, padding: '20px 18px', position: 'relative', overflow: 'hidden',
                background: `linear-gradient(135deg, ${TYPE_CFG[featuredPost.contentType].color}14 0%, rgba(6,6,12,0.65) 100%)`,
                backdropFilter: 'blur(28px)',
                boxShadow: `0 0 0 0.5px ${TYPE_CFG[featuredPost.contentType].color}22 inset, 0 16px 50px rgba(0,0,0,0.40), 0 0 60px ${TYPE_CFG[featuredPost.contentType].color}08`,
                cursor: 'pointer',
              }}
            >
              {/* Top glow line */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${TYPE_CFG[featuredPost.contentType].color},transparent)` }} />
              {/* Glow blob */}
              <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: `radial-gradient(circle, ${TYPE_CFG[featuredPost.contentType].color}14 0%, transparent 70%)`, pointerEvents: 'none' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                {TYPE_CFG[featuredPost.contentType].icon}
                <span style={{ fontSize: 9, fontWeight: 800, color: TYPE_CFG[featuredPost.contentType].color, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                  {TYPE_CFG[featuredPost.contentType].label}
                </span>
                <span className="badge badge-live" style={{ marginLeft: 'auto' }}>New</span>
              </div>

              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#f8f8fa', margin: '0 0 9px', lineHeight: 1.3 }}>
                {featuredPost.title}
              </h2>
              <p style={{ fontSize: 12, color: 'rgba(248,248,250,0.55)', lineHeight: 1.65, margin: '0 0 14px' }}>
                {featuredPost.summary.slice(0, 130)}…
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: 11, color: 'rgba(248,248,250,0.40)', margin: 0 }}>
                  {featuredPost.creator} · {featuredPost.publishedAt}
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTipPost(featuredPost)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '7px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: 'rgba(34,197,94,0.12)',
                    boxShadow: '0 0 0 0.5px rgba(34,197,94,0.30) inset',
                    color: '#4ade80', fontSize: 10, fontWeight: 800,
                  }}
                >
                  <DollarSign size={11} /> Tip Creator
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FEED ── */}
      <div style={{ padding: '18px 18px 0', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <p className="label-caps">
            {filtered.length} {category === 'ALL' ? 'Posts' : CATEGORIES.find(c => c.id === category)?.label}
          </p>
          <Link href="/hub/create" style={{
            fontSize: 10, color: '#10b981', fontWeight: 700,
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3,
          }}>
            + Publish <ChevronRight size={10} />
          </Link>
        </div>

        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '48px 20px', color: 'rgba(248,248,250,0.28)', fontSize: 13 }}
          >
            No posts found. Try a different category or search term.
          </motion.div>
        ) : (
          feedPosts.map((p, i) => (
            <PostCard key={p.id} post={p} idx={i} onLike={handleLike} onTip={setTipPost} />
          ))
        )}

        {/* ── KAI ONBOARDING CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            marginTop: 8, borderRadius: 22, padding: '18px 17px',
            background: 'linear-gradient(135deg, rgba(168,85,247,0.12) 0%, rgba(6,6,12,0.55) 100%)',
            backdropFilter: 'blur(22px)',
            boxShadow: '0 0 0 0.5px rgba(168,85,247,0.20) inset, 0 8px 30px rgba(0,0,0,0.32)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute', top: -30, right: -30, width: 100, height: 100,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(168,85,247,0.14) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 13,
              background: 'rgba(168,85,247,0.16)',
              boxShadow: '0 0 18px rgba(168,85,247,0.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Zap size={19} color="#a855f7" />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 900, color: '#f8f8fa', margin: 0 }}>
                KAI Onboarding Agent
              </p>
              <p style={{ fontSize: 10, color: 'rgba(248,248,250,0.38)', margin: 0 }}>
                Forest Guardian · MSME Merchant · Chama Saver
              </p>
            </div>
          </div>

          <p style={{ fontSize: 12, color: 'rgba(248,248,250,0.55)', lineHeight: 1.60, margin: '0 0 14px' }}>
            Not sure where to start? Ask KAI to analyse your profile and recommend the best vault strategy, CFA group, or Chama to join.
          </p>

          <Link href="/ai" style={{ textDecoration: 'none' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              style={{
                width: '100%', padding: '13px 0', borderRadius: 14, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                color: '#fff', fontSize: 13, fontWeight: 800,
                boxShadow: '0 6px 22px rgba(139,92,246,0.40)',
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
