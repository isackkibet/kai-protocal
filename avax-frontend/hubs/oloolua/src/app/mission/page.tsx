import PageLayout from '@/components/PageLayout';
import Link from 'next/link';

export default function MissionPage() {
  return (
    <PageLayout
      title="Our Mission"
      subtitle="Pioneering green conservation finance through community, art, and trusted data"
    >
      <section style={{ padding: '3rem 1.5rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>

          <h2 style={h2}>Conserving, Protecting, and Restoring Forest Ecosystems</h2>
          <p style={p}>
            Forests are the lungs of the Earth — they stabilize our climate, shelter biodiversity, and sustain human wellbeing. Our mission is to conserve, protect, and restore these invaluable ecosystems, not only by planting indigenous and medicinal trees but also by creating healing green spaces, empowering communities with training and green jobs, and making every conservation action visible, trusted, and rewarding through decentralized technology.
          </p>

          <h3 style={h3}>Planting Indigenous and Medicinal Trees</h3>
          <p style={p}>
            Planting trees remains our first line of defence. We focus on indigenous and medicinal species that heal both the land and the people.
          </p>
          <h4 style={h4}>Why Indigenous and Medicinal Trees Matter:</h4>
          <ul style={ul}>
            <li><strong>Ecological Balance:</strong> Indigenous trees are adapted to local conditions, supporting native wildlife and resilient ecosystems.</li>
            <li><strong>Health Benefits:</strong> Medicinal trees provide natural remedies, preserving traditional knowledge and community health.</li>
            <li><strong>Long‑Term Resilience:</strong> These trees withstand pests, diseases, and climate stress, ensuring the survival of our reforestation efforts.</li>
          </ul>
          <h4 style={h4}>Our Efforts in Action:</h4>
          <ul style={ul}>
            <li>Running community nurseries that propagate diverse native and medicinal seedlings.</li>
            <li>Organizing tree‑planting drives that restore degraded forest patches and expand green cover.</li>
            <li>Recording every planted tree on the Hedera ledger, creating an unchangeable digital twin that tracks carbon sequestration over time.</li>
          </ul>

          <h3 style={h3}>Green Spaces for Mental and Physical Wellness</h3>
          <p style={p}>
            We believe that conservation must heal people, not just landscapes. Accessible green spaces are powerful tools for mental restoration, physical activity, and community bonding.
          </p>
          <h4 style={h4}>What We Do with Green Spaces:</h4>
          <ul style={ul}>
            <li><strong>Wellness Hubs:</strong> Designating quiet zones for meditation, nature therapy, and reflection.</li>
            <li><strong>Active Recreation:</strong> Facilitating camping, nature trails, and outdoor games that boost physical and mental health.</li>
            <li><strong>Community Classrooms:</strong> Turning green pockets into living classrooms where people learn about ecology, sustainability, and climate action.</li>
          </ul>

          <h3 style={h3}>Community Training and Green Jobs</h3>
          <p style={p}>
            Conservation only lasts when it creates real value for the people who practice it. We train local youth and community members in practical skills that open doors to the green economy.
          </p>
          <h4 style={h4}>Our Training Areas:</h4>
          <ul style={ul}>
            <li>Seed collection, nursery management, and tree propagation techniques.</li>
            <li>Sustainability literacy, climate science, and ESG fundamentals.</li>
            <li>Web3 tools (Hedera, Guardian) for data logging and digital asset creation.</li>
            <li>Eco‑tourism, green enterprise, and how to turn conservation data into income.</li>
          </ul>

          <h3 style={h3}>Trust Through Technology – Hedera &amp; Web3</h3>
          <p style={p}>
            One of the biggest barriers to conservation finance is trust. We solve this by using the Hedera public ledger and the Hedera Guardian to create immutable, verifiable records of every activity we do.
          </p>
          <h4 style={h4}>How Technology Strengthens Our Mission:</h4>
          <ul style={ul}>
            <li><strong>Immutable Audit Trail:</strong> Every tree planted, training held, or green space created is recorded transparently.</li>
            <li><strong>Verifiable ESG Data:</strong> Organizations can confidently meet their Environmental, Social, and Governance (ESG) reporting requirements using our on‑chain data.</li>
            <li><strong>Trustable Digital Art Certificates:</strong> We partner with local artists to turn conservation milestones into collectible digital art (we call them conservation certificates) that represent real-world impact and can track carbon sequestration for decades.</li>
          </ul>

          <h3 style={h3}>SDG Amplification &amp; Replicable Model</h3>
          <p style={p}>
            Every action we take is aligned with the Sustainable Development Goals – especially Climate Action (SDG 13), Good Health (SDG 3), Decent Work (SDG 8), and Reduced Inequalities (SDG 10). We are building a methodology that any Community Forest Association (CFA) in Kenya can adopt, helping to achieve the initiative of 15 billion trees by 2032 and turning conservation into a vehicle for local economic growth and equity.
          </p>

          <div style={ctaBox}>
            <h3 style={{ color: '#e4c878', marginBottom: '0.5rem' }}>Join Us in Our Mission</h3>
            <p>
              Forest conservation is a shared responsibility – but it also must be a shared opportunity. Whether you are an individual, a community leader, an artist, or an organization, your participation can help us prove that protecting nature and improving lives go hand in hand. Together, we can create a future where forests flourish, biodiversity thrives, and every community benefits from the green economy.
            </p>
            <Link href="/#contact" style={ctaBtn}>Get Involved Today</Link>
          </div>

        </div>
      </section>
    </PageLayout>
  );
}

const h2: React.CSSProperties = { color: '#e4c878', fontSize: '1.7rem', fontWeight: 800, marginTop: '2rem', marginBottom: '0.75rem' };
const h3: React.CSSProperties = { color: '#27ae60', fontSize: '1.2rem', fontWeight: 700, marginTop: '2rem', marginBottom: '0.5rem' };
const h4: React.CSSProperties = { color: '#a0c4b4', fontSize: '1rem', fontWeight: 600, marginTop: '1rem', marginBottom: '0.35rem' };
const p: React.CSSProperties = { color: '#d0e8d8', lineHeight: 1.8 };
const ul: React.CSSProperties = { color: '#d0e8d8', paddingLeft: '1.5rem', lineHeight: 2 };
const ctaBox: React.CSSProperties = { background: 'linear-gradient(135deg, rgba(27,67,50,0.9), rgba(11,28,20,0.95))', border: '1px solid rgba(228,200,120,0.3)', borderRadius: 16, padding: '2rem', marginTop: '2.5rem', textAlign: 'center' as const };
const ctaBtn: React.CSSProperties = { display: 'inline-block', marginTop: '1rem', background: '#e4c878', color: '#0b1c14', padding: '0.75rem 2rem', borderRadius: 8, fontWeight: 700, textDecoration: 'none' };
