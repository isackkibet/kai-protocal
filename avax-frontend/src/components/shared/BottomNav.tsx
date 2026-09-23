'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Bot, Gift, UserCircle2, Newspaper, TreePine,
  ChevronRight, X, Sparkles, ShieldCheck
} from 'lucide-react';
import { useAIChatStore } from '@/store/useAIChatStore';

const itemStyle = (active: boolean): React.CSSProperties => ({
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  justifyContent: 'center', gap: 4, textDecoration: 'none',
  position: 'relative', padding: '6px 14px', borderRadius: 14,
  minWidth: 56, transition: 'all 0.2s ease',
  background: active ? 'rgba(16,185,129,0.10)' : 'transparent',
  border: 'none', cursor: 'pointer', font: 'inherit',
});

const SIHU_APP_URL = process.env.NEXT_PUBLIC_SIHU_URL || 'http://localhost:3000';
const OLOOLUA_APP_URL = process.env.NEXT_PUBLIC_OLOOLUA_URL || 'http://localhost:3002';

const HUB_OPTIONS = [
  {
    id: 'sihu',
    name: 'SIHU News Hub',
    badge: 'Real SIHU App',
    desc: 'Pre-built Next.js news portal from SIHU.COM with articles, portal, podcasts, and AI stories.',
    href: SIHU_APP_URL,
    icon: Newspaper,
    accent: '#C89B3C',
    bg: 'linear-gradient(135deg, rgba(200, 155, 60, 0.16) 0%, rgba(15, 36, 25, 0.95) 100%)',
    border: 'rgba(200, 155, 60, 0.35)',
  },
  {
    id: 'oloolua',
    name: 'Oloolua Conservation Hub',
    badge: 'Real Oloolua Site',
    desc: 'Oloolua Youth Guardians site with forest nursery species, seedlings, activities, and gallery.',
    href: OLOOLUA_APP_URL,
    icon: TreePine,
    accent: '#10B981',
    bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(10, 42, 32, 0.95) 100%)',
    border: 'rgba(16, 185, 129, 0.35)',
  },
];

