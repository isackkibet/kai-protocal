"use client";

import React, { useState, useRef, useEffect } from 'react';
import { UnifiedContentItem } from '@/types/contentHub';
import { calendarService } from '@/services/calendarService';
import { Calendar, Download, ExternalLink, ChevronDown } from 'lucide-react';

interface AddToCalendarButtonProps {
  item: UnifiedContentItem;
  className?: string;
}

export default function AddToCalendarButton({ item, className = '' }: AddToCalendarButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  if (!item.event) return null;

  const handleDownload = () => {
    calendarService.downloadIcs(item);
    setIsOpen(false);
  };

  const googleUrl = calendarService.getGoogleCalendarUrl(item);

  return (
    <div className={`relative inline-block ${className}`} ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary-light text-sm font-semibold transition-all shadow-sm"
      >
        <Calendar className="w-4 h-4 text-primary" />
        <span>Add to Calendar</span>
        <ChevronDown className="w-3.5 h-3.5 opacity-70" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-700/80 p-1.5 shadow-2xl z-40 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          <button
            onClick={handleDownload}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg text-left transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <div>
              <div className="font-semibold">Download iCal (.ics)</div>
              <div className="text-[10px] text-slate-400">Apple Calendar, Outlook, Phone</div>
            </div>
          </button>

          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg text-left transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
            <div>
              <div className="font-semibold">Google Calendar</div>
              <div className="text-[10px] text-slate-400">Open in browser tab</div>
            </div>
          </a>
        </div>
      )}
    </div>
  );
}
