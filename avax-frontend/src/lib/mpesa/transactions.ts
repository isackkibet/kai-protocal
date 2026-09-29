/**
 * src/lib/mpesa/transactions.ts
 *
 * Durable pending-transaction tracking for M-Pesa STK Push.
 *
 * ── Why this module exists ───────────────────────────────────────────────────
 * Safaricom's IPN callback is NOT authenticated. The Daraja API signs the
 * OAuth token request, but the callback body carries no HMAC and no signature
 * that we can verify. Anyone who can reach the URL can POST a fabricated
 * "ResultCode 0, amount 5000" payload and have the app believe a payment
 * succeeded.
 *
 * The fix is to stop treating the callback as evidence:
 *
 *   1. When we initiate an STK push we record what we EXPECT (amount, phone,
 *      checkoutRequestId) in Neon, keyed by a reference we generate.
 *   2. The callback is treated purely as a NOTIFICATION — "ask Safaricom
 *      about this checkoutRequestId". It is never the source of truth.
 *   3. We confirm the payment server-to-server via the STK Query API, using
 *      our own OAuth credentials, and only then mark the payment successful.
 *
 * So a forged callback fails at step 1 (unknown checkoutRequestId) or step 3
 * (Safaricom says no such transaction). The blast radius of a forgery attempt
 * is now "log noise" rather than "free NFTs".
 *
 * ── Why Neon and not an in-memory Map ────────────────────────────────────────
 * The previous implementation kept state in a module-level Map. On Vercel each
 * serverless instance has its own heap and the callback may be routed to a
 * different instance than the one that made the STK push, so the callback
 * would find no record and legitimate payments would be dropped. Durable
 * storage is required for correctness here, not just for convenience.
 */

import { prisma } from '@/lib/prisma';
import { stkQuery } from '@/lib/mpesa';

// ── Types ────────────────────────────────────────────────────────────────────

interface PendingMeta {
  checkoutRequestId: string;
  merchantRequestId?: string;
  /** KES the buyer was actually billed — the callback amount must match. */
  expectedAmountKes: number;
  /** Kept for reconciliation, never returned to the caller. */
  phoneNumber?: string;
  channel?: string;
  /** Owning session, used to scope the buyer's status polling. */
  privyUserId?: string;
}

export interface MarkedPayment {
  reference: string;
  status: 'success' | 'failed';
  receiptNumber?: string;
  paidAt?: string;
}

/** JSONB path filter helper so we don't repeat the array syntax. */
function metaEquals<K extends string>(key: K, value: string) {
  return { path: [key], equals: value } as const;
}

// ── Create ───────────────────────────────────────────────────────────────────

/**
 * Record an STK push we have just initiated. Returns the generated reference,
 * which is what the buyer's browser polls on.
 */
