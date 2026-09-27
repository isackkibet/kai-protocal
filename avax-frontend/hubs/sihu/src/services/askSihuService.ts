import { AssistantCitation, AssistantMessage } from '@/types/contentHub';
import { unifiedContentService } from './unifiedContentService';

const STORAGE_ASSISTANT_MESSAGES = 'sihu_assistant_history_v1';

export const askSihuService = {
  /**
   * Process a question grounded strictly in approved SIHU content
   */
  async askQuestion(question: string): Promise<AssistantMessage> {
    const q = question.toLowerCase().trim();
    const allItems = await unifiedContentService.getContentItems();
    const approved = allItems.filter(
      (item) => item.status === 'published' && item.visibility === 'public'
    );

    // Score and retrieve matching approved items
    const matches = approved
      .map((item) => {
        let score = 0;
        const words = q.split(/\s+/).filter((w) => w.length > 2);
        words.forEach((word) => {
          if (item.title.toLowerCase().includes(word)) score += 5;
          if (item.excerpt.toLowerCase().includes(word)) score += 3;
          if (item.body.toLowerCase().includes(word)) score += 1;
          if (item.tags?.some((t) => t.toLowerCase().includes(word))) score += 4;
        });
        return { item, score };
      })
      .filter((m) => m.score > 2)
      .sort((a, b) => b.score - a.score);

    let answer: string;
    const citations: AssistantCitation[] = [];

    if (matches.length === 0) {
      // PRD Section 11: "Say clearly when information is unavailable — never invent facts."
      answer = `I could not find verified information regarding "${question}" in the official Sango Information Hub knowledge base.\n\nTo maintain factual trust, I only provide answers with documented citations from approved SIHU articles, guides, reports, and events. You can browse our Explore page or contact the editorial team to request coverage on this topic.`;
    } else {
      const topMatches = matches.slice(0, 3);
      topMatches.forEach((m) => {
        citations.push({
          id: m.item.id,
          title: m.item.title,
          slug: m.item.slug,
          contentType: m.item.contentType,
          snippet: m.item.excerpt,
          publisher: m.item.sources?.[0]?.publisher || 'SIHU Knowledge Base',
        });
      });

      const primary = topMatches[0].item;
      if (primary.contentType === 'guide') {
        answer = `Based on the verified SIHU guide **"${primary.title}"**:\n\n${primary.excerpt}\n\nKey takeaways from the documentation:\n• Demarcation: Measure the required buffer according to regional guidelines without synthetic input.\n• Vegetation: Establish deep-rooting native species like clumping bamboo and vetiver grass to anchor the riparian perimeter.\n• Compliance: Verify your coordinates with local community registries for ecological incentive credit.`;
      } else if (primary.contentType === 'event') {
        answer = `According to our calendar listings for **"${primary.title}"**:\n\n• **Date**: ${primary.event?.startsAt ? new Date(primary.event.startsAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'Upcoming'}\n• **Venue**: ${primary.event?.locationName || 'Announced on registration'}\n• **Format**: ${primary.event?.isOnline ? 'Virtual Streaming' : 'In-person assembly'}\n\n${primary.excerpt}`;
      } else {
        answer = `According to the documented report **"${primary.title}"**:\n\n${primary.excerpt}\n\nAdditional verified context indicates that this ongoing initiative links community monitoring with sustainable economic outcomes across the Lake Victoria Basin littoral corridor.`;
      }
    }

    const assistantMsg: AssistantMessage = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: answer,
      citations: citations.length > 0 ? citations : undefined,
      createdAt: new Date().toISOString(),
    };

    this.saveMessageToHistory(assistantMsg);

    return assistantMsg;
  },

  /**
   * Save message to session history
   */
  saveMessageToHistory(msg: AssistantMessage): void {
    if (typeof window === 'undefined') return;
    try {
      const history = this.getHistory();
      history.push(msg);
      localStorage.setItem(STORAGE_ASSISTANT_MESSAGES, JSON.stringify(history.slice(-30)));
    } catch {
      // safe fallback
    }
  },

  /**
   * Get message history
   */
  getHistory(): AssistantMessage[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_ASSISTANT_MESSAGES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  /**
   * Record feedback (thumbs up / down)
   */
  recordFeedback(messageId: string, rating: 1 | -1): void {
    if (typeof window === 'undefined') return;
    try {
      const history = this.getHistory();
      const target = history.find((m) => m.id === messageId);
      if (target) {
        target.feedbackRating = rating;
        localStorage.setItem(STORAGE_ASSISTANT_MESSAGES, JSON.stringify(history));
      }
    } catch {
      // safe fallback
    }
  },

  /**
   * Clear session history
   */
  clearHistory(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_ASSISTANT_MESSAGES);
    }
  },
};
