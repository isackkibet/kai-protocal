import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getAirdropSummary,
  getUserReferrals,
  getActivityLedger,
  getMissions,
  claimDailyDropRitual,
  claimMissionReward,
  registerReferralCode,
  linkUserWallet,
  maskName,
} from './engine.ts';

test('PRD AC-1: brand-new user receives base daily claim with multiplier = 1.0', async () => {
  const summary = await getAirdropSummary('test_user_new_' + Date.now());
  assert.equal(summary.baseDailyClaim, 10);
  assert.ok(summary.claimMultiplier >= 1.0);
  assert.ok(summary.projectedNextClaim >= 10);
});

test('PRD §5.2: canonical Power formula = Personal Power + Referral Power + Bonus Power', async () => {
  const summary = await getAirdropSummary('test_user_calc');
  assert.equal(summary.totalPower, summary.personalPower + summary.referralPower + summary.bonusPower);
});

test('PRD §5.3 & §14: referral contribution flows 20% of qualifying power from active referrals', async () => {
  const referrals = await getUserReferrals('test_user_calc');
  const activeRefs = referrals.filter(r => r.status === 'ACTIVE' && r.riskStatus === 'NORMAL');
  
  for (const ref of activeRefs) {
    assert.equal(ref.contributedPower, Math.round(ref.qualifyingPower * 0.2));
  }
});

test('PRD §19a: privacy masking protects referred user identities', () => {
  assert.equal(maskName('Alice Mumo'), 'Al*** M.');
  assert.equal(maskName('Bob'), 'Bo***');
});

test('PRD AC-3 & §5.5: daily claim is idempotent within 24 hours cooldown', async () => {
  const uid = 'test_user_claim_' + Date.now();
  const firstClaim = await claimDailyDropRitual(uid);
  assert.ok(firstClaim.ok);
  assert.ok(firstClaim.claimPoints >= 10);

  // Second claim right away must fail cooldown
  const secondClaim = await claimDailyDropRitual(uid);
  assert.equal(secondClaim.ok, false);
  assert.match(secondClaim.error!, /cooldown|already claimed/i);
});

test('PRD §17: mission claiming awards points and records to activity ledger', async () => {
  const uid = 'test_user_mission_' + Date.now();
  const res = await claimMissionReward(uid, 'invite_first_friend');
  assert.ok(res.ok);
  assert.equal(res.rewardPoints, 50);

  // Duplicate claim should be prevented (idempotency)
  const duplicate = await claimMissionReward(uid, 'invite_first_friend');
  assert.equal(duplicate.ok, false);
  assert.match(duplicate.error!, /already claimed|already completed/i);

  // Verify ledger has the event
  const ledger = await getActivityLedger(uid);
  assert.ok(ledger.some(item => item.sourceId === 'mission_invite_first_friend'));
});

test('PRD §25a: wallet linking validates EVM address format', async () => {
  const uid = 'test_user_wallet_' + Date.now();
  const invalid = await linkUserWallet(uid, 'invalid_address');
  assert.equal(invalid.ok, false);

  const valid = await linkUserWallet(uid, '0x71C840131f476DbD59C067E83bB64aFbc0d6B90b');
  assert.ok(valid.ok);
  assert.equal(valid.address, '0x71c840131f476dbd59c067e83bb64afbc0d6b90b');
});
