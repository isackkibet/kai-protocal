"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import SihuNav from '@/components/layout/SihuNav';
import TrustBadge from '@/components/content/TrustBadge';
import BookmarkButton from '@/components/account/BookmarkButton';
import PodcastPlayer from '@/components/media/PodcastPlayer';
import { UnifiedContentItem } from '@/types/contentHub';
import { unifiedContentService } from '@/services/unifiedContentService';
import { Radio, Mic, Clock, ArrowRight } from 'lucide-react';

export default function PodcastsPage() {
  const [podcasts, setPodcasts] = useState<UnifiedContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const items = await unifiedContentService.getItemsByType('podcast');
      setPodcasts(items);
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
            <Radio className="w-4 h-4" />
            <span>Audio & Voice Broadcasts</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-heading font-black text-white tracking-tight mb-4">
            Voices of the Lake Podcasts
          </h1>

          <p className="text-sm md:text-base text-slate-400 max-w-2xl leading-relaxed">
            Interviews, frontline stories, and discussions with Beach Management Unit leaders, ecological scientists, and community entrepreneurs.
          </p>
        </div>
      </section>

      <main className="container mx-auto max-w-5xl px-4 lg:px-8 py-8 flex-1">
        {loading ? (
          <div className="space-y-6 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="h-48 rounded-2xl bg-slate-900/60 border border-slate-800" />
            ))}
          </div>
        ) : podcasts.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800">
            <p className="text-sm text-slate-400">No podcast episodes published yet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {podcasts.map((item) => (
              <div
                key={item.id}
                className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all shadow-xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <TrustBadge status={item.verificationStatus} />
                  <BookmarkButton contentItemId={item.id} />
                </div>

                {item.podcast && (
                  <PodcastPlayer
                    title={item.title}
                    podcast={item.podcast}
                    coverImageUrl={item.coverImageUrl}
                  />
                )}

                <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <p className="text-slate-400 line-clamp-2 max-w-xl">
                    {item.excerpt}
                  </p>

                  <Link
                    href={`/podcasts/${item.slug}`}
                    className="inline-flex items-center gap-1 font-semibold text-primary hover:text-primary-light shrink-0 ml-4"
                  >
                    <span>Episode Notes</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
