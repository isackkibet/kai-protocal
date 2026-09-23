import type { AiCheck, AiReviewReport, ContentPost, PostDraftInput } from '@/lib/sihu-types';

/**
 * AI editorial pre-review for SIHU (PRD Part A §2–3).
 *
 * Runs BEFORE an editor decides, never after — the AI flags, summarizes and
 * prepares; a human holds final publishing authority. Checks are run over the
 * candidate's text and are intentionally deterministic and explainable so an
 * editor can see exactly why each signal fired. AI-generation detection is
 * explicitly a signal, never a verdict.
 */

const AI_TELLS = [
  /\bfurthermore\b/gi,
  /\bmoreover\b/gi,
  /\bdelve\b/gi,
  /\bunderscore[sd]?\b/gi,
  /\bpivotal\b/gi,
  /\blandscape shortage\b/gi,
  /\bin conclusion\b/gi,
  /\bit is important to note\b/gi,
  /\bin today's fast[- ]paced\b/gi,
  /\bseamless\b/gi,
  /\brobust\b/gi,
  /\bcommence\b/gi,
  /\bcultivate\b/gi,
];

const NUMERIC_CLAIM = /\d+(?:[.,]\d+)?\s*(?:%|percent|KES|trees|hectares|tons?|kg|acres?|credits?)/i;
const LINK = /https?:\/\/[^\s\)\]"'<>]+/gi;
const ATTRIBUTION = /(?:according to|source|sources|reported by|per the|data from|reference|ref|research|study|publication|journal|outline|cited)/i;
const SUPPLERLATIVES = /(?:guaranteed|never fails|always|100%|best (?:option|way)|proven to|definitely)/gi;
const DUP_SENTENCE_BOUNDARY = /(?<=[.!?])\s+/;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function shingles(text: string, n = 4): Set<string> {
  const words = normalize(text).split(' ');
  const out = new Set<string>();
  for (let i = 0; i <= words.length - n; i++) out.add(words.slice(i, i + n).join(' '));
  return out;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const v of a) if (b.has(v)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function duplicatedSentences(text: string): { sentence: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const raw of text.split(DUP_SENTENCE_BOUNDARY)) {
    const s = normalize(raw);
    if (s.length > 12) counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, c]) => c > 1)
    .map(([s, c]) => ({ sentence: s.slice(0, 90), count: c }));
}

function citationScore(body: string): string[] {
  const mentions = (body.match(ATTRIBUTION) ?? []).length;
  const links = body.match(LINK) ?? [];
  const flagged: string[] = [];
  if (links.length === 0 && mentions === 0) {
    flagged.push('No links or attribution cues found anywhere in the body.');
  } else if (links.length === 0) {
    flagged.push(`No hyperlinks; only ${mentions} attribution cue(s). Consider citing sources.`);
  }
  return flagged;
}

