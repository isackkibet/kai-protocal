"use client";

/**
 * Pools & Swap (/pools): the KaiAMM pools on Avalanche Fuji, in plain words.
 *
 *   Swap      — give one token, get the other at the pool's price
 *               (KaiAMM.swap, 0.3% fee, 0.5% price-change guard)
 *   Add       — put both tokens in a pool and earn a share of its fees.
 *               The second amount is worked out from the pool price, because
 *               KaiPool only counts the smaller side of a mismatched deposit.
 *   My pools  — what you have in each pool, and take it out again
 *
 * Every number comes from the chain (reserves, LP supply, balances, quotes).
 * Approvals are for the exact amount, never unlimited. Flat colours, no
 * animation.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAccount, usePublicClient, useReadContract, useReadContracts, useSwitchChain, useWriteContract } from "wagmi";
import { avalancheFuji } from "wagmi/chains";
import { formatUnits, parseUnits } from "viem";
import { ArrowDownUp, ArrowLeft, Check, ChevronDown, ChevronRight, ExternalLink, Loader2, RefreshCw, Wallet, X } from "lucide-react";
import WalletConnectModal from "@/components/wallet/WalletConnectModal";
import { ECOSYSTEM_TOKENS } from "@/lib/blockchain/tokens";
import { ERC20_ABI } from "@/lib/blockchain/erc20abi";
import { AMM_ABI, POOL_ABI } from "@/lib/blockchain/defiAbis";
import defi from "@/lib/blockchain/defiAddresses.json";

type Addr = `0x${string}`;
const C = {
  bg: "#0E2418", band: "#12301F", card: "#15352A", cardHi: "#1B4032", line: "rgba(246,242,231,0.08)",
  paper: "#F6F2E7", dim: "#C9CFC2", ink: "#9BA396", gold: "#C89B3C", goldLight: "#E4C878", green: "#7DC383", amber: "#E8B04B", red: "#E88C7D",
};
const EXPLORER = defi.explorerBase ?? "https://testnet.snowtrace.io";
const AMM = (defi.amm?.address ?? null) as Addr | null;
const FUJI = avalancheFuji.id;
const SLIPPAGE_BPS = BigInt(50); // 0.5%

/** What each token is, in a few words. */
const TOKEN_WORDS: Record<string, string> = {
  NVR: "KAI vote token", yBOB: "Stable coin", YTOKEN: "Savings fund", YGOLD: "Gold-backed", GAMI: "Rewards", CENTS: "Small change",
};

const TOKENS = ECOSYSTEM_TOKENS.filter((t) => t.address).map((t) => ({ symbol: t.symbol, address: t.address as Addr, decimals: t.decimals, color: t.color }));
const bySymbol = (s: string) => TOKENS.find((t) => t.symbol === s)!;
const byAddress = (a: string) => TOKENS.find((t) => t.address.toLowerCase() === a.toLowerCase());

const POOLS = (defi.pools ?? []).map((p) => {
  const a = byAddress(p.tokenA)!, b = byAddress(p.tokenB)!;
  return { id: p.pair, address: p.address as Addr, a, b };
}).filter((p) => p.a && p.b);
type Pool = (typeof POOLS)[number];

const poolFor = (x: string, y: string) => POOLS.find((p) => (p.a.symbol === x && p.b.symbol === y) || (p.a.symbol === y && p.b.symbol === x)) ?? null;
const partners = (s: string) => POOLS.flatMap((p) => (p.a.symbol === s ? [p.b.symbol] : p.b.symbol === s ? [p.a.symbol] : []));

const n = (v: bigint | undefined, d = 18) => (v == null ? 0 : Number(formatUnits(v, d)));
const show = (x: number) => (x === 0 ? "0" : x < 0.0001 ? "<0.0001" : x.toLocaleString(undefined, { maximumFractionDigits: x < 1 ? 6 : x < 1000 ? 4 : 2 }));
const toWei = (s: string, d: number) => { try { return s && Number(s) > 0 ? parseUnits(s, d) : BigInt(0); } catch { return BigInt(0); } };
const ZERO = BigInt(0);

type Run = { state: "idle" | "running" | "done" | "failed"; step: number; steps: string[]; message?: string; txHash?: string };
const IDLE: Run = { state: "idle", step: 0, steps: [] };

function friendlyError(e: unknown): string {
  const m = e instanceof Error ? e.message : String(e);
  if (/reject|denied|cancel/i.test(m)) return "You cancelled in your wallet. Nothing moved.";
  if (/insufficient funds/i.test(m)) return "Your wallet needs a little test AVAX for the network fee.";
  if (/SlippageExceeded/i.test(m)) return "The price moved before your trade went through. Nothing moved; try again.";
  return m.split("\n")[0].slice(0, 160) || "Something went wrong. Try again.";
}

