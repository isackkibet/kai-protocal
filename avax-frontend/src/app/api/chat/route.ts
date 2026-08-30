import { NextResponse } from 'next/server';

// Vercel Hobby plan cap is 300s
export const maxDuration = 300;

const RAG_API_URL  = process.env.RAG_API_URL   || 'http://localhost:8000';
const OLLAMA_URL   = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL   || 'qwen3:1.7b';

const SYSTEM_PROMPT = `You are KAI, a premium AI advisor for the KAI Nuvari DeFi ecosystem on Avalanche C-Chain.
You help users with:
- KAI ecosystem tokens: KAI (governance), KES (stablecoin), NUV (vault), KPEN (pension), KTRUST (trust fund)
- DeFi vaults and yield strategies on Nuvari AMM (1 AVAX = 100 ecosystem tokens)
- KAI DAO governance, token burns, and fee model
- KAI Micro-Pension, Micro-Insurance, and Trust Fund smart contracts
- Avalanche C-Chain development (Fuji testnet, Snowtrace, MetaMask, Core Wallet)

Keep answers concise, professional, and friendly. Use bullet points where helpful.`;

// ── POST /api/chat ─────────────────────────────────────────────────────────────
// Accepts { message, rag, stream? }
// When stream=true  → proxies the FastAPI /stream SSE and returns a ReadableStream
// When stream=false → calls /chat for a JSON response (legacy/fallback)
export async function POST(req: Request) {
  try {
    const { message, rag = true, stream = true } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // ── Streaming path ─────────────────────────────────────────────────────────
    if (stream) {
      // Try FastAPI /stream endpoint first
      try {
        const ragRes = await fetch(`${RAG_API_URL}/stream`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ message, rag }),
          // No AbortSignal — we forward the stream; the browser controls lifetime
        });

        if (ragRes.ok && ragRes.body) {
          return new Response(ragRes.body, {
            headers: {
              'Content-Type':  'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection':    'keep-alive',
              'X-Accel-Buffering': 'no',
            },
          });
        }
      } catch {
        // FastAPI offline — fall through to Ollama direct stream
      }

      // Fallback: stream directly from Ollama
      const ollamaRes = await fetch(`${OLLAMA_URL}/api/generate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model:   OLLAMA_MODEL,
          prompt:  `${SYSTEM_PROMPT}\n\nUser: ${message}\nKAI:`,
          stream:  true,
          think:   false,
          options: { num_predict: 1024 },
        }),
      });

      if (!ollamaRes.ok || !ollamaRes.body) {
        throw new Error(`Ollama stream error: ${ollamaRes.status}`);
      }

      // Transform Ollama NDJSON → SSE format
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();

      (async () => {
        const reader = ollamaRes.body!.getReader();
        const dec = new TextDecoder();
        let buf = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });
            const lines = buf.split('\n');
            buf = lines.pop() ?? '';
            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const chunk = JSON.parse(line);
                const token = chunk.response ?? '';
                if (token) {
                  await writer.write(encoder.encode(
                    `data: ${JSON.stringify({ token })}\n\n`
                  ));
                }
                if (chunk.done) {
                  await writer.write(encoder.encode(
                    `data: ${JSON.stringify({ done: true, sources: 0 })}\n\n`
                  ));
                }
              } catch { /* skip malformed chunks */ }
            }
          }
        } finally {
          await writer.close();
        }
      })();

      return new Response(readable, {
        headers: {
          'Content-Type':  'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection':    'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      });
    }

    // ── Non-streaming (legacy JSON) path ────────────────────────────────────────
    if (rag) {
      const ragRes = await fetch(`${RAG_API_URL}/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message, rag: true }),
        signal:  AbortSignal.timeout(290_000),
      });
      if (!ragRes.ok) throw new Error(`RAG server error (${ragRes.status})`);
      const ragData = await ragRes.json();
      return NextResponse.json({
        text:         ragData.text,
        agent:        ragData.agent || 'KAI AVAX Agent',
        rag_used:     true,
        sources_count: ragData.sources_count ?? 0,
      });
    }

    const ollamaRes = await fetch(`${OLLAMA_URL}/api/generate`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:   OLLAMA_MODEL,
        prompt:  `${SYSTEM_PROMPT}\n\nUser: ${message}\nKAI:`,
        stream:  false,
        think:   false,
        options: { num_predict: 1024 },
      }),
      signal: AbortSignal.timeout(290_000),
    });
    if (!ollamaRes.ok) throw new Error(`Ollama error: ${ollamaRes.status}`);
    const ollamaData = await ollamaRes.json();
    return NextResponse.json({
      text:          ollamaData.response || 'No response.',
      agent:         'KAI AVAX Agent',
      rag_used:      false,
      sources_count: 0,
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[/api/chat]', msg);
    return NextResponse.json(
      { error: 'Failed to get a response.', details: msg },
      { status: 500 }
    );
  }
}
