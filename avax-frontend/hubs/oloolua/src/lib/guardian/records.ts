/**
 * Record lifecycle (PRD B5, B7, B10). Server-only.
 *
 *   Draft -> Pending Confirmation -> Confirmed -> Verified | Rejected
 *                                              -> Corrected (superseded by a new version)
 *
 * Guarantees, enforced in SQL rather than by convention:
 *  - Confirming is one atomic statement: the record, its ledger movements,
 *    the Keeper Diary entry and the audit entry are written together.
 *  - Confirming twice never creates two records (draft_id is UNIQUE and the
 *    draft can only leave 'pending' once).
 *  - A recorder cannot verify or reject their own record.
 *  - Corrections create a new version; the original and its diary entry stay.
 */

import { sql } from '@/lib/db';
import { NURSERY_ID } from './schema';
import { ACTIVITY_TYPES, LARGE_QUANTITY, can, type ActivityType, type DraftField } from './constants';
import { FIELD_QUESTIONS, NO_RE, YES_RE, answerField, missingFields, type DraftFields } from './extract';
import { eatToday, formatDate, isValidIsoDate } from './time';
import { nurserySummary, seedbeds as listSeedbeds, species as listSpecies } from './data';
import type { Viewer } from './session';

const DRAFT_TTL_MINUTES = 30;

/** Draft fields as stored: display values plus the resolved database ids. */
export interface StoredFields extends DraftFields {
  speciesId?: string;
  seedbedId?: string;
  toSeedbedId?: string;
  warnings?: string[];
  acknowledged?: boolean;
}

export interface DraftView {
  id: string;
  status: 'draft' | 'pending' | 'confirmed' | 'cancelled';
  fields: StoredFields;
  awaiting: DraftField | null;
  question: string | null;
  readBack: string | null;
  warnings: string[];
  needsAcknowledgement: boolean;
  correctionOf: string | null;
  correctionReason: string | null;
  expiresAt: string;
}

// Flat rather than a discriminated union: this project's tsconfig has strict
// off, which stops `r.ok ? ... : r.message` from narrowing a union.
export interface Outcome<T> {
  ok: boolean;
  value?: T;
  code?: 'forbidden' | 'not_found' | 'invalid' | 'conflict';
  message?: string;
}

const fail = (code: 'forbidden' | 'not_found' | 'invalid' | 'conflict', message: string): Outcome<never> => ({ ok: false, code, message });

export async function audit(entry: {
  userId: string | null; channel?: string; requestText?: string | null; interpretation?: unknown;
  tool: string; confirmation?: string; result: string; recordId?: string | null; verificationStatus?: string | null;
}) {
  try {
    await sql`
      INSERT INTO guardian_audit (user_id, channel, request_text, interpretation, tool, confirmation, result, record_id, verification_status)
      VALUES (${entry.userId}, ${entry.channel ?? null}, ${entry.requestText?.slice(0, 2000) ?? null},
        ${entry.interpretation === undefined ? null : JSON.stringify(entry.interpretation)}, ${entry.tool},
        ${entry.confirmation ?? null}, ${entry.result}, ${entry.recordId ?? null}, ${entry.verificationStatus ?? null})
    `;
  } catch (err) {
    console.error('[guardian] audit write failed:', err);
  }
}

/** One-line summary used for read-back and the Keeper Diary. */
export function describe(f: StoredFields, nurseryName = 'Turako Nursery'): string {
  if (!f.type) return 'Activity (type not set)';
  const parts = [`${ACTIVITY_TYPES[f.type].label}: ${f.quantity ?? '?'} seedlings`];
  if (f.species) parts.push(f.species);
  if (f.type === 'transfer') parts.push(`from bed ${f.seedbed ?? '?'} to bed ${f.toSeedbed ?? '?'}`);
  else if (f.seedbed) parts.push(`bed ${f.seedbed}`);
  if (f.destination) parts.push(`to ${f.destination}`);
  parts.push(nurseryName);
  parts.push(f.date ? formatDate(f.date) : 'date not set');
  return parts.join(', ');
}

