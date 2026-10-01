/**
 * Nursery / Conservation Data Agent (Kanuvari Tools & Agents PRD §5.2, with
 * the Reporting agent §5.4 folded in). It is not a separate model: it is the
 * set of nursery tools plus the rules below, added to the shared KAI brain
 * when a message is about the nursery.
 *
 * The tools themselves live in lib/nursery/tools.ts and work without AI.
 * This file only describes them to the model (zod schemas) and turns their
 * results into text. Write tools return a NurseryPlan, which the brain hands
 * to the chat window as a "Confirm and save" card — the agent never writes.
 */
import { tool, type StructuredToolInterface } from '@langchain/core/tools';
import { z } from 'zod';
import { LOSS_REASONS } from '@/lib/nursery/agent-logic';
import { ACTIVITY_TYPES } from '@/lib/nursery/validate';
import {
  generateNurseryReport, getConservationMetrics, getInventoryHistory, getSeedlingInventory, listNurseries,
  prepareNurseryActivity, prepareSeedlingAddition, prepareSeedlingLoss, prepareSeedlingPlanting, prepareSeedlingTransfer,
  prepareSurvivalAudit, searchConservationRecords, searchSpecies, validateSpeciesName, type NurseryPlan,
} from '@/lib/nursery/tools';
import {
  getCfa, listCfaMembers, prepareAddCfaMember, prepareChangeMember, prepareCreateNursery, prepareCreateSpecies,
  prepareUpdateCfa, prepareUpdateNursery,
} from '@/lib/nursery/cfa-tools';
import {
  getAnchoring, getEvidenceForRecord, getVerificationQueue, prepareDecision, prepareSubmitForVerification, reviewRecordDetails,
} from '@/lib/mrv/tools';
import { MEMBER_ROLES } from '@/lib/nursery/validate';
import type { ToolResult } from '@/lib/nursery/agent-logic';

/** Words that mean a message is about the nursery (English + Swahili). */
export const NURSERY_WORDS =
  /\b(nurser(y|ies)|seedlings?|saplings?|trees?|plant(ed|ing|s)?|species|acacia|croton|cedar|grevillea|bamboo|meru oak|survival|survive|surviving|died|dead|lost|loss(es)?|watering|watered|weeding|mulching|pruning|pest|transplant\w*|transfer\w*|moved|inventory|stock|cfa|oloolua|report|miche|miti|kupanda|tulipanda|kitalu)\b/i;

/** CFA administration: profile, members, roles, nurseries, species catalogue. */
export const CFA_ADMIN_WORDS =
  /\b(members?|admins?|verifiers?|auditors?|partners?|roles?|invite|suspend\w*|reactivate|cfa (profile|details|info\w*|description|location)|about (the|our) cfa|new nursery|add (a )?nursery|register (a )?nursery|rename|edit (the )?nursery|gps|coordinates|add (a )?species|new species|catalogue|catalog)\b/i;

/** Verification, evidence and blockchain anchoring. */
export const VERIFY_WORDS =
  /\b(verif\w*|approv\w*|reject\w*|correction|correct it|review\w*|queue|submit\w*|evidence|photos?|pictures?|documents?|anchor\w*|blockchain|merkle|proof|on-?chain|avalanche|fuji|hash|fingerprint|record id|cm[a-z0-9]{8,})\b/i;

export interface NurseryToolGroups { nursery: boolean; admin: boolean; verify: boolean }

/**
 * A NEW schema per field: a reused zod object becomes a JSON-schema "$ref",
 * which Gemini rejects ("Unknown name $ref", 400 for the whole request).
 */
const date = () => z.string().describe('Date as YYYY-MM-DD. Convert words like "today" or "yesterday" using the date in CONTEXT.');

/**
 * Models (gpt-oss on Groq) often send `null` for a field they leave out, and
 * Groq rejects the call if the schema says only "optional". Schemas accept
 * null (`.nullish()`), and this turns those nulls into "not given".
 */
type NoNull<T> = { [K in keyof T]: Exclude<T[K], null> };
function clean<T extends object>(args: T): NoNull<T> {
  return Object.fromEntries(Object.entries(args).filter(([, v]) => v !== null)) as NoNull<T>;
}

/** ToolResult → text for the model; a plan also goes to the client. */
function render(result: ToolResult<unknown>, onPlan?: (p: NurseryPlan) => void): string {
  if (result.success && onPlan && (result.data as NurseryPlan)?.kind === 'nursery') {
    const plan = result.data as NurseryPlan;
    onPlan(plan);
    return JSON.stringify({
      success: true,
      draft: plan.summary,
      assumptions: plan.assumptions,
      note: 'NOT saved yet. A "Confirm and save" card is shown to the user. Tell them to check it and press Confirm.',
    });
  }
  return JSON.stringify(result);
}

