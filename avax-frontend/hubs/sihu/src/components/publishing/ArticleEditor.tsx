'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText, Sparkles, Send, Save, Plus, Trash2,
  ExternalLink, AlertCircle, CheckCircle2, ShieldAlert,
  ArrowLeft, Tag, Layers, Image as ImageIcon
} from 'lucide-react';
import {
  ContentCategory,
  ContentType,
  ArticleSource,
  AIPreReviewReport,
  PublishingArticle
} from '@/types/publishing';
import { publishingService } from '@/services/content/publishingService';
import { roleService } from '@/services/auth/roleService';

interface ArticleEditorProps {
  initialArticle?: PublishingArticle;
  onSuccess?: (article: PublishingArticle) => void;
}

const CATEGORIES: { id: ContentCategory; label: string }[] = [
  { id: 'FORESTRY_MRV', label: 'Forestry & MRV (CFA / Jaza Miti)' },
  { id: 'MSME_GROWTH', label: 'MSME Growth & Enterprise' },
  { id: 'CHAMA_SAVINGS', label: 'Chama & Community Savings' },
  { id: 'AGRI_MARKET', label: 'Agricultural Markets' },
  { id: 'COMMUNITY', label: 'Community & Culture' },
  { id: 'GENERAL', label: 'General News & Editorial' },
];

const CONTENT_TYPES: { id: ContentType; label: string }[] = [
  { id: 'ARTICLE', label: 'Standard Article' },
  { id: 'FIELD_JOURNAL', label: 'Field Journal (Guardian Ground Report)' },
  { id: 'NEWS_UPDATE', label: 'News / Fast Update' },
  { id: 'EVENT', label: 'Community Event Announcement' },
  { id: 'PODCAST', label: 'Audio Podcast / Voice Note Story' },
  { id: 'PHOTO_GALLERY', label: 'Photo Story & Evidence Gallery' },
  { id: 'REPORT', label: 'Research Paper / Formal Document' },
  { id: 'CONSERVATION_RECORD', label: 'Conservation & Planting Record' },
];