function toView(row: Record<string, unknown>): DraftView {
  const fields = (row.fields ?? {}) as StoredFields;
  const awaiting = (row.awaiting as DraftField | null) ?? null;
  const status = row.status as DraftView['status'];
  const warnings = fields.warnings ?? [];
  return {
    id: String(row.id),
    status,
    fields,
    awaiting,
    question: awaiting ? FIELD_QUESTIONS[awaiting] : null,
    readBack: status === 'pending' ? `${describe(fields)}.` : null,
    warnings,
    needsAcknowledgement: status === 'pending' && warnings.length > 0 && !fields.acknowledged,
    correctionOf: (row.correction_of as string) ?? null,
    correctionReason: (row.correction_reason as string) ?? null,
    expiresAt: new Date(String(row.expires_at)).toISOString(),
  };
}

/** Resolves names/numbers to ids and drops anything that does not exist, so it is asked again. */
async function normalise(input: DraftFields): Promise<{ fields: StoredFields; problems: Partial<Record<DraftField, string>> }> {
  const fields: StoredFields = {};
  const problems: Partial<Record<DraftField, string>> = {};
  if (input.type && input.type in ACTIVITY_TYPES) fields.type = input.type;
  if (input.typeAmbiguous && !fields.type) fields.typeAmbiguous = true;
  if (input.quantity !== undefined) {
    const q = Number(input.quantity);
    if (Number.isInteger(q) && q > 0 && q <= 1_000_000) fields.quantity = q;
    else problems.quantity = 'The quantity must be a whole number above zero.';
  }
  if (input.date) {
    if (isValidIsoDate(input.date)) fields.date = input.date;
    else problems.date = 'That date was not clear.';
  }
  if (input.destination) fields.destination = String(input.destination).trim().slice(0, 120);
  if (input.notes) fields.notes = String(input.notes).trim().slice(0, 500);

  if (input.species) {
    const all = await listSpecies();
    const match = all.find((s) => s.name.toLowerCase() === String(input.species).toLowerCase())
      ?? all.find((s) => s.name.toLowerCase().includes(String(input.species).toLowerCase()));
    if (match) { fields.species = match.name; fields.speciesId = match.id; }
    else problems.species = `There is no species called "${input.species}" in the Guardian catalogue.`;
  }
  if (input.seedbed !== undefined || input.toSeedbed !== undefined) {
    const beds = await listSeedbeds();
    for (const key of ['seedbed', 'toSeedbed'] as const) {
      if (input[key] === undefined) continue;
      const bed = beds.find((b) => b.bedNumber === Number(input[key]));
      if (bed) {
        fields[key] = bed.bedNumber;
        fields[key === 'seedbed' ? 'seedbedId' : 'toSeedbedId'] = bed.id;
      } else {
        problems[key] = `There is no bed ${input[key]} in the Guardian database. Beds: ${beds.map((b) => b.bedNumber).join(', ')}.`;
      }
    }
    if (fields.type === 'transfer' && fields.seedbed && fields.seedbed === fields.toSeedbed) {
      delete fields.toSeedbed; delete fields.toSeedbedId;
      problems.toSeedbed = 'A transfer needs two different beds.';
    }
  }
  return { fields, problems };
}

async function computeWarnings(viewer: Viewer, f: StoredFields, isCorrection: boolean): Promise<string[]> {
  const warnings: string[] = [];
  if (f.date && f.date > eatToday()) warnings.push(`The date (${formatDate(f.date)}) is in the future.`);
  if (f.quantity && f.quantity > LARGE_QUANTITY) warnings.push(`${f.quantity.toLocaleString()} is an unusually large quantity.`);
  if (f.type && ACTIVITY_TYPES[f.type].stock === 'out' && f.quantity) {
    const s = await nurserySummary();
    const known = s.readyStockVerified + s.readyStockPendingNet;
    if (f.quantity > known) warnings.push(`This removes more than the recorded ready stock (${known.toLocaleString()}).`);
  }
  if (!isCorrection && f.type && f.quantity && f.date) {
    const dup = (await sql`
      SELECT 1 FROM guardian_activities
      WHERE nursery_id = ${NURSERY_ID} AND type = ${f.type} AND quantity = ${f.quantity}
        AND activity_date = ${f.date}::date AND recorded_by = ${viewer.user.id} AND status IN ('confirmed','verified')
      LIMIT 1
    `) as unknown[];
    if (dup.length) warnings.push('You already recorded the same activity, quantity and date. This may be a duplicate.');
  }
  return warnings;
}

