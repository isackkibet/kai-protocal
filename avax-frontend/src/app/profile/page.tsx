'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useDisconnect, useSignMessage } from 'wagmi';
import { buildOwnershipChallenge } from '@/lib/auth/wallet-signature';
import { usePrivyAuth } from '@/lib/auth/privy-auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { safeNext } from '@/components/shared/SignInOnProfile';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trees, Users, Wallet, ChevronRight, CheckCircle2, Copy, LogOut, MapPin, Mail,
  Save, RefreshCw, Sprout, Gift, Globe2, ShieldCheck, BookOpen, Circle, Flame, Trophy, Clock, Newspaper, type LucideIcon,
} from 'lucide-react';

interface Profile {
  walletAddress:string; email?:string|null; displayName:string; phone:string;
  county:string; idNumber:string;
  cfaGroup:string; cfaRole:string; cfaRegion:string; cfaJoinYear:string;
  businessName:string; businessType:string; businessLocation:string;
  annualTurnover:string; mpesaNumber:string;
  chamaName:string; chamaRole:string; chamaRegNo:string; monthlyContrib:string;
  riskTolerance:string; preferredVault:string; notifications:boolean;
  updatedAt?:string;
}

const EMPTY:Profile = {
  walletAddress:'', displayName:'', phone:'', county:'', idNumber:'',
  cfaGroup:'', cfaRole:'', cfaRegion:'', cfaJoinYear:'',
  businessName:'', businessType:'', businessLocation:'', annualTurnover:'', mpesaNumber:'',
  chamaName:'', chamaRole:'', chamaRegNo:'', monthlyContrib:'',
  riskTolerance:'medium', preferredVault:'', notifications:true,
};

const CFA_ROLES = ['Member','Guardian','Treasurer','Secretary','Admin','Verifier','Site manager','Auditor','Partner'];
/* Kenya's 47 counties, A to Z. */
const COUNTIES = [
  'Baringo','Bomet','Bungoma','Busia','Elgeyo-Marakwet','Embu','Garissa','Homa Bay','Isiolo','Kajiado',
  'Kakamega','Kericho','Kiambu','Kilifi','Kirinyaga','Kisii','Kisumu','Kitui','Kwale','Laikipia',
  'Lamu','Machakos','Makueni','Mandera','Marsabit','Meru','Migori','Mombasa',"Murang'a",'Nairobi',
  'Nakuru','Nandi','Narok','Nyamira','Nyandarua','Nyeri','Samburu','Siaya','Taita-Taveta','Tana River',
  'Tharaka-Nithi','Trans Nzoia','Turkana','Uasin Gishu','Vihiga','Wajir','West Pokot',
];
/* CFA roles as stored in the nursery records, in plain words. */
const ROLE_WORDS: Record<string, string> = {
  member: 'Member', admin: 'Admin', verifier: 'Verifier', auditor: 'Auditor', partner: 'Partner', site_manager: 'Site manager',
};
const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: THIS_YEAR - 1989 }, (_, i) => String(THIS_YEAR - i));

/* Kenyan numbers written any common way (0712..., 254712..., 712...) become +254 712 345 678. */
const tidyPhone = (v: string) => {
  const d = v.replace(/[^0-9+]/g, '');
  let n = d;
  if (/^0[17]\d{8}$/.test(d)) n = '+254' + d.slice(1);
  else if (/^254[17]\d{8}$/.test(d)) n = '+' + d;
  else if (/^[17]\d{8}$/.test(d)) n = '+254' + d;
  return /^\+254[17]\d{8}$/.test(n) ? `${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7, 10)} ${n.slice(10)}` : v.trim();
};
const phoneLooksWrong = (v: string) => !!v.trim() && !/^\+?[0-9 ()-]{9,20}$/.test(v.trim());
const fmtWait = (s: number) => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h ? `${h}h ${m}m` : `${Math.max(1, m)}m`; };
const ago = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  if (s < 86400 * 7) return `${Math.round(s / 86400)} d ago`;
  return new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
};

interface Points { total: number; lifetime: number; streak: number; rank: number; nextClaim: number; cooldown: number }
interface Member { role: string; status: string; createdAt: string; cfaName: string | null; cfaLocation: string | null }
interface Activity { id: string; title: string; points: number; createdAt: string }

/* The server sends null for empty fields; inputs need strings, or React
   stops controlling them and the form shows stale values. */
const clean = (p: Record<string, unknown>): Profile => {
  const out = { ...EMPTY } as Record<string, unknown>;
  for (const [k, v] of Object.entries(p)) if (v !== null && v !== undefined) out[k] = typeof v === 'number' ? String(v) : v;
  return out as unknown as Profile;
};

/* Points levels, the same as the Points page (/mine). */
const LEVELS = [
  { name: 'Seedling', from: 0 }, { name: 'Sapling', from: 250 },
  { name: 'Guardian', from: 1000 }, { name: 'Forest Keeper', from: 5000 },
];

/* What makes a profile complete, and where to fill each part in. */
const STEPS: { key: keyof Profile; todo: string; done: string }[] = [
  { key: 'displayName', todo: 'Add your name', done: 'Name' },
  { key: 'phone',       todo: 'Add your phone number', done: 'Phone' },
  { key: 'county',      todo: 'Choose your county', done: 'County' },
  { key: 'cfaGroup',    todo: 'Add your CFA group', done: 'CFA group' },
  { key: 'cfaRole',     todo: 'Choose your role in the group', done: 'Role' },
];

