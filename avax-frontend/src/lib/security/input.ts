/**
 * src/lib/security/input.ts
 *
 * Input hardening for untrusted request bodies, query strings and headers.
 *
 * SCOPE — what this actually defends against, so it is not oversold:
 *
 *   SQL injection      — NOT a risk in this app. All DB access goes through
 *                       Prisma, which parameterises every query. The only
 *                       raw SQL is 4 `SELECT id … FOR UPDATE` row locks that
 *                       use Prisma's tagged template, i.e. still parameterised
 *                       ($queryRaw`…` interpolates as a bound value). So the
 *                       real protection is "keep using Prisma"; this module
 *                       adds a tripwire that REJECTS classic SQLi payloads
 *                       rather than trying to sanitise them, because
 *                       escaping SQL is famously harder than avoiding it.
 *
 *   NoSQL injection    — a real risk the moment any operator-built query
 *                       ({"$ne": null}, {"$gt": ""}) reaches a datastore that
 *                       honours it. Mongo is not in use, but a future
 *                       document store or a careless `where` pass-through
 *                       would reintroduce auth bypass. Rejected here.
 *
 *   Prototype pollution — `JSON.parse` of `{"__proto__":{...}}` is the entry
 *                       point. Stripped structurally rather than by regex.
 *
 *   XSS                — React escapes by default, so the practical risk is
 *                       (a) `dangerouslySetInnerHTML` sinks, (b) values
 *                       rendered into non-React contexts, (c) stored XSS in
 *                       Markdown/AI output. `sanitizeForHtml` is a
 *                       conservative allow-list for those sinks.
 */

import { randomUUID } from 'node:crypto';

// ── Generic scalar validation ────────────────────────────────────────────────

export class InputError extends Error {
  readonly field: string;
  readonly status = 400;

  constructor(field: string, message: string) {
    super(message);
    this.name = 'InputError';
    this.field = field;
  }
}

/**
 * Classic SQLi / template-injection payloads.
 *
 * NOTE this is a REJECTION filter, not a sanitiser. It exists to fail loudly
 * and to show up in logs, because Prisma already makes these inert — a hit
 * here means someone is probing, or a bug is concatenating strings into SQL.
 */
const SQLI_PATTERNS: RegExp[] = [
  /(\b(union\s+(all\s+)?select)\b)/i,
  /(\b(select\s+.*\s+from|insert\s+into|delete\s+from|drop\s+(table|database)|update\s+\w+\s+set)\b)/i,
  /(--|\/\*|;)\s*$/,                 // trailing comment / statement terminator
  /\b(or|and)\s+['"]?\d+['"]?\s*=\s*['"]?\d+/i,  // 1=1 tautology
  /\b(sleep|benchmark|pg_sleep|waitfor\s+delay)\s*\(/i,
  /\b(information_schema|sysobjects|pg_catalog)\b/i,
  /\b(xp_cmdshell|exec\s*\(|eval\s*\()/i,
];

/** Mongo/operator injection — an object key that is actually an operator. */
const NOSQL_OPERATORS = new Set([
  '$ne', '$gt', '$gte', '$lt', '$lte', '$in', '$nin', '$exists', '$regex',
  '$or', '$and', '$nor', '$not', '$where', '$expr', '$function', '$text',
  '$elemMatch', '$all', '$size', '$type', '$jsonSchema', '$comment',
]);

/** Keys that must never survive a round-trip from untrusted JSON. */
const FORBIDDEN_KEYS = new Set([
  '__proto__', 'constructor', 'prototype',
]);

export function looksLikeSqlInjection(value: string): boolean {
  return SQLI_PATTERNS.some((re) => re.test(value));
}

/**
 * Recursively strip prototype-pollution vectors and Mongo operators.
 *
 * Returns a NEW structure; the input is never mutated. Cycles are broken.
 */
export function sanitizeDeep<T>(input: T, seen = new WeakSet<object>()): T {
  if (input === null || typeof input !== 'object') return input;
  if (seen.has(input as object)) return null as T;

  seen.add(input as object);

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeDeep(item, seen)) as unknown as T;
  }

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (FORBIDDEN_KEYS.has(key)) continue;
    if (NOSQL_OPERATORS.has(key)) continue;
    out[key] = sanitizeDeep(value, seen);
  }
  return out as unknown as T;
}

