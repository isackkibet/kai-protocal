"use client";

import { usePathname } from 'next/navigation';
import BottomNav from '@/components/shared/BottomNav';
import AIChatOverlay from '@/components/ai/AIChatOverlay';

const FULLSCREEN_ROUTES = ['/nuvari', '/ai', '/chat'];
/* Exact matches only — '/kai' would otherwise prefix-match '/kai-bar' */
const FULLSCREEN_EXACT_ROUTES = ['/kai'];

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullscreen = FULLSCREEN_ROUTES.some(r => pathname?.startsWith(r))
    || FULLSCREEN_EXACT_ROUTES.includes(pathname ?? '');

  if (isFullscreen) {
    return (
      <div style={{ width: '100%', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        {children}
        <AIChatOverlay />
      </div>
    );
  }

  return (
    <>
      {/* Full-bleed shell — no max-width cap so desktop fills the screen */}
      <div style={{ width: '100%', minHeight: '100dvh', position: 'relative' }}>
        {children}
      </div>
      <BottomNav />
      <AIChatOverlay />
    </>
  );
}
