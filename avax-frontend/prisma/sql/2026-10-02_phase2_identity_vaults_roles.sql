-- Ecosystem PRD v1.1 Phase 2: identity (DIDs + verifiable credentials),
-- admin-created vaults, and the SITE_MANAGER role.
--
-- ADDITIVE ONLY and safe to run twice. Apply with:
--   npx prisma db execute --file prisma/sql/2026-10-02_phase2_identity_vaults_roles.sql --schema prisma/schema.prisma
-- Never `prisma db push` on this database.

-- ---------------------------------------------------------------------
-- 1. SITE_MANAGER (PRD §7.3): manages inventory when the CFA turns on
--    "only site managers record inventory" (cfa.metadata.inventory_requires_site_manager).
-- ---------------------------------------------------------------------
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'site_manager';

-- ---------------------------------------------------------------------
-- 2. DID documents (PRD §4.17 create_w3c_did / resolve_did).
--    CFA: did:web:<host>:cfa:<id>. Members use did:pkh (derived from their
--    wallet, nothing stored). The document is rebuilt from the CFA's current
--    admins/verifiers and their wallets; each version is kept here.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS did_documents (
  did          TEXT PRIMARY KEY CHECK (did ~ '^did:[a-z0-9]+:'),
  subject_type TEXT NOT NULL CHECK (subject_type IN ('cfa', 'site', 'member')),
  subject_id   TEXT NOT NULL,
  document     JSONB NOT NULL CHECK (jsonb_typeof(document) = 'object'),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS did_documents_subject ON did_documents (subject_type, subject_id);

-- ---------------------------------------------------------------------
-- 3. Verifiable credentials (PRD §4.17 sign_claim / verify_claim).
--    Signed in the issuer's OWN wallet (EIP-712); the server never holds a
--    signing key. Rows are never deleted; revoking only sets status.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS verifiable_credentials (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cfa_id         UUID NOT NULL REFERENCES cfa(id) ON DELETE RESTRICT,
  credential_type TEXT NOT NULL,
  issuer_did     TEXT NOT NULL,
  subject_did    TEXT NOT NULL,
  record_id      TEXT REFERENCES conservation_records(id) ON DELETE RESTRICT,
  claim          JSONB NOT NULL CHECK (jsonb_typeof(claim) = 'object'),
  claim_hash     CHAR(66) NOT NULL CHECK (claim_hash ~ '^0x[0-9a-f]{64}$'),
  signer_address VARCHAR(42) NOT NULL CHECK (signer_address ~ '^0x[0-9a-fA-F]{40}$'),
  signature      TEXT NOT NULL CHECK (signature ~ '^0x[0-9a-fA-F]+$'),
  issued_by      UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  revoked_reason TEXT,
  issued_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS vc_record_idx ON verifiable_credentials (record_id);
CREATE INDEX IF NOT EXISTS vc_subject_idx ON verifiable_credentials (subject_did);
-- One active credential of a type per record.
CREATE UNIQUE INDEX IF NOT EXISTS vc_one_active ON verifiable_credentials (record_id, credential_type) WHERE status = 'active' AND record_id IS NOT NULL;

CREATE OR REPLACE FUNCTION vc_only_revocation() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'credentials are never deleted; revoke instead'; END IF;
  IF NEW.claim IS DISTINCT FROM OLD.claim OR NEW.signature IS DISTINCT FROM OLD.signature
     OR NEW.claim_hash IS DISTINCT FROM OLD.claim_hash OR NEW.signer_address IS DISTINCT FROM OLD.signer_address
     OR OLD.status = 'revoked' THEN
    RAISE EXCEPTION 'a credential can only be revoked, once';
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS vc_immutable ON verifiable_credentials;
CREATE TRIGGER vc_immutable BEFORE UPDATE OR DELETE ON verifiable_credentials
FOR EACH ROW EXECUTE FUNCTION vc_only_revocation();

-- ---------------------------------------------------------------------
-- 4. Vaults created by a DeFi admin from their own wallet (PRD §4.15
--    create_vault). The deploy-time vaults stay in defiAddresses.json; these
--    are added at runtime after the server checks the contract on Fuji.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS defi_vaults (
  address      VARCHAR(42) PRIMARY KEY CHECK (address ~ '^0x[0-9a-fA-F]{40}$'),
  name         TEXT NOT NULL,
  share_symbol TEXT NOT NULL,
  asset        VARCHAR(42) NOT NULL CHECK (asset ~ '^0x[0-9a-fA-F]{40}$'),
  asset_symbol TEXT NOT NULL,
  strategy     TEXT NOT NULL DEFAULT 'single-asset',
  fee_bps      INT NOT NULL DEFAULT 0 CHECK (fee_bps BETWEEN 0 AND 3000),
  owner        VARCHAR(42) NOT NULL,
  deploy_tx    CHAR(66) NOT NULL UNIQUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
