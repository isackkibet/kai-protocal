import type { Prisma, PrismaClient } from '@prisma/client';
import { verifyTransaction } from '@/lib/payments/paystack';

/**
 * Mural payments through Paystack (M-Pesa or card).
 *
 * The price always comes from the mural row, never from the browser. A
 * payment settles only when Paystack says "success" AND the amount equals
 * what we asked for. Settling marks the mural sold and records the buyer as
 * an enquiry so the CFA team sees who to deliver to. It is idempotent: the
 * webhook and the buyer's return page can both call it.
 *
 * Off unless MURAL_CHECKOUT_ENABLED=true (the Paystack key is live, so
 * this takes real money).
 */

// Tolerant of how the value was pasted in Vercel: spaces, a new line,
// quotes or capitals ("True", "yes", "1", "on") all count as on.
export const muralCheckoutEnabled = () =>
  /^(true|yes|1|on)$/i.test((process.env.MURAL_CHECKOUT_ENABLED ?? '').trim().replace(/^["']|["']$/g, ''));

export interface MuralPaymentMeta {
  kind: 'mural';
  muralId: string;
  slug: string;
  buyer: { name: string; phone: string | null };
  priceKes: number;
  settledAt?: string;
  conflict?: string;
}

const isMuralMeta = (m: unknown): m is MuralPaymentMeta =>
  !!m && typeof m === 'object' && (m as { kind?: string }).kind === 'mural' && typeof (m as { muralId?: unknown }).muralId === 'string';

export type SettleResult = { state: 'paid' | 'pending' | 'failed' | 'not_found' | 'conflict' };

export async function settleMuralPayment(prisma: PrismaClient, reference: string): Promise<SettleResult> {
  const payment = await prisma.payment.findUnique({ where: { reference }, select: { id: true, status: true, amount_subunits: true, email: true, metadata: true } });
  if (!payment || !isMuralMeta(payment.metadata)) return { state: 'not_found' };
  const meta = payment.metadata as unknown as MuralPaymentMeta;
  if (meta.settledAt) return { state: meta.conflict ? 'conflict' : 'paid' };

  const tx = await verifyTransaction(reference);
  if (tx.status !== 'success') {
    if (tx.status === 'failed' || tx.status === 'abandoned') {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: tx.status } });
      return { state: 'failed' };
    }
    return { state: 'pending' };
  }
  if (Number(tx.amount) !== Number(payment.amount_subunits)) {
    // Paid, but not what we asked: a person must review (refund or top up).
    console.error(`[murals/checkout] AMOUNT MISMATCH ref=${reference}: expected ${payment.amount_subunits}, got ${tx.amount}`);
    return { state: 'pending' };
  }

  return prisma.$transaction(async (tx2) => {
    const sold = await tx2.mural.updateMany({ where: { id: meta.muralId, status: { in: ['available', 'reserved'] } }, data: { status: 'sold' } });
    const conflict = sold.count === 0 ? 'The mural was already sold when this payment arrived. Refund or offer another mural.' : undefined;
    if (conflict) console.error(`[murals/checkout] ${conflict} ref=${reference}`);
    await tx2.payment.update({
      where: { id: payment.id },
      data: { status: 'success', metadata: { ...meta, settledAt: new Date().toISOString(), ...(conflict ? { conflict } : {}) } as unknown as Prisma.InputJsonValue },
    });
    await tx2.muralEnquiry.create({
      data: {
        muralId: meta.muralId, name: meta.buyer.name, phone: meta.buyer.phone, email: payment.email, status: 'new',
        message: `PAID KES ${meta.priceKes.toLocaleString()} via Paystack (ref ${reference}).${conflict ? ` ${conflict}` : ' Arrange delivery.'}`,
      },
    });
    return { state: conflict ? 'conflict' : 'paid' } as SettleResult;
  });
}
