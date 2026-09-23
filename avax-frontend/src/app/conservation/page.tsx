import Link from 'next/link';
import { Search, ArrowRight, BookOpen, Leaf, Globe2, FileText, ShieldCheck, Users, ExternalLink } from 'lucide-react';
import ConservationShell from '@/components/conservation/ConservationShell';
import { METHODOLOGIES, KNOWLEDGE, RESOURCES } from '@/lib/conservation-data';
import { HUB_THEME, labelStyle, MONO, SERIF, SANS } from '@/lib/hub-theme';

export const dynamic = 'force-dynamic';

export default function ConservationHome() {
  const featured = METHODOLOGIES.filter(m => m.featured);
  const knowledge = KNOWLEDGE.slice(0, 4);
  const resources = RESOURCES.slice(0, 4);

  return (
    <ConservationShell>
      {/* Hero + Ask */}
      <section style={{ padding: '56px 0 30px' }}>
        <p style={labelStyle()}>Learn · Explore · Ask · Connect</p>
        <h1 style={{ ...SERIF, fontSize: 44, fontWeight: 600, lineHeight: 1.12, margin: '16px 0 16px', maxWidth: 720 }}>
          Conservation knowledge, verified and connected.
        </h1>
        <p style={{ ...SANS, fontSize: 16, color: HUB_THEME.inkLight, lineHeight: 1.7, maxWidth: 620, margin: '0 0 28px' }}>
          A central information layer for Community Forest Associations and everyone who cares about conservation in Kenya —
          methodologies, knowledge, resources, and a link to the people doing the work.
        </p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', borderBottom: `1px solid ${HUB_THEME.gold}`, maxWidth: 560, padding: '6px 2px' }}>
          <Search size={17} color={HUB_THEME.goldLight} />
          <input placeholder="Ask KAI: what tree should I plant? What is Jaza Miti?" readOnly
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: HUB_THEME.paper, fontSize: 15, fontFamily: 'inherit', padding: '8px 0' }} />
          <Link href="/conservation/ask" style={{ ...MONO, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: HUB_THEME.goldLight, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Ask KAI →
          </Link>
        </div>
      </section>

      {/* Featured methodologies */}
      <section style={{ borderTop: `1px solid ${HUB_THEME.hairline}`, padding: '40px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <p style={labelStyle()}>Featured methodologies</p>
          <Link href="/conservation/methodologies" style={{ ...MONO, fontSize: 11, color: HUB_THEME.goldLight, textDecoration: 'none' }}>All methodologies →</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18 }}>
          {featured.map((m, i) => (
            <Link key={m.slug} href={`/conservation/methodologies/${m.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{
                padding: '26px 26px 22px', height: '100%', boxSizing: 'border-box',
                background: i % 2 === 0 ? `linear-gradient(135deg, ${HUB_THEME.pine} 0%, ${HUB_THEME.bgSoft} 100%)` : HUB_THEME.card,
                borderRadius: 14, transition: 'transform 0.18s',
              }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-3px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Leaf size={16} color={HUB_THEME.goldLight} />
                  <span style={{ ...MONO, fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase', color: HUB_THEME.goldLight }}>Methodology</span>
                </div>
                <h3 style={{ ...SERIF, fontSize: 24, fontWeight: 600, margin: 0, color: HUB_THEME.paper }}>{m.name}</h3>
                <p style={{ fontSize: 14, color: 'rgba(246,242,231,0.72)', lineHeight: 1.6, margin: '10px 0 18px' }}>{m.shortDescription}</p>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: HUB_THEME.gold }}>
                  Explore methodology <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Explore conservation knowledge */}
      <section style={{ borderTop: `1px solid ${HUB_THEME.hairline}`, padding: '40px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BookOpen size={17} color={HUB_THEME.goldLight} />
            <p style={{ ...labelStyle(), margin: 0 }}>Explore conservation</p>
          </div>
          <Link href="/conservation/knowledge" style={{ ...MONO, fontSize: 11, color: HUB_THEME.goldLight, textDecoration: 'none' }}>All knowledge →</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {knowledge.map(k => (
            <Link key={k.slug} href={`/conservation/knowledge?cat=${encodeURIComponent(k.category)}`} style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{ padding: '20px 22px', borderTop: `1px solid ${HUB_THEME.hairline}`, borderBottom: `1px solid ${HUB_THEME.hairline}` }}>
                <span style={{ ...MONO, fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', color: HUB_THEME.goldLight }}>{k.category}</span>
                <h3 style={{ ...SERIF, fontSize: 18, fontWeight: 600, color: HUB_THEME.paper, margin: '8px 0 6px', lineHeight: 1.3 }}>{k.title}</h3>
                <p style={{ fontSize: 13, color: HUB_THEME.inkLight, lineHeight: 1.6, margin: 0 }}>{k.summary}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured resources */}
      <section style={{ borderTop: `1px solid ${HUB_THEME.hairline}`, padding: '40px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={17} color={HUB_THEME.goldLight} />
            <p style={{ ...labelStyle(), margin: 0 }}>Featured resources</p>
          </div>
          <Link href="/conservation/resources" style={{ ...MONO, fontSize: 11, color: HUB_THEME.goldLight, textDecoration: 'none' }}>All resources →</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {resources.map(r => (
            <div key={r.id} style={{ padding: '18px 20px', border: `1px solid ${HUB_THEME.hairline}`, borderRadius: 12, background: 'rgba(255,255,255,0.02)' }}>
              <p style={{ ...MONO, fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', color: HUB_THEME.goldLight, margin: '0 0 8px' }}>{r.kind} · {r.sourceType === 'KAI_CREATED' ? 'KAI' : r.sourceName}</p>
              <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: HUB_THEME.paper }}>{r.title}</h4>
              <p style={{ fontSize: 13, color: HUB_THEME.inkLight, lineHeight: 1.5, margin: '8px 0 0' }}>{r.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Connect with conservation */}
      <section style={{ borderTop: `1px solid ${HUB_THEME.hairline}`, padding: '40px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <Globe2 size={17} color={HUB_THEME.goldLight} />
          <p style={{ ...labelStyle(), margin: 0 }}>Connect with conservation</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {[
            { icon: <Users size={18} />, t: 'CFA dashboards', d: 'Operational data stays in each CFA\'s own dashboard. The hub links to them with permission — never reaching in automatically.', href: '/cfa' },
            { icon: <ShieldCheck size={18} />, t: 'Verified records', d: 'Activity → structured record → evidence → human verification → verifiable conservation record.', href: '/conservation/methodologies' },
            { icon: <ExternalLink size={18} />, t: 'Read the stories', d: 'Conservation stories reach the general audience through SIHU — articles, journals and podcasts.', href: '/hub' },
          ].map(c => (
            <Link key={c.t} href={c.href} style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{ padding: '22px 24px', background: HUB_THEME.card, borderRadius: 12, height: '100%', boxSizing: 'border-box' }}>
                <div style={{ color: HUB_THEME.goldLight, marginBottom: 12 }}>{c.icon}</div>
                <h4 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: HUB_THEME.paper }}>{c.t}</h4>
                <p style={{ fontSize: 13, color: HUB_THEME.inkLight, lineHeight: 1.6, margin: '8px 0 0' }}>{c.d}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </ConservationShell>
  );
}