'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, CheckCircle2, Fingerprint, Newspaper, PenTool, Sprout, TreePine, Users, type LucideIcon } from 'lucide-react';
import QuickActions from '@/components/shared/QuickActions';

/**
 * Home: KAI Nuvari is a conservation information and provenance platform.
 * Community Forest Associations record their work in their Information Hub;
 * records are checked, timestamped on Avalanche and published; murals carry
 * that verified story. (Crypto features are hidden: see next.config.ts.)
 */

const C = {
  bg: '#0E2418', band: '#12301F', card: '#15352A', line: 'rgba(246,242,231,0.08)',
  paper: '#F6F2E7', dim: '#C9CFC2', ink: '#9BA396', gold: '#C89B3C', goldLight: '#E4C878', green: '#7DC383', blue: '#6FA8DC',
};

interface Live { seedlings?: number; planted?: number; verified?: number; stories?: number }

const STEPS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Sprout, title: 'Record', text: 'A CFA member records nursery or planting work in their hub.' },
  { icon: CheckCircle2, title: 'Check', text: 'A verifier in the CFA checks the record and approves it.' },
  { icon: Fingerprint, title: 'Timestamp', text: 'A fingerprint of the record is saved on Avalanche.' },
  { icon: BookOpen, title: 'Publish', text: 'Anyone can read it and check that it was never changed.' },
];

