// Test stub: the bearer token IS the Privy user id.
export async function verifyPrivyUserId(authHeader: string | null): Promise<string | null> {
  return authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() || null : null;
}
