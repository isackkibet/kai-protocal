'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import Link from 'next/link';
import {
  UserCircle2, Trees, Store, Users, Wallet, ChevronRight,
  CheckCircle, AlertCircle, RefreshCw, Copy, LogOut,
  MapPin, Phone, CreditCard, ShieldCheck, Zap,
  TrendingUp, Settings, ExternalLink, Edit3, Save,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────
interface Profile {
  walletAddress: string;
  displayName: string;
  phone: string;
  county: string;
  idNumber: string;
  // CFA
  cfaGroup: string;
  cfaRole: string;
  cfaRegion: string;
  cfaJoinYear: string;
  // SME
  businessName: string;
  businessType: string;
  businessLocation: string;
  annualTurnover: string;
  mpesaNumber: string;
  // Chama
  chamaName: string;
  chamaRole: string;
  chamaRegNo: string;
  monthlyContrib: string;
  // KAI prefs
  riskTolerance: string;
  preferredVault: string;
  notifications: boolean;
  updatedAt?: string;
}

const EMPTY: Profile = {
  walletAddress: '', displayName: '', phone: '', county: '', idNumber: '',
  cfaGroup: '', cfaRole: '', cfaRegion: '', cfaJoinYear: '',
  businessName: '', businessType: '', businessLocation: '', annualTurnover: '', mpesaNumber: '',
  chamaName: '', chamaRole: '', chamaRegNo: '', monthlyContrib: '',
  riskTolerance: 'medium', preferredVault: '', notifications: true,
};

const CFA_ROLES    = ['Guardian', 'Treasurer', 'Secretary', 'Admin', 'Auditor', 'Member'];
const CHAMA_ROLES  = ['Chairperson', 'Treasurer', 'Secretary', 'Member'];
const BIZ_TYPES    = ['Agri Supplies', 'Retail Shop', 'Hardware', 'Pharmacy', 'Textile / Crafts', 'Produce Distributor', 'Tech / Services', 'Food & Beverage', 'Other'];
const COUNTIES     = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Meru', 'Nyeri', 'Kericho', 'Kakamega', 'Machakos', 'Garissa', 'Other'];
const RISK_LEVELS  = [{ v: 'conservative', label: 'Conservative', apy: '7–12%', color: '#22c55e' }, { v: 'medium', label: 'Balanced', apy: '12–18%', color: '#3b82f6' }, { v: 'high', label: 'High Yield', apy: '18–24%', color: '#10b981' }];
const VAULTS       = ['kvyBOB (7.5% APY)', 'kvNVR (15.2% APY)', 'kvYTOKEN (14.8% APY)', 'kvGAMI (22.0% APY)', 'kvYGOLD (12.4% APY)'];

// ── Helpers ───────────────────────────────────────────────────────
function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(248,248,250,0.40)' }}>
        {label}{required && <span style={{ color: '#10b981', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#f8f8fa',
        outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box',
        transition: 'border-color 0.18s',
      }}
      onFocus={e  => (e.target.style.borderColor = 'rgba(16,185,129,0.48)')}
      onBlur={e   => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
    />
  );
}

function Select({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        background: '#111114', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10, padding: '10px 12px', fontSize: 13, color: value ? '#f8f8fa' : 'rgba(248,248,250,0.30)',
        outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box',
        transition: 'border-color 0.18s', appearance: 'none',
        backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23888\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")',
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
      }}
      onFocus={e  => (e.target.style.borderColor = 'rgba(16,185,129,0.48)')}
      onBlur={e   => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
    >
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function SectionCard({ icon, title, subtitle, color, children }: { icon: React.ReactNode; title: string; subtitle: string; color: string; children: React.ReactNode }) {
  return (
    <section style={{
      borderRadius: 20, overflow: 'hidden',
      border: `1px solid ${color}22`,
      background: `linear-gradient(160deg, ${color}07 0%, rgba(10,10,12,0.92) 100%)`,
    }}>
      {/* header */}
      <div style={{
        padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: `1px solid ${color}16`,
        background: `${color}08`,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 13, flexShrink: 0,
          background: `${color}16`, border: `1.5px solid ${color}35`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 14px ${color}20`,
        }}>
          {icon}
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 900, color: '#f8f8fa', margin: 0 }}>{title}</p>
          <p style={{ fontSize: 10, color: 'rgba(248,248,250,0.40)', margin: 0 }}>{subtitle}</p>
        </div>
      </div>
      {/* body */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {children}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const [profile, setProfile] = useState<Profile>({ ...EMPTY });
  const [saved,   setSaved]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [copied,  setCopied]  = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState<'personal' | 'cfa' | 'sme' | 'chama' | 'settings'>('personal');
  const [toast,   setToast]   = useState('');

  // ── Load profile from API ──────────────────────────────────────
  const load = useCallback(async (addr: string) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/profile?wallet=${addr}`);
      const { profile: p } = await r.json();
      if (p) setProfile({ ...EMPTY, ...p });
      else setProfile({ ...EMPTY, walletAddress: addr });
    } catch { setProfile({ ...EMPTY, walletAddress: addr }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (address) load(address);
    else setLoading(false);
  }, [address, load]);

  // ── Mutate helper ──────────────────────────────────────────────
  const set = (key: keyof Profile) => (val: string | boolean) =>
    setProfile(p => ({ ...p, [key]: val }));

  // ── Save ───────────────────────────────────────────────────────
  const save = async () => {
    if (!address) { setToast('Connect wallet first'); return; }
    setSaving(true);
    try {
      const r = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profile, walletAddress: address }),
      });
      if (r.ok) {
        setSaved(true);
        setToast('Profile saved ✓');
        setTimeout(() => { setSaved(false); setToast(''); }, 3000);
      } else { setToast('Save failed — try again'); }
    } catch { setToast('Network error'); }
    finally { setSaving(false); }
  };

  const copyAddr = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  // ── Completion score ───────────────────────────────────────────
  const fields = [
    profile.displayName, profile.phone, profile.county,
    profile.cfaGroup, profile.cfaRole,
    profile.businessName, profile.businessType,
    profile.chamaName, profile.chamaRole,
  ];
  const filled     = fields.filter(Boolean).length;
  const completion = Math.round((filled / fields.length) * 100);

  // ── Tab has data indicator ─────────────────────────────────────
  const hasData: Record<string, boolean> = {
    personal: !!(profile.displayName || profile.phone),
    cfa:      !!(profile.cfaGroup),
    sme:      !!(profile.businessName),
    chama:    !!(profile.chamaName),
    settings: false,
  };

  return (
    <main style={{
      minHeight: '100dvh',
      background: 'radial-gradient(ellipse 80% 50% at 50% -5%, rgba(16,185,129,0.10) 0%, transparent 60%), #08080a',
      color: '#f8f8fa', paddingBottom: 96, fontFamily: 'var(--font-sans)',
    }}>

      {/* ── HERO HEADER ── */}
      <div style={{
        padding: '24px 18px 0',
        borderBottom: '1px solid rgba(16,185,129,0.13)',
        background: 'linear-gradient(180deg, rgba(16,185,129,0.08) 0%, transparent 100%)',
      }}>
        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(16,185,129,0.30) 0%, rgba(124,29,29,0.20) 100%)',
            border: '2px solid rgba(16,185,129,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 24px rgba(16,185,129,0.22)',
            fontSize: 26, fontWeight: 900, color: '#10b981',
          }}>
            {profile.displayName ? profile.displayName.charAt(0).toUpperCase() : <UserCircle2 size={30} color="#10b981" strokeWidth={1.5} />}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 20, fontWeight: 900, margin: '0 0 3px', letterSpacing: -0.5 }}>
              {profile.displayName || 'Your Profile'}
            </h1>
            {isConnected ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }} onClick={copyAddr}>
                <span style={{ fontSize: 10, color: 'rgba(248,248,250,0.38)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                  {address}
                </span>
                {copied ? <CheckCircle size={11} color="#4ade80" /> : <Copy size={11} color="rgba(248,248,250,0.28)" />}
              </div>
            ) : (
              <p style={{ fontSize: 11, color: 'rgba(248,248,250,0.38)', margin: 0 }}>No wallet connected</p>
            )}
          </div>

          <button onClick={save} disabled={saving || !isConnected} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 16px', borderRadius: 12, border: 'none', cursor: isConnected ? 'pointer' : 'not-allowed',
            background: saved ? 'rgba(34,197,94,0.18)' : 'linear-gradient(135deg,#10b981,#059669)',
            color: saved ? '#4ade80' : '#fff', fontSize: 12, fontWeight: 800,
            boxShadow: saved ? '0 0 12px rgba(34,197,94,0.22)' : '0 4px 16px rgba(16,185,129,0.30)',
            transition: 'all 0.2s', opacity: saving ? 0.7 : 1,
          }}>
            {saving ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : saved ? <CheckCircle size={13} /> : <Save size={13} />}
            {saving ? 'Saving…' : saved ? 'Saved' : 'Save'}
          </button>
        </div>

        {/* Connect wallet prompt */}
        {!isConnected && (
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{
              marginBottom: 16, padding: '12px 16px', borderRadius: 14,
              background: 'rgba(16,185,129,0.07)', border: '1px dashed rgba(16,185,129,0.28)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <Wallet size={18} color="#10b981" />
              <p style={{ fontSize: 12, color: 'rgba(248,248,250,0.65)', margin: 0 }}>
                Connect your wallet on the Home page to save your profile on-chain
              </p>
              <ChevronRight size={14} color="#10b981" style={{ marginLeft: 'auto', flexShrink: 0 }} />
            </div>
          </Link>
        )}

        {/* Completion bar */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <p className="label-caps">Profile Completion</p>
            <span style={{ fontSize: 11, fontWeight: 800, color: completion >= 80 ? '#4ade80' : completion >= 40 ? '#f59e0b' : '#10b981' }}>
              {completion}%
            </span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
            <div style={{
              height: '100%', borderRadius: 3, transition: 'width 0.6s ease',
              width: `${completion}%`,
              background: completion >= 80 ? 'linear-gradient(90deg,#22c55e,#4ade80)' : completion >= 40 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#10b981,#f87171)',
              boxShadow: `0 0 8px ${completion >= 80 ? 'rgba(34,197,94,0.35)' : 'rgba(16,185,129,0.35)'}`,
            }} />
          </div>
        </div>

        {/* Membership summary pills */}
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 16 }}>
          {profile.cfaGroup && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8, background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.25)' }}>
              <Trees size={11} color="#10b981" />
              <span style={{ fontSize: 10, color: '#10b981', fontWeight: 700 }}>{profile.cfaGroup}</span>
            </div>
          )}
          {profile.businessName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8, background: 'rgba(59,130,246,0.10)', border: '1px solid rgba(59,130,246,0.25)' }}>
              <Store size={11} color="#3b82f6" />
              <span style={{ fontSize: 10, color: '#3b82f6', fontWeight: 700 }}>{profile.businessName}</span>
            </div>
          )}
          {profile.chamaName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8, background: 'rgba(168,85,247,0.10)', border: '1px solid rgba(168,85,247,0.25)' }}>
              <Users size={11} color="#a855f7" />
              <span style={{ fontSize: 10, color: '#a855f7', fontWeight: 700 }}>{profile.chamaName}</span>
            </div>
          )}
          {!profile.cfaGroup && !profile.businessName && !profile.chamaName && (
            <span style={{ fontSize: 11, color: 'rgba(248,248,250,0.28)', fontStyle: 'italic' }}>No memberships added yet</span>
          )}
        </div>

        {/* Section tabs */}
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 1 }}>
          {([
            { id: 'personal', label: 'Personal',  color: '#10b981' },
            { id: 'cfa',      label: 'CFA Group', color: '#22c55e' },
            { id: 'sme',      label: 'SME',       color: '#3b82f6' },
            { id: 'chama',    label: 'Chama',     color: '#a855f7' },
            { id: 'settings', label: 'KAI Prefs', color: '#f59e0b' },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flexShrink: 0, padding: '7px 14px',
              borderRadius: '10px 10px 0 0', cursor: 'pointer', border: 'none',
              background: tab === t.id ? `${t.color}16` : 'rgba(255,255,255,0.03)',
              borderTop: tab === t.id ? `1.5px solid ${t.color}55` : '1.5px solid transparent',
              color: tab === t.id ? t.color : 'rgba(248,248,250,0.38)',
              fontSize: 11, fontWeight: tab === t.id ? 800 : 600,
              transition: 'all 0.18s', position: 'relative',
            }}>
              {t.label}
              {hasData[t.id] && t.id !== 'settings' && (
                <span style={{
                  position: 'absolute', top: 5, right: 5,
                  width: 5, height: 5, borderRadius: '50%',
                  background: t.color, boxShadow: `0 0 4px ${t.color}`,
                }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── FORM SECTIONS ── */}
      <div style={{ padding: '20px 18px 0' }}>

        {/* ── PERSONAL ── */}
        {tab === 'personal' && (
          <SectionCard
            icon={<UserCircle2 size={20} color="#10b981" strokeWidth={1.8} />}
            title="Personal Information"
            subtitle="Your identity on KAI Nuvari"
            color="#10b981"
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <Field label="Display Name" required>
                  <Input value={profile.displayName} onChange={set('displayName')} placeholder="e.g. Grace Wangari" />
                </Field>
              </div>
              <Field label="Phone Number">
                <Input value={profile.phone} onChange={set('phone')} placeholder="+254 7…" type="tel" />
              </Field>
              <Field label="National ID / Passport">
                <Input value={profile.idNumber} onChange={set('idNumber')} placeholder="ID number" />
              </Field>
              <div style={{ gridColumn: '1 / -1' }}>
                <Field label="County / Region">
                  <Select value={profile.county} onChange={set('county')} options={COUNTIES} placeholder="Select county…" />
                </Field>
              </div>
            </div>

            {/* Wallet display */}
            {isConnected && (
              <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="label-caps" style={{ marginBottom: 6 }}>Linked Wallet</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Wallet size={14} color="#10b981" />
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'rgba(248,248,250,0.60)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {address}
                  </span>
                  <a href={`https://testnet.snowtrace.io/address/${address}`} target="_blank" rel="noreferrer" style={{ color: '#10b981', display: 'flex' }}>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            )}

            {/* Disconnect */}
            {isConnected && (
              <button onClick={() => disconnect()} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
                background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.20)',
                color: '#f87171', fontSize: 12, fontWeight: 700, width: '100%',
              }}>
                <LogOut size={14} /> Disconnect Wallet
              </button>
            )}
          </SectionCard>
        )}

        {/* ── CFA GROUP ── */}
        {tab === 'cfa' && (
          <SectionCard
            icon={<Trees size={20} color="#22c55e" strokeWidth={1.8} />}
            title="CFA Group Membership"
            subtitle="Community Forest Association you belong to"
            color="#22c55e"
          >
            {/* Info banner */}
            <div style={{ padding: '11px 14px', borderRadius: 12, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.18)', fontSize: 11, color: 'rgba(248,248,250,0.58)', lineHeight: 1.55 }}>
              CFAs are community groups managing forests on Avalanche. Your membership unlocks access to forest product yield vaults (6–16% APY), governance voting, and carbon credit rewards.
            </div>

            <Field label="CFA Group Name" required>
              <Input value={profile.cfaGroup} onChange={set('cfaGroup')} placeholder="e.g. Mau Forest Guardians Group A" />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Your Role">
                <Select value={profile.cfaRole} onChange={set('cfaRole')} options={CFA_ROLES} placeholder="Select role…" />
              </Field>
              <Field label="Join Year">
                <Input value={profile.cfaJoinYear} onChange={set('cfaJoinYear')} placeholder="2022" type="number" />
              </Field>
            </div>

            <Field label="Forest Region / County">
              <Input value={profile.cfaRegion} onChange={set('cfaRegion')} placeholder="e.g. Rift Valley — Mau Complex" />
            </Field>

            {/* Quick links if already filled */}
            {profile.cfaGroup && (
              <Link href="/cfa" style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 14,
                  background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.22)', cursor: 'pointer',
                }}>
                  <Trees size={18} color="#22c55e" />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: '#f8f8fa', margin: 0 }}>{profile.cfaGroup}</p>
                    <p style={{ fontSize: 10, color: 'rgba(248,248,250,0.40)', margin: 0 }}>{profile.cfaRole || 'Member'} · {profile.cfaRegion || 'Kenya'}</p>
                  </div>
                  <ChevronRight size={14} color="#22c55e" />
                </div>
              </Link>
            )}

            {/* Linked products */}
            <div>
              <p className="label-caps" style={{ marginBottom: 10 }}>Linked Forest Products</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { emoji: '🍯', name: 'Honey Reserve',   apy: '14.0%', token: 'GAMI'  },
                  { emoji: '🌿', name: 'Med. Herbs',       apy: '16.0%', token: 'GAMI'  },
                  { emoji: '🌱', name: 'Seed Bank',        apy: '6.5%',  token: 'NVR'   },
                  { emoji: '💧', name: 'Water Rights',     apy: '5.8%',  token: 'yBOB'  },
                ].map(p => (
                  <div key={p.name} style={{ borderRadius: 12, padding: '11px 12px', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.12)' }}>
                    <span style={{ fontSize: 18, display: 'block', marginBottom: 5 }}>{p.emoji}</span>
                    <p style={{ fontSize: 11, fontWeight: 800, color: '#f8f8fa', margin: '0 0 2px' }}>{p.name}</p>
                    <p style={{ fontSize: 11, fontWeight: 900, color: '#4ade80', margin: 0 }}>{p.apy}</p>
                    <p style={{ fontSize: 9, color: 'rgba(248,248,250,0.35)', margin: 0 }}>{p.token}</p>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        )}

        {/* ── SME ── */}
        {tab === 'sme' && (
          <SectionCard
            icon={<Store size={20} color="#3b82f6" strokeWidth={1.8} />}
            title="SME Business Profile"
            subtitle="Your micro or small enterprise details"
            color="#3b82f6"
          >
            <div style={{ padding: '11px 14px', borderRadius: 12, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.18)', fontSize: 11, color: 'rgba(248,248,250,0.58)', lineHeight: 1.55 }}>
              SME profiles unlock working capital loans (up to KES 50K), inventory finance, yBOB merchant accounts, and revenue-based tokenisation on Avalanche.
            </div>

            <Field label="Business Name" required>
              <Input value={profile.businessName} onChange={set('businessName')} placeholder="e.g. Kipkelion Farm Supplies" />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Business Type">
                <Select value={profile.businessType} onChange={set('businessType')} options={BIZ_TYPES} placeholder="Select type…" />
              </Field>
              <Field label="Annual Turnover (KES)">
                <Input value={profile.annualTurnover} onChange={set('annualTurnover')} placeholder="e.g. 500000" type="number" />
              </Field>
            </div>

            <Field label="Business Location">
              <Input value={profile.businessLocation} onChange={set('businessLocation')} placeholder="e.g. Kipkelion, Kericho County" />
            </Field>

            <Field label="M-Pesa Till / Paybill Number">
              <Input value={profile.mpesaNumber} onChange={set('mpesaNumber')} placeholder="e.g. 4056789" />
            </Field>

            {/* Quick link if filled */}
            {profile.businessName && (
              <Link href="/sme" style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 14,
                  background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.22)', cursor: 'pointer',
                }}>
                  <Store size={18} color="#3b82f6" />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: '#f8f8fa', margin: 0 }}>{profile.businessName}</p>
                    <p style={{ fontSize: 10, color: 'rgba(248,248,250,0.40)', margin: 0 }}>
                      {profile.businessType || 'Business'} · {profile.businessLocation || 'Kenya'}
                    </p>
                  </div>
                  <ChevronRight size={14} color="#3b82f6" />
                </div>
              </Link>
            )}

            {/* Financial products preview */}
            <div>
              <p className="label-caps" style={{ marginBottom: 10 }}>Available Financial Products</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {[
                  { icon: '🏦', name: 'Working Capital Loan',  rate: '8% p.a.',  color: '#22c55e' },
                  { icon: '📦', name: 'Inventory Finance',     rate: '6% p.a.',  color: '#3b82f6' },
                  { icon: '🪙', name: 'Merchant yBOB Account', rate: '7.5% APY', color: '#a855f7' },
                ].map(p => (
                  <div key={p.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <span style={{ fontSize: 18 }}>{p.icon}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#f8f8fa' }}>{p.name}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 900, color: p.color }}>{p.rate}</span>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        )}

        {/* ── CHAMA ── */}
        {tab === 'chama' && (
          <SectionCard
            icon={<Users size={20} color="#a855f7" strokeWidth={1.8} />}
            title="Saving Group (Chama)"
            subtitle="Your chama or SACCO membership"
            color="#a855f7"
          >
            <div style={{ padding: '11px 14px', borderRadius: 12, background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.18)', fontSize: 11, color: 'rgba(248,248,250,0.58)', lineHeight: 1.55 }}>
              Chama members pool monthly contributions that KAI auto-routes to the highest-yield vault strategy. Current best: <span style={{ color: '#c084fc', fontWeight: 700 }}>22% APY via GAMI vault</span>.
            </div>

            <Field label="Chama / SACCO Name" required>
              <Input value={profile.chamaName} onChange={set('chamaName')} placeholder="e.g. Mwanzo Mpya Women Savings Chama" />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Your Role">
                <Select value={profile.chamaRole} onChange={set('chamaRole')} options={CHAMA_ROLES} placeholder="Select role…" />
              </Field>
              <Field label="Monthly Contribution (KES)">
                <Input value={profile.monthlyContrib} onChange={set('monthlyContrib')} placeholder="e.g. 2000" type="number" />
              </Field>
            </div>

            <Field label="Registration Number (optional)">
              <Input value={profile.chamaRegNo} onChange={set('chamaRegNo')} placeholder="e.g. SS/NGO/2021/4821" />
            </Field>

            {/* Quick link if filled */}
            {profile.chamaName && (
              <Link href="/saving" style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 14,
                  background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.22)', cursor: 'pointer',
                }}>
                  <Users size={18} color="#a855f7" />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: '#f8f8fa', margin: 0 }}>{profile.chamaName}</p>
                    <p style={{ fontSize: 10, color: 'rgba(248,248,250,0.40)', margin: 0 }}>
                      {profile.chamaRole || 'Member'} · KES {profile.monthlyContrib || '—'} / month
                      {profile.chamaRegNo && ` · ${profile.chamaRegNo}`}
                    </p>
                  </div>
                  <ChevronRight size={14} color="#a855f7" />
                </div>
              </Link>
            )}

            {/* Vault strategies */}
            <div>
              <p className="label-caps" style={{ marginBottom: 10 }}>Vault Strategies for Your Chama</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {[
                  { name: 'Conservative KES', apy: '12%', risk: 'Very Low', color: '#22c55e' },
                  { name: 'Balanced yBOB',    apy: '18%', risk: 'Low',      color: '#3b82f6' },
                  { name: 'High Yield AVAX',  apy: '24%', risk: 'Medium',   color: '#10b981' },
                ].map(v => (
                  <div key={v.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, background: `${v.color}06`, border: `1px solid ${v.color}18` }}>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 800, color: '#f8f8fa', margin: '0 0 2px' }}>{v.name}</p>
                      <p style={{ fontSize: 10, color: 'rgba(248,248,250,0.38)', margin: 0 }}>Risk: {v.risk}</p>
                    </div>
                    <p style={{ fontSize: 20, fontWeight: 900, color: v.color, margin: 0, letterSpacing: -0.5 }}>{v.apy}</p>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        )}

        {/* ── KAI SETTINGS ── */}
        {tab === 'settings' && (
          <SectionCard
            icon={<Settings size={20} color="#f59e0b" strokeWidth={1.8} />}
            title="KAI Ecosystem Preferences"
            subtitle="Personalise your DeFi experience"
            color="#f59e0b"
          >
            {/* Risk tolerance */}
            <div>
              <p className="label-caps" style={{ marginBottom: 12 }}>Risk Tolerance</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {RISK_LEVELS.map(r => (
                  <button key={r.v} onClick={() => set('riskTolerance')(r.v)} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '13px 15px', borderRadius: 14, cursor: 'pointer', border: 'none',
                    background: profile.riskTolerance === r.v ? `${r.color}14` : 'rgba(255,255,255,0.03)',
                    outline: `1.5px solid ${profile.riskTolerance === r.v ? r.color + '45' : 'transparent'}`,
                    transition: 'all 0.18s',
                  }}>
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ fontSize: 13, fontWeight: 800, color: '#f8f8fa', margin: '0 0 2px' }}>{r.label}</p>
                      <p style={{ fontSize: 10, color: 'rgba(248,248,250,0.40)', margin: 0 }}>Expected yield: {r.apy}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 900, color: r.color }}>{r.apy}</span>
                      {profile.riskTolerance === r.v && <CheckCircle size={16} color={r.color} />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Preferred vault */}
            <Field label="Preferred Vault">
              <Select value={profile.preferredVault} onChange={set('preferredVault')} options={VAULTS} placeholder="Choose vault…" />
            </Field>

            {/* Notifications toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 15px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#f8f8fa', margin: '0 0 2px' }}>Notifications</p>
                <p style={{ fontSize: 10, color: 'rgba(248,248,250,0.40)', margin: 0 }}>Yield payouts, DAO votes, patrol alerts</p>
              </div>
              <button onClick={() => set('notifications')(!profile.notifications)} style={{
                width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', padding: 0,
                background: profile.notifications ? 'linear-gradient(135deg,#10b981,#059669)' : 'rgba(255,255,255,0.10)',
                transition: 'background 0.2s', position: 'relative',
              }}>
                <span style={{
                  position: 'absolute', top: 3,
                  left: profile.notifications ? 25 : 3,
                  width: 20, height: 20, borderRadius: '50%',
                  background: '#fff', transition: 'left 0.2s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                }} />
              </button>
            </div>

            {/* Quick links grid */}
            <div>
              <p className="label-caps" style={{ marginBottom: 10 }}>Quick Access</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                {[
                  { label: 'CFA Dashboard',    href: '/cfa',      icon: <Trees size={16} color="#22c55e" />,   color: '#22c55e' },
                  { label: 'SME Dashboard',    href: '/sme',      icon: <Store size={16} color="#3b82f6" />,   color: '#3b82f6' },
                  { label: 'Saving Group',     href: '/saving',   icon: <Users size={16} color="#a855f7" />,   color: '#a855f7' },
                  { label: 'TaaS Engine',      href: '/taas',     icon: <Zap size={16} color="#8b5cf6" />,     color: '#8b5cf6' },
                  { label: 'Pools',            href: '/pools',    icon: <TrendingUp size={16} color="#22c55e" />, color: '#22c55e' },
                  { label: 'Policy Engine',    href: '/nuvari',   icon: <ShieldCheck size={16} color="#10b981" />, color: '#10b981' },
                ].map(l => (
                  <Link key={l.label} href={l.href} style={{ textDecoration: 'none' }}>
                    <div className="glass" style={{ borderRadius: 12, padding: '12px 12px', display: 'flex', alignItems: 'center', gap: 9, borderColor: `${l.color}20`, background: `linear-gradient(90deg,${l.color}07 0%,rgba(10,10,12,0.85) 100%)` }}>
                      {l.icon}
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#f8f8fa' }}>{l.label}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Last saved */}
            {profile.updatedAt && (
              <p style={{ fontSize: 10, color: 'rgba(248,248,250,0.25)', textAlign: 'center', margin: 0 }}>
                Last saved: {new Date(profile.updatedAt).toLocaleString('en-KE')}
              </p>
            )}
          </SectionCard>
        )}

        {/* Bottom save button */}
        <button onClick={save} disabled={saving || !isConnected} style={{
          marginTop: 20, width: '100%', padding: '14px 0', borderRadius: 16, border: 'none',
          cursor: isConnected ? 'pointer' : 'not-allowed',
          background: saved
            ? 'rgba(34,197,94,0.16)'
            : 'linear-gradient(135deg,#34d399 0%,#10b981 50%,#059669 100%)',
          color: saved ? '#4ade80' : '#fff', fontSize: 14, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: saved ? 'none' : '0 4px 20px rgba(16,185,129,0.28)',
          transition: 'all 0.2s', opacity: saving || !isConnected ? 0.55 : 1,
        }}>
          {saving ? <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving profile…</>
           : saved  ? <><CheckCircle size={16} /> Profile Saved</>
           : <><Save size={16} /> Save Profile</>}
        </button>
      </div>

      {/* ── TOAST ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
          padding: '10px 20px', borderRadius: 99, zIndex: 100, whiteSpace: 'nowrap',
          background: toast.includes('✓') ? 'rgba(34,197,94,0.20)' : 'rgba(16,185,129,0.20)',
          border: `1px solid ${toast.includes('✓') ? 'rgba(34,197,94,0.40)' : 'rgba(16,185,129,0.40)'}`,
          color: toast.includes('✓') ? '#4ade80' : '#f87171',
          fontSize: 12, fontWeight: 700, backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.40)',
        }}>
          {toast}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
