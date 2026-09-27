'use client';

import PageLayout from '@/components/PageLayout';

// From the original workshops.html JS array
const WORKSHOP_IMAGES = [
  "work 60.jpeg", "work1.jpeg", "work10.jpeg", "work11.jpeg", "work12.jpeg",
  "work14.jpeg", "work15.jpeg", "work16.jpeg", "work17.jpeg", "work18.jpeg",
  "work19.jpeg", "work2.jpeg", "work20.jpeg", "work21.jpeg", "work22.jpeg",
  "work24.jpeg", "work26.jpeg", "work27.jpeg", "work29.jpeg", "work3.jpeg",
  "work31.jpeg", "work32.jpeg", "work33.jpeg", "work34.jpeg", "work35.jpeg",
  "work36.jpeg", "work38.jpeg", "work39.jpeg", "work4.jpeg", "work40.jpeg",
  "work41.jpeg", "work42.jpeg", "work43.jpeg", "work44.jpeg", "work45.jpeg",
  "work46.jpeg", "work47.jpeg", "work48.jpeg", "work49.jpeg", "work5.jpeg",
  "work50.jpeg", "work51.jpeg", "work52.jpeg", "work53.jpeg", "work54.jpeg",
  "work55.jpeg", "work56.jpeg", "work57.jpeg", "work58.jpeg", "work6.jpeg",
  "work61.jpeg", "work62.jpeg", "work64.jpeg", "work65.jpeg", "work66.jpeg",
  "work67.jpeg", "work7.jpeg", "work8.jpeg", "work9.jpeg",
].sort((a, b) => {
  const numA = parseInt(a.replace(/[^0-9]/g, '')) || 0;
  const numB = parseInt(b.replace(/[^0-9]/g, '')) || 0;
  return numA - numB;
});

export default function WorkshopsPage() {
  return (
    <PageLayout
      title="Community Workshops"
      subtitle="Empowering the local community through environmental education and hands-on training"
      bgImage="/assets/images/workshop.jpg"
    >
      {/* Content Section */}
      <section style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h2 style={{ color: '#e4c878', fontSize: '1.7rem', fontWeight: 800 }}>Environmental Education &amp; Outreach</h2>
          <p style={{ fontSize: '1.1rem', maxWidth: 800, margin: '1rem auto', color: '#d0e8d8', lineHeight: 1.8 }}>
            Our community workshops are at the heart of our mission. We believe that conservation starts with education. Through these interactive sessions, we train youth and community members on sustainable forestry, biodiversity tracking, and green enterprise skills. Check out the highlights from our recent sessions below.
          </p>
        </div>
      </section>

      {/* Gallery Section */}
      <section style={{ padding: '2rem 1.5rem 4rem', background: 'rgba(10,25,16,0.5)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 20,
          }}>
            {WORKSHOP_IMAGES.map((imgName) => (
              <div
                key={imgName}
                style={{
                  borderRadius: 10,
                  overflow: 'hidden',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                  aspectRatio: '4/3',
                  background: '#122b1f',
                  transition: 'transform 0.3s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-5px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <img
                  src={`/assets/images/${imgName}`}
                  alt="Community Workshop Photo"
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
