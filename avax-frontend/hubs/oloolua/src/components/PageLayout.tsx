'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV_LINKS = [
  { label: 'Home',          href: '/' },
  { label: 'About',         href: '/about' },
  { label: 'Mission',       href: '/mission' },
  { label: 'Vision',        href: '/vision' },
  { label: 'Activities',    href: '/activities' },
  { label: 'Projects',      href: '/projects' },
  { label: 'Seedlings & Nursery', href: '/seedlings' },
  { label: 'Community',     href: '/workshops' },
  { label: 'Guardian Portal', href: '/portal' },
];

function SiteNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav style={{ background: '#1b4332', padding: '0', position: 'sticky', top: 0, zIndex: 1000, boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 64 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#f6f2e7', fontWeight: 700, fontSize: '1.1rem' }}>
          <img src="/assets/images/logo.jpeg" alt="Oloolua Youth Guardians logo" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e4c878' }} />
          Oloolua Youth Guardians
        </Link>

        {/* Mobile toggle */}
        <button onClick={() => setMenuOpen(!menuOpen)} style={{ display: 'none', background: 'none', border: 'none', color: '#f6f2e7', fontSize: '1.5rem', cursor: 'pointer' }} className="nav-mobile-btn">
          ☰
        </button>

        <ul style={{ display: 'flex', listStyle: 'none', margin: 0, padding: 0, gap: '0.25rem', flexWrap: 'wrap' }}>
          {NAV_LINKS.map(({ label, href }) => {
            const isActive = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  style={{
                    color: isActive ? '#e4c878' : '#f6f2e7',
                    textDecoration: 'none',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 6,
                    fontWeight: isActive ? 700 : 400,
                    fontSize: '0.875rem',
                    display: 'block',
                    borderBottom: isActive ? '2px solid #e4c878' : '2px solid transparent',
                    transition: 'color 0.2s, border-color 0.2s',
                  }}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .nav-mobile-btn { display: block !important; }
        }
      `}</style>
    </nav>
  );
}

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

function SiteFooter() {
  return (
    <footer style={{ background: '#060f0a', borderTop: '1px solid rgba(228,200,120,0.15)', padding: '3rem 1.5rem 1.5rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
        <div>
          <h3 style={{ color: '#f6f2e7', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 8 }}>🌳 Oloolua Youth Guardians</h3>
          <p style={{ color: '#a0c4b4', fontSize: '0.85rem', lineHeight: 1.6 }}>Pioneering green conservation finance through community, art, and decentralized trust.</p>
          <div style={{ marginTop: '1rem', color: '#888', fontSize: '0.8rem', lineHeight: 2 }}>
            <div>📞 0112583681</div>
            <div>📞 0742004641</div>
            <div>📞 0725772240</div>
            <div>✉️ austinnamuye@gmail.com</div>
          </div>
        </div>
        <div>
          <h3 style={{ color: '#f6f2e7', marginBottom: '0.75rem' }}>Quick Links</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[['About Us', '/about'], ['Mission', '/mission'], ['Vision', '/vision'], ['Activities', '/activities'], ['Seedlings & Nursery', '/seedlings'], ['Contact', '/#contact']].map(([label, href]) => (
              <li key={label}>
                <Link href={href} style={{ color: '#a0c4b4', textDecoration: 'none', fontSize: '0.85rem' }}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 style={{ color: '#f6f2e7', marginBottom: '0.75rem' }}>Connect With Us</h3>
          <a
            href="https://www.instagram.com/oloolua_forest_youth_guardians?igsh=MXBkaXpyd2tuMTQ1Mw=="
            target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)', color: '#fff', padding: '0.5rem 1rem', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}
          >
            📷 Instagram
          </a>
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', color: '#444', fontSize: '0.8rem' }}>
        © 2026 Oloolua Youth Guardians. All rights reserved.
      </div>
    </footer>
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
      <SiteNav />
      {showHeader && title && <PageHeader title={title} subtitle={subtitle} bgImage={bgImage} />}
      <main style={{ flex: 1 }}>{children}</main>
      <SiteFooter />
    </div>
  );
}
