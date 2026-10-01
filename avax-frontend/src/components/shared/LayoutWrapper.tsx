"use client";

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import BottomNav from '@/components/shared/BottomNav';
const AIChatOverlay = dynamic(() => import('@/components/ai/AIChatOverlay'), { ssr: false });

const FULLSCREEN_ROUTES = ['/nuvari', '/ai', '/chat', '/voice', '/workspace', '/nursery'];
/* Pages that ARE an AI chat: the floating AI button would only cover their input bar. */
const NO_AI_OVERLAY_ROUTES = ['/workspace', '/nursery'];
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
        {!NO_AI_OVERLAY_ROUTES.some((r) => pathname?.startsWith(r)) && <AIChatOverlay />}
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
