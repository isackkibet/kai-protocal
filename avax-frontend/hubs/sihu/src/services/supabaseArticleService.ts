/**
 * Deprecated: Use articleService directly.
 * Preserved for backwards compatibility, redirected to articleService.
 */
import { articleService } from './articleService';
import { Article } from '../constants/articles';

export const supabaseArticleService = {
  getArticles: async (): Promise<Article[]> => {
    return articleService.getArticles();
  },

  getArticleById: async (id: string): Promise<Article | undefined> => {
    return articleService.getArticleById(id);
  },

  addArticle: async (article: Article): Promise<void> => {
    return articleService.addArticle(article);
  },

  updateArticle: async (id: string, updated: Partial<Article>): Promise<void> => {
    return articleService.updateArticle(id, updated);
  },

  deleteArticle: async (id: string): Promise<void> => {
    return articleService.deleteArticle(id);
  }
};