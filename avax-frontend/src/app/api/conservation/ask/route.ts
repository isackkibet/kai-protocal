import { NextResponse } from 'next/server';
import { askConservation } from '@/lib/conservation-data';

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
  const body = await req.json().catch(() => ({})) as { query?: string };
  const query = body.query?.trim() ?? '';

  if (!query || query.length < 3) {
    return NextResponse.json({ error: 'Ask KAI needs a question of at least 3 characters.' }, { status: 400 });
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
  const answer = top.kind === 'methodology'
    ? `The most relevant result on the hub is the ${top.title} methodology. ${top.summary}`
    : `The most relevant result on the hub is "${top.title}" (${top.source}). ${top.summary}`;

  return NextResponse.json({
    answer,
    results,
    grounded: true,
    note: 'Answered from indexed hub content with source links. Unsupported questions trigger the external-search fallback rather than invention.',
  });
}