'use client';

import PageLayout from '@/components/PageLayout';

const BEE_IMAGES = ['bee1.jpeg', 'bee2.jpeg', 'bee3.jpeg', 'bee5.jpeg', 'bee6.jpeg'];

export default function BeekeepingPage() {
  return (
    <PageLayout
      title="Beekeeping Initiative"
      subtitle="Promoting sustainable apiculture for biodiversity and community livelihood"
    >
      {/* Content Section */}
      <section style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h2 style={{ color: '#e4c878', fontSize: '1.7rem', fontWeight: 800 }}>Sustainable Apiculture in Oloolua</h2>
          <p style={{ fontSize: '1.1rem', maxWidth: 800, margin: '1rem auto', color: '#d0e8d8', lineHeight: 1.8 }}>
            Our beekeeping initiative aims to introduce sustainable honey production while enhancing the pollination of indigenous flora. This helps preserve the forest ecosystem while providing alternative income streams for our community members.
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
            {BEE_IMAGES.map((imgName) => (
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
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.transform = 'translateY(-5px)')}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <img
                  src={`/assets/images/${imgName}`}
                  alt="Beekeeping Activity"
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
