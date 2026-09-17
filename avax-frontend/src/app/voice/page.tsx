'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bot, ChevronLeft, Mic, MicOff, Volume2, VolumeX,
  Loader2, Send as SendIcon, Wallet, Repeat, ShieldCheck,
  ArrowRight, ExternalLink, CheckCircle2, AlertTriangle, Cpu,
  Coins,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatChat } from '@/lib/formatChat';
import { useAccount, useWriteContract, useSwitchChain, usePublicClient } from 'wagmi';
import { avalancheFuji } from 'wagmi/chains';
import { parseUnits } from 'viem';
import { ERC20_ABI } from '@/lib/erc20abi';

// ─── Types ────────────────────────────────────────────────────────────────────

interface IntentProposal {
  agentName: string;
  actionType: string;
  title: string;
  description: string;
  amount: string;
  tokenSymbol: string;
  tokenAddress?: `0x${string}`;
  recipientAddress?: `0x${string}`;
  targetContract?: `0x${string}`;
  projectedApy?: string;
}

interface IntentResult {
  intentType: 'TRANSFER' | 'STAKE' | 'PAYMENT' | 'NAVIGATE' | 'BALANCE' | 'MRV_AUDIT' | 'QUERY';
  spokenReply: string;
  displayText: string;
  proposal?: IntentProposal;
  navigationPath?: string;
  paymentData?: { amountKes: number; phone?: string; purpose?: string };
}

interface Msg {
  role: 'ai' | 'user';
  text: string;
  intent?: IntentResult;
  streaming?: boolean;
}

type MicState = 'idle' | 'listening' | 'thinking' | 'speaking';

// ─── Constants ────────────────────────────────────────────────────────────────

const WELCOME =
  "Open the mic and give me a command — \"send 10 NVR\", \"deposit yBOB\", \"check my balance\", \"show best APY\", \"pay 500 KES via M-Pesa\". I will build the exact plan, you approve, and I execute. No rambling.";

const SILENCE_MS = 1400;
const REOPEN_MS = 600;
const SPOKEN_MAX_CHARS = 200;

const QUICK_COMMANDS = [
  { label: 'Best APY', cmd: 'What is the best APY in the vaults?' },
  { label: 'Check balance', cmd: 'Show my wallet balance' },
  { label: 'Send NVR', cmd: 'Send 10 NVR to my vault' },
  { label: 'Deposit yBOB', cmd: 'Deposit 25 yBOB into vault' },
  { label: 'M-Pesa pay', cmd: 'Pay 500 KES via M-Pesa' },
  { label: 'Open vaults', cmd: 'Navigate to vaults' },
];

const STATUS: Record<MicState, string> = {
  idle: 'Tap mic and speak a command…',
  listening: 'Listening — speak your command…',
  thinking: 'Routing your command…',
  speaking: 'Answering — mic will reopen…',
};

