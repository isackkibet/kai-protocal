import type { Metadata } from 'next';
import Link from 'next/link';
import { Leaf, ArrowRight, Layers } from 'lucide-react';
import ConservationShell from '@/components/conservation/ConservationShell';
import { METHODOLOGIES } from '@/lib/conservation-data';
import { HUB_THEME, labelStyle, MONO, SERIF } from '@/lib/hub-theme';

export const metadata: Metadata = {
  title: 'Methodologies — KAI Nuvari Conservation Hub',
  description: 'Structured conservation methodologies including Jaza Miti and the Green Tree Commodities Initiative (GTCI).',
};

export default function MethodologiesIndex() {
  return (
    <ConservationShell>
      <section style={{ padding: '40px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: HUB_THEME.gold, color: HUB_THEME.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layers size={16} />
          </div>
          <h1 style={{ ...SERIF, fontSize: 32, fontWeight: 600, margin: 0 }}>Conservation methodologies</h1>
        </div>
        <p style={{ ...MONO, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: HUB_THEME.inkLight, margin: 0 }}>
          Structured, modular pages · new methodologies can be added without rebuilding the platform
        </p>
        <p style={{ fontSize: 15, color: HUB_THEME.inkLight, lineHeight: 1.7, maxWidth: 660, margin: '20px 0 0' }}>
          Each methodology is described the same way — purpose, the problem it addresses, how it works, required data,
          participants, expected outcomes, conservation benefits, and verification requirements — so you can compare them
          and see exactly what joining would require.
        </p>
      </section>

      <section>
        {METHODOLOGIES.map((m, i) => (
          <Link key={m.slug} href={`/conservation/methodologies/${m.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{
              padding: '30px 6px', borderTop: `1px solid ${HUB_THEME.hairline}`, borderBottom: i === METHODOLOGIES.length - 1 ? `1px solid ${HUB_THEME.hairline}` : 'none',
              display: 'flex', gap: 22, alignItems: 'flex-start',
            }}>
              <div style={{ width: 46, height: 46, borderRadius: '50%', background: m.featured ? HUB_THEME.pineLight : HUB_THEME.card, color: HUB_THEME.goldLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Leaf size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                  <h2 style={{ ...SERIF, fontSize: 26, fontWeight: 600, color: HUB_THEME.paper, margin: 0 }}>{m.name}</h2>
                  {m.featured && (
                    <span style={{ ...MONO, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: HUB_THEME.gold, border: `1px solid ${HUB_THEME.gold}`, borderRadius: 999, padding: '3px 10px' }}>Featured</span>
                  )}
                </div>
                <p style={{ fontSize: 15, color: 'rgba(246,242,231,0.75)', lineHeight: 1.65, margin: 0 }}>{m.shortDescription}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 14, flexWrap: 'wrap' }}>
                  <span style={{ ...MONO, fontSize: 10, color: HUB_THEME.inkLight }}>{m.activities.length} activities</span>
                  <span style={{ ...MONO, fontSize: 10, color: HUB_THEME.inkLight }}>{m.requiredData.length} data fields</span>
                  <span style={{ ...MONO, fontSize: 10, color: HUB_THEME.inkLight }}>{m.relatedCfas.join(', ') || 'Not yet connected'}</span>
                  <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: HUB_THEME.gold }}>
                    Read the methodology <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </section>

      <section style={{ marginTop: 50, padding: '26px 28px', background: HUB_THEME.card, borderRadius: 12 }}>
        <p style={labelStyle()}>On ownership</p>
        <p style={{ fontSize: 14, color: HUB_THEME.inkLight, lineHeight: 1.7, margin: '10px 0 0', maxWidth: 680 }}>
          This hub does not claim ownership of or partnership with a methodology unless that relationship genuinely exists.
          Jaza Miti and GTCI are described as they are publicly documented; the hub organizes and explains them so CFAs can decide for themselves.
        </p>
      </section>
    </ConservationShell>
  );
}