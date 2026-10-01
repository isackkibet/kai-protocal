/**
 * POST /api/mpesa/query
 * Manually query the status of a pending STK Push from Safaricom.
 *
 * SECURITY: this route previously took an arbitrary `checkoutRequestId` from an
 * unauthenticated caller and proxied it straight to Safaricom's API with the
 * merchant's credentials. That made it an oracle: anyone could enumerate
 * checkout ids and learn whether a payment existed, while burning our Daraja
 * API quota (a self-inflicted denial of service on real customers).
 *
 * It is now authenticated, rate-limited, and accepts only a `reference` that
 * belongs to the caller — the same scoping the callback status route uses.
 */

import { NextResponse } from "next/server";
import { stkQuery } from "@/lib/payments/mpesa";
import { confirmStkTransaction } from "@/lib/payments/mpesa-transactions";
import { prisma } from "@/lib/db/prisma";
import { verifyPrivyUserId } from "@/lib/auth/privy-server";
import { requireRateLimit } from "@/lib/security/route-guard";
import { readJsonBody } from "@/lib/security/input";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Each call consumes a Daraja API token/rate-limit slot.
  const limited = await requireRateLimit(request, [
    { scope: "ip", limit: 5, windowMs: 60_000 },
  ]);
  if (!limited.ok) return limited.response;

  const caller = await verifyPrivyUserId(request.headers.get("authorization"));
  if (!caller) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await readJsonBody(request)) as Record<string, unknown>;
    const reference = body.reference;

    if (typeof reference !== "string" || !/^mpesa_[0-9a-f_]{1,64}$/.test(reference)) {
      return NextResponse.json({ error: "reference is required" }, { status: 400 });
    }

    // Scope to the caller's own transaction before touching Safaricom at all.
    const payment = await prisma.payment.findFirst({
      where: { reference, metadata: { path: ["privyUserId"], equals: caller } },
      select: { id: true, status: true, metadata: true },
    });

    if (!payment) {
      return NextResponse.json({ status: "pending" });
    }

    // Already settled — no need to spend an API call.
    if (payment.status === "success" || payment.status === "failed") {
      return NextResponse.json({ status: payment.status });
    }

    // Still pending: go ask Safaricom, then settle from their answer.
    const checkoutRequestId =
      (payment.metadata as { checkoutRequestId?: string })?.checkoutRequestId;

    if (!checkoutRequestId) {
      return NextResponse.json({ status: "pending" });
    }

    const outcome = await confirmStkTransaction(checkoutRequestId);
    if (!outcome.ok) {
      // Includes provider_error (Safaricom unreachable) and unknown_transaction.
      // In every non-settled case the honest answer is "still pending" — the
      // customer's money may well be fine and the callback may still arrive.
      // Never report failure on a transient provider problem.
      return NextResponse.json({ status: "pending" });
    }

    return NextResponse.json({ status: outcome.status });
  } catch (err: unknown) {
    console.error("[/api/mpesa/query]", err instanceof Error ? err.message : "failed");
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }
}
