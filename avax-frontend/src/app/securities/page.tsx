"use client";

/**
 * Securities & Insurance (/securities).
 *
 * Every product is backed by a real KaiVault on Avalanche Fuji (one vault per
 * token, see defiAddresses.json). "Put in" = approve exactly that amount, then
 * vault.deposit(); "Take out" = vault.withdraw(shares), which sends the tokens
 * and any yield back to the same wallet. The yearly rate is read live from
 * the vault (apyBps). Products that use the same token share that vault, and
 * the page says so.
 *
 * Lock rules such as "5 years" are shown as planned rules: the test vaults
 * let you take money out at any time, and the page says that plainly.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAccount, usePublicClient, useReadContracts, useSwitchChain, useWriteContract } from "wagmi";
import { avalancheFuji } from "wagmi/chains";
import { formatUnits, parseUnits } from "viem";
import {
  Amphora, ArrowLeft, Building2, Check, ChevronDown, ChevronRight, CircleDot, Droplet, Droplets, ExternalLink, Flame,
  Gem, HeartPulse, Landmark, Leaf, Loader2, Milk, PiggyBank, RefreshCw, ScrollText, Shirt, Sprout, Trees, Wallet,
  Wheat, X, type LucideIcon,
} from "lucide-react";
import WalletConnectModal from "@/components/wallet/WalletConnectModal";
import { ERC20_ABI } from "@/lib/blockchain/erc20abi";
import { VAULT_ABI } from "@/lib/blockchain/defiAbis";
import defi from "@/lib/blockchain/defiAddresses.json";

const C = {
  bg: "#0E2418", band: "#12301F", card: "#15352A", cardHi: "#1B4032", line: "rgba(246,242,231,0.08)",
  paper: "#F6F2E7", dim: "#C9CFC2", ink: "#9BA396", gold: "#C89B3C", goldLight: "#E4C878", green: "#7DC383", red: "#E88C7D",
};
const EXPLORER = "https://testnet.snowtrace.io";
const DECIMALS = 18; // every KAI ecosystem token (EcosystemToken.sol)

type Tab = "save" | "insurance" | "community";
interface Product { id: string; tab: Tab; name: string; hint: string; about: string; rule: string; token: string; icon: LucideIcon; tint: string }

const PRODUCTS: Product[] = [
  // Save & grow (securities)
  { id: "trust", tab: "save", name: "Family trust", hint: "Keep tokens safe for someone you love", about: "Tokens put aside for a person you name, like a child.", rule: "Planned: locked for 5 years, then paid to the person you named.", token: "NVR", icon: Landmark, tint: "#E4C878" },
  { id: "pension", tab: "save", name: "Pension savings", hint: "Save now, use it when you are older", about: "Long-term savings that grow slowly over many years.", rule: "Planned: locked until age 60.", token: "YTOKEN", icon: PiggyBank, tint: "#B39DDB" },
  { id: "mmf", tab: "save", name: "Everyday savings", hint: "Low risk, take it out any time", about: "A simple savings pot in yBOB, a stable coin.", rule: "No lock: take it out whenever you want.", token: "yBOB", icon: Wallet, tint: "#7DC383" },
  { id: "rwa", tab: "save", name: "Land & gold shares", hint: "Own a small part of a real asset", about: "Shares in real things like land or gold, kept as YGOLD tokens.", rule: "Planned: shares can be sold to other people.", token: "YGOLD", icon: Building2, tint: "#E8A06A" },
  // Insurance
  { id: "crop", tab: "insurance", name: "Crop insurance", hint: "Paid out if drought or floods ruin the harvest", about: "Farmers pool tokens; when the weather data shows a drought or flood, members are paid.", rule: "Planned: paid when weather data shows a drought or flood.", token: "YGOLD", icon: Wheat, tint: "#DDA63A" },
  { id: "forest", tab: "insurance", name: "Forest protection", hint: "Cover for fire and illegal logging", about: "Protects community forest land; payouts after a fire or illegal logging is confirmed.", rule: "Planned: paid when satellite images confirm a fire or logging.", token: "GAMI", icon: Trees, tint: "#56C02B" },
  { id: "medical", tab: "insurance", name: "Medical emergency pool", hint: "Help for members' hospital bills", about: "Members share the cost of emergencies such as hospital bills.", rule: "Planned: paid when a hospital receipt is checked and approved.", token: "CENTS", icon: HeartPulse, tint: "#E5243B" },
  // Community
  { id: "honey", tab: "community", name: "Forest honey", hint: "Support honey from community forests", about: "Each token stands for honey harvested from community-managed forests.", rule: "Planned: released each harvest season.", token: "GAMI", icon: Droplet, tint: "#F59E0B" },
  { id: "beads", tab: "community", name: "Beadwork", hint: "Maasai, Ndebele and Turkana beadwork", about: "Supports artisans; they earn a share each time their work is traded.", rule: "Planned: artisans checked by the community.", token: "NVR", icon: Gem, tint: "#10b981" },
  { id: "necklace", tab: "community", name: "Heritage jewellery", hint: "Traditional necklaces and jewellery", about: "Protects artisan income and keeps cultural heritage alive.", rule: "Planned: each piece certified by its artisan.", token: "YTOKEN", icon: CircleDot, tint: "#B39DDB" },
  { id: "milk", tab: "community", name: "Milk pool", hint: "Camel, cow and goat milk from herders", about: "Dairy co-ops pool milk; farmers are paid directly.", rule: "Planned: daily collection checked by the co-op.", token: "yBOB", icon: Milk, tint: "#60A5FA" },
  { id: "medicine", tab: "community", name: "Traditional medicine", hint: "Medicinal plants, healers keep their rights", about: "A record of medicinal plants; healers keep the rights to their knowledge.", rule: "Planned: approved by the healers' council.", token: "GAMI", icon: Leaf, tint: "#34D399" },
  { id: "recipe", tab: "community", name: "Recipe vault", hint: "Traditional food and seed-saving methods", about: "Keeps community recipes and methods safe; fees for using them go to the community.", rule: "Planned: approved by the community council.", token: "CENTS", icon: ScrollText, tint: "#F97316" },
  { id: "charcoal", tab: "community", name: "Clean charcoal", hint: "Charcoal from managed woodlots", about: "Charcoal made from community woodlots; each checked batch earns carbon credits.", rule: "Planned: each batch checked by a carbon audit.", token: "YGOLD", icon: Flame, tint: "#A8A29E" },
  { id: "weaving", tab: "community", name: "Weaving co-op", hint: "Kikoy, kanga and baskets", about: "Weavers get paid in advance for future sales.", rule: "Planned: co-op checked and linked to buyers.", token: "YTOKEN", icon: Shirt, tint: "#EC4899" },
  { id: "seeds", tab: "community", name: "Seed bank", hint: "Keep local seed varieties alive", about: "Funds growing more of the drought-resistant local seeds.", rule: "Planned: released after the seeds sprout.", token: "NVR", icon: Sprout, tint: "#86EFAC" },
  { id: "water", tab: "community", name: "Water rights", hint: "Water for herders and farmers", about: "Water rights that can help a community borrow in the dry season.", rule: "Planned: checked by water-level sensors.", token: "yBOB", icon: Droplets, tint: "#38BDF8" },
  { id: "pottery", tab: "community", name: "Pottery", hint: "Handmade community pottery", about: "Each piece is recorded; sales fund the pottery co-ops.", rule: "Planned: certified by the potters' guild.", token: "CENTS", icon: Amphora, tint: "#FB923C" },
  { id: "bark", tab: "community", name: "Bark cloth", hint: "Ugandan bark cloth and sisal art", about: "Protects a UNESCO heritage craft and the people who make it.", rule: "Planned: listed in the heritage registry.", token: "YGOLD", icon: Shirt, tint: "#B45309" },
];

const TABS: { id: Tab; name: string; hint: string }[] = [
  { id: "save", name: "Save & grow", hint: "Put tokens in a vault and earn a yearly rate." },
  { id: "insurance", name: "Insurance", hint: "Pool tokens with others to cover bad events." },
  { id: "community", name: "Community", hint: "Support local makers, farmers and heritage." },
];

const VAULTS = defi.vaults as Record<string, { address: string; asset: string }>;
const SYMBOLS = Object.keys(VAULTS);

type Run = { state: "idle" | "running" | "done" | "failed"; step: number; steps: string[]; message?: string; txHash?: string };

function friendlyError(e: unknown): string {
  const m = e instanceof Error ? e.message : String(e);
  if (/reject|denied|cancel/i.test(m)) return "You cancelled in your wallet. Nothing moved.";
  if (/insufficient funds/i.test(m)) return "Your wallet needs a little test AVAX for the network fee.";
  return m.split("\n")[0].slice(0, 160) || "Something went wrong. Try again.";
}

const num = (v: bigint | undefined) => (v == null ? 0 : Number(formatUnits(v, DECIMALS)));
const show = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: n < 1 ? 6 : 2 });

export default function SecuritiesPage() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient({ chainId: avalancheFuji.id });

  const [tab, setTab] = useState<Tab>("save");
  const [openId, setOpenId] = useState<string | null>(null);
  const [mode, setMode] = useState<"in" | "out">("in");
  const [amount, setAmount] = useState("");
  const [outPct, setOutPct] = useState(100);
  const [run, setRun] = useState<Run>({ state: "idle", step: 0, steps: [] });
  const [showWallet, setShowWallet] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  // Live reads for all six vaults: yearly rate, share price, and (when
  // connected) the wallet's token balance, vault shares and allowance.
  const vaultReads = useReadContracts({
    contracts: SYMBOLS.flatMap((s) => [
      { address: VAULTS[s].address as `0x${string}`, abi: VAULT_ABI, functionName: "apyBps", chainId: avalancheFuji.id },
      { address: VAULTS[s].address as `0x${string}`, abi: VAULT_ABI, functionName: "sharePrice", chainId: avalancheFuji.id },
    ]),
  });
  const userReads = useReadContracts({
    contracts: address ? SYMBOLS.flatMap((s) => [
      { address: VAULTS[s].asset as `0x${string}`, abi: ERC20_ABI, functionName: "balanceOf", args: [address], chainId: avalancheFuji.id },
      { address: VAULTS[s].address as `0x${string}`, abi: VAULT_ABI, functionName: "balanceOf", args: [address], chainId: avalancheFuji.id },
      { address: VAULTS[s].asset as `0x${string}`, abi: ERC20_ABI, functionName: "allowance", args: [address, VAULTS[s].address as `0x${string}`], chainId: avalancheFuji.id },
    ]) : [],
    query: { enabled: !!address },
  });

  const info = useMemo(() => {
    const out: Record<string, { apy: number | null; price: bigint; wallet: bigint; shares: bigint; allowance: bigint; inVault: bigint }> = {};
    SYMBOLS.forEach((s, i) => {
      const apy = vaultReads.data?.[i * 2]?.result as bigint | undefined;
      const price = (vaultReads.data?.[i * 2 + 1]?.result as bigint | undefined) ?? BigInt(1e18);
      const wallet = (userReads.data?.[i * 3]?.result as bigint | undefined) ?? BigInt(0);
      const shares = (userReads.data?.[i * 3 + 1]?.result as bigint | undefined) ?? BigInt(0);
      const allowance = (userReads.data?.[i * 3 + 2]?.result as bigint | undefined) ?? BigInt(0);
      out[s] = { apy: apy == null ? null : Number(apy) / 100, price, wallet, shares, allowance, inVault: (shares * price) / BigInt(1e18) };
    });
    return out;
  }, [vaultReads.data, userReads.data]);

  const refresh = async () => { await Promise.all([vaultReads.refetch(), userReads.refetch()]); };
  const loading = vaultReads.isLoading;

  const myVaults = SYMBOLS.filter((s) => info[s].shares > BigInt(0));
  const list = PRODUCTS.filter((p) => p.tab === tab);
  const open = PRODUCTS.find((p) => p.id === openId) ?? null;

  const choose = (p: Product) => {
    setOpenId(openId === p.id ? null : p.id);
    setMode(info[p.token].shares > BigInt(0) ? "out" : "in");
    setAmount("");
    setOutPct(100);
    setRun({ state: "idle", step: 0, steps: [] });
  };

  const putIn = async (p: Product) => {
    if (!address) { setShowWallet(true); return; }
    const v = info[p.token];
    let wei: bigint;
    try { wei = parseUnits(amount || "0", DECIMALS); } catch { setRun({ state: "failed", step: 0, steps: [], message: "Type a number, like 10." }); return; }
    if (wei <= BigInt(0)) { setRun({ state: "failed", step: 0, steps: [], message: "Type how many tokens to put in." }); return; }
    if (wei > v.wallet) { setRun({ state: "failed", step: 0, steps: [], message: `You only have ${show(num(v.wallet))} ${p.token}.` }); return; }

    const needApprove = v.allowance < wei;
    const steps = ["Switch wallet to Avalanche Fuji", ...(needApprove ? [`Allow the vault to take ${amount} ${p.token}`] : []), `Put ${amount} ${p.token} in the vault`];
    setRun({ state: "running", step: 0, steps });
    try {
      await switchChainAsync({ chainId: avalancheFuji.id });
      let step = 1;
      if (needApprove) {
        setRun({ state: "running", step, steps });
        // Exactly this amount, not unlimited.
        const tx = await writeContractAsync({ address: VAULTS[p.token].asset as `0x${string}`, abi: ERC20_ABI, functionName: "approve", args: [VAULTS[p.token].address as `0x${string}`, wei], chainId: avalancheFuji.id });
        await publicClient!.waitForTransactionReceipt({ hash: tx });
        step++;
      }
      setRun({ state: "running", step, steps });
      const tx = await writeContractAsync({ address: VAULTS[p.token].address as `0x${string}`, abi: VAULT_ABI, functionName: "deposit", args: [wei], chainId: avalancheFuji.id });
      const r = await publicClient!.waitForTransactionReceipt({ hash: tx });
      if (r.status !== "success") throw new Error("The vault did not accept it. Nothing moved.");
      setRun({ state: "done", step: steps.length, steps, txHash: tx, message: `${amount} ${p.token} is now in the vault.` });
      setAmount("");
      await refresh();
    } catch (e) {
      setRun((x) => ({ ...x, state: "failed", message: friendlyError(e) }));
    }
  };

  const takeOut = async (p: Product) => {
    if (!address) { setShowWallet(true); return; }
    const v = info[p.token];
    const shares = (v.shares * BigInt(outPct)) / BigInt(100);
    if (shares <= BigInt(0)) { setRun({ state: "failed", step: 0, steps: [], message: "There is nothing in this vault to take out." }); return; }
    const steps = ["Switch wallet to Avalanche Fuji", `Take ${outPct}% out of the vault`];
    setRun({ state: "running", step: 0, steps });
    try {
      await switchChainAsync({ chainId: avalancheFuji.id });
      setRun({ state: "running", step: 1, steps });
      const tx = await writeContractAsync({ address: VAULTS[p.token].address as `0x${string}`, abi: VAULT_ABI, functionName: "withdraw", args: [shares], chainId: avalancheFuji.id });
      const r = await publicClient!.waitForTransactionReceipt({ hash: tx });
      if (r.status !== "success") throw new Error("The vault did not release it. Nothing moved.");
      setRun({ state: "done", step: 2, steps, txHash: tx, message: `About ${show(num((shares * v.price) / BigInt(1e18)))} ${p.token} is back in your wallet.` });
      await refresh();
    } catch (e) {
      setRun((x) => ({ ...x, state: "failed", message: friendlyError(e) }));
    }
  };

  const busy = run.state === "running";

  // A render function, not a component, so typing in the amount box keeps focus.
  const renderDetail = (p: Product) => {
    const v = info[p.token];
    const amt = Number(amount) || 0;
    const sharing = PRODUCTS.filter((x) => x.token === p.token && x.id !== p.id).map((x) => x.name);
    const outTokens = num((((v.shares * BigInt(outPct)) / BigInt(100)) * v.price) / BigInt(1e18));
    return (
      <div className="se-detail">
        <p className="se-about-text">{p.about}</p>
        <p className="se-rule"><b>Rule:</b> {p.rule} <span>On the test network you can take your tokens out at any time.</span></p>

        <div className="se-facts">
          <div><span>Yearly rate</span><b>{v.apy == null ? "…" : `${v.apy.toFixed(1)}%`}</b></div>
          <div><span>Uses</span><b>{p.token}</b></div>
          <div><span>In the vault</span><b>{isConnected ? `${show(num(v.inVault))} ${p.token}` : "Connect"}</b></div>
          <div><span>In your wallet</span><b>{isConnected ? `${show(num(v.wallet))} ${p.token}` : "Connect"}</b></div>
        </div>

        {!isConnected ? (
          <button className="se-btn se-btn--wide" onClick={() => setShowWallet(true)}><Wallet size={16} /> Connect wallet to start</button>
        ) : (
          <>
            <div className="se-switch" role="tablist">
              <button role="tab" aria-selected={mode === "in"} className={mode === "in" ? "on" : ""} onClick={() => { setMode("in"); setRun({ state: "idle", step: 0, steps: [] }); }}>Put in</button>
              <button role="tab" aria-selected={mode === "out"} className={mode === "out" ? "on" : ""} onClick={() => { setMode("out"); setRun({ state: "idle", step: 0, steps: [] }); }} disabled={v.shares === BigInt(0)}>Take out</button>
            </div>

            {mode === "in" ? (
              v.wallet === BigInt(0) ? (
                <div className="se-empty">
                  You have no {p.token} yet. Get some from the <Link href="/mine" prefetch={false}>daily drop</Link> or <Link href="/pools" prefetch={false}>swap for it</Link>.
                </div>
              ) : (
                <>
                  <label className="se-label" htmlFor={`amt-${p.id}`}>How many {p.token} to put in</label>
                  <div className="se-box">
                    <input id={`amt-${p.id}`} className="se-input" inputMode="decimal" value={amount} placeholder="0" onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} />
                    <span className="se-unit">{p.token}</span>
                  </div>
                  <div className="se-picks">
                    {[25, 50, 100].map((pc) => {
                      const val = formatUnits((v.wallet * BigInt(pc)) / BigInt(100), DECIMALS);
                      return <button key={pc} className={amount === val ? "se-pick on" : "se-pick"} onClick={() => setAmount(val)}>{pc === 100 ? "All" : `${pc}%`}</button>;
                    })}
                  </div>
                  {amt > 0 && v.apy != null && (
                    <p className="se-estimate">If the rate stays the same, in one year this could be about <b>{show(amt * (1 + v.apy / 100))} {p.token}</b>.</p>
                  )}
                  <button className="se-btn se-btn--wide" onClick={() => void putIn(p)} disabled={busy || !amount}>
                    {busy ? <><Loader2 size={16} className="se-spin" /> Working…</> : <>Put in {amount || ""} {p.token} <ChevronRight size={16} /></>}
                  </button>
                </>
              )
            ) : (
              <>
                <p className="se-label">How much to take out</p>
                <div className="se-picks">
                  {[25, 50, 100].map((pc) => <button key={pc} className={outPct === pc ? "se-pick on" : "se-pick"} onClick={() => setOutPct(pc)}>{pc === 100 ? "All" : `${pc}%`}</button>)}
                </div>
                <p className="se-estimate">You get back about <b>{show(outTokens)} {p.token}</b>, including what it earned.</p>
                <button className="se-btn se-btn--wide" onClick={() => void takeOut(p)} disabled={busy}>
                  {busy ? <><Loader2 size={16} className="se-spin" /> Working…</> : <>Take out {show(outTokens)} {p.token} <ChevronRight size={16} /></>}
                </button>
              </>
            )}

            {run.state !== "idle" && (
              <div className="se-progress">
                {run.steps.map((label, i) => {
                  const done = run.step > i;
                  const now = run.step === i;
                  const failed = run.state === "failed" && now;
                  return (
                    <div key={label} className="se-progress-row">
                      <span className={done ? "se-dot done" : failed ? "se-dot fail" : now ? "se-dot now" : "se-dot"}>
                        {done ? <Check size={12} /> : failed ? <X size={12} /> : now && busy ? <Loader2 size={12} className="se-spin" /> : i + 1}
                      </span>
                      <span style={{ color: done || now ? C.paper : C.ink }}>{label}</span>
                    </div>
                  );
                })}
                {run.message && <p className={run.state === "done" ? "se-ok" : "se-error"}>{run.state === "done" && <Check size={15} />} {run.message}</p>}
                {run.txHash && <a className="se-link" href={`${EXPLORER}/tx/${run.txHash}`} target="_blank" rel="noopener noreferrer">See it on Snowtrace <ExternalLink size={13} /></a>}
              </div>
            )}
          </>
        )}

        {sharing.length > 0 && (
          <p className="se-share">One {p.token} vault is used by {[p.name, ...sharing].join(", ")}. What you put in shows in each of them.</p>
        )}
        <a className="se-link" href={`${EXPLORER}/address/${VAULTS[p.token].address}`} target="_blank" rel="noopener noreferrer">See the {p.token} vault on Snowtrace <ExternalLink size={13} /></a>
      </div>
    );
  };

  return (
    <main className="se">
      <header className="se-top">
        <div className="se-wrap se-top-inner">
          <Link href="/" className="se-back" aria-label="Back to home"><ArrowLeft size={18} /></Link>
          <div style={{ minWidth: 0 }}>
            <h1 className="se-title">Securities &amp; Insurance</h1>
            <p className="se-sub">Put your tokens to work. Take them back any time.</p>
          </div>
          <button className="se-icon" onClick={() => void refresh()} aria-label="Refresh"><RefreshCw size={16} /></button>
          <button className={isConnected ? "se-wallet on" : "se-wallet"} onClick={() => setShowWallet(true)}>
            <Wallet size={15} /><span>{isConnected && address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "Connect"}</span>
          </button>
        </div>
      </header>

      <div className="se-wrap se-body">
        <div className="se-about">
          <button className="se-about-btn" onClick={() => setAboutOpen((o) => !o)} aria-expanded={aboutOpen}>
            <span>How does this work?</span>
            <ChevronDown size={16} style={{ transform: aboutOpen ? "rotate(180deg)" : undefined, transition: "transform .15s" }} />
          </button>
          {aboutOpen && (
            <ol>
              <li><b>Pick a product</b> below, for example Family trust or Crop insurance.</li>
              <li><b>Put in tokens.</b> They go into a KAI vault on Avalanche Fuji, a smart contract, not to a person.</li>
              <li>The vault has a <b>yearly rate</b>. When you <b>take out</b>, you get your tokens back plus what they earned.</li>
              <li>This is a <b>test network</b>: the tokens are test tokens with no real money value.</li>
            </ol>
          )}
        </div>

        {/* My money */}
        <section className="se-card se-mine">
          <p className="se-kicker">My money in vaults</p>
          {!isConnected ? (
            <div className="se-mine-empty">
              <p className="se-muted">Connect your wallet to see what you have put in.</p>
              <button className="se-btn" onClick={() => setShowWallet(true)}><Wallet size={15} /> Connect wallet</button>
            </div>
          ) : myVaults.length === 0 ? (
            <p className="se-muted" style={{ margin: "6px 0 0" }}>Nothing yet. Pick a product below and put in some tokens.</p>
          ) : (
            <div className="se-mine-list">
              {myVaults.map((s) => (
                <div key={s} className="se-mine-row">
                  <span className="se-coin">{s.slice(0, 2)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b>{show(num(info[s].inVault))} {s}</b>
                    <small>{info[s].apy == null ? "" : `${info[s].apy!.toFixed(1)}% a year · `}{PRODUCTS.filter((p) => p.token === s).map((p) => p.name).slice(0, 2).join(", ")}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Tabs */}
        <div>
          <div className="se-tabs" role="tablist">
            {TABS.map((t) => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? "se-tab on" : "se-tab"} onClick={() => { setTab(t.id); setOpenId(null); }}>
                {t.name} <em>{PRODUCTS.filter((p) => p.tab === t.id).length}</em>
              </button>
            ))}
          </div>
          <p className="se-muted" style={{ margin: "10px 0 0" }}>{TABS.find((t) => t.id === tab)!.hint} Tap one to see it and start.</p>
        </div>

        <div className="se-grid">
          {list.map((p) => {
            const Icon = p.icon;
            const v = info[p.token];
            const isOpen = open?.id === p.id;
            return (
              <article key={p.id} className={isOpen ? "se-product open" : "se-product"} style={{ ["--tint" as string]: p.tint }}>
                <button className="se-product-head" onClick={() => choose(p)} aria-expanded={isOpen}>
                  <span className="se-product-icon"><Icon size={20} strokeWidth={1.8} /></span>
                  <span className="se-product-text">
                    <b>{p.name}</b>
                    <small>{p.hint}</small>
                    {v.shares > BigInt(0) && <span className="se-have"><Check size={12} /> You have {show(num(v.inVault))} {p.token} in this vault</span>}
                  </span>
                  <span className="se-rate">
                    <b>{loading ? "…" : v.apy == null ? "—" : `${v.apy.toFixed(1)}%`}</b>
                    <small>a year</small>
                  </span>
                  <ChevronDown size={16} className="se-chev" />
                </button>
                {isOpen && renderDetail(p)}
              </article>
            );
          })}
        </div>
      </div>

      {showWallet && <WalletConnectModal onClose={() => setShowWallet(false)} />}

      <style>{`
        .se { min-height: 100dvh; background: ${C.bg}; color: ${C.paper}; font-family: 'Inter', system-ui, sans-serif; padding-bottom: 110px; }
        .se-wrap { width: min(1080px, calc(100% - 32px)); margin: 0 auto; }
        .se-top { position: sticky; top: 0; z-index: 30; background: ${C.band}; border-bottom: 1px solid ${C.line}; }
        .se-top-inner { display: flex; align-items: center; gap: 10px; padding: 12px 0; }
        .se-back, .se-icon { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; border: none; color: ${C.paper}; background: rgba(246,242,231,0.06); flex-shrink: 0; cursor: pointer; }
        .se-icon { margin-left: auto; color: ${C.dim}; }
        .se-title { margin: 0; font-size: 18px; font-weight: 700; }
        .se-sub { margin: 1px 0 0; font-size: 12.5px; color: ${C.ink}; }
        .se-wallet { display: inline-flex; align-items: center; gap: 7px; padding: 9px 14px; border-radius: 999px; border: none; background: ${C.gold}; color: #1B1A14; font-weight: 700; font-size: 13px; cursor: pointer; font-family: inherit; flex-shrink: 0; }
        .se-wallet.on { background: rgba(125,195,131,0.14); color: ${C.green}; font-family: ui-monospace, monospace; font-weight: 600; }
        @media (max-width: 420px) { .se-wallet span { display: none; } .se-wallet { padding: 9px 11px; } }

        .se-body { display: grid; grid-template-columns: minmax(0, 1fr); gap: 20px; padding-top: 20px; }
        .se-body > * { min-width: 0; }
        .se-muted { font-size: 13.5px; line-height: 1.55; color: ${C.dim}; }
        .se-kicker { margin: 0; font-size: 11.5px; font-weight: 700; letter-spacing: .8px; text-transform: uppercase; color: ${C.ink}; }

        .se-about { border-radius: 14px; background: ${C.band}; }
        .se-about-btn { display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%; padding: 14px 16px; border: none; background: none; color: ${C.paper}; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; text-align: left; }
        .se-about ol { margin: 0; padding: 0 16px 16px 36px; display: grid; gap: 8px; font-size: 13.5px; line-height: 1.55; color: ${C.dim}; }
        .se-about b { color: ${C.paper}; }

        .se-card { padding: 18px; border-radius: 16px; background: ${C.band}; }
        .se-mine-empty { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; }
        .se-mine-empty .se-muted { margin: 6px 0 0; }
        .se-mine-list { display: grid; gap: 8px; margin-top: 10px; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }
        .se-mine-row { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 12px; background: ${C.card}; }
        .se-mine-row b { display: block; font-size: 14px; }
        .se-mine-row small { display: block; font-size: 12px; color: ${C.ink}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .se-coin { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: rgba(200,155,60,0.16); color: ${C.goldLight}; font-size: 12px; font-weight: 800; flex-shrink: 0; }

        .se-tabs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px; padding: 4px; border-radius: 14px; background: ${C.band}; }
        .se-tab { padding: 10px 6px; border-radius: 10px; border: none; background: none; color: ${C.dim}; font-size: 13.5px; font-weight: 700; cursor: pointer; font-family: inherit; display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 42px; }
        .se-tab em { font-style: normal; font-size: 11.5px; color: ${C.ink}; }
        .se-tab.on { background: ${C.gold}; color: #1B1A14; }
        .se-tab.on em { color: #1B1A14; }

        .se-grid { display: grid; gap: 10px; }
        @media (min-width: 900px) { .se-grid { grid-template-columns: 1fr 1fr; align-items: start; } .se-product.open { grid-column: 1 / -1; } }
        .se-product { border-radius: 16px; background: ${C.card}; border: 1.5px solid transparent; transition: border-color .15s; min-width: 0; }
        .se-product.open { border-color: var(--tint); }
        .se-product-head { display: flex; align-items: center; gap: 12px; width: 100%; padding: 14px; border: none; background: none; color: ${C.paper}; cursor: pointer; font-family: inherit; text-align: left; border-radius: 16px; }
        .se-product-head:hover { background: ${C.cardHi}; }
        .se-product-icon { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 50%; color: var(--tint); background: color-mix(in srgb, var(--tint) 16%, ${C.bg}); flex-shrink: 0; }
        .se-product-text { flex: 1; min-width: 0; display: grid; gap: 2px; }
        .se-product-text b { font-size: 15px; }
        .se-product-text small { font-size: 12.5px; color: ${C.ink}; line-height: 1.4; }
        .se-have { display: inline-flex; align-items: center; gap: 5px; margin-top: 4px; font-size: 12px; font-weight: 600; color: ${C.green}; }
        .se-rate { text-align: right; flex-shrink: 0; display: grid; }
        .se-rate b { font-size: 17px; color: ${C.goldLight}; }
        .se-rate small { font-size: 11.5px; color: ${C.ink}; }
        .se-chev { color: ${C.ink}; flex-shrink: 0; transition: transform .15s; }
        .se-product.open .se-chev { transform: rotate(180deg); }

        .se-detail { padding: 0 14px 16px; display: grid; gap: 12px; }
        .se-about-text { margin: 0; font-size: 14px; line-height: 1.55; color: ${C.dim}; }
        .se-rule { margin: 0; padding: 10px 12px; border-radius: 10px; background: rgba(111,168,220,0.1); font-size: 13px; line-height: 1.5; color: ${C.dim}; }
        .se-rule b { color: ${C.paper}; }
        .se-rule span { display: block; margin-top: 2px; color: ${C.ink}; }
        .se-facts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
        @media (min-width: 640px) { .se-facts { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
        .se-facts div { padding: 10px 12px; border-radius: 10px; background: ${C.bg}; display: grid; gap: 2px; min-width: 0; }
        .se-facts span { font-size: 11.5px; color: ${C.ink}; }
        .se-facts b { font-size: 14px; overflow-wrap: anywhere; }

        .se-switch { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 4px; border-radius: 12px; background: ${C.bg}; }
        .se-switch button { padding: 9px; border-radius: 9px; border: none; background: none; color: ${C.dim}; font-weight: 700; font-size: 13.5px; cursor: pointer; font-family: inherit; }
        .se-switch button.on { background: ${C.cardHi}; color: ${C.paper}; }
        .se-switch button:disabled { opacity: .4; cursor: not-allowed; }

        .se-label { margin: 0; font-size: 13.5px; font-weight: 700; }
        .se-box { position: relative; }
        .se-input { width: 100%; box-sizing: border-box; padding: 12px; padding-right: 80px; border-radius: 10px; border: 1px solid rgba(246,242,231,0.12); background: ${C.bg}; color: ${C.paper}; font-size: 17px; font-family: inherit; outline: none; min-height: 48px; }
        .se-input:focus { border-color: ${C.gold}; }
        .se-unit { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); font-size: 13px; font-weight: 700; color: ${C.ink}; pointer-events: none; }
        .se-picks { display: flex; gap: 6px; flex-wrap: wrap; }
        .se-pick { padding: 7px 14px; border-radius: 999px; border: 1px solid rgba(246,242,231,0.14); background: none; color: ${C.dim}; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; min-height: 34px; }
        .se-pick.on { border-color: ${C.gold}; background: rgba(200,155,60,0.14); color: ${C.goldLight}; }
        .se-estimate { margin: 0; font-size: 13.5px; color: ${C.dim}; line-height: 1.5; }
        .se-estimate b { color: ${C.goldLight}; }
        .se-empty { padding: 12px; border-radius: 10px; background: ${C.bg}; font-size: 13.5px; color: ${C.dim}; line-height: 1.5; }
        .se-empty a, .se-link { color: ${C.goldLight}; }
        .se-link { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; text-decoration: none; }
        .se-share { margin: 0; font-size: 12.5px; color: ${C.ink}; line-height: 1.5; }

        .se-btn { display: inline-flex; align-items: center; justify-content: center; gap: 7px; padding: 12px 20px; border-radius: 999px; border: none; background: ${C.gold}; color: #1B1A14; font-weight: 700; font-size: 14.5px; cursor: pointer; font-family: inherit; min-height: 46px; white-space: nowrap; }
        .se-btn:disabled { opacity: .6; cursor: default; }
        .se-btn--wide { width: 100%; }

        .se-progress { padding: 12px 14px; border-radius: 12px; background: ${C.bg}; display: grid; gap: 4px; }
        .se-progress-row { display: flex; align-items: center; gap: 10px; padding: 3px 0; font-size: 13.5px; }
        .se-dot { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; background: rgba(246,242,231,0.08); color: ${C.ink}; font-size: 11px; font-weight: 700; flex-shrink: 0; }
        .se-dot.now { background: rgba(200,155,60,0.22); color: ${C.goldLight}; }
        .se-dot.done { background: ${C.green}; color: #10231A; }
        .se-dot.fail { background: ${C.red}; color: #2A1410; }
        .se-ok { display: flex; align-items: center; gap: 6px; margin: 6px 0 0; font-size: 14px; color: ${C.green}; }
        .se-error { margin: 6px 0 0; font-size: 13.5px; color: ${C.red}; line-height: 1.5; }

        .se-spin { animation: se-spin 1s linear infinite; }
        @keyframes se-spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}
