import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { getOrCreateDefaultForest } from '@/lib/cfa';

/**
 * /api/cfa/species  —  GET / POST
 *
 * Tree species stocked by the CFA's nursery (KAI Nuvari PRD §5 "Tree
 * species"): name, quantity available, quantity planted, quantity for sale.
 */
export async function GET() {
  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ species: [], db: false });

  const forest = await getOrCreateDefaultForest();
  if (!forest) return NextResponse.json({ species: [], db: false });

  const species = await prisma.treeSpecies.findMany({
    where: { forestId: forest.id },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ species });
}

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const name = String(body.name ?? '').trim();
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const quantityAvailable = Math.max(0, Number(body.quantityAvailable) || 0);
  const quantityPlanted = Math.max(0, Number(body.quantityPlanted) || 0);
  const quantityForSale = Math.max(0, Number(body.quantityForSale) || 0);

  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ error: 'database unavailable' }, { status: 503 });

  const forest = await getOrCreateDefaultForest();
  if (!forest) return NextResponse.json({ error: 'database unavailable' }, { status: 503 });

  try {
    const species = await prisma.treeSpecies.create({
      data: { forestId: forest.id, name, quantityAvailable, quantityPlanted, quantityForSale },
    });
    return NextResponse.json({ ok: true, species });
  } catch (e: any) {
    console.error('[cfa/species] failed', e);
    return NextResponse.json({ error: 'Failed to add species' }, { status: 500 });
  }
}
