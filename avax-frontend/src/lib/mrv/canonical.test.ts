import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canonicalize, hashRecord, sha256Hex } from './canonical.ts';

const nassari = {
  cfa: 'Nassari CFA',
  species: 'Croton megalocarpus',
  quantity: 500,
  county: 'Kajiado',
  plantedAt: '2026-09-01',
};

test('PRD §4.1: key order does not change the canonical form or hash', () => {
  const reordered = { plantedAt: '2026-09-01', quantity: 500, county: 'Kajiado', species: 'Croton megalocarpus', cfa: 'Nassari CFA' };
  assert.equal(canonicalize(nassari), canonicalize(reordered));
  assert.equal(hashRecord(nassari), hashRecord(reordered));
});

test('PRD §4.1 tamper detection: 500 → 900 seedlings changes the hash', () => {
  assert.notEqual(hashRecord(nassari), hashRecord({ ...nassari, quantity: 900 }));
});

test('canonical form: sorted keys, no whitespace, nested objects and arrays', () => {
  assert.equal(
    canonicalize({ b: [3, { z: 1, a: 'x' }], a: { d: true, c: null } }),
    '{"a":{"c":null,"d":true},"b":[3,{"a":"x","z":1}]}',
  );
});

test('numbers use the JSON shortest form (1.0 and 1 are identical)', () => {
  assert.equal(canonicalize({ n: 1.0 }), canonicalize({ n: 1 }));
  assert.equal(canonicalize(1e21), '1e+21');
  assert.equal(canonicalize(0.1 + 0.2), '0.30000000000000004');
});

test('undefined members are dropped; undefined array slots become null', () => {
  assert.equal(canonicalize({ a: 1, b: undefined }), '{"a":1}');
  assert.equal(canonicalize([1, undefined]), '[1,null]');
});

test('unicode strings are escaped exactly as JSON.stringify does', () => {
  assert.equal(canonicalize({ name: 'Mũrũ "Wangari"' }), '{"name":"Mũrũ \\"Wangari\\""}');
});

test('values JSON cannot represent unambiguously are rejected', () => {
  assert.throws(() => canonicalize({ n: NaN }), TypeError);
  assert.throws(() => canonicalize({ n: Infinity }), TypeError);
  assert.throws(() => canonicalize({ d: new Date() }), TypeError);
  assert.throws(() => canonicalize({ b: BigInt(1) }), TypeError);
});

test('sha256Hex matches a known vector', () => {
  assert.equal(sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});
