/**
 * Sango Info Hub (SIHU) — Comprehensive Content Domain Models
 * Aligned with SIHU PRD v1.0 (Sections 6, 8, 9, 10, 11, 14, 20)
 */

export type ContentType =
  | 'article'
  | 'news'
  | 'guide'
  | 'faq'
  | 'announcement'
  | 'event'
  | 'podcast'
  | 'video'
  | 'document'
  | 'report'
  | 'interview'
  | 'profile'
  | 'opportunity';

export type ContentStatus =
  | 'draft'
  | 'in_review'
  | 'changes_requested'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'archived';

export type VerificationStatus =
  | 'unverified'
  | 'editorially_reviewed'
  | 'source_verified'
  | 'needs_update';

export type VisibilityStatus = 'public' | 'unlisted' | 'private';

export interface Author {
  id: string;
  slug: string;
  name: string;
  title?: string;
  bio?: string;
  avatarUrl?: string;
  isVerified: boolean;
}

export interface Organization {
  id: string;
  slug: string;
  name: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
}

export interface ContentCategory {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface Topic {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  followersCount?: number;
}

export interface ContentSource {
  id: string;
  title: string;
  publisher?: string;
  url?: string;
  sourceType: 'web' | 'academic' | 'government' | 'press' | 'report' | 'interview' | 'field_record';
  publishedAt?: string;
  accessedAt?: string;
  reliabilityNotes?: string;
  citationNote?: string;
}

export interface EventMetadata {
  startsAt: string; // ISO 8601 string
  endsAt?: string;   // ISO 8601 string
  timezone: string;
  locationName: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  registrationUrl?: string;
  isOnline: boolean;
  recurrenceRule?: string;
  organizerName?: string;
}

export interface PodcastMetadata {
  audioUrl: string;
  durationSeconds: number;
  episodeNumber?: number;
  host?: string;
  guests?: string[];
  transcript?: string;
  showNotes?: string;
}

export interface DocumentMetadata {
  fileUrl: string;
  fileSizeBytes?: number;
  fileFormat: string;
  extractedText?: string;
  version?: string;
  reviewDate?: string;
}

export interface ContentRevision {
  id: string;
  contentItemId: string;
  versionNumber: number;
  editorId?: string;
  editorName?: string;
  changeSummary: string;
  createdAt: string;
  snapshot?: Record<string, unknown>;
}

export interface UnifiedContentItem {
  id: string;
  contentType: ContentType;
  slug: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  body: string;
  status: ContentStatus;
  visibility: VisibilityStatus;
  category?: ContentCategory;
  categorySlug?: string;
  author?: Author;
  organization?: Organization;
  coverImageUrl?: string;
  featured: boolean;
  verificationStatus: VerificationStatus;
  readingTimeMinutes: number;
  viewsCount: number;
  likesCount: number;
  bookmarksCount: number;
  publishedAt?: string;
  reviewedAt?: string;
  updatedAt: string;
  createdAt: string;
  tags: string[];
  topics: Topic[];
  sources: ContentSource[];
  // Polymorphic metadata extensions
  event?: EventMetadata;
  podcast?: PodcastMetadata;
  document?: DocumentMetadata;
}

export interface ReportIssuePayload {
  contentItemId: string;
  reporterEmail?: string;
  issueType: 'incorrect_info' | 'broken_link' | 'outdated_info' | 'offensive_content' | 'copyright' | 'accessibility' | 'other';
  description: string;
}

export interface SearchFilterParams {
  query?: string;
  contentType?: ContentType | 'all';
  categorySlug?: string;
  topicSlug?: string;
  verificationStatus?: VerificationStatus | 'all';
  dateRange?: 'all' | 'today' | 'this_week' | 'this_month' | 'this_year';
  location?: string;
  sortBy?: 'relevance' | 'newest' | 'popular';
  limit?: number;
  page?: number;
}

export interface AssistantCitation {
  id: string;
  title: string;
  slug: string;
  contentType: ContentType;
  snippet: string;
  publisher?: string;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: AssistantCitation[];
  feedbackRating?: 1 | -1;
  createdAt: string;
}