export default function ArticleEditor({ initialArticle, onSuccess }: ArticleEditorProps) {
  const router = useRouter();
  const currentUser = roleService.getCurrentUser();

  const [title, setTitle] = useState(initialArticle?.title || '');
  const [summary, setSummary] = useState(initialArticle?.summary || '');
  const [content, setContent] = useState(initialArticle?.content || '');
  const [coverImageUrl, setCoverImageUrl] = useState(initialArticle?.coverImageUrl || '');
  const [category, setCategory] = useState<ContentCategory>(initialArticle?.category || 'FORESTRY_MRV');
  const [contentType, setContentType] = useState<ContentType>(initialArticle?.contentType || 'ARTICLE');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(initialArticle?.tags || ['Community', 'Conservation']);
  const [sources, setSources] = useState<ArticleSource[]>(
    initialArticle?.sources || [
      { id: 'src_1', title: 'Community Forest Field Log', url: 'https://oloolua.org' }
    ]
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [aiReport, setAiReport] = useState<AIPreReviewReport | null>(initialArticle?.aiPreReview || null);

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleAddSource = () => {
    setSources([
      ...sources,
      { id: `src_${Date.now()}`, title: '', url: '', publisher: '' }
    ]);
  };

  const handleUpdateSource = (index: number, field: keyof ArticleSource, value: string) => {
    const updated = [...sources];
    updated[index] = { ...updated[index], [field]: value };
    setSources(updated);
  };

  const handleRemoveSource = (index: number) => {
    setSources(sources.filter((_, i) => i !== index));
  };

  const handleSaveDraft = async () => {
    if (!title.trim()) {
      setStatusMessage({ type: 'error', text: 'Please provide at least a title for your draft.' });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);
    try {
      const saved = await publishingService.saveDraft(
        {
          id: initialArticle?.id,
          title: title.trim(),
          summary: summary.trim(),
          content: content.trim(),
          coverImageUrl: coverImageUrl.trim() || undefined,
          category,
          contentType,
          tags,
          sources: sources.filter(s => s.title.trim()),
        },
        currentUser
      );
      setStatusMessage({ type: 'success', text: 'Draft saved successfully!' });
      if (onSuccess) onSuccess(saved);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save draft.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!title.trim() || !content.trim()) {
      setStatusMessage({ type: 'error', text: 'Title and article content are required to submit for review.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      // 1. Save draft state first
      const draft = await publishingService.saveDraft(
        {
          id: initialArticle?.id,
          title: title.trim(),
          summary: summary.trim() || title.trim(),
          content: content.trim(),
          coverImageUrl: coverImageUrl.trim() || undefined,
          category,
          contentType,
          tags,
          sources: sources.filter(s => s.title.trim()),
        },
        currentUser
      );

      // 2. Run AI Pre-Review & Transition to SUBMITTED
      const submitted = await publishingService.submitForReview(draft.id, currentUser);
      setAiReport(submitted.aiPreReview || null);
      setStatusMessage({
        type: 'success',
        text: `Submitted to Editorial Queue! AI Pre-Review Quality Score: ${submitted.aiPreReview?.overallScore}/100.`
      });

      if (onSuccess) {
        onSuccess(submitted);
      } else {
        setTimeout(() => {
          router.push('/portal/contributor');
        }, 1800);
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Submission failed.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-neutral-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-amber-900/30">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-xs font-mono text-amber-400 hover:text-amber-300 mb-2 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-50 flex items-center gap-3">
            <FileText className="text-amber-400" size={26} />
            {initialArticle ? 'Edit Article Submission' : 'Create Article Submission'}
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Authoring as: <span className="text-emerald-400 font-semibold">{currentUser.name}</span> ({currentUser.role})
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveDraft}
            disabled={isSaving || isSubmitting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-all disabled:opacity-50"
          >
            <Save size={14} />
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={handleSubmitForReview}
            disabled={isSaving || isSubmitting}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-neutral-950 shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-50"
          >
            <Sparkles size={14} />
            {isSubmitting ? 'Analyzing & Submitting...' : 'Run AI Check & Submit'}
          </button>
        </div>
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl mb-6 text-sm flex items-center gap-3 border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-red-950/40 border-red-500/40 text-red-300'
          }`}
        >
          {statusMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Editor Revision Feedback (if changes were requested) */}
      {initialArticle?.status === 'CHANGES_REQUESTED' && initialArticle.editorialFeedback && (
        <div className="p-4 rounded-xl mb-6 bg-amber-950/40 border border-amber-500/40 text-amber-200">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-400 mb-1">
            <AlertCircle size={14} /> Editor Revisions Requested
          </div>
          <p className="text-sm">{initialArticle.editorialFeedback}</p>
        </div>
      )}

      {/* AI Pre-Review Report Badge (if generated) */}
      {aiReport && (
        <div className="p-5 rounded-2xl mb-8 bg-neutral-900/90 border border-amber-500/30 backdrop-blur-md shadow-xl">
          <div className="flex items-center justify-between mb-3 border-b border-neutral-800 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400" />
              <h3 className="text-sm font-bold text-neutral-100">AI Pre-Review Editorial Report</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-neutral-400">Quality Score:</span>
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  aiReport.overallScore >= 80
                    ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-900/60 text-amber-300 border border-amber-500/40'
                }`}
              >
                {aiReport.overallScore} / 100
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
              <span className="text-neutral-400 block mb-1">Plagiarism Risk:</span>
              <span className="font-semibold text-emerald-400">{aiReport.plagiarismRisk}</span>
              <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">{aiReport.plagiarismDetails}</p>
            </div>
            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
              <span className="text-neutral-400 block mb-1">Citations & Sources:</span>
              <span className="font-semibold text-emerald-400">{aiReport.citationStatus}</span>
              <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">{aiReport.citationNotes}</p>
            </div>
            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
              <span className="text-neutral-400 block mb-1">AI-Assistance Signal:</span>
              <span className="font-semibold text-amber-400">
                {aiReport.aiAssistanceDetected ? `Detected (${aiReport.aiAssistanceConfidence}%)` : 'Original Voice'}
              </span>
              <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                {aiReport.suggestedDisclosure || 'No automated AI disclosure required.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Input Form */}
      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-amber-300 mb-2">
            Article Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Protecting Bamboo Seedlings in Kenya's Dry Season"
            className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 rounded-xl px-4 py-3 text-neutral-100 placeholder-neutral-500 text-lg font-semibold focus:outline-none transition-colors"
          />
        </div>

        {/* Content Type & Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-1.5">
              <Layers size={13} className="text-amber-400" /> Content Type
            </label>
            <select
              value={contentType}
              onChange={e => setContentType(e.target.value as ContentType)}
              className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs text-neutral-200 focus:outline-none"
            >
              {CONTENT_TYPES.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-1.5">
              <Layers size={13} className="text-emerald-400" /> Category
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as ContentCategory)}
              className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs text-neutral-200 focus:outline-none"
            >
              {CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
            Executive Summary / Excerpt
          </label>
          <textarea
            rows={2}
            value={summary}
            onChange={e => setSummary(e.target.value)}
            placeholder="Brief 1-2 sentence overview of key findings, community context, or recommendations..."
            className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 rounded-xl p-3 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none"
          />
        </div>

        {/* Cover Image URL */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-1.5">
            <ImageIcon size={13} className="text-amber-400" /> Cover Image URL
          </label>
          <input
            type="text"
            value={coverImageUrl}
            onChange={e => setCoverImageUrl(e.target.value)}
            placeholder="https://example.com/photo.jpg or asset link"
            className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 rounded-xl px-4 py-2.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none"
          />
        </div>

        {/* Markdown Content */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-amber-300 mb-2">
            Article Content (Markdown supported) *
          </label>
          <textarea
            rows={14}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write your article here... You can use Markdown headers (##), bullet points, and code blocks."
            className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 rounded-xl p-4 text-sm text-neutral-200 placeholder-neutral-500 font-mono leading-relaxed focus:outline-none"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-1.5">
            <Tag size={13} className="text-amber-400" /> Tags
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              placeholder="Add tag and press Enter"
              className="flex-1 bg-neutral-900 border border-neutral-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none"
            />
            <button
              onClick={handleAddTag}
              type="button"
              className="px-3 py-2 rounded-xl text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map(t => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-amber-950/40 text-amber-300 border border-amber-900/40"
              >
                #{t}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(t)}
                  className="hover:text-red-400 text-neutral-400 ml-1"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Structured Sources & Citations (PRD Section 2) */}
        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                <ExternalLink size={15} className="text-emerald-400" />
                Structured Sources & Verification Citations
              </h3>
              <p className="text-[11px] text-neutral-400">
                Link official guidelines, CFA logs, government databases, or research papers.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddSource}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-800 transition-colors"
            >
              <Plus size={13} /> Add Source
            </button>
          </div>

          <div className="space-y-3">
            {sources.map((src, idx) => (
              <div key={src.id || idx} className="flex gap-2 items-center bg-neutral-950/60 p-2.5 rounded-xl border border-neutral-800">
                <input
                  type="text"
                  value={src.title}
                  onChange={e => handleUpdateSource(idx, 'title', e.target.value)}
                  placeholder="Source Title / Report Name"
                  className="flex-1 bg-transparent text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none border-b border-neutral-800 pb-1"
                />
                <input
                  type="text"
                  value={src.url || ''}
                  onChange={e => handleUpdateSource(idx, 'url', e.target.value)}
                  placeholder="https://..."
                  className="flex-1 bg-transparent text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none border-b border-neutral-800 pb-1"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSource(idx)}
                  className="p-1 text-neutral-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
