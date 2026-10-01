#!/usr/bin/env bash
# Integration test for the nursery, verification, evidence and anchoring code
# against a THROWAWAY Postgres in Docker (never Neon). Calls the real API route
# handlers; only the Privy sign-in check is stubbed (token = user id) and the
# Avalanche RPC is simulated for the "confirmed transaction" steps.
#
#   npm run test:integration          (needs Docker)
#   KEEP_DB=1 npm run test:integration  keeps the container for poking around
set -euo pipefail
cd "$(dirname "$0")/../.."
NAME=kai-itest-pg
URL="postgresql://postgres:itest@127.0.0.1:55432/kai"

docker rm -f "$NAME" >/dev/null 2>&1 || true
docker run -d --name "$NAME" -e POSTGRES_PASSWORD=itest -e POSTGRES_DB=kai -p 55432:5432 postgres:16-alpine >/dev/null
until docker exec "$NAME" pg_isready -U postgres -h 127.0.0.1 >/dev/null 2>&1; do sleep 1; done

# `db push` is fine HERE (an empty throwaway DB) — never against Neon.
# env -i drops any DATABASE_URL from your shell / .env so it can't hit Neon.
env -i PATH="$PATH" HOME="$HOME" DATABASE_URL="$URL" npx prisma db push --skip-generate --accept-data-loss >/dev/null
# Production triggers first (the migration's triggers call these functions),
# then the migration TWICE: the second run proves it is safe to re-apply.
psql_file() { docker exec -i "$NAME" psql -U postgres -d kai -q -v ON_ERROR_STOP=1 < "$1" 2>&1 | { grep -v NOTICE || true; }; }
psql_file scripts/integration/base.sql
psql_file prisma/sql/2026-10-01_verification_evidence_anchoring.sql
psql_file prisma/sql/2026-10-01_verification_evidence_anchoring.sql
psql_file prisma/sql/2026-10-02_phase2_identity_vaults_roles.sql
psql_file prisma/sql/2026-10-02_phase2_identity_vaults_roles.sql

status=0
env -i PATH="$PATH" HOME="$HOME" DATABASE_URL="$URL" node scripts/integration/run.mjs 2>&1 | grep -v '^prisma:' || status=$?
[ -z "${KEEP_DB:-}" ] && docker rm -f "$NAME" >/dev/null
exit $status
