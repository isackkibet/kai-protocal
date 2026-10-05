'use client';

import { useEffect, useState } from 'react';

/** Live numbers on a hub landing page (Oloolua: nursery; SIHU: stories). */
export default function HubLive({ hub, stories, verified }: { hub: 'oloolua' | 'sihu'; stories: number | null; verified: number | null }) {
  const [n, setN] = useState<{ seedlings?: number; planted?: number }>({});
  useEffect(() => {
    if (hub !== 'oloolua') return;
    let on = true;
    fetch('/api/cfa/nursery/summary').then((r) => r.json()).then((d) => { if (on) setN({ seedlings: d?.stats?.totalSeedlings ?? 0, planted: d?.stats?.planted ?? 0 }); }).catch(() => {});
    return () => { on = false; };
  }, [hub]);
  const v = (x?: number | null) => (x == null ? '…' : x.toLocaleString());
  const stats = hub === 'oloolua'
    ? [{ v: v(n.seedlings), l: 'seedlings recorded' }, { v: v(n.planted), l: 'trees planted' }, { v: v(verified), l: 'recent verified records' }]
    : [{ v: v(stories), l: 'published stories' }];
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px 32px', marginTop: 22, padding: '18px 20px', borderRadius: 16, background: '#12301F' }}>
      {stats.map((s) => (
        <div key={s.l} style={{ display: 'grid', gap: 2 }}>
          <b style={{ fontSize: 30, color: '#E4C878', fontVariantNumeric: 'tabular-nums' }}>{s.v}</b>
          <span style={{ fontSize: 13.5, color: '#C9CFC2' }}>{s.l}</span>
        </div>
      ))}
    </div>
  );
}
