'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useReducedMotion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import { NURSERY_SPECIES_CATALOGUE } from '@/data/species';
import { Reveal, CountUp } from '@/components/Motion';
import { Honeypot, FormFeedback } from '@/components/FormBits';
import { useMessageForm } from '@/lib/useMessageForm';
import {
  TreePine, Users, HeartHandshake, Globe, ArrowRight,
  Sparkles, BarChart3, Leaf, Camera, Rocket, Bot,
  Landmark, Clipboard, Check, Loader2
} from 'lucide-react';

/* ─────────────── DATA ─────────────── */

const ACTIVITY_CARDS = [
  { img: '/assets/images/forest5.jpeg', label: 'Tree Planting', desc: 'Restoring forest ecosystems', href: '/seedlings' },
  { img: '/assets/images/forest6.jpeg', label: 'Seedling Collecting', desc: 'Exploring forest biodiversity', href: '/seedlings' },
  { img: '/assets/images/workshop.jpg', label: 'Community Workshops', desc: 'Environmental education', href: '/workshops' },
  { img: '/assets/images/bee1.jpeg', label: 'Beekeeping', desc: 'Sustainable apiculture', href: '/beekeeping' },
];

const TREE_SPECIES = [
  { img: '/assets/images/silver.jpeg',  name: 'Silver Oak',      sci: 'Grevillea robusta',         local: 'Mukima' },
  { img: '/assets/images/thika_palm.jpg', name: 'Thika Palm',    sci: 'Hyphaene compressa',        local: 'Mkoma' },
  { img: '/assets/images/makhamia.jpg',  name: 'Makhamia',       sci: 'Markhamia lutea',           local: 'Muu' },
  { img: '/assets/images/chestnut.jpg',  name: 'Chestnut',       sci: 'Castanea spp.',             local: 'Chestnut' },
  { img: '/assets/images/drypetes.jpg',  name: 'Drypetes',       sci: 'Drypetes gerrardii',        local: 'Mutanga' },
  { img: '/assets/images/croton.jpeg',   name: 'Croton',         sci: 'Croton megalocarpus',       local: 'Mutonya' },
  { img: '/assets/images/sisal.jpg',     name: 'Sisal',          sci: 'Agave sisalana',            local: 'Mkonge' },
  { img: '/assets/images/acacia.jpeg',   name: 'Acacia',         sci: 'Vachellia spp.',            local: 'Mgunga' },
  { img: '/assets/images/olea.jpeg',    name: 'African Olive',  sci: 'Olea europaea subsp.',      local: 'Mutamaiyu' },
];

const FUTURE_PLANS = [
  { img: '/assets/images/future1.jpeg',  label: 'Canopy Viewing Deck' },
  { img: '/assets/images/future2.jpeg',  label: 'Treehouse & Play Area' },
  { img: '/assets/images/future4.jpeg',  label: 'Tree Observation Platform' },
  { img: '/assets/images/future5.jpeg',  label: 'Eco-Picnic Glamping' },
  { img: '/assets/images/future6.jpeg',  label: 'Meditation & Wellness Hut' },
  { img: '/assets/images/future7.jpeg',  label: 'Outdoor Giant Games' },
  { img: '/assets/images/future8.jpeg',  label: 'Forest Music & Retreat' },
  { img: '/assets/images/future9.jpeg',  label: 'Green Cafe & Picnic Space' },
  { img: '/assets/images/future11.jpeg', label: 'Forest Fitness & Training' },
  { img: '/assets/images/future12.jpeg', label: 'Lakeside Hammock Circle' },
  { img: '/assets/images/future13.jpeg', label: 'Youth Sports & Recreation' },
  { img: '/assets/images/future14.jpeg', label: 'Community Forest Banquets' },
  { img: '/assets/images/future15.jpeg', label: 'Eco-Lounge & Evening Space' },
  { img: '/assets/images/future16.jpeg', label: 'Serenity Hammock Garden' },
];

// Rotating hero backgrounds
const HERO_IMAGES = [
  '/assets/images/gal1.jpeg',
  '/assets/images/gal8.jpeg',
  '/assets/images/gal53.jpeg',
  '/assets/images/gal57.jpeg',
  '/assets/images/act1.jpeg',
];

