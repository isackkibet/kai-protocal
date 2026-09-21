import Link from 'next/link';
import {
  ArrowLeft, Bot, CircleDollarSign, Droplets, FlaskConical, Gift,
  Globe, ImageIcon, LayoutGrid, Link2, Lock, Mic, ScanLine, ShieldCheck,
} from 'lucide-react';

/* Same palette/fonts as the home page — pine + gold + paper, Poppins heads. */
const C = {
  bg: '#0B1C14',
  gold: '#C89B3C',
  goldLight: '#E4C878',
  paper: '#F6F2E7',
  paperDim: '#EFE9D9',
  ink: '#1B1A14',
  inkLight: '#9BA396',
  hairline: 'rgba(200,155,60,0.14)',
};
const MONO = { fontFamily: "'IBM Plex Mono', monospace" } as const;
const POPPIN = { fontFamily: "'Poppins', sans-serif" } as const;

const label: React.CSSProperties = { ...MONO, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: C.goldLight, fontWeight: 600, margin: '0 0 16px' };

const GROUPS = [
  {
    title: 'Agents',
    items: [
      { name: 'Voice Agent', href: '/voice', icon: Mic },
      { name: 'AI Agent',    href: '/ai',    icon: Bot },
    ],
  },
  {
    title: 'DeFi · Earn',
    items: [
      { name: 'Securities', href: '/securities', icon: ShieldCheck },
      { name: 'Pools',      href: '/pools',      icon: Droplets },
      { name: 'Vaults',     href: '/vaults',     icon: Lock },
      { name: 'TaaS',       href: '/taas',       icon: LayoutGrid },
    ],
  },
  {
    title: 'Shop · Pay',
    items: [
      { name: 'Scan & Pay', href: '/pay',      icon: ScanLine },
      { name: 'Products',   href: '/products', icon: CircleDollarSign },
      { name: 'NFT Mkt',    href: '/connft',   icon: ImageIcon },
      { name: 'Airdrop',    href: '/mine',     icon: Gift },
    ],
  },
  {
    title: 'Explore',
    items: [
      { name: 'Playground', href: '/nuvari', icon: FlaskConical },
      { name: 'SDG Impact', href: '/sdg',    icon: Globe },
      { name: 'KAI Web',    href: '/kai',    icon: Link2 },
    ],
  },
];

export default function AppsPage() {
  return (
    <main style={{ minHeight: '100dvh', background: C.bg, color: C.paper, fontFamily: "'Poppins', 'IBM Plex Sans', var(--font-sans)", paddingBottom: 100 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
      `}</style>

      <div style={{ maxWidth: 1120, marginInline: 'auto', padding: '0 24px', boxSizing: 'border-box' }}>

        <div style={{ paddingTop: 28, display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/" style={{ color: C.inkLight, display: 'flex', alignItems: 'center' }} aria-label="Back to home">
            <ArrowLeft size={20} />
          </Link>
          <p style={{ ...MONO, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: C.goldLight, fontWeight: 600, margin: 0 }}>
            Quick actions
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 22, marginBottom: 40 }}>
          <LayoutGrid size={26} color={C.goldLight} strokeWidth={1.6} />
          <h1 style={{ ...POPPIN, fontSize: 34, fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>
            Apps &amp; Actions
          </h1>
        </div>
        <p style={{ fontSize: 15, color: C.inkLight, margin: '-24px 0 44px', maxWidth: 480, lineHeight: 1.6 }}>
          Everything KAI in one place. Pick an app to open it — no scrolling through a long list.
        </p>

        {GROUPS.map(g => {
          return (
            <section key={g.title} style={{ marginBottom: 48 }}>
              <p style={label}>{g.title}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 14 }}>
                {g.items.map(a => {
                  const A = a.icon;
                  const tile = (
                    <>
                      <A size={26} strokeWidth={1.6} style={{ color: C.goldLight, marginBottom: 4 }} />
                      <span style={{ fontSize: 16, fontWeight: 600, color: C.paper, lineHeight: 1.35 }}>{a.name}</span>
                    </>
                  );
                  const isAgent = a.href === '/ai';
                  return isAgent ? (
                    <Link key={a.name} href="/ai" className="apps-tile">{tile}</Link>
                  ) : (
                    <Link key={a.name} href={a.href} className="apps-tile">{tile}</Link>
                  );
                })}
              </div>
            </section>
          );
        })}

      </div>
    </main>
  );
}