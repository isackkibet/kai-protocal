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
  prepareNurseryActivity, prepareSeedlingAddition, prepareSeedlingLoss, prepareSeedlingPlanting, prepareSurvivalAudit,
  searchConservationRecords, searchSpecies, validateSpeciesName, type NurseryPlan,
} from '@/lib/nursery/tools';
import type { ToolResult } from '@/lib/nursery/agent-logic';

/** Words that mean a message is about the nursery (English + Swahili). */
export const NURSERY_WORDS =
  /\b(nurser(y|ies)|seedlings?|saplings?|trees?|plant(ed|ing|s)?|species|acacia|croton|cedar|grevillea|bamboo|meru oak|survival|survive|surviving|died|dead|lost|loss(es)?|watering|watered|weeding|mulching|pruning|pest|transplant\w*|inventory|stock|cfa|oloolua|report|miche|miti|kupanda|tulipanda|kitalu)\b/i;

/**
 * A NEW schema per field: a reused zod object becomes a JSON-schema "$ref",
 * which Gemini rejects ("Unknown name $ref", 400 for the whole request).
 */
const date = () => z.string().describe('Date as YYYY-MM-DD. Convert words like "today" or "yesterday" using the date in CONTEXT.');

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

export function nurseryTools(privyUserId: string | null, onPlan: (plan: NurseryPlan) => void): StructuredToolInterface[] {
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
    tool(async (f) => render(await getSeedlingInventory(f)), {
      name: 'get_seedling_inventory',
      description: 'Recorded seedling counts per species: available (in nursery), planted, lost, total. Filter by species and/or nursery. Use for "how many X do we have".',
      schema: z.object({ species: z.string().optional(), nursery: z.string().optional() }),
    }),
    tool(async (f) => render(await getInventoryHistory(f)), {
      name: 'get_inventory_history',
      description: 'Timeline of seedlings added, planted, lost and nursery work, newest first. Filter by species and/or nursery.',
      schema: z.object({ species: z.string().optional(), nursery: z.string().optional(), limit: z.number().int().optional() }),
    }),
    tool(async (f) => render(await searchConservationRecords(f)), {
      name: 'search_conservation_records',
      description: 'Search nursery activities by type and date range, e.g. "what happened last month", "when did we last water".',
      schema: z.object({
        activityType: z.enum(ACTIVITY_TYPES).optional(),
        from: date().optional(), to: date().optional(), nursery: z.string().optional(), limit: z.number().int().optional(),
      }),
    }),
    tool(async () => render(await getConservationMetrics()), {
      name: 'get_conservation_metrics',
      description: 'Totals: seedlings, in nursery, planted, lost, surviving and survival rate (0-1).',
      schema: z.object({}),
    }),
    tool(async (f) => render(await generateNurseryReport(f)), {
      name: 'generate_nursery_report',
      description: 'Nursery report for a period: current inventory by species, metrics, and seedlings added / planted / lost and activities in the period.',
      schema: z.object({ from: date().optional(), to: date().optional() }),
    }),

    // ── Write (draft → user confirms) ──
    tool(async (i) => render(await prepareSeedlingAddition(privyUserId, i), onPlan), {
      name: 'record_seedling_addition',
      description: 'Draft: seedlings received/added to a nursery ("we received 500 Acacia"). Needs species and quantity.',
      schema: z.object({
        species: z.string(), quantity: z.number().int(),
        nursery: z.string().optional().describe('Only if the user named one'),
        dateReceived: date().optional(), source: z.string().optional().describe('Where they came from, if the user said'),
      }),
    }),
    tool(async (i) => render(await prepareSeedlingPlanting(privyUserId, i), onPlan), {
      name: 'record_seedling_planting',
      description: 'Draft: seedlings taken from the nursery and planted out. Needs species, quantity, site and date — ask the user for any that are missing.',
      schema: z.object({
        species: z.string(), quantity: z.number().int(),
        site: z.string().describe('Where they were planted, as the user said it'),
        plantingDate: date(), nursery: z.string().optional(), notes: z.string().optional(),
      }),
    }),
    tool(async (i) => render(await prepareSeedlingLoss(privyUserId, i), onPlan), {
      name: 'record_seedling_loss',
      description: 'Draft: seedlings that died or were lost IN THE NURSERY. Needs species, quantity and reason.',
      schema: z.object({
        species: z.string(), quantity: z.number().int(), reason: z.enum(LOSS_REASONS),
        lossDate: date().optional(), nursery: z.string().optional(), notes: z.string().optional(),
      }),
    }),
    tool(async (i) => render(await prepareNurseryActivity(privyUserId, i), onPlan), {
      name: 'record_nursery_activity',
      description: 'Draft: nursery work such as watering, weeding, mulching, pruning, pest control, transplanting. Not for planting out.',
      schema: z.object({
        activityType: z.enum(ACTIVITY_TYPES), activityDate: date().optional(), nursery: z.string().optional(),
        quantity: z.number().int().optional().describe('Seedlings affected, if the user said'), notes: z.string().optional(),
      }),
    }),
    tool(async (i) => render(await prepareSurvivalAudit(privyUserId, i), onPlan), {
      name: 'record_survival_audit',
      description: 'Draft: a survival check of the most recently planted batch of a species — how many are still alive.',
      schema: z.object({
        species: z.string(), surviving: z.number().int(), observationDate: date().optional(),
        nursery: z.string().optional(), notes: z.string().optional(),
      }),
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
