'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Bot, Send as SendIcon, Database, ChevronLeft, Loader2, Volume2, 
  VolumeX, RefreshCw, AlertCircle, CheckCircle2, HelpCircle, 
  Terminal, Shield, Coins, Activity, Wifi, WifiOff, FileText, Cpu, Server
} from 'lucide-react';
import Link from 'next/link';

import AgentProposalCard, { AgentProposal } from '@/components/AgentProposalCard';
import { ECOSYSTEM_TOKENS } from '@/lib/tokens';

interface Msg {
  role: 'ai' | 'user';
  text: string;
  agent?: string;
  isRag?: boolean;
  sourcesCount?: number;
  proposal?: AgentProposal;
}

interface ConnectionStatus {
  ragServer: 'online' | 'offline';
  ollamaServer: 'online' | 'offline';
  modelLoaded: boolean;
  modelName: string;
  details: string;
}

const GUIDED_CATEGORIES = [
  {
    id: 'agentic',
    name: '🤖 Agentic Actions',
    description: '1-Click On-Chain Transaction Proposals',
    questions: [
      'Propose depositing 10 yBOB into the Nuvari Yield Vault',
      'Draft a transfer of 5 yBOB to recipient address 0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      'Analyze portfolio health and propose rebalancing strategy'
    ]
  },
  {
    id: 'tokens',
    name: '🪙 Ecosystem Tokens',
    description: 'KAI, KES, NUV, KPEN, KTRUST — roles & mechanics',
    questions: [
      'What are the six tokens in the KAI ecosystem and their roles?',
      'How does the KAI governance token work and what are its use cases?',
      'What is the KES stablecoin and how is its value maintained?',
      'Explain the NUV Nuvari vault token and how yield is generated.'
    ]
  },
  {
    id: 'defi',
    name: '🏦 DeFi & Pension',
    description: 'Savings, trust funds & yield vaults',
    questions: [
      'What is the KAI Micro-Pension and how is it automated?',
      'How do KAI Trust Funds handle wealth transfer and inheritance?',
      'What yield strategies are available in the Nuvari vaults?',
      'How do pension lockup periods and compound interest work?'
    ]
  },
  {
    id: 'insurance',
    name: '🛡️ Micro-Insurance',
    description: 'Oracle-triggered crop & health insurance',
    questions: [
      'How does KAI Micro-Insurance use weather data for payouts?',
      'What types of agricultural crop and health insurance premiums are offered?',
      'How do smart contracts guarantee instant claim payouts?'
    ]
  },
  {
    id: 'tokenomics',
    name: '📊 Tokenomics & DAO',
    description: 'Governance, fee burns & revenue model',
    questions: [
      'How does the KAI token utility and burn mechanism work?',
      'Explain the KAI DAO governance and community voting process.',
      'What are the main revenue streams for the KAI Chain ecosystem?',
      'How are tokens distributed and what are the vesting schedules?'
    ]
  },
  {
    id: 'dev',
    name: '🏔️ Avalanche Dev',
    description: 'Fuji network, wallet & contract setups',
    questions: [
      'How do I set up my MetaMask/Core wallet for the Avalanche Fuji testnet?',
      'Where can I find the KAI contract addresses and verify transactions?',
      'How do I interact with the KAI ecosystem token contracts?',
      'How do developer smart contracts deploy on KAI Chain?'
    ]
  }
];

const WELCOME_MSG = `⚡ **Welcome to the KAI Agent Workspace!** I am your premium DeFi assistant, trained on the **KAI Nuvari Ecosystem** documentation.

I retrieve real-time context from the indexed guides for:
• **KAI, KES, NUV, KPEN, KTRUST** — ecosystem token mechanics & tokenomics
• **Nuvari vaults, micro-pensions & micro-insurance**
• **DAO governance** and fee-burn model
• **Avalanche Fuji Testnet** developer settings

*Use the explorer on the left to see questions I have been trained on, or ask me anything directly below!*`;

