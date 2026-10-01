/**
 * POST /api/mpesa/callback
 * Receives Safaricom's IPN (Instant Payment Notification) after the user
 * confirms or cancels the STK push on their phone.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SECURITY MODEL — read this before changing anything
 *
 * Safaricom's IPN is NOT signed. There is no HMAC, no shared secret and no
 * verifiable signature on the body. The previous implementation of this route
 * trusted it outright: any anonymous POST containing
 *   {"Body":{"stkCallback":{"ResultCode":0,…,"Amount":1}}}
 * would be recorded as a completed payment, and the GET side-effect would
 * then report success to the caller. That was a free-money vulnerability.
 *
 * The callback is therefore NOT evidence of payment. It is only a signal that
 * we should go ASK SAFARICOM. The flow is:
 *
 *   callback arrives
 *     → optional source-IP allowlist          (noise filter, not security)
 *     → look up the checkoutRequestId we issued  → unknown ⇒ reject
 *     → STK Query API against Safaricom, authenticated with our OAuth token
 *     → Safaricom says ResultCode 0 ⇒ settle
 *
 * A forged callback dies at the lookup (no such transaction) or at the query
 * (Safaricom has no record of it). Safaricom additionally requires a 200
 * response to every callback regardless, so all failure paths return 200 with
 * the exact body it expects — while doing nothing.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * For local dev use:  ngrok http 3000  and set MPESA_CALLBACK_URL
 */

import { NextResponse } from 'next/server';
import { parseCallback, type MpesaCallback } from '@/lib/payments/mpesa';
import {
  confirmStkTransaction,
  isAllowedSafaricomIp,
} from '@/lib/payments/mpesa-transactions';
import { getClientIp } from '@/lib/security/client-ip';

export const dynamic = 'force-dynamic';

/** Safaricom requires this exact shape and a 200 for every delivery. */
function safaricomAck() {
  return NextResponse.json({ ResultCode: '00', ResultDesc: 'Success' });
}

export async function POST(request: Request) {
  // Defence in depth: reject unexpected sources before doing any work.
  const ip = getClientIp(request);
  if (!isAllowedSafaricomIp(ip)) {
    console.warn(`[/api/mpesa/callback] rejected source ip=${ip}`);
    return safaricomAck();
  }

  let body: MpesaCallback;
  try {
    body = (await request.json()) as MpesaCallback;
  } catch {
    // Malformed JSON — acknowledge and drop.
    return safaricomAck();
  }

  let parsed: ReturnType<typeof parseCallback>;
  try {
    parsed = parseCallback(body);
  } catch (err) {
    console.error('[/api/mpesa/callback] unparseable IPN:', err);
    return safaricomAck();
  }

  const { checkoutRequestId, success, amount } = parsed;

  try {
    // Failures only — a successful callback is a request to confirm.
    if (!success) {
      console.warn(
        `[M-Pesa FAIL] code ${parsed.resultCode} (${parsed.resultDesc}) ` +
        `checkout=${checkoutRequestId}`,
      );
      // A failure notification from Safaricom still goes through our own
      // confirmation path so the DB reflects reality rather than the payload.
      await confirmStkTransaction(checkoutRequestId);
      return safaricomAck();
    }

    const outcome = await confirmStkTransaction(checkoutRequestId, {
      reportedAmountKes: amount,
    });

    if (outcome.ok && outcome.status === 'success') {
      // Log the receipt only — never the phone number.
      console.log(`[M-Pesa OK] confirmed via STK Query checkout=${checkoutRequestId}`);
    } else if (!outcome.ok) {
      // Distinguish "someone is forging callbacks" from "Safaricom is down".
      if (outcome.code === 'unknown_transaction') {
        console.warn(
          `[/api/mpesa/callback] no matching pending transaction for ` +
          `checkout=${checkoutRequestId} — treating as forged and ignoring`,
        );
      } else {
        console.error(
          `[/api/mpesa/callback] confirmation deferred (${outcome.code}): ${outcome.note ?? ''}`,
        );
      }
    }
  } catch (err) {
    // Never 500 to Safaricom: it would retry the same forged/irrelevant
    // payload forever. Acknowledge and let reconciliation sort it out.
    console.error('[/api/mpesa/callback] processing error:', err);
  }

  return safaricomAck();
}

/**
 * GET /api/mpesa/status?reference=mpesa_…
 *
 * Polling endpoint for the buyer's browser.
 *
 * The old version of this route took a `checkoutRequestId` and returned the
 * whole stored record — including the payer's phone number and M-Pesa receipt
 * — to anyone who passed a guessable id. That was a PII disclosure bug.
 *
 * Now it returns status only, requires an authenticated session, and scopes
 * the lookup so one buyer cannot enumerate another buyer's transactions.
 */
export async function GET(request: Request) {
  const { verifyPrivyUserId } = await import('@/lib/auth/privy-server');
  const caller = await verifyPrivyUserId(request.headers.get('authorization'));
  if (!caller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const reference = searchParams.get('reference');
  if (!reference || !/^mpesa_[0-9a-f_]{1,64}$/.test(reference)) {
    return NextResponse.json({ error: 'reference required' }, { status: 400 });
  }

  const { prisma } = await import('@/lib/db/prisma');

  /*
   * Scoped at the QUERY level, not by fetching then comparing: filtering in
   * the `where` means a caller cannot use this endpoint to discover whether
   * someone else's reference exists (no 200-vs-404 oracle), and the row's
   * metadata — which holds the payer phone number — is never loaded onto the
   * server for a request that isn't theirs.
   */
  const payment = await prisma.payment.findFirst({
    where: {
      reference,
      metadata: { path: ['privyUserId'], equals: caller },
    },
    select: { status: true },
  });

  if (!payment) {
    return NextResponse.json({ status: 'pending' });
  }

  return NextResponse.json({ status: payment.status });
}
