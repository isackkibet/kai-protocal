import { createJiti } from 'jiti';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const APP = new URL('../..', import.meta.url).pathname.replace(/\/$/, '');
if (!process.env.DATABASE_URL?.includes('127.0.0.1:55432')) throw new Error('refusing: DATABASE_URL must be the local test DB');
const jiti = createJiti(APP + '/package.json', {
  alias: { '@/lib/auth/privy-server': new URL('./privy-stub.ts', import.meta.url).pathname, '@': APP + '/src' },
  interopDefault: true,
});
const load = (p) => jiti.import(APP + '/src/' + p);

const { PrismaClient } = await import(APP + '/node_modules/@prisma/client/index.js');
const prisma = new PrismaClient();
let passed = 0;
const step = async (name, fn) => { await fn(); passed++; console.log('  ✓', name); };

// Route call helper (origin header for CSRF-free direct handler calls).
const call = async (handler, url, { method = 'POST', user, body, params } = {}) => {
  const req = new Request('http://localhost' + url, {
    method, headers: { 'content-type': 'application/json', ...(user ? { authorization: 'Bearer ' + user } : {}), 'x-forwarded-for': '10.0.0.' + Math.floor(Math.random() * 250) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const res = await handler(req, params ? { params: Promise.resolve(params) } : undefined);
  return { status: res.status, data: await res.json().catch(() => null) };
};

// ── seed ──
const cfa = await prisma.cfa.create({ data: { name: 'Oloolua Community Forest Association', location: 'Karen, Nairobi' } });
const mk = (id, role, email) => prisma.$transaction(async (tx) => {
  await tx.$executeRaw`SELECT set_config('app.current_member_id', ${id}, true)`;
  return tx.cfaMember.create({ data: { id, cfaId: cfa.id, authUserId: 'did:' + role, name: role.toUpperCase(), email, role } });
});
const ADMIN = await mk('11111111-1111-4111-8111-111111111111', 'admin', 'admin@x.ke');
const VERIFIER = await mk('22222222-2222-4222-8222-222222222222', 'verifier', 'v@x.ke');
const MEMBER = await mk('33333333-3333-4333-8333-333333333333', 'member', 'm@x.ke');

const species = await call((await load('app/api/cfa/species/route.ts')).POST, '/api/cfa/species', { user: 'did:admin', body: { commonName: 'Croton', scientificName: 'Croton megalocarpus', localName: 'Mukinduri' } });
const locRoute = (await load('app/api/cfa/locations/route.ts')).POST;
const main = await call(locRoute, '/api/cfa/locations', { user: 'did:admin', body: { name: 'Main Nursery' } });
const sectionB = await call(locRoute, '/api/cfa/locations', { user: 'did:admin', body: { name: 'Section B' } });
const speciesId = species.data.species?.id ?? (await prisma.species.findFirst()).id;
const batch = await call((await load('app/api/cfa/inventory/route.ts')).POST, '/api/cfa/inventory', { user: 'did:member', body: { speciesId, locationId: main.data.location.id, quantity: 1000, dateReceived: '2026-09-01' } });
const batchId = batch.data.batch.id;

console.log('Transfers and losses');
const transfer = (await load('app/api/cfa/transfer/route.ts')).POST;
await step('internal transfer splits the batch and moves 200 to Section B', async () => {
  const r = await call(transfer, '/api/cfa/transfer', { user: 'did:member', body: { inventoryId: batchId, quantity: 200, toLocationId: sectionB.data.location.id, transferDate: '2026-09-10' } });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.equal(r.data.batch.locationId, sectionB.data.location.id);
  assert.equal(r.data.batch.status, 'in_inventory');
  assert.equal((await prisma.seedlingBatch.findUnique({ where: { id: batchId } })).quantity, 800);
});
await step('external transfer marks 100 as transferred', async () => {
  const r = await call(transfer, '/api/cfa/transfer', { user: 'did:member', body: { inventoryId: batchId, quantity: 100, destination: 'Oloolua Primary School' } });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.equal(r.data.batch.status, 'transferred');
});
await step('transfer refuses: both targets, same nursery, too many, not signed in', async () => {
  assert.equal((await call(transfer, '/api/cfa/transfer', { user: 'did:member', body: { inventoryId: batchId, quantity: 1, toLocationId: sectionB.data.location.id, destination: 'x' } })).status, 400);
  assert.equal((await call(transfer, '/api/cfa/transfer', { user: 'did:member', body: { inventoryId: batchId, quantity: 1, toLocationId: main.data.location.id } })).status, 400);
  assert.equal((await call(transfer, '/api/cfa/transfer', { user: 'did:member', body: { inventoryId: batchId, quantity: 5000, destination: 'x' } })).status, 400);
  assert.equal((await call(transfer, '/api/cfa/transfer', { body: { inventoryId: batchId, quantity: 1, destination: 'x' } })).status, 401);
});
const loss = (await load('app/api/cfa/loss/route.ts')).POST;
await step('loss of 50 (drought) splits into a dead batch + loss activity', async () => {
  const r = await call(loss, '/api/cfa/loss', { user: 'did:member', body: { inventoryId: batchId, quantity: 50, reason: 'drought' } });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.equal(r.data.batch.status, 'dead');
  const act = await prisma.nurseryActivity.findFirst({ where: { inventoryId: r.data.batch.id } });
  assert.equal(act.metadata.kind, 'loss');
  assert.equal((await prisma.seedlingBatch.findUnique({ where: { id: batchId } })).quantity, 650);
});
await step('every write is in the audit log with the acting member', async () => {
  const n = await prisma.auditLog.count({ where: { userId: MEMBER.id, entityType: 'seedling_inventory' } });
  assert.ok(n >= 6, `audit rows ${n}`);
});

console.log('Agent tools');
const tools = await load('lib/nursery/tools.ts');
const inv = await tools.getSeedlingInventory({ species: 'croton' });
await step('inventory totals add up: 650 + 200 available, 100 transferred, 50 lost', async () => {
  assert.equal(inv.success, true, JSON.stringify(inv));
  const row = inv.data.bySpecies[0];
  assert.deepEqual([row.available, row.transferred, row.lost, row.total], [850, 100, 50, 1000]);
});
await step('history shows added, transfer and loss', async () => {
  const h = await tools.getInventoryHistory({});
  const kinds = h.data.events.map((e) => e.event);
  assert.ok(kinds.includes('added') && kinds.some((k) => k.startsWith('lost')) && kinds.includes('distribution'), kinds.join(','));
});
await step('transfer draft: right batch, needs a destination, never writes', async () => {
  const p = await tools.prepareSeedlingTransfer('did:member', { species: 'Croton', quantity: 100, fromNursery: 'main', toNursery: 'Section B' });
  assert.equal(p.success, true, JSON.stringify(p));
  assert.equal(p.data.body.inventoryId, batchId);
  const missing = await tools.prepareSeedlingTransfer('did:member', { species: 'Croton', quantity: 100 });
  assert.equal(missing.error.code, 'MISSING_INFORMATION');
  const visitor = await tools.prepareSeedlingTransfer(null, { species: 'Croton', quantity: 1, destination: 'x' });
  assert.equal(visitor.error.code, 'UNAUTHORIZED');
});
const cfaTools = await load('lib/nursery/cfa-tools.ts');
await step('CFA tools: members only for admin/verifier; admin-only drafts', async () => {
  assert.equal((await cfaTools.listCfaMembers('did:member')).error.code, 'FORBIDDEN');
  assert.equal((await cfaTools.listCfaMembers('did:verifier')).data.members.length, 3);
  assert.equal((await cfaTools.prepareCreateSpecies('did:member', { commonName: 'A', scientificName: 'B' })).error.code, 'FORBIDDEN');
  const dup = await cfaTools.prepareCreateSpecies('did:admin', { commonName: 'Croton', scientificName: 'croton megalocarpus' });
  assert.equal(dup.error.code, 'DUPLICATE_RECORD');
  const self = await cfaTools.prepareChangeMember('did:admin', { member: 'admin@x.ke', role: 'member' });
  assert.equal(self.error.code, 'FORBIDDEN');
  const mkVer = await cfaTools.prepareChangeMember('did:admin', { member: 'm@x.ke', role: 'verifier' });
  assert.equal(mkVer.data.endpoint, `/api/cfa/members/${MEMBER.id}`);
});

console.log('CFA admin routes');
await step('profile PATCH: admin ok + audited, member refused, name locked', async () => {
  const profile = (await load('app/api/cfa/profile/route.ts')).PATCH;
  assert.equal((await call(profile, '/api/cfa/profile', { method: 'PATCH', user: 'did:member', body: { description: 'x' } })).status, 403);
  assert.equal((await call(profile, '/api/cfa/profile', { method: 'PATCH', user: 'did:admin', body: { name: 'Other' } })).status, 400);
  const ok = await call(profile, '/api/cfa/profile', { method: 'PATCH', user: 'did:admin', body: { description: 'Community forest in Karen' } });
  assert.equal(ok.status, 200, JSON.stringify(ok.data));
  assert.equal(await prisma.auditLog.count({ where: { entityType: 'cfa', userId: ADMIN.id } }), 1);
});
await step('members: add by email, duplicate refused, role change, no self-change', async () => {
  const members = await load('app/api/cfa/members/route.ts');
  const one = await load('app/api/cfa/members/[id]/route.ts');
  const add = await call(members.POST, '/api/cfa/members', { user: 'did:admin', body: { name: 'Wanjiru', email: 'Wanjiru@X.ke', role: 'auditor' } });
  assert.equal(add.status, 200, JSON.stringify(add.data));
  assert.equal(add.data.member.email, 'wanjiru@x.ke');
  assert.equal((await call(members.POST, '/api/cfa/members', { user: 'did:admin', body: { name: 'W2', email: 'wanjiru@x.ke' } })).status, 409);
  assert.equal((await call(one.PATCH, '/x', { method: 'PATCH', user: 'did:admin', params: { id: ADMIN.id }, body: { role: 'member' } })).status, 400);
  const r = await call(one.PATCH, '/x', { method: 'PATCH', user: 'did:admin', params: { id: add.data.member.id }, body: { status: 'suspended' } });
  assert.equal(r.data.member.status, 'suspended');
  const list = await call(members.GET, '/api/cfa/members', { method: 'GET', user: 'did:member' });
  assert.equal(list.status, 403);
});
await step('nursery PATCH: rename, duplicate name refused', async () => {
  const one = (await load('app/api/cfa/locations/[id]/route.ts')).PATCH;
  const ok = await call(one, '/x', { method: 'PATCH', user: 'did:admin', params: { id: sectionB.data.location.id }, body: { name: 'Section B (shade)', latitude: -1.36 } });
  assert.equal(ok.status, 200, JSON.stringify(ok.data));
  const dup = await call(one, '/x', { method: 'PATCH', user: 'did:admin', params: { id: sectionB.data.location.id }, body: { name: 'Main Nursery' } });
  assert.equal(dup.status, 409, JSON.stringify(dup.data));
});

console.log('Planting → verification');
const planting = (await load('app/api/cfa/planting/route.ts')).POST;
const planted = await call(planting, '/api/cfa/planting', { user: 'did:member', body: { inventoryId: batchId, quantity: 300, plantingDate: '2026-09-20', notes: 'Planted at Site A' } });
const recordId = planted.data.mrvRecord.id;
const verification = await load('lib/mrv/verification.ts');
const review = (await load('app/api/mrv/records/[id]/review/route.ts')).POST;
const decide = (user, body) => call(review, '/x', { user, params: { id: recordId }, body });
await step('planting created a SUBMITTED record by the member', async () => {
  const r = await prisma.conservationRecord.findUnique({ where: { id: recordId } });
  assert.equal(r.verificationStatus, 'SUBMITTED');
  assert.equal(r.submittedByMemberId, MEMBER.id);
});
const setRole = (role) => prisma.$transaction(async (tx) => {
  await tx.$executeRaw`SELECT set_config('app.current_member_id', ${ADMIN.id}, true)`;
  await tx.cfaMember.update({ where: { id: MEMBER.id }, data: { role } });
});
await step('the submitter and plain members cannot verify', async () => {
  await setRole('verifier');
  assert.equal((await decide('did:member', { decision: 'VERIFIED' })).status, 403); // own submission
  await setRole('member');
  assert.equal((await decide('did:member', { decision: 'VERIFIED' })).status, 403);
});
await step('verifier: start review, then send back needs a reason', async () => {
  assert.equal((await decide('did:verifier', { decision: 'UNDER_REVIEW' })).status, 200);
  assert.equal((await decide('did:verifier', { decision: 'CORRECTION_REQUIRED' })).status, 400);
  const r = await decide('did:verifier', { decision: 'CORRECTION_REQUIRED', reason: 'Planting date looks wrong', expectedVersion: 1 });
  assert.equal(r.status, 200, JSON.stringify(r.data));
});
await step('queue: verifier sees nothing waiting; member sees it in "mine"', async () => {
  const q = (await load('app/api/mrv/queue/route.ts')).GET;
  const mine = await call(q, '/api/mrv/queue', { method: 'GET', user: 'did:member' });
  assert.equal(mine.data.mine.length, 1);
  assert.equal(mine.data.mine[0].lastReview.reason, 'Planting date looks wrong');
});
await step('submitter corrects → version 2, SUBMITTED again', async () => {
  const versions = (await load('app/api/mrv/records/[id]/versions/route.ts')).POST;
  const v1 = await prisma.recordVersion.findFirst({ where: { recordId } });
  const r = await call(versions, '/x', { user: 'did:member', params: { id: recordId }, body: { data: { ...v1.data, plantedAt: '2026-09-19T00:00:00.000Z' }, reason: 'Date corrected' } });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.equal(r.data.record.verificationStatus, 'SUBMITTED');
  assert.equal(r.data.record.currentVersion, 2);
});
await step('stale decision refused (expectedVersion 1), then verified at v2', async () => {
  assert.equal((await decide('did:verifier', { decision: 'VERIFIED', expectedVersion: 1 })).status, 409);
  const r = await decide('did:verifier', { decision: 'VERIFIED', expectedVersion: 2 });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.equal((await decide('did:verifier', { decision: 'REJECTED', reason: 'x' })).status, 409); // already verified
});
await step('verification history is append-only in the database', async () => {
  await assert.rejects(prisma.verificationReview.deleteMany({ where: { recordId } }), /append-only/);
  assert.equal(await prisma.verificationReview.count({ where: { recordId } }), 3);
});
await step('verification tools: review_record flags no photo; decision draft refused for verified', async () => {
  const mrvTools = await load('lib/mrv/tools.ts');
  const d = await mrvTools.reviewRecordDetails(recordId);
  assert.ok(d.data.flags.some((f) => /No photo/.test(f)), JSON.stringify(d.data.flags));
  assert.equal((await mrvTools.prepareDecision('did:verifier', { recordId, decision: 'VERIFIED' })).error.code, 'CONFLICT');
});

console.log('Survival check → record');
await step('survival check creates a survival/v1 record', async () => {
  const survival = (await load('app/api/cfa/survival/route.ts')).POST;
  const plantedBatch = await prisma.seedlingBatch.findFirst({ where: { status: 'planted' } });
  const r = await call(survival, '/api/cfa/survival', { user: 'did:member', body: { inventoryId: plantedBatch.id, initialQuantity: 300, aliveQuantity: 270, deadQuantity: 30, observationDate: '2026-09-30' } });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  const rec = await prisma.conservationRecord.findUnique({ where: { id: r.data.mrvRecord.id } });
  assert.equal(rec.schemaVersion, 'survival/v1');
  assert.equal(await verification.reviewRecord(prisma, { recordId: rec.id, member: VERIFIER, decision: 'VERIFIED' }).then((x) => x.record.verificationStatus), 'VERIFIED');
});

console.log('Evidence');
const evidence = await load('app/api/cfa/evidence/route.ts');
const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from('fake photo body')]);
const upload = async (user, bytes, type = 'image/jpeg', entityId = batchId) => {
  const form = new FormData();
  form.append('file', new File([bytes], 'nursery.jpg', { type }));
  form.append('entityType', 'seedling_inventory');
  form.append('entityId', entityId);
  form.append('caption', 'Croton beds');
  const req = new Request('http://localhost/api/cfa/evidence', { method: 'POST', body: form, headers: { 'x-forwarded-for': `10.2.0.${Math.floor(Math.random() * 250)}`, ...(user ? { authorization: 'Bearer ' + user } : {}) } });
  const res = await evidence.POST(req);
  return { status: res.status, data: await res.json() };
};
await step('upload: server computes SHA-256; duplicate, fake type, outsider refused', async () => {
  const r = await upload('did:member', jpeg);
  assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.equal(r.data.evidence.sha256, createHash('sha256').update(jpeg).digest('hex'));
  assert.equal((await upload('did:member', jpeg)).status, 400);
  assert.equal((await upload('did:member', Buffer.from('MZ-not-an-image'))).status, 400);
  assert.equal((await upload(null, jpeg)).status, 401);
  assert.equal((await upload('did:member', jpeg, 'image/jpeg', '99999999-9999-4999-8999-999999999999')).status, 400);
});
await step('file download: members only, bytes + hash header match; files immutable', async () => {
  const one = await load('app/api/cfa/evidence/[id]/route.ts');
  const ev = await prisma.evidence.findFirst();
  const res = await one.GET(new Request('http://x', { headers: { authorization: 'Bearer did:member' } }), { params: Promise.resolve({ id: ev.id }) });
  assert.equal(res.status, 200);
  assert.deepEqual(Buffer.from(await res.arrayBuffer()), jpeg);
  assert.equal(res.headers.get('x-content-sha256'), ev.sha256);
  const anon = await one.GET(new Request('http://x'), { params: Promise.resolve({ id: ev.id }) });
  assert.equal(anon.status, 401);
  await assert.rejects(prisma.evidenceFile.update({ where: { evidenceId: ev.id }, data: { content: Buffer.from('x') } }), /cannot be changed/);
  assert.equal(await prisma.auditLog.count({ where: { entityType: 'evidence' } }), 1);
});

console.log('Data quality, reports, audit (PRD v1.1)');
const quality = await load('lib/nursery/quality.ts');
await step('inventory reconciles after transfers, losses and plantings', async () => {
  const r = await quality.reconcileInventory();
  assert.equal(r.success, true, JSON.stringify(r));
  assert.equal(r.data.isReconciled, true, JSON.stringify(r.data));
  assert.ok(r.data.batchesChecked >= 1);
});
await step('reconcile catches seedlings that appear from nowhere', async () => {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_member_id', ${ADMIN.id}, true)`;
    await tx.seedlingBatch.update({ where: { id: batchId }, data: { quantity: { increment: 7 }, updatedBy: ADMIN.id } });
  });
  const r = await quality.reconcileInventory();
  assert.equal(r.data.isReconciled, false);
  assert.equal(r.data.discrepancies[0].difference, 7);
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_member_id', ${ADMIN.id}, true)`;
    await tx.seedlingBatch.update({ where: { id: batchId }, data: { quantity: { decrement: 7 }, updatedBy: ADMIN.id } });
  });
});
await step('validate: missing site/date, future date, duplicate planting, >1000 photo reminder', async () => {
  const a = await quality.validateConservationData({ kind: 'planting', species: 'Croton', quantity: 300 });
  assert.equal(a.data.valid, false);
  assert.ok(a.data.errors.some((e) => /site/.test(e)) && a.data.errors.some((e) => /date/.test(e)));
  const b = await quality.validateConservationData({ kind: 'addition', species: 'Croton', quantity: 5, date: '2099-01-01' });
  assert.ok(b.data.errors.some((e) => /future/.test(e)));
  const dup = await quality.validateConservationData({ kind: 'planting', species: 'croton', quantity: 300, date: '2026-09-20', site: 'Site A' });
  assert.ok(dup.data.warnings.some((w) => /duplicate/.test(w)), JSON.stringify(dup.data));
  const big = await quality.validateConservationData({ kind: 'addition', species: 'Croton', quantity: 5000, date: '2026-09-01' });
  assert.ok(big.data.warnings.some((w) => /photo/.test(w)));
});
await step('clean data: "500 trees", "jana", species typo', async () => {
  const r = await quality.cleanConservationData({ quantity: '500 trees', date: 'jana', species: 'Krotonn' });
  assert.equal(r.data.cleaned.quantity, 500);
  assert.match(r.data.cleaned.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(r.data.notes.some((n) => /did you mean Croton/.test(n)));
});
await step('activities by site, activity detail, site and CFA reports', async () => {
  const list = await quality.listActivities({ site: 'Site A' });
  assert.equal(list.data.count, 1);
  assert.equal(list.data.activities[0].site, 'Site A');
  const detail = await quality.getActivityDetail(list.data.activities[0].activityId);
  assert.equal(detail.data.verification.status, 'VERIFIED');
  const site = await quality.generateSiteReport('site a');
  assert.equal(site.data.totalPlanted, 300);
  assert.equal(site.data.survival.ratePct, 90);
  const cfaReport = await quality.generateCfaReport({});
  assert.deepEqual(cfaReport.data.plantingSites, ['Site A']);
  assert.ok(cfaReport.data.dataQuality.totalSubmissions >= 2);
});
await step('quality metrics', async () => {
  const m = await quality.getQualityMetrics({});
  assert.equal(m.data.totalSubmissions, 2);
  assert.equal(m.data.verifiedPct, 100);
  assert.equal(m.data.correctedPct, 50);
  assert.equal(m.data.inventoryReconciled, true);
});
await step('audit history: members refused, verifier sees changes without emails', async () => {
  assert.equal((await quality.getAuditHistory('did:member', {})).error.code, 'FORBIDDEN');
  const h = await quality.getAuditHistory('did:verifier', { entityType: 'members' });
  assert.ok(h.data.events.length >= 1);
  assert.ok(!JSON.stringify(h.data).includes('@x.ke'), 'emails leaked');
});
await step('audit export: CSV for verifiers, 403 for members, formula-safe', async () => {
  const exp = (await load('app/api/cfa/audit/export/route.ts')).GET;
  const no = await exp(new Request('http://x/api/cfa/audit/export', { headers: { authorization: 'Bearer did:member' } }));
  assert.equal(no.status, 403);
  const res = await exp(new Request('http://x/api/cfa/audit/export?format=csv', { headers: { authorization: 'Bearer did:verifier' } }));
  assert.equal(res.status, 200);
  const csv = await res.text();
  assert.match(csv.split('\r\n')[0], /^at,actor,actor_id,action,entity_type,entity_id,changes$/);
  assert.ok(Number(res.headers.get('x-row-count')) > 10);
  assert.ok(!csv.includes('@x.ke'), 'emails leaked');
  const json = await (await exp(new Request('http://x/api/cfa/audit/export?format=json', { headers: { authorization: 'Bearer did:admin' } }))).json();
  assert.equal(json.events.length, Number(res.headers.get('x-row-count')));
});
await step('duplicate photo: near-identical dHash on another batch is flagged, not refused', async () => {
  const otherBatch = await prisma.seedlingBatch.findFirst({ where: { status: 'planted' } });
  const send = async (entityId, dhash, bytes) => {
    const form = new FormData();
    form.append('file', new File([bytes], 'p.jpg', { type: 'image/jpeg' }));
    form.append('entityType', 'seedling_inventory'); form.append('entityId', entityId); form.append('dhash', dhash);
    const res = await evidence.POST(new Request('http://localhost/api/cfa/evidence', { method: 'POST', body: form, headers: { authorization: 'Bearer did:member', 'x-forwarded-for': `10.1.0.${Math.floor(Math.random() * 250)}` } }));
    return res.json();
  };
  const first = await send(batchId, 'f0f0f0f0f0f0f0f0', Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.from('photo one')]));
  assert.equal(first.warning, null, JSON.stringify(first));
  const second = await send(otherBatch.id, 'f0f0f0f0f0f0f0f1', Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.from('photo one re-saved')]));
  assert.match(second.warning, /similar/);
  const m = await quality.getQualityMetrics({});
  assert.equal(m.data.possibleDuplicatePhotos, 1);
});

