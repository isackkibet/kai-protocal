/**
 * GET /api/paystack/verify?reference=xxx
 * Verify a Paystack transaction by reference and persist it to Neon Postgres.
 *
 * Paystack flow:
 *   1. Frontend calls /api/paystack/initialize → gets authorization_url
 *   2. User pays on Paystack checkout
 *   3. Frontend (or the redirect page) calls this endpoint to confirm
 *   4. Paystack also sends a webhook (see /api/paystack/webhook) for
 *      server-authoritative settlement
 *
 * Response:
 *   success    boolean
 *   status     "success" | "failed" | "abandoned" | ...
 *   reference  string
 *   amountSubunits number (KES subunits)
 *   currency   string
 */

import { NextResponse } from "next/server";
import { verifyPayment } from "@/lib/paystack";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference");

  if (!reference) {
    return NextResponse.json({ error: "reference is required" }, { status: 400 });
  }

  try {
    const data = await verifyPayment(reference);
    if (!data) {
      return NextResponse.json({ success: false, status: "unknown" }, { status: 404 });
    }

    const success = data.status === "success";

    // Persist to Neon (idempotent upsert — the webhook is authoritative).
    try {
      await prisma.payment.upsert({
        where: { reference: data.reference },
        update: {
          status: data.status,
          amount_subunits: BigInt(data.amount),
          currency: data.currency,
          email: data.customer?.email ?? null,
          nft_id: (data.metadata?.nftId as string) ?? null,
          nft_name: (data.metadata?.nftName as string) ?? null,
          wallet: (data.metadata?.wallet as string) ?? null,
          metadata: data.metadata as object,
        },
        create: {
          reference: data.reference,
          status: data.status,
          amount_subunits: BigInt(data.amount),
          currency: data.currency,
          email: data.customer?.email ?? null,
          nft_id: (data.metadata?.nftId as string) ?? null,
          nft_name: (data.metadata?.nftName as string) ?? null,
          wallet: (data.metadata?.wallet as string) ?? null,
          metadata: data.metadata as object,
        },
      });
    } catch (e) {
      console.error("[/api/paystack/verify] DB persist error:", e);
    }

    return NextResponse.json({
      success,
      status: data.status,
      reference: data.reference,
      amountSubunits: data.amount,
      currency: data.currency,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Verification failed";
    console.error("[/api/paystack/verify]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}