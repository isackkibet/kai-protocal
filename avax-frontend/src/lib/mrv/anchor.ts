import type { Cfa, CfaMember, PrismaClient } from '@prisma/client';
import { hashRecord } from './canonical.ts';
import { anchorCalldata, buildMerkleTree, rootFromCalldata, verifyMerkleProof } from './merkle.ts';
import { RecordError } from './records.ts';

/**
 * Anchoring verified records on Avalanche Fuji (Kanuvari Tools & Agents PRD
 * §4.11, §9). Only VERIFIED records enter a batch.
 *
 *   1. createAnchorBatch: group verified, not-yet-anchored records, build the
 *      Merkle tree, store each record's proof, mark them ANCHOR_PENDING.
 *   2. A CFA admin/verifier sends a Fuji transaction FROM THEIR OWN WALLET
 *      whose data is anchorCalldata(root). The server holds no private key.
 *   3. confirmAnchorBatch: reads that transaction from the public Fuji RPC,
 *      checks it succeeded and carries exactly this root, then marks the
 *      batch and its records ANCHORED.
 *   4. verifyRecordAnchor: anyone can re-check a record end to end —
 *      stored data → fingerprint → Merkle proof → root → on-chain transaction.
 */

export const FUJI_CHAIN_ID = 43113;
const MAX_BATCH = 256;

function rpcUrl() {
  return (process.env.AVAX_RPC_URL || process.env.NEXT_PUBLIC_AVAX_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc').trim();
}

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(rpcUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal: AbortSignal.timeout(15_000),
  });
  const body = (await res.json()) as { result?: T; error?: { message: string } };
  if (body.error) throw new Error(`Fuji RPC ${method}: ${body.error.message}`);
  return body.result as T;
}

interface ChainTx { from: string; input: string; chainId?: string; blockNumber: string | null }
interface ChainReceipt { status: string; blockNumber: string }

/** The anchoring transaction as seen on-chain, or why it doesn't count. */
async function readAnchorTx(txHash: string): Promise<
  { ok: true; root: string; from: string; blockNumber: bigint } | { ok: false; pending?: boolean; reason: string }
> {
  const [tx, receipt] = await Promise.all([
    rpc<ChainTx | null>('eth_getTransactionByHash', [txHash]),
    rpc<ChainReceipt | null>('eth_getTransactionReceipt', [txHash]),
  ]);
  if (!tx) return { ok: false, pending: true, reason: 'Transaction not found on Fuji yet. Wait a few seconds and try again.' };
  if (!receipt) return { ok: false, pending: true, reason: 'Transaction is not confirmed yet. Wait a few seconds and try again.' };
  if (receipt.status !== '0x1') return { ok: false, reason: 'The transaction failed on-chain.' };
  if (tx.chainId && BigInt(tx.chainId) !== BigInt(FUJI_CHAIN_ID)) return { ok: false, reason: 'The transaction is not on Avalanche Fuji.' };
  const root = rootFromCalldata(tx.input ?? '');
  if (!root) return { ok: false, reason: 'The transaction does not carry a KAI MRV root.' };
  return { ok: true, root, from: tx.from.toLowerCase(), blockNumber: BigInt(receipt.blockNumber) };
}

/** Admins and verifiers anchor. Pure. */
export function anchorerError(member: Pick<CfaMember, 'role' | 'status' | 'cfaId'> | null, cfaId: string): string | null {
  if (!member || member.cfaId !== cfaId) return 'Only CFA members can anchor records.';
  if (member.status !== 'active') return `Your CFA membership is ${member.status}.`;
  if (member.role !== 'admin' && member.role !== 'verifier') return 'Only a CFA admin or verifier can anchor records.';
  return null;
}

function batchView(b: { id: string; merkleRoot: string; recordCount: number; status: string; txHash: string | null; createdAt: Date; anchoredAt: Date | null }) {
  return {
    id: b.id,
    merkleRoot: b.merkleRoot,
    recordCount: b.recordCount,
    status: b.status,
    txHash: b.txHash,
    createdAt: b.createdAt.toISOString(),
    anchoredAt: b.anchoredAt?.toISOString() ?? null,
    /** What the wallet must send: to = the sender's own address, value 0, this data. */
    calldata: anchorCalldata(b.merkleRoot),
    chainId: FUJI_CHAIN_ID,
  };
}
export type AnchorBatchView = ReturnType<typeof batchView>;

