import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/db';
import { requireRateLimit } from '@/lib/security/route-guard';
import { checkHubImage, hubItems, hubManager, isHubId, isHubKind, MAX_HUB_IMAGE_BYTES } from '@/lib/hubs/hub-content';

/**
 * /api/hubs/:hub/items
 * GET ?kind=news|activity|photo|video|podcast — published items (public)
 * POST (multipart, hub managers): kind, title, summary?, url? (https),
 *   happenedOn? (YYYY-MM-DD), image? (JPEG/PNG/WebP, 3 MB; required for photos)
 */
export async function GET(req: Request, { params }: { params: Promise<{ hub: string }> }) {
  const { hub } = await params;
  const prisma = await getPrisma();
  if (!prisma || !isHubId(hub)) return NextResponse.json({ items: [] });
  const kind = new URL(req.url).searchParams.get('kind') ?? '';
  return NextResponse.json({ items: await hubItems(prisma, hub, isHubKind(kind) ? { kind } : {}) });
}

export async function POST(req: Request, { params }: { params: Promise<{ hub: string }> }) {
  const limited = await requireRateLimit(req, [{ scope: 'ip', limit: 30, windowMs: 60_000 }]);
  if (!limited.ok) return limited.response;
  const { hub } = await params;
  if (Number(req.headers.get('content-length') ?? 0) > MAX_HUB_IMAGE_BYTES + 64 * 1024) return NextResponse.json({ error: 'The picture is larger than 3 MB.' }, { status: 413 });
  const prisma = await getPrisma();
  if (!prisma || !isHubId(hub)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const manager = await hubManager(prisma, req, hub);
  if (!manager) return NextResponse.json({ error: 'Only hub managers can add to this hub.' }, { status: 403 });

  let form: FormData;
  try { form = await req.formData(); } catch { return NextResponse.json({ error: 'Send it as multipart/form-data.' }, { status: 400 }); }
  const str = (k: string, max: number) => String(form.get(k) ?? '').trim().slice(0, max);
  const kind = str('kind', 20);
  const title = str('title', 160);
  const summary = str('summary', 2000) || null;
  const url = str('url', 500) || null;
  const day = str('happenedOn', 10);
  if (!isHubKind(kind)) return NextResponse.json({ error: 'Choose what you are adding.', field: 'kind' }, { status: 400 });
  if (title.length < 3) return NextResponse.json({ error: 'Add a title of at least 3 letters.', field: 'title' }, { status: 400 });
  if (url && !/^https:\/\/[^\s]+$/.test(url)) return NextResponse.json({ error: 'Links must start with https://', field: 'url' }, { status: 400 });
  if ((kind === 'video' || kind === 'podcast') && !url) return NextResponse.json({ error: 'Add the link to the video or podcast.', field: 'url' }, { status: 400 });
  const happenedOn = /^\d{4}-\d{2}-\d{2}$/.test(day) && !Number.isNaN(Date.parse(day)) ? new Date(`${day}T00:00:00Z`) : null;

  const file = form.get('image');
  let image: { bytes: Uint8Array<ArrayBuffer>; mime: string; sha256: string } | null = null;
  if (file instanceof File && file.size > 0) {
    const checked = checkHubImage(new Uint8Array(await file.arrayBuffer()));
    if (!checked.ok) return NextResponse.json({ error: checked.error, field: 'image' }, { status: 400 });
    image = checked;
  }
  if (kind === 'photo' && !image) return NextResponse.json({ error: 'Choose the photo to upload.', field: 'image' }, { status: 400 });

  const item = await prisma.hubItem.create({
    data: {
      hub, kind, title, summary, url, happenedOn,
      image: image?.bytes, imageMime: image?.mime, imageSha256: image?.sha256,
      authorName: manager.name, authorEmail: manager.email,
    },
    select: { id: true },
  });
  return NextResponse.json({ ok: true, id: item.id }, { status: 201 });
}
