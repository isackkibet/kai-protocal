import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/db';
import { cfaDidDocument } from '@/lib/identity/credentials';

/**
 * GET /cfa/:cfaId/did.json — the CFA's DID document, where did:web
 * resolution looks for did:web:<host>:cfa:<cfaId> (W3C did:web method).
 * Public: it lists the wallets allowed to sign credentials for the CFA.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ cfaId: string }> }) {
  const { cfaId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(cfaId)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ error: 'database unavailable' }, { status: 503 });
  try {
    const cfa = await prisma.cfa.findUnique({ where: { id: cfaId } });
    if (!cfa) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const { document } = await cfaDidDocument(prisma, cfa);
    return NextResponse.json(document, { headers: { 'Content-Type': 'application/did+json', 'Cache-Control': 'public, max-age=60' } });
  } catch (e) {
    console.error('[cfa/did.json] failed', e);
    return NextResponse.json({ error: 'Could not build the DID document.' }, { status: 500 });
  }
}
