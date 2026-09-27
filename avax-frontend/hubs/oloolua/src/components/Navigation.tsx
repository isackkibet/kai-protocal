'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TreePine, Menu, X, Shield, PlusCircle } from 'lucide-react';

export default function Navigation({ onOpenRecordActivity }: { onOpenRecordActivity?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Mission', href: '/mission' },
    { name: 'Vision', href: '/vision' },
    { name: 'Activities', href: '/activities' },
    { name: 'Projects', href: '/projects' },
    { name: 'Seedlings & Nursery', href: '/seedlings' },
    { name: 'Beekeeping', href: '/beekeeping' },
    { name: 'Gallery', href: '/photogallery' },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-[#122b1f]/95 backdrop-blur-md border-b border-[#e4c878]/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <TreePine className="w-5 h-5 text-[#e4c878]" />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-base tracking-tight leading-none group-hover:text-[#e4c878] transition-colors">
                Oloolua Youth Guardians
              </span>
              <span className="text-[10px] text-emerald-300/80 font-medium tracking-wider uppercase mt-0.5">
                CFA Seedling User Group
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-600/30 text-[#e4c878] border border-[#e4c878]/30 font-semibold'
                      : 'text-gray-200 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-2.5">
            {onOpenRecordActivity && (
              <button
                onClick={onOpenRecordActivity}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#e4c878] text-neutral-950 hover:bg-amber-300 transition-colors shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Record Activity</span>
              </button>
            )}

            <Link
              href="/portal"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm border border-emerald-400/30"
            >
              <Shield className="w-4 h-4 text-[#e4c878]" />
              <span>Guardian Hub</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
            {onOpenRecordActivity && (
              <button
                onClick={onOpenRecordActivity}
                className="px-2.5 py-1 rounded text-xs font-bold bg-[#e4c878] text-neutral-950"
              >
                + Record
              </button>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10"
              aria-label="Toggle Navigation"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="lg:hidden bg-[#0b1c14] border-b border-[#e4c878]/20 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium ${
                  isActive
                    ? 'bg-emerald-600/30 text-[#e4c878] border border-[#e4c878]/30 font-semibold'
                    : 'text-gray-200 hover:bg-white/5'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            <Link
              href="/portal"
              onClick={() => setIsOpen(false)}
              className="w-full text-center px-4 py-2 rounded-md font-bold text-sm bg-emerald-600 text-white flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4 text-[#e4c878]" />
              <span>Guardian Portal & Kai Hub</span>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
