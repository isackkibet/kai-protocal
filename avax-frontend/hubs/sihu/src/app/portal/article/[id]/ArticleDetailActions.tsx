"use client";

import React, { useState } from 'react';
import BookmarkButton from '@/components/account/BookmarkButton';
import ReportIssueModal from '@/components/content/ReportIssueModal';
import { Share2, Printer, Flag } from 'lucide-react';

interface ArticleDetailActionsProps {
  contentItemId: string;
  contentTitle: string;
}

export default function ArticleDetailActions({
  contentItemId,
  contentTitle,
}: ArticleDetailActionsProps) {
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="flex items-center gap-2">
      <BookmarkButton contentItemId={contentItemId} showText />

      <button
        onClick={handleShare}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
        title="Copy article link"
      >
        <Share2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{copied ? 'Copied' : 'Share'}</span>
      </button>

      <button
        onClick={handlePrint}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
        title="Print article"
      >
        <Printer className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Print</span>
      </button>

      <button
        onClick={() => setReportModalOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-amber-400 transition-colors"
        title="Report issue"
      >
        <Flag className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Report</span>
      </button>

      <ReportIssueModal
        contentItemId={contentItemId}
        contentTitle={contentTitle}
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />
    </div>
  );
}
