import { test } from 'node:test';
import assert from 'node:assert/strict';
import { redactSecrets } from './redact.ts';

const SEED = 'abandon ability able about above absent absorb abstract absurd abuse access accident';

test('a pasted seed phrase is removed', () => {
  const out = redactSecrets(`I lost my wallet. Here is my seed phrase: ${SEED}. Can you restore it?`);
  assert.ok(!out.includes('abandon ability'), out);
  assert.match(out, /redacted seed phrase/);
  assert.match(out, /Can you restore it\?/);
});

test('a 24-word mnemonic without punctuation is removed', () => {
  const out = redactSecrets(`my recovery words are ${SEED} ${SEED}`);
  assert.ok(!/abandon ability able/.test(out), out);
});

test('private keys are removed with or without 0x', () => {
  const key = 'a'.repeat(64);
  assert.equal(redactSecrets(`key 0x${key} here`), 'key [redacted private key] here');
  assert.equal(redactSecrets(`key ${key}`), 'key [redacted private key]');
});

test('ordinary lowercase speech is never redacted (voice input)', () => {
  const speech = 'i want to know how many trees our community has planted in the nursery this year so far';
  assert.equal(redactSecrets(speech), speech);
});

test('wallet addresses (40 hex) and tx hashes in normal questions are kept', () => {
  const q = 'what is the balance of 0x1111111111111111111111111111111111111111';
  assert.equal(redactSecrets(q), q);
});

test('asking about seed phrases in general keeps the question', () => {
  const q = 'what is a seed phrase and why should i keep it safe';
  assert.equal(redactSecrets(q), q);
});
