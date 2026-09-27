import { neon, NeonQueryFunction } from '@neondatabase/serverless';

/**
 * Neon Serverless PostgreSQL Database Client for Sango Info Hub (SIHU)
 * Uses HTTP-based pooled serverless connections (ideal for Next.js App Router & Vercel)
 */

let sqlClient: NeonQueryFunction<false, false> | null = null;

export function getDb(): NeonQueryFunction<false, false> | null {
  if (sqlClient) return sqlClient;

  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DIRECT_URL;

  if (!connectionString) {
    return null;
  }

  try {
    sqlClient = neon(connectionString);
    return sqlClient;
  } catch (error) {
    console.error('[Neon Postgres] Failed to initialize client:', error);
    return null;
  }
}

/**
 * Check if Neon database is reachable and verify schema status
 */
export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  timestamp?: string;
  tables?: string[];
  error?: string;
}> {
  const sql = getDb();
  if (!sql) {
    return {
      connected: false,
      error: 'DATABASE_URL is not configured in environment variables.',
    };
  }

  try {
    const timeResult = await sql`SELECT NOW() as current_time`;
    const tablesResult = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;

    return {
      connected: true,
      timestamp: timeResult[0]?.current_time,
      tables: tablesResult.map((r: any) => r.table_name),
    };
  } catch (err: any) {
    console.error('[Neon Postgres Health Check Error]:', err);
    return {
      connected: false,
      error: err?.message || 'Database query failed.',
    };
  }
}
