/**
 * KAI brain — the one AI used by every AI surface: chat (/api/chat), the
 * voice agent (/api/agent) and conservation Ask (/api/conservation/ask).
 *
 * Built on LangChain.js:
 *   - Tools: the existing agent tools (lib/agent/tools.ts: APYs, prices,
 *     balances, conservation NFTs, escrow, and "prepare_*" plans that the
 *     user must approve) plus read-only app-data tools defined here
 *     (nursery, the signed-in user's account, MRV records, hub knowledge).
 *   - Fallbacks: Gemini → Groq → NVIDIA, whichever keys are configured.
 *   - Memory: the caller passes the conversation so far (kept in the user's
 *     own browser — never a shared server-side buffer).
 *
 * Safety: every tool is read-only. Money-moving requests only ever produce a
 * plan (returned in `plans`) for the user to approve in their wallet, and
 * nursery records only a draft (kind: 'nursery') the user confirms, which
 * their own browser then sends to the /api/cfa/* route (lib/ai/nursery-agent.ts).
 * The brain never signs, sends or writes anything. User-specific data comes
 * only from a Privy identity the ROUTE verified — never from the conversation.
 */
import { tool, type StructuredToolInterface } from '@langchain/core/tools';
import { AIMessage, HumanMessage, SystemMessage, ToolMessage, type BaseMessage } from '@langchain/core/messages';
import type { Runnable } from '@langchain/core/runnables';
import type { BaseLanguageModelInput } from '@langchain/core/language_models/base';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { TOOLS as AGENT_TOOLS, type AgentTool } from '@/lib/agent/tools';
import { askConservation } from '@/lib/hubs/conservation-data';
import { getPrisma } from '@/lib/db/db';
import { getNurseryCfa } from '@/lib/nursery/db';
import { checkRecordIntegrity } from '@/lib/mrv/records';
import { redactSecrets } from './redact';
import {
  ADMIN_PROMPT, CFA_ADMIN_WORDS, NURSERY_PROMPT, NURSERY_WORDS, QUALITY_PROMPT, QUALITY_WORDS, VERIFY_PROMPT, VERIFY_WORDS, nurseryTools,
  type NurseryToolGroups,
} from './nursery-agent';
import { PORTFOLIO_PROMPT, PORTFOLIO_WORDS, portfolioTools } from './portfolio-agent';
import { COMPLIANCE_PROMPT, COMPLIANCE_WORDS, IDENTITY_PROMPT, IDENTITY_WORDS, complianceTools, identityTools } from './trust-agents';

export type BrainMode = 'chat' | 'voice' | 'ask';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface BrainInput {
  message: string;
  /** Earlier turns of THIS conversation, oldest first (from the user's browser). */
  history?: unknown;
  mode: BrainMode;
  /** Verified Privy user id (from the route's Authorization check), or null. */
  privyUserId: string | null;
  /** Wallet address the client says is connected (used for balance tools). */
  wallet?: string | null;
  /** Extra facts the page already knows, e.g. the home page's wallet balances. */
  pageContext?: string;
  /** Called as each tool starts, so a UI can show "Querying nursery records…". */
  onToolStart?: (toolName: string) => void;
}

export interface BrainResult {
  text: string;
  /** Plans from prepare_* tools, for the client to show as approval cards. */
  plans: Record<string, unknown>[];
  toolsUsed: string[];
  /** Model that produced the final answer, e.g. "gemini-3.6-flash". */
  provider: string;
}

// ── Memory ────────────────────────────────────────────────────────────────────

const MAX_TURNS = 10;
const MAX_TURN_CHARS = 2000;

/**
 * Accepts only well-formed {role, content} turns, trims each, keeps the last
 * MAX_TURNS. The history is user-supplied, so it can't be trusted for facts —
 * which is fine: facts come from tools, and user data only from the verified
 * identity.
 */
export function sanitizeHistory(raw: unknown): ChatTurn[] {
  if (!Array.isArray(raw)) return [];
  const turns: ChatTurn[] = [];
  for (const t of raw) {
    if (!t || typeof t !== 'object') continue;
    const { role, content } = t as { role?: unknown; content?: unknown };
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') continue;
    const text = redactSecrets(content.trim().slice(0, MAX_TURN_CHARS));
    if (text) turns.push({ role, content: text });
  }
  return turns.slice(-MAX_TURNS);
}