const USD_PER_KES = 130;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Trim AI text to at most 2 short sentences for clean TTS output. */
function spokenLength(text: string): string {
  const clean = text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/[#*_\->`~]/g, '')
    .trim();
  const sentences = clean.split(/(?<=[.!?])\s+/);
  let out = '';
  for (const s of sentences) {
    if ((out + s).length > SPOKEN_MAX_CHARS) break;
    out += out ? ' ' + s : s;
  }
  return out || clean.slice(0, SPOKEN_MAX_CHARS);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function VoiceAgentPage() {
  const router = useRouter();
  const { address: walletAddress } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();

  const [messages, setMessages] = useState<Msg[]>([{ role: 'ai', text: WELCOME }]);
  const [micState, setMicState] = useState<MicState>('idle');
  const [speakOn, setSpeakOn] = useState(true);
  const [autoReopen, setAutoReopen] = useState(true);
  const [input, setInput] = useState('');
  const [stkStatus, setStkStatus] = useState<string | null>(null);
  const [executingProposal, setExecutingProposal] = useState<string | null>(null);
  const [proposalStatus, setProposalStatus] = useState<Record<string, { msg: string; hash?: string; error?: string }>>({});

  const endRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<{ recognize: () => void; stop: () => void } | null>(null);
  const interimRef = useRef('');
  const listeningRef = useRef(false);
  const speakingRef = useRef(false);
  const loadingRef = useRef(false);
  const autoReopenRef = useRef(true);
  const micStateRef = useRef<MicState>('idle');
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const micSupportedRef = useRef(true);
  const runCommandRef = useRef<(text: string) => Promise<void>>(() => Promise.resolve());

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, micState, stkStatus]);

  useEffect(() => { autoReopenRef.current = autoReopen; }, [autoReopen]);
  useEffect(() => { micStateRef.current = micState; }, [micState]);

  // ─── Speech Synthesis (short confirmations only) ──────────────────────────

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!speakOn || typeof window === 'undefined' || !window.speechSynthesis) {
        onEnd?.();
        return;
      }
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(spokenLength(text));
      const v = window.speechSynthesis.getVoices().find((vv) => vv.lang.startsWith('en'));
      if (v) utt.voice = v;
      utt.onstart = () => { speakingRef.current = true; setMicState('speaking'); };
      utt.onend = () => { speakingRef.current = false; onEnd?.(); };
      utt.onerror = () => { speakingRef.current = false; onEnd?.(); };
      window.speechSynthesis.speak(utt);
    },
    [speakOn],
  );

  const reopenMic = useCallback(() => {
    if (!autoReopenRef.current) return;
    setTimeout(() => {
      if (!speakingRef.current && !loadingRef.current && !listeningRef.current) {
        recRef.current?.recognize();
      }
    }, REOPEN_MS);
  }, []);

  // ─── Speech Recognition (single command capture) ─────────────────────────

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const Win = window as any;
    const SR = Win.SpeechRecognition || Win.webkitSpeechRecognition;
    if (!SR) { setMicSupported(false); return; }

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.maxAlternatives = 1;

    rec.onresult = (e: any) => {
      let transcript = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      interimRef.current = transcript;

      // Reset silence timer — auto-send after user stops talking
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        stopAndSend();
      }, SILENCE_MS);
    };

    rec.onend = () => {
      listeningRef.current = false;
      setMicState((prev) => (prev === 'listening' ? 'idle' : prev));
    };

    rec.onerror = (ev: any) => {
      listeningRef.current = false;
      if (micStateRef.current === 'listening') setMicState('idle');
      const code = ev?.error;
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        setStkStatus('Microphone permission denied — allow mic access in your browser.');
      }
    };

    const stopAndSend = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (!listeningRef.current) return;
      listeningRef.current = false;
      try { rec.stop(); } catch {}
      setMicState('idle');
      const said = interimRef.current.trim();
      interimRef.current = '';
      if (said && !loadingRef.current && !speakingRef.current) {
        runCommand(said);
      }
    };

    const recognize = () => {
      if (speakingRef.current || loadingRef.current || listeningRef.current) return;
      interimRef.current = '';
      listeningRef.current = true;
      setMicState('listening');
      recCounterRef.current += 1;
      try { rec.start(); } catch {
        listeningRef.current = false;
        setMicState('idle');
        setStkStatus('Could not start the microphone. Check browser permission.');
      }
    };

    recRef.current = { recognize, stop: stopAndSend };

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      try { rec.abort(); } catch {}
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Intent Router: voice command → specific action plan ─────────────────

  const runCommand = async (text: string) => {
    if (!text) return;
    loadingRef.current = true;
    setMicState('thinking');
    setStkStatus(null);
    setMessages((p) => [...p, { role: 'user', text }]);

    try {
      // Step 1: route through the intent engine
      const res = await fetch('/api/agent/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, userAddress: walletAddress || undefined }),
      });

      if (!res.ok) throw new Error('Intent routing failed');
      const intent: IntentResult = await res.json();

      // ─── ACTION intents: produce specific plan + short spoken confirmation ────

      if (intent.intentType === 'TRANSFER' || intent.intentType === 'STAKE') {
        if (intent.proposal) {
          setMessages((p) => [...p, { role: 'ai', text: intent.displayText || intent.spokenReply, intent }]);
          speak(intent.spokenReply, reopenMic);
        } else {
          setMessages((p) => [...p, { role: 'ai', text: intent.displayText || intent.spokenReply }]);
          speak(intent.spokenReply, reopenMic);
        }
        finish();
        return;
      }

      if (intent.intentType === 'PAYMENT' && intent.paymentData) {
        const pd = intent.paymentData;
        const amountKes = pd.amountKes;
        const phone = pd.phone;
        const purpose = pd.purpose || 'KAI DeFi Service';
        setStkStatus(`Sending M-Pesa STK push for KSh ${amountKes}…`);
        try {
          const r = await fetch('/api/mpesa/stk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: phone?.startsWith('0') ? `254${phone.slice(1)}` : phone,
              nftId: 'voice-intent',
              nftName: purpose,
              priceYbob: amountKes / USD_PER_KES,
            }),
          });
          const d = await r.json().catch(() => ({}));
          const msg = r.ok ? d.message || `STK push sent. Check ${phone || 'your phone'} and enter your PIN.` : `Failed: ${d.error || 'unknown'}`;
          setStkStatus(msg);
          setMessages((p) => [...p, { role: 'ai', text: msg }]);
          speak(intent.spokenReply || msg, reopenMic);
        } catch {
          const err = 'M-Pesa request failed. Try again.';
          setStkStatus(err);
          setMessages((p) => [...p, { role: 'ai', text: err }]);
          speak(err, reopenMic);
        }
        finish();
        return;
      }

      if (intent.intentType === 'PAYMENT' && intent.proposal) {
        // x402 protocol payment via proposal card
        setMessages((p) => [...p, { role: 'ai', text: intent.displayText || intent.spokenReply, intent }]);
        speak(intent.spokenReply, reopenMic);
        finish();
        return;
      }

      if (intent.intentType === 'NAVIGATE' && intent.navigationPath) {
        setMessages((p) => [...p, { role: 'ai', text: intent.displayText || `Navigating to ${intent.navigationPath}` }]);
        speak(intent.spokenReply || `Opening ${intent.navigationPath}`, () => {
          router.push(intent.navigationPath!);
        });
        finish();
        return;
      }

      if (intent.intentType === 'BALANCE' || intent.intentType === 'MRV_AUDIT') {
        const path = intent.navigationPath || (intent.intentType === 'BALANCE' ? '/profile' : '/hub');
        setMessages((p) => [...p, { role: 'ai', text: intent.displayText || intent.spokenReply }]);
        speak(intent.spokenReply, () => { router.push(path); });
        finish();
        return;
      }

      // ─── QUERY fallback: terse Gemini agent for factual questions ────────────
      await runQuery(text, intent.spokenReply);

    } catch {
      const err = 'Command not recognized. Try again with a clear action.';
      setMessages((p) => [...p, { role: 'ai', text: err }]);
      speak(err, reopenMic);
      finish();
    }
  };

  // ─── Query fallback: terse Gemini agent (what is KAI, best APY, etc.) ────

  const runQuery = async (text: string, intentSpokenReply?: string) => {
    loadingRef.current = true;
    setMicState('thinking');
    setMessages((p) => [...p, { role: 'ai', text: '', streaming: true }]);

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, wallet: walletAddress || undefined, terse: true }),
      });
      if (!res.ok || !res.body) throw new Error('bad response');

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      let aiText = '';
      let finalSpoken = intentSpokenReply || '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const frames = buf.split('\n\n');
        buf = frames.pop() ?? '';
        for (const frame of frames) {
          let event = 'message';
          let data = '';
          for (const line of frame.split('\n')) {
            if (line.startsWith('event:')) event = line.slice(6).trim();
            else if (line.startsWith('data:')) data += line.slice(5).trim();
          }
          if (!data) continue;
          let json: any;
          try { json = JSON.parse(data); } catch { continue; }

          // If the agent produced a plan (swap, escrow, etc.), emit it
          if (event === 'approval' && json.plan) {
            const intentType = json.plan.action === 'swap' ? 'STAKE' : 'TRANSFER';
            const proposal: IntentResult = {
              intentType,
              spokenReply: `Plan ready. Approve in the card below.`,
              displayText: Object.entries(json.plan)
                .filter(([k]) => !['name', 'requiresHumanApproval', 'approvalNote'].includes(k))
                .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
                .join(' · '),
              proposal: {
                agentName: 'KAI Agent',
                actionType: intentType,
                title: json.plan.action || 'Plan',
                description: json.plan.approvalNote || 'Review and approve to execute.',
                amount: String(json.plan.amountToken || json.plan.amount || json.plan.fromAmount || ''),
                tokenSymbol: json.plan.token || json.plan.toToken || json.plan.tokenSymbol || '',
                tokenAddress: json.plan.tokenAddress || json.plan.targetContract,
                recipientAddress: json.plan.recipientAddress,
                projectedApy: json.plan.projectedApy,
              },
            };
            setMessages((p) => {
              const clone = [...p];
              const lastIdx = clone.length - 1;
              if (clone[lastIdx]?.streaming) {
                clone[lastIdx] = { ...clone[lastIdx], text: aiText || 'Plan ready — review below.', streaming: false, intent: proposal };
              } else {
                clone.push({ role: 'ai', text: aiText || 'Plan ready — review below.', streaming: false, intent: proposal });
              }
              return clone;
            });
            speak(finalSpoken || 'Plan ready — approve the card below to execute.', reopenMic);
            finish();
            return;
          }

          if (typeof json.token === 'string') {
            aiText += json.token;
            finalSpoken = aiText;
            setMessages((p) => {
              const clone = [...p];
              const lastIdx = clone.length - 1;
              if (clone[lastIdx]?.streaming) {
                clone[lastIdx] = { ...clone[lastIdx], text: aiText };
              }
              return clone;
            });
          }
        }
      }

      // Done streaming
      setMessages((p) => {
        const clone = [...p];
        const lastIdx = clone.length - 1;
        if (clone[lastIdx]?.streaming) {
          clone[lastIdx] = { ...clone[lastIdx], text: aiText || 'No response generated.', streaming: false };
        }
        return clone;
      });
      speak(finalSpoken || aiText || 'Done.', reopenMic);

    } catch {
      setMessages((p) => {
        const clone = [...p];
        const lastIdx = clone.length - 1;
        if (clone[lastIdx]?.streaming) {
          clone[lastIdx] = { ...clone[lastIdx], text: 'Connection error. Try again.', streaming: false };
        }
        return clone;
      });
      speak('Connection error.', reopenMic);
    } finally {
      finish();
    }
  };

  const finish = () => {
    loadingRef.current = false;
    setMicState((prev) => (prev === 'thinking' || prev === 'speaking' ? prev : autoReopen ? 'idle' : 'idle'));
    if (!autoReopenRef.current) setMicState('idle');
  };

  // ─── Proposal Execution (wagmi on-chain) ────────────────────────────────

  const executeProposal = async (proposal: IntentProposal, proposalKey: string) => {
    if (!walletAddress || !proposal.tokenAddress) {
      setProposalStatus((s) => ({ ...s, [proposalKey]: { msg: '', error: 'Connect wallet first.' } }));
      return;
    }
    setExecutingProposal(proposalKey);
    setProposalStatus((s) => ({ ...s, [proposalKey]: { msg: 'Switching to Avalanche Fuji…' } }));

    try {
      await switchChainAsync({ chainId: avalancheFuji.id });
      let hash: `0x${string}`;
      const amount = parseUnits(proposal.amount || '0', 18);

      if (proposal.actionType === 'TRANSFER' && proposal.recipientAddress) {
        setProposalStatus((s) => ({ ...s, [proposalKey]: { msg: `Signing transfer of ${proposal.amount} ${proposal.tokenSymbol}…` } }));
        hash = await writeContractAsync({
          address: proposal.tokenAddress,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [proposal.recipientAddress, amount],
          chainId: avalancheFuji.id,
        });
      } else if (proposal.actionType === 'APPROVE_STAKE' && proposal.targetContract) {
        setProposalStatus((s) => ({ ...s, [proposalKey]: { msg: `Approving ${proposal.tokenSymbol} for Vault…` } }));
        hash = await writeContractAsync({
          address: proposal.tokenAddress,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [proposal.targetContract, amount],
          chainId: avalancheFuji.id,
        });
      } else {
        setProposalStatus((s) => ({ ...s, [proposalKey]: { msg: `Executing ${proposal.actionType}…` } }));
        const target = proposal.targetContract || proposal.recipientAddress || proposal.tokenAddress;
        hash = await writeContractAsync({
          address: proposal.tokenAddress,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [target, amount],
          chainId: avalancheFuji.id,
        });
      }

      setProposalStatus((s) => ({ ...s, [proposalKey]: { msg: 'Confirmed on-chain!', hash } }));
      speak(`Confirmed on chain. ${proposal.amount} ${proposal.tokenSymbol} processed.`);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Execution failed';
      setProposalStatus((s) => ({ ...s, [proposalKey]: { msg: '', error: msg.length > 140 ? msg.slice(0, 140) + '…' : msg } }));
    } finally {
      setExecutingProposal(null);
    }
  };

  // ─── Mic Control ───────────────────────────────────────────────────────

  const toggleMic = () => {
    if (micState === 'thinking' || micState === 'speaking') return;
    if (listeningRef.current) {
      recRef.current?.stop();
    } else {
      recRef.current?.recognize();
    }
  };

  const handleQuickCommand = (cmd: string) => {
    recRef.current?.stop();
    runCommand(cmd);
  };

  const handleTypedSend = () => {
    if (!input.trim()) return;
    recRef.current?.stop();
    runCommand(input.trim());
    setInput('');
  };

  // ─── Styles ────────────────────────────────────────────────────────────

  const micBtnColor =
    micState === 'listening'
      ? 'linear-gradient(135deg, #f43f5e, #be123c)'
      : micState === 'speaking'
        ? 'linear-gradient(135deg, #06b6d4, #0284c7)'
        : 'linear-gradient(135deg, #34d399, #10b981, #047857)';

  const micBtnGlow =
    micState === 'listening' ? '0 0 34px rgba(244,63,94,0.6)'
    : micState === 'speaking' ? '0 0 26px rgba(6,182,212,0.5)'
    : '0 0 24px rgba(16,185,129,0.5)';

  const micDisabled = micState === 'thinking' || micState === 'speaking';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100dvh', position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(160deg, #060608 0%, #0a0f0c 55%, #061018 100%)',
    }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(600px 300px at 20% 0%, rgba(16,185,129,0.10), transparent 60%)' }} />

      {/* Header */}
      <header style={{ position: 'relative', zIndex: 10, padding: '48px 16px 14px', display: 'flex', alignItems: 'center', gap: 12,
        background: 'linear-gradient(180deg, rgba(6,6,8,0.92) 0%, rgba(6,6,8,0.55) 100%)', backdropFilter: 'blur(18px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/chat" style={{ color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center' }}><ChevronLeft size={20} /></Link>
        <div style={{ position: 'relative' }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #064e3b)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 22px rgba(16,185,129,0.55)' }}>
            <Bot size={20} color="#fff" />
          </div>
          {micState === 'listening' && <span style={{ position: 'absolute', inset: -3, borderRadius: '50%', border: '1.5px solid #f43f5e', animation: 'glow-pulse 1.2s ease-in-out infinite' }} />}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 15, fontWeight: 900, color: '#fff', margin: 0 }}>KAI Voice Command</p>
          <p style={{ fontSize: 10, color: '#10b981', margin: 0, fontWeight: 700 }}>
            {micState === 'listening' ? '● Listening…' : micState === 'thinking' ? '● Routing…' : micState === 'speaking' ? '● Speaking…' : '● Action-first · not a chatbot'}
          </p>
        </div>
        <button onClick={() => setSpeakOn((v) => !v)} title="Toggle spoken confirmations" style={{
          width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: speakOn ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
        }}>
          {speakOn ? <Volume2 size={15} color="#10b981" /> : <VolumeX size={15} color="rgba(255,255,255,0.35)" />}
        </button>
      </header>

      {/* Wallet */}
      <div style={{ position: 'relative', zIndex: 9, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, border: 'none',
          background: walletAddress ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.06)',
          color: walletAddress ? '#34d399' : 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 700,
        }}>
          <Wallet size={12} />
          {walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)} · Fuji` : 'Connect wallet to sign actions'}
        </div>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>STT captures your command. TTS confirms — short.</span>
      </div>

      {/* Quick command chips */}
      <div style={{ position: 'relative', zIndex: 9, padding: '4px 16px 6px', display: 'flex', gap: 7, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {QUICK_COMMANDS.map((c) => (
          <button key={c.label} onClick={() => handleQuickCommand(c.cmd)} disabled={micDisabled} style={{
            flexShrink: 0, padding: '6px 12px', borderRadius: 20,
            border: '1px solid rgba(16,185,129,0.25)', cursor: 'pointer',
            background: 'rgba(16,185,129,0.08)', color: 'rgba(255,255,255,0.85)',
            fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <Coins size={11} color="#10b981" /> {c.label}
          </button>
        ))}
      </div>

      {/* Messages + proposals */}
      <main style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 8, padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 8, scrollbarWidth: 'thin' }}>
        {messages.map((m, i) => {
          const pk = `msg-${i}`;
          const isProposal = m.intent?.proposal;
          return (
            <div key={i}>
              {/* Text bubble */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', flexDirection: m.role === 'user' ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end' }}>
                <div style={{
                  maxWidth: '84%', padding: m.role === 'user' ? '9px 14px' : '11px 15px',
                  borderRadius: m.role === 'user' ? '18px 18px 5px 18px' : '18px 18px 18px 5px',
                  background: m.role === 'user' ? 'linear-gradient(135deg, rgba(16,185,129,0.85), rgba(5,150,105,0.75))' : 'rgba(18,18,26,0.78)',
                  backdropFilter: 'blur(16px)', fontSize: 14, lineHeight: 1.7, color: '#fff', wordBreak: 'break-word',
                  boxShadow: m.role === 'user' ? '0 4px 18px rgba(16,185,129,0.28)' : '0 4px 20px rgba(0,0,0,0.4)',
                }}>
                  <div dangerouslySetInnerHTML={{ __html: formatChat(m.text) }} />
                  {m.streaming && (
                    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                      {[0, 1, 2].map((j) => (
                        <span key={j} style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: `pulse-gold ${0.7 + j * 0.18}s ease-in-out infinite` }} />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Proposal card: inline approval + execute */}
              {isProposal && m.intent!.proposal && (() => {
                const prop = m.intent!.proposal;
                const status = proposalStatus[pk];
                const isExecuting = executingProposal === pk;
                const executed = status?.hash;
                const error = status?.error;
                const loadingMsg = status?.msg && !error && !executed ? status.msg : null;

                return (
                  <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                    style={{
                      marginTop: 8, padding: 14, borderRadius: 16,
                      border: `1px solid ${error ? 'rgba(239,68,68,0.4)' : executed ? 'rgba(34,197,94,0.4)' : 'rgba(245,158,11,0.35)'}`,
                      background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(18,18,26,0.85))',
                      backdropFilter: 'blur(14px)',
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Cpu size={15} color="#fbbf24" />
                      </div>
                      <div>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: 0.5 }}>{prop.agentName}</span>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0 }}>{prop.title}</p>
                      </div>
                    </div>

                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, margin: '0 0 8px' }}>{prop.description}</p>

                    <div style={{ background: 'rgba(0,0,0,0.35)', borderRadius: 10, padding: '8px 10px', marginBottom: 10, fontSize: 11, fontFamily: 'monospace', color: '#34d399' }}>
                      <div><span style={{ color: 'rgba(255,255,255,0.4)' }}>Amount:</span> <strong>{prop.amount} {prop.tokenSymbol}</strong></div>
                      {prop.projectedApy && <div><span style={{ color: 'rgba(255,255,255,0.4)' }}>APY:</span> <strong style={{ color: '#fbbf24' }}>{prop.projectedApy}</strong></div>}
                      {prop.recipientAddress && <div><span style={{ color: 'rgba(255,255,255,0.4)' }}>To:</span> <span style={{ color: 'rgba(255,255,255,0.6)' }}>{prop.recipientAddress}</span></div>}
                    </div>

                    {executed ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 10, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#86efac' }}>
                          <CheckCircle2 size={15} /> Confirmed on-chain
                        </div>
                        <a href={`https://testnet.snowtrace.io/tx/${executed}`} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#10b981', fontWeight: 700 }}>
                          Snowtrace <ExternalLink size={11} />
                        </a>
                      </div>
                    ) : error ? (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '8px 10px', borderRadius: 10, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', fontSize: 11, color: '#fca5a5' }}>
                        <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" /> {error}
                      </div>
                    ) : loadingMsg ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderRadius: 10, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 11, color: '#fbbf24', fontFamily: 'monospace' }}>
                        <Loader2 size={13} className="animate-spin" /> {loadingMsg}
                      </div>
                    ) : null}

                    {!executed && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                          <ShieldCheck size={12} color="#22c55e" /> No tx until you approve
                        </div>
                        <button onClick={() => executeProposal(prop, pk)} disabled={isExecuting}
                          style={{
                            padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 11, color: '#000',
                            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                            boxShadow: '0 4px 14px rgba(245,158,11,0.35)',
                            opacity: isExecuting ? 0.6 : 1,
                          }}>
                          {isExecuting ? <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Loader2 size={12} className="animate-spin" /> Signing…</span>
                            : <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Approve & Execute <ArrowRight size={12} /></span>}
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })()}
            </div>
          );
        })}

        {stkStatus && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.08)', color: '#86efac', fontSize: 12 }}>
            {stkStatus}
          </motion.div>
        )}

        <div ref={endRef} style={{ height: 4 }} />
      </main>

      {/* Mic dock */}
      <div style={{ position: 'relative', zIndex: 10, padding: '10px 16px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={toggleMic} disabled={micDisabled || !micSupported}
          title={!micSupported ? 'Mic not supported' : (micState === 'listening' ? 'Stop & send' : 'Open mic')}
          style={{
            width: 68, height: 68, borderRadius: '50%',
            border: micState === 'listening' ? '2px solid #fff' : 'none',
            flexShrink: 0, cursor: micDisabled || !micSupported ? 'not-allowed' : 'pointer',
            background: micBtnColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: micBtnGlow, transition: 'all 0.25s',
          }}>
          {micState === 'thinking' ? <Loader2 size={26} color="#fff" style={{ animation: 'spin 0.9s linear infinite' }} />
            : micState === 'listening' ? <MicOff size={26} color="#fff" />
              : micState === 'speaking' ? <Volume2 size={24} color="#fff" />
                : <Mic size={26} color="#fff" />}
        </motion.button>

        <p style={{ margin: 0, fontSize: 12, color:
          micState === 'listening' ? '#fca5a5' :
          micState === 'speaking' ? '#67e8f9' :
          'rgba(255,255,255,0.6)', fontWeight: 600 }}>
          {STATUS[micState]}
        </p>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
          <Repeat size={12} color={autoReopen ? '#10b981' : 'rgba(255,255,255,0.35)'} />
          Auto-reopen mic after confirmation
          <input type="checkbox" checked={autoReopen} onChange={(e) => setAutoReopen(e.target.checked)} style={{ accentColor: '#10b981', width: 14, height: 14, cursor: 'pointer' }} />
        </label>
      </div>

      {/* Typed input fallback */}
      <footer style={{ position: 'relative', zIndex: 10, padding: '10px 14px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        background: 'linear-gradient(0deg, rgba(6,6,8,0.96) 0%, rgba(6,6,8,0.7) 100%)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(255,255,255,0.07)', borderRadius: 24, padding: '6px 6px 6px 14px' }}>
          <textarea rows={1} value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTypedSend(); } }}
            placeholder={micSupported ? 'Or type a command…' : 'Type a command…'}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 14, resize: 'none', fontFamily: 'inherit', minHeight: 26, padding: '4px 0' }} />
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleTypedSend} disabled={!input.trim() || micDisabled} style={{
            width: 38, height: 38, borderRadius: '50%', border: 'none', flexShrink: 0,
            cursor: input.trim() && !micDisabled ? 'pointer' : 'not-allowed',
            background: input.trim() && !micDisabled ? 'linear-gradient(135deg, #34d399, #047857)' : 'rgba(255,255,255,0.08)',
          }}>
            <SendIcon size={16} color={input.trim() && !micDisabled ? '#fff' : 'rgba(255,255,255,0.25)'} />
          </motion.button>
        </div>
        {!micSupported && <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 6 }}>Voice input needs Chrome/Edge. Typing works everywhere.</p>}
      </footer>
    </div>
  );
}