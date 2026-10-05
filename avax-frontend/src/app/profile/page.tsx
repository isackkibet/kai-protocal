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
  Save, RefreshCw, Sprout, Gift, Globe2, ShieldCheck, BookOpen, Circle, type LucideIcon,
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

const CFA_ROLES = ['Guardian','Treasurer','Secretary','Admin','Auditor','Member'];
const COUNTIES  = ['Nairobi','Mombasa','Kisumu','Nakuru','Eldoret','Thika','Meru','Nyeri','Kericho','Kakamega','Machakos','Garissa','Other'];

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
  { label: 'Points and badges', hint: 'Daily points, missions, invites', href: '/mine', Icon: Gift },
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
  const [points, setPoints] = useState<{ total: number; lifetime: number } | null>(null);

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
    try {
      const r = await fetch('/api/airdrop/me', { headers });
      const d = await r.json().catch(() => null);
      if (r.ok && d?.data) setPoints({ total: d.data.totalPoints ?? 0, lifetime: d.data.lifetimePoints ?? d.data.totalPoints ?? 0 });
    } catch { /* points are optional here */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [privy.authenticated]);

  useEffect(() => {
    if (privy.authenticated) { void loadMe(); return; }
    if (effectiveAddress) load(effectiveAddress);
  }, [privy.authenticated, effectiveAddress, load, loadMe]);

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
                  {profile.cfaGroup && <Link href="/nursery" prefetch={false} className="pf-chip pf-chip--green"><Trees size={13} /> {profile.cfaGroup}{profile.cfaRole ? ` · ${profile.cfaRole}` : ''}</Link>}
                  {points && <Link href="/mine" prefetch={false} className="pf-chip"><Gift size={13} /> {LEVELS[levelIdx].name}</Link>}
                </div>
              </div>
              <button className="pf-btn pf-btn--ghost pf-signout" onClick={() => { void signOut(); }}><LogOut size={15} /> Sign out</button>
            </div>
          </header>

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
                  <Field id="pf-phone" label="Phone number">
                    <input id="pf-phone" type="tel" value={profile.phone} onChange={(e) => set('phone')(e.target.value)} placeholder="+254 7XX XXX XXX" autoComplete="tel" />
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
                    <input id="pf-cfaJoinYear" type="number" inputMode="numeric" min={1990} max={2100} value={profile.cfaJoinYear} onChange={(e) => set('cfaJoinYear')(e.target.value)} placeholder="2024" />
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
              {points && (
                <Link href="/mine" prefetch={false} className="pf-points">
                  <span className="pf-label">Your points</span>
                  <b>{points.total.toLocaleString()}</b>
                  <span className="pf-muted">{LEVELS[levelIdx].name}{nextLevel ? ` · ${(nextLevel.from - points.lifetime).toLocaleString()} to ${nextLevel.name}` : ' · top level'}</span>
                  <span className="pf-points-go">Collect today&rsquo;s points <ChevronRight size={14} /></span>
                </Link>
              )}

              <nav className="pf-sec pf-links" aria-label="Go to">
                <h2>Go to</h2>
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

/* Side */
.pf-side .pf-sec:first-child { border-top: 0; padding-top: 0; }
.pf-points { display: flex; flex-direction: column; gap: 4px; padding: 20px; margin-bottom: 8px; border-radius: 18px; text-decoration: none; color: ${C.paper};
  background: linear-gradient(135deg, rgba(200,155,60,.18), rgba(200,155,60,.05)); border: 1px solid rgba(228,200,120,.25); transition: border-color .15s ease; }
.pf-points:hover { border-color: rgba(228,200,120,.5); }
.pf-points b { font-size: 34px; font-weight: 700; line-height: 1.1; }
.pf-points-go { display: inline-flex; align-items: center; gap: 4px; margin-top: 8px; color: ${C.goldLight}; font-size: 13.5px; font-weight: 600; }
.pf-links h2, .pf-side .pf-sec h2 { margin-bottom: 8px; }
.pf-link { display: flex; align-items: center; gap: 12px; padding: 10px 8px; margin: 0 -8px; border-radius: 12px; text-decoration: none; color: ${C.paper}; transition: background-color .15s ease; }
.pf-link:hover { background: rgba(246,242,231,.05); }
.pf-link-icon { width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; background: rgba(228,200,120,.1); color: ${C.goldLight}; flex-shrink: 0; }
.pf-link b { display: block; font-size: 14px; }
.pf-link small { display: block; font-size: 12.5px; color: ${C.inkLight}; margin-top: 1px; }
.pf-link-arrow { margin-left: auto; color: ${C.inkLight}; flex-shrink: 0; }
.pf-account { margin: 4px 0 16px; display: grid; grid-template-columns: auto 1fr; gap: 10px 14px; font-size: 13.5px; }
.pf-account dt { color: ${C.inkLight}; }
.pf-account dd { margin: 0; color: ${C.paperDim}; text-align: right; overflow-wrap: anywhere; }
.pf-copy { display: inline-flex; align-items: center; gap: 6px; background: none; border: 0; padding: 0; color: ${C.paperDim}; font: 500 13px 'Inter', system-ui, sans-serif; cursor: pointer; }
.pf-copy:hover { color: ${C.goldLight}; }

/* Save bar and toast */
.pf-savebar { position: fixed; left: 50%; bottom: 88px; transform: translateX(-50%); z-index: 60; width: min(560px, calc(100% - 24px)); box-sizing: border-box;
  display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 10px 10px 20px; border-radius: 999px;
  background: ${C.band}; border: 1px solid rgba(228,200,120,.3); box-shadow: 0 16px 40px rgba(0,0,0,.4); font-size: 14px; font-weight: 600; }
.pf-savebar > div { display: flex; gap: 4px; }
.pf-toast { position: fixed; left: 50%; bottom: 152px; transform: translateX(-50%); z-index: 70; display: inline-flex; align-items: center; gap: 8px; padding: 11px 20px; border-radius: 999px; background: ${C.band}; border: 1px solid ${C.line}; font-size: 14px; font-weight: 600; white-space: nowrap; }
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
}
`;