// ── Models (Gemini → Groq → NVIDIA) ───────────────────────────────────────────

/** Env value with stray whitespace removed ("openai/gpt-oss-120b " → a 404 from Groq). */
const env = (k: string) => (process.env[k] ?? '').trim();

function configuredModels(mode: BrainMode) {
  const temperature = mode === 'voice' ? 0.2 : 0.3;
  const maxTokens = mode === 'voice' ? 512 : 1536;
  // Names are provider-qualified ("groq/…", "nvidia/…"): the same model id can
  // exist at two providers, and cooldowns / failures must not collide.
  const models: { name: string; model: ChatGoogleGenerativeAI | ChatOpenAI }[] = [];
  const openAiCompatible = (provider: string, baseURL: string, apiKey: string, model: string, timeout: number) => ({
    name: `${provider}/${model}`,
    model: new ChatOpenAI({ model, apiKey, temperature, maxTokens, timeout, maxRetries: 1, configuration: { baseURL } }),
  });

  if (env('GEMINI_API_KEY')) {
    const model = env('GEMINI_MODEL') || 'gemini-3.6-flash';
    models.push({
      name: `gemini/${model}`,
      model: new ChatGoogleGenerativeAI({ model, apiKey: env('GEMINI_API_KEY'), temperature, maxOutputTokens: maxTokens, maxRetries: 1 }),
    });
  }
  if (env('GROQ_API_KEY')) {
    // llama-3.1-8b-instant was retired by Groq (404 model_not_found).
    const primary = env('GROQ_MODEL') || 'openai/gpt-oss-120b';
    models.push(openAiCompatible('groq', 'https://api.groq.com/openai/v1', env('GROQ_API_KEY'), primary, 20_000));
    // Groq's free tier limits tokens per minute PER MODEL (8k for gpt-oss-120b),
    // so a second model is a real fallback, not a duplicate.
    const second = env('GROQ_FALLBACK_MODEL') || 'openai/gpt-oss-20b';
    if (second !== primary) models.push(openAiCompatible('groq', 'https://api.groq.com/openai/v1', env('GROQ_API_KEY'), second, 20_000));
  }
  if (env('NVIDIA_API_KEY')) {
    models.push(openAiCompatible('nvidia', 'https://integrate.api.nvidia.com/v1', env('NVIDIA_API_KEY'), env('NVIDIA_MODEL') || 'openai/gpt-oss-20b', 30_000));
  }
  return models;
}

// ── Tools ─────────────────────────────────────────────────────────────────────

/** Existing agent tool (Gemini-style schema, string args) → LangChain tool. */
function fromAgentTool(t: AgentTool, onPlan: (plan: Record<string, unknown>) => void): StructuredToolInterface {
  const shape: Record<string, z.ZodTypeAny> = {};
  const required = new Set(t.parameters.required ?? []);
  for (const [key, prop] of Object.entries(t.parameters.properties)) {
    let field: z.ZodTypeAny = prop.enum && prop.enum.length
      ? z.enum(prop.enum as [string, ...string[]])
      : z.string();
    if (prop.description) field = field.describe(prop.description);
    shape[key] = required.has(key) ? field : field.optional();
  }
  return tool(
    async (args: Record<string, unknown>) => {
      const strArgs = Object.fromEntries(Object.entries(args).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]));
      const result = await t.run(strArgs);
      if (result.kind === 'plan') onPlan({ name: t.name, ...result.payload });
      return JSON.stringify(result.payload);
    },
    { name: t.name, description: t.description, schema: z.object(shape) },
  );
}

// Neon closes idle connections; the first query after a quiet spell can fail
// with P1017 ("Server has closed the connection") / P1001. One retry reconnects.
const DB_RECONNECT_CODES = new Set(['P1017', 'P1001', 'P1002']);
async function invokeWithReconnect(t: StructuredToolInterface, args: unknown): Promise<unknown> {
  try {
    return await t.invoke(args as Record<string, unknown>);
  } catch (e) {
    const code = (e as { code?: unknown })?.code;
    if (typeof code !== 'string' || !DB_RECONNECT_CODES.has(code)) throw e;
    console.warn(`[kai-brain] tool ${t.name}: database connection dropped (${code}), retrying once`);
    return t.invoke(args as Record<string, unknown>);
  }
}

