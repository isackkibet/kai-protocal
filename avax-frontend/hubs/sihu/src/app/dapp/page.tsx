"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSihuStore } from "@/store/useSihuStore";
import WalletConnectModal from "@/components/dapp/WalletConnectModal";
import { Copy, Share2, ExternalLink, Zap, TrendingUp, Shield, ChevronRight, Circle, Cpu, Coins, Droplets, ArrowRightLeft } from "lucide-react";
import "./dapp.css";

const TICKER = [
  { s: "HBAR",   p: "$0.0891", c: "+3.2%"  },
  { s: "USDT",   p: "$1.0000", c: "0.0%"   },
  { s: "SIHU",   p: "$0.1020", c: "+12.4%" },
  { s: "SANGO",  p: "$0.0501", c: "+5.1%"  },
];

const quickActions = [
  { name: "Mine",       href: "/dapp/mine",       emoji: "⛏️",  color: "#3B82F6" },
  { name: "Pools",      href: "/dapp/pools",      emoji: "💧",  color: "#06B6D4" },
  { name: "Swap",       href: "/dapp/swap",       emoji: "🔄",  color: "#22C55E" },
  { name: "Vaults",     href: "/dapp/vaults",     emoji: "🏦",  color: "#A78BFA" },
];

export default function SihuDApp() {
  const { connected, accountId, walletType, balances,
          autoMineActive, toggleAutoMine, incrementSihu } = useSihuStore();
  const [showModal, setShowModal] = useState(false);
  const [tickerOffset, setTickerOffset] = useState(0);

  // Auto-mine engine Simulation
  useEffect(() => {
    if (!autoMineActive) return;
    const id = setInterval(() => incrementSihu(0.003), 1000);
    return () => clearInterval(id);
  }, [autoMineActive, incrementSihu]);

  // Ticker animation
  useEffect(() => {
    const id = setInterval(() => setTickerOffset(o => (o - 0.8) % 600), 30);
    return () => clearInterval(id);
  }, []);

  return (
    <main className="min-h-screen flex flex-col bg-[#0F172A] text-white">

      {/* ── TICKER STRIP ── */}
      <div className="bg-blue-950/20 border-b border-blue-500/10 py-2 overflow-hidden flex-shrink-0">
        <div 
          className="inline-flex gap-8 px-4 whitespace-nowrap transition-transform ease-linear"
          style={{ transform: `translateX(${tickerOffset}px)` }}
        >
          {[...TICKER,...TICKER,...TICKER,...TICKER].map((t,i) => (
            <span key={i} className="text-[10px] font-bold tracking-wider">
              <span className="text-blue-400/60 uppercase">{t.s} </span>
              <span className="text-white ml-1">{t.p} </span>
              <span className="text-emerald-400 ml-1">{t.c}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="float px-4 py-2 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.2)] bg-slate-900 border border-white/10">
            <Image src="/images/logo-main.png" alt="SIHU Logo" width={120} height={36} className="h-8 w-auto object-contain" priority />
          </div>
          <div>
            <h1 className="shimmer-text text-2xl font-black tracking-tighter leading-none">SIHU HUB</h1>
            <p className="text-[9px] text-blue-400/40 mt-1 uppercase tracking-[0.2em] font-bold">
              Decentralized Environment Protocol
            </p>
          </div>
        </div>

        <button onClick={() => setShowModal(true)}
          className={`px-5 py-2.5 rounded-2xl font-bold text-xs transition-all active:scale-95 shadow-lg flex items-center gap-2 ${
            connected 
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-emerald-500/10" 
              : "btn-blue p-0"
          }`}>
          {connected ? (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {accountId.substring(0,8)}...
            </>
          ) : (
            <span className="px-5 py-2.5">CONNECT</span>
          )}
        </button>
      </div>

      {/* ── NETWORK BADGE ── */}
      <div className="mx-4 my-3 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-center gap-4">
        <div className="bg-blue-500/10 p-2.5 rounded-xl">
          <Zap size={22} className="text-blue-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-black text-blue-300 uppercase tracking-wider mb-0.5">
            SIHU Network Phase 1 Active
          </p>
          <p className="text-[10px] text-white/30 font-medium">
            Agentic Wallet • HBAR Micropayments • Lake Victoria Basin AI
          </p>
        </div>
        <div className="flex gap-1">
          {[...Array(3)].map((_, i) => (
            <Circle key={i} size={6} fill="#3B82F6" stroke="none" className="animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>

      {/* ── PROFILE & BALANCES ── */}
      <div className="glass mx-4 mb-4 p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl border-2 border-blue-500/20 p-1">
              <div className="w-full h-full rounded-xl bg-blue-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-blue-400/40 font-bold uppercase tracking-widest mb-0.5">Hedera Wallet</p>
              <h2 className="text-lg font-black tracking-tight font-mono text-blue-300">0.0.15633</h2>
              <p className="text-[10px] text-white/30 font-mono">SIHU Network • Premium Node</p>
            </div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-full flex items-center gap-2">
            <span className="text-[10px] font-black text-blue-400">Lvl 12</span>
            <div className="w-8 h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="w-2/3 h-full bg-blue-500" />
            </div>
          </div>
        </div>

        {/* Balance Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { l:"HBAR", v: balances.hbar.toFixed(2), c:"text-sky-400" },
            { l:"SIHU", v: balances.sihu.toFixed(1), c:"text-blue-400" },
            { l:"USDT", v: balances.usdt.toFixed(0), c:"text-cyan-400" },
          ].map(b => (
            <div key={b.l} className="bg-white/[0.03] border border-white/[0.05] p-3 rounded-2xl text-center group hover:bg-white/[0.06] transition-colors">
              <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1.5">{b.l}</p>
              <p className={`text-base font-black ${b.c} tracking-tighter`}>{b.v}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button className="flex-1 bg-white/[0.05] border border-white/[0.1] py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors">
            Portfolio
          </button>
          <button className="flex-1 bg-white/[0.05] border border-white/[0.1] py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors">
            Scan
          </button>
          <div className="bg-blue-500/10 border border-blue-500/20 px-4 flex items-center rounded-xl">
             <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse mr-2" />
             <span className="text-[10px] font-black text-blue-400 uppercase">Live</span>
          </div>
        </div>
      </div>

      {/* ── MINING AGENT ── */}
      <div className={`mx-4 mb-4 p-5 rounded-[2rem] transition-all duration-500 ${
        autoMineActive 
          ? "bg-gradient-to-br from-blue-600/20 to-cyan-600/10 border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.1)]" 
          : "glass border border-white/10"
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${autoMineActive ? "bg-blue-500 shadow-lg shadow-blue-500/40" : "bg-white/5"}`}>
              <Cpu size={24} className={autoMineActive ? "text-white" : "text-white/20"} />
            </div>
            <div>
              <h3 className={`font-black text-base uppercase tracking-tight ${autoMineActive ? "text-blue-400" : "text-white/60"}`}>
                SIHU DROP AGENT
              </h3>
              <p className="text-[11px] text-white/30 font-medium">
                {autoMineActive ? "Processing ecosystem datasets..." : "Enable auto-rewards agent"}
              </p>
            </div>
          </div>
          
          <button 
            onClick={connected ? toggleAutoMine : () => setShowModal(true)}
            className={`w-14 h-8 rounded-full relative transition-all duration-300 p-1 ${
              autoMineActive ? "bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "bg-white/10 border border-white/10"
            }`}
          >
            <div className={`w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${
              autoMineActive ? "translate-x-6" : "translate-x-0"
            }`} />
          </button>
        </div>

        {autoMineActive && (
          <div className="mt-4 pt-4 border-t border-blue-500/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
              <span className="text-[10px] font-black text-blue-400 uppercase">Stewardship Mined:</span>
            </div>
            <span className="text-[11px] font-mono text-blue-200">
              +{(balances.sihu % 1).toFixed(3)} SIHU
            </span>
          </div>
        )}
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className="px-4 mb-4">
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map(action => (
            <Link key={action.name} href={action.href} className="group">
              <div className="glass p-5 flex flex-col items-center gap-3 transition-all group-hover:bg-blue-500/10 group-hover:border-blue-500/30">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner bg-white/[0.02] border border-white/5 group-hover:scale-110 transition-transform"
                     style={{ color: action.color }}>
                   {action.emoji}
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-white/60 group-hover:text-blue-400">{action.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── CORPORATE DASHBOARDS ── */}
      <div className="px-4 mb-4 flex flex-col gap-3">
         <div className="glass p-5 flex items-center gap-5 hover:bg-emerald-500/5 transition-all border-emerald-500/10 hover:border-emerald-500/30">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-2xl border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
              🌿
            </div>
            <div className="flex-1">
              <h3 className="font-black text-base text-emerald-400 uppercase tracking-tight">CFA Portal</h3>
              <p className="text-[10px] text-white/30 uppercase tracking-widest leading-none mt-1">Conservation Governance</p>
            </div>
            <ChevronRight className="text-white/20" size={20} />
         </div>

         <div className="glass p-5 flex items-center gap-5 hover:bg-blue-500/5 transition-all border-blue-500/10 hover:border-blue-500/30">
            <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center text-2xl border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
              🏪
            </div>
            <div className="flex-1">
              <h3 className="font-black text-base text-blue-400 uppercase tracking-tight">Enterprise SME</h3>
              <p className="text-[10px] text-white/30 uppercase tracking-widest leading-none mt-1">Liquidity & Growth</p>
            </div>
            <ChevronRight className="text-white/20" size={20} />
         </div>
      </div>

      {/* ── STATS ── */}
      <div className="px-4 mb-8">
        <div className="flex items-center gap-2 mb-4 px-1">
          <TrendingUp size={14} className="text-blue-400" />
          <span className="text-[11px] font-black text-blue-400 uppercase tracking-[0.2em]">Network Intelligence</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { l:"TVL Hub", v:"$2.4M", c:"text-blue-400" },
            { l:"Members", v:"12.4K", c:"text-emerald-400" },
            { l:"Node APY", v:"27.5%", c:"text-sky-400" },
          ].map(s => (
            <div key={s.l} className="bg-white/[0.02] border border-white/[0.05] p-3 rounded-2xl text-center">
              <p className={`text-base font-black tracking-tighter ${s.c}`}>{s.v}</p>
              <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-1 leading-none">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FOOTER NAV ── */}
      <div className="mt-auto bg-[#0F172A] border-t border-white/5 p-4 pb-8 flex justify-around">
        <Link href="/" className="flex flex-col items-center gap-1.5">
          <Droplets size={22} className="text-white/20" />
          <span className="text-[8px] font-black text-white/20 uppercase">Core</span>
        </Link>
        <Link href="/portal" className="flex flex-col items-center gap-1.5 text-blue-500">
           <Zap size={22} fill="currentColor" />
           <span className="text-[8px] font-black uppercase">News</span>
        </Link>
        <div className="flex flex-col items-center gap-1.5 opacity-40">
           <ArrowRightLeft size={22} />
           <span className="text-[8px] font-black uppercase">DApp</span>
        </div>
      </div>

      {showModal && <WalletConnectModal onClose={() => setShowModal(false)} />}
    </main>
  );
}