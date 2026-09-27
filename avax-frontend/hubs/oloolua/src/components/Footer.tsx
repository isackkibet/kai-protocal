'use client';

import React from 'react';
import Link from 'next/link';
import { TreePine, MapPin, Mail, Phone, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#07130d] border-t border-[#e4c878]/20 text-gray-300 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          {/* Col 1: About */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TreePine className="w-6 h-6 text-[#e4c878]" />
              <span className="font-bold text-white text-lg tracking-tight">Oloolua Youth Guardians</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Oloolua Forest Community Forest Association (CFA) Seedling User Group. Dedicated to indigenous tree seedling production, Oloolua forest restoration, and sustainable youth livelihoods.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-950 border border-emerald-800 text-[11px] text-emerald-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Verified Kai Conservation Hub Partner
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-[#e4c878] font-bold text-sm uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/" className="hover:text-white transition-colors">Home Page</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">About Guardians CFA</Link></li>
              <li><Link href="/seedlings" className="hover:text-white transition-colors">Tree Nursery & Seedbeds</Link></li>
              <li><Link href="/activities" className="hover:text-white transition-colors">Conservation Activities</Link></li>
              <li><Link href="/projects" className="hover:text-white transition-colors">Art in Nature & Rock Mural</Link></li>
              <li><Link href="/beekeeping" className="hover:text-white transition-colors">Apiculture & Livelihoods</Link></li>
            </ul>
          </div>

          {/* Col 3: Conservation & PRD Ledgers */}
          <div>
            <h4 className="text-[#e4c878] font-bold text-sm uppercase tracking-wider mb-4">Kai Ledger & Portal</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/portal?tab=dashboard" className="hover:text-white transition-colors">Nursery Live Dashboard</Link></li>
              <li><Link href="/portal?tab=ledger" className="hover:text-white transition-colors">Inventory Transaction Ledger</Link></li>
              <li><Link href="/portal?tab=planting" className="hover:text-white transition-colors">Planting & Survival Records</Link></li>
              <li><Link href="/portal?tab=verification" className="hover:text-white transition-colors">Verification Queue</Link></li>
              <li><Link href="/portal?tab=reports" className="hover:text-white transition-colors">Impact & Production Reports</Link></li>
            </ul>
          </div>

          {/* Col 4: Contact & Location */}
          <div className="space-y-3">
            <h4 className="text-[#e4c878] font-bold text-sm uppercase tracking-wider mb-4">Contact CFA</h4>
            <div className="flex items-start gap-2 text-xs text-gray-300">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Oloolua Forest Station, Kajiado North, Kenya</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>info@olooluayouthguardians.org</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>+254 712 345 678</span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-800 flex flex-wrap justify-between items-center text-xs text-gray-500 gap-4">
          <div>
            © {new Date().getFullYear()} Oloolua Forest Youth Guardians CFA. Powered by <span className="text-[#e4c878]">Kai Conservation Information Hub</span>.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/portal" className="hover:text-gray-300 transition-colors">Member Portal</Link>
            <span>·</span>
            <Link href="/login" className="hover:text-gray-300 transition-colors">Verifier Login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
