import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Sprout } from 'lucide-react';
import NurseryTab from '@/components/cfa/NurseryTab';
import Workspace from '@/components/workspace/Workspace';

export const metadata: Metadata = {
  title: 'Oloolua CFA · Nursery Groups | KAI Nuvari',
  description: 'Oloolua Community Forest Association nursery groups: seedling batches, plantings, nursery work and survival checks.',
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
    <main style={{ minHeight: '100dvh', background: '#0E2418', color: '#F6F2E7', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* The Nursery AI fills the screen when the page opens; the main KAI
          assistant stays on the rest of the app. */}
      <section aria-label="Nursery AI">
        <Workspace embedded fullScreen />
      </section>

      {/* Records and forms, one scroll (or "Records ↓") below. */}
      <div id="nursery-records" style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px 110px', scrollMarginTop: 12 }}>
        {/* Community Forest Association → Nursery Groups. Built so other kinds of
            conservation group (patrols, beekeepers...) can sit beside nursery groups later. */}
        <nav aria-label="Breadcrumb" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, fontSize: 13, color: '#9BA396', marginBottom: 10 }}>
          <Link href="/hubs" style={{ color: '#9BA396', textDecoration: 'none' }}>Information Hubs</Link>
          <span aria-hidden="true">›</span>
          <span>Oloolua Community Forest Association</span>
          <span aria-hidden="true">›</span>
          <span style={{ color: '#E4C878', fontWeight: 600 }}>Nursery groups</span>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <Sprout size={22} color="#E4C878" strokeWidth={1.7} />
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Nursery groups</h1>
        </div>
        <p style={{ color: '#9BA396', fontSize: 13, margin: '0 0 28px', lineHeight: 1.6 }}>
          Each nursery group records the seedlings it raises, when they are planted, the work done and how many survive.
          Every entry is saved under your name, checked by a CFA verifier and then published with its proof.
        </p>
        <NurseryTab />
        <p style={{ marginTop: 32 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#9BA396', fontSize: 13, textDecoration: 'none' }}>
            <ArrowLeft size={14} /> Home
          </Link>
        </p>
      </div>
    </main>
  );
}
