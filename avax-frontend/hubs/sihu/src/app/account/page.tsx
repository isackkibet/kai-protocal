"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import SihuNav from '@/components/layout/SihuNav';
import TrustBadge from '@/components/content/TrustBadge';
import { UnifiedContentItem, Topic } from '@/types/contentHub';
import { accountService, ReadingHistoryItem } from '@/services/accountService';
import { unifiedContentService } from '@/services/unifiedContentService';
import {
  Bookmark,
  Clock,
  Tag,
  Bell,
  Trash2,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  User,
} from 'lucide-react';

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<'saved' | 'topics' | 'history' | 'preferences'>('saved');
  const [savedItems, setSavedItems] = useState<UnifiedContentItem[]>([]);
  const [followedSlugs, setFollowedSlugs] = useState<string[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Newsletter preferences state
  const [newsletters, setNewsletters] = useState({
    weeklyDigest: true,
    riparianAlerts: true,
    eventReminders: true,
    policyBulletins: false,
  });

  const loadData = async () => {
    setLoading(true);
    const bookmarked = await accountService.getBookmarkedItems();
    setSavedItems(bookmarked);
    setFollowedSlugs(accountService.getFollowedTopicSlugs());
    setTopics(unifiedContentService.getTopics());
    setHistory(accountService.getReadingHistory());
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRemoveBookmark = (id: string) => {
    accountService.toggleBookmark(id);
    setSavedItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleToggleTopic = (slug: string) => {
    accountService.toggleFollowTopic(slug);
    setFollowedSlugs(accountService.getFollowedTopicSlugs());
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans">
      <SihuNav />

      {/* Hero Header */}
      <section className="py-10 px-4 lg:px-8 border-b border-slate-800/80 bg-slate-900/40">
        <div className="container mx-auto max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-sky-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg">
              <User className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-heading font-black text-white tracking-tight">
                My Knowledge Library
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Personal bookmarks, topic subscriptions, and reading logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Tabbed Area */}
      <main className="container mx-auto max-w-5xl px-4 lg:px-8 py-8 flex-1">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 border-b border-slate-800 scrollbar-none">
          <button
            onClick={() => setActiveTab('saved')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              activeTab === 'saved'
                ? 'bg-primary/20 text-primary-light border-primary/40'
                : 'bg-slate-900/60 text-slate-400 hover:text-white border-slate-800'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Saved Content ({savedItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('topics')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              activeTab === 'topics'
                ? 'bg-primary/20 text-primary-light border-primary/40'
                : 'bg-slate-900/60 text-slate-400 hover:text-white border-slate-800'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Followed Topics ({followedSlugs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              activeTab === 'history'
                ? 'bg-primary/20 text-primary-light border-primary/40'
                : 'bg-slate-900/60 text-slate-400 hover:text-white border-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Reading History ({history.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('preferences')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              activeTab === 'preferences'
                ? 'bg-primary/20 text-primary-light border-primary/40'
                : 'bg-slate-900/60 text-slate-400 hover:text-white border-slate-800'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Notification Feeds</span>
          </button>
        </div>

        {/* Tab Content: Saved Content */}
        {activeTab === 'saved' && (
          <div>
            {loading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2].map((i) => (
                  <div key={i} className="h-32 rounded-2xl bg-slate-900/60 border border-slate-800" />
                ))}
              </div>
            ) : savedItems.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800">
                <Bookmark className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white mb-1">No Saved Items Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                  Click the bookmark icon on any article, guide, event, or report to save it for offline review.
                </p>
                <Link
                  href="/explore"
                  className="px-4 py-2 rounded-xl bg-primary text-slate-950 font-bold text-xs inline-block"
                >
                  Browse Explore Hub
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {savedItems.map((item) => {
                  const targetUrl =
                    item.contentType === 'event'
                      ? `/events/${item.slug}`
                      : item.contentType === 'guide'
                      ? `/guides/${item.slug}`
                      : item.contentType === 'podcast'
                      ? `/podcasts/${item.slug}`
                      : `/portal/article/${item.slug}`;

                  return (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-4 group"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <TrustBadge status={item.verificationStatus} />
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                            {item.contentType}
                          </span>
                        </div>
                        <Link href={targetUrl}>
                          <h3 className="text-base font-bold text-white group-hover:text-primary-light transition-colors line-clamp-1 mb-1">
                            {item.title}
                          </h3>
                        </Link>
                        <p className="text-xs text-slate-400 line-clamp-1">
                          {item.excerpt}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          onClick={() => handleRemoveBookmark(item.id)}
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Remove from saved"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <Link
                          href={targetUrl}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Followed Topics */}
        {activeTab === 'topics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topics.map((topic) => {
              const isFollowed = followedSlugs.includes(topic.slug);
              return (
                <div
                  key={topic.id}
                  className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between gap-4"
                >
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">{topic.name}</h3>
                    <p className="text-xs text-slate-400 line-clamp-1">{topic.description}</p>
                  </div>
                  <button
                    onClick={() => handleToggleTopic(topic.slug)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      isFollowed
                        ? 'bg-primary/20 text-primary-light border-primary/40'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                    }`}
                  >
                    {isFollowed ? 'Following' : 'Follow'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab Content: Reading History */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No recent reading history recorded.
              </div>
            ) : (
              history.map((h, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-200 line-clamp-1">{h.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Read on {new Date(h.readAt).toLocaleDateString()}
                    </span>
                  </div>
                  <Link
                    href={`/portal/article/${h.slug}`}
                    className="text-primary hover:text-primary-light font-semibold"
                  >
                    Resume
                  </Link>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab Content: Preferences */}
        {activeTab === 'preferences' && (
          <div className="max-w-xl space-y-4 rounded-2xl bg-slate-900/60 border border-slate-800 p-6">
            <h3 className="text-sm font-bold text-white mb-2">Notification & Digest Subscriptions</h3>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
              <div>
                <div className="text-xs font-semibold text-slate-200">Weekly Basin Knowledge Digest</div>
                <div className="text-[11px] text-slate-500">Summary of verified articles and reports</div>
              </div>
              <input
                type="checkbox"
                checked={newsletters.weeklyDigest}
                onChange={(e) => setNewsletters({ ...newsletters, weeklyDigest: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
              <div>
                <div className="text-xs font-semibold text-slate-200">Riparian & Ecological Action Alerts</div>
                <div className="text-[11px] text-slate-500">Notifications for urgent ecological events</div>
              </div>
              <input
                type="checkbox"
                checked={newsletters.riparianAlerts}
                onChange={(e) => setNewsletters({ ...newsletters, riparianAlerts: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
              <div>
                <div className="text-xs font-semibold text-slate-200">Event & Townhall Reminders</div>
                <div className="text-[11px] text-slate-500">24-hour reminder before scheduled events start</div>
              </div>
              <input
                type="checkbox"
                checked={newsletters.eventReminders}
                onChange={(e) => setNewsletters({ ...newsletters, eventReminders: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
            </label>
          </div>
        )}
      </main>
    </div>
  );
}
