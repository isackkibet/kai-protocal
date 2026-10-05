import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeRecord, provenanceHash, slugify } from './provenance.ts';

const mural = { slug: 'guardians-of-oloolua', title: 'Guardians of Oloolua', artist: 'A. Wanjiru', imageSha256: 'a'.repeat(64), cfaId: 'cfa-1' };

test('provenance hash is stable and order-independent', () => {
  const a = provenanceHash(mural, [{ id: 'r2', dataHash: 'h2' }, { id: 'r1', dataHash: 'h1' }]);
  const b = provenanceHash(mural, [{ id: 'r1', dataHash: 'h1' }, { id: 'r2', dataHash: 'h2' }]);
  assert.equal(a, b);
  assert.match(a, /^[0-9a-f]{64}$/);
});

test('changing a record, the image or the artist changes the hash', () => {
  const base = provenanceHash(mural, [{ id: 'r1', dataHash: 'h1' }]);
  assert.notEqual(base, provenanceHash(mural, [{ id: 'r1', dataHash: 'h1-changed' }]));
  assert.notEqual(base, provenanceHash({ ...mural, imageSha256: 'b'.repeat(64) }, [{ id: 'r1', dataHash: 'h1' }]));
  assert.notEqual(base, provenanceHash({ ...mural, artist: 'Someone else' }, [{ id: 'r1', dataHash: 'h1' }]));
});

test('slugs and plain descriptions', () => {
  assert.equal(slugify('Guardians of Oloolua!'), 'guardians-of-oloolua');
  assert.equal(slugify('A'), 'mural-a');
  assert.equal(
    describeRecord('PLANTING', { species: { name: 'Jackfruit (Artocarpus heterophyllus)' }, quantity: 2, plantedAt: '2026-10-01T00:00:00.000Z' }),
    '2 Jackfruit planted on 1 Oct 2026',
  );
  assert.equal(describeRecord('SURVIVAL', { quantity: 10, aliveQuantity: 8 }), '10 trees checked for survival (8 alive)');
});
