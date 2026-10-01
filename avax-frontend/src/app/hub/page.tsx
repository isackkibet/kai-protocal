'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Newspaper, TreePine, ArrowRight, ExternalLink, PenTool, Sprout,
  BookOpen, MessageCircle, Mic, FileText, ShieldCheck, Library,
  Users, Coins, Gift, Search, Sparkles, Send,
} from 'lucide-react';
import { SIHU_THEME, OLOOLUA_THEME, MONO, SERIF, SANS } from '@/lib/hubs/hub-theme';

/* Full external portals, only shown when they are actually deployed. */
const SIHU_PORTAL_URL = process.env.NEXT_PUBLIC_SIHU_PORTAL_URL || '';
const OLOOLUA_PORTAL_URL = process.env.NEXT_PUBLIC_OLOOLUA_PORTAL_URL || '';

const BLUE = SIHU_THEME.blue;
const GREEN = OLOOLUA_THEME.emerald;
const TEXT = '#F8FAFC';
const DIM = '#94A3B8';
const LINE = 'rgba(255,255,255,0.08)';

interface FeedPost {
  id: string;
  slug: string;
  title: string;
  summary: string;
  contentType: string;
  category: string;
  creator: string;
  publishedAt: string;
}

/* The four things a member can do here, most valuable first. */
const ACTIONS = [
  {
    title: 'Log a tree planting',
    desc: 'Record seedlings you planted with your Community Forest Association.',
    reward: '+50 points',
    rewardIcon: Gift,
    href: '/cfa',
    cta: 'Open CFA dashboard',
    icon: Sprout,
    accent: GREEN,
  },
  {
    title: 'Write a story',
    desc: 'Share news from your area. Readers can tip your stories in KES.',
    reward: 'Earn tips',
    rewardIcon: Coins,
    href: '/hub/create',
    cta: 'Start writing',
    icon: PenTool,
    accent: BLUE,
  },
  {
    title: 'Learn a methodology',
    desc: 'Step-by-step guides such as Jaza Miti and GTCI for your CFA.',
    reward: 'Free guides',
    rewardIcon: BookOpen,
    href: '/conservation/methodologies',
    cta: 'Browse guides',
    icon: Library,
    accent: GREEN,
  },
  {
    title: 'Ask KAI',
    desc: 'Get quick answers about trees, planting seasons and conservation.',
    reward: 'Instant answers',
    rewardIcon: MessageCircle,
    href: '/conservation/ask',
    cta: 'Ask a question',
    icon: MessageCircle,
    accent: BLUE,
  },
] as const;

const HUBS = [
  {
    id: 'sihu',
    name: 'SIHU News',
    label: 'Blue hub · Media',
    desc: 'Community news and investigations from the Lake Victoria Basin, checked by an AI pre-review and a human editor before publishing.',
    icon: Newspaper,
    accent: BLUE,
    bg: 'linear-gradient(180deg, #0B1934 0%, #020617 100%)',
    links: [
      { label: 'Latest stories', href: '#latest', icon: Newspaper },
      { label: 'Write a story', href: '/hub/create', icon: PenTool },
      { label: 'Editor desk', href: '/hub/review', icon: ShieldCheck },
    ],
    portal: SIHU_PORTAL_URL
      ? { label: 'Open full SIHU site', href: SIHU_PORTAL_URL, extras: [
          { label: 'Audio studio', href: `${SIHU_PORTAL_URL}/studio`, icon: Mic },
          { label: 'Document archive', href: `${SIHU_PORTAL_URL}/documents`, icon: FileText },
        ] }
      : null,
  },
  {
    id: 'oloolua',
    name: 'Oloolua Conservation',
    label: 'Green hub · Forest CFA',
    desc: 'Hands-on forest conservation with the Oloolua Youth Guardians: seedlings, patrols, beekeeping and verified planting records.',
    icon: TreePine,
    accent: GREEN,
    bg: 'linear-gradient(180deg, #0A2D20 0%, #04150E 100%)',
    links: [
      { label: 'Conservation home', href: '/conservation', icon: TreePine },
      { label: 'Knowledge base', href: '/conservation/knowledge', icon: BookOpen },
      { label: 'Resources', href: '/conservation/resources', icon: Library },
      { label: 'CFA dashboard', href: '/cfa', icon: Users },
    ],
    portal: OLOOLUA_PORTAL_URL
      ? { label: 'Open full Oloolua site', href: OLOOLUA_PORTAL_URL, extras: [
          { label: 'Seedling registry', href: `${OLOOLUA_PORTAL_URL}/seedlings.html`, icon: Sprout },
          { label: 'Member dashboard', href: `${OLOOLUA_PORTAL_URL}/member-dashboard.html`, icon: Users },
        ] }
      : null,
  },
] as const;

