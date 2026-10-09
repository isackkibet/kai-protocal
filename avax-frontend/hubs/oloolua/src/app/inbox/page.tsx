'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Navigation from '@/components/Navigation';
import {
  Inbox, Lock, LogOut, RefreshCw, Search, Download, Copy, Check, Mail, Phone,
  MessageCircle, CheckCircle2, RotateCcw, AlertCircle, Loader2, ShieldCheck,
} from 'lucide-react';

type Kind = 'contact' | 'commitment' | 'pledge' | 'newsletter';
type KindFilter = 'all' | Kind;
type StatusFilter = 'open' | 'handled' | 'all';
type Phase = 'checking' | 'unconfigured' | 'locked' | 'open';

interface Message {
  id: string;
  kind: Kind;
  name: string | null;
  contact: string;
  message: string | null;
  created_at: string;
  handled_at: string | null;
}

interface Count { kind: Kind; open: number; total: number }

const KIND_LABELS: Record<KindFilter, string> = {
  all: 'All',
  contact: 'Contact',
  commitment: 'Commitments',
  pledge: 'Pledges',
  newsletter: 'Newsletter',
};

const KIND_STYLES: Record<Kind, string> = {
  contact: 'bg-sky-950 text-sky-300 border-sky-800',
  commitment: 'bg-amber-950 text-amber-300 border-amber-800',
  pledge: 'bg-emerald-950 text-emerald-300 border-emerald-800',
  newsletter: 'bg-purple-950 text-purple-300 border-purple-800',
};

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

/** Kenyan local numbers (07.../01...) become 2547.../2541... for WhatsApp links. */
function whatsappNumber(phone: string): string | null {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = `254${digits.slice(1)}`;
  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}

function timeAgo(iso: string): string {
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [['day', 86400], ['hour', 3600], ['minute', 60]];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return 'just now';
}

/** Escapes a CSV cell and neutralises spreadsheet formulas in user-supplied text. */
function csvCell(value: string | null): string {
  let v = value ?? '';
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
  return `"${v.replace(/"/g, '""')}"`;
}

