import PageLayout from '@/components/PageLayout';

const PROJECTS = [
  {
    eyebrow: 'Flagship Initiative',
    title: 'Jaza Miti: Tokenized Tree Planting',
    desc: 'Jaza Miti goes beyond traditional tree planting by creating measurable, verifiable, and monetizable environmental impact. We solve the lack of transparency in traditional reforestation by assigning local youth as guardians and geo-tagging every sapling.',
    features: [
      { icon: '🛰️', title: 'Data Capture', desc: 'We log GPS coordinates, species types, growth metrics, and survival rates into structured datasets.' },
      { icon: '🪙', title: 'Tokenization', desc: 'Each living tree is minted as a Conservation NFT on Hedera, serving as a transparent digital asset representing real-world ecological impact.' },
    ],
    img: '/assets/images/forest5.jpeg',
  },
];

const ICRAF_CARDS = [
  {
    icon: '🌱', title: 'Agroforestry Models',
    items: ['Climate-resilient species selection', 'Advanced soil restoration strategies', 'Biodiversity enhancement planning'],
  },
  {
    icon: '🗄️', title: 'Data Integration',
    items: ['Predictive tree growth models', 'Accurate carbon sequestration estimates', 'Comprehensive land-use data processing'],
  },
  {
    icon: '📈', title: 'Value Creation',
    items: ['Scientific Data + Field Data', '= Verified Impact Assets', 'Attracting ESG and Impact Investors'],
  },
];

const REGEN_CARDS = [
  {
    icon: '🍯', title: 'Beekeeping Initiative', color: '#fca311',
    desc: 'Integrated with reforestation to create a self-reinforcing ecological system. "Helping bees help us."',
    items: [
      { label: 'Ecosystem', val: 'Enhances pollination and forest regeneration.' },
      { label: 'Economy', val: 'Youth harvest honey and beeswax.' },
      { label: 'Blockchain', val: 'Tokenizing honey batches to trace origins back to the specific forest zones.' },
    ],
  },
  {
    icon: '🎨', title: 'Arts in Nature', color: '#9b5de5',
    desc: 'Transforming conservation into a cultural experience. Artists become storytellers of the ecosystem.',
    items: [
      { label: 'Creative', val: 'Forest murals and sculpture installations.' },
      { label: 'Data-Linked', val: 'Art connected to specific tree clusters.' },
      { label: 'Blockchain', val: 'Minting Art NFTs embedded with real environmental metrics.' },
    ],
  },
];

const PIPELINE = [
  { icon: '🌱', label: '1. Plant' },
  { icon: '📱', label: '2. Data' },
  { icon: '🔬', label: '3. Science' },
  { icon: '🔗', label: '4. Verify' },
  { icon: '💰', label: '5. Value' },
];

