import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';

/**
 * POST /api/diag/client-log
 *
 * Temporary, unauthenticated diagnostic sink for client-side sign-in errors
 * that happen before any request would reach /api/kai-bar/onboard (popup
 * blocked, Privy SDK throw, etc). Accepts only a short event name + message,
 * never blocks the caller, and never throws.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const event = String(body?.event ?? '').slice(0, 100);
    const message = String(body?.message ?? '').slice(0, 500);
    if (!event) return NextResponse.json({ ok: false }, { status: 400 });

    const prisma = await getPrisma();
    if (prisma) {
      await prisma.clientAuthErrorLog.create({ data: { event, message } }).catch(() => {});
    }
  } catch {
    /* diagnostic only */
  }
  return NextResponse.json({ ok: true });
}
