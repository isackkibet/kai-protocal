import { getPrisma } from '@/lib/db/db';
import { isHubId } from '@/lib/hubs/hub-content';

/** GET /api/hubs/:hub/items/:id/image — the item's picture (published items only). */
export async function GET(_req: Request, { params }: { params: Promise<{ hub: string; id: string }> }) {
  const { hub, id } = await params;
  const prisma = await getPrisma();
  if (!prisma || !isHubId(hub) || !/^[0-9a-f-]{36}$/.test(id)) return new Response('Not found', { status: 404 });
  const item = await prisma.hubItem.findFirst({ where: { id, hub, published: true }, select: { image: true, imageMime: true, imageSha256: true } });
  if (!item?.image || !item.imageMime) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(item.image), {
    headers: {
      'Content-Type': item.imageMime, 'Content-Length': String(item.image.length), 'X-Content-SHA256': item.imageSha256 ?? '',
      'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "sandbox; default-src 'none'", 'Cache-Control': 'public, max-age=3600',
    },
  });
}