function appDataTools(input: BrainInput): StructuredToolInterface[] {
  const getNurserySummary = tool(
    async () => {
      const prisma = await getPrisma();
      if (!prisma) return JSON.stringify({ error: 'database unavailable' });
      const cfa = await getNurseryCfa(prisma);
      if (!cfa) return JSON.stringify({ error: 'nursery not set up' });
      const [dash] = await prisma.$queryRaw<Record<string, unknown>[]>`
        SELECT total_seedlings::int AS total_seedlings, species_count::int AS species_count, in_nursery::int AS in_nursery,
               planted::int AS planted, avg_survival_pct::text AS avg_survival_pct, activity_count::int AS activity_count
        FROM v_nursery_dashboard WHERE cfa_id = ${cfa.id}::uuid`;
      const [species, activities] = await Promise.all([
        prisma.species.findMany({ select: { commonName: true, scientificName: true }, orderBy: { commonName: 'asc' }, take: 30 }),
        prisma.nurseryActivity.findMany({
          where: { cfaId: cfa.id }, orderBy: [{ activityDate: 'desc' }, { createdAt: 'desc' }], take: 5,
          select: { activityType: true, activityDate: true, quantityAffected: true },
        }),
      ]);
      const t = (dash ?? {}) as Record<string, number | string | null>;
      const catalogue = species.length ? `${species.length} species in the catalogue` : 'no species in the catalogue yet';
      // A plain sentence, so zero counts are read as "none yet", not "no data".
      const summary = !t.total_seedlings
        ? `The data is available and up to date: no seedling batches recorded yet (0 in the nursery, 0 planted); ${catalogue}; ${t.activity_count ?? 0} nursery activities logged.`
        : `${t.total_seedlings} seedlings recorded: ${t.in_nursery} in the nursery, ${t.planted} planted, across ${t.species_count} species (${catalogue}); average survival ${t.avg_survival_pct != null ? `${t.avg_survival_pct}%` : 'not measured yet'}; ${t.activity_count ?? 0} nursery activities logged.`;
      return JSON.stringify({
        cfa: cfa.name,
        summary,
        totals: dash ?? null,
        species: species.map((s) => `${s.commonName} (${s.scientificName})`),
        recentActivities: activities.map((a) => ({ type: a.activityType, date: a.activityDate.toISOString().slice(0, 10), seedlings: a.quantityAffected })),
        page: '/nursery',
      });
    },
    {
      name: 'get_nursery_summary',
      description: 'Real numbers for the Oloolua CFA tree nursery: total seedlings, how many are in the nursery vs planted, species grown, average survival %, and recent nursery work. Use for any question about the nursery, trees planted or survival.',
      schema: z.object({}),
    },
  );

  const getMyAccount = tool(
    async () => {
      if (!input.privyUserId) return JSON.stringify({ signedIn: false, note: 'The user is not signed in. Tell them to sign in to see their account.' });
      const prisma = await getPrisma();
      if (!prisma) return JSON.stringify({ error: 'database unavailable' });
      const user = await prisma.kaiUser.findUnique({
        where: { privyUserId: input.privyUserId },
        select: { id: true, name: true, referralCode: true, createdAt: true, wallets: { select: { chain: true, address: true } } },
      });
      if (!user) return JSON.stringify({ signedIn: true, registered: false, note: 'Signed in but sign-up has not finished.' });
      const [points, lastClaim, recent, member] = await Promise.all([
        prisma.kaiBarLedger.aggregate({ where: { userId: user.id }, _sum: { amount: true } }),
        prisma.dailyClaim.findFirst({ where: { userId: user.id }, orderBy: { claimedAt: 'desc' }, select: { claimedAt: true, claimAmount: true } }),
        prisma.kaiBarLedger.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 5, select: { description: true, amount: true, createdAt: true } }),
        prisma.cfaMember.findUnique({ where: { authUserId: input.privyUserId }, select: { role: true, status: true } }),
      ]);
      const hoursSinceClaim = lastClaim ? (Date.now() - lastClaim.claimedAt.getTime()) / 3_600_000 : null;
      return JSON.stringify({
        signedIn: true,
        name: user.name,
        memberSince: user.createdAt.toISOString().slice(0, 10),
        kaiBarPoints: points._sum.amount ?? 0,
        dailyDrop: lastClaim
          ? { lastClaimedAt: lastClaim.claimedAt.toISOString(), lastAmount: lastClaim.claimAmount, canClaimAgain: hoursSinceClaim! >= 24 }
          : { neverClaimed: true },
        recentPoints: recent.map((r) => ({ what: r.description, points: r.amount, when: r.createdAt.toISOString().slice(0, 10) })),
        wallets: user.wallets,
        referralCode: user.referralCode,
        cfaMembership: member ?? 'not a CFA member (join at /nursery)',
      });
    },
    {
      name: 'get_my_account',
      description: "The signed-in user's OWN account: Kai Bar points total and recent points, daily drop status, wallets, referral code and CFA membership. Use for 'my points', 'can I claim', 'am I a member'. Returns signedIn:false for visitors.",
      schema: z.object({}),
    },
  );

  const lookupRecord = tool(
    async ({ recordId }: { recordId: string }) => {
      const prisma = await getPrisma();
      if (!prisma) return JSON.stringify({ error: 'database unavailable' });
      const id = recordId.trim().replace(/^.*\/verify\//, '');
      if (!/^[a-z0-9-]{8,40}$/i.test(id)) return JSON.stringify({ error: 'not a record id' });
      const record = await prisma.conservationRecord.findUnique({
        where: { id },
        select: { id: true, recordType: true, currentVersion: true, dataHash: true, verificationStatus: true, anchorStatus: true, avalancheTxHash: true, createdAt: true },
      });
      if (!record) return JSON.stringify({ found: false });
      const integrity = await checkRecordIntegrity(prisma, id);
      return JSON.stringify({
        found: true, ...record,
        integrityOk: integrity?.ok ?? false, problems: integrity?.problems ?? [],
        publicPage: `/verify/${record.id}`,
        note: 'verificationStatus SUBMITTED means not yet verified by Hedera Guardian; NOT_ANCHORED means no Avalanche proof yet.',
      });
    },
    {
      name: 'lookup_conservation_record',
      description: 'Look up a conservation (MRV) record by its id or /verify link: what it is, its SHA-256 fingerprint, whether its data still matches (integrity), and its verification and blockchain status.',
      schema: z.object({ recordId: z.string().describe('Record id, or a link containing /verify/<id>') }),
    },
  );

  const searchKnowledge = tool(
    async ({ query }: { query: string }) => {
      const results = askConservation(query).slice(0, 5);
      if (!results.length) return JSON.stringify({ results: [], note: 'Nothing in the hub content matches. Say so; do not invent.' });
      return JSON.stringify({
        results: results.map((r) => ({
          kind: r.kind, title: r.title, summary: r.summary, source: r.source,
          link: r.kind === 'methodology' && r.slug ? `/conservation/methodologies/${r.slug}` : undefined,
        })),
      });
    },
    {
      name: 'search_knowledge',
      description: 'Search the hub\'s own conservation content: methodologies (e.g. Jaza Miti, GTCI), knowledge articles and resources on tree planting, nurseries, species, restoration and conservation finance. Use it for any "how/what/why" conservation question and cite the titles you used.',
      schema: z.object({ query: z.string().describe('What to search for, in a few words') }),
    },
  );

  return [getNurserySummary, getMyAccount, lookupRecord, searchKnowledge];
}

