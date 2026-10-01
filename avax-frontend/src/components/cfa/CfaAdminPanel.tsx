'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, MapPin, Save, UserPlus, Users } from 'lucide-react';
import { usePrivyAuth } from '@/lib/auth/privy-auth';

/**
 * CFA administration for admins on /nursery (Kanuvari Tools & Agents PRD
 * §4.1-§4.2): the CFA profile, members (roles, suspension, adding by email)
 * and nursery details. Every change goes through the /api/cfa/* routes,
 * which check the admin role again and write an audit entry.
 */

interface Member { id: string; name: string; email: string; role: string; status: string; hasSignedIn: boolean }
interface Location { id: string; name: string; description: string | null; latitude: string | number | null; longitude: string | number | null }

const C = { gold: '#C89B3C', goldLight: '#E4C878', paper: '#F6F2E7', paperDim: '#EFE9D9', inkLight: '#9BA396', hairline: 'rgba(200,155,60,0.14)', red: '#E88C7D', bg: '#0E2418' };
const MONO: React.CSSProperties = { fontFamily: 'var(--font-plex-mono), monospace' };
const label: React.CSSProperties = { ...MONO, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: C.goldLight, fontWeight: 600, margin: 0 };
const input: React.CSSProperties = { padding: '7px 2px', border: 'none', borderBottom: `1px solid ${C.hairline}`, background: 'none', color: C.paper, fontSize: 13, outline: 'none', fontFamily: 'inherit', minWidth: 0 };
const select: React.CSSProperties = { ...input, cursor: 'pointer' };
const option: React.CSSProperties = { background: C.bg };
const ROLES = ['member', 'admin', 'verifier', 'auditor', 'partner'];
const STATUSES = ['active', 'inactive', 'suspended'];

function SmallButton({ onClick, children, disabled }: { onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 999, border: `1px solid ${C.gold}`, background: 'none', color: C.goldLight, fontSize: 11.5, fontWeight: 700, cursor: disabled ? 'wait' : 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
      {children}
    </button>
  );
}

