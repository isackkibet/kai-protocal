import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, ExternalLink } from 'lucide-react';
import ConservationShell from '@/components/conservation/ConservationShell';
import { RESOURCES, METHODOLOGIES } from '@/lib/conservation-data';
import { HUB_THEME, MONO, SERIF, SANS } from '@/lib/hub-theme';

export const metadata: Metadata = {
  title: 'Resources — KAI Nuvari Conservation Hub',
  description: 'Guides, manuals, research papers and training materials for community conservation, with source attribution.',
};

export default function ResourcesPage() {
  const methodById = Object.fromEntries(METHODOLOGIES.map(m => [m.slug, m.name]));

  return (
    <ConservationShell>
      <section style={{ padding: '40px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: HUB_THEME.gold, color: HUB_THEME.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={17} />
          </div>
          <h1 style={{ ...SERIF, fontSize: 32, fontWeight: 600, margin: 0 }}>Resource library</h1>
        </div>
        <p style={{ ...SANS, fontSize: 15, color: HUB_THEME.inkLight, lineHeight: 1.7, maxWidth: 640, margin: 0 }}>
          Guides, manuals, papers and training materials — each tagged with its source, and clearly marked whether it is
          KAI Nuvari-created or externally sourced, with attribution and links preserved.
        </p>
      </section>

      <section>
        {RESOURCES.map((r, i) => (
          <div key={r.id} style={{ borderTop: `1px solid ${HUB_THEME.hairline}`, borderBottom: i === RESOURCES.length - 1 ? `1px solid ${HUB_THEME.hairline}` : 'none', padding: '24px 4px' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                  <span style={{ ...MONO, fontSize: 9, letterSpacing: 1.3, textTransform: 'uppercase', color: HUB_THEME.goldLight }}>{r.kind}</span>
                  <span style={{ ...MONO, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: r.sourceType === 'KAI_CREATED' ? HUB_THEME.pineLight : HUB_THEME.inkLight }}>
                    {r.sourceType === 'KAI_CREATED' ? 'KAI Nuvari' : 'External'}
                  </span>
                  {r.methodologySlug && (
                    <Link href={`/conservation/methodologies/${r.methodologySlug}`} style={{ ...MONO, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: HUB_THEME.gold, textDecoration: 'none' }}>
                      {methodById[r.methodologySlug]} →
                    </Link>
                  )}
                </div>
                <h2 style={{ ...SERIF, fontSize: 21, fontWeight: 600, color: HUB_THEME.paper, margin: '0 0 6px' }}>{r.title}</h2>
                <p style={{ fontSize: 14, color: HUB_THEME.inkLight, lineHeight: 1.6, margin: 0 }}>{r.description}</p>
                <p style={{ ...MONO, fontSize: 10, color: HUB_THEME.inkLight, margin: '10px 0 0' }}>Source: {r.sourceName} · Attribution preserved</p>
              </div>
              <a href={r.url} target="_blank" rel="noreferrer" style={{ ...MONO, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: HUB_THEME.goldLight, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginTop: 4 }}>
                Open <ExternalLink size={12} />
              </a>
            </div>
          </div>
        ))}
      </section>
    </ConservationShell>
  );
}