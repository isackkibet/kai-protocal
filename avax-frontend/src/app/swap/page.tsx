"use client";
import { ArrowDownUp, ChevronDown, Search, RefreshCw, Info } from "lucide-react";
import { useState } from "react";

const TOKENS = [
  { symbol: "SDA",  name: "Sidra Digital Asset",  color: "from-yellow to-gold" },
  { symbol: "KAI",  name: "KAI Cents",             color: "from-gold to-orange" },
  { symbol: "GAMI", name: "GAMI Social",           color: "from-orange to-orange-dark" },
  { symbol: "YBOB", name: "YBOB Stablecoin",       color: "from-green-light to-green-mid" },
];

export default function SwapPage() {
  const [fromToken, setFromToken] = useState(TOKENS[0]);
  const [toToken,   setToToken]   = useState(TOKENS[1]);
  const [amount, setAmount] = useState("");

  const rate = 1.24; // mock rate

  return (
    <main className="p-4 pt-10 pb-24 flex flex-col items-center min-h-[90vh] justify-center gap-6">

      {/* Title */}
      <div className="w-full">
        <h1 className="text-2xl font-black text-white">Swap Tokens</h1>
        <p className="text-xs text-white/50 mt-0.5">Avalanche Fuji Testnet</p>
      </div>

      {/* Swap Card */}
      <div className="w-full glass rounded-3xl p-5 border border-gold/20 shadow-gold relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

        {/* Rate bar */}
        <div className="flex items-center justify-between mb-4 relative">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Info size={12} className="text-gold/50" />
            <span>1 {fromToken.symbol} ≈ <strong className="text-gold">{rate} {toToken.symbol}</strong></span>
          </div>
          <button className="text-white/40 hover:text-gold transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>

        {/* YOU PAY */}
        <div className="bg-black/30 rounded-2xl p-4 border border-white/5 focus-within:border-gold/40 transition-colors mb-2">
          <div className="flex justify-between text-[10px] text-white/40 font-bold tracking-wider mb-2">
            <span>YOU PAY</span>
            <span>Balance: 586.00 {fromToken.symbol}</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="bg-transparent text-3xl font-black w-1/2 outline-none placeholder-white/20 text-white"
            />
            <button className={`ml-auto flex items-center gap-2 bg-gradient-to-r ${fromToken.color} px-3 py-2 rounded-xl shadow-md`}>
              <span className="text-black font-black text-sm">{fromToken.symbol}</span>
              <ChevronDown size={14} className="text-black" />
            </button>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center relative z-10 -my-3">
          <button
            onClick={() => { const tmp = fromToken; setFromToken(toToken); setToToken(tmp); }}
            className="w-10 h-10 rounded-full bg-gold-gradient flex items-center justify-center shadow-gold hover:scale-110 transition-transform">
            <ArrowDownUp size={16} className="text-black" strokeWidth={3} />
          </button>
        </div>

        {/* YOU RECEIVE */}
        <div className="bg-black/30 rounded-2xl p-4 border border-white/5 mb-5 mt-2">
          <div className="text-[10px] text-white/40 font-bold tracking-wider mb-2">YOU RECEIVE</div>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black text-white/30">
              {amount ? (parseFloat(amount) * rate).toFixed(4) : "0.00"}
            </span>
            <button className={`ml-auto flex items-center gap-2 bg-gradient-to-r ${toToken.color} px-3 py-2 rounded-xl shadow-md`}>
              <span className="text-black font-black text-sm">{toToken.symbol}</span>
              <ChevronDown size={14} className="text-black" />
            </button>
          </div>
        </div>

        {/* Submit */}
        <button className={`w-full font-bold rounded-xl py-4 text-sm transition-all
          ${amount && parseFloat(amount) > 0
            ? "bg-gold-gradient text-black shadow-gold hover:opacity-90 hover:-translate-y-0.5"
            : "bg-white/10 text-white/40 cursor-not-allowed"}`}>
          {amount && parseFloat(amount) > 0 ? `Swap ${fromToken.symbol} -> ${toToken.symbol}` : "Enter an amount"}
        </button>
      </div>

      {/* Token selector */}
      <div className="w-full glass rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Search size={14} className="text-white/40" />
          <input type="text" placeholder="Search tokens..." className="bg-transparent text-sm w-full outline-none text-white placeholder-white/30" />
        </div>
        <div className="flex flex-col gap-1">
          {TOKENS.map(t => (
            <button key={t.symbol}
              onClick={() => setToToken(t)}
              className={`flex items-center gap-3 p-3 rounded-xl transition-colors text-left
                ${toToken.symbol === t.symbol ? "bg-gold/10 border border-gold/30" : "hover:bg-white/5"}`}>
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center font-black text-black text-xs`}>
                {t.symbol[0]}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{t.symbol}</p>
                <p className="text-[10px] text-white/50">{t.name}</p>
              </div>
              {toToken.symbol === t.symbol && <span className="ml-auto text-gold text-xs"></span>}
            </button>
          ))}
        </div>
      </div>

    </main>
  );
}
