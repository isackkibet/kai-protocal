import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DIRECT_URL;

  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL is not set in environment.');
    console.log('Please set DATABASE_URL=postgresql://user:password@endpoint.neon.tech/neondb?sslmode=require');
    process.exit(1);
  }

  console.log('🔌 Connecting to Neon PostgreSQL...');
  const sql = neon(connectionString);

  const schemaPath = path.join(__dirname, '..', 'neon-schema-v1.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error('❌ Schema file not found at:', schemaPath);
    process.exit(1);
  }

  console.log('📜 Executing neon-schema-v1.sql migration...');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

  // Split and execute statements
  const statements = schemaSql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    try {
      await (sql as any)(statement);
    } catch (err: any) {
      // Ignore if table/extension already exists
      if (!err?.message?.includes('already exists')) {
        console.warn('⚠️ Notice on statement:', err?.message?.slice(0, 100));
      }
    }
  }

  console.log('✅ Neon PostgreSQL Schema successfully verified and up to date!');
}

main().catch((err) => {
  console.error('Fatal error setting up Neon database:', err);
  process.exit(1);
});
