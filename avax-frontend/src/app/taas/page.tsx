"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, BarChart3, Bot, Check, ChevronDown, ChevronRight, Clock, Copy, Droplets, ExternalLink, FlaskConical,
  Gift, Landmark, Loader2, Plus, Trees, Vote, Wallet, X, type LucideIcon,
} from "lucide-react";
import { useAccount, useDeployContract, usePublicClient, useSwitchChain, useWatchAsset } from "wagmi";
import { avalancheFuji } from "wagmi/chains";
import { parseUnits, type Abi } from "viem";
import WalletConnectModal from "@/components/wallet/WalletConnectModal";
import artifact from "@/lib/blockchain/ecosystemTokenArtifact.json";

/**
 * TaaS — Token as a Service (/taas). Anyone can create their own token on
 * Avalanche Fuji (test network) from their own wallet, in three steps:
 *   1. what the token is for (a type pre-fills sensible values)
 *   2. name, short code and how many
 *   3. create: the wallet deploys contracts/EcosystemToken.sol, and every
 *      token goes to that wallet. The server never signs anything.
 * A live preview shows the token while it is being filled in. Tokens made
 * here are remembered on this device under "My tokens".
 */

const C = {
  bg: "#0E2418", band: "#12301F", card: "#15352A", cardHi: "#1B4032", line: "rgba(246,242,231,0.08)",
  paper: "#F6F2E7", dim: "#C9CFC2", ink: "#9BA396", gold: "#C89B3C", goldLight: "#E4C878",
  green: "#7DC383", red: "#E88C7D",
};
const EXPLORER = "https://testnet.snowtrace.io";
const FAUCET_URL = "https://core.app/tools/testnet-faucet/?subnet=c&token=c";
const LOCAL_KEY = "kai-taas-tokens";

interface TokenType { id: string; name: string; hint: string; icon: LucideIcon; tint: string; example: { name: string; symbol: string; supply: string }; soon?: boolean }

const TYPES: TokenType[] = [
  { id: "rewards", name: "Reward points", hint: "Give points to members for good work, like planting trees.", icon: Gift, tint: "#7DC383", example: { name: "Green Points", symbol: "GREEN", supply: "1000000" } },
  { id: "payments", name: "Payment coin", hint: "A coin your group uses to pay each other.", icon: Wallet, tint: "#6FA8DC", example: { name: "Chama Coin", symbol: "CHAMA", supply: "100000" } },
  { id: "voting", name: "Voting token", hint: "One token is one vote on group decisions.", icon: Vote, tint: "#B39DDB", example: { name: "Group Vote", symbol: "VOTE", supply: "10000" } },
  { id: "asset", name: "Asset shares", hint: "Split something valuable, like land or a harvest, into shares.", icon: Landmark, tint: "#E4C878", example: { name: "Farm Share", symbol: "FARM", supply: "1000" } },
  { id: "fund", name: "Group fund", hint: "Members put money together; each holds shares of the fund.", icon: BarChart3, tint: "#6FC3B8", example: { name: "Community Fund", symbol: "FUND", supply: "100000" } },
  { id: "nft", name: "Conservation certificate", hint: "One-of-a-kind proof for a tree or a forest area.", icon: Trees, tint: "#9BA396", example: { name: "", symbol: "", supply: "1" }, soon: true },
];

const SUPPLY_PICKS = ["1000", "100000", "1000000"];

interface MyToken { address: string; name: string; symbol: string; supply: string; owner: string; txHash: string; createdAt: string }
type Run = { state: "idle" | "running" | "done" | "failed"; step: number; message?: string; faucet?: boolean; txHash?: string; token?: MyToken };

function readTokens(): MyToken[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]") as MyToken[]; } catch { return []; }
}
function saveToken(t: MyToken) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify([t, ...readTokens().filter((x) => x.address !== t.address)].slice(0, 30))); } catch { /* private mode */ }
}

/** "Green Points" -> "GP"; a single word -> its first 5 letters. */
function symbolFrom(name: string): string {
  const words = name.toUpperCase().replace(/[^A-Z0-9 ]/g, "").split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  return (words.length === 1 ? words[0].slice(0, 5) : words.map((w) => w[0]).join("")).slice(0, 8);
}

