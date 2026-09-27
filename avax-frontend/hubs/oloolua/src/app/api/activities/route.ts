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

export async function POST(request: Request) {
  try {
    await initDbSchema();
    const body = await request.json();

    const {
      id,
      eventType,
      cfaId = 'CFA-OLO-001',
      nurseryId = 'NUR-OLO-01',
      seedbedId = 'SB-01',
      speciesId = 'SP-01',
      quantity = 100,
      recordedBy = 'Guardian Member',
      date = new Date().toISOString().split('T')[0],
      verificationStatus = 'SUBMITTED',
      notes = ''
    } = body;

    const activityId = id || `ACT-${Date.now().toString().slice(-6)}`;

    // Insert into Neon Postgres table
    await sql`
      INSERT INTO kai_activities (
        id, event_type, cfa_id, nursery_id, seedbed_id, species_id,
        quantity, recorded_by, activity_date, verification_status, notes, json_payload
      ) VALUES (
        ${activityId}, ${eventType}, ${cfaId}, ${nurseryId}, ${seedbedId}, ${speciesId},
        ${quantity}, ${recordedBy}, ${date}::date, ${verificationStatus}, ${notes}, ${JSON.stringify(body)}
      )
      ON CONFLICT (id) DO UPDATE SET
        verification_status = EXCLUDED.verification_status,
        notes = EXCLUDED.notes;
    `;

    // Also insert transaction record
    const direction = (eventType === 'SALE' || eventType === 'DONATION' || eventType === 'PLANTING' || eventType === 'MORTALITY') ? 'OUT' : 'IN';
    const txnId = `TXN-${Date.now().toString().slice(-6)}`;

    await sql`
      INSERT INTO kai_transactions (
        id, transaction_type, nursery_id, seedbed_id, species_id, quantity, direction, txn_date, recorded_by, verification_status
      ) VALUES (
        ${txnId}, ${eventType}, ${nurseryId}, ${seedbedId}, ${speciesId}, ${quantity}, ${direction}, ${date}::date, ${recordedBy}, ${verificationStatus}
      )
      ON CONFLICT (id) DO NOTHING;
    `;

    return NextResponse.json({
      success: true,
      message: 'Activity and transaction written to Neon PostgreSQL',
      activityId,
      txnId
    });
  } catch (error: any) {
    console.error('Error inserting into Neon DB:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
