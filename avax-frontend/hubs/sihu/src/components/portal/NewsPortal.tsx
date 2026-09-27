"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import NewsHero from "./NewsHero";
import NewsCategories from "./NewsCategories";
import Link from "next/link";
import Image from "next/image";
import { Article, defaultTicker, Podcast, Event } from "@/constants/articles";
import { articleService } from "@/services/articleService";
import { podcastService } from "@/services/podcastService";
import { eventService } from "@/services/eventService";
import {
  Clock,
  User,
  ArrowRight,
  Volume2,
  VolumeX,
  MapPin,
  Radio,
  PlayCircle,
  Tag,
  CalendarDays,
  Search,
  Mic,
  ArrowUpRight,
  ExternalLink,
  Flame,
  Headphones
} from "lucide-react";

export default function NewsPortal() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [tickerItems, setTickerItems] = useState<{id: string, text: string}[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [playingPodcast, setPlayingPodcast] = useState<string | null>(null);
  
   
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);

    // Check if we need to force reset for the new real-world content migration
    const MIGRATION_VERSION = "2026_04_03_REAL_NEWS";
    const currentVersion = localStorage.getItem("sango_news_version");

    if (currentVersion !== MIGRATION_VERSION) {
        localStorage.removeItem("sango_articles");
        localStorage.removeItem("sango_podcasts");
        localStorage.removeItem("sango_ticker");
        localStorage.setItem("sango_news_version", MIGRATION_VERSION);
    }

    // Load data asynchronously
    const loadData = async () => {
      try {
        const [articlesData, podcastsData, eventsData] = await Promise.all([
          articleService.getArticles(),
          podcastService.getPodcasts(),
          eventService.getEvents()
        ]);
        setArticles(articlesData);
        setPodcasts(podcastsData);
        setEvents(eventsData);
      } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to defaults if services fail
        setArticles([]);
        setPodcasts([]);
        setEvents([]);
      }
    };

    loadData();

    const storedTicker = localStorage.getItem("sango_ticker");
     
    setTickerItems(storedTicker ? JSON.parse(storedTicker) : defaultTicker);
  }, []);

  if (!isMounted) {
    return <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full mb-4 border border-primary/30 shadow-[0_0_20px_rgba(88,179,242,0.2)]"></div>
            <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Initializing Intelligence Feed...</p>
        </div>
    </div>;
  }

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          article.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const mainArticle = filteredArticles.length > 0 ? filteredArticles[0] : null;
  const sideArticles = filteredArticles.slice(1, 4);
  const latestArticles = filteredArticles.slice(4);

  const handleReadArticle = (text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="bg-gradient-to-b from-sky-50 via-white to-blue-50/30 min-h-screen relative overflow-hidden selection:bg-primary selection:text-white">
      {/* Background Decor - Premium Light Blue */}
      <div className="fixed inset-0 bg-grid opacity-[0.025] pointer-events-none" />
      <div className="fixed top-0 left-0 w-full h-[700px] bg-gradient-to-b from-sky-100/60 via-blue-50/30 to-transparent pointer-events-none" />
      <div className="fixed -top-24 -right-24 w-[260px] h-[260px] sm:w-[380px] sm:h-[380px] md:w-[500px] md:h-[500px] bg-sky-300/20 rounded-full blur-[90px] sm:blur-[110px] md:blur-[140px] pointer-events-none" />
      <div className="fixed -top-12 -left-12 w-96 h-96 bg-blue-200/25 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-80 h-80 bg-indigo-100/30 rounded-full blur-[120px] pointer-events-none" />

      {/* 1. BREAKING NEWS TICKER - Professional Azure */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-xl py-3.5 relative z-20 shadow-sm">
        <div className="container mx-auto px-4 lg:px-8">
            <div className="flex items-center">
                <span className="inline-flex items-center gap-1.5 bg-rose-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-[0_0_15px_rgba(225,29,72,0.4)] animate-pulse">
                  <Flame className="w-3 h-3 text-amber-300" />
                  Live Update
                </span>
                <div className="ticker-wrapper ml-6 flex-1 overflow-hidden relative">
                    <div className="animate-ticker text-[10px] font-black uppercase tracking-widest text-slate-700">
                        {tickerItems.map(item => (
                            <React.Fragment key={item.id}>
                                <span className="mx-6 text-sky-500 font-bold">⚡</span> {item.text}
                            </React.Fragment>
                        ))}
                        {/* Duplicate for seamless looping */}
                        {tickerItems.map(item => (
                            <React.Fragment key={item.id + "_dup"}>
                                <span className="mx-6 text-sky-500 font-bold">⚡</span> {item.text}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-10 space-y-20">
          
        {/* 2. HERO GRID */}
        <NewsHero mainArticle={mainArticle} sideArticles={sideArticles} />

        {/* 3. CATEGORIES STRIP */}
        <NewsCategories selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />

        {/* 4. LATEST NEWS */}
         <section id="latest-news">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 pb-4 mb-8 gap-4">
                <div>
                   <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100/60 border border-sky-200 text-sky-700 font-bold text-[10px] uppercase tracking-widest mb-2">
                     <Radio className="w-3 h-3 text-sky-500" />
                     <span>Live Network Stream</span>
                   </div>
                   <h3 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">
                     Latest Intelligence
                   </h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time Basin Environmental Feed</p>
                </div>
                <div className="flex gap-4 items-center w-full md:w-auto">
                    <div className="relative w-full md:w-72">
                        <input 
                            type="text" 
                            placeholder="Search Intelligence..." 
                            className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs font-semibold tracking-wide border border-slate-200 bg-white/80 backdrop-blur-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="w-4 h-4 text-sky-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {latestArticles.map((article, i) => (
                    <motion.article
                      key={article.id}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.07 }}
                      className="group relative bg-white/90 backdrop-blur-md rounded-3xl overflow-hidden
                        border border-slate-200/80 hover:border-sky-300
                        shadow-md hover:shadow-xl hover:shadow-sky-500/10
                        hover:-translate-y-1.5
                        h-full flex flex-col transition-all duration-300"
                    >
                        {/* Category badge */}
                        <Link href={`/portal/article/${article.id}`} className="aspect-[16/10] overflow-hidden relative block cursor-pointer bg-slate-100">
                            <Image
                              src={article.image || '/assets/placeholder-article.jpg'}
                              alt={article.title}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 400px"
                              className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            {/* Gradient overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="absolute top-4 left-4 flex items-center gap-2">
                                <span className="flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-md border border-white/20">
                                    <Tag size={10} className="text-sky-400" />
                                    {article.category}
                                </span>
                            </div>
                        </Link>

                        <div className="p-6 flex flex-col flex-1 relative">
                            {/* Meta row */}
                            <div className="flex items-center gap-2.5 text-[10px] text-slate-500 mb-3 font-semibold uppercase tracking-wider">
                                <span className="flex items-center gap-1 text-slate-600">
                                    <Clock size={12} className="text-sky-500" />
                                    {article.time}
                                </span>
                                <span className="text-slate-300">·</span>
                                <span className="flex items-center gap-1 text-slate-600">
                                    <User size={12} className="text-sky-500" />
                                    {article.author}
                                </span>
                            </div>

                            {/* Title */}
                            <Link href={`/portal/article/${article.id}`}>
                                <h4 className="text-base font-black text-slate-900 mb-2.5 leading-snug group-hover:text-sky-600 transition-colors cursor-pointer line-clamp-2 tracking-tight">
                                    {article.title}
                                </h4>
                            </Link>

                            {/* Excerpt */}
                            <Link href={`/portal/article/${article.id}`} className="cursor-pointer flex-1 mb-5">
                                <p className="text-slate-600 text-xs font-normal line-clamp-3 leading-relaxed">
                                    {article.excerpt}
                                </p>
                            </Link>

                            {/* Footer row */}
                            <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                                <Link
                                    href={`/portal/article/${article.id}`}
                                    className="flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 transition-colors group/btn"
                                >
                                    <span>Read Dispatch</span>
                                    <ArrowRight size={13} className="transition-transform group-hover/btn:translate-x-1" />
                                </Link>

                                <button
                                    onClick={() => handleReadArticle(article.title + ". " + article.excerpt)}
                                    aria-label={`Listen to article: ${article.title}`}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-500
                                      hover:text-sky-600 transition-all group/audio px-2.5 py-1.5 rounded-xl
                                      hover:bg-sky-50 border border-transparent hover:border-sky-100"
                                >
                                    <Volume2 size={13} className="text-sky-500 transition-transform group-hover/audio:scale-110" />
                                    <span>Audio</span>
                                </button>
                            </div>
                        </div>
                    </motion.article>
                ))}
            </div>
        </section>

        {/* 5. PODCASTS / AUDIO INTELLIGENCE */}
        <section id="podcasts" className="bg-white border border-slate-200/80 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden shadow-xl shadow-sky-950/5">
             {/* Decorative Background Elements */}
             <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/5 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />
             <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-100/30 rounded-full blur-[100px] -ml-40 -mb-40 pointer-events-none" />

              <div className="flex flex-col md:flex-row justify-between items-center border-b border-slate-100 pb-6 mb-8 relative z-10 gap-4">
                <div className="text-center md:text-left">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100/60 border border-sky-200 text-sky-700 font-bold text-[10px] uppercase tracking-widest mb-2">
                      <Headphones className="w-3 h-3 text-sky-500" />
                      <span>Audio Transmissions</span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-1 tracking-tight uppercase">Intelligence Briefings</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Auditory deep-dives into basin protection</p>
                </div>
                <Link href="/podcasts" className="group/nav bg-sky-50 hover:bg-sky-500 text-sky-600 hover:text-white transition-all px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider border border-sky-200 hover:border-sky-500 shadow-sm flex items-center gap-2">
                    <Mic size={14} className="transition-transform group-hover/nav:scale-110" />
                    <span>Explore All Podcasts</span>
                </Link>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
                 {podcasts.map((podcast, i) => (
                     <div key={i} onClick={() => setPlayingPodcast(podcast.id)} className="bg-slate-50/70 hover:bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-sky-300 transition-all duration-300 flex items-center gap-5 group cursor-pointer hover:shadow-md">
                         <div className="w-18 h-18 shrink-0 rounded-2xl overflow-hidden relative shadow-sm bg-slate-900">
                             <Image 
                               src={podcast.image || '/assets/placeholder-podcast.jpg'} 
                               alt={podcast.title} 
                               fill
                               sizes="72px"
                               className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-90" 
                             />
                             <div className="absolute inset-0 bg-sky-600/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                 <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-lg text-sky-600">
                                     <PlayCircle size={20} />
                                 </div>
                             </div>
                         </div>
                          <div className="flex-1 min-w-0">
                             <h5 className="font-bold text-slate-900 text-sm mb-1 leading-tight line-clamp-1 group-hover:text-sky-600 transition-colors">{podcast.title}</h5>
                             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider line-clamp-1 mb-2.5">{podcast.episode}</p>
                             <div className="flex items-center gap-3 text-[10px] text-sky-600 font-bold uppercase tracking-wider">
                                 <span className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                                    <Clock size={11} className="text-sky-500" />
                                    {podcast.duration}
                                 </span>
                                 <span className="text-slate-300">·</span>
                                 <span className={playingPodcast === podcast.id ? "text-emerald-600 font-bold animate-pulse" : "text-slate-500"}>
                                   {playingPodcast === podcast.id ? "Playing Audio..." : "Listen Episode"}
                                 </span>
                             </div>
                             {playingPodcast === podcast.id && (
                                <div className="mt-3 flex gap-1 h-3 items-end">
                                    {[1, 2, 3, 4, 5, 2, 1, 4, 3, 2].map((h, j) => (
                                        <motion.div 
                                          key={j}
                                          animate={{ height: ['20%', '100%', '20%'] }}
                                          transition={{ duration: 0.5 + (j * 0.1), repeat: Infinity }}
                                          className="w-1 bg-sky-500 rounded-full"
                                        />
                                    ))}
                                </div>
                             )}
                         </div>
                     </div>
                 ))}
                 
                 {podcasts.length === 0 && (
                     <p className="text-slate-500 text-sm italic">No podcasts available yet.</p>
                 )}
            </div>
        </section>

        {/* 6. UPCOMING EVENTS */}
        {events.length > 0 && (
        <section id="events" className="animate-fade-in pb-12">
             <div className="flex justify-between items-end border-b border-slate-200 pb-4 mb-8">
                <div>
                   <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100/60 border border-sky-200 text-sky-700 font-bold text-[10px] uppercase tracking-widest mb-2">
                     <CalendarDays className="w-3 h-3 text-sky-500" />
                     <span>Field Activities</span>
                   </div>
                   <h3 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">
                     Network Deployments
                   </h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Strategic Environment Operations</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {events.map((event, i) => (
                    <div key={i} className="group relative bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-sky-300 transition-all duration-300 overflow-hidden flex flex-col justify-between">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-sky-100/40 rounded-full blur-xl group-hover:bg-sky-200/40 transition-all" />
                        <div>
                          <div className="bg-sky-50 text-sky-700 font-bold text-[10px] uppercase mb-4 px-3 py-1 rounded-full w-fit tracking-wider border border-sky-100">
                              {event.date}
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm mb-3 leading-snug group-hover:text-sky-600 transition-colors">{event.title}</h4>
                        </div>
                        <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                <MapPin size={13} className="text-sky-500" />
                                <span className="line-clamp-1">{event.location}</span>
                            </div>
                            <ArrowUpRight size={15} className="text-slate-400 group-hover:text-sky-600 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </div>
                    </div>
                ))}
            </div>
        </section>
        )}
      </div>
    </div>
  );
}
