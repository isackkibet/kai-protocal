-- Information Hub admin dashboard: full article text, a 'story' kind
-- (stories and updates) and when an item was last edited.
--
-- ADDITIVE ONLY and safe to run twice. Apply with:
--   npx prisma db execute --file prisma/sql/2026-10-06_hub_items_articles.sql --schema prisma/schema.prisma
-- Never `prisma db push` on this database.

ALTER TABLE hub_items ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE hub_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hub_items_body_len') THEN
    ALTER TABLE hub_items ADD CONSTRAINT hub_items_body_len CHECK (char_length(body) <= 60000);
  END IF;
  -- Widen the kind list: news, story, activity, photo, video, podcast.
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hub_items_kind_check') THEN
    ALTER TABLE hub_items DROP CONSTRAINT hub_items_kind_check;
  END IF;
  ALTER TABLE hub_items ADD CONSTRAINT hub_items_kind_check
    CHECK (kind IN ('news', 'story', 'activity', 'photo', 'video', 'podcast'));
END $$;
