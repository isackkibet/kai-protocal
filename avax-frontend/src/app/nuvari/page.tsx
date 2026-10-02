"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAccount, useSendTransaction, useSwitchChain } from "wagmi";
import { avalancheFuji } from "wagmi/chains";
import { parseEther } from "viem";
import {
  ArrowLeft, Briefcase, Building2, Check, ChevronRight, Droplet, ExternalLink, HeartPulse, Landmark, Loader2,
  Milk, PiggyBank, ScrollText, Search, Shield, Sparkles, Sprout, Trees, Users, Wallet, Wheat, X, type LucideIcon,
} from "lucide-react";
import { OPERATIONS, OWNER_ACCOUNT, type Operation } from "@/lib/operations/operationSchemas";
import { TREASURY as TREASURY_FROM_LIB } from "@/lib/blockchain/addresses";
import WalletConnectModal from "@/components/wallet/WalletConnectModal";

/**
 * KAI Playground (/nuvari): try KAI policies (insurance, trusts, pensions,
 * community reserves) on the Avalanche Fuji test network.
 *
 * One guided page instead of a developer console:
 *   1. What do you want to set up?   (a service)
 *   2. What do you want to do?       (start / manage / look up)
 *   3. Fill in and confirm           (the wallet signs a 0.0001 test-AVAX fee)
 * Look-ups are free: they read saved policies and never ask the wallet.
 * The raw log and JSON payload are still there under "Technical details".
 */

const FUJI_CHAIN_ID = avalancheFuji.id;
const TREASURY = (TREASURY_FROM_LIB ?? "0xB13727161583e38185530755a1A96D00fcCae870") as `0x${string}`;
const FEE_AVAX = "0.0001";
const FAUCET_URL = "https://core.app/tools/testnet-faucet/?subnet=c&token=c";
const LOCAL_KEY = "kai-playground-policies";

const C = {
  bg: "#0E2418", band: "#12301F", card: "#15352A", cardHi: "#1B4032", line: "rgba(246,242,231,0.08)",
  paper: "#F6F2E7", dim: "#C9CFC2", ink: "#9BA396", gold: "#C89B3C", goldLight: "#E4C878",
  green: "#7DC383", red: "#E88C7D", blue: "#6FA8DC",
};

// ── Types ────────────────────────────────────────────────────
type ServiceId = "insurance" | "trust" | "pension" | "community" | "mine";
type Value = string | boolean;
type Group = "start" | "manage" | "lookup";

interface Field {
  key: string; label: string; type: "text" | "number" | "select" | "boolean";
  options?: string[]; hint?: string; placeholder?: string; required?: boolean; default: Value;
}
interface Action {
  id: string; name: string; description: string; group: Group; badge?: string;
  serviceType: string; fields: Field[]; free: boolean;
  /** Values that come with a ready-made template but have no field of their own. */
  extra?: Record<string, Value>;
}
interface Policy {
  policyId: string; serviceType: string; owner: string; config: Record<string, unknown>;
  paymentTxHash?: string; status: string; createdAt: string;
}
interface Run {
  state: "idle" | "running" | "done" | "failed";
  step: number; // 0 switch network, 1 pay, 2 save, 3 finished
  message?: string; txUrl?: string; policyId?: string; faucet?: boolean;
  /** Paid on-chain but not saved yet: "Try again" saves with this payment. */
  unsavedTx?: `0x${string}`;
}

// ── Services (step 1) ────────────────────────────────────────
const SERVICES: { id: ServiceId; name: string; hint: string; icon: LucideIcon; tint: string }[] = [
  { id: "insurance", name: "Insurance", hint: "Protect people, crops, cars or property", icon: Shield, tint: C.blue },
  { id: "trust", name: "Trust", hint: "Keep money safe for family or a group", icon: Users, tint: C.goldLight },
  { id: "pension", name: "Pension", hint: "Save every month, receive it later", icon: PiggyBank, tint: "#B39DDB" },
  { id: "community", name: "Community", hint: "Crops, forest, honey, milk, seeds", icon: Sprout, tint: C.green },
  { id: "mine", name: "My policies", hint: "See and use what you created", icon: Briefcase, tint: "#E8A0A0" },
];

const GROUP_TITLE: Record<Group, string> = { start: "Start something new", manage: "Change a policy you have", lookup: "Look up (free)" };

