'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, Send, ExternalLink, Globe2 } from 'lucide-react';
import ConservationShell from '@/components/conservation/ConservationShell';
import { HUB_THEME, labelStyle, MONO, SERIF, SANS } from '@/lib/hub-theme';
import type { AskKaiResult } from '@/lib/conservation-data';

interface Message {
  role: 'user' | 'kai';
  text: string;
  results?: AskKaiResult[];
  grounded?: boolean;
}

const SUGGESTIONS = [
  'What tree should I plant?',
  'Explain Jaza Miti',
  'How do I harden nursery seedlings?',
  'What is conservation finance?',
];

export default function AskPage() {
  const [q, setQ] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = async (query: string) => {
    const clean = query.trim();
    if (!clean || busy) return;
    setQ('');
    setError(null);
    setMessages(m => [...m, { role: 'user', text: clean }]);
    setBusy(true);
    try {
      const r = await fetch('/api/conservation/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: clean }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Ask KAI failed.');
      setMessages(m => [...m, { role: 'kai', text: d.answer, results: d.results, grounded: d.grounded }]);
    } catch (e) {
      setError(e instanceof Error ? e.message.slice(0, 200) : 'Ask KAI failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ConservationShell>
      <section style={{ padding: '40px 0 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: HUB_THEME.gold, color: HUB_THEME.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={17} />
          </div>
          <h1 style={{ ...SERIF, fontSize: 32, fontWeight: 600, margin: 0 }}>Ask KAI</h1>
        </div>
        <p style={{ ...SANS, fontSize: 15, color: HUB_THEME.inkLight, lineHeight: 1.7, maxWidth: 660, margin: '0 0 22px' }}>
          Natural-language questions about planting, nurseries, species and methodologies — answered from the
          curation hub&apos;s own content, with sources, so you can verify. Unsupported questions trigger the
          external-search fallback rather than invention.
        </p>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', borderBottom: `1px solid ${HUB_THEME.gold}`, padding: '6px 2px', maxWidth: 640 }}>
          <Sparkles size={16} color={HUB_THEME.goldLight} />
          <input value={q} onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && ask(q)}
            placeholder="Ask about trees, nurseries, Jaza Miti, GTCI, finance…"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: HUB_THEME.paper, fontSize: 15, fontFamily: 'inherit', padding: '10px 0' }} />
          <motion.button whileTap={{ scale: 0.94 }} onClick={() => ask(q)} disabled={busy}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 8, border: 'none', cursor: busy ? 'default' : 'pointer', background: HUB_THEME.gold, color: HUB_THEME.ink, fontWeight: 700, fontFamily: 'inherit', fontSize: 14 }}>
            <Send size={14} /> {busy ? 'Thinking…' : 'Ask'}
          </motion.button>
        </div>

        {messages.length === 0 && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
            {SUGGESTIONS.map(s => (
              <motion.button key={s} whileTap={{ scale: 0.96 }} onClick={() => ask(s)}
                style={{ ...MONO, fontSize: 11, letterSpacing: 0.6, padding: '9px 16px', borderRadius: 999, border: `1px solid ${HUB_THEME.hairline}`, background: 'transparent', color: HUB_THEME.inkLight, cursor: 'pointer' }}>
                {s}
              </motion.button>
            ))}
          </div>
        )}
      </section>

      {error && <p style={{ fontSize: 13, color: HUB_THEME.clay, margin: '14px 0 0' }}>{error}</p>}

      <section style={{ padding: '16px 0 40px', maxWidth: 760 }}>
        {messages.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            {m.role === 'user' ? (
              <div style={{ padding: '16px 2px', borderTop: `1px solid ${HUB_THEME.hairline}` }}>
                <p style={{ ...MONO, fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase', color: HUB_THEME.inkLight, margin: '0 0 6px' }}>You</p>
                <p style={{ fontSize: 15, color: HUB_THEME.paper, lineHeight: 1.6, margin: 0 }}>{m.text}</p>
              </div>
            ) : (
              <div style={{ padding: '18px 2px 26px', borderTop: `1px solid ${HUB_THEME.hairline}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Sparkles size={13} color={HUB_THEME.goldLight} />
                  <span style={{ ...MONO, fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase', color: HUB_THEME.goldLight }}>Ask KAI</span>
                  {m.grounded && (
                    <span style={{ ...MONO, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: HUB_THEME.pineLight }}>Grounded in hub content</span>
                  )}
                </div>
                <p style={{ ...SANS, fontSize: 15, color: 'rgba(246,242,231,0.88)', lineHeight: 1.75, margin: '0 0 14px' }}>{m.text}</p>

                {m.results && m.results.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <p style={labelStyle()}>Sources</p>
                    {m.results.map((r, j) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', border: `1px solid ${HUB_THEME.hairline}`, borderRadius: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <b style={{ fontSize: 13, color: HUB_THEME.paper }}>{r.title}</b>
                            <span style={{ ...MONO, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: HUB_THEME.goldLight }}>{r.kind} · {Math.round(r.score * 100)}%</span>
                          </div>
                          <p style={{ fontSize: 12, color: HUB_THEME.inkLight, lineHeight: 1.5, margin: '4px 0 0' }}>{r.summary} · {r.source}</p>
                        </div>
                        {r.slug && (
                          <Link href={r.kind === 'methodology' ? `/conservation/methodologies/${r.slug}` : `/conservation/knowledge?cat=All`}
                            style={{ ...MONO, fontSize: 10, color: HUB_THEME.goldLight, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                            Open <ExternalLink size={11} />
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ))}

        {messages.length > 0 && (
          <p style={{ ...MONO, fontSize: 10, color: HUB_THEME.inkLight, display: 'flex', alignItems: 'center', gap: 6, margin: '10px 0 0' }}>
            <Globe2 size={12} /> Answered from indexed hub content with sources; external search is the fallback when the hub has no answer.
          </p>
        )}
      </section>
    </ConservationShell>
  );
}