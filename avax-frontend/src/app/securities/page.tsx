"use client";

/**
 * /securities — KAI Financial Securities & Structured Products
 *
 * Full-featured page: tokenized financial instruments (trusts, pensions,
 * money-market funds, RWA tokenisation, parametric insurance) backed by
 * live ERC-20 transfers on Avalanche Fuji.
 */

import { useState } from "react";
import Link from "next/link";
import {
  useAccount,
  useSendTransaction,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { avalancheFuji } from "wagmi/chains";
import { parseEther, parseUnits } from "viem";
import {
  ArrowLeft, Shield, Lock, Unlock, TrendingUp, ExternalLink,
  RefreshCw, Clock, CheckCircle2, AlertTriangle, ChevronRight,
  Banknote, Building2, Leaf, HeartPulse, Coins, Globe, Sparkles,
} from "lucide-react";
import { useEcosystemBalances } from "@/hooks/useEcosystemBalances";
import WalletConnectModal from "@/components/WalletConnectModal";
import { ERC20_ABI } from "@/lib/erc20abi";
import { ECOSYSTEM_TOKENS } from "@/lib/tokens";

// ─── Treasury — receives token deposits as policy collateral ─────────────────
const TREASURY = "0xB13727161583e38185530755a1A96D00fcCae870" as `0x${string}`;
const FEE_AVAX = "0.0001";

type SecurityStatus = "LOCKED" | "UNLOCKED" | "PENDING_DAO";

interface SecuritiesProduct {
  id: string;
  icon: string;
  name: string;
  desc: string;
  apy: string;
  color: string;
  tokenSymbol: string;
  conditionLabel: string;
  category: "Securities" | "Insurance" | "Structured";
  features: string[];
  tvl: string;
  sdgGoals: string[];
  riskRating: "Low" | "Medium" | "High";
}

const SECURITIES_PRODUCTS: SecuritiesProduct[] = [
  {
    id: "trust",
    icon: "🤝",
    name: "KAI Trust",
    desc: "Time-locked token trust for beneficiaries. Smart-contract enforced beneficiary assignments with automatic release on maturity.",
    apy: "15.2%",
    color: "#FFD700",
    tokenSymbol: "NVR",
    conditionLabel: "Time-locked for 5 years",
    category: "Securities",
    features: ["Time-lock smart contract", "Named beneficiary", "Automated release", "Secondary beneficiary"],
    tvl: "$24.8K",
    sdgGoals: ["SDG 1", "SDG 10"],
    riskRating: "Low",
  },
  {
    id: "pension",
    icon: "🏦",
    name: "KAIVAX Pension",
    desc: "Long-term retirement savings with compound yield. Vested schedule with monthly auto-deposit and guardian DeFi protection.",
    apy: "12.8%",
    color: "#A78BFA",
    tokenSymbol: "YTOKEN",
    conditionLabel: "Vested until age 60",
    category: "Securities",
    features: ["Vesting schedule", "Monthly auto-deposit", "Compound yield", "Guardian contract"],
    tvl: "$41.2K",
    sdgGoals: ["SDG 1", "SDG 3"],
    riskRating: "Low",
  },
  {
    id: "mmf",
    icon: "💵",
    name: "Money Market Fund",
    desc: "Low-risk yBOB liquidity basket. RWA-backed stablecoin strategy offering instant redemption and daily yield.",
    apy: "7.5%",
    color: "#22C55E",
    tokenSymbol: "yBOB",
    conditionLabel: "Instant Liquidity (No Lock)",
    category: "Securities",
    features: ["Instant liquidity", "RWA-backed", "Daily yield", "USD-pegged"],
    tvl: "$89.6K",
    sdgGoals: ["SDG 8"],
    riskRating: "Low",
  },
  {
    id: "rwa",
    icon: "🏗️",
    name: "RWA Tokenization",
    desc: "Tokenize land, property, or commodity assets. Legal NFT wrapper with on-chain verification and fractional trading.",
    apy: "18.0%",
    color: "#F97316",
    tokenSymbol: "YGOLD",
    conditionLabel: "Secondary Market Unlocked",
    category: "Structured",
    features: ["Legal NFT wrapper", "On-chain verification", "Fractional trading", "Cross-border settlement"],
    tvl: "$156.3K",
    sdgGoals: ["SDG 10", "SDG 11"],
    riskRating: "Medium",
  },
  {
    id: "crop",
    icon: "🌾",
    name: "Community Crop Insurance",
    desc: "Parametric insurance protecting farmers against climate and weather crop loss. Instant payouts triggered by satellite oracles.",
    apy: "8.5%",
    color: "#EAB308",
    tokenSymbol: "YGOLD",
    conditionLabel: "Parametric Trigger: Drought / Flood",
    category: "Insurance",
    features: ["Parametric weather triggers", "Instant payouts", "Community pooled risk", "Satellite oracle"],
    tvl: "$32.1K",
    sdgGoals: ["SDG 2", "SDG 13"],
    riskRating: "Medium",
  },
  {
    id: "forest",
    icon: "🌲",
    name: "Forest Asset Protection",
    desc: "Insurance cover for tokenized forest hectares. Wildfire, illegal logging, and satellite-verified coverage.",
    apy: "10.2%",
    color: "#22C55E",
    tokenSymbol: "GAMI",
    conditionLabel: "Satellite Verified Outbreak/Fire",
    category: "Insurance",
    features: ["Wildfire protection", "Illegal logging cover", "Satellite verified", "Carbon credit sync"],
    tvl: "$18.4K",
    sdgGoals: ["SDG 13", "SDG 15"],
    riskRating: "Medium",
  },
  {
    id: "medical",
    icon: "🏥",
    name: "Medical Emergency Pool",
    desc: "Community health emergency coverage with DAO-approved claims and fast medical dispersal.",
    apy: "5.0%",
    color: "#EF4444",
    tokenSymbol: "CENTS",
    conditionLabel: "Requires Verified Medical Receipt",
    category: "Insurance",
    features: ["DAO approved claims", "Fast medical dispersal", "Subsidized premiums", "Family coverage"],
    tvl: "$12.7K",
    sdgGoals: ["SDG 3"],
    riskRating: "Low",
  },
  {
    id: "bond",
    icon: "📋",
    name: "Green Bond Instrument",
    desc: "On-chain green bonds financing verified environmental projects. Fixed coupon payments funded by carbon-credit revenue.",
    apy: "9.3%",
    color: "#34D399",
    tokenSymbol: "NVR",
    conditionLabel: "Quarterly Coupon · 3yr Tenor",
    category: "Structured",
    features: ["Fixed coupon", "Carbon-linked revenue", "DAO-governed", "Impact reporting"],
    tvl: "$67.5K",
    sdgGoals: ["SDG 13", "SDG 17"],
    riskRating: "Low",
  },
];

const statusColors: Record<SecurityStatus, { bg: string; border: string; color: string; label: string; Icon: any }> = {
  LOCKED: { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", color: "#f87171", label: "Locked", Icon: Lock },
  UNLOCKED: { bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.3)", color: "#4ade80", label: "Active", Icon: Unlock },
  PENDING_DAO: { bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.3)", color: "#fbbf24", label: "DAO Review", Icon: Clock },
};

const riskColors: Record<string, string> = {
  Low: "#34d399",
  Medium: "#fbbf24",
  High: "#f87171",
};

const W: React.CSSProperties = { width: "100%", maxWidth: 1120, margin: "0 auto", padding: "0 24px" };
const Rs: React.CSSProperties = { textShadow: "0 1px 4px rgba(0,0,0,0.88)" };

export default function SecuritiesPage() {
  const { address, isConnected } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const { tokenBalances, refresh: refreshBalances } = useEcosystemBalances();

  const [showModal, setShowModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState<"All" | "Securities" | "Insurance" | "Structured">("All");
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [txUrl, setTxUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stakeAmt, setStakeAmt] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [investments, setInvestments] = useState<Record<string, number>>({});
  const [conditions, setConditions] = useState<Record<string, SecurityStatus>>({
    trust: "LOCKED", pension: "LOCKED", mmf: "UNLOCKED", rwa: "UNLOCKED",
    crop: "LOCKED", forest: "LOCKED", medical: "PENDING_DAO", bond: "UNLOCKED",
  });

  const getToken = (sym: string) => ECOSYSTEM_TOKENS.find(t => t.symbol === sym);
  const walletBalance = (sym: string): number => tokenBalances[sym] ?? 0;

  const filteredProducts = activeCategory === "All"
    ? SECURITIES_PRODUCTS
    : SECURITIES_PRODUCTS.filter(p => p.category === activeCategory);

  const totalTVL = "$443.6K";
  const activeProducts = SECURITIES_PRODUCTS.filter(p => conditions[p.id] === "UNLOCKED").length;

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await refreshBalances();
    setRefreshing(false);
  };

  const handleDeposit = async (product: SecuritiesProduct) => {
    if (!isConnected || !address) { setShowModal(true); return; }

    const amt = parseFloat(stakeAmt);
    if (!amt || amt <= 0 || isNaN(amt)) {
      setStatusMsg("⚠️ Enter a valid amount to deposit.");
      return;
    }

    const token = getToken(product.tokenSymbol);
    if (!token?.address) {
      setStatusMsg(`⚠️ ${product.tokenSymbol} is not yet deployed on Fuji.`);
      return;
    }

    const walletBal = walletBalance(product.tokenSymbol);
    if (amt > walletBal) {
      setStatusMsg(`⚠️ Insufficient ${product.tokenSymbol} balance (you have ${walletBal.toFixed(4)}).`);
      return;
    }

    setIsLoading(true);
    setStatusMsg("Connecting to Avalanche Fuji network…");
    setTxUrl(null);

    try {
      try { await switchChainAsync({ chainId: avalancheFuji.id }); } catch { /* proceed */ }

      setStatusMsg(`Confirming ${FEE_AVAX} AVAX policy fee in wallet…`);
      const feeTx = await sendTransactionAsync({ to: TREASURY, value: parseEther(FEE_AVAX) });
      setTxUrl(`https://testnet.snowtrace.io/tx/${feeTx}`);

      setStatusMsg(`Confirming ${amt} ${product.tokenSymbol} deposit in wallet…`);
      const tokenUnits = parseUnits(stakeAmt.trim(), token.decimals);
      const tokenTx = await writeContractAsync({
        address: token.address,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [TREASURY, tokenUnits],
        chainId: avalancheFuji.id,
      });

      setTxUrl(`https://testnet.snowtrace.io/tx/${tokenTx}`);
      setStatusMsg(
        `✅ Deposited ${amt} ${product.tokenSymbol} — KAI Security policy active! ` +
        `Fee: ${FEE_AVAX} AVAX · Tx: ${tokenTx.slice(0, 14)}…`
      );
      setInvestments(prev => ({ ...prev, [product.id]: (prev[product.id] || 0) + amt }));
      setStakeAmt("");
      setConditions(prev => ({ ...prev, [product.id]: "UNLOCKED" }));
      await refreshBalances();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/user rejected|user denied|rejected the request/i.test(msg)) {
        setStatusMsg("⚠️ Transaction signature canceled.");
      } else {
        setStatusMsg(`❌ Error: ${msg.slice(0, 120)}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const activeProduct = activeItem ? SECURITIES_PRODUCTS.find(p => p.id === activeItem) : null;
  const activeStatus = activeItem ? (conditions[activeItem] ?? "UNLOCKED") : "UNLOCKED";

  return (
    <main style={{ minHeight: "100dvh", color: "#fff", fontFamily: "var(--font-sans)", position: "relative", paddingBottom: 100 }}>
      <div style={{ ...W, paddingTop: 32 }}>

        {/* ── Top Nav ─────────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/" style={{
              width: 38, height: 38, borderRadius: "50%",
              background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#34d399", textDecoration: "none",
            }}>
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: -0.5, ...Rs }}>
                  🛡️ KAI Securities & Structured Products
                </h1>
                <span style={{ fontSize: 10, fontWeight: 800, background: "rgba(52,211,153,0.15)", color: "#34d399", padding: "2px 8px", borderRadius: 20, border: "1px solid rgba(52,211,153,0.3)" }}>
                  Avalanche Fuji
                </span>
              </div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: "3px 0 0" }}>
                Tokenized financial instruments · Parametric insurance · RWA-backed DeFi
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={handleRefresh} style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}>
              <RefreshCw size={14} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
            </button>

            {!isConnected ? (
              <button onClick={() => setShowModal(true)} style={{
                padding: "8px 16px", borderRadius: 12,
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "#fff", fontSize: 12, fontWeight: 800, border: "none", cursor: "pointer",
              }}>Connect Wallet</button>
            ) : (
              <div style={{ fontSize: 12, color: "#34d399", fontWeight: 700, background: "rgba(52,211,153,0.1)", padding: "6px 12px", borderRadius: 10, border: "1px solid rgba(52,211,153,0.25)" }}>
                🟢 {address?.slice(0, 6)}…{address?.slice(-4)}
              </div>
            )}
          </div>
        </div>

        {/* ── Stats Header ─────────────────────────────────────────────── */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14, marginBottom: 28,
        }}>
          {[
            { label: "Total Value Locked", value: totalTVL, color: "#34d399", Icon: Coins },
            { label: "Active Securities", value: `${activeProducts} / ${SECURITIES_PRODUCTS.length}`, color: "#a78bfa", Icon: Shield },
            { label: "Avg. APY", value: "10.9%", color: "#fbbf24", Icon: TrendingUp },
            { label: "SDG Goals Covered", value: "7 Goals", color: "#38bdf8", Icon: Globe },
          ].map(({ label, value, color, Icon }) => (
            <div key={label} style={{
              borderRadius: 18, padding: "16px 18px",
              background: "rgba(10,16,14,0.7)", border: "1px solid rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: `${color}18`, border: `1px solid ${color}35`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Icon size={18} color={color} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700, textTransform: "uppercase" }}>{label}</p>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color }}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Category Filter Tabs ──────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, background: "rgba(0,0,0,0.3)", padding: 5, borderRadius: 14, width: "fit-content" }}>
          {(["All", "Securities", "Insurance", "Structured"] as const).map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{
              padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 800, border: "none",
              cursor: "pointer",
              background: activeCategory === cat ? "rgba(52,211,153,0.22)" : "transparent",
              color: activeCategory === cat ? "#34d399" : "rgba(255,255,255,0.45)",
              transition: "all 0.15s",
            }}>
              {cat === "Securities" ? "🏛️ " : cat === "Insurance" ? "🛡️ " : cat === "Structured" ? "📋 " : ""}
              {cat}
            </button>
          ))}
        </div>

        {/* ── Main Grid ────────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: activeItem ? "1fr 360px" : "1fr", gap: 20 }}>

          {/* Product Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14, alignContent: "start" }}>
            {filteredProducts.map(product => {
              const status = conditions[product.id] ?? "UNLOCKED";
              const sv = statusColors[status];
              const inv = investments[product.id] ?? 0;
              const isActive = activeItem === product.id;

              return (
                <button
                  key={product.id}
                  onClick={() => setActiveItem(isActive ? null : product.id)}
                  style={{
                    borderRadius: 20,
                    padding: "18px 18px",
                    background: isActive
                      ? "linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(10,16,14,0.95) 100%)"
                      : "rgba(10,16,14,0.7)",
                    border: isActive
                      ? "1.5px solid rgba(52,211,153,0.5)"
                      : `1px solid ${product.color}30`,
                    boxShadow: isActive
                      ? `0 8px 32px rgba(16,185,129,0.25), 0 0 20px ${product.color}20`
                      : `0 4px 16px rgba(0,0,0,0.3)`,
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                    transform: isActive ? "translateY(-2px)" : "none",
                  }}
                >
                  {/* Top: icon + name + status */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 14,
                        background: `${product.color}20`, border: `1px solid ${product.color}40`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 22, flexShrink: 0,
                      }}>
                        {product.icon}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#fff" }}>{product.name}</h3>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: product.color, background: `${product.color}18`, padding: "1px 6px", borderRadius: 4 }}>
                            {product.tokenSymbol}
                          </span>
                          <span style={{ fontSize: 10, color: riskColors[product.riskRating], fontWeight: 700 }}>
                            ● {product.riskRating} Risk
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 4, padding: "4px 8px",
                      borderRadius: 8, background: sv.bg, border: `1px solid ${sv.border}`,
                    }}>
                      <sv.Icon size={10} color={sv.color} />
                      <span style={{ fontSize: 10, fontWeight: 800, color: sv.color }}>{sv.label}</span>
                    </div>
                  </div>

                  <p style={{ margin: "0 0 12px", fontSize: 11.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>
                    {product.desc}
                  </p>

                  {/* APY + TVL + Condition */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: "10px 12px" }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 700, textTransform: "uppercase" }}>APY</p>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#34d399" }}>{product.apy}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 700, textTransform: "uppercase" }}>TVL</p>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#fff" }}>{product.tvl}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 700, textTransform: "uppercase" }}>Staked</p>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: inv > 0 ? "#fbbf24" : "rgba(255,255,255,0.35)" }}>
                        {inv > 0 ? `${inv.toFixed(2)} ${product.tokenSymbol}` : "—"}
                      </p>
                    </div>
                  </div>

                  {/* SDG Tags */}
                  <div style={{ display: "flex", gap: 5, marginTop: 10, flexWrap: "wrap" }}>
                    {product.sdgGoals.map(g => (
                      <span key={g} style={{ fontSize: 9, fontWeight: 700, color: "#34d399", background: "rgba(52,211,153,0.1)", padding: "2px 6px", borderRadius: 4, border: "1px solid rgba(52,211,153,0.2)" }}>
                        {g}
                      </span>
                    ))}
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontWeight: 600, marginLeft: "auto" }}>
                      {product.conditionLabel}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Detail Panel (right side when product selected) ──────────── */}
          {activeProduct && (
            <div style={{
              borderRadius: 24, padding: "24px 20px",
              background: "linear-gradient(135deg, rgba(6,30,20,0.85) 0%, rgba(10,18,14,0.95) 100%)",
              border: "1px solid rgba(52,211,153,0.3)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.5), 0 0 24px rgba(16,185,129,0.12)",
              height: "fit-content",
              position: "sticky",
              top: 20,
            }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 16,
                  background: `${activeProduct.color}22`, border: `1px solid ${activeProduct.color}45`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
                }}>
                  {activeProduct.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#fff" }}>{activeProduct.name}</h2>
                  <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: activeProduct.color, background: `${activeProduct.color}18`, padding: "2px 7px", borderRadius: 5 }}>
                      {activeProduct.tokenSymbol}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#34d399", background: "rgba(52,211,153,0.12)", padding: "2px 7px", borderRadius: 5 }}>
                      {activeProduct.category}
                    </span>
                  </div>
                </div>
                <button onClick={() => setActiveItem(null)} style={{
                  width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.06)",
                  border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 14,
                }}>✕</button>
              </div>

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
                {[
                  { label: "Target APY", value: activeProduct.apy, color: "#34d399" },
                  { label: "TVL", value: activeProduct.tvl, color: "#fff" },
                  { label: "Token", value: activeProduct.tokenSymbol, color: activeProduct.color },
                  { label: "Risk Level", value: activeProduct.riskRating, color: riskColors[activeProduct.riskRating] },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: "10px 12px" }}>
                    <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700, textTransform: "uppercase" }}>{label}</p>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Features */}
              <div style={{ marginBottom: 18 }}>
                <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 0.5 }}>Features</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {activeProduct.features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <CheckCircle2 size={12} color="#34d399" />
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Badge */}
              <div style={{
                display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
                borderRadius: 12, marginBottom: 16,
                background: statusColors[activeStatus].bg,
                border: `1px solid ${statusColors[activeStatus].border}`,
              }}>
                {(() => { const sv = statusColors[activeStatus]; return <sv.Icon size={14} color={sv.color} />; })()}
                <div>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: statusColors[activeStatus].color }}>
                    {activeStatus === "LOCKED" ? "Product Locked — Deposit to unlock" : activeStatus === "PENDING_DAO" ? "Pending DAO Governance Vote" : "Product Active — Earning Yield"}
                  </p>
                  <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{activeProduct.conditionLabel}</p>
                </div>
              </div>

              {/* Wallet balance */}
              {isConnected && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 10 }}>
                  <span>Wallet Balance:</span>
                  <span style={{ color: "#34d399", fontWeight: 700 }}>{walletBalance(activeProduct.tokenSymbol).toFixed(4)} {activeProduct.tokenSymbol}</span>
                </div>
              )}

              {/* Deposit Input */}
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input
                  type="number"
                  placeholder={`Amount in ${activeProduct.tokenSymbol}`}
                  value={stakeAmt}
                  onChange={e => setStakeAmt(e.target.value)}
                  style={{
                    flex: 1, padding: "10px 14px", borderRadius: 12,
                    background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff", fontSize: 13, outline: "none",
                  }}
                />
                <button
                  onClick={() => handleDeposit(activeProduct)}
                  disabled={isLoading}
                  style={{
                    padding: "10px 16px", borderRadius: 12,
                    background: isLoading ? "rgba(16,185,129,0.3)" : "linear-gradient(135deg, #10b981, #059669)",
                    color: "#fff", fontSize: 12, fontWeight: 800, border: "none",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {isLoading ? "…" : "Deposit"}
                </button>
              </div>

              {/* Fee note */}
              <p style={{ margin: "0 0 12px", fontSize: 10, color: "rgba(255,255,255,0.35)", textAlign: "center" }}>
                + {FEE_AVAX} AVAX policy activation fee · Avalanche Fuji
              </p>

              {/* Status message */}
              {statusMsg && (
                <div style={{
                  padding: "10px 14px", borderRadius: 12, marginBottom: 12,
                  background: statusMsg.startsWith("✅") ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.1)",
                  border: `1px solid ${statusMsg.startsWith("✅") ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                  fontSize: 11, color: statusMsg.startsWith("✅") ? "#34d399" : "#f87171", lineHeight: 1.4,
                }}>
                  {statusMsg}
                  {txUrl && (
                    <a href={txUrl} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6, color: "#34d399", fontSize: 10, fontWeight: 700, textDecoration: "none" }}>
                      View on Snowtrace <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              )}

              {/* SDG Goals */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
                <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Aligned UN SDG Goals</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {activeProduct.sdgGoals.map(g => (
                    <Link key={g} href="/sdg" style={{ fontSize: 11, fontWeight: 800, color: "#34d399", background: "rgba(52,211,153,0.12)", padding: "3px 9px", borderRadius: 6, border: "1px solid rgba(52,211,153,0.25)", textDecoration: "none" }}>
                      🌍 {g}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Bottom CTA ───────────────────────────────────────────────── */}
        <div style={{
          marginTop: 40, borderRadius: 24, padding: "28px 24px",
          background: "linear-gradient(135deg, rgba(6,32,20,0.85) 0%, rgba(10,20,16,0.95) 100%)",
          border: "1px solid rgba(52,211,153,0.25)",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap",
        }}>
          <div>
            <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 900, color: "#fff" }}>
              <Sparkles size={16} color="#34d399" style={{ marginRight: 8, verticalAlign: "middle" }} />
              Also explore: Community Products
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
              Forest honey reserves, traditional medicine registries, cultural beadwork NFTs, and more.
            </p>
          </div>
          <Link href="/products" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "12px 20px", borderRadius: 14,
            background: "linear-gradient(135deg, #10b981, #059669)",
            color: "#fff", fontSize: 13, fontWeight: 800, textDecoration: "none",
          }}>
            View All Products <ChevronRight size={16} />
          </Link>
        </div>

      </div>

      {showModal && <WalletConnectModal onClose={() => setShowModal(false)} />}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}
