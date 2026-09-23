import ConservationHeader from '@/components/conservation/ConservationHeader';
import { HUB_THEME, MONO } from '@/lib/hub-theme';
import Link from 'next/link';

/**
 * Shared visual shell for the Conservation / CFA Information Hub pages.
 * Server component — wraps children with the hub header and an editorial
 * footer; the nav/sign-in header is the only client island.
 */
export default function ConservationShell({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ minHeight: '100dvh', background: HUB_THEME.bg, color: HUB_THEME.paper, fontFamily: "'IBM Plex Sans', sans-serif", paddingBottom: 80 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@0,9..144,300..700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
      `}</style>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 28px' }}>
        <ConservationHeader />
        {children}
        <footer style={{ marginTop: 70, padding: '34px 0 20px', borderTop: `1px solid ${HUB_THEME.hairline}`, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <p style={{ ...MONO, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: HUB_THEME.goldLight, margin: 0 }}>
              KAI NUVARI · CONSERVATION / CFA INFORMATION HUB
            </p>
            <p style={{ fontSize: 12, color: HUB_THEME.inkLight, margin: '6px 0 0', maxWidth: 460, lineHeight: 1.6 }}>
              The hub connects, organizes, explains and verifies conservation work — it never replaces the CFAs,
              dashboards or communities that create it.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link href="/conservation/ask" style={{ ...MONO, fontSize: 11, color: HUB_THEME.inkLight, textDecoration: 'none' }}>Ask KAI</Link>
            <Link href="/conservation/methodologies" style={{ ...MONO, fontSize: 11, color: HUB_THEME.inkLight, textDecoration: 'none' }}>Methodologies</Link>
            <Link href="/hub" style={{ ...MONO, fontSize: 11, color: HUB_THEME.inkLight, textDecoration: 'none' }}>SIHU — stories &amp; tips</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}