await step('photo GPS is kept only with consent; capture time is kept', async () => {
  const up = async (consent) => {
    const form = new FormData();
    form.append('file', new File([Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.from('gps ' + consent + Math.random())])], 'g.jpg', { type: 'image/jpeg' }));
    form.append('entityType', 'seedling_inventory'); form.append('entityId', batchId);
    form.append('capturedAt', '2026-09-30T08:15:00.000Z');
    form.append('latitude', '-1.358212'); form.append('longitude', '36.709113'); form.append('accuracy', '12');
    if (consent) form.append('gpsConsent', 'yes');
    const res = await evidence.POST(new Request('http://localhost/api/cfa/evidence', { method: 'POST', body: form, headers: { authorization: 'Bearer did:member', 'x-forwarded-for': `10.3.0.${Math.floor(Math.random() * 250)}` } }));
    const d = await res.json();
    return prisma.evidence.findUnique({ where: { id: d.evidence.id } });
  };
  const withGps = await up(true);
  assert.deepEqual(withGps.metadata.location, { latitude: -1.358212, longitude: 36.709113, accuracyM: 12, consent: true });
  assert.equal(withGps.metadata.capturedAt, '2026-09-30T08:15:00.000Z');
  const noGps = await up(false);
  assert.equal(noGps.metadata.location, undefined);
});

