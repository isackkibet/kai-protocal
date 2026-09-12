import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { ClientProviders } from '@/components/providers/ClientProviders';
import LayoutWrapper from '@/components/shared/LayoutWrapper';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
const plexMono = IBM_Plex_Mono({ variable: '--font-plex-mono', subsets: ['latin'], weight: ['400', '500', '700'] });

export const metadata: Metadata = {
  title: 'KAI Nuvari - Avalanche C-Chain DeFi Ecosystem',
  description: 'Forest-finance DeFi on Avalanche. Yield vaults, AMM pools, community commodities, DAO governance, and M-Pesa payments.',
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
      <body className={`${geistSans.variable} ${geistMono.variable} ${plexMono.variable} text-white min-h-[100dvh]`}>
        <ClientProviders>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </ClientProviders>
      </body>
    </html>
  );
}


