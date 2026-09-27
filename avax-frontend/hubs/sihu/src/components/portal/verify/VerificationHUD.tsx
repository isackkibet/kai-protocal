"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface VerificationHUDProps {
  level: number;
  xp: number;
  xpNeeded: number;
  combo: number;
  streak: number;
  creditsToday: number;
  verifiedToday: number;
}

export default function VerificationHUD({
  level,
  xp,
  xpNeeded,
  combo,
  streak,
  creditsToday,
  verifiedToday
}: VerificationHUDProps) {
  const progressPercent = Math.min(100, Math.max(0, (xp / xpNeeded) * 100));

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
      {/* Decorative background glow */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 blur-3xl rounded-full" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-accent/10 blur-3xl rounded-full" />

      {/* Level & XP */}
      <div className="md:col-span-2 flex flex-col justify-center bg-slate-800/40 p-4 rounded-2xl border border-white/5 relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Rank</span>
            <span className="px-2 py-0.5 rounded-md bg-primary/20 text-primary font-black text-[10px]">VERIFIED ASSET AGENT</span>
          </div>
          <div className="text-xl font-black text-white">LVL {level}</div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
            <span className="text-slate-500">Node Experience</span>
            <span className="text-primary">{Math.round(xp)} <span className="text-slate-600">/ {xpNeeded}</span></span>
          </div>
          <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5 p-[1px]">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full shadow-[0_0_10px_rgba(88,179,242,0.5)]"
            />
          </div>
        </div>
      </div>

      {/* Streak */}
      <div className="flex flex-col items-center justify-center bg-slate-800/40 p-4 rounded-2xl border border-white/5 group hover:border-amber-500/30 transition-colors">
        <motion.div 
          animate={streak > 0 ? { scale: [1, 1.2, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
          className={`text-3xl mb-1 ${streak > 0 ? 'drop-shadow-[0_0_15px_rgba(245,158,11,0.6)]' : 'opacity-30 grayscale'}`}
        >
          🔥
        </motion.div>
        <div className="text-2xl font-black text-white leading-none">{streak}</div>
        <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest mt-1">Activity Streak</div>
      </div>

      {/* Combo / Multiplier */}
      <div className="flex flex-col items-center justify-center bg-slate-800/40 p-4 rounded-2xl border border-white/5 group hover:border-primary/30 transition-colors relative overflow-hidden">
        {combo > 1 && (
          <div className="absolute inset-0 bg-primary/5 animate-pulse" />
        )}
        <div className={`font-black uppercase tracking-tighter mb-1 transition-all ${combo > 1 ? 'text-primary text-2xl drop-shadow-[0_0_8px_rgba(88,179,242,0.8)]' : 'text-slate-500 text-lg'}`}>
          {combo}.0×
        </div>
        <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest leading-none">Yield Multiplier</div>
      </div>

      {/* Today's Stats */}
      <div className="col-span-2 md:col-span-1 flex flex-col justify-between bg-slate-950/50 p-4 rounded-2xl border border-emerald-500/20 shadow-inner">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Session Yield</div>
            <div className="text-xl font-black text-emerald-400">+{creditsToday.toFixed(1)}</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
           <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Verified Tasks</div>
           <div className="text-xs font-black text-white">{verifiedToday}</div>
        </div>
      </div>
    </div>
  );
}
