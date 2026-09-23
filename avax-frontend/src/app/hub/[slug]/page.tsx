import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Newspaper } from 'lucide-react';
import { getBySlug } from '@/lib/sihu-store';
import ArticleEngage from '@/components/hub/ArticleEngage';
import { HUB_THEME, MONO, SERIF, SANS } from '@/lib/hub-theme';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBySlug(slug);
  if (!post) return { title: 'Article not found — SIHU' };
  return {
    title: `${post.title} — SIHU`,
    description: post.summary ?? post.body.slice(0, 160),
    openGraph: { title: post.title, description: post.summary ?? undefined, type: 'article' },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBySlug(slug, true);

  if (!post || post.status !== 'PUBLISHED') {
    return (
      <main style={{ minHeight: '100dvh', background: HUB_THEME.bg, color: HUB_THEME.paper, fontFamily: "'IBM Plex Sans', sans-serif", padding: '0 28px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '160px 0', textAlign: 'center' }}>
          <p style={{ ...SERIF, fontSize: 28, fontWeight: 600 }}>Article not found</p>
          <p style={{ color: HUB_THEME.inkLight, margin: '10px 0 26px' }}>This story may have been unpublished or the link is wrong.</p>
          <Link href="/hub" style={{ color: HUB_THEME.goldLight, fontWeight: 600, textDecoration: 'none' }}>← Back to SIHU</Link>
        </div>
      </main>
    );
  }

  const paragraphs = post.body.split('\n\n').filter(Boolean);

  return (
    <main style={{ minHeight: '100dvh', background: HUB_THEME.bg, color: HUB_THEME.paper, fontFamily: "'IBM Plex Sans', sans-serif", paddingBottom: 90 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
      `}</style>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 28px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '30px 0 20px' }}>
          <Link href="/hub" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: HUB_THEME.gold, color: HUB_THEME.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>K</div>
            <span style={{ ...SERIF, fontSize: 24, fontWeight: 600, color: HUB_THEME.paper }}>SIHU</span>
          </Link>
          <Link href="/hub" style={{ ...MONO, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: HUB_THEME.goldLight, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={14} /> All stories
          </Link>
        </header>

        <div style={{ borderTop: `1px solid ${HUB_THEME.hairline}`, borderBottom: `1px solid ${HUB_THEME.hairline}`, padding: '44px 0 30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{ ...MONO, fontSize: 10, letterSpacing: 1.3, textTransform: 'uppercase', color: HUB_THEME.goldLight, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Newspaper size={12} /> {post.contentType.replaceAll('_', ' ')}
            </span>
            <span style={{ height: 1, width: 40, background: HUB_THEME.hairline }} />
            <span style={{ ...MONO, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: HUB_THEME.inkLight }}>
              {post.category.replaceAll('_', ' ')}
            </span>
          </div>

          <h1 style={{ ...SERIF, fontSize: 40, fontWeight: 600, lineHeight: 1.15, margin: '0 0 18px', color: HUB_THEME.paper }}>
            {post.title}
          </h1>

          {post.summary && (
            <p style={{ ...SERIF, fontSize: 19, lineHeight: 1.55, color: 'rgba(246,242,231,0.75)', margin: '0 0 24px', maxWidth: 720 }}>
              {post.summary}
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: HUB_THEME.pineLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: HUB_THEME.paper }}>
              {post.creatorName.charAt(0)}
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: HUB_THEME.paper, margin: 0 }}>
                {post.creatorName}
                {post.authorBadge && <span style={{ ...MONO, fontSize: 9, letterSpacing: 1, color: HUB_THEME.goldLight, marginLeft: 8 }}>{post.authorBadge}</span>}
              </p>
              <p style={{ ...MONO, fontSize: 11, color: HUB_THEME.inkLight, margin: '2px 0 0' }}>
                {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' }) : ''} · {post.viewsCount.toLocaleString()} reads
              </p>
            </div>
            <span style={{ marginLeft: 'auto', ...MONO, fontSize: 10, color: HUB_THEME.inkLight, display: 'flex', alignItems: 'center', gap: 5 }}>
              <ShieldCheck size={13} color={HUB_THEME.pineLight} /> Editor-approved · human editorial authority
            </span>
          </div>
        </div>

        <article style={{ maxWidth: 720 }}>
          {paragraphs.map((p, i) => (
            <p key={i} style={{ ...SANS, fontSize: 17, lineHeight: 1.85, color: 'rgba(246,242,231,0.86)', margin: '22px 0' }}>
              {p}
            </p>
          ))}
        </article>

        <ArticleEngage post={post} />
      </div>
    </main>
  );
}