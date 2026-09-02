"use client";

import { usePathname } from 'next/navigation';
import BottomNav from '@/components/shared/BottomNav';

// Pages that own their own full-screen layout (no bottom nav, no max-width cap)
const FULLSCREEN_ROUTES = ['/nuvari', '/ai'];

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullscreen = FULLSCREEN_ROUTES.some(r => pathname?.startsWith(r));

  if (isFullscreen) {
    // Full bleed — page controls its own layout completely
    return (
      <div style={{ width: '100%', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div style={{
        width: '100%',
        maxWidth: 520,
        minHeight: '100dvh',
        margin: '0 auto',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflowX: 'hidden',
      }}>
        <main style={{ flex: 1, paddingBottom: 80 }}>
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
