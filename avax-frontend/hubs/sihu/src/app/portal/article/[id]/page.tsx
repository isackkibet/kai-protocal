import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import SihuNav from "@/components/layout/SihuNav";
import TrustBadge from "@/components/content/TrustBadge";
import SourcesList from "@/components/content/SourcesList";
import BookmarkButton from "@/components/account/BookmarkButton";
import ArticleDetailActions from "./ArticleDetailActions";
import { unifiedContentService } from "@/services/unifiedContentService";
import { articleService } from "@/services/articleService";
import { Clock, ChevronLeft, Calendar, ShieldCheck, User } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const [unifiedItems, legacyArticles] = await Promise.all([
    unifiedContentService.getContentItems(),
    articleService.getArticles(),
  ]);

  const unifiedParams = unifiedItems.map((item) => ({ id: item.slug }));
  const legacyParams = legacyArticles.map((a) => ({ id: a.id }));

  return [...unifiedParams, ...legacyParams];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const item = await unifiedContentService.getItemBySlug(id);

  if (item) {
    return {
      title: `${item.title} | SIHU Hub`,
      description: item.excerpt,
      openGraph: {
        title: item.title,
        description: item.excerpt,
        images: item.coverImageUrl ? [item.coverImageUrl] : [],
      },
    };
  }

  const legacy = await articleService.getArticleById(id);
  if (!legacy) return { title: "Article Not Found | SIHU Hub" };

  return {
    title: `${legacy.title} | SIHU Hub`,
    description: legacy.excerpt,
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { id } = await params;

  // Try unified content model first
  let item = await unifiedContentService.getItemBySlug(id);

  // If legacy article format, adapt it to unified display
  if (!item) {
    const legacy = await articleService.getArticleById(id);
    if (!legacy) {
      notFound();
    }
    const legAny = legacy as any;
    item = {
      id: legacy.id,
      contentType: 'article',
      slug: legacy.id,
      title: legacy.title,
      subtitle: legAny.subtitle || undefined,
      excerpt: legacy.excerpt || legacy.content?.slice(0, 160) || '',
      body: legacy.content || '',
      status: 'published',
      visibility: 'public',
      categorySlug: legacy.category?.toLowerCase() || 'news',
      category: { id: 'c1', slug: 'news', name: legacy.category || 'News' },
      coverImageUrl: legacy.image,
      featured: false,
      verificationStatus: 'source_verified',
      readingTimeMinutes: Math.max(1, Math.ceil((legacy.content?.length || 400) / 900)),
      viewsCount: legAny.views || 100,
      likesCount: legAny.likes || 12,
      bookmarksCount: 5,
      publishedAt: legAny.date || new Date().toISOString(),
      createdAt: legAny.date || new Date().toISOString(),
      updatedAt: legAny.date || new Date().toISOString(),
      author: {
        id: 'auth-leg',
        slug: 'author',
        name: legacy.author || 'SIHU Contributor',
        title: legAny.authorRole || 'Correspondent',
        avatarUrl: legAny.authorImage || undefined,
        isVerified: true,
      },
      tags: legAny.tags || [],
      topics: [],
      sources: legAny.sources ? legAny.sources.map((s: any, idx: number) => ({
        id: `leg-src-${idx}`,
        title: s.title || 'Source Reference',
        url: s.url,
        publisher: s.publisher,
        sourceType: 'web' as const,
      })) : [],
    };
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans">
      <SihuNav />

      {/* Sticky Sub-Header with Back Link & Actions */}
      <div className="sticky top-14 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 py-3 shadow-sm">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl flex justify-between items-center">
          <Link
            href="/portal"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors group"
          >
            <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-1 text-primary" />
            <span>Back to Portal</span>
          </Link>

          <ArticleDetailActions
            contentItemId={item.id}
            contentTitle={item.title}
          />
        </div>
      </div>

      <main className="container mx-auto px-4 lg:px-8 max-w-4xl py-10 flex-1">
        {/* Verification Status Badge */}
        <div className="mb-4">
          <TrustBadge status={item.verificationStatus} showDetails />
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-3xl md:text-5xl font-heading font-black text-white tracking-tight mb-4 leading-tight">
          {item.title}
        </h1>

        {item.subtitle && (
          <p className="text-base md:text-lg text-slate-300 font-medium leading-relaxed mb-6">
            {item.subtitle}
          </p>
        )}

        {/* Author & Publication Metadata */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-slate-800 text-xs text-slate-400 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-primary border border-slate-700">
              {item.author?.name ? item.author.name[0] : 'S'}
            </div>
            <div>
              <div className="font-bold text-white text-sm">
                {item.author?.name || 'Editorial Team'}
              </div>
              <div className="text-[11px] text-slate-400">
                {item.author?.title || 'Sango Info Hub Correspondent'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            {item.publishedAt && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{new Date(item.publishedAt).toLocaleDateString()}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{item.readingTimeMinutes} min read</span>
            </div>
          </div>
        </div>

        {/* Hero Image */}
        {item.coverImageUrl && (
          <div className="w-full h-72 md:h-96 rounded-3xl overflow-hidden mb-10 border border-slate-800 shadow-2xl relative bg-slate-950">
            <img
              src={item.coverImageUrl}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Article Body */}
        <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed text-base md:text-lg space-y-6 mb-12">
          {item.body.split('\n\n').map((paragraph, index) => {
            if (paragraph.startsWith('### ')) {
              return (
                <h3 key={index} className="text-2xl font-bold text-white mt-10 mb-3">
                  {paragraph.replace('### ', '')}
                </h3>
              );
            }
            if (paragraph.startsWith('#### ')) {
              return (
                <h4 key={index} className="text-lg font-bold text-primary-light mt-8 mb-2">
                  {paragraph.replace('#### ', '')}
                </h4>
              );
            }
            if (paragraph.startsWith('> ')) {
              return (
                <blockquote
                  key={index}
                  className="p-4 my-6 rounded-2xl bg-slate-900/80 border-l-4 border-primary text-slate-200 italic font-medium"
                >
                  {paragraph.replace('> ', '')}
                </blockquote>
              );
            }
            return <p key={index}>{paragraph}</p>;
          })}
        </div>

        {/* Sources & Citations Box */}
        {item.sources && item.sources.length > 0 && (
          <div className="mb-12">
            <SourcesList sources={item.sources} />
          </div>
        )}
      </main>
    </div>
  );
}
