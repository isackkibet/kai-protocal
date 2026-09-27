"use client";

import React from "react";
import ChessGame from "../../../components/portal/play/ChessGame";

export default function ChessPage() {
  return (
    <div className="flex flex-col gap-8 animate-fade-in-up">
      {/* Header for Chess Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-8">
        <div className="max-w-xl">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl font-black text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.4)]">♟️</span>
            <h2 className="text-xl font-black text-white uppercase tracking-tighter">Strategic Staking Hub</h2>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed font-medium">
            Test your strategic prowess against the SIHU AI. Winners are rewarded with **SIHU Credits** immediately upon verification of victory.
          </p>
        </div>
        
        <div className="bg-slate-800/80 border border-white/10 rounded-2xl p-4 flex items-center gap-6 shadow-2xl backdrop-blur-sm self-start md:self-auto">
          <div className="text-center">
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Rank</div>
            <div className="text-lg font-black text-white leading-none">#1,242</div>
          </div>
          <div className="h-8 w-[1px] bg-white/10" />
          <div className="text-center">
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Elo</div>
            <div className="text-lg font-black text-white leading-none">1480</div>
          </div>
          <div className="h-8 w-[1px] bg-white/10" />
          <div className="text-center">
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">W/L</div>
            <div className="text-lg font-black text-emerald-400 leading-none">12-4</div>
          </div>
        </div>
      </div>

      <ChessGame />
      
      {/* Footer Info */}
      <div className="mt-8 p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-start gap-3">
        <div className="text-primary text-xl">💡</div>
        <div className="text-xs text-slate-300 leading-relaxed">
          <strong>Tip:</strong> SIHU Chess uses a difficulty curve based on your current Verifier Level. Higher-level agents play against more advanced AI models for higher staking multipliers.
        </div>
      </div>
    </div>
  );
}