export default function DedicatedAIPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'ai', text: WELCOME_MSG, agent: 'KAI AVAX Agent', isRag: true, sourcesCount: 0 }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [ragEnabled, setRagEnabled] = useState(true);
  
  // Tab category selection
  const [activeCategory, setActiveCategory] = useState(GUIDED_CATEGORIES[0].id);

  // Connection Diagnostics
  const [connStatus, setConnStatus] = useState<ConnectionStatus>({
    ragServer: 'offline',
    ollamaServer: 'offline',
    modelLoaded: false,
    modelName: 'qwen3:1.7b',
    details: 'Not checked yet.'
  });
  const [checkingConn, setCheckingConn] = useState(false);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

  // Mobile layout sub-navigation ('chat' vs 'questions')
  const [mobileTab, setMobileTab] = useState<'chat' | 'questions'>('chat');

  const endRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check connections on mount
  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setCheckingConn(true);
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setConnStatus(data);
        // Automatically expand troubleshooting if something is offline
        if (data.ragServer === 'offline' || data.ollamaServer === 'offline' || !data.modelLoaded) {
          setShowTroubleshoot(true);
        } else {
          setShowTroubleshoot(false);
        }
      } else {
        setConnStatus(prev => ({
          ...prev,
          details: `Error response from health API: ${res.statusText}`
        }));
        setShowTroubleshoot(true);
      }
    } catch (e: any) {
      setConnStatus(prev => ({
        ...prev,
        details: `Failed to fetch health check: ${e.message}`
      }));
      setShowTroubleshoot(true);
    } finally {
      setCheckingConn(false);
    }
  };

  const speak = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/`(.*?)`/g, '$1');
    const utterance = new SpeechSynthesisUtterance(clean);
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith('en')) || voices[0];
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  };

  const sendMessage = async (textToSend?: string) => {
    const query = textToSend ?? input.trim();
    if (!query || loading) return;

    setMessages(prev => [...prev, { role: 'user', text: query }]);
    setInput('');
    setLoading(true);
    setMobileTab('chat');

    // Check if query is an Agentic Proposal Action request
    const lowerQ = query.toLowerCase();
    let attachedProposal: AgentProposal | undefined;

    if (lowerQ.includes('deposit 10 ybob') || lowerQ.includes('yield vault')) {
      const ybobToken = ECOSYSTEM_TOKENS.find(t => t.symbol === 'yBOB');
      attachedProposal = {
        agentName: 'Nuvari Vault Agent',
        actionType: 'APPROVE_STAKE',
        title: 'Yield Vault Deposit Strategy',
        description: 'Deposit 10 yBOB into the kvyBOB high-yield vault on Avalanche Fuji to start earning automated compound yield.',
        amount: '10',
        tokenSymbol: 'yBOB',
        tokenAddress: ybobToken?.address as `0x${string}`,
        targetContract: '0xd8d8E8e8B6e7F93a20E775B309D5c7A8c28135a5',
        projectedApy: '18.4% APY',
      };
    } else if (lowerQ.includes('transfer 5 ybob') || lowerQ.includes('draft a transfer')) {
      const ybobToken = ECOSYSTEM_TOKENS.find(t => t.symbol === 'yBOB');
      attachedProposal = {
        agentName: 'Tx Analyst Agent',
        actionType: 'TRANSFER',
        title: 'Direct Asset Transfer',
        description: 'Transfer 5 yBOB to 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 on Avalanche C-Chain Fuji testnet.',
        amount: '5',
        tokenSymbol: 'yBOB',
        tokenAddress: ybobToken?.address as `0x${string}`,
        recipientAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      };
    }

    // Add an empty AI message that we'll stream tokens into
    setMessages(prev => [...prev, {
      role: 'ai', text: '', agent: attachedProposal ? attachedProposal.agentName : 'KAI AVAX Agent', isRag: ragEnabled, sourcesCount: 0, proposal: attachedProposal
    }]);

    try {
      const response = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: query, rag: ragEnabled, stream: true }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`API error ${response.status}`);
      }

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let   buf     = '';
      let   fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const raw = line.slice(5).trim();
          if (!raw) continue;
          try {
            const evt = JSON.parse(raw);
            if (evt.token) {
              fullText += evt.token;
              // Stream the token into the last message in state
              setMessages(prev => {
                const copy = [...prev];
                const last = { ...copy[copy.length - 1] };
                last.text = fullText;
                copy[copy.length - 1] = last;
                return copy;
              });
            }
            if (evt.done) {
              setMessages(prev => {
                const copy = [...prev];
                const last = { ...copy[copy.length - 1] };
                last.sourcesCount = evt.sources ?? 0;
                copy[copy.length - 1] = last;
                return copy;
              });
            }
          } catch { /* ignore malformed JSON */ }
        }
      }

      if (voiceOn && fullText) speak(fullText);

    } catch (err: any) {
      setMessages(prev => {
        // Remove the empty placeholder and add an error message
        const withoutEmpty = prev.filter((_, i) => i < prev.length - 1);
        return [...withoutEmpty, {
          role: 'ai',
          text: `⚠️ **Connection Error.** Make sure the Python backend is running (\`python server.py\`) and Ollama is active (\`ollama run qwen3:1.7b\`).`,
          agent: 'System'
        }];
      });
    } finally {
      setLoading(false);
    }
  };


  const handleQuestionClick = (qText: string) => {
    setInput(qText);
    if (chatInputRef.current) {
      chatInputRef.current.focus();
    }
    // Switch to chat view on mobile
    setMobileTab('chat');
  };

  const renderFormattedText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.*?)`/g, '<code style="background:rgba(232,65,66,0.15);padding:2px 5px;border-radius:4px;font-size:12px;font-family:monospace;">$1</code>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#0a0a0c', color: '#fff', overflow: 'hidden' }}>
      
      {/* ── Top Bar / Header ── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px',
        background: 'rgba(10,10,12,0.95)', borderBottom: '1px solid rgba(232,65,66,0.15)',
        backdropFilter: 'blur(16px)', flexShrink: 0, zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', hover: { color: '#fff' } } as any}>
            <ChevronLeft size={22} />
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'linear-gradient(135deg, #e84142, #7c1d1d)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 14px rgba(232,65,66,0.45)'
            }}>
              <Bot size={20} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 900, margin: 0, letterSpacing: 0.5 }}>KAI Agent Workspace</h1>
              <p style={{ fontSize: 9, color: '#e84142', margin: 0, fontWeight: 700, letterSpacing: 1 }}>
                ● DEEP RAG DEFI COMPANION
              </p>
            </div>
          </div>
        </div>

        {/* Global Connection Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="hidden sm:flex">
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 10,
            background: connStatus.ragServer === 'online' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            border: connStatus.ragServer === 'online' ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(239,68,68,0.3)',
            color: connStatus.ragServer === 'online' ? '#4ade80' : '#f87171',
            padding: '4px 10px', borderRadius: 999
          }}>
            {connStatus.ragServer === 'online' ? <Wifi size={10} /> : <WifiOff size={10} />}
            <span>FastAPI: {connStatus.ragServer}</span>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 10,
            background: connStatus.ollamaServer === 'online' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            border: connStatus.ollamaServer === 'online' ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(239,68,68,0.3)',
            color: connStatus.ollamaServer === 'online' ? '#4ade80' : '#f87171',
            padding: '4px 10px', borderRadius: 999
          }}>
            <Cpu size={10} />
            <span>Ollama: {connStatus.ollamaServer}</span>
          </div>
        </div>

        {/* Action controls */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={checkHealth}
            disabled={checkingConn}
            title="Refresh Connection Diagnostics"
            style={{
              width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: checkingConn ? 'not-allowed' : 'pointer'
            }}
          >
            <RefreshCw size={14} color="#fff" style={{ animation: checkingConn ? 'spin 1s linear infinite' : 'none' }} />
          </button>

          <button
            onClick={() => setVoiceOn(!voiceOn)}
            title={voiceOn ? "Mute Voice Readout" : "Enable Voice Readout"}
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: voiceOn ? 'rgba(232,65,66,0.15)' : 'rgba(255,255,255,0.06)',
              border: voiceOn ? '1px solid rgba(232,65,66,0.4)' : '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
            }}
          >
            {voiceOn ? <Volume2 size={14} color="#e84142" /> : <VolumeX size={14} color="rgba(255,255,255,0.5)" />}
          </button>
        </div>
      </header>

      {/* ── Mobile Tab Bar Selector (only visible on mobile) ── */}
      <div style={{
        display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: '#0e0e12', flexShrink: 0
      }} className="flex sm:hidden">
        <button
          onClick={() => setMobileTab('chat')}
          style={{
            flex: 1, padding: '12px', fontSize: 12, fontWeight: 700,
            color: mobileTab === 'chat' ? '#e84142' : 'rgba(255,255,255,0.5)',
            borderBottom: mobileTab === 'chat' ? '2px solid #e84142' : 'none',
            background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer'
          }}
        >
          💬 Chat Agent
        </button>
        <button
          onClick={() => setMobileTab('questions')}
          style={{
            flex: 1, padding: '12px', fontSize: 12, fontWeight: 700,
            color: mobileTab === 'questions' ? '#e84142' : 'rgba(255,255,255,0.5)',
            borderBottom: mobileTab === 'questions' ? '2px solid #e84142' : 'none',
            background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer'
          }}
        >
          📂 Guided Context
        </button>
      </div>

      {/* ── Main Container Workspace ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Left Sidebar: Connections & Guided Questions (Hidden on mobile if not in 'questions' tab) ── */}
        <aside style={{
          width: 320, flexShrink: 0, background: 'rgba(16,16,20,0.97)',
          borderRight: '1px solid rgba(232,65,66,0.15)', overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: 16, padding: '16px'
        }} className={`${mobileTab === 'questions' ? 'flex' : 'hidden'} sm:flex`}>
          
          {/* Connection Diagnostics Panel */}
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, padding: '12px', display: 'flex', flexDirection: 'column', gap: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                ⚙️ Connections status
              </span>
              <button 
                onClick={() => setShowTroubleshoot(!showTroubleshoot)}
                style={{ fontSize: 9, color: '#e84142', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              >
                {showTroubleshoot ? 'Hide Help' : 'Help'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* RAG FastAPI */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.7)' }}>
                  <Server size={12} color="#e84142" /> FastAPI RAG
                </span>
                <span style={{
                  fontWeight: 700, 
                  color: connStatus.ragServer === 'online' ? '#22c55e' : '#ef4444'
                }}>
                  {connStatus.ragServer.toUpperCase()}
                </span>
              </div>

              {/* Ollama API */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.7)' }}>
                  <Cpu size={12} color="#7c3aed" /> Ollama Local
                </span>
                <span style={{
                  fontWeight: 700, 
                  color: connStatus.ollamaServer === 'online' ? '#22c55e' : '#ef4444'
                }}>
                  {connStatus.ollamaServer.toUpperCase()}
                </span>
              </div>

              {/* Model */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.7)' }}>
                  <Bot size={12} color="#3b82f6" /> LLM Model
                </span>
                <span style={{
                  fontWeight: 700,
                  color: connStatus.modelLoaded ? '#22c55e' : 'rgba(255,255,255,0.4)',
                  fontSize: 11
                }}>
                  {connStatus.modelName} {connStatus.modelLoaded ? '(Ready)' : '(Not Found)'}
                </span>
              </div>
            </div>

            {/* Troubleshooting expandable box */}
            {showTroubleshoot && (
              <div style={{
                background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 8, padding: '10px', fontSize: 11, color: 'rgba(255,255,255,0.85)'
              }}>
                <p style={{ margin: '0 0 6px 0', fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertCircle size={12} /> Connection Diagnostics:
                </p>
                <div style={{ fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 10 }}>
                  <div>
                    <span style={{ color: '#e84142' }}>1. FastAPI RAG Backend (Port 8000)</span>
                    <p style={{ margin: '2px 0 0 0', color: 'rgba(255,255,255,0.5)' }}>
                      In terminal, navigate to <code style={{ color: '#fff' }}>ai-agent/</code> and run:
                      <br />
                      <code style={{ background: '#000', padding: '1px 4px', borderRadius: 3, display: 'inline-block', marginTop: 3 }}>python server.py</code>
                    </p>
                  </div>
                  <div>
                    <span style={{ color: '#7c3aed' }}>2. Ollama Local Engine (Port 11434)</span>
                    <p style={{ margin: '2px 0 0 0', color: 'rgba(255,255,255,0.5)' }}>
                      Verify Ollama is installed and run:
                      <br />
                      <code style={{ background: '#000', padding: '1px 4px', borderRadius: 3, display: 'inline-block', marginTop: 3 }}>ollama run {connStatus.modelName}</code>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Guided RAG Questions explorer */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1.5 }}>
              🎓 Guided RAG Context
            </span>
            
            {/* Category Pills */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {GUIDED_CATEGORIES.map(cat => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    style={{
                      textAlign: 'left', padding: '10px 12px', borderRadius: 10,
                      background: isActive ? 'rgba(232,65,66,0.12)' : 'rgba(255,255,255,0.02)',
                      border: isActive ? '1px solid rgba(232,65,66,0.3)' : '1px solid rgba(255,255,255,0.06)',
                      color: isActive ? '#e84142' : 'rgba(255,255,255,0.7)',
                      fontSize: 12, fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer', transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span>{cat.name}</span>
                      <span style={{ fontSize: 9, color: isActive ? 'rgba(232,65,66,0.7)' : 'rgba(255,255,255,0.3)', marginTop: 2, fontWeight: 400 }}>
                        {cat.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Questions under active category */}
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column', gap: 8, 
              padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.01)',
              border: '1px dashed rgba(255,255,255,0.08)'
            }}>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
                Trained Questions:
              </span>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', maxHeight: 260 }}>
                {GUIDED_CATEGORIES.find(c => c.id === activeCategory)?.questions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuestionClick(q)}
                    style={{
                      textAlign: 'left', padding: '8px 10px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                      color: 'rgba(255,255,255,0.85)', fontSize: 11, lineHeight: 1.4,
                      cursor: 'pointer', hover: { background: 'rgba(232,65,66,0.08)', color: '#fff' }
                    } as any}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* ── Right Panel: RAG Chat Interface (Hidden on mobile if not in 'chat' tab) ── */}
        <section style={{
          flex: 1, display: 'flex', flexDirection: 'column', background: '#08080a', overflow: 'hidden'
        }} className={`${mobileTab === 'chat' ? 'flex' : 'hidden'} sm:flex`}>
          
          {/* Header Status (Mobile Only) */}
          <div style={{
            padding: '8px 16px', background: 'rgba(232,65,66,0.04)', 
            borderBottom: '1px solid rgba(232,65,66,0.1)', display: 'flex', 
            justifyContent: 'space-between', alignItems: 'center', fontSize: 10
          }} className="flex sm:hidden">
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>
              RAG API: 
              <span style={{ marginLeft: 4, fontWeight: 700, color: connStatus.ragServer === 'online' ? '#22c55e' : '#ef4444' }}>
                {connStatus.ragServer.toUpperCase()}
              </span>
            </span>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>
              Model: 
              <span style={{ marginLeft: 4, fontWeight: 700, color: connStatus.modelLoaded ? '#4ade80' : 'rgba(255,255,255,0.4)' }}>
                {connStatus.modelName}
              </span>
            </span>
          </div>

          {/* RAG settings status ribbon */}
          <div style={{
            padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(232,65,66,0.03)', borderBottom: '1px solid rgba(232,65,66,0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
              <Database size={13} color={ragEnabled ? "#e84142" : "rgba(255,255,255,0.3)"} />
              <span>
                {ragEnabled ? 'Knowledge base active (FastAPI retriever active)' : 'Plain LLM active (No context retrieved)'}
              </span>
            </div>
            
            <button
              onClick={() => setRagEnabled(!ragEnabled)}
              style={{
                fontSize: 10, fontWeight: 700, color: '#e84142', background: 'rgba(232,65,66,0.08)',
                border: '1px solid rgba(232,65,66,0.3)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer'
              }}
            >
              {ragEnabled ? 'Disable RAG' : 'Enable RAG'}
            </button>
          </div>

          {/* Messages scroll section */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {messages.map((m, idx) => {
              const isUser = m.role === 'user';
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row', gap: 12, alignItems: 'flex-start' }}>
                  {/* Bot Avatar */}
                  {!isUser && (
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #e84142, #7c1d1d)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <Bot size={16} color="#fff" />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div style={{
                    maxWidth: '85%',
                    padding: '12px 16px',
                    borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: isUser ? 'linear-gradient(135deg, #e84142, #7c1d1d)' : 'rgba(22,22,26,0.85)',
                    border: isUser ? 'none' : '1px solid rgba(232,65,66,0.12)',
                    boxShadow: isUser ? '0 4px 12px rgba(232,65,66,0.2)' : 'none'
                  }}>
                    {/* Bot metadata header */}
                    {!isUser && m.agent && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 10, fontWeight: 700, color: '#e84142' }}>
                        {m.isRag && <Database size={10} />}
                        <span>{m.agent}</span>
                        {m.sourcesCount !== undefined && m.sourcesCount > 0 && (
                          <span style={{ background: 'rgba(232,65,66,0.12)', padding: '1px 6px', borderRadius: 4, fontSize: 8 }}>
                            Context: {m.sourcesCount} chunks
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Text block */}
                    <div 
                      style={{ fontSize: 13, lineHeight: 1.6, color: '#fff' }}
                      dangerouslySetInnerHTML={{ __html: renderFormattedText(m.text) }}
                    />

                    {/* Render Agentic Proposal Card if present */}
                    {m.proposal && (
                      <AgentProposalCard proposal={m.proposal} />
                    )}
                  </div>
                </div>
              );
            })}

            {/* Pulsing load state */}
            {loading && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #e84142, #7c1d1d)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Loader2 size={16} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
                <div style={{
                  padding: '12px 16px', borderRadius: '16px 16px 16px 4px',
                  background: 'rgba(22,22,26,0.85)', border: '1px solid rgba(232,65,66,0.12)',
                  display: 'flex', alignItems: 'center', gap: 6
                }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>KAI is thinking</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[0, 1, 2].map(n => (
                      <div 
                        key={n} 
                        style={{ 
                          width: 4, height: 4, borderRadius: '50%', background: '#e84142', 
                          animation: `pulse-gold ${0.8 + n * 0.2}s ease-in-out infinite` 
                        }} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* Interactive Quick-Pills for RAG selection inside the chat */}
          <div style={{
            padding: '10px 16px 0 16px', display: 'flex', gap: 8, overflowX: 'auto',
            scrollbarWidth: 'none', flexShrink: 0
          }}>
            {GUIDED_CATEGORIES.find(c => c.id === activeCategory)?.questions.slice(0, 2).map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                style={{
                  flexShrink: 0, padding: '6px 12px', borderRadius: 20,
                  background: 'rgba(232,65,66,0.06)', border: '1px solid rgba(232,65,66,0.2)',
                  color: 'rgba(255,255,255,0.7)', fontSize: 10, cursor: 'pointer', whiteSpace: 'nowrap'
                }}
              >
                ⚡ Ask: "{q.slice(0, 30)}..."
              </button>
            ))}
          </div>

          {/* Chat input box */}
          <div style={{
            padding: '16px', background: 'rgba(10,10,12,0.95)', borderTop: '1px solid rgba(232,65,66,0.12)',
            display: 'flex', gap: 10, alignItems: 'center', paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
            flexShrink: 0
          }}>
            <textarea
              ref={chatInputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={
                ragEnabled 
                  ? "Ask KAI about ecosystem tokens, vaults, DAO governance..." 
                  : "Ask KAI (Plain Model Mode)..."
              }
              rows={1}
              style={{
                flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(232,65,66,0.2)',
                borderRadius: 12, padding: '12px', color: '#fff', fontSize: 13, resize: 'none',
                outline: 'none', fontFamily: 'inherit', lineHeight: 1.5, maxHeight: 100
              }}
            />
            
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              style={{
                width: 42, height: 42, borderRadius: '50%',
                background: input.trim() && !loading ? 'linear-gradient(135deg, #e84142, #7c1d1d)' : 'rgba(255,255,255,0.04)',
                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                boxShadow: input.trim() && !loading ? '0 0 12px rgba(232,65,66,0.45)' : 'none',
                transition: 'all 0.2s', flexShrink: 0
              }}
            >
              <SendIcon size={16} color={input.trim() && !loading ? '#fff' : 'rgba(255,255,255,0.3)'} />
            </button>
          </div>

        </section>

      </div>
    </div>
  );
}