export default function CfaAdminPanel({ myMemberId, onChanged }: { myMemberId: string; onChanged: () => void }) {
  const { getAccessToken } = usePrivyAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [profile, setProfile] = useState<{ location: string; description: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [invite, setInvite] = useState({ name: '', email: '', role: 'member' });

  const headers = useCallback(async (): Promise<Record<string, string>> => {
    const t = await getAccessToken().catch(() => null);
    return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  }, [getAccessToken]);

  const load = useCallback(async () => {
    const h = await headers();
    const [m, l, p] = await Promise.all([
      fetch('/api/cfa/members', { headers: h }).then((r) => r.json()).catch(() => ({})),
      fetch('/api/cfa/locations').then((r) => r.json()).catch(() => ({})),
      fetch('/api/cfa/profile').then((r) => r.json()).catch(() => ({})),
    ]);
    setMembers(m.members ?? []);
    setLocations(l.locations ?? []);
    if (p.cfa) setProfile({ location: p.cfa.location ?? '', description: p.cfa.description ?? '' });
  }, [headers]);

  // Fetch-on-mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const send = async (method: 'POST' | 'PATCH', url: string, body: object, ok: string) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(url, { method, headers: await headers(), body: JSON.stringify(body) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg({ text: d.error ?? 'Could not save.', error: true }); return false; }
      setMsg({ text: ok });
      await load();
      onChanged();
      return true;
    } finally {
      setBusy(false);
    }
  };

  return (
    <section style={{ marginBottom: 28, paddingBottom: 20, borderBottom: `1px solid ${C.hairline}` }}>
      <p style={{ ...label, marginBottom: 12 }}>CFA admin</p>

      {profile && (
        <div style={{ marginBottom: 18 }}>
          <p style={{ fontSize: 12.5, fontWeight: 700, margin: '0 0 6px', color: C.paperDim }}>Profile</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <input value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} placeholder="Location" style={{ ...input, flex: '1 1 160px' }} />
            <input value={profile.description} onChange={(e) => setProfile({ ...profile, description: e.target.value })} placeholder="Description" style={{ ...input, flex: '2 1 220px' }} />
            <SmallButton disabled={busy} onClick={() => send('PATCH', '/api/cfa/profile', { location: profile.location, description: profile.description || null }, 'Profile saved.')}>
              <Save size={12} /> Save
            </SmallButton>
          </div>
        </div>
      )}

      <p style={{ fontSize: 12.5, fontWeight: 700, margin: '0 0 6px', color: C.paperDim, display: 'flex', gap: 6, alignItems: 'center' }}><Users size={13} /> Members</p>
      {members.map((m) => (
        <div key={m.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${C.hairline}`, flexWrap: 'wrap' }}>
          <span style={{ flex: '1 1 160px', fontSize: 12.5, color: C.paperDim, minWidth: 0 }}>
            {m.name} <span style={{ color: C.inkLight }}>· {m.email}{m.hasSignedIn ? '' : ' · not signed in yet'}</span>
          </span>
          {m.id === myMemberId ? (
            <span style={{ ...MONO, fontSize: 10, color: C.inkLight }}>{m.role} (you)</span>
          ) : (
            <>
              <select value={m.role} disabled={busy} onChange={(e) => send('PATCH', `/api/cfa/members/${m.id}`, { role: e.target.value }, `${m.name} is now ${e.target.value}.`)} style={select}>
                {ROLES.map((r) => <option key={r} value={r} style={option}>{r}</option>)}
              </select>
              <select value={m.status} disabled={busy} onChange={(e) => send('PATCH', `/api/cfa/members/${m.id}`, { status: e.target.value }, `${m.name} is now ${e.target.value}.`)} style={select}>
                {STATUSES.map((s) => <option key={s} value={s} style={option}>{s}</option>)}
              </select>
            </>
          )}
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end', marginTop: 10 }}>
        <input value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} placeholder="Name" style={{ ...input, flex: '1 1 120px' }} />
        <input type="email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} placeholder="Email" style={{ ...input, flex: '1 1 160px' }} />
        <select value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value })} style={select}>
          {ROLES.map((r) => <option key={r} value={r} style={option}>{r}</option>)}
        </select>
        <SmallButton disabled={busy || !invite.name.trim() || !invite.email.trim()} onClick={async () => {
          if (await send('POST', '/api/cfa/members', invite, `${invite.name} added. They are linked when they sign in with ${invite.email}.`)) setInvite({ name: '', email: '', role: 'member' });
        }}><UserPlus size={12} /> Add</SmallButton>
      </div>

      <p style={{ fontSize: 12.5, fontWeight: 700, margin: '18px 0 6px', color: C.paperDim, display: 'flex', gap: 6, alignItems: 'center' }}><MapPin size={13} /> Nurseries</p>
      {locations.length === 0 && <p style={{ fontSize: 12, color: C.inkLight, margin: 0 }}>No nurseries yet. Use “Add Location” above.</p>}
      {locations.map((l) => <LocationRow key={l.id} location={l} busy={busy} onSave={(body) => send('PATCH', `/api/cfa/locations/${l.id}`, body, `${l.name} saved.`)} />)}

      {busy && <p style={{ fontSize: 12, color: C.inkLight, margin: '8px 0 0' }}><Loader2 size={12} className="animate-spin" /> Saving…</p>}
      {msg && <p style={{ fontSize: 12, margin: '8px 0 0', color: msg.error ? C.red : C.goldLight }}>{msg.text}</p>}
    </section>
  );
}

function LocationRow({ location, busy, onSave }: { location: Location; busy: boolean; onSave: (body: object) => void }) {
  const [name, setName] = useState(location.name);
  const [description, setDescription] = useState(location.description ?? '');
  const [lat, setLat] = useState(location.latitude == null ? '' : String(location.latitude));
  const [lng, setLng] = useState(location.longitude == null ? '' : String(location.longitude));
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end', padding: '7px 0', borderBottom: `1px solid ${C.hairline}` }}>
      <input value={name} onChange={(e) => setName(e.target.value)} style={{ ...input, flex: '1 1 120px' }} />
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" style={{ ...input, flex: '2 1 160px' }} />
      <input type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="Lat" style={{ ...input, width: 80 }} />
      <input type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="Lng" style={{ ...input, width: 80 }} />
      <SmallButton disabled={busy} onClick={() => onSave({
        name, description: description.trim() || null,
        latitude: lat.trim() ? Number(lat) : null, longitude: lng.trim() ? Number(lng) : null,
      })}><Save size={12} /> Save</SmallButton>
    </div>
  );
}