/** Optional field: Groq/NVIDIA models send null for fields they skip; Gemini rejects null types. */
type Opt = <T extends z.ZodTypeAny>(schema: T) => z.ZodTypeAny;

export function nurseryTools(
  privyUserId: string | null,
  onPlan: (plan: NurseryPlan) => void,
  groups: NurseryToolGroups = { nursery: true, admin: false, verify: false },
  /** true for OpenAI-compatible providers (accept null), false for Gemini. */
  nullable = true,
): StructuredToolInterface[] {
  const o: Opt = (schema) => (nullable ? schema.nullish() : schema.optional());
  return [
    ...(groups.nursery ? coreTools(privyUserId, onPlan, o) : []),
    ...(groups.admin ? adminTools(privyUserId, onPlan, o) : []),
    ...(groups.verify ? verifyTools(privyUserId, onPlan, o) : []),
  ];
}

function coreTools(privyUserId: string | null, onPlan: (plan: NurseryPlan) => void, o: Opt): StructuredToolInterface[] {
  return [
    // ── Read ──
    tool(async () => render(await listNurseries()), {
      name: 'list_nurseries',
      description: 'The CFA nurseries (locations) and how many seedlings each has available.',
      schema: z.object({}),
    }),
    tool(async ({ query }) => render(await searchSpecies(query)), {
      name: 'search_species',
      description: 'Search the species catalogue by common, scientific or local name. Empty query lists all.',
      schema: z.object({ query: z.string() }),
    }),
    tool(async ({ name }) => render(await validateSpeciesName(name)), {
      name: 'validate_species_name',
      description: 'Check whether a species name the user typed is in the catalogue; returns the exact species or "did you mean" suggestions.',
      schema: z.object({ name: z.string() }),
    }),
    tool(async (f) => render(await getSeedlingInventory(clean(f))), {
      name: 'get_seedling_inventory',
      description: 'Recorded seedling counts per species: available (in nursery), planted, lost, total. Filter by species and/or nursery. Use for "how many X do we have".',
      schema: z.object({ species: o(z.string()), nursery: o(z.string()) }),
    }),
    tool(async (f) => render(await getInventoryHistory(clean(f))), {
      name: 'get_inventory_history',
      description: 'Timeline of seedlings added, planted, lost and nursery work, newest first. Filter by species and/or nursery.',
      schema: z.object({ species: o(z.string()), nursery: o(z.string()), limit: o(z.number().int()) }),
    }),
    tool(async (f) => render(await searchConservationRecords(clean(f))), {
      name: 'search_conservation_records',
      description: 'Search nursery activities by type and date range, e.g. "what happened last month", "when did we last water".',
      schema: z.object({
        activityType: o(z.enum(ACTIVITY_TYPES)),
        from: o(date()), to: o(date()), nursery: o(z.string()), limit: o(z.number().int()),
      }),
    }),
    tool(async () => render(await getConservationMetrics()), {
      name: 'get_conservation_metrics',
      description: 'Totals: seedlings, in nursery, planted, lost, surviving and survival rate (0-1).',
      schema: z.object({}),
    }),
    tool(async (f) => render(await generateNurseryReport(clean(f))), {
      name: 'generate_nursery_report',
      description: 'Nursery report for a period: current inventory by species, metrics, and seedlings added / planted / lost and activities in the period.',
      schema: z.object({ from: o(date()), to: o(date()) }),
    }),

    // ── Write (draft → user confirms) ──
    tool(async (i) => render(await prepareSeedlingAddition(privyUserId, clean(i)), onPlan), {
      name: 'record_seedling_addition',
      description: 'Draft: seedlings received/added to a nursery ("we received 500 Acacia"). Needs species and quantity.',
      schema: z.object({
        species: z.string(), quantity: z.number().int(),
        nursery: o(z.string()).describe('Only if the user named one'),
        dateReceived: o(date()), source: o(z.string()).describe('Where they came from, if the user said'),
      }),
    }),
    tool(async (i) => render(await prepareSeedlingPlanting(privyUserId, clean(i)), onPlan), {
      name: 'record_seedling_planting',
      description: 'Draft: seedlings taken from the nursery and planted out. Needs species, quantity, site and date — ask the user for any that are missing.',
      schema: z.object({
        species: z.string(), quantity: z.number().int(),
        site: z.string().describe('Where they were planted, as the user said it'),
        plantingDate: date(), nursery: o(z.string()), notes: o(z.string()),
      }),
    }),
    tool(async (i) => render(await prepareSeedlingLoss(privyUserId, clean(i)), onPlan), {
      name: 'record_seedling_loss',
      description: 'Draft: seedlings that died or were lost IN THE NURSERY. Needs species, quantity and reason.',
      schema: z.object({
        species: z.string(), quantity: z.number().int(), reason: z.enum(LOSS_REASONS),
        lossDate: o(date()), nursery: o(z.string()), notes: o(z.string()),
      }),
    }),
    tool(async (i) => render(await prepareNurseryActivity(privyUserId, clean(i)), onPlan), {
      name: 'record_nursery_activity',
      description: 'Draft: nursery work such as watering, weeding, mulching, pruning, pest control, transplanting. Not for planting out.',
      schema: z.object({
        activityType: z.enum(ACTIVITY_TYPES), activityDate: o(date()), nursery: o(z.string()),
        quantity: o(z.number().int()).describe('Seedlings affected, if the user said'), notes: o(z.string()),
      }),
    }),
    tool(async (i) => render(await prepareSurvivalAudit(privyUserId, clean(i)), onPlan), {
      name: 'record_survival_audit',
      description: 'Draft: a survival check of the most recently planted batch of a species — how many are still alive.',
      schema: z.object({
        species: z.string(), surviving: z.number().int(), observationDate: o(date()),
        nursery: o(z.string()), notes: o(z.string()),
      }),
    }),
    tool(async (i) => render(await prepareSeedlingTransfer(privyUserId, clean(i)), onPlan), {
      name: 'record_seedling_transfer',
      description: 'Draft: seedlings moved from one nursery to another nursery of the CFA (toNursery), or given outside the CFA (destination, e.g. a school). Needs species, quantity and where to.',
      schema: z.object({
        species: z.string(), quantity: z.number().int(),
        fromNursery: o(z.string()), toNursery: o(z.string()).describe('Another nursery of this CFA'),
        destination: o(z.string()).describe('Somewhere outside the CFA'),
        transferDate: o(date()), notes: o(z.string()),
      }),
    }),
  ];
}

