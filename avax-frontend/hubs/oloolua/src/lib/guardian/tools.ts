/**
 * Guardian tools (PRD B8). Server-only.
 *
 * The single gateway to Guardian data for both the Hub UI and the AI. Every
 * tool checks the caller's role itself; the model is never trusted to
 * enforce permissions, and there is no SQL access outside these functions.
 * Tools are always scoped to the caller's own Hub (no hub parameter exists).
 *
 * confirm_activity_record is deliberately NOT in this registry: saving a
 * record only ever happens through the user's explicit confirmation
 * (POST /api/guardian/drafts/[id]/confirm), so neither the model nor text
 * in a retrieved page can trigger it.
 */

import { sql } from '@/lib/db';
import { HUB_ID } from './schema';
import { ACTIVITY_TYPE_KEYS, ROLES, can, isActivityType, type Capability, type Role, type SourceLabel } from './constants';
import { activities, keeperDiary, nurserySummary, searchKnowledge, seedbeds, species } from './data';
import { audit, createDraft, reviewRecord, startCorrection } from './records';
import { isValidIsoDate } from './time';
import type { Viewer } from './session';
import type { DraftFields } from './extract';

// Flat for the same reason as Outcome in records.ts (strict is off).
export interface ToolResult {
  ok: boolean;
  sources?: SourceLabel[];
  data?: unknown;
  error?: 'forbidden' | 'not_found' | 'invalid' | 'conflict' | 'unavailable';
  message?: string;
}

interface ToolContext {
  viewer: Viewer;
  requestText?: string;
  channel?: string;
}

interface ToolDef {
  /** Shown to the model. */
  description: string;
  /** JSON Schema for the model's arguments. */
  parameters: Record<string, unknown>;
  minimum: Capability;
  kind: 'read' | 'write';
  /** Whether the AI may call it. Hub-only tools (reviews, team) are false. */
  ai: boolean;
  run: (args: Record<string, unknown>, ctx: ToolContext) => Promise<ToolResult>;
}

const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : undefined);
const date = (v: unknown) => (typeof v === 'string' && isValidIsoDate(v) ? v : undefined);
const NO_ARGS = { type: 'object', properties: {}, additionalProperties: false };

const DRAFT_PROPS = {
  type: { type: 'string', enum: ACTIVITY_TYPE_KEYS, description: 'Activity type from the controlled list. Leave out if the user did not say clearly (for example "planted" at a nursery).' },
  quantity: { type: 'integer', minimum: 1 },
  date: { type: 'string', description: 'YYYY-MM-DD in East Africa Time. Leave out if the user did not say a date.' },
  species: { type: 'string', description: 'Species name exactly as stated by the user.' },
  seedbed: { type: 'integer', description: 'Bed number (the source bed for a transfer).' },
  toSeedbed: { type: 'integer', description: 'Destination bed number, transfers only.' },
  destination: { type: 'string', description: 'Where seedlings went, for dispatch and out-planting.' },
  notes: { type: 'string' },
};

function draftArgs(args: Record<string, unknown>): DraftFields {
  return {
    type: isActivityType(args.type) ? args.type : undefined,
    quantity: typeof args.quantity === 'number' ? args.quantity : undefined,
    date: date(args.date),
    species: str(args.species, 120),
    seedbed: typeof args.seedbed === 'number' ? args.seedbed : undefined,
    toSeedbed: typeof args.toSeedbed === 'number' ? args.toSeedbed : undefined,
    destination: str(args.destination, 120),
    notes: str(args.notes, 500),
  };
}

