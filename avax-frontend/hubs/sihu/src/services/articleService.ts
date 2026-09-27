import { Article, defaultArticles } from '../constants/articles';
import { publishingService } from './content/publishingService';

const STORAGE_KEY = 'sango_articles';

export const articleService = {
  getArticles: async (): Promise<Article[]> => {
    const local = getArticlesFromStorage();
    try {
      const published = await publishingService.getPublishedArticles();
      const mappedPublished: Article[] = published.map(p => ({
        id: p.id,
        title: p.title,
        excerpt: p.summary,
        content: p.content,
        author: p.authorName,
        category: p.category,
        image: p.coverImageUrl || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1200&auto=format&fit=crop&q=80',
        time: '5 min read',
        type: 'article' as const,
      }));

      // Combine and deduplicate
      const existingIds = new Set(mappedPublished.map(a => a.id));
      const remainingLocal = local.filter(a => !existingIds.has(a.id));
      return [...mappedPublished, ...remainingLocal];
    } catch {
      return local;
    }
  },

  getArticleById: async (id: string): Promise<Article | undefined> => {
    try {
      const p = await publishingService.getArticleById(id);
      if (p) {
        return {
          id: p.id,
          title: p.title,
          excerpt: p.summary,
          content: p.content,
          author: p.authorName,
          category: p.category,
          image: p.coverImageUrl || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1200&auto=format&fit=crop&q=80',
          time: '5 min read',
          type: 'article' as const,
        };
      }
    } catch { /* fallback */ }
    return getArticleByIdFromStorage(id);
  },

  addArticle: async (article: Article): Promise<void> => {
    addArticleToStorage(article);
  },

  updateArticle: async (id: string, updated: Partial<Article>): Promise<void> => {
    updateArticleInStorage(id, updated);
  },

  deleteArticle: async (id: string): Promise<void> => {
    deleteArticleFromStorage(id);
  }
};

// Local storage storage functions
const getArticlesFromStorage = (): Article[] => {
  if (typeof window === 'undefined') return defaultArticles;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    saveArticlesToStorage(defaultArticles);
    return defaultArticles;
  }
  try {
    const parsed = JSON.parse(stored);
    return parsed && parsed.length > 0 ? parsed : defaultArticles;
  } catch {
    return defaultArticles;
  }
};

const getArticleByIdFromStorage = (id: string): Article | undefined => {
  return getArticlesFromStorage().find(a => a.id === id);
};

const addArticleToStorage = (article: Article) => {
  const articles = getArticlesFromStorage();
  saveArticlesToStorage([article, ...articles.filter(a => a.id !== article.id)]);
};

const updateArticleInStorage = (id: string, updated: Partial<Article>) => {
  const articles = getArticlesFromStorage().map(a =>
    a.id === id ? { ...a, ...updated } : a
  );
  saveArticlesToStorage(articles);
};

const deleteArticleFromStorage = (id: string) => {
  const articles = getArticlesFromStorage().filter(a => a.id !== id);
  saveArticlesToStorage(articles);
};

const saveArticlesToStorage = (articles: Article[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
  }
};
