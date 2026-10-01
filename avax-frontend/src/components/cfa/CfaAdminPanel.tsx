'use client';

import { useCallback, useEffect, useState } from 'react';
import { Building2, ChevronDown, Loader2, MapPin, Save, UserPlus, Users } from 'lucide-react';
import { usePrivyAuth } from '@/lib/auth/privy-auth';

/**
 * "Manage the CFA" for admins on /nursery (Kanuvari Tools & Agents PRD
 * §4.1-§4.2): the team (roles, suspension, adding by email), nurseries and
 * the CFA's details. Three folding sections with plain labels; the Team
 * section has id "cfa-team" so the admin checklist can open it.
 * Every change goes through the /api/cfa/* routes, which check the admin
 * role again and write an audit entry.
 */

interface Member { id: string; name: string; email: string; role: string; status: string; hasSignedIn: boolean }
interface Location { id: string; name: string; description: string | null; latitude: string | number | null; longitude: string | number | null }

const C = { gold: '#C89B3C', goldLight: '#E4C878', paper: '#F6F2E7', paperDim: '#EFE9D9', inkLight: '#9BA396', hairline: 'rgba(200,155,60,0.14)', red: '#E88C7D', bg: '#0E2418', green: '#7DC383' };
const MONO: React.CSSProperties = { fontFamily: 'var(--font-plex-mono), monospace' };
const input: React.CSSProperties = { padding: '7px 2px', border: 'none', borderBottom: `1px solid ${C.hairline}`, background: 'none', color: C.paper, fontSize: 13, outline: 'none', fontFamily: 'inherit', minWidth: 0, width: '100%' };
const option: React.CSSProperties = { background: C.bg };

/** What each role may do, in the words shown to admins. */
const ROLES: { id: string; label: string; can: string }[] = [
  { id: 'member', label: 'Member', can: 'Records seedlings, planting and nursery work.' },
  { id: 'verifier', label: 'Verifier', can: 'Also checks and approves other people’s records.' },
  { id: 'admin', label: 'Admin', can: 'Everything: team, species, nurseries, approving, anchoring.' },
  { id: 'auditor', label: 'Auditor', can: 'Reads the full change history. Cannot approve.' },
  { id: 'partner', label: 'Partner', can: 'Outside partner. Records like a member.' },
];
const roleLabel = (id: string) => ROLES.find((r) => r.id === id)?.label ?? id;

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 160px', minWidth: 0 }}>
      <span style={{ ...MONO, fontSize: 9.5, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: C.inkLight }}>{label}</span>
      {children}
      {hint && <span style={{ fontSize: 11, color: C.inkLight }}>{hint}</span>}
    </label>
  );
}

function SaveButton({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 999, border: 'none', background: C.gold, color: '#1B1A14', fontSize: 12, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: disabled ? 0.5 : 1, flexShrink: 0 }}>
      {children}
    </button>
  );
}