const GO_TO: { label: string; hint: string; href: string; Icon: LucideIcon }[] = [
  { label: 'Points and badges', hint: 'Missions, invites, leaderboard', href: '/mine', Icon: Gift },
  { label: 'SDG impact',        hint: 'Log actions for the global goals', href: '/sdg', Icon: Globe2 },
  { label: 'Nursery groups',    hint: 'Record seedlings and planting', href: '/nursery', Icon: Sprout },
  { label: 'Information Hubs',  hint: 'News from Oloolua and SIHU', href: '/hubs', Icon: Users },
  { label: 'Verification desk', hint: 'For CFA verifiers', href: '/mrv', Icon: ShieldCheck },
  { label: 'Guides',            hint: 'Jaza Miti and more', href: '/conservation', Icon: BookOpen },
];

const C = {
  bg: '#0E2418', band: '#12301F', card: '#15352A', gold: '#C89B3C', goldLight: '#E4C878',
  paper: '#F6F2E7', paperDim: '#C9CFC2', ink: '#1B1A14', inkLight: '#9BA396', green: '#7DC383',
  line: 'rgba(246,242,231,0.09)', red: '#E88C7D',
};

/* Time helpers live outside the component (the React compiler treats a
   clock read inside it as impure, even in event handlers). */
const nowMs = () => Date.now();
const nowIso = () => new Date().toISOString();

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="pf-field" htmlFor={id}>
      <span className="pf-label">{label}</span>
      {children}
      {hint && <span className="pf-hint">{hint}</span>}
    </label>
  );
}

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const privy = usePrivyAuth();
  // Profile identity: a wagmi-injected wallet (MetaMask/Core) when connected,
  // otherwise the Privy embedded wallet from the Google/email session.
  const effectiveAddress: string | undefined = address ?? privy.address ?? undefined;
  const canAuth = isConnected || privy.authenticated;
  // Other pages send people here to sign in (?next=/murals ...). Remember
  // where they came from (the Google sign-in leaves the page and comes back)
  // and return them there once they are signed in.
  const router = useRouter();
  useEffect(() => {
    const fromUrl = safeNext(new URLSearchParams(window.location.search).get('next'));
    let target = fromUrl;
    try {
      if (fromUrl) sessionStorage.setItem('kai-signin-next', fromUrl);
      target = fromUrl ?? safeNext(sessionStorage.getItem('kai-signin-next'));
      if (privy.authenticated) sessionStorage.removeItem('kai-signin-next');
    } catch { /* storage blocked: the URL is enough */ }
    if (privy.authenticated && target) router.replace(target);
  }, [privy.authenticated, router]);

  const [profile, setProfile] = useState<Profile>({ ...EMPTY });
  // The last saved version, to know when there are unsaved changes.
  const [baseline, setBaseline] = useState(JSON.stringify(EMPTY));
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const [points, setPoints] = useState<Points | null>(null);
  const [member, setMember] = useState<Member | null | undefined>(undefined);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [wait, setWait] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const [manages, setManages] = useState<('sihu' | 'oloolua')[]>([]);

  const say = (text: string, ok: boolean) => { setToast({ text, ok }); setTimeout(() => setToast(null), 3200); };

  const getAuthHeader = async (): Promise<Record<string, string>> => {
    try {
      const token = await privy.getAccessToken();
      return token ? { authorization: `Bearer ${token}` } : {};
    } catch {
      return {};
    }
  };

  const loaded = (p: Profile) => { setProfile(p); setBaseline(JSON.stringify(p)); };

  const load = useCallback(async (addr: string) => {
    try {
      let extra = '';
      const headers = await getAuthHeader();
      // No Privy session → prove ownership with a wagmi wallet signature.
      if (!headers.authorization && isConnected) {
        const timestamp = nowMs();
        const signature = await signMessageAsync({ message: buildOwnershipChallenge(addr, timestamp) });
        extra = `&signature=${encodeURIComponent(signature)}&timestamp=${timestamp}`;
      }
      const r = await fetch(`/api/profile?wallet=${addr}${extra}`, { headers });
      const { profile: p } = await r.json();
      loaded(p ? clean(p) : { ...EMPTY, walletAddress: addr });
    } catch { loaded({ ...EMPTY, walletAddress: addr }); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, signMessageAsync, privy.authenticated]);

  // Signed in with email/Google: the profile belongs to that account (no
  // wallet needed). Wallet-only visitors keep the older wallet-signed flow.
  const loadMe = useCallback(async () => {
    const headers = await getAuthHeader();
    try {
      const r = await fetch('/api/profile/me', { headers });
      if (r.ok) {
        const { profile: p } = await r.json();
        if (p) loaded(clean({ ...p, walletAddress: p.wallet ?? '' }));
      }
    } catch { /* keep the empty form */ }
    // Points, real CFA membership and recent activity: shown when available.
    const [pr, mr, ar] = await Promise.all([
      fetch('/api/airdrop/me', { headers }).catch(() => null),
      fetch('/api/cfa/join', { headers }).catch(() => null),
      fetch('/api/airdrop/activity', { headers }).catch(() => null),
    ]);
    const d = pr?.ok ? await pr.json().catch(() => null) : null;
    if (d?.data) {
      const x = d.data;
      setPoints({ total: x.totalPoints ?? 0, lifetime: x.lifetimePoints ?? x.totalPoints ?? 0, streak: x.streak ?? 0, rank: x.rank ?? 0, nextClaim: x.projectedNextClaim ?? x.baseDailyClaim ?? 10, cooldown: x.canClaimDaily ? 0 : (x.dailyClaimCooldownSeconds ?? 0) });
      setWait(x.canClaimDaily ? 0 : (x.dailyClaimCooldownSeconds ?? 0));
    }
    const m = mr?.ok ? await mr.json().catch(() => null) : null;
    setMember(m ? (m.member ?? null) : undefined);
    const a = ar?.ok ? await ar.json().catch(() => null) : null;
    if (Array.isArray(a?.data)) setActivity(a.data.slice(0, 4));
    // Hub managers get a shortcut to the Information Hub admin.
    const hubs = ['sihu', 'oloolua'] as const;
    const can = await Promise.all(hubs.map((h) => fetch(`/api/hubs/${h}/manage`, { headers }).then((r) => r.json()).then((d) => !!d.admin).catch(() => false)));
    setManages(hubs.filter((_, i) => can[i]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [privy.authenticated]);

  useEffect(() => {
    if (privy.authenticated) { void loadMe(); return; }
    if (effectiveAddress) load(effectiveAddress);
  }, [privy.authenticated, effectiveAddress, load, loadMe]);

  // Count down to the next daily points.
  useEffect(() => {
    if (wait <= 0) return;
    const t = setInterval(() => setWait((w) => (w > 60 ? w - 60 : 0)), 60_000);
    return () => clearInterval(t);
  }, [wait]);

  const collect = async () => {
    if (claiming || wait > 0) return;
    setClaiming(true);
    try {
      const r = await fetch('/api/airdrop/claim', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(await getAuthHeader()) }, body: '{}' });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.ok) { say(`+${Number(d.data?.claimPoints ?? 0)} points collected`, true); await loadMe(); }
      else { if (r.status === 409 && d.remainingSeconds) setWait(Number(d.remainingSeconds)); say(d.error ?? 'Could not collect your points. Try again.', false); }
    } catch { say('No connection. Try again', false); } finally { setClaiming(false); }
  };

  const fillFromMembership = () => {
    if (!member) return;
    setProfile((p) => ({
      ...p,
      cfaGroup: p.cfaGroup || member.cfaName || p.cfaGroup,
      cfaRole: p.cfaRole || ROLE_WORDS[member.role] || p.cfaRole,
      cfaRegion: p.cfaRegion || member.cfaLocation || p.cfaRegion,
      cfaJoinYear: p.cfaJoinYear || String(new Date(member.createdAt).getFullYear()),
    }));
  };

  const set = (k: keyof Profile) => (v: string) => setProfile((p) => ({ ...p, [k]: v }));
  const dirty = JSON.stringify(profile) !== baseline;

  const save = async () => {
    if (!profile.displayName.trim()) { say('Please add your name first', false); focusField('displayName'); return; }
    if (privy.authenticated) {
      setSaving(true);
      try {
        const r = await fetch('/api/profile/me', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(await getAuthHeader()) }, body: JSON.stringify(profile) });
        const d = await r.json().catch(() => ({}));
        if (r.ok) {
          const next = { ...profile, updatedAt: nowIso() };
          loaded(next);
          say('Profile saved', true);
        } else {
          say(d.error ?? 'Save failed. Try again', false);
          if (d.field) focusField(d.field);
        }
      } catch { say('No connection. Try again', false); } finally { setSaving(false); }
      return;
    }
    if (!effectiveAddress) { say('Sign in with your email first', false); return; }
    setSaving(true);
    try {
      const headers = await getAuthHeader();
      let body: Record<string, unknown> = { ...profile, walletAddress: effectiveAddress };
      // No Privy session → attach a signed wallet-ownership challenge.
      if (!headers.authorization) {
        const timestamp = nowMs();
        const signature = await signMessageAsync({ message: buildOwnershipChallenge(effectiveAddress, timestamp) });
        body = { ...body, signature, timestamp };
      }
      const r = await fetch('/api/profile', {
        method:'POST', headers:{'Content-Type':'application/json', ...headers},
        body:JSON.stringify(body),
      });
      if (r.ok) { loaded({ ...profile, updatedAt: nowIso() }); say('Profile saved', true); }
      else say('Save failed. Try again', false);
    } catch { say('No connection. Try again', false); }
    finally { setSaving(false); }
  };

  const signOut = async () => {
    if (isConnected) disconnect();
    try { await privy.logout(); } catch { /* already signed out */ }
    loaded({ ...EMPTY });
    setPoints(null);
  };

  const copyAddr = () => {
    if (!effectiveAddress) return;
    void navigator.clipboard.writeText(effectiveAddress);
    setCopied(true); setTimeout(() => setCopied(false), 1600);
  };

  const focusField = (key: string) => {
    const el = document.getElementById(`pf-${key}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => (el as HTMLInputElement).focus({ preventScroll: true }), 350);
  };

  const done = STEPS.filter((s) => String(profile[s.key] ?? '').trim()).length;
  const complete = Math.round((done / STEPS.length) * 100);
  const missing = STEPS.filter((s) => !String(profile[s.key] ?? '').trim());
  const initials = profile.displayName
    ? profile.displayName.trim().split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : (profile.email ?? privy.email ?? 'K')[0].toUpperCase();
  const email = profile.email ?? privy.email;
  const levelIdx = points ? LEVELS.reduce((i, l, j) => (points.lifetime >= l.from ? j : i), 0) : 0;
  const nextLevel = LEVELS[levelIdx + 1];

  return (
    <main className="pf">
      <style>{CSS}</style>

      {!canAuth ? (
        /* ---------- Signed out: the one place to sign in ---------- */
        <section className="pf-signin">
          <div className="pf-signin-photo" aria-hidden="true" />
          <div className="pf-signin-card">
            <span className="pf-badge"><Trees size={14} /> KAI conservation</span>
            <h1>Sign in to KAI</h1>
            <p className="pf-muted">Use your email or Google account. No wallet needed.</p>
            <ul className="pf-benefits">
              <li><CheckCircle2 size={17} /> Save your nursery and planting records</li>
              <li><CheckCircle2 size={17} /> Earn points and badges for taking part</li>
              <li><CheckCircle2 size={17} /> Join your CFA group and its Information Hub</li>
            </ul>
            <button className="pf-btn pf-btn--wide" onClick={() => { void privy.signInWithGoogle(); }}>
              <span className="pf-g" aria-hidden="true">G</span> Continue with Google
            </button>
            <button className="pf-btn pf-btn--ghost pf-btn--wide" onClick={() => { void privy.signInWithEmail(); }}>
              <Mail size={16} /> Continue with email
            </button>
            <p className="pf-small">After you sign in, we take you back to the page you came from.</p>
          </div>
        </section>
      ) : (
        <>
          {/* ---------- Header ---------- */}
          <header className="pf-hero">
            <div className="pf-cover" aria-hidden="true" />
            <div className="pf-wrap pf-hero-row">
              <div className="pf-avatar" aria-hidden="true">{initials}</div>
              <div className="pf-who">
                <h1>{profile.displayName || 'Welcome to KAI'}</h1>
                <div className="pf-meta">
                  {email && <span><Mail size={14} /> {email}</span>}
                  {profile.county && <span><MapPin size={14} /> {profile.county}, Kenya</span>}
                </div>
                <div className="pf-chips">
                  <span className="pf-chip pf-chip--gold">KAI member</span>
                  {member ? (
                    <Link href="/nursery" prefetch={false} className="pf-chip pf-chip--green" title="Confirmed in the nursery records"><ShieldCheck size={13} /> {member.cfaName ?? 'CFA'} · {ROLE_WORDS[member.role] ?? member.role}</Link>
                  ) : profile.cfaGroup ? (
                    <Link href="/nursery" prefetch={false} className="pf-chip pf-chip--green"><Trees size={13} /> {profile.cfaGroup}{profile.cfaRole ? ` · ${profile.cfaRole}` : ''}</Link>
                  ) : null}
                  {points && <Link href="/mine" prefetch={false} className="pf-chip"><Gift size={13} /> {LEVELS[levelIdx].name}</Link>}
                </div>
              </div>
              <button className="pf-btn pf-btn--ghost pf-signout" onClick={() => { void signOut(); }}><LogOut size={15} /> Sign out</button>
            </div>
          </header>

          {/* Points at a glance, with one-tap daily points */}
          {points && (
            <div className="pf-wrap">
              <div className="pf-stats">
                <Link href="/mine" prefetch={false} className="pf-stat"><small>Points</small><b>{points.total.toLocaleString()}</b></Link>
                <Link href="/mine" prefetch={false} className="pf-stat"><small>Level</small><b>{LEVELS[levelIdx].name}</b>{nextLevel && <em>{(nextLevel.from - points.lifetime).toLocaleString()} to {nextLevel.name}</em>}</Link>
                <div className="pf-stat"><small>Streak</small><b><Flame size={17} /> {points.streak} {points.streak === 1 ? 'day' : 'days'}</b></div>
                {points.rank > 0 && <Link href="/mine" prefetch={false} className="pf-stat"><small>Rank</small><b><Trophy size={16} /> #{points.rank}</b></Link>}
                <button type="button" className={`pf-claim${wait > 0 ? ' is-wait' : ''}`} onClick={() => { void collect(); }} disabled={claiming || wait > 0}>
                  {claiming ? <><RefreshCw size={16} className="pf-spin" /> Collecting…</>
                    : wait > 0 ? <><Clock size={16} /> Next points in {fmtWait(wait)}</>
                    : <><Gift size={16} /> Collect +{points.nextClaim} today</>}
                </button>
              </div>
            </div>
          )}

          <div className="pf-wrap pf-grid">
            <div className="pf-main">
              {/* Profile strength: what is left, and a tap takes you there */}
              <section className="pf-sec">
                <div className="pf-strength-top">
                  <h2>Profile strength</h2>
                  <b>{complete}%</b>
                </div>
                <div className="pf-bar"><motion.span initial={{ width: 0 }} animate={{ width: `${complete}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} /></div>
                {missing.length ? (
                  <ul className="pf-todo">
                    {STEPS.map((s) => {
                      const ok = !missing.includes(s);
                      return (
                        <li key={s.key}>
                          <button type="button" onClick={() => focusField(s.key)} className={ok ? 'is-done' : ''} disabled={ok}>
                            {ok ? <CheckCircle2 size={16} /> : <Circle size={16} />} {ok ? s.done : s.todo}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="pf-muted"><CheckCircle2 size={15} color={C.green} style={{ verticalAlign: '-3px' }} /> Your profile is complete. Thank you!</p>
                )}
              </section>

              {/* Personal details */}
              <section className="pf-sec">
                <h2>Personal details</h2>
                <p className="pf-muted">How people in your group know and reach you.</p>
                <div className="pf-fields">
                  <div className="pf-span">
                    <Field id="pf-displayName" label="Full name">
                      <input id="pf-displayName" value={profile.displayName} onChange={(e) => set('displayName')(e.target.value)} placeholder="e.g. Grace Wangari" autoComplete="name" />
                    </Field>
                  </div>
                  <Field id="pf-phone" label="Phone number" hint="Any format works. We tidy it for you.">
                    <input id="pf-phone" type="tel" value={profile.phone} onChange={(e) => set('phone')(e.target.value)} onBlur={(e) => set('phone')(tidyPhone(e.target.value))} placeholder="0712 345 678" autoComplete="tel" aria-invalid={phoneLooksWrong(profile.phone)} />
                    {phoneLooksWrong(profile.phone) && <span className="pf-warn">Check this number, for example 0712 345 678</span>}
                  </Field>
                  <Field id="pf-county" label="County">
                    <select id="pf-county" value={profile.county} onChange={(e) => set('county')(e.target.value)} className={profile.county ? '' : 'is-empty'}>
                      <option value="" disabled>Choose your county</option>
                      {COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <div className="pf-span">
                    <Field id="pf-idNumber" label="National ID (optional)" hint="Private. Only used to confirm CFA membership.">
                      <input id="pf-idNumber" value={profile.idNumber} onChange={(e) => set('idNumber')(e.target.value)} placeholder="ID number" inputMode="numeric" />
                    </Field>
                  </div>
                </div>
              </section>

              {/* CFA group */}
              <section className="pf-sec">
                <h2>CFA group</h2>
                <p className="pf-muted">Your Community Forest Association and nursery group.</p>
                {member ? (
                  <div className="pf-verified">
                    <ShieldCheck size={20} />
                    <div>
                      <b>{member.cfaName ?? 'Your CFA'} · {ROLE_WORDS[member.role] ?? member.role}</b>
                      <small>Confirmed in the nursery records{member.status !== 'active' ? ` (${member.status})` : ''} · since {new Date(member.createdAt).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })}</small>
                    </div>
                    {(!profile.cfaGroup || !profile.cfaRole) && <button type="button" className="pf-btn pf-btn--small" onClick={fillFromMembership}>Fill in for me</button>}
                  </div>
                ) : member === null ? (
                  <Link href="/nursery" prefetch={false} className="pf-verified pf-verified--join">
                    <Sprout size={20} />
                    <div><b>Join your nursery group</b><small>Members record seedlings and planting, and earn points.</small></div>
                    <ChevronRight size={16} />
                  </Link>
                ) : null}
                <div className="pf-fields">
                  <div className="pf-span">
                    <Field id="pf-cfaGroup" label="Group name">
                      <input id="pf-cfaGroup" value={profile.cfaGroup} onChange={(e) => set('cfaGroup')(e.target.value)} placeholder="e.g. Oloolua Youth Guardians" />
                    </Field>
                  </div>
                  <Field id="pf-cfaRole" label="Your role">
                    <select id="pf-cfaRole" value={profile.cfaRole} onChange={(e) => set('cfaRole')(e.target.value)} className={profile.cfaRole ? '' : 'is-empty'}>
                      <option value="" disabled>Choose your role</option>
                      {CFA_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </Field>
                  <Field id="pf-cfaJoinYear" label="Year you joined">
                    <select id="pf-cfaJoinYear" value={profile.cfaJoinYear} onChange={(e) => set('cfaJoinYear')(e.target.value)} className={profile.cfaJoinYear ? '' : 'is-empty'}>
                      <option value="" disabled>Choose a year</option>
                      {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </Field>
                  <div className="pf-span">
                    <Field id="pf-cfaRegion" label="Forest or region">
                      <input id="pf-cfaRegion" value={profile.cfaRegion} onChange={(e) => set('cfaRegion')(e.target.value)} placeholder="e.g. Oloolua Forest, Nairobi" />
                    </Field>
                  </div>
                </div>
                {profile.updatedAt && <p className="pf-small">Last saved {new Date(profile.updatedAt).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}</p>}
              </section>
            </div>

            <aside className="pf-side">
              {activity.length > 0 && (
                <section className="pf-sec">
                  <div className="pf-sec-top"><h2>Recent activity</h2><Link href="/mine" prefetch={false}>See all</Link></div>
                  <ul className="pf-activity">
                    {activity.map((e) => (
                      <li key={e.id}>
                        <span><b>{e.title}</b><small>{ago(e.createdAt)}</small></span>
                        <em className={e.points < 0 ? 'is-minus' : ''}>{e.points >= 0 ? '+' : ''}{e.points}</em>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <nav className="pf-sec pf-links" aria-label="Go to">
                <h2>Go to</h2>
                {manages.map((h) => (
                  <Link key={h} href={`/hubs/${h}/admin`} prefetch={false} className="pf-link pf-link--admin">
                    <span className="pf-link-icon"><Newspaper size={17} /></span>
                    <span><b>Manage {h === 'sihu' ? 'SIHU Information Hub' : 'Oloolua hub'}</b><small>Publish news, stories, photos and videos</small></span>
                    <ChevronRight size={15} className="pf-link-arrow" />
                  </Link>
                ))}
                {GO_TO.map((l) => (
                  <Link key={l.href} href={l.href} prefetch={false} className="pf-link">
                    <span className="pf-link-icon"><l.Icon size={17} /></span>
                    <span><b>{l.label}</b><small>{l.hint}</small></span>
                    <ChevronRight size={15} className="pf-link-arrow" />
                  </Link>
                ))}
              </nav>

              <section className="pf-sec">
                <h2>Account</h2>
                <dl className="pf-account">
                  {email && <><dt>Email</dt><dd>{email}</dd></>}
                  {effectiveAddress && (
                    <>
                      <dt>Wallet <span className="pf-small">(optional)</span></dt>
                      <dd>
                        <button type="button" className="pf-copy" onClick={copyAddr} title="Copy wallet address">
                          <Wallet size={13} /> {effectiveAddress.slice(0, 6)}…{effectiveAddress.slice(-4)}
                          {copied ? <CheckCircle2 size={13} color={C.green} /> : <Copy size={13} />}
                        </button>
                      </dd>
                    </>
                  )}
                </dl>
                <button className="pf-btn pf-btn--ghost pf-btn--wide" onClick={() => { void signOut(); }}><LogOut size={15} /> Sign out</button>
              </section>
            </aside>
          </div>

          {/* Save bar: only when something changed */}
          <AnimatePresence>
            {dirty && (
              <motion.div className="pf-savebar" initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={{ duration: 0.22 }}>
                <span>You have unsaved changes</span>
                <div>
                  <button className="pf-btn pf-btn--text" onClick={() => setProfile(JSON.parse(baseline))} disabled={saving}>Undo</button>
                  <button className="pf-btn" onClick={() => { void save(); }} disabled={saving}>
                    {saving ? <><RefreshCw size={15} className="pf-spin" /> Saving…</> : <><Save size={15} /> Save changes</>}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      <AnimatePresence>
        {toast && (
          <motion.div className={`pf-toast ${toast.ok ? 'is-ok' : 'is-bad'}`} role="status"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}>
            {toast.ok ? <CheckCircle2 size={15} /> : null} {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

const CSS = `
.pf { min-height: 100dvh; background: ${C.bg}; color: ${C.paper}; font-family: 'Inter', system-ui, sans-serif; padding-bottom: 140px; }
.pf-wrap { max-width: 1080px; margin: 0 auto; padding: 0 24px; }
.pf h1, .pf h2 { margin: 0; letter-spacing: -0.01em; }
.pf-muted { color: ${C.inkLight}; font-size: 14px; margin: 4px 0 0; line-height: 1.55; }
.pf-small { color: ${C.inkLight}; font-size: 12.5px; margin: 14px 0 0; }
.pf-label { font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: ${C.inkLight}; }

/* Buttons */
.pf-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 11px 20px; border-radius: 999px; border: none; background: ${C.gold}; color: ${C.ink}; font: 700 14px 'Inter', system-ui, sans-serif; cursor: pointer; transition: background-color .15s ease, transform .15s ease; min-height: 44px; }
.pf-btn:hover { background: ${C.goldLight}; }
.pf-btn:active { transform: scale(.98); }
.pf-btn:disabled { opacity: .6; cursor: default; }
.pf-btn--ghost { background: rgba(246,242,231,0.06); color: ${C.paper}; border: 1px solid ${C.line}; }
.pf-btn--ghost:hover { background: rgba(246,242,231,0.12); }
.pf-btn--text { background: none; color: ${C.paperDim}; padding: 11px 14px; }
.pf-btn--text:hover { background: rgba(246,242,231,0.08); }
.pf-btn--wide { width: 100%; }
.pf-spin { animation: pf-spin 1s linear infinite; }
@keyframes pf-spin { to { transform: rotate(360deg); } }

/* Signed out */
.pf-signin { position: relative; min-height: 100dvh; display: grid; place-items: center; padding: 32px 16px 120px; }
.pf-signin-photo { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(14,36,24,.6), rgba(14,36,24,.96) 70%), url('/images/home-hero.jpg') center / cover; }
.pf-signin-card { position: relative; width: 100%; max-width: 420px; background: rgba(18,48,31,.92); border: 1px solid ${C.line}; border-radius: 24px; padding: 32px 28px; box-shadow: 0 30px 80px rgba(0,0,0,.35); display: flex; flex-direction: column; gap: 12px; }
.pf-signin-card h1 { font-size: 30px; font-weight: 700; margin-top: 6px; }
.pf-badge { align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 999px; border: 1px solid rgba(228,200,120,.35); color: ${C.goldLight}; font-size: 12.5px; font-weight: 600; }
.pf-benefits { list-style: none; padding: 0; margin: 8px 0 10px; display: grid; gap: 10px; }
.pf-benefits li { display: flex; gap: 10px; align-items: flex-start; font-size: 14.5px; color: ${C.paperDim}; }
.pf-benefits svg { color: ${C.green}; flex-shrink: 0; margin-top: 1px; }
.pf-g { width: 20px; height: 20px; border-radius: 50%; background: #fff; color: #4285F4; display: grid; place-items: center; font-weight: 800; font-size: 13px; }
.pf-signin-card .pf-small { text-align: center; margin-top: 6px; }

/* Header */
.pf-hero { position: relative; }
.pf-cover { height: 190px; background: linear-gradient(180deg, rgba(14,36,24,.15), rgba(14,36,24,1)), url('/images/home-hero.jpg') center 40% / cover; }
.pf-hero-row { display: flex; align-items: flex-end; gap: 22px; margin-top: -70px; position: relative; }
.pf-avatar { width: 112px; height: 112px; flex-shrink: 0; border-radius: 50%; background: ${C.gold}; color: ${C.ink}; border: 4px solid ${C.bg}; display: grid; place-items: center; font-size: 40px; font-weight: 700; }
.pf-who { flex: 1; min-width: 0; padding-bottom: 4px; }
.pf-who h1 { font-size: clamp(24px, 3.2vw, 34px); font-weight: 700; overflow-wrap: anywhere; }
.pf-meta { display: flex; flex-wrap: wrap; gap: 6px 18px; margin-top: 6px; color: ${C.paperDim}; font-size: 14px; }
.pf-meta span { display: inline-flex; align-items: center; gap: 6px; min-width: 0; overflow-wrap: anywhere; }
.pf-meta svg { color: ${C.goldLight}; flex-shrink: 0; }
.pf-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.pf-chip { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 999px; border: 1px solid ${C.line}; color: ${C.paperDim}; font-size: 12.5px; font-weight: 600; text-decoration: none; }
.pf-chip--gold { color: ${C.goldLight}; border-color: rgba(228,200,120,.35); }
.pf-chip--green { color: ${C.green}; border-color: rgba(125,195,131,.35); }
a.pf-chip:hover { background: rgba(246,242,231,.06); }
.pf-signout { flex-shrink: 0; margin-bottom: 4px; }

/* Body */
.pf-grid { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 48px; margin-top: 36px; }
.pf-sec { padding: 28px 0; border-top: 1px solid ${C.line}; }
.pf-main .pf-sec:first-child { border-top: 0; padding-top: 0; }
.pf-sec h2 { font-size: 19px; font-weight: 700; }

.pf-strength-top { display: flex; align-items: baseline; justify-content: space-between; }
.pf-strength-top b { font-size: 22px; color: ${C.goldLight}; }
.pf-bar { height: 6px; border-radius: 6px; background: rgba(246,242,231,.08); margin: 12px 0 14px; overflow: hidden; }
.pf-bar span { display: block; height: 100%; border-radius: 6px; background: linear-gradient(90deg, ${C.gold}, ${C.goldLight}); }
.pf-todo { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 8px; }
.pf-todo button { display: inline-flex; align-items: center; gap: 7px; padding: 8px 13px; border-radius: 999px; border: 1px dashed rgba(228,200,120,.45); background: none; color: ${C.goldLight}; font: 600 13px 'Inter', system-ui, sans-serif; cursor: pointer; }
.pf-todo button:hover { background: rgba(228,200,120,.08); }
.pf-todo button.is-done { border-style: solid; border-color: rgba(125,195,131,.3); color: ${C.green}; cursor: default; opacity: .85; }

.pf-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 18px 20px; margin-top: 20px; }
.pf-span { grid-column: 1 / -1; }
.pf-field { display: flex; flex-direction: column; gap: 7px; }
.pf-field input, .pf-field select {
  width: 100%; box-sizing: border-box; min-height: 48px; padding: 12px 14px; border-radius: 12px;
  border: 1px solid ${C.line}; background: rgba(246,242,231,.04); color: ${C.paper};
  font: 500 15px 'Inter', system-ui, sans-serif; outline: none; transition: border-color .15s ease, background-color .15s ease, box-shadow .15s ease;
}
.pf-field input::placeholder { color: rgba(155,163,150,.7); }
.pf-field input:hover, .pf-field select:hover { border-color: rgba(246,242,231,.2); }
.pf-field input:focus, .pf-field select:focus { border-color: ${C.gold}; background: rgba(246,242,231,.06); box-shadow: 0 0 0 3px rgba(200,155,60,.18); }
.pf-field select { appearance: none; cursor: pointer; padding-right: 40px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23C9CFC2' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 14px center; }
.pf-field select.is-empty { color: rgba(155,163,150,.85); }
.pf-field option { background: ${C.bg}; color: ${C.paper}; }
.pf-hint { font-size: 12.5px; color: ${C.inkLight}; }

/* Points strip */
.pf-stats { display: flex; flex-wrap: wrap; align-items: stretch; gap: 10px; margin-top: 28px; }
.pf-stat { flex: 1 1 120px; display: flex; flex-direction: column; gap: 2px; padding: 14px 16px; border-radius: 16px; background: rgba(246,242,231,.04); border: 1px solid ${C.line}; text-decoration: none; color: ${C.paper}; transition: border-color .15s ease, background-color .15s ease; }
a.pf-stat:hover { border-color: rgba(228,200,120,.35); background: rgba(246,242,231,.06); }
.pf-stat small { font-size: 12px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: ${C.inkLight}; }
.pf-stat b { display: inline-flex; align-items: center; gap: 6px; font-size: 20px; font-weight: 700; }
.pf-stat b svg { color: ${C.goldLight}; }
.pf-stat em { font-style: normal; font-size: 12px; color: ${C.inkLight}; }
.pf-claim { flex: 1 1 220px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 18px; border-radius: 16px; border: none; background: ${C.gold}; color: ${C.ink}; font: 700 15px 'Inter', system-ui, sans-serif; cursor: pointer; transition: background-color .15s ease, transform .15s ease; min-height: 56px; }
.pf-claim:hover { background: ${C.goldLight}; }
.pf-claim:active { transform: scale(.98); }
.pf-claim.is-wait { background: rgba(246,242,231,.05); color: ${C.paperDim}; border: 1px dashed rgba(228,200,120,.35); cursor: default; }
.pf-claim:disabled { opacity: 1; }

/* Membership */
.pf-verified { display: flex; align-items: center; gap: 14px; margin-top: 18px; padding: 14px 16px; border-radius: 16px; background: rgba(125,195,131,.08); border: 1px solid rgba(125,195,131,.28); color: ${C.paper}; text-decoration: none; }
.pf-verified > svg:first-child { color: ${C.green}; flex-shrink: 0; }
.pf-verified > div { flex: 1; min-width: 0; }
.pf-verified b { display: block; font-size: 14.5px; }
.pf-verified small { display: block; font-size: 12.5px; color: ${C.inkLight}; margin-top: 2px; }
.pf-verified--join { background: rgba(228,200,120,.07); border-color: rgba(228,200,120,.3); }
.pf-verified--join > svg { color: ${C.goldLight} !important; }
.pf-verified--join:hover { border-color: rgba(228,200,120,.55); }
.pf-btn--small { padding: 8px 14px; min-height: 36px; font-size: 13px; flex-shrink: 0; }
.pf-warn { font-size: 12.5px; color: ${C.red}; }
.pf-field input[aria-invalid="true"] { border-color: rgba(232,140,125,.6); }

/* Recent activity */
.pf-sec-top { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 8px; }
.pf-sec-top a { color: ${C.goldLight}; font-size: 13px; font-weight: 600; text-decoration: none; }
.pf-activity { list-style: none; padding: 0; margin: 0; }
.pf-activity li { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 0; border-bottom: 1px solid ${C.line}; }
.pf-activity li:last-child { border-bottom: 0; }
.pf-activity b { display: block; font-size: 13.5px; font-weight: 600; }
.pf-activity small { display: block; font-size: 12px; color: ${C.inkLight}; margin-top: 1px; }
.pf-activity em { font-style: normal; font-weight: 700; font-size: 14px; color: ${C.green}; flex-shrink: 0; }
.pf-activity em.is-minus { color: ${C.red}; }

/* Side */
.pf-side .pf-sec:first-child { border-top: 0; padding-top: 0; }
.pf-links h2, .pf-side .pf-sec h2 { margin-bottom: 8px; }
.pf-link { display: flex; align-items: center; gap: 12px; padding: 10px 8px; margin: 0 -8px; border-radius: 12px; text-decoration: none; color: ${C.paper}; transition: background-color .15s ease; }
.pf-link:hover { background: rgba(246,242,231,.05); }
.pf-link--admin .pf-link-icon { background: rgba(111,168,220,.15); color: #9cc5ea; }
.pf-link-icon { width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; background: rgba(228,200,120,.1); color: ${C.goldLight}; flex-shrink: 0; }
.pf-link b { display: block; font-size: 14px; }
.pf-link small { display: block; font-size: 12.5px; color: ${C.inkLight}; margin-top: 1px; }
.pf-link-arrow { margin-left: auto; color: ${C.inkLight}; flex-shrink: 0; }
.pf-account { margin: 4px 0 16px; display: grid; grid-template-columns: auto 1fr; gap: 10px 14px; font-size: 13.5px; }
.pf-account dt { color: ${C.inkLight}; }
.pf-account dd { margin: 0; color: ${C.paperDim}; text-align: right; overflow-wrap: anywhere; }
.pf-copy { display: inline-flex; align-items: center; gap: 6px; background: none; border: 0; padding: 0; color: ${C.paperDim}; font: 500 13px 'Inter', system-ui, sans-serif; cursor: pointer; }
.pf-copy:hover { color: ${C.goldLight}; }

/* Save bar and toast (centred with margins: framer-motion owns transform) */
.pf-savebar { position: fixed; left: 0; right: 0; margin: 0 auto; bottom: 88px; z-index: 60; width: min(560px, calc(100% - 24px)); box-sizing: border-box;
  display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 10px 10px 20px; border-radius: 999px;
  background: ${C.band}; border: 1px solid rgba(228,200,120,.3); box-shadow: 0 16px 40px rgba(0,0,0,.4); font-size: 14px; font-weight: 600; }
.pf-savebar > div { display: flex; gap: 4px; }
.pf-toast { position: fixed; left: 0; right: 0; margin: 0 auto; width: max-content; max-width: calc(100% - 24px); bottom: 152px; z-index: 70; display: flex; align-items: center; gap: 8px; padding: 11px 20px; border-radius: 999px; background: ${C.band}; border: 1px solid ${C.line}; font-size: 14px; font-weight: 600; white-space: nowrap; }
.pf-toast.is-ok { color: ${C.green}; }
.pf-toast.is-bad { color: ${C.red}; }

@media (max-width: 860px) {
  .pf-grid { grid-template-columns: 1fr; gap: 8px; }
  .pf-side { border-top: 1px solid ${C.line}; padding-top: 28px; }
}
@media (max-width: 600px) {
  .pf-wrap { padding: 0 16px; }
  .pf-cover { height: 150px; }
  .pf-hero-row { flex-direction: column; align-items: flex-start; gap: 12px; margin-top: -56px; }
  .pf-avatar { width: 92px; height: 92px; font-size: 32px; }
  .pf-signout { display: none; }
  .pf-fields { grid-template-columns: 1fr; }
  .pf-savebar { border-radius: 18px; flex-wrap: wrap; padding: 12px 12px 12px 16px; }
  .pf-savebar > span { font-size: 13px; }
  .pf-savebar > div { margin-left: auto; }
  .pf-stats { gap: 8px; }
  .pf-stat { flex: 1 1 40%; padding: 12px 14px; }
  .pf-stat b { font-size: 18px; }
  .pf-claim { flex-basis: 100%; }
  .pf-verified { flex-wrap: wrap; }
}
`;