export default function InboxPage() {
  const [phase, setPhase] = useState<Phase>('checking');
  const [setupReason, setSetupReason] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [kind, setKind] = useState<KindFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('open');
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [counts, setCounts] = useState<Count[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/inbox/session')
      .then((r) => r.json())
      .then((s) => {
        if (!s.configured) {
          setSetupReason(s.reason || '');
          setPhase('unconfigured');
        } else {
          setPhase(s.authenticated ? 'open' : 'locked');
        }
      })
      .catch(() => setPhase('locked'));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch(`/api/inbox?kind=${kind}&status=${status}`);
      if (res.status === 401) {
        setPhase('locked');
        return;
      }
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setMessages(json.messages);
      setCounts(json.counts);
    } catch (e) {
      setLoadError(e instanceof Error && e.message ? e.message : 'Could not load messages.');
    } finally {
      setLoading(false);
    }
  }, [kind, status]);

  useEffect(() => {
    if (phase === 'open') load();
  }, [phase, load]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    try {
      const res = await fetch('/api/inbox/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        setPassword('');
        setPhase('open');
      } else {
        setLoginError(res.status === 429 ? 'Too many attempts. Please wait 15 minutes and try again.' : json.error || 'Login failed.');
      }
    } catch {
      setLoginError('Could not reach the server.');
    } finally {
      setLoggingIn(false);
    }
  };

  const logout = async () => {
    await fetch('/api/inbox/session', { method: 'DELETE' }).catch(() => {});
    setMessages([]);
    setCounts([]);
    setPhase('locked');
  };

  const toggleHandled = async (m: Message) => {
    const handled = !m.handled_at;
    const previous = messages;
    setBusyId(m.id);
    // Optimistic: update now, roll back if the server refuses.
    setMessages((list) =>
      list
        .map((x) => (x.id === m.id ? { ...x, handled_at: handled ? new Date().toISOString() : null } : x))
        .filter((x) => status === 'all' || (status === 'open' ? !x.handled_at : !!x.handled_at)),
    );
    setCounts((cs) => cs.map((c) => (c.kind === m.kind ? { ...c, open: c.open + (handled ? -1 : 1) } : c)));
    try {
      const res = await fetch('/api/inbox', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: m.id, handled }),
      });
      if (res.status === 401) setPhase('locked');
      if (!res.ok) throw new Error();
    } catch {
      setMessages(previous);
      load();
    } finally {
      setBusyId(null);
    }
  };

  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () => messages.filter((m) => !q || [m.name, m.contact, m.message].some((t) => t?.toLowerCase().includes(q))),
    [messages, q],
  );

  const openCount = (k: KindFilter) =>
    k === 'all' ? counts.reduce((s, c) => s + c.open, 0) : counts.find((c) => c.kind === k)?.open ?? 0;

  const exportCsv = () => {
    const header = ['Received', 'Type', 'Name', 'Contact', 'Message', 'Handled'];
    const rows = visible.map((m) => [
      new Date(m.created_at).toISOString(), m.kind, m.name, m.contact, m.message,
      m.handled_at ? new Date(m.handled_at).toISOString() : '',
    ].map((v) => csvCell(v)).join(','));
    const blob = new Blob([[header.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oloolua-inbox-${kind}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyEmails = async () => {
    const emails = [...new Set(visible.map((m) => m.contact).filter(isEmail).map((e) => e.toLowerCase()))];
    await navigator.clipboard.writeText(emails.join(', '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0b1c14] text-[#f6f2e7] flex flex-col">
      <Navigation />

      {phase === 'checking' && (
        <div className="flex-1 flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-[#e4c878]" aria-label="Loading" />
        </div>
      )}

      {phase === 'unconfigured' && (
        <div className="flex-1 flex items-center justify-center p-4 py-16">
          <div className="max-w-lg w-full p-8 rounded-3xl bg-[#122b1f] border border-amber-700/50 space-y-4">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <AlertCircle className="w-5 h-5" /> Team inbox not set up
            </div>
            <p className="text-sm text-gray-300">{setupReason}</p>
            <ol className="text-xs text-gray-300 space-y-1.5 list-decimal pl-5">
              <li>Open the Vercel project <strong>oloolua-youth-guardians</strong>, then Settings, then Environment Variables.</li>
              <li>Add <code className="text-[#e4c878]">INBOX_PASSWORD</code> with a strong password of at least 12 characters.</li>
              <li>Redeploy, then share the password only with the team.</li>
            </ol>
          </div>
        </div>
      )}

      {phase === 'locked' && (
        <div className="flex-1 flex items-center justify-center p-4 py-16">
          <form onSubmit={login} className="max-w-sm w-full p-8 rounded-3xl bg-[#122b1f] border border-[#e4c878]/30 shadow-2xl space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-[#e4c878] mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold text-white">Team Inbox</h1>
              <p className="text-xs text-gray-400">Contact messages, commitments, pledges and newsletter sign-ups.</p>
            </div>
            <div>
              <label htmlFor="inbox-password" className="block text-xs font-semibold text-gray-300 mb-1">Team password</label>
              <input
                id="inbox-password"
                type="password"
                required
                autoFocus
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0b1c14] border border-[#e4c878]/30 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#e4c878]"
              />
            </div>
            {loginError && (
              <div role="alert" className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs border bg-red-950/60 border-red-800 text-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" /> <span>{loginError}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3 rounded-xl bg-[#e4c878] hover:bg-amber-300 disabled:opacity-60 text-neutral-950 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              {loggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              {loggingIn ? 'Checking...' : 'Open Inbox'}
            </button>
            <p className="text-[11px] text-gray-500 text-center">Sessions end automatically after 8 hours.</p>
          </form>
        </div>
      )}

      {phase === 'open' && (
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6 flex-1">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-600/30 flex items-center justify-center text-[#e4c878]">
                <Inbox className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-white">Team Inbox</h1>
                <p className="text-xs text-gray-400">{openCount('all')} open across all forms</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={load} disabled={loading} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5 transition-colors">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </button>
              <button onClick={exportCsv} disabled={visible.length === 0} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 text-xs font-semibold flex items-center gap-1.5 transition-colors">
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
              {kind === 'newsletter' && (
                <button onClick={copyEmails} disabled={visible.length === 0} className="px-3 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-xs font-semibold flex items-center gap-1.5 transition-colors">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy all emails'}
                </button>
              )}
              <button onClick={logout} className="px-3 py-2 rounded-lg border border-white/15 hover:bg-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors">
                <LogOut className="w-3.5 h-3.5" /> Log out
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Form type">
              {(Object.keys(KIND_LABELS) as KindFilter[]).map((k) => (
                <button
                  key={k}
                  role="tab"
                  aria-selected={kind === k}
                  onClick={() => setKind(k)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    kind === k ? 'bg-[#e4c878] text-neutral-950' : 'bg-[#122b1f] text-gray-300 hover:text-white border border-white/10'
                  }`}
                >
                  {KIND_LABELS[k]}
                  {openCount(k) > 0 && (
                    <span className={`px-1.5 rounded-full text-[10px] ${kind === k ? 'bg-neutral-950/15' : 'bg-emerald-700 text-white'}`}>
                      {openCount(k)}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex gap-2 lg:ml-auto">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusFilter)}
                aria-label="Status"
                className="bg-[#122b1f] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#e4c878]/60"
              >
                <option value="open">Open</option>
                <option value="handled">Handled</option>
                <option value="all">All</option>
              </select>
              <div className="relative flex-1 lg:w-64">
                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name, contact, message"
                  aria-label="Search messages"
                  className="w-full bg-[#122b1f] border border-white/10 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#e4c878]/60"
                />
              </div>
            </div>
          </div>

          {loadError && (
            <div role="alert" className="flex items-start gap-2 rounded-xl px-4 py-3 text-xs border bg-red-950/60 border-red-800 text-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" /> <span>{loadError}</span>
            </div>
          )}

          {/* List */}
          {loading && messages.length === 0 ? (
            <div className="space-y-3" aria-busy="true">
              {[0, 1, 2].map((i) => <div key={i} className="h-24 rounded-2xl bg-[#122b1f] animate-pulse" />)}
            </div>
          ) : visible.length === 0 ? (
            <div className="p-10 rounded-2xl bg-[#122b1f] border border-dashed border-white/15 text-center text-sm text-gray-400">
              {q ? `No messages match "${query}".` : status === 'open' ? 'All caught up. No open messages here.' : 'No messages yet.'}
            </div>
          ) : (
            <ul className="space-y-3">
              {visible.map((m) => {
                const email = isEmail(m.contact);
                const wa = email ? null : whatsappNumber(m.contact);
                return (
                  <li
                    key={m.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-colors ${
                      m.handled_at ? 'bg-[#0f2219] border-white/5 opacity-75' : 'bg-[#122b1f] border-[#e4c878]/20'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${KIND_STYLES[m.kind]}`}>{m.kind}</span>
                          <span className="font-bold text-white">{m.name || 'Newsletter subscriber'}</span>
                          <time dateTime={m.created_at} title={new Date(m.created_at).toLocaleString()} className="text-[11px] text-gray-500">
                            {timeAgo(m.created_at)}
                          </time>
                          {m.handled_at && (
                            <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> handled
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-emerald-300 break-all">{m.contact}</div>
                        {m.message && <p className="text-sm text-gray-200 whitespace-pre-wrap break-words">{m.message}</p>}
                      </div>

                      <div className="flex flex-wrap gap-2 shrink-0">
                        {email ? (
                          <a
                            href={`mailto:${m.contact}?subject=${encodeURIComponent('Re: your message to Oloolua Youth Guardians')}`}
                            className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5"
                          >
                            <Mail className="w-3.5 h-3.5" /> Reply
                          </a>
                        ) : (
                          <>
                            <a href={`tel:${m.contact.replace(/[^\d+]/g, '')}`} className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5" /> Call
                            </a>
                            {wa && (
                              <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-xs font-semibold flex items-center gap-1.5">
                                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                              </a>
                            )}
                          </>
                        )}
                        <button
                          onClick={() => toggleHandled(m)}
                          disabled={busyId === m.id}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 ${
                            m.handled_at ? 'border border-white/15 hover:bg-white/10' : 'bg-[#e4c878] hover:bg-amber-300 text-neutral-950'
                          }`}
                        >
                          {m.handled_at ? <RotateCcw className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          {m.handled_at ? 'Reopen' : 'Mark handled'}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {visible.length > 0 && (
            <p className="text-[11px] text-gray-500">Showing {visible.length} message{visible.length === 1 ? '' : 's'} (newest first, up to 500).</p>
          )}
        </div>
      )}
    </div>
  );
}
