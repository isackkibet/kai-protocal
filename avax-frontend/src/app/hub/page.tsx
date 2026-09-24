'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Newspaper, TreePine, ExternalLink, ArrowRight,
  ShieldCheck, PenTool, CheckCircle2,
  Sparkles, RefreshCw, Radio, FileText, Layers,
  Compass, Eye
} from 'lucide-react';
import { HUB_THEME, labelStyle, MONO, SERIF, SANS } from '@/lib/hub-theme';

// Same env vars BottomNav.tsx uses — set NEXT_PUBLIC_SIHU_URL /
// NEXT_PUBLIC_OLOOLUA_URL once real deployed URLs exist, and every link
// below updates from that one place instead of 15+ scattered hardcodes.
const SIHU_BASE = process.env.NEXT_PUBLIC_SIHU_URL || 'http://localhost:3000';
const OLOOLUA_BASE = process.env.NEXT_PUBLIC_OLOOLUA_URL || 'http://localhost:3002';

interface HubEndpoint {
  id: 'sihu' | 'oloolua';
  name: string;
  badge: string;
  tagline: string;
  desc: string;
  port: number;
  url: string;
  accent: string;
  features: { title: string; desc: string; url?: string; internal?: boolean }[];
  actions: { label: string; url: string; primary?: boolean; external?: boolean; internal?: boolean }[];
}

const HUBS: HubEndpoint[] = [
  {
    id: 'sihu',
    name: 'SIHU News & Publishing Hub',
    badge: 'Real SIHU Repo · Port 3000',
    tagline: 'Decentralized Community Journalism & Knowledge Dissemination',
    desc: 'Pre-built dedicated news service with full editorial workflow: 7 PRD roles (Chairperson, Secretary, Treasurer, Editor, Contributor), automated AI pre-review verification, contributor dashboard, and editorial queue.',
    port: 3000,
    url: `${SIHU_BASE}/portal`,
    accent: HUB_THEME.gold,
    features: [
      {
        title: 'Story Submission & Authoring',
        desc: 'Submit articles, field journals, or guides with structured citations and real-time validation.',
        url: `${SIHU_BASE}/portal/submit`,
      },
      {
        title: '7 PRD Governance Roles & RBAC',
        desc: 'Role-based access matrix for Chairperson, Secretary, Treasurer, Editor, Verified Contributor, and Readers.',
        url: `${SIHU_BASE}/portal/contributor`,
      },
      {
        title: 'Automated AI Pre-Review Service',
        desc: 'Instant pre-flight audit for plagiarism risk, citation completeness, and AI generation confidence before review.',
        url: `${SIHU_BASE}/portal/submit`,
      },
      {
        title: 'Editorial Review & Moderation Queue',
        desc: 'Inspect submitted drafts, analyze AI audit scores, request revisions, or approve and publish to the live feed.',
        url: `${SIHU_BASE}/admin/review`,
      },
      {
        title: 'Live News Portal Feed',
        desc: 'Curated ecosystem articles, verified publications, market commentary, and community podcasts.',
        url: `${SIHU_BASE}/portal`,
      },
    ],
    actions: [
      { label: 'Open SIHU Portal', url: `${SIHU_BASE}/portal`, primary: true, external: true },
      { label: 'Submit Story', url: `${SIHU_BASE}/portal/submit`, external: true },
      { label: 'Contributor Dashboard', url: `${SIHU_BASE}/portal/contributor`, external: true },
      { label: 'Editorial Review Queue', url: `${SIHU_BASE}/admin/review`, external: true },
    ],
  },
  {
    id: 'oloolua',
    name: 'Oloolua Conservation Hub',
    badge: 'Real Oloolua Repo · Port 3002',
    tagline: 'Community Forest Association (CFA) & Nature Conservation',
    desc: 'Pre-built community conservation management platform. Tracks indigenous tree seedlings, nursery operations, community guardians, and field conservation methodologies.',
    port: 3002,
    url: OLOOLUA_BASE,
    accent: '#10B981',
    features: [
      {
        title: 'Seedlings & Nursery Management',
        desc: 'Real-time inventory of indigenous and exotic species ready for community planting.',
        url: `${OLOOLUA_BASE}/seedlings.html`,
      },
      {
        title: 'Guardian Member Dashboard',
        desc: 'Community guardian profiles, forest patrols, and conservation activity tracking.',
        url: `${OLOOLUA_BASE}/member-dashboard.html`,
      },
      {
        title: 'Conservation Methodologies',
        desc: 'Standardized restoration frameworks including Jaza Miti and GTCI verification.',
        url: '/conservation/methodologies',
        internal: true,
      },
      {
        title: 'Grounded Conservation AI (Ask KAI)',
        desc: 'AI advisor trained on Kenya reforestation guidelines, indigenous tree species, and MRV.',
        url: '/conservation/ask',
        internal: true,
      },
    ],
    actions: [
      { label: 'Open Oloolua Hub', url: OLOOLUA_BASE, primary: true, external: true },
      { label: 'Seedlings Registry', url: `${OLOOLUA_BASE}/seedlings.html`, external: true },
      { label: 'Member Dashboard', url: `${OLOOLUA_BASE}/member-dashboard.html`, external: true },
      { label: 'In-App Conservation Layer', url: '/conservation', internal: true },
    ],
  },
];