export default function Home() {
  const [live, setLive] = useState<Live>({});

  useEffect(() => {
    let on = true;
    const set = (patch: Live) => { if (on) setLive((l) => ({ ...l, ...patch })); };
    fetch('/api/cfa/nursery/summary').then((r) => r.json()).then((d) => set({ seedlings: d?.stats?.totalSeedlings ?? 0, planted: d?.stats?.planted ?? 0 })).catch(() => {});
    fetch('/api/mrv/records').then((r) => r.json()).then((d) => set({ verified: (d?.records ?? []).filter((r: { verificationStatus: string }) => r.verificationStatus === 'VERIFIED').length })).catch(() => {});
    fetch('/api/hub/feed').then((r) => r.json()).then((d) => set({ stories: (d?.posts ?? []).length })).catch(() => {});
    return () => { on = false; };
  }, []);

  const num = (v?: number) => (v == null ? '…' : v.toLocaleString());

  return (
    <main className="hm">
      {/* Hero */}
      <section className="hm-hero">
        <div className="hm-wrap">
          <p className="hm-eyebrow">KAI Nuvari · Conservation records</p>
          <h1>Conservation work you can trust.</h1>
          <p className="hm-lead">
            Community Forest Associations record their nursery and tree-planting work. We check it, timestamp it on Avalanche and publish it,
            and our murals carry that verified story.
          </p>
          <div className="hm-btns">
            <Link href="/hubs" className="hm-btn" prefetch={false}>Open the Information Hubs <ArrowRight size={16} /></Link>
            <Link href="/nursery" className="hm-btn hm-btn--ghost" prefetch={false}>Record nursery work</Link>
          </div>
        </div>
      </section>

      {/* Live numbers */}
      <section className="hm-band">
        <div className="hm-wrap hm-stats">
          {[
            { v: num(live.seedlings), l: 'seedlings recorded' },
            { v: num(live.planted), l: 'trees planted' },
            { v: num(live.verified), l: 'verified records' },
            { v: num(live.stories), l: 'published stories' },
          ].map((s) => (
            <div key={s.l} className="hm-stat"><b>{s.v}</b><span>{s.l}</span></div>
          ))}
        </div>
      </section>

      {/* The two hubs */}
      <section className="hm-sec">
        <div className="hm-wrap">
          <h2>Two Information Hubs, one platform</h2>
          <p className="hm-intro">Each group manages its own information. Approved work is published for everyone.</p>
          <div className="hm-hubs">
            <article className="hm-hub" style={{ ['--tint' as string]: C.green }}>
              <span className="hm-hub-icon"><TreePine size={22} /></span>
              <h3>Oloolua Conservation Hub</h3>
              <p className="hm-hub-by">Oloolua Community Forest Association · Youth Guardians</p>
              <p>Nursery groups, seedlings, planting and survival checks, with verified records.</p>
              <div className="hm-hub-links">
                <Link href="/nursery" prefetch={false}><Sprout size={15} /> Nursery groups</Link>
                <Link href="/conservation" prefetch={false}><BookOpen size={15} /> Guides and knowledge</Link>
              </div>
            </article>
            <article className="hm-hub" style={{ ['--tint' as string]: C.blue }}>
              <span className="hm-hub-icon"><Newspaper size={22} /></span>
              <h3>SIHU Information Hub</h3>
              <p className="hm-hub-by">Sango · Lake Victoria Basin</p>
              <p>Local news, stories and community information, reviewed before it is published.</p>
              <div className="hm-hub-links">
                <Link href="/hub" prefetch={false}><Newspaper size={15} /> Read stories</Link>
                <Link href="/hub/create" prefetch={false}><PenTool size={15} /> Write a story</Link>
              </div>
            </article>
          </div>
          <Link href="/hubs" className="hm-more" prefetch={false}><Users size={15} /> See both hubs and what they published <ArrowRight size={15} /></Link>
        </div>
      </section>

      {/* How a record becomes trusted */}
      <section className="hm-sec">
        <div className="hm-wrap">
          <h2>How a record becomes trusted</h2>
          <ol className="hm-steps">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <span className="hm-step-n">Step {i + 1}</span>
                <h3><s.icon size={17} /> {s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Murals */}
      <section className="hm-sec">
        <div className="hm-wrap hm-mural">
          <div>
            <h2>Murals with a verified story</h2>
            <p className="hm-intro">
              Each mural or portrait comes with the record of the trees behind it: which CFA, who planted, when, and the proof on Avalanche.
            </p>
          </div>
          <Link href="/murals" className="hm-btn" prefetch={false}>See the murals <ArrowRight size={16} /></Link>
        </div>
      </section>

      {/* Everything else */}
      <section className="hm-sec" id="actions">
        <div className="hm-wrap">
          <h2>Quick actions</h2>
          <QuickActions />
        </div>
      </section>

      <style>{`
        .hm { min-height: 100dvh; background: ${C.bg}; color: ${C.paper}; font-family: 'Inter', system-ui, sans-serif; padding-bottom: 110px; }
        .hm-wrap { width: min(1080px, calc(100% - 32px)); margin: 0 auto; }
        .hm-hero { padding: 72px 0 56px; }
        .hm-eyebrow { margin: 0 0 14px; font-size: 12.5px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: ${C.goldLight}; }
        .hm-hero h1 { margin: 0; font-size: clamp(34px, 6vw, 58px); line-height: 1.08; font-weight: 700; letter-spacing: -0.01em; max-width: 15ch; }
        .hm-lead { margin: 18px 0 0; font-size: clamp(16px, 2vw, 19px); line-height: 1.6; color: ${C.dim}; max-width: 54ch; }
        .hm-btns { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; }
        .hm-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 13px 22px; border-radius: 999px; background: ${C.gold}; color: #1B1A14; font-weight: 700; font-size: 15px; text-decoration: none; min-height: 48px; white-space: nowrap; }
        .hm-btn--ghost { background: rgba(246,242,231,0.08); color: ${C.paper}; }

        .hm-band { background: ${C.band}; padding: 32px 0; }
        .hm-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
        @media (min-width: 760px) { .hm-stats { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
        .hm-stat { display: grid; gap: 4px; }
        .hm-stat b { font-size: clamp(28px, 4vw, 38px); color: ${C.goldLight}; font-variant-numeric: tabular-nums; }
        .hm-stat span { color: ${C.dim}; font-size: 14px; }

        .hm-sec { padding: 56px 0 0; }
        .hm-sec h2 { margin: 0 0 6px; font-size: clamp(22px, 3vw, 30px); font-weight: 700; }
        .hm-intro { margin: 0; color: ${C.dim}; font-size: 15.5px; line-height: 1.55; max-width: 60ch; }

        .hm-hubs { display: grid; gap: 14px; margin-top: 20px; grid-template-columns: 1fr; }
        @media (min-width: 760px) { .hm-hubs { grid-template-columns: 1fr 1fr; } }
        .hm-hub { padding: 22px; border-radius: 18px; background: ${C.card}; border-top: 3px solid var(--tint); display: grid; gap: 6px; align-content: start; }
        .hm-hub-icon { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 50%; color: var(--tint); background: color-mix(in srgb, var(--tint) 16%, ${C.bg}); margin-bottom: 6px; }
        .hm-hub h3 { margin: 0; font-size: 19px; }
        .hm-hub-by { margin: 0; font-size: 13px; color: var(--tint); font-weight: 600; }
        .hm-hub p { margin: 0; color: ${C.dim}; font-size: 14.5px; line-height: 1.5; }
        .hm-hub-links { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
        .hm-hub-links a { display: inline-flex; align-items: center; gap: 6px; padding: 9px 14px; border-radius: 999px; background: rgba(246,242,231,0.07); color: ${C.paper}; text-decoration: none; font-size: 13.5px; font-weight: 600; min-height: 40px; }
        .hm-hub-links a:hover { background: rgba(246,242,231,0.12); }
        .hm-more { display: inline-flex; align-items: center; gap: 8px; margin-top: 16px; color: ${C.goldLight}; font-weight: 600; font-size: 14.5px; text-decoration: none; }

        .hm-steps { list-style: none; margin: 20px 0 0; padding: 0; display: grid; gap: 12px; grid-template-columns: 1fr; }
        @media (min-width: 640px) { .hm-steps { grid-template-columns: 1fr 1fr; } }
        @media (min-width: 980px) { .hm-steps { grid-template-columns: repeat(4, 1fr); } }
        .hm-steps li { padding: 18px; border-radius: 16px; background: ${C.card}; display: grid; gap: 6px; }
        .hm-step-n { font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: ${C.goldLight}; }
        .hm-steps h3 { margin: 0; display: flex; align-items: center; gap: 8px; font-size: 16.5px; }
        .hm-steps p { margin: 0; color: ${C.dim}; font-size: 14.5px; line-height: 1.5; }

        .hm-mural { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 18px; padding: 26px; border-radius: 18px; background: ${C.band}; border-left: 3px solid ${C.gold}; box-sizing: border-box; }
      `}</style>
    </main>
  );
}
