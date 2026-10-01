import { NextResponse } from 'next/server';
import { runKai, BrainUnavailableError } from '@/lib/ai/brain';
import { verifyPrivyUserId } from '@/lib/auth/privy-server';
import { requireRateLimit } from '@/lib/security/route-guard';
import { readJsonBody, InputError } from '@/lib/security/input';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * POST /api/workspace/chat — the Kanuvari AI workspace (/workspace).
 *
 * Body: { message, history?, project?, wallet?, language? }
 * Answers with Server-Sent Events, in this order, so the orb can show what
 * is happening while it happens:
 *   {"status":"thinking"}           — the model is working
 *   {"tool":"get_seedling_inventory"} — each tool as it starts
 *   {"plan":{…}}                    — a record draft to review (nothing saved)
 *   {"token":"…"}                   — the answer, word by word
 *   {"done":true,"provider":"…","tools":[…]} | {"error":"…"}
 * Same brain, tools and rules as /api/chat; writes still need the user's
 * confirmation on the card, which calls the normal /api/cfa routes.
 */
const enc = new TextEncoder();
const frame = (o: unknown) => enc.encode(`data: ${JSON.stringify(o)}\n\n`);

export async function POST(req: Request) {
  const limited = await requireRateLimit(req, [{ scope: 'ip', limit: 20, windowMs: 60_000 }]);
  if (!limited.ok) return limited.response;

  let body: { message?: unknown; history?: unknown; project?: unknown; wallet?: unknown; language?: unknown; scope?: unknown };
  try {
    body = (await readJsonBody(req, 64 * 1024)) as typeof body;
  } catch (e) {
    return NextResponse.json({ error: e instanceof InputError ? e.message : 'Invalid JSON body' }, { status: 400 });
  }
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) return NextResponse.json({ error: 'message is required' }, { status: 400 });
  if (message.length > 8000) return NextResponse.json({ error: 'Message is too long.' }, { status: 400 });
  const project = typeof body.project === 'string' ? body.project.trim().slice(0, 120) : '';
  const wallet = typeof body.wallet === 'string' && /^0x[0-9a-fA-F]{40}$/.test(body.wallet) ? body.wallet : null;
  const swahili = body.language === 'sw';
  const privyUserId = await verifyPrivyUserId(req.headers.get('authorization')).catch(() => null);

  const pageContext = [
    'The user is in the Kanuvari AI workspace. Writes are shown as a draft card they review, can edit, and confirm.',
    project ? `Current project (nursery): ${project}. Use it as the nursery unless the user names another; it is shown on every draft.` : '',
    swahili ? 'The user chose Swahili: reply in Swahili (mixed Swahili-English is fine).' : '',
    body.scope === 'nursery'
      ? 'You are the NURSERY AI on the nursery page: help only with the CFA nursery (seedlings, planting, nursery work, survival, transfers, losses, evidence, verification, reports). For money, tokens, wallets or other app topics, say in one sentence that the main KAI assistant (the AI button, or /workspace) handles that.'
      : '',
  ].filter(Boolean).join('\n');

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const send = (o: unknown) => writer.write(frame(o)).catch(() => {});

  (async () => {
    try {
      await send({ status: 'thinking' });
      const result = await runKai({
        message, history: body.history, mode: 'chat', privyUserId, wallet, pageContext,
        onToolStart: (tool) => { void send({ tool }); },
      });
      for (const plan of result.plans) await send({ plan });
      const words = (result.text || '').split(' ');
      for (let i = 0; i < words.length; i++) {
        await send({ token: (i ? ' ' : '') + words[i] });
        await new Promise((r) => setTimeout(r, 12));
      }
      await send({ done: true, provider: result.provider, tools: result.toolsUsed });
    } catch (e) {
      if (!(e instanceof BrainUnavailableError)) console.error('[workspace/chat]', e instanceof Error ? e.message : e);
      await send({ error: "Kanuvari AI is temporarily unavailable. Nothing was saved. Please try again in a few minutes." });
    } finally {
      await writer.close().catch(() => {});
    }
  })();

  return new Response(readable, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' },
  });
}
