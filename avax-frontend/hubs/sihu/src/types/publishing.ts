/**
 * Dedicated Publishing & RBAC Types for KAI Nuvari / SIHU Information Hub
 * Derived from KAI Nuvari Information Hubs PRD (Part A, Sections 2, 3, 4, 6)
 */

export type HubRole =
  | 'CHAIRPERSON'
  | 'SECRETARY'
  | 'TREASURER'
  | 'EDITOR'
  | 'VERIFIED_CONTRIBUTOR'
  | 'CONTRIBUTOR'
  | 'READER';

export interface HubUser {
  id: string;
  email: string;
  name: string;
  role: HubRole;
  avatarUrl?: string;
  bio?: string;
  isVerified: boolean;
  createdAt: string;
  articlesCount?: number;
  pointsEarned?: number;
}

export type ArticleStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'CHANGES_REQUESTED'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'REJECTED';

export type ContentType =
  | 'ARTICLE'
  | 'FIELD_JOURNAL'
  | 'NEWS_UPDATE'
  | 'EVENT'
  | 'PODCAST'
  | 'PHOTO_GALLERY'
  | 'REPORT'
  | 'CONSERVATION_RECORD';

export type ContentCategory =
  | 'FORESTRY_MRV'
  | 'MSME_GROWTH'
  | 'CHAMA_SAVINGS'
  | 'AGRI_MARKET'
  | 'COMMUNITY'
  | 'GENERAL';

export interface ArticleSource {
  id: string;
  title: string;
  url?: string;
  publisher?: string;
  publishDate?: string;
}

export interface AIPreReviewReport {
  overallScore: number; // 0 to 100
  plagiarismRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  plagiarismDetails: string;
  citationStatus: 'COMPLETE' | 'PARTIAL' | 'MISSING';
  citationNotes: string;
  aiAssistanceDetected: boolean;
  aiAssistanceConfidence: number; // 0 to 100
  suggestedDisclosure?: string;
  keyTakeaways: string[];
  factualClaims: {
    claim: string;
    status: 'VERIFIED' | 'NEEDS_SOURCE' | 'CONSISTENT';
  }[];
  reviewedAt: string;
}

export interface StatusTransitionAudit {
  id: string;
  articleId: string;
  actorId: string;
  actorName: string;
  actorRole: HubRole;
  fromStatus: ArticleStatus;
  toStatus: ArticleStatus;
  notes?: string;
  timestamp: string;
}

export interface PublishingArticle {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string; // Markdown or rich text
  coverImageUrl?: string;
  contentType: ContentType;
  category: ContentCategory;
  tags: string[];
  sources: ArticleSource[];
  status: ArticleStatus;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorRole: HubRole;
  authorVerifiedBadge: boolean;
  aiPreReview?: AIPreReviewReport;
  editorialFeedback?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  tipsEarnedKes: number;
  pointsEarned: number;
  audioNarrationUrl?: string;
  auditTrail: StatusTransitionAudit[];
}

export interface RolePermissions {
  canCreateDraft: boolean;
  canSubmitArticle: boolean;
  canReviewQueue: boolean;
  canApproveArticle: boolean;
  canRejectArticle: boolean;
  canRequestChanges: boolean;
  canPublishDirectly: boolean;
  canManageRoles: boolean;
  canViewAuditLogs: boolean;
  canViewFinancials: boolean;
  canDeleteAnyArticle: boolean;
}
