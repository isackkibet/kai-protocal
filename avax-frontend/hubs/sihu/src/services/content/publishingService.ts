import {
  PublishingArticle,
  ArticleStatus,
  ContentCategory,
  ContentType,
  ArticleSource,
  HubUser,
  StatusTransitionAudit
} from '@/types/publishing';
import { roleService } from '@/services/auth/roleService';
import { aiPreReviewService } from '@/services/ai/aiPreReviewService';

const STORAGE_KEY = 'sihu_publishing_articles_v1';

const SEED_ARTICLES: PublishingArticle[] = [
  {
    id: 'art_seed_01',
    slug: 'protecting-bamboo-seedlings-dry-season',
    title: 'Protecting Bamboo Seedlings in Kenya’s Dry Season',
    summary: 'Community forest guardians share field-proven techniques to keep bamboo saplings alive during drought: mulching, shade nets, and deep-root drip hydration.',
    content: `## The Dry Season Challenge in Ngong Hills
During the June-to-October dry spells, indigenous seedlings in peri-urban forests face high mortality if not protected early. Oloolua youth guardians have piloted a three-tier protection framework that increased 6-month bamboo survival rates by 38%.

### 1. Organic Mulching with Indigenous Leaves
Layering 10cm of dry Croton and Acacia leaf litter around seedling bases cuts soil moisture loss in half. Never mulch flush against the stalk—leave a 3cm breathing gap to prevent fungal dampening.

### 2. High-Canopy Shade Nets
Young giant bamboo (*Dendrocalamus asper*) needs 40% filtered sunlight during the first 120 days. Low-cost agro-netting woven on bamboo poles provides wind protection without trapping humidity.

### 3. Verification & Monitoring
Under the Green Tree Commodities Initiative (GTCI) and Jaza Miti guidelines, every 20-seedling cluster is GPS-tagged and logged weekly by CFA guardians.`,
    coverImageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1200&auto=format&fit=crop&q=80',
    contentType: 'FIELD_JOURNAL',
    category: 'FORESTRY_MRV',
    tags: ['Bamboo', 'Jaza Miti', 'Drought Care', 'Oloolua', 'GTCI'],
    sources: [
      { id: 's1', title: 'Kenya Forestry Research Institute (KEFRI) Bamboo Guidelines', url: 'https://kefri.org' },
      { id: 's2', title: 'Jaza Miti Presidential Initiative 15 Billion Trees Strategy', url: 'https://environment.go.ke' }
    ],
    status: 'PUBLISHED',
    authorId: 'usr_grace_01',
    authorName: 'Grace Wangari',
    authorEmail: 'grace.wangari@oloolua.org',
    authorRole: 'VERIFIED_CONTRIBUTOR',
    authorVerifiedBadge: true,
    publishedAt: '2026-09-15T09:30:00.000Z',
    createdAt: '2026-09-12T14:20:00.000Z',
    updatedAt: '2026-09-15T09:30:00.000Z',
    viewsCount: 684,
    likesCount: 92,
    commentsCount: 14,
    savesCount: 38,
    tipsEarnedKes: 2400,
    pointsEarned: 350,
    aiPreReview: {
      overallScore: 92,
      plagiarismRisk: 'LOW',
      plagiarismDetails: 'Original field reporting verified. Strong community ground-truth data.',
      citationStatus: 'COMPLETE',
      citationNotes: 'All 2 official citations properly linked to government & research institutes.',
      aiAssistanceDetected: false,
      aiAssistanceConfidence: 10,
      keyTakeaways: [
        'Organic leaf mulching with 3cm breathing gap cuts seedling water loss by 50%.',
        '40% filtered shade netting protects young bamboo during first 120 days.',
        'GPS cluster tagging verifies survival rates under Jaza Miti protocols.'
      ],
      factualClaims: [
        { claim: 'Survival rate increased by 38% with protection framework', status: 'VERIFIED' }
      ],
      reviewedAt: '2026-09-13T10:00:00.000Z'
    },
    auditTrail: [
      {
        id: 'aud_01',
        articleId: 'art_seed_01',
        actorId: 'usr_grace_01',
        actorName: 'Grace Wangari',
        actorRole: 'VERIFIED_CONTRIBUTOR',
        fromStatus: 'DRAFT',
        toStatus: 'SUBMITTED',
        notes: 'Initial field journal submission with photo evidence.',
        timestamp: '2026-09-13T10:00:00.000Z'
      },
      {
        id: 'aud_02',
        articleId: 'art_seed_01',
        actorId: 'usr_founder_01',
        actorName: 'Austin Namuye',
        actorRole: 'CHAIRPERSON',
        fromStatus: 'SUBMITTED',
        toStatus: 'PUBLISHED',
        notes: 'Editorial review passed. High ecological quality.',
        timestamp: '2026-09-15T09:30:00.000Z'
      }
    ]
  },
  {
    id: 'art_seed_02',
    slug: 'chama-treasury-management-kai-smart-ledger',
    title: 'How 14 Nairobi Chamas Adopted Smart Ledgers to Prevent Cash Discrepancies',
    summary: 'A look inside women-led savings groups using voice receipts and automated reconciliation to safeguard over KES 4.2M in monthly revolving deposits.',
    content: `## The Cash Reconciliation Bottleneck
For decades, rotating savings associations (Chamas) across East Africa relied on physical notebooks. In busy open-air markets like Gikomba and Toi, bookkeeper fatigue led to reconciliation delays and member disputes.

### Transitioning to Multi-Signer Digital Records
By combining SMS notification anchors with decentralized group signing, members now confirm payouts directly from their standard mobile devices.

### Measurable Results
- Discrepancy dispute rates dropped by 84% across enrolled groups.
- Average monthly book closing time dropped from 3.5 hours to 18 minutes.`,
    coverImageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&auto=format&fit=crop&q=80',
    contentType: 'ARTICLE',
    category: 'CHAMA_SAVINGS',
    tags: ['Chama', 'Smart Ledger', 'Financial Inclusion', 'MSME', 'Savings'],
    sources: [
      { id: 's3', title: 'Central Bank of Kenya National Financial Access Survey', url: 'https://centralbank.go.ke' }
    ],
    status: 'PUBLISHED',
    authorId: 'usr_kamau_02',
    authorName: 'Wanjiru Kamau',
    authorEmail: 'wanjiru@chama-advisors.ke',
    authorRole: 'CONTRIBUTOR',
    authorVerifiedBadge: false,
    publishedAt: '2026-09-18T11:00:00.000Z',
    createdAt: '2026-09-16T08:15:00.000Z',
    updatedAt: '2026-09-18T11:00:00.000Z',
    viewsCount: 1140,
    likesCount: 184,
    commentsCount: 29,
    savesCount: 76,
    tipsEarnedKes: 5100,
    pointsEarned: 520,
    aiPreReview: {
      overallScore: 88,
      plagiarismRisk: 'LOW',
      plagiarismDetails: 'Original financial journalism with primary survey interviews.',
      citationStatus: 'COMPLETE',
      citationNotes: 'CBK regulatory report cited.',
      aiAssistanceDetected: false,
      aiAssistanceConfidence: 15,
      keyTakeaways: [
        'Physical ledger fatigue in open-air chamas caused frequent dispute delays.',
        'SMS and decentralized multi-signer workflows reduced dispute rates by 84%.',
        'Book closing time reduced from 3.5 hours to 18 minutes per cycle.'
      ],
      factualClaims: [
        { claim: 'Dispute rates dropped by 84% across enrolled groups', status: 'VERIFIED' }
      ],
      reviewedAt: '2026-09-17T12:00:00.000Z'
    },
    auditTrail: [
      {
        id: 'aud_03',
        articleId: 'art_seed_02',
        actorId: 'usr_kamau_02',
        actorName: 'Wanjiru Kamau',
        actorRole: 'CONTRIBUTOR',
        fromStatus: 'DRAFT',
        toStatus: 'SUBMITTED',
        notes: 'Submitted draft on Chama treasury optimization.',
        timestamp: '2026-09-17T12:00:00.000Z'
      },
      {
        id: 'aud_04',
        articleId: 'art_seed_02',
        actorId: 'usr_founder_01',
        actorName: 'Austin Namuye',
        actorRole: 'CHAIRPERSON',
        fromStatus: 'SUBMITTED',
        toStatus: 'PUBLISHED',
        notes: 'Approved for public circulation.',
        timestamp: '2026-09-18T11:00:00.000Z'
      }
    ]
  }
];