/**
 * Batches every VERIFIED, not-yet-anchored record of the CFA (oldest first,
 * up to 256). If a batch is already waiting for its transaction, returns it
 * instead of making a second one.
 */
export async function createAnchorBatch(prisma: PrismaClient, cfa: Cfa, member: CfaMember): Promise<AnchorBatchView> {
  const who = anchorerError(member, cfa.id);
  if (who) throw new RecordError(who, 403);

  const pending = await prisma.anchorBatch.findFirst({ where: { cfaId: cfa.id, status: 'PENDING' } });
  if (pending) return batchView(pending);

  const records = await prisma.conservationRecord.findMany({
    where: { forestId: cfa.id, verificationStatus: 'VERIFIED', anchorStatus: { in: ['NOT_ANCHORED', 'ANCHOR_FAILED'] } },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    take: MAX_BATCH,
    select: { id: true, currentVersion: true, dataHash: true },
  });
  if (!records.length) throw new RecordError('There are no verified records waiting to be anchored.', 409);

  const tree = buildMerkleTree(records.map((r) => r.dataHash));
  try {
    const batch = await prisma.$transaction(async (tx) => {
      const b = await tx.anchorBatch.create({
        data: { cfaId: cfa.id, merkleRoot: tree.root, recordCount: records.length, createdBy: member.id },
      });
      await tx.anchorBatchRecord.createMany({
        data: records.map((r, i) => ({
          batchId: b.id, recordId: r.id, recordVersion: r.currentVersion, dataHash: r.dataHash, leafIndex: i, proof: tree.proofs[i],
        })),
      });
      // Only records still in the state we read: a concurrent change aborts the batch.
      const moved = await tx.conservationRecord.updateMany({
        where: { id: { in: records.map((r) => r.id) }, verificationStatus: 'VERIFIED', anchorStatus: { in: ['NOT_ANCHORED', 'ANCHOR_FAILED'] } },
        data: { anchorStatus: 'ANCHOR_PENDING' },
      });
      if (moved.count !== records.length) throw new RecordError('Records changed while the batch was being built. Try again.', 409);
      return b;
    });
    return batchView(batch);
  } catch (e) {
    // Two admins pressed at once: the unique "one pending batch" index won.
    if ((e as { code?: string })?.code === 'P2002') {
      const winner = await prisma.anchorBatch.findFirst({ where: { cfaId: cfa.id, status: 'PENDING' } });
      if (winner) return batchView(winner);
    }
    throw e;
  }
}

/** Gives up on a pending batch (e.g. the wallet transaction was rejected). */
export async function cancelAnchorBatch(prisma: PrismaClient, cfa: Cfa, member: CfaMember, batchId: string) {
  const who = anchorerError(member, cfa.id);
  if (who) throw new RecordError(who, 403);
  return prisma.$transaction(async (tx) => {
    const batch = await tx.anchorBatch.findUnique({ where: { id: batchId }, include: { records: { select: { recordId: true } } } });
    if (!batch || batch.cfaId !== cfa.id) throw new RecordError('Batch not found', 404);
    if (batch.status !== 'PENDING') throw new RecordError(`This batch is ${batch.status}.`, 409);
    await tx.anchorBatch.update({ where: { id: batchId }, data: { status: 'CANCELLED' } });
    await tx.conservationRecord.updateMany({
      where: { id: { in: batch.records.map((r) => r.recordId) }, anchorStatus: 'ANCHOR_PENDING' },
      data: { anchorStatus: 'NOT_ANCHORED' },
    });
    return { ok: true };
  });
}

/**
 * Records the wallet transaction for a pending batch after checking it on
 * Fuji. Throws a 202-style "pending" error while it isn't mined yet.
 */