export default function HubPage() {
  const [selectedHub, setSelectedHub] = useState<'all' | 'sihu' | 'oloolua'>('all');
  const [serverStatus, setServerStatus] = useState<{ [port: number]: boolean | null }>({
    3000: null,
    3002: null,
  });
  const [isChecking, setIsChecking] = useState(false);

  const checkServers = async () => {
    setIsChecking(true);
    const updated: { [port: number]: boolean } = {};
    for (const [port, base] of [[3000, SIHU_BASE], [3002, OLOOLUA_BASE]] as const) {
      try {
        await fetch(base, { mode: 'no-cors' });
        // mode: 'no-cors' succeeds if the endpoint is listening and accepts connections
        updated[port] = true;
      } catch {
        updated[port] = false;
      }
    }
    setServerStatus(updated);
    setIsChecking(false);
  };

  // Status is manual-only now (the refresh button below triggers checkServers)
  // — this used to auto-poll every 15s against literal localhost URLs from
  // every visitor's own browser, which can never succeed for a real visitor
  // and spammed ERR_CONNECTION_REFUSED into the console indefinitely.

  return (
    <main style={{
      minHeight: '100dvh', background: HUB_THEME.bg,
      color: HUB_THEME.paper, fontFamily: "'IBM Plex Sans', sans-serif",
      paddingBottom: 90,
    }}>
      {/* Editorial fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
        .hub-feature-hover:hover {
          background: rgba(255, 255, 255, 0.04);
          transform: translateX(4px);
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 28px' }}>
        {/* ── Masthead ── */}
        <header style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '36px 0 28px', borderBottom: `1px solid ${HUB_THEME.hairline}`,
          flexWrap: 'wrap', gap: 16,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{
                ...MONO, fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase',
                background: 'rgba(200,155,60,0.12)', color: HUB_THEME.goldLight,
                padding: '4px 10px', borderRadius: 4, border: `1px solid ${HUB_THEME.hairline}`,
              }}>
                Dual Information Ecosystem
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: HUB_THEME.inkLight }}>
                <Radio size={12} color="#10B981" className="animate-pulse" />
                Live Subsystems
              </span>
            </div>
            <h1 style={{ ...SERIF, fontSize: 34, fontWeight: 600, color: HUB_THEME.paper, margin: 0, lineHeight: 1.1 }}>
              KAI Information Hub
            </h1>
            <p style={{ ...SANS, fontSize: 14, color: HUB_THEME.inkLight, margin: '6px 0 0' }}>
              Connected to your pre-built repositories: SIHU News Hub and Oloolua Conservation Hub.
            </p>
          </div>

          {/* Quick status indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 14px', borderRadius: 10,
              background: 'rgba(255,255,255,0.03)', border: `1px solid ${HUB_THEME.hairline}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: HUB_THEME.paperDim }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: serverStatus[3000] === false ? '#EF4444' : '#10B981',
                }} />
                <span>SIHU (:3000)</span>
              </div>
              <span style={{ width: 1, height: 14, background: HUB_THEME.hairline }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: HUB_THEME.paperDim }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: serverStatus[3002] === false ? '#EF4444' : '#10B981',
                }} />
                <span>Oloolua (:3002)</span>
              </div>
            </div>

            <button
              onClick={checkServers}
              disabled={isChecking}
              title="Refresh subsystem status"
              style={{
                width: 36, height: 36, borderRadius: 8, border: `1px solid ${HUB_THEME.hairline}`,
                background: 'transparent', color: HUB_THEME.goldLight, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <RefreshCw size={14} className={isChecking ? 'animate-spin' : ''} />
            </button>
          </div>
        </header>

        {/* ── Subsystem Selector Tabs ── */}
        <section style={{ margin: '28px 0 32px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Ecosystem Hubs', count: '2 Hubs Active' },
            { id: 'sihu', label: '📰 SIHU News Hub', count: 'Port 3000' },
            { id: 'oloolua', label: '🌲 Oloolua Conservation', count: 'Port 3002' },
          ].map((tab) => {
            const active = selectedHub === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedHub(tab.id as typeof selectedHub)}
                style={{
                  padding: '10px 18px', borderRadius: 8, border: `1px solid ${active ? HUB_THEME.gold : HUB_THEME.hairline}`,
                  background: active ? 'rgba(200,155,60,0.12)' : 'rgba(255,255,255,0.02)',
                  color: active ? HUB_THEME.goldLight : HUB_THEME.paperDim,
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s',
                }}
              >
                <span style={{ fontSize: 14, fontWeight: active ? 700 : 500 }}>{tab.label}</span>
                <span style={{
                  ...MONO, fontSize: 10, letterSpacing: 0.8,
                  padding: '2px 6px', borderRadius: 4,
                  background: active ? HUB_THEME.gold : 'rgba(255,255,255,0.06)',
                  color: active ? HUB_THEME.ink : HUB_THEME.inkLight,
                  fontWeight: 600,
                }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </section>

        {/* ── Hub Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: selectedHub === 'all' ? 'repeat(auto-fit, minmax(480px, 1fr))' : '1fr', gap: 26 }}>
          {HUBS.filter(h => selectedHub === 'all' || selectedHub === h.id).map((hub) => {
            const isOnline = serverStatus[hub.port] !== false;
            return (
              <motion.article
                key={hub.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: HUB_THEME.card,
                  borderRadius: 16,
                  border: `1px solid ${HUB_THEME.hairline}`,
                  padding: 30,
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Accent top line */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                  background: `linear-gradient(90deg, ${hub.accent}, transparent)`,
                }} />

                {/* Hub Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 14 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{
                        ...MONO, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase',
                        color: hub.accent, fontWeight: 700,
                        background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 4,
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

                    <h2 style={{ ...SERIF, fontSize: 26, fontWeight: 600, color: HUB_THEME.paper, margin: 0 }}>
                      {hub.name}
                    </h2>
                    <p style={{ ...MONO, fontSize: 11, color: HUB_THEME.goldLight, margin: '4px 0 0' }}>
                      {hub.tagline}
                    </p>
                  </div>

                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: `rgba(${hub.id === 'sihu' ? '200,155,60' : '16,185,129'}, 0.12)`,
                    color: hub.accent,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {hub.id === 'sihu' ? <Newspaper size={22} /> : <TreePine size={22} />}
                  </div>
                </div>

                <p style={{ fontSize: 14, color: 'rgba(246,242,231,0.72)', lineHeight: 1.6, margin: '0 0 24px' }}>
                  {hub.desc}
                </p>

                {/* Features List */}
                <div style={{ borderTop: `1px solid ${HUB_THEME.hairline}`, padding: '18px 0 20px', flex: 1 }}>
                  <p style={{ ...labelStyle(), marginBottom: 14 }}>Connected Capabilities & Services</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {hub.features.map((feat, idx) => (
                      <div
                        key={idx}
                        className="hub-feature-hover"
                        style={{
                          padding: '10px 12px',
                          borderRadius: 8,
                          transition: 'all 0.18s ease',
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 12,
                        }}
                      >
                        <div>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: HUB_THEME.paper }}>
                            {feat.title}
                          </p>
                          <p style={{ margin: '3px 0 0', fontSize: 12, color: HUB_THEME.inkLight, lineHeight: 1.4 }}>
                            {feat.desc}
                          </p>
                        </div>
                        {feat.url && (
                          feat.internal ? (
                            <Link href={feat.url} style={{ color: hub.accent, opacity: 0.85, textDecoration: 'none', display: 'flex', alignItems: 'center', paddingTop: 2 }}>
                              <ArrowRight size={15} />
                            </Link>
                          ) : (
                            <a href={feat.url} target="_blank" rel="noreferrer" style={{ color: hub.accent, opacity: 0.85, textDecoration: 'none', display: 'flex', alignItems: 'center', paddingTop: 2 }}>
                              <ExternalLink size={14} />
                            </a>
                          )
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{
                  borderTop: `1px solid ${HUB_THEME.hairline}`,
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
                          padding: '10px 18px',
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 600,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: act.primary ? hub.accent : 'rgba(255,255,255,0.05)',
                          color: act.primary ? HUB_THEME.ink : HUB_THEME.paper,
                          border: `1px solid ${act.primary ? hub.accent : HUB_THEME.hairline}`,
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
                          padding: '10px 18px',
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 600,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: act.primary ? hub.accent : 'rgba(255,255,255,0.05)',
                          color: act.primary ? HUB_THEME.ink : HUB_THEME.paper,
                          border: `1px solid ${act.primary ? hub.accent : HUB_THEME.hairline}`,
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

        {/* ── Subsystem Architecture Note ── */}
        <section style={{
          marginTop: 40, padding: '24px 28px',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 12, border: `1px solid ${HUB_THEME.hairline}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16,
        }}>
          <div>
            <p style={{ ...labelStyle(), marginBottom: 4 }}>Subsystem Architecture</p>
            <p style={{ margin: 0, fontSize: 13, color: HUB_THEME.inkLight }}>
              Both services run concurrently in dev mode. All article authoring, review, and roles belong to the committed <span style={{ color: HUB_THEME.goldLight, fontWeight: 600 }}>SIHU publishing service</span>.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a
              href={`${SIHU_BASE}/portal/submit`}
              target="_blank"
              rel="noreferrer"
              style={{
                ...MONO, fontSize: 11, padding: '8px 14px', borderRadius: 6,
                background: HUB_THEME.gold, color: HUB_THEME.ink, fontWeight: 700,
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              <PenTool size={13} />
              Write Story (SIHU) ↗
            </a>
            <a
              href={`${SIHU_BASE}/admin/review`}
              target="_blank"
              rel="noreferrer"
              style={{
                ...MONO, fontSize: 11, padding: '8px 14px', borderRadius: 6,
                background: 'rgba(255,255,255,0.06)', color: HUB_THEME.paper, fontWeight: 600,
                textDecoration: 'none', border: `1px solid ${HUB_THEME.hairline}`,
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              <ShieldCheck size={13} />
              Review Queue ↗
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}