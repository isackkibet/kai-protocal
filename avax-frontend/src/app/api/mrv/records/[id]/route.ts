import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { checkRecordIntegrity } from '@/lib/mrv/records';

/**
 * GET /api/mrv/records/:id — one conservation record with its full version
 * history and a fresh integrity check: every version's SHA-256 is recomputed
 * from the stored JSON and the previousHash chain is walked (PRD §4.1).
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

    const integrity = await checkRecordIntegrity(prisma, id);
    return NextResponse.json({ record, integrity });
  } catch (e) {
    console.error('[mrv/records/:id] failed', e);
    return NextResponse.json({ error: 'Failed to load record' }, { status: 500 });
  }
}
