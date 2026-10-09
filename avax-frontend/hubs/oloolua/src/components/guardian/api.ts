'use client';

import type { Role, SourceLabel } from '@/lib/guardian/constants';

/** Client-side mirrors of the server types (kept structural to avoid importing server code). */
export interface DraftView {
  id: string;
  status: 'draft' | 'pending' | 'confirmed' | 'cancelled';
  fields: {
    type?: string; quantity?: number; date?: string; species?: string; seedbed?: number;
    toSeedbed?: number; destination?: string; notes?: string; acknowledged?: boolean;
  };
  awaiting: string | null;
  question: string | null;
  readBack: string | null;
  warnings: string[];
  needsAcknowledgement: boolean;
  correctionOf: string | null;
  correctionReason: string | null;
  expiresAt: string;
}

export interface Panel { readyStock: number; capacity: number | null; species: number; seedbeds: number; asOf: string | null }

export interface Quota { limit: number; used: number; remaining: number; period: 'total' | 'daily'; exempt: boolean }

export interface SessionInfo {
  authConfigured: boolean;
  devLogin: boolean;
  aiEnabled: boolean;
  privy?: boolean;
  signedIn: boolean;
  user?: { id: string; name: string; email: string | null };
  role?: Role | null;
  membershipStatus?: 'active' | 'pending' | 'suspended' | 'none';
  quota?: Quota | null;
  error?: string;
}

export interface ChatResponse {
  reply: string;
  sources: SourceLabel[];
  panel?: Panel;
  draft?: DraftView | null;
  saved?: { recordId: string; status: string; version: number; description: string };
  counted: boolean;
  mode: string;
  quota?: Quota;
  error?: string;
}

export async function api<T = any>(path: string, init?: { method?: string; body?: unknown }): Promise<{ ok: boolean; status: number; data: T }> {
  const res = await fetch(path, {
    method: init?.method ?? (init?.body !== undefined ? 'POST' : 'GET'),
    headers: init?.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  let data: any = null;
  try { data = await res.json(); } catch { /* empty body */ }
  return { ok: res.ok, status: res.status, data };
}

/** Read tool via GET (no prompt used). */
export function readTool<T = any>(name: string, args?: Record<string, unknown>) {
  return api<{ ok: boolean; data: T; message?: string; error?: string }>(
    `/api/guardian/tools/${name}${args ? `?args=${encodeURIComponent(JSON.stringify(args))}` : ''}`,
  );
}

/** Write tool via POST (no prompt used). */
export function writeTool<T = any>(name: string, args: Record<string, unknown>) {
  return api<{ ok: boolean; data: T; message?: string; error?: string }>(`/api/guardian/tools/${name}`, { body: args });
}

export const fmt = (n: number) => n.toLocaleString('en-US');

export function formatDate(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: iso.length === 10 ? 'UTC' : 'Africa/Nairobi' }).format(d);
}
