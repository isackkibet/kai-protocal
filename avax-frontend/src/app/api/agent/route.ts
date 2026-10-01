import { NextResponse } from 'next/server';
import { KAI_ORCHESTRATOR_DID } from '@/lib/agent/escrowAbi';
import { appendFile } from 'node:fs/promises';
import { join } from 'node:path';
import { runKai, BrainUnavailableError } from '@/lib/ai/brain';
import { verifyPrivyUserId } from '@/lib/auth/privy-server';
import { readJsonBody, InputError } from '@/lib/security/input';
import { isAuthorizedAdmin } from '@/lib/auth/admin-auth';

/**
 * POST /api/agent — KAI Voice Agent (PRD §3, §5, §10, §20).
 *
 * Body: { message, wallet?, terse?, history? }
 *   history — earlier turns of this conversation from the user's browser.
 *
 * Answers come from the shared KAI brain (lib/ai/brain.ts), the same one
 * behind /api/chat: read-only data tools, and "prepare_*" tools that return a
 * PLAN, emitted to the client as an `approval` SSE event — never executed
 * here. Final narration is streamed as SSE `data: {"token": ...}` events.
 *
 * The agent NEVER signs or sends transactions. The user's wallet is the
 * authority (MetaMask/Core signatures), and approval cards run on the client.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function sse(message: string, event?: string): string {
  return event ? `event: ${event}\ndata: ${message}\n\n` : `data: ${message}\n\n`;
}

// ── DID audit trail ───────────────────────────────────────────────────────────
const AUDIT_FILE = join(process.cwd(), '.agent-audit.jsonl');
const AUDIT_RING: Record<string, unknown>[] = [];

function audit(entry: Record<string, unknown>) {
  const line = JSON.stringify({
    did: KAI_ORCHESTRATOR_DID,
    at: new Date().toISOString(),
    ...entry,
  });
  AUDIT_RING.push(JSON.parse(line));
  if (AUDIT_RING.length > 200) AUDIT_RING.shift();
  appendFile(AUDIT_FILE, `${line}\n`).catch(() => {});
}

export async function POST(req: Request) {
  const encoder = new TextEncoder();

  const streamAndFinish = (reply: string, approvals: Record<string, unknown>[]) => {
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    (async () => {
      try {
        for (const plan of approvals) {
          await writer.write(encoder.encode(sse(JSON.stringify({ plan }), 'approval')));
        }
        const text = reply || '*Approval required above.*';
        const words = text.split(' ');
        for (const word of words) {
          await writer.write(encoder.encode(sse(JSON.stringify({ token: word === words[0] ? word : ` ${word}` }))));
          await new Promise((r) => setTimeout(r, 14));
        }
        await writer.write(encoder.encode(sse(JSON.stringify({ done: true, sources: approvals.length }))));
      } finally {
        await writer.close();
      }
    })();
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  };

  let body: { message?: unknown; wallet?: unknown; terse?: unknown; history?: unknown };
  try {
    body = (await readJsonBody(req, 64 * 1024)) as typeof body;
  } catch (err) {
    return NextResponse.json({ error: err instanceof InputError ? err.message : 'Invalid JSON body' }, { status: 400 });
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) return NextResponse.json({ error: 'message is required' }, { status: 400 });
  if (message.length > 8000) return NextResponse.json({ error: 'Message is too long.' }, { status: 400 });

  const terse = body.terse === true;
  const wallet = typeof body.wallet === 'string' ? body.wallet.trim() : '';
  const privyUserId = await verifyPrivyUserId(req.headers.get('authorization')).catch(() => null);

  try {
    const result = await runKai({
      message,
      history: body.history,
      mode: terse ? 'voice' : 'chat',
      privyUserId,
      wallet: wallet || null,
    });
    for (const name of result.toolsUsed) audit({ event: 'tool_call', tool: name, wallet: wallet || null });
    for (const plan of result.plans) audit({ event: 'approval_request', payload: plan, wallet: wallet || null });
    audit({ event: 'reply', text: result.text, planCount: result.plans.length, provider: result.provider, wallet: wallet || null });
    // Spoken replies: strip markdown so text-to-speech doesn't read symbols.
    const text = terse ? result.text.replace(/[*_`#>|]+/g, '').replace(/\s{2,}/g, ' ').trim() : result.text;
    return streamAndFinish(text, result.plans);
  } catch (err) {
    if (err instanceof BrainUnavailableError) {
      return streamAndFinish(
        'KAI is online, but no AI provider is reachable right now. If your request involves money, nothing was sent. Please try again shortly.',
        [],
      );
    }
    console.error('[/api/agent]', err instanceof Error ? err.message : err);
    return streamAndFinish(
      'I hit a temporary issue reaching the AI model. If your request involves money, I did not send anything. Please try again.',
      [],
    );
  }
}

/**
 * GET /api/agent — the agent's DID audit trail (last 100 entries).
 * Admin-only: entries contain users' wallet addresses, questions and payment
 * plans, which must not be readable by anyone who finds the URL.
 */
export async function GET(req: Request) {
  if (!isAuthorizedAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({
    did: KAI_ORCHESTRATOR_DID,
    count: AUDIT_RING.length,
    entries: AUDIT_RING.slice(-100),
  });
}
