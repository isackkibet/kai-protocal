"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Article } from "@/constants/articles";
import { Flame, Clock, Headphones, ArrowRight, UserCheck, Sparkles } from "lucide-react";

interface NewsHeroProps {
  mainArticle: Article | null;
  sideArticles: Article[];
}

export default function NewsHero({ mainArticle, sideArticles }: NewsHeroProps) {
  if (!mainArticle) return null;

  return (
    <section className="animate-fade-in mb-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Featured Article */}
        <div className="lg:col-span-8">
          <Link 
            href={`/portal/article/${mainArticle.id}`}
            className="group relative rounded-[2.5rem] overflow-hidden shadow-2xl aspect-[16/9] md:aspect-[21/9] lg:aspect-auto lg:h-[520px] border border-white/10 p-1 block cursor-pointer"
          >
            {/* Clickable Image Area */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-slate-900" />
                <Image 
                  src={mainArticle.image || '/assets/placeholder-article.jpg'} 
                  alt={mainArticle.title} 
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 800px"
                  className="object-cover transition-transform duration-1000 group-hover:scale-105 opacity-90" 
                />
                {/* Multi-layered Professional Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 via-transparent to-transparent" />
            </div>            
            <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full z-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                  <Flame className="w-3.5 h-3.5 text-amber-300" />
                  <span>Priority Dispatch</span>
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Feed
                </span>
              </div>
              
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white mb-4 leading-tight transition-colors drop-shadow-2xl uppercase tracking-tight group-hover:text-sky-300">
                {mainArticle.title}
              </h2>
              
              <p className="text-slate-200 text-sm md:text-base line-clamp-2 md:line-clamp-3 mb-6 max-w-3xl font-medium leading-relaxed drop-shadow-sm">
                {mainArticle.excerpt}
              </p>
              
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-900 font-bold bg-white/95 backdrop-blur-xl w-fit px-5 py-2.5 rounded-2xl border border-white/50 shadow-xl">
                <div className="w-7 h-7 rounded-xl bg-sky-500 text-white flex items-center justify-center font-black shadow-md text-xs">
                  {mainArticle.author.charAt(0)}
                </div>
                <span className="text-slate-900 font-bold">{mainArticle.author}</span>
                <span className="opacity-20 text-slate-900">|</span>
                <span className="flex items-center gap-1.5 text-sky-600 font-semibold text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{mainArticle.time}</span>
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Side Articles Stack */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-500" />
              <span>Intelligence Stream</span>
            </h3>
            <span className="text-[10px] font-mono text-sky-600 font-bold uppercase">Trending</span>
          </div>

          {sideArticles.map((article) => (
            <Link 
              key={article.id} 
              href={`/portal/article/${article.id}`} 
              className="group flex gap-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 hover:border-sky-300 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden relative shadow-sm bg-slate-900">
                <Image 
                  src={article.image || '/assets/placeholder-article.jpg'} 
                  alt={article.title} 
                  fill
                  sizes="80px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105 opacity-90" 
                />
              </div>
              <div className="flex flex-col flex-1 justify-center relative z-10">
                <span className="text-[9px] font-black text-sky-600 uppercase tracking-wider mb-1 px-2 py-0.5 bg-sky-50 w-fit rounded-md border border-sky-100">
                  {article.category}
                </span>
                <h4 className="font-bold text-slate-900 text-xs leading-snug line-clamp-2 uppercase tracking-tight group-hover:text-sky-600 transition-colors">
                  {article.title}
                </h4>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1 text-slate-600">
                    <Clock className="w-3 h-3 text-sky-500" />
                    <span>{article.time}</span>
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="flex items-center gap-1 text-sky-600 font-semibold group-hover:underline">
                    <Headphones className="w-3 h-3 text-sky-500" />
                    <span>Audio Dispatch</span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
