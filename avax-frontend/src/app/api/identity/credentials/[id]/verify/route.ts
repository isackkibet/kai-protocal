import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/db';
import { verifyCredential } from '@/lib/identity/credentials';

/** GET /api/identity/credentials/:id/verify — public, every check with its result (PRD §4.17 verify_claim). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ error: 'database unavailable' }, { status: 503 });
  try {
    const result = await verifyCredential(prisma, id);
    if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(result);
  } catch (e) {
    console.error('[identity/credentials/:id/verify] failed', e);
    return NextResponse.json({ error: 'Could not verify.' }, { status: 500 });
  }
}
