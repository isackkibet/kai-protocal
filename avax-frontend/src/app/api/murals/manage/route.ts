import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/db';
import { canManageCatalogue, getNurseryCfa, getSessionMember } from '@/lib/nursery/db';
import { listMurals, verifiedRecordOptions } from '@/lib/murals/store';

/**
 * GET /api/murals/manage — for CFA admins: all murals (drafts too), the
 * verified records that can be linked to a new mural, and the enquiries.
 * Anyone else gets { admin: false }.
 */
export async function GET(req: Request) {
  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ admin: false });
  const cfa = await getNurseryCfa(prisma);
  const session = await getSessionMember(prisma, req);
  if (!cfa || !session.ok || session.member.cfaId !== cfa.id || !canManageCatalogue(session.member)) return NextResponse.json({ admin: false });
  const [murals, records, enquiries] = await Promise.all([
    listMurals(prisma, { includeDrafts: true }),
    verifiedRecordOptions(prisma, cfa.id),
    prisma.muralEnquiry.findMany({
      where: { mural: { cfaId: cfa.id } }, orderBy: { createdAt: 'desc' }, take: 100,
      select: { id: true, name: true, phone: true, email: true, message: true, status: true, createdAt: true, mural: { select: { slug: true, title: true } } },
    }),
  ]);
  return NextResponse.json({ admin: true, murals, records, enquiries });
}
