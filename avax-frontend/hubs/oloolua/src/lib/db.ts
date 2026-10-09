import { neon, neonConfig } from '@neondatabase/serverless';

// The connection string must only ever come from the environment; never
// commit a fallback URL. Without it, queries throw and routes return 500.
const DATABASE_URL = process.env.DATABASE_URL;

// Local testing against a throwaway Postgres behind Neon's HTTP proxy
// (ghcr.io/timowilhelm/local-neon-http-proxy). Never set in production.
if (process.env.NEON_LOCAL_HTTP_PROXY) {
  const endpoint = `${process.env.NEON_LOCAL_HTTP_PROXY.replace(/\/$/, '')}/sql`;
  neonConfig.fetchEndpoint = () => endpoint;
}

export const sql = DATABASE_URL
  ? neon(DATABASE_URL)
  : ((() => {
      throw new Error('DATABASE_URL is not set');
    }) as unknown as ReturnType<typeof neon>);

// Tables for the contact, commitment, pledge and newsletter forms and the team
// inbox. Nursery records live in the Guardian schema (src/lib/guardian/schema.ts).
// Setup runs once per server process; a failed attempt clears the cache so the
// next request retries.
let schemaReady: Promise<void> | null = null;

export function initDbSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = runSchemaSetup().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}

async function runSchemaSetup() {
  // Holds personal data, so no route ever lists it publicly.
  await sql`
    CREATE TABLE IF NOT EXISTS kai_messages (
      id VARCHAR(64) PRIMARY KEY,
      kind VARCHAR(16) NOT NULL,
      name VARCHAR(120),
      contact VARCHAR(160) NOT NULL,
      message TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `;
  // When a message was dealt with in the team inbox (NULL = open).
  await sql`ALTER TABLE kai_messages ADD COLUMN IF NOT EXISTS handled_at TIMESTAMPTZ;`;
  await sql`CREATE INDEX IF NOT EXISTS idx_kai_messages_kind_created ON kai_messages (kind, created_at DESC);`;
}
