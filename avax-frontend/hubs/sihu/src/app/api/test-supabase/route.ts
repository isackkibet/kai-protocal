import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/db';

export async function GET() {
  const health = await checkDatabaseHealth();
  return NextResponse.json({
    status: health.connected ? 'success' : 'fallback',
    mode: health.connected ? 'neon-postgres' : 'resilient-in-memory',
    message: health.connected
      ? 'Supabase integration removed and replaced with Neon Serverless PostgreSQL.'
      : 'Supabase integration removed. Operating with resilient in-memory & local fallback until DATABASE_URL is configured.',
    details: {
      database: 'Neon PostgreSQL (pgvector enabled)',
      connection: health.connected ? 'Connected to Neon cluster' : 'Ready for DATABASE_URL',
      tablesFound: health.tables || [],
    }
  });
}