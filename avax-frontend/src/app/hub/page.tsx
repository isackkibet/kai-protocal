'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Newspaper, TreePine, ExternalLink, ArrowRight,
  ShieldCheck, PenTool, CheckCircle2,
  Sparkles, RefreshCw, Radio, FileText, Layers,
  Compass, Eye, Mic, BookOpen, HeartHandshake,
  TrendingUp, Activity, Flame, ShieldAlert, Cpu
} from 'lucide-react';
import {
  HUB_THEME, SIHU_THEME, OLOOLUA_THEME,
  MONO, SERIF, SANS, labelStyle, sihuLabelStyle, olooluaLabelStyle
} from '@/lib/hub-theme';

const SIHU_PORTAL_URL = process.env.NEXT_PUBLIC_SIHU_PORTAL_URL || 'http://localhost:3001';
const OLOOLUA_PORTAL_URL = process.env.NEXT_PUBLIC_OLOOLUA_PORTAL_URL || 'http://localhost:3002';

const TICKER_ITEMS = [
  '🚨 Sango Basin Watch: Wetland conservation protocols active across 42 Lake Victoria catchment zones',
  '🌲 Oloolua Youth Guardians: 14,800 indigenous seedlings registered in community forest nursery',
  '🎙️ Sango Audio Studio: New episode on Sustainable Blue Economy & Riparian Protection live',
  '📜 KAI Verification Engine: 8,420 community ecological proofs anchored on Avalanche C-Chain',
  '🐝 Ngong Forest Apiary: Beekeeping & biodiversity monitoring yields 120kg raw forest honey',
];

interface HubCapability {
  title: string;
  desc: string;
  tag: string;
  url?: string;
  internal?: boolean;
  icon?: any;
}

interface HubModel {
  id: 'sihu' | 'oloolua';
  name: string;
  brandTitle: string;
  badge: string;
  tagline: string;
  desc: string;
  port: number;
  portalUrl: string;
  theme: typeof SIHU_THEME | typeof OLOOLUA_THEME;
  accent: string;
  accentLight: string;
  glow: string;
  features: HubCapability[];
  actions: { label: string; url: string; primary?: boolean; external?: boolean; internal?: boolean }[];
}

