import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, BookOpen, Camera, CheckCircle2, ExternalLink, Flower2, Mic, Newspaper, PlayCircle, Search,
  ShieldCheck, Sprout, type LucideIcon,
} from 'lucide-react';
import { getPrisma } from '@/lib/db/db';
import { listPublishedPosts } from '@/lib/hubs/sihu-store';
import { HUBS, hubItems, hubProfile, isHubId, youtubeId, type HubId, type HubItemView, type HubInfo } from '@/lib/hubs/hub-content';
import HubLive from '@/components/hubs/HubLive';
import HubAdmin from '@/components/hubs/HubAdmin';

/**
 * /hubs/<hub> — an organisation's Information Hub landing page: what the hub
 * is, what the organisation stands for and does, featured news, activities,
 * photos, videos and podcasts, then links to go deeper. Content comes from
 * hub_profiles / hub_items (managed on this page by hub managers), plus live
 * data: SIHU's published stories, Oloolua's verified conservation records.
 */

export const dynamic = 'force-dynamic';

const C = {
  bg: '#0E2418', band: '#12301F', card: '#15352A', line: 'rgba(246,242,231,0.08)',
  paper: '#F6F2E7', dim: '#C9CFC2', ink: '#9BA396', gold: '#C89B3C', goldLight: '#E4C878', green: '#7DC383',
};
const WORK_ICON: Record<HubInfo['work'][number]['icon'], LucideIcon> = {
  sprout: Sprout, shield: ShieldCheck, bee: Flower2, check: CheckCircle2, news: Newspaper, mic: Mic, search: Search, book: BookOpen,
};
const SECTIONS = [['about', 'About'], ['news', 'News'], ['activities', 'Activities'], ['photos', 'Photos'], ['videos', 'Videos'], ['podcasts', 'Podcasts']] as const;
const day = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** A card for anything shown on the hub (news, activity, video, podcast). */
interface Card { key: string; title: string; text: string | null; date: string; href: string | null; external: boolean; image: string | null; tag: string }

function fromItem(it: HubItemView): Card {
  const yt = youtubeId(it.url);
  return {
    key: it.id, title: it.title, text: it.summary, date: it.happenedOn ?? it.createdAt, href: it.url, external: true,
    image: it.hasImage ? `/api/hubs/${it.hub}/items/${it.id}/image` : yt ? `https://img.youtube.com/vi/${yt}/hqdefault.jpg` : null,
    tag: it.kind === 'news' ? 'News' : it.kind === 'activity' ? 'Activity' : it.kind === 'video' ? 'Video' : it.kind === 'podcast' ? 'Podcast' : 'Photo',
  };
}

async function load(hub: HubId) {
  const prisma = await getPrisma();
  if (!prisma) return null;
  const [profile, items] = await Promise.all([hubProfile(prisma, hub), hubItems(prisma, hub)]);
  let posts: Card[] = [];
  let records: Card[] = [];
  if (hub === 'sihu') {
    const published = await listPublishedPosts().catch(() => []);
    posts = published.slice(0, 12).map((p) => ({
      key: `post-${p.id}`, title: p.title, text: p.summary ?? null, date: p.publishedAt ?? p.createdAt, href: `/hub/${p.slug}`, external: false,
      image: null, tag: p.contentType === 'AUDIO_PODCAST' ? 'Podcast' : p.contentType === 'VIDEO' ? 'Video' : 'Story',
    }));
  } else {
    const cfa = await prisma.cfa.findFirst({ select: { id: true } });
    const rows = cfa ? await prisma.conservationRecord.findMany({
      where: { forestId: cfa.id, verificationStatus: 'VERIFIED' }, orderBy: { createdAt: 'desc' }, take: 6,
      select: { id: true, recordType: true, createdAt: true, anchorStatus: true, versions: { orderBy: { version: 'desc' }, take: 1, select: { data: true } } },
    }) : [];
    const { describeRecord } = await import('@/lib/murals/provenance');
    records = rows.map((r) => ({
      key: `rec-${r.id}`, title: describeRecord(r.recordType, (r.versions[0]?.data ?? null) as Record<string, unknown> | null),
      text: r.anchorStatus === 'ANCHORED' ? 'Verified by a CFA verifier and timestamped on Avalanche.' : 'Verified by a CFA verifier.',
      date: r.createdAt.toISOString(), href: `/verify/${r.id}`, external: false, image: null, tag: 'Verified record',
    }));
  }
  return { profile, items, posts, records };
}

