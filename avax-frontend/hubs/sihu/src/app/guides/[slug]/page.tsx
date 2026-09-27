"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import SihuNav from '@/components/layout/SihuNav';
import TrustBadge from '@/components/content/TrustBadge';
import SourcesList from '@/components/content/SourcesList';
import BookmarkButton from '@/components/account/BookmarkButton';
import ReportIssueModal from '@/components/content/ReportIssueModal';
import { UnifiedContentItem } from '@/types/contentHub';
import { unifiedContentService } from '@/services/unifiedContentService';
import {
  BookOpen,
  Clock,
  ArrowLeft,
  Share2,
  Printer,
  Flag,
  User,
  CheckCircle2,
} from 'lucide-react';

export default function GuideDetailPage() {
  const params = useParams();
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

  if (!item) {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans">
        <SihuNav />
        <div className="container mx-auto max-w-2xl px-4 py-24 text-center">
          <h2 className="text-2xl font-bold mb-3">Guide Not Found</h2>
          <p className="text-sm text-slate-400 mb-6">
            The guide or handbook could not be found in our knowledge base.
          </p>
          <Link
            href="/guides"
            className="px-5 py-2.5 rounded-xl bg-primary text-slate-950 font-bold text-xs"
          >
            Back to All Guides
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans">
      <SihuNav />

      <main className="container mx-auto max-w-4xl px-4 lg:px-8 py-8 flex-1">
        {/* Navigation & Controls */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/guides"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Guides</span>
          </Link>

          <div className="flex items-center gap-2">
            <BookmarkButton contentItemId={item.id} showText />
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied' : 'Share'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Guide</span>
            </button>
          </div>
        </div>

        {/* Header Block */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <TrustBadge status={item.verificationStatus} showDetails />
          </div>

          <h1 className="text-2xl md:text-4xl font-heading font-black text-white tracking-tight mb-3 leading-tight">
            {item.title}
          </h1>

          {item.subtitle && (
            <p className="text-base text-slate-300 leading-relaxed mb-6 font-medium">
              {item.subtitle}
            </p>
          )}

          {/* Author & Review Meta */}
          <div className="flex flex-wrap items-center gap-4 py-4 border-y border-slate-800/80 text-xs text-slate-400">
            {item.author && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center font-bold text-primary">
                  {item.author.name[0]}
                </div>
                <div>
                  <span className="font-semibold text-slate-200">{item.author.name}</span>
                  {item.author.title && <span className="text-[11px] text-slate-500 block">{item.author.title}</span>}
                </div>
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{item.readingTimeMinutes} min estimated read</span>
            </div>

            {item.reviewedAt && (
              <div className="flex items-center gap-1 text-sky-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Reviewed: {new Date(item.reviewedAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Body Text / Steps */}
        <div className="prose prose-invert max-w-none mb-12 text-slate-300 leading-relaxed text-sm md:text-base space-y-4">
          {item.body.split('\n\n').map((paragraph, index) => {
            if (paragraph.startsWith('### ')) {
              return (
                <h3 key={index} className="text-xl font-bold text-white mt-8 mb-2 pb-1 border-b border-slate-800">
                  {paragraph.replace('### ', '')}
                </h3>
              );
            }
            if (paragraph.startsWith('#### ')) {
              return (
                <h4 key={index} className="text-base font-bold text-primary-light mt-6 mb-2">
                  {paragraph.replace('#### ', '')}
                </h4>
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

        {/* Report an Issue trigger */}
        <div className="pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Sango Information Hub Verified Technical Guide</span>
          <button
            onClick={() => setReportModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-amber-400 transition-colors"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Report outdated instructions or broken link</span>
          </button>
        </div>

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
