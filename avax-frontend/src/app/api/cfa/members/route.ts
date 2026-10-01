import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/db';
import { canManageCatalogue, canReadAudit, getNurseryCfa, getSessionMember, withMember } from '@/lib/nursery/db';
import { nurseryWrite } from '@/lib/nursery/route';
import { FieldError, MEMBER_ROLES, oneOf, text } from '@/lib/nursery/validate';

/**
 * /api/cfa/members — CFA membership (Kanuvari Tools & Agents PRD §4.1
 * list_cfa_members / add_cfa_member).
 *
 * GET: admins, verifiers and auditors see the member list (it has emails).
 * POST { name, email, role? }: an admin adds someone by email. They get a row
 * with no login yet; when that person signs in and opens /nursery, the join
 * route links the row to their login (see /api/cfa/join).
 */
export async function GET(req: Request) {
  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ members: [], db: false });
  try {
    const cfa = await getNurseryCfa(prisma);
    if (!cfa) return NextResponse.json({ members: [], db: false });
    const session = await getSessionMember(prisma, req);
    if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });
    if (!canReadAudit(session.member)) return NextResponse.json({ error: 'Only CFA admins, verifiers and auditors can see the member list.' }, { status: 403 });

    const members = await prisma.cfaMember.findMany({
      where: { cfaId: cfa.id },
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true, authUserId: true },
    });
    return NextResponse.json({
      members: members.map(({ authUserId, ...m }) => ({ ...m, hasSignedIn: !!authUserId })),
    });
  } catch (e) {
    console.error('[cfa/members] failed', e);
    return NextResponse.json({ members: [], db: false });
  }
}

export async function POST(req: Request) {
  return nurseryWrite(req, 'cfa/members', async ({ prisma, cfa, member, body }) => {
    if (!canManageCatalogue(member)) return NextResponse.json({ error: 'Only a CFA admin can add members.' }, { status: 403 });
    const name = text(body, 'name', { required: true })!;
    const email = text(body, 'email', { required: true })!.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new FieldError('email', 'That is not an email address.');
    const role = oneOf(body, 'role', MEMBER_ROLES) ?? 'member';
    // The database also refuses it (unique lower(email)); this gives a clear message first.
    const taken = await prisma.cfaMember.findFirst({ where: { email: { equals: email, mode: 'insensitive' } }, select: { id: true } });
    if (taken) return NextResponse.json({ error: 'A member with this email already exists.' }, { status: 409 });

    const added = await withMember(prisma, member.id, (tx) =>
      tx.cfaMember.create({ data: { cfaId: cfa.id, name, email, role } }),
    );
    return NextResponse.json({ ok: true, member: { id: added.id, name: added.name, email: added.email, role: added.role, status: added.status } });
  }, { allowFields: ['role'] }); // admin-only route: setting a role is its purpose
}
