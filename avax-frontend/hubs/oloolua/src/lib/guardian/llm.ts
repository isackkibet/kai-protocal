/**
 * Minimal OpenAI-compatible chat client with tool calling. Server-only.
 * Works with OpenAI, Groq, OpenRouter, and Gemini's OpenAI-compatible
 * endpoint. Configure with:
 *   AI_API_KEY   (required to enable the AI; without it Guardian runs in
 *                 structured mode, answering core questions without a model)
 *   AI_BASE_URL  default https://api.openai.com/v1
 *   AI_MODEL     default gpt-4o-mini
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: { id: string; type: 'function'; function: { name: string; arguments: string } }[];
  tool_call_id?: string;
}

export interface ToolSchema {
  type: 'function';
  function: { name: string; description: string; parameters: Record<string, unknown> };
}

export function aiConfigured(): boolean {
  return !!process.env.AI_API_KEY;
}

export async function chat(messages: ChatMessage[], tools: ToolSchema[]): Promise<ChatMessage> {
  const base = (process.env.AI_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/$/, '');
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.AI_API_KEY}` },
    body: JSON.stringify({
      model: process.env.AI_MODEL ?? 'gpt-4o-mini',
      messages,
      ...(tools.length ? { tools, tool_choice: 'auto' } : {}),
      temperature: 0.2,
      max_tokens: 700,
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`AI provider returned ${res.status}: ${detail.slice(0, 200)}`);
  }
  const json = await res.json();
  const msg = json?.choices?.[0]?.message;
  if (!msg) throw new Error('AI provider returned no message');
  return { role: 'assistant', content: msg.content ?? null, tool_calls: msg.tool_calls };
}
