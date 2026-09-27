'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { ShieldCheck, UserCheck, Lock, ArrowRight } from 'lucide-react';
import { UserRole } from '@/types/kai';

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('nursery_member');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const roles: { role: UserRole; title: string; desc: string }[] = [
    { role: 'cfa_admin', title: 'CFA Administrator', desc: 'Full CFA org management, member invitations & visibility settings.' },
    { role: 'nursery_manager', title: 'Nursery Manager', desc: 'Seedbed maintenance, species cataloguing, stock movements & reports.' },
    { role: 'nursery_member', title: 'Guardian Member', desc: 'Field contributor: record propagation, potting, planting & evidence photos.' },
    { role: 'verifier', title: 'Verifier / Auditor', desc: 'Independent reviewer: approve, reject, or request activity corrections.' },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to Portal with role selected
    window.location.href = `/portal?role=${selectedRole}`;
  };

  return (
    <div className="min-h-screen bg-[#0b1c14] text-[#f6f2e7] flex flex-col">
      <Navigation />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="bg-[#122b1f] border border-[#e4c878]/30 rounded-3xl max-w-xl w-full p-8 shadow-2xl space-y-6">
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-[#e4c878] mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-white">Guardian Portal Access</h1>
            <p className="text-xs text-emerald-300">
              Select your role to access the Kai Conservation Information Hub
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5 text-xs">
            {/* Role Selector */}
            <div className="space-y-2">
              <label className="block font-bold text-gray-300 uppercase tracking-wider text-[10px]">
                1. Select Account Role (PRD Section 20)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {roles.map((r) => (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => setSelectedRole(r.role)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedRole === r.role
                        ? 'bg-emerald-600/30 border-[#e4c878] text-white shadow-md'
                        : 'bg-[#0b1c14] border-white/10 text-gray-400 hover:border-emerald-500/40'
                    }`}
                  >
                    <div className="font-bold text-white text-xs mb-0.5">{r.title}</div>
                    <div className="text-[10px] text-gray-300 leading-tight">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Email & Password */}
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-gray-300 mb-1">Email / Member ID</label>
                <input
                  type="email"
                  required
                  placeholder="guardian@olooluayouthguardians.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0b1c14] border border-[#e4c878]/30 rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-[#e4c878]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0b1c14] border border-[#e4c878]/30 rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-[#e4c878]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#e4c878] hover:bg-amber-300 text-neutral-950 font-bold text-xs transition-colors shadow-lg flex items-center justify-center gap-2"
            >
              <span>Access Guardian Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
