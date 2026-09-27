"use client";

import React from 'react';
import { ContentSource } from '@/types/contentHub';
import { ExternalLink, BookCheck, ShieldCheck } from 'lucide-react';

interface SourcesListProps {
  sources: ContentSource[];
  className?: string;
}

export default function SourcesList({ sources, className = '' }: SourcesListProps) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className={`p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md ${className}`}>
      <div className="flex items-center gap-2 mb-3 text-slate-200">
        <BookCheck className="w-4 h-4 text-emerald-400" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Documented Sources & Evidence ({sources.length})
        </h4>
      </div>

      <p className="text-xs text-slate-400 mb-4 leading-relaxed">
        SIHU operates on an evidence-grounded editorial policy. Key assertions in this publication are cross-referenced with the following records:
      </p>

      <ul className="space-y-3">
        {sources.map((src, index) => (
          <li
            key={src.id || index}
            className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 uppercase tracking-widest font-semibold">
                  {src.sourceType}
                </span>
                <span className="text-sm font-semibold text-slate-100">
                  {src.title}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                {src.publisher && <span className="font-medium text-slate-300">Publisher: {src.publisher}</span>}
                {src.publishedAt && <span>· Published: {src.publishedAt}</span>}
              </div>
              {src.reliabilityNotes && (
                <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-emerald-400/90">
                  <ShieldCheck className="w-3 h-3 shrink-0" />
                  <span>{src.reliabilityNotes}</span>
                </div>
              )}
            </div>

            {src.url && (
              <a
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-400 hover:text-sky-300 px-3 py-1.5 rounded-lg bg-sky-950/40 border border-sky-900/50 hover:bg-sky-900/40 transition-all shrink-0"
              >
                <span>Verify Source</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
