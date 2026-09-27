'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Link2,
  Eye,
  Save,
  Send,
  Upload,
  X,
  Tag,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
  Loader2,
  SplitSquareHorizontal,
  Type,
  AlignLeft,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import {
  ContentType,
  ContentCategory,
  ArticleSource,
  AIPreReviewReport,
  PublishingArticle,
} from '@/types/publishing';
import { publishingService } from '@/services/content/publishingService';
import { roleService } from '@/services/auth/roleService';

// ─── Types ────────────────────────────────────────────────────────────────────
type ViewMode = 'write' | 'preview' | 'split';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface StoryStudioProps {
  /** Pass an existing article to open it for editing */
  initialArticle?: PublishingArticle;
  /** Called after a successful save/submit if used as an embedded component */
  onSuccess?: (article: PublishingArticle) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES: { id: ContentCategory; label: string; emoji: string }[] = [
  { id: 'FORESTRY_MRV', label: 'Forestry & MRV', emoji: '🌳' },
  { id: 'MSME_GROWTH', label: 'MSME & Enterprise', emoji: '🏪' },
  { id: 'CHAMA_SAVINGS', label: 'Chama & Savings', emoji: '🤝' },
  { id: 'AGRI_MARKET', label: 'Agricultural Markets', emoji: '🌾' },
  { id: 'COMMUNITY', label: 'Community & Culture', emoji: '🏘️' },
  { id: 'GENERAL', label: 'General / Editorial', emoji: '📰' },
];

const CONTENT_TYPES: { id: ContentType; label: string; emoji: string }[] = [
  { id: 'ARTICLE', label: 'Article', emoji: '📝' },
  { id: 'FIELD_JOURNAL', label: 'Field Journal', emoji: '🔭' },
  { id: 'NEWS_UPDATE', label: 'News Update', emoji: '⚡' },
  { id: 'EVENT', label: 'Event', emoji: '📅' },
  { id: 'PODCAST', label: 'Podcast', emoji: '🎙️' },
  { id: 'PHOTO_GALLERY', label: 'Photo Story', emoji: '📸' },
  { id: 'REPORT', label: 'Report / Research', emoji: '📊' },
  { id: 'CONSERVATION_RECORD', label: 'Conservation Record', emoji: '🌿' },
];

const WRITING_TIPS = [
  'Start with a strong hook — a scene, a question, or a surprising fact.',
  'Use short paragraphs. White space invites reading.',
  'Name real places and people. Specificity builds trust.',
  'Lead with the most important information.',
  'End with a call to action or a question for the reader.',
  'Read your work aloud before submitting. Your ear catches what your eye misses.',
  'Cite your sources. Every claim is stronger with evidence behind it.',
  'A field journal entry tells a story AND records a fact. Do both.',
];

// ─── Lightweight markdown renderer (no deps) ─────────────────────────────────
function renderMarkdown(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 class="ss-h3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="ss-h2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="ss-h1">$1</h1>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/__(.+?)__/g, '<u>$1</u>')
    .replace(/^> (.+)$/gm, '<blockquote class="ss-blockquote">$1</blockquote>')
    .replace(/^[-*] (.+)$/gm, '<li class="ss-li">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ss-li-ol">$1</li>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="ss-link" target="_blank" rel="noopener">$1</a>')
    .replace(/^---$/gm, '<hr class="ss-hr" />')
    .replace(/\n\n/g, '</p><p class="ss-p">')
    .replace(/^(.+)$/, '<p class="ss-p">$1</p>');
}

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
function readingTime(words: number) {
  return Math.max(1, Math.ceil(words / 200));
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function StoryStudio({ initialArticle, onSuccess }: StoryStudioProps) {
  const router = useRouter();
  const currentUser = roleService.getCurrentUser();
  const isEditing = !!initialArticle;

  // ── Editor state
  const [body, setBody] = useState(initialArticle?.content || '');
  const [viewMode, setViewMode] = useState<ViewMode>('write');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // ── Metadata
  const [title, setTitle] = useState(initialArticle?.title || '');
  const [summary, setSummary] = useState(initialArticle?.summary || '');
  const [coverImageUrl, setCoverImageUrl] = useState(initialArticle?.coverImageUrl || '');
  const [category, setCategory] = useState<ContentCategory>(initialArticle?.category || 'GENERAL');
  const [contentType, setContentType] = useState<ContentType>(initialArticle?.contentType || 'ARTICLE');
  const [tags, setTags] = useState<string[]>(initialArticle?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [sources, setSources] = useState<ArticleSource[]>(
    initialArticle?.sources || [{ id: 'src_1', title: 'Community Forest Field Log', url: 'https://oloolua.org' }]
  );

  // ── Panel
  const [metaPanelOpen, setMetaPanelOpen] = useState(true);

  // ── PDF import
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfMessage, setPdfMessage] = useState<{ type: 'error' | 'info'; text: string } | null>(null);
  const [pdfFilename, setPdfFilename] = useState<string | null>(null);

  // ── Submit / save
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ── AI pre-review report (shown after submit)
  const [aiReport, setAiReport] = useState<AIPreReviewReport | null>(initialArticle?.aiPreReview || null);

  // ── SIHU outline
  const [aiLoading, setAiLoading] = useState(false);

  // ── Writing tip rotation
  const [currentTip, setCurrentTip] = useState(0);

  // ── Refs
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const DRAFT_KEY = `sihu_studio_draft_${currentUser.id}`;

  // ─── Mount: restore draft from localStorage (only for new articles)
  useEffect(() => {
    if (!isEditing) {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.body && !body) setBody(parsed.body);
          if (parsed.title && !title) setTitle(parsed.title);
          if (parsed.summary) setSummary(parsed.summary);
          if (parsed.category) setCategory(parsed.category);
          if (parsed.contentType) setContentType(parsed.contentType);
          if (parsed.tags) setTags(parsed.tags);
          if (parsed.coverImageUrl) setCoverImageUrl(parsed.coverImageUrl);
          if (parsed.savedAt) setLastSaved(new Date(parsed.savedAt));
        } catch { /* ignore */ }
      }
    }
    const tipTimer = setInterval(() => setCurrentTip(t => (t + 1) % WRITING_TIPS.length), 8000);
    return () => clearInterval(tipTimer);
  }, []);

  // ─── Auto-save to localStorage (debounced 1.5s)
  const triggerAutoSave = useCallback(() => {
    if (isEditing) return; // don't pollute draft store when editing existing
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      if (!title && !body) return;
      setSaveState('saving');
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          body, title, summary, category, contentType, tags, coverImageUrl,
          savedAt: new Date().toISOString(),
        }));
        setSaveState('saved');
        setLastSaved(new Date());
        setTimeout(() => setSaveState('idle'), 2000);
      } catch {
        setSaveState('error');
      }
    }, 1500);
  }, [body, title, summary, category, contentType, tags, coverImageUrl, isEditing, DRAFT_KEY]);

  useEffect(() => {
    triggerAutoSave();
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [triggerAutoSave]);

  // ─── Toolbar: inline format
  const insertFormat = useCallback((before: string, after = '', placeholder = 'text') => {
    const ta = editorRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = body.slice(start, end) || placeholder;
    const newText = body.slice(0, start) + before + selected + after + body.slice(end);
    setBody(newText);
    requestAnimationFrame(() => {
      ta.focus();
      const cur = start + before.length + selected.length + after.length;
      ta.setSelectionRange(cur, cur);
    });
  }, [body]);

  const insertAtLineStart = useCallback((prefix: string) => {
    const ta = editorRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const lineStart = body.lastIndexOf('\n', start - 1) + 1;
    const newText = body.slice(0, lineStart) + prefix + body.slice(lineStart);
    setBody(newText);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + prefix.length, start + prefix.length);
    });
  }, [body]);

  // ─── PDF Upload
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfLoading(true);
    setPdfMessage(null);
    setPdfFilename(file.name);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/studio/parse-pdf', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setPdfMessage({ type: 'error', text: data.error || 'Could not extract text from this PDF.' });
      } else {
        const imported = data.text?.trim() || '';
        setBody(prev => prev
          ? prev + '\n\n---\n\n*Imported from: ' + file.name + '*\n\n' + imported
          : imported);
        if (!title) setTitle(file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' '));
        if (data.note) setPdfMessage({ type: 'info', text: data.note });
      }
    } catch {
      setPdfMessage({ type: 'error', text: 'Upload failed. Check connection and try again.' });
    } finally {
      setPdfLoading(false);
      if (pdfInputRef.current) pdfInputRef.current.value = '';
    }
  };

  // ─── Tags
  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, '');
    if (t && !tags.includes(t)) setTags(ts => [...ts, t]);
    setTagInput('');
  };
  const removeTag = (tag: string) => setTags(ts => ts.filter(t => t !== tag));

  // ─── Sources
  const addSource = () => setSources(ss => [...ss, { id: `src_${Date.now()}`, title: '', url: '', publisher: '' }]);
  const updateSource = (idx: number, field: keyof ArticleSource, val: string) => {
    setSources(ss => { const arr = [...ss]; arr[idx] = { ...arr[idx], [field]: val }; return arr; });
  };
  const removeSource = (idx: number) => setSources(ss => ss.filter((_, i) => i !== idx));

  // ─── AI Outline
  const handleAiAssist = async () => {
    if (!title) { setPdfMessage({ type: 'error', text: 'Add a title first so SIHU knows what to outline.' }); return; }
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Create a detailed story outline for an article titled "${title}" in the category "${category}". Return only clean markdown with ## headings and bullet points. Focus on the Lake Victoria Basin / Sango ecosystem context.`,
          sessionId: 'studio-assist',
        }),
      });
      const data = await res.json();
      if (data.reply) {
        setBody(prev => prev ? prev + '\n\n' + data.reply : data.reply);
      }
    } catch { /* silent */ }
    setAiLoading(false);
  };

  // ─── Save Draft (to publishingService + localStorage)
  const handleSaveDraft = async () => {
    if (!title.trim()) {
      setStatusMessage({ type: 'error', text: 'Add a title before saving.' });
      return;
    }
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const saved = await publishingService.saveDraft({
        id: initialArticle?.id,
        title: title.trim(),
        summary: summary.trim(),
        content: body.trim(),
        coverImageUrl: coverImageUrl.trim() || undefined,
        category,
        contentType,
        tags,
        sources: sources.filter(s => s.title.trim()),
      }, currentUser);
      setSaveState('saved');
      setLastSaved(new Date());
      setStatusMessage({ type: 'success', text: 'Draft saved to your contributor dashboard.' });
      if (!isEditing) localStorage.removeItem(DRAFT_KEY);
      if (onSuccess) onSuccess(saved);
      setTimeout(() => setSaveState('idle'), 2500);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save draft.' });
      setSaveState('error');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Submit for AI review + editorial queue
  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) {
      setStatusMessage({ type: 'error', text: 'Title and article body are required to submit.' });
      return;
    }
    if (body.trim().length < 100) {
      setStatusMessage({ type: 'error', text: 'Story body must be at least 100 characters.' });
      return;
    }
    setIsSubmitting(true);
    setStatusMessage(null);
    setAiReport(null);
    try {
      const draft = await publishingService.saveDraft({
        id: initialArticle?.id,
        title: title.trim(),
        summary: summary.trim() || title.trim(),
        content: body.trim(),
        coverImageUrl: coverImageUrl.trim() || undefined,
        category,
        contentType,
        tags,
        sources: sources.filter(s => s.title.trim()),
      }, currentUser);

      const submitted = await publishingService.submitForReview(draft.id, currentUser);
      setAiReport(submitted.aiPreReview || null);
      setStatusMessage({
        type: 'success',
        text: `Story submitted! AI Quality Score: ${submitted.aiPreReview?.overallScore ?? '—'}/100`,
      });
      if (!isEditing) localStorage.removeItem(DRAFT_KEY);
      if (onSuccess) {
        onSuccess(submitted);
      } else {
        setTimeout(() => router.push('/portal/contributor'), 2000);
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Submission failed.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Stats
  const wordCount = countWords(body);
  const readTime = readingTime(wordCount);
  const previewHtml = renderMarkdown(body);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="ss-root">
      <style>{`
        .ss-root {
          min-height: 100vh;
          background: #05100A;
          color: #e8f5e9;
          font-family: var(--font-inter, 'Inter', sans-serif);
          display: flex;
          flex-direction: column;
        }

        /* ── TOPBAR ── */
        .ss-topbar {
          position: sticky; top: 0; z-index: 50;
          background: rgba(5,16,10,0.95);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(52,211,153,0.12);
          display: flex; align-items: center; gap: 0.6rem;
          padding: 0 1rem; height: 3.4rem;
          flex-shrink: 0;
        }
        .ss-brand {
          display: flex; align-items: center; gap: 0.45rem;
          font-size: 0.8rem; font-weight: 700;
          color: #6ee7b7; letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .ss-save-badge {
          font-size: 0.7rem; color: #6ee7b7; opacity: 0.55;
          display: flex; align-items: center; gap: 0.3rem;
        }
        .ss-save-badge.saved { opacity: 1; color: #34d399; }
        .ss-save-badge.error { opacity: 1; color: #f87171; }

        .ss-btn {
          display: flex; align-items: center; gap: 0.35rem;
          padding: 0.3rem 0.75rem;
          border-radius: 0.4rem; font-size: 0.75rem; font-weight: 600;
          cursor: pointer; border: none; transition: all 0.15s;
        }
        .ss-btn-ghost {
          background: transparent; color: #6ee7b7;
          border: 1px solid rgba(52,211,153,0.18);
        }
        .ss-btn-ghost:hover { background: rgba(52,211,153,0.08); }
        .ss-btn-draft {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(52,211,153,0.2);
          color: #a7f3d0;
        }
        .ss-btn-draft:hover { background: rgba(52,211,153,0.1); }
        .ss-btn-draft:disabled { opacity: 0.45; cursor: not-allowed; }
        .ss-btn-submit {
          background: linear-gradient(135deg, #059669, #065f46);
          color: #d1fae5;
          box-shadow: 0 0 12px rgba(5,150,105,0.3);
        }
        .ss-btn-submit:hover { box-shadow: 0 0 20px rgba(5,150,105,0.5); }
        .ss-btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        .ss-view-modes {
          display: flex; align-items: center;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(52,211,153,0.1);
          border-radius: 0.45rem; overflow: hidden;
        }
        .ss-view-btn {
          display: flex; align-items: center; gap: 0.25rem;
          padding: 0.28rem 0.6rem; font-size: 0.7rem; font-weight: 600;
          cursor: pointer; border: none; background: transparent;
          color: rgba(110,231,183,0.4); transition: all 0.12s;
        }
        .ss-view-btn.active { background: rgba(52,211,153,0.15); color: #6ee7b7; }
        .ss-view-btn:hover:not(.active) { color: #6ee7b7; }

        /* ── WORKSPACE ── */
        .ss-workspace {
          flex: 1; display: flex; min-height: 0; overflow: hidden;
        }

        /* ── LEFT SIDEBAR (meta) ── */
        .ss-sidebar {
          width: 272px; min-width: 240px;
          background: rgba(255,255,255,0.02);
          border-right: 1px solid rgba(52,211,153,0.08);
          overflow-y: auto; display: flex; flex-direction: column;
          transition: width 0.22s, min-width 0.22s;
          flex-shrink: 0;
        }
        .ss-sidebar.closed { width: 0; min-width: 0; overflow: hidden; }

        .ss-stat-bar {
          display: flex; gap: 1rem; padding: 0.65rem 1rem;
          border-bottom: 1px solid rgba(52,211,153,0.06);
        }
        .ss-stat { text-align: center; }
        .ss-stat-n { font-size: 1.05rem; font-weight: 700; color: #6ee7b7; }
        .ss-stat-l { font-size: 0.62rem; color: rgba(110,231,183,0.38); text-transform: uppercase; letter-spacing: 0.06em; }

        /* PDF drop zone */
        .ss-pdf-zone {
          margin: 0.75rem; padding: 0.8rem;
          border: 2px dashed rgba(52,211,153,0.18);
          border-radius: 0.55rem; text-align: center; cursor: pointer;
          transition: all 0.18s;
        }
        .ss-pdf-zone:hover { border-color: rgba(52,211,153,0.4); background: rgba(52,211,153,0.04); }
        .ss-pdf-label { font-size: 0.73rem; color: #6ee7b7; margin-top: 0.3rem; }
        .ss-pdf-sub { font-size: 0.66rem; color: rgba(110,231,183,0.35); }

        .ss-pdf-msg {
          margin: 0 0.75rem 0.5rem;
          padding: 0.45rem 0.65rem;
          border-radius: 0.4rem; font-size: 0.7rem;
          display: flex; align-items: flex-start; gap: 0.4rem;
        }
        .ss-pdf-msg.error { background: rgba(239,68,68,0.08); border: 1px solid rgba(248,113,113,0.2); color: #fca5a5; }
        .ss-pdf-msg.info { background: rgba(251,191,36,0.08); border: 1px solid rgba(251,191,36,0.2); color: #fcd34d; }

        /* AI assist */
        .ss-ai-btn {
          margin: 0 0.75rem 0.6rem;
          display: flex; align-items: center; justify-content: center; gap: 0.45rem;
          background: rgba(6,95,70,0.35);
          border: 1px solid rgba(52,211,153,0.2);
          border-radius: 0.45rem; padding: 0.5rem;
          font-size: 0.75rem; font-weight: 600; color: #6ee7b7;
          cursor: pointer; transition: all 0.18s;
        }
        .ss-ai-btn:hover { background: rgba(52,211,153,0.12); box-shadow: 0 0 10px rgba(52,211,153,0.15); }
        .ss-ai-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        /* Meta sections */
        .ss-meta-sec {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid rgba(52,211,153,0.06);
        }
        .ss-meta-lbl {
          font-size: 0.65rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.07em;
          color: rgba(110,231,183,0.38); margin-bottom: 0.45rem;
        }
        .ss-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(52,211,153,0.14);
          border-radius: 0.38rem; padding: 0.4rem 0.55rem;
          color: #d1fae5; font-size: 0.78rem; outline: none;
          resize: none; transition: border-color 0.14s;
        }
        .ss-input:focus { border-color: rgba(52,211,153,0.38); }
        .ss-input::placeholder { color: rgba(110,231,183,0.22); }
        .ss-select {
          width: 100%;
          background: rgba(5,16,10,0.8);
          border: 1px solid rgba(52,211,153,0.14);
          border-radius: 0.38rem; padding: 0.38rem 0.55rem;
          color: #d1fae5; font-size: 0.78rem; outline: none; cursor: pointer;
        }

        /* Tags */
        .ss-tags { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-bottom: 0.45rem; }
        .ss-tag {
          display: flex; align-items: center; gap: 0.22rem;
          background: rgba(52,211,153,0.08);
          border: 1px solid rgba(52,211,153,0.18);
          border-radius: 999px; padding: 0.13rem 0.5rem 0.13rem 0.6rem;
          font-size: 0.7rem; color: #6ee7b7;
        }
        .ss-tag-x { cursor: pointer; opacity: 0.55; }
        .ss-tag-x:hover { opacity: 1; }
        .ss-tag-row { display: flex; gap: 0.35rem; }
        .ss-icon-btn {
          background: rgba(52,211,153,0.08);
          border: 1px solid rgba(52,211,153,0.18);
          border-radius: 0.32rem; padding: 0.28rem 0.45rem;
          color: #6ee7b7; cursor: pointer; font-size: 0.73rem;
          display: flex; align-items: center; transition: background 0.13s;
        }
        .ss-icon-btn:hover { background: rgba(52,211,153,0.18); }

        /* Sources */
        .ss-source {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(52,211,153,0.08);
          border-radius: 0.38rem; padding: 0.45rem 0.5rem;
          margin-bottom: 0.38rem;
          display: flex; gap: 0.4rem; align-items: flex-start;
        }
        .ss-source-info { flex: 1; }
        .ss-source-title { font-size: 0.72rem; color: #d1fae5; }
        .ss-source-url { font-size: 0.65rem; color: rgba(110,231,183,0.35); word-break: break-all; }

        /* ── EDITOR AREA ── */
        .ss-editor-area {
          flex: 1; display: flex; flex-direction: column;
          min-width: 0; overflow: hidden;
        }

        /* Toolbar */
        .ss-toolbar {
          display: flex; align-items: center; gap: 0.12rem;
          padding: 0.4rem 0.9rem;
          background: rgba(255,255,255,0.018);
          border-bottom: 1px solid rgba(52,211,153,0.07);
          overflow-x: auto; flex-shrink: 0;
        }
        .ss-tbtn {
          display: flex; align-items: center; justify-content: center;
          width: 1.9rem; height: 1.9rem; border: none; background: transparent;
          color: rgba(110,231,183,0.5); border-radius: 0.3rem;
          cursor: pointer; transition: all 0.1s;
        }
        .ss-tbtn:hover { background: rgba(52,211,153,0.1); color: #6ee7b7; }
        .ss-tsep {
          width: 1px; height: 1.1rem;
          background: rgba(52,211,153,0.1); margin: 0 0.2rem;
        }

        /* Panes */
        .ss-panes { flex: 1; display: flex; overflow: hidden; }
        .ss-write-pane {
          flex: 1; display: flex; flex-direction: column; overflow: hidden;
          border-right: 1px solid rgba(52,211,153,0.06);
        }
        .ss-write-pane.full { border-right: none; }

        .ss-title-input {
          width: 100%; background: transparent; border: none; outline: none;
          font-size: clamp(1.35rem, 2.8vw, 2rem); font-weight: 800;
          color: #ecfdf5;
          font-family: var(--font-merriweather, 'Merriweather', Georgia, serif);
          padding: 1.35rem 1.75rem 0.45rem; line-height: 1.2;
        }
        .ss-title-input::placeholder { color: rgba(110,231,183,0.18); }

        .ss-body-textarea {
          flex: 1; width: 100%; background: transparent; border: none; outline: none;
          color: #d1fae5; font-size: 0.975rem; line-height: 1.85;
          font-family: var(--font-merriweather, 'Merriweather', Georgia, serif);
          padding: 0.6rem 1.75rem 2rem; resize: none; overflow-y: auto;
        }
        .ss-body-textarea::placeholder { color: rgba(110,231,183,0.15); }

        .ss-preview-pane {
          flex: 1; overflow-y: auto;
          padding: 1.35rem 1.75rem 2rem;
          font-family: var(--font-merriweather, 'Merriweather', Georgia, serif);
          color: #d1fae5; line-height: 1.85; font-size: 0.975rem;
        }
        .ss-preview-pane .ss-h1 { font-size: 1.9rem; font-weight: 800; color: #ecfdf5; margin: 1.25rem 0 0.65rem; }
        .ss-preview-pane .ss-h2 { font-size: 1.4rem; font-weight: 700; color: #a7f3d0; margin: 1.1rem 0 0.45rem; }
        .ss-preview-pane .ss-h3 { font-size: 1.05rem; font-weight: 600; color: #6ee7b7; margin: 0.9rem 0 0.35rem; }
        .ss-preview-pane .ss-p { margin: 0 0 0.9rem; }
        .ss-preview-pane .ss-blockquote { border-left: 3px solid #059669; padding-left: 0.9rem; color: #6ee7b7; font-style: italic; margin: 0.9rem 0; }
        .ss-preview-pane .ss-li { margin-left: 1.4rem; margin-bottom: 0.3rem; list-style-type: disc; }
        .ss-preview-pane .ss-li-ol { margin-left: 1.4rem; margin-bottom: 0.3rem; list-style-type: decimal; }
        .ss-preview-pane .ss-link { color: #34d399; text-decoration: underline; }
        .ss-preview-pane .ss-hr { border: none; border-top: 1px solid rgba(52,211,153,0.18); margin: 1.2rem 0; }
        .ss-preview-title { font-size: 2rem; font-weight: 800; color: #ecfdf5; margin-bottom: 1.1rem; }
        .ss-preview-empty { color: rgba(110,231,183,0.22); font-size: 0.88rem; margin-top: 3rem; text-align: center; }

        /* Status + AI report */
        .ss-status {
          margin: 0 0.75rem 0.6rem; padding: 0.55rem 0.8rem;
          border-radius: 0.45rem; font-size: 0.76rem;
          display: flex; align-items: flex-start; gap: 0.45rem;
        }
        .ss-status.success { background: rgba(5,150,105,0.12); border: 1px solid rgba(52,211,153,0.22); color: #6ee7b7; }
        .ss-status.error { background: rgba(239,68,68,0.08); border: 1px solid rgba(248,113,113,0.22); color: #fca5a5; }

        .ss-ai-report {
          margin: 0 0.75rem 0.75rem;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(251,191,36,0.2);
          border-radius: 0.55rem; overflow: hidden;
        }
        .ss-ai-report-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.6rem 0.8rem;
          background: rgba(251,191,36,0.06);
          border-bottom: 1px solid rgba(251,191,36,0.12);
        }
        .ss-ai-report-title {
          display: flex; align-items: center; gap: 0.4rem;
          font-size: 0.73rem; font-weight: 700; color: #fcd34d;
        }
        .ss-score-badge {
          font-size: 0.7rem; font-weight: 700; font-family: monospace;
          padding: 0.15rem 0.5rem; border-radius: 0.3rem;
        }
        .ss-score-badge.good { background: rgba(5,150,105,0.2); color: #34d399; border: 1px solid rgba(52,211,153,0.3); }
        .ss-score-badge.warn { background: rgba(251,191,36,0.15); color: #fcd34d; border: 1px solid rgba(251,191,36,0.3); }
        .ss-ai-report-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 0; border-top: none;
        }
        .ss-ai-cell {
          padding: 0.6rem 0.8rem;
          border-right: 1px solid rgba(52,211,153,0.06);
          font-size: 0.68rem;
        }
        .ss-ai-cell:last-child { border-right: none; }
        .ss-ai-cell-lbl { color: rgba(110,231,183,0.38); margin-bottom: 0.2rem; }
        .ss-ai-cell-val { color: #6ee7b7; font-weight: 600; margin-bottom: 0.18rem; }
        .ss-ai-cell-note { color: rgba(110,231,183,0.5); line-height: 1.4; }

        /* Editor revision feedback */
        .ss-revision-banner {
          margin: 0.5rem 0.75rem;
          padding: 0.55rem 0.8rem;
          background: rgba(251,191,36,0.07);
          border: 1px solid rgba(251,191,36,0.22);
          border-radius: 0.45rem; font-size: 0.73rem; color: #fcd34d;
          display: flex; gap: 0.45rem; align-items: flex-start;
        }

        /* Tip bar */
        .ss-tip-bar {
          padding: 0.45rem 1.75rem;
          border-top: 1px solid rgba(52,211,153,0.06);
          font-size: 0.7rem; color: rgba(110,231,183,0.35);
          display: flex; align-items: center; gap: 0.45rem;
          flex-shrink: 0;
        }

        /* Scrollbars */
        .ss-sidebar::-webkit-scrollbar,
        .ss-body-textarea::-webkit-scrollbar,
        .ss-preview-pane::-webkit-scrollbar { width: 3px; }
        .ss-sidebar::-webkit-scrollbar-thumb,
        .ss-body-textarea::-webkit-scrollbar-thumb,
        .ss-preview-pane::-webkit-scrollbar-thumb {
          background: rgba(52,211,153,0.18); border-radius: 2px;
        }

        @media (max-width: 768px) {
          .ss-sidebar { display: none; }
          .ss-title-input { padding: 0.9rem; font-size: 1.25rem; }
          .ss-body-textarea { padding: 0.4rem 0.9rem 2rem; }
          .ss-preview-pane { padding: 0.9rem; }
          .ss-tip-bar { padding: 0.4rem 0.9rem; }
        }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── TOPBAR ─────────────────────────────────────────────────────────── */}
      <header className="ss-topbar">
        <Link href="/portal/contributor" className="ss-btn ss-btn-ghost" style={{ padding: '0.28rem 0.55rem' }}>
          <ArrowLeft size={13} />
        </Link>

        <div className="ss-brand">
          <BookOpen size={13} />
          <span>Story Studio</span>
        </div>
        {isEditing && (
          <span style={{ fontSize: '0.68rem', color: 'rgba(110,231,183,0.35)', fontStyle: 'italic' }}>
            — editing draft
          </span>
        )}

        {/* Auto-save badge */}
        {!isEditing && (
          <div className={`ss-save-badge ${saveState}`} style={{ marginLeft: '0.4rem' }}>
            {saveState === 'saving' && <><Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} />Saving…</>}
            {saveState === 'saved' && <><CheckCircle2 size={10} />Saved {lastSaved?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>}
            {saveState === 'error' && <><AlertCircle size={10} />Save failed</>}
            {saveState === 'idle' && lastSaved && <>Auto-saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* View modes */}
        <div className="ss-view-modes">
          <button className={`ss-view-btn ${viewMode === 'write' ? 'active' : ''}`} onClick={() => setViewMode('write')}>
            <Type size={11} /> Write
          </button>
          <button className={`ss-view-btn ${viewMode === 'split' ? 'active' : ''}`} onClick={() => setViewMode('split')}>
            <SplitSquareHorizontal size={11} /> Split
          </button>
          <button className={`ss-view-btn ${viewMode === 'preview' ? 'active' : ''}`} onClick={() => setViewMode('preview')}>
            <Eye size={11} /> Preview
          </button>
        </div>

        <button className="ss-btn ss-btn-ghost" onClick={() => setMetaPanelOpen(o => !o)} title="Toggle metadata panel">
          <Layers size={12} />
        </button>

        <button
          className="ss-btn ss-btn-draft"
          onClick={handleSaveDraft}
          disabled={isSaving || isSubmitting}
        >
          {isSaving ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={12} />}
          Draft
        </button>

        <button
          className="ss-btn ss-btn-submit"
          onClick={handleSubmit}
          disabled={isSaving || isSubmitting}
        >
          {isSubmitting
            ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />Analyzing…</>
            : <><Sparkles size={12} />AI Check & Submit</>
          }
        </button>
      </header>

      {/* ── WORKSPACE ───────────────────────────────────────────────────────── */}
      <main className="ss-workspace">

        {/* ── LEFT SIDEBAR ─────────────────────────────────────────────────── */}
        <aside className={`ss-sidebar ${metaPanelOpen ? '' : 'closed'}`}>

          {/* Stats */}
          <div className="ss-stat-bar">
            <div className="ss-stat"><div className="ss-stat-n">{wordCount}</div><div className="ss-stat-l">Words</div></div>
            <div className="ss-stat"><div className="ss-stat-n">{readTime}m</div><div className="ss-stat-l">Read</div></div>
            <div className="ss-stat"><div className="ss-stat-n">{body.length}</div><div className="ss-stat-l">Chars</div></div>
          </div>

          {/* Editorial revision feedback (from editor) */}
          {initialArticle?.status === 'CHANGES_REQUESTED' && initialArticle.editorialFeedback && (
            <div className="ss-revision-banner">
              <ShieldAlert size={12} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>Editor revisions requested</div>
                <div style={{ lineHeight: 1.4 }}>{initialArticle.editorialFeedback}</div>
              </div>
            </div>
          )}

          {/* Status toast */}
          {statusMessage && (
            <div className={`ss-status ${statusMessage.type}`}>
              {statusMessage.type === 'success'
                ? <CheckCircle2 size={13} style={{ flexShrink: 0 }} />
                : <AlertCircle size={13} style={{ flexShrink: 0 }} />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* AI Pre-Review Report */}
          {aiReport && (
            <div className="ss-ai-report">
              <div className="ss-ai-report-head">
                <div className="ss-ai-report-title">
                  <Sparkles size={12} /> AI Pre-Review
                </div>
                <div className={`ss-score-badge ${(aiReport.overallScore ?? 0) >= 80 ? 'good' : 'warn'}`}>
                  {aiReport.overallScore}/100
                </div>
              </div>
              <div className="ss-ai-report-grid">
                <div className="ss-ai-cell">
                  <div className="ss-ai-cell-lbl">Plagiarism</div>
                  <div className="ss-ai-cell-val">{aiReport.plagiarismRisk}</div>
                  <div className="ss-ai-cell-note">{aiReport.plagiarismDetails}</div>
                </div>
                <div className="ss-ai-cell">
                  <div className="ss-ai-cell-lbl">Citations</div>
                  <div className="ss-ai-cell-val">{aiReport.citationStatus}</div>
                  <div className="ss-ai-cell-note">{aiReport.citationNotes}</div>
                </div>
                <div className="ss-ai-cell">
                  <div className="ss-ai-cell-lbl">AI Signal</div>
                  <div className="ss-ai-cell-val">
                    {aiReport.aiAssistanceDetected ? `Detected` : 'Original'}
                  </div>
                  <div className="ss-ai-cell-note">
                    {aiReport.suggestedDisclosure || 'No disclosure required.'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PDF Import */}
          <div className="ss-pdf-zone" onClick={() => pdfInputRef.current?.click()}>
            {pdfLoading
              ? <Loader2 size={20} style={{ color: '#6ee7b7', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
              : <Upload size={20} style={{ color: '#6ee7b7', margin: '0 auto' }} />}
            <div className="ss-pdf-label">{pdfFilename ? `✓ ${pdfFilename}` : 'Import PDF'}</div>
            <div className="ss-pdf-sub">{pdfLoading ? 'Extracting…' : 'Upload a PDF to import content'}</div>
            <input ref={pdfInputRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handlePdfUpload} />
          </div>
          {pdfMessage && (
            <div className={`ss-pdf-msg ${pdfMessage.type}`}>
              <AlertCircle size={11} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{pdfMessage.text}</span>
            </div>
          )}

          {/* SIHU AI Outline */}
          <button className="ss-ai-btn" onClick={handleAiAssist} disabled={aiLoading}>
            {aiLoading
              ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
              : <Sparkles size={13} />}
            {aiLoading ? 'SIHU is outlining…' : 'Ask SIHU to Outline'}
          </button>

          {/* Category */}
          <div className="ss-meta-sec">
            <div className="ss-meta-lbl">Category</div>
            <select className="ss-select" value={category} onChange={e => setCategory(e.target.value as ContentCategory)}>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
            </select>
          </div>

          {/* Content type */}
          <div className="ss-meta-sec">
            <div className="ss-meta-lbl">Content Type</div>
            <select className="ss-select" value={contentType} onChange={e => setContentType(e.target.value as ContentType)}>
              {CONTENT_TYPES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
            </select>
          </div>

          {/* Summary */}
          <div className="ss-meta-sec">
            <div className="ss-meta-lbl">Summary / Excerpt</div>
            <textarea
              className="ss-input" rows={3}
              placeholder="Brief overview of key findings or context…"
              value={summary}
              onChange={e => setSummary(e.target.value)}
            />
          </div>

          {/* Cover image */}
          <div className="ss-meta-sec">
            <div className="ss-meta-lbl">Cover Image URL</div>
            <input type="text" className="ss-input" placeholder="https://…" value={coverImageUrl} onChange={e => setCoverImageUrl(e.target.value)} />
            {coverImageUrl && (
              <img src={coverImageUrl} alt="cover" style={{ width: '100%', borderRadius: '0.38rem', marginTop: '0.45rem', aspectRatio: '16/9', objectFit: 'cover', opacity: 0.8 }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            )}
          </div>

          {/* Tags */}
          <div className="ss-meta-sec">
            <div className="ss-meta-lbl">Tags</div>
            <div className="ss-tags">
              {tags.map(t => (
                <span key={t} className="ss-tag">
                  #{t}
                  <X size={9} className="ss-tag-x" onClick={() => removeTag(t)} />
                </span>
              ))}
            </div>
            <div className="ss-tag-row">
              <input type="text" className="ss-input" style={{ flex: 1, padding: '0.32rem 0.48rem' }}
                placeholder="#topic" value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} />
              <button className="ss-icon-btn" onClick={addTag}><Plus size={12} /></button>
            </div>
          </div>

          {/* Sources */}
          <div className="ss-meta-sec">
            <div className="ss-meta-lbl" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Sources & Citations</span>
              <button className="ss-icon-btn" onClick={addSource}><Plus size={11} /> Add</button>
            </div>
            {sources.map((src, idx) => (
              <div key={src.id || idx} className="ss-source">
                <div className="ss-source-info">
                  <input type="text" value={src.title} onChange={e => updateSource(idx, 'title', e.target.value)}
                    placeholder="Source title" className="ss-source-title"
                    style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', borderBottom: '1px solid rgba(52,211,153,0.1)', paddingBottom: '0.15rem', marginBottom: '0.2rem' }} />
                  <input type="text" value={src.url || ''} onChange={e => updateSource(idx, 'url', e.target.value)}
                    placeholder="https://…" className="ss-source-url"
                    style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%' }} />
                </div>
                <Trash2 size={12} style={{ cursor: 'pointer', color: 'rgba(110,231,183,0.35)', flexShrink: 0 }}
                  onClick={() => removeSource(idx)} />
              </div>
            ))}
          </div>

          <div style={{ flex: 1 }} />
        </aside>

        {/* ── EDITOR AREA ──────────────────────────────────────────────────── */}
        <div className="ss-editor-area">

          {/* Formatting toolbar */}
          {viewMode !== 'preview' && (
            <div className="ss-toolbar">
              <button className="ss-tbtn" title="Bold" onClick={() => insertFormat('**', '**', 'bold text')}><Bold size={13} /></button>
              <button className="ss-tbtn" title="Italic" onClick={() => insertFormat('*', '*', 'italic text')}><Italic size={13} /></button>
              <button className="ss-tbtn" title="Underline" onClick={() => insertFormat('__', '__', 'underlined')}><Underline size={13} /></button>
              <div className="ss-tsep" />
              <button className="ss-tbtn" title="Heading 1" onClick={() => insertAtLineStart('# ')}><Heading1 size={13} /></button>
              <button className="ss-tbtn" title="Heading 2" onClick={() => insertAtLineStart('## ')}><Heading2 size={13} /></button>
              <div className="ss-tsep" />
              <button className="ss-tbtn" title="Bullet list" onClick={() => insertAtLineStart('- ')}><List size={13} /></button>
              <button className="ss-tbtn" title="Numbered list" onClick={() => insertAtLineStart('1. ')}><ListOrdered size={13} /></button>
              <button className="ss-tbtn" title="Blockquote" onClick={() => insertAtLineStart('> ')}><Quote size={13} /></button>
              <div className="ss-tsep" />
              <button className="ss-tbtn" title="Link" onClick={() => insertFormat('[', '](url)', 'link text')}><Link2 size={13} /></button>
              <button className="ss-tbtn" title="Divider" onClick={() => { setBody(b => b + '\n\n---\n\n'); editorRef.current?.focus(); }}><AlignLeft size={13} /></button>
            </div>
          )}

          {/* Panes */}
          <div className="ss-panes">
            {viewMode !== 'preview' && (
              <div className={`ss-write-pane ${viewMode === 'write' ? 'full' : ''}`}>
                <input type="text" className="ss-title-input"
                  placeholder="Story title…"
                  value={title}
                  onChange={e => setTitle(e.target.value)} />
                <textarea
                  ref={editorRef}
                  className="ss-body-textarea"
                  placeholder={`Start writing your story…\n\nTips:\n  **bold**  *italic*  # Heading  ## Subheading\n  > Blockquote  - Bullet list  1. Numbered list\n\n↑ Use the toolbar above, or import a PDF from the sidebar.`}
                  value={body}
                  onChange={e => setBody(e.target.value)}
                />
              </div>
            )}
            {viewMode !== 'write' && (
              <div className="ss-preview-pane">
                {title && <div className="ss-preview-title">{title}</div>}
                {body
                  ? <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                  : <div className="ss-preview-empty">Nothing to preview yet.</div>}
              </div>
            )}
          </div>

          {/* Writing tip */}
          <div className="ss-tip-bar">
            <Sparkles size={10} style={{ flexShrink: 0 }} />
            <span>{WRITING_TIPS[currentTip]}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
