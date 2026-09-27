"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import SihuNav from '@/components/layout/SihuNav';
import { Topic, UnifiedContentItem } from '@/types/contentHub';
import { unifiedContentService } from '@/services/unifiedContentService';
import { accountService } from '@/services/accountService';
import { Tag, Users, Check, Plus, ArrowRight } from 'lucide-react';

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [followedSlugs, setFollowedSlugs] = useState<string[]>([]);
  const [topicItemCounts, setTopicItemCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const allTopics = unifiedContentService.getTopics();
    setTopics(allTopics);
    setFollowedSlugs(accountService.getFollowedTopicSlugs());

    const loadCounts = async () => {
      const items = await unifiedContentService.getContentItems();
      const counts: Record<string, number> = {};
      allTopics.forEach((t) => {
        counts[t.slug] = items.filter((item) => item.topics?.some((it) => it.slug === t.slug)).length;
      });
      setTopicItemCounts(counts);
    };
    loadCounts();
  }, []);

  const handleToggleFollow = (slug: string) => {
    const isNow = accountService.toggleFollowTopic(slug);
    setFollowedSlugs(accountService.getFollowedTopicSlugs());
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans">
      <SihuNav />

      <section className="py-12 px-4 lg:px-8 border-b border-slate-800/80 bg-gradient-to-b from-slate-900/60 to-transparent">
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-3">
            <Tag className="w-4 h-4" />
            <span>Thematic Knowledge Clusters</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-heading font-black text-white tracking-tight mb-4">
            Curated Subject Hubs & Taxonomies
          </h1>

          <p className="text-sm md:text-base text-slate-400 max-w-2xl leading-relaxed">
            Follow critical themes shaping the Lake Victoria Basin to receive tailored knowledge feeds, notification alerts, and newly published resources.
          </p>
        </div>
      </section>

      <main className="container mx-auto max-w-5xl px-4 lg:px-8 py-8 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic) => {
            const isFollowed = followedSlugs.includes(topic.slug);
            const count = topicItemCounts[topic.slug] || 0;

            return (
              <div
                key={topic.id}
                className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all shadow-lg flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center text-primary border border-slate-700">
                      <Tag className="w-5 h-5" />
                    </div>

                    <button
                      onClick={() => handleToggleFollow(topic.slug)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                        isFollowed
                          ? 'bg-primary/20 text-primary-light border-primary/40'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 hover:text-white'
                      }`}
                    >
                      {isFollowed ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  </div>

                  <Link href={`/explore?topic=${topic.slug}`}>
                    <h2 className="text-lg font-bold text-white group-hover:text-primary-light transition-colors mb-2">
                      {topic.name}
                    </h2>
                  </Link>

                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    {topic.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>{topic.followersCount || 100} followers</span>
                  </div>

                  <Link
                    href={`/explore?topic=${topic.slug}`}
                    className="inline-flex items-center gap-1 font-semibold text-primary hover:text-primary-light text-xs"
                  >
                    <span>{count} entries</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