// ── Community reserves (were "Build Policy") ────────────────
const COMMUNITY: Record<string, { icon: LucideIcon; label: string; hint: string; fields: { key: string; label: string; placeholder: string; type?: "number" }[] }> = {
  pension: { icon: PiggyBank, label: "KAIVAX Pension", hint: "A simple savings pension in NVR",
    fields: [{ key: "vestingYears", label: "Years before you can withdraw", placeholder: "5", type: "number" }, { key: "monthlyDeposit", label: "Monthly deposit (NVR)", placeholder: "100", type: "number" }, { key: "beneficiary", label: "Who receives it (wallet address)", placeholder: "0x…" }] },
  trust: { icon: Landmark, label: "KAI Trust", hint: "Lock NVR for someone for a few years",
    fields: [{ key: "lockYears", label: "Locked for (years)", placeholder: "5", type: "number" }, { key: "amount", label: "Amount (NVR)", placeholder: "1000", type: "number" }, { key: "beneficiary", label: "Who receives it (wallet address)", placeholder: "0x…" }] },
  crop: { icon: Wheat, label: "Crop Insurance", hint: "Cover a farm season against bad weather",
    fields: [{ key: "cropType", label: "Crop", placeholder: "Maize" }, { key: "hectares", label: "Farm size (hectares)", placeholder: "10", type: "number" }, { key: "season", label: "Season (year)", placeholder: "2026", type: "number" }] },
  forest: { icon: Trees, label: "Forest Protection", hint: "Cover a forest area for some months",
    fields: [{ key: "forestId", label: "Forest ID or parcel", placeholder: "KE-001" }, { key: "hectares", label: "Hectares covered", placeholder: "50", type: "number" }, { key: "duration", label: "Cover length (months)", placeholder: "12", type: "number" }] },
  medical: { icon: HeartPulse, label: "Medical Pool", hint: "A group shares medical costs",
    fields: [{ key: "members", label: "Number of members", placeholder: "100", type: "number" }, { key: "coverageUsd", label: "Most paid per person (USD)", placeholder: "500", type: "number" }, { key: "duration", label: "Length (months)", placeholder: "12", type: "number" }] },
  rwa: { icon: Building2, label: "Land & Assets", hint: "Put a real asset like land on-chain",
    fields: [{ key: "assetType", label: "What is it", placeholder: "Land" }, { key: "valuationUsd", label: "Value (USD)", placeholder: "10000", type: "number" }, { key: "location", label: "Location or parcel ID", placeholder: "Nairobi, KE-042" }] },
  honey: { icon: Droplet, label: "Honey Reserve", hint: "A beekeeping group's harvest target",
    fields: [{ key: "community", label: "Group name", placeholder: "Turkana Beekeepers" }, { key: "kgTarget", label: "Target (kg)", placeholder: "500", type: "number" }, { key: "season", label: "Harvest season", placeholder: "2026" }] },
  milk: { icon: Milk, label: "Milk Pool", hint: "A dairy co-op pools daily milk",
    fields: [{ key: "cooperative", label: "Co-op name", placeholder: "Maasai Dairy Coop" }, { key: "litresDaily", label: "Litres per day", placeholder: "200", type: "number" }, { key: "duration", label: "Length (months)", placeholder: "6", type: "number" }] },
  seeds: { icon: Sprout, label: "Seed Bank", hint: "Store traditional seeds safely",
    fields: [{ key: "variety", label: "Seed variety", placeholder: "Njahi Beans" }, { key: "kgStored", label: "Kg to store", placeholder: "50", type: "number" }, { key: "location", label: "Where it is stored", placeholder: "Meru, Kenya" }] },
  recipe: { icon: ScrollText, label: "Recipe Vault", hint: "Protect a community's recipe or method",
    fields: [{ key: "recipeName", label: "Recipe or method", placeholder: "Fermented Uji" }, { key: "community", label: "Community that owns it", placeholder: "Luo Heritage Group" }, { key: "licenseType", label: "Who may use it", placeholder: "Community Commons" }] },
};

// ── Build the action list from the operation registry ───────
function fieldsOf(op: Operation, template?: Record<string, unknown>): Field[] {
  return op.fields.map((f) => {
    const raw = template && f.key in template ? template[f.key] : f.default;
    return {
      key: f.key, label: f.label, type: f.type === "textarea" ? "text" : f.type, options: f.options, hint: f.hint, required: f.required,
      default: typeof raw === "boolean" ? raw : raw == null || raw === "pol_" ? "" : String(raw),
      placeholder: /Id$/.test(f.key) ? "pol_…" : /address|account/i.test(f.label) ? "0x…" : undefined,
    };
  });
}

function actionFromOp(op: Operation): Action {
  // Ready-made templates have no fields of their own: show the matching
  // "create" form, pre-filled, so they can still be checked and changed.
  if (op.category === "template") {
    const create = OPERATIONS.find((o) => o.service === op.service && o.id.endsWith("_create"));
    const fields = create ? fieldsOf(create, op.template) : [];
    const extra = Object.fromEntries(Object.entries(op.template ?? {}).filter(([k]) => !fields.some((f) => f.key === k)).map(([k, v]) => [k, typeof v === "boolean" ? v : String(v)]));
    return { id: op.id, name: op.name, description: op.description, group: "start", badge: "Ready-made", serviceType: op.service, fields, free: false, extra };
  }
  return {
    id: op.id, name: op.name, description: op.description, badge: op.badge,
    group: op.category === "query" ? "lookup" : op.category === "transaction" ? "manage" : "start",
    serviceType: op.service === "all" ? "policy" : op.service, fields: fieldsOf(op), free: op.category === "query",
  };
}

function actionsFor(service: ServiceId): Action[] {
  if (service === "community") {
    return Object.entries(COMMUNITY).map(([id, t]) => ({
      id: `community_${id}`, name: t.label, description: t.hint, group: "start" as const, serviceType: id, free: false,
      fields: t.fields.map((f) => ({ key: f.key, label: f.label, type: f.type ?? "text", placeholder: f.placeholder, required: true, default: "" })),
    }));
  }
  if (service === "mine") {
    return OPERATIONS.filter((o) => o.service === "all" || o.category === "query").map(actionFromOp);
  }
  // Quick actions first, then templates, then the rest in registry order.
  const rank = (o: Operation) => (o.category === "quick" ? 0 : o.category === "template" ? 1 : 2);
  return OPERATIONS.filter((o) => o.service === service).sort((a, b) => rank(a) - rank(b)).map(actionFromOp);
}

const ALL_ACTIONS: { action: Action; service: ServiceId }[] = (["insurance", "trust", "pension", "community"] as const)
  .flatMap((s) => actionsFor(s).map((action) => ({ action, service: s as ServiceId })));

