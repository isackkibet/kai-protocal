import React, { useState, useEffect } from "react";
import Image from "next/image";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { BookOpen, Radio, MapPin, Sparkles, Layers, Shield } from "lucide-react";

export default function IntroSection() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  return (
    <section 
      id="intro" 
      onMouseMove={handleMouseMove}
      className="py-20 md:py-32 bg-slate-950 relative overflow-hidden group/intro"
    >
      {/* ── Base Layer (Atmospheric Dark) ── */}
      <div 
        className="absolute inset-0 z-0 bg-slate-950 pointer-events-none"
      />

      {/* ── Background Image (Mobile-Friendly Visibility) ── */}
      <div 
        className="absolute inset-0 z-[1] opacity-25 md:opacity-20 pointer-events-none transition-all duration-700 blur-[2px]"
        style={{ 
          backgroundImage: 'url("/images/lake-victoria-sunrise-hd.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      
      {/* ── Interactive Spotlight Reveal ── */}
      <motion.div 
        className="absolute inset-0 z-[2] opacity-0 group-hover/intro:opacity-100 transition-opacity duration-700 pointer-events-none hidden md:block"
        style={{ 
          backgroundImage: 'url("/images/lake-victoria-sunrise-hd.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          WebkitMaskImage: useTransform(
            [mouseX, mouseY],
            ([x, y]) => `radial-gradient(circle 280px at ${x}px ${y}px, black 0%, transparent 100%)`
          ),
          maskImage: useTransform(
            [mouseX, mouseY],
            ([x, y]) => `radial-gradient(circle 280px at ${x}px ${y}px, black 0%, transparent 100%)`
          ),
        }}
      />

      {/* Dynamic Watermark */}
      <motion.div 
        className="absolute -right-20 -top-20 z-[3] opacity-[0.04] select-none pointer-events-none"
        animate={{ 
          rotate: 360,
          scale: [1, 1.05, 1],
        }}
        transition={{ 
          duration: 60, 
          repeat: Infinity, 
          ease: "linear" 
        }}
      >
        <Image src="/images/sihu-logo.png" alt="" width={600} height={600} />
      </motion.div>

      {/* Animated glow overlay */}
      <div className="absolute inset-0 z-[3] bg-gradient-to-tr from-sky-500/10 via-transparent to-blue-600/10 pointer-events-none" />
      
      {/* Floating Data Particles */}
      <div className="absolute inset-0 z-[3] overflow-hidden pointer-events-none">
        {isMounted && [...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 bg-sky-400/40 rounded-full blur-[1px]"
            initial={{ 
              x: Math.random() * 100 + "%", 
              y: Math.random() * 100 + "%",
              opacity: 0 
            }}
            animate={{ 
              y: [null, (Math.random() * 100 - 50) + "%"],
              x: [null, (Math.random() * 100 - 50) + "%"],
              opacity: [0, 0.6, 0],
              scale: [1, 1.5, 1],
            }}
            transition={{ 
              duration: 12 + Math.random() * 18, 
              repeat: Infinity, 
              ease: "linear" 
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="mb-12 md:mb-16 text-center max-w-2xl mx-auto">
          <RevealOnScroll>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 font-bold text-xs uppercase tracking-widest mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Origins & Establishment</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
              Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-200">Story</span>
            </h2>
            <p className="text-slate-300 text-sm md:text-base mt-3 font-medium">
              Bridging community voices with modern environmental intelligence across Lake Victoria.
            </p>
          </RevealOnScroll>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 md:gap-10 items-stretch">
          {/* Card 1: Initiative Overview */}
          <div className="lg:w-1/2 flex">
            <RevealOnScroll className="w-full flex">
              <div className="w-full bg-slate-900/80 backdrop-blur-2xl p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-white/15 relative overflow-hidden group hover:border-sky-500/40 transition-all duration-500 flex flex-col justify-between">
                <div className="absolute top-0 left-0 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl -ml-20 -mt-20 group-hover:bg-sky-500/20 transition-all duration-500" />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold text-xs tracking-wider uppercase">
                      <BookOpen className="w-3.5 h-3.5" />
                      Media Initiative
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 tracking-wider">EST. KENYA</span>
                  </div>

                  <h3 className="text-2xl md:text-3xl font-black mb-6 text-white leading-tight">
                    Sango Information Hub <span className="text-sky-400">(SIHU)</span>
                  </h3>

                  <div className="space-y-4 text-slate-200 text-base md:text-lg font-normal leading-relaxed">
                    <p>
                      <strong className="text-white font-semibold">Sango Information Hub (SIHU)</strong> is a registered community media initiative dedicated to knowledge management and information sharing on natural resources, environmental protection, and sustainable development around the Lake Victoria Basin in Kenya.
                    </p>
                    <p>
                      We empower communities through participatory radio production, grassroots digital reporting, and the restoration of traditional ecological knowledge.
                    </p>
                  </div>
                </div>

                {/* Highlights / Badges */}
                <div className="relative z-10 pt-8 mt-6 border-t border-white/10 grid grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 text-sky-400 font-bold text-sm mb-1">
                      <Radio className="w-4 h-4 text-sky-400" />
                      <span>Community Radio</span>
                    </div>
                    <p className="text-xs text-slate-300">Grassroots broadcast & dialogue</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 text-sky-400 font-bold text-sm mb-1">
                      <Layers className="w-4 h-4 text-sky-400" />
                      <span>Traditional Wisdom</span>
                    </div>
                    <p className="text-xs text-slate-300">Knowledge archiving & revival</p>
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          </div>

          {/* Card 2: Regional Impact & Scope */}
          <div className="lg:w-1/2 flex">
            <RevealOnScroll delay={150} className="w-full flex">
              <div className="w-full bg-slate-900/80 backdrop-blur-2xl p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-white/15 relative overflow-hidden group hover:border-sky-500/40 transition-all duration-500 flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-blue-600/20 transition-all duration-500" />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold text-xs tracking-wider uppercase">
                      <Shield className="w-3.5 h-3.5" />
                      Regional Footprint
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 tracking-wider">10 COUNTIES</span>
                  </div>

                  <h3 className="text-2xl md:text-3xl font-black mb-6 text-white leading-tight">
                    Lake Victoria Basin <span className="text-sky-400">Coverage</span>
                  </h3>

                  <div className="space-y-4 text-slate-200 text-base md:text-lg font-normal leading-relaxed">
                    <p>
                      The Lake Victoria Basin Region encompasses ten densely populated counties across Western and Nyanza Kenya, covering nearly <span className="text-sky-300 font-semibold">10% of Kenya&apos;s territory</span>.
                    </p>
                    <p>
                      Our active network of local community correspondents produces critical journalism, environmental alerts, and civic awareness directly from the field.
                    </p>
                  </div>
                </div>

                {/* Headquarters and Stat */}
                <div className="relative z-10 pt-8 mt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-400">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 font-medium block">Headquarters</span>
                      <span className="text-xs md:text-sm font-bold text-white tracking-wide">Fort Jesus Road, Busia Town</span>
                    </div>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-center">
                    <span className="text-xs font-mono text-sky-400 font-bold uppercase tracking-wider block">Western & Nyanza</span>
                    <span className="text-[10px] text-slate-400">10 County Network</span>
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </div>
    </section>
  );
}
