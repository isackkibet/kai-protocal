/**
 * POST /api/paystack/webhook
 * Server-authoritative payment confirmation from Paystack.
 *
 * Paystack POSTs to this URL after every transaction event. The payload is
 * HMAC-SHA512 signed with the secret key in the `x-paystack-signature` header —
 * the signature is verified before any state is changed.
 *
 * Events handled:
 *   charge.success        → mark payment as paid
 *   (others are logged and acknowledged)
 *
 * Must be publicly reachable over HTTPS. For local dev use:
 *   ngrok http 3000  and set PAYSTACK_WEBHOOK_URL on the Paystack dashboard
 *   to https://yourdomain.ngrok-free.app/api/paystack/webhook
 *
 * This is the authoritative source of truth for payment status. The
 * /verify endpoint is only used for immediate UX feedback.
 */

import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/paystack";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  // Always verify before trusting the payload.
  const valid = await verifyWebhookSignature(rawBody, signature);
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: {
    event: string;
    data?: {
      reference?: string;
      status?: string;
      amount?: number;
      currency?: string;
      metadata?: Record<string, unknown>;
    };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  console.log(`[Paystack webhook] ${event.event}`);

  if (event.event === "charge.success" && event.data?.reference) {
    const data = event.data;
    const reference = data.reference!; // narrowed string (guarded above)
    try {
      const status = data.status === "success" ? "success" : "failed";
      await prisma.payment.upsert({
        where: { reference },
        update: {
          status,
          amount_subunits: data.amount ? BigInt(data.amount) : undefined,
          currency: data.currency ?? undefined,
          metadata: data.metadata as object,
        },
        create: {
          reference,
          status,
          amount_subunits: data.amount ? BigInt(data.amount) : 0n,
          currency: data.currency ?? "KES",
          metadata: data.metadata as object,
        },
      });
      console.log(`[Paystack] payment ${reference} → ${status}`);
    } catch (e) {
      console.error("[Paystack webhook] DB update error:", e);
    }
  }

  // Acknowledge every event so Paystack stops retrying.
  return NextResponse.json({ received: true });
}

/** Reject non-POST requests. */
export async function GET() {
  return NextResponse.json({ message: "Webhook only accepts POST" }, { status: 405 });
}