console.log('Anchoring');
const anchor = await load('lib/mrv/anchor.ts');
const merkle = await load('lib/mrv/merkle.ts');
let batch1;
await step('member cannot anchor; verifier builds a batch of the 2 verified records', async () => {
  await assert.rejects(anchor.createAnchorBatch(prisma, cfa, MEMBER), /admin or verifier/);
  batch1 = await anchor.createAnchorBatch(prisma, cfa, VERIFIER);
  assert.equal(batch1.recordCount, 2);
  assert.equal(await prisma.conservationRecord.count({ where: { anchorStatus: 'ANCHOR_PENDING' } }), 2);
  assert.equal((await anchor.createAnchorBatch(prisma, cfa, ADMIN)).id, batch1.id); // pending batch reused
});
await step('cancel puts records back; a new batch can be made', async () => {
  await anchor.cancelAnchorBatch(prisma, cfa, ADMIN, batch1.id);
  assert.equal(await prisma.conservationRecord.count({ where: { anchorStatus: 'NOT_ANCHORED' } }), 2);
  batch1 = await anchor.createAnchorBatch(prisma, cfa, ADMIN);
});
await step('confirm: unknown tx is "pending", real Fuji RPC was asked', async () => {
  await assert.rejects(anchor.confirmAnchorBatch(prisma, cfa, ADMIN, batch1.id, '0x' + 'ab'.repeat(32)), (e) => e.status === 202);
});
// From here the chain is simulated: Fuji answers with our transaction.
const realFetch = globalThis.fetch;
const txHash = '0x' + 'cd'.repeat(32);
const fakeChain = (input) => async (url, init) => {
  const { method } = JSON.parse(init.body);
  const result = method === 'eth_getTransactionByHash'
    ? { from: '0xAbCdEf0000000000000000000000000000000001', input, chainId: '0xa869', blockNumber: '0x10' }
    : { status: '0x1', blockNumber: '0x10' };
  return new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result }));
};
await step('confirm refuses a tx carrying another root', async () => {
  globalThis.fetch = fakeChain(merkle.anchorCalldata('0'.repeat(64)));
  await assert.rejects(anchor.confirmAnchorBatch(prisma, cfa, ADMIN, batch1.id, txHash), /different root/);
});
await step('confirm with the right root anchors both records', async () => {
  globalThis.fetch = fakeChain(batch1.calldata);
  const b = await anchor.confirmAnchorBatch(prisma, cfa, ADMIN, batch1.id, txHash);
  assert.equal(b.status, 'ANCHORED');
  assert.equal(await prisma.conservationRecord.count({ where: { anchorStatus: 'ANCHORED', avalancheTxHash: txHash } }), 2);
});
await step('proof route: data → hash → Merkle → chain all pass', async () => {
  const proof = (await load('app/api/mrv/records/[id]/proof/route.ts')).GET;
  const res = await proof(new Request('http://x'), { params: Promise.resolve({ id: recordId }) });
  const d = await res.json();
  assert.equal(d.anchored, true, JSON.stringify(d.steps));
});
console.log('Phase 2: compliance, identity, vaults, payments, site managers');
const compliance = await load('lib/nursery/compliance.ts');
await step('compliance: members refused; the +7 edit is flagged; score and custody trail', async () => {
  assert.equal((await compliance.detectAnomalies('did:member')).error.code, 'FORBIDDEN');
  const a = await compliance.detectAnomalies('did:verifier');
  assert.ok(a.data.anomalies.some((x) => x.kind === 'inventory_increase' && x.severity === 'high'), JSON.stringify(a.data.anomalies));
  const rep = await compliance.generateComplianceReport('did:admin');
  assert.equal(typeof rep.data.dataIntegrityScore, 'number');
  assert.ok(rep.data.scoreBreakdown.length >= 5);
  const coc = await compliance.chainOfCustody('did:auditor-not-member', recordId);
  assert.equal(coc.error.code, 'FORBIDDEN');
  const trail = await compliance.chainOfCustody('did:verifier', recordId);
  const steps = trail.data.events.map((e) => e.step).join(' | ');
  assert.match(steps, /Recorded in the nursery/);
  assert.match(steps, /Verification: VERIFIED/);
  assert.match(steps, /Anchored on Avalanche/);
});