async function saveDraftState(
  viewer: Viewer, draftId: string | null, fields: StoredFields, problems: Partial<Record<DraftField, string>>,
  meta: { requestText?: string; channel?: string; correctionOf?: string | null; correctionReason?: string | null },
): Promise<{ view: DraftView; problem?: string }> {
  const missing = missingFields(fields);
  if (fields.typeAmbiguous && !fields.type) missing.unshift('type');
  const firstProblemField = (Object.keys(problems) as DraftField[])[0];
  const awaiting = firstProblemField ?? missing[0] ?? null;
  const status = awaiting ? 'draft' : 'pending';
  if (status === 'pending') {
    fields.warnings = await computeWarnings(viewer, fields, !!meta.correctionOf);
    fields.acknowledged = false;
  } else {
    delete fields.warnings;
  }
  const expires = new Date(Date.now() + DRAFT_TTL_MINUTES * 60_000).toISOString();

  let rows: Record<string, unknown>[];
  if (draftId) {
    rows = (await sql`
      UPDATE guardian_drafts SET fields = ${JSON.stringify(fields)}, awaiting = ${awaiting}, status = ${status},
        updated_at = now(), expires_at = ${expires}
      WHERE id = ${draftId} AND user_id = ${viewer.user.id} AND status IN ('draft','pending')
      RETURNING *
    `) as Record<string, unknown>[];
  } else {
    // One open draft per user: starting a new one cancels the old.
    await sql`UPDATE guardian_drafts SET status = 'cancelled', updated_at = now()
      WHERE user_id = ${viewer.user.id} AND status IN ('draft','pending')`;
    rows = (await sql`
      INSERT INTO guardian_drafts (user_id, hub_id, fields, awaiting, status, request_text, channel, correction_of, correction_reason, expires_at)
      VALUES (${viewer.user.id}, ${viewer.hubId}, ${JSON.stringify(fields)}, ${awaiting}, ${status},
        ${meta.requestText?.slice(0, 2000) ?? null}, ${meta.channel ?? 'text'}, ${meta.correctionOf ?? null},
        ${meta.correctionReason ?? null}, ${expires})
      RETURNING *
    `) as Record<string, unknown>[];
  }
  return { view: toView(rows[0]), problem: firstProblemField ? problems[firstProblemField] : undefined };
}

/** create_activity_draft (Keeper and above). Nothing is written to official records. */
export async function createDraft(
  viewer: Viewer, input: DraftFields, meta: { requestText?: string; channel?: string },
): Promise<Outcome<{ view: DraftView; problem?: string }>> {
  if (!can(viewer.role, 'record')) {
    await audit({ userId: viewer.user.id, channel: meta.channel, requestText: meta.requestText, interpretation: input, tool: 'create_activity_draft', result: 'denied' });
    return fail('forbidden', 'Your role cannot record activities. Ask an Admin for the Keeper role.');
  }
  const { fields, problems } = await normalise(input);
  const saved = await saveDraftState(viewer, null, fields, problems, meta);
  await audit({ userId: viewer.user.id, channel: meta.channel, requestText: meta.requestText, interpretation: saved.view.fields, tool: 'create_activity_draft', confirmation: saved.view.status, result: 'draft_saved' });
  return { ok: true, value: saved };
}

export async function getOpenDraft(viewer: Viewer): Promise<DraftView | null> {
  const rows = (await sql`
    SELECT * FROM guardian_drafts
    WHERE user_id = ${viewer.user.id} AND status IN ('draft','pending') AND expires_at > now()
    ORDER BY updated_at DESC LIMIT 1
  `) as Record<string, unknown>[];
  return rows[0] ? toView(rows[0]) : null;
}

export async function cancelDraft(viewer: Viewer, draftId: string): Promise<Outcome<DraftView>> {
  const rows = (await sql`
    UPDATE guardian_drafts SET status = 'cancelled', updated_at = now()
    WHERE id = ${draftId} AND user_id = ${viewer.user.id} AND status IN ('draft','pending')
    RETURNING *
  `) as Record<string, unknown>[];
  if (!rows[0]) return fail('not_found', 'That draft is no longer open.');
  await audit({ userId: viewer.user.id, tool: 'cancel_activity_draft', confirmation: 'cancelled', result: 'cancelled', interpretation: rows[0].fields });
  return { ok: true, value: toView(rows[0]) };
}

export type DraftReply =
  | { handled: false }
  | { handled: true; kind: 'updated'; view: DraftView; problem?: string }
  | { handled: true; kind: 'cancelled'; view: DraftView }
  | { handled: true; kind: 'acknowledge'; view: DraftView }
  | { handled: true; kind: 'confirmed'; record: ConfirmResult }
  | { handled: true; kind: 'error'; message: string };

