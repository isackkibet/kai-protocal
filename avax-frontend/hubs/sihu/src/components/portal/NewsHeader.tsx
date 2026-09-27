"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Newspaper,
  Compass,
  BookOpen,
  Calendar,
  Headphones,
  Sparkles,
  PenTool,
  ShieldCheck,
  LogIn,
  Menu,
  X,
  ArrowRight,
  Radio
} from "lucide-react";

export default function NewsHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const NAV_LINKS = [
    { name: "News", href: "/portal", Icon: Newspaper },
    { name: "Explore", href: "/explore", Icon: Compass },
    { name: "Guides", href: "/guides", Icon: BookOpen },
    { name: "Events", href: "/events", Icon: Calendar },
    { name: "Podcasts", href: "/podcasts", Icon: Headphones },
    { name: "Ask SIHU", href: "/ask", special: true, Icon: Sparkles },
    { name: "Write", href: "/portal/submit", Icon: PenTool },
    { name: "Review Queue", href: "/admin/review", Icon: ShieldCheck },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 pt-3.5 pointer-events-none">
      <div className="container mx-auto max-w-7xl pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-2xl border border-slate-200/80 rounded-2xl md:rounded-full shadow-lg shadow-sky-950/5 py-2.5 px-4 md:px-6">
          <div className="flex items-center justify-between">
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative overflow-hidden rounded-xl bg-slate-50 border border-slate-200 p-1 transition-all group-hover:scale-105 duration-300">
                <Image 
                  src="/images/logo-main.png" 
                  alt="SIHU Hub" 
                  width={110} 
                  height={32} 
                  className="h-7 md:h-8 w-auto object-contain"
                  priority
                />
              </div>
              <div className="hidden sm:block">
                <span className="block font-black text-xs leading-tight uppercase tracking-wider text-slate-900 group-hover:text-sky-600 transition-colors flex items-center gap-1.5">
                  Intelligence Portal
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </span>
                <span className="block text-[8px] text-sky-600 font-bold uppercase tracking-widest mt-0.5">
                  Lake Victoria Basin Network
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1 font-bold text-xs tracking-wider">
              {NAV_LINKS.map((link) => {
                const IconComponent = link.Icon;
                return (
                  <Link 
                    key={link.name} 
                    href={link.href} 
                    className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 text-xs font-semibold ${
                      link.special 
                        ? 'bg-sky-500 text-white hover:bg-sky-600 shadow-md shadow-sky-500/20' 
                        : 'text-slate-600 hover:text-sky-600 hover:bg-sky-50/80'
                    }`}
                  >
                    <IconComponent className={`w-3.5 h-3.5 ${link.special ? 'text-white' : 'text-sky-500'}`} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5">
              <Link 
                href="/login" 
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-full hover:bg-sky-600 transition-all font-bold text-xs tracking-wide shadow-md group/login"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In</span>
              </Link>
              
              <button 
                className="lg:hidden p-2 text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-all"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden mt-2 bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-3xl p-5 shadow-2xl overflow-hidden relative space-y-4"
            >
              <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-800">
                {NAV_LINKS.map((link) => {
                  const Icon = link.Icon;
                  return (
                    <Link 
                      key={link.name} 
                      href={link.href} 
                      onClick={() => setMobileMenuOpen(false)}
                      className={`p-3 rounded-xl flex items-center gap-2 border transition-all ${
                        link.special 
                          ? 'bg-sky-500 text-white border-sky-600 font-bold' 
                          : 'bg-slate-50 text-slate-700 border-slate-100 hover:bg-sky-50 hover:text-sky-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{link.name}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <Link 
                  href="/login" 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="w-full py-3 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl text-center flex items-center justify-center gap-2 hover:bg-sky-600 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Member Log In</span>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
