'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert, Sparkles, CheckCircle2, Clock, Eye,
  ArrowLeft, RefreshCw, FileText, CheckCircle, AlertTriangle
} from 'lucide-react';
import { PublishingArticle, HubRole } from '@/types/publishing';
import { publishingService } from '@/services/content/publishingService';
import { roleService } from '@/services/auth/roleService';
import EditorReviewModal from '@/components/publishing/EditorReviewModal';
import NewsHeader from '@/components/portal/NewsHeader';

export default function EditorReviewPage() {
  const [currentUser, setCurrentUser] = useState(roleService.getCurrentUser());
  const [queue, setQueue] = useState<PublishingArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<PublishingArticle | null>(null);
  const [loading, setLoading] = useState(true);

  const canReview = roleService.can(currentUser.role, 'canReviewQueue');

  const loadQueue = async () => {
    setLoading(true);
    try {
      const pending = await publishingService.getReviewQueue();
      setQueue(pending);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleRoleSwitch = (newRole: HubRole) => {
    const updated = roleService.switchRole(newRole);
    setCurrentUser(updated);
  };

  return (
    <div className="min-h-screen bg-[#07130E] text-neutral-100 pb-20">
      <NewsHeader />

      <div className="max-w-5xl mx-auto px-4 pt-8">
        {/* Masthead */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-4 border-b border-amber-900/30">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href="/portal/contributor"
                className="text-xs font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1.5"
              >
                <ArrowLeft size={13} /> Contributor Dashboard
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-neutral-100 flex items-center gap-2.5">
              <ShieldAlert className="text-amber-400" size={26} />
              Editorial Review & Approval Queue
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              Active Reviewer: <strong className="text-emerald-400">{currentUser.name}</strong> ({currentUser.role})
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Role switcher for testing */}
            <div className="flex items-center gap-1 bg-neutral-950 p-1.5 rounded-xl border border-neutral-800 text-xs">
              <span className="text-[10px] text-neutral-500 uppercase font-mono px-2">Role:</span>
              {(['EDITOR', 'CHAIRPERSON', 'CONTRIBUTOR'] as HubRole[]).map(r => (
                <button
                  key={r}
                  onClick={() => handleRoleSwitch(r)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    currentUser.role === r
                      ? 'bg-amber-500 text-neutral-950 shadow'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {r.charAt(0) + r.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <button
              onClick={loadQueue}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
              title="Refresh Queue"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* Permission Guard */}
        {!canReview ? (
          <div className="p-8 rounded-3xl bg-amber-950/20 border border-amber-500/40 text-center max-w-lg mx-auto my-12">
            <ShieldAlert size={36} className="text-amber-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-amber-200">Editor Role Required</h3>
            <p className="text-xs text-neutral-400 mt-2 mb-4 leading-relaxed">
              Your current active role is <strong>{currentUser.role}</strong>. Under PRD Section 4, editorial review and approval decisions are restricted to Editors and Chairpersons.
            </p>
            <button
              onClick={() => handleRoleSwitch('EDITOR')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950"
            >
              Switch to Editor Role (Demo/Dev)
            </button>
          </div>
        ) : (
          <div>
            {/* Queue Summary Stat Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800">
                <span className="text-[10px] font-mono uppercase text-neutral-400">Submissions Pending:</span>
                <p className="text-2xl font-bold text-amber-400 mt-1">{queue.length}</p>
              </div>
              <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800">
                <span className="text-[10px] font-mono uppercase text-neutral-400">Review Model:</span>
                <p className="text-sm font-semibold text-emerald-400 mt-1">AI Pre-Check → Human Approval</p>
              </div>
              <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800">
                <span className="text-[10px] font-mono uppercase text-neutral-400">Authority:</span>
                <p className="text-sm font-semibold text-neutral-300 mt-1">Humans hold sole publishing authority</p>
              </div>
            </div>

            {/* Queue List */}
            {loading ? (
              <div className="text-center py-16 text-neutral-500 text-sm">Loading review queue...</div>
            ) : queue.length === 0 ? (
              <div className="text-center py-16 p-8 rounded-3xl bg-neutral-900/40 border border-dashed border-neutral-800">
                <CheckCircle size={36} className="text-emerald-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-neutral-200">Review Queue is Clear!</h3>
                <p className="text-xs text-neutral-500 mt-1">
                  All submitted articles have been reviewed and processed.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {queue.map(article => (
                  <div
                    key={article.id}
                    className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-amber-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 border border-amber-900/50 px-2 py-0.5 rounded-full uppercase">
                          {article.category}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400">
                          {article.contentType}
                        </span>
                        {article.aiPreReview && (
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                              article.aiPreReview.overallScore >= 80
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                : 'bg-amber-950 text-amber-300 border-amber-800'
                            }`}
                          >
                            AI Score: {article.aiPreReview.overallScore}/100
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-neutral-100">{article.title}</h3>
                      <p className="text-xs text-neutral-400 line-clamp-1 mt-1">{article.summary}</p>

                      <div className="flex items-center gap-4 text-[11px] text-neutral-500 mt-3">
                        <span>Submitted by: <strong className="text-neutral-300">{article.authorName}</strong></span>
                        <span>•</span>
                        <span>{new Date(article.updatedAt).toLocaleString()}</span>
                        <span>•</span>
                        <span>{article.sources.length} Sources</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedArticle(article)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow transition-all self-end md:self-center"
                    >
                      Inspect & Review
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Inspection Modal */}
      {selectedArticle && (
        <EditorReviewModal
          article={selectedArticle}
          editor={currentUser}
          onClose={() => setSelectedArticle(null)}
          onActionComplete={loadQueue}
        />
      )}
    </div>
  );
}
