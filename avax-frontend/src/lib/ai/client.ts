/**
 * Browser-side helpers for talking to the KAI brain (/api/chat, /api/agent,
 * /api/conservation/ask). Each screen keeps its own conversation; these turn
 * it into the `history` the brain expects and attach the sign-in token so
 * "my points" / "my account" questions answer for the signed-in user.
 */

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * The last `max` turns of a screen's message list (`role` 'user' vs anything
 * else = the assistant). Skips the opening greeting and empty placeholder
 * bubbles. Call it with the list as it was BEFORE the new message — the new
 * message is sent separately as `message`.
 */
export function recentHistory(msgs: { role: string; text: string }[], max = 10): ChatTurn[] {
  return msgs
    .filter((m, i) => !(i === 0 && m.role !== 'user'))
    .filter((m) => typeof m.text === 'string' && m.text.trim() !== '')
    .map((m): ChatTurn => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text.trim().slice(0, 2000) }))
    .slice(-max);
}

/** { Authorization: Bearer … } when signed in, else {}. Never throws. */
export async function authHeader(getAccessToken?: () => Promise<string | null>): Promise<Record<string, string>> {
  try {
    const token = getAccessToken ? await getAccessToken() : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}
