/**
 * POST /api/paystack/webhook
 *
 * Paystack sends this when a payment is completed, failed, or refunded.
 * In Paystack Dashboard → Settings → Webhooks, add:
 *   https://<your-domain>/api/paystack/webhook
 *
 * ── Trust model ──────────────────────────────────────────────────────────────
 * The HMAC signature proves the event came from Paystack and was not altered in
 * transit. It does NOT prove the amount is the amount we expected — that check
 * is ours, and it was missing. A customer could pay a trivially small amount
 * against a reference belonging to an expensive order and have the expensive
 * order marked paid.
 *
 * The price is now resolved server-side at initiate time (see
 * /api/paystack/initiate and lib/catalog.ts), and this handler re-checks the
 * settled amount against the stored `amount_subunits` before writing "success".
 * Mismatch → refuse to settle and log loudly.
 *
 * Flow: 1. verify HMAC  2. load our order  3. check amount  4. mark success
 */

import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/payments/paystack";
import { prisma } from "@/lib/db/prisma";
import { settleMuralPayment } from "@/lib/murals/checkout";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const rawBody  = await request.text();
    const sigHeader = request.headers.get("x-paystack-signature") ?? "";

    if (!verifyWebhookSignature(rawBody, sigHeader)) {
      console.warn("[/api/paystack/webhook] Invalid signature — ignored.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody) as {
      event: string;
      data: {
        reference:  string;
        status:     string;
        amount:     number;
        currency:   string;
        paid_at:    string;
        customer:   { email: string; phone?: string };
        metadata?:  Record<string, unknown>;
      };
    };

    const { event: eventName, data } = event;

    if (eventName === "charge.success") {
      const payment = await prisma.payment.findUnique({
        where: { reference: data.reference },
        select: { id: true, status: true, amount_subunits: true, metadata: true },
      });

      // A valid signature for a reference we never issued means the event is
      // genuine but belongs to another environment/account. Nothing to settle.
      if (!payment) {
        console.warn(`[/api/paystack/webhook] no order for reference ${data.reference}`);
        return NextResponse.json({ received: true });
      }

      // ── Amount verification ───────────────────────────────────────────────
      // amount_subunits is stored in kobo; Paystack sends `amount` in kobo too.
      const expectedKobo = Number(payment.amount_subunits);
      const receivedKobo = Number(data.amount);

      if (!Number.isFinite(receivedKobo) || receivedKobo !== expectedKobo) {
        console.error(
          `[paystack/webhook] AMOUNT MISMATCH ref=${data.reference}: ` +
          `expected ${expectedKobo} kobo, received ${receivedKobo} kobo — NOT settling`,
        );
        // Deliberately not settled. Do not mark failed either: the customer did
        // pay, so a human/ops review or refund is the correct resolution.
        return NextResponse.json({ received: true });
      }

      // Idempotency: re-delivery of a settled order must not double-credit.
      if (payment.status === "success") {
        return NextResponse.json({ received: true });
      }

      await prisma.payment.update({
        where: { id: payment.id },
        data:  {
          status:   "success",
          metadata: JSON.parse(JSON.stringify({
            ...(typeof payment.metadata === "object" && payment.metadata ? payment.metadata : {}),
            paidAt:      data.paid_at,
            // Email only. Deliberately NOT storing the phone number — the
            // webhook does not need it and it is personal data.
            email:       data.customer.email,
            amountKobo:  data.amount,
            paystackMeta: data.metadata ?? null,
          })),
        },
      });
      console.log(`[paystack/webhook] charge.success — ref: ${data.reference}`);
      // A mural sale: mark it sold and tell the CFA team who bought it.
      if ((payment.metadata as { kind?: string } | null)?.kind === "mural") {
        await settleMuralPayment(prisma, data.reference).catch((e) => console.error("[paystack/webhook] mural settle failed", e instanceof Error ? e.message : e));
      }
    } else if (eventName === "charge.failed") {
      await prisma.payment.updateMany({
        where: { reference: data.reference, status: { not: "success" } },
        data:  { status: "failed" },
      });
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook error";
    console.error("[/api/paystack/webhook]", message);
    // Never echo the parser error back — it can contain payload fragments.
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