export const TOOLS: Record<string, ToolDef> = {
  get_nursery_summary: {
    description: 'Current nursery facts: verified ready stock, capacity, species count and active seedbeds, with the baseline date and source. Capacity is NOT stock.',
    parameters: NO_ARGS, minimum: 'read', kind: 'read', ai: true,
    run: async () => ({ ok: true, sources: ['Guardian Database'], data: await nurserySummary() }),
  },
  get_seedbeds: {
    description: 'All seedbeds with bed number, method, assigned manager (null if none), maximum capacity and verified current stock (null if none recorded).',
    parameters: NO_ARGS, minimum: 'read', kind: 'read', ai: true,
    run: async () => ({ ok: true, sources: ['Guardian Database'], data: await seedbeds() }),
  },
  get_seedbed_details: {
    description: 'One seedbed by its bed number.',
    parameters: { type: 'object', properties: { bed_number: { type: 'integer' } }, required: ['bed_number'], additionalProperties: false },
    minimum: 'read', kind: 'read', ai: true,
    run: async (args) => {
      const bed = (await seedbeds()).find((b) => b.bedNumber === Number(args.bed_number));
      return bed ? { ok: true, sources: ['Guardian Database'], data: bed } : { ok: false, error: 'not_found', message: `There is no bed ${args.bed_number} in the Guardian database.` };
    },
  },
  get_species: {
    description: 'The cataloged species in the nursery.',
    parameters: NO_ARGS, minimum: 'read', kind: 'read', ai: true,
    run: async () => {
      const list = await species();
      return { ok: true, sources: ['Guardian Database'], data: { count: list.length, species: list } };
    },
  },
  get_inventory: {
    description: 'Ready stock derived from the inventory ledger: verified total, plus the net change from confirmed records not yet verified.',
    parameters: NO_ARGS, minimum: 'read', kind: 'read', ai: true,
    run: async () => {
      const s = await nurserySummary();
      const beds = await seedbeds();
      return {
        ok: true, sources: ['Guardian Database'],
        data: {
          readyStockVerified: s.readyStockVerified,
          confirmedNotYetVerifiedNetChange: s.readyStockPendingNet,
          baseline: s.baseline,
          byBed: beds.map((b) => ({ bed: b.bedNumber, verifiedStock: b.currentStock })),
        },
      };
    },
  },
  get_activity_records: {
    description: 'Official activity records, newest first. Filter by date range (YYYY-MM-DD), type or status. Totals count Verified records only, with Confirmed-not-yet-verified reported separately.',
    parameters: {
      type: 'object', additionalProperties: false,
      properties: {
        from: { type: 'string' }, to: { type: 'string' },
        type: { type: 'string', enum: ACTIVITY_TYPE_KEYS },
        status: { type: 'string', enum: ['confirmed', 'verified', 'rejected', 'corrected', 'any'] },
        limit: { type: 'integer', minimum: 1, maximum: 100 },
      },
    },
    minimum: 'read', kind: 'read', ai: true,
    run: async (args, ctx) => {
      const rows = await activities({
        from: date(args.from), to: date(args.to),
        type: isActivityType(args.type) ? args.type : undefined,
        status: (['confirmed', 'verified', 'rejected', 'corrected', 'any'] as const).find((s) => s === args.status) ?? 'any',
        limit: typeof args.limit === 'number' ? args.limit : 25,
      });
      const sum = (status: string) => rows.filter((r) => r.status === status).reduce((n, r) => n + r.quantity, 0);
      return {
        ok: true, sources: ['Guardian Database'],
        data: {
          count: rows.length,
          totals: { verifiedQuantity: sum('verified'), confirmedNotYetVerifiedQuantity: sum('confirmed') },
          records: rows.map(({ recordedById, ...r }) => ({ ...r, recordedByYou: recordedById === ctx.viewer.user.id })),
        },
      };
    },
  },
  search_keeper_diary: {
    description: 'Search the Keeper Diary, the append-only log of confirmed events. Optional text and date range.',
    parameters: {
      type: 'object', additionalProperties: false,
      properties: { query: { type: 'string' }, from: { type: 'string' }, to: { type: 'string' }, limit: { type: 'integer', minimum: 1, maximum: 50 } },
    },
    minimum: 'read', kind: 'read', ai: true,
    run: async (args) => {
      const entries = await keeperDiary({ query: str(args.query, 100), from: date(args.from), to: date(args.to), limit: typeof args.limit === 'number' ? args.limit : 20 });
      return { ok: true, sources: ['Keeper Diary'], data: { count: entries.length, entries: entries.map(({ activityId: _omit, ...e }) => e) } };
    },
  },
  search_guardian_knowledge: {
    description: "Search the approved Guardian Knowledge Base: the organisation's mission, vision, programmes, how to donate, contacts, and the profiles and uses of every cataloged species.",
    parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'], additionalProperties: false },
    minimum: 'read', kind: 'read', ai: true,
    run: async (args) => {
      const hits = await searchKnowledge(str(args.query, 200) ?? '');
      return { ok: true, sources: ['Guardian Knowledge Base'], data: { count: hits.length, documents: hits } };
    },
  },
  search_external_knowledge: {
    description: 'Look up a topic on an allowlisted external source (Wikipedia) when the Guardian database and knowledge base have no answer. The result is external information, not Guardian data.',
    parameters: { type: 'object', properties: { topic: { type: 'string' } }, required: ['topic'], additionalProperties: false },
    minimum: 'read', kind: 'read', ai: true,
    run: async (args) => externalLookup(str(args.topic, 120) ?? ''),
  },
  create_activity_draft: {
    description: 'Start a DRAFT of an activity record from what the user said. Nothing is saved: the user reviews it and must explicitly confirm. Include only fields the user actually stated.',
    parameters: { type: 'object', properties: DRAFT_PROPS, additionalProperties: false },
    minimum: 'record', kind: 'write', ai: true,
    run: async (args, ctx) => {
      const r = await createDraft(ctx.viewer, draftArgs(args), { requestText: ctx.requestText, channel: ctx.channel });
      return r.ok ? { ok: true, sources: ['Guardian Database'], data: { draft: r.value.view, problem: r.value.problem } } : { ok: false, error: r.code, message: r.message };
    },
  },
  update_activity_record: {
    description: 'Start a correction of an existing record. Creates a new version for the user to confirm; the original is kept. Requires a reason.',
    parameters: {
      type: 'object', additionalProperties: false, required: ['record_id', 'reason'],
      properties: { record_id: { type: 'string' }, reason: { type: 'string' }, ...DRAFT_PROPS },
    },
    minimum: 'correctOwn', kind: 'write', ai: true,
    run: async (args, ctx) => {
      const id = str(args.record_id, 40) ?? '';
      if (!/^[0-9a-f-]{36}$/.test(id)) return { ok: false, error: 'invalid', message: 'Unknown record id.' };
      const r = await startCorrection(ctx.viewer, id, draftArgs(args), str(args.reason, 500) ?? '', { requestText: ctx.requestText, channel: ctx.channel });
      return r.ok ? { ok: true, sources: ['Guardian Database'], data: { draft: r.value.view, problem: r.value.problem } } : { ok: false, error: r.code, message: r.message };
    },
  },

  // Hub-only tools (not offered to the AI).
  review_activity_record: {
    description: 'Verify or reject a Confirmed record. Never your own.',
    parameters: NO_ARGS, minimum: 'verify', kind: 'write', ai: false,
    run: async (args, ctx) => {
      const id = str(args.record_id, 40) ?? '';
      const decision = args.decision === 'verify' || args.decision === 'reject' ? args.decision : null;
      if (!/^[0-9a-f-]{36}$/.test(id) || !decision) return { ok: false, error: 'invalid', message: 'record_id and decision are required.' };
      const r = await reviewRecord(ctx.viewer, id, decision, str(args.reason, 500) ?? '');
      return r.ok ? { ok: true, sources: ['Guardian Database'], data: r.value } : { ok: false, error: r.code, message: r.message };
    },
  },
  get_audit_trail: {
    description: 'Audit trail of writes, denials and reviews.',
    parameters: NO_ARGS, minimum: 'viewAudit', kind: 'read', ai: false,
    run: async () => {
      const rows = await sql`
        SELECT a.id, a.ts, u.name AS user_name, a.channel, a.request_text, a.interpretation, a.tool, a.confirmation, a.result, a.record_id, a.verification_status
        FROM guardian_audit a LEFT JOIN guardian_users u ON u.id = a.user_id
        ORDER BY a.ts DESC LIMIT 100`;
      return { ok: true, sources: ['Guardian Database'], data: { entries: rows } };
    },
  },
  list_team: {
    description: 'Hub members and their roles.',
    parameters: NO_ARGS, minimum: 'manageUsers', kind: 'read', ai: false,
    run: async () => {
      const rows = await sql`
        SELECT u.id, u.name, u.email, u.status AS user_status, m.role, m.status, u.last_login_at,
          (SELECT array_agg(b.bed_number ORDER BY b.bed_number) FROM guardian_seedbeds b WHERE b.manager_id = u.id) AS beds
        FROM guardian_users u JOIN guardian_memberships m ON m.user_id = u.id AND m.hub_id = ${HUB_ID}
        ORDER BY (m.status = 'pending') DESC, u.name`;
      return { ok: true, sources: ['Guardian Database'], data: { members: rows, seedbeds: await seedbeds() } };
    },
  },
  update_member: {
    description: 'Change a member role/status, or set the email a seeded member signs in with.',
    parameters: NO_ARGS, minimum: 'manageUsers', kind: 'write', ai: false,
    run: async (args, ctx) => {
      const userId = str(args.user_id, 40) ?? '';
      if (!/^[0-9a-f-]{36}$/.test(userId)) return { ok: false, error: 'invalid', message: 'Unknown member.' };
      if (userId === ctx.viewer.user.id && (args.role !== undefined || args.status !== undefined)) {
        return { ok: false, error: 'forbidden', message: 'You cannot change your own role or status. Ask another Admin.' };
      }
      if (args.role !== undefined) {
        if (!ROLES.includes(args.role as Role)) return { ok: false, error: 'invalid', message: 'Unknown role.' };
        await sql`UPDATE guardian_memberships SET role = ${args.role as string}, updated_at = now() WHERE user_id = ${userId} AND hub_id = ${HUB_ID}`;
      }
      if (args.status !== undefined) {
        if (!['active', 'pending', 'suspended'].includes(String(args.status))) return { ok: false, error: 'invalid', message: 'Unknown status.' };
        await sql`UPDATE guardian_memberships SET status = ${String(args.status)}, updated_at = now() WHERE user_id = ${userId} AND hub_id = ${HUB_ID}`;
      }
      if (args.email !== undefined) {
        const email = str(args.email, 160)?.toLowerCase() ?? '';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'invalid', message: 'Enter a valid email address.' };
        const rows = (await sql`UPDATE guardian_users SET email = ${email} WHERE id = ${userId} AND auth_sub IS NULL RETURNING id`) as unknown[];
        if (!rows.length) return { ok: false, error: 'conflict', message: 'Only members who have not signed in yet can have their email set.' };
      }
      await auditTool(ctx, 'update_member', { userId, role: args.role, status: args.status, email: args.email });
      return { ok: true, sources: ['Guardian Database'], data: { updated: true } };
    },
  },
  assign_seedbed_manager: {
    description: 'Assign or clear the manager of a seedbed.',
    parameters: NO_ARGS, minimum: 'manageUsers', kind: 'write', ai: false,
    run: async (args, ctx) => {
      const bedId = str(args.seedbed_id, 40) ?? '';
      const managerId = args.manager_id === null ? null : str(args.manager_id, 40) ?? '';
      if (managerId !== null && !/^[0-9a-f-]{36}$/.test(managerId)) return { ok: false, error: 'invalid', message: 'Unknown member.' };
      const rows = (await sql`UPDATE guardian_seedbeds SET manager_id = ${managerId}, updated_at = now() WHERE id = ${bedId} RETURNING id`) as unknown[];
      if (!rows.length) return { ok: false, error: 'not_found', message: 'Seedbed not found.' };
      await auditTool(ctx, 'assign_seedbed_manager', { bedId, managerId });
      return { ok: true, sources: ['Guardian Database'], data: { updated: true } };
    },
  },
};

