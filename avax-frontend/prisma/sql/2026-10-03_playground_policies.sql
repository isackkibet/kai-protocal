-- KAI Playground (/nuvari) policies. Until now they lived in server memory
-- and vanished whenever Vercel started a new instance.
--
-- ADDITIVE ONLY and safe to run twice. Apply with:
--   npx prisma db execute --file prisma/sql/2026-10-03_playground_policies.sql --schema prisma/schema.prisma
-- Never `prisma db push` on this database.
--
-- A row is written only after /api/policies has checked the fee payment on
-- Avalanche Fuji (sent from `owner` to the treasury). One payment = one
-- policy: payment_tx_hash is unique, so a payment can't be reused.

CREATE TABLE IF NOT EXISTS playground_policies (
  policy_id       TEXT PRIMARY KEY CHECK (policy_id ~ '^pol_[0-9a-f]{8,32}$'),
  service_type    TEXT NOT NULL CHECK (service_type ~ '^[a-z_]{2,32}$'),
  owner           TEXT NOT NULL CHECK (owner ~ '^0x[0-9a-f]{40}$'),
  config          JSONB NOT NULL CHECK (jsonb_typeof(config) = 'object'),
  payment_amount  NUMERIC(20, 8) NOT NULL DEFAULT 0 CHECK (payment_amount >= 0),
  payment_tx_hash TEXT NOT NULL UNIQUE CHECK (payment_tx_hash ~ '^0x[0-9a-f]{64}$'),
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS playground_policies_owner ON playground_policies (owner, created_at DESC);
