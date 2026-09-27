import { UnifiedContentItem } from '@/types/contentHub';
import { unifiedContentService } from './unifiedContentService';

const STORAGE_BOOKMARKS = 'sihu_user_bookmarks_v1';
const STORAGE_FOLLOWED_TOPICS = 'sihu_user_followed_topics_v1';
const STORAGE_READING_HISTORY = 'sihu_user_reading_history_v1';

export interface ReadingHistoryItem {
  contentItemId: string;
  title: string;
  slug: string;
  contentType: string;
  readAt: string;
  completed: boolean;
}

export const accountService = {
  /**
   * Get list of bookmarked content IDs
   */
  getBookmarkedIds(): string[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_BOOKMARKS);
      return raw ? JSON.parse(raw) : ['sihu-art-01', 'sihu-guide-01'];
    } catch {
      return [];
    }
  },

  /**
   * Check if an item is bookmarked
   */
  isBookmarked(contentItemId: string): boolean {
    return this.getBookmarkedIds().includes(contentItemId);
  },

  /**
   * Toggle bookmark status
   */
  toggleBookmark(contentItemId: string): boolean {
    if (typeof window === 'undefined') return false;
    const current = this.getBookmarkedIds();
    let updated: string[];
    let isNowBookmarked = false;

    if (current.includes(contentItemId)) {
      updated = current.filter((id) => id !== contentItemId);
      isNowBookmarked = false;
    } else {
      updated = [contentItemId, ...current];
      isNowBookmarked = true;
    }

    try {
      localStorage.setItem(STORAGE_BOOKMARKS, JSON.stringify(updated));
    } catch {
      // safe fallback
    }

    return isNowBookmarked;
  },

  /**
   * Get all bookmarked content items
   */
  async getBookmarkedItems(): Promise<UnifiedContentItem[]> {
    const ids = this.getBookmarkedIds();
    const all = await unifiedContentService.getContentItems();
    return all.filter((item) => ids.includes(item.id));
  },

  /**
   * Get followed topic slugs
   */
  getFollowedTopicSlugs(): string[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_FOLLOWED_TOPICS);
      return raw ? JSON.parse(raw) : ['riparian-conservation', 'water-security'];
    } catch {
      return [];
    }
  },

  /**
   * Toggle follow on a topic
   */
  toggleFollowTopic(topicSlug: string): boolean {
    if (typeof window === 'undefined') return false;
    const current = this.getFollowedTopicSlugs();
    let updated: string[];
    let isNowFollowing = false;

    if (current.includes(topicSlug)) {
      updated = current.filter((s) => s !== topicSlug);
      isNowFollowing = false;
    } else {
      updated = [...current, topicSlug];
      isNowFollowing = true;
    }

    try {
      localStorage.setItem(STORAGE_FOLLOWED_TOPICS, JSON.stringify(updated));
    } catch {
      // safe fallback
    }

    return isNowFollowing;
  },

  /**
   * Record reading history
   */
  recordReading(item: UnifiedContentItem, completed = false): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_READING_HISTORY);
      const history: ReadingHistoryItem[] = raw ? JSON.parse(raw) : [];

      const filtered = history.filter((h) => h.contentItemId !== item.id);
      filtered.unshift({
        contentItemId: item.id,
        title: item.title,
        slug: item.slug,
        contentType: item.contentType,
        readAt: new Date().toISOString(),
        completed,
      });

      localStorage.setItem(STORAGE_READING_HISTORY, JSON.stringify(filtered.slice(0, 30)));
    } catch {
      // safe fallback
    }
  },

  /**
   * Get reading history
   */
  getReadingHistory(): ReadingHistoryItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_READING_HISTORY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
};
