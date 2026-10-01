'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sprout, Warehouse, Leaf, HeartPulse, Plus, X, Loader2, MapPin,
  PackagePlus, ClipboardList, Trees, CheckCircle2, Activity, Droplets,
  ArrowRightLeft, Skull, Camera, ShieldCheck,
} from 'lucide-react';
import { usePrivyAuth } from '@/lib/auth/privy-auth';
import EvidencePanel from '@/components/cfa/EvidencePanel';
import CfaAdminPanel from '@/components/cfa/CfaAdminPanel';

/* Same editorial system as the rest of the app — pine + gold + paper,
   flat rows separated by a hairline, no gradient card shells. The
   bottom-sheet modal keeps a bordered container (it's a floating dialog
   over a backdrop, same treatment as the Connect Wallet modal), but its
   inputs are flat bottom-border fields like everywhere else. */
const C = {
  bg:        '#0E2418',
  gold:      '#C89B3C',
  goldLight: '#E4C878',
  paper:     '#F6F2E7',
  paperDim:  '#EFE9D9',
  inkLight:  '#9BA396',
  hairline:  'rgba(200,155,60,0.14)',
  red:       '#E88C7D',
};
const MONO: React.CSSProperties = { fontFamily: 'var(--font-plex-mono), monospace' };
const SERIF: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const label: React.CSSProperties = { ...MONO, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: C.goldLight, fontWeight: 600, margin: 0 };

// ── Types (shape of GET /api/cfa/nursery/summary) ─────────────────
interface SpeciesItem { id: string; commonName: string; scientificName: string; localName: string | null }
interface LocationItem { id: string; name: string }
interface Batch {
  id: string;
  quantity: number;
  status: string;
  dateReceived: string | null;
  plantingDate: string | null;
  source: string | null;
  species: { commonName: string };
  location: { name: string };
  verifyId: string | null;
}
interface ActivityItem {
  id: string;
  activityType: string;
  activityDate: string;
  quantityAffected: number | null;
  description: string | null;
}
interface NurserySummary {
  stats: {
    totalSeedlings: number;
    inNursery: number;
    planted: number;
    speciesCount: number;
    avgSurvivalPct: number | null;
    activityCount: number;
  } | null;
  species: SpeciesItem[];
  locations: LocationItem[];
  batches: Batch[];
  activities: ActivityItem[];
}
interface Membership { id: string; name: string; role: string; status: string }

type ModalType = 'species' | 'location' | 'batch' | 'plant' | 'activity' | 'survival' | 'transfer' | 'loss' | 'evidence' | null;
type Submit = (path: string, body: Record<string, unknown>) => Promise<boolean>;

const ACTIVITY_LABELS: Record<string, string> = {
  watering: 'Watering', weeding: 'Weeding', mulching: 'Mulching', pruning: 'Pruning',
  pest_control: 'Pest control', transplanting: 'Transplanting', distribution: 'Distribution',
  planting: 'Planting', other: 'Other',
};
const STATUS_LABELS: Record<string, string> = {
  in_inventory: 'In nursery', planted: 'Planted', transferred: 'Transferred',
  dead: 'Dead', sold: 'Sold', distributed: 'Distributed',
};
const today = () => new Date().toISOString().slice(0, 10);
const shortDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' }) : '';

// ── Small building blocks ───────────────────────────────────────
function KPICell({ icon, value, label: l, color }: { icon: React.ReactNode; value: string; label: string; color: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '0 4px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>{icon}</div>
      <p style={{ ...SERIF, fontSize: 18, fontWeight: 600, color, margin: '0 0 3px' }}>{value}</p>
      <p style={{ ...MONO, fontSize: 8.5, color: C.inkLight, margin: 0, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>{l}</p>
    </div>
  );
}

function ActionTile({ icon, label: l, onClick, disabled }: { icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className="nursery-action" style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '12px 4px',
      background: 'none', border: 'none', color: C.paperDim, fontSize: 13, fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1, textAlign: 'left', fontFamily: 'inherit',
    }}>
      {icon} {l}
    </button>
  );
}

function Field({ label: l, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ ...MONO, fontSize: 9.5, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: C.inkLight }}>{l}</span>
      {children}
    </label>
  );
}

function Step({ n, title, hint, done, last, children }: { n: number; title: string; hint: string; done: boolean; last?: boolean; children?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: last ? 'none' : `1px solid ${C.hairline}` }}>
      <div style={{
        width: 24, height: 24, borderRadius: 999, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700, ...(done
          ? { background: '#7DC383', color: '#0E2418' }
          : { border: `1px solid ${C.gold}`, color: C.goldLight }),
      }}>{done ? '✓' : n}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13.5, fontWeight: 700, color: done ? C.inkLight : C.paper, margin: 0, textDecoration: done ? 'line-through' : 'none' }}>{title}</p>
        {!done && <p style={{ fontSize: 11.5, color: C.inkLight, margin: '3px 0 10px', lineHeight: 1.5 }}>{hint}</p>}
        {!done && children}
      </div>
    </div>
  );
}

