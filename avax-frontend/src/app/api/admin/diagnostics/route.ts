import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { isAuthorizedAdmin } from '@/lib/admin-auth';

/**
 * GET /api/admin/diagnostics
 *
 * Read-only environment check for the onboarding pipeline — reports whether
 * each required secret is configured (true/false only, never the value) and
 * whether the database is reachable. Built to answer "why isn't anyone
 * landing in the database" without digging through Vercel's dashboard or
 * pasting secrets into chat. Gated by the same admin key as /admin/members.
 */
export async function GET(req: Request) {
  if (!isAuthorizedAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const prisma = await getPrisma();
  let dbReachable = false;
  let dbError: string | null = null;
  if (prisma) {
    try {
      await prisma.kaiUser.count();
      dbReachable = true;
    } catch (e: unknown) {
      dbError = e instanceof Error ? e.message : 'unknown error';
    }
  } else {
    dbError = 'DATABASE_URL not set';
  }

  return NextResponse.json({
    privy: {
      appIdConfigured: !!process.env.NEXT_PUBLIC_PRIVY_APP_ID,
      appSecretConfigured: !!process.env.PRIVY_APP_SECRET,
    },
    database: {
      urlConfigured: !!process.env.DATABASE_URL,
      reachable: dbReachable,
      error: dbError,
    },
    adminKeyConfigured: !!process.env.ADMIN_API_KEY,
    deployedAt: new Date().toISOString(),
  });
}
