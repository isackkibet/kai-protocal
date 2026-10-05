'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ExternalLink, Fingerprint, GitBranch, Newspaper, PenTool,
  ShieldCheck, Sprout, TreePine, type LucideIcon,
} from 'lucide-react';

/**
 * /hubs — the public portal for both Information Hubs on the KAI conservation
 * platform. Each group manages its own information in its own portal; this
 * page shows them side by side and lists what each has published:
 *   - Oloolua Conservation Hub: verified conservation records (nursery,
 *     planting, survival), each with its proof page (/verify/<id>)
 *   - SIHU Information Hub: published stories (/hub/<slug>)
 * Code repository and full-website links appear only when their
 * NEXT_PUBLIC_*_URL settings are filled in.
 */

const C = {
  bg: '#0E2418', band: '#12301F', card: '#15352A', line: 'rgba(246,242,231,0.08)',
  paper: '#F6F2E7', dim: '#C9CFC2', ink: '#9BA396', gold: '#C89B3C', goldLight: '#E4C878', green: '#7DC383', blue: '#6FA8DC',
};

const link = (u?: string) => (u && /^https?:\/\//.test(u) ? u : null);
const REPOS = {
  platform: link(process.env.NEXT_PUBLIC_PLATFORM_REPO_URL),
  oloolua: link(process.env.NEXT_PUBLIC_OLOOLUA_REPO_URL),
  sihu: link(process.env.NEXT_PUBLIC_SIHU_REPO_URL),
};
const PORTALS = { oloolua: link(process.env.NEXT_PUBLIC_OLOOLUA_PORTAL_URL), sihu: link(process.env.NEXT_PUBLIC_SIHU_PORTAL_URL) };

interface RecordRow { id: string; recordType: string; verificationStatus: string; anchorStatus: string; createdAt: string }
interface Post { id: string; slug: string; title: string; summary: string; creator: string; publishedAt: string; category: string }
interface Summary { totalSeedlings?: number; planted?: number; inNursery?: number }

const RECORD_WORDS: Record<string, string> = {
  NURSERY_INVENTORY: 'Seedlings received', PLANTING: 'Trees planted', SURVIVAL: 'Survival check', NURSERY_ACTIVITY: 'Nursery work',
};
const day = (d: string) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

type Item = { kind: 'record'; at: string; r: RecordRow } | { kind: 'post'; at: string; p: Post };

export default function HubsPage() {
  const [records, setRecords] = useState<RecordRow[] | null>(null);
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [summary, setSummary] = useState<Summary>({});
  const [filter, setFilter] = useState<'all' | 'oloolua' | 'sihu'>('all');

  useEffect(() => {
    let on = true;
    fetch('/api/mrv/records').then((r) => r.json()).then((d) => { if (on) setRecords(d?.records ?? []); }).catch(() => on && setRecords([]));
    fetch('/api/hub/feed').then((r) => r.json()).then((d) => { if (on) setPosts(d?.posts ?? []); }).catch(() => on && setPosts([]));
    fetch('/api/cfa/nursery/summary').then((r) => r.json()).then((d) => { if (on) setSummary(d?.stats ?? {}); }).catch(() => {});
    return () => { on = false; };
  }, []);

  // Only approved work is public: verified records and published stories.
  const verified = (records ?? []).filter((r) => r.verificationStatus === 'VERIFIED');
  const feed: Item[] = [
    ...(filter !== 'sihu' ? verified.map((r) => ({ kind: 'record' as const, at: r.createdAt, r })) : []),
    ...(filter !== 'oloolua' ? (posts ?? []).map((p) => ({ kind: 'post' as const, at: p.publishedAt, p })) : []),
  ].sort((a, b) => b.at.localeCompare(a.at));
  const loading = records === null || posts === null;
  const n = (v?: number) => (v == null ? '…' : v.toLocaleString());

  return (
    <main className="hb">
      <header className="hb-top">
        <div className="hb-wrap hb-top-inner">
          <Link href="/" className="hb-back" aria-label="Back to home"><ArrowLeft size={18} /></Link>
          <div>
            <h1 className="hb-title">Information Hubs</h1>
            <p className="hb-sub">Two community hubs on one conservation platform</p>
          </div>
        </div>
      </header>

      <div className="hb-wrap hb-body">
        <p className="hb-lead">
          Each group enters and manages its own information in its own portal. When a record is checked and approved, it is published here,
          and conservation records are timestamped on Avalanche so anyone can confirm they were never changed.
        </p>

        {/* The two hubs */}
        <div className="hb-hubs">
          <HubCard
            tint={C.green} icon={TreePine} name="Oloolua Conservation Hub" by="Oloolua Community Forest Association · Youth Guardians"
            what="Nursery groups record seedlings, planting, nursery work and survival checks. A CFA verifier approves each record."
            stats={[{ v: n(summary.totalSeedlings), l: 'seedlings' }, { v: n(summary.planted), l: 'planted' }, { v: records ? String(verified.length) : '…', l: 'verified records' }]}
            open={{ href: '/nursery', label: 'Nursery groups', icon: Sprout }}
            manage={[{ href: '/workspace', label: 'Record with Kanuvari AI', icon: PenTool }, { href: '/mrv', label: 'Verifier desk', icon: ShieldCheck }, { href: '/conservation', label: 'Guides', icon: BookOpen }]}
            repo={REPOS.oloolua} portal={PORTALS.oloolua}
          />
          <HubCard
            tint={C.blue} icon={Newspaper} name="SIHU Information Hub" by="Sango · Lake Victoria Basin"
            what="Members write stories and local information. Editors review each one before it is published."
            stats={[{ v: posts ? String(posts.length) : '…', l: 'published stories' }]}
            open={{ href: '/hub', label: 'Read stories', icon: Newspaper }}
            manage={[{ href: '/hub/create', label: 'Write a story', icon: PenTool }, { href: '/hub/review', label: 'Editor review', icon: ShieldCheck }]}
            repo={REPOS.sihu} portal={PORTALS.sihu}
          />
        </div>

        {/* How information moves */}
        <section>
          <h2 className="hb-h2">How information moves</h2>
          <ol className="hb-flow">
            {[
              { icon: PenTool, t: 'Submit', d: 'A member enters a record or a story in their hub.' },
              { icon: CheckCircle2, t: 'Check', d: 'A CFA verifier or a hub editor reviews it.' },
              { icon: Fingerprint, t: 'Timestamp', d: 'Conservation records get a fingerprint saved on Avalanche.' },
              { icon: BookOpen, t: 'Publish', d: 'Approved work appears below for everyone.' },
            ].map((s, i) => (
              <li key={s.t}><span>Step {i + 1}</span><b><s.icon size={16} /> {s.t}</b><p>{s.d}</p></li>
            ))}
          </ol>
        </section>

        {/* Published by both hubs */}
        <section>
          <div className="hb-feed-head">
            <h2 className="hb-h2" style={{ margin: 0 }}>Published by the hubs</h2>
            <div className="hb-chips" role="tablist">
              {([['all', 'Both hubs'], ['oloolua', 'Oloolua'], ['sihu', 'SIHU']] as const).map(([id, l]) => (
                <button key={id} role="tab" aria-selected={filter === id} className={filter === id ? 'on' : ''} onClick={() => setFilter(id)}>{l}</button>
              ))}
            </div>
          </div>
          {loading ? (
            <p className="hb-empty">Loading…</p>
          ) : feed.length === 0 ? (
            <p className="hb-empty">Nothing published here yet. Approved records and stories will appear as soon as they are checked.</p>
          ) : (
            <ul className="hb-feed">
              {feed.map((it) => it.kind === 'record' ? (
                <li key={`r-${it.r.id}`} style={{ ['--tint' as string]: C.green }}>
                  <Link href={`/verify/${it.r.id}`} prefetch={false}>
                    <span className="hb-feed-tag">Oloolua · Verified record</span>
                    <b>{RECORD_WORDS[it.r.recordType] ?? it.r.recordType.toLowerCase().replace(/_/g, ' ')}</b>
                    <small>{day(it.at)} · {it.r.anchorStatus === 'ANCHORED' ? 'Timestamped on Avalanche' : 'Waiting for the next Avalanche timestamp'}</small>
                    <span className="hb-feed-go">See the proof <ArrowRight size={14} /></span>
                  </Link>
                </li>
              ) : (
                <li key={`p-${it.p.id}`} style={{ ['--tint' as string]: C.blue }}>
                  <Link href={`/hub/${it.p.slug}`} prefetch={false}>
                    <span className="hb-feed-tag">SIHU · Story</span>
                    <b>{it.p.title}</b>
                    <small>{day(it.at)} · by {it.p.creator}</small>
                    {it.p.summary && <p>{it.p.summary}</p>}
                    <span className="hb-feed-go">Read <ArrowRight size={14} /></span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {REPOS.platform && (
          <a className="hb-repo" href={REPOS.platform} target="_blank" rel="noopener noreferrer"><GitBranch size={15} /> Platform source code <ExternalLink size={13} /></a>
        )}
      </div>

      <style>{`
        .hb { min-height: 100dvh; background: ${C.bg}; color: ${C.paper}; font-family: 'Inter', system-ui, sans-serif; padding-bottom: 110px; }
        .hb-wrap { width: min(1080px, calc(100% - 32px)); margin: 0 auto; }
        .hb-top { position: sticky; top: 0; z-index: 30; background: ${C.band}; border-bottom: 1px solid ${C.line}; }
        .hb-top-inner { display: flex; align-items: center; gap: 12px; padding: 12px 0; }
        .hb-back { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; color: ${C.paper}; background: rgba(246,242,231,0.06); flex-shrink: 0; }
        .hb-title { margin: 0; font-size: 18px; font-weight: 700; }
        .hb-sub { margin: 1px 0 0; font-size: 12.5px; color: ${C.ink}; }
        .hb-body { display: grid; grid-template-columns: minmax(0, 1fr); gap: 32px; padding-top: 22px; }
        .hb-body > * { min-width: 0; }
        .hb-lead { margin: 0; font-size: 16px; line-height: 1.6; color: ${C.dim}; max-width: 70ch; }
        .hb-h2 { margin: 0 0 14px; font-size: 20px; font-weight: 700; }

        .hb-hubs { display: grid; gap: 14px; grid-template-columns: 1fr; }
        @media (min-width: 860px) { .hb-hubs { grid-template-columns: 1fr 1fr; } }
        .hb-hub { padding: 22px; border-radius: 18px; background: ${C.card}; border-top: 3px solid var(--tint); display: grid; gap: 12px; align-content: start; }
        .hb-hub-head { display: flex; align-items: center; gap: 12px; }
        .hb-hub-icon { display: grid; place-items: center; width: 46px; height: 46px; border-radius: 50%; color: var(--tint); background: color-mix(in srgb, var(--tint) 16%, ${C.bg}); flex-shrink: 0; }
        .hb-hub h3 { margin: 0; font-size: 19px; }
        .hb-hub-by { margin: 2px 0 0; font-size: 13px; color: var(--tint); font-weight: 600; }
        .hb-hub-what { margin: 0; color: ${C.dim}; font-size: 14.5px; line-height: 1.5; }
        .hb-hub-stats { display: flex; flex-wrap: wrap; gap: 20px; padding: 12px 0; border-top: 1px solid ${C.line}; border-bottom: 1px solid ${C.line}; }
        .hb-hub-stats div { display: grid; }
        .hb-hub-stats b { font-size: 24px; color: ${C.goldLight}; font-variant-numeric: tabular-nums; }
        .hb-hub-stats span { font-size: 12.5px; color: ${C.ink}; }
        .hb-open { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 18px; border-radius: 999px; background: ${C.gold}; color: #1B1A14; font-weight: 700; font-size: 14.5px; text-decoration: none; min-height: 46px; }
        .hb-manage-title { margin: 4px 0 0; font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: ${C.ink}; }
        .hb-links { display: flex; flex-wrap: wrap; gap: 8px; }
        .hb-links a { display: inline-flex; align-items: center; gap: 6px; padding: 9px 13px; border-radius: 999px; background: rgba(246,242,231,0.07); color: ${C.paper}; text-decoration: none; font-size: 13.5px; font-weight: 600; min-height: 40px; }
        .hb-links a:hover { background: rgba(246,242,231,0.12); }

        .hb-flow { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; grid-template-columns: 1fr; }
        @media (min-width: 640px) { .hb-flow { grid-template-columns: 1fr 1fr; } }
        @media (min-width: 980px) { .hb-flow { grid-template-columns: repeat(4, 1fr); } }
        .hb-flow li { padding: 16px; border-radius: 14px; background: ${C.card}; display: grid; gap: 4px; }
        .hb-flow span { font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: ${C.goldLight}; }
        .hb-flow b { display: flex; align-items: center; gap: 7px; font-size: 16px; }
        .hb-flow p { margin: 0; color: ${C.dim}; font-size: 14px; line-height: 1.5; }

        .hb-feed-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
        .hb-chips { display: flex; gap: 4px; padding: 4px; border-radius: 999px; background: ${C.band}; }
        .hb-chips button { padding: 8px 14px; border-radius: 999px; border: none; background: none; color: ${C.dim}; font-weight: 700; font-size: 13px; cursor: pointer; font-family: inherit; }
        .hb-chips button.on { background: ${C.gold}; color: #1B1A14; }
        .hb-empty { margin: 0; padding: 18px; border-radius: 14px; background: ${C.band}; color: ${C.dim}; font-size: 14.5px; }
        .hb-feed { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; grid-template-columns: 1fr; }
        @media (min-width: 760px) { .hb-feed { grid-template-columns: 1fr 1fr; } }
        .hb-feed a { display: grid; gap: 4px; padding: 16px 18px; border-radius: 14px; background: ${C.card}; border-left: 3px solid var(--tint); text-decoration: none; color: ${C.paper}; height: 100%; box-sizing: border-box; }
        .hb-feed a:hover { background: #1B4032; }
        .hb-feed-tag { font-size: 12px; font-weight: 700; color: var(--tint); }
        .hb-feed b { font-size: 16px; }
        .hb-feed small { color: ${C.ink}; font-size: 13px; }
        .hb-feed p { margin: 4px 0 0; color: ${C.dim}; font-size: 14px; line-height: 1.5; }
        .hb-feed-go { display: inline-flex; align-items: center; gap: 5px; margin-top: 6px; color: ${C.goldLight}; font-weight: 600; font-size: 13.5px; }
        .hb-repo { display: inline-flex; align-items: center; gap: 7px; color: ${C.goldLight}; font-weight: 600; font-size: 14px; text-decoration: none; }
      `}</style>
    </main>
  );
}

function HubCard({ tint, icon: Icon, name, by, what, stats, open, manage, repo, portal }: {
  tint: string; icon: LucideIcon; name: string; by: string; what: string;
  stats: { v: string; l: string }[]; open: { href: string; label: string; icon: LucideIcon };
  manage: { href: string; label: string; icon: LucideIcon }[]; repo: string | null; portal: string | null;
}) {
  return (
    <article className="hb-hub" style={{ ['--tint' as string]: tint }}>
      <div className="hb-hub-head">
        <span className="hb-hub-icon"><Icon size={22} /></span>
        <div><h3>{name}</h3><p className="hb-hub-by">{by}</p></div>
      </div>
      <p className="hb-hub-what">{what}</p>
      <div className="hb-hub-stats">{stats.map((s) => <div key={s.l}><b>{s.v}</b><span>{s.l}</span></div>)}</div>
      <Link href={open.href} className="hb-open" prefetch={false}><open.icon size={16} /> {open.label}</Link>
      <p className="hb-manage-title">For members</p>
      <div className="hb-links">
        {manage.map((m) => <Link key={m.href + m.label} href={m.href} prefetch={false}><m.icon size={14} /> {m.label}</Link>)}
        {portal && <a href={portal} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /> Full website</a>}
        {repo && <a href={repo} target="_blank" rel="noopener noreferrer"><GitBranch size={14} /> Source code</a>}
      </div>
    </article>
  );
}
