import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import VerificationDesk from '@/components/mrv/VerificationDesk';

export const metadata: Metadata = {
  title: 'Verification Desk | KAI Nuvari',
  description: 'Review, correct and anchor Oloolua CFA conservation records.',
};

/**
 * /mrv — verification desk for the Oloolua CFA (Kanuvari Tools & Agents PRD
 * phases 7-9): human review, corrections, and Avalanche anchoring.
 */
export default function MrvPage() {
  return (
    <main style={{ minHeight: '100dvh', background: '#0B1C14', color: '#F6F2E7', fontFamily: "'Poppins', 'IBM Plex Sans', var(--font-sans)", padding: '0 16px 110px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', paddingTop: 24 }}>
        <Link href="/nursery" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#9BA396', fontSize: 13, textDecoration: 'none', marginBottom: 20 }}>
          <ArrowLeft size={14} /> Nursery
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <ShieldCheck size={22} color="#E4C878" strokeWidth={1.7} />
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Verification Desk</h1>
        </div>
        <p style={{ color: '#9BA396', fontSize: 13, margin: '0 0 24px', lineHeight: 1.6 }}>
          Plantings and survival checks are checked by a CFA verifier (never the person who recorded them), then their
          fingerprints are written to Avalanche so anyone can confirm they were not changed.
        </p>
        <VerificationDesk />
      </div>
    </main>
  );
}