function problems(name: string, symbol: string, supply: string): string | null {
  if (name.trim().length < 3) return "Give your token a name of at least 3 letters.";
  if (name.trim().length > 40) return "Keep the name under 40 letters.";
  if (!/^[A-Z0-9]{2,8}$/.test(symbol)) return "The short code must be 2 to 8 capital letters or numbers, like GREEN.";
  if (!/^\d+$/.test(supply) || Number(supply) < 1) return "How many tokens: type a whole number, like 1000.";
  if (Number(supply) > 1_000_000_000_000) return "That is too many. Use at most 1,000,000,000,000.";
  return null;
}

function friendlyError(e: unknown): { message: string; faucet?: boolean } {
  const m = e instanceof Error ? e.message : String(e);
  if (/reject|denied|cancel/i.test(m)) return { message: "You cancelled in your wallet. Nothing was created and nothing was paid." };
  if (/insufficient funds|exceeds balance/i.test(m)) return { message: "Your wallet has no test AVAX for the network fee. Get free test AVAX, then try again.", faucet: true };
  if (/chain|network/i.test(m)) return { message: "Could not switch your wallet to Avalanche Fuji. Switch it in your wallet and try again." };
  return { message: m.split("\n")[0].slice(0, 160) || "Something went wrong. Try again." };
}

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const fmt = (n: string) => (/^\d+$/.test(n) ? Number(n).toLocaleString() : n || "0");

