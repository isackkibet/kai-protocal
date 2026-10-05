import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/db';
import { hubManager, isHubId } from '@/lib/hubs/hub-content';

/** GET /api/hubs/:hub/manage -> { admin } — may the signed-in person manage this hub? */
export async function GET(req: Request, { params }: { params: Promise<{ hub: string }> }) {
  const { hub } = await params;
  const prisma = await getPrisma();
  if (!prisma || !isHubId(hub)) return NextResponse.json({ admin: false });
  try {
    const manager = await hubManager(prisma, req, hub);
    return NextResponse.json({ admin: !!manager, name: manager?.name ?? null });
  } catch {
    return NextResponse.json({ admin: false });
  }
}
