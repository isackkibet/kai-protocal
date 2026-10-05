import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { getPrisma } from '@/lib/db/db';
import { verifyPrivyUserId } from '@/lib/auth/privy-server';
import { readJsonBody } from '@/lib/security/input';

/**
 * /api/profile/me — the signed-in person's profile, keyed by their email
 * account (Privy session). No wallet needed.
 *
 * GET  -> { profile: { email, displayName, phone, county, idNumber, cfaGroup, cfaRole, cfaRegion, cfaJoinYear, wallet } }
 * POST { displayName?, phone?, county?, idNumber?, cfaGroup?, cfaRole?, cfaRegion?, cfaJoinYear? }
 *
 * The email is the identifier and cannot be changed here. Name and phone are
 * saved on kai_users; the rest in member_profiles.data.
 */
const FIELDS = ['county', 'idNumber', 'cfaGroup', 'cfaRole', 'cfaRegion', 'cfaJoinYear'] as const;
const clean = (v: unknown, max = 120) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

async function me(req: Request) {
  const privyUserId = await verifyPrivyUserId(req.headers.get('authorization'));
  if (!privyUserId) return { error: NextResponse.json({ error: 'Please sign in first.' }, { status: 401 }) };
  const prisma = await getPrisma();
  if (!prisma) return { error: NextResponse.json({ error: 'Profiles are not available right now.' }, { status: 503 }) };
  const user = await prisma.kaiUser.findUnique({ where: { privyUserId }, include: { wallets: true } });
  if (!user) return { error: NextResponse.json({ error: 'We are still setting up your account. Try again in a moment.' }, { status: 404 }) };
  return { prisma, user };
}

export async function GET(req: Request) {
  const r = await me(req);
  if ('error' in r) return r.error;
  const { prisma, user } = r;
  const extra = await prisma.memberProfile.findUnique({ where: { kaiUserId: user.id } });
  const data = (extra?.data ?? {}) as Record<string, unknown>;
  return NextResponse.json({
    profile: {
      email: user.email.endsWith('@kai.local') ? null : user.email,
      displayName: user.name === 'KAI User' ? '' : user.name,
      phone: user.phone ?? '',
      ...Object.fromEntries(FIELDS.map((f) => [f, typeof data[f] === 'string' ? data[f] : ''])),
      wallet: user.wallets.find((w) => w.chain === 'AVALANCHE')?.address ?? null,
      updatedAt: extra?.updatedAt?.toISOString() ?? null,
    },
  });
}

export async function POST(req: Request) {
  const r = await me(req);
  if ('error' in r) return r.error;
  const { prisma, user } = r;
  let body: Record<string, unknown>;
  try { body = (await readJsonBody(req, 16 * 1024)) as Record<string, unknown>; } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }

  const displayName = clean(body.displayName);
  const phone = clean(body.phone, 30);
  if (phone && !/^\+?[0-9 ()-]{7,30}$/.test(phone)) return NextResponse.json({ error: 'That phone number does not look right.', field: 'phone' }, { status: 400 });
  const data = Object.fromEntries(FIELDS.map((f) => [f, clean(body[f])]));

  await prisma.$transaction([
    prisma.kaiUser.update({ where: { id: user.id }, data: { ...(displayName ? { name: displayName } : {}), phone: phone || null } }),
    prisma.memberProfile.upsert({
      where: { kaiUserId: user.id },
      create: { kaiUserId: user.id, data: data as Prisma.InputJsonObject },
      update: { data: data as Prisma.InputJsonObject },
    }),
  ]);
  return NextResponse.json({ ok: true });
}
