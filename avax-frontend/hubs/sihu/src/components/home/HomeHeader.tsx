"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Newspaper, Compass, BookOpen, Calendar, Menu, X, ArrowRight } from "lucide-react";

export default function HomeHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled ? "py-3" : "py-4 md:py-6"
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className={`flex items-center justify-between transition-all duration-500 px-4 md:px-6 py-2.5 md:py-3 rounded-2xl md:rounded-full border shadow-2xl ${
          isScrolled 
            ? "bg-slate-950/90 backdrop-blur-2xl border-white/15 shadow-black/60 shadow-2xl" 
            : "bg-slate-950/75 backdrop-blur-xl border-white/20 shadow-black/40"
        }`}>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group relative z-10">
            <div className="p-1.5 rounded-xl bg-white/95 backdrop-blur-md transition-transform duration-300 group-hover:scale-105 shadow-md flex items-center justify-center">
              <Image 
                src="/images/logo-main.png" 
                alt="SIHU Hub" 
                width={110} 
                height={32} 
                className="h-7 md:h-8 w-auto object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-black text-white text-base md:text-lg tracking-tight group-hover:text-primary transition-colors flex items-center gap-1.5">
                SIHU Hub
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              </span>
              <span className="text-[9px] md:text-[10px] text-sky-400 font-bold uppercase tracking-widest leading-none">
                Lake Victoria Basin
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1.5 text-xs font-semibold tracking-wider text-slate-200">
            <Link 
              href="/explore" 
              className="px-3 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span>Explore</span>
            </Link>
            <Link 
              href="/guides" 
              className="px-3 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-400" />
              <span>Guides</span>
            </Link>
            <Link 
              href="/events" 
              className="px-3 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              <span>Events</span>
            </Link>
            <Link 
              href="/ask" 
              className="px-3.5 py-1.5 rounded-full bg-primary/20 text-sky-300 border border-primary/40 hover:bg-primary/30 hover:border-primary transition-all font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Ask SIHU</span>
            </Link>
            
            <div className="w-[1px] h-5 bg-white/20 mx-2" />
            
            <Link 
              href="/portal" 
              className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl md:rounded-full transition-all shadow-lg shadow-sky-500/25 flex items-center gap-2 group/btn"
            >
              <Newspaper className="w-3.5 h-3.5" />
              <span>News Portal</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
            </Link>
          </nav>

          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all relative z-10 border border-white/10" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-x-4 top-20 z-[60]"
          >
            <div className="bg-slate-950/95 backdrop-blur-2xl border border-white/20 p-6 rounded-3xl shadow-2xl shadow-black/80 space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm font-semibold text-white">
                <Link 
                  href="/explore" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
                >
                  <Compass className="w-4 h-4 text-sky-400" />
                  <span>Explore</span>
                </Link>
                <Link 
                  href="/guides" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
                >
                  <BookOpen className="w-4 h-4 text-sky-400" />
                  <span>Guides</span>
                </Link>
                <Link 
                  href="/events" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
                >
                  <Calendar className="w-4 h-4 text-sky-400" />
                  <span>Events</span>
                </Link>
                <Link 
                  href="/ask" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-3 rounded-xl bg-primary/20 border border-primary/30 text-sky-300 font-bold"
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>Ask SIHU</span>
                </Link>
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <Link 
                  href="/portal" 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-sky-500/25 text-center flex items-center justify-center gap-2 text-sm"
                >
                  <Newspaper className="w-4 h-4" />
                  <span>Access Global Info Portal</span>
                </Link>
                <div className="flex gap-2">
                  <a 
                    href="#intro" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white"
                  >
                    Our Story
                  </a>
                  <a 
                    href="#pillars" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white"
                  >
                    Key Pillars
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
