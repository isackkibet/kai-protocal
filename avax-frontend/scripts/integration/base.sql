-- Triggers copied from prisma/sql/2026-09-30_oloolua_nursery.sql (set_updated_at,
-- append-only audit_logs, audit_row_change + per-table triggers) for the local test DB.
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

-- Production unique rules Prisma can't express.
CREATE UNIQUE INDEX IF NOT EXISTS members_email_uq ON members (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS members_wallet_uq ON members (lower(wallet_address)) WHERE wallet_address IS NOT NULL;
ALTER TABLE anchor_batches DROP CONSTRAINT IF EXISTS anchor_batches_merkle_root_key;
DROP INDEX IF EXISTS anchor_batches_merkle_root_key;
ALTER TABLE verification_reviews ADD CONSTRAINT review_reason_required CHECK (decision IN ('UNDER_REVIEW','VERIFIED') OR length(btrim(coalesce(reason,''))) > 0);
