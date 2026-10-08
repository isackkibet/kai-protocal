import { NextResponse } from 'next/server';
import { sql, initDbSchema } from '@/lib/db';

/** Mirrors ActivityType in src/types/kai.ts — the one list the server trusts. */
const ALLOWED_EVENT_TYPES = new Set([
  'PROPAGATION', 'SEED_COLLECTION', 'SOWING', 'GERMINATION', 'PRICKING_OUT',
  'POTTING', 'WATERING', 'WEEDING', 'PEST_MANAGEMENT', 'FERTILIZATION',
  'HARDENING', 'SEEDLING_MOVEMENT', 'SALE', 'DONATION', 'TRANSFER',
  'PLANTING', 'MORTALITY', 'OTHER',
]);

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Keys that must never survive a round-trip from untrusted JSON. */
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/** Strips prototype-pollution vectors from a plain object. Never mutates input. */
function sanitizeShallow<T extends Record<string, unknown>>(input: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (FORBIDDEN_KEYS.has(key)) continue;
    out[key] = value;
  }
  return out as T;
}

/** Trims a value to a plain, length-capped string (or the fallback). */
function cappedString(value: unknown, maxLen: number, fallback = ''): string {
  const s = typeof value === 'string' ? value : fallback;
  return s.slice(0, maxLen);
}

export async function GET() {
  try {
    await initDbSchema();

    // Fetch activities from Neon Postgres
    const activities = (await sql`
      SELECT * FROM kai_activities ORDER BY created_at DESC LIMIT 100
    `) as Record<string, any>[];

    // Calculate hourly stats (past 1 hour)
    const pastHour = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const hourlyActivities = (await sql`
      SELECT recorded_by, quantity, event_type, created_at, species_id
      FROM kai_activities
      WHERE created_at >= ${pastHour}::timestamptz
      ORDER BY created_at DESC
    `) as Record<string, any>[];

    // Calculate today stats (current date)
    const today = new Date().toISOString().split('T')[0];
    const todayActivities = (await sql`
      SELECT recorded_by, quantity, event_type, created_at, species_id
      FROM kai_activities
      WHERE activity_date = ${today}::date OR created_at >= CURRENT_DATE
      ORDER BY created_at DESC
    `) as Record<string, any>[];

    // Top planters today (grouped by recorded_by)
    const topPlanters = (await sql`
      SELECT recorded_by, SUM(quantity) as total_seedlings, COUNT(*) as activity_count
      FROM kai_activities
      WHERE (activity_date = ${today}::date OR created_at >= CURRENT_DATE)
        AND event_type IN ('PLANTING', 'PROPAGATION', 'SOWING')
      GROUP BY recorded_by
      ORDER BY total_seedlings DESC
      LIMIT 10
    `) as Record<string, any>[];

    return NextResponse.json({
      success: true,
      data: activities,
      analytics: {
        hourly: {
          count: hourlyActivities.length,
          totalSeedlings: hourlyActivities.reduce((acc, row) => acc + (Number(row.quantity) || 0), 0),
          recentRecords: hourlyActivities
        },
        today: {
          count: todayActivities.length,
          totalSeedlings: todayActivities.reduce((acc, row) => acc + (Number(row.quantity) || 0), 0),
          recentRecords: todayActivities
        },
        topPlantersToday: topPlanters
      }
    });
  } catch (error: any) {
    console.error('Error fetching Neon DB activities:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      data: []
    }, { status: 500 });
  }
}

/**
 * Records a new conservation activity. Records are append-only: the server
 * assigns the id and every record starts as DRAFT or SUBMITTED. The client
 * can never choose an existing id (which would overwrite that record) or mark
 * a record verified; only a trusted backend verification step may do that
 * (Canuvari MRV PRD §4.2, §6.1).
 */
export async function POST(request: Request) {
  try {
    await initDbSchema();
    const rawBody = await request.json();
    if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
      return NextResponse.json({ success: false, error: 'Request body must be a JSON object' }, { status: 400 });
    }

    // Strip prototype-pollution vectors, then drop client-supplied identity
    // and status fields before storing the payload.
    const { id: _clientId, verificationStatus: _clientStatus, status: _status, ...payload } = sanitizeShallow(rawBody as Record<string, unknown>);

    const eventType = typeof payload.eventType === 'string' ? payload.eventType.toUpperCase() : '';
    const cfaId = cappedString(payload.cfaId, 32, 'CFA-OLO-001');
    const nurseryId = cappedString(payload.nurseryId, 32, 'NUR-OLO-01');
    const seedbedId = cappedString(payload.seedbedId, 32, 'SB-01');
    const speciesId = cappedString(payload.speciesId, 32, 'SP-01');
    const recordedBy = cappedString(payload.recordedBy, 128, 'Guardian Member') || 'Guardian Member';
    const notes = cappedString(payload.notes, 2000, '');
    const dateInput = cappedString(payload.date, 10, new Date().toISOString().split('T')[0]);
    const date = ISO_DATE_RE.test(dateInput) ? dateInput : new Date().toISOString().split('T')[0];

    const qty = Number(payload.quantity);
    if (!ALLOWED_EVENT_TYPES.has(eventType)) {
      return NextResponse.json({
        success: false,
        error: `eventType must be one of: ${[...ALLOWED_EVENT_TYPES].join(', ')}`
      }, { status: 400 });
    }
    if (!Number.isInteger(qty) || qty < 0 || qty > 1_000_000) {
      return NextResponse.json({
        success: false,
        error: 'quantity must be a whole number between 0 and 1,000,000'
      }, { status: 400 });
    }

    // A submitter may keep a record as DRAFT; anything else is SUBMITTED.
    // VERIFIED / REJECTED are never accepted from the client.
    const verificationStatus = _clientStatus === 'DRAFT' ? 'DRAFT' : 'SUBMITTED';
    const activityId = `ACT-${crypto.randomUUID()}`;

    await sql`
      INSERT INTO kai_activities (
        id, event_type, cfa_id, nursery_id, seedbed_id, species_id,
        quantity, recorded_by, activity_date, verification_status, notes, json_payload
      ) VALUES (
        ${activityId}, ${eventType}, ${cfaId}, ${nurseryId}, ${seedbedId}, ${speciesId},
        ${qty}, ${recordedBy}, ${date}::date, ${verificationStatus}, ${notes}, ${JSON.stringify(payload)}
      );
    `;

    // Also insert transaction record
    const direction = (eventType === 'SALE' || eventType === 'DONATION' || eventType === 'PLANTING' || eventType === 'MORTALITY') ? 'OUT' : 'IN';
    const txnId = `TXN-${crypto.randomUUID()}`;

    await sql`
      INSERT INTO kai_transactions (
        id, transaction_type, nursery_id, seedbed_id, species_id, quantity, direction, txn_date, recorded_by, verification_status
      ) VALUES (
        ${txnId}, ${eventType}, ${nurseryId}, ${seedbedId}, ${speciesId}, ${qty}, ${direction}, ${date}::date, ${recordedBy}, ${verificationStatus}
      );
    `;

    return NextResponse.json({
      success: true,
      message: 'Activity and transaction written to Neon PostgreSQL',
      activityId,
      txnId,
      verificationStatus
    });
  } catch (error: any) {
    console.error('Error inserting into Neon DB:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to record activity'
    }, { status: 500 });
  }
}
