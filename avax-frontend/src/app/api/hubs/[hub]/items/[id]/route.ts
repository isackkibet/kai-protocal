import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/db';
import { hubManager, isHubId } from '@/lib/hubs/hub-content';

/** DELETE /api/hubs/:hub/items/:id — a hub manager takes an item off the hub (kept, unpublished). */
export async function DELETE(req: Request, { params }: { params: Promise<{ hub: string; id: string }> }) {
  const { hub, id } = await params;
  const prisma = await getPrisma();
  if (!prisma || !isHubId(hub) || !/^[0-9a-f-]{36}$/.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!(await hubManager(prisma, req, hub))) return NextResponse.json({ error: 'Only hub managers can remove items.' }, { status: 403 });
  const r = await prisma.hubItem.updateMany({ where: { id, hub }, data: { published: false } });
  if (r.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
