"use client";

import React from 'react';
import { VerificationStatus } from '@/types/contentHub';
import { ShieldCheck, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';

interface TrustBadgeProps {
  status: VerificationStatus;
  reviewedAt?: string;
  className?: string;
  showDetails?: boolean;
}

export default function TrustBadge({
  status,
  reviewedAt,
  className = '',
  showDetails = false,
}: TrustBadgeProps) {
  const config = {
    source_verified: {
      label: 'Source Verified',
      shortLabel: 'Verified',
      icon: ShieldCheck,
      color: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30',
      description: 'Cross-checked against primary governmental, academic, or institutional records.',
    },
    editorially_reviewed: {
      label: 'Editorially Reviewed',
      shortLabel: 'Reviewed',
      icon: CheckCircle2,
      color: 'text-sky-400 bg-sky-950/60 border-sky-500/30',
      description: 'Reviewed by SIHU editorial desk for factual accuracy and journalistic standards.',
    },
    needs_update: {
      label: 'Needs Update',
      shortLabel: 'Needs Update',
      icon: AlertTriangle,
      color: 'text-amber-400 bg-amber-950/60 border-amber-500/30',
      description: 'Some figures or policies mentioned may be superseded by recent events.',
    },
    unverified: {
      label: 'Unverified Community Submission',
      shortLabel: 'Unverified',
      icon: HelpCircle,
      color: 'text-slate-400 bg-slate-900/60 border-slate-700/40',
      description: 'Direct contributor submission pending formal editorial review.',
    },
  }[status] || {
    label: 'Unverified',
    shortLabel: 'Unverified',
    icon: HelpCircle,
    color: 'text-slate-400 bg-slate-900/60 border-slate-700/40',
    description: 'Direct submission.',
  };

  const Icon = config.icon;

  return (
    <div className={`inline-flex flex-col gap-1 ${className}`}>
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-md transition-all ${config.color}`}
        title={config.description}
      >
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span>{showDetails ? config.label : config.shortLabel}</span>
        {reviewedAt && showDetails && (
          <span className="text-[10px] opacity-75 font-normal ml-1">
            · {new Date(reviewedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </span>
        )}
      </div>
      {showDetails && (
        <p className="text-[11px] text-slate-400 italic leading-relaxed mt-0.5 max-w-sm">
          {config.description}
        </p>
      )}
    </div>
  );
}
