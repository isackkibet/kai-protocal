/**
 * /api/profile  —  GET + POST
 *
 * Stores the user profile in the `profiles` Prisma table keyed by wallet address.
 * Falls back to an in-memory store when no DATABASE_URL is set (dev / preview).
 *
 * Security: this serves wagmi-connected wallets (MetaMask/Core), which have
 * no Privy bearer token to verify — so ownership is proven by having the
 * wallet sign a short-lived challenge (see lib/wallet-signature.ts) instead.
 * Without a valid signature, GET only returns the public display name —
 * never phone/ID number/M-Pesa number, which previously leaked to anyone who
 * supplied any wallet address.
 */
import { NextResponse } from 'next/server';
import { verifyWalletOwnership } from '@/lib/wallet-signature';

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
  const owned = await verifyWalletOwnership(wallet, signature, timestamp);

  const prisma = await getPrisma();
  let full: Record<string, unknown> | null = null;
  if (prisma) {
    try {
      const kaiUser = await (prisma as any).kaiUser.findFirst({
        where: {
          wallets: { some: { address: { equals: wallet, mode: 'insensitive' } } },
        },
        include: { wallets: true },
      });
      if (kaiUser) full = kaiUser;
    } catch { /* fall through to mem */ }
  }
  if (!full) full = MEM[wallet] ?? null;

  return NextResponse.json({ profile: owned ? full : publicSubset(full, wallet) });
}

/* ── POST /api/profile ────────────────────────────────────────── */
export async function POST(req: Request) {
  const body = await req.json();
  const wallet: string = (body.walletAddress ?? '').toLowerCase();
  if (!wallet) return NextResponse.json({ error: 'walletAddress required' }, { status: 400 });

  const owned = await verifyWalletOwnership(wallet, body.signature ?? '', Number(body.timestamp));
  if (!owned) {
    return NextResponse.json({ error: 'Could not verify wallet ownership. Please sign the request and try again.' }, { status: 401 });
  }

  // Build a clean profile object from the submitted form
  const profile = {
    walletAddress: wallet,
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

  // Persist in Prisma if available
  const prisma = await getPrisma();
  if (prisma) {
    try {
      // Upsert KaiUser by wallet address
      const existing = await (prisma as any).kaiWallet.findFirst({
        where: { address: { equals: wallet, mode: 'insensitive' } },
      });

      if (!existing) {
        // Create new KaiUser + wallet
        await (prisma as any).kaiUser.create({
          data: {
            name:  profile.displayName || 'KAI User',
            email: `${wallet.slice(2, 10)}@kai.local`,
            phone: profile.phone || undefined,
            wallets: {
              create: [{ chain: 'AVALANCHE', address: wallet }],
            },
          },
        });
      }
    } catch { /* non-fatal */ }
  }

  // Always persist in memory (works without DB)
  MEM[wallet] = profile;

  return NextResponse.json({ ok: true, profile });
}
