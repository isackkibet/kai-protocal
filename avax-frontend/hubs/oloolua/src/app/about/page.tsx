import PageLayout from '@/components/PageLayout';
import Link from 'next/link';
import {
  TreePine, Leaf, Sprout, Globe, Lightbulb, Settings, Brain,
  GraduationCap, BarChart3, Palette, Coins, HeartHandshake,
  type LucideIcon,
} from 'lucide-react';

const HOW_WE_WORK: { icon: LucideIcon; title: string; items: string[] }[] = [
  { icon: TreePine, title: 'Nature & Conservation', items: ['Plant and nurture indigenous and medicinal trees', 'Restore degraded forest areas', 'Expand and protect green spaces'] },
  { icon: Brain, title: 'Wellness & Community', items: ['Use green spaces for mental and physical wellbeing', 'Organize community activities, camping, and engagement', 'Create safe spaces for learning and connection'] },
  { icon: GraduationCap, title: 'Training & Empowerment', items: ['Train communities on sustainability', 'Teach nursery management and tree propagation', 'Build skills for long-term environmental impact'] },
  { icon: BarChart3, title: 'Technology & Transparency', items: ['Track conservation activities and impact', 'Use tools like Hedera to create trusted data', 'Make environmental work visible and accountable'] },
  { icon: Palette, title: 'Art & Storytelling', items: ['Turn conservation into meaningful art', 'Empower local artists', 'Share stories that inspire action'] },
  { icon: Coins, title: 'Green Economy', items: ['Create job opportunities for youth', 'Support community-based environmental enterprises', 'Enable value creation from conservation'] },
];

const WHAT_WE_DO: { icon: LucideIcon; label: string }[] = [
  { icon: Sprout, label: 'Seedling production and nursery management' },
  { icon: TreePine, label: 'Tree planting and forest restoration' },
  { icon: Leaf, label: 'Green space development' },
  { icon: Brain, label: 'Wellness, camping, and recreation' },
  { icon: GraduationCap, label: 'Community training and education' },
  { icon: BarChart3, label: 'Conservation data tracking' },
  { icon: Palette, label: 'Art and environmental storytelling' },
  { icon: Coins, label: 'Green economy and job creation' },
  { icon: HeartHandshake, label: 'Collaboration with communities and partners' },
];