const ident = await load('lib/identity/credentials.ts');
const { privateKeyToAccount, generatePrivateKey } = await import('viem/accounts');
const verifierKey = privateKeyToAccount(generatePrivateKey());
let credId;
await step('credential: verifier signs in their wallet (EIP-712); server checks and stores it', async () => {
  await assert.rejects(ident.prepareRecordCredential(prisma, cfa, MEMBER, recordId), /admin or verifier/);
  const prep = await ident.prepareRecordCredential(prisma, cfa, VERIFIER, recordId);
  assert.equal(prep.claim.record.sha256, (await prisma.conservationRecord.findUnique({ where: { id: recordId } })).dataHash);
  const signature = await verifierKey.signTypedData(prep.typedData);
  // A signature over a different issuedAt does not match the rebuilt claim.
  await assert.rejects(ident.issueRecordCredential(prisma, cfa, VERIFIER, { recordId, issuedAt: new Date(Date.now() - 1000).toISOString(), signer: verifierKey.address, signature }), /signature does not match/);
  const vc = await ident.issueRecordCredential(prisma, cfa, VERIFIER, { recordId, issuedAt: prep.typedData.message.issuedAt, signer: verifierKey.address, signature });
  credId = vc.id;
  const doc = await ident.resolveDid(prisma, ident.cfaDid(cfa));
  assert.ok(doc.verificationMethod.some((m) => m.blockchainAccountId.endsWith(verifierKey.address)), 'signer not in CFA DID document');
});
await step('credential verifies; claim cannot be edited; revoke makes it invalid', async () => {
  const v = await ident.verifyCredential(prisma, credId);
  assert.equal(v.valid, true, JSON.stringify(v.steps));
  assert.equal(v.credential.proof.type, 'EthereumEip712Signature2021');
  await assert.rejects(prisma.verifiableCredential.update({ where: { id: credId }, data: { claim: { forged: true } } }), /only be revoked/);
  await assert.rejects(ident.revokeCredential(prisma, cfa, VERIFIER, credId, 'x'), /Only a CFA admin/);
  await ident.revokeCredential(prisma, cfa, ADMIN, credId, 'Issued by mistake');
  const after = await ident.verifyCredential(prisma, credId);
  assert.equal(after.valid, false);
  assert.equal(after.steps.find((s) => s.step === 'Not revoked').ok, false);
});
await step('DIDs: did:pkh resolves, unknown DIDs do not', async () => {
  const doc = await ident.resolveDid(prisma, `did:pkh:eip155:43113:${verifierKey.address}`);
  assert.equal(doc.verificationMethod[0].blockchainAccountId, `eip155:43113:${verifierKey.address}`);
  assert.equal(await ident.resolveDid(prisma, 'did:web:evil.example:cfa:123'), null);
});

