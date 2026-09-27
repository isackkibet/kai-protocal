"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import SihuNav from '@/components/layout/SihuNav';
import TrustBadge from '@/components/content/TrustBadge';
import BookmarkButton from '@/components/account/BookmarkButton';
import { UnifiedContentItem } from '@/types/contentHub';
import { unifiedContentService } from '@/services/unifiedContentService';
import { FileText, Download, Clock, ShieldCheck, ArrowRight } from 'lucide-react';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<UnifiedContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const items = await unifiedContentService.getItemsByType('document');
      setDocuments(items);
      setLoading(false);
    };
    load();
  }, []);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'PDF';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB PDF`;
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans">
      <SihuNav />

      <section className="py-12 px-4 lg:px-8 border-b border-slate-800/80 bg-gradient-to-b from-slate-900/60 to-transparent">
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-3">
            <FileText className="w-4 h-4" />
            <span>Official Reports & Publications</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-heading font-black text-white tracking-tight mb-4">
            Document Repository & Environmental Surveys
          </h1>

          <p className="text-sm md:text-base text-slate-400 max-w-2xl leading-relaxed">
            Download verified whitepapers, ecological baseline data, county gazetteers, and water quality testing protocols across the basin.
          </p>
        </div>
      </section>

      <main className="container mx-auto max-w-5xl px-4 lg:px-8 py-8 flex-1">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="h-36 rounded-2xl bg-slate-900/60 border border-slate-800" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800">
            <p className="text-sm text-slate-400">No documents indexed yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((item) => (
              <div
                key={item.id}
                className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center text-primary shrink-0 border border-slate-700 group-hover:scale-105 transition-transform">
                    <FileText className="w-6 h-6" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <TrustBadge status={item.verificationStatus} />
                      {item.document?.version && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                          v{item.document.version}
                        </span>
                      )}
                    </div>

                    <Link href={`/documents/${item.slug}`}>
                      <h2 className="text-base font-bold text-white group-hover:text-primary-light transition-colors mb-1">
                        {item.title}
                      </h2>
                    </Link>

                    <p className="text-xs text-slate-400 max-w-xl line-clamp-2 leading-relaxed">
                      {item.excerpt}
                    </p>

                    <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-500 font-mono">
                      <span>{formatFileSize(item.document?.fileSizeBytes)}</span>
                      {item.publishedAt && (
                        <span>· Published: {new Date(item.publishedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                  <BookmarkButton contentItemId={item.id} />

                  {item.document?.fileUrl && (
                    <a
                      href={item.document.fileUrl}
                      download
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-slate-950 font-bold text-xs transition-all shadow-sm active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
