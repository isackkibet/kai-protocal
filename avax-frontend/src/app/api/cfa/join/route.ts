import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { getPrisma } from '@/lib/db/db';
import { verifyPrivyUserId } from '@/lib/auth/privy-server';
import { requireRateLimit } from '@/lib/security/route-guard';
import { explainDbError, getNurseryCfa, isConfiguredAdmin, withMember } from '@/lib/nursery/db';

/**
 * /api/cfa/join — GET / POST
 *
 * CFA membership for the signed-in account (Kanuvari nursery DB: `members`).
 * GET returns the caller's member row (or null). POST creates it from the
 * verified Privy account — name, email and wallet come from the server-side
 * KaiUser, never from the request. Emails in NURSERY_ADMIN_EMAILS join as
 * admin; everyone else as member.
 */
export async function GET(req: Request) {
  const privyUserId = await verifyPrivyUserId(req.headers.get('authorization'));
  if (!privyUserId) return NextResponse.json({ member: null });

  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ member: null });

  try {
    const member = await prisma.cfaMember.findUnique({
      where: { authUserId: privyUserId },
      select: { id: true, name: true, role: true, status: true, createdAt: true },
    });
    return NextResponse.json({ member });
  } catch (e) {
    console.error('[cfa/join] database unavailable', e);
    return NextResponse.json({ member: null });
  }
}

export async function POST(req: Request) {
  const limited = await requireRateLimit(req, [{ scope: 'ip', limit: 10, windowMs: 60_000 }]);
  if (!limited.ok) return limited.response;

  const privyUserId = await verifyPrivyUserId(req.headers.get('authorization'));
  if (!privyUserId) {
    return NextResponse.json({ error: 'Could not verify your session. Please sign in again.' }, { status: 401 });
  }

  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ error: 'database unavailable' }, { status: 503 });

  try {
    const existing = await prisma.cfaMember.findUnique({ where: { authUserId: privyUserId } });
    if (existing) return NextResponse.json({ ok: true, member: existing, isNew: false });

    const user = await prisma.kaiUser.findUnique({ where: { privyUserId }, include: { wallets: true } });
    if (!user) return NextResponse.json({ error: 'Finish signing up first.' }, { status: 404 });

    const cfa = await getNurseryCfa(prisma);
    if (!cfa) return NextResponse.json({ error: 'Nursery database is not set up yet.' }, { status: 503 });

    // An admin may have added this person by email before they ever signed
    // in: link that row to the login instead of refusing a duplicate email.
    const invited = await prisma.cfaMember.findFirst({
      where: { email: { equals: user.email, mode: 'insensitive' }, authUserId: null },
    });
    if (invited) {
      const member = await withMember(prisma, invited.id, (tx) =>
        tx.cfaMember.update({ where: { id: invited.id }, data: { authUserId: privyUserId } }),
      );
      return NextResponse.json({ ok: true, member, isNew: false });
    }

    const wallet = user.wallets.find((w) => w.chain === 'AVALANCHE')?.address ?? null;
    // The new member is the actor of their own join, so the audit trigger
    // can attribute the CREATE (the id is chosen here so it can be set first).
    const id = randomUUID();
    const member = await withMember(prisma, id, (tx) =>
      tx.cfaMember.create({
        data: {
          id,
          cfaId: cfa.id,
          authUserId: privyUserId,
          name: user.name,
          email: user.email,
          walletAddress: wallet && /^0x[a-fA-F0-9]{40}$/.test(wallet) ? wallet : null,
          role: isConfiguredAdmin(user.email) ? 'admin' : 'member',
        },
      }),
    );
    return NextResponse.json({ ok: true, member, isNew: true });
  } catch (e) {
    // Two taps at once: the second create loses the unique race — return the winner.
    if ((e as { code?: string })?.code === 'P2002') {
      const member = await prisma.cfaMember.findUnique({ where: { authUserId: privyUserId } });
      if (member) return NextResponse.json({ ok: true, member, isNew: false });
    }
    const known = explainDbError(e);
    if (known) return NextResponse.json({ error: known.error }, { status: known.status });
    console.error('[cfa/join] failed', e);
    return NextResponse.json({ error: 'Failed to join CFA' }, { status: 500 });
  }
}
