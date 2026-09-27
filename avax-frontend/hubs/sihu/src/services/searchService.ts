import {
  UnifiedContentItem,
  SearchFilterParams,
  ContentType,
} from '@/types/contentHub';
import { unifiedContentService } from './unifiedContentService';

const STORAGE_RECENT_SEARCHES = 'sihu_recent_searches_v1';

export interface SearchResultSummary {
  items: UnifiedContentItem[];
  totalCount: number;
  facets: {
    byType: Record<ContentType, number>;
    byCategory: Record<string, number>;
  };
}

export const searchService = {
  /**
   * Search across all published content
   */
  async search(params: SearchFilterParams): Promise<SearchResultSummary> {
    const allPublished = await unifiedContentService.getContentItems({
      ...params,
      // Only published content in public searches
    });

    const publishedOnly = allPublished.filter(
      (item) => item.status === 'published' && item.visibility === 'public'
    );

    // Compute facets
    const byType = {} as Record<ContentType, number>;
    const byCategory = {} as Record<string, number>;

    publishedOnly.forEach((item) => {
      byType[item.contentType] = (byType[item.contentType] || 0) + 1;
      const cat = item.category?.slug || item.categorySlug || 'general';
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    });

    // Save recent search if query is non-empty
    if (params.query && params.query.trim().length > 1) {
      this.addRecentSearch(params.query.trim());
    }

    return {
      items: publishedOnly,
      totalCount: publishedOnly.length,
      facets: {
        byType,
        byCategory,
      },
    };
  },

  /**
   * Get search suggestions based on query
   */
  async getSuggestions(query: string): Promise<string[]> {
    if (!query || query.trim().length < 2) return [];
    const q = query.toLowerCase().trim();
    const items = await unifiedContentService.getContentItems();
    const titles = items
      .filter((i) => i.title.toLowerCase().includes(q))
      .map((i) => i.title)
      .slice(0, 5);

    const tags = items
      .flatMap((i) => i.tags || [])
      .filter((t) => t.toLowerCase().includes(q))
      .slice(0, 3);

    return Array.from(new Set([...titles, ...tags]));
  },

  /**
   * Get recent searches from localStorage
   */
  getRecentSearches(): string[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_RECENT_SEARCHES);
      return raw ? JSON.parse(raw) : ['Lake Victoria Biogas', 'Riparian 30-meter buffer', 'Chama Bookkeeping'];
    } catch {
      return [];
    }
  },

  /**
   * Add query to recent searches
   */
  addRecentSearch(query: string): void {
    if (typeof window === 'undefined') return;
    try {
      const current = this.getRecentSearches();
      const updated = [query, ...current.filter((q) => q.toLowerCase() !== query.toLowerCase())].slice(0, 8);
      localStorage.setItem(STORAGE_RECENT_SEARCHES, JSON.stringify(updated));
    } catch {
      // safe fallback
    }
  },

  /**
   * Clear recent searches
   */
  clearRecentSearches(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_RECENT_SEARCHES);
    }
  },
};
