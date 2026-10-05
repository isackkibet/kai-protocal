'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Bot, UserCircle2, Newspaper, TreePine,
  ChevronRight, X, BookOpen, PenTool, Sprout, ExternalLink, LayoutGrid,
} from 'lucide-react';

const itemStyle = (active: boolean): React.CSSProperties => ({
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  justifyContent: 'center', gap: 3, textDecoration: 'none',
  position: 'relative', padding: '6px clamp(4px, 2vw, 12px)', borderRadius: 12,
  minWidth: 48, flex: 1, transition: 'all 0.2s ease',
  background: active ? 'rgba(16,185,129,0.12)' : 'transparent',
  border: 'none', cursor: 'pointer', font: 'inherit',
  WebkitTapHighlightColor: 'transparent',
  userSelect: 'none',
});

const ext = (u?: string) => (u && /^https?:\/\//.test(u) ? u : null);

/* Plain-language choices: what each hub is for and what you can do there. */
const HUB_OPTIONS = [
  {
    id: 'sihu',
    name: 'News & stories',
    source: 'SIHU',
    desc: 'Read local news from the Lake Victoria Basin, or write your own story.',
    href: '/hub',
    match: (p: string) => p.startsWith('/hub'),
    icon: Newspaper,
    accent: '#38BDF8',
    bg: 'linear-gradient(135deg, rgba(56, 189, 248, 0.16) 0%, rgba(2, 6, 23, 0.95) 100%)',
    border: 'rgba(56, 189, 248, 0.35)',
    quick: [
      { label: 'Read news', href: '/hub#latest', icon: BookOpen },
      { label: 'Write a story', href: '/hub/create', icon: PenTool },
    ],
    portal: ext(process.env.NEXT_PUBLIC_SIHU_PORTAL_URL),
  },
  {
    id: 'oloolua',
    name: 'Forest conservation',
    source: 'Oloolua Youth Guardians',
    desc: 'Your CFA nursery groups: record seedlings, planting and survival, with verified records.',
    href: '/conservation',
    match: (p: string) => p.startsWith('/conservation') || p.startsWith('/cfa') || p.startsWith('/nursery'),
    icon: TreePine,
    accent: '#10B981',
    bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(4, 21, 14, 0.95) 100%)',
    border: 'rgba(16, 185, 129, 0.35)',
    quick: [
      { label: 'Nursery groups', href: '/nursery', icon: Sprout },
      { label: 'Guides', href: '/conservation/methodologies', icon: BookOpen },
    ],
    portal: ext(process.env.NEXT_PUBLIC_OLOOLUA_PORTAL_URL),
  },
];

