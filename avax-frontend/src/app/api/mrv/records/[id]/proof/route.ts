import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/db';
import { verifyRecordAnchor } from '@/lib/mrv/anchor';

/**
 * GET /api/mrv/records/:id/proof — public end-to-end check that a record is
 * anchored (Kanuvari Tools & Agents PRD §4.11 verify_onchain_anchor):
 * stored data → SHA-256 → Merkle proof → batch root → Fuji transaction.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ error: 'database unavailable' }, { status: 503 });
  try {
    const check = await verifyRecordAnchor(prisma, id);
    if (!check) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    return NextResponse.json(check);
  } catch (e) {
    console.error('[mrv/records/:id/proof] failed', e);
    return NextResponse.json({ error: 'Could not check the anchor.' }, { status: 500 });
  }
}
