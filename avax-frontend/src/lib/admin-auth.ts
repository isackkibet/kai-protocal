/**
 * Minimal admin gate for internal/business-only endpoints (e.g. sending money
 * out via M-Pesa B2C, registering a creator's payout destination) that have
 * no per-user ownership concept yet — a valid Privy login isn't enough to
 * call these, since any signed-up user shouldn't be able to.
 *
 * Fails CLOSED: if ADMIN_API_KEY isn't configured, every request is
 * rejected rather than allowed through unauthenticated.
 */
import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Constant-time comparison.
 *
 * A plain `provided === configured` leaks the key one character at a time
 * through response timing: an attacker measures how long each guess takes and
 * narrows the space without ever seeing the key. Hashing both sides first
 * gives two fixed-length buffers so `timingSafeEqual` is safe even when the
 * lengths differ (which it otherwise throws on).
 */
function safeEqual(a: string, b: string): boolean {
  const hashA = createHash('sha256').update(a).digest();
  const hashB = createHash('sha256').update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

export function isAuthorizedAdmin(req: Request): boolean {
  const configured = process.env.ADMIN_API_KEY?.trim();
  if (!configured) return false;
  const provided = req.headers.get('x-admin-key')?.trim();
  if (!provided) return false;

  // Reject keys of an obviously wrong length before the constant-time path, so
  // a garbage header can't become a timing signal about the real length.
  if (provided.length !== configured.length) return false;

  return safeEqual(provided, configured);
}
