'use client';

import Navigation from './Navigation';

function PageHeader({ title, subtitle, bgImage }: { title: string; subtitle?: string; bgImage?: string }) {
  return (
    <header style={{
      background: bgImage
        ? `linear-gradient(rgba(27,67,50,0.82), rgba(27,67,50,0.82)), url('${bgImage}') center/cover`
        : 'linear-gradient(135deg, #1b4332 0%, #0b1c14 100%)',
      padding: '4rem 1.5rem',
      textAlign: 'center',
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ color: '#f6f2e7', fontSize: '2.5rem', fontWeight: 800, margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ color: '#a0c4b4', marginTop: '0.75rem', fontSize: '1.1rem' }}>{subtitle}</p>}
      </div>
    </header>
  );
}

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  bgImage?: string;
  showHeader?: boolean;
}

export default function PageLayout({ children, title, subtitle, bgImage, showHeader = true }: PageLayoutProps) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0b1c14', color: '#f6f2e7', fontFamily: "'Roboto', sans-serif" }}>
      <Navigation />
      {showHeader && title && <PageHeader title={title} subtitle={subtitle} bgImage={bgImage} />}
      {/* The root layout already provides <main> and the site footer. */}
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}
