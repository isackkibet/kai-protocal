/**
 * POST /api/paystack/initiate
 *
 * Initialises a Paystack transaction and returns the hosted checkout URL.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SECURITY: the server owns the price and the reference
 *
 * This endpoint previously read `priceUsd` and `reference` from the request
 * body and used them verbatim. Two consequences, both exploited in a single
 * chain:
 *
 *   1. The CUSTOMER CHOSE THE PRICE. /app/connft shipped the catalogue in
 *      client JavaScript and posted `nft.price`; the server billed it.
 *   2. The CUSTOMER CHOSE THE REFERENCE, and the webhook matches on reference.
 *
 * So an attacker could create a pending order at the real price, then start a
 * second transaction with the same reference at priceUsd = 0.01, pay the
 * 1-kobo charge (a genuine Paystack event with a genuinely valid HMAC), and
 * the webhook would mark the expensive order as paid. Signature verification
 * does not help here — the forged-order attack produces real payments.
 *
 * Now:
 *   - `productId` (or `nftId`) → price comes from lib/catalog.ts, full stop.
 *     A price in the body is ignored.
 *   - A transfer flow may send `amountUsd`, but only when authenticated and
 *     only within TRANSFER_LIMITS_USD.
 *   - `reference` is minted server-side. Anything sent by the client is
 *     discarded, which also removes the status-reset-by-upsert problem.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Body:
 *   email       string   Customer email (required by Paystack)
 *   productId?  string   Catalogue id, e.g. "nft5". Price resolved server-side.
 *   amountUsd?  number   Transfer-style amount. Requires auth. Bounds-checked.
 *   wallet?     string   Buyer's on-chain wallet address
 *
 * Response (201):
 *   authorizationUrl  string   Open this URL to pay
 *   reference         string   Use this to poll /verify
 *   amountKes         number   KES amount charged
 */

import { NextResponse } from "next/server";
import { initializeTransaction, usdToKobo, usdToKes } from "@/lib/payments/paystack";
import { prisma } from "@/lib/db/prisma";
import { verifyPrivyUserId } from "@/lib/auth/privy-server";
import {
  resolveCatalogItem,
  isValidTransferAmount,
  TRANSFER_LIMITS_USD,
} from "@/lib/payments/catalog";
import { readJsonBody, requireString, optionalString, InputError } from "@/lib/security/input";
import { requireRateLimit } from "@/lib/security/route-guard";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // Tight budget: every accepted call costs a real Paystack API request.
    const limited = await requireRateLimit(request, [
      { scope: "ip", limit: 10, windowMs: 60_000 },
    ]);
    if (!limited.ok) return limited.response;

    const body = (await readJsonBody(request)) as Record<string, unknown>;

    const email = requireString(body, "email", { max: 254, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ });
    const wallet  = optionalString(body, "wallet", { max: 64 });
    const productId = optionalString(body, "productId", { max: 32 })
                  ?? optionalString(body, "nftId", { max: 32 });

    // ── Price resolution: the authoritative step ────────────────────────────
    const item = resolveCatalogItem(productId);

    let priceUsd: number;
    let label: string;

    if (item) {
      // Catalogue purchase. Client-sent price is deliberately not read.
      priceUsd = item.priceUsd;
      label = item.name;
    } else {
      // Transfer flow — the amount really is user-chosen, so it must be
      // authenticated and bounded instead of price-resolved.
      const caller = await verifyPrivyUserId(request.headers.get("authorization"));
      if (!caller) {
        return NextResponse.json(
          { error: "Sign in to make a transfer payment." },
          { status: 401 },
        );
      }

      const requested = body.amountUsd ?? body.priceUsd;
      const amount = typeof requested === "string" ? Number(requested) : requested;

      if (typeof amount !== "number" || !isValidTransferAmount(amount)) {
        return NextResponse.json(
          {
            error:
              `Transfer amount must be between $${TRANSFER_LIMITS_USD.min} ` +
              `and $${TRANSFER_LIMITS_USD.max}.`,
          },
          { status: 400 },
        );
      }
      priceUsd = amount;
      label = optionalString(body, "nftName", { max: 64 }) ?? "Transfer";
    }

    const amountKobo = usdToKobo(priceUsd);
    const amountKes  = usdToKes(priceUsd);

    // ── Reference: minted here, never accepted from the client ──────────────
    // crypto.randomUUID is used rather than Math.random, which the old client
    // code used and which is not collision-resistant.
    const reference = `kai_${item ? item.id : "xfer"}_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;

    await prisma.payment.create({
      data: {
        reference,
        amount_subunits: BigInt(amountKobo),
        currency:        "KES",
        status:          "pending",
        email,
        nft_id:          item?.id ?? null,
        nft_name:        label,
        wallet,
        metadata:        {
          priceUsd,
          source: item ? "catalog" : "transfer",
          provider: "paystack",
        },
      },
    });

    const result = await initializeTransaction({
      email,
      amountKobo,
      reference,
      metadata:  { productId: item?.id ?? null, priceUsd },
      channels:  ["mobile_money", "card"],
    });

    return NextResponse.json(
      {
        authorizationUrl: result.authorizationUrl,
        reference:        result.reference,
        amountKes,
        amountKobo,
        productId:        item?.id ?? null,
        productName:      label,
      },
      { status: 201 },
    );
  } catch (err: unknown) {
    if (err instanceof InputError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    // Never echo provider internals — it can contain account/secret fragments.
    console.error("[/api/paystack/initiate]", err instanceof Error ? err.message : "unknown error");
    return NextResponse.json({ error: "Could not start the payment." }, { status: 500 });
  }
}
