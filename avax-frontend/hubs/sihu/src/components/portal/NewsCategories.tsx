"use client";

import React from "react";
import {
  Layers,
  Scale,
  TrendingUp,
  Sprout,
  Activity,
  GraduationCap,
  Waves,
  ChevronRight,
  Sparkles
} from "lucide-react";

const CATEGORIES = [
  {
    name: 'All',
    Icon: Layers,
    color: 'from-slate-800 to-slate-950',
    lightColor: 'from-slate-100 to-slate-200',
    accent: '#334155',
    desc: 'All Intelligence'
  },
  {
    name: 'Politics',
    Icon: Scale,
    color: 'from-blue-600 to-indigo-900',
    lightColor: 'from-blue-50 to-indigo-100',
    accent: '#2563eb',
    desc: 'Civic & Law'
  },
  {
    name: 'Business',
    Icon: TrendingUp,
    color: 'from-emerald-600 to-teal-900',
    lightColor: 'from-emerald-50 to-teal-100',
    accent: '#059669',
    desc: 'Basin Economy'
  },
  {
    name: 'Agriculture',
    Icon: Sprout,
    color: 'from-amber-500 to-orange-700',
    lightColor: 'from-amber-50 to-orange-100',
    accent: '#d97706',
    desc: 'Agro & Food'
  },
  {
    name: 'Health',
    Icon: Activity,
    color: 'from-rose-500 to-rose-800',
    lightColor: 'from-rose-50 to-rose-100',
    accent: '#e11d48',
    desc: 'Public Wellbeing'
  },
  {
    name: 'Education',
    Icon: GraduationCap,
    color: 'from-violet-600 to-purple-900',
    lightColor: 'from-violet-50 to-purple-100',
    accent: '#7c3aed',
    desc: 'Knowledge & Skills'
  },
  {
    name: 'Environment',
    Icon: Waves,
    color: 'from-sky-500 to-cyan-800',
    lightColor: 'from-sky-50 to-cyan-100',
    accent: '#0284c7',
    desc: 'Lake Ecosystem'
  },
];

interface NewsCategoriesProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export default function NewsCategories({ selectedCategory, onSelectCategory }: NewsCategoriesProps) {
  return (
    <section className="mb-14">
      {/* Section Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100/60 border border-sky-200 text-sky-700 font-bold text-[10px] uppercase tracking-widest mb-2">
            <Sparkles className="w-3 h-3 text-sky-500" />
            <span>Curated Topics</span>
          </div>
          <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">
            Basin Focus Domains
          </h3>
        </div>
      </div>

      {/* Category Cards */}
      <div className="flex flex-wrap gap-2.5 md:gap-3">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.name;
          const { Icon } = cat;
          return (
            <button
              key={cat.name}
              onClick={() => onSelectCategory(cat.name)}
              aria-label={`Filter by ${cat.name}`}
              aria-pressed={isActive}
              className={`
                group relative flex items-center gap-2.5 px-4 py-2.5 md:px-5 md:py-3 rounded-2xl font-bold text-xs md:text-sm
                border transition-all duration-300 cursor-pointer select-none
                focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500
                ${
                  isActive
                    ? `bg-gradient-to-r ${cat.color} text-white border-transparent shadow-lg scale-[1.02] ring-2 ring-offset-2 ring-sky-300`
                    : `bg-white/90 backdrop-blur-md border-slate-200 text-slate-700
                       hover:border-sky-300 hover:shadow-md hover:-translate-y-0.5
                       hover:bg-gradient-to-r hover:${cat.lightColor}`
                }
              `}
              style={isActive ? { boxShadow: `0 8px 20px -4px ${cat.accent}40` } : {}}
            >
              {/* Icon container */}
              <span
                className={`
                  flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-300
                  ${
                    isActive
                      ? 'bg-white/20 shadow-inner'
                      : 'bg-slate-100 group-hover:bg-white group-hover:shadow-sm'
                  }
                `}
              >
                <Icon
                  size={16}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`transition-transform duration-300 ${
                    isActive ? 'text-white scale-105' : 'text-slate-600 group-hover:text-sky-600 group-hover:scale-110'
                  }`}
                />
              </span>

              {/* Label */}
              <span className={`tracking-wide font-bold ${
                isActive ? 'text-white' : 'text-slate-800 group-hover:text-slate-900'
              }`}>
                {cat.name}
              </span>

              {/* Sub-label */}
              <span className={`hidden sm:inline-block text-[10px] font-medium ${
                isActive ? 'text-white/80' : 'text-slate-400 group-hover:text-slate-500'
              }`}>
                · {cat.desc}
              </span>

              {/* Active indicator arrow */}
              {isActive && (
                <ChevronRight size={14} className="text-white/80 ml-1" />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
