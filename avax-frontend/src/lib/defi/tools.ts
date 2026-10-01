import { getAddress, type Address } from 'viem';
import { getPrisma } from '@/lib/db/db';
import { fail, ok, type ToolResult } from '@/lib/nursery/agent-logic';
import {
  POOL_LIST, VAULT_LIST, allVaults, findPool, findVault, findVaultAny, gasPriceWei, poolState, referencePrice, symbolOf, tokenBySymbolOrAddress,
  tokenInfo, txHistory, vaultState, walletPositions,
} from './chain';
import {
  fromUnits, impermanentLoss, isStale, quoteAddLiquidity, quoteRemoveLiquidity, quoteSwap, toUnits, vaultAssetsFor, vaultSharesFor,
} from './math';
import { ASSUMED_VOLATILITY, RISK_PREMIUM_PCT_PER_YEAR, allocate, scoreOptions, type RiskTolerance, type YieldOption } from './yield';

/**
 * KAI wallet, token, pool, vault and portfolio tools (Ecosystem PRD v1.1
 * §4.13-§4.16, §4.19-§4.20). Plain functions with the standard ToolResult.
 *
 * Execution safety (§4.20): nothing here signs or sends. The prepare_*
 * functions return a PLAN (kind 'defi') with slippage protection (minOut)
 * and a 20-minute deadline; the user reviews it and signs in their own
 * wallet on the Vaults / Pools / Swap page. Kanuvari never holds keys.
 *
 * Privacy (§5.6): wallet-specific tools only answer for the caller's own
 * wallets — the ones linked to their sign-in, or the one connected in their
 * browser — never an address someone types into the chat.
 */

export interface WalletContext {
  privyUserId: string | null;
  /** Wallet connected in the user's browser (MetaMask / Core / Privy embedded). */
  connectedWallet: string | null;
}

const ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const SLIPPAGE_BPS = 50; // 0.5% default
const DEADLINE_MIN = 20;

function stamp(fetchedAt: number) {
  return { dataAge: `${Math.round((Date.now() - fetchedAt) / 1000)}s`, stale: isStale(fetchedAt) };
}
const PRICE_NOTE = 'USD values use reference testnet prices, not a market price.';

/** Wallets this user may ask about. */
export async function ownedWallets(ctx: WalletContext): Promise<string[]> {
  const out = new Set<string>();
  if (ctx.connectedWallet && ADDRESS.test(ctx.connectedWallet)) out.add(ctx.connectedWallet.toLowerCase());
  if (ctx.privyUserId) {
    const prisma = await getPrisma();
    const user = prisma ? await prisma.kaiUser.findUnique({ where: { privyUserId: ctx.privyUserId }, select: { wallets: { select: { address: true } } } }).catch(() => null) : null;
    for (const w of user?.wallets ?? []) if (ADDRESS.test(w.address)) out.add(w.address.toLowerCase());
  }
  return [...out];
}

async function ownWallet(tool: string, ctx: WalletContext, requested?: string): Promise<Address | ToolResult<never>> {
  const mine = await ownedWallets(ctx);
  if (!mine.length) return fail(tool, 'UNAUTHORIZED', 'No wallet is connected. Ask the user to connect their wallet or sign in.');
  if (requested?.trim()) {
    if (!ADDRESS.test(requested.trim())) return fail(tool, 'INVALID_INPUT', 'That is not a wallet address.');
    if (!mine.includes(requested.trim().toLowerCase())) {
      return fail(tool, 'FORBIDDEN', "I can only look at the user's own wallets (connected or linked to their sign-in), never someone else's.");
    }
    return getAddress(requested.trim());
  }
  return getAddress(mine[0]);
}
const isFail = (x: unknown): x is ToolResult<never> => !!x && typeof x === 'object' && 'success' in x;

async function rpc<T>(tool: string, fn: () => Promise<T>): Promise<T | ToolResult<never>> {
  try {
    return await fn();
  } catch (e) {
    return fail(tool, 'RPC_ERROR', `Could not read Avalanche Fuji right now (${e instanceof Error ? e.message.slice(0, 120) : 'network error'}).`);
  }
}

// ── Wallets (§4.13) ───────────────────────────────────────────────────────────

export async function listUserWallets(ctx: WalletContext) {
  const tool = 'list_user_wallets';
  if (!ctx.privyUserId && !ctx.connectedWallet) return fail(tool, 'UNAUTHORIZED', 'The user is not signed in and has no wallet connected.');
  const prisma = await getPrisma();
  const linked = ctx.privyUserId && prisma
    ? (await prisma.kaiUser.findUnique({ where: { privyUserId: ctx.privyUserId }, select: { wallets: { select: { chain: true, address: true, createdAt: true } } } }))?.wallets ?? []
    : [];
  return ok(tool, {
    linked: linked.map((w) => ({ address: w.address, chain: w.chain, since: w.createdAt.toISOString().slice(0, 10) })),
    connectedInBrowser: ctx.connectedWallet && ADDRESS.test(ctx.connectedWallet) ? ctx.connectedWallet : null,
    note: 'Wallets are created and linked by signing in (Privy) or connecting MetaMask/Core on the Wallet page. Kanuvari never stores private keys.',
  });
}