/**
 * Applies a chat reply to the user's open draft: an answer to its question,
 * yes, or no. Returns handled:false when the message is something else, in
 * which case it is a new prompt (and counts towards the limit).
 */
export async function replyToDraft(viewer: Viewer, draft: DraftView, reply: string, speciesNames: string[]): Promise<DraftReply> {
  if (NO_RE.test(reply)) {
    const r = await cancelDraft(viewer, draft.id);
    return r.ok ? { handled: true, kind: 'cancelled', view: r.value } : { handled: true, kind: 'error', message: r.message };
  }
  if (draft.status === 'pending' && YES_RE.test(reply)) {
    if (draft.needsAcknowledgement) {
      const rows = (await sql`
        UPDATE guardian_drafts SET fields = fields || '{"acknowledged": true}'::jsonb, updated_at = now()
        WHERE id = ${draft.id} AND user_id = ${viewer.user.id} AND status = 'pending' RETURNING *
      `) as Record<string, unknown>[];
      return rows[0] ? { handled: true, kind: 'acknowledge', view: toView(rows[0]) } : { handled: true, kind: 'error', message: 'That draft is no longer open.' };
    }
    const r = await confirmDraft(viewer, draft.id, true);
    return r.ok ? { handled: true, kind: 'confirmed', record: r.value } : { handled: true, kind: 'error', message: r.message };
  }
  if (draft.status === 'draft' && draft.awaiting) {
    const answer = answerField(draft.awaiting, reply, speciesNames);
    if (!answer) return { handled: false };
    const merged: DraftFields = { ...draft.fields, ...answer };
    if (answer.type) merged.typeAmbiguous = false;
    const { fields, problems } = await normalise(merged);
    const saved = await saveDraftState(viewer, draft.id, fields, problems, { correctionOf: draft.correctionOf });
    return { handled: true, kind: 'updated', view: saved.view, problem: saved.problem };
  }
  return { handled: false };
}

export interface ConfirmResult {
  recordId: string;
  status: string;
  version: number;
  description: string;
  alreadyConfirmed: boolean;
}

