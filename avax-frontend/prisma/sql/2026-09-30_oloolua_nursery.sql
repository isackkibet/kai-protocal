-- =====================================================================
-- Kanuvari: Oloolua CFA Nursery Database (PostgreSQL / Neon)
-- Source: oloolua_cfa_schema.sql (both PRDs merged), applied to the live
-- database alongside the existing app tables.
--
-- Apply with:
--   npx prisma db execute --file prisma/sql/2026-09-30_oloolua_nursery.sql --schema prisma/schema.prisma
-- Never `prisma db push` on this database (it would drop the Oloolua hub's
-- kai_activities / kai_transactions tables).
--
-- Deliberate differences from oloolua_cfa_schema.sql:
--   * provenance_records + snapshot_record() are NOT created. Provenance is
--     conservation_records + record_versions (prisma/sql/2026-09-29_mrv_
--     integrity.sql): RFC 8785 canonical JSON, a previous-hash chain and an
--     append-only trigger. snapshot_record() hashes jsonb::text, which is not
--     a canonical form, so it would give the same record a second,
--     incompatible fingerprint. The verification_status enum (only used by
--     provenance_records) is omitted with it.
--   * conservation_records now points at cfa(id) instead of
--     community_forests(id) (it held no rows when this ran).
--   * The whole script runs in one transaction: all or nothing.
-- =====================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid(), digest()

-- ---------------------------------------------------------------------
-- ENUMS (add values later with: ALTER TYPE x ADD VALUE 'new_value';)
-- ---------------------------------------------------------------------
CREATE TYPE user_role        AS ENUM ('member','admin','verifier','auditor','partner');
CREATE TYPE user_status      AS ENUM ('active','inactive','suspended');
CREATE TYPE inventory_status AS ENUM ('in_inventory','planted','transferred','dead','sold','distributed');
CREATE TYPE activity_type    AS ENUM ('watering','weeding','mulching','pruning','pest_control',
                                      'transplanting','distribution','planting','other');
CREATE TYPE audit_action     AS ENUM ('CREATE','UPDATE','DELETE');

-- ---------------------------------------------------------------------
-- SHARED TRIGGER: updated_at
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END $$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- 1. CFA
-- ---------------------------------------------------------------------
CREATE TABLE cfa (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL UNIQUE,
  location    VARCHAR(255) NOT NULL,
  description TEXT,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 2. MEMBERS  (wallet = identity attribute, NOT the primary key)
-- ---------------------------------------------------------------------
CREATE TABLE members (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cfa_id         UUID NOT NULL REFERENCES cfa(id) ON DELETE RESTRICT,
  auth_user_id   TEXT UNIQUE,                       -- Privy user id (kai_users."privyUserId")
  name           VARCHAR(255) NOT NULL,
  email          VARCHAR(255) NOT NULL,
  phone          VARCHAR(30),
  wallet_address VARCHAR(42)
                 CHECK (wallet_address IS NULL OR wallet_address ~ '^0x[a-fA-F0-9]{40}$'),
  role           user_role   NOT NULL DEFAULT 'member',
  status         user_status NOT NULL DEFAULT 'active',
  metadata       JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (id, cfa_id)                                -- lets other tables enforce same-CFA links
);
CREATE UNIQUE INDEX members_email_uq  ON members (lower(email));
CREATE UNIQUE INDEX members_wallet_uq ON members (lower(wallet_address)) WHERE wallet_address IS NOT NULL;
CREATE INDEX members_cfa_idx ON members (cfa_id);

-- ---------------------------------------------------------------------
-- 3. SPECIES CATALOGUE
-- ---------------------------------------------------------------------
CREATE TABLE species (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  common_name     VARCHAR(255) NOT NULL,
  scientific_name VARCHAR(255) NOT NULL UNIQUE,
  local_name      VARCHAR(255),                      -- e.g. Maa / Kikuyu name
  description     TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_by      UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 4. NURSERY LOCATIONS / PLOTS
-- ---------------------------------------------------------------------
CREATE TABLE nursery_locations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cfa_id      UUID NOT NULL REFERENCES cfa(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  latitude    NUMERIC(10,8) CHECK (latitude  BETWEEN -90  AND 90),
  longitude   NUMERIC(11,8) CHECK (longitude BETWEEN -180 AND 180),
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_by  UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cfa_id, name),
  UNIQUE (id, cfa_id)
);

-- ---------------------------------------------------------------------
-- 5. SEEDLING INVENTORY
-- ---------------------------------------------------------------------
CREATE TABLE seedling_inventory (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cfa_id        UUID NOT NULL REFERENCES cfa(id) ON DELETE CASCADE,
  species_id    UUID NOT NULL REFERENCES species(id) ON DELETE RESTRICT,
  location_id   UUID NOT NULL,
  quantity      INT  NOT NULL CHECK (quantity >= 0),
  status        inventory_status NOT NULL DEFAULT 'in_inventory',
  date_received DATE,                                -- when the batch entered the nursery
  planting_date DATE,                                -- only required once planted
  source        VARCHAR(255),
  notes         TEXT,
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),

  created_by UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- location must belong to the same CFA
  FOREIGN KEY (location_id, cfa_id) REFERENCES nursery_locations (id, cfa_id) ON DELETE RESTRICT,
  UNIQUE (id, cfa_id),
  CONSTRAINT planted_needs_date CHECK (status <> 'planted' OR planting_date IS NOT NULL)
);
CREATE INDEX inv_cfa_status_idx ON seedling_inventory (cfa_id, status);
CREATE INDEX inv_species_idx    ON seedling_inventory (species_id);
CREATE INDEX inv_location_idx   ON seedling_inventory (location_id);
CREATE INDEX inv_metadata_gin   ON seedling_inventory USING GIN (metadata jsonb_path_ops);