/**
 * Assert a payload is free of injection patterns, then sanitise it.
 * Throws InputError so callers get a clean 400 instead of a 500.
 */
export function assertSafePayload(payload: unknown): void {
  const stack = [payload];
  while (stack.length) {
    const current = stack.pop();
    if (typeof current === 'string') {
      if (looksLikeSqlInjection(current)) {
        throw new InputError('body', 'Input contains disallowed SQL syntax.');
      }
      continue;
    }
    if (current && typeof current === 'object') {
      for (const [k, v] of Object.entries(current as Record<string, unknown>)) {
        if (FORBIDDEN_KEYS.has(k)) {
          throw new InputError('body', `Input contains forbidden key "${k}".`);
        }
        if (NOSQL_OPERATORS.has(k)) {
          throw new InputError('body', `Input contains disallowed operator "${k}".`);
        }
        stack.push(v);
      }
    }
  }
}

/**
 * Parse + validate a JSON request body in one step.
 * Always go through this instead of bare `request.json()`.
 */
export async function readJsonBody<T = unknown>(req: Request, maxBytes = 256 * 1024): Promise<T> {
  const contentLength = Number(req.headers.get('content-length') ?? '0');
  if (contentLength > maxBytes) {
    throw new InputError('body', `Request body exceeds ${maxBytes} bytes.`);
  }

  const raw = await req.text();
  if (raw.length > maxBytes) {
    throw new InputError('body', `Request body exceeds ${maxBytes} bytes.`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new InputError('body', 'Request body is not valid JSON.');
  }

  assertSafePayload(parsed);
  return sanitizeDeep(parsed) as T;
}

// ── Typed field validators ───────────────────────────────────────────────────

export function requireString(
  body: Record<string, unknown>,
  field: string,
  opts: { min?: number; max?: number; pattern?: RegExp } = {},
): string {
  const value = body[field];
  if (typeof value !== 'string') {
    throw new InputError(field, `"${field}" must be a string.`);
  }
  const trimmed = value.trim();
  if (trimmed.length < (opts.min ?? 1)) {
    throw new InputError(field, `"${field}" is required.`);
  }
  if (opts.max && trimmed.length > opts.max) {
    throw new InputError(field, `"${field}" exceeds ${opts.max} characters.`);
  }
  if (opts.pattern && !opts.pattern.test(trimmed)) {
    throw new InputError(field, `"${field}" has an invalid format.`);
  }
  return trimmed;
}

export function requireInt(
  body: Record<string, unknown>,
  field: string,
  opts: { min?: number; max?: number } = {},
): number {
  const value = body[field];
  const num = typeof value === 'string' ? Number(value) : value;
  if (typeof num !== 'number' || !Number.isFinite(num) || !Number.isInteger(num)) {
    throw new InputError(field, `"${field}" must be an integer.`);
  }
  if (opts.min !== undefined && num < opts.min) {
    throw new InputError(field, `"${field}" must be at least ${opts.min}.`);
  }
  if (opts.max !== undefined && num > opts.max) {
    throw new InputError(field, `"${field}" must be at most ${opts.max}.`);
  }
  return num;
}

export function optionalString(
  body: Record<string, unknown>,
  field: string,
  opts: { max?: number } = {},
): string | undefined {
  const value = body[field];
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') {
    throw new InputError(field, `"${field}" must be a string.`);
  }
  const trimmed = value.trim();
  if (opts.max && trimmed.length > opts.max) {
    throw new InputError(field, `"${field}" exceeds ${opts.max} characters.`);
  }
  return trimmed;
}

