'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Globe, Sparkles, Loader2, Wallet,
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { useSDGImpact } from '@/hooks/useSDGImpact';
import WalletConnectModal from '@/components/WalletConnectModal';
import { iconForSdg, iconForTier } from '@/lib/sdgIcons';

/* Same editorial system as the rest of the app — pine + gold + paper,
   flat sections separated by a hairline, no gradient card shells. Real
   lucide icons throughout instead of the emoji this page used to render
   directly (🌍/🌿/⚡ headings, an emoji badge, an emoji per goal/action). */
const C = {
  bg:        '#0B1C14',
  gold:      '#C89B3C',
  goldLight: '#E4C878',
  paper:     '#F6F2E7',
  paperDim:  '#EFE9D9',
  inkLight:  '#9BA396',
  hairline:  'rgba(200,155,60,0.14)',
};
const MONO: React.CSSProperties = { fontFamily: 'var(--font-plex-mono), monospace' };
const SERIF: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const label: React.CSSProperties = { ...MONO, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: C.goldLight, fontWeight: 600, margin: 0 };
const W: React.CSSProperties = { width: '100%', maxWidth: 1080, margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' };

const CATEGORIES = ['All', 'Environment', 'Economy', 'Community', 'Agriculture'] as const;

export default function SDGPage() {
  const { address, isConnected } = useAccount();
  const [showModal, setShowModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState<typeof CATEGORIES[number]>('All');
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const {
    totalPoints,
    tier,
    multiplier,
    nextTierPts,
    progressToNextTier,
    goals,
    availableActions,
    toast,
    logAction,
  } = useSDGImpact();

  const handleClaim = async (actionId: string) => {
    if (submittingId) return;
    setSubmittingId(actionId);
    await logAction(actionId);
    setSubmittingId(null);
  };

  const filteredActions = activeCategory === 'All'
    ? availableActions
    : availableActions.filter(a => a.category === activeCategory);

  const TierIcon = iconForTier(tier);

  return (
    <main style={{ minHeight: '100dvh', background: C.bg, color: C.paper, fontFamily: "'Poppins', 'IBM Plex Sans', var(--font-sans)", position: 'relative', paddingBottom: 100 }}>
      <style>{`.sdg-cat:hover { color: ${C.goldLight}; }`}</style>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            style={{
              position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
              padding: '11px 22px', borderRadius: 999, background: C.bg, border: `1px solid ${C.hairline}`,
              color: C.goldLight, fontSize: 13, fontWeight: 700, zIndex: 100, textAlign: 'center',
            }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ ...W, paddingTop: 32 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', color: C.inkLight }}>
              <ArrowLeft size={18} />
            </Link>
            <Globe size={20} color={C.goldLight} strokeWidth={1.7} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 style={{ ...SERIF, fontSize: 21, fontWeight: 600, margin: 0, color: C.paper }}>
                  SDG Impact &amp; Effort Score
                </h1>
                <span style={{ ...MONO, fontSize: 9.5, fontWeight: 700, color: C.goldLight, letterSpacing: 0.4 }}>UN 2030 ALIGNED</span>
              </div>
              <p style={{ fontSize: 11.5, color: C.inkLight, margin: '3px 0 0' }}>
                On-chain sustainability metrics · Community MRV verification · Avalanche C-Chain
              </p>
            </div>
          </div>

          {!isConnected ? (
            <button
              onClick={() => setShowModal(true)}
              style={{ padding: '9px 20px', borderRadius: 999, background: C.gold, color: '#1B1A14', fontSize: 12.5, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Connect Wallet
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: C.goldLight, fontWeight: 600 }}>
              <Wallet size={13} /> {address?.slice(0, 6)}…{address?.slice(-4)}
            </div>
          )}
        </div>

        {/* Hero: score + tier */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 32, marginBottom: 36, paddingBottom: 32, borderBottom: `1px solid ${C.hairline}` }}>
          <div>
            <p style={label}>Your Verified Impact</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 10 }}>
              <span style={{ ...SERIF, fontSize: 40, fontWeight: 600, color: C.goldLight, letterSpacing: '-1px' }}>
                {totalPoints.toLocaleString()}
              </span>
              <span style={{ fontSize: 15, fontWeight: 600, color: C.inkLight }}>SDG points</span>
            </div>
            <p style={{ margin: '8px 0 0', fontSize: 12.5, color: C.inkLight, lineHeight: 1.6, maxWidth: 340 }}>
              Your activities contribute to real-world carbon offset and African community development.
            </p>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={label}>Tier &amp; Reward Multiplier</p>
              <span style={{ fontSize: 11.5, color: C.goldLight, fontWeight: 700 }}>{multiplier} airdrop boost</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <TierIcon size={22} color={C.goldLight} strokeWidth={1.7} />
              <div>
                <p style={{ ...SERIF, margin: 0, fontSize: 16, fontWeight: 600, color: C.paper }}>{tier}</p>
                <p style={{ margin: 0, fontSize: 11.5, color: C.goldLight, fontWeight: 600 }}>
                  {progressToNextTier}% to {nextTierPts} pts milestone
                </p>
              </div>
            </div>
            <div style={{ height: 3, borderRadius: 2, background: C.hairline, overflow: 'hidden' }}>
              <div style={{ width: `${progressToNextTier}%`, height: '100%', background: C.gold }} />
            </div>
          </div>
        </div>

        {/* Goals breakdown */}
        <div style={{ marginBottom: 36, paddingBottom: 32, borderBottom: `1px solid ${C.hairline}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 style={{ ...SERIF, fontSize: 17, fontWeight: 600, margin: 0, color: C.paper }}>
                UN Sustainable Development Goals
              </h2>
              <p style={{ fontSize: 12, color: C.inkLight, margin: '3px 0 0' }}>
                Your contribution breakdown across the six goals KAI tracks
              </p>
            </div>
            <span style={{ fontSize: 11.5, color: C.goldLight, fontWeight: 600 }}>6 active</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px 32px' }}>
            {goals.map((g) => {
              const GoalIcon = iconForSdg(g.sdgNumber);
              return (
                <div key={g.code}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <GoalIcon size={16} color={g.color} strokeWidth={1.7} />
                    <span style={{ ...MONO, fontSize: 9.5, fontWeight: 700, color: g.color }}>{g.code}</span>
                    <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: C.paper }}>{g.name}</p>
                  </div>
                  <p style={{ margin: '0 0 12px', fontSize: 11.5, color: C.inkLight, lineHeight: 1.5 }}>
                    {g.description}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 10, borderTop: `1px solid ${C.hairline}` }}>
                    <div>
                      <p style={{ margin: '0 0 2px', fontSize: 9.5, color: C.inkLight, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>{g.impactMetric}</p>
                      <p style={{ ...SERIF, margin: 0, fontSize: 14, fontWeight: 600, color: g.color }}>{g.impactValue}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: '0 0 2px', fontSize: 9.5, color: C.inkLight, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>Points</p>
                      <p style={{ ...SERIF, margin: 0, fontSize: 14, fontWeight: 600, color: g.points > 0 ? C.goldLight : C.paper }}>{g.points} pts</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Earn points */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
            <div>
              <h2 style={{ ...SERIF, fontSize: 17, fontWeight: 600, margin: 0, color: C.paper }}>
                Earn SDG points &amp; level up
              </h2>
              <p style={{ fontSize: 12, color: C.inkLight, margin: '3px 0 0' }}>
                Perform on-chain actions or log community verification activities
              </p>
            </div>

            <div style={{ display: 'flex', gap: 18 }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="sdg-cat"
                  style={{
                    padding: 0, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    fontSize: 12, fontWeight: activeCategory === cat ? 700 : 500,
                    color: activeCategory === cat ? C.goldLight : C.inkLight,
                    transition: 'color 0.15s ease',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {filteredActions.map((act) => {
            const ActIcon = iconForSdg(act.sdgNumber);
            return (
              <div key={act.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '14px 0', borderBottom: `1px solid ${C.hairline}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                  <ActIcon size={18} color={C.goldLight} strokeWidth={1.7} style={{ flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.paper }}>{act.title}</p>
                      <span style={{ ...MONO, fontSize: 9.5, fontWeight: 700, color: C.goldLight }}>SDG {act.sdgNumber}</span>
                      <span style={{ fontSize: 10.5, color: C.inkLight, fontWeight: 600 }}>{act.category}</span>
                    </div>
                    <p style={{ margin: '3px 0 0', fontSize: 12, color: C.inkLight, lineHeight: 1.4 }}>
                      {act.desc}
                    </p>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleClaim(act.id)}
                  disabled={submittingId === act.id}
                  style={{
                    padding: '9px 18px', borderRadius: 999, border: 'none',
                    cursor: submittingId === act.id ? 'default' : 'pointer',
                    background: C.gold, color: '#1B1A14',
                    fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                    opacity: submittingId === act.id ? 0.7 : 1,
                  }}
                >
                  {submittingId === act.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>
                      <Sparkles size={13} /> +{act.points} pts
                    </>
                  )}
                </motion.button>
              </div>
            );
          })}
        </div>
      </div>

      {showModal && <WalletConnectModal onClose={() => setShowModal(false)} />}
    </main>
  );
}
