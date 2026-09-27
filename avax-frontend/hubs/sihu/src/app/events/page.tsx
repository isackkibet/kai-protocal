"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import SihuNav from '@/components/layout/SihuNav';
import TrustBadge from '@/components/content/TrustBadge';
import AddToCalendarButton from '@/components/events/AddToCalendarButton';
import BookmarkButton from '@/components/account/BookmarkButton';
import { UnifiedContentItem } from '@/types/contentHub';
import { unifiedContentService } from '@/services/unifiedContentService';
import { calendarService } from '@/services/calendarService';
import {
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  ExternalLink,
  Users,
  Radio,
  List,
  CalendarDays,
  Filter,
} from 'lucide-react';

export default function EventsPage() {
  const [events, setEvents] = useState<UnifiedContentItem[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [formatFilter, setFormatFilter] = useState<'all' | 'in_person' | 'online'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      const items = await unifiedContentService.getItemsByType('event');
      setEvents(items);
      setLoading(false);
    };
    loadEvents();
  }, []);

  const filteredEvents = events.filter((item) => {
    if (!item.event) return false;
    const isUp = calendarService.isUpcoming(item.event.startsAt);

    if (timelineFilter === 'upcoming' && !isUp) return false;
    if (timelineFilter === 'past' && isUp) return false;

    if (formatFilter === 'online' && !item.event.isOnline) return false;
    if (formatFilter === 'in_person' && item.event.isOnline) return false;

    return true;
  });

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans">
      <SihuNav />

      {/* Header */}
      <section className="py-12 px-4 lg:px-8 border-b border-slate-800/80 bg-gradient-to-b from-slate-900/60 to-transparent">
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-3">
            <CalendarIcon className="w-4 h-4" />
            <span>Community Assembly & Events Calendar</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-heading font-black text-white tracking-tight mb-4">
            Lake Victoria Basin Events & Townhalls
          </h1>

          <p className="text-sm md:text-base text-slate-400 max-w-2xl leading-relaxed">
            Discover community assemblies, ecological restoration drives, vocational workshops, and digital masterclasses. Add to your calendar or register directly.
          </p>
        </div>
      </section>

      {/* Filter and View Toggle Controls */}
      <main className="container mx-auto max-w-5xl px-4 lg:px-8 py-8 flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-800/80">
          {/* Upcoming / Past / Format Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setTimelineFilter('upcoming')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timelineFilter === 'upcoming'
                  ? 'bg-primary text-slate-950 shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Upcoming ({events.filter((e) => e.event && calendarService.isUpcoming(e.event.startsAt)).length})
            </button>

            <button
              onClick={() => setTimelineFilter('past')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timelineFilter === 'past'
                  ? 'bg-primary text-slate-950 shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Past Archives
            </button>

            <div className="h-5 w-px bg-slate-800 mx-1 hidden sm:block" />

            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-primary"
            >
              <option value="all">All Formats</option>
              <option value="in_person">In-Person Only</option>
              <option value="online">Virtual / Online Only</option>
            </select>
          </div>

          {/* List vs Calendar Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'calendar'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>
          </div>
        </div>

        {/* Event Listings */}
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 rounded-2xl bg-slate-900/60 border border-slate-800" />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 flex flex-col items-center">
            <CalendarIcon className="w-12 h-12 text-slate-600 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No Events Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mb-6">
              There are currently no events matching your filter selections. Check back soon or view past archives.
            </p>
            <button
              onClick={() => {
                setTimelineFilter('all');
                setFormatFilter('all');
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredEvents.map((item) => {
              if (!item.event) return null;
              const dateStr = calendarService.formatEventDate(item.event.startsAt);
              const timeStr = calendarService.formatEventTime(item.event.startsAt);
              const isUpcoming = calendarService.isUpcoming(item.event.startsAt);

              return (
                <div
                  key={item.id}
                  className="rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 p-6 transition-all shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 group"
                >
                  {/* Left Date Ribbon & Main Details */}
                  <div className="flex items-start gap-5">
                    {/* Date Block */}
                    <div className="w-16 h-20 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center shrink-0 shadow-inner group-hover:border-primary/50 transition-colors">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                        {new Date(item.event.startsAt).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-2xl font-black text-white leading-none my-0.5">
                        {new Date(item.event.startsAt).getDate()}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500">
                        {new Date(item.event.startsAt).getFullYear()}
                      </span>
                    </div>

                    {/* Event Description */}
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <TrustBadge status={item.verificationStatus} />
                        {item.event.isOnline ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-400 bg-sky-950/60 border border-sky-800/50 px-2 py-0.5 rounded-full">
                            <Radio className="w-3 h-3" />
                            <span>Virtual Stream</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full">
                            <MapPin className="w-3 h-3" />
                            <span>In Person</span>
                          </span>
                        )}
                        {!isUpcoming && (
                          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                            Concluded
                          </span>
                        )}
                      </div>

                      <Link href={`/events/${item.slug}`}>
                        <h2 className="text-lg font-bold text-white group-hover:text-primary-light transition-colors mb-1.5 leading-snug">
                          {item.title}
                        </h2>
                      </Link>

                      <p className="text-xs text-slate-400 max-w-xl line-clamp-2 leading-relaxed mb-3">
                        {item.excerpt}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{timeStr} EAT</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          <span className="truncate max-w-[220px]">{item.event.locationName}</span>
                        </div>
                        {item.event.organizerName && (
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Users className="w-3.5 h-3.5" />
                            <span>{item.event.organizerName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Action Buttons */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-slate-800/80 shrink-0">
                    <div className="flex items-center gap-2">
                      <BookmarkButton contentItemId={item.id} />
                      <AddToCalendarButton item={item} />
                    </div>

                    {item.event.registrationUrl && isUpcoming && (
                      <a
                        href={item.event.registrationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-slate-950 font-bold text-xs transition-all shadow-md active:scale-95"
                      >
                        <span>Register</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