function adminTools(privyUserId: string | null, onPlan: (plan: NurseryPlan) => void, o: Opt): StructuredToolInterface[] {
  return [
    tool(async () => render(await getCfa()), {
      name: 'get_cfa',
      description: 'The CFA profile: name, location, description, active members per role, nurseries, species count, whether it has an admin.',
      schema: z.object({}),
    }),
    tool(async () => render(await listCfaMembers(privyUserId)), {
      name: 'list_cfa_members',
      description: 'Members of the CFA with email, role and status (admins, verifiers, auditors only).',
      schema: z.object({}),
    }),
    tool(async (i) => render(await prepareUpdateCfa(privyUserId, clean(i)), onPlan), {
      name: 'update_cfa',
      description: 'Draft (admin): change the CFA location or description. The name cannot change.',
      schema: z.object({ location: o(z.string()), description: o(z.string()) }),
    }),
    tool(async (i) => render(await prepareAddCfaMember(privyUserId, clean(i)), onPlan), {
      name: 'add_cfa_member',
      description: 'Draft (admin): add a person to the CFA by name and email, with a role.',
      schema: z.object({ name: z.string(), email: z.string(), role: o(z.enum(MEMBER_ROLES)) }),
    }),
    tool(async (i) => render(await prepareChangeMember(privyUserId, clean(i)), onPlan), {
      name: 'change_cfa_member',
      description: "Draft (admin): change a member's role (e.g. make them a verifier) or status (suspend / reactivate). Member by name or email.",
      schema: z.object({ member: z.string(), role: o(z.enum(MEMBER_ROLES)), status: o(z.enum(['active', 'inactive', 'suspended'])) }),
    }),
    tool(async (i) => render(await prepareCreateNursery(privyUserId, clean(i)), onPlan), {
      name: 'create_nursery',
      description: 'Draft (admin): register a new nursery/location with optional GPS.',
      schema: z.object({ name: z.string(), description: o(z.string()), latitude: o(z.number()), longitude: o(z.number()) }),
    }),
    tool(async (i) => render(await prepareUpdateNursery(privyUserId, clean(i)), onPlan), {
      name: 'update_nursery',
      description: 'Draft (admin): rename a nursery or change its description or GPS.',
      schema: z.object({ nursery: z.string(), newName: o(z.string()), description: o(z.string()), latitude: o(z.number()), longitude: o(z.number()) }),
    }),
    tool(async (i) => render(await prepareCreateSpecies(privyUserId, clean(i)), onPlan), {
      name: 'create_species',
      description: 'Draft (admin): add a species to the catalogue. Needs common AND scientific name from the user.',
      schema: z.object({ commonName: z.string(), scientificName: z.string(), localName: o(z.string()) }),
    }),
  ];
}

