-- Murals and portraits with conservation provenance.
--
-- A mural is linked to verified conservation records (planting, nursery,
-- survival) from a CFA. Its provenance hash is the SHA-256 of a canonical
-- JSON of the mural (title, artist, image fingerprint) and the linked
-- records' own fingerprints, so the mural's story can be checked against
-- the records, which are themselves timestamped on Avalanche.
--
-- ADDITIVE ONLY and safe to run twice. Apply with:
--   npx prisma db execute --file prisma/sql/2026-10-05_murals.sql --schema prisma/schema.prisma
-- Never `prisma db push` on this database.

CREATE TABLE IF NOT EXISTS murals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cfa_id          UUID NOT NULL REFERENCES cfa(id) ON DELETE RESTRICT,
  slug            TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]{2,79}$'),
  title           TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  artist          TEXT NOT NULL CHECK (char_length(artist) BETWEEN 2 AND 120),
  description     TEXT CHECK (char_length(description) <= 2000),
  size_label      TEXT CHECK (char_length(size_label) <= 60),
  price_kes       INTEGER NOT NULL CHECK (price_kes BETWEEN 0 AND 10000000),
  status          TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('draft', 'available', 'reserved', 'sold')),
  image           BYTEA,
  image_mime      TEXT CHECK (image_mime IN ('image/jpeg', 'image/png', 'image/webp')),
  image_sha256    TEXT CHECK (image_sha256 ~ '^[0-9a-f]{64}$'),
  provenance_hash TEXT CHECK (provenance_hash ~ '^[0-9a-f]{64}$'),
  created_by      UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS murals_cfa_status ON murals (cfa_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS mural_records (
  mural_id  UUID NOT NULL REFERENCES murals(id) ON DELETE CASCADE,
  record_id TEXT NOT NULL REFERENCES conservation_records(id) ON DELETE RESTRICT,
  PRIMARY KEY (mural_id, record_id)
);

CREATE TABLE IF NOT EXISTS mural_enquiries (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mural_id   UUID NOT NULL REFERENCES murals(id) ON DELETE CASCADE,
  name       TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  phone      TEXT CHECK (char_length(phone) <= 30),
  email      TEXT CHECK (char_length(email) <= 254),
  message    TEXT CHECK (char_length(message) <= 1000),
  status     TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (phone IS NOT NULL OR email IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS mural_enquiries_mural ON mural_enquiries (mural_id, created_at DESC);