function Coin({ s, size = 34 }: { s: string; size?: number }) {
  const t = TOKENS.find((x) => x.symbol === s);
  return (
    <span style={{ display: "grid", placeItems: "center", width: size, height: size, borderRadius: "50%", flexShrink: 0, fontSize: size * 0.34, fontWeight: 800,
      background: `color-mix(in srgb, ${t?.color ?? C.gold} 20%, ${C.bg})`, color: t?.color ?? C.goldLight }}>{s.slice(0, 2).toUpperCase()}</span>
  );
}

export default function PoolsPage() {
  const { address, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ chainId: FUJI });

  const [tab, setTab] = useState<"swap" | "add" | "mine">("swap");
  const [showWallet, setShowWallet] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [run, setRun] = useState<Run>(IDLE);

  // Swap
  const [from, setFrom] = useState(POOLS[0]?.a.symbol ?? "NVR");
  const [to, setTo] = useState(POOLS[0]?.b.symbol ?? "yBOB");
  const [amount, setAmount] = useState("");
  // Add / remove
  const [poolId, setPoolId] = useState(POOLS[0]?.id ?? "");
  const [amtA, setAmtA] = useState("");
  const [outPct, setOutPct] = useState(100);

  // ── Live reads ─────────────────────────────────────────────
  const poolReads = useReadContracts({
    contracts: POOLS.flatMap((p) => [
      { address: p.address, abi: POOL_ABI, functionName: "reserveA", chainId: FUJI },
      { address: p.address, abi: POOL_ABI, functionName: "reserveB", chainId: FUJI },
      { address: p.address, abi: POOL_ABI, functionName: "totalSupply", chainId: FUJI },
    ]),
  });
  const userReads = useReadContracts({
    contracts: address && AMM ? [
      ...TOKENS.flatMap((t) => [
        { address: t.address, abi: ERC20_ABI, functionName: "balanceOf", args: [address], chainId: FUJI },
        { address: t.address, abi: ERC20_ABI, functionName: "allowance", args: [address, AMM], chainId: FUJI },
      ]),
      ...POOLS.flatMap((p) => [
        { address: p.address, abi: ERC20_ABI, functionName: "balanceOf", args: [address], chainId: FUJI },
        { address: p.address, abi: ERC20_ABI, functionName: "allowance", args: [address, AMM], chainId: FUJI },
      ]),
    ] : [],
    query: { enabled: !!address && !!AMM },
  });

  const state = useMemo(() => {
    const pools: Record<string, { ra: bigint; rb: bigint; supply: bigint; lp: bigint; lpAllow: bigint }> = {};
    POOLS.forEach((p, i) => {
      const j = TOKENS.length * 2 + i * 2;
      pools[p.id] = {
        ra: (poolReads.data?.[i * 3]?.result as bigint | undefined) ?? ZERO,
        rb: (poolReads.data?.[i * 3 + 1]?.result as bigint | undefined) ?? ZERO,
        supply: (poolReads.data?.[i * 3 + 2]?.result as bigint | undefined) ?? ZERO,
        lp: (userReads.data?.[j]?.result as bigint | undefined) ?? ZERO,
        lpAllow: (userReads.data?.[j + 1]?.result as bigint | undefined) ?? ZERO,
      };
    });
    const wallet: Record<string, { bal: bigint; allow: bigint }> = {};
    TOKENS.forEach((t, i) => {
      wallet[t.symbol] = { bal: (userReads.data?.[i * 2]?.result as bigint | undefined) ?? ZERO, allow: (userReads.data?.[i * 2 + 1]?.result as bigint | undefined) ?? ZERO };
    });
    return { pools, wallet };
  }, [poolReads.data, userReads.data]);

  const refresh = async () => { await Promise.all([poolReads.refetch(), userReads.refetch()]); };

  /** Price of 1 `x` in `y`, from a pool's reserves. */
  const priceOf = (p: Pool, x: string) => {
    const s = state.pools[p.id];
    const ra = n(s.ra, p.a.decimals), rb = n(s.rb, p.b.decimals);
    if (!ra || !rb) return 0;
    return x === p.a.symbol ? rb / ra : ra / rb;
  };

  // ── Swap quote ─────────────────────────────────────────────
  const swapPool = poolFor(from, to);
  const fromTok = bySymbol(from), toTok = bySymbol(to);
  const amountWei = toWei(amount, fromTok?.decimals ?? 18);
  const quote = useReadContract({
    address: swapPool?.address, abi: POOL_ABI, functionName: "getAmountOut",
    args: [fromTok?.address, amountWei], chainId: FUJI,
    query: { enabled: !!swapPool && amountWei > ZERO, staleTime: 3000 },
  });
  const outWei = (quote.data as bigint | undefined) ?? ZERO;
  const outNum = n(outWei, toTok?.decimals);
  const inNum = Number(amount) || 0;
  const spot = swapPool ? priceOf(swapPool, from) : 0;
  const impact = spot && inNum && outNum ? Math.max(0, (1 - outNum / (inNum * spot)) * 100) : 0;
  const minOutWei = (outWei * (BigInt(10000) - SLIPPAGE_BPS)) / BigInt(10000);
  const impactWord = impact > 3 ? { t: "High", c: C.red } : impact > 1 ? { t: "Medium", c: C.amber } : { t: "Low", c: C.green };
  const fromBal = state.wallet[from]?.bal ?? ZERO;

  const changeFrom = (s: string) => {
    setFrom(s); setAmount(""); setRun(IDLE);
    const ps = partners(s);
    if (!ps.includes(to)) setTo(ps[0]);
  };
  const flip = () => { setFrom(to); setTo(from); setAmount(""); setRun(IDLE); };

  /** Approve exactly `need` for the AMM if the current allowance is lower. */
  const ensureAllowance = async (token: Addr, have: bigint, need: bigint) => {
    if (have >= need) return;
    const tx = await writeContractAsync({ address: token, abi: ERC20_ABI, functionName: "approve", args: [AMM!, need], chainId: FUJI });
    await publicClient!.waitForTransactionReceipt({ hash: tx });
  };

  /** Runs the wallet steps; resolves true only when the last transaction succeeded. */
  const go = async (steps: string[], work: (next: () => void) => Promise<`0x${string}`>, done: string): Promise<boolean> => {
    if (!address) { setShowWallet(true); return false; }
    if (!AMM) { setRun({ ...IDLE, state: "failed", message: "The KAI pools are not set up on this network yet." }); return false; }
    let step = 0;
    setRun({ state: "running", step, steps });
    try {
      await switchChainAsync({ chainId: FUJI });
      const next = () => { step++; setRun({ state: "running", step, steps }); };
      next();
      const tx = await work(next);
      const r = await publicClient!.waitForTransactionReceipt({ hash: tx });
      if (r.status !== "success") throw new Error("The blockchain did not accept it. Nothing moved.");
      setRun({ state: "done", step: steps.length, steps, txHash: tx, message: done });
      await refresh();
      return true;
    } catch (e) {
      setRun((x) => ({ ...x, state: "failed", message: friendlyError(e) }));
      return false;
    }
  };

  const doSwap = () => {
    if (!swapPool || amountWei === ZERO) return;
    if (amountWei > fromBal) { setRun({ ...IDLE, state: "failed", message: `You only have ${show(n(fromBal, fromTok.decimals))} ${from}.` }); return; }
    const needApprove = (state.wallet[from]?.allow ?? ZERO) < amountWei;
    const steps = ["Switch wallet to Avalanche Fuji", ...(needApprove ? [`Allow ${amount} ${from} to be swapped`] : []), `Swap ${amount} ${from} for ${to}`];
    void go(steps, async (next) => {
      if (needApprove) { await ensureAllowance(fromTok.address, ZERO, amountWei); next(); }
      return writeContractAsync({ address: AMM!, abi: AMM_ABI, functionName: "swap", args: [fromTok.address, toTok.address, amountWei, minOutWei], chainId: FUJI });
    }, `Done. You got about ${show(outNum)} ${to}.`).then((ok) => { if (ok) setAmount(""); });
  };

  // ── Add / remove ───────────────────────────────────────────
  const pool = POOLS.find((p) => p.id === poolId) ?? POOLS[0];
  const ps = pool ? state.pools[pool.id] : undefined;
  const aWei = pool ? toWei(amtA, pool.a.decimals) : ZERO;
  const bWei = ps && ps.ra > ZERO ? (aWei * ps.rb) / ps.ra : ZERO; // keep the pool's price
  const lpOut = ps && ps.ra > ZERO ? (aWei * ps.supply) / ps.ra : ZERO;
  const balA = pool ? state.wallet[pool.a.symbol]?.bal ?? ZERO : ZERO;
  const balB = pool ? state.wallet[pool.b.symbol]?.bal ?? ZERO : ZERO;
  const shareAfter = ps && ps.supply + lpOut > ZERO ? (Number(ps.lp + lpOut) / Number(ps.supply + lpOut)) * 100 : 0;

  const doAdd = () => {
    if (!pool || !ps || aWei === ZERO || bWei === ZERO) return;
    if (aWei > balA) { setRun({ ...IDLE, state: "failed", message: `You only have ${show(n(balA, pool.a.decimals))} ${pool.a.symbol}.` }); return; }
    if (bWei > balB) { setRun({ ...IDLE, state: "failed", message: `You need ${show(n(bWei, pool.b.decimals))} ${pool.b.symbol} but have ${show(n(balB, pool.b.decimals))}.` }); return; }
    const needA = (state.wallet[pool.a.symbol]?.allow ?? ZERO) < aWei;
    const needB = (state.wallet[pool.b.symbol]?.allow ?? ZERO) < bWei;
    const steps = ["Switch wallet to Avalanche Fuji", ...(needA ? [`Allow ${pool.a.symbol}`] : []), ...(needB ? [`Allow ${pool.b.symbol}`] : []), `Add to the ${pool.id} pool`];
    const minLP = (lpOut * (BigInt(10000) - SLIPPAGE_BPS)) / BigInt(10000);
    void go(steps, async (next) => {
      if (needA) { await ensureAllowance(pool.a.address, ZERO, aWei); next(); }
      if (needB) { await ensureAllowance(pool.b.address, ZERO, bWei); next(); }
      return writeContractAsync({ address: AMM!, abi: AMM_ABI, functionName: "addLiquidity", args: [pool.a.address, pool.b.address, aWei, bWei, minLP], chainId: FUJI });
    }, `Added. You now own about ${shareAfter.toFixed(2)}% of the ${pool.id} pool.`).then((ok) => { if (ok) setAmtA(""); });
  };

  const doRemove = (p: Pool) => {
    const s = state.pools[p.id];
    const lp = (s.lp * BigInt(outPct)) / BigInt(100);
    if (lp === ZERO || s.supply === ZERO) return;
    const getA = (lp * s.ra) / s.supply, getB = (lp * s.rb) / s.supply;
    const slip = (x: bigint) => (x * (BigInt(10000) - SLIPPAGE_BPS)) / BigInt(10000);
    const needApprove = s.lpAllow < lp;
    const steps = ["Switch wallet to Avalanche Fuji", ...(needApprove ? ["Allow your pool share to be returned"] : []), `Take ${outPct}% out of ${p.id}`];
    void go(steps, async (next) => {
      if (needApprove) { await ensureAllowance(p.address, ZERO, lp); next(); }
      return writeContractAsync({ address: AMM!, abi: AMM_ABI, functionName: "removeLiquidity", args: [p.a.address, p.b.address, lp, slip(getA), slip(getB)], chainId: FUJI });
    }, `Done. About ${show(n(getA, p.a.decimals))} ${p.a.symbol} and ${show(n(getB, p.b.decimals))} ${p.b.symbol} are back in your wallet.`);
  };

  const busy = run.state === "running";
  const myPools = POOLS.filter((p) => state.pools[p.id].lp > ZERO);

  const progress = run.state !== "idle" && (
    <div className="pl-progress">
      {run.steps.map((label, i) => {
        const done = run.step > i, now = run.step === i, failed = run.state === "failed" && now;
        return (
          <div key={label} className="pl-prow">
            <span className={done ? "pl-dot done" : failed ? "pl-dot fail" : now ? "pl-dot now" : "pl-dot"}>
              {done ? <Check size={12} /> : failed ? <X size={12} /> : now && busy ? <Loader2 size={12} className="pl-spin" /> : i + 1}
            </span>
            <span style={{ color: done || now ? C.paper : C.ink }}>{label}</span>
          </div>
        );
      })}
      {run.message && <p className={run.state === "done" ? "pl-ok" : "pl-err"}>{run.message}</p>}
      {run.txHash && <a className="pl-link" href={`${EXPLORER}/tx/${run.txHash}`} target="_blank" rel="noopener noreferrer">See it on Snowtrace <ExternalLink size={13} /></a>}
    </div>
  );

  const pickTab = (t: typeof tab, scroll = false) => {
    setTab(t); setRun(IDLE);
    if (scroll) document.getElementById("pl-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="pl">
      <header className="pl-top">
        <div className="pl-wrap pl-top-inner">
          <Link href="/" className="pl-round" aria-label="Back to home"><ArrowLeft size={18} /></Link>
          <div style={{ minWidth: 0 }}>
            <h1 className="pl-title">Pools &amp; Swap</h1>
            <p className="pl-sub">Swap tokens, or earn fees by adding to a pool</p>
          </div>
          <button className="pl-round pl-refresh" onClick={() => void refresh()} aria-label="Refresh"><RefreshCw size={16} /></button>
          <button className={isConnected ? "pl-wallet on" : "pl-wallet"} onClick={() => setShowWallet(true)}>
            <Wallet size={15} /><span>{isConnected && address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "Connect"}</span>
          </button>
        </div>
      </header>

      <div className="pl-wrap pl-body">
        <div className="pl-about">
          <button className="pl-about-btn" onClick={() => setAboutOpen((o) => !o)} aria-expanded={aboutOpen}>
            <span>How do pools work?</span>
            <ChevronDown size={16} style={{ transform: aboutOpen ? "rotate(180deg)" : undefined, transition: "transform .15s" }} />
          </button>
          {aboutOpen && (
            <ol>
              <li>A <b>pool</b> holds two tokens, for example NVR and yBOB. Its price comes from how much of each it holds.</li>
              <li><b>Swap:</b> you give one token and get the other. A <b>0.3% fee</b> stays in the pool.</li>
              <li><b>Add to a pool:</b> put in both tokens at the pool&apos;s price. You own a share of the pool and its fees. Take it out any time.</li>
              <li>This is the Avalanche <b>test network</b>: test tokens, no real money.</li>
            </ol>
          )}
        </div>

        {/* Tabs */}
        <section className="pl-panel" id="pl-panel">
          <div className="pl-tabs" role="tablist">
            {([["swap", "Swap"], ["add", "Add to a pool"], ["mine", `My pools${myPools.length ? ` (${myPools.length})` : ""}`]] as const).map(([id, label]) => (
              <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "on" : ""} onClick={() => pickTab(id)}>{label}</button>
            ))}
          </div>

          {tab === "swap" && (
            <div className="pl-form">
              <div className="pl-box">
                <div className="pl-box-top"><span>You give</span>{isConnected && <button className="pl-mini" onClick={() => setAmount(formatUnits(fromBal, fromTok.decimals))}>You have {show(n(fromBal, fromTok.decimals))} · Use all</button>}</div>
                <div className="pl-box-row">
                  <input className="pl-amount" inputMode="decimal" placeholder="0" value={amount} aria-label={`Amount of ${from}`} onChange={(e) => { setAmount(e.target.value.replace(/[^\d.]/g, "")); setRun(IDLE); }} />
                  <select className="pl-select" value={from} onChange={(e) => changeFrom(e.target.value)} aria-label="Token you give">
                    {TOKENS.filter((t) => partners(t.symbol).length).map((t) => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
                  </select>
                </div>
              </div>

              <button className="pl-flip" onClick={flip} aria-label="Swap the two tokens"><ArrowDownUp size={16} /></button>

              <div className="pl-box">
                <div className="pl-box-top"><span>You get (about)</span></div>
                <div className="pl-box-row">
                  <span className="pl-amount" style={{ color: outNum ? C.paper : C.ink }}>{quote.isFetching ? "…" : outNum ? show(outNum) : "0"}</span>
                  <select className="pl-select" value={to} onChange={(e) => { setTo(e.target.value); setRun(IDLE); }} aria-label="Token you get">
                    {partners(from).map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {outNum > 0 && (
                <dl className="pl-dl pl-details">
                  <dt>Price</dt><dd>1 {from} = {show(outNum / inNum)} {to}</dd>
                  <dt>Pool fee (0.3%)</dt><dd>{show(inNum * 0.003)} {from}</dd>
                  <dt>Price change from your trade</dt><dd style={{ color: impactWord.c }}>{impactWord.t} ({impact.toFixed(2)}%)</dd>
                  <dt>You get at least</dt><dd>{show(n(minOutWei, toTok.decimals))} {to}</dd>
                </dl>
              )}
              {impact > 3 && <p className="pl-warn">This trade is big for this pool, so the price moves a lot. Try a smaller amount.</p>}

              {!isConnected ? (
                <button className="pl-btn pl-btn--wide" onClick={() => setShowWallet(true)}><Wallet size={16} /> Connect wallet to swap</button>
              ) : (
                <button className="pl-btn pl-btn--wide" onClick={doSwap} disabled={busy || !outNum}>
                  {busy ? <><Loader2 size={16} className="pl-spin" /> Working…</> : !amount ? "Type an amount" : <>Swap {amount} {from} for {to} <ChevronRight size={16} /></>}
                </button>
              )}
              {progress}
            </div>
          )}

          {tab === "add" && pool && ps && (
            <div className="pl-form">
              <label className="pl-label" htmlFor="pl-pool">Which pool</label>
              <select id="pl-pool" className="pl-select pl-select--wide" value={pool.id} onChange={(e) => { setPoolId(e.target.value); setAmtA(""); setRun(IDLE); }}>
                {POOLS.map((p) => <option key={p.id} value={p.id}>{p.a.symbol} / {p.b.symbol}</option>)}
              </select>

              <div className="pl-box">
                <div className="pl-box-top"><span>You put in</span>{isConnected && <button className="pl-mini" onClick={() => setAmtA(formatUnits(balA, pool.a.decimals))}>You have {show(n(balA, pool.a.decimals))} · Use all</button>}</div>
                <div className="pl-box-row">
                  <input className="pl-amount" inputMode="decimal" placeholder="0" value={amtA} aria-label={`Amount of ${pool.a.symbol}`} onChange={(e) => { setAmtA(e.target.value.replace(/[^\d.]/g, "")); setRun(IDLE); }} />
                  <span className="pl-token"><Coin s={pool.a.symbol} size={26} /> {pool.a.symbol}</span>
                </div>
              </div>
              <div className="pl-plus">+</div>
              <div className="pl-box">
                <div className="pl-box-top"><span>And (worked out for you)</span>{isConnected && <span>You have {show(n(balB, pool.b.decimals))}</span>}</div>
                <div className="pl-box-row">
                  <span className="pl-amount" style={{ color: bWei ? C.paper : C.ink }}>{bWei ? show(n(bWei, pool.b.decimals)) : "0"}</span>
                  <span className="pl-token"><Coin s={pool.b.symbol} size={26} /> {pool.b.symbol}</span>
                </div>
              </div>
              <p className="pl-hint">Both go in at the pool&apos;s price (1 {pool.a.symbol} = {show(priceOf(pool, pool.a.symbol))} {pool.b.symbol}), so nothing is lost.</p>
              {aWei > ZERO && <dl className="pl-dl pl-details"><dt>Your share after</dt><dd>about {shareAfter.toFixed(2)}% of the pool</dd><dt>You earn</dt><dd>that share of every 0.3% swap fee</dd></dl>}

              {!isConnected ? (
                <button className="pl-btn pl-btn--wide" onClick={() => setShowWallet(true)}><Wallet size={16} /> Connect wallet to add</button>
              ) : (
                <button className="pl-btn pl-btn--wide" onClick={doAdd} disabled={busy || aWei === ZERO}>
                  {busy ? <><Loader2 size={16} className="pl-spin" /> Working…</> : aWei === ZERO ? "Type an amount" : <>Add to the pool <ChevronRight size={16} /></>}
                </button>
              )}
              {progress}
            </div>
          )}

          {tab === "mine" && (
            <div className="pl-form">
              {!isConnected ? (
                <div className="pl-empty"><p>Connect your wallet to see your pools.</p><button className="pl-btn" onClick={() => setShowWallet(true)}><Wallet size={15} /> Connect wallet</button></div>
              ) : myPools.length === 0 ? (
                <div className="pl-empty"><p>You are not in any pool yet. Add to a pool to start earning fees.</p><button className="pl-btn" onClick={() => pickTab("add")}>Add to a pool</button></div>
              ) : (
                <>
                  <p className="pl-label">How much to take out</p>
                  <div className="pl-picks">{[25, 50, 100].map((pc) => <button key={pc} className={outPct === pc ? "pl-pick on" : "pl-pick"} onClick={() => setOutPct(pc)}>{pc === 100 ? "All" : `${pc}%`}</button>)}</div>
                  {myPools.map((p) => {
                    const s = state.pools[p.id];
                    const share = (Number(s.lp) / Number(s.supply)) * 100;
                    const mineA = (s.lp * s.ra) / s.supply, mineB = (s.lp * s.rb) / s.supply;
                    return (
                      <article key={p.id} className="pl-mine">
                        <div className="pl-pool-head">
                          <span className="pl-pair"><Coin s={p.a.symbol} /><Coin s={p.b.symbol} /></span>
                          <div><b>{p.a.symbol} / {p.b.symbol}</b><small>You own {share.toFixed(2)}% of this pool</small></div>
                        </div>
                        <p className="pl-hint" style={{ margin: 0 }}>Worth now: <b>{show(n(mineA, p.a.decimals))} {p.a.symbol}</b> + <b>{show(n(mineB, p.b.decimals))} {p.b.symbol}</b></p>
                        <button className="pl-btn pl-btn--quiet" onClick={() => doRemove(p)} disabled={busy}>Take out {outPct}%</button>
                      </article>
                    );
                  })}
                  {progress}
                </>
              )}
            </div>
          )}
        </section>

        {/* The pools at a glance (real reserves) */}
        <section>
          <h2 className="pl-h2">The pools</h2>
          <div className="pl-pools">
            {POOLS.map((p) => {
              const s = state.pools[p.id];
              const mine = s.supply > ZERO ? (Number(s.lp) / Number(s.supply)) * 100 : 0;
              return (
                <article key={p.id} className="pl-pool">
                  <div className="pl-pool-head">
                    <span className="pl-pair"><Coin s={p.a.symbol} /><Coin s={p.b.symbol} /></span>
                    <div style={{ minWidth: 0 }}>
                      <b>{p.a.symbol} / {p.b.symbol}</b>
                      <small>{TOKEN_WORDS[p.a.symbol]} and {TOKEN_WORDS[p.b.symbol]?.toLowerCase()}</small>
                    </div>
                  </div>
                  <dl className="pl-dl">
                    <dt>Price</dt><dd>1 {p.a.symbol} = {poolReads.isLoading ? "…" : show(priceOf(p, p.a.symbol))} {p.b.symbol}</dd>
                    <dt>In the pool</dt><dd>{show(n(s.ra, p.a.decimals))} {p.a.symbol} + {show(n(s.rb, p.b.decimals))} {p.b.symbol}</dd>
                    {isConnected && <><dt>Your share</dt><dd>{mine > 0 ? `${mine.toFixed(2)}%` : "None yet"}</dd></>}
                  </dl>
                  <div className="pl-pool-btns">
                    <button className="pl-btn pl-btn--quiet" onClick={() => { setFrom(p.a.symbol); setTo(p.b.symbol); setAmount(""); pickTab("swap", true); }}>Swap</button>
                    <button className="pl-btn pl-btn--quiet" onClick={() => { setPoolId(p.id); setAmtA(""); pickTab("add", true); }}>Add to pool</button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {AMM && <a className="pl-link" href={`${EXPLORER}/address/${AMM}`} target="_blank" rel="noopener noreferrer">See the KAI swap contract on Snowtrace <ExternalLink size={13} /></a>}
      </div>

      {showWallet && <WalletConnectModal onClose={() => setShowWallet(false)} />}

      <style>{`
        .pl { min-height: 100dvh; background: ${C.bg}; color: ${C.paper}; font-family: 'Inter', system-ui, sans-serif; padding-bottom: 110px; }
        .pl-wrap { width: min(1080px, calc(100% - 32px)); margin: 0 auto; }
        .pl-top { position: sticky; top: 0; z-index: 30; background: ${C.band}; border-bottom: 1px solid ${C.line}; }
        .pl-top-inner { display: flex; align-items: center; gap: 10px; padding: 12px 0; }
        .pl-round { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; border: none; color: ${C.paper}; background: rgba(246,242,231,0.06); flex-shrink: 0; cursor: pointer; }
        .pl-refresh { margin-left: auto; color: ${C.dim}; }
        .pl-title { margin: 0; font-size: 18px; font-weight: 700; }
        .pl-sub { margin: 1px 0 0; font-size: 12.5px; color: ${C.ink}; }
        .pl-wallet { display: inline-flex; align-items: center; gap: 7px; padding: 9px 14px; border-radius: 999px; border: none; background: ${C.gold}; color: #1B1A14; font-weight: 700; font-size: 13px; cursor: pointer; font-family: inherit; flex-shrink: 0; }
        .pl-wallet.on { background: rgba(125,195,131,0.14); color: ${C.green}; font-family: ui-monospace, monospace; font-weight: 600; }
        @media (max-width: 420px) { .pl-wallet span { display: none; } .pl-wallet { padding: 9px 11px; } }

        .pl-body { display: grid; grid-template-columns: minmax(0, 1fr); gap: 22px; padding-top: 20px; }
        .pl-body > * { min-width: 0; }
        .pl-h2 { margin: 0 0 12px; font-size: 17px; font-weight: 700; }
        .pl-about { border-radius: 14px; background: ${C.band}; }
        .pl-about-btn { display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%; padding: 14px 16px; border: none; background: none; color: ${C.paper}; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; text-align: left; }
        .pl-about ol { margin: 0; padding: 0 16px 16px 36px; display: grid; gap: 8px; font-size: 13.5px; line-height: 1.55; color: ${C.dim}; }
        .pl-about b { color: ${C.paper}; }

        .pl-pools { display: grid; gap: 10px; grid-template-columns: 1fr; }
        @media (min-width: 760px) { .pl-pools { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        .pl-pool, .pl-mine { display: grid; gap: 12px; padding: 16px; border-radius: 16px; background: ${C.card}; min-width: 0; }
        .pl-pool-head { display: flex; align-items: center; gap: 12px; }
        .pl-pool-head b { display: block; font-size: 15px; }
        .pl-pool-head small { display: block; font-size: 12.5px; color: ${C.ink}; }
        .pl-pair { display: flex; }
        .pl-pair > span + span { margin-left: -8px; box-shadow: 0 0 0 2px ${C.card}; }
        .pl-pool-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

        .pl-dl { display: grid; grid-template-columns: auto 1fr; gap: 6px 12px; margin: 0; font-size: 13.5px; }
        .pl-dl dt { color: ${C.ink}; }
        .pl-dl dd { margin: 0; text-align: right; overflow-wrap: anywhere; }
        .pl-details { padding: 12px 14px; border-radius: 12px; background: ${C.bg}; }

        .pl-panel { scroll-margin-top: 76px; box-sizing: border-box; padding: 16px; border-radius: 18px; background: ${C.band}; max-width: 560px; width: 100%; justify-self: center; }
        .pl-tabs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px; padding: 4px; border-radius: 12px; background: ${C.bg}; margin-bottom: 16px; }
        .pl-tabs button { padding: 10px 4px; border-radius: 9px; border: none; background: none; color: ${C.dim}; font-weight: 700; font-size: 13.5px; cursor: pointer; font-family: inherit; min-height: 42px; }
        .pl-tabs button.on { background: ${C.gold}; color: #1B1A14; }
        .pl-form { display: grid; gap: 10px; }
        .pl-box { box-sizing: border-box; min-width: 0; padding: 14px; border-radius: 14px; background: ${C.card}; display: grid; gap: 8px; }
        .pl-box-top { display: flex; justify-content: space-between; gap: 8px; font-size: 12.5px; color: ${C.ink}; flex-wrap: wrap; }
        .pl-mini { border: none; background: none; padding: 0; color: ${C.goldLight}; font-size: 12.5px; font-weight: 600; cursor: pointer; font-family: inherit; }
        .pl-box-row { display: flex; align-items: center; gap: 10px; }
        .pl-amount { flex: 1; min-width: 0; width: 100%; font-size: 26px; font-weight: 700; background: none; border: none; outline: none; color: ${C.paper}; font-family: inherit; overflow: hidden; text-overflow: ellipsis; }
        .pl-select { flex-shrink: 0; max-width: 46%; padding: 9px 12px; border-radius: 999px; border: 1px solid rgba(246,242,231,0.14); background: ${C.bg}; color: ${C.paper}; font-size: 14px; font-weight: 700; font-family: inherit; cursor: pointer; }
        .pl-select--wide { width: 100%; border-radius: 12px; padding: 12px; }
        .pl-token { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; flex-shrink: 0; }
        .pl-flip { justify-self: center; display: grid; place-items: center; width: 40px; height: 40px; margin: -4px 0; border-radius: 50%; border: 3px solid ${C.band}; background: ${C.cardHi}; color: ${C.goldLight}; cursor: pointer; z-index: 1; }
        .pl-plus { justify-self: center; color: ${C.ink}; font-weight: 700; font-size: 18px; margin: -4px 0; }
        .pl-label { margin: 0; font-size: 13.5px; font-weight: 700; }
        .pl-hint { margin: 0; font-size: 13px; color: ${C.dim}; line-height: 1.5; }
        .pl-hint b { color: ${C.paper}; }
        .pl-warn { margin: 0; padding: 10px 12px; border-radius: 10px; background: rgba(232,140,125,0.12); color: ${C.red}; font-size: 13px; }
        .pl-picks { display: flex; gap: 6px; }
        .pl-pick { padding: 7px 14px; border-radius: 999px; border: 1px solid rgba(246,242,231,0.14); background: none; color: ${C.dim}; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
        .pl-pick.on { border-color: ${C.gold}; background: rgba(200,155,60,0.14); color: ${C.goldLight}; }
        .pl-empty { display: grid; gap: 10px; justify-items: start; padding: 4px; }
        .pl-empty p { margin: 0; color: ${C.dim}; font-size: 14px; }

        .pl-btn { display: inline-flex; align-items: center; justify-content: center; gap: 7px; padding: 12px 18px; border-radius: 999px; border: none; background: ${C.gold}; color: #1B1A14; font-weight: 700; font-size: 14.5px; cursor: pointer; font-family: inherit; min-height: 46px; }
        .pl-btn:disabled { opacity: .55; cursor: default; }
        .pl-btn--wide { width: 100%; margin-top: 4px; }
        .pl-btn--quiet { background: rgba(246,242,231,0.08); color: ${C.paper}; min-height: 42px; padding: 10px 14px; font-size: 13.5px; }
        .pl-link { display: inline-flex; align-items: center; gap: 6px; color: ${C.goldLight}; font-size: 13px; font-weight: 600; text-decoration: none; }

        .pl-progress { padding: 12px 14px; border-radius: 12px; background: ${C.bg}; display: grid; gap: 4px; }
        .pl-prow { display: flex; align-items: center; gap: 10px; padding: 3px 0; font-size: 13.5px; }
        .pl-dot { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; background: rgba(246,242,231,0.08); color: ${C.ink}; font-size: 11px; font-weight: 700; flex-shrink: 0; }
        .pl-dot.now { background: rgba(200,155,60,0.22); color: ${C.goldLight}; }
        .pl-dot.done { background: ${C.green}; color: #10231A; }
        .pl-dot.fail { background: ${C.red}; color: #2A1410; }
        .pl-ok { margin: 6px 0 0; font-size: 14px; color: ${C.green}; }
        .pl-err { margin: 6px 0 0; font-size: 13.5px; color: ${C.red}; line-height: 1.5; }
        .pl-spin { animation: pl-spin 1s linear infinite; }
        @keyframes pl-spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { .pl-spin { animation: none; } }
      `}</style>
    </main>
  );
}
