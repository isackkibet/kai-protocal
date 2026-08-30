import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ClientProviders } from '@/components/providers/ClientProviders';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Nuvari DeFi — Avalanche C-Chain Wallet',
  description: 'Automated DeFi operating system on Avalanche C-Chain. Yield vaults, governance DAO, and smart savings products.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} gradient-bg text-white min-h-[100dvh]`}>
        <ClientProviders>
          <div className="app-shell">
            {children}
          </div>
        </ClientProviders>
      </body>
    </html>
  );
}
