import { createPublicClient, getAddress, http, type Address } from 'viem';
import { avalancheFuji } from 'viem/chains';
import { ERC20_ABI } from '@/lib/blockchain/erc20abi';
import { POOL_ABI, VAULT_ABI } from '@/lib/blockchain/defiAbis';
import { TOKENS } from '@/lib/blockchain/addresses';
import defi from '@/lib/blockchain/defiAddresses.json';
import { REFERENCE_PRICE_USD } from '@/lib/agent/tools';
import { fromUnits } from './math';

/**
 * Live reads of the KAI contracts on Avalanche Fuji (Ecosystem PRD v1.1
 * §4.13-§4.16). Read-only: nothing here signs or sends. Results are cached
 * for one minute (PRD §5.6) and stamped with when they were read, so callers
 * can flag data older than five minutes as stale.
 */

const RPC = (process.env.AVAX_RPC_URL || process.env.NEXT_PUBLIC_AVAX_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc').trim();
export const client = createPublicClient({ chain: avalancheFuji, transport: http(RPC, { retryCount: 3, timeout: 12_000 }) });

const CACHE_MS = 60_000;
const cache = new Map<string, { at: number; value: unknown }>();
async function cached<T>(key: string, load: () => Promise<T>): Promise<{ value: T; fetchedAt: number }> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return { value: hit.value as T, fetchedAt: hit.at };
  const value = await load();
  const at = Date.now();
  cache.set(key, { at, value });
  return { value, fetchedAt: at };
}

/** symbol → address, from the deploy output (NVR, yBOB, YTOKEN, YGOLD, GAMI, CENTS). */
export const TOKEN_LIST = Object.entries(TOKENS).map(([symbol, address]) => ({ symbol, address: getAddress(address) }));

export function tokenBySymbolOrAddress(q: string) {
  const s = q.trim();
  if (/^0x[0-9a-fA-F]{40}$/.test(s)) return TOKEN_LIST.find((t) => t.address.toLowerCase() === s.toLowerCase()) ?? null;
  return TOKEN_LIST.find((t) => t.symbol.toLowerCase() === s.toLowerCase()) ?? null;
}
export const symbolOf = (address: string) => TOKEN_LIST.find((t) => t.address.toLowerCase() === address.toLowerCase())?.symbol ?? address;

/** Reference USD price (testnet: informational, not a market oracle). */
export function referencePrice(symbol: string): number | null {
  const key = Object.keys(REFERENCE_PRICE_USD).find((k) => k.toLowerCase() === symbol.toLowerCase());
  return key ? REFERENCE_PRICE_USD[key] : null;
}

interface DefiFile { pools?: { pair: string; address: string; tokenA: string; tokenB: string }[]; vaults?: Record<string, { address?: string; asset?: string }> }
const D = defi as DefiFile;
export const POOL_LIST = (D.pools ?? []).map((p) => ({ id: p.pair, address: getAddress(p.address), tokenA: getAddress(p.tokenA), tokenB: getAddress(p.tokenB) }));
export const VAULT_LIST = Object.entries(D.vaults ?? {})
  .filter(([, v]) => v.address && v.asset)
  .map(([symbol, v]) => ({ id: `kv${symbol}`, symbol, address: getAddress(v.address!), asset: getAddress(v.asset!) }));

export function findPool(q: string) {
  const s = q.trim().toLowerCase().replace(/\s+/g, '');
  return POOL_LIST.find((p) => p.address.toLowerCase() === s || p.id.toLowerCase() === s || p.id.toLowerCase().split('/').reverse().join('/') === s) ?? null;
}
export function findVault(q: string) {
  const s = q.trim().toLowerCase();
  return VAULT_LIST.find((v) => v.address.toLowerCase() === s || v.id.toLowerCase() === s || v.symbol.toLowerCase() === s) ?? null;
}

export async function tokenInfo(address: Address) {
  return cached(`token:${address}`, async () => {
    const read = (fn: 'name' | 'symbol' | 'decimals' | 'totalSupply') =>
      client.readContract({ address, abi: ERC20_ABI, functionName: fn }) as Promise<unknown>;
    const [name, symbol, decimals, supply] = await Promise.all([read('name'), read('symbol').catch(() => symbolOf(address)), read('decimals'), read('totalSupply')]);
    return { address, name: String(name), symbol: String(symbol), decimals: Number(decimals), totalSupply: fromUnits(supply as bigint, Number(decimals), 2) };
  });
}

