"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import SihuNav from '@/components/layout/SihuNav';
import TrustBadge from '@/components/content/TrustBadge';
import BookmarkButton from '@/components/account/BookmarkButton';
import { UnifiedContentItem, ContentType, SearchFilterParams } from '@/types/contentHub';
import { searchService, SearchResultSummary } from '@/services/searchService';
import { unifiedContentService } from '@/services/unifiedContentService';
import {
  Search,
  SlidersHorizontal,
  Compass,
  Calendar,
  Radio,
  BookOpen,
  FileText,
  Clock,
  Sparkles,
  MapPin,
  X,
  RotateCcw,
} from 'lucide-react';

const CONTENT_TYPES: { id: ContentType | 'all'; label: string; icon: any }[] = [
  { id: 'all', label: 'All Formats', icon: Compass },
  { id: 'article', label: 'Articles', icon: FileText },
  { id: 'guide', label: 'Guides', icon: BookOpen },
  { id: 'event', label: 'Events', icon: Calendar },
  { id: 'podcast', label: 'Podcasts', icon: Radio },
  { id: 'document', label: 'Documents', icon: FileText },
];

export default function ExplorePage() {
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState<ContentType | 'all'>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeTopic, setActiveTopic] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'newest' | 'popular'>('newest');
  const [locationFilter, setLocationFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'source_verified' | 'editorially_reviewed'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const [results, setResults] = useState<SearchResultSummary>({
    items: [],
    totalCount: 0,
    facets: { byType: {} as any, byCategory: {} },
  });
  const [loading, setLoading] = useState(true);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const categories = useMemo(() => unifiedContentService.getCategories(), []);
  const topics = useMemo(() => unifiedContentService.getTopics(), []);

  // Load recent searches
  useEffect(() => {
    setRecentSearches(searchService.getRecentSearches());
  }, []);

  // Perform search
  useEffect(() => {
    let isCancelled = false;
    const runSearch = async () => {
      setLoading(true);
      const res = await searchService.search({
        query: query.trim() || undefined,
        contentType: activeType,
        categorySlug: activeCategory !== 'all' ? activeCategory : undefined,
        topicSlug: activeTopic !== 'all' ? activeTopic : undefined,
        verificationStatus: verificationFilter !== 'all' ? (verificationFilter as any) : undefined,
        location: locationFilter.trim() || undefined,
        sortBy,
      });
      if (!isCancelled) {
        setResults(res);
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(runSearch, 200);
    return () => {
      isCancelled = true;
      clearTimeout(debounceTimer);
    };
  }, [query, activeType, activeCategory, activeTopic, sortBy, locationFilter, verificationFilter]);

  const clearFilters = () => {
    setQuery('');
    setActiveType('all');
    setActiveCategory('all');
    setActiveTopic('all');
    setLocationFilter('');
    setVerificationFilter('all');
    setSortBy('newest');
  };

  const hasActiveFilters =
    query !== '' ||
    activeType !== 'all' ||
    activeCategory !== 'all' ||
    activeTopic !== 'all' ||
    locationFilter !== '' ||
    verificationFilter !== 'all';

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans">
      <SihuNav />

      {/* Hero Header */}
      <section className="relative py-12 px-4 lg:px-8 border-b border-slate-800/80 bg-gradient-to-b from-slate-900/60 to-transparent">
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-3">
            <Compass className="w-4 h-4" />
            <span>Central Discovery Engine</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-heading font-black text-white tracking-tight mb-4">
            Explore Sango Knowledge & Field Reports
          </h1>

          <p className="text-sm md:text-base text-slate-400 max-w-2xl mb-8 leading-relaxed">
            Search verified articles, step-by-step restoration handbooks, real-time events, podcasts, and environmental data across the Lake Victoria Basin.
          </p>

          {/* Search Box Input */}
          <div className="relative flex items-center shadow-2xl">
            <div className="absolute left-4 text-slate-400 pointer-events-none">
              <Search className="w-5 h-5" />
            </div>

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by keywords, author, topic (e.g. biogas, bamboo, chama, Kisumu)..."
              className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-primary rounded-2xl pl-12 pr-28 py-4 text-base text-slate-100 placeholder:text-slate-500 shadow-inner focus:outline-none transition-all"
            />

            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-14 text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`absolute right-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                showFilters || hasActiveFilters
                  ? 'bg-primary/20 text-primary-light border-primary/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>

          {/* Recent Searches Pills */}
          {recentSearches.length > 0 && !query && (
            <div className="flex flex-wrap items-center gap-2 mt-4 text-xs text-slate-400">
              <span className="font-semibold text-slate-500">Popular Queries:</span>
              {recentSearches.map((rec, i) => (
                <button
                  key={i}
                  onClick={() => setQuery(rec)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  {rec}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Main Content Area */}
      <main className="container mx-auto max-w-6xl px-4 lg:px-8 py-8 flex-1">
        {/* Content-Type Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-slate-800/80 scrollbar-none">
          {CONTENT_TYPES.map((type) => {
            const Icon = type.icon;
            const count = type.id === 'all' ? results.totalCount : results.facets.byType[type.id] || 0;
            const isActive = activeType === type.id;

            return (
              <button
                key={type.id}
                onClick={() => setActiveType(type.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                  isActive
                    ? 'bg-primary/20 text-primary-light border-primary/40 shadow-sm'
                    : 'bg-slate-900/40 text-slate-400 hover:text-slate-200 border-slate-800 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{type.label}</span>
                <span className="px-1.5 py-0.2 rounded-md bg-slate-800 text-[10px] font-mono text-slate-300">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Expandable Advanced Filters */}
        {showFilters && (
          <div className="p-5 mb-8 rounded-2xl bg-slate-900/80 border border-slate-800 animate-in fade-in duration-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Category
              </label>
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-primary"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Topic Filter */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Thematic Topic
              </label>
              <select
                value={activeTopic}
                onChange={(e) => setActiveTopic(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-primary"
              >
                <option value="all">All Topics</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.slug}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Verification Status Filter */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Editorial Trust Level
              </label>
              <select
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-primary"
              >
                <option value="all">Any Verification Status</option>
                <option value="source_verified">Source Verified Only</option>
                <option value="editorially_reviewed">Editorially Reviewed</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Sort Results By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-primary"
              >
                <option value="newest">Newest First</option>
                <option value="popular">Most Popular & Saved</option>
                <option value="relevance">Search Relevance</option>
              </select>
            </div>
          </div>
        )}

        {/* Results Metadata Bar */}
        <div className="flex items-center justify-between mb-6 text-xs text-slate-400">
          <span>
            Showing <strong className="text-white">{results.items.length}</strong> verified entries
          </span>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 text-primary hover:text-primary-light font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-slate-900/60 border border-slate-800" />
            ))}
          </div>
        ) : results.items.length === 0 ? (
          /* Rich Empty State (Section 7 PRD) */
          <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 flex flex-col items-center">
            <Compass className="w-12 h-12 text-slate-600 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No Matching Content Found</h3>
            <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
              We couldn't find any published records matching your current filter criteria. Try adjusting keywords or clearing category restrictions.
            </p>
            <button
              onClick={clearFilters}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-slate-950 text-xs font-bold transition-all shadow-md"
            >
              View All Knowledge Hub Records
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.items.map((item) => {
              const detailUrl =
                item.contentType === 'event'
                  ? `/events/${item.slug}`
                  : item.contentType === 'guide'
                  ? `/guides/${item.slug}`
                  : item.contentType === 'podcast'
                  ? `/podcasts/${item.slug}`
                  : item.contentType === 'document'
                  ? `/documents/${item.slug}`
                  : `/portal/article/${item.slug}`;

              return (
                <article
                  key={item.id}
                  className="rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col overflow-hidden group shadow-lg hover:shadow-2xl"
                >
                  {/* Thumbnail / Media Banner */}
                  {item.coverImageUrl && (
                    <div className="relative h-44 w-full overflow-hidden bg-slate-950">
                      <img
                        src={item.coverImageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-950/80 backdrop-blur-md text-primary border border-slate-800">
                          {item.contentType}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <BookmarkButton contentItemId={item.id} />
                      </div>
                    </div>
                  )}

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Trust Badge */}
                      <div className="mb-2.5">
                        <TrustBadge status={item.verificationStatus} />
                      </div>

                      <Link href={detailUrl}>
                        <h2 className="text-base font-bold text-white group-hover:text-primary-light transition-colors line-clamp-2 mb-2 leading-snug">
                          {item.title}
                        </h2>
                      </Link>

                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">
                        {item.excerpt}
                      </p>
                    </div>

                    {/* Metadata Footer */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{item.readingTimeMinutes} min</span>
                      </div>

                      {item.author && (
                        <span className="truncate max-w-[130px] font-medium text-slate-300">
                          {item.author.name}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
