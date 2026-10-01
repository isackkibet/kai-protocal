import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/db';
import { canReadAudit, getSessionMember } from '@/lib/nursery/db';

const ENTITY_TYPES = new Set(['members', 'species', 'nursery_locations', 'seedling_inventory', 'nursery_activities', 'survival_observations']);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/cfa/audit?entityType=seedling_inventory&entityId=<uuid>
 *
 * Change history from the append-only audit_logs table (written by the
 * database trigger, never by the app): who acted, what action, old and new
 * data. Without filters, the latest 100 changes. For CFA admins, auditors
 * and verifiers only — old_data can include members' contact details.
 */
export async function GET(req: Request) {
  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ error: 'database unavailable' }, { status: 503 });

  try {
    const session = await getSessionMember(prisma, req);
    if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });
    if (!canReadAudit(session.member)) {
      return NextResponse.json({ error: 'Only CFA admins, auditors and verifiers can read the audit log.' }, { status: 403 });
    }

    const url = new URL(req.url);
    const entityType = url.searchParams.get('entityType');
    const entityId = url.searchParams.get('entityId');
    if (entityType && !ENTITY_TYPES.has(entityType)) return NextResponse.json({ error: 'Unknown entityType.' }, { status: 400 });
    if (entityId && !UUID_RE.test(entityId)) return NextResponse.json({ error: 'entityId must be a uuid.' }, { status: 400 });

    const entries = await prisma.auditLog.findMany({
      where: { ...(entityType ? { entityType } : {}), ...(entityId ? { entityId } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const actors = await prisma.cfaMember.findMany({
      where: { id: { in: [...new Set(entries.map((e) => e.userId))] } },
      select: { id: true, name: true },
    });
    const actorName = new Map(actors.map((a) => [a.id, a.name]));

    return NextResponse.json({
      entries: entries.map((e) => ({ ...e, actorName: actorName.get(e.userId) ?? null })),
    });
  } catch (e) {
    console.error('[cfa/audit] failed', e);
    return NextResponse.json({ error: 'Could not load the audit log.' }, { status: 500 });
  }
}
