/**
 * GET  /api/paystack/verify?reference=<ref>
 * POST /api/paystack/verify  { reference }
 *
 * Checks the Paystack transaction status and updates the Neon DB record.
 *
 * Response:
 *   status     "success" | "failed" | "abandoned" | "pending"
 *   reference  string
 *   amountKes  number
 *   paidAt     string | null
 */

import { NextResponse } from "next/server";
import { verifyTransaction } from "@/lib/paystack";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function handle(reference: string) {
  if (!reference) {
    return NextResponse.json({ error: "reference is required" }, { status: 400 });
  }

  try {
    const tx = await verifyTransaction(reference);

    // Persist updated status
    await prisma.payment.updateMany({
      where: { reference },
      data:  { status: tx.status },
    });

    // Public, unauthenticated poll: return status only. The payer's email
    // is personal data and anyone holding a reference could read it.
    return NextResponse.json({
      status:    tx.status,
      reference: tx.reference,
      amountKes: Math.round(tx.amount / 100), // kobo → KES
      paidAt:    tx.paidAt ?? null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Verify failed";
    // Paystack's own "not found" is a client error, not a server fault.
    if (/not found/i.test(message)) {
      return NextResponse.json({ error: "Transaction reference not found." }, { status: 404 });
    }
    console.error("[/api/paystack/verify]", message);
    return NextResponse.json({ error: "Could not verify the payment. Please try again." }, { status: 502 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return handle(searchParams.get("reference") ?? "");
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return handle((body as { reference?: string }).reference ?? "");
}
