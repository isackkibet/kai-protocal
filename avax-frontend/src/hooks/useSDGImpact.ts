'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const { getAccessToken, authenticated } = usePrivyAuth();
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
    const data = await loadStats(await getAccessToken());
    if (data) apply(data);
  }, [getAccessToken, apply]);

  // Points belong to the email account (Privy session), not a wallet.
  useEffect(() => {
    let on = true;
    getAccessToken()
      .then((token) => loadStats(token))
      .then((data) => { if (on && data) apply(data); })
      .finally(() => { if (on) setLoading(false); });
    return () => { on = false; };
  }, [getAccessToken, authenticated, apply]);

  const logAction = async (actionId: string): Promise<boolean> => {
    try {
      const token = await getAccessToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch('/api/sdg', {
        method: 'POST',
        headers,
        body: JSON.stringify({ actionId }),
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

/** GET /api/sdg for the signed-in account; null when offline (the page keeps what it has). */
async function loadStats(token: string | null) {
  try {
    const res = await fetch('/api/sdg', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}