/** confirm_activity_record. Only ever triggered by the user's explicit yes, never by the AI. */
export async function confirmDraft(viewer: Viewer, draftId: string, acknowledged: boolean): Promise<Outcome<ConfirmResult>> {
  if (!can(viewer.role, 'record')) return fail('forbidden', 'Your role cannot record activities.');

  const [draftRow] = (await sql`SELECT * FROM guardian_drafts WHERE id = ${draftId} AND user_id = ${viewer.user.id}`) as Record<string, unknown>[];
  if (!draftRow) return fail('not_found', 'Draft not found.');
  const view = toView(draftRow);

  if (view.status === 'confirmed') {
    const [existing] = (await sql`SELECT id, status, version FROM guardian_activities WHERE draft_id = ${draftId}`) as { id: string; status: string; version: number }[];
    if (existing) {
      return { ok: true, value: { recordId: existing.id, status: existing.status, version: existing.version, description: describe(view.fields), alreadyConfirmed: true } };
    }
  }
  if (view.status !== 'pending') return fail('conflict', 'This draft is not ready to save. Answer its remaining question first.');
  if (new Date(view.expiresAt).getTime() < Date.now()) return fail('conflict', 'This draft has expired. Please describe the activity again.');
  if (view.warnings.length > 0 && !acknowledged && !view.fields.acknowledged) {
    return fail('invalid', 'This draft has warnings that need an extra confirmation.');
  }

  const f = view.fields;
  const description = describe(f);
  const rows = (await sql`
    WITH d AS (
      UPDATE guardian_drafts SET status = 'confirmed', updated_at = now()
      WHERE id = ${draftId} AND user_id = ${viewer.user.id} AND status = 'pending' AND expires_at > now()
      RETURNING id, request_text, channel, correction_of, correction_reason, fields
    ),
    prev AS (
      UPDATE guardian_activities SET status = 'corrected'
      WHERE id = (SELECT correction_of FROM d) AND status IN ('confirmed','verified','rejected')
      RETURNING id, version
    ),
    a AS (
      INSERT INTO guardian_activities (nursery_id, type, activity_date, quantity, species_id, seedbed_id, to_seedbed_id,
        destination, notes, recorded_by, status, version, supersedes_id, correction_reason, draft_id)
      SELECT ${NURSERY_ID}, ${f.type ?? null}, ${f.date ?? null}::date, ${f.quantity ?? null}, ${f.speciesId ?? null},
        ${f.seedbedId ?? null}, ${f.toSeedbedId ?? null}, ${f.destination ?? null}, ${f.notes ?? null}, ${viewer.user.id},
        'confirmed', COALESCE((SELECT version FROM prev), 0) + 1, (SELECT id FROM prev), d.correction_reason, d.id
      FROM d
      WHERE d.correction_of IS NULL OR EXISTS (SELECT 1 FROM prev)
      RETURNING *
    ),
    t AS (
      INSERT INTO guardian_inventory_txns (nursery_id, seedbed_id, species_id, txn_date, activity_id, direction, quantity, source)
      SELECT a.nursery_id, m.bed, a.species_id, a.activity_date, a.id, m.dir, a.quantity, 'activity'
      FROM a, LATERAL (
        SELECT a.seedbed_id AS bed, 'in' AS dir WHERE a.type = 'hardening'
        UNION ALL SELECT a.seedbed_id, 'out' WHERE a.type IN ('dispatch','out_planting','mortality','transfer')
        UNION ALL SELECT a.to_seedbed_id, 'in' WHERE a.type = 'transfer'
      ) m
      RETURNING 1
    ),
    k AS (
      INSERT INTO guardian_diary (activity_id, actor_id, event_type, description, status)
      SELECT a.id, ${viewer.user.id},
        CASE WHEN a.supersedes_id IS NULL THEN 'recorded' ELSE 'corrected' END,
        CASE WHEN a.supersedes_id IS NULL THEN ${description}
             ELSE ${`Correction (version `} || a.version || ${`): ${description}. Reason: `} || COALESCE(a.correction_reason, '') END,
        'confirmed'
      FROM a
      RETURNING 1
    ),
    au AS (
      INSERT INTO guardian_audit (user_id, channel, request_text, interpretation, tool, confirmation, result, record_id, verification_status)
      SELECT ${viewer.user.id}, d.channel, d.request_text, d.fields, 'confirm_activity_record', 'confirmed', 'success', a.id, 'confirmed'
      FROM a, d
      RETURNING 1
    )
    SELECT a.id, a.status, a.version, (SELECT COUNT(*) FROM t) AS txns, (SELECT COUNT(*) FROM k) AS diary, (SELECT COUNT(*) FROM au) AS audited
    FROM a
  `) as { id: string; status: string; version: number }[];

  if (rows[0]) {
    return { ok: true, value: { recordId: rows[0].id, status: rows[0].status, version: rows[0].version, description, alreadyConfirmed: false } };
  }
  // A concurrent confirm won the race: return the record it created.
  const [existing] = (await sql`SELECT id, status, version FROM guardian_activities WHERE draft_id = ${draftId}`) as { id: string; status: string; version: number }[];
  if (existing) return { ok: true, value: { recordId: existing.id, status: existing.status, version: existing.version, description, alreadyConfirmed: true } };
  return fail('conflict', 'This draft could not be saved. It may have expired, or the record it corrects has changed.');
}

