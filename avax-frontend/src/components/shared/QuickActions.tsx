'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Bot, CircleDollarSign, Droplets, FlaskConical, Gift, Globe, ImageIcon, LayoutGrid, Link2, Lock, MessagesSquare, Mic,
  ScanLine, ShieldCheck, Sprout, type LucideIcon,
} from 'lucide-react';

/**
 * Home "Quick actions": every app as a tile with a line icon in a tinted
 * badge, what it does in a few words, and live numbers where they help
 * (seedlings in the nursery, records waiting for a verifier). Conservation
 * comes first so the nursery is easy to find.
 */

interface Item { name: string; hint: string; href: string; icon: LucideIcon; image?: string; live?: 'nursery' | 'verify' }
interface Group { title: string; tint: string; items: Item[] }

export const QUICK_GROUPS: Group[] = [
  {
    title: 'Conservation', tint: '#7DC383',
    items: [
      { name: 'Nursery', hint: 'Seedlings & planting', href: '/nursery', icon: Sprout, image: '/images/apps/nursery.jpg', live: 'nursery' },
      { name: 'Kanuvari AI', hint: 'Just say it', href: '/workspace', icon: MessagesSquare, image: '/images/apps/kanuvari-ai.jpg' },
      { name: 'Verification', hint: 'Check records', href: '/mrv', icon: ShieldCheck, image: '/images/apps/verification.jpg', live: 'verify' },
    ],
  },
  {
    title: 'Agents', tint: '#6FA8DC',
    items: [
      { name: 'Voice Agent', hint: 'Talk to KAI', href: '/voice', icon: Mic, image: '/images/apps/voice-agent.jpg' },
      { name: 'AI Agent', hint: 'Ask about tokens and DeFi', href: '/ai', icon: Bot, image: '/images/apps/ai-agent.jpg' },
    ],
  },
  {
    title: 'DeFi · Earn', tint: '#C89B3C',
    items: [
      { name: 'Securities', hint: 'Tokenised assets', href: '/securities', icon: ShieldCheck, image: '/images/apps/securities.jpg' },
      { name: 'Pools', hint: 'Swap and add liquidity', href: '/pools', icon: Droplets, image: '/images/apps/pools.jpg' },
      { name: 'Vaults', hint: 'Earn yield', href: '/vaults', icon: Lock, image: '/images/apps/vaults.jpg' },
      { name: 'TaaS', hint: 'Create your own token', href: '/taas', icon: LayoutGrid, image: '/images/apps/taas.jpg' },
    ],
  },
  {
    title: 'Shop · Pay', tint: '#C48FE0',
    items: [
      { name: 'Scan & Pay', hint: 'M-Pesa and QR', href: '/pay', icon: ScanLine, image: '/images/apps/scan-pay.jpg' },
      { name: 'Products', hint: 'Buy with yBOB', href: '/products', icon: CircleDollarSign, image: '/images/apps/products.jpg' },
      { name: 'NFT Mkt', hint: 'Conservation NFTs', href: '/connft', icon: ImageIcon, image: '/images/apps/nft-mkt.jpg' },
      { name: 'Airdrop', hint: 'Daily drop and points', href: '/mine', icon: Gift, image: '/images/apps/airdrop.jpg' },
    ],
  },
  {
    title: 'Explore', tint: '#6FC3B8',
    items: [
      { name: 'Playground', hint: 'Try KAI operations', href: '/nuvari', icon: FlaskConical, image: '/images/apps/playground.jpg' },
      { name: 'SDG Impact', hint: 'Impact by goal', href: '/sdg', icon: Globe, image: '/images/apps/sdg.jpg' },
      { name: 'KAI Web', hint: 'The KAI website', href: '/kai', icon: Link2, image: '/images/apps/kai-web.jpg' },
    ],
  },
];

export const QUICK_COUNT = QUICK_GROUPS.reduce((n, g) => n + g.items.length, 0);

export default function QuickActions() {
  const [live, setLive] = useState<{ nursery?: string; verify?: string }>({});
  const [filter, setFilter] = useState<string>('All');

  // Live numbers for the conservation tiles (public, read-only endpoints).
  useEffect(() => {
    let on = true;
    fetch('/api/cfa/nursery/summary').then((r) => r.json()).then((d) => {
      const s = d?.stats;
      if (on && s) setLive((l) => ({ ...l, nursery: s.totalSeedlings ? `${Number(s.totalSeedlings).toLocaleString()} seedlings` : 'Start here' }));
    }).catch(() => {});
    fetch('/api/mrv/records').then((r) => r.json()).then((d) => {
      const waiting = (d?.records ?? []).filter((r: { verificationStatus: string }) => r.verificationStatus === 'SUBMITTED' || r.verificationStatus === 'UNDER_REVIEW').length;
      if (on) setLive((l) => ({ ...l, verify: waiting ? `${waiting} waiting` : 'All checked' }));
    }).catch(() => {});
    return () => { on = false; };
  }, []);

  const [featured, ...rest] = QUICK_GROUPS;
  const apps = rest
    .filter((g) => filter === 'All' || g.title === filter)
    .flatMap((g) => g.items.map((item) => ({ ...item, tint: g.tint })));

  return (
    <div className="qa3">
      {/* Conservation first: three wide cards with live numbers. */}
      <div className="qa3-featured">
        {featured.items.map((a) => {
          const Icon = a.icon;
          const badge = a.live ? live[a.live] : undefined;
          return (
            <Link key={a.name} href={a.href} prefetch={false} className="qa3-card" style={{ ['--tint' as string]: featured.tint }}>
              <span className="qa3-card-icon">{a.image ? <img src={a.image} alt="" /> : <Icon size={20} strokeWidth={1.8} />}</span>
              <span className="qa3-card-name">{a.name}</span>
              <span className="qa3-card-hint">{badge ?? a.hint}</span>
            </Link>
          );
        })}
      </div>

      {/* Everything else: filter chips + a compact icon grid. */}
      <div className="qa3-chips" role="tablist" aria-label="Filter apps">
        {['All', ...rest.map((g) => g.title)].map((t) => (
          <button key={t} role="tab" aria-selected={filter === t} onClick={() => setFilter(t)} className={filter === t ? 'qa3-chip qa3-chip--on' : 'qa3-chip'}>
            {t}
          </button>
        ))}
      </div>
      <div className="qa3-grid">
        {apps.map((a) => {
          const Icon = a.icon;
          return (
            <Link key={a.name} href={a.href} prefetch={false} className="qa3-app" title={a.hint} style={{ ['--tint' as string]: a.tint }}>
              <span className="qa3-app-icon">{a.image ? <img src={a.image} alt="" /> : <Icon size={22} strokeWidth={2} />}</span>
              <span className="qa3-app-name">{a.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