const TYPE_LABEL: Record<string, string> = {
  ARTICLE: 'Article', NEWS_UPDATE: 'News', EDUCATIONAL_GUIDE: 'Guide', FIELD_JOURNAL: 'Field journal',
  AUDIO_PODCAST: 'Podcast', VIDEO: 'Video', DOCUMENT: 'Document', REPORT: 'Report',
};
/** CONSERVATION_IMPACT -> Conservation impact */
const humanize = (t: string) => (t ? t.charAt(0) + t.slice(1).toLowerCase().replace(/_/g, ' ') : '');
const typeLabel = (t: string) => TYPE_LABEL[t] ?? humanize(t);

export default function HubPage() {
  const [posts, setPosts] = useState<FeedPost[] | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/hub/feed')
      .then(r => (r.ok ? r.json() : { posts: [] }))
      .then(d => { if (!cancelled) setPosts(d.posts ?? []); })
      .catch(() => { if (!cancelled) setPosts([]); });
    return () => { cancelled = true; };
  }, []);

  const shown = (posts ?? []).filter(p =>
    !q.trim() || `${p.title} ${p.summary} ${p.category}`.toLowerCase().includes(q.trim().toLowerCase()),
  );
  const headline = posts?.[0];

  return (
    <main style={{
      minHeight: '100dvh',
      background: 'linear-gradient(180deg, #020617 0%, #071510 50%, #020617 100%)',
      color: TEXT, ...SANS, paddingBottom: 110,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..700&family=IBM+Plex+Mono:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
        .hub-wrap { max-width: 1120px; margin: 0 auto; padding: 0 24px; }
        .hub-actions { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        .hub-stories { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .hub-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .hub-flow { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .hub-card { transition: transform 0.2s ease, border-color 0.2s ease; }
        /* CSS-only entrance: cards are visible even before the page's JavaScript loads */
        .hub-rise { animation: hub-rise 0.35s ease both; }
        @keyframes hub-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .hub-rise { animation: none; } }
        .hub-card:hover { transform: translateY(-2px); }
        .hub-link:hover { background: rgba(255,255,255,0.07) !important; }
        @media (max-width: 980px) {
          .hub-actions { grid-template-columns: 1fr 1fr; }
          .hub-stories { grid-template-columns: 1fr 1fr; }
          .hub-flow { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 720px) {
          .hub-wrap { padding: 0 16px; }
          .hub-pair, .hub-stories { grid-template-columns: 1fr; }
        }
        @media (max-width: 420px) { .hub-actions, .hub-flow { grid-template-columns: 1fr; } }
      `}</style>

      <div className="hub-wrap">

        {/* Latest headline: a real, clickable story instead of a static ticker */}
        {headline && (
          <Link href={`/hub/${headline.slug}`} style={{
            marginTop: 20, display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none',
            background: 'rgba(2,6,23,0.85)', border: `1px solid ${BLUE}40`, borderRadius: 12, padding: '10px 14px',
          }}>
            <span style={{ ...MONO, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: '#FFFFFF', background: SIHU_THEME.blueDeep, padding: '3px 9px', borderRadius: 6, flexShrink: 0 }}>
              Latest
            </span>
            <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: '#E2E8F0', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {headline.title}
            </span>
            <ArrowRight size={15} color={BLUE} style={{ flexShrink: 0 }} />
          </Link>
        )}

        {/* Masthead */}
        <header style={{ padding: '34px 0 26px' }}>
          <p style={{ ...MONO, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase', color: '#7DD3FC', fontWeight: 700, margin: '0 0 10px' }}>
            KAI Info Hub
          </p>
          <h1 style={{ ...SERIF, fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 700, margin: 0, lineHeight: 1.15, letterSpacing: '-0.5px' }}>
            Learn, share and <span style={{ color: GREEN }}>protect</span> your environment
          </h1>
          <p style={{ fontSize: 15, color: DIM, margin: '10px 0 0', maxWidth: 620, lineHeight: 1.6 }}>
            Local news from <strong style={{ color: BLUE }}>SIHU</strong> and hands-on forest work with the <strong style={{ color: GREEN }}>Oloolua Youth Guardians</strong>, in one place.
          </p>
        </header>

        {/* What you can do */}
        <section aria-labelledby="hub-actions">
          <h2 id="hub-actions" style={{ ...MONO, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: DIM, fontWeight: 700, margin: '0 0 14px' }}>
            What you can do
          </h2>
          <div className="hub-actions">
            {ACTIONS.map((a, i) => {
              const Icon = a.icon;
              const RewardIcon = a.rewardIcon;
              return (
                <div key={a.title} className="hub-rise" style={{ animationDelay: `${i * 50}ms` }}>
                  <Link href={a.href} className="hub-card" style={{
                    height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', textDecoration: 'none', color: TEXT,
                    background: `linear-gradient(160deg, ${a.accent}1F 0%, rgba(2,6,23,0.9) 70%)`,
                    border: `1px solid ${a.accent}45`, borderRadius: 18, padding: '20px 18px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <span style={{ width: 42, height: 42, borderRadius: 12, background: `${a.accent}26`, color: a.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={21} />
                      </span>
                      <span style={{ ...MONO, fontSize: 11, fontWeight: 700, color: '#020617', background: a.accent, padding: '4px 9px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <RewardIcon size={12} /> {a.reward}
                      </span>
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 6px' }}>{a.title}</h3>
                    <p style={{ fontSize: 13, color: DIM, margin: '0 0 16px', lineHeight: 1.5, flex: 1 }}>{a.desc}</p>
                    <span style={{ fontSize: 13, fontWeight: 700, color: a.accent, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {a.cta} <ArrowRight size={14} />
                    </span>
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* Latest stories from the real SIHU feed */}
        <section id="latest" style={{ marginTop: 40, scrollMarginTop: 20 }} aria-labelledby="hub-latest">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
            <div>
              <h2 id="hub-latest" style={{ ...SERIF, fontSize: 24, fontWeight: 700, margin: 0 }}>Latest stories</h2>
              <p style={{ fontSize: 13, color: DIM, margin: '4px 0 0' }}>Reviewed and published by the SIHU editors.</p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${LINE}`, borderRadius: 10, padding: '8px 12px', minWidth: 220 }}>
              <Search size={14} color={DIM} />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search stories" aria-label="Search stories"
                style={{ background: 'none', border: 'none', outline: 'none', color: TEXT, fontSize: 13, fontFamily: 'inherit', width: '100%' }} />
            </label>
          </div>

          {posts === null ? (
            <div className="hub-stories">
              {[0, 1, 2].map(i => (
                <div key={i} style={{ height: 150, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: `1px solid ${LINE}` }} />
              ))}
            </div>
          ) : shown.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', border: `1px dashed ${LINE}`, borderRadius: 16, color: DIM }}>
              <p style={{ margin: '0 0 10px', color: TEXT, fontWeight: 600 }}>{q ? 'No stories match your search.' : 'No stories yet.'}</p>
              <Link href="/hub/create" style={{ color: BLUE, fontWeight: 700, textDecoration: 'none' }}>Be the first to write one</Link>
            </div>
          ) : (
            <div className="hub-stories">
              {shown.slice(0, 6).map(p => (
                <Link key={p.id} href={`/hub/${p.slug}`} className="hub-card" style={{
                  display: 'flex', flexDirection: 'column', textDecoration: 'none', color: TEXT,
                  background: 'rgba(11,25,52,0.55)', border: `1px solid ${LINE}`, borderRadius: 16, padding: '16px 16px 14px',
                }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                    <span style={{ ...MONO, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#7DD3FC', background: `${BLUE}1F`, padding: '2px 8px', borderRadius: 4 }}>
                      {typeLabel(p.contentType)}
                    </span>
                    <span style={{ ...MONO, fontSize: 10, color: DIM, padding: '2px 0' }}>{humanize(p.category)}</span>
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px', lineHeight: 1.35 }}>{p.title}</h3>
                  {p.summary && (
                    <p style={{ fontSize: 12.5, color: DIM, margin: '0 0 12px', lineHeight: 1.5, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {p.summary}
                    </p>
                  )}
                  <p style={{ ...MONO, fontSize: 10.5, color: '#64748B', margin: 'auto 0 0' }}>{p.creator} · {p.publishedAt}</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* How a story gets published, step by step */}
        <section style={{ marginTop: 40, padding: '24px 22px', borderRadius: 20, background: 'linear-gradient(160deg, rgba(56,189,248,0.10) 0%, rgba(2,6,23,0.9) 60%)', border: `1px solid ${BLUE}33` }} aria-labelledby="hub-flow">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 18 }}>
            <div>
              <h2 id="hub-flow" style={{ ...SERIF, fontSize: 24, fontWeight: 700, margin: 0 }}>How to publish a story</h2>
              <p style={{ fontSize: 13.5, color: DIM, margin: '4px 0 0' }}>Anyone can write. Every story is checked by a person before it goes live.</p>
            </div>
            <Link href="/hub/create" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderRadius: 10, background: BLUE, color: '#020617', fontWeight: 700, fontSize: 13.5, textDecoration: 'none' }}>
              <PenTool size={15} /> Start writing
            </Link>
          </div>
          <ol className="hub-flow" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {[
              { icon: PenTool, t: 'Write', d: 'Sign in with your email and write your story, guide or field report. Save it as a draft any time.' },
              { icon: Sparkles, t: 'Free AI check', d: 'One tap checks for missing sources, copied text and unsupported claims, so you can fix them first.' },
              { icon: Send, t: 'Editor review', d: 'A SIHU editor reads it and publishes it, or sends it back with a note on what to change.' },
              { icon: Coins, t: 'Live and earning', d: 'Your story appears in Latest stories. Readers can like, comment, save and tip you in KES.' },
            ].map((step, i) => {
              const SIcon = step.icon;
              return (
                <li key={step.t} style={{ position: 'relative', padding: '16px 16px', borderRadius: 14, background: 'rgba(2,6,23,0.6)', border: `1px solid ${LINE}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ ...MONO, width: 26, height: 26, borderRadius: '50%', background: `${BLUE}26`, color: '#7DD3FC', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                    <SIcon size={16} color={BLUE} />
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{step.t}</span>
                  </div>
                  <p style={{ fontSize: 12.5, color: DIM, lineHeight: 1.55, margin: 0 }}>{step.d}</p>
                </li>
              );
            })}
          </ol>
          <p style={{ fontSize: 12.5, color: DIM, margin: '14px 0 0' }}>
            Are you a SIHU editor? <Link href="/hub/review" style={{ color: '#7DD3FC', fontWeight: 700, textDecoration: 'none' }}>Open the editor desk</Link>
          </p>
        </section>

        {/* The two hubs, with only links that work */}
        <section style={{ marginTop: 40 }} aria-labelledby="hub-pair">
          <h2 id="hub-pair" style={{ ...MONO, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: DIM, fontWeight: 700, margin: '0 0 14px' }}>
            Explore the hubs
          </h2>
          <div className="hub-pair">
            {HUBS.map(hub => {
              const Icon = hub.icon;
              return (
                <article key={hub.id} style={{ background: hub.bg, border: `1px solid ${hub.accent}45`, borderRadius: 20, padding: '24px 22px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${hub.accent}, transparent)` }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <span style={{ width: 44, height: 44, borderRadius: 12, background: `${hub.accent}22`, color: hub.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={22} />
                    </span>
                    <div>
                      <p style={{ ...MONO, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: hub.accent, fontWeight: 700, margin: 0 }}>{hub.label}</p>
                      <h3 style={{ ...SERIF, fontSize: 22, fontWeight: 700, margin: '2px 0 0' }}>{hub.name}</h3>
                    </div>
                  </div>
                  <p style={{ fontSize: 13.5, color: 'rgba(248,250,252,0.75)', lineHeight: 1.6, margin: '0 0 16px' }}>{hub.desc}</p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[...hub.links, ...(hub.portal?.extras ?? [])].map(l => {
                      const LIcon = l.icon;
                      const external = l.href.startsWith('http');
                      const style: React.CSSProperties = {
                        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10,
                        background: 'rgba(255,255,255,0.04)', border: `1px solid ${LINE}`, color: TEXT,
                        fontSize: 13, fontWeight: 600, textDecoration: 'none',
                      };
                      return external ? (
                        <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="hub-link" style={style}>
                          <LIcon size={15} color={hub.accent} /> {l.label} <ExternalLink size={12} style={{ marginLeft: 'auto', opacity: 0.6 }} />
                        </a>
                      ) : (
                        <Link key={l.label} href={l.href} className="hub-link" style={style}>
                          <LIcon size={15} color={hub.accent} /> {l.label}
                        </Link>
                      );
                    })}
                  </div>

                  {hub.portal && (
                    <a href={hub.portal.href} target="_blank" rel="noreferrer" style={{
                      marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10,
                      background: hub.accent, color: '#020617', fontSize: 13, fontWeight: 700, textDecoration: 'none',
                    }}>
                      {hub.portal.label} <ExternalLink size={13} />
                    </a>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