/** §4.13 resolve_ens_or_address: Avalanche has no ENS here, so: address check, or a KAI token / pool / vault name. */
export async function resolveAddress(q: string) {
  const tool = 'resolve_ens_or_address';
  const s = q.trim();
  if (ADDRESS.test(s)) {
    const known = tokenBySymbolOrAddress(s) ?? findPool(s) ?? findVault(s);
    return ok(tool, { isValid: true, resolvedAddress: getAddress(s), knownAs: known ? ('id' in known ? known.id : known.symbol) : null });
  }
  const token = tokenBySymbolOrAddress(s);
  if (token) return ok(tool, { isValid: true, resolvedAddress: token.address, knownAs: `${token.symbol} token` });
  const pool = findPool(s);
  if (pool) return ok(tool, { isValid: true, resolvedAddress: pool.address, knownAs: `${pool.id} pool` });
  const vault = await findVaultAny(s);
  if (vault) return ok(tool, { isValid: true, resolvedAddress: vault.address, knownAs: `${vault.id} vault` });
  return ok(tool, { isValid: false, resolvedAddress: null, note: 'Not an address, and not a KAI token, pool or vault name. Names like .eth are not used on Avalanche here.' });
}

// ── Tokens and pools (§4.14) ─────────────────────────────────────────────────

export async function getTokenInfo(q: string) {
  const tool = 'get_token_info';
  const t = tokenBySymbolOrAddress(q);
  if (!t) return fail(tool, 'NOT_FOUND', `"${q}" is not a KAI token.`, POOL_LIST.length ? [...new Set(POOL_LIST.flatMap((p) => [symbolOf(p.tokenA), symbolOf(p.tokenB)]))] : []);
  const r = await rpc(tool, () => tokenInfo(t.address));
  if (isFail(r)) return r;
  return ok(tool, { ...r.value, referencePriceUsd: referencePrice(t.symbol), ...stamp(r.fetchedAt), note: PRICE_NOTE });
}

function poolView(p: Awaited<ReturnType<typeof poolState>>['value']) {
  return {
    poolId: p.id, address: p.address,
    reserves: { [p.symbolA]: fromUnits(p.reserveA, 18, 4), [p.symbolB]: fromUnits(p.reserveB, 18, 4) },
    price: p.reserveA > BigInt(0) ? `1 ${p.symbolA} = ${(Number(p.reserveB) / Number(p.reserveA)).toFixed(6)} ${p.symbolB}` : 'empty pool',
    lpSupply: fromUnits(p.lpSupply, 18, 4),
    tvlUsd: p.tvlUsd != null ? Math.round(p.tvlUsd * 100) / 100 : null,
    feePct: 0.3,
    apy: null as number | null,
    lowLiquidity: p.tvlUsd != null && p.tvlUsd < 10_000,
  };
}

export async function listAllPools(filter?: { token?: string }) {
  const tool = 'list_all_pools';
  const pools = filter?.token?.trim()
    ? POOL_LIST.filter((p) => [symbolOf(p.tokenA), symbolOf(p.tokenB)].some((s) => s.toLowerCase() === filter.token!.trim().toLowerCase()))
    : POOL_LIST;
  const r = await rpc(tool, () => Promise.all(pools.map(poolState)));
  if (isFail(r)) return r;
  return ok(tool, {
    pools: r.map((x) => poolView(x.value)),
    ...stamp(Math.min(...r.map((x) => x.fetchedAt))),
    note: `${PRICE_NOTE} Pool APY needs trading-volume history, which is not recorded yet, so it is shown as null.`,
  });
}

export async function getPoolInfo(q: string) {
  const tool = 'get_pool_info';
  const pool = findPool(q);
  if (!pool) return fail(tool, 'NOT_FOUND', `No pool "${q}".`, POOL_LIST.map((p) => p.id));
  const r = await rpc(tool, () => poolState(pool));
  if (isFail(r)) return r;
  return ok(tool, { ...poolView(r.value), ...stamp(r.fetchedAt), note: PRICE_NOTE });
}

function poolFor(tokenIn: string, tokenOut: string) {
  const a = tokenBySymbolOrAddress(tokenIn), b = tokenBySymbolOrAddress(tokenOut);
  if (!a || !b) return null;
  const pool = POOL_LIST.find((p) => (p.tokenA === a.address && p.tokenB === b.address) || (p.tokenA === b.address && p.tokenB === a.address));
  return pool ? { pool, a, b } : null;
}

