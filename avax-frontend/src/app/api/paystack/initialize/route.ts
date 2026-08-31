/**
 * POST /api/paystack/initialize
 * Create a Paystack checkout session for an NFT / token purchase.
 *
 * Body:
 *   email    string   Buyer email
 *   priceUsd number   Price in USD/yBOB (converted to KES subunits server-side)
 *   nftId    string   NFT id being purchased (e.g. "nft5")
 *   nftName  string   Human-readable NFT name
 *   wallet   string   Buyer wallet address (optional)
 *
 * Response (201):
 *   authorizationUrl  string   Redirect the user here (or open in a popup)
 *   reference         string   Use this to verify/query the payment
 *   accessCode        string   Use with the in-browser Paystack popup SDK
 *   amountSubunits    number   Amount charged (KES subunits)
 */

import { NextResponse } from "next/server";
import { initializePayment } from "@/lib/paystack";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, priceUsd, nftId, nftName, wallet } = body as {
      email: string;
      priceUsd: number;
      nftId?: string;
      nftName?: string;
      wallet?: string;
    };

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }
    if (!priceUsd || priceUsd <= 0) {
      return NextResponse.json({ error: "A valid price is required" }, { status: 400 });
    }

    const reference = `KAI-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const amountSubunits = Math.ceil(priceUsd * 130 * 100); // KES subunits

    const paystack = await initializePayment({
      amount: amountSubunits,
      email,
      reference,
      currency: "KES",
      metadata: { nftId, nftName, wallet, priceUsd },
      callback_url: process.env.NEXT_PUBLIC_PAYSTACK_REDIRECT_URL || undefined,
    });

    return NextResponse.json(
      {
        authorizationUrl: paystack.authorization_url,
        accessCode: paystack.access_code,
        reference: paystack.reference,
        amountSubunits,
      },
      { status: 201 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Paystack initialize failed";
    console.error("[/api/paystack/initialize]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}