export default function AboutPage() {
  return (
    <PageLayout
      title="Oloolua Youth Guardians"
      subtitle="Protecting Nature. Empowering People. Creating Value."
    >
      {/* content-section */}
      <section style={{ padding: '3rem 1.5rem' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>

          {/* The Problem We Face */}
          <h2 style={h2}>The Problem We Face</h2>
          <p>Forests like <strong>Oloolua Forest in Nairobi, Kenya</strong> are disappearing, and with them, the benefits they provide to people and communities.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
            <div style={card}>
              <h3 style={h3}>The Core Problem</h3>
              <p>We are facing a growing loss of:</p>
              <ul style={ul}>
                <li>Green spaces</li>
                <li>Biodiversity</li>
                <li>Community connection to nature</li>
              </ul>
            </div>
            <div style={card}>
              <h3 style={h3}>The Causes (Roots)</h3>
              <p>This problem exists because of:</p>
              <ul style={ul}>
                <li>Deforestation and land degradation</li>
                <li>Lack of awareness about conservation</li>
                <li>Limited community involvement</li>
                <li>Poor tracking of environmental impact</li>
                <li>Few economic incentives for protecting nature</li>
              </ul>
            </div>
            <div style={card}>
              <h3 style={h3}>The Effects (Branches)</h3>
              <p>As a result, we see:</p>
              <ul style={ul}>
                <li>Climate change impacts</li>
                <li>Loss of wildlife and ecosystems</li>
                <li>Poor mental and physical wellbeing</li>
                <li>Reduced opportunities for youth</li>
                <li>Weak community development systems</li>
              </ul>
            </div>
          </div>

          {/* Our Solution */}
          <h2 style={h2}>Our Solution</h2>
          <p>At <strong>Oloolua Youth Guardians</strong>, we are building a new way of thinking about conservation, one that connects <strong>nature, people, and opportunity</strong>.</p>

          {/* WHY We Exist */}
          <h2 style={{ ...h2, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lightbulb size={22} /> WHY We Exist
          </h2>
          <div style={highlightBox}>
            <p><strong>Protecting nature should also improve people&apos;s lives.</strong></p>
            <p>Green spaces are not just for the environment, they are for:</p>
            <ul style={ul}>
              <li>Mental health and healing</li>
              <li>Physical wellbeing</li>
              <li>Community connection</li>
              <li>Economic opportunity</li>
            </ul>
          </div>

          {/* HOW We Create Change */}
          <h2 style={{ ...h2, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={22} /> HOW We Create Change
          </h2>
          <p>We combine <strong>community action, innovation, and creativity</strong> to solve real problems.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginTop: '1.5rem' }}>
            {HOW_WE_WORK.map(({ icon: Icon, title, items }) => (
              <div key={title} style={card}>
                <h3 style={{ ...h3, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Icon size={18} /> {title}
                </h3>
                <ul style={ul}>{items.map(i => <li key={i}>{i}</li>)}</ul>
              </div>
            ))}
          </div>

          {/* WHAT We Do */}
          <h2 style={h2}>WHAT We Do</h2>
          <p>Our activities include:</p>
          <ul style={{ ...ul, listStyle: 'none', paddingLeft: 0 }}>
            {WHAT_WE_DO.map(({ icon: Icon, label }) => (
              <li key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                <Icon size={16} style={{ color: '#27ae60', flexShrink: 0 }} /> {label}
              </li>
            ))}
          </ul>

          {/* Vision for the Future */}
          <h2 style={{ ...h2, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Globe size={22} /> Our Vision for the Future
          </h2>
          <p>We are building a future where:</p>
          <ul style={ul}>
            <li>Every community can protect and benefit from nature</li>
            <li>Every environmental action is tracked and trusted</li>
            <li>Green spaces support healthy people and strong communities</li>
            <li>Conservation creates real opportunities for youth</li>
          </ul>
          <p>
            Aligned with initiatives like:{' '}
            <strong>Initiative (15 billion trees by 2032)</strong> ·{' '}
            <strong>Sustainable Development Goals (SDGs)</strong> ·{' '}
            <strong>ESG (Environmental, Social, Governance) principles</strong>
          </p>

          {/* Join Us CTA */}
          <div style={ctaBox}>
            <h3 style={{ color: '#e4c878', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <HeartHandshake size={20} /> Join Us
            </h3>
            <p>We believe change happens when people come together. Whether you are a community member, a student, a partner, or an organization, <strong>you can be part of this journey.</strong></p>
            <p>Together, we can restore forests, grow green spaces, empower communities, and build a sustainable future.</p>
            <Link href="/#contact" style={ctaBtn}>Get Involved</Link>
          </div>

        </div>
      </section>
    </PageLayout>
  );
}

// Shared inline styles matching the original site's feel
const h2: React.CSSProperties = { color: '#e4c878', fontSize: '1.6rem', fontWeight: 700, marginTop: '2.5rem', marginBottom: '0.75rem' };
const h3: React.CSSProperties = { color: '#27ae60', fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem' };
const ul: React.CSSProperties = { color: '#d0e8d8', paddingLeft: '1.25rem', lineHeight: 1.8 };
const card: React.CSSProperties = { background: 'rgba(18,43,31,0.9)', border: '1px solid rgba(228,200,120,0.2)', borderRadius: 12, padding: '1.25rem' };
const highlightBox: React.CSSProperties = { background: 'rgba(39,174,96,0.12)', border: '1px solid rgba(39,174,96,0.4)', borderRadius: 12, padding: '1.25rem 1.5rem', marginTop: '1rem' };
const ctaBox: React.CSSProperties = { background: 'linear-gradient(135deg, rgba(27,67,50,0.9), rgba(11,28,20,0.95))', border: '1px solid rgba(228,200,120,0.3)', borderRadius: 16, padding: '2rem', marginTop: '2.5rem', textAlign: 'center' as const };
const ctaBtn: React.CSSProperties = { display: 'inline-block', marginTop: '1rem', background: '#e4c878', color: '#0b1c14', padding: '0.75rem 2rem', borderRadius: 8, fontWeight: 700, textDecoration: 'none' };