const HUBS: HubModel[] = [
  {
    id: 'sihu',
    name: 'SIHU.COM Information Hub',
    brandTitle: 'Sango Information Hub & Media Network',
    badge: 'The Blue Hub · Port 3001',
    tagline: 'Lake Victoria Basin Knowledge Management & Environmental Journalism',
    desc: 'Elite community media network and technical knowledge portal for natural resource management, environmental protection, Lake Victoria Basin investigations, Sango podcasts, and automated AI editorial verification.',
    port: 3001,
    portalUrl: SIHU_PORTAL_URL,
    theme: SIHU_THEME,
    accent: SIHU_THEME.blue,
    accentLight: SIHU_THEME.blueLight,
    glow: SIHU_THEME.blueGlow,
    features: [
      {
        title: 'Lake Victoria News Portal & Deep Investigations',
        desc: 'Curated articles, verified field journals, water basin analysis, and environmental science reporting.',
        tag: 'Articles & News',
        url: `${SIHU_PORTAL_URL}/portal`,
        icon: Newspaper,
      },
      {
        title: 'Sango Audio Studio & Environmental Podcasts',
        desc: 'Community audio broadcasts, oral history recordings, expert panels, and field audio dispatch.',
        tag: 'Audio Studio',
        url: `${SIHU_PORTAL_URL}/studio`,
        icon: Mic,
      },
      {
        title: 'Lake Victoria Basin Document Archive',
        desc: 'Open-access environmental policy repository, water quality datasets, and ecological legal guides.',
        tag: 'Policy Archive',
        url: `${SIHU_PORTAL_URL}/documents`,
        icon: FileText,
      },
      {
        title: 'Automated AI Pre-Review & Fact Verification',
        desc: 'Pre-flight integrity engine for citation checks, duplication screening, and claim grounding.',
        tag: 'AI Pre-Flight',
        url: `${SIHU_PORTAL_URL}/portal/submit`,
        icon: Cpu,
      },
      {
        title: '7-Role Editorial Board & Governance Queue',
        desc: 'Role-based access matrix for Chairperson, Secretary, Editor, Contributor, and Fact-Checkers.',
        tag: 'Governance',
        url: `${SIHU_PORTAL_URL}/admin/review`,
        icon: ShieldCheck,
      },
    ],
    actions: [
      { label: 'Launch SIHU Portal (:3001)', url: SIHU_PORTAL_URL, primary: true, external: true },
      { label: 'Write Story', url: `${SIHU_PORTAL_URL}/portal/submit`, external: true },
      { label: 'Audio Studio', url: `${SIHU_PORTAL_URL}/studio`, external: true },
      { label: 'Document Archive', url: `${SIHU_PORTAL_URL}/documents`, external: true },
    ],
  },
  {
    id: 'oloolua',
    name: 'Oloolua Youth Guardians Hub',
    brandTitle: 'Community Forest Association (CFA) Conservation Hub',
    badge: 'The Green Hub · Port 3002',
    tagline: 'Forest Nursery, Indigenous Seedlings & Community Reforestation MRV',
    desc: 'Hands-on community conservation management platform. Tracks indigenous tree seedlings, Ngong Hills forest patrols, youth workshops, apiary beekeeping, and verified carbon methodologies.',
    port: 3002,
    portalUrl: OLOOLUA_PORTAL_URL,
    theme: OLOOLUA_THEME,
    accent: OLOOLUA_THEME.emerald,
    accentLight: OLOOLUA_THEME.emeraldLight,
    glow: OLOOLUA_THEME.emeraldGlow,
    features: [
      {
        title: 'Indigenous Seedlings & Nursery Operations',
        desc: 'Real-time inventory tracking for Prunus africana, Warburgia, Markhamia, and Croton seedlings.',
        tag: 'Seedling Registry',
        url: `${OLOOLUA_PORTAL_URL}/seedlings.html`,
        icon: TreePine,
      },
      {
        title: 'Youth Guardian Member Dashboard & Patrols',
        desc: 'Forest guard logs, anti-encroachment patrols, boundary markers, and live field activity monitoring.',
        tag: 'Patrol & Members',
        url: `${OLOOLUA_PORTAL_URL}/member-dashboard.html`,
        icon: ShieldAlert,
      },
      {
        title: 'Forest Beekeeping & Apiary Program',
        desc: 'Sustainable honey harvesting, hive colony health records, and native pollinator habitat preservation.',
        tag: 'Beekeeping',
        url: `${OLOOLUA_PORTAL_URL}/beekeeping.html`,
        icon: Sparkles,
      },
      {
        title: 'Conservation Methodologies & Carbon Proofs',
        desc: 'Integration with Kenya Jaza Miti and GTCI frameworks for verifiable Avalanche on-chain outcomes.',
        tag: 'MRV & Methodology',
        url: '/conservation/methodologies',
        internal: true,
        icon: Activity,
      },
      {
        title: 'Community Workshops & Photo Evidence',
        desc: 'Hands-on ecological education for local schools, tree nurseries, and high-resolution field galleries.',
        tag: 'Workshops & Media',
        url: `${OLOOLUA_PORTAL_URL}/photogallery.html`,
        icon: BookOpen,
      },
    ],
    actions: [
      { label: 'Launch Oloolua Hub (:3002)', url: OLOOLUA_PORTAL_URL, primary: true, external: true },
      { label: 'Seedlings Registry', url: `${OLOOLUA_PORTAL_URL}/seedlings.html`, external: true },
      { label: 'Member Dashboard', url: `${OLOOLUA_PORTAL_URL}/member-dashboard.html`, external: true },
      { label: 'In-App Conservation Layer', url: '/conservation', internal: true },
    ],
  },
];

