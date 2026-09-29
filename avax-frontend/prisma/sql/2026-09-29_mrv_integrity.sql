-- MRV integrity layer (Canuvari MRV PRD §4–§6): conservation_records + record_versions.
--
-- Apply with:  npx prisma db execute --file prisma/sql/2026-09-29_mrv_integrity.sql --schema prisma/schema.prisma
-- Do NOT use `prisma db push` on this database: it would drop the Oloolua hub's
-- kai_activities / kai_transactions tables, which live here but aren't in this schema.

-- CreateEnum
CREATE TYPE "RecordVerificationStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RecordAnchorStatus" AS ENUM ('NOT_ANCHORED', 'ANCHOR_PENDING', 'ANCHORED', 'ANCHOR_FAILED');

-- CreateTable
CREATE TABLE "conservation_records" (
    "id" TEXT NOT NULL,
    "forestId" TEXT NOT NULL,
    "recordType" TEXT NOT NULL,
    "schemaVersion" TEXT NOT NULL,
    "methodology" TEXT,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "dataHash" TEXT NOT NULL,
    "verificationStatus" "RecordVerificationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "anchorStatus" "RecordAnchorStatus" NOT NULL DEFAULT 'NOT_ANCHORED',
    "guardianPolicyId" TEXT,
    "guardianDocumentId" TEXT,
    "avalancheTxHash" TEXT,
    "anchoredAt" TIMESTAMP(3),
    "sourceTable" TEXT,
    "sourceId" TEXT,
    "submittedByMemberId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conservation_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "record_versions" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "dataHash" TEXT NOT NULL,
    "previousHash" TEXT,
    "reason" TEXT,
    "createdByMemberId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "record_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conservation_records_forestId_idx" ON "conservation_records"("forestId");

-- CreateIndex
CREATE INDEX "conservation_records_recordType_idx" ON "conservation_records"("recordType");

-- CreateIndex
CREATE INDEX "conservation_records_verificationStatus_idx" ON "conservation_records"("verificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "conservation_records_sourceTable_sourceId_key" ON "conservation_records"("sourceTable", "sourceId");

-- CreateIndex
CREATE INDEX "record_versions_dataHash_idx" ON "record_versions"("dataHash");

-- CreateIndex
CREATE UNIQUE INDEX "record_versions_recordId_version_key" ON "record_versions"("recordId", "version");

-- AddForeignKey
ALTER TABLE "conservation_records" ADD CONSTRAINT "conservation_records_forestId_fkey" FOREIGN KEY ("forestId") REFERENCES "community_forests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "record_versions" ADD CONSTRAINT "record_versions_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "conservation_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- record_versions is append-only: history can be added to, never rewritten.
CREATE OR REPLACE FUNCTION record_versions_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'record_versions is append-only: % is not allowed (create a new version instead)', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS record_versions_no_update_delete ON "record_versions";
CREATE TRIGGER record_versions_no_update_delete
  BEFORE UPDATE OR DELETE ON "record_versions"
  FOR EACH ROW EXECUTE FUNCTION record_versions_append_only();
