'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText, Plus, Eye, Heart, DollarSign, Award,
  Sparkles, CheckCircle2, Clock, AlertCircle, Edit, Trash2,
  UserCheck, ShieldCheck
} from 'lucide-react';
import { PublishingArticle, ArticleStatus, HubRole } from '@/types/publishing';
import { publishingService } from '@/services/content/publishingService';
import { roleService } from '@/services/auth/roleService';
import NewsHeader from '@/components/portal/NewsHeader';

export default function ContributorDashboardPage() {
  const [user, setUser] = useState(roleService.getCurrentUser());
  const [articles, setArticles] = useState<PublishingArticle[]>([]);
  const [activeTab, setActiveTab] = useState<ArticleStatus | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const data = await publishingService.getArticlesByAuthor(user.id);
      setArticles(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, [user.id]);

  const handleRoleSwitch = (newRole: HubRole) => {
    const updated = roleService.switchRole(newRole);
    setUser(updated);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this draft?')) {
      await publishingService.deleteArticle(id, user);
      await loadArticles();
    }
  };

  const filteredArticles = articles.filter(a => {
    if (activeTab === 'ALL') return true;
    return a.status === activeTab;
  });

  const badge = roleService.getRoleBadge(user.role);

  return (
    <div className="min-h-screen bg-[#07130E] text-neutral-100 pb-20">
      <NewsHeader />

      <div className="max-w-5xl mx-auto px-4 pt-8">
        {/* Contributor Header Card */}
        <div className="p-6 rounded-2xl bg-neutral-900/80 border border-amber-900/30 backdrop-blur-md mb-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 text-neutral-950 font-bold text-2xl flex items-center justify-center shadow-lg">
                {user.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-neutral-100">{user.name}</h1>
                  <span
                    style={{ background: badge.bg, color: badge.text }}
                    className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-current/20"
                  >
                    {badge.label}
                  </span>
                  {user.isVerified && (
                    <span title="Verified Contributor" className="text-emerald-400">
                      <ShieldCheck size={16} />
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 mt-1">{user.email}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-neutral-400">
                  <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
                    <Award size={14} /> {user.pointsEarned || 0} SIHU Points
                  </span>
                  <span className="flex items-center gap-1.5 text-neutral-300">
                    <FileText size={14} /> {articles.length} Submissions
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions & Role Switcher */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Role Switcher Pill (PRD Section 4 Testing) */}
              <div className="flex items-center gap-1.5 bg-neutral-950 p-1.5 rounded-xl border border-neutral-800 text-xs">
                <span className="text-[10px] text-neutral-500 uppercase font-mono px-2">Role:</span>
                {(['CONTRIBUTOR', 'VERIFIED_CONTRIBUTOR', 'EDITOR', 'CHAIRPERSON'] as HubRole[]).map(r => (
                  <button
                    key={r}
                    onClick={() => handleRoleSwitch(r)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                      user.role === r
                        ? 'bg-amber-500 text-neutral-950 shadow'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {r === 'VERIFIED_CONTRIBUTOR' ? 'Verified' : r.charAt(0) + r.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              <Link
                href="/studio"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/40 transition-all"
              >
                <Edit size={15} /> Story Studio
              </Link>
              <Link
                href="/portal/submit"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-emerald-700/50 text-emerald-400 hover:bg-emerald-900/30 transition-all"
              >
                <Plus size={15} /> Quick Submit
              </Link>
            </div>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-3 mb-6 overflow-x-auto scrollbar-none text-xs">
          {[
            { id: 'ALL', label: 'All Articles' },
            { id: 'DRAFT', label: 'Drafts' },
            { id: 'SUBMITTED', label: 'Under Review' },
            { id: 'CHANGES_REQUESTED', label: 'Needs Changes' },
            { id: 'PUBLISHED', label: 'Published' },
            { id: 'REJECTED', label: 'Rejected' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {tab.label}
              <span className="ml-1.5 opacity-60 text-[10px]">
                ({tab.id === 'ALL' ? articles.length : articles.filter(a => a.status === tab.id).length})
              </span>
            </button>
          ))}
        </div>

        {/* Article Cards List */}
        {loading ? (
          <div className="text-center py-16 text-neutral-500 text-sm">Loading articles...</div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-16 p-8 rounded-2xl bg-neutral-900/40 border border-dashed border-neutral-800">
            <FileText size={32} className="mx-auto text-neutral-600 mb-3" />
            <h3 className="text-sm font-bold text-neutral-300">No articles in this view</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              Draft a new story, field journal, or report to start contributing to the community information hub.
            </p>
            <Link
              href="/studio"
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-neutral-950 hover:bg-amber-400"
            >
              <Plus size={14} /> Open Story Studio
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredArticles.map(article => {
              const statusStyle = {
                DRAFT: { label: 'Draft', color: 'text-neutral-400 border-neutral-700 bg-neutral-800/40' },
                SUBMITTED: { label: 'In Editorial Review', color: 'text-blue-400 border-blue-500/40 bg-blue-950/40' },
                CHANGES_REQUESTED: { label: 'Revisions Requested', color: 'text-amber-400 border-amber-500/40 bg-amber-950/40' },
                APPROVED: { label: 'Approved', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40' },
                PUBLISHED: { label: 'Published & Live', color: 'text-emerald-300 border-emerald-500 bg-emerald-950/60' },
                REJECTED: { label: 'Rejected', color: 'text-red-400 border-red-500/40 bg-red-950/40' },
              }[article.status];

              return (
                <div
                  key={article.id}
                  className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-amber-900/50 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${statusStyle.color}`}>
                          {statusStyle.label}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                          {article.category}
                        </span>
                        {article.aiPreReview && (
                          <span className="text-[10px] font-mono bg-neutral-950 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Sparkles size={11} /> AI Quality: {article.aiPreReview.overallScore}/100
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-neutral-100 hover:text-amber-300 transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                        {article.summary}
                      </p>

                      {/* Editorial revision note if requested */}
                      {article.status === 'CHANGES_REQUESTED' && article.editorialFeedback && (
                        <div className="mt-3 p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200">
                          <span className="font-bold text-amber-400 block mb-0.5">Editor Note:</span>
                          {article.editorialFeedback}
                        </div>
                      )}

                      {/* Metrics bar */}
                      <div className="flex items-center gap-5 mt-4 text-[11px] text-neutral-500">
                        <span className="flex items-center gap-1">
                          <Eye size={13} /> {article.viewsCount} views
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart size={13} /> {article.likesCount} likes
                        </span>
                        <span className="flex items-center gap-1 text-emerald-400">
                          <DollarSign size={13} /> KES {article.tipsEarnedKes.toLocaleString()} earned
                        </span>
                        <span className="text-neutral-500">
                          Created {new Date(article.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end md:self-start">
                      {article.status !== 'PUBLISHED' && (
                        <Link
                          href={`/studio?edit=${article.id}`}
                          className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                          title="Open in Story Studio"
                        >
                          <Edit size={14} />
                        </Link>
                      )}
                      {article.status === 'DRAFT' && (
                        <button
                          onClick={() => handleDelete(article.id)}
                          className="p-2 rounded-xl bg-neutral-800 hover:bg-red-950 text-neutral-400 hover:text-red-400 transition-colors"
                          title="Delete Draft"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      {article.status === 'PUBLISHED' && (
                        <Link
                          href={`/portal#${article.slug}`}
                          className="px-3 py-1.5 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-semibold hover:bg-emerald-900"
                        >
                          View Live ↗
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
