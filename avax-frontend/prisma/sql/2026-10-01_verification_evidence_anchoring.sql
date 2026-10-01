-- Kanuvari Tools & Agents PRD phases 7-9: human verification, evidence, Merkle anchoring.
--
-- ADDITIVE ONLY: new tables, one new enum value, triggers on the new tables.
-- Nothing existing is altered or dropped, and it is safe to run twice.
--
-- Apply with:
--   npx prisma db execute --file prisma/sql/2026-10-01_verification_evidence_anchoring.sql --schema prisma/schema.prisma
-- Never `prisma db push` on this database (see prisma/schema.prisma header).

-- ---------------------------------------------------------------------
-- 1. Verification: a verifier can send a record back for correction.
--    (ADD VALUE cannot be used in the same transaction, and nothing below uses it.)
-- ---------------------------------------------------------------------
ALTER TYPE "RecordVerificationStatus" ADD VALUE IF NOT EXISTS 'CORRECTION_REQUIRED';

-- Every verification decision, append-only. The record's own status is the
-- latest decision; this table is the history a verifier and auditor read.
CREATE TABLE IF NOT EXISTS verification_reviews (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id      TEXT NOT NULL REFERENCES conservation_records(id) ON DELETE RESTRICT,
  -- The exact version and fingerprint that was reviewed.
  record_version INT  NOT NULL CHECK (record_version >= 1),
  data_hash      TEXT NOT NULL,
  decision       TEXT NOT NULL CHECK (decision IN ('UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'CORRECTION_REQUIRED')),
  reason         TEXT,
  reviewer_id    UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- A rejection or a correction request must say why.
  CONSTRAINT review_reason_required CHECK (
    decision IN ('UNDER_REVIEW', 'VERIFIED') OR length(btrim(coalesce(reason, ''))) > 0
  )
);
CREATE INDEX IF NOT EXISTS verification_reviews_record_idx ON verification_reviews (record_id, created_at DESC);

CREATE OR REPLACE FUNCTION verification_reviews_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'verification_reviews is append-only';
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS verification_reviews_immutable ON verification_reviews;
CREATE TRIGGER verification_reviews_immutable
BEFORE UPDATE OR DELETE ON verification_reviews
FOR EACH ROW EXECUTE FUNCTION verification_reviews_append_only();

-- ---------------------------------------------------------------------
-- 2. Evidence: photos and documents with a SHA-256 fingerprint.
--    Metadata (audited) and file bytes (not audited: the audit trigger
--    copies whole rows, which would duplicate every photo) are separate.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS evidence (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cfa_id      UUID NOT NULL REFERENCES cfa(id) ON DELETE RESTRICT,
  entity_type VARCHAR(40) NOT NULL CHECK (entity_type IN
                ('seedling_inventory', 'nursery_activities', 'survival_observations', 'conservation_records')),
  entity_id   TEXT NOT NULL,
  file_name   VARCHAR(255) NOT NULL,
  mime_type   VARCHAR(100) NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
  size_bytes  INT NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 3145728),
  sha256      CHAR(64) NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  caption     TEXT,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_by  UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- The same file attached twice to the same thing is a duplicate.
  CONSTRAINT evidence_unique_file UNIQUE (entity_type, entity_id, sha256)
);
CREATE INDEX IF NOT EXISTS evidence_entity_idx ON evidence (entity_type, entity_id);

CREATE TABLE IF NOT EXISTS evidence_files (
  evidence_id UUID PRIMARY KEY REFERENCES evidence(id) ON DELETE CASCADE,
  content     BYTEA NOT NULL
);

CREATE OR REPLACE FUNCTION evidence_files_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'evidence files cannot be changed; upload a new file instead';
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS evidence_files_no_update ON evidence_files;
CREATE TRIGGER evidence_files_no_update
BEFORE UPDATE ON evidence_files
FOR EACH ROW EXECUTE FUNCTION evidence_files_immutable();

DROP TRIGGER IF EXISTS evidence_updated_at ON evidence;
CREATE TRIGGER evidence_updated_at BEFORE UPDATE ON evidence
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS evidence_audit ON evidence;
CREATE TRIGGER evidence_audit AFTER INSERT OR UPDATE OR DELETE ON evidence
FOR EACH ROW EXECUTE FUNCTION audit_row_change();

-- ---------------------------------------------------------------------
-- 3. Anchoring: verified records grouped into a batch, the batch's Merkle
--    root written to Avalanche Fuji in a transaction signed by a CFA admin
--    or verifier's own wallet.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS anchor_batches (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cfa_id         UUID NOT NULL REFERENCES cfa(id) ON DELETE RESTRICT,
  merkle_root    CHAR(64) NOT NULL CHECK (merkle_root ~ '^[0-9a-f]{64}$'),
  record_count   INT NOT NULL CHECK (record_count > 0),
  status         TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ANCHORED', 'CANCELLED')),
  chain_id       INT NOT NULL DEFAULT 43113,
  tx_hash        CHAR(66) UNIQUE CHECK (tx_hash IS NULL OR tx_hash ~ '^0x[0-9a-f]{64}$'),
  anchored_from  VARCHAR(42),
  block_number   BIGINT,
  created_by     UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  anchored_at    TIMESTAMPTZ,
  CONSTRAINT anchored_needs_tx CHECK (status <> 'ANCHORED' OR (tx_hash IS NOT NULL AND anchored_at IS NOT NULL))
);
-- At most one batch waiting for its transaction per CFA.
CREATE UNIQUE INDEX IF NOT EXISTS anchor_batches_one_pending ON anchor_batches (cfa_id) WHERE status = 'PENDING';
-- A root is unique among live batches only: after a cancel, the same records
-- give the same root again. (First version of this file had a plain UNIQUE.)
ALTER TABLE anchor_batches DROP CONSTRAINT IF EXISTS anchor_batches_merkle_root_key;
CREATE UNIQUE INDEX IF NOT EXISTS anchor_batches_live_root ON anchor_batches (merkle_root) WHERE status <> 'CANCELLED';

CREATE TABLE IF NOT EXISTS anchor_batch_records (
  batch_id       UUID NOT NULL REFERENCES anchor_batches(id) ON DELETE CASCADE,
  record_id      TEXT NOT NULL REFERENCES conservation_records(id) ON DELETE RESTRICT,
  record_version INT  NOT NULL,
  -- The record's dataHash at batching time (the Merkle leaf input).
  data_hash      CHAR(64) NOT NULL,
  leaf_index     INT  NOT NULL CHECK (leaf_index >= 0),
  -- Sibling hashes from leaf to root (lib/mrv/merkle.ts).
  proof          JSONB NOT NULL CHECK (jsonb_typeof(proof) = 'array'),
  PRIMARY KEY (batch_id, record_id)
);
CREATE INDEX IF NOT EXISTS anchor_batch_records_record_idx ON anchor_batch_records (record_id);

-- ---------------------------------------------------------------------
-- 4. CFA profile edits are audited too (the original migration skipped the
--    cfa table only because its bootstrap INSERT had no acting member).
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS cfa_audit ON cfa;
CREATE TRIGGER cfa_audit AFTER UPDATE ON cfa
FOR EACH ROW EXECUTE FUNCTION audit_row_change();
