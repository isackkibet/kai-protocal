import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanFileName, evidenceProblems, MAX_EVIDENCE_BYTES, sniffMime } from './evidence-rules.ts';

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]);
const webp = new TextEncoder().encode('RIFF\u0000\u0000\u0000\u0000WEBPVP8 ');
const pdf = new TextEncoder().encode('%PDF-1.7\n');
const exe = new TextEncoder().encode('MZ\u0090\u0000');

test('real file type from the first bytes', () => {
  assert.equal(sniffMime(jpeg), 'image/jpeg');
  assert.equal(sniffMime(png), 'image/png');
  assert.equal(sniffMime(webp), 'image/webp');
  assert.equal(sniffMime(pdf), 'application/pdf');
  assert.equal(sniffMime(exe), null);
  assert.equal(sniffMime(new Uint8Array()), null);
});

test('upload checks', () => {
  assert.deepEqual(evidenceProblems({ bytes: jpeg, declaredType: 'image/jpeg', fileName: 'a.jpg' }), []);
  assert.deepEqual(evidenceProblems({ bytes: jpeg, declaredType: 'image/jpg', fileName: 'a.jpg' }), []);
  assert.deepEqual(evidenceProblems({ bytes: pdf, declaredType: '', fileName: 'report.pdf' }), []);
  assert.match(evidenceProblems({ bytes: exe, declaredType: 'image/jpeg', fileName: 'x.jpg' })[0], /Only JPEG/);
  assert.match(evidenceProblems({ bytes: png, declaredType: 'image/jpeg', fileName: 'x.jpg' })[0], /does not match/);
  const big = new Uint8Array(MAX_EVIDENCE_BYTES + 1); big.set(jpeg);
  assert.match(evidenceProblems({ bytes: big, declaredType: 'image/jpeg', fileName: 'x.jpg' })[0], /3 MB/);
  assert.match(evidenceProblems({ bytes: new Uint8Array(), declaredType: '', fileName: 'x' }).join(' '), /empty/);
});

test('clean file names', () => {
  assert.equal(cleanFileName('C:\\Users\\me\\photo 1.jpg'), 'photo 1.jpg');
  assert.equal(cleanFileName('../../etc/passwd'), 'passwd');
  assert.equal(cleanFileName('a"<b>.png'), 'ab.png');
  assert.equal(cleanFileName('   '), 'evidence');
});
