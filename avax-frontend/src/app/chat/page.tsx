'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Bot, Send as SendIcon, Zap, BarChart2, TrendingUp, Shield,
  Volume2, VolumeX, ChevronLeft, Loader2, Database
} from 'lucide-react';
import Link from 'next/link';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000';

const WELCOME = `⚡ Hey! I'm **KAI AVAX Agent** — your Avalanche DeFi companion powered by a local **Qwen3:1.7b** model with RAG context from Nuvari docs.

Ask me about:
• Ecosystem tokens (NVR, yBOB, YTOKEN, YGOLD, GAMI, CENTS)
• Yield vaults and defensive commodity-backed vaults
• Smart insurance, pension, and trust contracts
• How to deploy on Avalanche C-Chain
• Nuvari business model & revenue`;

const QUICK_PROMPTS = [
  'What is the NVR token?',
  'Explain yBOB Stablecoin (yBOB)',
  'How do YToken and YGold work?',
  'Explain the x402 settlement layer',
  'AVAX Fuji testnet setup',
  'RAG context available?',
];

interface Msg { role: 'ai' | 'user'; text: string; agent?: string; isRag?: boolean; }

export default function AVAXChatPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'ai', text: WELCOME, agent: 'KAI AVAX Agent' }
  ]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [voiceOn, setVoiceOn]     = useState(false);
  const [ragEnabled, setRagEnabled] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const speak = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/`(.*?)`/g, '$1');
    const utt = new SpeechSynthesisUtterance(clean);
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find(v => v.lang.startsWith('en')) || voices[0];
    if (v) utt.voice = v;
    window.speechSynthesis.speak(utt);
  };

  const send = async (text?: string) => {
    const msg = text ?? input.trim();
    if (!msg || loading) return;
    setMessages(p => [...p, { role: 'user', text: msg }]);
    setInput('');
    setLoading(true);

    try {
      // 1️⃣ Try the Next.js API route (-> Ollama qwen3:1.7b)
      let res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, rag: ragEnabled }),
      });

      // 2️⃣ Fallback: RAG direct endpoint on Python backend
      if (!res.ok) {
        res = await fetch(`${BACKEND_URL}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg, rag: ragEnabled }),
        });
      }

      if (!res.ok) throw new Error('Both endpoints failed');

      const data = await res.json();
      const aiText = data.text || data.response || 'No response generated.';
      const newMsg: Msg = { role: 'ai', text: aiText, agent: data.agent || 'KAI AVAX Agent', isRag: data.rag_used };
      setMessages(p => [...p, newMsg]);
      if (voiceOn) speak(aiText);

    } catch {
      const errMsg = '⚠️ **Connection Error.** Make sure Ollama is running (`ollama run qwen3:1.7b`) or the Django backend is up.';
      setMessages(p => [...p, { role: 'ai', text: errMsg, agent: 'System' }]);
    } finally {
      setLoading(false);
    }
  };

  const renderText = (text: string) =>
    text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.*?)`/g, '<code style="background:rgba(232,65,66,0.15);padding:1px 5px;border-radius:4px;font-size:11px;">$1</code>')
      .replace(/\n/g, '<br/>');

  return (
    <main style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#0a0a0c' }}>

      {/* HEADER */}
      <div style={{ padding: '44px 16px 12px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, borderBottom: '1px solid rgba(232,65,66,0.12)', background: 'rgba(10,10,12,0.9)', backdropFilter: 'blur(16px)' }}>
        <Link href="/" style={{ color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center' }}>
          <ChevronLeft size={20} />
        </Link>
        <div className="float" style={{ position: 'relative' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#e84142,#7c1d1d)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(232,65,66,0.5)' }}>
            <Bot size={22} color="#fff" />
          </div>
          <div style={{ position: 'absolute', bottom: -2, right: -2, width: 12, height: 12, borderRadius: '50%', background: '#22c55e', border: '2px solid #0a0a0c' }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 15, fontWeight: 900, color: '#fff', margin: 0 }}>KAI AVAX Agent</p>
          <p style={{ fontSize: 10, color: '#e84142', margin: 0, fontWeight: 700 }}>
            ● Qwen3:1.7b · Avalanche C-Chain RAG
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {/* RAG toggle */}
          <button
            onClick={() => setRagEnabled(r => !r)}
            title={ragEnabled ? 'RAG On — using KAI docs context' : 'RAG Off — plain Ollama'}
            style={{ width: 32, height: 32, borderRadius: 8, background: ragEnabled ? 'rgba(232,65,66,0.18)' : 'rgba(255,255,255,0.06)', border: ragEnabled ? '1px solid rgba(232,65,66,0.45)' : '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Database size={14} color={ragEnabled ? '#e84142' : 'rgba(255,255,255,0.4)'} />
          </button>
          {/* Voice toggle */}
          <button
            onClick={() => setVoiceOn(v => !v)}
            style={{ width: 32, height: 32, borderRadius: 8, background: voiceOn ? 'rgba(232,65,66,0.18)' : 'rgba(255,255,255,0.06)', border: voiceOn ? '1px solid rgba(232,65,66,0.45)' : '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            {voiceOn ? <Volume2 size={14} color="#e84142" /> : <VolumeX size={14} color="rgba(255,255,255,0.4)" />}
          </button>
        </div>
      </div>

      {/* RAG badge */}
      {ragEnabled && (
        <div style={{ margin: '8px 16px 0', padding: '6px 12px', borderRadius: 8, background: 'rgba(232,65,66,0.06)', border: '1px solid rgba(232,65,66,0.18)', fontSize: 10, color: 'rgba(255,255,255,0.55)', display: 'flex', gap: 6, alignItems: 'center' }}>
          <Database size={11} color="#e84142" />
          <span>RAG active — KAI Chain docs indexed (<code style={{ color: '#e84142' }}>bizmodel.md</code> + wallet guides)</span>
        </div>
      )}

      {/* QUICK PROMPTS */}
      <div style={{ padding: '10px 16px 0', display: 'flex', gap: 6, overflowX: 'auto', flexShrink: 0, scrollbarWidth: 'none' }}>
        {QUICK_PROMPTS.map(p => (
          <button key={p} onClick={() => send(p)} style={{ flexShrink: 0, padding: '5px 12px', borderRadius: 20, background: 'rgba(232,65,66,0.08)', border: '1px solid rgba(232,65,66,0.22)', color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {p}
          </button>
        ))}
      </div>

      {/* MESSAGES */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: m.role === 'user' ? 'row-reverse' : 'row', gap: 10, alignItems: 'flex-end' }}>
            {m.role === 'ai' && (
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#e84142,#7c1d1d)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={16} color="#fff" />
              </div>
            )}
            <div style={{
              maxWidth: '80%',
              padding: '10px 14px',
              borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: m.role === 'user'
                ? 'linear-gradient(135deg,#e84142,#7c1d1d)'
                : 'rgba(26,26,32,0.9)',
              border: m.role === 'ai' ? '1px solid rgba(232,65,66,0.15)' : 'none',
              fontSize: 13,
              lineHeight: 1.6,
              color: '#fff',
            }}>
              {m.role === 'ai' && m.agent && (
                <p style={{ fontSize: 9, color: '#e84142', fontWeight: 700, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {m.isRag && <Database size={9} />} {m.agent}
                </p>
              )}
              <div dangerouslySetInnerHTML={{ __html: renderText(m.text) }} />
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#e84142,#7c1d1d)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Loader2 size={16} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
            <div style={{ padding: '10px 14px', borderRadius: '18px 18px 18px 4px', background: 'rgba(26,26,32,0.9)', border: '1px solid rgba(232,65,66,0.15)' }}>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {[0,1,2].map(j => (
                  <div key={j} style={{ width: 6, height: 6, borderRadius: '50%', background: '#e84142', animation: `pulse-gold ${0.8+j*0.2}s ease-in-out infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* INPUT BAR */}
      <div style={{ padding: '12px 16px', background: 'rgba(10,10,12,0.92)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(232,65,66,0.12)', display: 'flex', gap: 10, alignItems: 'center', paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Ask KAI about AVAX, ecosystem tokens, yield vaults…"
          rows={1}
          style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(232,65,66,0.2)', borderRadius: 14, padding: '10px 14px', color: '#fff', fontSize: 13, resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5, maxHeight: 100 }}
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || loading}
          style={{ width: 42, height: 42, borderRadius: '50%', background: input.trim() && !loading ? 'linear-gradient(135deg,#e84142,#7c1d1d)' : 'rgba(255,255,255,0.06)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', boxShadow: input.trim() && !loading ? '0 0 14px rgba(232,65,66,0.45)' : 'none', transition: 'all 0.2s', flexShrink: 0 }}
        >
          <SendIcon size={18} color={input.trim() && !loading ? '#fff' : 'rgba(255,255,255,0.3)'} />
        </button>
      </div>
    </main>
  );
}
