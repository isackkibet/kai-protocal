import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/db';
import { requireRateLimit } from '@/lib/security/route-guard';
import { checkHubImage, hubItems, hubManager, isHubId, isHubKind, MAX_HUB_IMAGE_BYTES, PUBLIC_READ_HEADERS, readHubItemForm } from '@/lib/hubs/hub-content';

/**
 * /api/hubs/:hub/items
 * GET ?kind=news|story|activity|photo|video|podcast — published items (public;
 *   the hub's own websites read this too). ?all=1 adds hidden items for hub managers.
 * POST (multipart, hub managers): kind, title, summary?, body? (article text), published? (0 = hidden draft),
 *   url? (https), happenedOn? (YYYY-MM-DD), image? (JPEG/PNG/WebP, 3 MB; required for photos)
 */
export async function GET(req: Request, { params }: { params: Promise<{ hub: string }> }) {
  const { hub } = await params;
  const prisma = await getPrisma();
  if (!prisma || !isHubId(hub)) return NextResponse.json({ items: [] }, { headers: PUBLIC_READ_HEADERS });
  const q = new URL(req.url).searchParams;
  const kind = q.get('kind') ?? '';
  const take = Math.min(Math.max(Number(q.get('limit')) || 60, 1), 200);
  if (q.get('all') === '1') {
    if (!(await hubManager(prisma, req, hub))) return NextResponse.json({ error: 'Only hub managers can see hidden items.' }, { status: 403 });
    return NextResponse.json({ items: await hubItems(prisma, hub, { all: true, take: 200 }) }, { headers: { 'Cache-Control': 'no-store' } });
  }
  return NextResponse.json({ items: await hubItems(prisma, hub, { take, ...(isHubKind(kind) ? { kind } : {}) }) }, { headers: PUBLIC_READ_HEADERS });
}

export async function POST(req: Request, { params }: { params: Promise<{ hub: string }> }) {
  const limited = await requireRateLimit(req, [{ scope: 'ip', limit: 30, windowMs: 60_000 }]);
  if (!limited.ok) return limited.response;
  const { hub } = await params;
  if (Number(req.headers.get('content-length') ?? 0) > MAX_HUB_IMAGE_BYTES + 320 * 1024) return NextResponse.json({ error: 'The picture is larger than 3 MB.' }, { status: 413 });
  const prisma = await getPrisma();
  if (!prisma || !isHubId(hub)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const manager = await hubManager(prisma, req, hub);
  if (!manager) return NextResponse.json({ error: 'Only hub managers can add to this hub.' }, { status: 403 });

  let form: FormData;
  try { form = await req.formData(); } catch { return NextResponse.json({ error: 'Send it as multipart/form-data.' }, { status: 400 }); }
  const read = readHubItemForm(form);
  if (!read.ok) return NextResponse.json({ error: read.error, field: read.field }, { status: 400 });

  const file = form.get('image');
  let image: { bytes: Uint8Array<ArrayBuffer>; mime: string; sha256: string } | null = null;
  if (file instanceof File && file.size > 0) {
    const checked = checkHubImage(new Uint8Array(await file.arrayBuffer()));
    if (!checked.ok) return NextResponse.json({ error: checked.error, field: 'image' }, { status: 400 });
    image = checked;
  }
  if (read.data.kind === 'photo' && !image) return NextResponse.json({ error: 'Choose the photo to upload.', field: 'image' }, { status: 400 });

  const item = await prisma.hubItem.create({
    data: {
      hub, ...read.data, published: form.get('published') !== '0',
      image: image?.bytes, imageMime: image?.mime, imageSha256: image?.sha256,
      authorName: manager.name, authorEmail: manager.email,
    },
    select: { id: true },
  });
  return NextResponse.json({ ok: true, id: item.id }, { status: 201 });
}