/** §4.14 compute_swap_amount: exactly KaiPool.getAmountOut, plus impact and minOut. */
export async function computeSwapAmount(input: { tokenIn: string; tokenOut: string; amountIn: string | number; slippagePct?: number }) {
  const tool = 'compute_swap_amount';
  const found = poolFor(input.tokenIn, input.tokenOut);
  if (!found) return fail(tool, 'NOT_FOUND', `There is no ${input.tokenIn}/${input.tokenOut} pool.`, POOL_LIST.map((p) => p.id));
  let amountIn: bigint;
  try { amountIn = toUnits(input.amountIn); } catch { return fail(tool, 'INVALID_QUANTITY', 'The amount must be a positive number.'); }
  if (amountIn === BigInt(0)) return fail(tool, 'INVALID_QUANTITY', 'The amount must be above zero.');
  const slippageBps = Math.round((input.slippagePct ?? SLIPPAGE_BPS / 100) * 100);
  if (slippageBps < 1 || slippageBps > 5000) return fail(tool, 'INVALID_INPUT', 'Slippage must be between 0.01% and 50%.');
  const r = await rpc(tool, () => poolState(found.pool));
  if (isFail(r)) return r;
  const p = r.value;
  const aIsA = found.a.address === p.tokenA;
  const q = quoteSwap(amountIn, aIsA ? p.reserveA : p.reserveB, aIsA ? p.reserveB : p.reserveA, slippageBps);
  if (q.amountOut === BigInt(0)) return fail(tool, 'NOT_FOUND', 'This pool has no liquidity yet.');
  return ok(tool, {
    pool: p.id,
    amountIn: `${fromUnits(amountIn)} ${found.a.symbol}`,
    amountOut: `${fromUnits(q.amountOut)} ${found.b.symbol}`,
    minimumReceived: `${fromUnits(q.minOut)} ${found.b.symbol} (at ${slippageBps / 100}% slippage)`,
    fee: `${fromUnits(q.fee)} ${found.a.symbol} (0.3%, stays in the pool for LPs)`,
    priceImpactPct: Math.round(q.priceImpact * 10000) / 100,
    warning: q.priceImpact > 0.05 ? 'Price impact is above 5%: the pool is small for this trade.' : null,
    ...stamp(r.fetchedAt),
  });
}

/** §4.14 compute_lp_share */
export async function computeLpShare(input: { pool: string; amountA: string | number; amountB: string | number }) {
  const tool = 'compute_lp_share';
  const pool = findPool(input.pool);
  if (!pool) return fail(tool, 'NOT_FOUND', `No pool "${input.pool}".`, POOL_LIST.map((p) => p.id));
  let a: bigint, b: bigint;
  try { a = toUnits(input.amountA); b = toUnits(input.amountB); } catch { return fail(tool, 'INVALID_QUANTITY', 'Both amounts must be positive numbers.'); }
  const r = await rpc(tool, () => poolState(pool));
  if (isFail(r)) return r;
  const p = r.value;
  try {
    const q = quoteAddLiquidity(a, b, p.reserveA, p.reserveB, p.lpSupply);
    const usedA = p.lpSupply > BigInt(0) ? (q.lpTokens * p.reserveA) / p.lpSupply : a;
    const usedB = p.lpSupply > BigInt(0) ? (q.lpTokens * p.reserveB) / p.lpSupply : b;
    return ok(tool, {
      pool: p.id, lpTokens: fromUnits(q.lpTokens), sharePct: Math.round(q.sharePct * 10000) / 10000,
      poolRatio: `1 ${p.symbolA} : ${q.poolRatioBPerA.toFixed(6)} ${p.symbolB}`,
      note: `Only the ratio-matched part earns LP tokens (about ${fromUnits(usedA, 18, 4)} ${p.symbolA} + ${fromUnits(usedB, 18, 4)} ${p.symbolB}); send amounts in the pool ratio to avoid giving the rest to the pool.`,
      ...stamp(r.fetchedAt),
    });
  } catch (e) {
    return fail(tool, 'INVALID_QUANTITY', e instanceof Error ? e.message : 'Invalid amounts.');
  }
}

// ── Vaults (§4.15) ────────────────────────────────────────────────────────────

function vaultView(v: Awaited<ReturnType<typeof vaultState>>['value']) {
  return {
    vaultId: v.id, address: v.address, underlyingToken: v.symbol,
    apyPct: v.apyBps / 100, tvl: `${fromUnits(v.totalAssets, 18, 2)} ${v.symbol}`,
    tvlUsd: v.tvlUsd != null ? Math.round(v.tvlUsd * 100) / 100 : null,
    sharePrice: `${fromUnits(v.sharePrice, 18, 6)} ${v.symbol} per share`,
    strategy: 'Single-asset yield vault (KaiVault); yield is added by the protocol and raises the share price.',
  };
}

export async function listAllVaults(filter?: { minApyPct?: number; token?: string }) {
  const tool = 'list_all_vaults';
  const r = await rpc(tool, async () => Promise.all((await allVaults()).map(vaultState)));
  if (isFail(r)) return r;
  const vaults = r.map((x) => vaultView(x.value))
    .filter((v) => filter?.minApyPct == null || v.apyPct >= filter.minApyPct)
    .filter((v) => !filter?.token || v.underlyingToken.toLowerCase() === filter.token.toLowerCase())
    .sort((a, b) => b.apyPct - a.apyPct);
  return ok(tool, { vaults, ...stamp(Math.min(...r.map((x) => x.fetchedAt))), note: `APY is the rate set in each vault contract. ${PRICE_NOTE}` });
}

export async function getVaultInfo(q: string) {
  const tool = 'get_vault_info';
  const vault = await findVaultAny(q);
  if (!vault) return fail(tool, 'NOT_FOUND', `No vault "${q}".`, (await allVaults()).map((v) => v.id));
  const r = await rpc(tool, () => vaultState(vault));
  if (isFail(r)) return r;
  return ok(tool, { ...vaultView(r.value), ...stamp(r.fetchedAt) });
}

