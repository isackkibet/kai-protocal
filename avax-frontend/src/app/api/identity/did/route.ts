import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/db';
import { resolveDid } from '@/lib/identity/credentials';

/** GET /api/identity/did?did=… — resolve a KAI DID (did:web CFA or did:pkh wallet). Public. */
export async function GET(req: Request) {
  const did = new URL(req.url).searchParams.get('did')?.trim() ?? '';
  if (!/^did:[a-z0-9]+:/.test(did) || did.length > 200) return NextResponse.json({ error: 'Give a did, e.g. did:pkh:eip155:43113:0x…' }, { status: 400 });
  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ error: 'database unavailable' }, { status: 503 });
  try {
    const document = await resolveDid(prisma, did);
    if (!document) return NextResponse.json({ error: 'Unknown DID (only did:web KAI CFAs and did:pkh on Fuji are resolved here).' }, { status: 404 });
    return NextResponse.json({ did, document });
  } catch (e) {
    console.error('[identity/did] failed', e);
    return NextResponse.json({ error: 'Could not resolve.' }, { status: 500 });
  }
}
