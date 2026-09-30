# Hedera Guardian: local architecture (Canuvari MRV)

Guardian is the **verification layer** of the four-layer MRV architecture
(Canuvari MRV PRD §3, §5). It runs in its own Docker environment, separate
from this app, and owns its own database. This app stores only the reference
IDs Guardian returns; it never copies Guardian's internal data into Neon.

## Where it lives

| Item | Value |
|---|---|
| Folder | `~/Desktop/coding/hedera-guardian` (outside this repo) |
| Version | Guardian **3.7.0**, quickstart images (`docker-compose-quickstart.yml`) |
| Checkout | sparse: only the config folders the quickstart mounts (~3 MB) |
| Credentials | `hedera-guardian/.env`: `OPERATOR_ID`, `OPERATOR_KEY` (ED25519, DER `302e…`), `GUARDIAN_VERSION=3.7.0` |
| UI / API | http://localhost:3000 (API under `/api/v1`) |

```bash
cd ~/Desktop/coding/hedera-guardian
docker compose -f docker-compose-quickstart.yml up -d     # start
docker compose -f docker-compose-quickstart.yml ps        # health
docker compose -f docker-compose-quickstart.yml stop      # stop, keep data
```

Guardian also serves on port 3000, so run this app on another port while both
are up: `npm run dev -- -p 3001`. Guardian wants 8 GB+ RAM; on smaller
machines host it on a cloud VM (images are published for amd64 and arm64).

## How records flow

1. `POST /api/cfa/planting` plants a nursery batch (`seedling_inventory`,
   status `planted`; a partial planting splits the batch) **and** creates a
   `conservation_records` row: canonical JSON (RFC 8785) → SHA-256 →
   `record_versions` v1, sourced from that batch. Status starts `SUBMITTED` /
   `NOT_ANCHORED`. Nursery tables and their audit log are described in
   `prisma/sql/2026-09-30_oloolua_nursery.sql`.
2. Corrections (`POST /api/mrv/records/:id/versions`) add version n+1 with
   `previousHash` = version n's hash. A database trigger rejects any UPDATE or
   DELETE on `record_versions`.
3. `GET /api/mrv/records/:id` and the public page `/verify/:id` recompute every
   hash and walk the chain.
4. **Not built yet (Phase 5):** submit the record to a published Guardian
   policy, move `verificationStatus` from Guardian's result, store
   `guardianPolicyId` / `guardianDocumentId`.
5. **Not built yet (Phase 8):** anchor `{record_id, data_hash, methodology,
   version}` on Avalanche Fuji and store `avalancheTxHash`.

Until steps 4–5 exist, no record is ever shown as verified or anchored.
Statuses are written only by backend code in `src/lib/mrv/records.ts`; no API
accepts a status from the client (PRD §6.1).

## Schema changes

Applied with `prisma/sql/2026-09-29_mrv_integrity.sql` via `prisma db execute`.
**Never run `prisma db push` on this database**: it would drop the Oloolua
hub's `kai_activities` / `kai_transactions` tables, which share it.