export async function computeVaultDeposit(input: { vault: string; amount: string | number }) {
  const tool = 'compute_vault_deposit';
  const vault = await findVaultAny(input.vault);
  if (!vault) return fail(tool, 'NOT_FOUND', `No vault "${input.vault}".`, (await allVaults()).map((v) => v.id));
  let amount: bigint;
  try { amount = toUnits(input.amount); } catch { return fail(tool, 'INVALID_QUANTITY', 'The amount must be a positive number.'); }
  const r = await rpc(tool, () => vaultState(vault));
  if (isFail(r)) return r;
  const shares = vaultSharesFor(amount, r.value.totalAssets, r.value.totalShares);
  const yearly = Number(fromUnits(amount)) * (r.value.apyBps / 10_000);
  return ok(tool, {
    vault: vault.id, deposit: `${fromUnits(amount)} ${vault.symbol}`, sharesMinted: fromUnits(shares),
    sharePrice: fromUnits(r.value.sharePrice), expectedYieldPerYear: `${yearly.toFixed(4)} ${vault.symbol} at ${r.value.apyBps / 100}% (not guaranteed)`,
    ...stamp(r.fetchedAt),
  });
}

export async function computeVaultWithdrawal(input: { vault: string; shares: string | number }) {
  const tool = 'compute_vault_withdrawal';
  const vault = await findVaultAny(input.vault);
  if (!vault) return fail(tool, 'NOT_FOUND', `No vault "${input.vault}".`, (await allVaults()).map((v) => v.id));
  let shares: bigint;
  try { shares = toUnits(input.shares); } catch { return fail(tool, 'INVALID_QUANTITY', 'Shares must be a positive number.'); }
  const r = await rpc(tool, () => vaultState(vault));
  if (isFail(r)) return r;
  if (shares > r.value.totalShares) return fail(tool, 'INVALID_QUANTITY', 'That is more shares than the vault has.');
  return ok(tool, { vault: vault.id, sharesBurned: fromUnits(shares), amountOut: `${fromUnits(vaultAssetsFor(shares, r.value.totalAssets, r.value.totalShares))} ${vault.symbol}`, ...stamp(r.fetchedAt) });
}

/** §4.15 get_vault_yield_history: history is not stored yet; say so instead of inventing it. */
export async function getVaultYieldHistory(q: string) {
  const tool = 'get_vault_yield_history';
  const info = await getVaultInfo(q);
  if (!info.success) return { ...info, metadata: { ...info.metadata, tool } };
  return ok(tool, { current: info.data, history: [], note: 'Daily APY/TVL history is not recorded yet (no vault_yield_history table). Only the current values are real.' });
}

// ── Portfolio and transactions (§4.16) ───────────────────────────────────────

export async function getPortfolioSummary(ctx: WalletContext, wallet?: string) {
  const tool = 'get_portfolio_summary';
  const addr = await ownWallet(tool, ctx, wallet);
  if (isFail(addr)) return addr;
  const r = await rpc(tool, async () => {
    const pos = await walletPositions(addr);
    const pools = await Promise.all(pos.value.lps.filter((l) => l.lp > BigInt(0)).map(async (l) => ({ l, s: (await poolState(l.pool)).value })));
    const vaults = await Promise.all(pos.value.vaultShares.filter((v) => v.shares > BigInt(0)).map(async (v) => ({ v, s: (await vaultState(v.vault)).value })));
    return { pos, pools, vaults };
  });
  if (isFail(r)) return r;
  const { pos, pools, vaults } = r;
  const usd = (sym: string, amount: bigint) => { const p = referencePrice(sym); return p == null ? null : Number(fromUnits(amount)) * p; };

  const holdings = [
    { asset: 'AVAX', amount: fromUnits(pos.value.avax), usd: usd('AVAX', pos.value.avax) },
    ...pos.value.tokens.filter((t) => t.balance > BigInt(0)).map((t) => ({ asset: t.symbol, amount: fromUnits(t.balance), usd: usd(t.symbol, t.balance) })),
  ];
  const lpPositions = pools.map(({ l, s }) => {
    const { amountA, amountB } = quoteRemoveLiquidity(l.lp, s.reserveA, s.reserveB, s.lpSupply);
    const v = (usd(s.symbolA, amountA) ?? 0) + (usd(s.symbolB, amountB) ?? 0);
    return { pool: s.id, lpTokens: fromUnits(l.lp), sharePct: (Number(l.lp) / Number(s.lpSupply)) * 100, underlying: { [s.symbolA]: fromUnits(amountA, 18, 4), [s.symbolB]: fromUnits(amountB, 18, 4) }, usd: v, lowLiquidityPool: (s.tvlUsd ?? 0) < 10_000 };
  });
  const vaultPositions = vaults.map(({ v, s }) => {
    const assets = vaultAssetsFor(v.shares, s.totalAssets, s.totalShares);
    return { vault: s.id, shares: fromUnits(v.shares), value: `${fromUnits(assets, 18, 4)} ${s.symbol}`, usd: usd(s.symbol, assets), apyPct: s.apyBps / 100 };
  });
  const parts = [...holdings.map((h) => ({ k: h.asset, usd: h.usd ?? 0 })), ...lpPositions.map((l) => ({ k: `LP ${l.pool}`, usd: l.usd })), ...vaultPositions.map((v) => ({ k: v.vault, usd: v.usd ?? 0 }))];
  const total = parts.reduce((a, p) => a + p.usd, 0);
  const allocation = parts.filter((p) => p.usd > 0).map((p) => ({ position: p.k, pct: Math.round((p.usd / total) * 1000) / 10 })).sort((a, b) => b.pct - a.pct);

  const risks: { risk: string; level: 'low' | 'medium' | 'high'; why: string; mitigation: string }[] = [];
  const top = allocation[0];
  if (top && top.pct > 50) risks.push({ risk: 'concentration', level: top.pct > 80 ? 'high' : 'medium', why: `${top.pct}% of the value is in ${top.position}.`, mitigation: 'Spread across more assets; avoid more than 30% in one pool.' });
  for (const l of lpPositions) {
    risks.push({ risk: 'impermanent loss', level: 'medium', why: `LP in ${l.pool} loses value against holding if the two prices move apart.`, mitigation: 'Ask for get_unrealized_il with your entry prices.' });
    if (l.lowLiquidityPool) risks.push({ risk: 'low liquidity', level: 'medium', why: `${l.pool} holds under $10,000, so large trades move the price a lot.`, mitigation: 'Use small amounts and a slippage limit.' });
  }
  const stable = holdings.filter((h) => /ybob|cents/i.test(h.asset)).reduce((a, h) => a + (h.usd ?? 0), 0);
  if (total > 0 && stable / total > 0.5) risks.push({ risk: 'stablecoin exposure', level: 'low', why: `${Math.round((stable / total) * 100)}% is in yBOB/CENTS, which track a reference price.`, mitigation: 'Fine for stability; yields are lower.' });
  if (vaultPositions.length) risks.push({ risk: 'smart contract', level: 'low', why: 'Vaults and pools are testnet contracts with an internal review only.', mitigation: 'Testnet only; do not treat as audited.' });

  const vaultSymbols = new Set((await allVaults()).map((v) => v.symbol.toLowerCase()));
  const idle = holdings.filter((h) => h.asset !== 'AVAX' && (h.usd ?? 0) > 1 && vaultSymbols.has(h.asset.toLowerCase()));
  const opportunities = idle.map((h) => ({ idea: `Idle ${h.asset} could earn yield in kv${h.asset}`, action: 'compute_vault_deposit to see the shares first' }));

  return ok(tool, {
    wallet: addr, totalUsd: Math.round(total * 100) / 100, holdings, lpPositions, vaultPositions, allocation, risks, opportunities,
    ...stamp(pos.fetchedAt), note: PRICE_NOTE,
  });
}

