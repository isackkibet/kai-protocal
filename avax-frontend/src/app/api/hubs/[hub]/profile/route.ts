import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/db';
import { readJsonBody } from '@/lib/security/input';
import { hubManager, hubProfile, isHubId } from '@/lib/hubs/hub-content';

/**
 * GET /api/hubs/:hub/profile -> { about, mission }
 * PUT { about, mission } — a hub manager writes the organisation's own words.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ hub: string }> }) {
  const { hub } = await params;
  const prisma = await getPrisma();
  if (!prisma || !isHubId(hub)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(await hubProfile(prisma, hub));
}

export async function PUT(req: Request, { params }: { params: Promise<{ hub: string }> }) {
  const { hub } = await params;
  const prisma = await getPrisma();
  if (!prisma || !isHubId(hub)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const manager = await hubManager(prisma, req, hub);
  if (!manager) return NextResponse.json({ error: 'Only hub managers can change this.' }, { status: 403 });
  let body: Record<string, unknown>;
  try { body = (await readJsonBody(req, 16 * 1024)) as Record<string, unknown>; } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }
  const about = typeof body.about === 'string' ? body.about.trim().slice(0, 3000) : '';
  const mission = typeof body.mission === 'string' ? body.mission.trim().slice(0, 1500) : '';
  if (about.length < 20) return NextResponse.json({ error: 'Write at least one sentence about the organisation.', field: 'about' }, { status: 400 });
  await prisma.hubProfile.upsert({
    where: { hub },
    create: { hub, about, mission: mission || null, updatedBy: manager.email ?? manager.name },
    update: { about, mission: mission || null, updatedBy: manager.email ?? manager.name },
  });
  return NextResponse.json({ ok: true });
}
