'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import GuardianChat from '@/components/guardian/GuardianChat';
import { AuditPanel, DiaryPanel, NurseryPanel, RecordPanel, TeamPanel, VerifyPanel } from '@/components/guardian/HubPanels';
import { api, type Quota, type SessionInfo } from '@/components/guardian/api';
import { GuardianAuthProvider, useGuardianAuth } from '@/components/guardian/PrivyAuth';
import { ROLE_LABELS, can, type Capability, type Role } from '@/lib/guardian/constants';
import {
  Bot, Sprout, BookOpen, PlusCircle, ShieldCheck, ScrollText, Users, Lock, LogOut, Loader2, Clock, AlertCircle, Calendar,
} from 'lucide-react';

const TABS: { id: string; label: string; icon: typeof Bot; need: Capability }[] = [
  { id: 'ai', label: 'AI Guardian', icon: Bot, need: 'read' },
  { id: 'nursery', label: 'Nursery', icon: Sprout, need: 'read' },
  { id: 'diary', label: 'Keeper Diary', icon: BookOpen, need: 'read' },
  { id: 'record', label: 'Record activity', icon: PlusCircle, need: 'record' },
  { id: 'verify', label: 'Verification', icon: ShieldCheck, need: 'verify' },
  { id: 'audit', label: 'Audit trail', icon: ScrollText, need: 'viewAudit' },
  { id: 'team', label: 'Team', icon: Users, need: 'manageUsers' },
];

const EVENTS = [
  { date: 'October 15, 2026', title: 'Jaza Miti Riparian Planting Day', text: 'Community volunteers planting Croton and Markhamia seedlings along the Oloolua stream.' },
  { date: 'November 2, 2026', title: 'Art in Nature Rock Mural Festival', text: 'Live environmental mural painting with local youth artists and wildlife experts.' },
  { date: 'December 10, 2026', title: 'Apiculture and Honey Harvest Workshop', text: 'Practical training on hives, honey processing and buffer zone protection.' },
];