/** §4.16 get_unrealized_il for the user's LP position in a pool. Entry prices are the user's (not tracked). */
export async function getUnrealizedIl(ctx: WalletContext, input: { pool: string; entryPrice0?: number; entryPrice1?: number; wallet?: string }) {
  const tool = 'get_unrealized_il';
  const pool = findPool(input.pool);
  if (!pool) return fail(tool, 'NOT_FOUND', `No pool "${input.pool}".`, POOL_LIST.map((p) => p.id));
  if (!(input.entryPrice0 && input.entryPrice1)) {
    return fail(tool, 'MISSING_INFORMATION', `Entry prices are not recorded. Ask the user the USD price of ${symbolOf(pool.tokenA)} and ${symbolOf(pool.tokenB)} when they added liquidity.`);
  }
  const addr = await ownWallet(tool, ctx, input.wallet);
  if (isFail(addr)) return addr;
  const r = await rpc(tool, async () => ({ pos: await walletPositions(addr), s: await poolState(pool) }));
  if (isFail(r)) return r;
  const lp = r.pos.value.lps.find((l) => l.pool.address === pool.address)?.lp ?? BigInt(0);
  if (lp === BigInt(0)) return fail(tool, 'NOT_FOUND', `This wallet has no liquidity in ${pool.id}.`);
  const s = r.s.value;
  const { amountA, amountB } = quoteRemoveLiquidity(lp, s.reserveA, s.reserveB, s.lpSupply);
  const p0 = referencePrice(s.symbolA), p1 = referencePrice(s.symbolB);
  if (p0 == null || p1 == null) return fail(tool, 'NOT_FOUND', 'No current price for one of the tokens.');
  const il = impermanentLoss(Number(fromUnits(amountA)), Number(fromUnits(amountB)), input.entryPrice0, input.entryPrice1, p0, p1);
  return ok(tool, {
    pool: pool.id, lpTokens: fromUnits(lp),
    ilUsd: Math.round(il.ilUsd * 100) / 100, ilPct: Math.round(il.ilPct * 100) / 100,
    lpValueUsd: Math.round(il.lpValueUsd * 100) / 100, holdValueUsd: Math.round(il.holdValueUsd * 100) / 100,
    method: 'Value of the LP position now, compared with holding the tokens you put in at your entry prices. Fees earned are not included.',
    ...stamp(r.s.fetchedAt), note: PRICE_NOTE,
  });
}

const GAS_UNITS: Record<string, number> = { transfer: 65_000, approve: 50_000, swap: 160_000, add_liquidity: 230_000, remove_liquidity: 190_000, vault_deposit: 130_000, vault_withdrawal: 110_000 };

