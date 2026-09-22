'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useDisconnect, useSignMessage } from 'wagmi';
import { buildOwnershipChallenge } from '@/lib/wallet-signature';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trees, Store, Users, Wallet, ChevronRight,
  CheckCircle, RefreshCw, Copy, LogOut,
  ExternalLink, Save, MapPin, Phone, Edit3,
  Award, BarChart3, Settings,
} from 'lucide-react';

interface Profile {
  walletAddress:string; displayName:string; phone:string;
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

const CFA_ROLES   = ['Guardian','Treasurer','Secretary','Admin','Auditor','Member'];
const CHAMA_ROLES = ['Chairperson','Treasurer','Secretary','Member'];
const BIZ_TYPES   = ['Agri Supplies','Retail Shop','Hardware','Pharmacy','Textile / Crafts','Produce Distributor','Tech / Services','Food & Beverage','Other'];
const COUNTIES    = ['Nairobi','Mombasa','Kisumu','Nakuru','Eldoret','Thika','Meru','Nyeri','Kericho','Kakamega','Machakos','Garissa','Other'];
const RISK_LEVELS = [
  { v:'conservative', label:'Conservative', apy:'7–12%',  color:'#7DC383' },
  { v:'medium',       label:'Balanced',     apy:'12–18%', color:'#6FA8DC' },
  { v:'high',         label:'High Yield',   apy:'18–24%', color:'#E4C878' },
];
const VAULTS = ['kvyBOB (7.5% APY)','kvNVR (15.2% APY)','kvYTOKEN (14.8% APY)','kvGAMI (22.0% APY)','kvYGOLD (12.4% APY)'];

/* Same editorial system as the rest of the app — pine + gold + paper,
   flat sections separated by a hairline, no card shells. This page used
   to be its own neon-glow "glass" design (glowing gradient boxes around
   every input, glowing stat cards); a real profile — Facebook, LinkedIn —
   doesn't box every field, it just lays content out clearly. */
const C = {
  bg:        '#0B1C14',
  gold:      '#C89B3C',
  goldLight: '#E4C878',
  paper:     '#F6F2E7',
  paperDim:  '#EFE9D9',
  ink:       '#1B1A14',
  inkLight:  '#9BA396',
  hairline:  'rgba(200,155,60,0.14)',
  red:       '#E88C7D',
};
const MONO: React.CSSProperties = { fontFamily: 'var(--font-plex-mono), monospace' };
const SERIF: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const label: React.CSSProperties = { ...MONO, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: C.goldLight, fontWeight: 600, margin: 0 };

/* Flat inputs — bottom border only, same language as every other form in
   the app (wallet Send, the AI textarea). No glow, no filled box. */
function KInput({ value, onChange, placeholder, type='text', big=false }:{
  value:string; onChange:(v:string)=>void; placeholder?:string; type?:string; big?:boolean;
}) {
  return (
    <input type={type} value={value} onChange={e=>onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        background: 'none', border: 'none', borderBottom: `1px solid ${C.hairline}`, borderRadius: 0,
        padding: big ? '10px 2px' : '8px 2px',
        fontSize: big ? 17 : 14,
        color: C.paper, outline: 'none', fontFamily: 'inherit', width: '100%',
        boxSizing: 'border-box', transition: 'border-color 0.15s ease',
      }}
      onFocus={e => (e.target.style.borderColor = C.gold)}
      onBlur={e => (e.target.style.borderColor = C.hairline)}
    />
  );
}

function KSelect({ value, onChange, options, placeholder }:{
  value:string; onChange:(v:string)=>void; options:string[]; placeholder?:string;
}) {
  return (
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{
        background: 'none', border: 'none', borderBottom: `1px solid ${C.hairline}`, borderRadius: 0,
        padding: '8px 2px', fontSize: 14, color: value ? C.paper : C.inkLight,
        outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box',
        appearance: 'none', cursor: 'pointer',
        backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%239BA396\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")',
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 2px center',
      }}>
      {placeholder && <option value="" disabled style={{ background: C.bg }}>{placeholder}</option>}
      {options.map(o => <option key={o} value={o} style={{ background: C.bg }}>{o}</option>)}
    </select>
  );
}

