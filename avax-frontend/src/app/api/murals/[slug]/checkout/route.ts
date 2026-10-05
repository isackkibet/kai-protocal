import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/db';
import { requireRateLimit } from '@/lib/security/route-guard';
import { readJsonBody } from '@/lib/security/input';
import { initializeTransaction } from '@/lib/payments/paystack';
import { muralCheckoutEnabled, settleMuralPayment, type MuralPaymentMeta } from '@/lib/murals/checkout';

/**
 * POST /api/murals/:slug/checkout { name, email, phone? }
 *   Starts a Paystack payment (M-Pesa or card) for the mural's own price and
 *   returns { authorizationUrl } to send the buyer to.
 * GET  /api/murals/:slug/checkout?reference=…
 *   The buyer is back from Paystack: check and settle the payment.
 */
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!muralCheckoutEnabled()) return NextResponse.json({ error: 'Paying online is not switched on yet. Leave your details and we will call you.' }, { status: 403 });
  const limited = await requireRateLimit(req, [{ scope: 'ip', limit: 5, windowMs: 60_000 }]);
  if (!limited.ok) return limited.response;
  const { slug } = await params;
  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ error: 'database unavailable' }, { status: 503 });

  let body: Record<string, unknown>;
  try { body = (await readJsonBody(req, 8 * 1024)) as Record<string, unknown>; } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }
  const s = (k: string, max: number) => (typeof body[k] === 'string' ? (body[k] as string).trim().slice(0, max) : '');
  const name = s('name', 120), email = s('email', 254).toLowerCase(), phone = s('phone', 30);
  if (name.length < 2) return NextResponse.json({ error: 'Please add your name.', field: 'name' }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Paystack needs an email for the receipt.', field: 'email' }, { status: 400 });
  if (phone && !/^\+?[0-9 ()-]{7,30}$/.test(phone)) return NextResponse.json({ error: 'That phone number does not look right.', field: 'phone' }, { status: 400 });

  const mural = await prisma.mural.findUnique({ where: { slug }, select: { id: true, slug: true, title: true, priceKes: true, status: true } });
  if (!mural || mural.status === 'draft') return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (mural.status !== 'available') return NextResponse.json({ error: 'This mural is no longer available. Leave your details and we will suggest another.' }, { status: 409 });
  if (mural.priceKes < 100) return NextResponse.json({ error: 'This mural has no online price. Leave your details and we will call you.' }, { status: 409 });

  // Price from the database only; reference minted here.
  const amountKobo = mural.priceKes * 100;
  const reference = `kai_mural_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;
  const meta: MuralPaymentMeta = { kind: 'mural', muralId: mural.id, slug: mural.slug, buyer: { name, phone: phone || null }, priceKes: mural.priceKes };
  await prisma.payment.create({
    data: { reference, amount_subunits: BigInt(amountKobo), currency: 'KES', status: 'pending', email, nft_name: `Mural: ${mural.title}`, metadata: { ...meta, provider: 'paystack' } },
  });
  try {
    const origin = new URL(req.url).origin;
    const result = await initializeTransaction({
      email, amountKobo, reference,
      callbackUrl: `${origin}/murals/${mural.slug}?paid=1`,
      metadata: { kind: 'mural', muralSlug: mural.slug, muralTitle: mural.title },
      channels: ['mobile_money', 'card'],
    });
    return NextResponse.json({ authorizationUrl: result.authorizationUrl, reference }, { status: 201 });
  } catch (e) {
    console.error('[murals/checkout] initialize failed', e instanceof Error ? e.message : 'unknown');
    await prisma.payment.update({ where: { reference }, data: { status: 'failed' } });
    return NextResponse.json({ error: 'Could not start the payment. Please try again, or leave your details and we will call you.' }, { status: 502 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  await params;
  const reference = new URL(req.url).searchParams.get('reference') ?? '';
  if (!/^kai_mural_[a-f0-9]{20}$/.test(reference)) return NextResponse.json({ error: 'Unknown payment.' }, { status: 400 });
  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ error: 'database unavailable' }, { status: 503 });
  try {
    return NextResponse.json(await settleMuralPayment(prisma, reference));
  } catch (e) {
    console.error('[murals/checkout] settle failed', e instanceof Error ? e.message : 'unknown');
    return NextResponse.json({ state: 'pending' });
  }
}