await step('create_vault: only the exact KaiVault creation code decodes', async () => {
  const vaults = await load('lib/defi/vaults.ts');
  const { encodeDeployData } = await import('viem');
  const data = encodeDeployData({ abi: vaults.VAULT_ABI_FULL, bytecode: vaults.VAULT_BYTECODE, args: ['0x6489Ea8302b00A8eEd4D82a78A5f9e71Fe2DaC62', 'KAI NVR Vault 2', 'kvNVR2', BigInt(900)] });
  assert.deepEqual(vaults.decodeVaultCreation(data), { asset: '0x6489Ea8302b00A8eEd4D82a78A5f9e71Fe2DaC62', name: 'KAI NVR Vault 2', symbol: 'kvNVR2', apyBps: 900 });
  assert.equal(vaults.decodeVaultCreation(('0x6080' + data.slice(6))), null);
  assert.ok(vaults.defiAdminWallets().length >= 1);
});

await step('payment receipt: own payment only', async () => {
  const defiTools = await load('lib/defi/tools.ts');
  await prisma.payment.create({ data: { reference: 'KAI-TEST-001', amount_subunits: BigInt(15000), currency: 'KES', status: 'success', wallet: verifierKey.address } });
  const mine = await defiTools.verifyPaymentReceipt({ privyUserId: null, connectedWallet: verifierKey.address }, 'KAI-TEST-001');
  assert.equal(mine.data.status, 'completed');
  assert.equal(mine.data.amount, '150.00 KES');
  const other = await defiTools.verifyPaymentReceipt({ privyUserId: null, connectedWallet: '0x000000000000000000000000000000000000dEaD' }, 'KAI-TEST-001');
  assert.equal(other.error.code, 'FORBIDDEN');
});

