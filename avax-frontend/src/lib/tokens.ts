/**
 * KAI ecosystem tokens on Avalanche Fuji C-Chain.
 * Live addresses come from Hardhat deploy output, with NEXT_PUBLIC_* as fallback.
 */
import deployed from './deployedAddresses.json';

export interface TokenConfig {
  symbol: string;
  name: string;
  decimals: number;
  emoji: string;
  color: string;
  address: `0x${string}` | null;
  role: string;
}

interface DeployedFile {
  tokens?: Record<string, string>;
  explorerBase?: string;
  deployer?: string | null;
  network?: string;
}

const deployedFile = deployed as DeployedFile;

function isTokenAddress(value?: string | null): value is `0x${string}` {
  if (!value) return false;
  const trimmed = value.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) return false;
  const hex = trimmed.slice(2);
  if (/^0+$/.test(hex)) return false;
  if (/0{24,}$/.test(hex)) return false;
  return true;
}

function resolveAddress(symbol: string, envValue?: string): `0x${string}` | null {
  const fromFile = deployedFile.tokens?.[symbol];
  if (isTokenAddress(fromFile)) return fromFile;
  if (isTokenAddress(envValue)) return envValue.trim() as `0x${string}`;
  return null;
}

export const ECOSYSTEM_TOKENS: TokenConfig[] = [
  {
    symbol: 'NVR',
    name: 'NVR Governance',
    decimals: 18,
    emoji: '⚡',
    color: '#c9a24b',
    role: 'DAO voting and protocol fees',
    address: resolveAddress('NVR', process.env.NEXT_PUBLIC_NVR_ADDRESS),
  },
  {
    symbol: 'yBOB',
    name: 'yBOB Stable',
    decimals: 18,
    emoji: '🪙',
    color: '#60a5fa',
    role: 'Yield-bearing settlement unit',
    address: resolveAddress('yBOB', process.env.NEXT_PUBLIC_YBOB_ADDRESS),
  },
  {
    symbol: 'YTOKEN',
    name: 'Y Token ETF',
    decimals: 18,
    emoji: '⚗️',
    color: '#a78bfa',
    role: 'Growth yield vault share',
    address: resolveAddress('YTOKEN', process.env.NEXT_PUBLIC_YTOKEN_ADDRESS),
  },
  {
    symbol: 'YGOLD',
    name: 'YGold ETF',
    decimals: 18,
    emoji: '🔒',
    color: '#f59e0b',
    role: 'Gold-linked reserve asset',
    address: resolveAddress('YGOLD', process.env.NEXT_PUBLIC_YGOLD_ADDRESS),
  },
  {
    symbol: 'GAMI',
    name: 'GAMI Rewards',
    decimals: 18,
    emoji: '🎮',
    color: '#34d399',
    role: 'Community incentives',
    address: resolveAddress('GAMI', process.env.NEXT_PUBLIC_GAMI_ADDRESS),
  },
  {
    symbol: 'CENTS',
    name: 'Nuvari Cents',
    decimals: 18,
    emoji: '🪙',
    color: '#fb923c',
    role: 'Micro-savings and x402 fees',
    address: resolveAddress('CENTS', process.env.NEXT_PUBLIC_CENTS_ADDRESS),
  },
];

export const AVAX_CONFIG = {
  symbol: 'AVAX',
  name: 'Avalanche',
  decimals: 18,
  color: '#e84142',
  role: 'Native C-Chain gas token',
};

export const FUJI_EXPLORER = deployedFile.explorerBase || 'https://testnet.snowtrace.io';
export const DEPLOYED_NETWORK = deployedFile.network || 'fuji';

export const TICKER_TOKENS = [
  { s: 'AVAX', p: 'C-Chain', c: 'Fuji' },
  { s: 'NVR', p: 'Governance', c: 'DAO' },
  { s: 'yBOB', p: 'Stable', c: '1.00' },
  { s: 'YTOKEN', p: 'Yield', c: 'ETF' },
  { s: 'YGOLD', p: 'Reserve', c: 'RWA' },
  { s: 'GAMI', p: 'Rewards', c: 'XP' },
  { s: 'CENTS', p: 'Micro', c: 'x402' },
];

export function formatTokenAmount(value: number, digits = 4) {
  if (!Number.isFinite(value) || value === 0) return '0.00';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (value >= 1) return value.toFixed(Math.min(digits, 4));
  return value.toFixed(6);
}
