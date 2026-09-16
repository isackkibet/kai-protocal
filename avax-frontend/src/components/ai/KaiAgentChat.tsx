'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bot, Send, ChevronLeft, Loader2, RefreshCw,
  Wrench, ChevronRight, X, Database,
  Coins, BarChart3, ShieldCheck, Vote, Leaf,
  BookOpen, Volume2, VolumeX,
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import AgentProposalCard, { AgentProposal } from '@/components/AgentProposalCard';
import { ECOSYSTEM_TOKENS } from '@/lib/tokens';
import { VAULT_ADDRESSES } from '@/lib/addresses';
import { formatChat } from '@/lib/formatChat';

interface Msg {
  role: 'ai' | 'user';
  text: string;
  agent?: string;
  sources?: number;
  proposal?: AgentProposal;
}

const TOOLS = [
  {
    group: 'Portfolio', icon: Coins, color: '#10b981',
    items: [
      { label: 'Check wallet balances',     q: 'Show all my token balances and total portfolio value in USD' },
      { label: 'Best yield opportunity',    q: 'What is the best yield opportunity in KAI right now?' },
      { label: 'Vault APY comparison',      q: 'Compare all KAI vault APYs and risk levels' },
    ],
  },
  {
    group: 'Liquidity', icon: BarChart3, color: '#3b82f6',
    items: [
      { label: 'Pool reserves & rates',     q: 'Show current KAI AMM pool reserves and swap rates' },
      { label: 'Impermanent loss estimate', q: 'Explain impermanent loss for KAI pools and how to minimise it' },
      { label: 'Add liquidity guide',       q: 'How do I add liquidity to the NVR/yBOB pool step by step?' },
    ],
  },
  {
    group: 'Governance', icon: Vote, color: '#a855f7',
    items: [
      { label: 'Draft DAO proposal',        q: 'Draft a KAI DAO governance proposal to increase GAMI vault APY to 25%' },
      { label: 'Explain NVR voting',        q: 'How does NVR token governance voting work in KAI?' },
      { label: 'Policy recommendation',     q: 'Give me a personalised KAI policy recommendation for medium risk tolerance' },
    ],
  },
  {
    group: 'Security', icon: ShieldCheck, color: '#22c55e',
    items: [
      { label: 'Audit KaiVault contract',   q: 'Audit the KaiVault smart contract for security vulnerabilities' },
      { label: 'DID activity log',          q: 'Show recent agent activity and authorization status from DID tracker' },
      { label: 'x402 payment status',       q: 'What is the current x402 payment rail configuration?' },
    ],
  },
  {
    group: 'Learn', icon: BookOpen, color: '#f59e0b',
    items: [
      { label: 'Start KAI onboarding',      q: 'Guide me through the KAI Nuvari onboarding step by step' },
      { label: 'Explain yield farming',     q: 'Explain yield farming and how KAI vaults work in simple terms' },
      { label: 'Community commodities',     q: 'What community commodities can be tokenized on KAI and at what APY?' },
    ],
  },
  {
    group: 'Ecosystem', icon: Leaf, color: '#06b6d4',
    items: [
      { label: 'All KAI tokens explained',  q: 'Explain all 6 KAI ecosystem tokens and their roles' },
      { label: 'M-Pesa integration',        q: 'How does the KAI M-Pesa integration work for KES payments?' },
      { label: 'Conservation NFTs',         q: 'Explain the KAI Conservation NFT marketplace and how to buy with yBOB' },
    ],
  },
];

function detectProposal(query: string): AgentProposal | undefined {
  const q = query.toLowerCase();
  const yBOB = ECOSYSTEM_TOKENS.find(t => t.symbol === 'yBOB');
  if ((q.includes('deposit') || q.includes('vault')) && q.includes('ybob')) {
    return {
      agentName: 'Vault Agent', actionType: 'APPROVE_STAKE',
      title: 'Deposit yBOB into Vault',
      description: 'Deposit yBOB into the kvyBOB yield vault to earn 7.5% APY.',
      amount: '10', tokenSymbol: 'yBOB', tokenAddress: yBOB?.address as `0x${string}`,
      targetContract: VAULT_ADDRESSES.yBOB ?? '0x431A98d42f9F7d6529C676115D5E3Df3c2419DA2',
      projectedApy: '7.5% APY',
    };
  }
  if (q.includes('transfer') && q.includes('ybob')) {
    const addressMatch = query.match(/0x[a-fA-F0-9]{40}/);
    if (!addressMatch) return undefined;
    return {
      agentName: 'Tx Agent', actionType: 'TRANSFER',
      title: 'Transfer yBOB',
      description: 'Transfer yBOB on Avalanche Fuji testnet.',
      amount: '5', tokenSymbol: 'yBOB', tokenAddress: yBOB?.address as `0x${string}`,
      recipientAddress: addressMatch[0] as `0x${string}`,
    };
  }
}