export async function estimateGasCost(txType: string) {
  const tool = 'estimate_gas_cost';
  const units = GAS_UNITS[txType];
  if (!units) return fail(tool, 'INVALID_INPUT', 'Unknown transaction type.', Object.keys(GAS_UNITS));
  const r = await rpc(tool, () => gasPriceWei());
  if (isFail(r)) return r;
  // Fuji gas is often a tiny fraction of a gwei: keep full precision.
  const avax = Number(BigInt(units) * r.value) / 1e18;
  const needsApprove = ['swap', 'add_liquidity', 'vault_deposit'].includes(txType);
  return ok(tool, {
    txType, gasUnits: units, gasPriceGwei: Number(r.value) / 1e9, costAvax: Number(avax.toPrecision(3)), costUsd: Number((avax * (referencePrice('AVAX') ?? 0)).toPrecision(3)),
    note: `Typical gas for this contract call; the wallet shows the exact figure.${needsApprove ? ' The first time per token, an approve transaction is also needed.' : ''}`,
    ...stamp(r.fetchedAt),
  });
}

export async function getTxHistory(ctx: WalletContext, input: { wallet?: string; limit?: number }) {
  const tool = 'get_tx_history';
  const addr = await ownWallet(tool, ctx, input.wallet);
  if (isFail(addr)) return addr;
  const limit = Math.min(Math.max(input.limit ?? 10, 1), 25);
  const r = await rpc(tool, () => txHistory(addr, limit));
  if (isFail(r)) return r;
  return ok(tool, { wallet: addr, transactions: r.value, explorer: `https://testnet.snowtrace.io/address/${addr}`, ...stamp(r.fetchedAt) });
}

// ── Execution plans (§4.16 execute_*; §4.20 safety) ──────────────────────────

export interface DefiPlan {
  kind: 'defi';
  name: string;
  /** Page where the user reviews and signs it. */
  page: '/vaults' | '/pools' | '/swap';
  summary: string;
  params: Record<string, string>;
  slippagePct: number;
  deadline: string;
  requiresHumanApproval: true;
}

function plan(name: string, page: DefiPlan['page'], summary: string, params: Record<string, string>): DefiPlan {
  return {
    kind: 'defi', name, page, summary, params, slippagePct: SLIPPAGE_BPS / 100,
    deadline: new Date(Date.now() + DEADLINE_MIN * 60_000).toISOString(), requiresHumanApproval: true,
  };
}

async function balanceOf(addr: Address, symbol: string) {
  const pos = await walletPositions(addr);
  return pos.value.tokens.find((t) => t.symbol.toLowerCase() === symbol.toLowerCase())?.balance ?? BigInt(0);
}

export async function prepareVaultDeposit(ctx: WalletContext, input: { vault: string; amount: string | number }): Promise<ToolResult<DefiPlan>> {
  const tool = 'execute_vault_deposit_tx';
  const vault = await findVaultAny(input.vault);
  if (!vault) return fail(tool, 'NOT_FOUND', `No vault "${input.vault}".`, (await allVaults()).map((v) => v.id));
  const addr = await ownWallet(tool, ctx);
  if (isFail(addr)) return addr;
  let amount: bigint;
  try { amount = toUnits(input.amount); } catch { return fail(tool, 'INVALID_QUANTITY', 'The amount must be a positive number.'); }
  const r = await rpc(tool, async () => ({ bal: await balanceOf(addr, vault.symbol), s: await vaultState(vault) }));
  if (isFail(r)) return r;
  if (r.bal < amount) return fail(tool, 'INSUFFICIENT_BALANCE', `The wallet has ${fromUnits(r.bal)} ${vault.symbol}, less than ${fromUnits(amount)}.`);
  const shares = vaultSharesFor(amount, r.s.value.totalAssets, r.s.value.totalShares);
  return ok(tool, plan(tool, '/vaults', `Deposit ${fromUnits(amount)} ${vault.symbol} into ${vault.id} for about ${fromUnits(shares, 18, 4)} shares.`, { vault: vault.id, amount: fromUnits(amount) }));
}

export async function prepareVaultWithdrawal(ctx: WalletContext, input: { vault: string; shares: string | number }): Promise<ToolResult<DefiPlan>> {
  const tool = 'execute_vault_withdrawal_tx';
  const vault = await findVaultAny(input.vault);
  if (!vault) return fail(tool, 'NOT_FOUND', `No vault "${input.vault}".`, (await allVaults()).map((v) => v.id));
  const addr = await ownWallet(tool, ctx);
  if (isFail(addr)) return addr;
  let shares: bigint;
  try { shares = toUnits(input.shares); } catch { return fail(tool, 'INVALID_QUANTITY', 'Shares must be a positive number.'); }
  const r = await rpc(tool, async () => ({ pos: await walletPositions(addr), s: await vaultState(vault) }));
  if (isFail(r)) return r;
  const held = r.pos.value.vaultShares.find((v) => v.vault.address === vault.address)?.shares ?? BigInt(0);
  if (held < shares) return fail(tool, 'INSUFFICIENT_BALANCE', `The wallet holds ${fromUnits(held)} ${vault.id} shares.`);
  const out = vaultAssetsFor(shares, r.s.value.totalAssets, r.s.value.totalShares);
  return ok(tool, plan(tool, '/vaults', `Withdraw ${fromUnits(shares)} ${vault.id} shares for about ${fromUnits(out, 18, 4)} ${vault.symbol}.`, { vault: vault.id, shares: fromUnits(shares) }));
}