export default function ProjectsPage() {
  return (
    <PageLayout showHeader={false}>
      {/* HERO */}
      <div style={{
        background: `linear-gradient(rgba(11,46,20,0.85), rgba(11,46,20,0.95)), url('/assets/images/forest5.jpeg') center/cover`,
        color: 'white', padding: '8rem 2rem 4rem', textAlign: 'center',
      }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,201,106,0.15)', color: '#e8c96a', border: '1px solid #e8c96a', padding: '0.5rem 1.5rem', borderRadius: 50, fontSize: '0.85rem', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: '1.5rem' }}>
          Digital Conservation Ecosystem
        </div>
        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 700, lineHeight: 1.1, marginBottom: '1.5rem' }}>
          Data-Driven, Blockchain-Enabled<br />
          <em style={{ color: '#e8c96a', fontStyle: 'italic' }}>Conservation</em>
        </h1>
        <p style={{ maxWidth: 800, margin: '0 auto', fontSize: '1.2rem', opacity: 0.9, fontWeight: 300 }}>
          Transforming environmental stewardship into a transparent, scalable, and economically viable model. We convert conservation actions into verified data, tokenized assets, and true economic value.
        </p>
      </div>

      {/* Framework Bar */}
      <div style={{ background: '#174823', padding: '2rem', display: 'flex', justifyContent: 'center', gap: '4rem', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        {[['🌐', 'ESG Aligned'], ['🎯', 'SDG Goals'], ['🔗', 'Hedera Guardian'], ['🔬', 'Science-Backed']].map(([icon, label]) => (
          <div key={label} style={{ textAlign: 'center', color: 'white' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{icon}</div>
            <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: 1, opacity: 0.8 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* JAZA MITI */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '4rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'center' }}>
          <div>
            <span style={{ color: '#2a6040', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, fontSize: '0.85rem' }}>Flagship Initiative</span>
            <h3 style={{ fontSize: '2rem', color: '#0b2e14', fontWeight: 700, margin: '0.75rem 0 1rem' }}>Jaza Miti: Tokenized Tree Planting</h3>
            <p style={{ color: '#334a34', marginBottom: '1.5rem', fontSize: '1.05rem', lineHeight: 1.7 }}>
              Jaza Miti goes beyond traditional tree planting by creating measurable, verifiable, and monetizable environmental impact. We solve the lack of transparency in traditional reforestation by assigning local youth as guardians and geo-tagging every sapling.
            </p>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {[
                { icon: '🛰️', title: 'Data Capture', desc: 'We log GPS coordinates, species types, growth metrics, and survival rates into structured datasets.' },
                { icon: '🪙', title: 'Tokenization', desc: 'Each living tree is minted as a Conservation NFT on Hedera, serving as a transparent digital asset representing real-world ecological impact.' },
              ].map(({ icon, title, desc }) => (
                <li key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.2rem', background: 'white', padding: '1.2rem', borderRadius: 12, boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #daebd9' }}>
                  <span style={{ fontSize: '1.5rem' }}>{icon}</span>
                  <div>
                    <h4 style={{ color: '#0b2e14', marginBottom: '0.3rem', fontSize: '1.05rem' }}>{title}</h4>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: '#334a34' }}>{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
            <img src="/assets/images/seedling1.jpeg" alt="Tree planting" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: 300 }} />
          </div>
        </div>
      </div>

      {/* ICRAF / CIFOR */}
      <div style={{ background: 'white', borderRadius: 40, margin: '0 2rem 2rem', padding: '4rem 2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{ color: '#2a6040', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Scientific Credibility</span>
          <h2 style={{ fontSize: '2.5rem', color: '#0b2e14', fontWeight: 700 }}>ICRAF / CIFOR Integration</h2>
          <p style={{ maxWidth: 600, margin: '0 auto', color: '#617060' }}>Grounding our conservation model in rigorous scientific research to ensure ecological accuracy and prepare for global green finance markets.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem' }}>
          {ICRAF_CARDS.map(({ icon, title, items }) => (
            <div key={title} style={{ background: 'white', padding: '2rem', borderRadius: 20, border: '1px solid #daebd9', boxShadow: '0 10px 30px rgba(11,46,20,0.05)', borderTop: '4px solid #e8c96a', transition: 'transform 0.3s' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{icon}</div>
              <h4 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#0b2e14', fontWeight: 700 }}>{title}</h4>
              <ul style={{ paddingLeft: '1.2rem', color: '#334a34', lineHeight: 1.8 }}>
                {items.map(i => <li key={i}>{i}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Regenerative Strategies */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '4rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{ color: '#2a6040', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Holistic Approach</span>
          <h2 style={{ fontSize: '2.5rem', color: '#0b2e14', fontWeight: 700 }}>Regenerative Ecosystem Strategies</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {REGEN_CARDS.map(({ icon, title, color, desc, items }) => (
            <div key={title} style={{ background: 'white', padding: '2rem', borderRadius: 20, border: '1px solid #daebd9', boxShadow: '0 10px 30px rgba(11,46,20,0.05)', borderTop: `4px solid ${color}` }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{icon}</div>
              <h4 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#0b2e14', fontWeight: 700 }}>{title}</h4>
              <p style={{ color: '#334a34', marginBottom: '1rem', lineHeight: 1.7 }}>{desc}</p>
              <ul style={{ paddingLeft: '1.2rem', color: '#334a34', lineHeight: 1.8 }}>
                {items.map(({ label, val }) => (
                  <li key={label}><strong>{label}:</strong> {val}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Hedera Guardian */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 2rem 4rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'center' }}>
          <div>
            <span style={{ color: '#2a6040', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, fontSize: '0.85rem' }}>Trust Infrastructure</span>
            <h3 style={{ fontSize: '2rem', color: '#0b2e14', fontWeight: 700, margin: '0.75rem 0 1rem' }}>Hedera Guardian Model</h3>
            <p style={{ color: '#334a34', marginBottom: '1.5rem', fontSize: '1.05rem', lineHeight: 1.7 }}>
              Conservation has historically suffered from poor data verification and lack of trust. We use Hedera Guardian as a policy-driven, verifiable data system to solve this.
            </p>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {[
                { icon: '🛡️', title: 'MRV System', desc: 'Measurement, Reporting, and Verification that is standardized, auditable, and completely transparent.' },
                { icon: '📋', title: 'Policy Driven', desc: 'Automated rules for tree validation, data integrity, and ESG compliance ensure that every minted asset has real-world backing.' },
              ].map(({ icon, title, desc }) => (
                <li key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.2rem', background: 'white', padding: '1.2rem', borderRadius: 12, boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #daebd9' }}>
                  <span style={{ fontSize: '1.5rem' }}>{icon}</span>
                  <div>
                    <h4 style={{ color: '#0b2e14', marginBottom: '0.3rem', fontSize: '1.05rem' }}>{title}</h4>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: '#334a34' }}>{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div style={{ background: '#0b2e14', borderRadius: 20, padding: '3rem', color: 'white' }}>
            <h3 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: 700 }}>The Strategic Advantage</h3>
            <p style={{ opacity: 0.9, marginBottom: '1rem', lineHeight: 1.7 }}>By building on an immutable ledger, we provide absolute investor trust, create a highly scalable model, and align completely with global ESG frameworks.</p>
            <p style={{ opacity: 0.9, lineHeight: 1.7 }}><strong>Vision:</strong> To become the definitive source of truth for conservation in Africa.</p>
          </div>
        </div>
      </div>

      {/* Ecosystem Flow / Pipeline */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem 4rem' }}>
        <div style={{ background: '#0b2e14', borderRadius: 30, padding: '4rem 2rem', color: 'white', textAlign: 'center' }}>
          <h2 style={{ color: '#e8c96a', marginBottom: '3rem', fontSize: '2.2rem', fontWeight: 700 }}>The Integrated Conservation Pipeline</h2>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '2rem', maxWidth: 1000, margin: '0 auto' }}>
            {PIPELINE.map(({ icon, label }) => (
              <div key={label} style={{ background: '#174823', border: '2px solid #c9a227', borderRadius: '50%', width: 130, height: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', color: '#e8c96a' }}>{label}</span>
              </div>
            ))}
          </div>
          <div style={{ background: 'white', color: '#131f14', padding: '2rem', borderRadius: 15, maxWidth: 600, margin: '3rem auto 0', fontWeight: 500, lineHeight: 1.7 }}>
            A regenerative system where <strong style={{ color: '#3d7a52' }}>Nature thrives</strong>, <strong style={{ color: '#3d7a52' }}>Youth earn</strong>, <strong style={{ color: '#3d7a52' }}>Data builds trust</strong>, and <strong style={{ color: '#3d7a52' }}>Investors participate</strong>.<br />
            <span style={{ fontSize: '0.85rem', color: '#617060', display: 'block', marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: 1 }}>A Replicable ESG-Aligned Green Economy Model</span>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div style={{ background: '#0b2e14', color: '#a8c8a8', textAlign: 'center', padding: '3rem 2rem' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'white', fontWeight: 700 }}>Oloolua Forest Youth Guardians</h3>
        <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>Conservation must pay to sustain itself.</p>
      </div>
    </PageLayout>
  );
}
