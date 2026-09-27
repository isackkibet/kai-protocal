"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SihuNav from '@/components/layout/SihuNav';
import { Database, CheckCircle2, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';

interface DatabaseStatusResponse {
  status: string;
  database: string;
  timestamp?: string;
  tablesFound?: string[];
  message: string;
  error?: string | null;
}

export default function DatabaseStatusPage() {
  const [status, setStatus] = useState<DatabaseStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = () => {
    setLoading(true);
    fetch('/api/db-health')
      .then((res) => res.json())
      .then((data) => {
        setStatus(data);
        setLoading(false);
      })
      .catch((err) => {
        setStatus({
          status: 'fallback',
          database: 'Neon Serverless PostgreSQL',
          message: 'Running in resilient self-contained fallback mode.',
          error: err?.message,
        });
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans">
      <SihuNav />

      <main className="container mx-auto max-w-3xl px-4 lg:px-8 py-12 flex-1">
        <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-3">
          <Database className="w-4 h-4" />
          <span>Infrastructure & Persistence Status</span>
        </div>

        <h1 className="text-3xl font-heading font-black text-white tracking-tight mb-2">
          Neon PostgreSQL Status
        </h1>
        <p className="text-sm text-slate-400 mb-8">
          Supabase integration has been removed. SIHU is configured to use Neon Serverless PostgreSQL with pgvector support.
        </p>

        {loading ? (
          <div className="p-12 rounded-3xl bg-slate-900/60 border border-slate-800 flex justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 md:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                {status?.status === 'connected' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-amber-400" />
                )}
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {status?.status === 'connected' ? 'Connected to Neon PostgreSQL' : 'Resilient In-Memory Mode'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {status?.message}
                  </p>
                </div>
              </div>

              <button
                onClick={fetchStatus}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Refresh Status"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-slate-500 font-mono block mb-1">DATABASE DRIVER</span>
                <span className="font-semibold text-slate-200">@neondatabase/serverless</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-slate-500 font-mono block mb-1">TARGET CLUSTER</span>
                <span className="font-semibold text-slate-200">Neon Serverless (HTTP / WebSockets)</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 md:col-span-2">
                <span className="text-slate-500 font-mono block mb-1">TABLES FOUND IN SCHEMA</span>
                {status?.tablesFound && status.tablesFound.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {status.tablesFound.map((table) => (
                      <span
                        key={table}
                        className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] text-primary-light"
                      >
                        {table}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-400 italic">
                    No tables yet. Run <code className="text-primary font-mono">npm run db:setup</code> or apply <code className="text-primary font-mono">neon-schema-v1.sql</code> to create schema.
                  </span>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <Link
                href="/explore"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-light"
              >
                <span>Go to Explore Hub</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/admin"
                className="text-xs text-slate-400 hover:text-white"
              >
                Go to Admin Dashboard
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}