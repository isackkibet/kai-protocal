'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ShieldCheck, UserCheck, UserPlus, Loader2, Mail, ArrowLeft } from 'lucide-react';

const C = {
  bg:        '#0B1C14',
  gold:      '#C89B3C',
  goldLight: '#E4C878',
  paper:     '#F6F2E7',
  paperDim:  '#EFE9D9',
  inkLight:  '#9BA396',
  hairline:  'rgba(200,155,60,0.14)',
  red:       '#E88C7D',
  green:     '#7FB58A',
};

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  referralCode: string | null;
  walletAddress: string | null;
  joinedAt: string;
  whitelisted: boolean;
  whitelistedAt: string | null;
  joinedBy: string | null;
}

const W: React.CSSProperties = { width: '100%', maxWidth: 960, margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' };
const label: React.CSSProperties = { fontFamily: 'var(--font-plex-mono), monospace', fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: C.goldLight, fontWeight: 600, margin: 0 };
const SERIF: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };

export default function AdminWaitlistPage() {
  const [key, setKey] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('kai-wl-admin-key') ?? '';
  });
  const [savedKey, setSavedKey] = useState('');
  const [members, setMembers] = useState<Member[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [err, setErr] = useState<string>('');

  const load = useCallback(async (adminKey: string) => {
    setLoading(true);
    setErr('');
    try {
      const r = await fetch('/api/whitelist/members', { headers: { 'x-admin-key': adminKey } });
      const d = await r.json();
      if (r.ok) {
        setMembers(d.members ?? []);
        localStorage.setItem('kai-wl-admin-key', adminKey);
        setSavedKey(adminKey);
      } else {
        setErr(String(d.error ?? 'Unauthorized — check the admin key'));
        setMembers(null);
      }
    } catch {
      setErr('Network error');
    }
    setLoading(false);
  }, []);

  // Auto-load on mount if a key was stored (lazy-initialized above). Ignore the
  // `key` dep so typing in the field doesn't refetch on every keystroke.
  useEffect(() => {
    if (!key) return;
    // Defer off the synchronous effect frame so the state updates inside
    // `load` aren't classified as cascading setState-from-effect.
    const id = window.setTimeout(() => { void load(key); }, 0);
    return () => window.clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = async (m: Member) => {
    if (!savedKey || togglingId) return;
    setTogglingId(m.id);
    setErr('');
    try {
      const r = await fetch('/api/whitelist/members', {
        method: 'POST',
        headers: { 'x-admin-key': savedKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: m.id, action: m.whitelisted ? 'remove' : 'whitelist' }),
      });
      const d = await r.json();
      if (r.ok) {
        setMembers(prev => prev?.map(x => x.id === m.id
          ? m.whitelisted
            ? { ...x, whitelisted: false, whitelistedAt: null, joinedBy: null }
            : { ...x, whitelisted: true, whitelistedAt: new Date().toISOString(), joinedBy: 'ADMIN' }
          : x) ?? prev);
      } else {
        setErr(String(d.error ?? 'Could not update'));
      }
    } catch {
      setErr('Network error');
    }
    setTogglingId(null);
  };

  const fc = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const joined = members?.length ?? 0;
  const whitelisted = members?.filter(m => m.whitelisted).length ?? 0;
  const selfClaimed = members?.filter(m => m.whitelisted && m.joinedBy === 'SELF').length ?? 0;

  return (
    <main style={{ minHeight: '100dvh', background: C.bg, color: C.paper, fontFamily: "'Poppins', 'IBM Plex Sans', var(--font-sans)", paddingBottom: 80 }}>
      <div style={{ ...W, paddingTop: 40 }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: C.inkLight, fontSize: 13, marginBottom: 28 }}
          onMouseEnter={e => (e.currentTarget.style.color = C.paperDim)}
          onMouseLeave={e => (e.currentTarget.style.color = C.inkLight)}>
          <ArrowLeft size={14} /> Back to Home
        </Link>

        <p style={label}>KAI Nuvari · Ops</p>
        <h1 style={{ ...SERIF, fontSize: 26, fontWeight: 700, margin: '10px 0 0', letterSpacing: '-0.4px' }}>
          Waitlist <span style={{ color: C.goldLight }}>Admin</span>
        </h1>

        <section style={{ marginTop: 28, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={key}
            onChange={e => setKey(e.target.value)}
            placeholder="Admin key"
            type="password"
            style={{ flex: 1, minWidth: 200, padding: '11px 14px', borderRadius: 10, border: `1px solid ${C.hairline}`, background: 'none', color: C.paper, fontSize: 13, outline: 'none', fontFamily: 'var(--font-plex-mono), monospace' }}
            onKeyDown={e => { if (e.key === 'Enter' && key) void load(key); }}
          />
          <button onClick={() => key && void load(key)} disabled={loading || !key}
            style={{ padding: '11px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', background: C.gold, color: '#1B1A14', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8, opacity: loading || !key ? 0.6 : 1 }}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />} Load members
          </button>
        </section>
        {err && <p style={{ fontSize: 12, color: C.red, margin: '10px 0 0' }}>{err}</p>}

        {members && (
          <>
            <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div style={{ padding: '16px', border: `1px solid ${C.hairline}`, borderRadius: 12 }}>
                <p style={label}>Joined</p>
                <p style={{ fontSize: 28, fontWeight: 700, margin: '6px 0 0', fontFamily: 'var(--font-plex-mono), monospace' }}>{joined}</p>
              </div>
              <div style={{ padding: '16px', border: `1px solid ${C.gold}`, borderRadius: 12 }}>
                <p style={label}>Whitelisted</p>
                <p style={{ fontSize: 28, fontWeight: 700, margin: '6px 0 0', color: C.goldLight, fontFamily: 'var(--font-plex-mono), monospace' }}>{whitelisted}</p>
              </div>
              <div style={{ padding: '16px', border: `1px solid ${C.hairline}`, borderRadius: 12 }}>
                <p style={label}>Self-claimed</p>
                <p style={{ fontSize: 28, fontWeight: 700, margin: '6px 0 0', fontFamily: 'var(--font-plex-mono), monospace' }}>{selfClaimed}</p>
              </div>
            </div>

            <section style={{ marginTop: 24 }}>
              {members.length === 0 && (
                <p style={{ color: C.inkLight, fontSize: 13, marginTop: 12 }}>No members have signed up yet. Joins appear here as they happen.</p>
              )}
              {members.map(m => (
                <div key={m.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0',
                    borderBottom: `1px solid ${C.hairline}`,
                    background: m.whitelisted ? 'rgba(200,155,60,0.06)' : 'transparent',
                  }}>
                  <div style={{ width: 28, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                    {m.whitelisted
                      ? <ShieldCheck size={18} color={C.goldLight} />
                      : <Mail size={16} color={C.inkLight} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {m.name}
                      {m.whitelisted && (
                        <span style={{ fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase', color: C.gold, border: `1px solid ${C.gold}`, borderRadius: 999, padding: '2px 8px', fontWeight: 700 }}>
                          {m.joinedBy === 'SELF' ? 'Self-claimed' : 'Whitelisted'}
                        </span>
                      )}
                    </p>
                    <p style={{ fontSize: 11.5, color: C.inkLight, margin: '2px 0 0', fontFamily: 'var(--font-plex-mono), monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.email}
                      {m.walletAddress ? ` · ${m.walletAddress.slice(0, 6)}…${m.walletAddress.slice(-4)}` : ''}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, fontSize: 11, color: C.inkLight, fontFamily: 'var(--font-plex-mono), monospace' }}>
                    <p style={{ margin: 0 }}>Joined {fc(m.joinedAt)}</p>
                    <p style={{ margin: '2px 0 0' }}>{m.whitelisted ? `WL ${fc(m.whitelistedAt!)}` : 'Not whitelisted'}</p>
                  </div>
                  <button
                    onClick={() => toggle(m)}
                    disabled={togglingId !== null}
                    style={{
                      padding: '8px 14px', borderRadius: 999, cursor: togglingId !== null ? 'default' : 'pointer',
                      border: `1px solid ${m.whitelisted ? C.red : C.gold}`,
                      background: m.whitelisted ? 'none' : C.gold,
                      color: m.whitelisted ? C.red : '#1B1A14',
                      fontSize: 12, fontWeight: 700, fontFamily: 'inherit', opacity: togglingId !== null ? 0.6 : 1,
                      flexShrink: 0, whiteSpace: 'nowrap',
                    }}>
                    {togglingId === m.id ? <Loader2 size={12} className="animate-spin" /> : m.whitelisted ? 'Remove' : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><UserCheck size={12} /> {m.joinedBy === 'SELF' ? 'Granted' : 'Whitelist'}</span>
                    )}
                  </button>
                </div>
              ))}
            </section>
            <p style={{ marginTop: 20, fontSize: 11, color: C.inkLight, display: 'flex', alignItems: 'center', gap: 6 }}>
              <UserPlus size={13} /> Members can whitelist themselves from the Waitlist page — that&apos;s the &lsquo;Self-claimed&rsquo; badge.
            </p>
          </>
        )}
      </div>
    </main>
  );
}