function fmt(text: string) {
  return formatChat(text);
}

interface KaiAgentChatProps {
  onClose?: () => void;
}

export default function KaiAgentChat({ onClose }: KaiAgentChatProps) {
  const [msgs, setMsgs] = useState<Msg[]>([{
    role: 'ai',
    text: 'Hey, I\'m **KAI Agent**. Ask me about tokens, vaults, pools, governance, or community products — or open **Tools** to run pre-built queries instantly. I prepare plans for any financial action and you approve every one in your wallet.',
    agent: 'KAI Agent', sources: 0,
  }]);
  const [input,       setInput]      = useState('');
  const [loading,     setLoading]    = useState(false);
  const [rag,         setRag]        = useState(true);
  const [toolsOpen,   setToolsOpen]  = useState(false);
  const [activeGroup, setActiveGroup]= useState(TOOLS[0].group);
  const [online,      setOnline]     = useState<boolean | null>(null);
  const [voiceOn,     setVoiceOn]    = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, loading]);

  const checkHealth = useCallback(async () => {
    try {
      const base = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://127.0.0.1:8000';
      const r = await fetch(`${base}/health`, { signal: AbortSignal.timeout(3000) });
      setOnline(r.ok);
    } catch { setOnline(false); }
  }, []);
  useEffect(() => {
    const t = setTimeout(() => checkHealth(), 0);
    return () => clearTimeout(t);
  }, [checkHealth]);

  const speak = useCallback((text: string) => {
    if (!voiceOn || typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/`(.*?)`/g, '$1'));
    const voice = window.speechSynthesis.getVoices().find(v => v.lang.startsWith('en'));
    if (voice) utt.voice = voice;
    window.speechSynthesis.speak(utt);
  }, [voiceOn]);

  const send = async (override?: string) => {
    const query = (override ?? input).trim();
    if (!query || loading) return;
    setInput('');
    const proposal = detectProposal(query);
    setMsgs(prev => [...prev, { role: 'user', text: query }]);
    setTimeout(() => inputRef.current?.focus(), 50);
    setMsgs(prev => [...prev, { role: 'ai', text: '', agent: 'KAI Agent', sources: 0, proposal }]);
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, rag, stream: true }),
      });
      if (!res.ok || !res.body) throw new Error(`API ${res.status}`);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '', full = '';
      let aiText = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n'); buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          try {
            const evt = JSON.parse(line.slice(5).trim());
            if (evt.token) {
              const next = full + evt.token;
              full = next;
              aiText = next;
              setMsgs(prev => { const c = [...prev]; c[c.length-1] = { ...c[c.length-1], text: next }; return c; });
            }
            if (evt.done) setMsgs(prev => { const c = [...prev]; c[c.length-1] = { ...c[c.length-1], sources: evt.sources ?? 0 }; return c; });
          } catch { /* skip */ }
        }
      }
      if (aiText) speak(aiText);
    } catch {
      setMsgs(prev => {
        const c = prev.slice(0,-1);
        return [...c, { role: 'ai', text: '**Agent offline.** Make sure `python server.py` is running at port 8000.', agent: 'System' }];
      });
    } finally { setLoading(false); }
  };

  const pickTool = (q: string) => { setInput(q); setToolsOpen(false); setTimeout(() => inputRef.current?.focus(), 100); };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100dvh',
      position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(160deg, #060608 0%, #0a0f0c 55%, #061018 100%)',
      color: '#fff',
    }}>
      {/* Background spotlight */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(600px 300px at 20% 0%, rgba(16,185,129,0.10), transparent 60%)' }} />

      {/* Header */}
      <header style={{
        position: 'relative', zIndex: 10, padding: '48px 16px 12px',
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'linear-gradient(180deg, rgba(6,6,8,0.92) 0%, rgba(6,6,8,0.55) 100%)',
        backdropFilter: 'blur(18px)', borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {!onClose && (
          <Link href="/" aria-label="Back" style={{ color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center' }}>
            <ChevronLeft size={20} />
          </Link>
        )}
        <div style={{ position: 'relative' }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981, #064e3b)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 22px rgba(16,185,129,0.55)',
          }}>
            <Bot size={20} color="#fff" />
          </div>
          <span style={{ position: 'absolute', inset: -3, borderRadius: '50%', border: '1.5px solid rgba(16,185,129,0.45)', animation: 'glow-pulse 2.5s ease-in-out infinite' }} />
          <span style={{ position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, borderRadius: '50%',
            background: online === false ? '#f87171' : '#22c55e', border: '2px solid rgba(6,6,8,0.9)' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 900, color: '#fff', margin: 0 }}>KAI Agent</p>
          <p style={{ fontSize: 10, color: '#10b981', margin: 0, fontWeight: 700 }}>
            {online === true ? '● Neural orchestrator · online' : online === false ? '● Offline — start server' : '● Checking…'}
          </p>
        </div>
        <button onClick={() => setVoiceOn(v => !v)} title="Voice replies" style={{
          width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: voiceOn ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
        }}>
          {voiceOn ? <Volume2 size={15} color="#10b981" /> : <VolumeX size={15} color="rgba(255,255,255,0.35)" />}
        </button>
        <button onClick={checkHealth} aria-label="Refresh connection status" title="Check connection" style={{
          width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)',
        }}>
          <RefreshCw size={15} color="rgba(255,255,255,0.35)" />
        </button>
        {onClose && (
          <button onClick={onClose} aria-label="Close chat" style={{
            width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)',
          }}>
            <X size={15} color="rgba(255,255,255,0.45)" />
          </button>
        )}
      </header>

      {/* Status strip */}
      <div style={{ position: 'relative', zIndex: 9, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => setRag(v => !v)} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
          background: rag ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.06)', color: rag ? '#34d399' : 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700,
        }}>
          <Database size={11} /> RAG {rag ? 'ON' : 'OFF'}
        </button>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>I plan, you approve — nothing moves without your signature.</span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', zIndex: 8 }}>
        {/* Chat column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 10, scrollbarWidth: 'thin' }}>
            {msgs.map((m, i) => {
              const isUser = m.role === 'user';
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end' }}>
                  {!isUser && (
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginBottom: 2,
                      background: 'linear-gradient(135deg,#34d399,#10b981,#064e3b)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 0 12px rgba(16,185,129,0.40)',
                    }}>
                      <Bot size={13} color="#fff" strokeWidth={1.8} />
                    </div>
                  )}
                  <div style={{ maxWidth: '84%', display: 'flex', flexDirection: 'column', gap: 5, alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                    {!isUser && (m.agent || m.sources) && (
                      <span style={{ fontSize: 9, fontWeight: 800, color: '#34d399', letterSpacing: 0.7, textTransform: 'uppercase', marginLeft: 4 }}>
                        {m.agent}{m.sources ? ` · ${m.sources} sources` : ''}
                      </span>
                    )}
                    <div style={{
                      padding: m.role === 'user' ? '9px 14px' : '11px 15px',
                      borderRadius: m.role === 'user' ? '18px 18px 5px 18px' : '18px 18px 18px 5px',
                      background: m.role === 'user'
                        ? 'linear-gradient(135deg, rgba(16,185,129,0.85), rgba(5,150,105,0.75))'
                        : 'rgba(18,18,26,0.78)',
                      backdropFilter: 'blur(16px)',
                      fontSize: 14, lineHeight: 1.7, color: '#fff', wordBreak: 'break-word',
                      boxShadow: m.role === 'user'
                        ? '0 4px 18px rgba(16,185,129,0.28)'
                        : '0 4px 20px rgba(0,0,0,0.4)',
                    }}>
                      <div dangerouslySetInnerHTML={{ __html: fmt(m.text || (loading && i === msgs.length - 1 ? '…' : '')) }} />
                    </div>
                    {m.proposal && <AgentProposalCard proposal={m.proposal} />}
                  </div>
                </motion.div>
              );
            })}

            {/* Typing dots */}
            {loading && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#064e3b)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Loader2 size={13} color="#fff" style={{ animation: 'spin 0.9s linear infinite' }} />
                </div>
                <div style={{ padding: '10px 14px', borderRadius: '18px 18px 18px 5px', background: 'rgba(18,18,26,0.78)', display: 'flex', gap: 4 }}>
                  {[0,1,2].map(n => (
                    <div key={n} style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', animation: `kai-dot ${0.7 + n*0.18}s ease-in-out infinite` }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} style={{ height: 4 }} />
          </div>

          {/* Quick chips */}
          <div style={{
            padding: '0 16px 8px', display: 'flex', gap: 7, overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0,
          }}>
            {['What tokens does KAI have?', 'Best vault APY?', 'How do I swap tokens?', 'How does M-Pesa work?', 'Explain KAI governance'].map(q => (
              <button key={q} onClick={() => send(q)} style={{
                flexShrink: 0, padding: '6px 13px', borderRadius: 20, border: '1px solid rgba(16,185,129,0.22)',
                background: 'rgba(16,185,129,0.08)', color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 600,
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.16s',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(16,185,129,0.18)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(16,185,129,0.45)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(16,185,129,0.08)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(16,185,129,0.22)';
                }}
              >{q}</button>
            ))}
          </div>

          {/* Input bar — voice-agent style */}
          <div style={{
            position: 'relative', zIndex: 10, padding: '10px 14px',
            paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
            background: 'linear-gradient(0deg, rgba(6,6,8,0.96) 0%, rgba(6,6,8,0.7) 100%)',
            backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', gap: 8, alignItems: 'flex-end',
          }}>
            {/* Tools button (round, like mic) */}
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setToolsOpen(v => !v)} title="Agent Tools" style={{
              width: 52, height: 52, borderRadius: '50%', border: 'none', flexShrink: 0, cursor: 'pointer',
              background: toolsOpen
                ? 'linear-gradient(135deg, #f43f5e, #be123c)'
                : 'linear-gradient(135deg, #34d399, #10b981, #047857)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: toolsOpen ? '0 0 24px rgba(244,63,94,0.5)' : '0 0 20px rgba(16,185,129,0.5)',
            }}>
              <Wrench size={20} color="#fff" />
            </motion.button>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 24, padding: '6px 6px 6px 14px' }}>
              <textarea rows={1} ref={inputRef} value={input}
                onChange={e => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 110) + 'px';
                }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Ask KAI anything…"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 14, resize: 'none', fontFamily: 'inherit', minHeight: 26, maxHeight: 110, padding: '4px 0' }} />
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => send()} disabled={!input.trim() || loading} style={{
                width: 38, height: 38, borderRadius: '50%', border: 'none', flexShrink: 0,
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                background: input.trim() && !loading ? 'linear-gradient(135deg, #34d399, #047857)' : 'rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Send size={16} color={input.trim() && !loading ? '#fff' : 'rgba(255,255,255,0.25)'} />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Tools panel (right side on desktop) */}
        {toolsOpen && (
          <div style={{
            width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column',
            background: 'rgba(8,6,8,0.92)', backdropFilter: 'blur(18px)',
            borderLeft: '1px solid rgba(16,185,129,0.18)', overflow: 'hidden', zIndex: 11,
          }}>
            <div style={{
              padding: '14px 16px', borderBottom: '1px solid rgba(16,185,129,0.14)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', background: 'rgba(16,185,129,0.16)',
                  border: '1px solid rgba(16,185,129,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Wrench size={12} color="#10b981" />
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Agent Tools</span>
              </div>
              <button onClick={() => setToolsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', display: 'flex', padding: 4, borderRadius: 6 }}>
                <X size={15} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              {TOOLS.map(group => {
                const open = activeGroup === group.group;
                const Icon = group.icon;
                return (
                  <div key={group.group}>
                    <button
                      onClick={() => setActiveGroup(open ? '' : group.group)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '12px 16px', cursor: 'pointer', border: 'none',
                        background: open ? `${group.color}12` : 'transparent',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        color: open ? group.color : 'rgba(255,255,255,0.48)',
                        fontSize: 12, fontWeight: 700, textAlign: 'left', transition: 'all 0.15s',
                      }}>
                      <Icon size={14} color={open ? group.color : 'rgba(255,255,255,0.28)'} strokeWidth={1.8} />
                      <span style={{ flex: 1 }}>{group.group}</span>
                      <ChevronRight size={12} style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', opacity: 0.45 }} />
                    </button>

                    {open && (
                      <div style={{ background: 'rgba(0,0,0,0.25)', padding: '6px 10px 10px' }}>
                        {group.items.map(item => (
                          <button key={item.label} onClick={() => pickTool(item.q)} style={{
                            width: '100%', textAlign: 'left', padding: '9px 11px', borderRadius: 10, cursor: 'pointer',
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                            color: 'rgba(255,255,255,0.65)', fontSize: 11.5, marginBottom: 5,
                            display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1.35,
                            transition: 'all 0.15s',
                          }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLButtonElement).style.background = `${group.color}14`;
                              (e.currentTarget as HTMLButtonElement).style.borderColor = `${group.color}30`;
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)';
                              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.06)';
                            }}
                          >
                            <ChevronRight size={10} color={group.color} style={{ flexShrink: 0 }} />
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes kai-dot {
          0%,100% { opacity: 0.35; transform: translateY(0); }
          50%      { opacity: 1;    transform: translateY(-3px); }
        }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(16,185,129,0.30); border-radius: 2px; }
        textarea::placeholder { color: rgba(255,255,255,0.22) !important; }
      `}</style>
    </div>
  );
}