export async function prepareAddLiquidity(ctx: WalletContext, input: { pool: string; amountA: string | number; amountB: string | number }): Promise<ToolResult<DefiPlan>> {
  const tool = 'execute_add_liquidity_tx';
  const pool = findPool(input.pool);
  if (!pool) return fail(tool, 'NOT_FOUND', `No pool "${input.pool}".`, POOL_LIST.map((p) => p.id));
  const addr = await ownWallet(tool, ctx);
  if (isFail(addr)) return addr;
  let a: bigint, b: bigint;
  try { a = toUnits(input.amountA); b = toUnits(input.amountB); } catch { return fail(tool, 'INVALID_QUANTITY', 'Both amounts must be positive numbers.'); }
  const r = await rpc(tool, async () => ({ s: await poolState(pool), balA: await balanceOf(addr, symbolOf(pool.tokenA)), balB: await balanceOf(addr, symbolOf(pool.tokenB)) }));
  if (isFail(r)) return r;
  const s = r.s.value;
  if (r.balA < a || r.balB < b) return fail(tool, 'INSUFFICIENT_BALANCE', `The wallet has ${fromUnits(r.balA)} ${s.symbolA} and ${fromUnits(r.balB)} ${s.symbolB}.`);
  const q = quoteAddLiquidity(a, b, s.reserveA, s.reserveB, s.lpSupply);
  const minLp = (q.lpTokens * BigInt(10_000 - SLIPPAGE_BPS)) / BigInt(10_000);
  return ok(tool, plan(tool, '/pools', `Add ${fromUnits(a)} ${s.symbolA} + ${fromUnits(b)} ${s.symbolB} to ${s.id} for about ${fromUnits(q.lpTokens, 18, 4)} LP (${q.sharePct.toFixed(4)}% of the pool); at least ${fromUnits(minLp, 18, 4)} LP or it reverts.`,
    { pool: s.id, amountA: fromUnits(a), amountB: fromUnits(b), minLp: fromUnits(minLp) }));
}

export async function prepareRemoveLiquidity(ctx: WalletContext, input: { pool: string; lpTokens: string | number }): Promise<ToolResult<DefiPlan>> {
  const tool = 'execute_remove_liquidity_tx';
  const pool = findPool(input.pool);
  if (!pool) return fail(tool, 'NOT_FOUND', `No pool "${input.pool}".`, POOL_LIST.map((p) => p.id));
  const addr = await ownWallet(tool, ctx);
  if (isFail(addr)) return addr;
  let lp: bigint;
  try { lp = toUnits(input.lpTokens); } catch { return fail(tool, 'INVALID_QUANTITY', 'LP amount must be a positive number.'); }
  const r = await rpc(tool, async () => ({ pos: await walletPositions(addr), s: await poolState(pool) }));
  if (isFail(r)) return r;
  const held = r.pos.value.lps.find((l) => l.pool.address === pool.address)?.lp ?? BigInt(0);
  if (held < lp) return fail(tool, 'INSUFFICIENT_BALANCE', `The wallet holds ${fromUnits(held)} LP in ${pool.id}.`);
  const s = r.s.value;
  const { amountA, amountB } = quoteRemoveLiquidity(lp, s.reserveA, s.reserveB, s.lpSupply);
  const minA = (amountA * BigInt(10_000 - SLIPPAGE_BPS)) / BigInt(10_000), minB = (amountB * BigInt(10_000 - SLIPPAGE_BPS)) / BigInt(10_000);
  return ok(tool, plan(tool, '/pools', `Remove ${fromUnits(lp)} LP from ${s.id} for about ${fromUnits(amountA, 18, 4)} ${s.symbolA} + ${fromUnits(amountB, 18, 4)} ${s.symbolB} (at least ${fromUnits(minA, 18, 4)} / ${fromUnits(minB, 18, 4)}).`,
    { pool: s.id, lpTokens: fromUnits(lp), minA: fromUnits(minA), minB: fromUnits(minB) }));
}

export { POOL_LIST, VAULT_LIST };

// ── Yield Optimizer (§5.7, Phase 2) ──────────────────────────────────────────

/**
 * Ranks vaults and pools for the user's capital, risk tolerance and horizon
 * (lib/defi/yield.ts), checks the wallet can actually do it, and caps any
 * one option at 30%. Every assumption is returned so the agent can state it.
 */
