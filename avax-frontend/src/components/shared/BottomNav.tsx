'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Bot, Gift, UserCircle2, Newspaper } from 'lucide-react';

const NAV = [
  { name: 'Home',    href: '/',        icon: Home        },
  { name: 'Airdrop', href: '/mine',    icon: Gift        },
  { name: 'Info Hub', href: '/hub',   icon: Newspaper   },
  { name: 'Profile', href: '/profile', icon: UserCircle2 },
  { name: 'Agent',   href: '/ai',      icon: Bot         },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav className="bottom-nav">
      {NAV.map(({ name, href, icon: Icon }) => {
        const active = href === '/' ? path === '/' : path?.startsWith(href);
        return (
          <Link key={name} href={href} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 4, textDecoration: 'none',
            position: 'relative', padding: '4px 8px', borderRadius: 14,
            minWidth: 48, transition: 'all 0.2s ease',
            background: active ? 'rgba(232,65,66,0.10)' : 'transparent',
          }}>
            {active && <span style={{
              position: 'absolute', top: 0, left: '20%', right: '20%',
              height: 2, borderRadius: '0 0 4px 4px',
              background: 'linear-gradient(90deg, transparent, #e84142, transparent)',
            }} />}
            <Icon size={20} strokeWidth={active ? 2.4 : 1.7}
              color={active ? '#e84142' : 'rgba(255,255,255,0.32)'}
              style={{ transition: 'all 0.2s', transform: active ? 'scale(1.08)' : 'scale(1)' }} />
            <span style={{
              fontSize: 8.5, fontWeight: active ? 800 : 500, letterSpacing: 0.3,
              color: active ? '#e84142' : 'rgba(255,255,255,0.30)', transition: 'all 0.2s',
            }}>{name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
