'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Sparkles, TrendingUp, Award, CheckCircle2,
  ChevronRight, Leaf, Shield, Flame, Trees, Droplets,
  Coins, HeartHandshake, Loader2, ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';
import { useSDGImpact } from '@/hooks/useSDGImpact';

export default function SDGImpactCard() {
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

  const [activeTab, setActiveTab] = useState<'goals' | 'earn'>('goals');
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const handleClaim = async (actionId: string) => {
    if (submittingId) return;
    setSubmittingId(actionId);
    await logAction(actionId);
    setSubmittingId(null);
  };

  return (
    <div
      style={{
        borderRadius: 24,
        background: 'linear-gradient(135deg, rgba(6,30,20,0.75) 0%, rgba(10,18,14,0.92) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(52,211,153,0.22)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.45), 0 0 24px rgba(16,185,129,0.12)',
        padding: '24px 20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient background glow */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Floating Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            style={{
              position: 'absolute',
              top: 14,
              left: 20,
              right: 20,
              padding: '10px 14px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 800,
              boxShadow: '0 4px 20px rgba(16,185,129,0.5)',
              zIndex: 30,
              textAlign: 'center',
            }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(4,120,87,0.4))',
              border: '1px solid rgba(52,211,153,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              boxShadow: '0 0 16px rgba(16,185,129,0.3)',
            }}
          >
            🌍
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>
                SDG Impact &amp; Effort
              </h3>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: 20,
                  background: 'rgba(52,211,153,0.15)',
                  color: '#34d399',
                  border: '1px solid rgba(52,211,153,0.3)',
                }}
              >
                UN 2030 Goals
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
              Earn points for on-chain sustainability &amp; community activities
            </p>
          </div>
        </div>

        <Link
          href="/sdg"
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#34d399',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            textDecoration: 'none',
            padding: '4px 8px',
            borderRadius: 8,
            background: 'rgba(52,211,153,0.08)',
          }}
        >
          Details <ArrowUpRight size={13} />
        </Link>
      </div>

      {/* Main Stats Banner */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr 1fr',
          gap: 10,
          background: 'rgba(0,0,0,0.35)',
          borderRadius: 16,
          padding: '14px 16px',
          border: '1px solid rgba(255,255,255,0.06)',
          marginBottom: 16,
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
            SDG Effort Score
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#34d399' }}>
              {totalPoints.toLocaleString()}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>pts</span>
          </div>
        </div>

        <div>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
            Impact Tier
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
            <span style={{ fontSize: 15 }}>{badge}</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap' }}>
              {tier}
            </span>
          </div>
        </div>

        <div>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
            Airdrop Bonus
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: '#fbbf24' }}>
              {multiplier} Multiplier
            </span>
          </div>
        </div>
      </div>

      {/* Tier Progress Bar */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: 5 }}>
          <span>Next Milestone: {nextTierPts} pts</span>
          <span style={{ color: '#34d399' }}>{progressToNextTier}% Completed</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressToNextTier}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              height: '100%',
              borderRadius: 3,
              background: 'linear-gradient(90deg, #10b981, #34d399)',
              boxShadow: '0 0 10px rgba(52,211,153,0.5)',
            }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, background: 'rgba(0,0,0,0.25)', padding: 4, borderRadius: 10 }}>
        <button
          onClick={() => setActiveTab('goals')}
          style={{
            flex: 1,
            padding: '7px 0',
            borderRadius: 7,
            fontSize: 11,
            fontWeight: 800,
            border: 'none',
            cursor: 'pointer',
            background: activeTab === 'goals' ? 'rgba(52,211,153,0.22)' : 'transparent',
            color: activeTab === 'goals' ? '#34d399' : 'rgba(255,255,255,0.45)',
            transition: 'all 0.15s',
          }}
        >
          🌿 UN SDG Goals Breakdown
        </button>
        <button
          onClick={() => setActiveTab('earn')}
          style={{
            flex: 1,
            padding: '7px 0',
            borderRadius: 7,
            fontSize: 11,
            fontWeight: 800,
            border: 'none',
            cursor: 'pointer',
            background: activeTab === 'earn' ? 'rgba(52,211,153,0.22)' : 'transparent',
            color: activeTab === 'earn' ? '#34d399' : 'rgba(255,255,255,0.45)',
            transition: 'all 0.15s',
          }}
        >
          ⚡ Earn Points (Actions)
        </button>
      </div>

      {/* Tab 1: Goals Breakdown */}
      {activeTab === 'goals' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: 8 }}>
          {goals.map((g) => (
            <div
              key={g.code}
              style={{
                borderRadius: 14,
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${g.color}35`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: g.color,
                }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 900, color: g.color }}>{g.code}</span>
                  <span style={{ fontSize: 14 }}>{g.icon}</span>
                </div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                  {g.name}
                </p>
              </div>

              <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ margin: 0, fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>{g.impactMetric}</p>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#34d399' }}>{g.impactValue}</p>
                <p style={{ margin: '2px 0 0', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>
                  {g.points} pts ({g.actionsCount} actions)
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Actionable SDG Tasks */}
      {activeTab === 'earn' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {availableActions.map((act) => (
            <div
              key={act.id}
              style={{
                borderRadius: 14,
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: 'rgba(52,211,153,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    flexShrink: 0,
                  }}
                >
                  {act.icon}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {act.title}
                    </p>
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.12)', padding: '1px 5px', borderRadius: 4 }}>
                      SDG {act.sdgNumber}
                    </span>
                  </div>
                  <p style={{ margin: '2px 0 0', fontSize: 10, color: 'rgba(255,255,255,0.45)', lineHeight: 1.2 }}>
                    {act.desc}
                  </p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleClaim(act.id)}
                disabled={submittingId === act.id}
                style={{
                  padding: '7px 12px',
                  borderRadius: 10,
                  border: 'none',
                  cursor: submittingId === act.id ? 'not-allowed' : 'pointer',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  flexShrink: 0,
                  boxShadow: '0 2px 10px rgba(16,185,129,0.35)',
                }}
              >
                {submittingId === act.id ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <>+{act.points} pts</>
                )}
              </motion.button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
