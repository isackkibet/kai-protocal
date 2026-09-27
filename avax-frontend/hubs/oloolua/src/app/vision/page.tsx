import PageLayout from '@/components/PageLayout';
import Link from 'next/link';

export default function VisionPage() {
  return (
    <PageLayout
      title="Our Vision"
      subtitle="Where every tree planted becomes a lasting, verifiable asset – and every community owns its green future"
    >
      <section style={{ padding: '3rem 1.5rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>

          <h2 style={h2}>Inspiring a Global Movement Where Conservation Meets Innovation</h2>
          <p style={p}>
            In a world facing climate crisis and widening inequality, our vision is bold yet practical: a future where forest preservation and human prosperity walk hand in hand. We imagine thriving forest ecosystems, vibrant green spaces that heal minds and bodies, and communities empowered to earn from their conservation work—all underpinned by decentralized technology that makes every action visible, trusted, and rewarding.
          </p>

          <h3 style={h3}>Engaging Communities as Owners of Their Environment</h3>
          <p style={p}>
            At the heart of our vision lies the belief that local people are the most powerful stewards of nature. We see a world where every community—from a small forest village to an urban neighborhood—has the tools, knowledge, and incentives to protect and restore their own green spaces. This isn&apos;t about charity; it&apos;s about ownership, dignity, and shared prosperity.
          </p>
          <h4 style={h4}>Why Community‑Led Action Wins:</h4>
          <ul style={ul}>
            <li>Communities hold deep cultural and generational ties to their land – that connection fuels lasting care.</li>
            <li>Local leadership ensures solutions are practical, affordable, and tailored to real needs.</li>
            <li>When people benefit economically from conservation, forests stop being seen as obstacles and start being seen as assets.</li>
          </ul>
          <h4 style={h4}>How We&apos;ll Get There:</h4>
          <ul style={ul}>
            <li><strong>Open‑source knowledge:</strong> We openly share our nursery methods, data models, and tokenization blueprints so any CFA can replicate them.</li>
            <li><strong>Youth &amp; women empowerment:</strong> Training programs specifically designed to bring underrepresented voices into the green economy.</li>
            <li><strong>Village‑level digital hubs:</strong> Simple, mobile‑friendly tools that let communities log their conservation work and see its value in real time.</li>
          </ul>

          <h3 style={h3}>Green Spaces as the New Public Health Infrastructure</h3>
          <p style={p}>
            We envision a future where green spaces are treated as essential public goods—just like schools and hospitals. Every neighborhood will have access to pockets of nature that serve as wellness refuges, community classrooms, and biodiversity corridors. These spaces will host everything from meditation sessions to tree‑planting festivals, from outdoor therapy to digital art exhibitions under the forest canopy.
          </p>
          <h4 style={h4}>The Green Space Revolution in Practice:</h4>
          <ul style={ul}>
            <li><strong>Healing Hubs:</strong> Dedicated zones for mental wellness, equipped with walking paths, quiet sitting areas, and guided nature‑immersion activities.</li>
            <li><strong>Active Recreation:</strong> Camping sites, climbing trails, and eco‑games that blend fun with environmental education.</li>
            <li><strong>Carbon‑Smart Parks:</strong> Every green space will be registered on‑chain, so communities can prove their carbon removal and attract conservation finance.</li>
          </ul>

          <h3 style={h3}>Native Trees as Living Assets – Tracked, Tokenized, Traded</h3>
          <p style={p}>
            In our vision, a planted tree is more than a sapling—it is a living asset whose growth, carbon capture, and ecological impact are recorded immutably. Using Hedera&apos;s distributed ledger and the Hedera Guardian, we turn conservation data into digital art certificates that are beautiful, collectable, and traceable for decades. These certificates carry the story of the tree, the community that planted it, and the carbon it sequesters—making them meaningful tools for cultural preservation, eco‑tourism, and long‑term climate finance.
          </p>
          <h4 style={h4}>What This Unlocks:</h4>
          <ul style={ul}>
            <li><strong>Trusted carbon markets:</strong> Buyers can verify the exact tree behind every offset, down to its GPS location and care history.</li>
            <li><strong>Eco‑tourism 2.0:</strong> Visitors can collect digital art linked to the very trees they helped plant, creating lasting memories and ongoing funding streams.</li>
            <li><strong>A digital museum of nature:</strong> Indigenous knowledge, local art, and biodiversity data preserved forever on a public ledger.</li>
          </ul>

          <h3 style={h3}>A Replicable Blueprint for Kenya &amp; the World</h3>
          <p style={p}>
            Our ultimate vision is to see the Oloolua model become the standard for every Community Forest Association in Kenya and beyond. By combining traditional nursery work with Web3 transparency, mental wellness, and art, we can turn national conservation goals into a grassroots‑powered economic engine. We envision a continent where forest communities are not just surviving, but thriving—exporting verified green data, attracting sustainable investment, and closing the inequality gap one tree at a time.
          </p>

          <h3 style={h3}>Aligned with Global Goals</h3>
          <p style={p}>
            Our vision is deeply integrated with the Sustainable Development Goals (SDGs) – particularly Climate Action (13), Good Health (3), Decent Work (8), and Reduced Inequalities (10). We also provide the transparent, on‑chain data that organizations need to meet their ESG (Environmental, Social, Governance) commitments, making us a trusted partner for businesses serious about sustainability.
          </p>

          <div style={ctaBox}>
            <h3 style={{ color: '#e4c878', marginBottom: '0.5rem' }}>Join Us in This Vision</h3>
            <p>
              This is a movement that needs everyone—community members, artists, technologists, investors, and dreamers. Together, we can build a future where every forest breathes, every community thrives, and every conservation action counts. Let&apos;s make the green economy a reality, from the ground up.
            </p>
            <Link href="/#contact" style={ctaBtn}>Become a Partner</Link>
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