// Gallery strip: real photos from the forest
const GALLERY_STRIP = [
  '/assets/images/gal2.jpeg', '/assets/images/gal4.jpeg', '/assets/images/gal6.jpeg',
  '/assets/images/gal10.jpeg', '/assets/images/gal13.jpeg', '/assets/images/gal14.jpeg',
  '/assets/images/gal15.jpeg', '/assets/images/gal16.jpeg', '/assets/images/gal17.jpeg',
  '/assets/images/gal19.jpeg', '/assets/images/gal20.jpeg', '/assets/images/gal21.jpeg',
];

/* ─────────────── COMPONENT ─────────────── */

export default function HomePage() {
  const [heroBg, setHeroBg] = useState(0);
  const [copiedPaybill, setCopiedPaybill] = useState(false);
  const [heroHovered, setHeroHovered] = useState(false);
  const [zoomKeys, setZoomKeys] = useState<number[]>(() => HERO_IMAGES.map(() => 0));
  const reduceMotion = useReducedMotion();
  const commitment = useMessageForm('commitment');
  const contact = useMessageForm('contact');

  const copyPaybillDetails = () => {
    navigator.clipboard.writeText('247247 / 813367');
    setCopiedPaybill(true);
    setTimeout(() => setCopiedPaybill(false), 2000);
  };

  // Rotate the hero background every 6s, but only while someone could be
  // watching: paused on hover, in a background tab, or for reduced motion.
  useEffect(() => {
    if (reduceMotion || heroHovered) return;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setHeroBg(i => (i + 1) % HERO_IMAGES.length);
      }
    }, 6000);
    return () => clearInterval(id);
  }, [reduceMotion, heroHovered]);

  // Restart the Ken Burns zoom on whichever slide just became active.
  useEffect(() => {
    setZoomKeys(keys => keys.map((k, i) => (i === heroBg ? k + 1 : k)));
  }, [heroBg]);


  return (
    <div className="min-h-screen bg-[#0b1c14] text-[#f6f2e7] flex flex-col">
      <Navigation />

      {/* ── HERO ── */}
      <section
        className="relative min-h-[92vh] flex items-center justify-center overflow-hidden"
        onMouseEnter={() => setHeroHovered(true)}
        onMouseLeave={() => setHeroHovered(false)}
      >
        {/* Crossfading background images with a slow Ken Burns zoom, synced to the rotation */}
        {HERO_IMAGES.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 transition-opacity duration-[1500ms] overflow-hidden"
            style={{ opacity: i === heroBg ? 0.45 : 0 }}
          >
            {/* Re-keyed on each activation so the zoom restarts from scale 1;
                outgoing slides keep their key and fade out without snapping. */}
            <div key={zoomKeys[i]} className="absolute inset-0 animate-[heroZoom_9s_ease-out_forwards]">
              <Image
                src={src}
                alt=""
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover"
              />
            </div>
          </div>
        ))}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1c14] via-[#0b1c14]/70 to-[#0b1c14]/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b1c14]/60 to-transparent" />

        <div className="relative z-10 max-w-5xl mx-auto text-center px-4 space-y-7 pt-16 pb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-900/80 border border-[#e4c878]/40 text-xs font-bold text-[#e4c878] backdrop-blur-md shadow-lg uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Conservation Rock Mural &amp; Art in Nature</span>
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-none text-white drop-shadow-2xl">
            OLOOLUA<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-[#e4c878] to-teal-300">
              YOUTH GUARDIANS
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-gray-200 leading-relaxed font-light">
            Join us in conserving and protecting our natural heritage,
            restoring the native biological heritage of Oloolua Forest through
            high-quality tree nursery propagation and youth stewardship.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link href="/portal" className="w-full max-w-xs sm:w-auto sm:max-w-none justify-center px-7 py-3.5 rounded-xl font-bold text-sm bg-[#e4c878] hover:bg-amber-300 text-neutral-950 transition-all transform hover:-translate-y-0.5 shadow-2xl flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <span>Ask AI Guardian</span>
            </Link>
            <Link
              href="/portal?tab=record"
              className="w-full max-w-xs sm:w-auto sm:max-w-none justify-center px-7 py-3.5 rounded-xl font-bold text-sm bg-emerald-700/80 hover:bg-emerald-600 text-white border border-emerald-400/30 transition-all flex items-center gap-2 shadow-lg backdrop-blur-md"
            >
              <Leaf className="w-4 h-4" />
              <span>Record Activity</span>
            </Link>
            <Link href="/photogallery" className="w-full max-w-xs sm:w-auto sm:max-w-none justify-center px-7 py-3.5 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-2 backdrop-blur-md">
              <Camera className="w-4 h-4" />
              <span>Photo Gallery</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Slide indicators: click to jump to a background */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2" role="group" aria-label="Hero background slides">
          {HERO_IMAGES.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setHeroBg(i)}
              aria-label={`Show background ${i + 1} of ${HERO_IMAGES.length}`}
              aria-current={i === heroBg}
              className={`h-2 rounded-full transition-all duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e4c878] ${
                i === heroBg ? 'w-8 bg-[#e4c878]' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>

        {/* Scroll indicator */}
        <a href="#stats" aria-label="Scroll to content" className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 animate-bounce text-[#e4c878]/60 hover:text-[#e4c878]">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </a>
      </section>

      {/* ── STATS BAR ── */}
      <section id="stats" className="relative z-20 max-w-5xl mx-auto px-4 w-full -mt-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-2xl bg-[#0d2219]/95 border border-[#e4c878]/30 shadow-2xl backdrop-blur-xl">
          {[
            { icon: <TreePine className="w-6 h-6" />, value: NURSERY_SPECIES_CATALOGUE.length, suffix: '', label: 'Species in our catalogue' },
            { icon: <Users className="w-6 h-6" />, value: 30, suffix: '+', label: 'Youth Guardians' },
            { icon: <Globe className="w-6 h-6" />, value: 600, suffix: '+', label: 'Hectares Protected' },
          ].map(({ icon, value, suffix, label }) => (
            <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/30 transition-colors hover:border-[#e4c878]/40">
              <div className="w-11 h-11 rounded-xl bg-emerald-600/30 flex items-center justify-center text-[#e4c878] shrink-0">{icon}</div>
              <div>
                <div className="text-2xl font-black text-white tabular-nums"><CountUp value={value} suffix={suffix} /></div>
                <div className="text-[11px] text-emerald-300/80 font-medium leading-tight">{label}</div>
              </div>
            </div>
          ))}
          {/* Live nursery figures are Guardian data: shown only to signed-in members (PRD B2). */}
          <Link href="/portal" className="group flex items-center gap-3 p-3 rounded-xl bg-emerald-900/40 border border-[#e4c878]/30 hover:border-[#e4c878]/70 transition-colors">
            <div className="w-11 h-11 rounded-xl bg-[#e4c878]/20 flex items-center justify-center text-[#e4c878] shrink-0"><Bot className="w-6 h-6" /></div>
            <div>
              <div className="text-sm font-black text-white group-hover:text-[#e4c878] transition-colors">AI Guardian</div>
              <div className="text-[11px] text-emerald-300/80 font-medium leading-tight">Live nursery records, sign in</div>
            </div>
          </Link>
        </div>
      </section>

      {/* ── ACTIVITIES (from HTML template) ── */}
      <section className="py-20 px-4 max-w-7xl mx-auto w-full">
        <Reveal className="text-center mb-12 space-y-2">
          <span className="text-[#e4c878] text-xs font-bold uppercase tracking-widest">What We Do</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Our Activities &amp; Indigenous Trees</h2>
          <p className="text-gray-400 max-w-xl mx-auto text-sm">
            From tree planting and seedling collection to beekeeping and community education.
          </p>
        </Reveal>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {ACTIVITY_CARDS.map(({ img, label, desc, href }, i) => (
            <Reveal key={label} delay={i * 0.08}>
              <Link href={href} className="group block h-full rounded-2xl overflow-hidden border border-[#e4c878]/20 hover:border-[#e4c878]/60 transition-all shadow-xl hover:shadow-emerald-900/40 hover:-translate-y-1 duration-300">
                <div className="relative h-48 overflow-hidden">
                  <img src={img} alt={label} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b1c14] via-transparent to-transparent" />
                </div>
                <div className="p-4 bg-[#122b1f]">
                  <h3 className="font-bold text-white group-hover:text-[#e4c878] transition-colors">{label}</h3>
                  <p className="text-xs text-gray-400 mt-1">{desc}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── GALLERY STRIP ── */}
      <section className="py-12 bg-[#0a1910] border-y border-[#e4c878]/15 overflow-hidden">
        <Reveal className="text-center mb-8 px-4">
          <span className="text-[#e4c878] text-xs font-bold uppercase tracking-widest">Our Forest</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Discover Oloolua&apos;s Beauty</h2>
          <p className="text-gray-400 text-sm mt-1">Journey through conservation work, wildlife, and native flora. Hover to pause.</p>
        </Reveal>
        {/* Scrolling strip; pauses on hover (see .marquee-track in globals.css) */}
        <div className="relative overflow-hidden">
          <div className="marquee-track flex gap-3 w-max animate-[slideLeft_40s_linear_infinite]">
            {[...GALLERY_STRIP, ...GALLERY_STRIP].map((src, i) => (
              <Link
                key={i}
                href="/photogallery"
                aria-hidden={i >= GALLERY_STRIP.length}
                tabIndex={i >= GALLERY_STRIP.length ? -1 : undefined}
                className="w-56 h-40 rounded-xl overflow-hidden shrink-0 border border-white/10 hover:border-[#e4c878]/60 transition-colors"
              >
                <img
                  src={src}
                  alt={i < GALLERY_STRIP.length ? `Oloolua Forest photo ${i + 1}` : ''}
                  loading="lazy"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </Link>
            ))}
          </div>
        </div>
        <div className="text-center mt-8">
          <Link href="/photogallery" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#e4c878] hover:bg-amber-300 text-neutral-950 font-bold text-sm transition-all shadow-lg">
            <Camera className="w-4 h-4" />
            Explore Full Photo Stream
          </Link>
        </div>
      </section>

      {/* ── TREE SPECIES (from HTML planted-trees section) ── */}
      <section className="py-20 px-4 max-w-7xl mx-auto w-full">
        <Reveal className="text-center mb-12 space-y-2">
          <span className="text-[#e4c878] text-xs font-bold uppercase tracking-widest">Nursery Stock</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Species in Our Nursery</h2>
          <p className="text-gray-400 max-w-xl mx-auto text-sm">
            Indigenous, fruit, timber, and restoration species propagated for the Oloolua ecosystem.
          </p>
        </Reveal>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {TREE_SPECIES.map(({ img, name, sci, local }, i) => (
            <Reveal key={name} delay={(i % 5) * 0.06}>
              <Link href="/seedlings" className="group block h-full rounded-2xl overflow-hidden border border-[#e4c878]/20 hover:border-[#e4c878]/50 bg-[#122b1f] transition-all hover:-translate-y-1 duration-300 shadow-lg">
                <div className="relative h-44 overflow-hidden">
                  <img src={img} alt={name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b1c14] to-transparent" />
                  <div className="absolute bottom-2 left-3 right-3">
                    <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full">{local}</span>
                  </div>
                </div>
                <div className="p-3 space-y-0.5">
                  <h3 className="font-bold text-white text-sm group-hover:text-[#e4c878] transition-colors leading-tight">{name}</h3>
                  <p className="text-[11px] italic text-gray-400">{sci}</p>
                </div>
              </Link>
            </Reveal>
          ))}

          {/* "View All" tile */}
          <Reveal delay={0.3}>
            <Link href="/seedlings" className="group h-full rounded-2xl overflow-hidden border-2 border-dashed border-[#e4c878]/30 hover:border-[#e4c878]/60 bg-[#0d2219] transition-all hover:-translate-y-1 duration-300 flex items-center justify-center min-h-[220px]">
              <div className="text-center p-4 space-y-2">
                <Leaf className="w-6 h-6 text-[#e4c878] mx-auto transition-transform duration-300 group-hover:rotate-12" />
                <div className="text-sm font-bold text-[#e4c878]">View All Species</div>
                <div className="text-[11px] text-gray-400">Full Seedbed Ledger &rarr;</div>
              </div>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── KAI HUB BANNER ── */}
      <section className="py-12 bg-gradient-to-r from-emerald-950 via-[#0b1c14] to-emerald-950 border-y border-[#e4c878]/30 px-4">
        <Reveal className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-900/60 border border-emerald-700 text-xs font-semibold text-emerald-300">
              <BarChart3 className="w-4 h-4 text-[#e4c878]" />
              <span>Kai CFA Conservation Information Hub</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white">
              Verifiable Operational Ledger for Oloolua Youth
            </h3>
            <p className="text-xs text-gray-300 max-w-2xl leading-relaxed">
              Every propagation event, sale, donation, and planting is backed by auditable
              transactions, evidence photos, and verifier check-offs according to the Kai PRD.
            </p>
          </div>
          <Link href="/portal" className="group px-7 py-3.5 rounded-xl font-bold text-sm bg-[#e4c878] hover:bg-amber-300 text-neutral-950 transition-all shadow-xl shrink-0 flex items-center gap-2">
            Open AI Guardian
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </section>

      {/* ── FUTURE PLANS (from HTML) ── */}
      <section className="py-20 px-4 max-w-7xl mx-auto w-full" id="future-plans">
        <Reveal className="text-center mb-12 space-y-2">
          <span className="text-[#e4c878] text-xs font-bold uppercase tracking-widest">What We&apos;re Building Next</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white flex items-center justify-center gap-2.5">
            <Rocket className="w-7 h-7 text-[#e4c878]" />
            <span>Our Future Plans</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-sm">
            From eco-tourism to science, art, and green enterprise: a glimpse into the projects
            we intend to develop with your support.
          </p>
        </Reveal>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {FUTURE_PLANS.map(({ img, label }, i) => (
            <Reveal key={label} delay={(i % 4) * 0.06}>
              <div className="group relative rounded-2xl overflow-hidden border border-white/10 hover:border-[#e4c878]/40 transition-all shadow-lg aspect-[4/3]">
                <img src={img} alt={label} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b1c14]/90 to-transparent flex items-end p-3">
                  <span className="text-xs font-bold text-white opacity-90 group-hover:text-[#e4c878] transition-colors">{label}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="text-center mt-10">
          <a href="#donate" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm transition-all shadow-xl">
            <TreePine className="w-4 h-4" />
            Support Our Future
          </a>
        </div>
      </section>

      {/* ── EQUITY / DONATE (from HTML) ── */}
      <section className="py-16 px-4 bg-[#071209] border-t border-[#e4c878]/20" id="donate">
        <div className="max-w-4xl mx-auto">
          <Reveal className="text-center mb-10 space-y-2">
            <span className="text-[#e4c878] text-xs font-bold uppercase tracking-widest">Support Our Mission</span>
            <h2 className="text-3xl font-extrabold text-white flex items-center justify-center gap-2.5">
              <HeartHandshake className="w-7 h-7 text-emerald-400" />
              <span>Invest in Oloolua Forest</span>
            </h2>
            <p className="text-gray-400 text-sm">Your contribution plants trees, pays youth guardians, and protects Kenya&apos;s natural heritage.</p>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Paybill Card */}
            <div className="rounded-2xl bg-[#0d2219] border border-[#e4c878]/30 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Landmark className="w-8 h-8 text-[#e4c878]" />
                <div>
                  <div className="font-bold text-white">Equity Bank</div>
                  <div className="text-xs text-gray-400">M-Pesa Paybill</div>
                </div>
              </div>
              <div className="space-y-3 border-t border-white/10 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Paybill Number</span>
                  <span className="font-black text-[#e4c878] text-lg tracking-widest">247247</span>
                </div>
                <div className="flex justify-between items-center border-t border-white/10 pt-3">
                  <span className="text-sm text-gray-400">Account Number</span>
                  <span className="font-black text-[#e4c878] text-lg tracking-widest">813367</span>
                </div>
              </div>
              <button
                onClick={copyPaybillDetails}
                className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {copiedPaybill ? <Check className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
                <span>{copiedPaybill ? 'Details Copied' : 'Copy Details'}</span>
              </button>
              <p className="text-xs text-gray-500 text-center">M-Pesa &rarr; Lipa na M-Pesa &rarr; Paybill &rarr; Enter details above</p>
            </div>

            {/* Commitment Form */}
            <div className="rounded-2xl bg-[#0d2219] border border-[#e4c878]/30 p-6 space-y-4">
              <h3 className="font-bold text-white text-lg">Make a Commitment</h3>
              <form onSubmit={commitment.onSubmit} className="space-y-4 relative">
                <Honeypot />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="commit-name" className="text-xs text-gray-400 mb-1 block">Full Name</label>
                    <input id="commit-name" name="name" type="text" required maxLength={120} autoComplete="name" placeholder="Your full name" className="w-full bg-[#071209] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#e4c878]/50 placeholder-gray-600" />
                  </div>
                  <div>
                    <label htmlFor="commit-contact" className="text-xs text-gray-400 mb-1 block">Email / Phone</label>
                    <input id="commit-contact" name="contact" type="text" required maxLength={160} autoComplete="email" placeholder="Email or phone" className="w-full bg-[#071209] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#e4c878]/50 placeholder-gray-600" />
                  </div>
                </div>
                <div>
                  <label htmlFor="commit-message" className="text-xs text-gray-400 mb-1 block">Your Message (optional)</label>
                  <input id="commit-message" name="message" type="text" maxLength={2000} placeholder="E.g., in memory of someone, dedicate to a school…" className="w-full bg-[#071209] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#e4c878]/50 placeholder-gray-600" />
                </div>
                <button
                  type="submit"
                  disabled={commitment.status === 'sending'}
                  className="w-full py-3 rounded-xl bg-[#e4c878] hover:bg-amber-300 disabled:opacity-60 disabled:cursor-wait text-neutral-950 font-bold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {commitment.status === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : <TreePine className="w-4 h-4" />}
                  <span>{commitment.status === 'sending' ? 'Sending...' : 'Send Commitment'}</span>
                </button>
                <FormFeedback status={commitment.status} message={commitment.feedback} />
              </form>
              <p className="text-xs text-gray-500 text-center">We&apos;ll acknowledge your support and keep you updated on impact.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT ── (newsletter + contact details live in the global Footer) */}
      <section className="py-16 px-4 max-w-4xl mx-auto w-full" id="contact">
        <Reveal className="text-center mb-10 space-y-2">
          <h2 className="text-2xl font-extrabold text-white">Contact Us</h2>
          <p className="text-gray-400 text-sm">Have questions? Reach out to our community leaders.</p>
        </Reveal>
        <form onSubmit={contact.onSubmit} className="space-y-4 max-w-lg mx-auto relative">
          <Honeypot />
          <label htmlFor="contact-name" className="sr-only">Your name</label>
          <input id="contact-name" name="name" type="text" placeholder="Your Name" required maxLength={120} autoComplete="name" className="w-full bg-[#0d2219] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#e4c878]/50 placeholder-gray-600" />
          <label htmlFor="contact-email" className="sr-only">Your email</label>
          <input id="contact-email" name="contact" type="email" placeholder="Your Email" required maxLength={160} autoComplete="email" className="w-full bg-[#0d2219] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#e4c878]/50 placeholder-gray-600" />
          <label htmlFor="contact-message" className="sr-only">Your message</label>
          <textarea id="contact-message" name="message" rows={4} placeholder="Your Message" required maxLength={2000} className="w-full bg-[#0d2219] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#e4c878]/50 placeholder-gray-600 resize-none" />
          <button
            type="submit"
            disabled={contact.status === 'sending'}
            className="w-full py-3 rounded-xl bg-[#e4c878] hover:bg-amber-300 disabled:opacity-60 disabled:cursor-wait text-neutral-950 font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {contact.status === 'sending' && <Loader2 className="w-4 h-4 animate-spin" />}
            {contact.status === 'sending' ? 'Sending...' : 'Send Message'}
          </button>
          <FormFeedback status={contact.status} message={contact.feedback} />
        </form>
      </section>



      {/* Keyframes for the scrolling gallery strip and the hero Ken Burns zoom */}
      <style>{`
        @keyframes slideLeft {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes heroZoom {
          from { transform: scale(1); }
          to { transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
}
