/**
 * /api/profile  —  GET + POST
 *
 * Stores the user profile keyed by wallet address. Falls back to an in-memory
 * store when no DATABASE_URL is set (dev / preview).
 *
 * Security: two accepted identities, exactly like /api/mpesa/stk —
 *   1. A Privy bearer token (`Authorization: Bearer …`), verified
 *      server-side via verifyPrivyUserId — covers Google/email sign-in where
 *      the embedded wallet is NOT visible to wagmi.
 *   2. A wagmi-connected wallet (MetaMask/Core) proving ownership by signing
 *      a short-lived challenge (lib/wallet-signature.ts).
 * Without a valid identity, GET only returns the public display name — never
 * phone/ID number/M-Pesa number, which previously leaked to anyone who
 * supplied any wallet address.
 */
import { NextResponse } from 'next/server';
import { verifyWalletOwnership } from '@/lib/wallet-signature';
import { verifyPrivyUserId } from '@/lib/privy-server';

/* ── in-memory fallback ───────────────────────────────────────── */
const MEM: Record<string, Record<string, unknown>> = {};

async function getPrisma() {
  if (!process.env.DATABASE_URL) return null;
  try {
    const { prisma } = await import('@/lib/prisma');
    return prisma;
  } catch {
    return null;
  }
}

/**
 * Resolve who this request belongs to and which wallet to key the profile by.
 *
 * - Privy session  → trusted, keyed by the wallet bound to that user in the
 *   DB when one exists, otherwise the caller-supplied address (the embedded
 *   wallet address the client knows about).
 * - No Privy token → falls back to the signed wallet-ownership challenge.
 */
async function resolveOwnedWallet(
  req: Request,
  wallet: string,
  signature: string,
  timestamp: number,
): Promise<{ owned: boolean; key: string; privyUserId?: string }> {
  const privyUserId = await verifyPrivyUserId(req.headers.get('authorization'));
  if (privyUserId) {
    const prisma = await getPrisma();
    if (prisma) {
      try {
        const user = await prisma.kaiUser.findFirst({
          where: { privyUserId },
          include: { wallets: true },
        });
        const bound = user?.wallets?.find((w) => w.chain === 'AVALANCHE')?.address?.toLowerCase();
        if (bound) return { owned: true, key: bound, privyUserId };
      } catch { /* fall through to supplied wallet */ }
    }
    return { owned: true, key: wallet.toLowerCase(), privyUserId };
  }
  const owned = await verifyWalletOwnership(wallet, signature, timestamp);
  return { owned, key: wallet.toLowerCase() };
}

function publicSubset(profile: Record<string, unknown> | null, wallet: string) {
  if (!profile) return null;
  return {
    walletAddress: wallet,
    name: profile.name ?? null,
    displayName: profile.displayName ?? null,
  };
}

/* ── GET /api/profile?wallet=0x…&signature=0x…&timestamp=… ───────── */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get('wallet')?.toLowerCase();
  if (!wallet) return NextResponse.json({ profile: null });

  const signature = searchParams.get('signature') ?? '';
  const timestamp = Number(searchParams.get('timestamp'));
  const identity = await resolveOwnedWallet(req, wallet, signature, timestamp);
  const owned = identity.owned;
  const key = identity.key;

  const prisma = await getPrisma();
  let dbFull: Record<string, unknown> | null = null;
  if (prisma) {
    try {
      // DB-bound user (by wallet, or for Privy sessions by user id when the
      // wallet isn't bound yet) — the source of truth for name/phone/updatedAt.
      const byWallet = await prisma.kaiUser.findFirst({
        where: {
          wallets: { some: { address: { equals: key, mode: 'insensitive' } } },
        },
        include: { wallets: true },
      });
      const byPrivy = identity.privyUserId
        ? await prisma.kaiUser.findFirst({
            where: { privyUserId: identity.privyUserId },
            include: { wallets: true },
          })
        : null;
      dbFull = byPrivy ?? byWallet;
    } catch { /* fall through to mem */ }
  }
  // Combine: DB record for identity fields + in-memory snapshot for the full
  // form (county, ID, memberships, prefs), so a fresh save reloads intact.
  const saved = MEM[key] ?? null;
  const full = dbFull || saved ? { ...(dbFull ?? {}), ...(saved ?? {}) } : null;

  return NextResponse.json({ profile: owned ? full : publicSubset(full, key) });
}

