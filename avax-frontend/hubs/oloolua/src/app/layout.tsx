import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import KaiTopBar from '@/components/KaiTopBar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'OLOOLUA YOUTH GUARDIANS | KAI Conservation Information Hub',
  description: 'Oloolua Forest Community Forest Association (CFA) Seedling User Group - Protecting and preserving natural heritage through nursery operations and community conservation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0b1c14] text-[#f6f2e7] flex flex-col min-h-screen antialiased">
        <KaiTopBar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
