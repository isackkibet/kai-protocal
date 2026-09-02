/**
 * src/lib/paystack.ts
 *
 * Server-side Paystack helper.  Mirrors the shape of lib/mpesa.ts so
 * existing API routes can swap with minimal surface changes.
 *
 * Required env vars (in avax-frontend/.env.local):
 *   PAYSTACK_SECRET_KEY        Live or test secret key (sk_live_… / sk_test_…)
 *   NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY  Public key — safe for the browser
 *   PAYSTACK_KES_PER_USD       Conversion rate (default: 130)
 */

const SECRET_KEY   = process.env.PAYSTACK_SECRET_KEY ?? "";
const KES_PER_USD  = parseFloat(process.env.PAYSTACK_KES_PER_USD ?? "130");
const BASE_URL     = "https://api.paystack.co";

if (!SECRET_KEY && process.env.NODE_ENV !== "test") {
  console.warn("[paystack] PAYSTACK_SECRET_KEY is not set — payments will fail.");
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${SECRET_KEY}`,
    "Content-Type": "application/json",
  };
}

/** Convert USD/yBOB amount to KES kobo (1 KES = 100 kobo). */
export function usdToKobo(usd: number): number {
  return Math.ceil(usd * KES_PER_USD * 100); // kobo
}

/** Convert USD/yBOB amount to KES whole units. */
export function usdToKes(usd: number): number {
  return Math.ceil(usd * KES_PER_USD);
}

// ── Initialize transaction ────────────────────────────────────────────────────

export interface InitializeOptions {
  email:      string;
  amountKobo: number;        // amount in kobo (KES × 100)
  reference?: string;        // unique ref; auto-generated if omitted
  callbackUrl?: string;      // redirect URL after hosted checkout
  metadata?: Record<string, unknown>;
  channels?: string[];       // e.g. ["mobile_money", "card"]
}

export interface InitializeResult {
  authorizationUrl: string;
  accessCode:       string;
  reference:        string;
}

export async function initializeTransaction(
  opts: InitializeOptions,
): Promise<InitializeResult> {
  const body: Record<string, unknown> = {
    email:    opts.email,
    amount:   opts.amountKobo,
    currency: "KES",
    channels: opts.channels ?? ["mobile_money", "card"],
  };
  if (opts.reference)  body.reference   = opts.reference;
  if (opts.callbackUrl) body.callback_url = opts.callbackUrl;
  if (opts.metadata)   body.metadata    = opts.metadata;

  const res  = await fetch(`${BASE_URL}/transaction/initialize`, {
    method:  "POST",
    headers: headers(),
    body:    JSON.stringify(body),
  });
  const json = await res.json();

  if (!json.status) {
    throw new Error(json.message ?? "Paystack initialize failed");
  }

  return {
    authorizationUrl: json.data.authorization_url,
    accessCode:       json.data.access_code,
    reference:        json.data.reference,
  };
}

// ── Verify transaction ────────────────────────────────────────────────────────

export interface PaystackTransaction {
  reference:  string;
  status:     "success" | "failed" | "abandoned" | string;
  amount:     number;     // kobo
  currency:   string;
  paidAt:     string;
  customer:   { email: string; phone?: string };
  metadata:   Record<string, unknown>;
}

export async function verifyTransaction(
  reference: string,
): Promise<PaystackTransaction> {
  const res  = await fetch(`${BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: headers(),
  });
  const json = await res.json();

  if (!json.status) {
    throw new Error(json.message ?? "Paystack verify failed");
  }

  const d = json.data;
  return {
    reference:  d.reference,
    status:     d.status,
    amount:     d.amount,
    currency:   d.currency,
    paidAt:     d.paid_at,
    customer:   { email: d.customer.email, phone: d.customer.phone },
    metadata:   d.metadata ?? {},
  };
}

// ── Webhook signature check ───────────────────────────────────────────────────

import crypto from "crypto";

/**
 * Verify that an incoming webhook request genuinely came from Paystack.
 * Call with the raw request body (as a string/Buffer) and the
 * x-paystack-signature header value.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
): boolean {
  const hash = crypto
    .createHmac("sha512", SECRET_KEY)
    .update(rawBody)
    .digest("hex");
  return hash === signature;
}
