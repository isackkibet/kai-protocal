import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reviewerError, transitionError } from './verification.ts';

test('allowed status changes', () => {
  assert.equal(transitionError('SUBMITTED', 'UNDER_REVIEW'), null);
  assert.equal(transitionError('SUBMITTED', 'VERIFIED'), null);
  assert.equal(transitionError('UNDER_REVIEW', 'VERIFIED'), null);
  assert.equal(transitionError('UNDER_REVIEW', 'REJECTED'), null);
  assert.equal(transitionError('UNDER_REVIEW', 'CORRECTION_REQUIRED'), null);
});

test('refused status changes', () => {
  assert.ok(transitionError('UNDER_REVIEW', 'UNDER_REVIEW'));
  assert.ok(transitionError('VERIFIED', 'REJECTED'));
  assert.ok(transitionError('VERIFIED', 'VERIFIED'));
  assert.ok(transitionError('REJECTED', 'VERIFIED'));
  assert.ok(transitionError('CORRECTION_REQUIRED', 'VERIFIED'));
});

test('who may review', () => {
  const record = { forestId: 'cfa1', submittedByMemberId: 'm-submitter' };
  const m = (over: object) => ({ id: 'm-verifier', role: 'verifier', status: 'active', cfaId: 'cfa1', ...over }) as never;
  assert.equal(reviewerError(m({}), record), null);
  assert.equal(reviewerError(m({ role: 'admin' }), record), null);
  assert.match(reviewerError(m({ role: 'member' }), record)!, /verifier or admin/);
  assert.match(reviewerError(m({ id: 'm-submitter' }), record)!, /someone else/);
  assert.match(reviewerError(m({ status: 'suspended' }), record)!, /suspended/);
  assert.match(reviewerError(m({ cfaId: 'other' }), record)!, /another CFA/);
  assert.match(reviewerError(null, record)!, /members/);
});
