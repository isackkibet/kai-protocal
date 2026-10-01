/**
 * Browser storage for the Kanuvari AI workspace (per person, per device):
 * chat threads and an offline queue of CONFIRMED records.
 *
 * Chats are a convenience only: every fact the AI uses comes from the
 * database and tools, never from this history. Storage can be missing
 * (private mode, blocked site data), so every access is wrapped.
 */

export interface StoredMessage { role: 'user' | 'ai'; text: string; at: number; tools?: string[] }
export interface Thread { id: string; title: string; project: string | null; messages: StoredMessage[]; updatedAt: number }

const key = (userKey: string) => `kanuvari.chats.${userKey}`;
const QUEUE = 'kanuvari.offlineQueue';
const MAX_THREADS = 50;

function read<T>(k: string, fallback: T): T {
  try { const raw = localStorage.getItem(k); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
}
function write(k: string, v: unknown) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage full or blocked: chats just aren't kept */ }
}

export function loadThreads(userKey: string): Thread[] {
  return read<Thread[]>(key(userKey), []).sort((a, b) => b.updatedAt - a.updatedAt);
}
export function saveThread(userKey: string, t: Thread) {
  const all = loadThreads(userKey).filter((x) => x.id !== t.id);
  write(key(userKey), [t, ...all].slice(0, MAX_THREADS));
}
export function deleteThread(userKey: string, id: string) {
  write(key(userKey), loadThreads(userKey).filter((x) => x.id !== id));
}

/** Today / Yesterday / Previous, as the design asks. */
export function groupThreads(threads: Thread[], now = new Date()) {
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startYesterday = startToday - 86_400_000;
  return {
    Today: threads.filter((t) => t.updatedAt >= startToday),
    Yesterday: threads.filter((t) => t.updatedAt >= startYesterday && t.updatedAt < startToday),
    Previous: threads.filter((t) => t.updatedAt < startYesterday),
  };
}

export const newThreadId = () => `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// ── Offline queue: confirmed records waiting for signal ─────────────────────

export interface QueuedWrite { id: string; method: 'POST' | 'PATCH'; endpoint: string; body: Record<string, unknown>; summary: string; queuedAt: number }

export function loadQueue(): QueuedWrite[] { return read<QueuedWrite[]>(QUEUE, []); }
export function enqueue(item: Omit<QueuedWrite, 'id' | 'queuedAt'>) {
  write(QUEUE, [...loadQueue(), { ...item, id: newThreadId(), queuedAt: Date.now() }]);
}
export function removeFromQueue(id: string) { write(QUEUE, loadQueue().filter((q) => q.id !== id)); }