export async function generateMetadata({ params }: { params: Promise<{ hub: string }> }): Promise<Metadata> {
  const { hub } = await params;
  if (!isHubId(hub)) return { title: 'Hub not found' };
  return { title: `${HUBS[hub].name} | KAI Nuvari`, description: HUBS[hub].tagline };
}

export default async function HubLanding({ params }: { params: Promise<{ hub: string }> }) {
  const { hub } = await params;
  if (!isHubId(hub)) notFound();
  const info = HUBS[hub];
  const data = await load(hub);
  const items = data?.items ?? [];
  const of = (k: HubItemView['kind']) => items.filter((i) => i.kind === k).map(fromItem);

  const news = [...of('news'), ...(data?.posts.filter((p) => p.tag === 'Story') ?? [])].sort((a, b) => b.date.localeCompare(a.date));
  const activities = [...of('activity'), ...(data?.records ?? [])].sort((a, b) => b.date.localeCompare(a.date));
  const photos = items.filter((i) => i.kind === 'photo' && i.hasImage);
  const videos = [...of('video'), ...(data?.posts.filter((p) => p.tag === 'Video') ?? [])];
  const podcasts = [...of('podcast'), ...(data?.posts.filter((p) => p.tag === 'Podcast') ?? [])];
  const portal = hub === 'oloolua' ? process.env.NEXT_PUBLIC_OLOOLUA_PORTAL_URL : process.env.NEXT_PUBLIC_SIHU_PORTAL_URL;
  const repo = hub === 'oloolua' ? process.env.NEXT_PUBLIC_OLOOLUA_REPO_URL : process.env.NEXT_PUBLIC_SIHU_REPO_URL;

  const cards = (list: Card[], empty: string, limit?: number) => list.length === 0 ? <p className="hl-empty">{empty}</p> : (
    <div className="hl-cards">
      {list.slice(0, limit ?? 12).map((c) => {
        const inner = (
          <>
            {c.image && <span className="hl-card-pic"><img src={c.image} alt="" loading="lazy" /></span>}
            <span className="hl-card-body">
              <span className="hl-tag">{c.tag} · {day(c.date)}</span>
              <b>{c.title}</b>
              {c.text && <span className="hl-card-text">{c.text}</span>}
              {c.href && <span className="hl-go">{c.tag === 'Video' ? 'Watch' : c.tag === 'Podcast' ? 'Listen' : c.tag === 'Verified record' ? 'See the proof' : 'Read more'} {c.external ? <ExternalLink size={13} /> : <ArrowRight size={13} />}</span>}
            </span>
          </>
        );
        return c.href
          ? (c.external ? <a key={c.key} href={c.href} target="_blank" rel="noopener noreferrer" className="hl-card">{inner}</a> : <Link key={c.key} href={c.href} prefetch={false} className="hl-card">{inner}</Link>)
          : <div key={c.key} className="hl-card">{inner}</div>;
      })}
    </div>
  );

  return (
    <main className="hl" style={{ ['--tint' as string]: info.accent }}>
      <header className="hl-top">
        <div className="hl-wrap hl-top-inner">
          <Link href="/hubs" className="hl-back" aria-label="All Information Hubs"><ArrowLeft size={18} /></Link>
          <div style={{ minWidth: 0 }}><p className="hl-title">{info.name}</p><p className="hl-sub">Information Hub · {info.org}</p></div>
        </div>
      </header>

      {/* Hero with the organisation's photo */}
      <section className="hl-hero" style={{ backgroundImage: `linear-gradient(180deg, rgba(14,36,24,0.3) 0%, rgba(14,36,24,0.75) 60%, ${C.bg} 100%), linear-gradient(90deg, rgba(14,36,24,0.92) 0%, rgba(14,36,24,0.55) 60%, rgba(14,36,24,0.2) 100%), url('${info.heroImage}')` }}>
        <div className="hl-wrap">
          <p className="hl-eyebrow">{info.place}</p>
          <h1>{info.org}</h1>
          <p className="hl-lead">{info.tagline}</p>
          <div className="hl-btns">
            <a href="#about" className="hl-btn">What we do</a>
            <a href="#news" className="hl-btn hl-btn--ghost">Latest news</a>
          </div>
        </div>
      </section>

      {/* Section menu */}
      <nav className="hl-nav" aria-label="Hub sections">
        <div className="hl-wrap hl-nav-inner">
          {SECTIONS.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
        </div>
      </nav>

      <div className="hl-wrap hl-body">
        {/* About */}
        <section id="about" className="hl-sec">
          <h2>About {info.org}</h2>
          <p className="hl-what">This is the {info.org} Information Hub on KAI Nuvari: the place where they share who they are, what they do, their news, photos, videos and podcasts.</p>
          <div className="hl-about">
            <p className="hl-about-text">{data?.profile.about ?? info.defaultAbout}</p>
            <div className="hl-mission"><span>Our mission</span><p>{data?.profile.mission ?? info.defaultMission}</p></div>
          </div>
          <h3 className="hl-h3">What we do</h3>
          <div className="hl-work">
            {info.work.map((w) => { const Icon = WORK_ICON[w.icon]; return (
              <div key={w.title} className="hl-work-item"><span><Icon size={19} /></span><b>{w.title}</b><small>{w.text}</small></div>
            ); })}
          </div>
          <HubLive hub={hub} stories={hub === 'sihu' ? data?.posts.length ?? 0 : null} verified={hub === 'oloolua' ? data?.records.length ?? 0 : null} />
        </section>

        {/* Featured news */}
        <section id="news" className="hl-sec">
          <div className="hl-sec-head"><h2>Featured news</h2>{hub === 'sihu' && <Link href="/hub" prefetch={false} className="hl-more">All stories <ArrowRight size={14} /></Link>}</div>
          {cards(news, `No news yet. ${info.managers} can add the first update below.`, 3)}
          {news.length > 3 && <details className="hl-all"><summary>More news ({news.length - 3})</summary>{cards(news.slice(3), '')}</details>}
        </section>

        {/* Activities */}
        <section id="activities" className="hl-sec">
          <div className="hl-sec-head"><h2>Activities</h2>{hub === 'oloolua' && <Link href="/nursery" prefetch={false} className="hl-more">Nursery groups <ArrowRight size={14} /></Link>}</div>
          {cards(activities, 'No activities shared yet.', 6)}
        </section>

        {/* Photos */}
        <section id="photos" className="hl-sec">
          <h2>Photos</h2>
          {photos.length === 0 ? <p className="hl-empty"><Camera size={16} /> No photos yet. {info.managers} can upload photos below.</p> : (
            <div className="hl-photos">
              {photos.slice(0, 12).map((p) => (
                <figure key={p.id}><img src={`/api/hubs/${hub}/items/${p.id}/image`} alt={p.title} loading="lazy" /><figcaption>{p.title}</figcaption></figure>
              ))}
            </div>
          )}
        </section>

        {/* Videos */}
        <section id="videos" className="hl-sec">
          <h2><PlayCircle size={20} /> Videos</h2>
          {cards(videos, 'No videos yet.', 6)}
        </section>

        {/* Podcasts */}
        <section id="podcasts" className="hl-sec">
          <h2><Mic size={20} /> Podcasts</h2>
          {cards(podcasts, 'No podcasts yet.', 6)}
        </section>

        {/* Go deeper */}
        <section className="hl-sec">
          <h2>Go deeper</h2>
          <div className="hl-deeper">
            {info.deeper.map((d) => <Link key={d.href} href={d.href} prefetch={false}>{d.label} <ArrowRight size={15} /></Link>)}
            {portal && /^https?:\/\//.test(portal) && <a href={portal} target="_blank" rel="noopener noreferrer">Full {info.org} website <ExternalLink size={14} /></a>}
            {repo && /^https?:\/\//.test(repo) && <a href={repo} target="_blank" rel="noopener noreferrer">Source code <ExternalLink size={14} /></a>}
            <Link href="/hubs" prefetch={false}>All Information Hubs <ArrowRight size={15} /></Link>
          </div>
        </section>

        <HubAdmin hub={hub} managers={info.managers} about={data?.profile.about ?? info.defaultAbout} mission={data?.profile.mission ?? info.defaultMission}
          items={items.map((i) => ({ id: i.id, kind: i.kind, title: i.title }))} />
      </div>

      <style>{`
        .hl { min-height: 100dvh; background: ${C.bg}; color: ${C.paper}; font-family: 'Inter', system-ui, sans-serif; padding-bottom: 110px; }
        .hl-wrap { width: min(1080px, calc(100% - 32px)); margin: 0 auto; }
        .hl-top { position: sticky; top: 0; z-index: 30; background: ${C.band}; border-bottom: 1px solid ${C.line}; }
        .hl-top-inner { display: flex; align-items: center; gap: 12px; padding: 12px 0; }
        .hl-back { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; color: ${C.paper}; background: rgba(246,242,231,0.06); flex-shrink: 0; }
        .hl-title { margin: 0; font-size: 17px; font-weight: 700; }
        .hl-sub { margin: 1px 0 0; font-size: 12.5px; color: ${C.ink}; }
        .hl-hero { min-height: clamp(360px, 52vh, 520px); display: flex; align-items: flex-end; padding: 80px 0 48px; box-sizing: border-box; background-size: cover; background-position: center 35%; }
        .hl-eyebrow { margin: 0 0 12px; font-size: 12.5px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--tint); }
        .hl-hero h1 { margin: 0; font-size: clamp(34px, 6vw, 56px); line-height: 1.05; font-weight: 800; }
        .hl-lead { margin: 14px 0 0; font-size: clamp(16px, 2vw, 19px); color: ${C.dim}; max-width: 48ch; line-height: 1.55; }
        .hl-btns { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 24px; }
        .hl-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px; border-radius: 999px; background: ${C.gold}; color: #1B1A14; font-weight: 700; font-size: 15px; text-decoration: none; }
        .hl-btn--ghost { background: rgba(246,242,231,0.12); color: ${C.paper}; }
        .hl-nav { position: sticky; top: 61px; z-index: 20; background: ${C.bg}; border-bottom: 1px solid ${C.line}; }
        .hl-nav-inner { display: flex; gap: 6px; overflow-x: auto; padding: 10px 0; scrollbar-width: none; }
        .hl-nav a { flex-shrink: 0; padding: 8px 14px; border-radius: 999px; background: rgba(246,242,231,0.07); color: ${C.dim}; text-decoration: none; font-weight: 600; font-size: 14px; }
        .hl-nav a:hover { background: rgba(246,242,231,0.13); color: ${C.paper}; }
        .hl-body { display: grid; grid-template-columns: minmax(0, 1fr); gap: 44px; padding-top: 32px; }
        .hl-body > * { min-width: 0; }
        .hl-sec { scroll-margin-top: 130px; }
        .hl-sec h2 { display: flex; align-items: center; gap: 8px; margin: 0 0 14px; font-size: clamp(22px, 3vw, 28px); }
        .hl-sec-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .hl-more { display: inline-flex; align-items: center; gap: 5px; color: ${C.goldLight}; font-weight: 600; font-size: 14px; text-decoration: none; }
        .hl-what { margin: 0 0 16px; color: ${C.ink}; font-size: 14.5px; line-height: 1.55; }
        .hl-about { display: grid; gap: 14px; grid-template-columns: 1fr; }
        @media (min-width: 860px) { .hl-about { grid-template-columns: 1.4fr 1fr; align-items: start; } }
        .hl-about-text { margin: 0; font-size: 17px; line-height: 1.65; color: ${C.paper}; white-space: pre-line; }
        .hl-mission { padding: 18px; border-radius: 16px; background: ${C.band}; border-left: 3px solid var(--tint); }
        .hl-mission span { font-size: 12px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--tint); }
        .hl-mission p { margin: 6px 0 0; font-size: 15.5px; line-height: 1.6; white-space: pre-line; }
        .hl-h3 { margin: 26px 0 12px; font-size: 18px; }
        .hl-work { display: grid; gap: 10px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
        @media (min-width: 860px) { .hl-work { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
        .hl-work-item { display: grid; gap: 4px; padding: 16px; border-radius: 14px; background: ${C.card}; }
        .hl-work-item span { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 50%; color: var(--tint); background: color-mix(in srgb, var(--tint) 16%, ${C.bg}); margin-bottom: 4px; }
        .hl-work-item b { font-size: 15px; }
        .hl-work-item small { color: ${C.dim}; font-size: 13.5px; line-height: 1.45; }
        .hl-cards { display: grid; gap: 12px; grid-template-columns: 1fr; }
        @media (min-width: 680px) { .hl-cards { grid-template-columns: 1fr 1fr; } }
        @media (min-width: 980px) { .hl-cards { grid-template-columns: repeat(3, 1fr); } }
        .hl-card { display: flex; flex-direction: column; border-radius: 16px; overflow: hidden; background: ${C.card}; color: ${C.paper}; text-decoration: none; }
        a.hl-card:hover { background: #1B4032; }
        .hl-card-pic { aspect-ratio: 16 / 9; background: ${C.band}; }
        .hl-card-pic img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .hl-card-body { display: grid; gap: 6px; padding: 16px; }
        .hl-tag { font-size: 12px; font-weight: 700; color: var(--tint); }
        .hl-card-body b { font-size: 16px; line-height: 1.35; }
        .hl-card-text { color: ${C.dim}; font-size: 14px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
        .hl-go { display: inline-flex; align-items: center; gap: 5px; margin-top: 4px; color: ${C.goldLight}; font-weight: 600; font-size: 13.5px; }
        .hl-empty { display: flex; align-items: center; gap: 8px; margin: 0; padding: 16px; border-radius: 14px; background: ${C.band}; color: ${C.dim}; font-size: 14.5px; }
        .hl-all { margin-top: 12px; }
        .hl-all summary { cursor: pointer; color: ${C.goldLight}; font-weight: 600; margin-bottom: 12px; }
        .hl-photos { display: grid; gap: 10px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
        @media (min-width: 760px) { .hl-photos { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        .hl-photos figure { margin: 0; border-radius: 14px; overflow: hidden; background: ${C.card}; }
        .hl-photos img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; display: block; }
        .hl-photos figcaption { padding: 10px 12px; font-size: 13.5px; color: ${C.dim}; }
        .hl-deeper { display: grid; gap: 8px; grid-template-columns: 1fr; }
        @media (min-width: 680px) { .hl-deeper { grid-template-columns: 1fr 1fr; } }
        .hl-deeper a { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 16px 18px; border-radius: 14px; background: ${C.card}; color: ${C.paper}; text-decoration: none; font-weight: 600; }
        .hl-deeper a:hover { background: #1B4032; }
      `}</style>
    </main>
  );
}
