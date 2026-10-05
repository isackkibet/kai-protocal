import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/db';
import { requireRateLimit } from '@/lib/security/route-guard';
import { checkHubImage, hubItem, hubManager, isHubId, MAX_HUB_IMAGE_BYTES, PUBLIC_READ_HEADERS, readHubItemForm } from '@/lib/hubs/hub-content';

type Ctx = { params: Promise<{ hub: string; id: string }> };
const UUID = /^[0-9a-f-]{36}$/;

/**
 * GET    /api/hubs/:hub/items/:id — one published item with its full text (public).
 *        ?all=1 lets hub managers open hidden items too.
 * PATCH  (multipart, hub managers) — edit: the same fields as creating, plus
 *        image (replace), removeImage=1, published=0|1 (hide or show).
 * DELETE (hub managers) — hide the item; ?forever=1 deletes it for good.
 */
export async function GET(req: Request, { params }: Ctx) {
  const { hub, id } = await params;
  const prisma = await getPrisma();
  if (!prisma || !isHubId(hub) || !UUID.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: PUBLIC_READ_HEADERS });
  const all = new URL(req.url).searchParams.get('all') === '1' && !!(await hubManager(prisma, req, hub));
  const item = await hubItem(prisma, hub, id, { all });
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: PUBLIC_READ_HEADERS });
  return NextResponse.json({ item }, { headers: all ? { 'Cache-Control': 'no-store' } : PUBLIC_READ_HEADERS });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const limited = await requireRateLimit(req, [{ scope: 'ip', limit: 30, windowMs: 60_000 }]);
  if (!limited.ok) return limited.response;
  const { hub, id } = await params;
  if (Number(req.headers.get('content-length') ?? 0) > MAX_HUB_IMAGE_BYTES + 320 * 1024) return NextResponse.json({ error: 'The picture is larger than 3 MB.' }, { status: 413 });
  const prisma = await getPrisma();
  if (!prisma || !isHubId(hub) || !UUID.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!(await hubManager(prisma, req, hub))) return NextResponse.json({ error: 'Only hub managers can edit items.' }, { status: 403 });
  const existing = await prisma.hubItem.findFirst({ where: { id, hub }, select: { kind: true, imageSha256: true } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let form: FormData;
  try { form = await req.formData(); } catch { return NextResponse.json({ error: 'Send it as multipart/form-data.' }, { status: 400 }); }

  // Only showing or hiding: no other fields sent.
  const published = form.get('published');
  if (published !== null && form.get('title') === null) {
    await prisma.hubItem.update({ where: { id }, data: { published: published === '1', updatedAt: new Date() } });
    return NextResponse.json({ ok: true });
  }

  const read = readHubItemForm(form);
  if (!read.ok) return NextResponse.json({ error: read.error, field: read.field }, { status: 400 });

  const file = form.get('image');
  let image: { image: Uint8Array<ArrayBuffer> | null; imageMime: string | null; imageSha256: string | null } | undefined;
  if (file instanceof File && file.size > 0) {
    const checked = checkHubImage(new Uint8Array(await file.arrayBuffer()));
    if (!checked.ok) return NextResponse.json({ error: checked.error, field: 'image' }, { status: 400 });
    image = { image: checked.bytes, imageMime: checked.mime, imageSha256: checked.sha256 };
  } else if (form.get('removeImage') === '1') {
    image = { image: null, imageMime: null, imageSha256: null };
  }
  const hasImageAfter = image ? !!image.imageSha256 : !!existing.imageSha256;
  if (read.data.kind === 'photo' && !hasImageAfter) return NextResponse.json({ error: 'A photo item needs its photo.', field: 'image' }, { status: 400 });

  await prisma.hubItem.update({
    where: { id },
    data: { ...read.data, ...(image ?? {}), ...(published !== null ? { published: published === '1' } : {}), updatedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { hub, id } = await params;
  const prisma = await getPrisma();
  if (!prisma || !isHubId(hub) || !UUID.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!(await hubManager(prisma, req, hub))) return NextResponse.json({ error: 'Only hub managers can remove items.' }, { status: 403 });
  if (new URL(req.url).searchParams.get('forever') === '1') {
    const r = await prisma.hubItem.deleteMany({ where: { id, hub } });
    return r.count ? NextResponse.json({ ok: true, deleted: true }) : NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const r = await prisma.hubItem.updateMany({ where: { id, hub }, data: { published: false, updatedAt: new Date() } });
  if (r.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
