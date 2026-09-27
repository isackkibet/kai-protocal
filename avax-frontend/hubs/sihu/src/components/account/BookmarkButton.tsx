"use client";

import React, { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { accountService } from '@/services/accountService';

interface BookmarkButtonProps {
  contentItemId: string;
  className?: string;
  showText?: boolean;
}

export default function BookmarkButton({
  contentItemId,
  className = '',
  showText = false,
}: BookmarkButtonProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setIsSaved(accountService.isBookmarked(contentItemId));
  }, [contentItemId]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextState = accountService.toggleBookmark(contentItemId);
    setIsSaved(nextState);
  };

  if (!isMounted) return null;

  return (
    <button
      onClick={handleToggle}
      className={`inline-flex items-center gap-1.5 p-2 rounded-xl transition-all ${
        isSaved
          ? 'text-primary bg-primary/20 border border-primary/40'
          : 'text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800 border border-slate-800'
      } ${className}`}
      title={isSaved ? 'Remove from Saved' : 'Save / Bookmark'}
    >
      <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
      {showText && (
        <span className="text-xs font-semibold">{isSaved ? 'Saved' : 'Save'}</span>
      )}
    </button>
  );
}
