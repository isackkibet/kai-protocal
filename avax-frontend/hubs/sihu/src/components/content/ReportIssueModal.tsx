"use client";

import React, { useState } from 'react';
import { Flag, X, CheckCircle, AlertCircle } from 'lucide-react';
import { moderationService } from '@/services/moderationService';

interface ReportIssueModalProps {
  contentItemId: string;
  contentTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportIssueModal({
  contentItemId,
  contentTitle,
  isOpen,
  onClose,
}: ReportIssueModalProps) {
  const [issueType, setIssueType] = useState<
    'incorrect_info' | 'broken_link' | 'outdated_info' | 'offensive_content' | 'copyright' | 'accessibility' | 'other'
  >('incorrect_info');
  const [description, setDescription] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 10) {
      setError('Please provide at least 10 characters detailing the issue.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await moderationService.submitReport({
        contentItemId,
        issueType,
        description,
        reporterEmail: reporterEmail.trim() || undefined,
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setDescription('');
        onClose();
      }, 2200);
    } catch {
      setError('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-8 text-center flex flex-col items-center">
            <CheckCircle className="w-12 h-12 text-emerald-400 mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Report Logged</h3>
            <p className="text-sm text-slate-400 max-w-xs">
              Thank you for keeping SIHU accurate. Our editorial moderation team will inspect this revision.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-2 mb-2 text-amber-400">
              <Flag className="w-5 h-5" />
              <h3 className="text-lg font-bold text-white">Report Inaccuracy or Issue</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4 truncate">
              Reporting: <span className="font-semibold text-slate-200">{contentTitle}</span>
            </p>

            {error && (
              <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-red-950/50 border border-red-800/60 text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Nature of Concern
                </label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-primary"
                >
                  <option value="incorrect_info">Factual error / inaccurate figure</option>
                  <option value="outdated_info">Outdated information / superseded policy</option>
                  <option value="broken_link">Broken source link / missing attachment</option>
                  <option value="accessibility">Accessibility impediment</option>
                  <option value="copyright">Copyright or attribution concern</option>
                  <option value="offensive_content">Offensive or inappropriate content</option>
                  <option value="other">Other issue</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Description & Context
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please specify which claim or paragraph is affected, and provide alternative evidence or links if available..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-primary resize-none placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Your Email (Optional, for resolution updates)
                </label>
                <input
                  type="email"
                  value={reporterEmail}
                  onChange={(e) => setReporterEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-primary placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