/** Public identifier used for reference-style ids. Blocks path traversal chars. */
export const SAFE_REF_PATTERN = /^[A-Za-z0-9_-]{6,64}$/;

export function requireReference(body: Record<string, unknown>, field = 'reference'): string {
  const value = requireString(body, field, { min: 6, max: 64, pattern: SAFE_REF_PATTERN });
  return value;
}

// ── XSS sinks ────────────────────────────────────────────────────────────────

/**
 * Conservative HTML allow-list for the few places we genuinely emit HTML
 * (sanitised AI output, hub article bodies, CMS content).
 *
 * This is intentionally NOT a general-purpose sanitizer. If you find yourself
 * needing to allow a tag, prefer rendering it as text. For rich Markdown,
 * prefer a maintained parser+sanitizer pair at build time.
 */
const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre', 'blockquote',
  'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'table',
  'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'span',
]);

const ALLOWED_ATTRS = new Set(['href', 'title', 'class']);

/** Only these URL schemes — blocks javascript:, data:, vbscript:. */
function isSafeUrl(value: string): boolean {
  const trimmed = value.trim().toLowerCase();
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) return true;
  return /^(https?:|mailto:)/.test(trimmed);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Strip dangerous markup from a string before it reaches an HTML sink.
 * Prefer React's default escaping — use this only for raw-HTML sinks.
 */
export function sanitizeForHtml(input: string): string {
  // Remove entire dangerous elements including their content.
  const withoutBlocks = input
    .replace(/<\s*(script|style|iframe|object|embed|form|svg|math)[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    // Remove self-closing / unclosed dangerous tags.
    .replace(/<\s*\/?\s*(script|style|iframe|object|embed|form|svg|math|img|link|meta|base)\b[^>]*>/gi, '');

  // Then neutralise any remaining tag that is not allow-listed.
  return withoutBlocks.replace(/<\s*\/?\s*([a-zA-Z][a-zA-Z0-9]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g,
    (match, rawTag: string, rawAttrs: string) => {
      const tag = rawTag.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) return escapeHtml(match);

      const attrs = rawAttrs
        .replace(/on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')   // event handlers
        .replace(/(href|src|action)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, (m, attr: string, url: string) => {
          const bare = url.replace(/^["']|["']$/g, '');
          return isSafeUrl(bare) ? m : '';
        });

      // Drop any remaining attribute that is not allow-listed.
      const kept = attrs.replace(
        /([a-zA-Z-]+)\s*=\s*("[^"]*"|'[^']*')/g,
        (m, attr: string) => (ALLOWED_ATTRS.has(attr.toLowerCase()) ? m : ''),
      );

      return `<${tag}${kept}>`;
    });
}

/**
 * Reject client-supplied values that try to set trust-level fields.
 * The real defence is that these are never read from the request at all —
 * this exists to catch the mistake at review time and in fuzzing.
 */
const FORBIDDEN_FIELDS = new Set([
  'verification_status', 'verificationStatus',
  'blockchain_status', 'blockchainStatus',
  'avalanche_tx_hash', 'avalancheTxHash',
  'guardian_credential_id', 'guardianCredentialId',
  'role', 'isAdmin', 'is_admin', 'pointsAwarded', 'points_awarded',
  'data_hash', 'dataHash', 'previous_hash', 'previousHash',
]);

export function assertNoPrivilegeEscalation(body: Record<string, unknown>): void {
  for (const key of Object.keys(body)) {
    if (FORBIDDEN_FIELDS.has(key)) {
      throw new InputError(
        key,
        `"${key}" is server-controlled and cannot be supplied by a client.`,
      );
    }
  }
}

/** Correlation id for log lines; never contains user data. */
export function requestId(): string {
  return randomUUID();
}
