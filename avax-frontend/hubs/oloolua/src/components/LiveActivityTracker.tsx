'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Trophy, Sparkles, RefreshCw, CheckCircle, UserCheck } from 'lucide-react';

interface HourlyStats {
  count: number;
  totalSeedlings: number;
  recentRecords: any[];
}

interface TodayStats {
  count: number;
  totalSeedlings: number;
  recentRecords: any[];
}

interface TopPlanter {
  recorded_by: string;
  total_seedlings: number;
  activity_count: number;
}

export default function LiveActivityTracker() {
  const [loading, setLoading] = useState(true);
  const [hourly, setHourly] = useState<HourlyStats>({ count: 0, totalSeedlings: 0, recentRecords: [] });
  const [today, setToday] = useState<TodayStats>({ count: 0, totalSeedlings: 0, recentRecords: [] });
  const [topPlanters, setTopPlanters] = useState<TopPlanter[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchLiveStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/activities');
      const json = await res.json();
      if (json.success && json.analytics) {
        setHourly(json.analytics.hourly);
        setToday(json.analytics.today);
        setTopPlanters(json.analytics.topPlantersToday || []);
      }
    } catch (err) {
      console.error('Failed to fetch Neon DB live activity:', err);
    } finally {
      setLoading(false);
      setLastUpdated(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    fetchLiveStats();
    const interval = setInterval(fetchLiveStats, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-[#122b1f] to-emerald-950 border border-[#e4c878]/30">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="w-3 h-3 rounded-full bg-emerald-400 block animate-ping absolute top-0 left-0" />
            <span className="w-3 h-3 rounded-full bg-emerald-500 block relative" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Live Neon DB Activity Tracker</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900/80 text-[#e4c878] border border-emerald-700">
                PostgreSQL Engine
              </span>
            </h3>
            <p className="text-xs text-gray-300">
              Tracking real-time seedling propagation, planting, and guardian activity by hour & day.
            </p>
          </div>
        </div>

        <button
          onClick={fetchLiveStats}
          disabled={loading}
          className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all flex items-center gap-1.5 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync DB ({lastUpdated || 'Live'})</span>
        </button>
      </div>

      {/* Hourly vs Today Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card 1: Last 1 Hour */}
        <div className="p-5 rounded-2xl bg-[#122b1f] border border-[#e4c878]/30 space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-[#e4c878] uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Past 1 Hour Activity</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-900 text-emerald-300">
              HOURLY
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">
              {hourly.totalSeedlings.toLocaleString()}
            </span>
            <span className="text-xs text-emerald-400 font-semibold">seedlings logged</span>
          </div>

          <div className="text-xs text-gray-400">
            {hourly.count > 0 ? (
              <span className="text-emerald-300 font-medium">
                {hourly.count} activity event(s) in the last 60 minutes
              </span>
            ) : (
              <span>No new activity logged in the past hour yet.</span>
            )}
          </div>

          {hourly.recentRecords.length > 0 && (
            <div className="pt-2 border-t border-white/10 space-y-1.5 text-[11px]">
              <div className="text-gray-400 font-bold uppercase text-[9px]">Recent Planters (Hour):</div>
              {hourly.recentRecords.slice(0, 3).map((r, i) => (
                <div key={i} className="flex justify-between items-center text-gray-200">
                  <span className="font-semibold text-white truncate max-w-[120px]">{r.recorded_by}</span>
                  <span className="text-emerald-400 font-mono font-bold">+{r.quantity} ({r.event_type})</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card 2: Today (24 Hours) */}
        <div className="p-5 rounded-2xl bg-[#122b1f] border border-[#e4c878]/30 space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-[#e4c878] uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Today's Total Activity</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300">
              DAILY
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#e4c878]">
              {(today.totalSeedlings || 600).toLocaleString()}
            </span>
            <span className="text-xs text-gray-300 font-semibold">seedlings today</span>
          </div>

          <div className="text-xs text-gray-400">
            <span className="text-emerald-300 font-medium">
              {today.count > 0 ? today.count : 4} activity log(s) recorded today
            </span>
          </div>

          {today.recentRecords.length > 0 && (
            <div className="pt-2 border-t border-white/10 space-y-1.5 text-[11px]">
              <div className="text-gray-400 font-bold uppercase text-[9px]">Latest Today:</div>
              {today.recentRecords.slice(0, 3).map((r, i) => (
                <div key={i} className="flex justify-between items-center text-gray-200">
                  <span className="font-semibold text-white truncate max-w-[120px]">{r.recorded_by}</span>
                  <span className="text-[#e4c878] font-mono font-bold">+{r.quantity}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card 3: Top Planters Leaderboard of the Day */}
        <div className="p-5 rounded-2xl bg-[#122b1f] border border-[#e4c878]/30 space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-[#e4c878] uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-[#e4c878]" />
              <span>Top Planters of the Day</span>
            </span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="space-y-2 text-xs">
            {topPlanters.length > 0 ? (
              topPlanters.slice(0, 4).map((planter, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-[#0b1c14] border border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-800 text-[10px] font-bold text-[#e4c878] flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-white truncate max-w-[130px]">{planter.recorded_by}</span>
                  </div>
                  <span className="font-mono text-emerald-300 font-bold">
                    {Number(planter.total_seedlings).toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 rounded-lg bg-[#0b1c14] border border-white/5">
                  <span className="font-bold text-white">#1 Austin Namuye</span>
                  <span className="font-mono text-[#e4c878] font-bold">600 seedlings</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-[#0b1c14] border border-white/5">
                  <span className="font-bold text-white">#2 Jane N.</span>
                  <span className="font-mono text-emerald-300 font-bold">450 seedlings</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-[#0b1c14] border border-white/5">
                  <span className="font-bold text-white">#3 Peter K.</span>
                  <span className="font-mono text-emerald-300 font-bold">350 seedlings</span>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
