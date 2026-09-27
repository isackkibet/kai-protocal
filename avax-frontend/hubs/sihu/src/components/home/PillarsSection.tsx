import React, { useState } from "react";
import Image from "next/image";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { 
  Radio, 
  Waves, 
  Scale, 
  ShieldCheck, 
  Sparkles,
  ArrowUpRight,
  LucideIcon 
} from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface PillarCardProps {
  pillar: typeof PILLARS[0];
  Icon: LucideIcon;
  idx: number;
}

function PillarCard({ pillar, Icon, idx }: PillarCardProps) {
  const [isTouch, setIsTouch] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-100, 100], [10, -10]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-100, 100], [-10, 10]), { stiffness: 300, damping: 30 });

  React.useEffect(() => {
    setIsTouch(!window.matchMedia("(hover: hover)").matches);
  }, []);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (isTouch) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div 
      className="relative p-7 md:p-9 rounded-[2.5rem] border border-white/10 hover:border-sky-500/40 transition-all duration-500 group h-full backdrop-blur-2xl bg-slate-900/80 hover:bg-slate-900/95 overflow-hidden cursor-pointer flex flex-col justify-between shadow-2xl"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ 
        rotateX: isTouch ? 0 : rotateX, 
        rotateY: isTouch ? 0 : rotateY, 
        perspective: 1000 
      }}
    >
      {/* Top subtle highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/30 to-transparent" />
      
      {/* Ambient background glow */}
      <div className={`absolute -right-16 -top-16 w-40 h-40 bg-gradient-to-br ${pillar.gradient} blur-3xl opacity-10 group-hover:opacity-30 transition-opacity duration-700 pointer-events-none`} />

      <div>
        {/* Card Header: Custom Icon Badge & Number */}
        <div className="flex items-center justify-between mb-7">
          {/* Custom Duotone Holographic Icon Container */}
          <div className="relative">
            {/* Glow halo */}
            <div className={`absolute -inset-2 bg-gradient-to-br ${pillar.gradient} rounded-2xl blur-lg opacity-30 group-hover:opacity-75 transition-opacity duration-500`} />
            
            <div className={`relative w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-slate-950 border border-white/20 flex items-center justify-center overflow-hidden shadow-xl group-hover:border-sky-400/50 transition-colors`}>
              {/* Inner gradient sweep */}
              <div className={`absolute inset-0 bg-gradient-to-br ${pillar.gradient} opacity-20 group-hover:opacity-30 transition-opacity`} />
              
              {/* Icon */}
              <motion.div
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10"
              >
                <Icon className={`w-7 h-7 md:w-8 md:h-8 ${pillar.iconColor}`} strokeWidth={2.2} />
              </motion.div>
            </div>
          </div>

          {/* Pillar Index & Tag */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono font-black text-sky-400/80 uppercase tracking-widest px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20">
              PILLAR 0{idx + 1}
            </span>
          </div>
        </div>

        {/* Pillar Category Sub-Title */}
        <h3 className="text-lg md:text-xl font-black text-white mb-3 tracking-tight flex items-center justify-between group-hover:text-sky-300 transition-colors">
          <span>{pillar.title}</span>
          <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-sky-400" />
        </h3>

        {/* Pillar Description */}
        <p className="text-sm md:text-base font-normal leading-relaxed text-slate-300 group-hover:text-slate-100 transition-colors">
          {pillar.text}
        </p>
      </div>

      {/* Card Footer Tag */}
      <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
        <span className="font-mono text-[11px] text-sky-400/90 font-semibold uppercase">{pillar.tag}</span>
        <span className="text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors">Lake Victoria Basin</span>
      </div>
    </motion.div>
  );
}

const PILLARS = [
  {
    title: "Civic Media & Dialogue",
    text: "Public engagement on developmental issues through elite community digital media, podcasts, and public deliberative forums.",
    tag: "Participatory Radio",
    icon: Radio,
    iconColor: "text-sky-400",
    gradient: "from-sky-500 to-blue-600",
  },
  {
    title: "Ecosystem & Climate Watch",
    text: "Demanding transparency and rigorous accountability on climate resilience and ecological conservation of Lake Victoria.",
    tag: "Ecological Integrity",
    icon: Waves,
    iconColor: "text-emerald-400",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    title: "Watchdog & Human Rights",
    text: "Acting as a civic watchdog, investigating governance gaps and amplifying grassroots concerns on human rights and social justice.",
    tag: "Civic Governance",
    icon: Scale,
    iconColor: "text-violet-400",
    gradient: "from-violet-500 to-indigo-600",
  },
  {
    title: "Cross-Border Basin Security",
    text: "Sensitizing riparian communities on the hazards of cross-border insecurity, illegal fishing, and joint borderland environmental protection.",
    tag: "Borderland Defense",
    icon: ShieldCheck,
    iconColor: "text-amber-400",
    gradient: "from-amber-500 to-orange-600",
  },
];

export default function PillarsSection() {
  return (
    <section
      id="pillars"
      className="py-20 md:py-32 text-white relative overflow-hidden bg-slate-950"
    >
      {/* ── Lake Victoria Satellite Background ── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src="/images/lake-victoria-bg.png"
          alt="Lake Victoria aerial view"
          fill
          className="object-cover opacity-30"
          quality={85}
          priority={false}
        />
        {/* Dark overlay for optimal readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/95 via-blue-950/90 to-slate-950/98" />
      </div>

      {/* Accent glow lines */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-sky-500/40 to-transparent z-[2]" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent z-[2]" />

      {/* SIHU Logo watermark */}
      <div className="absolute top-8 right-8 z-[2] opacity-[0.05] hidden lg:block pointer-events-none">
        <Image src="/images/sihu-logo.png" alt="" width={220} height={220} aria-hidden />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row gap-12 md:gap-16 items-start lg:items-center">
          {/* Section Header Left */}
          <div className="lg:w-1/3">
            <RevealOnScroll>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 font-bold text-xs uppercase tracking-widest mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Foundational Strategy</span>
              </div>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black mt-2 mb-6 text-white uppercase tracking-tight leading-[1.05]">
                Key <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-200">
                  Pillars
                </span>
              </h2>
              <p className="text-base md:text-lg font-normal text-slate-300 leading-relaxed">
                Our core principles driving accountability, climate resilience, and community-first journalism across the Lake Victoria ecosystem.
              </p>
            </RevealOnScroll>
          </div>

          {/* Pillars Cards Grid Right */}
          <div className="lg:w-2/3 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
              {PILLARS.map((pillar, idx) => {
                const Icon = pillar.icon;
                return (
                  <RevealOnScroll key={idx} delay={idx * 120}>
                    <PillarCard pillar={pillar} Icon={Icon} idx={idx} />
                  </RevealOnScroll>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
