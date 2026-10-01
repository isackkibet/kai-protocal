# Hedera Guardian — preparation (Phase 2, on paper first)

Status: design only. Guardian is **not** connected yet. The app already
verifies records with people (CFA verifiers, `/mrv`) and anchors proofs on
Avalanche; Guardian would add a second, standards-based verification trail.

## Running Guardian locally

Guardian's quickstart (`docker-compose-quickstart.yml`) starts MongoDB, NATS,
IPFS, Valkey and many Node services. It needs **8 GB+ RAM for Docker alone**.
The current dev laptop has 7 GB total and runs out of memory with the Next.js
dev server, so run Guardian on a machine with 16 GB, or a cloud VM
(e.g. 4 vCPU / 16 GB), not next to the app.

Steps (check against the current Guardian README first; they change between
releases):

```bash
git clone https://github.com/hashgraph/guardian.git && cd guardian
cat > .env <<'ENV'
OPERATOR_ID=0.0.YOUR_TESTNET_ACCOUNT
OPERATOR_KEY=YOUR_DER_ENCODED_ED25519_KEY   # throwaway testnet key only
HEDERA_NET=testnet
ENV
echo .env >> .gitignore
docker compose -f docker-compose-quickstart.yml up --pull=always -d
docker compose -f docker-compose-quickstart.yml ps   # then http://localhost:3000
```

Never paste the operator key into chat, GitHub or screenshots. If Guardian
uses port 3000, run the KAI app on another port (`next dev -p 3001`).

## Roles

| Guardian role | Who | Does |
|---|---|---|
| Standard Registry | Kaibar Nuvari (one account) | Publishes the policy and schemas |
| Project Proponent | Each CFA (Oloolua first) | Submits planting and survival records |
| Verifier (VVB) | CFA verifier / admin (never the submitter) | Approves or rejects each record |

## First policy: "Seedling planting verified by a CFA admin"

1. Proponent submits a **PlantingRecord** (schema below) — one per planted batch.
2. Verifier reviews it with its evidence hashes and approves or rejects with a reason.
3. On approval Guardian issues a verifiable credential (the record VC) on Hedera.
4. Kanuvari stores the returned ids in `conservation_records.guardianPolicyId`
   and `guardianDocumentId` (columns already exist) and shows them on `/verify/<id>`.

Survival checks follow the same flow with **SurvivalCheck**. No tokens, carbon
units or MRV calculations in this first policy.

## Field mapping

| Kanuvari (planting/v1, `lib/mrv/records.ts`) | Guardian field | Notes |
|---|---|---|
| `cfa.id`, `cfa.name`, `cfa.region` | `cfaId`, `cfaName`, `region` | |
| `species.id`, `species.name` | `speciesId`, `speciesName` | scientific name in brackets |
| `quantity` | `seedlingsPlanted` | integer > 0 |
| `plantedAt` | `plantingDate` | ISO 8601 |
| `activity` (e.g. "Planted at Site A") | `siteDescription` | |
| `submittedBy.memberId` / `.name` | `submittedById`, `submittedByName` | |
| record `id`, `dataHash` | `kanuvariRecordId`, `kanuvariSha256` | ties the VC to our hash chain |
| evidence `sha256` list | `evidenceHashes` | files stay in Kanuvari; only hashes go to Guardian/IPFS |
| anchor `txHash` | `avalancheAnchorTx` | optional, when anchored first |

Schemas to import: [`planting-record.schema.json`](planting-record.schema.json),
[`survival-check.schema.json`](survival-check.schema.json).

## Integration later (not built)

`GUARDIAN_API_URL`, `GUARDIAN_USERNAME`, `GUARDIAN_PASSWORD`, `GUARDIAN_POLICY_ID`
are already in `.env.example`. A server job would: log in → submit each newly
`VERIFIED` record to the policy → save the document id → poll for the VC.
Keep it idempotent per record id, like the Avalanche anchoring.
