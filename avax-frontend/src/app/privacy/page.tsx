import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy & Data | Kanuvari',
  description: 'What Kanuvari collects, why, who can see it, and your rights under Kenya’s Data Protection Act, 2019.',
};

const h2: React.CSSProperties = { fontSize: 17, fontWeight: 700, margin: '28px 0 8px' };
const p: React.CSSProperties = { fontSize: 14, lineHeight: 1.7, margin: '0 0 10px', color: '#EFE9D9', maxWidth: '68ch' };
const li: React.CSSProperties = { fontSize: 14, lineHeight: 1.7, color: '#EFE9D9' };

/**
 * /privacy — plain-language notice for community and location data
 * (recommended in "Kanuvari | Guardian Setup & AI Architecture"). It states
 * what the app actually does today; it is a draft for legal review.
 */
export default function PrivacyPage() {
  return (
    <main style={{ minHeight: '100dvh', background: '#0B1C14', color: '#F6F2E7', fontFamily: "'Poppins', 'IBM Plex Sans', var(--font-sans)", padding: '0 16px 110px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', paddingTop: 24 }}>
        <Link href="/workspace" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#9BA396', fontSize: 13, textDecoration: 'none', marginBottom: 20 }}>
          <ArrowLeft size={14} /> Kanuvari
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 6px' }}>Privacy &amp; your data</h1>
        <p style={{ ...p, color: '#9BA396' }}>Kanuvari is the conservation data app of Kaibar Nuvari. This page explains, in plain words, what we keep about you and the work of your Community Forest Association (CFA). Draft, October 2026: to be reviewed by a lawyer before public launch.</p>

        <h2 style={h2}>What we collect</h2>
        <ul>
          <li style={li}><strong>Your account:</strong> name and email from your Google sign-in, and your wallet address if you connect one.</li>
          <li style={li}><strong>CFA membership:</strong> your role (member, verifier, admin…) and status.</li>
          <li style={li}><strong>Conservation records:</strong> seedlings, planting, nursery work, survival checks, transfers and losses, with who recorded them and when.</li>
          <li style={li}><strong>Photos and documents</strong> you attach, with a fingerprint (SHA-256) of each file and the time the photo was taken.</li>
          <li style={li}><strong>Location:</strong> only if you tick “Add my location to the photos”. Nursery GPS is entered by CFA admins.</li>
          <li style={li}><strong>What you type or say to the AI.</strong> Speech is turned into text by your phone’s browser; we receive the text, not the recording.</li>
        </ul>

        <h2 style={h2}>Why</h2>
        <p style={p}>To record, check and prove your CFA’s conservation work, so it can be trusted by partners and funders. We do not sell personal data.</p>

        <h2 style={h2}>Who can see it</h2>
        <ul>
          <li style={li}>Members of your CFA see nursery records. Admins, verifiers and auditors also see the member list and the change history.</li>
          <li style={li}>Each verified record has a public proof page (/verify) showing the record’s data and fingerprints, the verifier’s name, and file fingerprints — not the photos themselves, which only CFA members can open.</li>
          <li style={li}>When a batch of verified records is anchored on the Avalanche test network, only a fingerprint (a hash) goes on the public blockchain. It contains no names or photos, but it cannot be removed.</li>
          <li style={li}>To answer you, your message and the facts the AI looks up are sent to an AI provider (Google Gemini, Groq or NVIDIA), which may process them outside Kenya. Do not type ID numbers, passwords or wallet seed phrases.</li>
        </ul>

        <h2 style={h2}>How long we keep it</h2>
        <p style={p}>Conservation records and their change history are kept for as long as the CFA uses Kanuvari, because proof depends on them. Your chats in the workspace are kept only on your own phone or computer; you can delete them from the sidebar.</p>

        <h2 style={h2}>Your rights (Data Protection Act, 2019)</h2>
        <ul>
          <li style={li}>To be told how your data is used (this page).</li>
          <li style={li}>To see the personal data we hold about you, and to have mistakes corrected.</li>
          <li style={li}>To object to processing, and to ask for deletion. Records already verified or anchored are corrected by adding a new version rather than deleted, so the history stays honest; your personal details can still be removed from your member profile.</li>
          <li style={li}>To complain to the Office of the Data Protection Commissioner (ODPC) in Kenya.</li>
        </ul>
        <p style={p}>To use these rights, ask your CFA admin, who can reach the Kanuvari team.</p>
      </div>
    </main>
  );
}
