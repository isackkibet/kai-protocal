/**
 * Shared domain types for the SIHU information hub (SIHU PRD Part A).
 * The same shapes are produced by the Prisma-backed store path and the
 * in-memory fallback store so API responses are identical either way.
 */

export type SihuPostStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'CHANGES_REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'PUBLISHED';

export type SihuContentType =
  | 'ARTICLE'
  | 'NEWS_UPDATE'
  | 'FIELD_JOURNAL'
  | 'MARKET_NEWS'
  | 'AUDIO_PODCAST'
  | 'EDUCATIONAL_GUIDE'
  | 'VIDEO'
  | 'REPORT'
  | 'DOCUMENT'
  | 'CONSERVATION_IMPACT';

export type SihuDisclosure = 'HUMAN' | 'AI_ASSISTED';

export interface AiCheck {
  code: string;
  label: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  detail: string;
}

export interface AiReviewReport {
  score: number; // 0..100 readiness to publish
  verdict: 'READY' | 'REVISE' | 'NOT_READY';
  disclosure: SihuDisclosure;
  summary: string;
  checks: AiCheck[];
  generatedAt: string;
}

export interface PostRevisionLog {
  action: string;
  actorName: string;
  note?: string;
  createdAt: string;
}

export interface ContentPost {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  body: string;
  contentType: SihuContentType;
  category: string;
  language: string;
  status: SihuPostStatus;
  aiDisclosure: SihuDisclosure;
  authorBadge: string | null;
  creatorName: string;
  creatorUserId: string | null;
  creatorEmail: string | null;
  tags: string[];
  mediaUrl: string | null;
  audioUrl: string | null;
  audioDurationSeconds: number | null;
  featured: boolean;
  viewsCount: number;
  likesCount: number;
  tipsEarnedKes: number;
  aiReport: AiReviewReport | null;
  editorNote: string | null;
  reviewedAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  revisions?: PostRevisionLog[];
  comments?: PostComment[];
}

export interface PostComment {
  id: string;
  authorName: string;
  authorUserId: string | null;
  body: string;
  status: 'VISIBLE' | 'REPORTED' | 'HIDDEN';
  createdAt: string;
}

export interface PostDraftInput {
  title: string;
  summary?: string;
  body: string;
  contentType: SihuContentType;
  category: string;
  language?: string;
  tags?: string[];
  mediaUrl?: string;
  audioUrl?: string;
}

export interface ReviewDecision {
  decision: 'PUBLISH' | 'REJECT' | 'REQUIRE_CHANGES' | 'APPROVE';
  note?: string;
}

export const SIHU_CATEGORIES: string[] = [
  'FORESTRY_MRV',
  'CONSERVATION',
  'CLIMATE',
  'MSME_GROWTH',
  'CHAMA_SAVINGS',
  'AGRI_MARKET',
  'COMMUNITY',
];

export const SIHU_EDITOR_ROLE = 'EDITOR';