-- Profiles keyed by the person's account (email sign-in), not a wallet.
--
-- The email is the main identifier (kai_users.email). Name and phone stay
-- on kai_users; the rest of the profile form (county, ID, CFA details...)
-- lives here as JSON, so it survives restarts (it used to sit in server
-- memory, keyed by wallet). A wallet can be added later; it is not needed.
--
-- ADDITIVE ONLY and safe to run twice. Apply with:
--   npx prisma db execute --file prisma/sql/2026-10-05_member_profiles.sql --schema prisma/schema.prisma
-- Never `prisma db push` on this database.

CREATE TABLE IF NOT EXISTS member_profiles (
  kai_user_id TEXT PRIMARY KEY REFERENCES kai_users(id) ON DELETE CASCADE,
  data        JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(data) = 'object'),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