// ── Prompt ────────────────────────────────────────────────────────────────────

const BASE_PROMPT = `You are KAI, the assistant inside the KAI Nuvari app. KAI Nuvari combines:
- DeFi on Avalanche C-Chain Fuji TESTNET (tokens NVR, yBOB, YTOKEN, YGOLD, GAMI, CENTS; yield vaults; swaps; M-Pesa and card payments; conservation NFTs; escrow; Kai Bar points and a daily drop),
- conservation work: the Oloolua Community Forest Association tree nursery (/nursery), tamper-evident conservation records (/verify/<id>) and the conservation Info Hub.

HOW TO ANSWER
- Use your tools for every fact about numbers, balances, APYs, prices, the nursery, records or the user's own account. Never invent or estimate them. If a tool has no data or fails, say that plainly.
- The conversation so far is included; use it to understand follow-up questions ("it", "that one", "how many more").
- For money actions (swap, buy, pay, send, escrow) call the matching prepare_* tool. It only creates a PLAN the user approves in their wallet. Never say a payment, swap or transfer happened.
- Never ask for seed phrases, private keys or passwords. If the user shared one (you will see [redacted …]), say clearly: never share it with anyone, KAI will never ask for it, and anyone who has it controls the wallet — move the funds to a new wallet now. KAI cannot restore wallets.
- Everything on-chain is on the Fuji testnet unless a tool says otherwise.
- Reply in the user's language (English or Swahili). Be clear and friendly. Point to the page where the user can act (e.g. /nursery, /mine, /wallet).`;

