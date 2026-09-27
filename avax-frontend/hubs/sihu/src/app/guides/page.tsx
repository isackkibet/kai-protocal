"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import SihuNav from '@/components/layout/SihuNav';
import TrustBadge from '@/components/content/TrustBadge';
import BookmarkButton from '@/components/account/BookmarkButton';
import { UnifiedContentItem } from '@/types/contentHub';
import { unifiedContentService } from '@/services/unifiedContentService';
import { BookOpen, Clock, ArrowRight, ShieldCheck } from 'lucide-react';

export default function GuidesPage() {
  const [guides, setGuides] = useState<UnifiedContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const items = await unifiedContentService.getItemsByType('guide');
      setGuides(items);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans">
      <SihuNav />

      <section className="py-12 px-4 lg:px-8 border-b border-slate-800/80 bg-gradient-to-b from-slate-900/60 to-transparent">
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-3">
            <BookOpen className="w-4 h-4" />
            <span>Community Knowledge Handbooks</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-heading font-black text-white tracking-tight mb-4">
            Practical Guides & Field Handbooks
          </h1>

          <p className="text-sm md:text-base text-slate-400 max-w-2xl leading-relaxed">
            Step-by-step technical guides for riparian buffer zone restoration, bamboo agroforestry, Chama bookkeeping compliance, and sustainable water management.
          </p>
        </div>
      </section>

      <main className="container mx-auto max-w-5xl px-4 lg:px-8 py-8 flex-1">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-slate-900/60 border border-slate-800" />
            ))}
          </div>
        ) : guides.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800">
            <p className="text-sm text-slate-400">No guides published yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {guides.map((guide) => (
              <article
                key={guide.id}
                className="rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all p-6 flex flex-col justify-between group shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <TrustBadge status={guide.verificationStatus} />
                    <BookmarkButton contentItemId={guide.id} />
                  </div>

                  <Link href={`/guides/${guide.slug}`}>
                    <h2 className="text-lg font-bold text-white group-hover:text-primary-light transition-colors mb-2 leading-snug">
                      {guide.title}
                    </h2>
                  </Link>

                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">
                    {guide.excerpt}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{guide.readingTimeMinutes} min read</span>
                  </div>

                  <Link
                    href={`/guides/${guide.slug}`}
                    className="inline-flex items-center gap-1 font-semibold text-primary group-hover:text-primary-light"
                  >
                    <span>Read Handbook</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
