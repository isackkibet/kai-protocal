import { NextResponse } from 'next/server';
import { isAuthorizedAdmin } from '@/lib/auth/admin-auth';
import { getPrisma } from '@/lib/db/db';
import { explainDbError } from '@/lib/nursery/db';
import { FieldError, metadata, text } from '@/lib/nursery/validate';
import { readJsonBody, InputError } from '@/lib/security/input';

/**
 * /api/admin/cfa — platform admins (x-admin-key) list and create CFAs
 * (Kanuvari Tools & Agents PRD §4.1 create_cfa).
 *
 * The app's screens currently serve ONE CFA (NURSERY_CFA_NAME, Oloolua), so a
 * new CFA is registered here for onboarding but doesn't get its own pages
 * yet. Editing a CFA's profile is PATCH /api/cfa/profile (CFA admins).
 */
export async function GET(req: Request) {
  if (!isAuthorizedAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ error: 'database unavailable' }, { status: 503 });
  const cfas = await prisma.cfa.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, location: true, description: true, createdAt: true, _count: { select: { members: true, locations: true } } },
  });
  return NextResponse.json({ cfas });
}

export async function POST(req: Request) {
  if (!isAuthorizedAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ error: 'database unavailable' }, { status: 503 });

  try {
    const body = ((await readJsonBody(req)) ?? {}) as Record<string, unknown>;
    const name = text(body, 'name', { required: true })!;
    const location = text(body, 'location', { required: true })!;
    const description = text(body, 'description', { max: 4000 });
    const meta = metadata(body);
    // The cfa table has no INSERT audit trigger (a new CFA has no member yet).
    const cfa = await prisma.cfa.create({ data: { name, location, description, metadata: meta as object } });
    return NextResponse.json({ ok: true, cfa });
  } catch (e) {
    if (e instanceof InputError) return NextResponse.json({ error: e.message }, { status: 400 });
    if (e instanceof FieldError) return NextResponse.json({ error: e.message, field: e.field }, { status: 400 });
    if ((e as { code?: string })?.code === 'P2002') return NextResponse.json({ error: 'A CFA with that name already exists.' }, { status: 409 });
    const known = explainDbError(e);
    if (known) return NextResponse.json({ error: known.error }, { status: known.status });
    console.error('[admin/cfa] failed', e);
    return NextResponse.json({ error: 'Could not create the CFA.' }, { status: 500 });
  }
}