// ── Helpers ─────────────────────────────────────────────────
function policyName(p: Policy): string {
  const c = p.config ?? {};
  const name = c.policyTitle ?? c.title ?? c.planTitle ?? c.trustName ?? c.cropType ?? c.community ?? c.cooperative ?? c.assetType;
  const service = COMMUNITY[p.serviceType]?.label ?? p.serviceType.charAt(0).toUpperCase() + p.serviceType.slice(1);
  return typeof name === "string" && name ? `${name} · ${service}` : service;
}

function readLocal(): Policy[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]") as Policy[]; } catch { return []; }
}
function saveLocal(p: Policy) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify([p, ...readLocal().filter((x) => x.policyId !== p.policyId)].slice(0, 50))); } catch { /* private mode */ }
}

function friendlyError(e: unknown): { message: string; faucet?: boolean } {
  const m = e instanceof Error ? e.message : String(e);
  if (/reject|denied|cancel/i.test(m)) return { message: "You cancelled in your wallet. Nothing was paid." };
  if (/insufficient funds|exceeds balance/i.test(m)) return { message: "Your wallet has no test AVAX. Get free test AVAX, then try again.", faucet: true };
  if (/chain|network/i.test(m)) return { message: "Could not switch your wallet to Avalanche Fuji. Switch it in your wallet and try again." };
  return { message: m.slice(0, 160) || "Something went wrong. Nothing was saved." };
}

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

