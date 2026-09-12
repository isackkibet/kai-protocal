'use client';

import React from 'react';
import { Bell, Menu } from "lucide-react";
import { useX402ApprovalStore } from "@/store/useX402ApprovalStore";

export default function TopHeader() {
  const { setOpen, pendingCount } = useX402ApprovalStore();

  return (
    <header className="sticky top-0 z-40 bg-[#121212]/80 backdrop-blur-md w-full px-4 py-4 flex items-center justify-between border-b border-white/5">
      <div className="flex items-center gap-3">
        <div className="relative w-8 h-8 rounded-full overflow-hidden border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.4)] flex items-center justify-center bg-black/60">
          <img src="/kai-logo.png" alt="KAI Nuvari" className="w-full h-full object-cover" />
        </div>
        <h1 className="font-bold text-lg tracking-wide text-white">KAI Nuvari</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <button
          onClick={() => setOpen(true)}
          className="relative text-white/70 hover:text-white transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-white/5"
          title="x402 Transaction Approvals"
        >
          <Bell size={20} />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red text-[9px] font-black text-white animate-pulse">
              {pendingCount}
            </span>
          )}
        </button>
        <button className="text-white/70 hover:text-white transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-white/5">
          <Menu size={20} />
        </button>
      </div>
    </header>
  );
}
