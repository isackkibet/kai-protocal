'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePrivyAuth } from '@/lib/privy-auth';

export interface LedgerEntry {
  id: string;
  type: string;
  amount: number;
  description: string;
  referenceId?: string | null;
  createdAt: string;
}

export interface RewardTask {
  id: string;
  name: string;
  description: string | null;
  rewardAmount: number;
  taskType: string;
  maxCompletions: number | null;
  completed: boolean;
}

export interface ReferralStats {
  direct: number;
  active: number;
  networkSize: number;
}

/**
 * Client hook that aggregates the Kai Bar (PRD 2) endpoints: ledger balance,
 * tasks, referral code/stats, and airdrop eligibility — keyed by the current
 * Privy user id.
 */
export function useKaiBar() {
  const { privyUserId, authenticated, ready, getAccessToken } = usePrivyAuth();

  const [kaiBar, setKaiBar] = useState(0);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [tasks, setTasks] = useState<RewardTask[]>([]);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats>({ direct: 0, active: 0, networkSize: 0 });
  const [airdrop, setAirdrop] = useState<{
    eligible: boolean;
    contributionScore: number;
    referralScore: number;
    activityScore: number;
    onChain: { vault: string } | null;
  } | null>(null);
  const [checkin, setCheckin] = useState<{ claimedToday: boolean; points: number }>({ claimedToday: false, points: 10 });
  const [claimingCheckin, setClaimingCheckin] = useState(false);
  const [dbActive, setDbActive] = useState(true);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!privyUserId) return;
    setLoading(true);
    try {
      const [ledgerRes, tasksRes, referralRes, airdropRes, checkinRes] = await Promise.allSettled([
        fetch(`/api/kai-bar/ledger?privyUserId=${encodeURIComponent(privyUserId)}`),
        fetch(`/api/kai-bar/tasks?privyUserId=${encodeURIComponent(privyUserId)}`),
        fetch(`/api/kai-bar/referral?privyUserId=${encodeURIComponent(privyUserId)}`),
        fetch(`/api/kai-bar/airdrop?privyUserId=${encodeURIComponent(privyUserId)}`),
        fetch(`/api/kai-bar/checkin?privyUserId=${encodeURIComponent(privyUserId)}`),
      ]);

      if (ledgerRes.status === 'fulfilled') {
        const d = await ledgerRes.value.json();
        setKaiBar(d.kaiBar ?? 0);
        setEntries(d.entries ?? []);
        if (d.db === false) setDbActive(false);
      }
      if (tasksRes.status === 'fulfilled') {
        const d = await tasksRes.value.json();
        setTasks(d.tasks ?? []);
        if (d.db === false) setDbActive(false);
      }
      if (referralRes.status === 'fulfilled') {
        const d = await referralRes.value.json();
        setReferralCode(d.code ?? null);
        setReferralStats(d.stats ?? { direct: 0, active: 0, networkSize: 0 });
      }
      if (airdropRes.status === 'fulfilled') {
        const d = await airdropRes.value.json();
        setAirdrop({
          eligible: d.eligible ?? false,
          contributionScore: d.contributionScore ?? 0,
          referralScore: d.referralScore ?? 0,
          activityScore: d.activityScore ?? 0,
          onChain: d.onChain ?? null,
        });
      }
      if (checkinRes.status === 'fulfilled') {
        const d = await checkinRes.value.json();
        setCheckin({ claimedToday: d.claimedToday ?? false, points: d.points ?? 10 });
      }
    } finally {
      setLoading(false);
    }
  }, [privyUserId]);

  const claimDailyCheckin = useCallback(async (): Promise<{ ok: boolean; earned?: number; error?: string }> => {
    setClaimingCheckin(true);
    try {
      const token = await getAccessToken();
      if (!token) return { ok: false, error: 'Could not verify your session.' };
      const res = await fetch('/api/kai-bar/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (!res.ok) return { ok: false, error: d.error ?? 'Failed to claim daily reward' };
      await load();
      return { ok: true, earned: d.earned };
    } catch {
      return { ok: false, error: 'Something went wrong.' };
    } finally {
      setClaimingCheckin(false);
    }
  }, [getAccessToken, load]);

  useEffect(() => {
    if (ready && authenticated && privyUserId) load();
  }, [ready, authenticated, privyUserId, load]);

  return {
    loading,
    dbActive,
    privyUserId,
    kaiBar,
    entries,
    tasks,
    referralCode,
    referralStats,
    airdrop,
    checkin,
    claimingCheckin,
    claimDailyCheckin,
    reload: load,
  };
}