function StepButton({ onClick, children, secondary, disabled, done }: { onClick: () => void; children: React.ReactNode; secondary?: boolean; disabled?: boolean; done?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '9px 16px', borderRadius: 999, fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
      cursor: disabled ? 'wait' : 'pointer',
      ...(secondary || done
        ? { background: 'none', border: `1px solid ${done ? '#7DC383' : C.gold}`, color: done ? '#7DC383' : C.goldLight }
        : { background: C.gold, border: 'none', color: '#1B1A14' }),
    }}>{children}</button>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '8px 2px', border: 'none', borderBottom: `1px solid ${C.hairline}`, borderRadius: 0,
  background: 'none', color: C.paper, fontSize: 13.5, outline: 'none', fontFamily: 'inherit',
};
const optionStyle: React.CSSProperties = { background: C.bg };
const formStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 };

// ── Main component ──────────────────────────────────────────────
export default function NurseryTab() {
  const { authenticated, getAccessToken, signInWithGoogle, signInWithEmail } = usePrivyAuth();
  const [summary, setSummary] = useState<NurserySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalType>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [membership, setMembership] = useState<Membership | null | undefined>(undefined);
  const [joining, setJoining] = useState(false);
  /** The batch whose photos the evidence modal shows. */
  const [evidenceBatch, setEvidenceBatch] = useState<Batch | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cfa/nursery/summary');
      setSummary(await res.json());
    } catch {
      /* offline — summary stays null */
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMembership = useCallback(async () => {
    if (!authenticated) { setMembership(undefined); return; }
    try {
      const token = await getAccessToken();
      if (!token) { setMembership(undefined); return; }
      const res = await fetch('/api/cfa/join', { headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      setMembership(d.member ?? null);
    } catch {
      setMembership(undefined);
    }
  }, [authenticated, getAccessToken]);

  // Fetch-on-mount: loads nursery summary on mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);
  // Fetch-on-mount: loads membership status for the signed-in user once ready.
  // getAccessToken awaits Privy auth, so setState happens after an async boundary.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadMembership(); }, [loadMembership]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const joinCfa = async () => {
    setJoining(true);
    try {
      const token = await getAccessToken();
      if (!token) return;
      const res = await fetch('/api/cfa/join', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      if (res.ok) {
        setMembership(d.member);
        showToast(d.member?.role === 'admin' ? 'Joined as a CFA admin.' : 'Joined the CFA.');
      } else {
        showToast(d.error ?? 'Could not join. Please try again.');
      }
    } finally {
      setJoining(false);
    }
  };

  const submit: Submit = async (path, body) => {
    setSubmitting(true);
    try {
      const token = await getAccessToken();
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) {
        showToast(d.error ?? 'Something went wrong');
        return false;
      }
      const fingerprinted = d.mrvRecord ? ' Record fingerprinted.' : '';
      showToast((d.pointsEarned ? `Saved. +${d.pointsEarned} Kai Bar earned!` : 'Saved.') + fingerprinted);
      setModal(null);
      await load();
      return true;
    } catch {
      showToast('Network error. Please try again.');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !summary) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: C.inkLight, fontSize: 12 }}>
        <Loader2 className="animate-spin" size={20} color={C.goldLight} style={{ marginBottom: 8 }} />
        <p>Loading nursery data…</p>
      </div>
    );
  }

  const s = summary?.stats;
  const isMember = !!membership && membership.status === 'active';
  const isAdmin = isMember && membership!.role === 'admin';
  const batches = summary?.batches ?? [];
  const inNursery = batches.filter((b) => b.status === 'in_inventory');
  const needsSetup = (summary?.species.length ?? 0) === 0 || (summary?.locations.length ?? 0) === 0;
  const allSet = authenticated && isMember && !needsSetup && batches.length > 0;

  return (
    <div>
      <style>{`.nursery-action:hover:not(:disabled) { color: ${C.goldLight}; }`}</style>

      {/* Getting started: one numbered path from "signed out" to "recording" */}
      {!allSet && (
        <section style={{ marginBottom: 28, paddingBottom: 8, borderBottom: `1px solid ${C.hairline}` }}>
          <p style={{ ...label, marginBottom: 6 }}>Get started</p>
          <p style={{ fontSize: 12, color: C.inkLight, margin: '0 0 8px' }}>Follow these steps in order. Each one ticks when it is done.</p>

          <Step n={1} done={authenticated} title="Sign in"
            hint="Use the same Google account or email every time, so your records stay yours.">
            {!authenticated && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <StepButton onClick={() => { void signInWithGoogle(); }}>Continue with Google</StepButton>
                <StepButton onClick={() => { void signInWithEmail(); }} secondary>Continue with email</StepButton>
              </div>
            )}
          </Step>

          <Step n={2} done={isMember} title="Join the CFA"
            hint="Makes you a member of Oloolua CFA. Admins are set by email in the site settings.">
            {authenticated && membership === undefined && <p style={{ fontSize: 12, color: C.inkLight, margin: 0 }}>Checking your membership…</p>}
            {authenticated && membership === null && (
              <StepButton onClick={joinCfa} disabled={joining}>{joining ? 'Joining…' : 'Join Oloolua CFA'}</StepButton>
            )}
            {membership && membership.status !== 'active' && (
              <p style={{ fontSize: 12, color: C.red, margin: 0 }}>Your membership is {membership.status}. Ask a CFA admin to reactivate it.</p>
            )}
          </Step>

          <Step n={3} done={!needsSetup} title="Add species and a nursery location"
            hint="The list of trees you grow and the places in the nursery where batches are kept.">
            {isMember && needsSetup && (isAdmin ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <StepButton onClick={() => setModal('species')} done={(summary?.species.length ?? 0) > 0}>
                  {(summary?.species.length ?? 0) > 0 ? `✓ ${summary!.species.length} species` : 'Add species'}
                </StepButton>
                <StepButton onClick={() => setModal('location')} done={(summary?.locations.length ?? 0) > 0}>
                  {(summary?.locations.length ?? 0) > 0 ? `✓ ${summary!.locations.length} location${summary!.locations.length === 1 ? '' : 's'}` : 'Add location'}
                </StepButton>
              </div>
            ) : (
              <p style={{ fontSize: 12, color: C.inkLight, margin: 0 }}>A CFA admin does this step. Ask your admin to add them.</p>
            ))}
          </Step>

          <Step n={4} done={batches.length > 0} title="Record your first seedling batch" last
            hint="A batch is a group of seedlings of one species, e.g. 500 Croton in Section A.">
            {isMember && !needsSetup && batches.length === 0 && (
              <StepButton onClick={() => setModal('batch')}>Add seedling batch</StepButton>
            )}
          </Step>
        </section>
      )}
      {allSet && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <CheckCircle2 size={15} color={C.goldLight} />
          <p style={{ fontSize: 11.5, color: C.goldLight, margin: 0, fontWeight: 600 }}>
            You&apos;re a CFA {isAdmin ? 'admin' : 'member'}. Your entries are saved under your name and earn Kai Bar points.
          </p>
        </div>
      )}

      {/* Summary (v_nursery_dashboard) */}
      <p style={{ ...label, marginBottom: 16 }}>Nursery Overview</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px 6px', marginBottom: 28, paddingBottom: 28, borderBottom: `1px solid ${C.hairline}` }}>
        <KPICell icon={<Sprout size={16} color={C.paperDim} strokeWidth={1.7} />} value={(s?.totalSeedlings ?? 0).toLocaleString()} label="Seedlings" color={C.paper} />
        <KPICell icon={<Warehouse size={16} color={C.goldLight} strokeWidth={1.7} />} value={(s?.inNursery ?? 0).toLocaleString()} label="In Nursery" color={C.goldLight} />
        <KPICell icon={<Trees size={16} color="#7DC383" strokeWidth={1.7} />} value={(s?.planted ?? 0).toLocaleString()} label="Planted" color="#7DC383" />
        <KPICell icon={<Leaf size={16} color="#C48FE0" strokeWidth={1.7} />} value={(s?.speciesCount ?? 0).toString()} label="Species" color="#C48FE0" />
        <KPICell icon={<HeartPulse size={16} color="#6FA8DC" strokeWidth={1.7} />} value={s?.avgSurvivalPct != null ? `${s.avgSurvivalPct.toFixed(0)}%` : '—'} label="Survival" color="#6FA8DC" />
        <KPICell icon={<Activity size={16} color={C.gold} strokeWidth={1.7} />} value={(s?.activityCount ?? 0).toString()} label="Activities" color={C.gold} />
      </div>

      {/* Actions */}
      <p style={{ ...label, marginBottom: 8 }}>Actions</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginBottom: 28, paddingBottom: 20, borderBottom: `1px solid ${C.hairline}` }}>
        <ActionTile icon={<PackagePlus size={16} color={C.goldLight} />} label="Add Seedling Batch" onClick={() => setModal('batch')} disabled={!isMember || needsSetup} />
        <ActionTile icon={<Trees size={16} color="#7DC383" />} label="Plant Seedlings" onClick={() => setModal('plant')} disabled={!isMember || inNursery.length === 0} />
        <ActionTile icon={<Droplets size={16} color="#6FA8DC" />} label="Log Activity" onClick={() => setModal('activity')} disabled={!isMember || (summary?.locations.length ?? 0) === 0} />
        <ActionTile icon={<HeartPulse size={16} color="#6FA8DC" />} label="Survival Check" onClick={() => setModal('survival')} disabled={!isMember || batches.length === 0} />
        <ActionTile icon={<ArrowRightLeft size={16} color={C.goldLight} />} label="Transfer Seedlings" onClick={() => setModal('transfer')} disabled={!isMember || inNursery.length === 0} />
        <ActionTile icon={<Skull size={16} color={C.red} />} label="Record Loss" onClick={() => setModal('loss')} disabled={!isMember || inNursery.length === 0} />
        {isAdmin && <ActionTile icon={<Plus size={16} color="#C48FE0" />} label="Add Species" onClick={() => setModal('species')} />}
        {isAdmin && <ActionTile icon={<MapPin size={16} color="#C48FE0" />} label="Add Location" onClick={() => setModal('location')} />}
      </div>

      <Link href="/mrv" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28, color: C.goldLight, fontSize: 12.5, fontWeight: 600, textDecoration: 'none' }}>
        <ShieldCheck size={15} /> Verification desk — review, correct and anchor records on Avalanche →
      </Link>

      {isAdmin && membership && <CfaAdminPanel myMemberId={membership.id} onChanged={load} />}

      {/* Batches */}
      <p style={{ ...label, marginBottom: 14 }}>Seedling Batches</p>
      {batches.length === 0 && <p style={{ fontSize: 12.5, color: C.inkLight, marginBottom: 28 }}>No seedling batches recorded yet.</p>}
      <div style={{ marginBottom: batches.length ? 28 : 0 }}>
        {batches.slice(0, 12).map((b) => (
          <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `1px solid ${C.hairline}` }}>
            <Sprout size={14} color={b.status === 'planted' ? '#7DC383' : C.goldLight} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: C.paperDim }}>
              {b.quantity.toLocaleString()} {b.species.commonName} · {b.location.name}
            </span>
            <span style={{ ...MONO, fontSize: 10, color: b.status === 'planted' ? '#7DC383' : C.inkLight, flexShrink: 0 }}>
              {STATUS_LABELS[b.status] ?? b.status}{b.status === 'planted' && b.plantingDate ? ` ${shortDate(b.plantingDate)}` : ''}
            </span>
            <button onClick={() => { setEvidenceBatch(b); setModal('evidence'); }} aria-label="Photos" title="Photos and documents"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.goldLight, display: 'flex', padding: 0, flexShrink: 0 }}>
              <Camera size={14} />
            </button>
            {b.verifyId && (
              <Link href={`/verify/${b.verifyId}`} style={{ ...MONO, fontSize: 10, color: C.goldLight, textDecoration: 'none', flexShrink: 0 }}>
                Verify
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <p style={{ ...label, marginBottom: 14 }}>Recent Activity</p>
      {(summary?.activities.length ?? 0) === 0 && (
        <p style={{ fontSize: 12.5, color: C.inkLight }}>No nursery activity recorded yet.</p>
      )}
      {summary?.activities.map((a) => (
        <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `1px solid ${C.hairline}` }}>
          <ClipboardList size={14} color={a.activityType === 'planting' ? '#7DC383' : C.goldLight} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: C.paperDim }}>
            {ACTIVITY_LABELS[a.activityType] ?? a.activityType}
            {a.quantityAffected != null ? ` · ${a.quantityAffected.toLocaleString()} seedlings` : ''}
            {a.description ? ` — ${a.description}` : ''}
          </span>
          <span style={{ ...MONO, fontSize: 10, color: C.inkLight, flexShrink: 0 }}>{shortDate(a.activityDate)}</span>
        </div>
      ))}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 96, left: '50%', transform: 'translateX(-50%)', zIndex: 60,
          padding: '11px 22px', borderRadius: 999, fontSize: 13, fontWeight: 700, maxWidth: 'calc(100vw - 32px)',
          background: C.bg, border: `1px solid ${C.hairline}`, color: C.goldLight, textAlign: 'center',
        }}>{toast}</div>
      )}

      <AnimatePresence>
        {modal && summary && (
          <NurseryModal
            type={modal}
            summary={summary}
            submitting={submitting}
            onClose={() => setModal(null)}
            onSubmit={submit}
            evidenceBatch={evidenceBatch}
            canUpload={isMember}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Modal + forms ────────────────────────────────────────────────
function NurseryModal({
  type, summary, submitting, onClose, onSubmit, evidenceBatch, canUpload,
}: {
  type: Exclude<ModalType, null>;
  summary: NurserySummary;
  submitting: boolean;
  onClose: () => void;
  onSubmit: Submit;
  evidenceBatch: Batch | null;
  canUpload: boolean;
}) {
  const titles: Record<Exclude<ModalType, null>, string> = {
    species: 'Add Species',
    location: 'Add Nursery Location',
    batch: 'Add Seedling Batch',
    plant: 'Plant Seedlings',
    activity: 'Log Nursery Activity',
    survival: 'Survival Check',
    transfer: 'Transfer Seedlings',
    loss: 'Record Seedling Loss',
    evidence: 'Photos & Documents',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(7,15,11,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto', background: C.bg, borderRadius: '20px 20px 0 0', border: `1px solid ${C.hairline}`, padding: 24 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ ...SERIF, margin: 0, fontSize: 18, fontWeight: 600, color: C.paper }}>{titles[type]}</h3>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', color: C.inkLight, cursor: 'pointer', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        {type === 'species' && <SpeciesForm submitting={submitting} onSubmit={onSubmit} />}
        {type === 'location' && <LocationForm submitting={submitting} onSubmit={onSubmit} />}
        {type === 'batch' && <BatchForm summary={summary} submitting={submitting} onSubmit={onSubmit} />}
        {type === 'plant' && <PlantForm summary={summary} submitting={submitting} onSubmit={onSubmit} />}
        {type === 'activity' && <ActivityForm summary={summary} submitting={submitting} onSubmit={onSubmit} />}
        {type === 'survival' && <SurvivalForm summary={summary} submitting={submitting} onSubmit={onSubmit} />}
        {type === 'transfer' && <TransferForm summary={summary} submitting={submitting} onSubmit={onSubmit} />}
        {type === 'loss' && <LossForm summary={summary} submitting={submitting} onSubmit={onSubmit} />}
        {type === 'evidence' && evidenceBatch && (
          <div>
            <p style={{ fontSize: 12.5, color: C.inkLight, margin: '0 0 14px' }}>{batchLabel(evidenceBatch)}. Each file gets a SHA-256 fingerprint that verifiers can check.</p>
            <EvidencePanel entityType="seedling_inventory" entityId={evidenceBatch.id} canUpload={canUpload} />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function SubmitButton({ submitting, label: l, disabled }: { submitting: boolean; label: string; disabled?: boolean }) {
  const off = submitting || disabled;
  return (
    <button type="submit" disabled={off} style={{
      marginTop: 8, padding: '13px', borderRadius: 999, border: 'none', cursor: submitting ? 'wait' : off ? 'not-allowed' : 'pointer',
      background: C.gold, color: '#1B1A14', fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit', opacity: disabled ? 0.5 : 1,
    }}>
      {submitting ? 'Saving…' : l}
    </button>
  );
}

const batchLabel = (b: Batch) => `${b.quantity.toLocaleString()} ${b.species.commonName} · ${b.location.name} (${STATUS_LABELS[b.status] ?? b.status})`;
const optional = (v: string) => (v.trim() ? v.trim() : null);

function SpeciesForm({ submitting, onSubmit }: { submitting: boolean; onSubmit: Submit }) {
  const [commonName, setCommonName] = useState('');
  const [scientificName, setScientificName] = useState('');
  const [localName, setLocalName] = useState('');
  return (
    <form style={formStyle} onSubmit={async (e) => {
      e.preventDefault();
      await onSubmit('/api/cfa/species', { commonName, scientificName, localName: optional(localName) });
    }}>
      <Field label="Common name">
        <input required value={commonName} onChange={(e) => setCommonName(e.target.value)} placeholder="e.g. Croton" style={inputStyle} />
      </Field>
      <Field label="Scientific name">
        <input required value={scientificName} onChange={(e) => setScientificName(e.target.value)} placeholder="e.g. Croton megalocarpus" style={inputStyle} />
      </Field>
      <Field label="Local name (optional)">
        <input value={localName} onChange={(e) => setLocalName(e.target.value)} placeholder="e.g. Mukinduri" style={inputStyle} />
      </Field>
      <SubmitButton submitting={submitting} label="Add Species" />
    </form>
  );
}

function LocationForm({ submitting, onSubmit }: { submitting: boolean; onSubmit: Submit }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  return (
    <form style={formStyle} onSubmit={async (e) => {
      e.preventDefault();
      await onSubmit('/api/cfa/locations', {
        name, description: optional(description),
        latitude: latitude.trim() ? Number(latitude) : null,
        longitude: longitude.trim() ? Number(longitude) : null,
      });
    }}>
      <Field label="Location name">
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Main Nursery, Section A" style={inputStyle} />
      </Field>
      <Field label="Description (optional)">
        <input value={description} onChange={(e) => setDescription(e.target.value)} style={inputStyle} />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Latitude (optional)">
          <input type="number" step="any" min={-90} max={90} value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="-1.3582" style={inputStyle} />
        </Field>
        <Field label="Longitude (optional)">
          <input type="number" step="any" min={-180} max={180} value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="36.7091" style={inputStyle} />
        </Field>
      </div>
      <SubmitButton submitting={submitting} label="Add Location" />
    </form>
  );
}

function BatchForm({ summary, submitting, onSubmit }: { summary: NurserySummary; submitting: boolean; onSubmit: Submit }) {
  const [speciesId, setSpeciesId] = useState(summary.species[0]?.id ?? '');
  const [locationId, setLocationId] = useState(summary.locations[0]?.id ?? '');
  const [quantity, setQuantity] = useState('');
  const [dateReceived, setDateReceived] = useState(today);
  const [source, setSource] = useState('');
  const [condition, setCondition] = useState('healthy');
  const [notes, setNotes] = useState('');
  return (
    <form style={formStyle} onSubmit={async (e) => {
      e.preventDefault();
      await onSubmit('/api/cfa/inventory', {
        speciesId, locationId, quantity: Number(quantity), dateReceived,
        source: optional(source), notes: optional(notes), metadata: { condition },
      });
    }}>
      <Field label="Species">
        <select required value={speciesId} onChange={(e) => setSpeciesId(e.target.value)} style={inputStyle}>
          {summary.species.map((sp) => <option key={sp.id} value={sp.id} style={optionStyle}>{sp.commonName} ({sp.scientificName})</option>)}
        </select>
      </Field>
      <Field label="Nursery location">
        <select required value={locationId} onChange={(e) => setLocationId(e.target.value)} style={inputStyle}>
          {summary.locations.map((l) => <option key={l.id} value={l.id} style={optionStyle}>{l.name}</option>)}
        </select>
      </Field>
      <Field label="Number of seedlings">
        <input required type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Date received">
        <input type="date" max={today()} value={dateReceived} onChange={(e) => setDateReceived(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Condition">
        <select value={condition} onChange={(e) => setCondition(e.target.value)} style={inputStyle}>
          <option value="healthy" style={optionStyle}>Healthy</option>
          <option value="fair" style={optionStyle}>Fair</option>
          <option value="poor" style={optionStyle}>Poor</option>
        </select>
      </Field>
      <Field label="Source (optional)">
        <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. KEFRI, own seed collection" style={inputStyle} />
      </Field>
      <Field label="Notes (optional)">
        <input value={notes} onChange={(e) => setNotes(e.target.value)} style={inputStyle} />
      </Field>
      <SubmitButton submitting={submitting} label="Add Batch" />
    </form>
  );
}

function PlantForm({ summary, submitting, onSubmit }: { summary: NurserySummary; submitting: boolean; onSubmit: Submit }) {
  const inNursery = summary.batches.filter((b) => b.status === 'in_inventory');
  const [inventoryId, setInventoryId] = useState(inNursery[0]?.id ?? '');
  const batch = inNursery.find((b) => b.id === inventoryId);
  const [quantity, setQuantity] = useState(() => String(inNursery[0]?.quantity ?? ''));
  const [plantingDate, setPlantingDate] = useState(today);
  const [notes, setNotes] = useState('');
  const q = Number(quantity);
  const tooMany = !!batch && q > batch.quantity;
  return (
    <form style={formStyle} onSubmit={async (e) => {
      e.preventDefault();
      await onSubmit('/api/cfa/planting', { inventoryId, quantity: q, plantingDate, notes: optional(notes) });
    }}>
      <Field label="Batch in the nursery">
        <select required value={inventoryId} onChange={(e) => {
          setInventoryId(e.target.value);
          setQuantity(String(inNursery.find((b) => b.id === e.target.value)?.quantity ?? ''));
        }} style={inputStyle}>
          {inNursery.map((b) => <option key={b.id} value={b.id} style={optionStyle}>{batchLabel(b)}</option>)}
        </select>
      </Field>
      <Field label="Number planted">
        <input required type="number" min={1} max={batch?.quantity} value={quantity} onChange={(e) => setQuantity(e.target.value)} style={inputStyle} />
      </Field>
      {batch && q > 0 && q < batch.quantity && (
        <p style={{ fontSize: 11.5, color: C.inkLight, margin: '-6px 0 0' }}>
          The other {(batch.quantity - q).toLocaleString()} stay in the nursery as their own batch.
        </p>
      )}
      {tooMany && <p style={{ fontSize: 11.5, color: C.red, margin: '-6px 0 0' }}>Only {batch!.quantity.toLocaleString()} seedlings are in this batch.</p>}
      <Field label="Planting date">
        <input required type="date" max={today()} value={plantingDate} onChange={(e) => setPlantingDate(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Where / initiative (optional)">
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Riverine section, World Environment Day" style={inputStyle} />
      </Field>
      <SubmitButton submitting={submitting} label="Record Planting" disabled={tooMany} />
    </form>
  );
}

function ActivityForm({ summary, submitting, onSubmit }: { summary: NurserySummary; submitting: boolean; onSubmit: Submit }) {
  const [activityType, setActivityType] = useState('watering');
  const [locationId, setLocationId] = useState(summary.locations[0]?.id ?? '');
  const [inventoryId, setInventoryId] = useState('');
  const [activityDate, setActivityDate] = useState(today);
  const [quantityAffected, setQuantityAffected] = useState('');
  const [description, setDescription] = useState('');
  return (
    <form style={formStyle} onSubmit={async (e) => {
      e.preventDefault();
      await onSubmit('/api/cfa/activities', {
        activityType, locationId, inventoryId: inventoryId || null, activityDate,
        quantityAffected: quantityAffected.trim() ? Number(quantityAffected) : null,
        description: optional(description),
      });
    }}>
      <Field label="Activity">
        <select value={activityType} onChange={(e) => setActivityType(e.target.value)} style={inputStyle}>
          {Object.entries(ACTIVITY_LABELS).filter(([k]) => k !== 'planting').map(([k, v]) => <option key={k} value={k} style={optionStyle}>{v}</option>)}
        </select>
      </Field>
      <Field label="Location">
        <select required value={locationId} onChange={(e) => setLocationId(e.target.value)} style={inputStyle}>
          {summary.locations.map((l) => <option key={l.id} value={l.id} style={optionStyle}>{l.name}</option>)}
        </select>
      </Field>
      {summary.batches.length > 0 && (
        <Field label="Batch (optional)">
          <select value={inventoryId} onChange={(e) => setInventoryId(e.target.value)} style={inputStyle}>
            <option value="" style={optionStyle}>(whole location)</option>
            {summary.batches.map((b) => <option key={b.id} value={b.id} style={optionStyle}>{batchLabel(b)}</option>)}
          </select>
        </Field>
      )}
      <Field label="Date">
        <input type="date" max={today()} value={activityDate} onChange={(e) => setActivityDate(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Seedlings involved (optional)">
        <input type="number" min={0} value={quantityAffected} onChange={(e) => setQuantityAffected(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Notes (optional)">
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. 200 litres, morning" style={inputStyle} />
      </Field>
      <SubmitButton submitting={submitting} label="Save Activity" />
    </form>
  );
}

function SurvivalForm({ summary, submitting, onSubmit }: { summary: NurserySummary; submitting: boolean; onSubmit: Submit }) {
  // Planted batches first — survival is mostly checked after planting.
  const options = [...summary.batches].sort((a, b) => Number(b.status === 'planted') - Number(a.status === 'planted'));
  const [inventoryId, setInventoryId] = useState(options[0]?.id ?? '');
  const [initial, setInitial] = useState(() => String(options[0]?.quantity ?? ''));
  const [alive, setAlive] = useState('');
  const [dead, setDead] = useState('');
  const [observationDate, setObservationDate] = useState(today);
  const [notes, setNotes] = useState('');
  const i = Number(initial), a = Number(alive), d = Number(dead);
  const overCount = alive !== '' && dead !== '' && a + d > i;
  const rate = i > 0 && alive !== '' ? Math.round((a / i) * 10000) / 100 : null;
  return (
    <form style={formStyle} onSubmit={async (e) => {
      e.preventDefault();
      await onSubmit('/api/cfa/survival', {
        inventoryId, observationDate, initialQuantity: i, aliveQuantity: a, deadQuantity: d, notes: optional(notes),
      });
    }}>
      <Field label="Batch">
        <select required value={inventoryId} onChange={(e) => {
          setInventoryId(e.target.value);
          setInitial(String(options.find((b) => b.id === e.target.value)?.quantity ?? ''));
        }} style={inputStyle}>
          {options.map((b) => <option key={b.id} value={b.id} style={optionStyle}>{batchLabel(b)}</option>)}
        </select>
      </Field>
      <Field label="Initial number">
        <input required type="number" min={0} value={initial} onChange={(e) => setInitial(e.target.value)} style={inputStyle} />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Alive">
          <input required type="number" min={0} value={alive} onChange={(e) => setAlive(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Dead">
          <input required type="number" min={0} value={dead} onChange={(e) => setDead(e.target.value)} style={inputStyle} />
        </Field>
      </div>
      {overCount
        ? <p style={{ fontSize: 11.5, color: C.red, margin: '-6px 0 0' }}>Alive plus dead ({(a + d).toLocaleString()}) is more than the initial {i.toLocaleString()}.</p>
        : rate !== null && <p style={{ fontSize: 11.5, color: C.goldLight, margin: '-6px 0 0' }}>Survival: {rate.toFixed(2)}% (calculated by the database when saved)</p>}
      <Field label="Date of check">
        <input type="date" max={today()} value={observationDate} onChange={(e) => setObservationDate(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Notes (optional)">
        <input value={notes} onChange={(e) => setNotes(e.target.value)} style={inputStyle} />
      </Field>
      <SubmitButton submitting={submitting} label="Save Survival Check" disabled={overCount} />
    </form>
  );
}

function TransferForm({ summary, submitting, onSubmit }: { summary: NurserySummary; submitting: boolean; onSubmit: Submit }) {
  const inNursery = summary.batches.filter((b) => b.status === 'in_inventory');
  const [inventoryId, setInventoryId] = useState(inNursery[0]?.id ?? '');
  const batch = inNursery.find((b) => b.id === inventoryId);
  const [quantity, setQuantity] = useState(() => String(inNursery[0]?.quantity ?? ''));
  const [kind, setKind] = useState<'nursery' | 'outside'>('nursery');
  const others = summary.locations.filter((l) => l.name !== batch?.location.name);
  const [toLocationId, setToLocationId] = useState(others[0]?.id ?? '');
  const [destination, setDestination] = useState('');
  const [transferDate, setTransferDate] = useState(today);
  const [notes, setNotes] = useState('');
  const q = Number(quantity);
  const tooMany = !!batch && q > batch.quantity;
  const noTarget = kind === 'nursery' ? !others.length : !destination.trim();
  return (
    <form style={formStyle} onSubmit={async (e) => {
      e.preventDefault();
      await onSubmit('/api/cfa/transfer', {
        inventoryId, quantity: q, transferDate, notes: optional(notes),
        ...(kind === 'nursery' ? { toLocationId } : { destination: destination.trim() }),
      });
    }}>
      <Field label="Batch in the nursery">
        <select required value={inventoryId} onChange={(e) => {
          setInventoryId(e.target.value);
          setQuantity(String(inNursery.find((b) => b.id === e.target.value)?.quantity ?? ''));
        }} style={inputStyle}>
          {inNursery.map((b) => <option key={b.id} value={b.id} style={optionStyle}>{batchLabel(b)}</option>)}
        </select>
      </Field>
      <Field label="Number of seedlings">
        <input required type="number" min={1} max={batch?.quantity} value={quantity} onChange={(e) => setQuantity(e.target.value)} style={inputStyle} />
      </Field>
      {tooMany && <p style={{ fontSize: 11.5, color: C.red, margin: '-6px 0 0' }}>Only {batch!.quantity.toLocaleString()} seedlings are in this batch.</p>}
      <Field label="Where to">
        <select value={kind} onChange={(e) => setKind(e.target.value as 'nursery' | 'outside')} style={inputStyle}>
          <option value="nursery" style={optionStyle}>Another nursery of this CFA</option>
          <option value="outside" style={optionStyle}>Outside the CFA (school, partner…)</option>
        </select>
      </Field>
      {kind === 'nursery' ? (
        others.length ? (
          <Field label="Destination nursery">
            <select required value={toLocationId} onChange={(e) => setToLocationId(e.target.value)} style={inputStyle}>
              {others.map((l) => <option key={l.id} value={l.id} style={optionStyle}>{l.name}</option>)}
            </select>
          </Field>
        ) : <p style={{ fontSize: 11.5, color: C.inkLight, margin: 0 }}>There is no other nursery yet. An admin can add one.</p>
      ) : (
        <Field label="Destination">
          <input required value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. Oloolua Primary School" style={inputStyle} />
        </Field>
      )}
      <Field label="Date">
        <input type="date" max={today()} value={transferDate} onChange={(e) => setTransferDate(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Notes (optional)">
        <input value={notes} onChange={(e) => setNotes(e.target.value)} style={inputStyle} />
      </Field>
      <SubmitButton submitting={submitting} label="Record Transfer" disabled={tooMany || noTarget} />
    </form>
  );
}

const LOSS_LABELS: Record<string, string> = {
  drought: 'Drought', disease: 'Disease', damage: 'Damage (animals, people, weather)', pests: 'Pests', mortality: 'Died (natural)', unknown: 'Unknown',
};

function LossForm({ summary, submitting, onSubmit }: { summary: NurserySummary; submitting: boolean; onSubmit: Submit }) {
  const inNursery = summary.batches.filter((b) => b.status === 'in_inventory');
  const [inventoryId, setInventoryId] = useState(inNursery[0]?.id ?? '');
  const batch = inNursery.find((b) => b.id === inventoryId);
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('drought');
  const [lossDate, setLossDate] = useState(today);
  const [notes, setNotes] = useState('');
  const q = Number(quantity);
  const tooMany = !!batch && q > batch.quantity;
  return (
    <form style={formStyle} onSubmit={async (e) => {
      e.preventDefault();
      await onSubmit('/api/cfa/loss', { inventoryId, quantity: q, reason, lossDate, notes: optional(notes) });
    }}>
      <p style={{ fontSize: 11.5, color: C.inkLight, margin: 0 }}>For seedlings that died in the nursery. After planting, use a survival check.</p>
      <Field label="Batch in the nursery">
        <select required value={inventoryId} onChange={(e) => setInventoryId(e.target.value)} style={inputStyle}>
          {inNursery.map((b) => <option key={b.id} value={b.id} style={optionStyle}>{batchLabel(b)}</option>)}
        </select>
      </Field>
      <Field label="Number lost">
        <input required type="number" min={1} max={batch?.quantity} value={quantity} onChange={(e) => setQuantity(e.target.value)} style={inputStyle} />
      </Field>
      {tooMany && <p style={{ fontSize: 11.5, color: C.red, margin: '-6px 0 0' }}>Only {batch!.quantity.toLocaleString()} seedlings are in this batch.</p>}
      <Field label="Reason">
        <select value={reason} onChange={(e) => setReason(e.target.value)} style={inputStyle}>
          {Object.entries(LOSS_LABELS).map(([k, v]) => <option key={k} value={k} style={optionStyle}>{v}</option>)}
        </select>
      </Field>
      <Field label="Date">
        <input type="date" max={today()} value={lossDate} onChange={(e) => setLossDate(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Notes (optional)">
        <input value={notes} onChange={(e) => setNotes(e.target.value)} style={inputStyle} />
      </Field>
      <SubmitButton submitting={submitting} label="Record Loss" disabled={tooMany} />
    </form>
  );
}
