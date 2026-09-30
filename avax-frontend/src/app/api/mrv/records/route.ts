import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { getNurseryCfa } from '@/lib/nursery/db';

/**
 * GET /api/mrv/records — conservation records for the CFA, newest first.
 *
 * Read-only and public: the point of an MRV record is that anyone can check
 * it. Each row carries its current fingerprint and both lifecycle states.
 * Records are created by the operational routes (e.g. POST /api/cfa/planting),
 * never directly from here.
 */
export async function GET() {
  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ records: [], db: false });

  try {
    const forest = await getNurseryCfa(prisma);
    if (!forest) return NextResponse.json({ records: [], db: false });

    const records = await prisma.conservationRecord.findMany({
      where: { forestId: forest.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        recordType: true,
        schemaVersion: true,
        methodology: true,
        currentVersion: true,
        dataHash: true,
        verificationStatus: true,
        anchorStatus: true,
        avalancheTxHash: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ records });
  } catch (e) {
    console.error('[mrv/records] database unavailable', e);
    return NextResponse.json({ records: [], db: false });
  }
}
