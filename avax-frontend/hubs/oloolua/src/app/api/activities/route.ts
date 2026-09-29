import { NextResponse } from 'next/server';
import { sql, initDbSchema } from '@/lib/db';

export async function GET() {
  try {
    await initDbSchema();

    // Fetch activities from Neon Postgres
    const activities = await sql`
      SELECT * FROM kai_activities ORDER BY created_at DESC LIMIT 100
    `;

    // Calculate hourly stats (past 1 hour)
    const pastHour = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const hourlyActivities = await sql`
      SELECT recorded_by, quantity, event_type, created_at, species_id
      FROM kai_activities
      WHERE created_at >= ${pastHour}::timestamptz
      ORDER BY created_at DESC
    `;

    // Calculate today stats (current date)
    const today = new Date().toISOString().split('T')[0];
    const todayActivities = await sql`
      SELECT recorded_by, quantity, event_type, created_at, species_id
      FROM kai_activities
      WHERE activity_date = ${today}::date OR created_at >= CURRENT_DATE
      ORDER BY created_at DESC
    `;

    // Top planters today (grouped by recorded_by)
    const topPlanters = await sql`
      SELECT recorded_by, SUM(quantity) as total_seedlings, COUNT(*) as activity_count
      FROM kai_activities
      WHERE (activity_date = ${today}::date OR created_at >= CURRENT_DATE)
        AND event_type IN ('PLANTING', 'PROPAGATION', 'SOWING')
      GROUP BY recorded_by
      ORDER BY total_seedlings DESC
      LIMIT 10
    `;

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
 * a record verified — only a trusted backend verification step may do that
 * (Canuvari MRV PRD §4.2, §6.1).
 */
export async function POST(request: Request) {
  try {
    await initDbSchema();
    const body = await request.json();

    // Drop client-supplied identity and status fields before storing the payload.
    const { id: _clientId, verificationStatus: _clientStatus, status: _status, ...payload } = body ?? {};

    const {
      eventType,
      cfaId = 'CFA-OLO-001',
      nurseryId = 'NUR-OLO-01',
      seedbedId = 'SB-01',
      speciesId = 'SP-01',
      quantity,
      recordedBy = 'Guardian Member',
      date = new Date().toISOString().split('T')[0],
      notes = ''
    } = payload;

    const qty = Number(quantity);
    if (!eventType || !Number.isInteger(qty) || qty < 0) {
      return NextResponse.json({
        success: false,
        error: 'eventType and a non-negative whole-number quantity are required'
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