export async function recommendYieldStrategy(
  ctx: WalletContext,
  input: { capitalUsd?: number; riskTolerance?: RiskTolerance; horizonDays?: number; token?: string },
) {
  const tool = 'recommend_yield_strategy';
  const risk: RiskTolerance = input.riskTolerance ?? 'moderate';
  const horizonDays = Math.min(Math.max(Math.round(input.horizonDays ?? 90), 1), 3650);
  const r = await rpc(tool, async () => ({
    vaults: await Promise.all((await allVaults()).map(vaultState)),
    pools: await Promise.all(POOL_LIST.map(poolState)),
    gas: await gasPriceWei(),
  }));
  if (isFail(r)) return r;

  // What the wallet can actually invest (never recommend what it cannot do).
  let walletUsd: number | null = null;
  const owned = await ownedWallets(ctx);
  if (owned.length) {
    const summary = await getPortfolioSummary(ctx, owned[0]);
    if (summary.success) walletUsd = summary.data!.holdings.filter((h) => h.asset !== 'AVAX').reduce((a, h) => a + (h.usd ?? 0), 0);
  }
  const capitalUsd = input.capitalUsd ?? walletUsd ?? 0;
  if (!(capitalUsd > 0)) return fail(tool, 'MISSING_INFORMATION', 'How much (in USD) do you want to put to work? Or connect your wallet so I can use its balance.');
  if (walletUsd != null && capitalUsd > walletUsd * 1.0001) {
    return fail(tool, 'INSUFFICIENT_BALANCE', `The wallet holds about $${walletUsd.toFixed(2)} in KAI tokens, less than $${capitalUsd}.`);
  }

  const gasUsd = (Number((BigInt(GAS_UNITS.approve + GAS_UNITS.vault_deposit + GAS_UNITS.vault_withdrawal) * r.gas.value)) / 1e18) * (referencePrice('AVAX') ?? 0);
  const options: YieldOption[] = [
    ...r.vaults.map((v) => ({ id: v.value.id, kind: 'vault' as const, token: v.value.symbol, apyPct: v.value.apyBps / 100, tvlUsd: v.value.tvlUsd, complexity: 1 as const })),
    ...r.pools.map((p) => ({ id: p.value.id, kind: 'pool' as const, token: `${p.value.symbolA}/${p.value.symbolB}`, apyPct: null, tvlUsd: p.value.tvlUsd, complexity: 2 as const, stablePair: /ybob|cents/i.test(p.value.symbolA) && /ybob|cents/i.test(p.value.symbolB) })),
  ].filter((o) => !input.token || o.token.toLowerCase().includes(input.token.toLowerCase()));
  const scored = scoreOptions(options, { capitalUsd, horizonDays, risk, gasUsd });
  const { plan, keepInWalletPct } = allocate(scored, capitalUsd);

  return ok(tool, {
    capitalUsd, riskTolerance: risk, horizonDays,
    recommendation: plan.length ? plan.map((p) => `${p.pct}% ($${p.usd}) → ${p.id}`).join(', ') + (keepInWalletPct ? `; keep ${keepInWalletPct}% in the wallet` : '') : 'No option fits this risk level and horizon.',
    options: scored.map((s) => ({
      id: s.id, kind: s.kind, apyPct: s.apyPct, expectedYieldUsd: s.expectedYieldUsd == null ? null : Math.round(s.expectedYieldUsd * 100) / 100,
      expectedIlPct: Math.round(s.expectedIlPct * 100) / 100, breakEvenDays: s.breakEvenDays, riskLevel: s.riskLevel, riskFactors: s.riskFactors,
      suitable: s.suitable, why: s.why,
    })),
    assumptions: [
      `Pool price-ratio volatility assumed ${ASSUMED_VOLATILITY.volatile * 100}%/year (${ASSUMED_VOLATILITY.stable * 100}% for stable pairs): testnet has no market history.`,
      `Risk premium ${RISK_PREMIUM_PCT_PER_YEAR}%/year per risk point for a moderate investor (x2 conservative, x0.4 aggressive).`,
      `Gas for approve + deposit + withdraw ≈ $${gasUsd.toPrecision(2)} at the current Fuji gas price.`,
      'Vault APY is the rate set in the contract; yield is added by the vault owner and is not guaranteed.',
      'No more than 30% in any one option.',
      'Pool APY is unknown until trading-volume history exists, so pools are not ranked.',
    ],
    note: `${PRICE_NOTE} Nothing is moved: the user acts with execute_vault_deposit_tx (a plan they sign).`,
  });
}

// ── Payments (§4.18, Phase 2) ────────────────────────────────────────────────

/** §4.18 verify_payment_receipt: status of the user's OWN Paystack / M-Pesa payment. */
export async function verifyPaymentReceipt(ctx: WalletContext, reference: string) {
  const tool = 'verify_payment_receipt';
  const ref = reference.trim();
  if (!/^[\w.-]{6,100}$/.test(ref)) return fail(tool, 'INVALID_INPUT', 'That is not a payment reference.');
  const prisma = await getPrisma();
  if (!prisma) return fail(tool, 'DATABASE_ERROR', 'The database is not available right now.');
  const p = await prisma.payment.findUnique({ where: { reference: ref } });
  if (!p) return fail(tool, 'NOT_FOUND', 'No payment with that reference.');
  const owned = await ownedWallets(ctx);
  const user = ctx.privyUserId ? await prisma.kaiUser.findUnique({ where: { privyUserId: ctx.privyUserId }, select: { email: true } }) : null;
  const mine = (p.wallet && owned.includes(p.wallet.toLowerCase())) || (!!user?.email && !!p.email && user.email.toLowerCase() === p.email.toLowerCase());
  if (!mine) return fail(tool, 'FORBIDDEN', "I can only check the user's own payments.");
  const status = p.status === 'success' || p.status === 'completed' ? 'completed' : p.status === 'failed' || p.status === 'abandoned' ? 'failed' : 'pending';
  return ok(tool, {
    reference: p.reference, status, amount: `${(Number(p.amount_subunits) / 100).toFixed(2)} ${p.currency}`,
    item: p.nft_name ?? null, createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString(),
    note: status === 'pending' ? 'Still waiting for the payment provider. M-Pesa usually confirms within a minute.' : null,
  });
}