function FormRow({ label: rowLabel, children }:{ label:string; children:React.ReactNode }) {
  const required = rowLabel.trim().endsWith('*');
  const text = required ? rowLabel.trim().slice(0, -1).trim() : rowLabel;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <span style={{ ...MONO, fontSize:10, fontWeight:600, letterSpacing:1.0, textTransform:'uppercase', color: C.inkLight }}>
        {text}
        {required && <span style={{ color: C.goldLight, marginLeft:4 }}>*</span>}
      </span>
      {children}
    </div>
  );
}

/* Flat stat row for the highlight grids (forest products, financial
   products, vault strategies) — a label + a number, colour-coded per item
   like the wallet asset list, divided by hairlines instead of boxed. */
function StatCell({ name, value, sub, color }:{ name:string; value:string; sub?:string; color:string }) {
  return (
    <div style={{ textAlign: 'center', padding: '0 8px' }}>
      <p style={{ fontSize: 12.5, fontWeight: 600, color: C.paperDim, margin: '0 0 4px' }}>{name}</p>
      {sub && <p style={{ fontSize: 11, color: C.inkLight, margin: '0 0 8px' }}>{sub}</p>}
      <p style={{ ...SERIF, fontSize: 22, fontWeight: 600, color, margin: 0 }}>{value}</p>
    </div>
  );
}

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const [profile, setProfile] = useState<Profile>({ ...EMPTY });
  const [saved,   setSaved]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [copied,  setCopied]  = useState(false);
  const [tab,     setTab]     = useState<'personal'|'cfa'|'sme'|'chama'|'prefs'>('personal');
  const [toast,   setToast]   = useState('');
  const [editing, setEditing] = useState(false);

  const load = useCallback(async (addr:string) => {
    try {
      const timestamp = Date.now();
      const signature = await signMessageAsync({ message: buildOwnershipChallenge(addr, timestamp) });
      const r = await fetch(`/api/profile?wallet=${addr}&signature=${encodeURIComponent(signature)}&timestamp=${timestamp}`);
      const { profile:p } = await r.json();
      setProfile(p ? { ...EMPTY, ...p } : { ...EMPTY, walletAddress:addr });
    } catch { setProfile({ ...EMPTY, walletAddress:addr }); }
  }, [signMessageAsync]);

  useEffect(() => { if (address) load(address); }, [address, load]);

  const set = (k:keyof Profile) => (v:string|boolean) =>
    setProfile(p=>({ ...p, [k]:v }));

  const save = async () => {
    if (!address) { setToast('Connect wallet first'); return; }
    setSaving(true);
    try {
      const timestamp = Date.now();
      const signature = await signMessageAsync({ message: buildOwnershipChallenge(address, timestamp) });
      const r = await fetch('/api/profile', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ ...profile, walletAddress:address, signature, timestamp }),
      });
      if (r.ok) {
        setSaved(true); setToast('Profile saved'); setEditing(false);
        setTimeout(()=>{ setSaved(false); setToast(''); }, 3000);
      } else setToast('Save failed. Try again');
    } catch { setToast('Network error'); }
    finally { setSaving(false); }
  };

  const copyAddr = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true); setTimeout(()=>setCopied(false), 1600);
  };

  const fields   = [profile.displayName,profile.phone,profile.county,profile.cfaGroup,profile.cfaRole,profile.businessName,profile.businessType,profile.chamaName,profile.chamaRole];
  const complete = Math.round(fields.filter(Boolean).length / fields.length * 100);
  const initials = profile.displayName
    ? profile.displayName.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)
    : 'KN';

  const TABS = [
    { id:'personal', label:'Personal',  color: C.goldLight, Icon:Award    },
    { id:'cfa',      label:'CFA Group', color: '#7DC383',   Icon:Trees    },
    { id:'sme',      label:'Business',  color: '#6FA8DC',   Icon:Store    },
    { id:'chama',    label:'Chama',     color: '#C48FE0',   Icon:Users    },
    { id:'prefs',    label:'KAI Prefs', color: C.gold,      Icon:Settings },
  ] as const;

  return (
    <main style={{ minHeight:'100dvh', background: C.bg, color: C.paper, fontFamily: "'Poppins', 'IBM Plex Sans', var(--font-sans)", paddingBottom:100, position:'relative' }}>
      <style>{`
        /* min-width: 0 on the grid items — without it, the mobile tab row's
           non-shrinking horizontal-scroll buttons drag the whole grid track
           (and the page) wider than the viewport instead of scrolling
           within it, the same CSS Grid + horizontal-scroll-child overflow
           the home page's Quick Actions strip hit. */
        .profile-main-grid > div { min-width: 0; }
        .profile-tabbar { scrollbar-width: none; }
        .profile-tabbar::-webkit-scrollbar { display: none; }
        @media (max-width: 760px) {
          .profile-container { padding: 0 20px !important; }
          .profile-hero-row { flex-direction: column !important; align-items: center !important; text-align: center !important; gap: 16px !important; }
          .profile-main-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
          .profile-2col, .profile-3col, .profile-4col { grid-template-columns: 1fr 1fr !important; gap: 24px !important; }
        }
        @media (max-width: 480px) {
          .profile-2col, .profile-3col, .profile-4col { grid-template-columns: 1fr !important; }
        }
        .profile-quicklink:hover .profile-quicklink-title { color: ${C.goldLight}; }
      `}</style>

      {/* Cover banner — flat pine gradient, no glowing orbs or stripe
          textures. A real profile cover is a simple backdrop, not a light show. */}
      <div style={{ position:'relative', height:180, overflow:'hidden', borderBottom: `1px solid ${C.hairline}` }}>
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg, #123526 0%, #0B1C14 100%)' }}/>
      </div>

      {/* IDENTITY HERO — avatar + name */}
      <div className="profile-container" style={{ maxWidth:1120, margin:'0 auto', padding:'0 24px', position:'relative' }}>
        <div className="profile-hero-row" style={{ marginTop:-64, display:'flex', alignItems:'flex-end', gap:28 }}>

          {/* Avatar */}
          <div style={{ flexShrink:0, position:'relative' }}>
            <div style={{
              width:116, height:116, borderRadius:'50%', background: C.gold, border: `4px solid ${C.bg}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              ...SERIF, fontSize:40, fontWeight:600, color: C.ink,
            }}>
              {initials}
            </div>
            {isConnected && (
              <span style={{ position:'absolute', bottom:6, right:4, width:18, height:18, borderRadius:'50%', background: C.goldLight, border:`3px solid ${C.bg}` }}/>
            )}
          </div>

          {/* Name + meta */}
          <div style={{ flex:1, paddingBottom:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8, flexWrap: 'wrap' }}>
              <h1 style={{ ...SERIF, fontSize:'clamp(24px,3vw,34px)', fontWeight:700, margin:0, letterSpacing:'-0.5px', color: C.paper }}>
                {profile.displayName || <span style={{ color: C.inkLight }}>Your Name</span>}
              </h1>
              {isConnected && (
                <span style={{ ...MONO, padding:'4px 12px', borderRadius:999, border: `1px solid ${C.hairline}`, fontSize:10, fontWeight:600, letterSpacing: 0.6, color: C.goldLight, flexShrink:0 }}>
                  KAI MEMBER
                </span>
              )}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
              {profile.county && (
                <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:13.5, color: C.paperDim }}>
                  <MapPin size={14} color={C.goldLight}/> {profile.county}, Kenya
                </span>
              )}
              {profile.phone && (
                <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:13.5, color: C.paperDim }}>
                  <Phone size={14} color={C.goldLight}/> {profile.phone}
                </span>
              )}
              {isConnected && (
                <button onClick={copyAddr} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', fontSize:12.5, color: C.inkLight, fontFamily: 'var(--font-plex-mono), monospace', padding:0 }}>
                  {address?.slice(0,10)}...{address?.slice(-6)}
                  {copied ? <CheckCircle size={12} color={C.goldLight}/> : <Copy size={12}/>}
                </button>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display:'flex', gap:10, paddingBottom:12, flexShrink:0 }}>
            <button onClick={()=>setEditing(v=>!v)}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 20px', borderRadius:999, border: `1px solid ${C.hairline}`, cursor:'pointer', background:'none', color: C.paperDim, fontSize:13, fontWeight:700, fontFamily: 'inherit' }}>
              <Edit3 size={15}/> {editing ? 'Cancel' : 'Edit Profile'}
            </button>
            <button onClick={save} disabled={saving||!isConnected}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 22px', borderRadius:999, border:'none', cursor:isConnected?'pointer':'not-allowed', background: saved ? 'rgba(200,155,60,0.18)' : C.gold, color: saved ? C.goldLight : C.ink, fontSize:13, fontWeight:700, fontFamily: 'inherit', opacity: isConnected ? 1 : 0.5 }}>
              {saving?<RefreshCw size={15} style={{animation:'spin 1s linear infinite'}}/>:saved?<CheckCircle size={15}/>:<Save size={15}/>}
              {saving?'Saving':saved?'Saved':'Save Profile'}
            </button>
          </div>
        </div>

        {/* completion bar */}
        <div style={{ marginTop:24, display:'flex', alignItems:'center', gap:16 }}>
          <span style={label}>Profile {complete}%</span>
          <div style={{ flex:1, height:3, borderRadius:2, background: C.hairline }}>
            <motion.div initial={{ width:0 }} animate={{ width:`${complete}%` }} transition={{ duration:1, ease:'easeOut' }}
              style={{ height:'100%', borderRadius:2, background: C.gold }}/>
          </div>
        </div>

        {/* membership tags */}
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:18 }}>
          {profile.cfaGroup && (
            <Link href="/cfa" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:7, padding:'6px 14px', borderRadius:999, border: '1px solid rgba(125,195,131,0.35)' }}>
              <Trees size={13} color="#7DC383"/>
              <span style={{ fontSize:12.5, fontWeight:700, color:'#7DC383' }}>{profile.cfaGroup}</span>
            </Link>
          )}
          {profile.businessName && (
            <Link href="/sme" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:7, padding:'6px 14px', borderRadius:999, border: '1px solid rgba(111,168,220,0.35)' }}>
              <Store size={13} color="#6FA8DC"/>
              <span style={{ fontSize:12.5, fontWeight:700, color:'#6FA8DC' }}>{profile.businessName}</span>
            </Link>
          )}
          {profile.chamaName && (
            <Link href="/saving" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:7, padding:'6px 14px', borderRadius:999, border: '1px solid rgba(196,143,224,0.35)' }}>
              <Users size={13} color="#C48FE0"/>
              <span style={{ fontSize:12.5, fontWeight:700, color:'#C48FE0' }}>{profile.chamaName}</span>
            </Link>
          )}
          {!profile.cfaGroup && !profile.businessName && !profile.chamaName && (
            <span style={{ fontSize:13, color: C.inkLight, fontStyle:'italic' }}>
              No memberships yet. Fill in the tabs below to add them
            </span>
          )}
        </div>

        {/* Horizontal tab bar — the way a real profile (Facebook, LinkedIn)
            switches between About/Posts/Photos: a row of tabs under the
            identity block, not a settings-style sidebar list. */}
        <div className="profile-tabbar" style={{ marginTop:32, display:'flex', gap:28, borderBottom: `1px solid ${C.hairline}`, overflowX:'auto' }}>
          {TABS.map((t) => (
            <button key={t.id}
              onClick={()=>setTab(t.id)}
              style={{
                display:'flex', alignItems:'center', gap:8, padding:'14px 2px',
                border:'none', cursor:'pointer', background: 'none', flexShrink:0,
                color: tab===t.id ? t.color : C.inkLight,
                borderBottom: tab===t.id ? `2px solid ${t.color}` : '2px solid transparent',
                marginBottom:-1,
                fontSize:14, fontWeight: tab===t.id ? 700 : 500, fontFamily: 'inherit',
              }}>
              <t.Icon size={16}/>
              {t.label}
            </button>
          ))}
        </div>

        {/* MAIN BODY: About sidebar + active tab content — the same split
            Facebook uses (Intro/details on the left, the selected view's
            content on the right), instead of a form buried under settings
            nav. */}
        <div className="profile-main-grid" style={{ marginTop:32, display:'grid', gridTemplateColumns:'240px 1fr', gap:48 }}>

          {/* LEFT: About panel */}
          <div className="profile-about">
            <p style={{ ...label, margin: '0 0 14px' }}>About</p>

            {isConnected ? (
              <div style={{ paddingBottom:20, borderBottom: `1px solid ${C.hairline}`, marginBottom:20 }}>
                <p style={{ fontSize:11.5, color: C.inkLight, margin: '0 0 10px' }}>Linked Wallet</p>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                  <Wallet size={14} color={C.goldLight}/>
                  <span style={{ ...MONO, fontSize:11, color: C.inkLight, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {address}
                  </span>
                  <button onClick={copyAddr} style={{ background:'none', border:'none', cursor:'pointer', color: C.inkLight, padding:0, display:'flex' }}>
                    {copied?<CheckCircle size={12} color={C.goldLight}/>:<Copy size={12}/>}
                  </button>
                  <a href={`https://testnet.snowtrace.io/address/${address}`} target="_blank" rel="noreferrer" style={{ color: C.goldLight, display:'flex' }}>
                    <ExternalLink size={12}/>
                  </a>
                </div>
                <button onClick={()=>disconnect()} style={{ display:'flex', alignItems:'center', gap:7, padding:0, border:'none', background:'none', cursor:'pointer', color: C.red, fontSize:12.5, fontWeight:600, fontFamily:'inherit' }}>
                  <LogOut size={13}/> Disconnect Wallet
                </button>
              </div>
            ) : (
              <div style={{ paddingBottom:20, borderBottom: `1px solid ${C.hairline}`, marginBottom:20 }}>
                <Link href="/" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:9, color: C.paperDim, fontSize:13.5 }}>
                  <Wallet size={14} color={C.goldLight}/> Connect wallet
                  <ChevronRight size={13} color={C.goldLight} style={{ marginLeft:'auto' }}/>
                </Link>
              </div>
            )}

            {/* quick links */}
            <div>
              <p style={{ fontSize:11.5, color: C.inkLight, margin: '0 0 12px' }}>Quick Access</p>
              {[
                { label:'CFA Dashboard',  href:'/cfa',     Icon:Trees     },
                { label:'SME Dashboard',  href:'/sme',     Icon:Store     },
                { label:'Saving Group',   href:'/saving',  Icon:Users     },
                { label:'Kai Bar',        href:'/kai-bar', Icon:Award     },
                { label:'Pools',          href:'/pools',   Icon:BarChart3 },
              ].map(l => (
                <Link key={l.label} href={l.href} className="profile-quicklink" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:10, padding:'7px 0' }}>
                  <l.Icon size={15} color={C.goldLight}/>
                  <span className="profile-quicklink-title" style={{ fontSize:13, fontWeight:600, color: C.paperDim, transition: 'color 0.15s ease' }}>{l.label}</span>
                  <ChevronRight size={12} color={C.inkLight} style={{ marginLeft:'auto' }}/>
                </Link>
              ))}
            </div>
          </div>

          {/* RIGHT: active tab's content */}
          <div>
            <AnimatePresence mode="wait">
              <motion.div key={tab}
                initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
                transition={{ duration:0.18 }}>

                {/* Section heading */}
                <div style={{ marginBottom:32 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:11, marginBottom:8 }}>
                    {(() => { const t=TABS.find(x=>x.id===tab)!; return <t.Icon size={19} color={t.color} style={{ flexShrink:0 }}/>; })()}
                    <h2 style={{ ...SERIF, fontSize:22, fontWeight:600, margin:0, letterSpacing:'-0.3px', color: C.paper }}>
                      {tab==='personal' && <>Personal <span style={{color:C.goldLight}}>Information</span></>}
                      {tab==='cfa'      && <>CFA <span style={{color:'#7DC383'}}>Group Membership</span></>}
                      {tab==='sme'      && <>Business <span style={{color:'#6FA8DC'}}>Profile</span></>}
                      {tab==='chama'    && <>Chama <span style={{color:'#C48FE0'}}>Membership</span></>}
                      {tab==='prefs'    && <>KAI <span style={{color:C.gold}}>Ecosystem Preferences</span></>}
                    </h2>
                    {editing && (
                      <span style={{ marginLeft:'auto', ...MONO, fontSize:10, fontWeight:700, color: C.goldLight, flexShrink:0 }}>
                        EDITING
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize:14, color: C.inkLight, margin:0, lineHeight:1.6 }}>
                    {tab==='personal' && 'Your core identity on KAI Nuvari'}
                    {tab==='cfa'      && 'Membership unlocks forest yield vaults, governance voting and carbon credit rewards'}
                    {tab==='sme'      && 'Unlock working capital loans, yBOB merchant accounts and revenue tokenisation on Avalanche'}
                    {tab==='chama'    && 'Pool contributions auto-routed to the highest-yield vault strategy. Current best: 22% APY'}
                    {tab==='prefs'    && 'Personalise your DeFi risk strategy and vault preferences'}
                  </p>
                </div>

                {/* ── PERSONAL ── */}
                {tab==='personal' && (
                  <div className="profile-2col" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'28px 48px' }}>
                    <div style={{ gridColumn:'1/-1' }}>
                      <FormRow label="Display Name *">
                        <KInput value={profile.displayName} onChange={set('displayName')} placeholder="e.g. Grace Wangari" big/>
                      </FormRow>
                    </div>
                    <FormRow label="Phone Number">
                      <KInput value={profile.phone} onChange={set('phone')} placeholder="+254 7..." type="tel"/>
                    </FormRow>
                    <FormRow label="National ID">
                      <KInput value={profile.idNumber} onChange={set('idNumber')} placeholder="ID number"/>
                    </FormRow>
                    <div style={{ gridColumn:'1/-1' }}>
                      <FormRow label="County / Region">
                        <KSelect value={profile.county} onChange={set('county')} options={COUNTIES} placeholder="Select your county..."/>
                      </FormRow>
                    </div>
                    {isConnected && (
                      <div style={{ gridColumn:'1/-1', paddingTop:8 }}>
                        <p style={{ ...label, margin: '0 0 10px' }}>Linked Wallet</p>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <Wallet size={15} color={C.goldLight}/>
                          <span style={{ ...MONO, fontSize:12.5, color: C.paperDim, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{address}</span>
                          <a href={`https://testnet.snowtrace.io/address/${address}`} target="_blank" rel="noreferrer" style={{ color: C.goldLight, display:'flex' }}>
                            <ExternalLink size={13}/>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── CFA ── */}
                {tab==='cfa' && (
                  <div className="profile-2col" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'28px 48px' }}>
                    <div style={{ gridColumn:'1/-1' }}>
                      <FormRow label="CFA Group Name *">
                        <KInput value={profile.cfaGroup} onChange={set('cfaGroup')} placeholder="e.g. Mau Forest Guardians Group A" big/>
                      </FormRow>
                    </div>
                    <FormRow label="Your Role">
                      <KSelect value={profile.cfaRole} onChange={set('cfaRole')} options={CFA_ROLES} placeholder="Select role..."/>
                    </FormRow>
                    <FormRow label="Join Year">
                      <KInput value={profile.cfaJoinYear} onChange={set('cfaJoinYear')} placeholder="2022" type="number"/>
                    </FormRow>
                    <div style={{ gridColumn:'1/-1' }}>
                      <FormRow label="Forest Region">
                        <KInput value={profile.cfaRegion} onChange={set('cfaRegion')} placeholder="e.g. Rift Valley – Mau Complex"/>
                      </FormRow>
                    </div>
                    <div style={{ gridColumn:'1/-1', marginTop:8, paddingTop:24, borderTop: `1px solid ${C.hairline}` }}>
                      <p style={{ ...label, margin: '0 0 18px' }}>Linked Forest Products</p>
                      <div className="profile-4col" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
                        {[
                          { name:'Honey Reserve', apy:'14.0%', color:'#E4C878' },
                          { name:'Med. Herbs',    apy:'16.0%', color:'#7DC383' },
                          { name:'Seed Bank',     apy:'6.5%',  color:'#C89B3C' },
                          { name:'Water Rights',  apy:'5.8%',  color:'#6FA8DC' },
                        ].map(p => (
                          <StatCell key={p.name} name={p.name} value={p.apy} color={p.color}/>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── SME ── */}
                {tab==='sme' && (
                  <div className="profile-2col" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'28px 48px' }}>
                    <div style={{ gridColumn:'1/-1' }}>
                      <FormRow label="Business Name *">
                        <KInput value={profile.businessName} onChange={set('businessName')} placeholder="e.g. Kipkelion Farm Supplies" big/>
                      </FormRow>
                    </div>
                    <FormRow label="Business Type">
                      <KSelect value={profile.businessType} onChange={set('businessType')} options={BIZ_TYPES} placeholder="Select type..."/>
                    </FormRow>
                    <FormRow label="Annual Turnover (KES)">
                      <KInput value={profile.annualTurnover} onChange={set('annualTurnover')} placeholder="500000" type="number"/>
                    </FormRow>
                    <div style={{ gridColumn:'1/-1' }}>
                      <FormRow label="Business Location">
                        <KInput value={profile.businessLocation} onChange={set('businessLocation')} placeholder="e.g. Kipkelion, Kericho County"/>
                      </FormRow>
                    </div>
                    <div style={{ gridColumn:'1/-1' }}>
                      <FormRow label="M-Pesa Till / Paybill">
                        <KInput value={profile.mpesaNumber} onChange={set('mpesaNumber')} placeholder="e.g. 4056789"/>
                      </FormRow>
                    </div>
                    <div style={{ gridColumn:'1/-1', marginTop:8, paddingTop:24, borderTop: `1px solid ${C.hairline}` }}>
                      <p style={{ ...label, margin: '0 0 18px' }}>Available Financial Products</p>
                      <div className="profile-3col" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
                        {[
                          { name:'Working Capital Loan', rate:'8% p.a.',  color:'#7DC383' },
                          { name:'Inventory Finance',    rate:'6% p.a.',  color:'#6FA8DC' },
                          { name:'Merchant yBOB',        rate:'7.5% APY', color:'#C48FE0' },
                        ].map(p => (
                          <StatCell key={p.name} name={p.name} value={p.rate} color={p.color}/>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── CHAMA ── */}
                {tab==='chama' && (
                  <div className="profile-2col" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'28px 48px' }}>
                    <div style={{ gridColumn:'1/-1' }}>
                      <FormRow label="Chama / SACCO Name *">
                        <KInput value={profile.chamaName} onChange={set('chamaName')} placeholder="e.g. Mwanzo Mpya Women Savings Chama" big/>
                      </FormRow>
                    </div>
                    <FormRow label="Your Role">
                      <KSelect value={profile.chamaRole} onChange={set('chamaRole')} options={CHAMA_ROLES} placeholder="Select role..."/>
                    </FormRow>
                    <FormRow label="Monthly Contribution (KES)">
                      <KInput value={profile.monthlyContrib} onChange={set('monthlyContrib')} placeholder="2000" type="number"/>
                    </FormRow>
                    <div style={{ gridColumn:'1/-1' }}>
                      <FormRow label="Registration Number (optional)">
                        <KInput value={profile.chamaRegNo} onChange={set('chamaRegNo')} placeholder="e.g. SS/NGO/2021/4821"/>
                      </FormRow>
                    </div>
                    <div style={{ gridColumn:'1/-1', marginTop:8, paddingTop:24, borderTop: `1px solid ${C.hairline}` }}>
                      <p style={{ ...label, margin: '0 0 18px' }}>Vault Strategies</p>
                      <div className="profile-3col" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
                        {[
                          { name:'Conservative KES', apy:'12%', risk:'Very Low', color:'#7DC383' },
                          { name:'Balanced yBOB',    apy:'18%', risk:'Low',      color:'#6FA8DC' },
                          { name:'High Yield AVAX',  apy:'24%', risk:'Medium',   color:'#E4C878' },
                        ].map(v => (
                          <StatCell key={v.name} name={v.name} value={v.apy} sub={`Risk: ${v.risk}`} color={v.color}/>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── PREFS ── */}
                {tab==='prefs' && (
                  <div style={{ display:'flex', flexDirection:'column', gap:32 }}>
                    <div>
                      <p style={{ ...label, margin: '0 0 18px' }}>Risk Tolerance</p>
                      <div className="profile-3col" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
                        {RISK_LEVELS.map(r => (
                          <button key={r.v}
                            onClick={()=>set('riskTolerance')(r.v)}
                            style={{
                              padding:'18px 12px', borderRadius:10, cursor:'pointer', textAlign:'center', fontFamily: 'inherit',
                              border: profile.riskTolerance===r.v ? `1px solid ${r.color}` : `1px solid ${C.hairline}`,
                              background: 'none', transition:'border-color 0.18s ease',
                            }}>
                            {profile.riskTolerance===r.v && <CheckCircle size={15} color={r.color} style={{ display:'block', margin:'0 auto 8px' }}/>}
                            <p style={{ fontSize:14, fontWeight:700, color: C.paper, margin:'0 0 4px' }}>{r.label}</p>
                            <p style={{ fontSize:11.5, color: C.inkLight, margin:'0 0 10px' }}>Expected yield</p>
                            <p style={{ ...SERIF, fontSize:22, fontWeight:600, color:r.color, margin:0 }}>{r.apy}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <FormRow label="Preferred Vault">
                      <KSelect value={profile.preferredVault} onChange={set('preferredVault')} options={VAULTS} placeholder="Choose vault..."/>
                    </FormRow>

                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingBottom:20, borderBottom: `1px solid ${C.hairline}` }}>
                      <div>
                        <p style={{ fontSize:14, fontWeight:700, color: C.paper, margin:'0 0 4px' }}>Notifications</p>
                        <p style={{ fontSize:12.5, color: C.inkLight, margin:0 }}>Yield payouts, DAO votes, patrol alerts</p>
                      </div>
                      <button onClick={()=>set('notifications')(!profile.notifications)}
                        style={{ width:44, height:24, borderRadius:12, border: `1px solid ${profile.notifications ? C.gold : C.hairline}`, cursor:'pointer', padding:0, background: profile.notifications ? 'rgba(200,155,60,0.18)' : 'none', transition:'all 0.2s', position:'relative', flexShrink:0 }}>
                        <span style={{ position:'absolute', top:2, left: profile.notifications ? 22 : 2, width:18, height:18, borderRadius:'50%', background: profile.notifications ? C.goldLight : C.inkLight, transition:'left 0.2s' }}/>
                      </button>
                    </div>

                    {profile.updatedAt && (
                      <p style={{ fontSize:12, color: C.inkLight, margin:0 }}>
                        Last saved: {new Date(profile.updatedAt).toLocaleString('en-KE')}
                      </p>
                    )}
                  </div>
                )}

                {/* Save button */}
                <button onClick={save} disabled={saving||!isConnected}
                  style={{ marginTop:40, width:'100%', padding:'15px', borderRadius:999, border:'none', cursor:isConnected?'pointer':'not-allowed', background: saved ? 'rgba(200,155,60,0.18)' : C.gold, color: saved ? C.goldLight : C.ink, fontSize:14, fontWeight:700, fontFamily: 'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:9, opacity: saving||!isConnected ? 0.5 : 1 }}>
                  {saving?<><RefreshCw size={16} style={{animation:'spin 1s linear infinite'}}/> Saving profile…</>
                  :saved?<><CheckCircle size={16}/> Profile Saved</>
                  :<><Save size={16}/> Save Profile</>}
                </button>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:12 }}
            style={{ position:'fixed', bottom:100, left:'50%', transform:'translateX(-50%)', padding:'11px 24px', borderRadius:999, zIndex:200, whiteSpace:'nowrap', background: C.bg, border: `1px solid ${C.hairline}`, color: toast.includes('saved') ? C.goldLight : C.red, fontSize:13, fontWeight:700 }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