export default function GuardianHubPage() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [tab, setTabState] = useState('ai');
  const [quota, setQuota] = useState<Quota | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadSession = useCallback(async () => {
    const r = await api<SessionInfo>('/api/guardian/auth/session');
    setSession(r.data ?? { authConfigured: false, devLogin: false, aiEnabled: false, signedIn: false, error: 'Guardian is unavailable.' });
    setQuota(r.data?.quota ?? null);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get('record') ? 'record' : params.get('tab');
    if (requested && TABS.some((t) => t.id === requested)) setTabState(requested);
    void loadSession();
  }, [loadSession]);

  const setTab = (id: string) => {
    setTabState(id);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', id);
    url.searchParams.delete('record');
    window.history.replaceState(null, '', url);
  };

  const role = (session?.role ?? null) as Role | null;
  const tabs = TABS.filter((t) => can(role, t.need));
  const activeTab = tabs.some((t) => t.id === tab) ? tab : 'ai';
  const bump = () => setRefreshKey((k) => k + 1);

  return (
    <GuardianAuthProvider needsSession={!!session && !session.signedIn} onSessionCreated={loadSession}>
    <div className="min-h-screen bg-[#0b1c14] text-[#f6f2e7] flex flex-col">
      <Navigation />

      {!session && (
        <div className="flex-1 flex items-center justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-[#e4c878]" aria-label="Loading" /></div>
      )}

      {session && !session.signedIn && <SignInGate session={session} onSignedIn={loadSession} onGuest={() => { setTab('record'); void loadSession(); }} />}

      {session?.signedIn && !role && (
        <div className="flex-1 flex items-center justify-center p-4 py-20">
          <div className="max-w-md w-full p-8 rounded-3xl bg-[#122b1f] border border-[#e4c878]/30 text-center space-y-3">
            <Clock className="w-10 h-10 mx-auto text-[#e4c878]" />
            <h1 className="text-xl font-bold text-white">
              {session.membershipStatus === 'suspended' ? 'Access suspended' : 'Waiting for approval'}
            </h1>
            <p className="text-sm text-gray-300">
              {session.membershipStatus === 'suspended'
                ? 'Your access to the Guardian Hub has been suspended. Please contact a Guardian Admin.'
                : `You are signed in as ${session.user?.email ?? session.user?.name}. Being signed in does not give access to Guardian data yet: a Guardian Admin must approve your account and choose your role.`}
            </p>
            <SignOutButton onDone={() => { setQuota(null); void loadSession(); }} className="px-4 py-2 rounded-lg border border-white/15 hover:bg-white/10 text-sm font-semibold inline-flex items-center gap-2" />
          </div>
        </div>
      )}

      {session?.signedIn && role && session.user && (
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-5 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Guardian Hub</h1>
              <p className="text-xs text-gray-400">
                Oloolua Youth Guardians · Turako Nursery · Signed in as <span className="text-white font-semibold">{session.user.name}</span>
                <span className="ml-2 px-2 py-0.5 rounded bg-emerald-900 text-[#e4c878] font-bold">{session.user.guest ? 'Visitor' : ROLE_LABELS[role]}</span>
              </p>
              {session.user.guest && (
                <p className="text-[11px] text-gray-400 mt-1">Your records are saved as waiting for verification. They count in the verified totals once a Guardian Verifier checks them.</p>
              )}
            </div>
            <SignOutButton onDone={() => { setQuota(null); void loadSession(); }} className="self-start sm:self-auto px-3 py-2 rounded-lg border border-white/15 hover:bg-white/10 text-xs font-semibold inline-flex items-center gap-1.5" />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Guardian Hub sections">
            {tabs.map((t) => {
              const Icon = t.icon;
              const on = activeTab === t.id;
              return (
                <button key={t.id} role="tab" aria-selected={on} onClick={() => setTab(t.id)}
                  className={`shrink-0 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${on ? 'bg-emerald-600 text-white border border-[#e4c878]/50' : 'text-gray-300 hover:text-white hover:bg-white/5 border border-white/10'}`}>
                  <Icon className="w-4 h-4" /> {t.label}
                </button>
              );
            })}
          </div>

          {activeTab === 'ai' && (
            <>
              {!session.aiEnabled && (
                <p className="text-xs text-amber-200 flex items-start gap-1.5"><AlertCircle className="w-4 h-4 shrink-0" />
                  The AI model is not connected yet, so AI Guardian is answering in structured mode: nursery figures, seedbeds, species, the Keeper Diary, knowledge questions and activity recording all work; free-form conversation needs the model.
                </p>
              )}
              <GuardianChat role={role} firstName={session.user.name.split(' ')[0]} quota={quota} onQuota={setQuota} onRecordSaved={bump} />
            </>
          )}
          {activeTab === 'nursery' && <NurseryPanel refreshKey={refreshKey} />}
          {activeTab === 'diary' && <DiaryPanel refreshKey={refreshKey} />}
          {activeTab === 'record' && <RecordPanel onSaved={bump} />}
          {activeTab === 'verify' && <VerifyPanel refreshKey={refreshKey} onChanged={bump} />}
          {activeTab === 'audit' && <AuditPanel refreshKey={refreshKey} />}
          {activeTab === 'team' && <TeamPanel myUserId={session.user.id} />}
        </div>
      )}
    </div>
    </GuardianAuthProvider>
  );
}

/** Ends both the Guardian session and the Privy session. */
function SignOutButton({ onDone, className }: { onDone: () => void; className: string }) {
  const auth = useGuardianAuth();
  const [busy, setBusy] = useState(false);
  return (
    <button
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await auth.signOutOfPrivy();
        await api('/api/guardian/auth/session', { method: 'DELETE' });
        setBusy(false);
        onDone();
      }}
      className={className}
    >
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />} Sign out
    </button>
  );
}