function Section({ id, icon, title, summary, children, defaultOpen }: { id?: string; icon: React.ReactNode; title: string; summary: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details id={id} open={defaultOpen} style={{ borderBottom: `1px solid ${C.hairline}` }}>
      <summary style={{ listStyle: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: '13px 2px' }}>
        <span style={{ color: C.goldLight, display: 'flex' }}>{icon}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: C.paper }}>{title}</span>
          <span style={{ display: 'block', fontSize: 11.5, color: C.inkLight }}>{summary}</span>
        </span>
        <ChevronDown size={16} color={C.inkLight} className="cfa-chevron" />
      </summary>
      <div style={{ padding: '4px 2px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
    </details>
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

  const active = members.filter((m) => m.status === 'active');
  const checkers = active.filter((m) => m.role === 'admin' || m.role === 'verifier').length;

  return (
    <section style={{ marginBottom: 28 }}>
      <style>{`#cfa-manage details[open] .cfa-chevron { transform: rotate(180deg); } #cfa-manage summary::-webkit-details-marker { display: none; }`}</style>
      <p style={{ ...MONO, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: C.goldLight, fontWeight: 600, margin: '0 0 4px' }}>Manage the CFA</p>
      <p style={{ fontSize: 11.5, color: C.inkLight, margin: '0 0 6px' }}>Tap a section to open it. Only admins see this.</p>

      <div id="cfa-manage">
        {/* ── Team ── */}
        <Section id="cfa-team" icon={<Users size={17} />} title="Team"
          summary={`${active.length} active · ${checkers} can check records${checkers < 2 ? ' (need 2)' : ''}`}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 6 }}>
            {ROLES.slice(0, 3).map((r) => (
              <p key={r.id} style={{ fontSize: 11.5, color: C.inkLight, margin: 0 }}><strong style={{ color: C.paperDim }}>{r.label}:</strong> {r.can}</p>
            ))}
          </div>

          {members.map((m) => (
            <div key={m.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderTop: `1px solid ${C.hairline}`, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: m.status === 'active' ? C.paperDim : C.inkLight, margin: 0 }}>{m.name}{m.id === myMemberId ? ' (you)' : ''}</p>
                <p style={{ fontSize: 11, color: C.inkLight, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {m.email.endsWith('@kai.local') ? 'wallet login' : m.email}{m.hasSignedIn ? '' : ' · not signed in yet'}{m.status !== 'active' ? ` · ${m.status}` : ''}
                </p>
              </div>
              {m.id === myMemberId ? (
                <span style={{ ...MONO, fontSize: 10.5, color: C.green }}>{roleLabel(m.role)}</span>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <select aria-label={`Role of ${m.name}`} value={m.role} disabled={busy}
                    onChange={(e) => send('PATCH', `/api/cfa/members/${m.id}`, { role: e.target.value }, `${m.name} is now ${roleLabel(e.target.value)}.`)}
                    style={{ ...input, width: 'auto', cursor: 'pointer' }}>
                    {ROLES.map((r) => <option key={r.id} value={r.id} style={option}>{r.label}</option>)}
                  </select>
                  <select aria-label={`Status of ${m.name}`} value={m.status} disabled={busy}
                    onChange={(e) => send('PATCH', `/api/cfa/members/${m.id}`, { status: e.target.value }, `${m.name} is now ${e.target.value}.`)}
                    style={{ ...input, width: 'auto', cursor: 'pointer' }}>
                    <option value="active" style={option}>Active</option>
                    <option value="suspended" style={option}>Suspended</option>
                    <option value="inactive" style={option}>Left the CFA</option>
                  </select>
                </div>
              )}
            </div>
          ))}

          <div style={{ borderTop: `1px solid ${C.hairline}`, paddingTop: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.paperDim, margin: '0 0 2px' }}>Add a person</p>
            <p style={{ fontSize: 11.5, color: C.inkLight, margin: '0 0 10px' }}>They become active when they sign in on /nursery with this Google email.</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <Field label="Name"><input id="invite-name" value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} placeholder="e.g. Wanjiru Kamau" style={input} /></Field>
              <Field label="Google email"><input id="invite-email" type="email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} placeholder="name@gmail.com" style={input} /></Field>
              <Field label="Role">
                <select id="invite-role" value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value })} style={{ ...input, cursor: 'pointer' }}>
                  {ROLES.map((r) => <option key={r.id} value={r.id} style={option}>{r.label}</option>)}
                </select>
              </Field>
              <SaveButton disabled={busy || !invite.name.trim() || !invite.email.trim()} onClick={async () => {
                if (await send('POST', '/api/cfa/members', invite, `${invite.name} added.`)) setInvite({ name: '', email: '', role: 'member' });
              }}><UserPlus size={13} /> Add person</SaveButton>
            </div>
          </div>
        </Section>

        {/* ── Nurseries ── */}
        <Section icon={<MapPin size={17} />} title="Nurseries" summary={locations.length ? locations.map((l) => l.name).join(', ') : 'None yet. Use “Add a location” in the checklist.'}>
          {locations.length === 0 && <p style={{ fontSize: 12, color: C.inkLight, margin: 0 }}>No nurseries yet. Add one with the checklist above.</p>}
          {locations.map((l) => <LocationRow key={l.id} location={l} busy={busy} onSave={(body) => send('PATCH', `/api/cfa/locations/${l.id}`, body, `${l.name} saved.`)} />)}
        </Section>

        {/* ── CFA details ── */}
        <Section icon={<Building2 size={17} />} title="CFA details" summary={profile ? `${profile.location}${profile.description ? ` · ${profile.description}` : ''}` : '…'}>
          {profile && (
            <>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Field label="Location" hint="Shown on reports and verification pages."><input id="cfa-location" value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} placeholder="e.g. Karen, Nairobi" style={input} /></Field>
                <Field label="About the CFA"><input id="cfa-description" value={profile.description} onChange={(e) => setProfile({ ...profile, description: e.target.value })} placeholder="One sentence about your CFA" style={input} /></Field>
              </div>
              <div>
                <SaveButton disabled={busy} onClick={() => send('PATCH', '/api/cfa/profile', { location: profile.location, description: profile.description || null }, 'CFA details saved.')}>
                  <Save size={13} /> Save details
                </SaveButton>
              </div>
            </>
          )}
        </Section>
      </div>

      {busy && <p style={{ fontSize: 12, color: C.inkLight, margin: '10px 0 0', display: 'flex', gap: 6, alignItems: 'center' }}><Loader2 size={12} className="animate-spin" /> Saving…</p>}
      {msg && <p role="status" style={{ fontSize: 12.5, margin: '10px 0 0', color: msg.error ? C.red : C.green, fontWeight: 600 }}>{msg.text}</p>}
    </section>
  );
}

function LocationRow({ location, busy, onSave }: { location: Location; busy: boolean; onSave: (body: object) => void }) {
  const [name, setName] = useState(location.name);
  const [description, setDescription] = useState(location.description ?? '');
  const [lat, setLat] = useState(location.latitude == null ? '' : String(location.latitude));
  const [lng, setLng] = useState(location.longitude == null ? '' : String(location.longitude));
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', padding: '8px 0', borderTop: `1px solid ${C.hairline}` }}>
      <Field label="Name"><input value={name} onChange={(e) => setName(e.target.value)} style={input} /></Field>
      <Field label="Description"><input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" style={input} /></Field>
      <Field label="GPS (lat, lng)" hint="Optional, e.g. -1.358, 36.709">
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="lat" aria-label="Latitude" style={input} />
          <input type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="lng" aria-label="Longitude" style={input} />
        </div>
      </Field>
      <SaveButton disabled={busy} onClick={() => onSave({
        name, description: description.trim() || null,
        latitude: lat.trim() ? Number(lat) : null, longitude: lng.trim() ? Number(lng) : null,
      })}><Save size={13} /> Save</SaveButton>
    </div>
  );
}