export async function createPendingStkTransaction(params: {
  amountKes: number;
  phoneNumber: string;
  checkoutRequestId: string;
  merchantRequestId?: string;
  nftId?: string;
  nftName?: string;
  wallet?: string;
  channel?: string;
  privyUserId?: string;
}): Promise<string> {
  const reference = `mpesa_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

  const meta: PendingMeta = {
    checkoutRequestId: params.checkoutRequestId,
    merchantRequestId: params.merchantRequestId,
    expectedAmountKes: params.amountKes,
    // Stored for reconciliation with Safaricom reports. Never returned by the
    // polling endpoint.
    phoneNumber: params.phoneNumber,
    channel: params.channel,
    privyUserId: params.privyUserId,
  };

  await prisma.payment.create({
    data: {
      reference,
      // amount_subunits is KES × 100 (kobo), matching the Paystack convention
      // used elsewhere in the app.
      amount_subunits: BigInt(Math.round(params.amountKes * 100)),
      currency: 'KES',
      status: 'pending',
      nft_id: params.nftId,
      nft_name: params.nftName,
      wallet: params.wallet,
      metadata: {
        provider: 'mpesa',
        state: 'pending',
        ...meta,
      },
    },
  });

  return reference;
}

// ── Confirm ──────────────────────────────────────────────────────────────────

export type ConfirmationOutcome =
  | { ok: true; status: 'success' | 'failed'; receiptNumber?: string; paidAt?: string; note?: string }
  | { ok: false; code: 'unknown_transaction' | 'provider_error' | 'already_settled'; note?: string };

/**
 * Confirm a checkoutRequestId against Safaricom and settle the payment.
 *
 * This is the only path that may write "success". It is safe to call more than
 * once: a transaction already in a terminal state is returned as-is.
 */
export async function confirmStkTransaction(
  checkoutRequestId: string,
  opts: { reportedAmountKes?: number } = {},
): Promise<ConfirmationOutcome> {
  const payment = await prisma.payment.findFirst({
    where: { metadata: metaEquals('checkoutRequestId', checkoutRequestId) },
  });

  // A callback for a checkoutRequestId we never issued is either a forgery or
  // a transaction from a different environment. Either way: not creditable.
  if (!payment) {
    return { ok: false, code: 'unknown_transaction' };
  }

  const meta = (payment.metadata ?? {}) as Partial<PendingMeta>;
  const expected = meta.expectedAmountKes ?? Number(payment.amount_subunits) / 100;

  if (payment.status === 'success') {
    return { ok: false, code: 'already_settled' };
  }

  /*
   * Cheap early filter: the callback body is untrusted, but if the amount it
   * claims does not even match what we billed, reject before spending an API
   * call. This is NOT the security boundary — a forger can state any amount —
   * the STK Query below is. It just filters junk cheaply.
   */
  if (
    typeof opts.reportedAmountKes === 'number' &&
    Math.abs(opts.reportedAmountKes - expected) > 0.01
  ) {
    console.warn(
      `[mpesa] callback amount ${opts.reportedAmountKes} != expected ${expected} ` +
      `for ${payment.reference} — rejecting`,
    );
    return { ok: false, code: 'unknown_transaction', note: 'amount_mismatch' };
  }

  // Ask Safaricom directly. This is the step that makes a forged callback
  // useless — the answer comes from them, over our authenticated channel.
  let result: Awaited<ReturnType<typeof stkQuery>>;
  try {
    result = await stkQuery(checkoutRequestId);
  } catch (err) {
    const note = err instanceof Error ? err.message : 'STK query failed';
    // Do NOT mark failed on a provider error: the user's money may have been
    // taken. Leave it pending so a retry or the polling fallback can settle it.
    return { ok: false, code: 'provider_error', note };
  }

  if (result.ResultCode !== '0') {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'failed',
        metadata: { ...(payment.metadata as object), state: 'failed', providerCode: result.ResultCode },
      },
    });
    return { ok: true, status: 'failed', note: result.ResultDesc };
  }

  /*
   * NOTE ON AMOUNT VERIFICATION
   * The STK Query response does not include the amount that was actually
   * charged, so we cannot confirm the charged figure from Safaricom at
   * confirmation time. The binding that matters is therefore:
   *   checkoutRequestId (issued by us)  +  Safaricom saying ResultCode 0.
   * A fabricated callback cannot produce that pairing, because Safaricom has
   * no record of a checkoutRequestId we never sent.
   *
   * Reconciling the true charged amount requires a Safaricom reconciliation
   * report against our shortcode — that is an operational task, not a
   * request-time check. See docs/SECURITY.md → "M-Pesa reconciliation".
   */
  const nowIso = new Date().toISOString();
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'success',
      metadata: {
        ...(payment.metadata as object),
        state: 'paid',
        confirmedVia: 'stk_query',
        confirmedAt: nowIso,
      },
    },
  });

  return { ok: true, status: 'success', paidAt: nowIso };
}

// ── Read (caller-facing, PII-free) ───────────────────────────────────────────

/**
 * Status for the buyer's own polling call.
 *
 * Deliberately returns NO phone number, receipt number or provider internals —
 * the old implementation spread all of those to anyone who guessed a
 * checkoutRequestId. Status is the only thing the client needs.
 */
export async function getTransactionStatus(
  reference: string,
): Promise<{ status: string } | null> {
  const payment = await prisma.payment.findUnique({
    where: { reference },
    select: { status: true },
  });
  return payment ? { status: payment.status } : null;
}

// ── Safaricom source-IP allowlist (defence in depth) ─────────────────────────

/**
 * Safaricom documents fixed source ranges for Daraja callbacks. This is NOT the
 * primary defence — those ranges can be spoofed at the network edge and Safaricom
 * does not always use them consistently — but rejecting obviously-unexpected
 * sources removes trivial noise before we spend an API call on them.
 *
 * Configure with MPESA_ALLOWED_IPS (comma-separated CIDR or exact IPs).
 * When unset, this check is skipped rather than defaulting to something that
 * might block real traffic.
 */
export function isAllowedSafaricomIp(ip: string): boolean {
  const configured = (process.env.MPESA_ALLOWED_IPS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (configured.length === 0) return true; // not configured → do not block

  if (configured.includes(ip)) return true;
  return configured.some((entry) => {
    if (!entry.includes('/')) return false;
    return cidrContains(entry, ip);
  });
}

function cidrContains(cidr: string, ip: string): boolean {
  const [range, bitsRaw] = cidr.split('/');
  const bits = Number(bitsRaw);
  if (!range || !Number.isInteger(bits) || bits < 0 || bits > 32) return false;

  const toInt = (addr: string): number | null => {
    const parts = addr.split('.');
    if (parts.length !== 4) return null;
    let out = 0;
    for (const p of parts) {
      if (!/^\d{1,3}$/.test(p)) return null;
      const n = Number(p);
      if (n > 255) return null;
      out = (out << 8) | n;
    }
    return out >>> 0;
  };

  const netInt = toInt(range);
  const ipInt = toInt(ip);
  if (netInt === null || ipInt === null) return false;

  if (bits === 0) return true;
  const mask = (0xffffffff << (32 - bits)) >>> 0;
  return (netInt & mask) === (ipInt & mask);
}
