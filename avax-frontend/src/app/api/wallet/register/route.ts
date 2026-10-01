import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/db';
import { verifyWalletOwnership } from '@/lib/auth/wallet-signature';

/**
 * POST /api/wallet/register
 *
 * Records a person who joined by connecting a browser wallet (MetaMask/Core)
 * instead of signing in with email/Google. Those people have no KaiUser (it
 * requires an email), so before this they were invisible to the database and
 * the admin member count.
 *
 * Body: { address, signature, timestamp, connector? }
 *
 * The caller must sign the ownership challenge from lib/wallet-signature.ts;
 * the server recovers the signer and only records the address if it matches.
 * Idempotent: a repeat connect bumps lastSeenAt/visits instead of adding a row.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const address = String(body.address ?? '').trim().toLowerCase();
  const signature = String(body.signature ?? '').trim();
  const timestamp = Number(body.timestamp);
  const connector = body.connector ? String(body.connector).trim().slice(0, 64) : null;

  if (!/^0x[a-f0-9]{40}$/.test(address)) {
    return NextResponse.json({ ok: false, error: 'Valid wallet address required' }, { status: 400 });
  }

  const owned = await verifyWalletOwnership(address, signature, timestamp);
  if (!owned) {
    return NextResponse.json({ ok: false, error: 'Could not verify wallet ownership. Please sign again.' }, { status: 401 });
  }

  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ ok: false, error: 'database unavailable' }, { status: 503 });

  try {
    const now = new Date();
    const member = await prisma.walletMember.upsert({
      where: { address },
      create: { address, connector, firstSeenAt: now, lastSeenAt: now },
      update: { lastSeenAt: now, visits: { increment: 1 }, ...(connector ? { connector } : {}) },
    });
    return NextResponse.json({ ok: true, isNew: member.visits === 1, firstSeenAt: member.firstSeenAt });
  } catch (e) {
    console.error('[wallet/register] failed', e);
    return NextResponse.json({ ok: false, error: 'Failed to record wallet' }, { status: 500 });
  }
}
