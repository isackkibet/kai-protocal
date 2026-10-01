import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/db';
import { requireRateLimit } from '@/lib/security/route-guard';
import { explainDbError, getNurseryCfa, getSessionMember } from '@/lib/nursery/db';
import { listEvidence, saveEvidence } from '@/lib/nursery/evidence';
import { EVIDENCE_ENTITIES, MAX_EVIDENCE_BYTES, type EvidenceEntity } from '@/lib/nursery/evidence-rules';
import { FieldError } from '@/lib/nursery/validate';

/**
 * /api/cfa/evidence — photos and documents for nursery records
 * (Kanuvari Tools & Agents PRD §4.8).
 *
 * GET ?entityType=…&entityId=… lists what is attached (name, size, SHA-256,
 * caption) — public, like the records they support. The file itself is at
 * /api/cfa/evidence/:id and needs a CFA member's sign-in.
 *
 * POST multipart/form-data { file, entityType, entityId, caption? } — CFA
 * members. The server checks the real file type from its bytes, computes the
 * SHA-256 itself and stores who uploaded it (audited).
 */
function entityFrom(value: unknown): EvidenceEntity | null {
  return (EVIDENCE_ENTITIES as readonly string[]).includes(String(value)) ? (value as EvidenceEntity) : null;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const entityType = entityFrom(url.searchParams.get('entityType'));
  const entityId = (url.searchParams.get('entityId') ?? '').slice(0, 64);
  if (!entityType || !entityId) return NextResponse.json({ error: 'entityType and entityId are required' }, { status: 400 });

  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ evidence: [], db: false });
  try {
    const cfa = await getNurseryCfa(prisma);
    if (!cfa) return NextResponse.json({ evidence: [], db: false });
    // Who uploaded is not shown publicly.
    const evidence = (await listEvidence(prisma, cfa.id, entityType, entityId)).map((e) => ({
      id: e.id, fileName: e.fileName, mimeType: e.mimeType, sizeBytes: e.sizeBytes, sha256: e.sha256, caption: e.caption, createdAt: e.createdAt, url: e.url,
    }));
    return NextResponse.json({ evidence });
  } catch (e) {
    console.error('[cfa/evidence] list failed', e);
    return NextResponse.json({ evidence: [], db: false });
  }
}

export async function POST(req: Request) {
  const limited = await requireRateLimit(req, [{ scope: 'ip', limit: 20, windowMs: 60_000 }]);
  if (!limited.ok) return limited.response;

  // Refuse oversized bodies before reading them (file + small form fields).
  const declared = Number(req.headers.get('content-length') ?? 0);
  if (declared > MAX_EVIDENCE_BYTES + 64 * 1024) return NextResponse.json({ error: 'The file is larger than 3 MB.' }, { status: 413 });

  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ error: 'database unavailable' }, { status: 503 });

  try {
    const cfa = await getNurseryCfa(prisma);
    if (!cfa) return NextResponse.json({ error: 'Nursery database is not set up yet.' }, { status: 503 });
    const session = await getSessionMember(prisma, req);
    if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });
    if (session.member.cfaId !== cfa.id) return NextResponse.json({ error: 'You are not a member of this CFA.' }, { status: 403 });

    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return NextResponse.json({ error: 'Send the file as multipart/form-data.' }, { status: 400 });
    }
    const file = form.get('file');
    const entityType = entityFrom(form.get('entityType'));
    const entityId = String(form.get('entityId') ?? '').trim().slice(0, 64);
    const caption = String(form.get('caption') ?? '').trim().slice(0, 500) || null;
    const dhash = String(form.get('dhash') ?? '').trim().toLowerCase() || null;
    if (!(file instanceof File)) return NextResponse.json({ error: 'Choose a file to upload.', field: 'file' }, { status: 400 });
    if (!entityType || !entityId) return NextResponse.json({ error: 'entityType and entityId are required.' }, { status: 400 });
    if (file.size > MAX_EVIDENCE_BYTES) return NextResponse.json({ error: 'The file is larger than 3 MB.', field: 'file' }, { status: 413 });

    const evidence = await saveEvidence(prisma, cfa, session.member, {
      entityType, entityId, caption,
      bytes: new Uint8Array(await file.arrayBuffer()),
      declaredType: file.type,
      fileName: file.name,
      dhash,
    });
    const dup = (evidence.metadata as { duplicateOf?: { entityType: string } } | null)?.duplicateOf;
    return NextResponse.json({
      ok: true,
      evidence: { id: evidence.id, fileName: evidence.fileName, sha256: evidence.sha256, sizeBytes: evidence.sizeBytes, url: `/api/cfa/evidence/${evidence.id}` },
      warning: dup ? 'This photo looks very similar to one already attached to another record. It was saved, and a verifier will see the warning.' : null,
    });
  } catch (e) {
    if (e instanceof FieldError) return NextResponse.json({ error: e.message, field: e.field }, { status: 400 });
    if ((e as { code?: string })?.code === 'P2002') return NextResponse.json({ error: 'This exact file is already attached here.' }, { status: 409 });
    const known = explainDbError(e);
    if (known) return NextResponse.json({ error: known.error }, { status: known.status });
    console.error('[cfa/evidence] upload failed', e);
    return NextResponse.json({ error: 'Could not save the file. Please try again.' }, { status: 500 });
  }
}
