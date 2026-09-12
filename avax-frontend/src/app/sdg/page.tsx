'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Globe, Award, Sparkles, TrendingUp,
  CheckCircle2, Trees, Droplets, Leaf, Shield,
  Coins, HeartHandshake, Loader2, ExternalLink,
  ChevronRight, ArrowUpRight, Flame,
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { useSDGImpact } from '@/hooks/useSDGImpact';
import WalletConnectModal from '@/components/WalletConnectModal';

const W: React.CSSProperties = { width: '100%', maxWidth: 1080, margin: '0 auto', padding: '0 24px' };
const Rs: React.CSSProperties = { textShadow: '0 1px 4px rgba(0,0,0,0.88)' };

export default function SDGPage() {
  const { address, isConnected } = useAccount();
  const [showModal, setShowModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'All' | 'Environment' | 'Economy' | 'Community' | 'Agriculture'>('All');
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const {
    totalPoints,
    tier,
    badge,
    multiplier,
    nextTierPts,
    progressToNextTier,
    goals,
    availableActions,
    toast,
    logAction,
    loading,
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

  return (
    <main style={{ minHeight: '100dvh', color: '#fff', fontFamily: 'var(--font-sans)', position: 'relative', paddingBottom: 100 }}>
      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            style={{
              position: 'fixed',
              top: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '12px 20px',
              borderRadius: 14,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 800,
              boxShadow: '0 8px 32px rgba(16,185,129,0.5)',
              zIndex: 100,
              textAlign: 'center',
            }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ ...W, paddingTop: 32 }}>
        {/* Navigation bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link
              href="/"
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399',
                textDecoration: 'none',
              }}
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: -0.5, ...Rs }}>
                  🌍 SDG Impact &amp; Effort Score
                </h1>
                <span style={{ fontSize: 10, fontWeight: 800, background: 'rgba(52,211,153,0.15)', color: '#34d399', padding: '2px 8px', borderRadius: 20, border: '1px solid rgba(52,211,153,0.3)' }}>
                  UN 2030 Aligned
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '3px 0 0' }}>
                On-chain sustainability metrics · Community MRV verification · Avalanche C-Chain
              </p>
            </div>
          </div>

          {!isConnected ? (
            <button
              onClick={() => setShowModal(true)}
              style={{
                padding: '8px 16px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                fontSize: 12,
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Connect Wallet
            </button>
          ) : (
            <div style={{ fontSize: 12, color: '#34d399', fontWeight: 700, background: 'rgba(52,211,153,0.1)', padding: '6px 12px', borderRadius: 10, border: '1px solid rgba(52,211,153,0.25)' }}>
              🟢 {address?.slice(0, 6)}…{address?.slice(-4)}
            </div>
          )}
        </div>

        {/* Hero Banner with Impact Score and Tier */}
        <div
          style={{
            borderRadius: 24,
            padding: '28px 24px',
            background: 'linear-gradient(135deg, rgba(6,32,20,0.85) 0%, rgba(10,20,16,0.95) 100%)',
            border: '1px solid rgba(52,211,153,0.3)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 0 30px rgba(16,185,129,0.15)',
            marginBottom: 28,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>
                YOUR VERIFIED IMPACT
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 40, fontWeight: 900, color: '#34d399', letterSpacing: -1 }}>
                  {totalPoints.toLocaleString()}
                </span>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>SDG Points</span>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
                Your activities contribute to real-world carbon offset and African community development.
              </p>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 18, padding: '16px 18px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>TIER &amp; REWARD MULTIPLIER</span>
                <span style={{ fontSize: 11, color: '#fbbf24', fontWeight: 800 }}>{multiplier} Airdrop Boost</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 24 }}>{badge}</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#fff' }}>{tier}</h3>
                  <p style={{ margin: 0, fontSize: 11, color: '#34d399', fontWeight: 700 }}>
                    {progressToNextTier}% to {nextTierPts} pts milestone
                  </p>
                </div>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', marginTop: 12, overflow: 'hidden' }}>
                <div style={{ width: `${progressToNextTier}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Goals Breakdown Section */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#fff' }}>
                🌿 UN Sustainable Development Goals (SDGs)
              </h2>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: '2px 0 0' }}>
                Hover or inspect each goal to see your contribution breakdown
              </p>
            </div>
            <span style={{ fontSize: 11, color: '#34d399', fontWeight: 700 }}>6 Goals Active</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 14 }}>
            {goals.map((g) => (
              <div
                key={g.code}
                style={{
                  borderRadius: 18,
                  padding: '16px 18px',
                  background: 'rgba(10,16,14,0.7)',
                  border: `1px solid ${g.color}40`,
                  boxShadow: `0 4px 20px rgba(0,0,0,0.3), 0 0 16px ${g.color}15`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 900, color: '#fff', background: g.color, padding: '2px 8px', borderRadius: 6 }}>
                        {g.code}
                      </span>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#fff' }}>{g.name}</h4>
                    </div>
                    <span style={{ fontSize: 18 }}>{g.icon}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 11.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.45 }}>
                    {g.description}
                  </p>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>{g.impactMetric}</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: '#34d399' }}>{g.impactValue}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>Points Earned</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: '#fff' }}>{g.points} pts</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actionable Activities Checklist */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#fff' }}>
                ⚡ Earn SDG Points &amp; Level Up
              </h2>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: '2px 0 0' }}>
                Perform on-chain actions or log community verification activities to earn points
              </p>
            </div>

            {/* Category filter tabs */}
            <div style={{ display: 'flex', gap: 6, background: 'rgba(0,0,0,0.3)', padding: 4, borderRadius: 10 }}>
              {(['All', 'Environment', 'Economy', 'Community', 'Agriculture'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 7,
                    fontSize: 11,
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: activeCategory === cat ? 'rgba(52,211,153,0.22)' : 'transparent',
                    color: activeCategory === cat ? '#34d399' : 'rgba(255,255,255,0.45)',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredActions.map((act) => (
              <div
                key={act.id}
                style={{
                  borderRadius: 18,
                  padding: '16px 20px',
                  background: 'rgba(10,16,14,0.6)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      background: 'rgba(52,211,153,0.12)',
                      border: '1px solid rgba(52,211,153,0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                      flexShrink: 0,
                    }}
                  >
                    {act.icon}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#fff' }}>{act.title}</h4>
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#34d399', background: 'rgba(52,211,153,0.14)', padding: '1px 7px', borderRadius: 6 }}>
                        SDG {act.sdgNumber}
                      </span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                        {act.category}
                      </span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.3 }}>
                      {act.desc}
                    </p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleClaim(act.id)}
                  disabled={submittingId === act.id}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 12,
                    border: 'none',
                    cursor: submittingId === act.id ? 'not-allowed' : 'pointer',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flexShrink: 0,
                    boxShadow: '0 4px 16px rgba(16,185,129,0.35)',
                  }}
                >
                  {submittingId === act.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <Sparkles size={14} /> +{act.points} pts
                    </>
                  )}
                </motion.button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showModal && <WalletConnectModal onClose={() => setShowModal(false)} />}
    </main>
  );
}
