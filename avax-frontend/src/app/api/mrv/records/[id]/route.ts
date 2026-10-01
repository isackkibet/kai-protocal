import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/db';
import { checkRecordIntegrity } from '@/lib/mrv/records';

/**
 * GET /api/mrv/records/:id — one conservation record with its full version
 * history and a fresh integrity check: every version's SHA-256 is recomputed
 * from the stored JSON and the previousHash chain is walked (PRD §4.1).
 * Also: every verification decision (reviewer shown by name only), the
 * evidence attached to the record or its source row (names and SHA-256, not
 * the files), and the anchor batch it is in.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ error: 'database unavailable' }, { status: 503 });

  try {
    const record = await prisma.conservationRecord.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { version: 'asc' },
          select: { version: true, data: true, dataHash: true, previousHash: true, reason: true, createdAt: true },
        },
      },
    });
    if (!record) return NextResponse.json({ error: 'Record not found' }, { status: 404 });

    const [integrity, reviews, evidence, anchor] = await Promise.all([
      checkRecordIntegrity(prisma, id),
      prisma.verificationReview.findMany({ where: { recordId: id }, orderBy: { createdAt: 'asc' } }),
      prisma.evidence.findMany({
        where: {
          cfaId: record.forestId,
          OR: [
            { entityType: 'conservation_records', entityId: id },
            ...(record.sourceTable && record.sourceId ? [{ entityType: record.sourceTable, entityId: record.sourceId }] : []),
          ],
        },
        orderBy: { createdAt: 'asc' },
        select: { id: true, fileName: true, mimeType: true, sizeBytes: true, sha256: true, caption: true, createdAt: true },
      }),
      prisma.anchorBatchRecord.findFirst({
        where: { recordId: id, batch: { status: { in: ['PENDING', 'ANCHORED'] } } },
        orderBy: { batch: { createdAt: 'desc' } },
        select: { leafIndex: true, batch: { select: { id: true, merkleRoot: true, status: true, txHash: true, anchoredAt: true, recordCount: true } } },
      }),
    ]);
    const reviewerNames = new Map(
      (await prisma.cfaMember.findMany({ where: { id: { in: [...new Set(reviews.map((r) => r.reviewerId))] } }, select: { id: true, name: true } }))
        .map((m) => [m.id, m.name]),
    );
    return NextResponse.json({
      record,
      integrity,
      reviews: reviews.map((r) => ({
        decision: r.decision, reason: r.reason, recordVersion: r.recordVersion, dataHash: r.dataHash,
        reviewer: reviewerNames.get(r.reviewerId) ?? 'CFA verifier', createdAt: r.createdAt,
      })),
      evidence: evidence.map((e) => ({ ...e, url: `/api/cfa/evidence/${e.id}` })),
      anchor,
    });
  } catch (e) {
    console.error('[mrv/records/:id] failed', e);
    return NextResponse.json({ error: 'Failed to load record' }, { status: 500 });
  }
}
