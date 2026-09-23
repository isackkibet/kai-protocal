'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Search } from 'lucide-react';
import ConservationShell from '@/components/conservation/ConservationShell';
import { KNOWLEDGE, KNOWLEDGE_CATEGORIES } from '@/lib/conservation-data';
import { HUB_THEME, labelStyle, MONO, SERIF, SANS } from '@/lib/hub-theme';

export default function KnowledgePage() {
  const [cat, setCat] = useState<string>('All');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const term = q.trim().toLowerCase();
  const filtered = KNOWLEDGE.filter(k => {
    const matchCat = cat === 'All' || k.category === cat;
    const matchQ = !term ||
      k.title.toLowerCase().includes(term) ||
      k.summary.toLowerCase().includes(term) ||
      k.body.toLowerCase().includes(term);
    return matchCat && matchQ;
  });

  return (
    <ConservationShell>
      <section style={{ padding: '40px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: HUB_THEME.gold, color: HUB_THEME.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={17} />
          </div>
          <h1 style={{ ...SERIF, fontSize: 32, fontWeight: 600, margin: 0 }}>Conservation knowledge</h1>
        </div>
        <p style={{ ...SANS, fontSize: 15, color: HUB_THEME.inkLight, lineHeight: 1.7, maxWidth: 640, margin: '0 0 22px' }}>
          Basics, species, nursery practice, restoration and finance — written in accessible language, tied to the
          methodology pages above.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: `1px solid ${HUB_THEME.gold}`, maxWidth: 460, padding: '6px 2px', marginBottom: 18 }}>
          <Search size={16} color={HUB_THEME.goldLight} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search knowledge…"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: HUB_THEME.paper, fontSize: 15, fontFamily: 'inherit', padding: '8px 0' }} />
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {['All', ...KNOWLEDGE_CATEGORIES].map(c => (
            <motion.button key={c} whileTap={{ scale: 0.95 }} onClick={() => setCat(c)}
              style={{ ...MONO, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', padding: '8px 14px', borderRadius: 999,
                border: `1px solid ${cat === c ? HUB_THEME.gold : HUB_THEME.hairline}`,
                background: cat === c ? HUB_THEME.gold : 'transparent',
                color: cat === c ? HUB_THEME.ink : HUB_THEME.inkLight, cursor: 'pointer', fontWeight: 600 }}>
              {c}
            </motion.button>
          ))}
        </div>
      </section>

      <section style={{ padding: '20px 0 40px' }}>
        <p style={{ ...labelStyle(), marginBottom: 10 }}>{filtered.length} article{filtered.length === 1 ? '' : 's'}</p>
        {filtered.length === 0 && (
          <p style={{ fontSize: 14, color: HUB_THEME.inkLight, padding: '40px 0' }}>No articles match. Try a different category or search term.</p>
        )}
        {filtered.map((k, i) => {
          const expanded = open === k.slug;
          const hasBodyOpen = expanded;
          return (
            <motion.article key={k.slug} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              style={{ borderTop: `1px solid ${HUB_THEME.hairline}`, padding: '24px 2px' }}>
              <button onClick={() => setOpen(expanded ? null : k.slug)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', color: 'inherit', fontFamily: 'inherit' }}>
                <span style={{ ...MONO, fontSize: 9, letterSpacing: 1.3, textTransform: 'uppercase', color: HUB_THEME.goldLight }}>{k.category}</span>
                <h2 style={{ ...SERIF, fontSize: 24, fontWeight: 600, color: HUB_THEME.paper, margin: '8px 0 8px' }}>{k.title}</h2>
                <p style={{ fontSize: 14, color: HUB_THEME.inkLight, lineHeight: 1.6, margin: 0 }}>{k.summary}</p>
              </button>
              <AnimatePresence>
                {hasBodyOpen && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                    <p style={{ ...SANS, fontSize: 15, color: 'rgba(246,242,231,0.85)', lineHeight: 1.8, margin: '14px 0 0', whiteSpace: 'pre-line' }}>{k.body}</p>
                    <p style={{ ...MONO, fontSize: 10, color: HUB_THEME.inkLight, margin: '14px 0 0' }}>Source: {k.sourceAttribution}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.article>
          );
        })}
      </section>
    </ConservationShell>
  );
}