'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { SDGGoalStat, SDGActionDefinition } from '@/app/api/sdg/route';

export interface SDGImpactState {
  totalPoints: number;
  tier: string;
  badge: string;
  multiplier: string;
  nextTierPts: number;
  progressToNextTier: number;
  goals: SDGGoalStat[];
  availableActions: SDGActionDefinition[];
  loading: boolean;
  toast: string | null;
  logAction: (actionId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useSDGImpact(): SDGImpactState {
  const { address } = useAccount();
  const [totalPoints, setTotalPoints] = useState(225);
  const [tier, setTier] = useState('Seedling Explorer');
  const [badge, setBadge] = useState('🌱');
  const [multiplier, setMultiplier] = useState('1.0x');
  const [nextTierPts, setNextTierPts] = useState(250);
  const [progressToNextTier, setProgressToNextTier] = useState(90);
  const [goals, setGoals] = useState<SDGGoalStat[]>([]);
  const [availableActions, setAvailableActions] = useState<SDGActionDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const q = address ? `?wallet=${encodeURIComponent(address)}` : '';
      const res = await fetch(`/api/sdg${q}`);
      if (!res.ok) throw new Error('Failed to fetch SDG statistics');
      const data = await res.json();

      setTotalPoints(data.totalPoints);
      setTier(data.tier);
      setBadge(data.badge);
      setMultiplier(data.multiplier);
      setNextTierPts(data.nextTierPts);
      setProgressToNextTier(data.progressToNextTier);
      setGoals(data.goals || []);
      setAvailableActions(data.availableActions || []);
    } catch {
      // Keep optimistic values if offline
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const logAction = async (actionId: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/sdg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: address || '0x_anonymous', actionId }),
      });

      if (!res.ok) throw new Error('Failed to log action');
      const data = await res.json();

      setToast(data.message || '🎉 SDG Effort Points Logged!');
      setTimeout(() => setToast(null), 3500);

      await fetchStats();
      return true;
    } catch {
      setToast('⚠️ Could not log activity. Try again.');
      setTimeout(() => setToast(null), 3000);
      return false;
    }
  };

  return {
    totalPoints,
    tier,
    badge,
    multiplier,
    nextTierPts,
    progressToNextTier,
    goals,
    availableActions,
    loading,
    toast,
    logAction,
    refresh: fetchStats,
  };
}
