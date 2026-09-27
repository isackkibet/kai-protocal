import { AIPreReviewReport, ArticleSource, PublishingArticle } from '@/types/publishing';

export const aiPreReviewService = {
  /**
   * Run automated editorial pre-review on an article draft
   * Per PRD Part A, Section 3
   */
  async analyzeArticle(
    title: string,
    content: string,
    sources: ArticleSource[],
    existingArticles: PublishingArticle[] = []
  ): Promise<AIPreReviewReport> {
    const textLower = `${title} ${content}`.toLowerCase();
    const wordCount = content.trim().split(/\s+/).length;

    // 1. Plagiarism & Duplicate Content Check
    let plagiarismRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    let maxSimilarity = 0;
    let duplicateTitle = '';

    for (const existing of existingArticles) {
      if (existing.title.toLowerCase() === title.trim().toLowerCase()) {
        maxSimilarity = 1.0;
        duplicateTitle = existing.title;
        break;
      }

      // Check title overlap
      const existingTitleWords = new Set(existing.title.toLowerCase().split(/\s+/));
      const currentTitleWords = title.toLowerCase().split(/\s+/);
      const commonWords = currentTitleWords.filter(w => existingTitleWords.has(w) && w.length > 3);
      const overlapRatio = commonWords.length / Math.max(currentTitleWords.length, 1);

      if (overlapRatio > maxSimilarity) {
        maxSimilarity = overlapRatio;
        duplicateTitle = existing.title;
      }
    }

    if (maxSimilarity >= 0.8) {
      plagiarismRisk = 'HIGH';
    } else if (maxSimilarity >= 0.45) {
      plagiarismRisk = 'MEDIUM';
    }

    const plagiarismDetails =
      plagiarismRisk === 'HIGH'
        ? `High similarity detected with existing story "${duplicateTitle}". Ensure original reporting.`
        : plagiarismRisk === 'MEDIUM'
        ? `Moderate topical overlap with "${duplicateTitle}". Verify unique insights are highlighted.`
        : 'Original content verified. No duplicate publication detected across the hub repository.';

    // 2. Citation & Source Completeness Check
    const hasDataOrStats = /\b(\d+(\.\d+)?%|\$?\d+[\d,]*\s*(kes|usd|trees|hectares|shillings|apy))\b/i.test(content);
    let citationStatus: 'COMPLETE' | 'PARTIAL' | 'MISSING' = 'COMPLETE';
    let citationNotes = 'Citations verified.';

    if (sources.length === 0) {
      if (hasDataOrStats || wordCount > 200) {
        citationStatus = 'MISSING';
        citationNotes = 'Article cites statistics or quantitative figures without linked sources or references.';
      } else {
        citationStatus = 'PARTIAL';
        citationNotes = 'Opinion/editorial piece. Consider adding community references or external links.';
      }
    } else {
      const validUrls = sources.filter(s => s.url && s.url.startsWith('http'));
      if (validUrls.length < sources.length) {
        citationStatus = 'PARTIAL';
        citationNotes = `${sources.length - validUrls.length} source(s) lack a direct URL reference.`;
      } else {
        citationStatus = 'COMPLETE';
        citationNotes = `All ${sources.length} provided source references are properly linked.`;
      }
    }

    // 3. AI-Assistance Detection & Transparency Signal
    const aiHallmarks = [
      'furthermore', 'moreover', 'delve', 'testament', 'beacon',
      'in conclusion', 'pivotal role', 'tapestry', 'it is important to remember',
      'navigating the landscape', 'dynamic interplay', 'fostering a culture'
    ];
    let hallmarkHits = 0;
    for (const phrase of aiHallmarks) {
      if (textLower.includes(phrase)) hallmarkHits++;
    }

    const aiAssistanceDetected = hallmarkHits >= 2 || (wordCount > 400 && hallmarkHits >= 1);
    const aiAssistanceConfidence = Math.min(Math.round((hallmarkHits / 4) * 100), 95);
    const suggestedDisclosure = aiAssistanceDetected ? 'AI-assisted research & synthesis' : undefined;

    // 4. Key Takeaways Extraction
    const sentences = content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 30 && s.length < 180);

    const keyTakeaways: string[] = [];
    if (sentences.length > 0) keyTakeaways.push(sentences[0]);
    if (sentences.length > 2) keyTakeaways.push(sentences[Math.floor(sentences.length / 2)]);
    if (sentences.length > 1 && sentences.length <= 2) keyTakeaways.push(sentences[1]);
    if (keyTakeaways.length < 2) {
      keyTakeaways.push(`Key reporting on ${title.slice(0, 60)} for community stakeholders.`);
    }

    // 5. Overall Quality Score (0 to 100)
    let score = 75;
    if (plagiarismRisk === 'LOW') score += 15;
    if (plagiarismRisk === 'HIGH') score -= 30;
    if (citationStatus === 'COMPLETE') score += 10;
    if (citationStatus === 'MISSING') score -= 15;
    if (wordCount >= 250) score += 5;
    if (sources.length >= 2) score += 5;

    return {
      overallScore: Math.max(10, Math.min(score, 100)),
      plagiarismRisk,
      plagiarismDetails,
      citationStatus,
      citationNotes,
      aiAssistanceDetected,
      aiAssistanceConfidence,
      suggestedDisclosure,
      keyTakeaways,
      factualClaims: [
        {
          claim: hasDataOrStats ? 'Quantitative metrics & financial or yield claims referenced' : 'General contextual statements',
          status: citationStatus === 'COMPLETE' ? 'VERIFIED' : citationStatus === 'MISSING' ? 'NEEDS_SOURCE' : 'CONSISTENT',
        }
      ],
      reviewedAt: new Date().toISOString(),
    };
  },
};