const MODE_PROMPT: Record<BrainMode, string> = {
  chat: '\n\nFORMAT: short paragraphs or bullet points; bold is fine. Do not use tables or headings.',
  voice: `\n\nVOICE MODE: this is spoken aloud.
- For an ACTION command, produce the plan and reply with ONE short confirmation sentence.
- For a QUESTION, answer in at most two short sentences. No lists, no markdown, no follow-up questions.`,
  ask: '\n\nASK MODE (conservation questions): call search_knowledge first, answer only from what it returns, and name the titles you used. If nothing matches, say the hub has no content on it yet. Use short paragraphs or bullet points — no tables or headings.',
};

// ── Run ───────────────────────────────────────────────────────────────────────

const MAX_TOOL_ROUNDS = 5;

/** Per-instance provider cooldowns after quota / rate-limit errors. */
const COOLDOWN_UNTIL = new Map<string, number>();
const QUOTA_COOLDOWN_MS = 10 * 60_000;
const RATE_COOLDOWN_MS = 60_000;
/** One model call. */
const CALL_TIMEOUT_MS = 25_000;
/** Whole answer, tool rounds included: stop calling tools after this. */
const ANSWER_DEADLINE_MS = 55_000;

function textOf(msg: AIMessage): string {
  if (typeof msg.content === 'string') return msg.content.trim();
  return msg.content
    .map((part) => (typeof part === 'string' ? part : 'text' in part && typeof part.text === 'string' ? part.text : ''))
    .join('')
    .trim();
}

/** Thrown when no model is configured or every model failed. */
export class BrainUnavailableError extends Error {}

/** Read-only agent tools every question may need. The rest are action tools. */
const CORE_AGENT_TOOLS = new Set(['get_apy', 'compare_apy', 'get_token_price', 'get_wallet_balance', 'get_token_balance']);
const ACTION_WORDS = /\b(swap|exchange|convert|trade|buy|purchase|sell|pay|payment|send|transfer|m-?pesa|nft|nfts|escrow|x402|release|refund|transaction|tx|monitor|approve|order|checkout)\b|0x[0-9a-fA-F]{64}/i;

/**
 * Whether this turn might need the money/escrow/NFT/x402 tools. Their schemas
 * are ~55% of each prompt, and Groq's free tier allows only 8k tokens a
 * minute, so they're sent only when the message — or the last turns, for
 * follow-ups like "yes, do it" — mention an action.
 */
function wantsActionTools(input: BrainInput): boolean {
  const recent = sanitizeHistory(input.history).slice(-3).map((t) => t.content).join('\n');
  const text = `${input.message}\n${recent}`;
  if (!ACTION_WORDS.test(text)) return false;
  // "Transfer 100 seedlings" / "approve this record" are nursery and
  // verification actions, not money: without a money word they don't need
  // (and must not be steered towards) the token tools.
  const onlyAmbiguous = !ACTION_WORDS.test(text.replace(/\b(transfer\w*|approv\w*)\b/gi, ''));
  if (onlyAmbiguous && (NURSERY_WORDS.test(text) || VERIFY_WORDS.test(text)) && !MONEY_WORDS.test(text)) return false;
  return true;
}

const MONEY_WORDS = /\b(nvr|ybob|ytoken|ygold|gami|cents|avax|usdc|kes|ksh|shillings?|tokens?|wallet|funds|money)\b|0x[0-9a-fA-F]{40}/i;

/**
 * Same idea for the nursery agent's three tool groups (lib/ai/nursery-agent.ts):
 * nursery records, CFA administration, and verification / evidence / anchoring.
 */
