'use client';

import React from 'react';
import Link from 'next/link';

export default function KaiTopBar() {
  return (
    <div className="bg-[#0B1C14] text-[#F6F2E7] text-xs px-4 py-2 border-b border-[#C89B3C]/30 flex flex-wrap justify-between items-center gap-2 font-sans z-50 relative">
      <div className="flex items-center gap-2">
        <span className="text-[#E4C878] font-bold uppercase tracking-wider text-[11px]">
          KAI Nuvari Ecosystem
        </span>
        <span className="opacity-40">·</span>
        <span className="text-emerald-200/90 hidden sm:inline">
          Pilot Community Forest Association (CFA) Partner
        </span>
      </div>
      <div className="flex items-center gap-3 text-[11px]">
        <Link href="/portal" className="text-[#E4C878] font-semibold hover:underline flex items-center gap-1">
          <span>Conservation Ledger</span>
          <span className="text-[10px]">→</span>
        </Link>
        <span className="opacity-30">|</span>
        <Link href="/portal?tab=dashboard" className="text-emerald-300 hover:text-white transition-colors">
          KAI Dashboard
        </Link>
        <span className="opacity-30">|</span>
        <Link 
          href="/portal" 
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-0.5 rounded text-[11px] transition-colors shadow-sm"
        >
          Guardian Portal
        </Link>
      </div>
    </div>
  );
}
