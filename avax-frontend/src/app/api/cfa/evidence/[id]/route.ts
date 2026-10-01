import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/db';
import { getNurseryCfa, getSessionMember } from '@/lib/nursery/db';

/**
 * GET /api/cfa/evidence/:id — the evidence file itself, for signed-in CFA
 * members (photos can show people and places). The SHA-256 the file was
 * stored with is sent as X-Content-SHA256 so anyone can re-check it.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ error: 'database unavailable' }, { status: 503 });
  try {
    const cfa = await getNurseryCfa(prisma);
    const session = await getSessionMember(prisma, req);
    if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });
    if (!cfa || session.member.cfaId !== cfa.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const evidence = await prisma.evidence.findFirst({ where: { id, cfaId: cfa.id }, include: { file: true } });
    if (!evidence?.file) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const safeName = evidence.fileName.replace(/[^\w.\- ]+/g, '_');
    return new Response(new Uint8Array(evidence.file.content), {
      headers: {
        'Content-Type': evidence.mimeType,
        'Content-Length': String(evidence.sizeBytes),
        // Photos open in the browser; PDFs download (a PDF viewer is a bigger surface).
        'Content-Disposition': `${evidence.mimeType === 'application/pdf' ? 'attachment' : 'inline'}; filename="${safeName}"`,
        'X-Content-SHA256': evidence.sha256,
        'X-Content-Type-Options': 'nosniff',
        // A stored PDF or image must never run script in the app's origin.
        'Content-Security-Policy': "sandbox; default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (e) {
    console.error('[cfa/evidence/:id] failed', e);
    return NextResponse.json({ error: 'Could not load the file.' }, { status: 500 });
  }
}
