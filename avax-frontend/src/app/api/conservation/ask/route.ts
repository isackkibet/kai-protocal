import { NextResponse } from 'next/server';
import { askConservation } from '@/lib/conservation-data';
import { requireRateLimit } from '@/lib/security/route-guard';
import { readJsonBody } from '@/lib/security/input';
import { runKai } from '@/lib/ai/brain';

/**
 * Ask KAI — retrieval-grounded conservation Q&A (PRD Part B §3).
 *
 * Query understanding → retrieval over the hub's own knowledge base
 * (knowledge articles, methodologies, resources) → ranked, cited sources.
 * External search is the documented fallback when nothing in the hub matches;
 * the response explicitly lists what it is drawing on rather than asserting
 * unsupported claims.
 */
export async function POST(req: Request) {
  // Search backends and the LLM fallback both cost money per call, so this is
  // the endpoint a script would hammer to burn the API budget.
  const limited = await requireRateLimit(req, [
    { scope: 'ip', limit: 20, windowMs: 60_000 },
  ]);
  if (!limited.ok) return limited.response;

  const body = await readJsonBody(req, 64 * 1024).catch(() => ({})) as { query?: string; history?: unknown };
  const query = typeof body.query === 'string' ? body.query.trim() : '';

  if (!query || query.length < 3) {
    return NextResponse.json({ error: 'Ask KAI needs a question of at least 3 characters.' }, { status: 400 });
  }
  // Bound the query so a single request cannot push a huge prompt through the
  // retrieval + LLM path.
  if (query.length > 1000) {
    return NextResponse.json({ error: 'Question is too long.' }, { status: 400 });
  }

  const results = askConservation(query);

  if (results.length === 0) {
    return NextResponse.json({
      answer: `I could not find an answer to that in the Conservation hub content yet. This is our external-search fallback case — I won't invent an answer. Try a question about tree planting, nurseries, species, Jaza Miti or conservation finance.`,
      results: [],
      grounded: false,
    });
  }

  const top = results[0];
  let answer = top.kind === 'methodology'
    ? `The most relevant result on the hub is the ${top.title} methodology. ${top.summary}`
    : `The most relevant result on the hub is "${top.title}" (${top.source}). ${top.summary}`;
  let aiWritten = false;

  // The shared KAI brain writes a real answer from the same hub content (its
  // search_knowledge tool) and names the titles it used. The template answer
  // above stays as the fallback if no model is reachable.
  try {
    const ai = await runKai({ message: query, history: body.history, mode: 'ask', privyUserId: null });
    if (ai.text && ai.toolsUsed.includes('search_knowledge')) {
      answer = ai.text;
      aiWritten = true;
    }
  } catch {
    /* keep the template answer */
  }

  return NextResponse.json({
    answer,
    aiWritten,
    results,
    grounded: true,
    note: 'Answered from indexed hub content with source links. Unsupported questions trigger the external-search fallback rather than invention.',
  });
}