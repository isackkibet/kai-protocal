'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sprout } from 'lucide-react';

/**
 * Home-page card that makes the nursery easy to find: live numbers from the
 * database, one tap to the nursery, one tap to Kanuvari AI.
 */
interface Stats { totalSeedlings: number; inNursery: number; planted: number; speciesCount: number }

export default function NurseryShortcut() {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    let live = true;
    fetch('/api/cfa/nursery/summary').then((r) => r.json()).then((d) => { if (live && d.stats) setStats(d.stats); }).catch(() => {});
    return () => { live = false; };
  }, []);

  const n = (v: number | undefined) => (v ?? 0).toLocaleString();
  return (
    <section className="home-section home-band home-band--nursery" aria-label="Oloolua CFA nursery" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p className="home-band-title" style={{ margin: 0 }}><Sprout size={13} /> Nursery</p>
      <Link href="/nursery" prefetch={false} style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit' }}>
        <span style={{ width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(125,195,131,0.14)', flexShrink: 0 }}>
          <Sprout size={20} color="#7DC383" />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontWeight: 700, fontSize: 15, color: 'var(--home-text, #F6F2E7)' }}>Oloolua CFA Nursery</span>
          <span style={{ display: 'block', fontSize: 12.5, color: 'var(--home-muted, #9BA396)', fontVariantNumeric: 'tabular-nums' }}>
            {stats ? `${n(stats.totalSeedlings)} seedlings · ${n(stats.inNursery)} in nursery · ${n(stats.planted)} planted` : 'Record seedlings, planting and survival'}
          </span>
        </span>
        <ArrowRight size={18} color="#E4C878" />
      </Link>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Link href="/nursery" prefetch={false} style={pill(true)}>Open nursery</Link>
        <Link href="/workspace" prefetch={false} style={pill(false)}>Tell Kanuvari AI what happened</Link>
      </div>
    </section>
  );
}

function pill(primary: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', minHeight: 40, borderRadius: 999, fontSize: 12.5, fontWeight: 700, textDecoration: 'none',
    ...(primary ? { background: '#C89B3C', color: '#1B1A14' } : { border: '1px solid rgba(200,155,60,0.4)', color: '#E4C878' }),
  };
}
