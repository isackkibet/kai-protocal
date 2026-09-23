'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ShieldCheck, Loader2, Mail, ArrowLeft, LogIn, Wallet, HelpCircle } from 'lucide-react';

const C = {
  bg:        '#0B1C14',
  gold:      '#C89B3C',
  goldLight: '#E4C878',
  paper:     '#F6F2E7',
  paperDim:  '#EFE9D9',
  inkLight:  '#9BA396',
  hairline:  'rgba(200,155,60,0.14)',
  red:       '#E88C7D',
};

interface Member {
  id: string;
  name: string;
  email: string;
  authProvider: string;
  status: string;
  referralCode: string | null;
  joinedAt: string;
  walletAddress: string | null;
}

interface Summary {
  total: number;
  byProvider: Record<string, number>;
  withWallet: number;
  withoutWallet: number;
}

const W: React.CSSProperties = { width: '100%', maxWidth: 960, margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' };
const label: React.CSSProperties = { fontFamily: 'var(--font-plex-mono), monospace', fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: C.goldLight, fontWeight: 600, margin: 0 };
const SERIF: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };

function providerIcon(p: string) {
  if (p === 'GOOGLE') return LogIn;
  if (p === 'EMAIL') return Mail;
  return HelpCircle;
}

export default function AdminMembersPage() {
  const [key, setKey] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('kai-admin-key') ?? '';
  });
  const [members, setMembers] = useState<Member[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(async (adminKey: string) => {
    setLoading(true);
    setErr('');
    try {
      const r = await fetch('/api/admin/members', { headers: { 'x-admin-key': adminKey } });
      const d = await r.json();
      if (r.ok) {
        setMembers(d.members ?? []);
        setSummary(d.summary ?? null);
        localStorage.setItem('kai-admin-key', adminKey);
      } else {
        setErr(String(d.error ?? 'Unauthorized — check the admin key'));
        setMembers(null);
        setSummary(null);
      }
    } catch {
      setErr('Network error');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!key) return;
    const id = window.setTimeout(() => { void load(key); }, 0);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fc = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

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
          Members <span style={{ color: C.goldLight }}>Admin</span>
        </h1>
        <p style={{ fontSize: 13, color: C.inkLight, margin: '8px 0 0', maxWidth: 560, lineHeight: 1.6 }}>
          Everyone who has actually completed sign-in and been saved to the database, broken down by how they joined.
        </p>

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

        {summary && (
          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            <div style={{ padding: '16px', border: `1px solid ${C.gold}`, borderRadius: 12 }}>
              <p style={label}>Total members</p>
              <p style={{ fontSize: 28, fontWeight: 700, margin: '6px 0 0', color: C.goldLight, fontFamily: 'var(--font-plex-mono), monospace' }}>{summary.total}</p>
            </div>
            <div style={{ padding: '16px', border: `1px solid ${C.hairline}`, borderRadius: 12 }}>
              <p style={label}>Via email</p>
              <p style={{ fontSize: 28, fontWeight: 700, margin: '6px 0 0', fontFamily: 'var(--font-plex-mono), monospace' }}>{summary.byProvider.EMAIL ?? 0}</p>
            </div>
            <div style={{ padding: '16px', border: `1px solid ${C.hairline}`, borderRadius: 12 }}>
              <p style={label}>Via Google</p>
              <p style={{ fontSize: 28, fontWeight: 700, margin: '6px 0 0', fontFamily: 'var(--font-plex-mono), monospace' }}>{summary.byProvider.GOOGLE ?? 0}</p>
            </div>
            <div style={{ padding: '16px', border: `1px solid ${C.hairline}`, borderRadius: 12 }}>
              <p style={label}>Wallet attached</p>
              <p style={{ fontSize: 28, fontWeight: 700, margin: '6px 0 0', fontFamily: 'var(--font-plex-mono), monospace' }}>{summary.withWallet}</p>
            </div>
          </div>
        )}

        {members && (
          <section style={{ marginTop: 28 }}>
            {members.length === 0 && (
              <p style={{ color: C.inkLight, fontSize: 13, marginTop: 12 }}>No members have joined yet. Joins appear here as they happen.</p>
            )}
            {members.map(m => {
              const Icon = providerIcon(m.authProvider);
              return (
                <div key={m.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0', borderBottom: `1px solid ${C.hairline}` }}>
                  <div style={{ width: 28, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                    <Icon size={16} color={C.inkLight} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {m.name}
                      <span style={{ fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase', color: C.gold, border: `1px solid ${C.gold}`, borderRadius: 999, padding: '2px 8px', fontWeight: 700 }}>
                        {m.authProvider}
                      </span>
                      {m.walletAddress && (
                        <span style={{ fontSize: 10, color: C.inkLight, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <Wallet size={10} /> connected
                        </span>
                      )}
                    </p>
                    <p style={{ fontSize: 11.5, color: C.inkLight, margin: '2px 0 0', fontFamily: 'var(--font-plex-mono), monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.email}
                      {m.walletAddress ? ` · ${m.walletAddress.slice(0, 6)}…${m.walletAddress.slice(-4)}` : ' · no wallet yet'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, fontSize: 11, color: C.inkLight, fontFamily: 'var(--font-plex-mono), monospace' }}>
                    <p style={{ margin: 0 }}>Joined {fc(m.joinedAt)}</p>
                    <p style={{ margin: '2px 0 0' }}>{m.status}</p>
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
