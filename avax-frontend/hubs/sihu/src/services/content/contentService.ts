/**
 * Content Service
 * Handles all content operations (articles, podcasts, events)
 * Uses client-side LocalStorage and default assets with zero external DB dependencies
 */

import { Article, Podcast, Event, ApiResponse } from '@/types';
import { defaultArticles, defaultPodcasts } from '@/constants/articles';

const ARTICLES_KEY = 'sango_articles';
const PODCASTS_KEY = 'sango_podcasts';
const EVENTS_KEY = 'sango_events';

const defaultEvents: Event[] = [
  {
    id: '1',
    title: 'Lake Victoria Basin Community Assembly',
    description: 'Quarterly forum on riparian conservation and green livelihoods.',
    date: '2026-10-15',
    time: '10:00 AM',
    location: 'Kisumu Community Centre',
    createdAt: new Date().toISOString()
  }
];

function getStored<T>(key: string, fallback: T[]): T[] {
  if (typeof window === 'undefined') return fallback;
  const raw = localStorage.getItem(key);
  if (!raw) {
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, data: T[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data));
  }
}

export const contentService = {
  /**
   * Get all articles
   */
  async getArticles(): Promise<ApiResponse<Article[]>> {
    try {
      const articles = getStored(ARTICLES_KEY, defaultArticles as unknown as Article[]);
      return { success: true, data: articles };
    } catch {
      return { success: false, error: 'Failed to fetch articles' };
    }
  },

  /**
   * Get article by ID
   */
  async getArticleById(id: string): Promise<ApiResponse<Article>> {
    try {
      const articles = getStored(ARTICLES_KEY, defaultArticles as unknown as Article[]);
      const found = articles.find(a => a.id === id);
      if (!found) {
        return { success: false, error: 'Article not found' };
      }
      return { success: true, data: found };
    } catch {
      return { success: false, error: 'Failed to fetch article' };
    }
  },

  /**
   * Get all podcasts
   */
  async getPodcasts(): Promise<ApiResponse<Podcast[]>> {
    try {
      const podcasts = getStored(PODCASTS_KEY, defaultPodcasts as unknown as Podcast[]);
      return { success: true, data: podcasts };
    } catch {
      return { success: false, error: 'Failed to fetch podcasts' };
    }
  },

  /**
   * Get all events
   */
  async getEvents(): Promise<ApiResponse<Event[]>> {
    try {
      const events = getStored(EVENTS_KEY, defaultEvents);
      return { success: true, data: events };
    } catch {
      return { success: false, error: 'Failed to fetch events' };
    }
  },

  /**
   * Create new article (admin only)
   */
  async createArticle(
    article: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ApiResponse<Article>> {
    try {
      const articles = getStored(ARTICLES_KEY, defaultArticles as unknown as Article[]);
      const now = new Date().toISOString();
      const newArticle: Article = {
        ...article,
        id: Date.now().toString(),
        createdAt: now,
        updatedAt: now,
      };
      setStored(ARTICLES_KEY, [newArticle, ...articles]);
      return { success: true, data: newArticle };
    } catch {
      return { success: false, error: 'Failed to create article' };
    }
  },

  /**
   * Update article (admin only)
   */
  async updateArticle(
    id: string,
    updates: Partial<Article>
  ): Promise<ApiResponse<Article>> {
    try {
      const articles = getStored(ARTICLES_KEY, defaultArticles as unknown as Article[]);
      const index = articles.findIndex(a => a.id === id);
      if (index === -1) {
        return { success: false, error: 'Article not found' };
      }
      const updatedArticle: Article = {
        ...articles[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      articles[index] = updatedArticle;
      setStored(ARTICLES_KEY, articles);
      return { success: true, data: updatedArticle };
    } catch {
      return { success: false, error: 'Failed to update article' };
    }
  },

  /**
   * Delete article (admin only)
   */
  async deleteArticle(id: string): Promise<ApiResponse<null>> {
    try {
      const articles = getStored(ARTICLES_KEY, defaultArticles as unknown as Article[]);
      setStored(ARTICLES_KEY, articles.filter(a => a.id !== id));
      return { success: true, data: null };
    } catch {
      return { success: false, error: 'Failed to delete article' };
    }
  },
};
