'use client';

import { motion } from 'framer-motion';
import { CalendarCheck2, CheckCircle2 } from 'lucide-react';

interface DailyCheckInCardProps {
  claimedToday: boolean;
  points: number;
  claiming: boolean;
  onClaim: () => void;
}

/**
 * "Today's Reward Claimed" card (KAI Nuvari PRD §4). Separate from the
 * generic task list because the daily reward resets every calendar day —
 * see /api/kai-bar/checkin.
 */
export default function DailyCheckInCard({ claimedToday, points, claiming, onClaim }: DailyCheckInCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-elevated"
      style={{
        borderRadius: 18,
        padding: '16px 20px',
        marginBottom: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        background: claimedToday ? 'rgba(52,211,153,0.06)' : 'rgba(6,6,14,0.72)',
        backdropFilter: 'blur(22px)',
        boxShadow: `0 0 0 0.5px ${claimedToday ? 'rgba(52,211,153,0.3)' : 'rgba(245,158,11,0.22)'} inset, 0 12px 40px rgba(0,0,0,0.48)`,
      }}
    >
      <div
        style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: claimedToday ? 'rgba(52,211,153,0.14)' : 'rgba(245,158,11,0.14)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <CalendarCheck2 size={22} color={claimedToday ? '#6ee7b7' : '#fbbf24'} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 800, margin: 0, color: '#fff' }}>Today&apos;s Reward</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: '2px 0 0' }}>
          {claimedToday ? 'Claimed. Come back tomorrow.' : `Sign in daily to earn +${points} Kai Bar`}
        </p>
      </div>
      {claimedToday ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6ee7b7', fontSize: 12, fontWeight: 800 }}>
          <CheckCircle2 size={18} /> Claimed
        </div>
      ) : (
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          disabled={claiming}
          onClick={onClaim}
          style={{
            padding: '9px 16px', borderRadius: 10, border: 'none',
            cursor: claiming ? 'wait' : 'pointer',
            background: 'linear-gradient(135deg,#f59e0b,#b45309)', color: '#fff',
            fontSize: 12, fontWeight: 800,
          }}
        >
          {claiming ? 'Claiming…' : `Claim +${points}`}
        </motion.button>
      )}
    </motion.div>
  );
}
