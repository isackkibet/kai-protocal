import { NextResponse } from 'next/server';
import type { Cfa, CfaMember, PrismaClient } from '@prisma/client';
import { getPrisma } from '@/lib/db/db';
import { requireRateLimit } from '@/lib/security/route-guard';
import { readJsonBody, assertNoPrivilegeEscalation, InputError } from '@/lib/security/input';
import { explainDbError, getNurseryCfa, getSessionMember } from './db';
import { FieldError } from './validate';

export interface WriteContext {
  prisma: PrismaClient;
  cfa: Cfa;
  member: CfaMember;
  privyUserId: string;
  body: Record<string, unknown>;
}

/**
 * Shared shell for every nursery write:
 * rate limit → sanitised JSON → no client-set trust fields → verified member
 * of this CFA → handler → rule violations mapped to clear 4xx messages.
 * Handlers do their writes through withMember() so the audit trigger knows
 * who acted.
 */
export async function nurseryWrite(
  req: Request,
  label: string,
  handler: (ctx: WriteContext) => Promise<NextResponse>,
): Promise<NextResponse> {
  const limited = await requireRateLimit(req, [{ scope: 'ip', limit: 30, windowMs: 60_000 }]);
  if (!limited.ok) return limited.response;

  let body: Record<string, unknown> = {};
  try {
    body = ((await readJsonBody(req)) ?? {}) as Record<string, unknown>;
    assertNoPrivilegeEscalation(body);
  } catch (err) {
    return NextResponse.json({ error: err instanceof InputError ? err.message : 'Invalid JSON body' }, { status: 400 });
  }

  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ error: 'database unavailable' }, { status: 503 });

  try {
    const cfa = await getNurseryCfa(prisma);
    if (!cfa) return NextResponse.json({ error: 'Nursery database is not set up yet.' }, { status: 503 });

    const session = await getSessionMember(prisma, req);
    if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });
    if (session.member.cfaId !== cfa.id) {
      return NextResponse.json({ error: 'You are not a member of this CFA.' }, { status: 403 });
    }
    return await handler({ prisma, cfa, member: session.member, privyUserId: session.privyUserId, body });
  } catch (e) {
    if (e instanceof FieldError) return NextResponse.json({ error: e.message, field: e.field }, { status: 400 });
    const known = explainDbError(e);
    if (known) return NextResponse.json({ error: known.error }, { status: known.status });
    console.error(`[${label}] failed`, e);
    return NextResponse.json({ error: 'Could not save this. Please try again.' }, { status: 500 });
  }
}

/** Read-only shell: database + CFA, errors logged, never a raw 500 body. */
export async function nurseryRead(
  label: string,
  handler: (ctx: { prisma: PrismaClient; cfa: Cfa }) => Promise<NextResponse>,
  empty: Record<string, unknown>,
): Promise<NextResponse> {
  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ ...empty, db: false });
  try {
    const cfa = await getNurseryCfa(prisma);
    if (!cfa) return NextResponse.json({ ...empty, db: false });
    return await handler({ prisma, cfa });
  } catch (e) {
    console.error(`[${label}] database unavailable`, e);
    return NextResponse.json({ ...empty, db: false });
  }
}

/** "YYYY-MM-DD" → Date at UTC midnight, for @db.Date columns. */
export function toDate(d: string | null): Date | null {
  return d ? new Date(`${d}T00:00:00Z`) : null;
}
