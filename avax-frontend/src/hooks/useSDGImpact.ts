'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { usePrivyAuth } from '@/lib/auth/privy-auth';
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
  const { getAccessToken } = usePrivyAuth();
  const [totalPoints, setTotalPoints] = useState(0);
  const [tier, setTier] = useState('Seedling Explorer');
  const [badge, setBadge] = useState('🌱');
  const [multiplier, setMultiplier] = useState('1.0x');
  const [nextTierPts, setNextTierPts] = useState(250);
  const [progressToNextTier, setProgressToNextTier] = useState(0);
  const [goals, setGoals] = useState<SDGGoalStat[]>([]);
  const [availableActions, setAvailableActions] = useState<SDGActionDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the /api/sdg GET body
  const apply = useCallback((data: any) => {
    setTotalPoints(data.totalPoints);
    setTier(data.tier);
    setBadge(data.badge);
    setMultiplier(data.multiplier);
    setNextTierPts(data.nextTierPts);
    setProgressToNextTier(data.progressToNextTier);
    setGoals(data.goals || []);
    setAvailableActions(data.availableActions || []);
  }, []);

  const fetchStats = useCallback(async () => {
    const data = await loadStats(address);
    if (data) apply(data);
  }, [address, apply]);

  useEffect(() => {
    let on = true;
    loadStats(address)
      .then((data) => { if (on && data) apply(data); })
      .finally(() => { if (on) setLoading(false); });
    return () => { on = false; };
  }, [address, apply]);

  const logAction = async (actionId: string): Promise<boolean> => {
    try {
      const token = await getAccessToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch('/api/sdg', {
        method: 'POST',
        headers,
        body: JSON.stringify({ wallet: address, actionId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast(data.error || 'Could not add the points. Try again.');
        setTimeout(() => setToast(null), 3500);
        return false;
      }

      setToast(data.message || 'SDG effort points logged.');
      setTimeout(() => setToast(null), 3500);

      await fetchStats();
      return true;
    } catch {
      setToast('Could not log activity. Try again.');
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

/** GET /api/sdg for a wallet; null when offline (the page keeps what it has). */
async function loadStats(address: string | undefined) {
  try {
    const q = address ? `?wallet=${encodeURIComponent(address)}` : '';
    const res = await fetch(`/api/sdg${q}`);
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}
