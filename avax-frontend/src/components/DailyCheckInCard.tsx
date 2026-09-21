'use client';

import { CalendarCheck2, CheckCircle2 } from 'lucide-react';

const C = { gold: '#C89B3C', goldLight: '#E4C878', paper: '#F6F2E7', inkLight: '#9BA396', hairline: 'rgba(200,155,60,0.14)' };

interface DailyCheckInCardProps {
  claimedToday: boolean;
  points: number;
  claiming: boolean;
  onClaim: () => void;
}

/**
 * "Today's Reward Claimed" row (KAI Nuvari PRD §4). Separate from the
 * generic task list because the daily reward resets every calendar day —
 * see /api/kai-bar/checkin.
 */
export default function DailyCheckInCard({ claimedToday, points, claiming, onClaim }: DailyCheckInCardProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0',
      borderBottom: `1px solid ${C.hairline}`,
    }}>
      <CalendarCheck2 size={19} color={claimedToday ? C.goldLight : C.gold} strokeWidth={1.7} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: C.paper }}>Today&apos;s Reward</p>
        <p style={{ fontSize: 11.5, color: C.inkLight, margin: '2px 0 0' }}>
          {claimedToday ? 'Claimed. Come back tomorrow.' : `Sign in daily to earn +${points} Kai Bar`}
        </p>
      </div>
      {claimedToday ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.goldLight, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
          <CheckCircle2 size={17} /> Claimed
        </div>
      ) : (
        <button
          disabled={claiming}
          onClick={onClaim}
          style={{
            padding: '9px 18px', borderRadius: 999, border: 'none',
            cursor: claiming ? 'wait' : 'pointer', flexShrink: 0,
            background: C.gold, color: '#1B1A14', fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
          }}
        >
          {claiming ? 'Claiming…' : `Claim +${points}`}
        </button>
      )}
    </div>
  );
}