export async function confirmAnchorBatch(prisma: PrismaClient, cfa: Cfa, member: CfaMember, batchId: string, txHash: string) {
  const who = anchorerError(member, cfa.id);
  if (who) throw new RecordError(who, 403);
  const hash = txHash.trim().toLowerCase();
  if (!/^0x[0-9a-f]{64}$/.test(hash)) throw new RecordError('That is not a transaction hash.', 400);

  const batch = await prisma.anchorBatch.findUnique({ where: { id: batchId }, include: { records: { select: { recordId: true } } } });
  if (!batch || batch.cfaId !== cfa.id) throw new RecordError('Batch not found', 404);
  if (batch.status === 'ANCHORED') return batchView(batch);
  if (batch.status !== 'PENDING') throw new RecordError(`This batch is ${batch.status}.`, 409);

  const onChain = await readAnchorTx(hash);
  if (!onChain.ok) throw new RecordError(onChain.reason, onChain.pending ? 202 : 400);
  if (onChain.root !== batch.merkleRoot) throw new RecordError('That transaction carries a different root than this batch.', 400);

  const anchoredAt = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const b = await tx.anchorBatch.update({
      where: { id: batch.id },
      data: { status: 'ANCHORED', txHash: hash, anchoredFrom: onChain.from, blockNumber: onChain.blockNumber, anchoredAt },
    });
    await tx.conservationRecord.updateMany({
      where: { id: { in: batch.records.map((r) => r.recordId) } },
      data: { anchorStatus: 'ANCHORED', avalancheTxHash: hash, anchoredAt },
    });
    return b;
  });
  return batchView(updated);
}

export interface AnchorCheck {
  anchored: boolean;
  steps: { step: string; ok: boolean; detail: string }[];
  batch?: { id: string; merkleRoot: string; txHash: string | null; anchoredAt: string | null; recordCount: number };
}

/**
 * PRD §4.11 verify_onchain_anchor. Re-derives everything from stored data:
 * the anchored version's JSON → SHA-256 → Merkle proof → batch root → the
 * root inside the Fuji transaction.
 */
export async function verifyRecordAnchor(prisma: PrismaClient, recordId: string): Promise<AnchorCheck | null> {
  const record = await prisma.conservationRecord.findUnique({ where: { id: recordId }, select: { id: true } });
  if (!record) return null;
  const link = await prisma.anchorBatchRecord.findFirst({
    where: { recordId, batch: { status: 'ANCHORED' } },
    include: { batch: true },
    orderBy: { batch: { anchoredAt: 'desc' } },
  });
  if (!link) return { anchored: false, steps: [{ step: 'Anchored', ok: false, detail: 'This record has not been anchored on Avalanche yet.' }] };

  const steps: AnchorCheck['steps'] = [];
  const version = await prisma.recordVersion.findUnique({ where: { recordId_version: { recordId, version: link.recordVersion } } });
  const recomputed = version ? hashRecord(version.data) : null;
  steps.push({
    step: 'Stored data matches its fingerprint',
    ok: !!recomputed && recomputed === link.dataHash,
    detail: recomputed ? `SHA-256 of version ${link.recordVersion} = ${recomputed}` : `Version ${link.recordVersion} is missing`,
  });
  const inTree = verifyMerkleProof(link.dataHash, link.proof, link.batch.merkleRoot);
  steps.push({ step: 'Fingerprint is in the batch Merkle tree', ok: inTree, detail: `root ${link.batch.merkleRoot}` });

  let chainOk = false;
  let chainDetail = 'No transaction recorded.';
  if (link.batch.txHash) {
    try {
      const onChain = await readAnchorTx(link.batch.txHash);
      chainOk = onChain.ok && onChain.root === link.batch.merkleRoot;
      chainDetail = onChain.ok
        ? (chainOk ? `Fuji transaction ${link.batch.txHash} carries this root (block ${onChain.blockNumber}).` : 'The transaction carries a different root.')
        : onChain.reason;
    } catch (e) {
      chainDetail = `Could not reach Avalanche Fuji right now (${e instanceof Error ? e.message : 'network error'}).`;
    }
  }
  steps.push({ step: 'Root is on Avalanche Fuji', ok: chainOk, detail: chainDetail });

  return {
    anchored: steps.every((s) => s.ok),
    steps,
    batch: {
      id: link.batch.id,
      merkleRoot: link.batch.merkleRoot,
      txHash: link.batch.txHash,
      anchoredAt: link.batch.anchoredAt?.toISOString() ?? null,
      recordCount: link.batch.recordCount,
    },
  };
}

export async function listAnchorBatches(prisma: PrismaClient, cfaId: string) {
  const [batches, waiting] = await Promise.all([
    prisma.anchorBatch.findMany({ where: { cfaId }, orderBy: { createdAt: 'desc' }, take: 20 }),
    prisma.conservationRecord.count({
      where: { forestId: cfaId, verificationStatus: 'VERIFIED', anchorStatus: { in: ['NOT_ANCHORED', 'ANCHOR_FAILED'] } },
    }),
  ]);
  return { verifiedWaiting: waiting, batches: batches.map(batchView) };
}
