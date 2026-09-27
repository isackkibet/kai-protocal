import { neon } from '@neondatabase/serverless';

async function main() {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DIRECT_URL;

  if (!connectionString) {
    console.log('ℹ️ DATABASE_URL not set in current shell. SIHU operates seamlessly with in-memory / local fallback.');
    return;
  }

  try {
    console.log('🔌 Testing Neon connection...');
    const sql = neon(connectionString);
    const result = await sql`SELECT NOW() as current_time, version() as pg_version`;
    console.log('✅ Connected to Neon PostgreSQL successfully!');
    console.log('⏰ Server Time:', result[0]?.current_time);
    console.log('🐘 Postgres Version:', result[0]?.pg_version?.slice(0, 40));
  } catch (err: any) {
    console.error('❌ Connection test failed:', err?.message);
  }
}

main();
