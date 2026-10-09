'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TreePine, Menu, X, Bot } from 'lucide-react';

const NAV_LINKS = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Mission', href: '/mission' },
  { name: 'Vision', href: '/vision' },
  { name: 'Activities', href: '/activities' },
  { name: 'Projects', href: '/projects' },
  { name: 'Seedlings', href: '/seedlings' },
  { name: 'Beekeeping', href: '/beekeeping' },
  { name: 'Gallery', href: '/photogallery' },
];

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile menu on navigation and on Escape.
  useEffect(() => setIsOpen(false), [pathname]);
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  return (
    <nav className="sticky top-0 z-40 bg-[#122b1f]/95 backdrop-blur-md border-b border-[#e4c878]/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center gap-4 h-16">

          {/* Logo */}
          {/* min-w-0 + truncate: on narrow phones the name shortens with an
              ellipsis instead of pushing the menu button off-screen. */}
          <Link href="/" className="flex items-center gap-2.5 group min-w-0">
            <div className="w-9 h-9 shrink-0 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <TreePine className="w-5 h-5 text-[#e4c878]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-white font-bold text-sm sm:text-base tracking-tight leading-none truncate group-hover:text-[#e4c878] transition-colors">
                Oloolua Youth Guardians
              </span>
              <span className="hidden sm:block text-[10px] text-emerald-300/80 font-medium tracking-wider uppercase mt-0.5 whitespace-nowrap">
                CFA Seedling User Group
              </span>
            </div>
          </Link>

          {/* Desktop links: only where they fit on one line */}
          <div className="hidden xl:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-emerald-600/30 text-[#e4c878] border border-[#e4c878]/30 font-semibold'
                      : 'text-gray-200 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Recording happens inside the Guardian Hub: signed in, right role, explicit confirmation (PRD B2, B5). */}
            <Link
              href="/portal"
              aria-label="AI Guardian"
              aria-current={pathname === '/portal' ? 'page' : undefined}
              className="flex items-center gap-1.5 px-2.5 md:px-3 py-2 md:py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm border border-emerald-400/30 whitespace-nowrap"
            >
              <Bot className="w-4 h-4 text-[#e4c878]" />
              <span className="hidden md:inline">AI Guardian</span>
            </Link>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="xl:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10"
              aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isOpen}
              aria-controls="mobile-nav"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile / tablet menu */}
      {isOpen && (
        <div id="mobile-nav" className="xl:hidden bg-[#0b1c14] border-b border-[#e4c878]/20 px-4 pt-2 pb-4 space-y-1">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? 'page' : undefined}
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
          <div className="pt-3 border-t border-white/10 flex flex-col gap-2 md:hidden">
            <Link
              href="/portal"
              onClick={() => setIsOpen(false)}
              className="w-full text-center px-4 py-2 rounded-md font-bold text-sm bg-emerald-600 text-white flex items-center justify-center gap-2"
            >
              <Bot className="w-4 h-4 text-[#e4c878]" />
              <span>AI Guardian &amp; Guardian Hub</span>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
