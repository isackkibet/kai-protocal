import { verifyMessage } from 'viem';

/**
 * Stateless proof-of-wallet-ownership for endpoints that serve wagmi-connected
 * wallets (MetaMask/Core) rather than Privy sessions, so there's no bearer
 * token to verify. The wallet signs a short-lived challenge; the server
 * recovers the signer and checks it matches the claimed address. No
 * server-side nonce storage needed — the timestamp bounds replay.
 */
const MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

export function buildOwnershipChallenge(wallet: string, timestamp: number) {
  return `KAI Nuvari profile access\naddress: ${wallet.toLowerCase()}\ntimestamp: ${timestamp}`;
}

export async function verifyWalletOwnership(wallet: string, signature: string, timestamp: number): Promise<boolean> {
  if (!wallet || !signature || !Number.isFinite(timestamp)) return false;
  if (Math.abs(Date.now() - timestamp) > MAX_AGE_MS) return false;
  try {
    return await verifyMessage({
      address: wallet as `0x${string}`,
      message: buildOwnershipChallenge(wallet, timestamp),
      signature: signature as `0x${string}`,
    });
  } catch {
    return false;
  }
}
