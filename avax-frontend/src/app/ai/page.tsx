'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bot, Send, ChevronLeft, Loader2, RefreshCw,
  Wrench, ChevronRight, X, Database,
  Coins, BarChart3, ShieldCheck, Vote, Gift, Leaf,
  BookOpen, TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import AgentProposalCard, { AgentProposal } from '@/components/AgentProposalCard';
import { ECOSYSTEM_TOKENS } from '@/lib/tokens';

interface Msg {
  role: 'ai' | 'user';
  text: string;
  agent?: string;
  sources?: number;
  proposal?: AgentProposal;
}

const TOOLS = [
  {
    group: 'Portfolio', icon: Coins, color: '#e84142',
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
      targetContract: '0x431A98d42f9F7d6529C676115D5E3Df3c2419DA2',
      projectedApy: '7.5% APY',
    };
  }
  if (q.includes('transfer') && q.includes('ybob')) {
    return {
      agentName: 'Tx Agent', actionType: 'TRANSFER',
      title: 'Transfer yBOB',
      description: 'Transfer yBOB on Avalanche Fuji testnet.',
      amount: '5', tokenSymbol: 'yBOB', tokenAddress: yBOB?.address as `0x${string}`,
      recipientAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    };
  }
}

function fmt(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.*?)`/g, '<code style="background:rgba(232,65,66,0.15);padding:1px 5px;border-radius:4px;font-size:11.5px;font-family:monospace;color:#fca5a5">$1</code>')
    .replace(/\n/g, '<br/>');
}

export default function AIPage() {
  const [msgs, setMsgs] = useState<Msg[]>([{
    role: 'ai',
    text: 'Hello! I\'m **KAI** — your DeFi assistant for the Nuvari ecosystem on Avalanche.\n\nAsk me anything about tokens, vaults, pools, governance, or community products. Open **Tools** to run pre-built queries instantly.',
    agent: 'KAI Agent', sources: 0,
  }]);
  const [input,       setInput]      = useState('');
  const [loading,     setLoading]    = useState(false);
  const [rag,         setRag]        = useState(true);
  const [toolsOpen,   setToolsOpen]  = useState(false);
  const [activeGroup, setActiveGroup]= useState(TOOLS[0].group);
  const [online,      setOnline]     = useState<boolean | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const checkHealth = useCallback(async () => {
    try {
      const r = await fetch('http://127.0.0.1:8000/health', { signal: AbortSignal.timeout(3000) });
      setOnline(r.ok);
    } catch { setOnline(false); }
  }, []);
  useEffect(() => { checkHealth(); }, [checkHealth]);

  const send = async (override?: string) => {
    const query = (override ?? input).trim();
    if (!query || loading) return;
    setInput('');
    const proposal = detectProposal(query);
    setMsgs(prev => [...prev, { role: 'user', text: query }]);
    setLoading(true);
    setMsgs(prev => [...prev, { role: 'ai', text: '', agent: 'KAI Agent', sources: 0, proposal }]);
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
              full += evt.token;
              setMsgs(prev => { const c = [...prev]; c[c.length-1] = { ...c[c.length-1], text: full }; return c; });
            }
            if (evt.done) setMsgs(prev => { const c = [...prev]; c[c.length-1] = { ...c[c.length-1], sources: evt.sources ?? 0 }; return c; });
          } catch { /* skip */ }
        }
      }
    } catch {
      setMsgs(prev => {
        const c = prev.slice(0,-1);
        return [...c, { role: 'ai', text: '⚠️ Cannot reach agent server. Make sure `python server.py` is running at port 8000.', agent: 'System' }];
      });
    } finally { setLoading(false); }
  };

  const useTool = (q: string) => { setInput(q); setToolsOpen(false); setTimeout(() => inputRef.current?.focus(), 100); };

  return (
    <div style={{
      height: '100dvh', display: 'flex', flexDirection: 'column',
      background: '#08080a', color: '#f8f8fa', overflow: 'hidden',
      fontFamily: 'var(--font-sans)',
    }}>

      {/* ── TOP BAR ────────────────────────────────────── */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 9, padding: '9px 14px',
        flexShrink: 0, background: 'rgba(8,8,10,0.98)',
        borderBottom: '1px solid rgba(232,65,66,0.13)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.03)',
      }}>
        <Link href="/" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none', display: 'flex', alignItems: 'center', marginRight: 2 }}>
          <ChevronLeft size={20} />
        </Link>

        {/* Bot avatar */}
        <div style={{
          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg,#e84142,#7c1d1d)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 12px rgba(232,65,66,0.28)',
        }}>
          <Bot size={17} color="#fff" />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 800, margin: 0, lineHeight: 1.1, color: '#f8f8fa' }}>KAI Agent</p>
          <p style={{ fontSize: 10, margin: 0, lineHeight: 1, fontWeight: 700,
            color: online === true ? '#4ade80' : online === false ? '#f87171' : 'rgba(255,255,255,0.35)' }}>
            {online === true ? '● Online' : online === false ? '● Offline — start server' : '● Checking…'}
          </p>
        </div>

        {/* RAG toggle */}
        <button onClick={() => setRag(v => !v)} style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '5px 9px', borderRadius: 8, cursor: 'pointer',
          background: rag ? 'rgba(232,65,66,0.12)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${rag ? 'rgba(232,65,66,0.32)' : 'rgba(255,255,255,0.09)'}`,
          color: rag ? '#e84142' : 'rgba(255,255,255,0.40)', fontSize: 10, fontWeight: 800, flexShrink: 0,
        }}>
          <Database size={11} /> RAG {rag ? 'ON' : 'OFF'}
        </button>

        {/* Health refresh */}
        <button onClick={checkHealth} style={{
          width: 30, height: 30, borderRadius: 8, flexShrink: 0, cursor: 'pointer',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <RefreshCw size={12} color="rgba(255,255,255,0.38)" />
        </button>

        {/* Tools toggle */}
        <button onClick={() => setToolsOpen(v => !v)} style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, cursor: 'pointer', flexShrink: 0,
          background: toolsOpen ? 'rgba(232,65,66,0.16)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${toolsOpen ? 'rgba(232,65,66,0.38)' : 'rgba(255,255,255,0.09)'}`,
          color: toolsOpen ? '#e84142' : 'rgba(255,255,255,0.50)', fontSize: 11, fontWeight: 800,
        }}>
          <Wrench size={12} color={toolsOpen ? '#e84142' : 'rgba(255,255,255,0.42)'} /> Tools
        </button>
      </header>

      {/* ── BODY ──────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── CHAT ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {msgs.map((m, i) => {
              const isUser = m.role === 'user';
              return (
                <div key={i} style={{
                  display: 'flex', gap: 9,
                  flexDirection: isUser ? 'row-reverse' : 'row',
                  alignItems: 'flex-end',
                }}>
                  {/* Bot avatar */}
                  {!isUser && (
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginBottom: 2,
                      background: 'linear-gradient(135deg,#e84142,#7c1d1d)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Bot size={13} color="#fff" />
                    </div>
                  )}

                  <div style={{ maxWidth: '76%', display: 'flex', flexDirection: 'column', gap: 4, alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                    {/* Agent label */}
                    {!isUser && m.agent && (
                      <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(232,65,66,0.65)', letterSpacing: 0.5, textTransform: 'uppercase', marginLeft: 2 }}>
                        {m.agent}{m.sources ? ` · ${m.sources} sources` : ''}
                      </span>
                    )}

                    {/* Bubble */}
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: isUser ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                      background: isUser
                        ? 'linear-gradient(135deg,#e84142,#b91c1c)'
                        : 'rgba(20,20,26,0.95)',
                      border: isUser ? 'none' : '1px solid rgba(255,255,255,0.07)',
                      fontSize: 13.5, lineHeight: 1.65, color: '#f3f4f6',
                      boxShadow: isUser
                        ? '0 2px 14px rgba(232,65,66,0.22)'
                        : '0 2px 12px rgba(0,0,0,0.30)',
                      wordBreak: 'break-word',
                    }}
                      dangerouslySetInnerHTML={{ __html: fmt(m.text || (loading && i === msgs.length - 1 ? '…' : '')) }}
                    />

                    {m.proposal && <AgentProposalCard proposal={m.proposal} />}
                  </div>
                </div>
              );
            })}

            {/* Typing dots */}
            {loading && (
              <div style={{ display: 'flex', gap: 9, alignItems: 'flex-end' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#e84142,#7c1d1d)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Loader2 size={13} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
                <div style={{ padding: '10px 14px', borderRadius: '4px 16px 16px 16px', background: 'rgba(20,20,26,0.95)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 5, alignItems: 'center' }}>
                  {[0,1,2].map(n => (
                    <div key={n} style={{
                      width: 5, height: 5, borderRadius: '50%', background: '#e84142',
                      opacity: 0.5, animation: `pulse-gold ${0.8 + n*0.2}s ease-in-out infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Quick suggestion chips */}
          <div style={{
            padding: '0 14px 8px', display: 'flex', gap: 6,
            overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0,
          }}>
            {['What tokens does KAI have?', 'Best APY right now?', 'How do I swap tokens?', 'Explain impermanent loss'].map(q => (
              <button key={q} onClick={() => send(q)} style={{
                flexShrink: 0, padding: '5px 12px', borderRadius: 999, cursor: 'pointer',
                background: 'rgba(232,65,66,0.07)', border: '1px solid rgba(232,65,66,0.18)',
                color: 'rgba(248,248,250,0.55)', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(232,65,66,0.14)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(232,65,66,0.07)'; }}
              >{q}</button>
            ))}
          </div>

          {/* Input */}
          <div style={{
            padding: '8px 14px 12px', flexShrink: 0,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(8,8,10,0.98)',
            display: 'flex', gap: 8, alignItems: 'flex-end',
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 110) + 'px';
              }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask KAI anything… (Enter to send)"
              rows={1}
              style={{
                flex: 1, background: 'rgba(255,255,255,0.045)',
                border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12,
                padding: '10px 14px', color: '#f8f8fa', fontSize: 14,
                resize: 'none', outline: 'none', fontFamily: 'inherit',
                lineHeight: 1.5, minHeight: 42, maxHeight: 110,
                caretColor: '#e84142', transition: 'border-color 0.2s',
              }}
              onFocus={e  => (e.target.style.borderColor = 'rgba(232,65,66,0.48)')}
              onBlur={e   => (e.target.style.borderColor = 'rgba(255,255,255,0.09)')}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              style={{
                width: 42, height: 42, borderRadius: 12, flexShrink: 0, cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                background: input.trim() && !loading
                  ? 'linear-gradient(135deg,#e84142,#b91c1c)'
                  : 'rgba(255,255,255,0.04)',
                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: input.trim() && !loading ? '0 0 14px rgba(232,65,66,0.32)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              <Send size={16} color={input.trim() && !loading ? '#fff' : 'rgba(255,255,255,0.22)'} />
            </button>
          </div>
        </div>

        {/* ── TOOLS PANEL ─────────────────────────────── */}
        {toolsOpen && (
          <div style={{
            width: 272, flexShrink: 0, display: 'flex', flexDirection: 'column',
            background: 'rgba(12,12,16,0.99)', borderLeft: '1px solid rgba(232,65,66,0.14)',
            overflow: 'hidden',
          }}>
            {/* Panel header */}
            <div style={{
              padding: '11px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
              background: 'rgba(232,65,66,0.04)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Wrench size={13} color="#e84142" />
                <span style={{ fontSize: 13, fontWeight: 800, color: '#f8f8fa' }}>Agent Tools</span>
              </div>
              <button onClick={() => setToolsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.38)', display: 'flex' }}>
                <X size={15} />
              </button>
            </div>

            {/* Tool groups */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {TOOLS.map(group => {
                const open = activeGroup === group.group;
                const Icon = group.icon;
                return (
                  <div key={group.group}>
                    <button
                      onClick={() => setActiveGroup(open ? '' : group.group)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                        padding: '10px 14px', cursor: 'pointer', border: 'none',
                        background: open ? `${group.color}10` : 'transparent',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        color: open ? group.color : 'rgba(248,248,250,0.50)',
                        fontSize: 12, fontWeight: 700, textAlign: 'left', transition: 'all 0.15s',
                      }}>
                      <Icon size={14} color={open ? group.color : 'rgba(255,255,255,0.30)'} strokeWidth={1.8} />
                      <span style={{ flex: 1 }}>{group.group}</span>
                      <ChevronRight size={12} style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', opacity: 0.5 }} />
                    </button>

                    {open && (
                      <div style={{ background: 'rgba(0,0,0,0.22)', padding: '5px 10px 8px' }}>
                        {group.items.map(item => (
                          <button key={item.label} onClick={() => useTool(item.q)} style={{
                            width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 9, cursor: 'pointer',
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                            color: 'rgba(248,248,250,0.70)', fontSize: 11.5, marginBottom: 5,
                            display: 'flex', alignItems: 'center', gap: 7, lineHeight: 1.35,
                            transition: 'all 0.15s',
                          }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${group.color}13`; (e.currentTarget as HTMLButtonElement).style.color = '#f8f8fa'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(248,248,250,0.70)'; }}
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
        @keyframes pulse-gold { 0%,100%{opacity:.4;transform:scale(.85)} 50%{opacity:1;transform:scale(1.1)} }
      `}</style>
    </div>
  );
}