function nurseryGroups(input: BrainInput): NurseryToolGroups {
  const recent = sanitizeHistory(input.history).slice(-3).map((t) => t.content).join('\n');
  const hit = (re: RegExp) => re.test(input.message) || re.test(recent);
  return { nursery: hit(NURSERY_WORDS), admin: hit(CFA_ADMIN_WORDS), verify: hit(VERIFY_WORDS), quality: hit(QUALITY_WORDS) };
}

/** Portfolio Agent tools (lib/ai/portfolio-agent.ts), same routing idea. */
function wantsPortfolio(input: BrainInput): boolean {
  return mentions(input, PORTFOLIO_WORDS);
}

function mentions(input: BrainInput, re: RegExp): boolean {
  const recent = sanitizeHistory(input.history).slice(-3).map((t) => t.content).join('\n');
  return re.test(input.message) || re.test(recent);
}

/** Today's date in Kenya (UTC+3), so "today" / "yesterday" become real dates. */
function kenyaToday(): string {
  return new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 10);
}

export async function runKai(input: BrainInput): Promise<BrainResult> {
  const models = configuredModels(input.mode);
  if (!models.length) throw new BrainUnavailableError('No AI provider key is configured.');

  const plans: Record<string, unknown>[] = [];
  const toolsUsed: string[] = [];
  const withActions = wantsActionTools(input);
  const groups = nurseryGroups(input);
  // Quality/report tools alone (no other nursery words) still need the CFA context.
  const withNursery = groups.nursery || groups.admin || groups.verify || !!groups.quality;
  const withPortfolio = wantsPortfolio(input);
  const withCompliance = mentions(input, COMPLIANCE_WORDS);
  const withIdentity = mentions(input, IDENTITY_WORDS);
  const walletCtx = { privyUserId: input.privyUserId, connectedWallet: input.wallet ?? null };
  const shared = [
    ...AGENT_TOOLS
      .filter((t) => withActions || CORE_AGENT_TOOLS.has(t.name))
      .map((t) => fromAgentTool(t, (plan) => plans.push(plan))),
    ...appDataTools(input),
  ];
  // The nursery tools come in two schema styles with the same code behind
  // them: optional fields may be null for Groq/NVIDIA (gpt-oss sends null and
  // Groq rejects that against a plain "optional"), but not for Gemini (which
  // rejects null types). Tools are always RUN from the null-tolerant set.
  const onNurseryPlan = (plan: object) => plans.push({ ...plan });
  // Optional field style per provider (see the comment above).
  const optional = (nullable: boolean) => <T extends z.ZodTypeAny>(schema: T): z.ZodTypeAny => (nullable ? schema.nullish() : schema.optional());
  const variant = (nullable: boolean) => [
    ...shared,
    ...(withNursery ? nurseryTools(input.privyUserId, onNurseryPlan, groups, nullable) : []),
    ...(withPortfolio ? portfolioTools(walletCtx, onNurseryPlan, nullable) : []),
    ...(withCompliance ? complianceTools(input.privyUserId, optional(nullable)) : []),
    ...(withIdentity ? identityTools(input.privyUserId, walletCtx.connectedWallet, optional(nullable)) : []),
  ];
  const tools = variant(true);
  const geminiTools = variant(false);
  const byName = new Map(tools.map((t) => [t.name, t]));

  const bound = models.map((m) => ({
    name: m.name,
    llm: m.model.bindTools(m.name.startsWith('gemini/') ? geminiTools : tools) as Runnable<BaseLanguageModelInput, AIMessage>,
  }));

  // Fallback chain, done by hand (not Runnable.withFallbacks) so each
  // provider's failure is logged by name and we know who answered. A provider
  // that failed once in this request is skipped for the rest of it.
  const dead = new Set<string>();
  let answeredBy = bound[0].name;
  const invoke = async (msgs: BaseMessage[]): Promise<AIMessage> => {
    let lastErr: unknown;
    const available = bound.filter((b) => !dead.has(b.name) && (COOLDOWN_UNTIL.get(b.name) ?? 0) <= Date.now());
    // If every provider is cooling down, try them anyway rather than fail.
    for (const b of available.length ? available : bound.filter((x) => !dead.has(x.name))) {
      try {
        // Per-call timeout for every provider (the Gemini client has no
        // timeout of its own; a hung call would stall until the function dies).
        const ai = await b.llm.invoke(msgs, { timeout: CALL_TIMEOUT_MS });
        answeredBy = b.name;
        return ai;
      } catch (e) {
        dead.add(b.name);
        lastErr = e;
        const msg = e instanceof Error ? e.message : String(e);
        // Quota exhausted → skip this provider for a while instead of paying a
        // failed round-trip on every question.
        if (/quota|429|rate.?limit|too many requests/i.test(msg)) {
          const ms = /quota/i.test(msg) ? QUOTA_COOLDOWN_MS : RATE_COOLDOWN_MS;
          COOLDOWN_UNTIL.set(b.name, Date.now() + ms);
          console.error(`[kai-brain] ${b.name} rate-limited; skipping it for ${ms / 60_000} min`);
        } else {
          console.error(`[kai-brain] ${b.name} failed:`, msg.slice(0, 300));
        }
      }
    }
    throw lastErr ?? new Error('no model available');
  };

  const facts = [
    `Today is ${kenyaToday()} (Kenya).`,
    input.privyUserId ? 'The user is signed in (get_my_account works).' : 'The user is NOT signed in.',
    input.wallet && /^0x[a-fA-F0-9]{40}$/.test(input.wallet) ? `Connected wallet: ${input.wallet} (use it with balance tools).` : '',
    input.pageContext ?? '',
  ].filter(Boolean).join('\n');

  const messages: BaseMessage[] = [
    new SystemMessage(BASE_PROMPT
      + (withNursery ? NURSERY_PROMPT : '') + (groups.admin ? ADMIN_PROMPT : '') + (groups.verify ? VERIFY_PROMPT : '')
      + (groups.quality ? QUALITY_PROMPT : '') + (withPortfolio ? PORTFOLIO_PROMPT : '')
      + (withCompliance ? COMPLIANCE_PROMPT : '') + (withIdentity ? IDENTITY_PROMPT : '')
      + MODE_PROMPT[input.mode] + (facts ? `\n\nCONTEXT\n${facts}` : '')),
    ...sanitizeHistory(input.history).map((t) => (t.role === 'user' ? new HumanMessage(t.content) : new AIMessage(t.content))),
    new HumanMessage(redactSecrets(input.message)),
  ];

  let last: AIMessage | null = null;
  const startedAt = Date.now();
  try {
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const ai = await invoke(messages);
      last = ai;
      const calls = ai.tool_calls ?? [];
      if (!calls.length || round === MAX_TOOL_ROUNDS) break;
      // Out of time: answer with what the model already said rather than
      // start another tool round.
      if (Date.now() - startedAt > ANSWER_DEADLINE_MS) break;

      // Send the turn back as plain text + tool calls. Some providers return
      // structured/reasoning content blocks that others (NVIDIA) reject when
      // echoed back ("Input should be a valid dictionary or instance of Content").
      messages.push(new AIMessage({ content: textOf(ai), tool_calls: calls }));
      for (const call of calls) {
        const t = byName.get(call.name);
        try { input.onToolStart?.(call.name); } catch { /* a UI callback must never break the answer */ }
        let output: string;
        try {
          output = t ? String(await invokeWithReconnect(t, call.args)) : JSON.stringify({ error: `Unknown tool ${call.name}` });
          if (t) toolsUsed.push(call.name);
        } catch (e) {
          console.error(`[kai-brain] tool ${call.name} failed`, e);
          output = JSON.stringify({ error: 'This data is unavailable right now.' });
        }
        messages.push(new ToolMessage({ content: output, tool_call_id: call.id ?? call.name, name: call.name }));
      }
    }
  } catch (e) {
    console.error('[kai-brain] all models failed', e);
    throw new BrainUnavailableError('All AI providers failed.');
  }

  const text = last ? textOf(last) : '';
  return {
    text: text || (plans.some((p) => p.kind === 'nursery')
      ? 'I prepared a draft. Please check it and press "Confirm and save".'
      : plans.length ? 'I prepared that for you. Please review and approve it in your wallet.' : 'I could not work that out. Please try asking another way.'),
    plans,
    toolsUsed,
    provider: answeredBy,
  };
}
