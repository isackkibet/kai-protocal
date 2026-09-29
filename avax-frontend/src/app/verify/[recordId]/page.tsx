import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ShieldCheck, ShieldAlert, Clock, Link2 } from 'lucide-react';
import { getPrisma } from '@/lib/db';
import { checkRecordIntegrity } from '@/lib/mrv/records';
import { HUB_THEME as C, MONO, SERIF } from '@/lib/hub-theme';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Verify a conservation record | KAI Nuvari',
  description: 'Check a conservation record against its SHA-256 fingerprint and version history.',
};

const VERIFICATION_TEXT: Record<string, string> = {
  SUBMITTED: 'Submitted. Not yet verified by Hedera Guardian.',
  UNDER_REVIEW: 'Under review in Hedera Guardian.',
  VERIFIED: 'Verified by Hedera Guardian against the methodology.',
  REJECTED: 'Rejected in verification. A corrected version can be submitted.',
};
const ANCHOR_TEXT: Record<string, string> = {
  NOT_ANCHORED: 'No proof on Avalanche yet.',
  ANCHOR_PENDING: 'Proof is being written to Avalanche.',
  ANCHORED: 'Proof anchored on Avalanche Fuji.',
  ANCHOR_FAILED: 'Writing the proof to Avalanche failed; it will be retried.',
};

const card: React.CSSProperties = { border: `1px solid ${C.hairline}`, borderRadius: 12, padding: '16px 18px', background: C.card };
const label: React.CSSProperties = { ...MONO, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: C.goldLight, fontWeight: 600, margin: 0 };
const hash: React.CSSProperties = { ...MONO, fontSize: 12, wordBreak: 'break-all', margin: '4px 0 0', color: C.paperDim };

function fmt(d: Date | string) {
  return new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC';
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ minHeight: '100dvh', background: C.bg, color: C.paper, fontFamily: "'IBM Plex Sans', sans-serif", padding: '0 16px 80px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', paddingTop: 36 }}>
        <Link href="/cfa" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: C.inkLight, fontSize: 13, textDecoration: 'none', marginBottom: 24 }}>
          <ArrowLeft size={14} /> Back
        </Link>
        {children}
      </div>
    </main>
  );
}

export default async function VerifyRecordPage({ params }: { params: Promise<{ recordId: string }> }) {
  const { recordId } = await params;
  const prisma = await getPrisma();

  const record = prisma
    ? await prisma.conservationRecord.findUnique({
        where: { id: recordId },
        include: { versions: { orderBy: { version: 'asc' } }, forest: { select: { name: true } } },
      }).catch(() => null)
    : null;

  // Real 404 status (not a 200 page that says "not found").
  if (!record) notFound();

  const integrity = await checkRecordIntegrity(prisma!, recordId);
  const latest = record.versions[record.versions.length - 1];
  const data = (latest?.data ?? {}) as Record<string, unknown>;
  const species = (data.species as { name?: string } | undefined)?.name;
  const ok = integrity?.ok ?? false;

  return (
    <Shell>
      <p style={label}>Conservation record · {record.recordType.toLowerCase()}</p>
      <h1 style={{ ...SERIF, fontSize: 26, fontWeight: 700, margin: '8px 0 4px', lineHeight: 1.25 }}>
        {record.recordType === 'PLANTING' && typeof data.quantity === 'number'
          ? `${data.quantity.toLocaleString()} ${species ?? 'seedlings'} planted`
          : 'Conservation record'}
      </h1>
      <p style={{ color: C.inkLight, fontSize: 13, margin: 0 }}>
        {record.forest.name}
        {typeof data.plantedAt === 'string' ? ` · ${fmt(data.plantedAt)}` : ''}
      </p>

      <section style={{ ...card, marginTop: 22, borderColor: ok ? C.pineLight : C.red, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {ok ? <ShieldCheck size={20} color={C.goldLight} style={{ flexShrink: 0, marginTop: 2 }} /> : <ShieldAlert size={20} color={C.red} style={{ flexShrink: 0, marginTop: 2 }} />}
        <div>
          <p style={{ margin: 0, fontWeight: 700 }}>{ok ? 'Data matches its fingerprint' : 'Integrity check failed'}</p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: C.inkLight, lineHeight: 1.55 }}>
            {ok
              ? `Every version's SHA-256 was recomputed just now and matches, and each correction links to the one before it. Checked across ${record.versions.length} version${record.versions.length === 1 ? '' : 's'}.`
              : (integrity?.problems ?? ['Could not check this record.']).join(' ')}
          </p>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 12 }}>
        <div style={card}>
          <p style={label}>Verification</p>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, lineHeight: 1.5 }}>{VERIFICATION_TEXT[record.verificationStatus]}</p>
        </div>
        <div style={card}>
          <p style={label}>Blockchain proof</p>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, lineHeight: 1.5 }}>{ANCHOR_TEXT[record.anchorStatus]}</p>
          {record.avalancheTxHash && (
            <a href={`https://testnet.snowtrace.io/tx/${record.avalancheTxHash}`} target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, color: C.goldLight, fontSize: 12.5, textDecoration: 'none' }}>
              <Link2 size={13} /> View transaction
            </a>
          )}
        </div>
      </section>

      <section style={{ ...card, marginTop: 12 }}>
        <p style={label}>Current fingerprint (SHA-256)</p>
        <p style={hash}>{record.dataHash}</p>
      </section>

      <h2 style={{ ...SERIF, fontSize: 18, fontWeight: 600, margin: '30px 0 10px' }}>Version history</h2>
      <p style={{ color: C.inkLight, fontSize: 13, margin: '0 0 12px', lineHeight: 1.55 }}>
        Records are never edited. A correction is added as a new version that points to the fingerprint of the one before it.
      </p>
      {record.versions.map((v) => {
        const check = integrity?.versions.find((x) => x.version === v.version);
        return (
          <div key={v.id} style={{ ...card, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <p style={{ margin: 0, fontWeight: 700 }}>Version {v.version}{v.reason ? ` · ${v.reason}` : ''}</p>
              <p style={{ margin: 0, fontSize: 12, color: C.inkLight, display: 'inline-flex', alignItems: 'center', gap: 5 }}><Clock size={12} /> {fmt(v.createdAt)}</p>
            </div>
            <p style={{ ...label, marginTop: 12, color: C.inkLight }}>Fingerprint {check?.hashMatches ? '✓ matches' : '✗ does not match'}</p>
            <p style={hash}>{v.dataHash}</p>
            {v.previousHash && (
              <>
                <p style={{ ...label, marginTop: 10, color: C.inkLight }}>Previous version {check?.chainMatches ? '✓ linked' : '✗ broken link'}</p>
                <p style={hash}>{v.previousHash}</p>
              </>
            )}
            <details style={{ marginTop: 10 }}>
              <summary style={{ cursor: 'pointer', fontSize: 12.5, color: C.goldLight }}>Show recorded data</summary>
              <pre style={{ ...MONO, fontSize: 11.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: '8px 0 0', color: C.paperDim }}>
                {JSON.stringify(v.data, null, 2)}
              </pre>
            </details>
          </div>
        );
      })}

      <p style={{ color: C.inkLight, fontSize: 12.5, marginTop: 24, lineHeight: 1.6 }}>
        Check it yourself: sort the keys of the recorded data, remove all whitespace (RFC 8785 canonical JSON), and take the SHA-256.
        The result must equal the fingerprint above.
      </p>
    </Shell>
  );
}
