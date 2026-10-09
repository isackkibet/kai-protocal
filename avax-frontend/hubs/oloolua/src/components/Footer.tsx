'use client';

import React from 'react';
import Link from 'next/link';
import { TreePine, MapPin, Mail, Phone, ExternalLink, Loader2 } from 'lucide-react';
import { useMessageForm } from '@/lib/useMessageForm';
import { Honeypot, FormFeedback } from './FormBits';

const PHONES = ['0112583681', '0742004641', '0725772240'];
const EMAIL = 'austinnamuye@gmail.com';
const INSTAGRAM = 'https://www.instagram.com/oloolua_forest_youth_guardians?igsh=MXBkaXpyd2tuMTQ1Mw==';

export default function Footer() {
  const newsletter = useMessageForm('newsletter');

  return (
    <footer className="bg-[#07130d] border-t border-[#e4c878]/20 text-gray-300 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">

          {/* Col 1: About + newsletter */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TreePine className="w-6 h-6 text-[#e4c878]" />
              <span className="font-bold text-white text-lg tracking-tight">Oloolua Youth Guardians</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Oloolua Forest Community Forest Association (CFA) Seedling User Group. Dedicated to indigenous tree seedling production, Oloolua forest restoration, and sustainable youth livelihoods.
            </p>
            <form onSubmit={newsletter.onSubmit} className="space-y-2 relative">
              <label htmlFor="newsletter-email" className="text-[11px] font-bold uppercase tracking-wider text-[#e4c878]">
                Stay Updated
              </label>
              <Honeypot />
              <div className="flex gap-2">
                <input
                  id="newsletter-email"
                  type="email"
                  name="contact"
                  required
                  placeholder="Your email"
                  className="flex-1 min-w-0 bg-[#0d2219] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#e4c878]/60 placeholder-gray-600"
                />
                <button
                  type="submit"
                  disabled={newsletter.status === 'sending'}
                  className="px-3 py-2 rounded-lg bg-[#e4c878] hover:bg-amber-300 disabled:opacity-60 text-neutral-950 font-bold text-xs transition-colors whitespace-nowrap flex items-center gap-1.5"
                >
                  {newsletter.status === 'sending' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Subscribe
                </button>
              </div>
              <FormFeedback status={newsletter.status} message={newsletter.feedback} />
            </form>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-[#e4c878] font-bold text-sm uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/" className="hover:text-white transition-colors">Home Page</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">About Guardians CFA</Link></li>
              <li><Link href="/seedlings" className="hover:text-white transition-colors">Tree Nursery & Seedbeds</Link></li>
              <li><Link href="/activities" className="hover:text-white transition-colors">Conservation Activities</Link></li>
              <li><Link href="/projects" className="hover:text-white transition-colors">Art in Nature & Rock Mural</Link></li>
              <li><Link href="/beekeeping" className="hover:text-white transition-colors">Apiculture & Livelihoods</Link></li>
              <li><Link href="/workshops" className="hover:text-white transition-colors">Community Workshops</Link></li>
            </ul>
          </div>

          {/* Col 3: Kai ledger */}
          <div>
            <h4 className="text-[#e4c878] font-bold text-sm uppercase tracking-wider mb-4">Guardian Hub</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/portal" className="hover:text-white transition-colors">AI Guardian</Link></li>
              <li><Link href="/portal?tab=nursery" className="hover:text-white transition-colors">Nursery Records</Link></li>
              <li><Link href="/portal?tab=diary" className="hover:text-white transition-colors">Keeper Diary</Link></li>
              <li><Link href="/portal?tab=record" className="hover:text-white transition-colors">Record an Activity</Link></li>
              <li><Link href="/portal?tab=verify" className="hover:text-white transition-colors">Verification Queue</Link></li>
            </ul>
          </div>

          {/* Col 4: Contact */}
          <div className="space-y-3">
            <h4 className="text-[#e4c878] font-bold text-sm uppercase tracking-wider mb-4">Contact CFA</h4>
            <div className="flex items-start gap-2 text-xs text-gray-300">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Oloolua Forest Station, Kajiado North, Kenya</span>
            </div>
            {PHONES.map((phone) => (
              <a key={phone} href={`tel:${phone}`} className="flex items-center gap-2 text-xs text-gray-300 hover:text-white transition-colors">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{phone}</span>
              </a>
            ))}
            <a href={`mailto:${EMAIL}`} className="flex items-center gap-2 text-xs text-gray-300 hover:text-white transition-colors break-all">
              <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{EMAIL}</span>
            </a>
            <a
              href={INSTAGRAM}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-700 to-pink-600 text-white font-semibold text-xs hover:opacity-90 transition-opacity"
            >
              Instagram
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-800 flex flex-wrap justify-between items-center text-xs text-gray-500 gap-4">
          <div>
            © {new Date().getFullYear()} Oloolua Forest Youth Guardians CFA. Powered by <span className="text-[#e4c878]">Kai Conservation Information Hub</span>.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/portal" className="hover:text-gray-300 transition-colors">Sign in</Link>
            <span>·</span>
            <Link href="/inbox" className="hover:text-gray-300 transition-colors">Team Inbox</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
