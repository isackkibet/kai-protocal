import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import type { CfaMember, PrismaClient } from '@prisma/client';
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
/**
 * Someone who joined BEFORE their email was put in NURSERY_ADMIN_EMAILS would
 * otherwise stay a plain member forever — and with no admin nobody can add
 * species or nurseries. Promote only (never demote); the change is audited.
 */
async function promoteIfConfiguredAdmin(prisma: PrismaClient, member: CfaMember): Promise<CfaMember> {
  if (member.role !== 'member' || member.status !== 'active' || !isConfiguredAdmin(member.email)) return member;
  return withMember(prisma, member.id, (tx) => tx.cfaMember.update({ where: { id: member.id }, data: { role: 'admin' } }));
}

export async function GET(req: Request) {
  const privyUserId = await verifyPrivyUserId(req.headers.get('authorization'));
  if (!privyUserId) return NextResponse.json({ member: null });

  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ member: null });

  try {
    const found = await prisma.cfaMember.findUnique({ where: { authUserId: privyUserId } });
    const member = found ? await promoteIfConfiguredAdmin(prisma, found) : null;
    const cfa = member ? await prisma.cfa.findUnique({ where: { id: member.cfaId }, select: { name: true, location: true } }) : null;
    return NextResponse.json({
      member: member && {
        id: member.id, name: member.name, role: member.role, status: member.status, createdAt: member.createdAt,
        cfaName: cfa?.name ?? null, cfaLocation: cfa?.location ?? null,
      },
    });
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
    if (existing) return NextResponse.json({ ok: true, member: await promoteIfConfiguredAdmin(prisma, existing), isNew: false });

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
