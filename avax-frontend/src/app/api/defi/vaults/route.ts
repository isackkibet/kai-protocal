import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/db';
import { TOKEN_LIST } from '@/lib/defi/chain';
import { defiAdminWallets, registerVault } from '@/lib/defi/vaults';
import { RecordError } from '@/lib/mrv/records';
import { requireRateLimit } from '@/lib/security/route-guard';
import { readJsonBody, InputError } from '@/lib/security/input';

/**
 * /api/defi/vaults (Ecosystem PRD v1.1 §4.15 create_vault)
 * GET  — vaults created by DeFi admins, the tokens a vault can hold, and
 *        which wallets may create vaults.
 * POST { txHash } — register a vault the admin's wallet just deployed; the
 *        server checks the deployment on Fuji (see lib/defi/vaults.ts).
 *        202 while the transaction is not mined yet.
 */
export async function GET() {
  const prisma = await getPrisma();
  const vaults = prisma ? await prisma.defiVault.findMany({ orderBy: { createdAt: 'desc' } }).catch(() => []) : [];
  return NextResponse.json({ vaults, tokens: TOKEN_LIST, adminWallets: defiAdminWallets() });
}

export async function POST(req: Request) {
  const limited = await requireRateLimit(req, [{ scope: 'ip', limit: 20, windowMs: 60_000 }]);
  if (!limited.ok) return limited.response;
  let body: Record<string, unknown>;
  try { body = ((await readJsonBody(req)) ?? {}) as Record<string, unknown>; } catch (e) {
    return NextResponse.json({ error: e instanceof InputError ? e.message : 'Invalid JSON body' }, { status: 400 });
  }
  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ error: 'database unavailable' }, { status: 503 });
  try {
    const vault = await registerVault(prisma, String(body.txHash ?? ''));
    return NextResponse.json({ ok: true, vault });
  } catch (e) {
    if (e instanceof RecordError) return NextResponse.json({ error: e.message, pending: e.status === 202 }, { status: e.status });
    console.error('[defi/vaults] register failed', e);
    return NextResponse.json({ error: 'Could not register the vault.' }, { status: 500 });
  }
}
