import { NextResponse, type NextRequest } from 'next/server';
import { requireMember } from '@/lib/guardian/http';
import { handleMessage, sanitizeHistory } from '@/lib/guardian/assistant';
import { getQuota } from '@/lib/guardian/quota';

// Allow time for a few rounds of tool calls with the AI provider.
export const maxDuration = 60;

/** One AI Guardian turn, by text or voice (the client sends the transcript). */
export async function POST(request: NextRequest) {
  const auth = await requireMember(request);
  if ('response' in auth) return auth.response;
  const { viewer } = auth;

  const body = await request.json().catch(() => null);
  const message = typeof body?.message === 'string' ? body.message.trim().slice(0, 1000) : '';
  if (!message) return NextResponse.json({ error: 'Please type or say something.' }, { status: 400 });
  const channel = body?.channel === 'voice' ? 'voice' : 'text';

  try {
    const result = await handleMessage(viewer, message, sanitizeHistory(body?.history), channel);
    const quota = await getQuota(viewer.user.id, viewer.role);
    return NextResponse.json({ ...result, quota }, { status: result.mode === 'limit' ? 429 : 200 });
  } catch (err) {
    console.error('[guardian] chat failed:', err);
    return NextResponse.json({ error: 'AI Guardian could not answer right now. Your prompt was not used. Please try again.' }, { status: 503 });
  }
}