/* ── POST /api/profile ────────────────────────────────────────── */
export async function POST(req: Request) {
  const body = await req.json();
  const wallet: string = (body.walletAddress ?? '').toLowerCase();
  if (!wallet) return NextResponse.json({ error: 'walletAddress required' }, { status: 400 });

  const identity = await resolveOwnedWallet(req, wallet, body.signature ?? '', Number(body.timestamp));
  if (!identity.owned) {
    return NextResponse.json({ error: 'Could not verify your session. Please sign in again.' }, { status: 401 });
  }
  const key = identity.key;

  // Build a clean profile object from the submitted form
  const profile = {
    walletAddress: key,
    displayName:   body.displayName   ?? '',
    phone:         body.phone         ?? '',
    county:        body.county        ?? '',
    idNumber:      body.idNumber      ?? '',

    // CFA membership
    cfaGroup:      body.cfaGroup      ?? '',
    cfaRole:       body.cfaRole       ?? '',
    cfaRegion:     body.cfaRegion     ?? '',
    cfaJoinYear:   body.cfaJoinYear   ?? '',

    // SME
    businessName:  body.businessName  ?? '',
    businessType:  body.businessType  ?? '',
    businessLocation: body.businessLocation ?? '',
    annualTurnover: body.annualTurnover ?? '',
    mpesaNumber:   body.mpesaNumber   ?? '',

    // Saving Group (Chama)
    chamaName:     body.chamaName     ?? '',
    chamaRole:     body.chamaRole     ?? '',
    chamaRegNo:    body.chamaRegNo    ?? '',
    monthlyContrib: body.monthlyContrib ?? '',

    // KAI ecosystem preferences
    riskTolerance: body.riskTolerance ?? 'medium',
    preferredVault: body.preferredVault ?? '',
    notifications: body.notifications ?? true,

    updatedAt: new Date().toISOString(),
  };

  // Persist in Prisma if available (best-effort — MEM always stores)
  const prisma = await getPrisma();
  if (prisma) {
    try {
      // Privy session → bind to the verified user id so the embedded wallet
      // (already or newly) lives under it.
      if (identity.privyUserId) {
        let user = await prisma.kaiUser.findFirst({
          where: { privyUserId: identity.privyUserId },
          include: { wallets: true },
        });
        if (!user) {
          user = await prisma.kaiUser.create({
            data: {
              name:  profile.displayName || 'KAI User',
              email: `privy-${identity.privyUserId.slice(0, 10)}@kai.local`,
              phone: profile.phone || undefined,
              privyUserId: identity.privyUserId,
            },
            include: { wallets: true },
          });
        }
        const bound = user.wallets?.find((w) => w.chain === 'AVALANCHE');
        if (!bound) {
          await prisma.kaiWallet.create({
            data: { userId: user.id, chain: 'AVALANCHE', address: key },
          });
        }
        await prisma.kaiUser.update({
          where: { id: user.id },
          data: { name: profile.displayName || user.name, phone: profile.phone || user.phone },
        });
      } else {
        // wagmi wallet → existing behaviour: upsert KaiUser by wallet address
        const existing = await prisma.kaiWallet.findFirst({
          where: { address: { equals: key, mode: 'insensitive' } },
        });
        if (!existing) {
          await prisma.kaiUser.create({
            data: {
              name:  profile.displayName || 'KAI User',
              email: `${key.slice(2, 10)}@kai.local`,
              phone: profile.phone || undefined,
              wallets: { create: [{ chain: 'AVALANCHE', address: key }] },
            },
          });
        }
      }
    } catch { /* non-fatal */ }
  }

  // Always persist in memory (works without DB)
  MEM[key] = profile;

  return NextResponse.json({ ok: true, profile });
}
