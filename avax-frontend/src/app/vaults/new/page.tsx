import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Vault } from 'lucide-react';
import CreateVaultForm from '@/components/defi/CreateVaultForm';

export const metadata: Metadata = {
  title: 'Create a Vault | KAI Nuvari',
  description: 'DeFi admins deploy a new KAI yield vault from their own wallet.',
};

/** /vaults/new — create_vault (Ecosystem PRD v1.1 §4.15, Phase 2). */
export default function NewVaultPage() {
  return (
    <main style={{ minHeight: '100dvh', background: '#0B1C14', color: '#F6F2E7', fontFamily: "'Poppins', 'IBM Plex Sans', var(--font-sans)", padding: '0 16px 110px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', paddingTop: 24 }}>
        <Link href="/vaults" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#9BA396', fontSize: 13, textDecoration: 'none', marginBottom: 20 }}>
          <ArrowLeft size={14} /> Vaults
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <Vault size={22} color="#E4C878" strokeWidth={1.7} />
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Create a vault</h1>
        </div>
        <p style={{ color: '#9BA396', fontSize: 13, margin: '0 0 24px', lineHeight: 1.6 }}>
          For DeFi admins. Your wallet deploys the vault contract on Avalanche Fuji and becomes its owner; the app then checks the
          deployment and lists the vault. The server never holds a key.
        </p>
        <CreateVaultForm />
      </div>
    </main>
  );
}
