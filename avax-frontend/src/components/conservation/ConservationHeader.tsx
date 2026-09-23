'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Leaf } from 'lucide-react';
import { usePrivyAuth } from '@/lib/privy-auth';
import { HUB_THEME, MONO, SERIF } from '@/lib/hub-theme';

const NAV = [
  { href: '/conservation', label: 'Home' },
  { href: '/conservation/knowledge', label: 'Knowledge' },
  { href: '/conservation/methodologies', label: 'Methodologies' },
  { href: '/conservation/resources', label: 'Resources' },
  { href: '/conservation/ask', label: 'Ask KAI' },
];

export default function ConservationHeader() {
  const pathname = usePathname();
  const { authenticated, ready, signInWithEmail, name } = usePrivyAuth();

  return (
    <header style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '28px 0 20px', borderBottom: `1px solid ${HUB_THEME.hairline}`, flexWrap: 'wrap' }}>
      <Link href="/conservation" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: HUB_THEME.pineLight, color: HUB_THEME.paper, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Leaf size={18} />
        </div>
        <div>
          <span style={{ ...SERIF, fontSize: 22, fontWeight: 600, color: HUB_THEME.paper, lineHeight: 1 }}>KAI Nuvari</span>
          <span style={{ ...MONO, fontSize: 9, letterSpacing: 1.4, color: HUB_THEME.goldLight, display: 'block', marginTop: 2 }}>CONSERVATION / CFA HUB</span>
        </div>
      </Link>

      <nav style={{ display: 'flex', gap: 18, marginLeft: 18, flexWrap: 'wrap' }}>
        {NAV.map(n => {
          const active = n.href === '/conservation' ? pathname === '/conservation' : pathname.startsWith(n.href);
          return (
            <Link key={n.href} href={n.href}
              style={{ ...MONO, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', textDecoration: 'none',
                color: active ? HUB_THEME.goldLight : HUB_THEME.inkLight, fontWeight: active ? 600 : 400,
                borderBottom: active ? `2px solid ${HUB_THEME.gold}` : '2px solid transparent', paddingBottom: 4 }}>
              {n.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Link href="/hub" style={{ ...MONO, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', textDecoration: 'none', color: HUB_THEME.inkLight }}>
          SIHU ↗
        </Link>
        {ready && !authenticated ? (
          <button onClick={() => { signInWithEmail(); }}
            style={{ ...MONO, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', background: HUB_THEME.gold, color: HUB_THEME.ink, border: 'none', borderRadius: 999, padding: '9px 18px', cursor: 'pointer', fontWeight: 600 }}>
            Sign in
          </button>
        ) : (
          <span style={{ ...MONO, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: HUB_THEME.goldLight }}>
            {name?.split(' ')[0] ?? '●'}
          </span>
        )}
      </div>
    </header>
  );
}