export interface PoolState {
  id: string; address: Address; tokenA: Address; tokenB: Address; symbolA: string; symbolB: string;
  reserveA: bigint; reserveB: bigint; lpSupply: bigint;
  /** USD value of both reserves at reference prices; null when a price is unknown. */
  tvlUsd: number | null;
}

export async function poolState(pool: (typeof POOL_LIST)[number]) {
  return cached(`pool:${pool.address}`, async (): Promise<PoolState> => {
    const r = (fn: 'reserveA' | 'reserveB' | 'totalSupply') => client.readContract({ address: pool.address, abi: POOL_ABI, functionName: fn }) as Promise<bigint>;
    const [reserveA, reserveB, lpSupply] = await Promise.all([r('reserveA'), r('reserveB'), r('totalSupply')]);
    const symbolA = symbolOf(pool.tokenA), symbolB = symbolOf(pool.tokenB);
    const pA = referencePrice(symbolA), pB = referencePrice(symbolB);
    const tvlUsd = pA != null && pB != null ? Number(fromUnits(reserveA)) * pA + Number(fromUnits(reserveB)) * pB : null;
    return { ...pool, symbolA, symbolB, reserveA, reserveB, lpSupply, tvlUsd };
  });
}

export interface VaultState {
  id: string; symbol: string; address: Address; asset: Address;
  totalAssets: bigint; totalShares: bigint; sharePrice: bigint; apyBps: number;
  tvlUsd: number | null;
}

export async function vaultState(vault: (typeof VAULT_LIST)[number]) {
  return cached(`vault:${vault.address}`, async (): Promise<VaultState> => {
    const r = (fn: 'totalAssets' | 'totalSupply' | 'sharePrice' | 'apyBps') => client.readContract({ address: vault.address, abi: VAULT_ABI, functionName: fn }) as Promise<bigint>;
    const [totalAssets, totalShares, sharePrice, apyBps] = await Promise.all([r('totalAssets'), r('totalSupply'), r('sharePrice'), r('apyBps')]);
    const p = referencePrice(vault.symbol);
    return { ...vault, totalAssets, totalShares, sharePrice, apyBps: Number(apyBps), tvlUsd: p != null ? Number(fromUnits(totalAssets)) * p : null };
  });
}

/** Everything one wallet holds in the KAI ecosystem, read live. */
export async function walletPositions(wallet: Address) {
  return cached(`positions:${wallet}`, async () => {
    const [avax, tokens, lps, vaultShares] = await Promise.all([
      client.getBalance({ address: wallet }),
      Promise.all(TOKEN_LIST.map(async (t) => ({ ...t, balance: (await client.readContract({ address: t.address, abi: ERC20_ABI, functionName: 'balanceOf', args: [wallet] })) as bigint }))),
      Promise.all(POOL_LIST.map(async (p) => ({ pool: p, lp: (await client.readContract({ address: p.address, abi: POOL_ABI, functionName: 'balanceOf', args: [wallet] })) as bigint }))),
      Promise.all(VAULT_LIST.map(async (v) => ({ vault: v, shares: (await client.readContract({ address: v.address, abi: VAULT_ABI, functionName: 'balanceOf', args: [wallet] })) as bigint }))),
    ]);
    return { avax, tokens, lps, vaultShares };
  });
}

export async function gasPriceWei() {
  return cached('gasPrice', () => client.getGasPrice());
}

/**
 * Recent transactions from the public Routescan explorer API (Snowtrace's
 * backend); no key needed for low volume.
 */
export async function txHistory(wallet: Address, limit = 10, offset = 0) {
  const page = Math.floor(offset / limit) + 1;
  const url = `https://api.routescan.io/v2/network/testnet/evm/43113/etherscan/api?module=account&action=txlist&address=${wallet}&page=${page}&offset=${limit}&sort=desc`;
  return cached(`tx:${wallet}:${limit}:${page}`, async () => {
    const res = await fetch(url, { signal: AbortSignal.timeout(12_000) });
    const body = (await res.json()) as { status: string; message: string; result: unknown };
    if (!Array.isArray(body.result)) {
      if (/no transactions/i.test(body.message)) return [];
      throw new Error(`explorer: ${body.message}`);
    }
    return (body.result as Record<string, string>[]).map((t) => ({
      txHash: t.hash, block: Number(t.blockNumber), timestamp: new Date(Number(t.timeStamp) * 1000).toISOString(),
      from: t.from, to: t.to, valueAvax: fromUnits(BigInt(t.value || '0')), failed: t.isError === '1',
      method: t.functionName ? t.functionName.split('(')[0] : (t.input && t.input !== '0x' ? 'contract call' : 'transfer'),
    }));
  });
}
