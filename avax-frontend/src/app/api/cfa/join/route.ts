import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { verifyPrivyUserId } from '@/lib/privy-server';
import { getOrCreateDefaultForest } from '@/lib/cfa';

/**
 * /api/cfa/join  —  POST / GET
 *
 * Links the signed-in Kai Bar account to a CFA membership (ForestMember) so
 * conservation activity they submit is traceable back to a real account and
 * eligible for Kai Bar points (KAI Nuvari PRD §7: USER → CFA Membership →
 * Conservation Data → Points). Idempotent — joining twice just returns the
 * existing membership.
 */
export async function GET(req: Request) {
  const privyUserId = await verifyPrivyUserId(req.headers.get('authorization'));
  if (!privyUserId) return NextResponse.json({ member: null });

  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ member: null });

  const user = await prisma.kaiUser.findUnique({ where: { privyUserId } });
  if (!user) return NextResponse.json({ member: null });

  const member = await prisma.forestMember.findUnique({ where: { kaiUserId: user.id } });
  return NextResponse.json({ member });
}

export async function POST(req: Request) {
  const privyUserId = await verifyPrivyUserId(req.headers.get('authorization'));
  if (!privyUserId) {
    return NextResponse.json({ error: 'Could not verify your session. Please sign in again.' }, { status: 401 });
  }

  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ error: 'database unavailable' }, { status: 503 });

  const user = await prisma.kaiUser.findUnique({ where: { privyUserId }, include: { wallets: true } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const forest = await getOrCreateDefaultForest();
  if (!forest) return NextResponse.json({ error: 'database unavailable' }, { status: 503 });

  try {
    const existing = await prisma.forestMember.findUnique({ where: { kaiUserId: user.id } });
    if (existing) return NextResponse.json({ ok: true, member: existing, isNew: false });

    const wallet = user.wallets.find((w) => w.chain === 'AVALANCHE')?.address ?? null;
    const member = await prisma.forestMember.create({
      data: { forestId: forest.id, name: user.name, wallet, kaiUserId: user.id },
    });

    return NextResponse.json({ ok: true, member, isNew: true });
  } catch (e: any) {
    console.error('[cfa/join] failed', e);
    return NextResponse.json({ error: 'Failed to join CFA' }, { status: 500 });
  }
}
