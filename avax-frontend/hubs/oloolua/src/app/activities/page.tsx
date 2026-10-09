'use client';

import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { PlusCircle, MapPin, BookOpen, ArrowRight } from 'lucide-react';

// Static illustrations of our field work. Per PRD v1.2 (B4) every static
// example is labelled "Example"; official records live in the Keeper Diary.
const EXAMPLES = [
  { title: 'Tree Nursery Sowing & Potting', location: 'Oloolua Forest Station', category: 'Propagation' },
  { title: 'Riverine Zone Croton Reforestation', location: 'Oloolua Stream Bank', category: 'Out-planting' },
  { title: 'Apiculture & Hive Maintenance', location: 'Forest Buffer Apiary', category: 'Beekeeping' },
  { title: 'Community Seedling Distribution', location: 'Oloolua Primary School', category: 'Dispatch' },
];

export default function ActivitiesPage() {
  return (
    <div className="min-h-screen bg-[#0b1c14] text-[#f6f2e7] flex flex-col">
      <Navigation />

      <section className="bg-[#122b1f] border-b border-[#e4c878]/20 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <span className="text-[#e4c878] font-bold text-xs uppercase tracking-widest">Field Stewardship</span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white">Conservation Activities</h1>
            <p className="text-xs sm:text-sm text-gray-300">
              The kinds of work our youth guardians do. Official activity records are kept in the Keeper Diary and are marked verified only after independent review.
            </p>
          </div>

          <Link
            href="/portal?tab=record"
            className="px-5 py-3 rounded-xl font-bold text-xs bg-[#e4c878] hover:bg-amber-300 text-neutral-950 transition-colors shadow-lg flex items-center gap-2 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record Activity</span>
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12 space-y-6 flex-1 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {EXAMPLES.map((act) => (
            <div key={act.title} className="p-6 rounded-2xl bg-[#122b1f] border border-[#e4c878]/20 space-y-3">
              <div className="flex justify-between items-start">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {act.category}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-white/5 text-gray-300 border border-white/15">
                  Example
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">{act.title}</h3>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>{act.location}</span>
              </div>
            </div>
          ))}
        </div>

        <Link href="/portal?tab=diary" className="group flex items-center gap-3 p-5 rounded-2xl bg-[#122b1f] border border-[#e4c878]/30 hover:border-[#e4c878]/60 transition-colors">
          <BookOpen className="w-6 h-6 text-[#e4c878] shrink-0" />
          <div className="flex-1">
            <div className="font-bold text-white group-hover:text-[#e4c878] transition-colors">See the official Keeper Diary</div>
            <div className="text-xs text-gray-400">Confirmed and verified records, in the Guardian Hub (sign in).</div>
          </div>
          <ArrowRight className="w-5 h-5 text-[#e4c878]" />
        </Link>
      </section>
    </div>
  );
}
