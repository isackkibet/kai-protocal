"use client";

import { usePathname } from 'next/navigation';
import BottomNav from '@/components/shared/BottomNav';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPlayground = pathname?.startsWith('/playground');

  if (isPlayground) {
    return <div className="w-full min-h-[100dvh] flex flex-col">{children}</div>;
  }

  return (
    <div className="flex justify-center w-full min-h-[100dvh]">
      <div className="w-full max-w-[600px] min-h-[100dvh] relative flex flex-col overflow-x-hidden">
        <main className="flex-1 pb-24">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
