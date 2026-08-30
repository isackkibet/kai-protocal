"use client";

/**
 * /pay — Scan to Pay · Receive Payment · Send
 *
 * Tabs:
 *   📷 Scan   — camera QR scanner. Parses EIP-681 URIs
 *               (ethereum:<address>?value=&token=...) and plain 0x addresses.
 *               After scanning lets the user pay with yBOB ERC-20 or M-Pesa.
 *
 *   📥 Receive — generates a QR code for the connected wallet address.
 *               User picks token + amount → QR encodes an EIP-681 URI so
 *               any wallet scanner can read it directly.
 *
 *   💸 Send    — manual address + amount entry with the same payment flow.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  useAccount, useSwitchChain, useWriteContract,
  useReadContract, usePublicClient,
} from "wagmi";
import { avalancheFuji } from "wagmi/chains";
import { parseUnits, formatUnits, maxUint256 } from "viem";
import {
  ArrowLeft, QrCode, Scan, Send, Copy, CheckCircle,
  ExternalLink, RefreshCw, Phone, X, ChevronDown,
} from "lucide-react";
import WalletConnectModal from "@/components/WalletConnectModal";
import RealisticQR from "@/components/ui/RealisticQR";
import { ERC20_ABI } from "@/lib/erc20abi";
import { ECOSYSTEM_TOKENS } from "@/lib/tokens";

// ─── Token options ────────────────────────────────────────────────────────────
const TOKENS = ECOSYSTEM_TOKENS.map(t => ({
  symbol:  t.symbol,
  name:    t.name,
  color:   t.color,
  emoji:   t.emoji,
  address: t.address as `0x${string}` | null,
  decimals: t.decimals,
}));

// ─── EIP-681 parser ───────────────────────────────────────────────────────────
interface ParsedPayment {
  address: `0x${string}`;
  tokenAddress?: `0x${string}`;
  amount?: string;
  chainId?: number;
  raw: string;
}

function parseQRPayload(raw: string): ParsedPayment | null {
  raw = raw.trim();

  // Plain 0x address
  if (/^0x[0-9a-fA-F]{40}$/.test(raw)) {
    return { address: raw as `0x${string}`, raw };
  }

  // EIP-681: ethereum:<address>[@chainId][/function]?params
  const eip681 = raw.match(
    /^ethereum:(0x[0-9a-fA-F]{40})(@(\d+))?(\/([a-zA-Z0-9_]+))?\??(.*)$/i,
  );
  if (eip681) {
    const [, address, , chainId, , , params] = eip681;
    const search = new URLSearchParams(params ?? "");
    const value  = search.get("value") || search.get("amount") || undefined;
    const token  = search.get("address") || undefined;
    return {
      address:      address as `0x${string}`,
      tokenAddress: token as `0x${string}` | undefined,
      amount:       value ? formatUnits(BigInt(value), 18) : undefined,
      chainId:      chainId ? parseInt(chainId) : undefined,
      raw,
    };
  }

  return null;
}

// ─── Build an EIP-681 receive URI ─────────────────────────────────────────────
function buildReceiveURI(
  address: string,
  tokenAddress: string | null,
  amount: string,
  chainId: number,
): string {
  if (!address) return "";
  let uri = `ethereum:${address}@${chainId}`;
  if (tokenAddress && amount) {
    uri += `/transfer?address=${address}&uint256=${parseUnits(amount, 18).toString()}`;
  } else if (amount) {
    uri += `?value=${parseUnits(amount, 18).toString()}`;
  }
  return uri;
}

// ─── QR Scanner component (lazy-loads html5-qrcode) ─────────────────────────
function QRScanner({ onScan, onClose }: { onScan: (v: string) => void; onClose: () => void }) {
  const divId = "kai-qr-scanner";
  const scannerRef = useRef<{ clear: () => Promise<void> } | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        // Dynamically import so SSR doesn't break
        const { Html5QrcodeScanner } = await import("html5-qrcode");
        if (!mounted) return;

        const scanner = new Html5QrcodeScanner(
          divId,
          {
            fps: 10,
            qrbox: { width: 240, height: 240 },
            rememberLastUsedCamera: true,
            aspectRatio: 1,
          },
          false,
        );

        scanner.render(
          (decoded) => {
            if (mounted) {
              scanner.clear().catch(() => {});
              onScan(decoded);
            }
          },
          () => {}, // ignore per-frame errors
        );

        scannerRef.current = scanner as never;
        setReady(true);
      } catch (e) {
        setError("Camera not available. Enter address manually.");
      }
    }

    init();

    return () => {
      mounted = false;
      scannerRef.current?.clear().catch(() => {});
    };
  }, [onScan]);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={onClose}
        style={{
          position: "absolute", top: 8, right: 8, zIndex: 10,
          background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%",
          width: 32, height: 32, cursor: "pointer", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <X size={16} />
      </button>

      {error ? (
        <div style={{ padding: 24, textAlign: "center", color: "#f87171", fontSize: 13 }}>
          {error}
        </div>
      ) : (
        <div
          id={divId}
          style={{
            borderRadius: 16, overflow: "hidden",
            background: "#000",
          }}
        />
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
type Tab = "scan" | "receive" | "send";

export default function PayPage() {
  const { address, isConnected } = useAccount();
  const { switchChainAsync }     = useSwitchChain();
  const { writeContractAsync }   = useWriteContract();
  const publicClient             = usePublicClient();

  const [tab,           setTab]          = useState<Tab>("receive");
  const [showModal,     setShowModal]    = useState(false);
  const [statusMsg,     setStatusMsg]    = useState("");
  const [txUrl,         setTxUrl]        = useState<string | null>(null);
  const [busy,          setBusy]         = useState(false);
  const [copied,        setCopied]       = useState(false);

  // ── Receive state ──────────────────────────────────────────────────────────
  const [recvToken,   setRecvToken]   = useState(TOKENS[1]); // yBOB default
  const [recvAmount,  setRecvAmount]  = useState("");
  const [showTokenPicker, setShowTokenPicker] = useState(false);

  // ── Scan state ─────────────────────────────────────────────────────────────
  const [scanning,    setScanning]    = useState(false);
  const [scanned,     setScanned]     = useState<ParsedPayment | null>(null);

  // ── Send state ─────────────────────────────────────────────────────────────
  const [sendTo,      setSendTo]      = useState("");
  const [sendToken,   setSendToken]   = useState(TOKENS[1]); // yBOB default
  const [sendAmount,  setSendAmount]  = useState("");
  const [mpesaPhone,  setMpesaPhone]  = useState("");
  const [mpesaBusy,   setMpesaBusy]   = useState(false);

  // M-Pesa mode + status
  type MpesaMode = "stk" | "b2c";
  type MpesaStatus = { type: "pending" | "success" | "error"; message: string; detail?: string[] };
  const [mpesaMode,   setMpesaMode]   = useState<MpesaMode>("stk");
  const [mpesaStatus, setMpesaStatus] = useState<MpesaStatus | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Live yBOB balance ──────────────────────────────────────────────────────
  const yBobToken = TOKENS.find(t => t.symbol === "yBOB");
  const { data: yBobBalRaw } = useReadContract(
    yBobToken?.address && address
      ? { address: yBobToken.address, abi: ERC20_ABI, functionName: "balanceOf" as const, args: [address], query: { enabled: true } }
      : { address: "0x0" as `0x${string}`, abi: ERC20_ABI, functionName: "balanceOf" as const, args: ["0x0" as `0x${string}`], query: { enabled: false } }
  );
  const yBobBal = yBobBalRaw ? parseFloat(formatUnits(yBobBalRaw as bigint, 18)) : null;

  // ── Receive QR data ────────────────────────────────────────────────────────
  const receiveURI = address
    ? buildReceiveURI(address, recvToken.address ?? null, recvAmount, 43113)
    : "";

  const copyReceiveURI = () => {
    navigator.clipboard.writeText(receiveURI || address || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Handle scanned QR ─────────────────────────────────────────────────────
  const handleScan = useCallback((raw: string) => {
    const parsed = parseQRPayload(raw);
    setScanning(false);
    if (parsed) {
      setScanned(parsed);
      // Pre-fill send tab
      setSendTo(parsed.address);
      if (parsed.amount) setSendAmount(parsed.amount);
      setTab("send");
    } else {
      setStatusMsg(`⚠️ Could not parse QR: ${raw.slice(0, 40)}`);
    }
  }, []);

  // ── ERC-20 transfer ────────────────────────────────────────────────────────
  const handleSendToken = async (to: string, token: typeof TOKENS[0], amount: string) => {
    if (!isConnected || !address) { setShowModal(true); return; }
    if (!to.match(/^0x[0-9a-fA-F]{40}$/)) { setStatusMsg("⚠️ Invalid recipient address."); return; }
    if (!token.address) { setStatusMsg(`⚠️ ${token.symbol} not deployed on Fuji.`); return; }
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setStatusMsg("⚠️ Enter an amount."); return; }

    setBusy(true); setStatusMsg(""); setTxUrl(null);
    try {
      await switchChainAsync({ chainId: avalancheFuji.id });
      setStatusMsg(`Approving ${token.symbol}…`);
      const appTx = await writeContractAsync({
        address: token.address, abi: ERC20_ABI,
        functionName: "approve", args: [to as `0x${string}`, maxUint256],
        chainId: avalancheFuji.id,
      });
      await publicClient?.waitForTransactionReceipt({ hash: appTx });

      setStatusMsg(`Sending ${amount} ${token.symbol} to ${to.slice(0,8)}…`);
      const tx = await writeContractAsync({
        address: token.address, abi: ERC20_ABI,
        functionName: "transfer", args: [to as `0x${string}`, parseUnits(amount, token.decimals)],
        chainId: avalancheFuji.id,
      });
      setTxUrl(`https://testnet.snowtrace.io/tx/${tx}`);
      setStatusMsg(`✅ Sent ${amount} ${token.symbol} to ${to.slice(0,8)}…${to.slice(-6)}`);
    } catch (e: unknown) {
      setStatusMsg(`❌ ${e instanceof Error ? e.message.slice(0, 120) : "Transaction failed"}`);
    } finally {
      setBusy(false);
    }
  };

  // ── M-Pesa STK Push (charge the sender's phone) ──────────────────────────
  const handleMpesaSTK = async () => {
    const clean = mpesaPhone.replace(/\D/g, "");
    setMpesaBusy(true);
    setMpesaStatus({ type: "pending", message: "Sending STK push to your phone…" });
    try {
      const res  = await fetch("/api/mpesa/stk", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone:     clean,
          nftId:     "send",
          nftName:   `${sendAmount} ${sendToken.symbol}`,
          priceYbob: parseFloat(sendAmount),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMpesaStatus({
        type: "pending",
        message: "📲 Check your phone — enter M-Pesa PIN",
        detail: [
          `Amount: KES ${data.amountKes?.toLocaleString()}`,
          `Reference: ${data.checkoutRequestId?.slice(0, 16)}…`,
        ],
      });

      // Poll the callback endpoint every 5s for up to 60s
      if (pollRef.current) clearInterval(pollRef.current);
      let attempts = 0;
      pollRef.current = setInterval(async () => {
        attempts++;
        try {
          const r    = await fetch(`/api/mpesa/callback?checkoutRequestId=${data.checkoutRequestId}`);
          const poll = await r.json();
          if (poll.status === "success") {
            clearInterval(pollRef.current!);
            setMpesaStatus({
              type: "success",
              message: "✅ Payment confirmed!",
              detail: [
                `Receipt: ${poll.mpesaReceiptNumber ?? "—"}`,
                `Amount: KES ${poll.amount?.toLocaleString() ?? "—"}`,
                `Phone: ${poll.phoneNumber ?? clean}`,
              ],
            });
          } else if (poll.status === "failed") {
            clearInterval(pollRef.current!);
            setMpesaStatus({ type: "error", message: `❌ ${poll.resultDesc ?? "Payment failed"}` });
          } else if (attempts >= 12) {
            clearInterval(pollRef.current!);
            // Fall back to direct Safaricom query
            const qr   = await fetch("/api/mpesa/query", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ checkoutRequestId: data.checkoutRequestId }) });
            const qd   = await qr.json();
            if (qd.success) {
              setMpesaStatus({ type: "success", message: "✅ Payment confirmed!", detail: [`Via direct query`] });
            } else {
              setMpesaStatus({ type: "pending", message: "⏱️ Check your M-Pesa SMS for confirmation", detail: [qd.resultDesc ?? ""] });
            }
          }
        } catch { /* ignore polling errors */ }
      }, 5000);

    } catch (e: unknown) {
      setMpesaStatus({ type: "error", message: `❌ ${e instanceof Error ? e.message : "STK push failed"}` });
    } finally {
      setMpesaBusy(false);
    }
  };

  // ── M-Pesa B2C (send money TO a recipient phone) ─────────────────────────
  const handleMpesaB2C = async () => {
    const clean = mpesaPhone.replace(/\D/g, "");
    setMpesaBusy(true);
    setMpesaStatus({ type: "pending", message: "Sending payment to recipient…" });
    try {
      const amountKes = Math.ceil(parseFloat(sendAmount || "0") * 130);
      const res = await fetch("/api/mpesa/b2c", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone:     clean,
          amountKes,
          occasion:  `${sendAmount} ${sendToken.symbol}`,
          remarks:   "KAIVAX platform payment",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMpesaStatus({
        type: "success",
        message: "✅ B2C payment queued!",
        detail: [
          `KES ${amountKes.toLocaleString()} → ${clean}`,
          `Conversation ID: ${data.conversationId?.slice(0, 16)}…`,
          "Recipient will receive an M-Pesa notification",
        ],
      });
    } catch (e: unknown) {
      setMpesaStatus({ type: "error", message: `❌ ${e instanceof Error ? e.message : "B2C failed"}` });
    } finally {
      setMpesaBusy(false);
    }
  };

  return (
    <main style={{ padding: "0 0 100px", display: "flex", flexDirection: "column", minHeight: "100dvh" }}>

      {/* Header */}
      <div style={{ padding: "32px 16px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/" style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "rgba(232,65,66,0.1)", border: "1px solid rgba(232,65,66,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", flexShrink: 0,
        }}>
          <ArrowLeft size={18} color="#e84142" />
        </Link>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#fff", margin: 0 }}>💳 Pay & Receive</h1>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "3px 0 0" }}>
            Scan to pay · Generate QR · Send tokens · M-Pesa
          </p>
        </div>
      </div>

      {/* Wallet connect prompt */}
      {!isConnected && (
        <div style={{ margin: "0 16px 12px" }}>
          <button onClick={() => setShowModal(true)} style={{
            width: "100%", background: "rgba(232,65,66,0.08)", border: "1px dashed rgba(232,65,66,0.4)",
            borderRadius: 14, padding: "12px 16px", color: "#e84142", fontWeight: 700, fontSize: 13, cursor: "pointer",
          }}>
            🔗 Connect wallet to use Pay & Receive
          </button>
        </div>
      )}

      {/* Status */}
      {statusMsg && (
        <div style={{
          margin: "0 16px 12px",
          background: statusMsg.startsWith("❌") || statusMsg.startsWith("⚠️") ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.08)",
          border: `1px solid ${statusMsg.startsWith("❌") || statusMsg.startsWith("⚠️") ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.2)"}`,
          padding: "10px 14px", borderRadius: 12, fontSize: 12, color: "#fff",
        }}>
          {statusMsg}
          {txUrl && (
            <a href={txUrl} target="_blank" rel="noopener noreferrer"
              style={{ marginLeft: 8, color: "#60a5fa", display: "inline-flex", alignItems: "center", gap: 4 }}>
              Snowtrace <ExternalLink size={11} />
            </a>
          )}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, margin: "0 16px 16px", background: "rgba(0,0,0,0.3)", padding: 4, borderRadius: 14 }}>
        {([
          ["receive", "📥 Receive", QrCode],
          ["scan",    "📷 Scan",    Scan],
          ["send",    "💸 Send",    Send],
        ] as const).map(([id, label]) => (
          <button key={id} onClick={() => { setTab(id); setStatusMsg(""); setTxUrl(null); setScanning(false); }}
            style={{
              flex: 1, padding: "9px 0", borderRadius: 10, fontSize: 13, fontWeight: 700, border: "none",
              background: tab === id ? "#e84142" : "transparent",
              color: tab === id ? "#fff" : "rgba(255,255,255,0.45)",
              cursor: "pointer", transition: "all 0.2s",
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* ══ RECEIVE TAB ════════════════════════════════════════════════════════ */}
      {tab === "receive" && (
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>

          {/* Token + Amount selector */}
          <div className="glass" style={{ width: "100%", borderRadius: 18, padding: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", margin: "0 0 10px", letterSpacing: 1 }}>REQUEST PAYMENT FOR</p>

            {/* Token picker */}
            <div style={{ position: "relative", marginBottom: 10 }}>
              <button onClick={() => setShowTokenPicker(v => !v)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10, padding: "10px 14px", cursor: "pointer",
              }}>
                <span style={{ fontSize: 20 }}>{recvToken.emoji}</span>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <p style={{ fontSize: 14, fontWeight: 800, color: "#fff", margin: 0 }}>{recvToken.symbol}</p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: 0 }}>{recvToken.name}</p>
                </div>
                <ChevronDown size={16} color="rgba(255,255,255,0.4)" />
              </button>

              {showTokenPicker && (
                <div style={{
                  position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 20,
                  background: "#111114", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.6)", maxHeight: 220, overflowY: "auto",
                }}>
                  {TOKENS.map(t => (
                    <button key={t.symbol} onClick={() => { setRecvToken(t); setShowTokenPicker(false); }}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 14px", background: "none", border: "none", cursor: "pointer",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                      }}>
                      <span style={{ fontSize: 18 }}>{t.emoji}</span>
                      <div style={{ flex: 1, textAlign: "left" }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0 }}>{t.symbol}</p>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: 0 }}>{t.name}</p>
                      </div>
                      {!t.address && <span style={{ fontSize: 9, color: "#F97316" }}>soon</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Amount input */}
            <div style={{ position: "relative" }}>
              <input
                type="number" placeholder="Amount (optional)"
                value={recvAmount} onChange={e => setRecvAmount(e.target.value)}
                style={{
                  width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10, padding: "10px 44px 10px 14px", fontSize: 16, color: "#fff",
                  outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                }}
              />
              <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>
                {recvToken.symbol}
              </span>
            </div>
          </div>

          {/* QR Code */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            {address ? (
              <>
                <RealisticQR
                  value={receiveURI || address}
                  size={220}
                  fg="#0a0a0c"
                  bg="#ffffff"
                />
                {/* Amount badge */}
                {recvAmount && (
                  <div style={{
                    background: `${recvToken.color}20`, border: `1px solid ${recvToken.color}50`,
                    borderRadius: 99, padding: "4px 14px", fontSize: 13, fontWeight: 800, color: recvToken.color,
                  }}>
                    {recvAmount} {recvToken.symbol}
                    {recvToken.symbol === "yBOB" && ` ≈ KES ${Math.ceil(parseFloat(recvAmount) * 130)}`}
                  </div>
                )}
              </>
            ) : (
              <div style={{ width: 236, height: 236, borderRadius: 16, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 13, textAlign: "center" }}>Connect wallet<br/>to generate QR</p>
              </div>
            )}
          </div>

          {/* Wallet address + copy */}
          {address && (
            <div className="glass" style={{ width: "100%", borderRadius: 14, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)", margin: "0 0 4px", letterSpacing: 1 }}>YOUR WALLET</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <p style={{ flex: 1, fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.7)", margin: 0, wordBreak: "break-all" }}>
                  {address}
                </p>
                <button onClick={copyReceiveURI} style={{
                  flexShrink: 0, background: copied ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.07)",
                  border: `1px solid ${copied ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: 8, padding: "6px 10px", cursor: "pointer",
                  color: copied ? "#22C55E" : "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 700,
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  {copied ? <><CheckCircle size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                </button>
              </div>
            </div>
          )}

          {/* yBOB balance hint */}
          {isConnected && yBobBal !== null && (
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>
              Your yBOB balance: <strong style={{ color: "#60a5fa" }}>{yBobBal.toFixed(4)} yBOB</strong>
            </p>
          )}
        </div>
      )}

      {/* ══ SCAN TAB ═══════════════════════════════════════════════════════════ */}
      {tab === "scan" && (
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 14 }}>

          {!scanning && !scanned && (
            <div className="glass" style={{ borderRadius: 20, padding: 24, border: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
              <p style={{ fontSize: 15, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>Scan a Payment QR</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 20px", lineHeight: 1.5 }}>
                Supports Ethereum addresses, EIP-681 payment URIs,<br/>and KAIVAX wallet QR codes.
              </p>
              <button onClick={() => setScanning(true)} style={{
                background: "linear-gradient(135deg,#e84142,#7c1d1d)", color: "#fff",
                fontWeight: 800, fontSize: 14, padding: "12px 32px", borderRadius: 12, border: "none", cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 8,
              }}>
                <Scan size={18} /> Open Camera
              </button>
            </div>
          )}

          {scanning && (
            <div className="glass" style={{ borderRadius: 20, overflow: "hidden", border: "1px solid rgba(232,65,66,0.3)" }}>
              <QRScanner onScan={handleScan} onClose={() => setScanning(false)} />
            </div>
          )}

          {scanned && (
            <div className="glass" style={{ borderRadius: 20, padding: 16, border: "1px solid rgba(34,197,94,0.3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <CheckCircle size={18} color="#22C55E" />
                <p style={{ fontSize: 13, fontWeight: 800, color: "#22C55E", margin: 0 }}>QR Scanned</p>
                <button onClick={() => { setScanned(null); setScanning(true); }}
                  style={{ marginLeft: "auto", background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: 11 }}>
                  Re-scan
                </button>
              </div>
              <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: "10px 12px" }}>
                <p style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", margin: "0 0 3px", fontWeight: 700, letterSpacing: 1 }}>ADDRESS</p>
                <p style={{ fontFamily: "monospace", fontSize: 11, color: "#fff", margin: 0, wordBreak: "break-all" }}>{scanned.address}</p>
                {scanned.amount && <p style={{ fontSize: 11, color: "#60a5fa", margin: "4px 0 0" }}>Requested: {scanned.amount}</p>}
              </div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "8px 0 0" }}>
                ↓ Payment details pre-filled in the Send tab
              </p>
            </div>
          )}

          {/* Manual paste fallback */}
          <div className="glass" style={{ borderRadius: 16, padding: 14, border: "1px solid rgba(255,255,255,0.08)" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", margin: "0 0 8px", letterSpacing: 1 }}>
              OR PASTE ADDRESS / URI
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text" placeholder="0x... or ethereum:..."
                onChange={e => {
                  const parsed = parseQRPayload(e.target.value.trim());
                  if (parsed) {
                    setScanned(parsed);
                    setSendTo(parsed.address);
                    if (parsed.amount) setSendAmount(parsed.amount);
                    setTab("send");
                  }
                }}
                style={{
                  flex: 1, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#fff", outline: "none", fontFamily: "monospace",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ══ SEND TAB ════════════════════════════════════════════════════════════ */}
      {tab === "send" && (
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 12 }}>

          {scanned && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, fontSize: 11, color: "#22C55E" }}>
              <CheckCircle size={13} /> From scanned QR: {scanned.address.slice(0, 10)}…
            </div>
          )}

          {/* Recipient */}
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6, letterSpacing: 1 }}>
              RECIPIENT ADDRESS
            </label>
            <input
              type="text" placeholder="0x..."
              value={sendTo} onChange={e => setSendTo(e.target.value)}
              style={{
                width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#fff", outline: "none",
                fontFamily: "monospace", boxSizing: "border-box",
              }}
            />
          </div>

          {/* Token selector */}
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
            {TOKENS.filter(t => t.address).map(t => (
              <button key={t.symbol} onClick={() => setSendToken(t)}
                style={{
                  flexShrink: 0, display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 12px", borderRadius: 10, border: "none", cursor: "pointer",
                  background: sendToken.symbol === t.symbol ? `${t.color}25` : "rgba(255,255,255,0.05)",
                  color: sendToken.symbol === t.symbol ? t.color : "rgba(255,255,255,0.55)",
                  fontWeight: 700, fontSize: 12,
                  outline: sendToken.symbol === t.symbol ? `1.5px solid ${t.color}60` : "none",
                }}>
                {t.emoji} {t.symbol}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div style={{ position: "relative" }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6, letterSpacing: 1 }}>
              AMOUNT
            </label>
            <input
              type="number" placeholder="0.00"
              value={sendAmount} onChange={e => setSendAmount(e.target.value)}
              style={{
                width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10, padding: "12px 60px 12px 14px", fontSize: 18, color: "#fff",
                outline: "none", fontFamily: "inherit", boxSizing: "border-box",
              }}
            />
            <span style={{ position: "absolute", right: 14, bottom: 14, fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>
              {sendToken.symbol}
            </span>
          </div>

          {/* KES hint for yBOB */}
          {sendToken.symbol === "yBOB" && sendAmount && (
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "-4px 0 0" }}>
              ≈ KES {Math.ceil(parseFloat(sendAmount || "0") * 130).toLocaleString()}
            </p>
          )}

          {/* Send via token button */}
          <button
            onClick={() => handleSendToken(sendTo, sendToken, sendAmount)}
            disabled={busy || !sendTo || !sendAmount}
            style={{
              width: "100%", padding: "13px", borderRadius: 12, border: "none", fontWeight: 800, fontSize: 14,
              background: busy || !sendTo || !sendAmount
                ? "rgba(255,255,255,0.08)"
                : `linear-gradient(135deg,${sendToken.color},${sendToken.color}bb)`,
              color: ["#FFD700","#EAB308","#22C55E","#86EFAC"].includes(sendToken.color) ? "#1B4332" : "#fff",
              cursor: busy || !sendTo || !sendAmount ? "not-allowed" : "pointer",
              opacity: busy || !sendTo || !sendAmount ? 0.6 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
            <Send size={16} />
            {busy ? "⏳ Signing…" : `Send ${sendAmount || "0"} ${sendToken.symbol}`}
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>or pay with</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
          </div>

          {/* M-Pesa */}
          <div className="glass" style={{ borderRadius: 16, padding: 16, border: "1px solid rgba(34,197,94,0.25)" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(34,197,94,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🇰🇪</div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 800, color: "#22C55E", margin: 0 }}>M-Pesa</p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: 0 }}>Safaricom Kenya</p>
                </div>
              </div>
              {sendAmount && (
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 16, fontWeight: 900, color: "#22C55E", margin: 0 }}>KES {Math.ceil(parseFloat(sendAmount || "0") * 130).toLocaleString()}</p>
                  <p style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", margin: 0 }}>≈ {sendAmount} {sendToken.symbol}</p>
                </div>
              )}
            </div>

            {/* Mode toggle: STK (charge me) vs B2C (send to recipient) */}
            <div style={{ display: "flex", gap: 0, background: "rgba(0,0,0,0.3)", padding: 3, borderRadius: 10, marginBottom: 14 }}>
              {([
                ["stk",  "💳 Charge My Phone",   "You pay from your M-Pesa"],
                ["b2c",  "📤 Send to Number", "Recipient gets the money"],
              ] as const).map(([m, label, hint]) => (
                <button key={m} onClick={() => setMpesaMode(m)}
                  style={{
                    flex: 1, padding: "8px 6px", borderRadius: 7, border: "none", cursor: "pointer",
                    background: mpesaMode === m ? "rgba(34,197,94,0.2)" : "transparent",
                    color: mpesaMode === m ? "#22C55E" : "rgba(255,255,255,0.4)",
                    fontWeight: 700, fontSize: 11, transition: "all 0.2s",
                    outline: mpesaMode === m ? "1.5px solid rgba(34,197,94,0.4)" : "none",
                  }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Phone input label changes based on mode */}
            <label style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6, letterSpacing: 1 }}>
              {mpesaMode === "stk" ? "YOUR M-PESA NUMBER" : "RECIPIENT M-PESA NUMBER"}
            </label>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1, position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>+</span>
                <input
                  type="tel"
                  placeholder="254700000000"
                  value={mpesaPhone}
                  onChange={e => {
                    const v = e.target.value.replace(/[^\d]/g, "");
                    setMpesaPhone(v);
                    setMpesaStatus(null);
                  }}
                  style={{
                    width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10, padding: "10px 12px 10px 28px", fontSize: 14, color: "#fff",
                    outline: "none", fontFamily: "monospace", boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* Phone format hint */}
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: "0 0 12px" }}>
              Format: 2547XXXXXXXX or 2541XXXXXXXX · {mpesaMode === "stk" ? "STK push sent to your phone" : "Money sent directly to recipient"}
            </p>

            {/* Send button */}
            <button
              onClick={mpesaMode === "stk"
                ? () => handleMpesaSTK()
                : () => handleMpesaB2C()
              }
              disabled={mpesaBusy || !mpesaPhone.match(/^254[17]\d{8}$/) || !sendAmount || parseFloat(sendAmount) <= 0}
              style={{
                width: "100%", padding: "12px", borderRadius: 10, border: "none", fontWeight: 800, fontSize: 14,
                background: mpesaBusy || !mpesaPhone.match(/^254[17]\d{8}$/) || !sendAmount
                  ? "rgba(255,255,255,0.08)"
                  : "linear-gradient(135deg,#22C55E,#16a34a)",
                color: "#fff", cursor: mpesaBusy ? "not-allowed" : "pointer",
                opacity: !mpesaPhone.match(/^254[17]\d{8}$/) || !sendAmount ? 0.5 : 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
              <Phone size={16} />
              {mpesaBusy
                ? "⏳ Processing…"
                : mpesaMode === "stk"
                  ? `Charge KES ${Math.ceil(parseFloat(sendAmount || "0") * 130).toLocaleString()} via STK`
                  : `Send KES ${Math.ceil(parseFloat(sendAmount || "0") * 130).toLocaleString()} to ${mpesaPhone || "…"}`}
            </button>

            {/* Live status / receipt */}
            {mpesaStatus && (
              <div style={{
                marginTop: 12, padding: "12px 14px", borderRadius: 10, fontSize: 12,
                background: mpesaStatus.type === "success"
                  ? "rgba(34,197,94,0.1)"
                  : mpesaStatus.type === "error"
                    ? "rgba(239,68,68,0.1)"
                    : "rgba(251,191,36,0.08)",
                border: `1px solid ${mpesaStatus.type === "success" ? "rgba(34,197,94,0.3)" : mpesaStatus.type === "error" ? "rgba(239,68,68,0.3)" : "rgba(251,191,36,0.2)"}`,
                color: "#fff",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: mpesaStatus.detail ? 6 : 0 }}>
                  <span style={{ fontSize: 16 }}>
                    {mpesaStatus.type === "success" ? "✅" : mpesaStatus.type === "error" ? "❌" : "⏳"}
                  </span>
                  <span style={{ fontWeight: 700 }}>{mpesaStatus.message}</span>
                </div>
                {mpesaStatus.detail && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, marginLeft: 24 }}>
                    {mpesaStatus.detail.map((line, i) => (
                      <p key={i} style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", margin: 0 }}>{line}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showModal && <WalletConnectModal onClose={() => setShowModal(false)} />}
    </main>
  );
}
