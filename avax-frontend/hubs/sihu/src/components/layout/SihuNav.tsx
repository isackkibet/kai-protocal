"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass,
  Newspaper,
  BookOpen,
  Calendar,
  Radio,
  FileText,
  Tag,
  Sparkles,
  User,
  Shield,
  Menu,
  X,
  Search,
  TreePine,
} from 'lucide-react';

const NAV_LINKS = [
  { href: '/portal', label: 'News', icon: Newspaper },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/guides', label: 'Guides', icon: BookOpen },
  { href: '/events', label: 'Events', icon: Calendar },
  { href: '/podcasts', label: 'Podcasts', icon: Radio },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: 'http://localhost:3002', label: 'Oloolua CFA', icon: TreePine, external: true, highlightGreen: true },
  { href: '/ask', label: 'Ask SIHU', icon: Sparkles, highlight: true },
];

export default function SihuNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl py-2.5'
          : 'bg-slate-950/60 backdrop-blur-md border-b border-slate-800/40 py-3.5'
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <Link href="/portal" className="flex items-center gap-3 shrink-0 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-sky-400 flex items-center justify-center shadow-[0_0_15px_rgba(88,179,242,0.35)] group-hover:scale-105 transition-transform">
            <span className="text-slate-950 font-black text-sm tracking-tight">SH</span>
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-black text-white text-base tracking-tight leading-none group-hover:text-primary-light transition-colors">
              SIHU Hub
            </span>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
              Sango Information
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden xl:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== '/portal' && pathname?.startsWith(link.href));

            if (link.highlight) {
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                    isActive
                      ? 'bg-gradient-to-r from-primary to-sky-400 text-slate-950'
                      : 'bg-primary/20 hover:bg-primary/30 text-primary-light border border-primary/40'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'text-white bg-slate-800/90 shadow-inner'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Action Icons: Search, Account, Admin */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/explore"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            title="Global Search & Discover"
          >
            <Search className="w-4 h-4" />
          </Link>

          <Link
            href="/account"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              pathname?.startsWith('/account')
                ? 'bg-slate-800 border-slate-700 text-white'
                : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Saved</span>
          </Link>

          <Link
            href="/admin"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-900/70 border border-transparent hover:border-slate-800 transition-all"
            title="Editorial & Admin Portal"
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Editorial</span>
          </Link>

          {/* Mobile hamburger toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="xl:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="xl:hidden border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-2xl px-6 py-5 animate-in slide-in-from-top-4 duration-200">
          <div className="grid grid-cols-2 gap-2 mb-4">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== '/portal' && pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-primary/20 text-primary-light border border-primary/30'
                      : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4 text-primary shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <Link
              href="/account"
              onClick={() => setMobileOpen(false)}
              className="text-slate-300 hover:text-white flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-primary" />
              <span>Personal Account & Saved</span>
            </Link>
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Editorial Desk</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
