import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/db';
import { requireRateLimit } from '@/lib/security/route-guard';
import { readJsonBody } from '@/lib/security/input';

/**
 * POST /api/murals/:slug/enquiry { name, phone?, email?, message? }
 * Someone wants to buy or commission this mural; the CFA team follows up.
 * No payment is taken here.
 */
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const limited = await requireRateLimit(req, [{ scope: 'ip', limit: 5, windowMs: 60_000 }]);
  if (!limited.ok) return limited.response;
  const { slug } = await params;
  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ error: 'database unavailable' }, { status: 503 });

  let body: Record<string, unknown>;
  try { body = (await readJsonBody(req, 8 * 1024)) as Record<string, unknown>; } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }
  const s = (k: string, max: number) => (typeof body[k] === 'string' ? (body[k] as string).trim().slice(0, max) : '');
  const name = s('name', 120), phone = s('phone', 30), email = s('email', 254).toLowerCase(), message = s('message', 1000);
  if (name.length < 2) return NextResponse.json({ error: 'Please add your name.', field: 'name' }, { status: 400 });
  if (!phone && !email) return NextResponse.json({ error: 'Add a phone number or an email so we can reach you.', field: 'phone' }, { status: 400 });
  if (phone && !/^\+?[0-9 ()-]{7,30}$/.test(phone)) return NextResponse.json({ error: 'That phone number does not look right.', field: 'phone' }, { status: 400 });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'That email does not look right.', field: 'email' }, { status: 400 });

  const mural = await prisma.mural.findUnique({ where: { slug }, select: { id: true, status: true } });
  if (!mural || mural.status === 'draft') return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.muralEnquiry.create({ data: { muralId: mural.id, name, phone: phone || null, email: email || null, message: message || null } });
  return NextResponse.json({ ok: true }, { status: 201 });
}