function getAllArticlesFromStorage(): PublishingArticle[] {
  if (typeof window === 'undefined') return SEED_ARTICLES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ARTICLES));
      return SEED_ARTICLES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_ARTICLES;
  } catch {
    return SEED_ARTICLES;
  }
}

function saveArticlesToStorage(articles: PublishingArticle[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
  }
}

export const publishingService = {
  /**
   * Fetch all publicly published articles
   */
  async getPublishedArticles(): Promise<PublishingArticle[]> {
    const all = getAllArticlesFromStorage();
    return all.filter(a => a.status === 'PUBLISHED');
  },

  /**
   * Fetch review queue for Editors & Chairpersons
   */
  async getReviewQueue(): Promise<PublishingArticle[]> {
    const all = getAllArticlesFromStorage();
    return all.filter(a => a.status === 'SUBMITTED');
  },

  /**
   * Fetch articles submitted or authored by a specific user
   */
  async getArticlesByAuthor(authorId: string): Promise<PublishingArticle[]> {
    const all = getAllArticlesFromStorage();
    return all.filter(a => a.authorId === authorId);
  },

  /**
   * Find single article by ID
   */
  async getArticleById(id: string): Promise<PublishingArticle | undefined> {
    const all = getAllArticlesFromStorage();
    return all.find(a => a.id === id);
  },

  /**
   * Find single article by slug
   */
  async getArticleBySlug(slug: string): Promise<PublishingArticle | undefined> {
    const all = getAllArticlesFromStorage();
    return all.find(a => a.slug === slug);
  },

  /**
   * Create or update a draft (Status: DRAFT)
   */
  async saveDraft(
    data: {
      id?: string;
      title: string;
      summary: string;
      content: string;
      coverImageUrl?: string;
      contentType: ContentType;
      category: ContentCategory;
      tags: string[];
      sources: ArticleSource[];
    },
    author: HubUser
  ): Promise<PublishingArticle> {
    const all = getAllArticlesFromStorage();
    const now = new Date().toISOString();
    const id = data.id || `art_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || `post-${id}`;

    const existingIndex = all.findIndex(a => a.id === id);

    let article: PublishingArticle;

    if (existingIndex >= 0) {
      const existing = all[existingIndex];
      article = {
        ...existing,
        ...data,
        slug,
        status: existing.status === 'CHANGES_REQUESTED' ? 'DRAFT' : existing.status,
        updatedAt: now,
      };
      all[existingIndex] = article;
    } else {
      article = {
        id,
        slug,
        title: data.title,
        summary: data.summary,
        content: data.content,
        coverImageUrl: data.coverImageUrl,
        contentType: data.contentType,
        category: data.category,
        tags: data.tags,
        sources: data.sources,
        status: 'DRAFT',
        authorId: author.id,
        authorName: author.name,
        authorEmail: author.email,
        authorRole: author.role,
        authorVerifiedBadge: author.isVerified,
        createdAt: now,
        updatedAt: now,
        viewsCount: 0,
        likesCount: 0,
        commentsCount: 0,
        savesCount: 0,
        tipsEarnedKes: 0,
        pointsEarned: 0,
        auditTrail: [
          {
            id: `aud_${Date.now()}`,
            articleId: id,
            actorId: author.id,
            actorName: author.name,
            actorRole: author.role,
            fromStatus: 'DRAFT',
            toStatus: 'DRAFT',
            notes: 'Draft created.',
            timestamp: now,
          }
        ],
      };
      all.unshift(article);
    }

    saveArticlesToStorage(all);
    return article;
  },

  /**
   * Submit article for editor review (Triggers AI Pre-Review analysis first)
   */
  async submitForReview(articleId: string, actor: HubUser): Promise<PublishingArticle> {
    const all = getAllArticlesFromStorage();
    const article = all.find(a => a.id === articleId);
    if (!article) throw new Error('Article not found.');

    // Run automated AI Pre-Review
    const aiReport = await aiPreReviewService.analyzeArticle(
      article.title,
      article.content,
      article.sources,
      all.filter(a => a.id !== articleId)
    );

    const now = new Date().toISOString();
    const prevStatus = article.status;
    article.status = 'SUBMITTED';
    article.aiPreReview = aiReport;
    article.updatedAt = now;

    article.auditTrail.push({
      id: `aud_${Date.now()}`,
      articleId: article.id,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      fromStatus: prevStatus,
      toStatus: 'SUBMITTED',
      notes: `Article submitted. Automated AI pre-review score: ${aiReport.overallScore}/100.`,
      timestamp: now,
    });

    saveArticlesToStorage(all);
    return article;
  },

  /**
   * Editor Decision: Approve & Publish
   */
  async approveArticle(articleId: string, editor: HubUser, notes?: string): Promise<PublishingArticle> {
    if (!roleService.can(editor.role, 'canApproveArticle')) {
      throw new Error(`Permission denied: ${editor.role} cannot approve articles.`);
    }

    const all = getAllArticlesFromStorage();
    const article = all.find(a => a.id === articleId);
    if (!article) throw new Error('Article not found.');

    const now = new Date().toISOString();
    const prevStatus = article.status;
    article.status = 'PUBLISHED';
    article.publishedAt = now;
    article.updatedAt = now;
    article.editorialFeedback = undefined;

    article.auditTrail.push({
      id: `aud_${Date.now()}`,
      articleId: article.id,
      actorId: editor.id,
      actorName: editor.name,
      actorRole: editor.role,
      fromStatus: prevStatus,
      toStatus: 'PUBLISHED',
      notes: notes || 'Approved for publication.',
      timestamp: now,
    });

    saveArticlesToStorage(all);
    return article;
  },

  /**
   * Editor Decision: Request Changes
   */
  async requestChanges(articleId: string, editor: HubUser, feedback: string): Promise<PublishingArticle> {
    if (!roleService.can(editor.role, 'canRequestChanges')) {
      throw new Error(`Permission denied: ${editor.role} cannot request changes.`);
    }

    const all = getAllArticlesFromStorage();
    const article = all.find(a => a.id === articleId);
    if (!article) throw new Error('Article not found.');

    const now = new Date().toISOString();
    const prevStatus = article.status;
    article.status = 'CHANGES_REQUESTED';
    article.editorialFeedback = feedback;
    article.updatedAt = now;

    article.auditTrail.push({
      id: `aud_${Date.now()}`,
      articleId: article.id,
      actorId: editor.id,
      actorName: editor.name,
      actorRole: editor.role,
      fromStatus: prevStatus,
      toStatus: 'CHANGES_REQUESTED',
      notes: `Editor requested revisions: ${feedback}`,
      timestamp: now,
    });

    saveArticlesToStorage(all);
    return article;
  },

  /**
   * Editor Decision: Reject Article
   */
  async rejectArticle(articleId: string, editor: HubUser, reason: string): Promise<PublishingArticle> {
    if (!roleService.can(editor.role, 'canRejectArticle')) {
      throw new Error(`Permission denied: ${editor.role} cannot reject articles.`);
    }

    const all = getAllArticlesFromStorage();
    const article = all.find(a => a.id === articleId);
    if (!article) throw new Error('Article not found.');

    const now = new Date().toISOString();
    const prevStatus = article.status;
    article.status = 'REJECTED';
    article.editorialFeedback = reason;
    article.updatedAt = now;

    article.auditTrail.push({
      id: `aud_${Date.now()}`,
      articleId: article.id,
      actorId: editor.id,
      actorName: editor.name,
      actorRole: editor.role,
      fromStatus: prevStatus,
      toStatus: 'REJECTED',
      notes: `Submission rejected: ${reason}`,
      timestamp: now,
    });

    saveArticlesToStorage(all);
    return article;
  },

  /**
   * Delete an article
   */
  async deleteArticle(articleId: string, actor: HubUser): Promise<void> {
    const all = getAllArticlesFromStorage();
    const article = all.find(a => a.id === articleId);
    if (!article) return;

    const isAuthor = article.authorId === actor.id;
    const canDeleteAny = roleService.can(actor.role, 'canDeleteAnyArticle');

    if (!isAuthor && !canDeleteAny) {
      throw new Error('Permission denied: You cannot delete this article.');
    }

    const filtered = all.filter(a => a.id !== articleId);
    saveArticlesToStorage(filtered);
  },

  /**
   * Like an article (increases like counter & rewards author points)
   */
  async likeArticle(articleId: string): Promise<void> {
    const all = getAllArticlesFromStorage();
    const article = all.find(a => a.id === articleId);
    if (!article) return;

    article.likesCount += 1;
    article.pointsEarned += 5; // PRD Section 5: Attention value
    saveArticlesToStorage(all);
  },

  /**
   * Tip an article (records KES tip amount & points)
   */
  async tipArticle(articleId: string, amountKes: number): Promise<void> {
    const all = getAllArticlesFromStorage();
    const article = all.find(a => a.id === articleId);
    if (!article) return;

    article.tipsEarnedKes += amountKes;
    article.pointsEarned += Math.round(amountKes * 0.1);
    saveArticlesToStorage(all);
  },
};