export default function BottomNav() {
  const path = usePathname();
  const router = useRouter();
  const [hubMenuOpen, setHubMenuOpen] = useState(false);
  const isChatOpen = useAIChatStore(s => s.isOpen);
  const toggleChat  = useAIChatStore(s => s.toggle);

  const isInfoHubActive = path?.startsWith('/hub') || path?.startsWith('/conservation');

  // Close modal when path changes
  useEffect(() => {
    setHubMenuOpen(false);
  }, [path]);

  const selectHub = (href: string) => {
    setHubMenuOpen(false);
    if (href.startsWith('http://') || href.startsWith('https://')) {
      window.location.href = href;
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
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                    <Sparkles size={14} color="#C89B3C" />
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
                      textTransform: 'uppercase', color: '#E4C878',
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}>
                      KAI Knowledge Ecosystem
                    </span>
                  </div>
                  <h3 style={{
                    margin: 0, fontSize: 20, fontWeight: 700, color: '#F6F2E7',
                    letterSpacing: '-0.3px',
                  }}>
                    Select Information Hub
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(246, 242, 231, 0.65)' }}>
                    Choose the community hub you want to explore:
                  </p>
                </div>

                <button
                  onClick={() => setHubMenuOpen(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: 'none', borderRadius: '50%',
                    width: 32, height: 32, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: '#F6F2E7', cursor: 'pointer',
                  }}
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {/* 2 Hub Option Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {HUB_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isCurrent = path?.startsWith(opt.href);
                  return (
                    <motion.div
                      key={opt.id}
                      whileHover={{ scale: 1.015, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => selectHub(opt.href)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '16px 16px',
                        background: opt.bg,
                        border: `1px solid ${isCurrent ? opt.accent : opt.border}`,
                        borderRadius: 16,
                        cursor: 'pointer',
                        transition: 'border-color 0.2s, background 0.2s',
                        boxShadow: isCurrent ? `0 0 16px ${opt.accent}25` : 'none',
                      }}
                    >
                      {/* Icon */}
                      <div
                        style={{
                          width: 46, height: 46, borderRadius: 12,
                          background: `${opt.accent}20`,
                          color: opt.accent,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={24} strokeWidth={2} />
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <span style={{ fontSize: 16, fontWeight: 700, color: '#F6F2E7' }}>
                            {opt.name}
                          </span>
                          <span
                            style={{
                              fontSize: 9, fontWeight: 700,
                              textTransform: 'uppercase', letterSpacing: 0.8,
                              color: opt.accent,
                              background: 'rgba(0,0,0,0.35)',
                              padding: '2px 7px', borderRadius: 4,
                            }}
                          >
                            {opt.badge}
                          </span>
                          {isCurrent && (
                            <span
                              style={{
                                fontSize: 9, fontWeight: 600,
                                color: '#10B981', marginLeft: 'auto',
                              }}
                            >
                              Current
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: 12, color: 'rgba(246, 242, 231, 0.65)', lineHeight: 1.4 }}>
                          {opt.desc}
                        </p>
                      </div>

                      {/* Arrow */}
                      <div style={{ color: opt.accent, opacity: 0.85 }}>
                        <ChevronRight size={18} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
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

        {/* Airdrop */}
        <Link href="/mine" style={itemStyle(path?.startsWith('/mine'))} prefetch={false}>
          {path?.startsWith('/mine') && <motion.span layoutId="nav-indicator" style={{
            position: 'absolute', top: 0, left: '20%', right: '20%',
            height: 2, borderRadius: '0 0 4px 4px',
            background: 'linear-gradient(90deg, transparent, #10b981, transparent)',
          }} />}
          <motion.span whileHover={{ y: -2 }} whileTap={{ scale: 0.9 }} style={{ display: 'inline-flex' }}>
            <Gift size={22} strokeWidth={path?.startsWith('/mine') ? 2.4 : 1.7}
              color={path?.startsWith('/mine') ? '#10b981' : 'rgba(255,255,255,0.32)'}
              style={{ transition: 'all 0.2s', transform: path?.startsWith('/mine') ? 'scale(1.08) translateY(-1px)' : 'scale(1)' }} />
          </motion.span>
          <span style={{
            fontSize: 11, fontWeight: path?.startsWith('/mine') ? 800 : 500, letterSpacing: 0.3,
            color: path?.startsWith('/mine') ? '#10b981' : 'rgba(255,255,255,0.30)', transition: 'all 0.2s',
          }}>Airdrop</span>
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
          }}>Info Hub</span>
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

        {/* Agent */}
        <button onClick={toggleChat} style={itemStyle(isChatOpen)} aria-pressed={isChatOpen}>
          {isChatOpen && <motion.span layoutId="nav-indicator" style={{
            position: 'absolute', top: 0, left: '20%', right: '20%',
            height: 2, borderRadius: '0 0 4px 4px',
            background: 'linear-gradient(90deg, transparent, #10b981, transparent)',
          }} />}
          <motion.span whileHover={{ y: -2 }} whileTap={{ scale: 0.9 }} style={{ display: 'inline-flex' }}>
            <Bot size={22} strokeWidth={isChatOpen ? 2.4 : 1.7}
              color={isChatOpen ? '#10b981' : 'rgba(255,255,255,0.32)'}
              style={{ transition: 'all 0.2s', transform: isChatOpen ? 'scale(1.08) translateY(-1px)' : 'scale(1)' }} />
          </motion.span>
          <span style={{
            fontSize: 11, fontWeight: isChatOpen ? 800 : 500, letterSpacing: 0.3,
            color: isChatOpen ? '#10b981' : 'rgba(255,255,255,0.30)', transition: 'all 0.2s',
          }}>Agent</span>
        </button>
      </nav>
    </>
  );
}

