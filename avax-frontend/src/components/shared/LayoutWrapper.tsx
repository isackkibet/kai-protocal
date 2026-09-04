"use client";

import { usePathname } from 'next/navigation';
import BottomNav from '@/components/shared/BottomNav';

const FULLSCREEN_ROUTES = ['/nuvari', '/ai', '/chat'];

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullscreen = FULLSCREEN_ROUTES.some(r => pathname?.startsWith(r));

  if (isFullscreen) {
    return (
      <div style={{ width: '100%', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="layout-center">
        <main style={{ flex: 1, paddingBottom: 80 }}>
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
