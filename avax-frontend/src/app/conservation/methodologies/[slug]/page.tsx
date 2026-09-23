import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Target, Map, ClipboardList, Users, TrendingUp, Leaf,
  Wallet, ShieldCheck, BookOpen,
} from 'lucide-react';
import ConservationShell from '@/components/conservation/ConservationShell';
import { METHODOLOGIES } from '@/lib/conservation-data';
import { HUB_THEME, labelStyle, MONO, SERIF, SANS } from '@/lib/hub-theme';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const m = METHODOLOGIES.find(m => m.slug === slug);
  return {
    title: m ? `${m.name} methodology — KAI Nuvari Conservation Hub` : 'Methodology not found',
    description: m?.shortDescription,
  };
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div style={{ borderTop: `1px solid ${HUB_THEME.hairline}`, padding: '26px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ color: HUB_THEME.goldLight }}>{icon}</span>
        <p style={{ ...labelStyle(), margin: 0 }}>{title}</p>
      </div>
      <div style={{ fontSize: 15, color: 'rgba(246,242,231,0.82)', lineHeight: 1.7, maxWidth: 700 }}>{children}</div>
    </div>
  );
}

export default async function MethodologyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = METHODOLOGIES.find(m => m.slug === slug);
  if (!m) notFound();

  return (
    <ConservationShell>
      <Link href="/conservation/methodologies" style={{ ...MONO, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: HUB_THEME.goldLight, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, marginTop: 26 }}>
        <ArrowLeft size={14} /> All methodologies
      </Link>

      <section style={{ padding: '28px 0 10px' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
          <span style={{ ...MONO, fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase', color: HUB_THEME.goldLight }}>Methodology</span>
          <span style={{ ...MONO, fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase', color: HUB_THEME.inkLight }}>{m.ownerType.replaceAll('_', ' ')}</span>
          {m.featured && <span style={{ ...MONO, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: HUB_THEME.gold }}>Featured</span>}
        </div>
        <h1 style={{ ...SERIF, fontSize: 44, fontWeight: 600, lineHeight: 1.1, margin: '0 0 14px' }}>{m.name}</h1>
        <p style={{ ...SANS, fontSize: 18, color: 'rgba(246,242,231,0.75)', lineHeight: 1.6, maxWidth: 700, margin: 0 }}>
          {m.shortDescription}
        </p>
      </section>

      <Section icon={<Target size={16} />} title="Purpose">
        <p style={{ margin: 0 }}>{m.purpose}</p>
      </Section>

      <Section icon={<Map size={16} />} title="Problem it addresses">
        <p style={{ margin: 0 }}>{m.problemAddressed}</p>
      </Section>

      <Section icon={<ClipboardList size={16} />} title="How it works">
        <ol style={{ margin: 0, paddingLeft: 22 }}>
          {m.howItWorks.map((s, i) => <li key={i} style={{ marginBottom: 10 }}>{s}</li>)}
        </ol>
      </Section>

      <Section icon={<Leaf size={16} />} title="Activities">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {m.activities.map(a => <span key={a} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}><span style={{ color: HUB_THEME.goldLight }}>—</span> {a}</span>)}
        </div>
      </Section>

      <Section icon={<ClipboardList size={16} />} title="Required data">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {m.requiredData.map(d => <span key={d} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}><span style={{ color: HUB_THEME.goldLight }}>—</span> {d}</span>)}
        </div>
      </Section>

      <Section icon={<Users size={16} />} title="Who participates">
        <p style={{ margin: 0 }}>{m.participants.join(' · ')}</p>
      </Section>

      <Section icon={<TrendingUp size={16} />} title="Expected outcomes">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {m.expectedOutcomes.map(o => <span key={o} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}><span style={{ color: HUB_THEME.goldLight }}>✓</span> {o}</span>)}
        </div>
      </Section>

      <Section icon={<ShieldCheck size={16} />} title="Conservation benefits & verification">
        <p style={{ margin: '0 0 14px' }}>
          <b style={{ color: HUB_THEME.paper }}>Benefits:</b> {m.conservationBenefits.join(' · ')}
        </p>
        <p style={{ margin: 0 }}>
          <b style={{ color: HUB_THEME.paper }}>Verification:</b> {m.verificationRequirements}
        </p>
      </Section>

      <Section icon={<Wallet size={16} />} title="Economic value">
        <p style={{ margin: 0 }}>{m.economicValue}</p>
      </Section>

      <Section icon={<BookOpen size={16} />} title="Related resources & CFAs">
        <p style={{ margin: '0 0 6px' }}>
          <b style={{ color: HUB_THEME.paper }}>Resources:</b> {m.relatedResources.join(' · ')}
        </p>
        <p style={{ margin: 0 }}>
          <b style={{ color: HUB_THEME.paper }}>Connected CFAs:</b> {m.relatedCfas.join(' · ')}
        </p>
      </Section>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', padding: '20px 0' }}>
        <Link href="/conservation/ask" style={{ ...MONO, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: HUB_THEME.goldLight, textDecoration: 'none', border: `1px solid ${HUB_THEME.gold}`, borderRadius: 999, padding: '12px 22px' }}>
          Ask KAI about {m.name.split(' ')[0]} →
        </Link>
        <Link href="/conservation/resources" style={{ ...MONO, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: HUB_THEME.goldLight, textDecoration: 'none', border: `1px solid ${HUB_THEME.hairline}`, borderRadius: 999, padding: '12px 22px' }}>
          Related resources →
        </Link>
      </div>
    </ConservationShell>
  );
}