-- ---------------------------------------------------------------------
-- 6. NURSERY ACTIVITIES
-- ---------------------------------------------------------------------
CREATE TABLE nursery_activities (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cfa_id            UUID NOT NULL REFERENCES cfa(id) ON DELETE CASCADE,
  location_id       UUID NOT NULL,
  inventory_id      UUID REFERENCES seedling_inventory(id) ON DELETE SET NULL, -- optional link to a batch
  activity_type     activity_type NOT NULL,
  activity_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  description       TEXT,
  quantity_affected INT CHECK (quantity_affected >= 0),
  performed_by      UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  metadata          JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (location_id, cfa_id) REFERENCES nursery_locations (id, cfa_id) ON DELETE RESTRICT
);
CREATE INDEX act_cfa_date_idx ON nursery_activities (cfa_id, activity_date DESC);
CREATE INDEX act_type_idx     ON nursery_activities (activity_type);
CREATE INDEX act_metadata_gin ON nursery_activities USING GIN (metadata jsonb_path_ops);

-- ---------------------------------------------------------------------
-- 7. SURVIVAL OBSERVATIONS (rate computed by the database)
-- ---------------------------------------------------------------------
CREATE TABLE survival_observations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id     UUID NOT NULL REFERENCES seedling_inventory(id) ON DELETE CASCADE,
  observation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  initial_quantity INT NOT NULL CHECK (initial_quantity >= 0),
  alive_quantity   INT NOT NULL CHECK (alive_quantity   >= 0),
  dead_quantity    INT NOT NULL CHECK (dead_quantity    >= 0),
  survival_rate    NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN initial_quantity > 0
         THEN ROUND(alive_quantity::numeric / initial_quantity::numeric * 100, 2)
         ELSE 0.00 END
  ) STORED,
  observed_by UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  notes       TEXT,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_quantity_sum CHECK (alive_quantity + dead_quantity <= initial_quantity)
);
CREATE INDEX surv_inv_date_idx ON survival_observations (inventory_id, observation_date DESC);

-- ---------------------------------------------------------------------
-- 8. AUDIT LOG
-- ---------------------------------------------------------------------
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  entity_type VARCHAR(100) NOT NULL,
  entity_id   UUID NOT NULL,
  action      audit_action NOT NULL,
  old_data    JSONB,
  new_data    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX audit_entity_idx ON audit_logs (entity_type, entity_id, created_at DESC);
CREATE INDEX audit_user_idx   ON audit_logs (user_id, created_at DESC);

-- Audit log is append-only
CREATE OR REPLACE FUNCTION block_audit_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only';
END $$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_immutable
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION block_audit_mutation();

