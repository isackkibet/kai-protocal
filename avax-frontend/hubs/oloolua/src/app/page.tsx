'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import RecordActivityModal from '@/components/RecordActivityModal';
import { 
  TreePine, Users, HeartHandshake, Globe, ArrowRight,
  Sparkles, ShieldCheck, BarChart3, ChevronRight,
  Phone, Mail
} from 'lucide-react';
import { 
  INITIAL_SPECIES, INITIAL_SEEDBEDS, INITIAL_TRANSACTIONS,
  calculateNurseryMetrics 
} from '@/services/kaiLedger';
import { ConservationActivity } from '@/types/kai';

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

// Gallery strip — real photos from the forest
const GALLERY_STRIP = [
  '/assets/images/gal2.jpeg', '/assets/images/gal4.jpeg', '/assets/images/gal6.jpeg',
  '/assets/images/gal10.jpeg', '/assets/images/gal13.jpeg', '/assets/images/gal14.jpeg',
  '/assets/images/gal15.jpeg', '/assets/images/gal16.jpeg', '/assets/images/gal17.jpeg',
  '/assets/images/gal19.jpeg', '/assets/images/gal20.jpeg', '/assets/images/gal21.jpeg',
];

/* ─────────────── COMPONENT ─────────────── */

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [heroBg, setHeroBg] = useState(0);
  const metrics = calculateNurseryMetrics(transactions);

  // Rotate hero background every 5s
  useEffect(() => {
    const id = setInterval(() => setHeroBg(i => (i + 1) % HERO_IMAGES.length), 5000);
    return () => clearInterval(id);
  }, []);

  const handleAddActivity = (activity: ConservationActivity) => {
    const newTxn = {
      id: `TXN-${Date.now().toString().slice(-5)}`,
      transactionType: activity.eventType as any,
      nurseryId: activity.nurseryId,
      seedbedId: activity.seedbedId,
      speciesId: activity.speciesId,
      quantity: activity.quantity,
      direction: (['SALE','DONATION','PLANTING','MORTALITY'].includes(activity.eventType)) ? 'OUT' : 'IN' as any,
      date: activity.date,
      source: `ACTIVITY_${activity.eventType}`,
      recordedBy: activity.recordedBy,
      verificationStatus: activity.verificationStatus,
      createdAt: new Date().toISOString()
    };
    setTransactions(prev => [newTxn, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[#0b1c14] text-[#f6f2e7] flex flex-col">
      <Navigation onOpenRecordActivity={() => setIsModalOpen(true)} />

      {/* ── KAI Ecosystem Bar (from original HTML) ── */}
      <div className="bg-[#060f0a] text-xs px-5 py-2 border-b border-[#e4c878]/20 flex flex-wrap justify-between items-center gap-2 font-medium">
        <div className="flex items-center gap-2">
          <span className="text-[#e4c878] font-bold uppercase tracking-wide">KAI Nuvari Ecosystem</span>
          <span className="opacity-30">·</span>
          <span className="text-gray-400">Pilot CFA Partner</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/portal" className="text-[#e4c878] hover:text-amber-300 font-semibold transition-colors">Conservation / CFA Hub →</Link>
          <Link href="/portal" className="text-[#a0c4b4] hover:text-white transition-colors">SIHU Media Hub</Link>
          <Link href="/portal" className="text-[#a0c4b4] hover:text-white transition-colors">KAI CFA Dashboard</Link>
          <Link href="/portal" className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded font-bold transition-colors text-[11px]">Guardian Portal</Link>
        </div>
      </div>

      {/* ── HERO ── */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        {/* Crossfading background images */}
        {HERO_IMAGES.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-[1500ms]"
            style={{
              backgroundImage: `url('${src}')`,
              opacity: i === heroBg ? 0.45 : 0,
            }}
          />
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
            Join us in conserving and protecting our natural heritage —
            restoring the native biological heritage of Oloolua Forest through
            high-quality tree nursery propagation and youth stewardship.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link href="/portal" className="px-7 py-3.5 rounded-xl font-bold text-sm bg-[#e4c878] hover:bg-amber-300 text-neutral-950 transition-all transform hover:-translate-y-0.5 shadow-2xl flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              <span>Explore Kai Hub &amp; Ledger</span>
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-7 py-3.5 rounded-xl font-bold text-sm bg-emerald-700/80 hover:bg-emerald-600 text-white border border-emerald-400/30 transition-all flex items-center gap-2 shadow-lg backdrop-blur-md"
            >
              <span>🌿</span>
              <span>+ Record Activity</span>
            </button>
            <Link href="/activities" className="px-7 py-3.5 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-2 backdrop-blur-md">
              <span>📷</span>
              <span>Photo Gallery</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce text-[#e4c878]/60">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="relative z-20 max-w-5xl mx-auto px-4 w-full -mt-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-2xl bg-[#0d2219]/95 border border-[#e4c878]/30 shadow-2xl backdrop-blur-xl">
          {[
            { icon: <TreePine className="w-6 h-6" />, val: metrics.currentStock.toLocaleString(), label: 'Seedlings in Nursery' },
            { icon: <Users className="w-6 h-6" />, val: '30+', label: 'Youth Guardians' },
            { icon: <HeartHandshake className="w-6 h-6" />, val: `${metrics.plantedTotal + 600}+`, label: 'Trees Planted' },
            { icon: <Globe className="w-6 h-6" />, val: '600+', label: 'Hectares Protected' },
          ].map(({ icon, val, label }) => (
            <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/30">
              <div className="w-11 h-11 rounded-xl bg-emerald-600/30 flex items-center justify-center text-[#e4c878] shrink-0">{icon}</div>
              <div>
                <div className="text-2xl font-black text-white">{val}</div>
                <div className="text-[11px] text-emerald-300/80 font-medium leading-tight">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ACTIVITIES (from HTML template) ── */}
      <section className="py-20 px-4 max-w-7xl mx-auto w-full">
        <div className="text-center mb-12 space-y-2">
          <span className="text-[#e4c878] text-xs font-bold uppercase tracking-widest">What We Do</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Our Activities &amp; Indigenous Trees</h2>
          <p className="text-gray-400 max-w-xl mx-auto text-sm">
            From tree planting and seedling collection to beekeeping and community education.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {ACTIVITY_CARDS.map(({ img, label, desc, href }) => (
            <Link key={label} href={href} className="group block rounded-2xl overflow-hidden border border-[#e4c878]/20 hover:border-[#e4c878]/60 transition-all shadow-xl hover:shadow-emerald-900/40 hover:-translate-y-1 duration-300">
              <div className="relative h-48 overflow-hidden">
                <img src={img} alt={label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b1c14] via-transparent to-transparent" />
              </div>
              <div className="p-4 bg-[#122b1f]">
                <h3 className="font-bold text-white group-hover:text-[#e4c878] transition-colors">{label}</h3>
                <p className="text-xs text-gray-400 mt-1">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── GALLERY STRIP ── */}
      <section className="py-12 bg-[#0a1910] border-y border-[#e4c878]/15 overflow-hidden">
        <div className="text-center mb-8 px-4">
          <span className="text-[#e4c878] text-xs font-bold uppercase tracking-widest">Our Forest</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Discover Oloolua&apos;s Beauty</h2>
          <p className="text-gray-400 text-sm mt-1">Journey through conservation work, wildlife, and native flora.</p>
        </div>
        {/* Scrolling strip */}
        <div className="relative overflow-hidden">
          <div
            className="flex gap-3 w-max animate-[slideLeft_40s_linear_infinite]"
            style={{ animationPlayState: 'running' }}
          >
            {[...GALLERY_STRIP, ...GALLERY_STRIP].map((src, i) => (
              <div key={i} className="w-56 h-40 rounded-xl overflow-hidden shrink-0 border border-white/10">
                <img src={src} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
            ))}
          </div>
        </div>
        <div className="text-center mt-8">
          <Link href="/activities" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#e4c878] hover:bg-amber-300 text-neutral-950 font-bold text-sm transition-all shadow-lg">
            <span>📷</span>
            Explore Full Photo Stream
          </Link>
        </div>
      </section>

      {/* ── TREE SPECIES (from HTML planted-trees section) ── */}
      <section className="py-20 px-4 max-w-7xl mx-auto w-full">
        <div className="text-center mb-12 space-y-2">
          <span className="text-[#e4c878] text-xs font-bold uppercase tracking-widest">Nursery Stock</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Species in Our Nursery</h2>
          <p className="text-gray-400 max-w-xl mx-auto text-sm">
            Indigenous, fruit, timber, and restoration species propagated for the Oloolua ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {TREE_SPECIES.map(({ img, name, sci, local }) => (
            <Link key={name} href="/seedlings" className="group block rounded-2xl overflow-hidden border border-[#e4c878]/20 hover:border-[#e4c878]/50 bg-[#122b1f] transition-all hover:-translate-y-1 duration-300 shadow-lg">
              <div className="relative h-44 overflow-hidden">
                <img src={img} alt={name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
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
          ))}

          {/* "View All" tile */}
          <Link href="/seedlings" className="group block rounded-2xl overflow-hidden border-2 border-dashed border-[#e4c878]/30 hover:border-[#e4c878]/60 bg-[#0d2219] transition-all hover:-translate-y-1 duration-300 flex items-center justify-center min-h-[220px]">
            <div className="text-center p-4 space-y-2">
              <span>🌱</span>
              <div className="text-sm font-bold text-[#e4c878]">View All Species</div>
              <div className="text-[11px] text-gray-400">Full Seedbed Ledger →</div>
            </div>
          </Link>
        </div>
      </section>

      {/* ── KAI HUB BANNER ── */}
      <section className="py-12 bg-gradient-to-r from-emerald-950 via-[#0b1c14] to-emerald-950 border-y border-[#e4c878]/30 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
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
          <Link href="/portal" className="px-7 py-3.5 rounded-xl font-bold text-sm bg-[#e4c878] hover:bg-amber-300 text-neutral-950 transition-all shadow-xl shrink-0 flex items-center gap-2">
            Open Guardian Portal →
          </Link>
        </div>
      </section>

      {/* ── FUTURE PLANS (from HTML) ── */}
      <section className="py-20 px-4 max-w-7xl mx-auto w-full" id="future-plans">
        <div className="text-center mb-12 space-y-2">
          <span className="text-[#e4c878] text-xs font-bold uppercase tracking-widest">What We&apos;re Building Next</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">🚀 Our Future Plans</h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-sm">
            From eco-tourism to science, art, and green enterprise — a glimpse into the projects
            we intend to develop with your support.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {FUTURE_PLANS.map(({ img, label }) => (
            <div key={label} className="group relative rounded-2xl overflow-hidden border border-white/10 hover:border-[#e4c878]/40 transition-all shadow-lg aspect-[4/3]">
              <img src={img} alt={label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1c14]/90 to-transparent flex items-end p-3">
                <span className="text-xs font-bold text-white opacity-90 group-hover:text-[#e4c878] transition-colors">{label}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <a href="#donate" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm transition-all shadow-xl">
            Support Our Future 🌳
          </a>
        </div>
      </section>

      {/* ── EQUITY / DONATE (from HTML) ── */}
      <section className="py-16 px-4 bg-[#071209] border-t border-[#e4c878]/20" id="donate">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 space-y-2">
            <span className="text-[#e4c878] text-xs font-bold uppercase tracking-widest">Support Our Mission</span>
            <h2 className="text-3xl font-extrabold text-white">💚 Invest in Oloolua Forest</h2>
            <p className="text-gray-400 text-sm">Your contribution plants trees, pays youth guardians, and protects Kenya&apos;s natural heritage.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Paybill Card */}
            <div className="rounded-2xl bg-[#0d2219] border border-[#e4c878]/30 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🏦</span>
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
                onClick={() => { navigator.clipboard.writeText('247247 / 813367'); }}
                className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm transition-colors"
              >
                📋 Copy Details
              </button>
              <p className="text-xs text-gray-500 text-center">M-Pesa → Lipa na M-Pesa → Paybill → Enter details above</p>
            </div>

            {/* Commitment Form */}
            <div className="rounded-2xl bg-[#0d2219] border border-[#e4c878]/30 p-6 space-y-4">
              <h3 className="font-bold text-white text-lg">Make a Commitment</h3>
              <form
                onSubmit={(e) => { e.preventDefault(); alert('Thank you for your commitment! We will be in touch.'); }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Full Name</label>
                    <input type="text" required placeholder="Your full name" className="w-full bg-[#071209] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#e4c878]/50 placeholder-gray-600" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Email / Phone</label>
                    <input type="text" required placeholder="Email or phone" className="w-full bg-[#071209] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#e4c878]/50 placeholder-gray-600" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Your Message (optional)</label>
                  <input type="text" placeholder="E.g., in memory of someone, dedicate to a school…" className="w-full bg-[#071209] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#e4c878]/50 placeholder-gray-600" />
                </div>
                <button type="submit" className="w-full py-3 rounded-xl bg-[#e4c878] hover:bg-amber-300 text-neutral-950 font-bold text-sm transition-colors">
                  Send Commitment 🌳
                </button>
              </form>
              <p className="text-xs text-gray-500 text-center">We&apos;ll acknowledge your support and keep you updated on impact.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT & NEWSLETTER ── */}
      <section className="py-16 px-4 max-w-4xl mx-auto w-full" id="contact">
        <div className="text-center mb-10 space-y-2">
          <h2 className="text-2xl font-extrabold text-white">Contact Us</h2>
          <p className="text-gray-400 text-sm">Have questions? Reach out to our community leaders.</p>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); alert('Message sent! We will get back to you soon.'); }}
          className="space-y-4 max-w-lg mx-auto"
        >
          <input type="text" placeholder="Your Name" required className="w-full bg-[#0d2219] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#e4c878]/50 placeholder-gray-600" />
          <input type="email" placeholder="Your Email" required className="w-full bg-[#0d2219] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#e4c878]/50 placeholder-gray-600" />
          <textarea rows={4} placeholder="Your Message" required className="w-full bg-[#0d2219] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#e4c878]/50 placeholder-gray-600 resize-none" />
          <button type="submit" className="w-full py-3 rounded-xl bg-[#e4c878] hover:bg-amber-300 text-neutral-950 font-bold text-sm transition-colors">
            Send Message
          </button>
        </form>
      </section>

      {/* ── FOOTER (from HTML) ── */}
      <footer className="bg-[#060f0a] border-t border-[#e4c878]/15 px-4 py-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src="/assets/images/logo.jpeg" alt="Logo" className="w-10 h-10 rounded-full object-cover border border-[#e4c878]/30" />
              <h3 className="font-bold text-white">🌳 Oloolua Forest</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Dedicated to forest conservation and community engagement through sustainable practices.
            </p>
            <div className="space-y-1 text-xs text-gray-400">
              <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-[#e4c878]" /> 0112583681</div>
              <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-[#e4c878]" /> 0742004641</div>
              <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-[#e4c878]" /> 0725772240</div>
              <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-[#e4c878]" /> austinnamuye@gmail.com</div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              {[['About', '/about'], ['Mission', '/mission'], ['Vision', '/vision'], ['Activities', '/activities'], ['Seedlings & Nursery', '/seedlings'], ['Guardian Portal', '/portal']].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="hover:text-[#e4c878] transition-colors flex items-center gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5" /> {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect + Newsletter */}
          <div className="space-y-5">
            <div>
              <h3 className="font-bold text-white mb-4">Connect With Us</h3>
              <a
                href="https://www.instagram.com/oloolua_forest_youth_guardians?igsh=MXBkaXpyd2tuMTQ1Mw=="
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-700 to-pink-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                <span>📷</span>
                Instagram
              </a>
            </div>

            <div>
              <h3 className="font-bold text-white mb-3">Stay Updated</h3>
              <form
                onSubmit={(e) => { e.preventDefault(); alert('Subscribed!'); }}
                className="flex gap-2"
              >
                <input type="email" placeholder="Your email" required className="flex-1 bg-[#0d2219] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#e4c878]/50 placeholder-gray-600" />
                <button type="submit" className="px-4 py-2 rounded-lg bg-[#e4c878] hover:bg-amber-300 text-neutral-950 font-bold text-xs transition-colors whitespace-nowrap">
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/5 pt-6 text-center text-xs text-gray-600">
          © 2026 Oloolua Forest Youth Guardians. All rights reserved. · KAI Nuvari Ecosystem
        </div>
      </footer>

      <RecordActivityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        speciesList={INITIAL_SPECIES}
        seedbedList={INITIAL_SEEDBEDS}
        onAddActivity={handleAddActivity}
      />

      {/* Keyframe for scrolling gallery strip */}
      <style>{`
        @keyframes slideLeft {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
