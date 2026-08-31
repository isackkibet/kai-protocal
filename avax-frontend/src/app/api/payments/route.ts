/**
 * GET /api/payments?wallet=0x...   (or ?reference=xxx)
 * Fetch payment records persisted to Neon Postgres (via Prisma) for a wallet
 * or single reference. This is the persistent payment store.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PaymentRow = {
  id: string;
  reference: string;
  amount_subunits: bigint;
  currency: string;
  status: string;
  email: string | null;
  nft_id: string | null;
  nft_name: string | null;
  wallet: string | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
};

function serialize(row: PaymentRow) {
  return {
    ...row,
    amount_subunits: row.amount_subunits.toString(), // BigInt -> string for JSON
    metadata: row.metadata ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet");
  const reference = searchParams.get("reference");

  if (!wallet && !reference) {
    return NextResponse.json({ error: "wallet or reference is required" }, { status: 400 });
  }

  try {
    if (reference) {
      const payment = await prisma.payment.findUnique({
        where: { reference },
      });
      return NextResponse.json({ payment: payment ? serialize(payment) : null });
    }

    const payments = await prisma.payment.findMany({
      where: wallet ? { wallet } : undefined,
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ payments: payments.map(serialize) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Query failed";
    console.error("[/api/payments]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}