-- ---------------------------------------------------------------------
-- 9. (provenance_records intentionally omitted: see header.)
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- 10. GENERIC AUDIT TRIGGER (all core tables)
--     Actor = app.current_member_id (set by the server per transaction),
--     falling back to updated_by / created_by / performed_by / observed_by.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION audit_row_change() RETURNS trigger AS $$
DECLARE
  v_new   JSONB := CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) END;
  v_old   JSONB := CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) END;
  v_src   JSONB := COALESCE(v_new, v_old);
  v_actor UUID;
BEGIN
  v_actor := COALESCE(
    NULLIF(current_setting('app.current_member_id', true), '')::uuid,
    (v_src->>'updated_by')::uuid,
    (v_src->>'performed_by')::uuid,
    (v_src->>'observed_by')::uuid,
    (v_src->>'created_by')::uuid
  );
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'No acting member: SET LOCAL app.current_member_id before writing to %', TG_TABLE_NAME;
  END IF;

  INSERT INTO audit_logs (user_id, entity_type, entity_id, action, old_data, new_data)
  VALUES (v_actor, TG_TABLE_NAME, (v_src->>'id')::uuid,
          CASE TG_OP WHEN 'INSERT' THEN 'CREATE' WHEN 'UPDATE' THEN 'UPDATE' ELSE 'DELETE' END::audit_action,
          v_old, v_new);
  RETURN COALESCE(NEW, OLD);
END $$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['cfa','members','species','nursery_locations',
                           'seedling_inventory','nursery_activities','survival_observations']
  LOOP
    EXECUTE format('CREATE TRIGGER %I_updated_at BEFORE UPDATE ON %I
                    FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
  END LOOP;

  -- audit everything except cfa (bootstrap row has no member yet)
  FOREACH t IN ARRAY ARRAY['members','species','nursery_locations',
                           'seedling_inventory','nursery_activities','survival_observations']
  LOOP
    EXECUTE format('CREATE TRIGGER %I_audit AFTER INSERT OR UPDATE OR DELETE ON %I
                    FOR EACH ROW EXECUTE FUNCTION audit_row_change()', t, t);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 11. DASHBOARD VIEWS
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_latest_survival AS
SELECT DISTINCT ON (inventory_id) *
FROM survival_observations
ORDER BY inventory_id, observation_date DESC, created_at DESC;

CREATE OR REPLACE VIEW v_nursery_dashboard AS
SELECT
  c.id AS cfa_id,
  c.name AS cfa_name,
  COALESCE(SUM(i.quantity), 0)                                        AS total_seedlings,
  COUNT(DISTINCT i.species_id)                                        AS species_count,
  COALESCE(SUM(i.quantity) FILTER (WHERE i.status = 'in_inventory'), 0) AS in_nursery,
  COALESCE(SUM(i.quantity) FILTER (WHERE i.status = 'planted'), 0)      AS planted,
  ROUND(AVG(s.survival_rate), 1)                                      AS avg_survival_pct,
  (SELECT COUNT(*) FROM nursery_activities a WHERE a.cfa_id = c.id)  AS activity_count
FROM cfa c
LEFT JOIN seedling_inventory i ON i.cfa_id = c.id
LEFT JOIN v_latest_survival s  ON s.inventory_id = i.id
GROUP BY c.id, c.name;

CREATE OR REPLACE VIEW v_inventory_by_status AS
SELECT cfa_id, status, SUM(quantity) AS total, COUNT(*) AS batches
FROM seedling_inventory GROUP BY cfa_id, status;

-- ---------------------------------------------------------------------
-- 12. SEED DATA
-- ---------------------------------------------------------------------
INSERT INTO cfa (name, location, description)
VALUES ('Oloolua Community Forest Association', 'Kenya', 'Oloolua CFA nursery management');

-- ---------------------------------------------------------------------
-- 13. MRV: conservation records belong to a cfa (was community_forests)
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM conservation_records) THEN
    RAISE EXCEPTION 'conservation_records is not empty; migrate its forestId values before repointing';
  END IF;
END $$;
ALTER TABLE conservation_records DROP CONSTRAINT "conservation_records_forestId_fkey";
ALTER TABLE conservation_records ALTER COLUMN "forestId" TYPE UUID USING "forestId"::uuid;
ALTER TABLE conservation_records
  ADD CONSTRAINT "conservation_records_forestId_fkey"
  FOREIGN KEY ("forestId") REFERENCES cfa(id) ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
