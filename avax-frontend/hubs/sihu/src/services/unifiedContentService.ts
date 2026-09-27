import {
  UnifiedContentItem,
  ContentType,
  ContentStatus,
  VerificationStatus,
  ContentCategory,
  Topic,
  ContentRevision,
  SearchFilterParams,
} from '@/types/contentHub';
import {
  SEED_CATEGORIES,
  SEED_TOPICS,
  SEED_CONTENT_ITEMS,
} from '@/constants/sihuContentSeed';

const STORAGE_KEY_CONTENT = 'sihu_unified_content_v1';
const STORAGE_KEY_REVISIONS = 'sihu_content_revisions_v1';
const STORAGE_KEY_AUDIT = 'sihu_audit_log_v1';

export interface AuditLogEntry {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  targetId: string;
  targetTitle: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

function getStored<T>(key: string, fallback: T[]): T[] {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, data: T[]): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Failed to persist to ${key}:`, e);
    }
  }
}

export const unifiedContentService = {
  /**
   * Get all categories
   */
  getCategories(): ContentCategory[] {
    return SEED_CATEGORIES;
  },

  /**
   * Get all topics
   */
  getTopics(): Topic[] {
    return SEED_TOPICS;
  },

  /**
   * Get all content items with optional filters
   */
  async getContentItems(params?: SearchFilterParams): Promise<UnifiedContentItem[]> {
    const items = getStored<UnifiedContentItem>(STORAGE_KEY_CONTENT, SEED_CONTENT_ITEMS);

    let filtered = items;

    // Filter by content type
    if (params?.contentType && params.contentType !== 'all') {
      filtered = filtered.filter((i) => i.contentType === params.contentType);
    }

    // Filter by category slug
    if (params?.categorySlug && params.categorySlug !== 'all') {
      filtered = filtered.filter(
        (i) => i.categorySlug === params.categorySlug || i.category?.slug === params.categorySlug
      );
    }

    // Filter by topic slug
    if (params?.topicSlug && params.topicSlug !== 'all') {
      filtered = filtered.filter((i) =>
        i.topics?.some((t) => t.slug === params.topicSlug)
      );
    }

    // Filter by verification status
    if (params?.verificationStatus && params.verificationStatus !== 'all') {
      filtered = filtered.filter((i) => i.verificationStatus === params.verificationStatus);
    }

    // Filter by query (text relevance)
    if (params?.query && params.query.trim()) {
      const q = params.query.toLowerCase().trim();
      filtered = filtered.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.excerpt.toLowerCase().includes(q) ||
          i.body.toLowerCase().includes(q) ||
          i.tags?.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    // Filter by location
    if (params?.location && params.location.trim()) {
      const loc = params.location.toLowerCase().trim();
      filtered = filtered.filter((i) =>
        i.event?.locationName?.toLowerCase().includes(loc) ||
        i.event?.address?.toLowerCase().includes(loc)
      );
    }

    // Sort order
    if (params?.sortBy === 'newest') {
      filtered.sort(
        (a, b) =>
          new Date(b.publishedAt || b.createdAt).getTime() -
          new Date(a.publishedAt || a.createdAt).getTime()
      );
    } else if (params?.sortBy === 'popular') {
      filtered.sort((a, b) => (b.viewsCount + b.bookmarksCount * 5) - (a.viewsCount + a.bookmarksCount * 5));
    }

    return filtered;
  },

  /**
   * Get single content item by slug
   */
  async getItemBySlug(slug: string): Promise<UnifiedContentItem | null> {
    const items = getStored<UnifiedContentItem>(STORAGE_KEY_CONTENT, SEED_CONTENT_ITEMS);
    return items.find((i) => i.slug === slug || i.id === slug) ?? null;
  },

  /**
   * Get items by type
   */
  async getItemsByType(type: ContentType): Promise<UnifiedContentItem[]> {
    return this.getContentItems({ contentType: type, sortBy: 'newest' });
  },

  /**
   * Create or update content item
   */
  async saveContentItem(
    itemData: Partial<UnifiedContentItem> & { title: string; contentType: ContentType }
  ): Promise<UnifiedContentItem> {
    const items = getStored<UnifiedContentItem>(STORAGE_KEY_CONTENT, SEED_CONTENT_ITEMS);
    const now = new Date().toISOString();

    const existingIndex = items.findIndex((i) => i.id === itemData.id);

    let savedItem: UnifiedContentItem;

    if (existingIndex >= 0) {
      const prev = items[existingIndex];
      // Save revision snapshot before updating
      this.recordRevision(
        prev.id,
        'Content item details updated by editor',
        prev
      );

      savedItem = {
        ...prev,
        ...itemData,
        updatedAt: now,
      };
      items[existingIndex] = savedItem;
    } else {
      const slug =
        itemData.slug ||
        itemData.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');

      savedItem = {
        id: itemData.id || `sihu-${Date.now()}`,
        contentType: itemData.contentType,
        slug,
        title: itemData.title,
        subtitle: itemData.subtitle,
        excerpt: itemData.excerpt || itemData.body?.slice(0, 160) || '',
        body: itemData.body || '',
        status: itemData.status || 'draft',
        visibility: itemData.visibility || 'public',
        categorySlug: itemData.categorySlug || 'news',
        category: SEED_CATEGORIES.find((c) => c.slug === itemData.categorySlug) || SEED_CATEGORIES[0],
        coverImageUrl: itemData.coverImageUrl || 'https://images.unsplash.com/photo-1544376798-89aa6b82c6cd?auto=format&fit=crop&w=1200&q=80',
        featured: !!itemData.featured,
        verificationStatus: itemData.verificationStatus || 'unverified',
        readingTimeMinutes: Math.max(1, Math.ceil((itemData.body?.length || 500) / 900)),
        viewsCount: 0,
        likesCount: 0,
        bookmarksCount: 0,
        publishedAt: itemData.status === 'published' ? now : undefined,
        createdAt: now,
        updatedAt: now,
        tags: itemData.tags || [],
        topics: itemData.topics || [],
        sources: itemData.sources || [],
        event: itemData.event,
        podcast: itemData.podcast,
        document: itemData.document,
      };
      items.unshift(savedItem);
    }

    setStored(STORAGE_KEY_CONTENT, items);

    this.logAudit({
      actorName: 'Editor',
      actorRole: 'editor',
      action: existingIndex >= 0 ? 'UPDATE_CONTENT' : 'CREATE_CONTENT',
      targetId: savedItem.id,
      targetTitle: savedItem.title,
      timestamp: now,
    });

    return savedItem;
  },

  /**
   * Transition content status with audit trail
   */
  async setStatus(
    id: string,
    status: ContentStatus,
    changeSummary: string = `Status changed to ${status}`
  ): Promise<UnifiedContentItem | null> {
    const items = getStored<UnifiedContentItem>(STORAGE_KEY_CONTENT, SEED_CONTENT_ITEMS);
    const item = items.find((i) => i.id === id);
    if (!item) return null;

    const prevStatus = item.status;
    this.recordRevision(item.id, changeSummary, item);

    item.status = status;
    item.updatedAt = new Date().toISOString();
    if (status === 'published' && !item.publishedAt) {
      item.publishedAt = new Date().toISOString();
    }

    setStored(STORAGE_KEY_CONTENT, items);

    this.logAudit({
      actorName: 'Editor',
      actorRole: 'editor',
      action: `STATUS_CHANGE_${prevStatus}_TO_${status}`,
      targetId: item.id,
      targetTitle: item.title,
      timestamp: new Date().toISOString(),
      details: { from: prevStatus, to: status, notes: changeSummary },
    });

    return item;
  },

  /**
   * Update verification status (Section 9)
   */
  async setVerificationStatus(
    id: string,
    status: VerificationStatus
  ): Promise<UnifiedContentItem | null> {
    const items = getStored<UnifiedContentItem>(STORAGE_KEY_CONTENT, SEED_CONTENT_ITEMS);
    const item = items.find((i) => i.id === id);
    if (!item) return null;

    item.verificationStatus = status;
    item.reviewedAt = new Date().toISOString();
    item.updatedAt = new Date().toISOString();
    setStored(STORAGE_KEY_CONTENT, items);

    this.logAudit({
      actorName: 'Editor',
      actorRole: 'editor',
      action: 'UPDATE_VERIFICATION_STATUS',
      targetId: item.id,
      targetTitle: item.title,
      timestamp: new Date().toISOString(),
      details: { newStatus: status },
    });

    return item;
  },

  /**
   * Record revision snapshot
   */
  recordRevision(
    contentItemId: string,
    summary: string,
    snapshot: UnifiedContentItem
  ): void {
    const revisions = getStored<ContentRevision>(STORAGE_KEY_REVISIONS, []);
    const itemRevs = revisions.filter((r) => r.contentItemId === contentItemId);
    const nextVer = itemRevs.length + 1;

    const rev: ContentRevision = {
      id: `rev-${Date.now()}`,
      contentItemId,
      versionNumber: nextVer,
      editorName: 'Editor',
      changeSummary: summary,
      createdAt: new Date().toISOString(),
      snapshot: snapshot as unknown as Record<string, unknown>,
    };
    revisions.unshift(rev);
    setStored(STORAGE_KEY_REVISIONS, revisions);
  },

  /**
   * Get revisions for item
   */
  getRevisions(contentItemId: string): ContentRevision[] {
    const revisions = getStored<ContentRevision>(STORAGE_KEY_REVISIONS, []);
    return revisions.filter((r) => r.contentItemId === contentItemId);
  },

  /**
   * Audit logging
   */
  logAudit(entry: Omit<AuditLogEntry, 'id'>): void {
    const logs = getStored<AuditLogEntry>(STORAGE_KEY_AUDIT, []);
    logs.unshift({
      ...entry,
      id: `audit-${Date.now()}`,
    });
    setStored(STORAGE_KEY_AUDIT, logs.slice(0, 100)); // retain 100 recent
  },

  /**
   * Get recent audit logs
   */
  getAuditLogs(): AuditLogEntry[] {
    return getStored<AuditLogEntry>(STORAGE_KEY_AUDIT, []);
  },
};
