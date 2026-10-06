import { getPrisma } from '@/lib/db/db';

/** GET /api/murals/:slug/image — the mural picture (drafts are not served). */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const prisma = await getPrisma();
  if (!prisma) return new Response('Not found', { status: 404 });
  const m = await prisma.mural.findUnique({ where: { slug }, select: { image: true, imageMime: true, imageSha256: true, status: true } });
  if (!m?.image || !m.imageMime || m.status === 'draft') return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(m.image), {
    headers: {
      'Content-Type': m.imageMime,
      'Content-Length': String(m.image.length),
      'X-Content-SHA256': m.imageSha256 ?? '',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "sandbox; default-src 'none'",
      'Cache-Control': 'public, max-age=3600',
      // The Oloolua website shows these pictures.
      'Access-Control-Allow-Origin': '*', 'Cross-Origin-Resource-Policy': 'cross-origin',
    },
  });
}