export default function TaasPage() {
  const { address, isConnected } = useAccount();
  const { deployContractAsync } = useDeployContract();
  const { switchChainAsync } = useSwitchChain();
  const { watchAssetAsync } = useWatchAsset();
  const publicClient = usePublicClient({ chainId: avalancheFuji.id });

  const [typeId, setTypeId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [symbolEdited, setSymbolEdited] = useState(false);
  const [supply, setSupply] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [run, setRun] = useState<Run>({ state: "idle", step: 0 });
  const [mine, setMine] = useState<MyToken[]>([]);
  const [showWallet, setShowWallet] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [added, setAdded] = useState<string[]>([]);

  // "My tokens" lives on this device; show the ones this wallet created.
  useEffect(() => {
    const t = setTimeout(() => setMine(readTokens()), 0);
    return () => clearTimeout(t);
  }, []);
  const myTokens = useMemo(() => (address ? mine.filter((t) => t.owner.toLowerCase() === address.toLowerCase()) : []), [mine, address]);

  const type = TYPES.find((t) => t.id === typeId) ?? null;
  const busy = run.state === "running";

  const pickType = (t: TokenType) => {
    if (t.soon) return;
    setTypeId(t.id);
    setName(t.example.name);
    setSymbol(t.example.symbol);
    setSymbolEdited(false);
    setSupply(t.example.supply);
    setError(null);
    setRun({ state: "idle", step: 0 });
  };

  const onName = (v: string) => {
    setName(v);
    if (!symbolEdited) setSymbol(symbolFrom(v));
  };

  const create = async () => {
    const problem = problems(name, symbol, supply);
    setError(problem);
    if (problem) return;
    if (!address) { setShowWallet(true); return; }
    setRun({ state: "running", step: 0 });
    try {
      await switchChainAsync({ chainId: avalancheFuji.id });
      setRun({ state: "running", step: 1 });
      const txHash = await deployContractAsync({
        abi: artifact.abi as Abi,
        bytecode: artifact.bytecode as `0x${string}`,
        args: [name.trim(), symbol, parseUnits(supply, 18)],
        chainId: avalancheFuji.id,
      });
      setRun({ state: "running", step: 2, txHash });
      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash, timeout: 120_000 });
      if (receipt.status !== "success" || !receipt.contractAddress) throw new Error("The blockchain did not accept the token. Nothing was created.");
      const token: MyToken = { address: receipt.contractAddress, name: name.trim(), symbol, supply, owner: address, txHash, createdAt: new Date().toISOString() };
      saveToken(token);
      setMine(readTokens());
      setRun({ state: "done", step: 3, txHash, token });
    } catch (e) {
      const f = friendlyError(e);
      setRun((r) => ({ ...r, state: "failed", message: f.message, faucet: f.faucet }));
    }
  };

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(text); setTimeout(() => setCopied(null), 1500); } catch { /* no clipboard */ }
  };

  const addToWallet = async (t: MyToken) => {
    try {
      await watchAssetAsync({ type: "ERC20", options: { address: t.address as `0x${string}`, symbol: t.symbol, decimals: 18 } });
      setAdded((a) => [...a, t.address]);
    } catch { /* the wallet said no, or does not support it */ }
  };

  const reset = () => {
    setTypeId(null); setName(""); setSymbol(""); setSupply(""); setSymbolEdited(false); setRun({ state: "idle", step: 0 }); setError(null);
  };

  const previewTint = type?.tint ?? C.gold;
  const PreviewIcon = type?.icon ?? Plus;

  return (
    <main className="tx">
      {/* Top bar */}
      <header className="tx-top">
        <div className="tx-wrap tx-top-inner">
          <Link href="/" className="tx-back" aria-label="Back to home"><ArrowLeft size={18} /></Link>
          <div style={{ minWidth: 0 }}>
            <h1 className="tx-title">Create a token</h1>
            <p className="tx-sub">TaaS · Token as a Service</p>
          </div>
          <button className={isConnected ? "tx-wallet tx-wallet--on" : "tx-wallet"} onClick={() => setShowWallet(true)}>
            <Wallet size={15} />
            <span>{isConnected && address ? short(address) : "Connect"}</span>
          </button>
        </div>
      </header>

      <div className="tx-wrap tx-body">
        {/* What is a token? */}
        <div className="tx-about">
          <button className="tx-about-btn" onClick={() => setAboutOpen((o) => !o)} aria-expanded={aboutOpen}>
            <span>What is a token, and what can I do with it?</span>
            <ChevronDown size={16} style={{ transform: aboutOpen ? "rotate(180deg)" : undefined, transition: "transform .15s" }} />
          </button>
          {aboutOpen && (
            <ol>
              <li>A token is <b>your own digital coin</b>. You choose its name, a short code (like GREEN) and how many exist.</li>
              <li>When you create it, <b>all of them go to your wallet</b>. You can then send them to people, use them as rewards or votes, or add them to a pool so people can swap.</li>
              <li>This runs on <b>Avalanche Fuji, a test network</b>. It is free to try: you only pay a tiny network fee in test AVAX.</li>
            </ol>
          )}
        </div>

        <div className="tx-grid">
          {/* Builder */}
          <section className="tx-left">
            <h2 className="tx-step"><span>1</span> What is your token for?</h2>
            <div className="tx-types">
              {TYPES.map((t) => {
                const Icon = t.icon;
                return (
                  <button key={t.id} onClick={() => pickType(t)} disabled={t.soon} className={typeId === t.id ? "tx-type tx-type--on" : "tx-type"} style={{ ["--tint" as string]: t.tint }}>
                    <span className="tx-type-icon"><Icon size={20} strokeWidth={1.8} /></span>
                    <span className="tx-type-name">{t.name}{t.soon && <em><Clock size={11} /> Soon</em>}</span>
                    <span className="tx-type-hint">{t.hint}</span>
                  </button>
                );
              })}
            </div>

            {type && run.state !== "done" && (
              <>
                <h2 className="tx-step"><span>2</span> Name it</h2>
                <div className="tx-card tx-fields">
                  <div className="tx-field">
                    <label htmlFor="tx-name" className="tx-label">Token name</label>
                    <span className="tx-hint">What people will see, for example &quot;{type.example.name}&quot;.</span>
                    <input id="tx-name" className="tx-input" value={name} onChange={(e) => onName(e.target.value)} maxLength={40} placeholder="e.g. Green Points" />
                  </div>
                  <div className="tx-field">
                    <label htmlFor="tx-symbol" className="tx-label">Short code</label>
                    <span className="tx-hint">2 to 8 capital letters, like a shop price tag: {type.example.symbol}. We suggest one from the name.</span>
                    <input id="tx-symbol" className="tx-input tx-mono" value={symbol} maxLength={8} placeholder="GREEN"
                      onChange={(e) => { setSymbolEdited(true); setSymbol(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")); }} />
                  </div>
                  <div className="tx-field">
                    <label htmlFor="tx-supply" className="tx-label">How many tokens</label>
                    <span className="tx-hint">This number is fixed forever. All of them go to your wallet.</span>
                    <div className="tx-box">
                      <input id="tx-supply" className="tx-input" inputMode="numeric" value={supply} placeholder="1000000"
                        onChange={(e) => setSupply(e.target.value.replace(/[^\d]/g, ""))} style={{ paddingRight: 16 + Math.max(symbol.length, 3) * 9 }} />
                      <span className="tx-unit">{symbol || "tokens"}</span>
                    </div>
                    <div className="tx-picks">
                      {SUPPLY_PICKS.map((p) => (
                        <button key={p} type="button" onClick={() => setSupply(p)} className={supply === p ? "tx-pick tx-pick--on" : "tx-pick"}>{fmt(p)}</button>
                      ))}
                    </div>
                  </div>
                </div>

                <h2 className="tx-step"><span>3</span> Create it</h2>
                <div className="tx-card">
                  <p className="tx-muted" style={{ marginTop: 0 }}>
                    Your wallet will ask you to approve. It costs <b>only a tiny network fee</b> in test AVAX. No KAI fee.
                  </p>
                  {error && <p className="tx-error">{error}</p>}
                  <button className="tx-btn tx-btn--wide" onClick={() => void create()} disabled={busy}>
                    {busy ? <><Loader2 size={16} className="tx-spin" /> Creating…</> : !isConnected ? <><Wallet size={16} /> Connect wallet to create</> : <>Create {symbol || "my token"} <ChevronRight size={16} /></>}
                  </button>

                  {run.state !== "idle" && (
                    <div className="tx-progress">
                      {["Switch wallet to Avalanche Fuji", "Approve in your wallet", "Wait for the blockchain (about 5 seconds)"].map((label, i) => {
                        const done = run.step > i;
                        const now = run.step === i;
                        const failed = run.state === "failed" && now;
                        return (
                          <div key={label} className="tx-progress-row">
                            <span className={done ? "tx-dot tx-dot--done" : failed ? "tx-dot tx-dot--fail" : now ? "tx-dot tx-dot--now" : "tx-dot"}>
                              {done ? <Check size={12} /> : failed ? <X size={12} /> : now && busy ? <Loader2 size={12} className="tx-spin" /> : i + 1}
                            </span>
                            <span style={{ color: done || now ? C.paper : C.ink }}>{label}</span>
                          </div>
                        );
                      })}
                      {run.state === "failed" && (
                        <p className="tx-error" style={{ marginBottom: 0 }}>
                          {run.message} {run.faucet && <a href={FAUCET_URL} target="_blank" rel="noopener noreferrer">Get free test AVAX</a>}
                        </p>
                      )}
                      {run.txHash && (
                        <a className="tx-link" href={`${EXPLORER}/tx/${run.txHash}`} target="_blank" rel="noopener noreferrer" style={{ marginTop: 8 }}>
                          See it on Snowtrace <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Success */}
            {run.state === "done" && run.token && (
              <div className="tx-card tx-done">
                <p className="tx-done-title"><Check size={18} /> Your token is ready</p>
                <p className="tx-muted" style={{ marginTop: 4 }}>
                  <b>{fmt(run.token.supply)} {run.token.symbol}</b> are now in your wallet.
                </p>
                <div className="tx-addr">
                  <span className="tx-kicker">Token address</span>
                  <code>{run.token.address}</code>
                  <button className="tx-btn tx-btn--quiet tx-btn--small" onClick={() => void copy(run.token!.address)}>
                    {copied === run.token.address ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                  </button>
                </div>
                <div className="tx-done-btns">
                  <button className="tx-btn" onClick={() => void addToWallet(run.token!)} disabled={added.includes(run.token.address)}>
                    {added.includes(run.token.address) ? <><Check size={15} /> Added to wallet</> : <><Wallet size={15} /> Show it in my wallet</>}
                  </button>
                  <a className="tx-btn tx-btn--quiet" href={`${EXPLORER}/address/${run.token.address}`} target="_blank" rel="noopener noreferrer">See on Snowtrace <ExternalLink size={14} /></a>
                </div>
                <p className="tx-kicker" style={{ marginTop: 18 }}>What next?</p>
                <div className="tx-next">
                  <Link href="/pools" prefetch={false} className="tx-next-row"><Droplets size={18} /> <span><b>Add it to a pool</b><small>So people can swap for your token</small></span><ChevronRight size={16} /></Link>
                  <Link href="/ai" prefetch={false} className="tx-next-row"><Bot size={18} /> <span><b>Ask KAI AI</b><small>How to share it with your group</small></span><ChevronRight size={16} /></Link>
                  <button className="tx-next-row" onClick={reset}><Plus size={18} /> <span><b>Create another token</b><small>Start again from step 1</small></span><ChevronRight size={16} /></button>
                </div>
              </div>
            )}
          </section>

          {/* Live preview + my tokens */}
          <aside className="tx-right">
            <div className="tx-card tx-preview" style={{ ["--tint" as string]: previewTint }}>
              <p className="tx-kicker">Preview</p>
              <div className="tx-coin"><PreviewIcon size={30} strokeWidth={1.7} /></div>
              <p className="tx-preview-name">{name.trim() || "Your token name"}</p>
              <p className="tx-preview-symbol">{symbol || "CODE"}</p>
              <dl className="tx-dl">
                <dt>How many</dt><dd>{fmt(supply)} {symbol}</dd>
                <dt>Goes to</dt><dd>{address ? `Your wallet (${short(address)})` : "Your wallet"}</dd>
                <dt>Type</dt><dd>{type?.name ?? "Not chosen"}</dd>
                <dt>Network</dt><dd>Avalanche Fuji (test)</dd>
                <dt>Cost</dt><dd>Tiny network fee only</dd>
              </dl>
            </div>

            <div className="tx-card">
              <p className="tx-kicker" style={{ marginBottom: 10 }}>My tokens</p>
              {!isConnected ? (
                <p className="tx-muted" style={{ margin: 0 }}>Connect your wallet to see tokens you made.</p>
              ) : myTokens.length === 0 ? (
                <p className="tx-muted" style={{ margin: 0 }}>None yet. The tokens you create on this phone or computer show here.</p>
              ) : (
                <div className="tx-mine">
                  {myTokens.map((t) => (
                    <div key={t.address} className="tx-mine-row">
                      <span className="tx-mine-coin">{t.symbol.slice(0, 2)}</span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p className="tx-mine-name">{t.name}</p>
                        <p className="tx-mine-meta">{fmt(t.supply)} {t.symbol} · {new Date(t.createdAt).toLocaleDateString()}</p>
                      </div>
                      <button className="tx-icon-btn" onClick={() => void copy(t.address)} aria-label={`Copy ${t.symbol} address`}>{copied === t.address ? <Check size={15} /> : <Copy size={15} />}</button>
                      <a className="tx-icon-btn" href={`${EXPLORER}/address/${t.address}`} target="_blank" rel="noopener noreferrer" aria-label={`See ${t.symbol} on Snowtrace`}><ExternalLink size={15} /></a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="tx-card">
              <p className="tx-kicker" style={{ marginBottom: 10 }}>Need help?</p>
              <div className="tx-next">
                <Link href="/ai" prefetch={false} className="tx-next-row"><Bot size={18} /> <span><b>Ask KAI AI</b><small>Explain tokens in simple words</small></span><ChevronRight size={16} /></Link>
                <Link href="/nuvari" prefetch={false} className="tx-next-row"><FlaskConical size={18} /> <span><b>Playground</b><small>Try insurance, trusts and pensions</small></span><ChevronRight size={16} /></Link>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {showWallet && <WalletConnectModal onClose={() => setShowWallet(false)} />}

      <style>{`
        .tx { min-height: 100dvh; background: ${C.bg}; color: ${C.paper}; font-family: 'Inter', system-ui, sans-serif; padding-bottom: 110px; }
        .tx-wrap { width: min(1080px, calc(100% - 32px)); margin: 0 auto; }
        .tx-top { position: sticky; top: 0; z-index: 30; background: ${C.band}; border-bottom: 1px solid ${C.line}; }
        .tx-top-inner { display: flex; align-items: center; gap: 12px; padding: 12px 0; }
        .tx-back { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; color: ${C.paper}; background: rgba(246,242,231,0.06); flex-shrink: 0; }
        .tx-title { margin: 0; font-size: 18px; font-weight: 700; }
        .tx-sub { margin: 1px 0 0; font-size: 12.5px; color: ${C.ink}; }
        .tx-wallet { margin-left: auto; display: inline-flex; align-items: center; gap: 7px; padding: 9px 14px; border-radius: 999px; border: none; background: ${C.gold}; color: #1B1A14; font-weight: 700; font-size: 13px; cursor: pointer; font-family: inherit; flex-shrink: 0; }
        .tx-wallet--on { background: rgba(125,195,131,0.14); color: ${C.green}; font-family: ui-monospace, monospace; font-weight: 600; }

        .tx-body { display: grid; grid-template-columns: minmax(0, 1fr); gap: 20px; padding-top: 20px; }
        .tx-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 24px; }
        @media (min-width: 920px) {
          .tx-grid { grid-template-columns: minmax(0, 1fr) 340px; align-items: start; }
          .tx-right { position: sticky; top: 84px; }
        }
        .tx-left, .tx-right { display: grid; gap: 14px; min-width: 0; align-content: start; }
        .tx-right { gap: 12px; }

        .tx-about { border-radius: 14px; background: ${C.band}; }
        .tx-about-btn { display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%; padding: 14px 16px; border: none; background: none; color: ${C.paper}; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; text-align: left; }
        .tx-about ol { margin: 0; padding: 0 16px 16px 36px; display: grid; gap: 8px; font-size: 13.5px; line-height: 1.55; color: ${C.dim}; }
        .tx-about b { color: ${C.paper}; }

        .tx-step { display: flex; align-items: center; gap: 10px; margin: 10px 0 0; font-size: 15px; font-weight: 700; }
        .tx-step span { display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; background: ${C.gold}; color: #1B1A14; font-size: 12.5px; flex-shrink: 0; }
        .tx-types { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        @media (min-width: 640px) { .tx-types { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        .tx-type { display: grid; gap: 6px; align-content: start; text-align: left; padding: 14px; border-radius: 14px; border: 1.5px solid transparent; background: ${C.card}; color: ${C.paper}; cursor: pointer; font-family: inherit; transition: background .15s, border-color .15s, transform .15s; }
        .tx-type:hover:not(:disabled) { background: ${C.cardHi}; transform: translateY(-1px); }
        .tx-type:disabled { opacity: .55; cursor: not-allowed; }
        .tx-type--on { border-color: var(--tint); background: ${C.cardHi}; }
        .tx-type-icon { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; color: var(--tint); background: color-mix(in srgb, var(--tint) 16%, ${C.bg}); }
        .tx-type-name { font-size: 14px; font-weight: 700; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
        .tx-type-name em { font-style: normal; display: inline-flex; align-items: center; gap: 3px; font-size: 10.5px; padding: 1px 7px; border-radius: 999px; background: rgba(246,242,231,0.08); color: ${C.ink}; }
        .tx-type-hint { font-size: 12.5px; line-height: 1.4; color: ${C.ink}; }

        .tx-card { padding: 18px; border-radius: 16px; background: ${C.band}; min-width: 0; }
        .tx-fields { display: grid; gap: 18px; }
        .tx-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        .tx-label { font-size: 13.5px; font-weight: 700; color: ${C.paper}; }
        .tx-hint { font-size: 12.5px; color: ${C.ink}; line-height: 1.45; }
        .tx-input { width: 100%; box-sizing: border-box; padding: 12px; border-radius: 10px; border: 1px solid rgba(246,242,231,0.12); background: ${C.bg}; color: ${C.paper}; font-size: 16px; font-family: inherit; outline: none; min-height: 46px; }
        .tx-input:focus { border-color: ${C.gold}; }
        .tx-mono { font-family: ui-monospace, monospace; letter-spacing: 1px; }
        .tx-box { position: relative; }
        .tx-unit { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); font-size: 13px; font-weight: 700; color: ${C.ink}; pointer-events: none; font-family: ui-monospace, monospace; }
        .tx-picks { display: flex; flex-wrap: wrap; gap: 6px; }
        .tx-pick { padding: 6px 12px; border-radius: 999px; border: 1px solid rgba(246,242,231,0.14); background: none; color: ${C.dim}; font-size: 12.5px; font-weight: 600; cursor: pointer; font-family: inherit; min-height: 32px; }
        .tx-pick--on { border-color: ${C.gold}; background: rgba(200,155,60,0.14); color: ${C.goldLight}; }

        .tx-muted { font-size: 13.5px; line-height: 1.55; color: ${C.dim}; }
        .tx-muted b { color: ${C.paper}; }
        .tx-kicker { margin: 0; font-size: 11.5px; font-weight: 700; letter-spacing: .8px; text-transform: uppercase; color: ${C.ink}; }
        .tx-error { margin: 0 0 12px; font-size: 13.5px; color: ${C.red}; line-height: 1.5; }
        .tx-error a, .tx-link { color: ${C.goldLight}; }
        .tx-link { display: inline-flex; align-items: center; gap: 6px; font-size: 13.5px; font-weight: 600; text-decoration: none; }

        .tx-btn { display: inline-flex; align-items: center; justify-content: center; gap: 7px; padding: 12px 20px; border-radius: 999px; border: none; background: ${C.gold}; color: #1B1A14; font-weight: 700; font-size: 14.5px; cursor: pointer; font-family: inherit; min-height: 46px; text-decoration: none; white-space: nowrap; transition: transform .1s; }
        .tx-btn:active:not(:disabled) { transform: scale(.98); }
        .tx-btn:disabled { opacity: .65; cursor: default; }
        .tx-btn--wide { width: 100%; }
        .tx-btn--quiet { background: rgba(246,242,231,0.08); color: ${C.paper}; }
        .tx-btn--small { padding: 6px 12px; min-height: 34px; font-size: 12.5px; }

        .tx-progress { margin-top: 14px; padding: 14px; border-radius: 12px; background: ${C.card}; display: flex; flex-direction: column; }
        .tx-progress-row { display: flex; align-items: center; gap: 10px; padding: 5px 0; font-size: 13.5px; }
        .tx-dot { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; background: rgba(246,242,231,0.08); color: ${C.ink}; font-size: 11px; font-weight: 700; flex-shrink: 0; }
        .tx-dot--now { background: rgba(200,155,60,0.22); color: ${C.goldLight}; }
        .tx-dot--done { background: ${C.green}; color: #10231A; }
        .tx-dot--fail { background: ${C.red}; color: #2A1410; }

        .tx-done { border: 1.5px solid rgba(125,195,131,0.4); }
        .tx-done-title { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 17px; font-weight: 700; color: ${C.green}; }
        .tx-addr { display: grid; gap: 6px; margin-top: 14px; padding: 12px; border-radius: 12px; background: ${C.card}; justify-items: start; }
        .tx-addr code { font-size: 13px; overflow-wrap: anywhere; color: ${C.paper}; }
        .tx-done-btns { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
        .tx-next { display: grid; gap: 6px; margin-top: 8px; }
        .tx-next-row { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px; border-radius: 12px; border: none; background: ${C.card}; color: ${C.goldLight}; text-decoration: none; cursor: pointer; font-family: inherit; text-align: left; }
        .tx-next-row:hover { background: ${C.cardHi}; }
        .tx-next-row span { flex: 1; display: grid; gap: 2px; min-width: 0; }
        .tx-next-row b { color: ${C.paper}; font-size: 14px; }
        .tx-next-row small { color: ${C.ink}; font-size: 12.5px; }

        .tx-preview { text-align: center; }
        .tx-coin { display: grid; place-items: center; width: 84px; height: 84px; margin: 14px auto 10px; border-radius: 50%; color: var(--tint); background: color-mix(in srgb, var(--tint) 16%, ${C.bg}); border: 2px solid color-mix(in srgb, var(--tint) 45%, transparent); transition: color .2s, border-color .2s; }
        .tx-preview-name { margin: 0; font-size: 17px; font-weight: 700; overflow-wrap: anywhere; }
        .tx-preview-symbol { margin: 2px 0 0; font-family: ui-monospace, monospace; font-size: 13px; letter-spacing: 1px; color: ${C.goldLight}; }
        .tx-dl { display: grid; grid-template-columns: auto 1fr; gap: 7px 12px; margin: 16px 0 0; font-size: 13px; text-align: left; }
        .tx-dl dt { color: ${C.ink}; }
        .tx-dl dd { margin: 0; text-align: right; overflow-wrap: anywhere; }

        .tx-mine { display: grid; gap: 6px; }
        .tx-mine-row { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 12px; background: ${C.card}; }
        .tx-mine-coin { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: rgba(200,155,60,0.16); color: ${C.goldLight}; font-size: 12px; font-weight: 800; flex-shrink: 0; }
        .tx-mine-name { margin: 0; font-size: 13.5px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .tx-mine-meta { margin: 2px 0 0; font-size: 12px; color: ${C.ink}; }
        .tx-icon-btn { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; border: none; background: rgba(246,242,231,0.06); color: ${C.goldLight}; cursor: pointer; flex-shrink: 0; }

        .tx-spin { animation: tx-spin 1s linear infinite; }
        @keyframes tx-spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}
