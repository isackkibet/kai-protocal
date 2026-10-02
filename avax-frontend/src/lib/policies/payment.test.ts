import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paymentProblem, TX_HASH, WALLET } from './payment.ts';

const owner = '0x' + 'a'.repeat(40);
const treasury = '0x' + 'b'.repeat(40);
const want = { owner, treasury, minWei: 100_000_000_000_000n, chainId: 43113 };
const tx = { from: owner.toUpperCase().replace('0X', '0x'), to: treasury, value: 100_000_000_000_000n, chainId: 43113 };

test('a good payment passes (address case does not matter)', () => {
  assert.equal(paymentProblem(tx, { status: 'success' }, want), null);
});

test('bad payments are refused with a reason', () => {
  assert.match(paymentProblem(tx, { status: 'reverted' }, want)!, /failed/);
  assert.match(paymentProblem({ ...tx, chainId: 1 }, { status: 'success' }, want)!, /Fuji/);
  assert.match(paymentProblem({ ...tx, from: '0x' + 'c'.repeat(40) }, { status: 'success' }, want)!, /different wallet/);
  assert.match(paymentProblem({ ...tx, to: null }, { status: 'success' }, want)!, /treasury/);
  assert.match(paymentProblem({ ...tx, value: 1n }, { status: 'success' }, want)!, /smaller/);
});

test('hash and wallet formats', () => {
  assert.ok(TX_HASH.test('0x' + 'f'.repeat(64)));
  assert.ok(!TX_HASH.test('0x' + 'f'.repeat(63)));
  assert.ok(WALLET.test(owner));
  assert.ok(!WALLET.test('0x123'));
});
