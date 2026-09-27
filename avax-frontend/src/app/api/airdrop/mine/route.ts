import { NextResponse } from 'next/server';
import { verifyPrivyUserId } from '@/lib/privy-server';
import { getPrisma } from '@/lib/db';

/**
 * POST /api/airdrop/mine
 * Auto-Miner flush endpoint — batches accumulated client-side mined points
 * to the database every 30 seconds (per AIRDROP_SPEC.md §AC-5).
 *
 * Body: { accumulatedPoints: number }
 *
 * Mock mode (no DATABASE_URL): silently acknowledges the request.
 * Production mode: writes a KaiBarLedger entry and updates MiningStat.
 */
export async function POST(req: Request) {
  try {
    const privyUserId = await verifyPrivyUserId(req.headers.get('authorization'));
    const userId = privyUserId || 'did:privy:demo_user_austin';

    const body = await req.json();
    const raw = Number(body?.accumulatedPoints ?? 0);

    // Reject nonsensical values — max theoretical 30s batch = 0.05 pts/s * 30 = 1.5 pts
    // We allow up to 5× for minor clock drift but reject clear cheaters.
    const MAX_BATCH = 15;
    const points = Math.max(0, Math.min(raw, MAX_BATCH));

    if (points <= 0) {
      return NextResponse.json({ ok: true, flushed: 0, msg: 'Nothing to flush' });
    }

    const prisma = await getPrisma();

    if (!prisma) {
      // Mock / local dev — just acknowledge
      return NextResponse.json({ ok: true, flushed: points, mode: 'mock' });
    }

    // Find user in DB
    const user = await prisma.kaiUser.findFirst({
      where: {
        OR: [
          { id: userId },
          { privyUserId: userId },
        ],
      },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });
    }

    if (user.status === 'BLOCKED') {
      return NextResponse.json({ ok: false, error: 'Account restricted' }, { status: 403 });
    }

    const flooredPoints = Math.floor(points); // Only integer points to ledger

    if (flooredPoints > 0) {
      await prisma.$transaction([
        prisma.kaiBarLedger.create({
          data: {
            userId: user.id,
            type: 'CAMPAIGN',
            amount: flooredPoints,
            description: `Auto-Miner batch (+${flooredPoints} pts @ 0.05 pts/s)`,
            referenceId: `autominer_${Date.now()}`,
          },
        }),
        prisma.userMiningStat.upsert({
          where: { userId: user.id },
          update: {
            lifetimeXP: { increment: flooredPoints },
            lastActiveAt: new Date(),
          },
          create: {
            userId: user.id,
            hashPower: 0,
            lifetimeXP: flooredPoints,
            lastActiveAt: new Date(),
          },
        }),
      ]);
    }

    return NextResponse.json({ ok: true, flushed: flooredPoints, mode: 'live' });
  } catch (error: any) {
    console.error('[/api/airdrop/mine] error:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to flush miner batch' },
      { status: 500 }
    );
  }
}
