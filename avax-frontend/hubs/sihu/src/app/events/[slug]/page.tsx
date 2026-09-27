"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import SihuNav from '@/components/layout/SihuNav';
import TrustBadge from '@/components/content/TrustBadge';
import SourcesList from '@/components/content/SourcesList';
import AddToCalendarButton from '@/components/events/AddToCalendarButton';
import BookmarkButton from '@/components/account/BookmarkButton';
import ReportIssueModal from '@/components/content/ReportIssueModal';
import { UnifiedContentItem } from '@/types/contentHub';
import { unifiedContentService } from '@/services/unifiedContentService';
import { calendarService } from '@/services/calendarService';
import {
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  ArrowLeft,
  Share2,
  Printer,
  Flag,
  Radio,
  CheckCircle,
} from 'lucide-react';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [item, setItem] = useState<UnifiedContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      setLoading(true);
      const data = await unifiedContentService.getItemBySlug(slug);
      setItem(data);
      setLoading(false);
    };
    load();
  }, [slug]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans">
        <SihuNav />
        <div className="container mx-auto max-w-4xl px-4 py-20 flex justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!item || !item.event) {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans">
        <SihuNav />
        <div className="container mx-auto max-w-2xl px-4 py-24 text-center">
          <h2 className="text-2xl font-bold mb-3">Event Not Found</h2>
          <p className="text-sm text-slate-400 mb-6">
            The event record you are requesting could not be located in the current database.
          </p>
          <Link
            href="/events"
            className="px-5 py-2.5 rounded-xl bg-primary text-slate-950 font-bold text-xs"
          >
            Back to All Events
          </Link>
        </div>
      </div>
    );
  }

  const dateStr = calendarService.formatEventDate(item.event.startsAt);
  const timeStr = calendarService.formatEventTime(item.event.startsAt);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans">
      <SihuNav />

      <main className="container mx-auto max-w-4xl px-4 lg:px-8 py-8 flex-1">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Events Hub</span>
          </Link>

          <div className="flex items-center gap-2">
            <BookmarkButton contentItemId={item.id} showText />
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
              title="Copy page link"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied Link' : 'Share'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
              title="Print event schedule"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Hero Banner */}
        {item.coverImageUrl && (
          <div className="w-full h-64 md:h-80 rounded-3xl overflow-hidden mb-8 border border-slate-800 shadow-2xl relative">
            <img
              src={item.coverImageUrl}
              alt={item.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <TrustBadge status={item.verificationStatus} showDetails />
            </div>
          </div>
        )}

        {/* Header Block */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-4xl font-heading font-black text-white tracking-tight mb-3 leading-tight">
            {item.title}
          </h1>
          {item.subtitle && (
            <p className="text-base text-slate-300 leading-relaxed mb-6 font-medium">
              {item.subtitle}
            </p>
          )}

          {/* Key Event Facts Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 mb-8">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="text-xs uppercase font-bold text-slate-400">Date & Schedule</div>
                <div className="text-sm font-semibold text-white">{dateStr}</div>
                <div className="text-xs text-slate-400">{timeStr} ({item.event.timezone})</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs uppercase font-bold text-slate-400">Location & Venue</div>
                <div className="text-sm font-semibold text-white">{item.event.locationName}</div>
                {item.event.address && (
                  <div className="text-xs text-slate-400">{item.event.address}</div>
                )}
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <AddToCalendarButton item={item} />

            {item.event.registrationUrl && (
              <a
                href={item.event.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-slate-950 font-bold text-sm transition-all shadow-md active:scale-95"
              >
                <span>Register for Event</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* Body Text */}
        <div className="prose prose-invert max-w-none mb-12 text-slate-300 leading-relaxed text-sm md:text-base space-y-4">
          {item.body.split('\n\n').map((paragraph, index) => {
            if (paragraph.startsWith('### ')) {
              return (
                <h3 key={index} className="text-xl font-bold text-white mt-6 mb-2">
                  {paragraph.replace('### ', '')}
                </h3>
              );
            }
            return <p key={index}>{paragraph}</p>;
          })}
        </div>

        {/* Sources & Citations */}
        {item.sources && item.sources.length > 0 && (
          <div className="mb-10">
            <SourcesList sources={item.sources} />
          </div>
        )}

        {/* Report an Issue trigger (Section 7 & 14 PRD) */}
        <div className="pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Official Sango Information Hub Event Record</span>
          <button
            onClick={() => setReportModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-amber-400 transition-colors"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Report outdated or incorrect event details</span>
          </button>
        </div>

        {/* Report Modal */}
        <ReportIssueModal
          contentItemId={item.id}
          contentTitle={item.title}
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
        />
      </main>
    </div>
  );
}
