import { NextResponse } from 'next/server';
import { canManageCatalogue, withMember } from '@/lib/nursery/db';
import { nurseryWrite } from '@/lib/nursery/route';
import { MEMBER_ROLES, MEMBER_STATUSES, oneOf } from '@/lib/nursery/validate';

/**
 * PATCH /api/cfa/members/:id { role?, status? } — CFA admins change a
 * member's role (e.g. make someone a verifier) or suspend them.
 * An admin can't change their own role or status, so the CFA can't be left
 * with no admin by accident.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: memberId } = await params;
  return nurseryWrite(req, 'cfa/members/:id', async ({ prisma, cfa, member, body }) => {
    if (!canManageCatalogue(member)) return NextResponse.json({ error: 'Only a CFA admin can change members.' }, { status: 403 });
    if (memberId === member.id) return NextResponse.json({ error: 'Ask another admin to change your own role or status.' }, { status: 400 });

    const target = await prisma.cfaMember.findFirst({ where: { id: memberId, cfaId: cfa.id } });
    if (!target) return NextResponse.json({ error: 'Member not found.' }, { status: 404 });

    const role = oneOf(body, 'role', MEMBER_ROLES);
    const status = oneOf(body, 'status', MEMBER_STATUSES);
    if (!role && !status) return NextResponse.json({ error: 'Nothing to change.' }, { status: 400 });

    const updated = await withMember(prisma, member.id, (tx) =>
      tx.cfaMember.update({ where: { id: target.id }, data: { ...(role ? { role } : {}), ...(status ? { status } : {}) } }),
    );
    return NextResponse.json({ ok: true, member: { id: updated.id, name: updated.name, role: updated.role, status: updated.status } });
  }, { allowFields: ['role'] }); // admin-only route: setting a role is its purpose
}
