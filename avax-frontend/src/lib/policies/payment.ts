/**
 * Rules for a KAI Playground fee payment (/api/policies). Pure: the route
 * reads the transaction and receipt from Avalanche Fuji and passes them in.
 * Returns a plain-words problem, or null when the payment is good.
 */
export interface PaidTx { from: string; to: string | null; value: bigint; chainId?: number }
export interface PaidReceipt { status: 'success' | 'reverted' }

export const TX_HASH = /^0x[0-9a-f]{64}$/;
export const WALLET = /^0x[0-9a-f]{40}$/;
export const SERVICE_TYPE = /^[a-z_]{2,32}$/;

export function paymentProblem(
  tx: PaidTx, receipt: PaidReceipt,
  want: { owner: string; treasury: string; minWei: bigint; chainId: number },
): string | null {
  if (receipt.status !== 'success') return 'That payment failed on the blockchain.';
  if (tx.chainId != null && tx.chainId !== want.chainId) return 'That payment is not on Avalanche Fuji.';
  if (tx.from.toLowerCase() !== want.owner.toLowerCase()) return 'That payment was sent from a different wallet.';
  if (tx.to?.toLowerCase() !== want.treasury.toLowerCase()) return 'That payment did not go to the KAI treasury.';
  if (tx.value < want.minWei) return 'That payment is smaller than the policy fee.';
  return null;
}
