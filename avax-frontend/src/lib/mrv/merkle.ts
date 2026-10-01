import { createHash } from 'node:crypto';

/**
 * SHA-256 Merkle tree over conservation record fingerprints (Kanuvari Tools
 * & Agents PRD §9: verified records → canonical JSON → hash → Merkle root →
 * Avalanche). One on-chain transaction proves a whole batch; each record
 * keeps a short proof (its sibling hashes) that links it to the root.
 *
 * - Leaf  = SHA-256(0x00 ‖ record dataHash bytes)
 * - Node  = SHA-256(0x01 ‖ smaller child ‖ larger child)   (sorted pair)
 * The 0x00 / 0x01 prefixes stop a leaf being passed off as an inner node;
 * sorting the pair means a proof needs no left/right flags. An odd node is
 * carried up to the next level unchanged.
 *
 * Pure (node:crypto only), so it runs under `node --test`.
 */

const HEX64 = /^[0-9a-f]{64}$/;

function sha256(...parts: Buffer[]): string {
  const h = createHash('sha256');
  for (const p of parts) h.update(p);
  return h.digest('hex');
}

export function leafHash(dataHash: string): string {
  const d = dataHash.toLowerCase();
  if (!HEX64.test(d)) throw new Error('dataHash must be 64 hex characters');
  return sha256(Buffer.from([0]), Buffer.from(d, 'hex'));
}

export function nodeHash(a: string, b: string): string {
  const [lo, hi] = a <= b ? [a, b] : [b, a];
  return sha256(Buffer.from([1]), Buffer.from(lo, 'hex'), Buffer.from(hi, 'hex'));
}

export interface MerkleTree {
  root: string;
  /** proofs[i] = sibling hashes from leaf i up to the root. */
  proofs: string[][];
}

/** Builds the tree for record fingerprints in the order given. */
export function buildMerkleTree(dataHashes: string[]): MerkleTree {
  if (!dataHashes.length) throw new Error('A Merkle tree needs at least one record');
  let level = dataHashes.map(leafHash);
  // Which node of the current level each original leaf has become.
  const position = dataHashes.map((_, i) => i);
  const proofs: string[][] = dataHashes.map(() => []);

  while (level.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
      next.push(i + 1 < level.length ? nodeHash(level[i], level[i + 1]) : level[i]);
    }
    for (let leaf = 0; leaf < position.length; leaf++) {
      const p = position[leaf];
      const sibling = p % 2 === 0 ? p + 1 : p - 1;
      if (sibling < level.length) proofs[leaf].push(level[sibling]);
      position[leaf] = Math.floor(p / 2);
    }
    level = next;
  }
  return { root: level[0], proofs };
}

/** True when `dataHash` with `proof` hashes up to `root`. */
export function verifyMerkleProof(dataHash: string, proof: unknown, root: string): boolean {
  if (!Array.isArray(proof) || !proof.every((p) => typeof p === 'string' && HEX64.test(p))) return false;
  try {
    let h = leafHash(dataHash);
    for (const sibling of proof as string[]) h = nodeHash(h, sibling);
    return h === root.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Transaction data that carries a root on-chain: the ASCII tag "KAIMRV1:"
 * then the 32-byte root. Anyone can read it back from the transaction.
 */
const TAG_HEX = Buffer.from('KAIMRV1:').toString('hex');

export function anchorCalldata(root: string): `0x${string}` {
  if (!HEX64.test(root)) throw new Error('root must be 64 hex characters');
  return `0x${TAG_HEX}${root}`;
}

export function rootFromCalldata(input: string): string | null {
  const s = input.toLowerCase().replace(/^0x/, '');
  if (!s.startsWith(TAG_HEX)) return null;
  const root = s.slice(TAG_HEX.length);
  return HEX64.test(root) ? root : null;
}
