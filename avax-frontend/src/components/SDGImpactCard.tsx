'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Leaf, Zap, Loader2, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useSDGImpact } from '@/hooks/useSDGImpact';

/* Same editorial system as the rest of the app — pine + gold + paper,
   flat rows separated by a hairline, no filled "surface" boxes. */
const C = {
  gold:      '#C89B3C',
  goldLight: '#E4C878',
  paper:     '#F6F2E7',
  inkLight:  '#9BA396',
  hairline:  'rgba(200,155,60,0.14)',
};
const MONO: React.CSSProperties = { fontFamily: 'var(--font-plex-mono), monospace' };
const SERIF: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };

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
  void loading;

  return (
    <div style={{ position: 'relative' }}>

      {/* Toast — quiet, matches the hero's claim confirmation */}
      <AnimatePresence>
        {toast && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ margin: '0 0 14px', fontSize: 12.5, color: C.goldLight, fontWeight: 600, textAlign: 'center' }}
          >
            {toast}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <Globe size={17} color={C.goldLight} strokeWidth={1.7} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: C.paper, margin: 0 }}>
              SDG impact &amp; effort
            </p>
            <p style={{ fontSize: 11.5, color: C.inkLight, margin: '2px 0 0' }}>
              Earn points for on-chain sustainability and community activities
            </p>
          </div>
        </div>
        <Link href="/sdg" style={{ fontSize: 12, fontWeight: 600, color: C.goldLight, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          Details <ArrowUpRight size={13} />
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 20 }}>
        {[
          { l: 'SDG effort score', v: `${totalPoints.toLocaleString()} pts` },
          { l: 'Impact tier',      v: `${badge} ${tier}` },
          { l: 'Airdrop bonus',    v: `${multiplier} multiplier` },
        ].map(s => (
          <div key={s.l} style={{ textAlign: 'center', minWidth: 0 }}>
            <p style={{ ...MONO, fontSize: 9, color: C.inkLight, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.l}</p>
            <p style={{ ...SERIF, fontSize: 13.5, fontWeight: 600, color: C.paper, margin: 0, lineHeight: 1.3 }}>{s.v}</p>
          </div>
        ))}
      </div>

      {/* Progress toward next tier */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.inkLight, marginBottom: 6 }}>
          <span>Next milestone: {nextTierPts} pts</span>
          <span style={MONO}>{progressToNextTier}% complete</span>
        </div>
        <div style={{ height: 3, borderRadius: 2, background: C.hairline, overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressToNextTier}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ height: '100%', borderRadius: 2, background: C.gold }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 22, marginBottom: 16, borderBottom: `1px solid ${C.hairline}` }}>
        {[
          { id: 'goals' as const, label: 'UN SDG goals breakdown', icon: Leaf },
          { id: 'earn'  as const, label: 'Earn points',            icon: Zap },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 2px', marginBottom: -1,
              border: 'none', borderBottom: activeTab === t.id ? `2px solid ${C.gold}` : '2px solid transparent',
              background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 12.5, fontWeight: 600,
              color: activeTab === t.id ? C.goldLight : C.inkLight,
              transition: 'color 0.15s ease',
            }}
          >
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Goals breakdown */}
      {activeTab === 'goals' && (
        <div>
          {goals.map((g) => (
            <div key={g.code} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: g.color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ ...MONO, fontSize: 9.5, fontWeight: 700, color: C.inkLight }}>{g.code}</span>
                  <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: C.paper }}>{g.name}</p>
                </div>
                <p style={{ margin: '3px 0 0', fontSize: 11, color: C.inkLight }}>{g.impactMetric}</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ ...SERIF, margin: 0, fontSize: 13, fontWeight: 600, color: C.paper }}>{g.impactValue}</p>
                <p style={{ ...MONO, margin: '2px 0 0', fontSize: 9.5, color: C.inkLight }}>
                  {g.points} pts ({g.actionsCount})
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Actionable SDG tasks */}
      {activeTab === 'earn' && (
        <div>
          {availableActions.map((act) => (
            <div key={act.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              padding: '11px 0',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 17, flexShrink: 0 }}>{act.icon}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.paper, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {act.title}
                    </p>
                    <span style={{ ...MONO, fontSize: 9, fontWeight: 600, color: C.inkLight, flexShrink: 0 }}>
                      SDG {act.sdgNumber}
                    </span>
                  </div>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: C.inkLight, lineHeight: 1.3 }}>
                    {act.desc}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleClaim(act.id)}
                disabled={submittingId === act.id}
                style={{
                  padding: '7px 16px', borderRadius: 999, border: 'none',
                  cursor: submittingId === act.id ? 'default' : 'pointer',
                  background: C.gold, color: '#1B1A14',
                  fontSize: 11.5, fontWeight: 700, fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                  opacity: submittingId === act.id ? 0.6 : 1,
                }}
              >
                {submittingId === act.id ? <Loader2 size={12} className="animate-spin" /> : <>+{act.points} pts</>}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
