import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/db';
import { canReadAudit, getNurseryCfa, getSessionMember } from '@/lib/nursery/db';

/**
 * GET /api/cfa/audit/export?format=csv|json&from=YYYY-MM-DD&to=YYYY-MM-DD&entityType=
 * — the audit log as a file, for compliance (Ecosystem PRD v1.1 §4.12
 * export_audit_trail). CFA admins, auditors and verifiers only. Each row
 * lists who acted, what, when, and the fields that changed (before → after).
 * Up to 5,000 rows per file; narrow the dates for more.
 */
const MAX_ROWS = 5_000;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const SENSITIVE = new Set(['email', 'phone', 'auth_user_id', 'updated_at']);

function changes(oldData: unknown, newData: unknown) {
  const a = (oldData ?? {}) as Record<string, unknown>, b = (newData ?? {}) as Record<string, unknown>;
  const out: Record<string, { before: unknown; after: unknown }> = {};
  for (const k of Object.keys({ ...a, ...b })) {
    if (SENSITIVE.has(k) || JSON.stringify(a[k]) === JSON.stringify(b[k])) continue;
    out[k] = { before: a[k] ?? null, after: b[k] ?? null };
  }
  return out;
}

const csvCell = (v: unknown) => {
  const s = typeof v === 'string' ? v : JSON.stringify(v ?? '');
  // Quote everything; neutralise spreadsheet formulas (=, +, -, @ at the start).
  return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
};

export async function GET(req: Request) {
  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ error: 'database unavailable' }, { status: 503 });
  const url = new URL(req.url);
  const format = url.searchParams.get('format') === 'json' ? 'json' : 'csv';
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const entityType = url.searchParams.get('entityType');
  if ((from && !DAY.test(from)) || (to && !DAY.test(to))) return NextResponse.json({ error: 'Dates must look like 2026-09-30.' }, { status: 400 });
  if (entityType && !/^[a-z_]{2,40}$/.test(entityType)) return NextResponse.json({ error: 'Unknown entityType.' }, { status: 400 });

  try {
    const cfa = await getNurseryCfa(prisma);
    const session = await getSessionMember(prisma, req);
    if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });
    if (!cfa || session.member.cfaId !== cfa.id || !canReadAudit(session.member)) {
      return NextResponse.json({ error: 'Only CFA admins, auditors and verifiers can export the audit log.' }, { status: 403 });
    }

    const rows = await prisma.auditLog.findMany({
      where: {
        ...(entityType ? { entityType } : {}),
        ...(from || to ? { createdAt: { ...(from ? { gte: new Date(`${from}T00:00:00Z`) } : {}), ...(to ? { lte: new Date(`${to}T23:59:59Z`) } : {}) } } : {}),
      },
      orderBy: { createdAt: 'asc' },
      take: MAX_ROWS,
    });
    const names = new Map((await prisma.cfaMember.findMany({ where: { id: { in: [...new Set(rows.map((r) => r.userId))] } }, select: { id: true, name: true } })).map((m) => [m.id, m.name]));
    const events = rows.map((r) => ({
      at: r.createdAt.toISOString(), actor: names.get(r.userId) ?? r.userId, actorId: r.userId,
      action: r.action, entityType: r.entityType, entityId: r.entityId, changes: changes(r.oldData, r.newData),
    }));
    const stamp = new Date().toISOString().slice(0, 10);
    const headers = {
      'Content-Disposition': `attachment; filename="oloolua-audit-${stamp}.${format}"`,
      'Cache-Control': 'no-store',
      'X-Row-Count': String(events.length),
      'X-Truncated': String(rows.length === MAX_ROWS),
    };
    if (format === 'json') {
      return new Response(JSON.stringify({ cfa: cfa.name, exportedAt: new Date().toISOString(), exportedBy: session.member.name, truncated: rows.length === MAX_ROWS, events }, null, 2), {
        headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' },
      });
    }
    const lines = [
      ['at', 'actor', 'actor_id', 'action', 'entity_type', 'entity_id', 'changes'].join(','),
      ...events.map((e) => [e.at, e.actor, e.actorId, e.action, e.entityType, e.entityId, e.changes].map(csvCell).join(',')),
    ];
    return new Response(lines.join('\r\n'), { headers: { ...headers, 'Content-Type': 'text/csv; charset=utf-8' } });
  } catch (e) {
    console.error('[cfa/audit/export] failed', e);
    return NextResponse.json({ error: 'Could not export the audit log.' }, { status: 500 });
  }
}
