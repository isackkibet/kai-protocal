"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import BottomNav from '@/components/shared/BottomNav';
import GlobalVoiceAssistant from '@/components/GlobalVoiceAssistant';
import PaymentApprovalModal from '@/components/PaymentApprovalModal';
import { useX402ApprovalStore } from '@/store/useX402ApprovalStore';

// Pages that own their own fullscreen / custom shell
const FULLSCREEN_ROUTES = ['/nuvari'];

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullscreen = FULLSCREEN_ROUTES.some(r => pathname?.startsWith(r));
  const { isOpen, setOpen, autonomousActive, fetchPayments } = useX402ApprovalStore();

  // Background Autonomous Agent Polling & Execution Loop
  useEffect(() => {
    if (!autonomousActive) return;
    const interval = setInterval(() => {
      fetchPayments();
    }, 8000); // Check and auto-execute pending every 8 seconds
    return () => clearInterval(interval);
  }, [autonomousActive, fetchPayments]);

  if (isFullscreen) {
    return (
      <div style={{ width: '100%', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        {children}
        <GlobalVoiceAssistant />
        {isOpen && <PaymentApprovalModal onClose={() => setOpen(false)} />}
      </div>
    );
  }

  return (
    <>
      <div style={{ width: '100%', minHeight: '100dvh', position: 'relative' }}>
        {children}
      </div>
      <GlobalVoiceAssistant />
      <BottomNav />
      {isOpen && <PaymentApprovalModal onClose={() => setOpen(false)} />}
    </>
  );
}
