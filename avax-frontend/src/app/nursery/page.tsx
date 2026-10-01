import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Sprout } from 'lucide-react';
import NurseryTab from '@/components/cfa/NurseryTab';
import Workspace from '@/components/workspace/Workspace';

export const metadata: Metadata = {
  title: 'Oloolua CFA Nursery | KAI Nuvari',
  description: 'Record seedling batches, plantings, nursery work and survival checks for Oloolua Community Forest Association.',
};

/**
 * /nursery — the Oloolua CFA nursery on its own page.
 *
 * The /cfa dashboard mixes this (real data, Kanuvari nursery DB) with tabs of
 * sample data, which made the nursery hard to find and easy to mistake for
 * the samples. This page shows only the real nursery.
 */
export default function NurseryPage() {
  return (
    <main style={{ minHeight: '100dvh', background: '#0B1C14', color: '#F6F2E7', fontFamily: "'Poppins', 'IBM Plex Sans', var(--font-sans)", padding: '0 16px 110px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', paddingTop: 24 }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#9BA396', fontSize: 13, textDecoration: 'none', marginBottom: 20 }}>
          <ArrowLeft size={14} /> Home
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <Sprout size={22} color="#E4C878" strokeWidth={1.7} />
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Oloolua CFA Nursery</h1>
        </div>
        <p style={{ color: '#9BA396', fontSize: 13, margin: '0 0 28px', lineHeight: 1.6 }}>
          Record the seedlings you raise, when they are planted, the work done in the nursery, and how many survive.
          Every entry is saved under your name.
        </p>

        {/* The Nursery AI lives here; the main KAI assistant stays on the rest of the app. */}
        <section aria-label="Nursery AI" style={{ marginBottom: 32 }}>
          <Workspace embedded />
        </section>

        <NurseryTab />
      </div>
    </main>
  );
}
