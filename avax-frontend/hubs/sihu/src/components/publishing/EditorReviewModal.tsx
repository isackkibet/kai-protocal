'use client';

import React, { useState } from 'react';
import {
  CheckCircle2, XCircle, AlertTriangle, Sparkles,
  ExternalLink, UserCheck, Clock, X, MessageSquare
} from 'lucide-react';
import { PublishingArticle, HubUser } from '@/types/publishing';
import { publishingService } from '@/services/content/publishingService';

interface EditorReviewModalProps {
  article: PublishingArticle;
  editor: HubUser;
  onClose: () => void;
  onActionComplete: () => void;
}

export default function EditorReviewModal({
  article,
  editor,
  onClose,
  onActionComplete,
}: EditorReviewModalProps) {
  const [feedbackNote, setFeedbackNote] = useState('');
  const [showFeedbackInput, setShowFeedbackInput] = useState<'CHANGES' | 'REJECT' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      await publishingService.approveArticle(article.id, editor, 'Approved by editorial review.');
      onActionComplete();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Approval failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!feedbackNote.trim()) {
      setError('Please provide feedback explaining what revisions are needed.');
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      await publishingService.requestChanges(article.id, editor, feedbackNote.trim());
      onActionComplete();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Action failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!feedbackNote.trim()) {
      setError('Please provide a reason for rejecting this article.');
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      await publishingService.rejectArticle(article.id, editor, feedbackNote.trim());
      onActionComplete();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Action failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const ai = article.aiPreReview;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl text-neutral-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                Editorial Review Queue
              </span>
              <span className="text-[10px] font-mono text-neutral-400 uppercase">
                {article.category} · {article.contentType}
              </span>
            </div>
            <h2 className="text-xl font-bold text-neutral-100">{article.title}</h2>
            <div className="flex items-center gap-3 text-xs text-neutral-400 mt-1">
              <span>Author: <strong className="text-neutral-200">{article.authorName}</strong></span>
              <span>•</span>
              <span className="text-amber-400">{article.authorRole}</span>
              {article.authorVerifiedBadge && <span className="text-emerald-400 font-semibold">✓ Verified</span>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6 pr-1">
          {/* AI Pre-Review Assessment (PRD Section 3) */}
          {ai && (
            <div className="p-4 rounded-2xl bg-neutral-950/80 border border-amber-500/30">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Sparkles size={14} /> AI Editorial Pre-Review Insights
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Score: {ai.overallScore}/100
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                  <span className="text-neutral-500 block text-[10px] uppercase">Plagiarism:</span>
                  <span className="font-semibold text-emerald-400">{ai.plagiarismRisk} Risk</span>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                  <span className="text-neutral-500 block text-[10px] uppercase">Citations:</span>
                  <span className="font-semibold text-emerald-400">{ai.citationStatus}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                  <span className="text-neutral-500 block text-[10px] uppercase">AI Assistance:</span>
                  <span className="font-semibold text-amber-300">
                    {ai.aiAssistanceDetected ? `Detected (${ai.aiAssistanceConfidence}%)` : 'Original Voice'}
                  </span>
                </div>
              </div>

              {ai.keyTakeaways?.length > 0 && (
                <div className="text-xs text-neutral-300 bg-neutral-900/60 p-3 rounded-xl border border-neutral-800/80">
                  <span className="text-[10px] uppercase font-mono text-neutral-400 block mb-1">Extracted Key Takeaways:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-neutral-300">
                    {ai.keyTakeaways.map((t, idx) => (
                      <li key={idx}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Article Summary */}
          <div>
            <h4 className="text-xs font-mono uppercase text-neutral-400 mb-1">Executive Summary:</h4>
            <p className="text-xs text-neutral-300 bg-neutral-950/50 p-3 rounded-xl border border-neutral-800 leading-relaxed">
              {article.summary}
            </p>
          </div>

          {/* Article Body */}
          <div>
            <h4 className="text-xs font-mono uppercase text-neutral-400 mb-2">Article Full Text:</h4>
            <div className="text-xs text-neutral-200 bg-neutral-950/70 p-4 rounded-xl border border-neutral-800 font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
              {article.content}
            </div>
          </div>

          {/* Structured Citations */}
          <div>
            <h4 className="text-xs font-mono uppercase text-neutral-400 mb-2">Submitted Sources & Citations ({article.sources.length}):</h4>
            {article.sources.length === 0 ? (
              <p className="text-xs text-neutral-500 italic">No external sources provided.</p>
            ) : (
              <div className="space-y-1.5">
                {article.sources.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs">
                    <span className="font-medium text-neutral-200">{s.title}</span>
                    {s.url && (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-400 hover:underline flex items-center gap-1 text-[11px]"
                      >
                        Source Link <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Feedback Form for Changes / Rejection */}
          {showFeedbackInput && (
            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30">
              <label className="block text-xs font-bold text-amber-300 mb-2">
                {showFeedbackInput === 'CHANGES' ? 'Revision Instructions for Author:' : 'Reason for Rejection:'}
              </label>
              <textarea
                rows={3}
                value={feedbackNote}
                onChange={e => setFeedbackNote(e.target.value)}
                placeholder="Explain clearly what needs updating, missing citations, or reason for editorial decision..."
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 rounded-xl p-3 text-xs text-neutral-200 focus:outline-none"
              />
              <div className="flex justify-end gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setShowFeedbackInput(null)}
                  className="px-3 py-1.5 rounded-lg text-xs bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                >
                  Cancel
                </button>
                {showFeedbackInput === 'CHANGES' ? (
                  <button
                    type="button"
                    onClick={handleRequestChanges}
                    disabled={isProcessing}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-neutral-950 hover:bg-amber-400"
                  >
                    Confirm & Send Changes Request
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={isProcessing}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-500"
                  >
                    Confirm Rejection
                  </button>
                )}
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-400 bg-red-950/50 p-2.5 rounded-xl border border-red-800">{error}</p>
          )}
        </div>

        {/* Footer Actions */}
        {!showFeedbackInput && (
          <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
            <span className="text-xs text-neutral-500">
              Reviewer: <strong className="text-neutral-300">{editor.name}</strong> ({editor.role})
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFeedbackInput('REJECT')}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-red-950 text-neutral-300 hover:text-red-400 border border-neutral-700 transition-colors"
              >
                <XCircle size={14} /> Reject
              </button>
              <button
                type="button"
                onClick={() => setShowFeedbackInput('CHANGES')}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-amber-950 text-neutral-300 hover:text-amber-400 border border-neutral-700 transition-colors"
              >
                <MessageSquare size={14} /> Request Changes
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-lg shadow-emerald-950/40 transition-all"
              >
                <CheckCircle2 size={14} /> Approve & Publish
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