export default function HubPage() {
  const [selectedHub, setSelectedHub] = useState<'all' | 'sihu' | 'oloolua'>('all');
  const [serverStatus, setServerStatus] = useState<{ [port: number]: boolean | null }>({
    3001: null,
    3002: null,
  });
  const [isChecking, setIsChecking] = useState(false);
  const [tickerIdx, setTickerIdx] = useState(0);

  const checkServers = async () => {
    setIsChecking(true);
    const updated: { [port: number]: boolean } = {};
    for (const [port, base] of [[3001, SIHU_PORTAL_URL], [3002, OLOOLUA_PORTAL_URL]] as const) {
      try {
        await fetch(base, { mode: 'no-cors' });
        updated[port] = true;
      } catch {
        updated[port] = false;
      }
    }
    setServerStatus(updated);
    setIsChecking(false);
  };

  return (
    <main style={{
      minHeight: '100dvh',
      background: 'linear-gradient(180deg, #020617 0%, #071510 50%, #020617 100%)',
      color: '#F8FAFC',
      fontFamily: "'IBM Plex Sans', sans-serif",
      paddingBottom: 100,
    }}>
      {/* Dynamic font inclusions */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
        .hub-glass-card {
          backdrop-filter: blur(16px);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .hub-glass-card:hover {
          transform: translateY(-2px);
        }
        .feature-item-hover:hover {
          background: rgba(255, 255, 255, 0.05);
          transform: translateX(4px);
        }
      `}</style>

      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px' }}>
        
        {/* ── Breaking News Ticker (SIHU Live Feed) ── */}
        <div style={{
          marginTop: 20,
          background: 'rgba(2, 6, 23, 0.85)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: 12,
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4), 0 0 15px rgba(56, 189, 248, 0.1)',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'linear-gradient(90deg, #0284C7, #0369A1)',
            padding: '3px 10px', borderRadius: 6,
            fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: 1.2, color: '#FFFFFF',
            ...MONO,
          }}>
            <Flame size={12} className="animate-pulse" />
            LIVE DISPATCH
          </div>
          <div style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            <span style={{ fontSize: 13, color: '#E2E8F0' }}>
              {TICKER_ITEMS[tickerIdx]}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => setTickerIdx((prev) => (prev - 1 + TICKER_ITEMS.length) % TICKER_ITEMS.length)}
              style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94A3B8', borderRadius: 4, width: 22, height: 22, cursor: 'pointer', fontSize: 12 }}
            >
              ‹
            </button>
            <button
              onClick={() => setTickerIdx((prev) => (prev + 1) % TICKER_ITEMS.length)}
              style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94A3B8', borderRadius: 4, width: 22, height: 22, cursor: 'pointer', fontSize: 12 }}
            >
              ›
            </button>
          </div>
        </div>

        {/* ── Masthead ── */}
        <header style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '32px 0 24px', borderBottom: '1px solid rgba(255,255,255,0.08)',
          flexWrap: 'wrap', gap: 18,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
              <span style={{
                ...MONO, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase',
                background: 'linear-gradient(90deg, rgba(56,189,248,0.15), rgba(16,185,129,0.15))',
                color: '#7DD3FC',
                padding: '4px 12px', borderRadius: 6,
                border: '1px solid rgba(56, 189, 248, 0.3)',
                fontWeight: 700,
              }}>
                Dual Information Ecosystem
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94A3B8' }}>
                <Radio size={13} color="#38BDF8" className="animate-pulse" />
                Synchronized Frontends Active
              </span>
            </div>
            <h1 style={{ ...SERIF, fontSize: 36, fontWeight: 700, color: '#F8FAFC', margin: 0, lineHeight: 1.15 }}>
              KAI Information Hubs
            </h1>
            <p style={{ ...SANS, fontSize: 14, color: '#94A3B8', margin: '6px 0 0', maxWidth: 650 }}>
              Direct access to both synchronized ecosystem nodes: <strong style={{ color: '#38BDF8' }}>SIHU.COM</strong> (Lake Victoria Basin Media) and <strong style={{ color: '#10B981' }}>Oloolua Youth Guardians</strong> (Community Forest Conservation).
            </p>
          </div>

          {/* Quick Subsystem Telemetry */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 16px', borderRadius: 12,
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              {/* SIHU Port Status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#E2E8F0' }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: serverStatus[3001] === false ? '#EF4444' : '#38BDF8',
                  boxShadow: '0 0 8px rgba(56, 189, 248, 0.6)',
                }} />
                <span>SIHU (:3001)</span>
              </div>
              <span style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.12)' }} />
              {/* Oloolua Port Status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#E2E8F0' }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: serverStatus[3002] === false ? '#EF4444' : '#10B981',
                  boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
                }} />
                <span>Oloolua (:3002)</span>
              </div>
            </div>

            <button
              onClick={checkServers}
              disabled={isChecking}
              title="Ping subsystem health"
              style={{
                width: 38, height: 38, borderRadius: 10,
                border: '1px solid rgba(56,189,248,0.3)',
                background: 'rgba(56,189,248,0.08)',
                color: '#38BDF8', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <RefreshCw size={15} className={isChecking ? 'animate-spin' : ''} />
            </button>
          </div>
        </header>

        {/* ── Subsystem Selector Tabs ── */}
        <section style={{ margin: '26px 0 28px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Information Hubs', count: '2 Hubs Synchronized', accent: '#7DD3FC' },
            { id: 'sihu', label: '📰 SIHU.COM (The Blue Hub)', count: 'Port 3001', accent: '#38BDF8' },
            { id: 'oloolua', label: '🌲 Oloolua Youth Guardians (The Green Hub)', count: 'Port 3002', accent: '#10B981' },
          ].map((tab) => {
            const active = selectedHub === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedHub(tab.id as typeof selectedHub)}
                style={{
                  padding: '11px 20px', borderRadius: 10,
                  border: `1px solid ${active ? tab.accent : 'rgba(255,255,255,0.08)'}`,
                  background: active ? `linear-gradient(135deg, ${tab.accent}20, rgba(2,6,23,0.8))` : 'rgba(255,255,255,0.02)',
                  color: active ? '#FFFFFF' : '#94A3B8',
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s',
                  boxShadow: active ? `0 0 20px ${tab.accent}20` : 'none',
                }}
              >
                <span style={{ fontSize: 14, fontWeight: active ? 700 : 500 }}>{tab.label}</span>
                <span style={{
                  ...MONO, fontSize: 10, letterSpacing: 0.8,
                  padding: '2px 8px', borderRadius: 4,
                  background: active ? tab.accent : 'rgba(255,255,255,0.06)',
                  color: active ? '#020617' : '#94A3B8',
                  fontWeight: 700,
                }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </section>

        {/* ── Hub Cards Grid ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: selectedHub === 'all' ? 'repeat(auto-fit, minmax(520px, 1fr))' : '1fr',
          gap: 26,
        }}>
          {HUBS.filter(h => selectedHub === 'all' || selectedHub === h.id).map((hub) => {
            const isOnline = serverStatus[hub.port] !== false;
            const isSihu = hub.id === 'sihu';

            return (
              <motion.article
                key={hub.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                className="hub-glass-card"
                style={{
                  background: isSihu
                    ? 'linear-gradient(180deg, #0B1934 0%, #020617 100%)'
                    : 'linear-gradient(180deg, #0A2D20 0%, #04150E 100%)',
                  borderRadius: 20,
                  border: `1px solid ${isSihu ? 'rgba(56, 189, 248, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
                  padding: '30px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: `0 20px 40px -15px rgba(0,0,0,0.7), 0 0 30px ${hub.glow}`,
                }}
              >
                {/* Accent Top Bar */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                  background: `linear-gradient(90deg, ${hub.accent}, transparent)`,
                }} />

                {/* Hub Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 14 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        ...MONO, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase',
                        color: hub.accent, fontWeight: 700,
                        background: 'rgba(0,0,0,0.4)', padding: '3px 9px', borderRadius: 4,
                        border: `1px solid ${hub.accent}40`,
                      }}>
                        {hub.badge}
                      </span>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontSize: 11, color: isOnline ? '#10B981' : '#EF4444',
                        ...MONO,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: isOnline ? '#10B981' : '#EF4444' }} />
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>

                    <h2 style={{ ...SERIF, fontSize: 26, fontWeight: 700, color: '#F8FAFC', margin: 0, letterSpacing: '-0.3px' }}>
                      {hub.name}
                    </h2>
                    <p style={{ ...MONO, fontSize: 12, color: hub.accentLight, margin: '4px 0 0', fontWeight: 600 }}>
                      {hub.brandTitle}
                    </p>
                  </div>

                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: `${hub.accent}20`,
                    border: `1px solid ${hub.accent}40`,
                    color: hub.accent,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {isSihu ? <Newspaper size={24} /> : <TreePine size={24} />}
                  </div>
                </div>

                <p style={{ fontSize: 14, color: 'rgba(248,250,252,0.75)', lineHeight: 1.6, margin: '0 0 22px' }}>
                  {hub.desc}
                </p>

                {/* Features List */}
                <div style={{
                  borderTop: `1px solid rgba(255,255,255,0.08)`,
                  padding: '18px 0 20px',
                  flex: 1,
                }}>
                  <p style={{
                    ...MONO, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase',
                    color: hub.accentLight, fontWeight: 700, margin: '0 0 14px',
                  }}>
                    Synchronized Modules & Tools
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {hub.features.map((feat, idx) => {
                      const FeatIcon = feat.icon || Layers;
                      return (
                        <div
                          key={idx}
                          className="feature-item-hover"
                          style={{
                            padding: '10px 14px',
                            borderRadius: 10,
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(255, 255, 255, 0.04)',
                            transition: 'all 0.18s ease',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: 12,
                          }}
                        >
                          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                            <div style={{ color: hub.accent, marginTop: 2 }}>
                              <FeatIcon size={16} />
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>
                                  {feat.title}
                                </span>
                                <span style={{
                                  ...MONO, fontSize: 9, textTransform: 'uppercase',
                                  padding: '1px 6px', borderRadius: 3,
                                  background: `${hub.accent}20`, color: hub.accentLight,
                                  fontWeight: 600,
                                }}>
                                  {feat.tag}
                                </span>
                              </div>
                              <p style={{ margin: 0, fontSize: 12, color: '#94A3B8', lineHeight: 1.4 }}>
                                {feat.desc}
                              </p>
                            </div>
                          </div>

                          {feat.url && (
                            feat.internal ? (
                              <Link href={feat.url} style={{ color: hub.accent, textDecoration: 'none', display: 'flex', alignItems: 'center', paddingTop: 2 }}>
                                <ArrowRight size={15} />
                              </Link>
                            ) : (
                              <a href={feat.url} target="_blank" rel="noreferrer" style={{ color: hub.accent, textDecoration: 'none', display: 'flex', alignItems: 'center', paddingTop: 2 }}>
                                <ExternalLink size={14} />
                              </a>
                            )
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{
                  borderTop: `1px solid rgba(255,255,255,0.08)`,
                  paddingTop: 20,
                  display: 'flex',
                  gap: 10,
                  flexWrap: 'wrap',
                }}>
                  {hub.actions.map((act, idx) => (
                    act.internal ? (
                      <Link
                        key={idx}
                        href={act.url}
                        style={{
                          padding: '10px 16px',
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 700,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: act.primary ? hub.accent : 'rgba(255,255,255,0.06)',
                          color: act.primary ? '#020617' : '#F8FAFC',
                          border: `1px solid ${act.primary ? hub.accent : 'rgba(255,255,255,0.1)'}`,
                          transition: 'all 0.2s',
                        }}
                      >
                        {act.label}
                        <ArrowRight size={14} />
                      </Link>
                    ) : (
                      <a
                        key={idx}
                        href={act.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          padding: '10px 16px',
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 700,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: act.primary ? hub.accent : 'rgba(255,255,255,0.06)',
                          color: act.primary ? '#020617' : '#F8FAFC',
                          border: `1px solid ${act.primary ? hub.accent : 'rgba(255,255,255,0.1)'}`,
                          transition: 'all 0.2s',
                        }}
                      >
                        {act.label}
                        <ExternalLink size={13} />
                      </a>
                    )
                  ))}
                </div>
              </motion.article>
            );
          })}
        </div>

        {/* ── Synchronized Ecosystem Banner ── */}
        <section style={{
          marginTop: 36, padding: '24px 28px',
          background: 'linear-gradient(90deg, rgba(2, 6, 23, 0.95), rgba(7, 21, 16, 0.95))',
          borderRadius: 16,
          border: '1px solid rgba(56, 189, 248, 0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Sparkles size={14} color="#38BDF8" />
              <p style={{ ...MONO, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: '#7DD3FC', fontWeight: 700, margin: 0 }}>
                Unified Frontend Architecture
              </p>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#94A3B8' }}>
              Both SIHU.COM and Oloolua Youth Guardians are copied into <code style={{ color: '#F8FAFC', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>avax-frontend/hubs/</code> and run as synchronized services on ports <strong>3001</strong> and <strong>3002</strong>.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a
              href={`${SIHU_PORTAL_URL}/portal`}
              target="_blank"
              rel="noreferrer"
              style={{
                ...MONO, fontSize: 11, padding: '9px 16px', borderRadius: 8,
                background: '#0284C7', color: '#FFFFFF', fontWeight: 700,
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <Newspaper size={14} />
              Open SIHU.COM ↗
            </a>
            <a
              href={OLOOLUA_PORTAL_URL}
              target="_blank"
              rel="noreferrer"
              style={{
                ...MONO, fontSize: 11, padding: '9px 16px', borderRadius: 8,
                background: '#059669', color: '#FFFFFF', fontWeight: 700,
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <TreePine size={14} />
              Open Oloolua Hub ↗
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}