function verifyTools(privyUserId: string | null, onPlan: (plan: NurseryPlan) => void, o: Opt): StructuredToolInterface[] {
  const recordId = () => z.string().describe('Conservation record id (from the queue or a /verify/<id> link)');
  return [
    tool(async () => render(await getVerificationQueue(privyUserId)), {
      name: 'get_verification_queue',
      description: "Records waiting for verification (for verifiers/admins), and the user's own records sent back for correction.",
      schema: z.object({}),
    }),
    tool(async ({ recordId: id }) => render(await reviewRecordDetails(id)), {
      name: 'review_record',
      description: 'Everything about one record for a verifier: data, versions, integrity, evidence, decision history and warning flags (unusual quantities, no photo, low survival).',
      schema: z.object({ recordId: recordId() }),
    }),
    tool(async ({ recordId: id, decision, reason }) => render(await prepareDecision(privyUserId, { recordId: id, decision, reason: reason ?? undefined }), onPlan), {
      name: 'decide_record',
      description: 'Draft a verifier decision: UNDER_REVIEW (start), VERIFIED (approve), REJECTED, or CORRECTION_REQUIRED (send back). Reject and correction need a reason from the user.',
      schema: z.object({
        recordId: recordId(),
        decision: z.enum(['UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'CORRECTION_REQUIRED']),
        reason: o(z.string()),
      }),
    }),
    tool(async (i) => render(await prepareSubmitForVerification(privyUserId, clean(i)), onPlan), {
      name: 'submit_for_verification',
      description: 'Draft: submit a planting or survival check that has no verification record yet.',
      schema: z.object({ kind: z.enum(['planting', 'survival']), species: z.string() }),
    }),
    tool(async ({ recordId: id }) => render(await getEvidenceForRecord(id)), {
      name: 'get_evidence',
      description: 'Photos/documents attached to a record, with each file\'s SHA-256 fingerprint.',
      schema: z.object({ recordId: recordId() }),
    }),
    tool(async ({ recordId: id }) => render(await getAnchoring(id ?? undefined)), {
      name: 'anchoring_status',
      description: 'Without recordId: how many verified records wait for anchoring and recent Avalanche batches. With recordId: verify that record end to end (data → hash → Merkle proof → Fuji transaction).',
      schema: z.object({ recordId: o(z.string()) }),
    }),
  ];
}


export const NURSERY_PROMPT = `

NURSERY AGENT (Oloolua CFA nursery data)
- Facts about seedlings, species, nurseries, planting, losses and survival come ONLY from the nursery tools. Never invent a species, quantity, site, nursery or date. Say "recorded" for database figures; label anything else as an estimate.
- To record something, call the matching record_* tool. It only makes a DRAFT; the user must press "Confirm and save". Never say data was saved.
- If required information is missing, do not call the tool and do not guess: ask for everything missing in ONE short question. Planting needs species, quantity, site and date. A loss needs species, quantity and reason. An addition needs species and quantity.
- If a tool returns INVALID_SPECIES with options, ask the user to choose ("Did you mean Acacia?"). Never pick for them.
- There is no tool to overwrite a count. If the user wants to "change the inventory to N", ask which nursery and species and WHY the number changed (new seedlings → addition, deaths → loss, planted → planting), then use that tool.
- If a tool returns UNAUTHORIZED or FORBIDDEN, tell the user to sign in or join the CFA on /nursery.`;

export const ADMIN_PROMPT = `

CFA ADMIN TOOLS
- Members, roles, the CFA profile, nurseries and the species catalogue. Changes are drafts the admin confirms. Only admins can change them; a species needs both its common and scientific name from the user (never guess a scientific name).`;

export const VERIFY_PROMPT = `

VERIFICATION AGENT (you assist a human verifier; you never decide)
- Use review_record to lay out the data, versions, evidence, history and flags. Recommend what to check, but the verifier makes the decision and confirms it.
- A decision is a draft until the verifier presses Confirm. Rejection or correction needs the verifier's reason; ask for it.
- Nobody can verify their own submission. Anchoring on Avalanche is done on the /mrv page with the verifier's own wallet.`;