function SignInGate({ session, onSignedIn, onGuest }: { session: SessionInfo; onSignedIn: () => void; onGuest: () => void }) {
  const auth = useGuardianAuth();
  const [devEmail, setDevEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestBusy, setGuestBusy] = useState(false);
  const [guestError, setGuestError] = useState('');
  const startGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuestBusy(true);
    setGuestError('');
    const r = await api<{ error?: string }>('/api/guardian/auth/guest', { body: { name: guestName } });
    setGuestBusy(false);
    if (r.ok) onGuest();
    else setGuestError(r.data?.error ?? 'Could not start. Please try again.');
  };
  const devLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await api('/api/guardian/auth/dev', { body: { email: devEmail, name: devEmail.split('@')[0] } });
    if (r.ok) onSignedIn();
  };
  const signInReady = session.authConfigured && auth.available;

  return (
    <div className="flex-1 px-4 py-12 sm:py-16">
      <div className="max-w-md mx-auto p-8 rounded-3xl bg-[#122b1f] border border-[#e4c878]/30 shadow-2xl space-y-5 text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-[#e4c878] mx-auto"><Lock className="w-7 h-7" /></div>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold text-white">AI Guardian</h1>
          <p className="text-sm text-gray-300">The conversational keeper of the Guardian Hub. {session.openRecording ? 'Type your name' : 'Sign in'} to ask about the nursery, search the Keeper Diary and record activities, by text or voice.</p>
        </div>

        {session.openRecording && (
          <form onSubmit={startGuest} className="space-y-2.5 text-left">
            <label htmlFor="guest-name" className="block text-sm font-semibold text-white">Record a tree activity</label>
            <input id="guest-name" required minLength={2} maxLength={60} autoComplete="name" value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Your name"
              className="w-full bg-[#0b1c14] border border-white/15 rounded-xl px-3 py-3 text-sm text-white placeholder:text-gray-500" />
            {guestError && <p role="alert" className="text-xs text-red-200">{guestError}</p>}
            <button disabled={guestBusy} className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors">
              {guestBusy && <Loader2 className="w-4 h-4 animate-spin" />} Start recording
            </button>
            <p className="text-[11px] text-gray-400">No account needed. Your records are checked by the Guardian team before they count in the verified totals.</p>
          </form>
        )}

        {auth.error && <p role="alert" className="text-xs text-red-200 bg-red-950/60 border border-red-800 rounded-lg px-3 py-2">{auth.error}</p>}

        {auth.linking ? (
          <p className="flex items-center justify-center gap-2 text-sm text-gray-200"><Loader2 className="w-4 h-4 animate-spin" /> Signing you in...</p>
        ) : signInReady ? (
          <div className="space-y-2.5">
            <button type="button" onClick={auth.signInWithGoogle} disabled={!auth.ready}
              className="w-full py-3 rounded-xl bg-white hover:bg-gray-100 disabled:opacity-60 text-neutral-900 font-bold text-sm flex items-center justify-center gap-3 transition-colors">
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" /><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" /><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" /></svg>
              Continue with Google
            </button>
            <button type="button" onClick={auth.signInWithEmail} disabled={!auth.ready}
              className="w-full py-3 rounded-xl border border-white/20 hover:bg-white/10 disabled:opacity-60 text-white font-semibold text-sm transition-colors">
              Continue with email code
            </button>
          </div>
        ) : session.openRecording ? null : (
          <p className="text-xs text-amber-200 bg-amber-950/40 border border-amber-700/50 rounded-lg px-3 py-2">Sign-in is not available yet. Please check back soon.</p>
        )}
        {(signInReady || !session.openRecording) && <p className="text-[11px] text-gray-400">Use your KAI Nuvari account: the same sign-in works on the main KAI site. New here? Continuing creates your account, and a Guardian Admin then approves your access and role.</p>}

        {session.devLogin && (
          <form onSubmit={devLogin} className="pt-3 border-t border-white/10 space-y-2 text-left">
            <p className="text-[11px] text-amber-200 font-semibold">Development sign-in (local testing only)</p>
            <div className="flex gap-2">
              <input type="email" required value={devEmail} onChange={(e) => setDevEmail(e.target.value)} placeholder="test email" className="flex-1 bg-[#0b1c14] border border-white/10 rounded-lg px-3 py-2 text-xs text-white" />
              <button className="px-3 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold">Sign in</button>
            </div>
          </form>
        )}
      </div>

      <div className="max-w-4xl mx-auto mt-12 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2"><Calendar className="w-5 h-5 text-[#e4c878]" /> Upcoming events</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {EVENTS.map((e) => (
            <div key={e.title} className="p-5 rounded-2xl bg-[#122b1f] border border-[#e4c878]/20 space-y-2">
              <span className="text-[10px] font-bold uppercase text-emerald-300">{e.date}</span>
              <h3 className="font-bold text-white text-sm">{e.title}</h3>
              <p className="text-xs text-gray-400">{e.text}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400">Want to take part or support the nursery? <Link href="/#contact" className="text-[#e4c878] hover:underline">Contact us</Link> or <Link href="/#donate" className="text-[#e4c878] hover:underline">donate via M-Pesa</Link>.</p>
      </div>
    </div>
  );
}
