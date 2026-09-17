/**
 * Minimal admin gate for internal/business-only endpoints (e.g. sending money
 * out via M-Pesa B2C, registering a creator's payout destination) that have
 * no per-user ownership concept yet — a valid Privy login isn't enough to
 * call these, since any signed-up user shouldn't be able to.
 *
 * Fails CLOSED: if ADMIN_API_KEY isn't configured, every request is
 * rejected rather than allowed through unauthenticated.
 */
export function isAuthorizedAdmin(req: Request): boolean {
  const configured = process.env.ADMIN_API_KEY?.trim();
  if (!configured) return false;
  const provided = req.headers.get('x-admin-key')?.trim();
  return !!provided && provided === configured;
}
