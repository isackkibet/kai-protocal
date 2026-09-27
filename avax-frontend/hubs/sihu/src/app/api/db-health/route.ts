import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/db';

export async function GET() {
  try {
    const health = await checkDatabaseHealth();
    return NextResponse.json({
      status: health.connected ? 'connected' : 'disconnected',
      database: 'Neon Serverless PostgreSQL',
      timestamp: health.timestamp || new Date().toISOString(),
      tablesFound: health.tables || [],
      error: health.error || null,
      message: health.connected
        ? 'Successfully connected to Neon PostgreSQL serverless database.'
        : 'Running in resilient self-contained fallback mode. Add DATABASE_URL to connect to live Neon Postgres.',
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      database: 'Neon Serverless PostgreSQL',
      error: error?.message || 'Database connection error',
    }, { status: 500 });
  }
}
