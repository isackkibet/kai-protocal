/**
 * src/lib/paystack.ts
 * Paystack payment service module (Nigeria / Africa cards, bank, USSD, mobile money).
 *
 * Uses Paystack's REST API directly (no SDK dependency needed).
 *
 * Environment variables (set in .env.local — NEVER commit real values):
 *   PAYSTACK_SECRET_KEY   Live/test secret key (sk_...). Server-side only.
 *   NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY  Publishable key (pk_...). Used in the browser
 *                                    to open the Paystack checkout popup.
 *
 * Currency: this merchant account is configured for KES (Kenyan Shillings),
 * confirmed via the /balance endpoint. All amounts are in the currency's
 * smallest sub-unit (1 KES = 100 subunits, same convention as NGN/kobo).
 *
 * Key endpoints:
 *   POST /transaction/initialize            → creates a checkout session (returns auth_url)
 *   GET  /transaction/verify/:reference     → confirms a payment status
 *   Webhook POST /transaction/verify        → Paystack notifies your server (signature verified)
 */

const BASE_URL = "https://api.paystack.co";

const secretKey = process.env.PAYSTACK_SECRET_KEY ?? "";
export const paystackPublicKey =
  process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "";

function isConfigured(): boolean {
  return Boolean(secretKey);
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/json",
  };
}

export interface InitializeRequest {
  /** Positive amount in the currency's smallest unit (1 KES = 100 subunits). */
  amount: number;
  email: string;
  reference?: string;
  currency?: string;
  metadata?: Record<string, unknown>;
  callback_url?: string;
}

export interface InitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

/**
 * Create a Paystack checkout session.
 * Returns the authorization_url to redirect the user to (or open in a popup).
 *
 * @param amount  Amount in the currency's smallest sub-unit (1 KES = 100 subunits).
 */
export async function initializePayment(
  req: InitializeRequest,
): Promise<InitializeResponse["data"]> {
  if (!isConfigured()) {
    throw new Error("PAYSTACK_SECRET_KEY must be set in .env.local");
  }

  const res = await fetch(`${BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      amount: req.amount,
      email: req.email,
      reference: req.reference,
      currency: req.currency ?? "KES", // merchant is configured for KES
      metadata: req.metadata,
      callback_url: req.callback_url,
    }),
  });

  const data = (await res.json()) as InitializeResponse;
  if (!res.ok || !data.status) {
    throw new Error(data.message || `Paystack initialize failed (${res.status})`);
  }

  return data.data;
}

export interface VerifyResponse {
  status: boolean;
  message: string;
  data: {
    status: string; // "success" | "abandoned" | "failed" | ...
    reference: string;
    amount: number; // in kobo
    currency: string;
    paid_at?: string;
    created_at?: string;
    customer?: { email?: string };
    metadata?: Record<string, unknown>;
  };
}

/**
 * Verify a transaction by reference.
 * Returns null if the reference is unknown.
 */
export async function verifyPayment(
  reference: string,
): Promise<VerifyResponse["data"] | null> {
  if (!isConfigured()) throw new Error("PAYSTACK_SECRET_KEY must be set");

  const res = await fetch(`${BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: authHeaders(),
  });

  const data = (await res.json()) as VerifyResponse;
  if (res.status === 404 || !data.status) return null;

  return data.data;
}

/**
 * Verify the signature of a Paystack webhook request.
 * Paystack signs each webhook payload with the secret key using HMAC-SHA512,
 * sent in the `x-paystack-signature` header.
 */
export async function verifyWebhookSignature(
  body: string,
  signature: string | null,
): Promise<boolean> {
  if (!isConfigured()) return false;
  if (!signature) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secretKey),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );

  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body),
  );

  const expected = Buffer.from(sig).toString("hex");
  const provided = signature.toLowerCase();
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** Format a value in KES (shillings) from an amount in subunits. */
export function subunitsToShillings(subunits: number | bigint): number {
  return Number(subunits) / 100;
}

/** Convert a USD/yBOB amount to KES subunits using a fixed rate (default ~130 KES per USD). */
export const KES_PER_USD = parseFloat(process.env.PAYSTACK_KES_PER_USD ?? "130");
export function usdToSubunits(usdAmount: number): number {
  return Math.ceil(usdAmount * KES_PER_USD * 100);
}
