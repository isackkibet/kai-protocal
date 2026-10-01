/**
 * Portfolio Agent (Ecosystem PRD v1.1 §5.6, P0) — the wallet, pool, vault
 * and portfolio tools of lib/defi/tools.ts described to the model. Like the
 * nursery agent it is not a separate model: the shared KAI brain adds these
 * tools and rules when a message is about the user's money.
 *
 * Execution (§4.20): the execute_* tools only PREPARE a plan; the user signs
 * it in their own wallet on the Vaults / Pools page. The agent never trades.
 */
import { tool, type StructuredToolInterface } from '@langchain/core/tools';
import { z } from 'zod';
import type { ToolResult } from '@/lib/nursery/agent-logic';
import {
  computeLpShare, computeSwapAmount, computeVaultDeposit, computeVaultWithdrawal, estimateGasCost, getPoolInfo, getPortfolioSummary,
  getTokenInfo, getTxHistory, getUnrealizedIl, getVaultInfo, getVaultYieldHistory, listAllPools, listAllVaults, listUserWallets,
  prepareAddLiquidity, prepareRemoveLiquidity, prepareVaultDeposit, prepareVaultWithdrawal, recommendYieldStrategy, resolveAddress,
  verifyPaymentReceipt, type DefiPlan, type WalletContext,
} from '@/lib/defi/tools';
import { defiAdminWallets } from '@/lib/defi/vaults';
import { fail, ok as okResult } from '@/lib/nursery/agent-logic';

export const PORTFOLIO_WORDS =
  /\b(optimi[sz]\w*|best (yield|return|place)|where (should|to) (i )?(put|invest)|invest\w*|returns?|payments?|receipt|paid|reference|create (a )?vault|new vault|deploy\w*|portfolio|holdings?|my (wallet|tokens|money|funds|balance)|net worth|allocation|exposure|risk|pools?|liquidity|lp|vaults?|yield|apy|deposit|withdraw\w*|impermanent|il|gas|fees?|transactions?|tx history|history of my|price impact|slippage|stablecoin|diversif\w*|rebalanc\w*|shares?|nvr|ybob|ytoken|ygold|gami|cents|avax)\b/i;

type Opt = <T extends z.ZodTypeAny>(schema: T) => z.ZodTypeAny;
type NoNull<T> = { [K in keyof T]: Exclude<T[K], null> };
const clean = <T extends object>(args: T) => Object.fromEntries(Object.entries(args).filter(([, v]) => v !== null)) as NoNull<T>;

function render(result: ToolResult<unknown>, onPlan?: (p: DefiPlan) => void): string {
  if (result.success && onPlan && (result.data as DefiPlan)?.kind === 'defi') {
    const plan = result.data as DefiPlan;
    onPlan(plan);
    return JSON.stringify({ success: true, plan: plan.summary, page: plan.page, deadline: plan.deadline, note: `NOT executed. The user reviews and signs it in their own wallet on ${plan.page}.` });
  }
  // bigint is not JSON: tools already format amounts as strings.
  return JSON.stringify(result);
}