export function runAiPreReview(
  candidate: Pick<PostDraftInput, 'title' | 'body'>,
  published: Pick<ContentPost, 'slug' | 'title' | 'body'>[],
): AiReviewReport {
  const checks: AiCheck[] = [];
  const title = candidate.title ?? '';
  const body = candidate.body ?? '';

  // 1. Duplication / plagiarism against existing hub content.
  const dup = published
    .map(p => ({
      slug: p.slug,
      similarity: Math.max(jaccard(shingles(candidate.body), shingles(p.body ?? '')),
                           jaccard(shingles(candidate.title), shingles(p.title ?? '')),
                           jaccard(shingles(candidate.body), shingles(p.title ?? ''))),
    }))
    .sort((a, b) => b.similarity - a.similarity)[0];

  if (dup && dup.similarity > 0.5) {
    checks.push({
      code: 'DUPLICATE',
      label: 'Duplication / plagiarism',
      status: 'FAIL',
      detail: `High overlap (${Math.round(dup.similarity * 100)}%) with "${dup.slug.replaceAll('-', ' ')}". Likely duplicate content.`,
    });
  } else if (dup && dup.similarity > 0.3) {
    checks.push({
      code: 'DUPLICATE',
      label: 'Duplication / plagiarism',
      status: 'WARN',
      detail: `Notable overlap (${Math.round(dup.similarity * 100)}%) with "${dup.slug.replaceAll('-', ' ')}". Check for derivative material.`,
    });
  } else {
    checks.push({ code: 'DUPLICATE', label: 'Duplication / plagiarism', status: 'PASS', detail: 'No significant overlap with existing hub content.' });
  }

  // 2. Citation / source completeness.
  const cites = citationScore(body);
  if (cites.length > 0) {
    checks.push({ code: 'CITATIONS', label: 'Citations & sources', status: 'WARN', detail: cites.join(' ') });
  } else {
    checks.push({ code: 'CITATIONS', label: 'Citations & sources', status: 'PASS', detail: 'Sources cited or attributed in the body.' });
  }

  // 3. Unsupported claims — numeric/superlative claims without nearby attribution.
  const numericClaims = (body.match(NUMERIC_CLAIM) ?? []).length;
  const superlatives = (body.match(SUPPLERLATIVES) ?? []).length;
  const unsupported = [];
  if (numericClaims > 0) unsupported.push(`${numericClaims} numeric claim(s) detected; each should map to a source.`);
  if (superlatives > 0) unsupported.push(`${superlatives} absolute/superlative claim(s) detected.`);
  if (unsupported.length > 0) {
    checks.push({ code: 'UNSUPPORTED_CLAIMS', label: 'Unsupported claims', status: 'WARN', detail: unsupported.join(' ') });
  } else {
    checks.push({ code: 'UNSUPPORTED_CLAIMS', label: 'Unsupported claims', status: 'PASS', detail: 'No numeric or absolute claims flagged.' });
  }

  // 4. Consistency — title coverage + duplicated sentences.
  const titleWords = new Set(normalize(title).split(' ').filter(w => w.length > 3));
  const bodyWords = normalize(body).split(' ');
  let missingTitle = 0;
  for (const w of titleWords) if (!bodyWords.includes(w)) missingTitle++;
  const constr: string[] = [];
  if ((missingTitle / Math.max(1, titleWords.size)) > 0.5) {
    constr.push(`Title terms not covered in the body (${missingTitle} of ${titleWords.size}).`);
  }
  const dups = duplicatedSentences(body);
  if (dups.length) constr.push(`${dups.length} duplicated sentence block(s) in the body.`);
  if (constr.length) {
    checks.push({ code: 'CONSISTENCY', label: 'Title–body consistency', status: 'WARN', detail: constr.join(' ') });
  } else {
    checks.push({ code: 'CONSISTENCY', label: 'Title–body consistency', status: 'PASS', detail: 'Title is well covered by the body; no duplicated sentences.' });
  }

  // 5. Possible AI-generated content — signal only (never a verdict).
  let aiHits = 0;
  for (const re of AI_TELLS) aiHits += (body.match(re) ?? []).length;
  const aiLikelihood = Math.min(100, Math.round((aiHits / Math.max(1, body.split(' ').length)) * 4000));
  const suggestsDisclosure = aiLikelihood >= 40;
  if (suggestsDisclosure) {
    checks.push({
      code: 'AI_GENERATED',
      label: 'Possible AI-generated content',
      status: 'WARN',
      detail: `AI-tell signals detected (likelihood ~${aiLikelihood}%). Signal only — an editor should review the source. If AI-assisted, add an "AI-assisted" disclosure.`,
    });
  } else {
    checks.push({ code: 'AI_GENERATED', label: 'Possible AI-generated content', status: 'PASS', detail: 'No typical AI-tell patterns detected in this draft.' });
  }

  // 6. Suspicious / spammy patterns.
  const suspicious: string[] = [];
  const linkCounts = new Map<string, number>();
  for (const link of body.match(LINK) ?? []) linkCounts.set(link, (linkCounts.get(link) ?? 0) + 1);
  const repeated = [...linkCounts.entries()].filter(([, c]) => c >= 3);
  if (repeated.length) suspicious.push(`${repeated.length} link(s) repeated 3+ times.`);
  if (/^[A-Z0-9\s!?]+$/.test(title.trim()) && title.length > 20) suspicious.push('Title is entirely capital letters.');
  const bodyChars = body.replace(/\s/g, '');
  if (body.length > 0 && bodyChars.length < 30) suspicious.push('Body is very short (< 40 characters).');
  if (suspicious.length) {
    checks.push({ code: 'SUSPICIOUS', label: 'Suspicious patterns', status: 'FAIL', detail: suspicious.join(' ') });
  } else {
    checks.push({ code: 'SUSPICIOUS', label: 'Suspicious patterns', status: 'PASS', detail: 'No spam-like patterns detected.' });
  }

  // Overall readiness score (0–100). FAILs are heavy; WARNS are light.
  let score = 100;
  for (const c of checks) {
    if (c.status === 'FAIL') score -= 30;
    else if (c.status === 'WARN') score -= 10;
  }
  score = Math.max(0, Math.min(100, score));

  const failCount = checks.filter(c => c.status === 'FAIL').length;
  const warnCount = checks.filter(c => c.status === 'WARN').length;
  const verdict = failCount > 0 ? 'NOT_READY' : warnCount >= 2 ? 'REVISE' : 'READY';

  return {
    score,
    verdict,
    disclosure: suggestsDisclosure ? 'AI_ASSISTED' : 'HUMAN',
    summary: `${failCount} blocking issue(s), ${warnCount} review note(s). ${verdict === 'READY' ? 'Editor can proceed to a final decision.' : verdict === 'REVISE' ? 'Editor should address review notes before publishing.' : 'Editor should request changes before this can be published.'}`,
    checks,
    generatedAt: new Date().toISOString(),
  };
}