export default function BottomNav() {
  const path = usePathname();
  const router = useRouter();
  // The picker is open only on the page it was opened from, so navigating
  // anywhere closes it without an extra effect.
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const hubMenuOpen = menuPath !== null && menuPath === path;
  const setHubMenuOpen = (v: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof v === 'function' ? v(hubMenuOpen) : v;
    setMenuPath(next ? path : null);
  };

  // /cfa is part of the Oloolua hub, so the indicator has to follow the same
  // rule the picker's match() uses or the icon stays unlit on those pages.
  const isInfoHubActive = !!path && HUB_OPTIONS.some(opt => opt.match(path));

  // Escape closes the hub picker
  useEffect(() => {
    if (!hubMenuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuPath(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hubMenuOpen]);

  const selectHub = (href: string) => {
    setHubMenuOpen(false);
    if (href.startsWith('http://') || href.startsWith('https://')) {
      window.location.assign(href);
    } else {
      router.push(href);
    }
  };

  return (
    <>
      {/* ── INFO HUB SELECTION MODAL ── */}
      <AnimatePresence>
        {hubMenuOpen && (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              paddingBottom: 78,
            }}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setHubMenuOpen(false)}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(4, 12, 8, 0.78)',
                backdropFilter: 'blur(10px)',
              }}
            />

            {/* Selection Card */}
            <motion.div
              initial={{ opacity: 0, y: 32, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.95 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="hub-picker-title"
              style={{
                position: 'relative', width: '100%', maxWidth: 460,
                margin: '0 16px',
                background: 'linear-gradient(180deg, #0F2A1E 0%, #081610 100%)',
                border: '1px solid rgba(200, 155, 60, 0.30)',
                borderRadius: 24,
                padding: '24px 20px 22px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(16, 185, 129, 0.12)',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
                <div>
                  <h3 id="hub-picker-title" style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#F6F2E7', letterSpacing: '-0.3px' }}>
                    What would you like to explore?
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(246, 242, 231, 0.65)' }}>
                    Pick one. You can switch at any time.
                  </p>
                </div>
                <button
                  onClick={() => setHubMenuOpen(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)', border: 'none', borderRadius: '50%',
                    width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#F6F2E7', cursor: 'pointer', flexShrink: 0,
                  }}
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {/* The two hubs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {HUB_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isCurrent = !!path && opt.match(path);
                  return (
                    <div
                      key={opt.id}
                      style={{
                        background: opt.bg,
                        border: `1px solid ${isCurrent ? opt.accent : opt.border}`,
                        borderRadius: 16,
                        boxShadow: isCurrent ? `0 0 16px ${opt.accent}25` : 'none',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Main choice: the whole row is one button */}
                      <button
                        onClick={() => selectHub(opt.href)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px 16px 12px',
                          background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', font: 'inherit', color: 'inherit',
                        }}
                      >
                        <span style={{
                          width: 46, height: 46, borderRadius: 12, background: `${opt.accent}20`, color: opt.accent,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <Icon size={24} strokeWidth={2} />
                        </span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 16, fontWeight: 700, color: '#F6F2E7' }}>{opt.name}</span>
                            {isCurrent && (
                              <span style={{ fontSize: 10, fontWeight: 700, color: '#020617', background: opt.accent, padding: '2px 7px', borderRadius: 999 }}>
                                You are here
                              </span>
                            )}
                          </span>
                          <span style={{ display: 'block', fontSize: 11, fontWeight: 600, color: opt.accent, margin: '1px 0 4px' }}>
                            by {opt.source}
                          </span>
                          <span style={{ display: 'block', fontSize: 12.5, color: 'rgba(246, 242, 231, 0.72)', lineHeight: 1.45 }}>
                            {opt.desc}
                          </span>
                        </span>
                        <ChevronRight size={18} color={opt.accent} style={{ flexShrink: 0 }} />
                      </button>

                      {/* Quick actions: jump straight to the most useful thing */}
                      <div style={{ display: 'flex', gap: 8, padding: '0 16px 14px 76px', flexWrap: 'wrap' }}>
                        {opt.quick.map((q) => {
                          const QIcon = q.icon;
                          return (
                            <button
                              key={q.label}
                              onClick={() => selectHub(q.href)}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 999,
                                background: 'rgba(0,0,0,0.35)', border: `1px solid ${opt.accent}55`, color: '#F6F2E7',
                                fontSize: 12, fontWeight: 600, cursor: 'pointer', font: 'inherit',
                              }}
                            >
                              <QIcon size={13} color={opt.accent} />
                              <span style={{ fontSize: 12, fontWeight: 600 }}>{q.label}</span>
                            </button>
                          );
                        })}
                        {opt.portal && (
                          <a
                            href={opt.portal}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 999,
                              color: opt.accent, fontSize: 12, fontWeight: 600, textDecoration: 'none',
                            }}
                          >
                            Full website <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Overview of both hubs */}
              <button
                onClick={() => selectHub('/hubs')}
                style={{
                  marginTop: 14, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '11px 0', borderRadius: 12, border: '1px solid rgba(200, 155, 60, 0.30)', background: 'none',
                  color: '#E4C878', fontSize: 13, fontWeight: 700, cursor: 'pointer', font: 'inherit',
                }}
              >
                <LayoutGrid size={15} />
                <span style={{ fontSize: 13, fontWeight: 700 }}>See both hubs together</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── BOTTOM NAV BAR ── */}
      <nav className="bottom-nav">
        {/* Home */}
        <Link href="/" style={itemStyle(path === '/')} prefetch={false}>
          {path === '/' && <motion.span layoutId="nav-indicator" style={{
            position: 'absolute', top: 0, left: '20%', right: '20%',
            height: 2, borderRadius: '0 0 4px 4px',
            background: 'linear-gradient(90deg, transparent, #10b981, transparent)',
          }} />}
          <motion.span whileHover={{ y: -2 }} whileTap={{ scale: 0.9 }} style={{ display: 'inline-flex' }}>
            <Home size={22} strokeWidth={path === '/' ? 2.4 : 1.7}
              color={path === '/' ? '#10b981' : 'rgba(255,255,255,0.32)'}
              style={{ transition: 'all 0.2s', transform: path === '/' ? 'scale(1.08) translateY(-1px)' : 'scale(1)' }} />
          </motion.span>
          <span style={{
            fontSize: 11, fontWeight: path === '/' ? 800 : 500, letterSpacing: 0.3,
            color: path === '/' ? '#10b981' : 'rgba(255,255,255,0.30)', transition: 'all 0.2s',
          }}>Home</span>
        </Link>

        {/* Nursery groups */}
        <Link href="/nursery" style={itemStyle(!!path?.startsWith('/nursery'))} prefetch={false}>
          {path?.startsWith('/nursery') && <motion.span layoutId="nav-indicator" style={{
            position: 'absolute', top: 0, left: '20%', right: '20%',
            height: 2, borderRadius: '0 0 4px 4px', background: '#7DC383',
          }} />}
          <Sprout size={22} strokeWidth={path?.startsWith('/nursery') ? 2.4 : 1.7}
            color={path?.startsWith('/nursery') ? '#7DC383' : 'rgba(255,255,255,0.45)'} />
          <span style={{
            fontSize: 11, fontWeight: path?.startsWith('/nursery') ? 800 : 500, letterSpacing: 0.3,
            color: path?.startsWith('/nursery') ? '#7DC383' : 'rgba(255,255,255,0.45)',
          }}>Nursery</span>
        </Link>

        {/* Info Hub (Opens dual hub options: SIHU News Hub vs Oloolua Conservation Hub) */}
        <button
          onClick={() => setHubMenuOpen(prev => !prev)}
          style={itemStyle(isInfoHubActive || hubMenuOpen)}
          aria-expanded={hubMenuOpen}
        >
          {(isInfoHubActive || hubMenuOpen) && <motion.span layoutId="nav-indicator" style={{
            position: 'absolute', top: 0, left: '20%', right: '20%',
            height: 2, borderRadius: '0 0 4px 4px',
            background: 'linear-gradient(90deg, transparent, #10b981, transparent)',
          }} />}
          <motion.span whileHover={{ y: -2 }} whileTap={{ scale: 0.9 }} style={{ display: 'inline-flex' }}>
            <Newspaper size={22} strokeWidth={(isInfoHubActive || hubMenuOpen) ? 2.4 : 1.7}
              color={(isInfoHubActive || hubMenuOpen) ? '#10b981' : 'rgba(255,255,255,0.32)'}
              style={{ transition: 'all 0.2s', transform: (isInfoHubActive || hubMenuOpen) ? 'scale(1.08) translateY(-1px)' : 'scale(1)' }} />
          </motion.span>
          <span style={{
            fontSize: 11, fontWeight: (isInfoHubActive || hubMenuOpen) ? 800 : 500, letterSpacing: 0.3,
            color: (isInfoHubActive || hubMenuOpen) ? '#10b981' : 'rgba(255,255,255,0.30)', transition: 'all 0.2s',
          }}>Hubs</span>
        </button>

        {/* Profile */}
        <Link href="/profile" style={itemStyle(path?.startsWith('/profile'))} prefetch={false}>
          {path?.startsWith('/profile') && <motion.span layoutId="nav-indicator" style={{
            position: 'absolute', top: 0, left: '20%', right: '20%',
            height: 2, borderRadius: '0 0 4px 4px',
            background: 'linear-gradient(90deg, transparent, #10b981, transparent)',
          }} />}
          <motion.span whileHover={{ y: -2 }} whileTap={{ scale: 0.9 }} style={{ display: 'inline-flex' }}>
            <UserCircle2 size={22} strokeWidth={path?.startsWith('/profile') ? 2.4 : 1.7}
              color={path?.startsWith('/profile') ? '#10b981' : 'rgba(255,255,255,0.32)'}
              style={{ transition: 'all 0.2s', transform: path?.startsWith('/profile') ? 'scale(1.08) translateY(-1px)' : 'scale(1)' }} />
          </motion.span>
          <span style={{
            fontSize: 11, fontWeight: path?.startsWith('/profile') ? 800 : 500, letterSpacing: 0.3,
            color: path?.startsWith('/profile') ? '#10b981' : 'rgba(255,255,255,0.30)', transition: 'all 0.2s',
          }}>Profile</span>
        </Link>

        {/* Kanuvari AI */}
        <Link href="/workspace" style={itemStyle(!!path?.startsWith('/workspace'))} prefetch={false}>
          {path?.startsWith('/workspace') && <motion.span layoutId="nav-indicator" style={{
            position: 'absolute', top: 0, left: '20%', right: '20%',
            height: 2, borderRadius: '0 0 4px 4px', background: '#7DC383',
          }} />}
          <Bot size={22} strokeWidth={path?.startsWith('/workspace') ? 2.4 : 1.7}
            color={path?.startsWith('/workspace') ? '#7DC383' : 'rgba(255,255,255,0.45)'} />
          <span style={{
            fontSize: 11, fontWeight: path?.startsWith('/workspace') ? 800 : 500, letterSpacing: 0.3,
            color: path?.startsWith('/workspace') ? '#7DC383' : 'rgba(255,255,255,0.45)',
          }}>Ask AI</span>
        </Link>
      </nav>
    </>
  );
}

