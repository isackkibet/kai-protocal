'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Leaf } from 'lucide-react';
import { usePrivyAuth } from '@/lib/auth/privy-auth';
import { HUB_THEME, SANS, SERIF } from '@/lib/hubs/hub-theme';

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
          <span style={{ ...SANS, fontSize: 12.5, color: HUB_THEME.goldLight, display: 'block', marginTop: 2, fontWeight: 600 }}>Oloolua Conservation Hub</span>
        </div>
      </Link>

      <nav style={{ display: 'flex', gap: 6, flexWrap: 'wrap', width: '100%', order: 3 }}>
        {NAV.map(n => {
          const active = n.href === '/conservation' ? pathname === '/conservation' : pathname.startsWith(n.href);
          return (
            <Link key={n.href} href={n.href}
              style={{ ...SANS, fontSize: 14, textDecoration: 'none', padding: '8px 14px', borderRadius: 999,
                color: active ? '#1B1A14' : HUB_THEME.paperDim, background: active ? HUB_THEME.gold : 'rgba(246,242,231,0.07)',
                fontWeight: 600 }}>
              {n.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Link href="/hubs" style={{ ...SANS, fontSize: 13.5, fontWeight: 600, textDecoration: 'none', color: HUB_THEME.paperDim }}>
          All hubs
        </Link>
        {ready && !authenticated ? (
          <button onClick={() => { signInWithEmail(); }}
            style={{ ...SANS, fontSize: 13.5, background: HUB_THEME.gold, color: HUB_THEME.ink, border: 'none', borderRadius: 999, padding: '9px 18px', cursor: 'pointer', fontWeight: 700 }}>
            Sign in
          </button>
        ) : (
          <span style={{ ...SANS, fontSize: 13.5, fontWeight: 600, color: HUB_THEME.goldLight }}>
            {name?.split(' ')[0] ?? '●'}
          </span>
        )}
      </div>
    </header>
  );
}