/** Verify or reject a Confirmed record (Verifier, Admin). Never your own. */
export async function reviewRecord(viewer: Viewer, recordId: string, decision: 'verify' | 'reject', reason: string): Promise<Outcome<{ status: string }>> {
  if (!can(viewer.role, 'verify')) {
    await audit({ userId: viewer.user.id, tool: 'review_activity_record', result: 'denied', recordId });
    return fail('forbidden', 'Only a Verifier or Admin can verify or reject records.');
  }
  const [rec] = (await sql`SELECT recorded_by, status FROM guardian_activities WHERE id = ${recordId} AND nursery_id = ${NURSERY_ID}`) as { recorded_by: string; status: string }[];
  if (!rec) return fail('not_found', 'Record not found.');
  if (rec.recorded_by === viewer.user.id) {
    await audit({ userId: viewer.user.id, tool: 'review_activity_record', result: 'denied_own_record', recordId });
    return fail('forbidden', 'You recorded this activity, so you cannot verify or reject it. Another authorised person must review it.');
  }
  if (rec.status !== 'confirmed') return fail('conflict', `Only Confirmed records can be reviewed. This one is ${rec.status}.`);
  if (decision === 'reject' && reason.trim().length < 3) return fail('invalid', 'Please give a reason for rejecting.');

  const newStatus = decision === 'verify' ? 'verified' : 'rejected';
  const cleanReason = reason.trim().slice(0, 500) || null;
  const rows = (await sql`
    WITH a AS (
      UPDATE guardian_activities SET status = ${newStatus}, reviewed_by = ${viewer.user.id}, reviewed_at = now(), review_reason = ${cleanReason}
      WHERE id = ${recordId} AND status = 'confirmed' AND recorded_by <> ${viewer.user.id}
      RETURNING id, type, quantity, activity_date
    ),
    k AS (
      INSERT INTO guardian_diary (activity_id, actor_id, event_type, description, status)
      SELECT a.id, ${viewer.user.id}, ${newStatus},
        ${decision === 'verify' ? 'Verified' : 'Rejected'} || ': ' || a.quantity || ' seedlings, ' || a.type || ', ' || to_char(a.activity_date, 'YYYY-MM-DD')
          || COALESCE('. Reason: ' || ${cleanReason}, ''),
        ${newStatus}
      FROM a RETURNING 1
    ),
    au AS (
      INSERT INTO guardian_audit (user_id, tool, confirmation, result, record_id, verification_status, request_text)
      SELECT ${viewer.user.id}, 'review_activity_record', ${decision}, 'success', a.id, ${newStatus}, ${cleanReason} FROM a RETURNING 1
    )
    SELECT a.id FROM a
  `) as unknown[];
  if (!rows.length) return fail('conflict', 'The record changed before it could be reviewed. Refresh and try again.');
  return { ok: true, value: { status: newStatus } };
}

/** update_activity_record: a correction becomes a new draft that supersedes the original once confirmed. */
export async function startCorrection(
  viewer: Viewer, recordId: string, changes: DraftFields, reason: string, meta: { requestText?: string; channel?: string },
): Promise<Outcome<{ view: DraftView; problem?: string }>> {
  const [rec] = (await sql`
    SELECT a.*, s.name AS species_name, b1.bed_number AS bed, b2.bed_number AS to_bed
    FROM guardian_activities a
    LEFT JOIN guardian_species s ON s.id = a.species_id
    LEFT JOIN guardian_seedbeds b1 ON b1.id = a.seedbed_id
    LEFT JOIN guardian_seedbeds b2 ON b2.id = a.to_seedbed_id
    WHERE a.id = ${recordId} AND a.nursery_id = ${NURSERY_ID}
  `) as Record<string, unknown>[];
  if (!rec) return fail('not_found', 'Record not found.');
  const own = rec.recorded_by === viewer.user.id;
  if (!(can(viewer.role, 'correctAny') || (own && can(viewer.role, 'correctOwn')))) {
    await audit({ userId: viewer.user.id, tool: 'update_activity_record', result: 'denied', recordId, requestText: meta.requestText });
    return fail('forbidden', own ? 'Your role cannot correct records.' : 'Your role can only correct records you recorded yourself.');
  }
  if (rec.status === 'corrected') return fail('conflict', 'This record already has a newer version. Correct the latest version instead.');
  if (reason.trim().length < 3) return fail('invalid', 'A correction needs a reason.');

  const base: DraftFields = {
    type: rec.type as ActivityType,
    quantity: Number(rec.quantity),
    date: new Date(String(rec.activity_date)).toISOString().slice(0, 10),
    species: (rec.species_name as string) ?? undefined,
    seedbed: (rec.bed as number) ?? undefined,
    toSeedbed: (rec.to_bed as number) ?? undefined,
    destination: (rec.destination as string) ?? undefined,
    notes: (rec.notes as string) ?? undefined,
  };
  // Only fields the user actually changed: an undefined value must not wipe the original.
  const changed = Object.fromEntries(Object.entries(changes).filter(([, v]) => v !== undefined && v !== null && v !== '')) as DraftFields;
  const { fields, problems } = await normalise({ ...base, ...changed });
  const saved = await saveDraftState(viewer, null, fields, problems, {
    requestText: meta.requestText, channel: meta.channel, correctionOf: recordId, correctionReason: reason.trim().slice(0, 500),
  });
  await audit({ userId: viewer.user.id, channel: meta.channel, requestText: meta.requestText, interpretation: { recordId, changes, reason }, tool: 'update_activity_record', confirmation: saved.view.status, result: 'draft_saved', recordId });
  return { ok: true, value: saved };
}
