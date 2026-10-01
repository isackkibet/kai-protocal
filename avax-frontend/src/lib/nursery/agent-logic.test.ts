import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanQuantity, fail, matchByName, matchSpecies, ok, pickBatch, summarizeInventory } from './agent-logic.ts';

const catalogue = [
  { id: '1', commonName: 'Acacia', scientificName: 'Acacia tortilis', localName: 'Mgunga' },
  { id: '2', commonName: 'Croton', scientificName: 'Croton megalocarpus', localName: 'Mukinduri' },
  { id: '3', commonName: 'Meru Oak', scientificName: 'Vitex keniensis', localName: null },
];

test('species: exact on common, scientific and local name, any case, plural', () => {
  for (const q of ['acacia', 'ACACIA', 'Acacia tortilis', 'mgunga', 'Acacias', 'acacia seedlings']) {
    const m = matchSpecies(q, catalogue);
    assert.equal(m.status, 'exact', q);
    assert.equal(m.status === 'exact' && m.species.id, '1', q);
  }
  const vitex = matchSpecies('vitex', catalogue);
  assert.equal(vitex.status === 'exact' && vitex.species.id, '3');
});

test('species: a typo is only a suggestion, never an exact match', () => {
  const m = matchSpecies('Akacia', catalogue);
  assert.equal(m.status, 'suggest');
  assert.equal(m.status === 'suggest' && m.candidates[0].id, '1');
  assert.equal(matchSpecies('Krotonn', catalogue).status, 'suggest');
});

test('species: unknown and ambiguous', () => {
  assert.equal(matchSpecies('Mango', catalogue).status, 'none');
  assert.equal(matchSpecies('', catalogue).status, 'none');
  const two = [...catalogue, { id: '4', commonName: 'Acacia', scientificName: 'Acacia xanthophloea', localName: null }];
  assert.equal(matchSpecies('acacia', two).status, 'ambiguous');
  const exact = matchSpecies('Acacia xanthophloea', two);
  assert.equal(exact.status === 'exact' && exact.species.id, '4');
});

test('nursery names', () => {
  const items = [{ id: 'a', name: 'Main Nursery' }, { id: 'b', name: 'Section B' }];
  assert.deepEqual(matchByName('main nursery', items), { item: items[0] });
  assert.deepEqual(matchByName('main', items), { item: items[0] });
  assert.deepEqual(matchByName('Sectoin B', items), { item: items[1] });
  assert.ok('options' in matchByName('Site Z', items));
});

test('clean quantities', () => {
  assert.deepEqual(cleanQuantity('500 trees'), { quantity: 500, unit: 'trees' });
  assert.deepEqual(cleanQuantity('1,200'), { quantity: 1200, unit: 'seedlings' });
  assert.deepEqual(cleanQuantity('1.5k'), { quantity: 1500, unit: 'seedlings' });
  assert.deepEqual(cleanQuantity(40), { quantity: 40, unit: 'seedlings' });
  for (const bad of ['-5', '0', '2.5', 'many', '', null, 3.2]) assert.equal(cleanQuantity(bad), null, String(bad));
});

test('inventory totals per species', () => {
  const t = summarizeInventory([
    { species: 'Acacia', status: 'in_inventory', quantity: 1200 },
    { species: 'Acacia', status: 'planted', quantity: 800 },
    { species: 'Acacia', status: 'dead', quantity: 50 },
    { species: 'Croton', status: 'in_inventory', quantity: 10 },
  ]);
  assert.deepEqual(t[0], { species: 'Acacia', available: 1200, planted: 800, lost: 50, transferred: 0, distributed: 0, total: 2050 });
  assert.equal(t[1].species, 'Croton');
});

test('pick the oldest in-nursery batch that is big enough', () => {
  const d = (s: string) => new Date(s);
  const batches = [
    { id: 'new', quantity: 900, status: 'in_inventory', createdAt: d('2026-09-02') },
    { id: 'old', quantity: 600, status: 'in_inventory', createdAt: d('2026-09-01') },
    { id: 'planted', quantity: 5000, status: 'planted', createdAt: d('2026-08-01') },
  ];
  assert.equal(pickBatch(batches, 500)?.id, 'old');
  assert.equal(pickBatch(batches, 700)?.id, 'new');
  assert.equal(pickBatch(batches, 1000), null);
});

test('tool result shape', () => {
  const good = ok('get_x', { n: 1 });
  assert.equal(good.success, true);
  assert.equal(good.metadata.tool, 'get_x');
  const bad = fail('get_x', 'INVALID_SPECIES', 'nope', ['Acacia']);
  assert.deepEqual(bad.error, { code: 'INVALID_SPECIES', message: 'nope', options: ['Acacia'] });
  assert.equal(fail('get_x', 'NOT_FOUND', 'x').error?.options, undefined);
});

test('plans may only target known routes and methods', async () => {
  const { isAllowedPlanRoute, isNurseryPlan } = await import('./agent-logic.ts');
  assert.ok(isAllowedPlanRoute('POST', '/api/cfa/transfer'));
  assert.ok(isAllowedPlanRoute('PATCH', '/api/cfa/members/0b3c5e2a-1111-4222-8333-944455556666'));
  assert.ok(isAllowedPlanRoute('POST', '/api/mrv/records/cmabc12345xyz/review'));
  assert.ok(!isAllowedPlanRoute('PATCH', '/api/cfa/transfer'));
  assert.ok(!isAllowedPlanRoute('POST', '/api/airdrop/claim'));
  assert.ok(!isAllowedPlanRoute('POST', 'https://evil.example/api/cfa/inventory'));
  assert.ok(!isAllowedPlanRoute('POST', '/api/cfa/inventory?x=1'));
  assert.ok(!isAllowedPlanRoute('DELETE', '/api/cfa/inventory'));
  const plan = { kind: 'nursery', name: 'x', method: 'POST', endpoint: '/api/cfa/loss', body: {}, summary: 's', assumptions: [] };
  assert.ok(isNurseryPlan(plan));
  assert.ok(!isNurseryPlan({ ...plan, endpoint: '/api/mine/claim' }));
  assert.ok(!isNurseryPlan({ ...plan, body: [] }));
});