// ═════════════════════════════════════════════════════════════
export default function KaiPlayground() {
  const { address } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const { switchChainAsync } = useSwitchChain();

  const [service, setService] = useState<ServiceId | null>(null);
  const [action, setAction] = useState<Action | null>(null);
  const [values, setValues] = useState<Record<string, Value>>({});
  const [search, setSearch] = useState("");
  const [run, setRun] = useState<Run>({ state: "idle", step: 0 });
  const [log, setLog] = useState<string[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [lookup, setLookup] = useState<Policy | null | "none">(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [showWallet, setShowWallet] = useState(false);
  const [expanded, setExpanded] = useState<Group[]>([]);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  // The server keeps policies by wallet; this phone keeps a copy too, so the
  // list still shows when offline.
  const fetchPolicies = async (query: string): Promise<Policy[] | null> => {
    try {
      const res = await fetch(`/api/policies?${query}`);
      return res.ok ? (((await res.json()).policies ?? []) as Policy[]) : null;
    } catch { return null; }
  };
  const merge = (server: Policy[] | null) => {
    const list = server ?? [];
    const seen = new Set(list.map((p) => p.policyId));
    return [...list, ...readLocal().filter((p) => !seen.has(p.policyId))];
  };
  const loadPolicies = async () => {
    if (address) setPolicies(merge(await fetchPolicies(`owner=${address}`)));
  };
  useEffect(() => {
    if (!address) return;
    let on = true;
    fetchPolicies(`owner=${address}`).then((server) => { if (on) setPolicies(merge(server)); });
    return () => { on = false; };
  }, [address]);

  const mine = useMemo(
    () => (address ? policies.filter((p) => p.owner?.toLowerCase() === address.toLowerCase()) : []),
    [policies, address],
  );

  const actions = useMemo(() => (service ? actionsFor(service) : []), [service]);
  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return ALL_ACTIONS.filter(({ action: a }) => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)).slice(0, 8);
  }, [search]);

  const pickService = (s: ServiceId) => {
    setService(s);
    setAction(null);
    setExpanded([]);
    setRun({ state: "idle", step: 0 });
  };

  const pickAction = (a: Action, s?: ServiceId) => {
    if (s) setService(s);
    setAction(a);
    const v: Record<string, Value> = {};
    for (const f of a.fields) {
      // The registry's sample wallet is the project's; use the person's own wallet instead.
      v[f.key] = f.default === OWNER_ACCOUNT && address ? address : f.default;
    }
    setValues(v);
    setRun({ state: "idle", step: 0 });
    setLookup(null);
    setFieldError(null);
    setLog([]);
    setSearch("");
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const missingField = (a: Action): string | null => {
    for (const f of a.fields) {
      const v = values[f.key];
      if (f.required && (v === "" || v == null)) return `Please fill in "${f.label}".`;
      if (f.type === "number" && v !== "" && !(Number(v) >= 0)) return `"${f.label}" must be a number.`;
      if (typeof v === "string" && v && f.placeholder === "0x…" && !/^0x[0-9a-fA-F]{40}$/.test(v)) return `"${f.label}" must be a wallet address (0x followed by 40 letters and numbers).`;
    }
    return null;
  };

  const config = (a: Action) => {
    const out: Record<string, unknown> = { operation: a.id, ...(a.extra ?? {}) };
    for (const f of a.fields) out[f.key] = f.type === "number" && values[f.key] !== "" ? Number(values[f.key]) : values[f.key];
    return out;
  };

  const note = (line: string) => setLog((l) => [...l, `${new Date().toLocaleTimeString("en-GB", { hour12: false })}  ${line}`]);

  const submit = async () => {
    if (!action) return;
    const problem = missingField(action);
    setFieldError(problem);
    if (problem) return;

    // Look-ups: free, read the saved policies, no wallet.
    if (action.free) {
      const idField = action.fields.find((f) => /Id$/.test(f.key));
      const id = idField ? String(values[idField.key] ?? "").trim() : "";
      if (!id) { setFieldError("Type or pick a policy ID to look up."); return; }
      const found = (await fetchPolicies(`id=${encodeURIComponent(id)}`))?.[0] ?? readLocal().find((p) => p.policyId === id);
      setLookup(found ?? "none");
      return;
    }

    if (!address) { setShowWallet(true); return; }
    // Paid already but saving failed: save again with the same payment, don't pay twice.
    const paidTx = run.state === "failed" && run.unsavedTx ? run.unsavedTx : null;
    if (!paidTx) setLog([]);
    setRun({ state: "running", step: paidTx ? 2 : 0, txUrl: paidTx ? run.txUrl : undefined });
    let txHash: `0x${string}` | null = paidTx;
    try {
      if (!txHash) {
        note(`Switching to Avalanche Fuji (chain ${FUJI_CHAIN_ID})`);
        await switchChainAsync({ chainId: FUJI_CHAIN_ID });
        setRun({ state: "running", step: 1 });
        note(`Asking the wallet to send ${FEE_AVAX} AVAX to the treasury ${TREASURY}`);
        txHash = await sendTransactionAsync({ to: TREASURY, value: parseEther(FEE_AVAX) });
        note(`Paid. Transaction ${txHash}`);
      }
      const txUrl = `https://testnet.snowtrace.io/tx/${txHash}`;
      setRun({ state: "running", step: 2, txUrl });
      note("Saving: the server checks the payment on Avalanche Fuji first");
      const res = await fetch("/api/policies", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner: address, serviceType: action.serviceType, config: config(action), paymentTxHash: txHash }),
      });
      const d = (await res.json().catch(() => ({}))) as { policy?: Policy; error?: string };
      if (!res.ok || !d.policy) {
        const message = d.error ?? `Could not save the policy (error ${res.status}).`;
        note(`Error: ${message}`);
        // Wrong payment (400) can't be fixed by retrying; anything else can.
        setRun({ state: "failed", step: 2, txUrl, message, unsavedTx: res.status === 400 ? undefined : txHash });
        return;
      }
      saveLocal(d.policy);
      note(`Saved as ${d.policy.policyId}`);
      setRun({ state: "done", step: 3, txUrl, policyId: d.policy.policyId });
      void loadPolicies();
    } catch (e) {
      const f = friendlyError(e);
      note(`Error: ${e instanceof Error ? e.message : String(e)}`);
      setRun((r) => ({ ...r, state: "failed", message: f.message, faucet: f.faucet, unsavedTx: txHash ?? undefined }));
    }
  };

  const askAi = async () => {
    if (!aiPrompt.trim() || aiLoading || !action) return;
    setAiLoading(true);
    setAiAnswer("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `I am filling in "${action.name}" in the KAI Playground. Fields: ${action.fields.map((f) => f.label).join(", ")}. My situation: ${aiPrompt}. Suggest a value for each field in short, simple words.`,
          stream: false,
        }),
      });
      const d = await res.json().catch(() => ({}));
      setAiAnswer(res.ok ? (d.text ?? d.response ?? "No suggestion came back.") : (d.error ?? "The AI is busy. Try again in a minute."));
    } catch {
      setAiAnswer("The AI could not be reached. You can still fill the form yourself.");
    } finally {
      setAiLoading(false);
    }
  };

  const svc = SERVICES.find((s) => s.id === service);
  const busy = run.state === "running";

  return (
    <div className="pg">
      {/* ── Top bar ─────────────────────────────────────── */}
      <header className="pg-top">
        <div className="pg-wrap pg-top-inner">
          <Link href="/" className="pg-back" aria-label="Back to home"><ArrowLeft size={18} /></Link>
          <div style={{ minWidth: 0 }}>
            <h1 className="pg-title">Playground</h1>
            <p className="pg-sub">Try KAI policies with free test money</p>
          </div>
          <button className={address ? "pg-wallet pg-wallet--on" : "pg-wallet"} onClick={() => setShowWallet(true)}>
            <Wallet size={15} />
            <span>{address ? short(address) : "Connect"}</span>
          </button>
        </div>
      </header>

      <main className="pg-wrap pg-main">
        {/* ── Left: steps 1 and 2 ─────────────────────── */}
        <section className="pg-left">
          <div className="pg-how">
            <span className="pg-net"><i /> Avalanche Fuji · test network</span>
            <p>Nothing here uses real money. Each new policy costs <b>{FEE_AVAX} test AVAX</b>, and looking things up is free.</p>
          </div>

          <div className="pg-search">
            <Search size={15} color={C.ink} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search, e.g. claim, beneficiary, crop…" aria-label="Search actions" />
            {search && <button onClick={() => setSearch("")} aria-label="Clear search"><X size={14} /></button>}
          </div>
          {search.trim() && (
            <div className="pg-list">
              {results.length === 0 && <p className="pg-empty">Nothing matches “{search}”.</p>}
              {results.map(({ action: a, service: s }) => (
                <ActionRow key={a.id} a={a} sub={SERVICES.find((x) => x.id === s)?.name} active={action?.id === a.id} onClick={() => pickAction(a, s)} />
              ))}
            </div>
          )}

          <h2 className="pg-step"><span>1</span> What do you want to set up?</h2>
          <div className="pg-services">
            {SERVICES.map((s) => {
              const Icon = s.icon;
              return (
                <button key={s.id} onClick={() => pickService(s.id)} className={service === s.id ? "pg-svc pg-svc--on" : "pg-svc"} style={{ ["--tint" as string]: s.tint }}>
                  <span className="pg-svc-icon"><Icon size={20} strokeWidth={1.8} /></span>
                  <span className="pg-svc-name">
                    {s.name}
                    {s.id === "mine" && mine.length > 0 && <em>{mine.length}</em>}
                  </span>
                  <span className="pg-svc-hint">{s.hint}</span>
                </button>
              );
            })}
          </div>

          {service && (
            <>
              <h2 className="pg-step"><span>2</span> What do you want to do?</h2>

              {service === "mine" && (
                <div className="pg-mine">
                  {!address ? (
                    <p className="pg-empty">Connect your wallet to see the policies you created.</p>
                  ) : mine.length === 0 ? (
                    <p className="pg-empty">You have no policies yet. Pick Insurance, Trust, Pension or Community above to create one.</p>
                  ) : (
                    mine.slice(0, 8).map((p) => (
                      <div key={p.policyId} className="pg-policy">
                        <div style={{ minWidth: 0 }}>
                          <p className="pg-policy-name">{policyName(p)}</p>
                          <p className="pg-policy-id">{p.policyId} · {new Date(p.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className="pg-tag">{p.status === "active" ? "Active" : "Saved"}</span>
                        {p.paymentTxHash && (
                          <a href={`https://testnet.snowtrace.io/tx/${p.paymentTxHash}`} target="_blank" rel="noopener noreferrer" aria-label="See payment on Snowtrace" className="pg-icon-link"><ExternalLink size={14} /></a>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {(["start", "manage", "lookup"] as const).map((g) => {
                const items = actions.filter((a) => a.group === g);
                if (!items.length) return null;
                // Long lists show 3 at first (plus the chosen one) so the page stays short on phones.
                const open = expanded.includes(g) || items.length <= 4;
                const shown = open ? items : items.filter((a, i) => i < 3 || a.id === action?.id);
                return (
                  <div key={g} className="pg-group">
                    <p className="pg-group-title">{GROUP_TITLE[g]}</p>
                    <div className="pg-list">
                      {shown.map((a) => <ActionRow key={a.id} a={a} active={action?.id === a.id} onClick={() => pickAction(a)} />)}
                    </div>
                    {!open && (
                      <button className="pg-link" style={{ marginTop: 10 }} onClick={() => setExpanded((e) => [...e, g])}>
                        Show {items.length - shown.length} more <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </section>

        {/* ── Right: step 3 ───────────────────────────── */}
        <section className="pg-right" ref={formRef}>
          {!action ? (
            <div className="pg-card pg-intro">
              <h2 className="pg-card-title">How it works</h2>
              <ol>
                <li><b>Pick what you want to set up</b>: insurance, a trust, a pension or a community reserve.</li>
                <li><b>Choose an action.</b> Most people start with the first one in the list.</li>
                <li><b>Fill in the form and confirm in your wallet.</b> You get a policy ID and a link to see the payment on the blockchain.</li>
              </ol>
              <p className="pg-muted">Need test AVAX? <a href={FAUCET_URL} target="_blank" rel="noopener noreferrer">Get it free here</a>.</p>
            </div>
          ) : (
            <div className="pg-card">
              <h2 className="pg-step" style={{ marginTop: 0 }}><span>3</span> {action.free ? "Look it up" : "Fill in and confirm"}</h2>
              <div className="pg-form-head">
                {svc && <span className="pg-svc-icon" style={{ ["--tint" as string]: svc.tint }}><svc.icon size={18} strokeWidth={1.8} /></span>}
                <div style={{ minWidth: 0 }}>
                  <p className="pg-form-name">{action.name}</p>
                  <p className="pg-muted" style={{ margin: 0 }}>{action.description}</p>
                </div>
              </div>

              {action.extra && Object.keys(action.extra).length > 0 && (
                <p className="pg-note"><Check size={14} /> Filled in for you from the {action.name} template. Change anything you like.</p>
              )}

              <datalist id="pg-policy-ids">
                {mine.map((p) => <option key={p.policyId} value={p.policyId}>{policyName(p)}</option>)}
              </datalist>

              <div className="pg-fields">
                {action.fields.map((f) => (
                  <label key={f.key} className="pg-field">
                    <span className="pg-label">{f.label}{f.required && <b> *</b>}</span>
                    {f.type === "boolean" ? (
                      <button type="button" role="switch" aria-checked={values[f.key] === true} onClick={() => setValues((v) => ({ ...v, [f.key]: !v[f.key] }))} className={values[f.key] === true ? "pg-switch pg-switch--on" : "pg-switch"}>
                        <i /> {values[f.key] === true ? "Yes" : "No"}
                      </button>
                    ) : f.type === "select" ? (
                      <select value={String(values[f.key] ?? "")} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} className="pg-input">
                        {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input
                        className="pg-input" value={String(values[f.key] ?? "")} placeholder={f.placeholder}
                        type={f.type === "number" ? "number" : "text"} inputMode={f.type === "number" ? "decimal" : undefined}
                        list={/Id$/.test(f.key) ? "pg-policy-ids" : undefined}
                        onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                      />
                    )}
                    {f.hint && <span className="pg-hint">{f.hint}</span>}
                    {/Id$/.test(f.key) && mine.length > 0 && <span className="pg-hint">Tap the box to pick one of your policies.</span>}
                  </label>
                ))}
              </div>

              {/* Optional AI help */}
              <div className="pg-ai">
                {!aiOpen ? (
                  <button className="pg-link" onClick={() => setAiOpen(true)}><Sparkles size={14} /> Not sure what to write? Ask Kanuvari AI</button>
                ) : (
                  <>
                    <div className="pg-ai-row">
                      <input className="pg-input" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void askAi(); }} placeholder="e.g. I farm 3 hectares of maize in Machakos" />
                      <button className="pg-btn pg-btn--quiet" onClick={() => void askAi()} disabled={aiLoading || !aiPrompt.trim()}>
                        {aiLoading ? <Loader2 size={14} className="pg-spin" /> : "Ask"}
                      </button>
                    </div>
                    {aiAnswer && <p className="pg-ai-answer">{aiAnswer}</p>}
                  </>
                )}
              </div>

              {fieldError && <p className="pg-error">{fieldError}</p>}

              {/* Confirm */}
              <div className="pg-confirm">
                <p className="pg-muted" style={{ margin: 0 }}>
                  {action.free ? "Free. Nothing to sign." : run.state === "failed" && run.unsavedTx ? "You already paid. Saving again is free." : !address ? "Connect a wallet first. It will ask you to approve the fee." : <>Cost: <b>{FEE_AVAX} test AVAX</b> plus a tiny network fee. Your wallet will ask you to approve.</>}
                </p>
                <button className="pg-btn" onClick={() => void submit()} disabled={busy}>
                  {busy ? <><Loader2 size={15} className="pg-spin" /> Working…</> : action.free ? <><Search size={15} /> Look it up</> : !address ? <><Wallet size={15} /> Connect wallet</> : run.state === "failed" && run.unsavedTx ? <>Try saving again <ChevronRight size={15} /></> : <>Confirm <ChevronRight size={15} /></>}
                </button>
              </div>

              {/* Progress */}
              {run.state !== "idle" && (
                <div className={`pg-progress pg-progress--${run.state}`}>
                  {["Switch wallet to Avalanche Fuji", `Approve ${FEE_AVAX} test AVAX`, "Save your policy"].map((label, i) => {
                    const doneStep = run.step > i;
                    const current = run.step === i;
                    const failedHere = run.state === "failed" && current;
                    return (
                      <div key={label} className="pg-progress-row">
                        <span className={doneStep ? "pg-dot pg-dot--done" : failedHere ? "pg-dot pg-dot--fail" : current ? "pg-dot pg-dot--now" : "pg-dot"}>
                          {doneStep ? <Check size={12} /> : failedHere ? <X size={12} /> : current && busy ? <Loader2 size={12} className="pg-spin" /> : i + 1}
                        </span>
                        <span style={{ color: doneStep || current ? C.paper : C.ink }}>{label}</span>
                      </div>
                    );
                  })}
                  {run.state === "done" && (
                    <p className="pg-ok"><Check size={15} /> Done. Your policy ID is <b>{run.policyId}</b>. Find it any time under <button className="pg-link" onClick={() => pickService("mine")}>My policies</button>.</p>
                  )}
                  {run.state === "failed" && (
                    <p className="pg-error" style={{ margin: "10px 0 0" }}>
                      {run.message}{" "}
                      {run.faucet && <a href={FAUCET_URL} target="_blank" rel="noopener noreferrer">Get free test AVAX</a>}
                    </p>
                  )}
                  {run.txUrl && (
                    <a href={run.txUrl} target="_blank" rel="noopener noreferrer" className="pg-link" style={{ marginTop: 8 }}>
                      See the payment on Snowtrace <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              )}

              {/* Look-up result */}
              {lookup === "none" && <p className="pg-error">No policy with that ID was found. Check the ID under My policies.</p>}
              {lookup && lookup !== "none" && (
                <div className="pg-progress">
                  <p className="pg-form-name" style={{ marginBottom: 6 }}>{policyName(lookup)}</p>
                  <dl className="pg-dl">
                    <dt>Policy ID</dt><dd>{lookup.policyId}</dd>
                    <dt>Status</dt><dd>{lookup.status === "active" ? "Active" : "Saved"}</dd>
                    <dt>Owner</dt><dd>{short(lookup.owner)}</dd>
                    <dt>Created</dt><dd>{new Date(lookup.createdAt).toLocaleString()}</dd>
                    {Object.entries(lookup.config ?? {}).filter(([k, v]) => k !== "operation" && k !== "customParams" && (typeof v === "string" || typeof v === "number" || typeof v === "boolean")).slice(0, 8).map(([k, v]) => (
                      <div key={k} style={{ display: "contents" }}><dt>{k.replace(/([A-Z])/g, " $1").toLowerCase()}</dt><dd>{typeof v === "boolean" ? (v ? "Yes" : "No") : String(v)}</dd></div>
                    ))}
                  </dl>
                  {lookup.paymentTxHash && (
                    <a href={`https://testnet.snowtrace.io/tx/${lookup.paymentTxHash}`} target="_blank" rel="noopener noreferrer" className="pg-link" style={{ marginTop: 8 }}>See the payment on Snowtrace <ExternalLink size={13} /></a>
                  )}
                </div>
              )}

              {/* For developers */}
              <details className="pg-tech">
                <summary>Technical details</summary>
                <p className="pg-muted">Network: Avalanche Fuji ({FUJI_CHAIN_ID}) · Treasury: <code>{TREASURY}</code></p>
                {log.length > 0 && <pre>{log.join("\n")}</pre>}
                <pre>{JSON.stringify({ network: "testnet", serviceType: action.serviceType, operationId: action.id, parameters: config(action) }, null, 2)}</pre>
              </details>
            </div>
          )}
        </section>
      </main>

      {showWallet && <WalletConnectModal onClose={() => setShowWallet(false)} />}

      <style>{`
        .pg { min-height: 100dvh; background: ${C.bg}; color: ${C.paper}; font-family: 'Inter', system-ui, sans-serif; }
        .pg-wrap { width: min(1120px, calc(100% - 32px)); margin: 0 auto; }
        .pg-top { position: sticky; top: 0; z-index: 30; background: ${C.band}; border-bottom: 1px solid ${C.line}; }
        .pg-top-inner { display: flex; align-items: center; gap: 12px; padding: 12px 0; }
        .pg-back { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; color: ${C.paper}; background: rgba(246,242,231,0.06); flex-shrink: 0; }
        .pg-title { margin: 0; font-size: 18px; font-weight: 700; letter-spacing: -0.2px; }
        .pg-sub { margin: 1px 0 0; font-size: 12.5px; color: ${C.ink}; }
        .pg-wallet { margin-left: auto; display: inline-flex; align-items: center; gap: 7px; padding: 9px 14px; border-radius: 999px; border: none; background: ${C.gold}; color: #1B1A14; font-weight: 700; font-size: 13px; cursor: pointer; font-family: inherit; flex-shrink: 0; }
        .pg-wallet--on { background: rgba(125,195,131,0.14); color: ${C.green}; font-family: ui-monospace, monospace; font-weight: 600; }

        .pg-main { display: grid; gap: 28px; padding: 20px 0 64px; }
        @media (min-width: 900px) {
          .pg-main { grid-template-columns: minmax(0, 420px) minmax(0, 1fr); align-items: start; padding-top: 28px; }
          .pg-right { position: sticky; top: 84px; max-height: calc(100dvh - 100px); overflow-y: auto; }
        }
        .pg-right { scroll-margin-top: 76px; }

        .pg-how { padding: 14px 16px; border-radius: 14px; background: ${C.band}; }
        .pg-how p { margin: 8px 0 0; font-size: 13.5px; line-height: 1.5; color: ${C.dim}; }
        .pg-how b { color: ${C.paper}; }
        .pg-net { display: inline-flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 600; color: ${C.green}; }
        .pg-net i { width: 7px; height: 7px; border-radius: 50%; background: ${C.green}; }

        .pg-search { display: flex; align-items: center; gap: 8px; margin-top: 14px; padding: 0 12px; border-radius: 12px; background: ${C.card}; }
        .pg-search input { flex: 1; min-width: 0; padding: 12px 0; background: none; border: none; outline: none; color: ${C.paper}; font-size: 14px; font-family: inherit; }
        .pg-search button { background: none; border: none; color: ${C.ink}; cursor: pointer; padding: 4px; }

        .pg-step { display: flex; align-items: center; gap: 10px; margin: 26px 0 12px; font-size: 15px; font-weight: 700; }
        .pg-step span { display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; background: ${C.gold}; color: #1B1A14; font-size: 12.5px; flex-shrink: 0; }

        .pg-services { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        .pg-svc { display: grid; grid-template-columns: auto 1fr; grid-template-rows: auto auto; column-gap: 10px; align-items: center; text-align: left; padding: 12px; border-radius: 14px; border: 1.5px solid transparent; background: ${C.card}; color: ${C.paper}; cursor: pointer; font-family: inherit; transition: background .15s, border-color .15s; }
        .pg-svc:hover { background: ${C.cardHi}; }
        .pg-svc--on { border-color: var(--tint); background: ${C.cardHi}; }
        .pg-svc-icon { grid-row: span 2; display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; color: var(--tint); background: color-mix(in srgb, var(--tint) 16%, ${C.bg}); flex-shrink: 0; }
        .pg-svc-name { font-size: 14px; font-weight: 700; display: flex; align-items: center; gap: 6px; }
        .pg-svc-name em { font-style: normal; font-size: 11px; padding: 0 7px; border-radius: 999px; background: var(--tint); color: #1B1A14; }
        .pg-svc-hint { font-size: 12px; line-height: 1.35; color: ${C.ink}; }
        .pg-svc:last-child { grid-column: 1 / -1; }

        .pg-group { margin-top: 14px; }
        .pg-group-title { margin: 0 0 6px; font-size: 11.5px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; color: ${C.ink}; }
        .pg-list { display: grid; gap: 6px; margin-top: 8px; }
        .pg-row { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; padding: 12px 14px; border-radius: 12px; border: 1.5px solid transparent; background: ${C.card}; color: ${C.paper}; cursor: pointer; font-family: inherit; min-height: 52px; }
        .pg-row:hover { background: ${C.cardHi}; }
        .pg-row--on { border-color: ${C.gold}; background: ${C.cardHi}; }
        .pg-row-name { font-size: 14px; font-weight: 600; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
        .pg-row-desc { margin-top: 2px; font-size: 12.5px; line-height: 1.4; color: ${C.ink}; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .pg-tag { font-size: 10.5px; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: rgba(200,155,60,0.16); color: ${C.goldLight}; white-space: nowrap; }
        .pg-tag--free { background: rgba(125,195,131,0.16); color: ${C.green}; }
        .pg-empty { margin: 0; padding: 14px; border-radius: 12px; background: ${C.card}; font-size: 13.5px; color: ${C.dim}; line-height: 1.5; }

        .pg-mine { display: grid; gap: 6px; margin-bottom: 6px; }
        .pg-policy { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 12px; background: ${C.card}; }
        .pg-policy > div { flex: 1; }
        .pg-policy-name { margin: 0; font-size: 14px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .pg-policy-id { margin: 2px 0 0; font-size: 12px; color: ${C.ink}; font-family: ui-monospace, monospace; }
        .pg-icon-link { color: ${C.goldLight}; display: grid; place-items: center; padding: 4px; }

        .pg-card { padding: 20px; border-radius: 18px; background: ${C.band}; }
        .pg-card-title { margin: 0 0 10px; font-size: 16px; }
        .pg-intro ol { margin: 0; padding-left: 20px; display: grid; gap: 10px; font-size: 14px; line-height: 1.5; color: ${C.dim}; }
        .pg-intro b { color: ${C.paper}; }
        .pg-muted { font-size: 13px; color: ${C.ink}; line-height: 1.5; }
        .pg-muted a, .pg-error a { color: ${C.goldLight}; }
        .pg-form-head { display: flex; align-items: center; gap: 12px; }
        .pg-form-head .pg-svc-icon { grid-row: auto; }
        .pg-form-name { margin: 0 0 2px; font-size: 16px; font-weight: 700; }
        .pg-note { display: flex; gap: 6px; align-items: center; margin: 14px 0 0; font-size: 13px; color: ${C.green}; }

        .pg-fields { display: grid; gap: 14px; margin-top: 18px; }
        @media (min-width: 640px) { .pg-fields { grid-template-columns: 1fr 1fr; } }
        .pg-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        .pg-label { font-size: 13px; font-weight: 600; color: ${C.dim}; }
        .pg-label b { color: ${C.goldLight}; }
        .pg-input { width: 100%; box-sizing: border-box; padding: 11px 12px; border-radius: 10px; border: 1px solid rgba(246,242,231,0.12); background: ${C.bg}; color: ${C.paper}; font-size: 15px; font-family: inherit; outline: none; min-height: 44px; }
        .pg-input:focus { border-color: ${C.gold}; }
        select.pg-input option { background: ${C.bg}; }
        .pg-hint { font-size: 12px; color: ${C.ink}; }
        .pg-switch { display: inline-flex; align-items: center; gap: 10px; width: fit-content; padding: 8px 14px 8px 8px; border-radius: 999px; border: 1px solid rgba(246,242,231,0.12); background: ${C.bg}; color: ${C.dim}; font-size: 14px; font-family: inherit; cursor: pointer; min-height: 44px; }
        .pg-switch i { width: 36px; height: 22px; border-radius: 999px; background: rgba(246,242,231,0.15); position: relative; transition: background .15s; }
        .pg-switch i::after { content: ""; position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: ${C.paper}; transition: transform .15s; }
        .pg-switch--on { color: ${C.paper}; }
        .pg-switch--on i { background: ${C.green}; }
        .pg-switch--on i::after { transform: translateX(14px); }

        .pg-ai { margin-top: 18px; }
        .pg-ai-row { display: flex; gap: 8px; }
        .pg-ai-answer { margin: 10px 0 0; padding: 12px; border-radius: 10px; background: ${C.card}; font-size: 13.5px; line-height: 1.55; color: ${C.dim}; white-space: pre-wrap; }
        .pg-link { display: inline-flex; align-items: center; gap: 6px; padding: 0; border: none; background: none; color: ${C.goldLight}; font-size: 13.5px; font-weight: 600; cursor: pointer; font-family: inherit; text-decoration: none; }

        .pg-confirm { display: flex; flex-direction: column; gap: 12px; margin-top: 20px; padding-top: 18px; border-top: 1px solid ${C.line}; }
        @media (min-width: 640px) { .pg-confirm { flex-direction: row; align-items: center; justify-content: space-between; } }
        .pg-btn { display: inline-flex; align-items: center; justify-content: center; gap: 7px; padding: 13px 24px; border-radius: 999px; border: none; background: ${C.gold}; color: #1B1A14; font-weight: 700; font-size: 15px; cursor: pointer; font-family: inherit; min-height: 48px; white-space: nowrap; }
        .pg-btn:disabled { opacity: .6; cursor: not-allowed; }
        .pg-btn--quiet { background: ${C.card}; color: ${C.paper}; padding: 10px 18px; min-height: 44px; font-size: 14px; }
        .pg-error { margin: 14px 0 0; font-size: 13.5px; color: ${C.red}; line-height: 1.5; }
        .pg-ok { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: 12px 0 0; font-size: 14px; color: ${C.green}; line-height: 1.5; }
        .pg-ok b { color: ${C.paper}; font-family: ui-monospace, monospace; }

        .pg-progress { margin-top: 16px; padding: 14px; border-radius: 12px; background: ${C.card}; display: flex; flex-direction: column; }
        .pg-progress-row { display: flex; align-items: center; gap: 10px; padding: 5px 0; font-size: 13.5px; }
        .pg-dot { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; background: rgba(246,242,231,0.08); color: ${C.ink}; font-size: 11px; font-weight: 700; flex-shrink: 0; }
        .pg-dot--now { background: rgba(200,155,60,0.22); color: ${C.goldLight}; }
        .pg-dot--done { background: ${C.green}; color: #10231A; }
        .pg-dot--fail { background: ${C.red}; color: #2A1410; }
        .pg-dl { display: grid; grid-template-columns: auto 1fr; gap: 6px 14px; margin: 0; font-size: 13.5px; }
        .pg-dl dt { color: ${C.ink}; text-transform: capitalize; }
        .pg-dl dd { margin: 0; overflow-wrap: anywhere; }

        .pg-tech { margin-top: 20px; font-size: 13px; color: ${C.ink}; }
        .pg-tech summary { cursor: pointer; font-weight: 600; }
        .pg-tech code { font-size: 12px; overflow-wrap: anywhere; }
        .pg-tech pre { margin: 8px 0 0; padding: 12px; border-radius: 10px; background: ${C.bg}; color: ${C.dim}; font-size: 12px; line-height: 1.55; overflow-x: auto; white-space: pre-wrap; overflow-wrap: anywhere; }

        .pg-spin { animation: pg-spin 1s linear infinite; }
        @keyframes pg-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function ActionRow({ a, sub, active, onClick }: { a: Action; sub?: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={active ? "pg-row pg-row--on" : "pg-row"}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="pg-row-name">
          {a.name}
          {a.free ? <span className="pg-tag pg-tag--free">Free</span> : a.badge ? <span className="pg-tag">{a.badge}</span> : null}
          {sub && <span className="pg-tag pg-tag--free" style={{ background: "rgba(246,242,231,0.08)", color: C.dim }}>{sub}</span>}
        </div>
        <div className="pg-row-desc">{a.description}</div>
      </div>
      <ChevronRight size={16} color={active ? C.goldLight : C.ink} />
    </button>
  );
}