export function portfolioTools(ctx: WalletContext, onPlan: (plan: DefiPlan) => void, nullable = true): StructuredToolInterface[] {
  const o: Opt = (schema) => (nullable ? schema.nullish() : schema.optional());
  const amount = () => z.union([z.string(), z.number()]).describe('Amount in tokens, e.g. "10" or 2.5');
  return [
    tool(async (i) => render(await getPortfolioSummary(ctx, clean(i).wallet)), {
      name: 'get_portfolio_summary',
      description: "The user's OWN holdings (AVAX, KAI tokens), LP positions and vault shares with USD value, allocation, risks and opportunities. Never for someone else's address.",
      schema: z.object({ wallet: o(z.string()).describe('Only if the user has several wallets') }),
    }),
    tool(async () => render(await listUserWallets(ctx)), {
      name: 'list_user_wallets',
      description: "The user's own wallets: linked to their sign-in, and the one connected in the browser.",
      schema: z.object({}),
    }),
    tool(async ({ query }) => render(await resolveAddress(query)), {
      name: 'resolve_ens_or_address',
      description: 'Check an address, or turn a KAI token / pool / vault name into its address.',
      schema: z.object({ query: z.string() }),
    }),
    tool(async ({ token }) => render(await getTokenInfo(token)), {
      name: 'get_token_info',
      description: 'Token name, symbol, decimals, total supply and reference price, read on-chain.',
      schema: z.object({ token: z.string().describe('Symbol (NVR, yBOB, YTOKEN, YGOLD, GAMI, CENTS) or address') }),
    }),
    tool(async (i) => render(await listAllPools(clean(i))), {
      name: 'list_all_pools',
      description: 'All KAI AMM pools with live reserves, price, TVL and a low-liquidity flag.',
      schema: z.object({ token: o(z.string()).describe('Only pools containing this token') }),
    }),
    tool(async ({ pool }) => render(await getPoolInfo(pool)), {
      name: 'get_pool_info',
      description: 'One pool: reserves, price, LP supply, TVL, fee.',
      schema: z.object({ pool: z.string().describe('e.g. NVR/yBOB') }),
    }),
    tool(async (i) => render(await computeSwapAmount(clean(i) as never)), {
      name: 'compute_swap_amount',
      description: 'Simulate a swap exactly like the pool contract: amount out, 0.3% fee, price impact, minimum received at a slippage.',
      schema: z.object({ tokenIn: z.string(), tokenOut: z.string(), amountIn: amount(), slippagePct: o(z.number()) }),
    }),
    tool(async (i) => render(await computeLpShare(i as never)), {
      name: 'compute_lp_share',
      description: 'LP tokens and pool share for adding liquidity.',
      schema: z.object({ pool: z.string(), amountA: amount(), amountB: amount() }),
    }),
    tool(async (i) => render(await listAllVaults(clean(i))), {
      name: 'list_all_vaults',
      description: 'All yield vaults with APY, TVL and share price, highest APY first.',
      schema: z.object({ minApyPct: o(z.number()), token: o(z.string()) }),
    }),
    tool(async ({ vault }) => render(await getVaultInfo(vault)), {
      name: 'get_vault_info',
      description: 'One vault: APY, TVL, share price, underlying token, strategy.',
      schema: z.object({ vault: z.string().describe('e.g. kvNVR or NVR') }),
    }),
    tool(async ({ vault }) => render(await getVaultYieldHistory(vault)), {
      name: 'get_vault_yield_history',
      description: 'Past APY/TVL of a vault (only current values exist so far).',
      schema: z.object({ vault: z.string() }),
    }),
    tool(async (i) => render(await computeVaultDeposit(i as never)), {
      name: 'compute_vault_deposit',
      description: 'Simulate a vault deposit: shares minted and expected yearly yield.',
      schema: z.object({ vault: z.string(), amount: amount() }),
    }),
    tool(async (i) => render(await computeVaultWithdrawal(i as never)), {
      name: 'compute_vault_withdrawal',
      description: 'Simulate a vault withdrawal: tokens received for burning shares.',
      schema: z.object({ vault: z.string(), shares: amount() }),
    }),
    tool(async (i) => render(await getUnrealizedIl(ctx, clean(i) as never)), {
      name: 'get_unrealized_il',
      description: "Impermanent loss of the user's own LP position. Needs the USD prices of both tokens when they added liquidity; ask if not given.",
      schema: z.object({ pool: z.string(), entryPrice0: o(z.number()), entryPrice1: o(z.number()), wallet: o(z.string()) }),
    }),
    tool(async ({ txType }) => render(await estimateGasCost(txType)), {
      name: 'estimate_gas_cost',
      description: 'Gas cost in AVAX and USD for a transaction type.',
      schema: z.object({ txType: z.enum(['transfer', 'approve', 'swap', 'add_liquidity', 'remove_liquidity', 'vault_deposit', 'vault_withdrawal']) }),
    }),
    tool(async (i) => render(await getTxHistory(ctx, clean(i))), {
      name: 'get_tx_history',
      description: "Recent transactions of the user's own wallet.",
      schema: z.object({ wallet: o(z.string()), limit: o(z.number().int()) }),
    }),
    tool(async (i) => render(await recommendYieldStrategy(ctx, clean(i) as never)), {
      name: 'recommend_yield_strategy',
      description: "Yield Optimizer: rank vaults and pools for the user's capital, risk tolerance and time horizon, with expected yield, IL risk, break-even days, risks, and a split of at most 30% per option.",
      schema: z.object({
        capitalUsd: o(z.number()).describe('USD to invest; default: the wallet balance'),
        riskTolerance: o(z.enum(['conservative', 'moderate', 'aggressive'])),
        horizonDays: o(z.number().int()),
        token: o(z.string()).describe('Only options for this token'),
      }),
    }),
    tool(async ({ reference }) => render(await verifyPaymentReceipt(ctx, reference)), {
      name: 'verify_payment_receipt',
      description: "Status (completed / pending / failed) of the user's own Paystack or M-Pesa payment by its reference.",
      schema: z.object({ reference: z.string() }),
    }),
    tool(async ({ token, apyPct }) => {
      const wallet = ctx.connectedWallet?.toLowerCase() ?? '';
      if (!defiAdminWallets().includes(wallet)) return render(fail('create_vault', 'FORBIDDEN', 'Only a DeFi admin wallet can create vaults.'));
      return render(okResult('create_vault', {
        page: `/vaults/new`, token, apyPct,
        note: 'Deploying is done from the admin\'s own wallet on /vaults/new; the chat cannot deploy. The app checks the deployment and lists the vault.',
      }));
    }, {
      name: 'create_vault',
      description: 'Admin only: start creating a new yield vault (points to /vaults/new where the admin wallet deploys it).',
      schema: z.object({ token: z.string(), apyPct: z.number() }),
    }),
    tool(async (i) => render(await prepareVaultDeposit(ctx, i as never), onPlan), {
      name: 'execute_vault_deposit_tx',
      description: 'PREPARE (never sends) a vault deposit plan; the user signs it on /vaults. Checks the balance.',
      schema: z.object({ vault: z.string(), amount: amount() }),
    }),
    tool(async (i) => render(await prepareVaultWithdrawal(ctx, i as never), onPlan), {
      name: 'execute_vault_withdrawal_tx',
      description: 'PREPARE (never sends) a vault withdrawal plan; the user signs it on /vaults.',
      schema: z.object({ vault: z.string(), shares: amount() }),
    }),
    tool(async (i) => render(await prepareAddLiquidity(ctx, i as never), onPlan), {
      name: 'execute_add_liquidity_tx',
      description: 'PREPARE (never sends) adding liquidity with a minimum-LP slippage guard; the user signs it on /pools.',
      schema: z.object({ pool: z.string(), amountA: amount(), amountB: amount() }),
    }),
    tool(async (i) => render(await prepareRemoveLiquidity(ctx, i as never), onPlan), {
      name: 'execute_remove_liquidity_tx',
      description: 'PREPARE (never sends) removing liquidity with minimum amounts; the user signs it on /pools.',
      schema: z.object({ pool: z.string(), lpTokens: amount() }),
    }),
  ];
}

export const PORTFOLIO_PROMPT = `

PORTFOLIO AGENT (the user's own wallet, pools and vaults on Fuji testnet)
- Only the user's own wallets. If they ask about another address's holdings, refuse politely.
- Numbers come from the tools (read live on-chain). USD values use reference testnet prices: say so once.
- If a tool result has stale: true, say the data may be out of date.
- Explain impermanent loss plainly: the LP is compared with simply holding the same tokens; fees are not included.
- Point out risks the tools report (concentration over 50%, low-liquidity pools under $10,000, high price impact) and say how to reduce them; never promise yields.
- To act (deposit, withdraw, add or remove liquidity, swap) use the execute_* / prepare_swap tools: they only PREPARE a plan. Never say a transaction happened; the user signs on the page named in the plan.

YIELD OPTIMIZER (recommend_yield_strategy)
- Ask for risk tolerance and time horizon if not given (default moderate, 90 days) and say what you assumed.
- State the tool's assumptions, always include impermanent-loss risk, warn about pools under $10,000 TVL and illiquid assets, never put more than 30% in one option, and never suggest more than the wallet holds.`;