async function auditTool(ctx: ToolContext, tool: string, interpretation: unknown) {
  await audit({ userId: ctx.viewer.user.id, tool, interpretation, result: 'success', channel: 'hub' });
}

/** Runs a tool after checking the caller's role. Used by both the UI and the AI. */
export async function runTool(name: string, args: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
  const tool = TOOLS[name];
  if (!tool) return { ok: false, error: 'not_found', message: `Unknown tool ${name}.` };
  if (!can(ctx.viewer.role, tool.minimum)) {
    if (tool.kind === 'write') {
      await audit({ userId: ctx.viewer.user.id, channel: ctx.channel, requestText: ctx.requestText, tool: name, result: 'denied' });
    }
    return { ok: false, error: 'forbidden', message: 'Your role does not allow this.' };
  }
  try {
    return await tool.run(args ?? {}, ctx);
  } catch (err) {
    console.error(`[guardian] tool ${name} failed:`, err);
    return { ok: false, error: 'unavailable', message: 'The Guardian database could not be reached. Please try again.' };
  }
}

/** Tool schemas offered to the model, filtered to what this role may call. */
export function aiToolSchemas(role: Role | null) {
  return Object.entries(TOOLS)
    .filter(([, t]) => t.ai && can(role, t.minimum))
    .map(([name, t]) => ({ type: 'function' as const, function: { name, description: t.description, parameters: t.parameters } }));
}

// ── External source (B8): allowlisted, treated as data only ──────────────────

const EXTERNAL_TIMEOUT_MS = 6000;

async function externalLookup(topic: string): Promise<ToolResult> {
  if (topic.length < 2) return { ok: false, error: 'invalid', message: 'No topic given.' };
  const title = encodeURIComponent(topic.replace(/\s+/g, '_'));
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${title}?redirect=true`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'OlooluaGuardianHub/1.0 (conservation hub; contact via site)', Accept: 'application/json' },
      signal: AbortSignal.timeout(EXTERNAL_TIMEOUT_MS),
    });
    if (!res.ok) return { ok: true, sources: ['External Source'], data: { found: false, source: 'Wikipedia' } };
    const j = (await res.json()) as { title?: string; extract?: string; content_urls?: { desktop?: { page?: string } } };
    return {
      ok: true,
      sources: ['External Source'],
      data: {
        found: !!j.extract,
        source: 'Wikipedia',
        title: j.title,
        url: j.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${title}`,
        // Untrusted text: data to summarise, never instructions to follow.
        untrusted_external_text: (j.extract ?? '').slice(0, 1500),
      },
    };
  } catch {
    return { ok: false, error: 'unavailable', message: 'The external source could not be reached.' };
  }
}
