-- Information Hub landing pages: each organisation's About / Mission text
-- and the news, activities, photos, videos and podcasts its admins publish.
--
-- Hubs: 'oloolua' (Oloolua Youth Guardians / Oloolua CFA; managed by CFA
-- admins) and 'sihu' (SIHU, Sango; managed by SIHU editors). Adding a hub
-- later only needs a new value in the two CHECKs.
--
-- ADDITIVE ONLY and safe to run twice. Apply with:
--   npx prisma db execute --file prisma/sql/2026-10-05_hub_content.sql --schema prisma/schema.prisma
-- Never `prisma db push` on this database.

CREATE TABLE IF NOT EXISTS hub_profiles (
  hub        TEXT PRIMARY KEY CHECK (hub IN ('oloolua', 'sihu')),
  about      TEXT CHECK (char_length(about) <= 3000),
  mission    TEXT CHECK (char_length(mission) <= 1500),
  updated_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hub_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hub          TEXT NOT NULL CHECK (hub IN ('oloolua', 'sihu')),
  kind         TEXT NOT NULL CHECK (kind IN ('news', 'activity', 'photo', 'video', 'podcast')),
  title        TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 160),
  summary      TEXT CHECK (char_length(summary) <= 2000),
  url          TEXT CHECK (url ~ '^https://' AND char_length(url) <= 500),
  image        BYTEA,
  image_mime   TEXT CHECK (image_mime IN ('image/jpeg', 'image/png', 'image/webp')),
  image_sha256 TEXT CHECK (image_sha256 ~ '^[0-9a-f]{64}$'),
  happened_on  DATE,
  published    BOOLEAN NOT NULL DEFAULT true,
  author_email TEXT,
  author_name  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hub_items_hub_kind ON hub_items (hub, kind, created_at DESC) WHERE published;