await step('site managers: when switched on, members cannot add/transfer/lose stock but can still plant', async () => {
  const profile = (await load('app/api/cfa/profile/route.ts')).PATCH;
  assert.equal((await call(profile, '/api/cfa/profile', { method: 'PATCH', user: 'did:admin', body: { metadata: { inventory_requires_site_manager: true } } })).status, 200);
  const inv = (await load('app/api/cfa/inventory/route.ts')).POST;
  const add = { speciesId, locationId: main.data.location.id, quantity: 10 };
  assert.equal((await call(inv, '/api/cfa/inventory', { user: 'did:member', body: add })).status, 403);
  assert.equal((await call(transfer, '/api/cfa/transfer', { user: 'did:member', body: { inventoryId: batchId, quantity: 1, destination: 'x' } })).status, 403);
  assert.equal((await tools.prepareSeedlingAddition('did:member', { species: 'Croton', quantity: 5 })).error.code, 'FORBIDDEN');
  assert.equal((await call(inv, '/api/cfa/inventory', { user: 'did:admin', body: add })).status, 200);
  const one = (await load('app/api/cfa/members/[id]/route.ts')).PATCH;
  assert.equal((await call(one, '/x', { method: 'PATCH', user: 'did:admin', params: { id: MEMBER.id }, body: { role: 'site_manager' } })).status, 200);
  assert.equal((await call(inv, '/api/cfa/inventory', { user: 'did:member', body: add })).status, 200);
  await call(one, '/x', { method: 'PATCH', user: 'did:admin', params: { id: MEMBER.id }, body: { role: 'member' } });
  const plantOk = await call(planting, '/api/cfa/planting', { user: 'did:member', body: { inventoryId: batchId, quantity: 1, plantingDate: '2026-09-25', notes: 'Planted at Site B' } });
  assert.equal(plantOk.status, 200, JSON.stringify(plantOk.data));
  await call(profile, '/api/cfa/profile', { method: 'PATCH', user: 'did:admin', body: { metadata: { inventory_requires_site_manager: false } } });
});

await step('tampering with stored data is caught by the proof', async () => {
  await prisma.$executeRawUnsafe(`ALTER TABLE record_versions DISABLE TRIGGER USER`);
  await prisma.$executeRawUnsafe(`UPDATE record_versions SET data = jsonb_set(data, '{quantity}', '900') WHERE "recordId" = '${recordId}' AND version = 2`);
  await prisma.$executeRawUnsafe(`ALTER TABLE record_versions ENABLE TRIGGER USER`);
  const check = await anchor.verifyRecordAnchor(prisma, recordId);
  assert.equal(check.anchored, false);
  assert.equal(check.steps[0].ok, false);
});
globalThis.fetch = realFetch;

await prisma.$disconnect();
console.log(`\n${passed} integration checks passed`);
