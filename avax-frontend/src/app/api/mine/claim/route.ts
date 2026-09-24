import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { verifyPrivyUserId } from '@/lib/privy-server';
import { claimDrop, claimStatus } from '@/lib/mining-engine';

/**
 * /api/mine/claim  —  GET / POST
 *
 * Nuvari v4 "Claim Drop" (spec §4). GET returns what the screen needs to
 * render (claimable state, live hash power, lifetime XP, projected next
 * claim). POST performs the claim: 24h rolling cooldown, hashing-power
 * multiplier (capped), treasury cut, MiningBalance credit.
 *
 * Security (PRD 1 §12): identity verified server-side from the bearer token.
 */
export async function GET(req: Request) {
  const privyUserId = await verifyPrivyUserId(req.headers.get('authorization'));
  if (!privyUserId) {
    return NextResponse.json({ error: 'Could not verify your session. Please sign in again.' }, { status: 401 });
  }

  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ error: 'database unavailable' }, { status: 503 });

  try {
    const user = await prisma.kaiUser.findUnique({ where: { privyUserId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (user.status === 'BLOCKED') {
      return NextResponse.json({ error: 'Account blocked' }, { status: 403 });
    }

    const status = await claimStatus(prisma, user.id);
    const balance = await prisma.miningBalance.findUnique({ where: { userId: user.id } });
    return NextResponse.json({ ...status, balance: balance?.amount ? Number(balance.amount) : 0 });
  } catch (e: unknown) {
    console.error('[mine/claim GET] failed', e);
    return NextResponse.json({ error: 'Failed to load claim status' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const privyUserId = await verifyPrivyUserId(req.headers.get('authorization'));
  if (!privyUserId) {
    return NextResponse.json({ error: 'Could not verify your session. Please sign in again.' }, { status: 401 });
  }

  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ error: 'database unavailable' }, { status: 503 });

  try {
    const user = await prisma.kaiUser.findUnique({ where: { privyUserId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (user.status === 'BLOCKED') {
      return NextResponse.json({ error: 'Account blocked' }, { status: 403 });
    }

    const result = await claimDrop(prisma, user.id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.cooldown ? 409 : 503 });
    }

    return NextResponse.json({
      ok: true,
      claimAmount: result.claimAmount,
      userAmount: result.userAmount,
      treasuryAmount: result.treasuryAmount,
      multiplier: result.multiplier,
      hashPower: result.hashPower,
    });
  } catch (e: unknown) {
    console.error('[mine/claim POST] failed', e);
    return NextResponse.json({ error: 'Failed to claim drop' }, { status: 500 });
  }
}