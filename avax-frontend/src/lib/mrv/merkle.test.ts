import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { anchorCalldata, buildMerkleTree, leafHash, rootFromCalldata, verifyMerkleProof } from './merkle.ts';

const h = (s: string) => createHash('sha256').update(s).digest('hex');

test('every record proves into the root, for 1 to 9 records', () => {
  for (let n = 1; n <= 9; n++) {
    const hashes = Array.from({ length: n }, (_, i) => h(`record ${i}`));
    const { root, proofs } = buildMerkleTree(hashes);
    hashes.forEach((d, i) => assert.ok(verifyMerkleProof(d, proofs[i], root), `n=${n} leaf=${i}`));
  }
});

test('a single record: root is its leaf hash, empty proof', () => {
  const d = h('only');
  const t = buildMerkleTree([d]);
  assert.equal(t.root, leafHash(d));
  assert.deepEqual(t.proofs[0], []);
});

test('changed data, wrong proof or wrong root fail', () => {
  const hashes = ['a', 'b', 'c', 'd', 'e'].map(h);
  const { root, proofs } = buildMerkleTree(hashes);
  assert.equal(verifyMerkleProof(h('500 seedlings changed to 900'), proofs[0], root), false);
  assert.equal(verifyMerkleProof(hashes[0], proofs[1], root), false);
  assert.equal(verifyMerkleProof(hashes[0], proofs[0], h('other root')), false);
  assert.equal(verifyMerkleProof(hashes[0], 'not a proof', root), false);
  assert.equal(verifyMerkleProof('xyz', proofs[0], root), false);
});

test('a leaf cannot pose as an inner node (domain separation)', () => {
  const hashes = ['a', 'b'].map(h);
  const { root } = buildMerkleTree(hashes);
  assert.notEqual(root, leafHash(hashes[0]));
  assert.notEqual(buildMerkleTree([hashes[0], hashes[1]]).root, buildMerkleTree([hashes[0]]).root);
});

test('calldata round trip', () => {
  const root = h('root');
  const data = anchorCalldata(root);
  assert.match(data, /^0x4b41494d5256313a[0-9a-f]{64}$/);
  assert.equal(rootFromCalldata(data), root);
  assert.equal(rootFromCalldata(data.toUpperCase().replace('0X', '0x')), root);
  assert.equal(rootFromCalldata('0x1234'), null);
  assert.throws(() => buildMerkleTree([]));
});
