'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { PlusCircle, ArrowRight, Search, Bot } from 'lucide-react';
import { NURSERY_SPECIES_CATALOGUE } from '@/data/species';


export default function SeedlingsPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const filteredSpecies = NURSERY_SPECIES_CATALOGUE.filter((item) => {
    if (activeFilter !== 'all' && !item.categories.includes(activeFilter)) return false;
    if (!q) return true;
    return [item.name, item.sci, item.eco, ...item.tags, ...item.uses.flatMap(u => [u.title, u.text])]
      .some(text => text.toLowerCase().includes(q));
  });

  return (
    <div className="min-h-screen bg-[#0b1c14] text-[#f6f2e7] flex flex-col">
      <Navigation />

      <section className="bg-[#122b1f] border-b border-[#e4c878]/20 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <span className="text-[#e4c878] font-bold text-xs uppercase tracking-widest">Nursery Operations</span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white">Seedlings &amp; Species</h1>
            <p className="text-xs sm:text-sm text-gray-300">
              The {NURSERY_SPECIES_CATALOGUE.length} indigenous and agroforestry species propagated at our nursery.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/portal?tab=record"
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-[#e4c878] hover:bg-amber-300 text-neutral-950 transition-colors flex items-center gap-2 shadow-lg"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Record Activity</span>
            </Link>

            <Link
              href="/portal?tab=nursery"
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-700 hover:bg-emerald-600 text-white transition-colors flex items-center gap-2"
            >
              <span>Live Nursery Records</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-12 space-y-12 flex-1 w-full">
        {/* Live stock and seedbed figures are Guardian data, shown only to signed-in
            members and never invented (PRD B2, B6). */}
        <Link href="/portal?tab=nursery" className="group flex flex-col sm:flex-row sm:items-center gap-3 p-5 rounded-2xl bg-[#122b1f] border border-[#e4c878]/30 hover:border-[#e4c878]/60 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-emerald-600/30 flex items-center justify-center text-[#e4c878] shrink-0"><Bot className="w-6 h-6" /></div>
          <div className="flex-1">
            <div className="font-bold text-white group-hover:text-[#e4c878] transition-colors">Ready stock, capacity and seedbeds live in the Guardian Hub</div>
            <div className="text-xs text-gray-400">Sign in to ask AI Guardian or open the nursery records. Figures come straight from the Guardian database.</div>
          </div>
          <ArrowRight className="w-5 h-5 text-[#e4c878] shrink-0" />
        </Link>

        {/* Nursery Species Catalogue */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-white">Nursery Species Profiles</h2>
              <p className="text-xs text-gray-300">
                Verified indigenous and agroforestry species propagated by Oloolua Youth Guardians CFA.
              </p>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: `All (${NURSERY_SPECIES_CATALOGUE.length})` },
                { id: 'medicinal', label: 'Medicinal' },
                { id: 'timber', label: 'Timber' },
                { id: 'food', label: 'Food' },
                { id: 'ornamental', label: 'Ornamental' },
                { id: 'fodder', label: 'Fodder' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeFilter === f.id
                      ? 'bg-[#e4c878] text-neutral-950 shadow'
                      : 'bg-[#122b1f] text-gray-300 hover:text-white border border-white/10'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live search across name, scientific name, tags and uses */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <label htmlFor="species-search" className="sr-only">Search species</label>
              <input
                id="species-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, scientific name or use (e.g. malaria, timber, bees)"
                className="w-full bg-[#122b1f] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#e4c878]/60"
              />
            </div>
            <p className="text-xs text-gray-400" aria-live="polite">
              Showing {filteredSpecies.length} of {NURSERY_SPECIES_CATALOGUE.length} species
            </p>
          </div>

          {filteredSpecies.length === 0 && (
            <div className="p-8 rounded-2xl bg-[#122b1f] border border-dashed border-[#e4c878]/30 text-center space-y-2">
              <p className="text-sm text-white font-semibold">No species match &ldquo;{query}&rdquo;.</p>
              <button
                type="button"
                onClick={() => { setQuery(''); setActiveFilter('all'); }}
                className="text-xs font-bold text-[#e4c878] hover:underline"
              >
                Clear search and filters
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSpecies.map((sp) => (
              <div
                key={sp.name}
                className="rounded-2xl bg-[#122b1f] border border-[#e4c878]/20 overflow-hidden flex flex-col hover:border-[#e4c878]/50 transition-all group"
              >
                <div className="relative h-48 w-full overflow-hidden bg-black/40">
                  <img
                    src={sp.img}
                    alt={sp.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 right-2.5 flex flex-wrap gap-1">
                    {sp.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0b1c14]/80 backdrop-blur-sm text-[#e4c878] border border-[#e4c878]/30"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-[#e4c878] transition-colors">
                      {sp.name}
                    </h3>
                    <p className="text-[11px] font-mono text-emerald-300/80 italic mb-3">
                      {sp.sci}
                    </p>

                    <div className="space-y-2.5 text-xs text-gray-300">
                      {sp.uses.map((u, uIdx) => (
                        <div key={uIdx} className="space-y-0.5">
                          <span className="font-semibold text-[#e4c878]">{u.title}</span>
                          <p className="text-[11px] text-gray-300 leading-relaxed">{u.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {sp.eco && (
                    <div className="pt-3 border-t border-white/10 text-[11px] text-emerald-200/90 italic leading-relaxed">
                      {sp.eco}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


    </div>
  );
}
