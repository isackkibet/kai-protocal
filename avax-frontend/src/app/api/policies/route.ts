import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { parseEther } from "viem";
import { avalancheFuji } from "viem/chains";
import { getPrisma } from "@/lib/db/db";
import { client } from "@/lib/defi/chain";
import { TREASURY } from "@/lib/blockchain/addresses";
import { readJsonBody } from "@/lib/security/input";
import { paymentProblem, SERVICE_TYPE, TX_HASH, WALLET } from "@/lib/policies/payment";

export const dynamic = "force-dynamic";

/**
 * /api/policies — KAI Playground (/nuvari) policies, stored in Postgres
 * (playground_policies).
 *
 * GET ?owner=0x…  the policies that wallet created (newest first)
 * GET ?id=pol_…   one policy (the page's free "look up")
 * POST { owner, serviceType, config, paymentTxHash }
 *   Saved only after the 0.0001 AVAX fee is checked on Avalanche Fuji: sent
 *   from `owner` to the treasury, and not used for another policy before.
 *
 * Without DATABASE_URL (local dev) policies are kept in memory instead.
 */

const FEE_WEI = parseEther("0.0001");
const TREASURY_ADDRESS = (TREASURY ?? "0xB13727161583e38185530755a1A96D00fcCae870").toLowerCase();

type PolicyRecord = {
  policyId: string; serviceType: string; owner: string; config: Record<string, unknown>;
  paymentAmount: number; paymentTxHash: string; status: "draft" | "active"; createdAt: string;
};

const memory = globalThis as typeof globalThis & { kaiPolicyStore?: { policies: PolicyRecord[] } };
const store = (memory.kaiPolicyStore ??= { policies: [] });

function toRecord(p: { policyId: string; serviceType: string; owner: string; config: Prisma.JsonValue; paymentAmount: Prisma.Decimal; paymentTxHash: string; status: string; createdAt: Date }): PolicyRecord {
  return {
    policyId: p.policyId, serviceType: p.serviceType, owner: p.owner,
    config: (p.config ?? {}) as Record<string, unknown>, paymentAmount: Number(p.paymentAmount),
    paymentTxHash: p.paymentTxHash, status: p.status === "draft" ? "draft" : "active", createdAt: p.createdAt.toISOString(),
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const owner = url.searchParams.get("owner")?.toLowerCase() ?? "";
  const id = url.searchParams.get("id") ?? "";
  if (!WALLET.test(owner) && !/^pol_[0-9a-f]{8,32}$/.test(id)) {
    return NextResponse.json({ policies: [] });
  }
  try {
    const prisma = await getPrisma();
    if (!prisma) {
      return NextResponse.json({ policies: store.policies.filter((p) => (id ? p.policyId === id : p.owner === owner)).slice(0, 100) });
    }
    const rows = await prisma.playgroundPolicy.findMany({
      where: id ? { policyId: id } : { owner },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ policies: rows.map(toRecord) });
  } catch (e) {
    console.error("[/api/policies] GET", e);
    return NextResponse.json({ error: "Could not load policies right now." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let body: { owner?: unknown; serviceType?: unknown; config?: unknown; paymentTxHash?: unknown };
  try {
    body = await readJsonBody(req, 16 * 1024);
  } catch {
    return NextResponse.json({ error: "Invalid policy request." }, { status: 400 });
  }
  const owner = typeof body.owner === "string" ? body.owner.toLowerCase() : "";
  const serviceType = typeof body.serviceType === "string" ? body.serviceType : "";
  const txHash = typeof body.paymentTxHash === "string" ? body.paymentTxHash.toLowerCase() : "";
  const config = body.config;
  if (!WALLET.test(owner)) return NextResponse.json({ error: "owner must be a wallet address." }, { status: 400 });
  if (!SERVICE_TYPE.test(serviceType)) return NextResponse.json({ error: "Unknown policy type." }, { status: 400 });
  if (!TX_HASH.test(txHash)) return NextResponse.json({ error: "paymentTxHash must be a transaction hash." }, { status: 400 });
  if (!config || typeof config !== "object" || Array.isArray(config)) return NextResponse.json({ error: "config must be an object." }, { status: 400 });

  // Check the fee on Avalanche Fuji. The wallet has just sent it, so wait up
  // to 30 s for it to be mined.
  try {
    const receipt = await client.waitForTransactionReceipt({ hash: txHash as `0x${string}`, timeout: 30_000 });
    const tx = await client.getTransaction({ hash: txHash as `0x${string}` });
    const problem = paymentProblem(tx, receipt, { owner, treasury: TREASURY_ADDRESS, minWei: FEE_WEI, chainId: avalancheFuji.id });
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });
  } catch (e) {
    console.error("[/api/policies] payment check", e);
    return NextResponse.json({ error: "Could not find that payment on Avalanche Fuji yet. Wait a minute and try again with the same transaction." }, { status: 409 });
  }

  const policyId = `pol_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  try {
    const prisma = await getPrisma();
    if (!prisma) {
      if (store.policies.some((p) => p.paymentTxHash === txHash)) return NextResponse.json({ error: "That payment was already used for a policy." }, { status: 409 });
      const policy: PolicyRecord = { policyId, serviceType, owner, config: config as Record<string, unknown>, paymentAmount: 0.0001, paymentTxHash: txHash, status: "active", createdAt: new Date().toISOString() };
      store.policies.unshift(policy);
      return NextResponse.json({ policy }, { status: 201 });
    }
    const row = await prisma.playgroundPolicy.create({
      data: { policyId, serviceType, owner, config: config as Prisma.InputJsonObject, paymentAmount: new Prisma.Decimal("0.0001"), paymentTxHash: txHash, status: "active" },
    });
    return NextResponse.json({ policy: toRecord(row) }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "That payment was already used for a policy." }, { status: 409 });
    }
    console.error("[/api/policies] POST", e);
    return NextResponse.json({ error: "The payment is fine, but the policy could not be saved. Try again with the same transaction." }, { status: 500 });
  }
}
