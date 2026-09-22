'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sprout, Warehouse, Leaf, Tag, HeartPulse, Plus, X, Loader2,
  PackagePlus, ClipboardList, Trees, UserPlus, CheckCircle2,
} from 'lucide-react';
import { usePrivyAuth } from '@/lib/privy-auth';

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
};
const MONO: React.CSSProperties = { fontFamily: 'var(--font-plex-mono), monospace' };
const SERIF: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const label: React.CSSProperties = { ...MONO, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: C.goldLight, fontWeight: 600, margin: 0 };

// ── Types ────────────────────────────────────────────────────────
interface Species {
  id: string;
  name: string;
  quantityAvailable: number;
  quantityPlanted: number;
  quantityForSale: number;
}

interface NurserySummary {
  stats: {
    treesPlanted: number;
    treesInNursery: number;
    speciesAvailable: number;
    speciesForSale: number;
    survivalRate: number | null;
  };
  recentActivity: { id: string; kind: 'inventory' | 'planting'; label: string; at: string }[];
  species: Species[];
}

type ModalType = 'species' | 'planting' | 'survival' | 'inventory' | null;

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

function ActionTile({ icon, label: l, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="nursery-action" style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '12px 4px',
      background: 'none', border: 'none', color: C.paperDim, fontSize: 13, fontWeight: 600,
      cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
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

const inputStyle: React.CSSProperties = {
  padding: '8px 2px', border: 'none', borderBottom: `1px solid ${C.hairline}`, borderRadius: 0,
  background: 'none', color: C.paper, fontSize: 13.5, outline: 'none', fontFamily: 'inherit',
};

// ── Main component ──────────────────────────────────────────────
export default function NurseryTab() {
  const { authenticated, getAccessToken } = usePrivyAuth();
  const [summary, setSummary] = useState<NurserySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalType>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isMember, setIsMember] = useState<boolean | null>(null);
  const [joining, setJoining] = useState(false);

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
    if (!authenticated) { setIsMember(null); return; }
    try {
      const token = await getAccessToken();
      if (!token) { setIsMember(null); return; }
      const res = await fetch('/api/cfa/join', { headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      setIsMember(!!d.member);
    } catch {
      setIsMember(null);
    }
  }, [authenticated, getAccessToken]);

  // Fetch-on-mount: loads nursery summary on mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);
  // Fetch-on-mount: loads membership status for the signed-in user once ready.
  // getAccessToken awaits Privy auth, so setState happens after an async boundary.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadMembership(); }, [loadMembership]);

  const joinCfa = async () => {
    setJoining(true);
    try {
      const token = await getAccessToken();
      if (!token) return;
      const res = await fetch('/api/cfa/join', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setIsMember(true);
    } finally {
      setJoining(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const submit = async (path: string, body: Record<string, unknown>, needsAuth = true) => {
    setSubmitting(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (needsAuth) {
        const token = await getAccessToken();
        if (token) headers.Authorization = `Bearer ${token}`;
      }
      const res = await fetch(path, { method: 'POST', headers, body: JSON.stringify(body) });
      const d = await res.json();
      if (!res.ok) {
        showToast(d.error ?? 'Something went wrong');
        return false;
      }
      showToast(d.pointsEarned ? `Saved. +${d.pointsEarned} Kai Bar earned!` : 'Saved');
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

  return (
    <div>
      <style>{`.nursery-action:hover { color: ${C.goldLight}; }`}</style>

      {/* CFA membership — links this account to submissions for points */}
      {authenticated && isMember === false && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', marginBottom: 20,
          borderBottom: `1px solid ${C.hairline}`,
        }}>
          <UserPlus size={18} color={C.goldLight} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.paper, margin: 0 }}>Join this CFA</p>
            <p style={{ fontSize: 11.5, color: C.inkLight, margin: '2px 0 0' }}>Link your account so planting & survival records you submit earn Kai Bar points.</p>
          </div>
          <button onClick={joinCfa} disabled={joining} style={{
            padding: '8px 16px', borderRadius: 999, border: 'none', cursor: joining ? 'wait' : 'pointer',
            background: C.gold, color: '#1B1A14', fontSize: 11.5, fontWeight: 700, flexShrink: 0, fontFamily: 'inherit',
          }}>
            {joining ? 'Joining…' : 'Join'}
          </button>
        </div>
      )}
      {authenticated && isMember === true && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <CheckCircle2 size={15} color={C.goldLight} />
          <p style={{ fontSize: 11.5, color: C.goldLight, margin: 0, fontWeight: 600 }}>You&apos;re a CFA member. Your submissions earn Kai Bar points.</p>
        </div>
      )}

      {/* Summary */}
      <p style={{ ...label, marginBottom: 16 }}>Nursery Overview</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px 6px', marginBottom: 28, paddingBottom: 28, borderBottom: `1px solid ${C.hairline}` }}>
        <KPICell icon={<Trees size={16} color="#7DC383" strokeWidth={1.7} />} value={(s?.treesPlanted ?? 0).toLocaleString()} label="Planted" color="#7DC383" />
        <KPICell icon={<Warehouse size={16} color={C.goldLight} strokeWidth={1.7} />} value={(s?.treesInNursery ?? 0).toLocaleString()} label="In Nursery" color={C.goldLight} />
        <KPICell icon={<Leaf size={16} color="#C48FE0" strokeWidth={1.7} />} value={(s?.speciesAvailable ?? 0).toString()} label="Species" color="#C48FE0" />
        <KPICell icon={<Tag size={16} color={C.gold} strokeWidth={1.7} />} value={(s?.speciesForSale ?? 0).toString()} label="For Sale" color={C.gold} />
        <KPICell icon={<HeartPulse size={16} color="#6FA8DC" strokeWidth={1.7} />} value={s?.survivalRate != null ? `${s.survivalRate.toFixed(0)}%` : '—'} label="Survival" color="#6FA8DC" />
      </div>

      {/* Actions */}
      <p style={{ ...label, marginBottom: 8 }}>Actions</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginBottom: 28, paddingBottom: 20, borderBottom: `1px solid ${C.hairline}` }}>
        <ActionTile icon={<Sprout size={16} color="#7DC383" />} label="Add Planting Record" onClick={() => setModal('planting')} />
        <ActionTile icon={<PackagePlus size={16} color={C.goldLight} />} label="Add Inventory" onClick={() => setModal('inventory')} />
        <ActionTile icon={<HeartPulse size={16} color="#6FA8DC" />} label="Record Survival" onClick={() => setModal('survival')} />
        <ActionTile icon={<Plus size={16} color="#C48FE0" />} label="Add Species" onClick={() => setModal('species')} />
      </div>

      {/* Recent activity */}
      <p style={{ ...label, marginBottom: 14 }}>Recent Activity</p>
      {(summary?.recentActivity.length ?? 0) === 0 && (
        <p style={{ fontSize: 12.5, color: C.inkLight }}>No nursery activity recorded yet.</p>
      )}
      {summary?.recentActivity.map((a) => (
        <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `1px solid ${C.hairline}` }}>
          <ClipboardList size={14} color={a.kind === 'planting' ? '#7DC383' : C.goldLight} />
          <span style={{ flex: 1, fontSize: 12.5, color: C.paperDim }}>{a.label}</span>
          <span style={{ ...MONO, fontSize: 10, color: C.inkLight }}>
            {new Date(a.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        </div>
      ))}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 96, left: '50%', transform: 'translateX(-50%)', zIndex: 60,
          padding: '11px 22px', borderRadius: 999, fontSize: 13, fontWeight: 700,
          background: C.bg, border: `1px solid ${C.hairline}`, color: C.goldLight,
        }}>{toast}</div>
      )}

      <AnimatePresence>
        {modal && (
          <NurseryModal
            type={modal}
            species={summary?.species ?? []}
            submitting={submitting}
            onClose={() => setModal(null)}
            onSubmit={submit}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Modal + forms ────────────────────────────────────────────────
function NurseryModal({
  type, species, submitting, onClose, onSubmit,
}: {
  type: Exclude<ModalType, null>;
  species: Species[];
  submitting: boolean;
  onClose: () => void;
  onSubmit: (path: string, body: Record<string, unknown>, needsAuth?: boolean) => Promise<boolean>;
}) {
  const titles: Record<Exclude<ModalType, null>, string> = {
    species: 'Add Species',
    planting: 'Add Planting Record',
    survival: 'Record Survival',
    inventory: 'Add Inventory Activity',
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
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.inkLight, cursor: 'pointer', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        {type === 'species' && <SpeciesForm submitting={submitting} onSubmit={onSubmit} />}
        {type === 'planting' && <PlantingForm species={species} submitting={submitting} onSubmit={onSubmit} />}
        {type === 'survival' && <SurvivalForm species={species} submitting={submitting} onSubmit={onSubmit} />}
        {type === 'inventory' && <InventoryForm species={species} submitting={submitting} onSubmit={onSubmit} />}
      </motion.div>
    </motion.div>
  );
}

function SubmitButton({ submitting, label: l }: { submitting: boolean; label: string }) {
  return (
    <button type="submit" disabled={submitting} style={{
      marginTop: 8, padding: '13px', borderRadius: 999, border: 'none', cursor: submitting ? 'wait' : 'pointer',
      background: C.gold, color: '#1B1A14', fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit',
    }}>
      {submitting ? 'Saving…' : l}
    </button>
  );
}

function SpeciesForm({ submitting, onSubmit }: { submitting: boolean; onSubmit: (p: string, b: Record<string, unknown>, a?: boolean) => Promise<boolean> }) {
  const [name, setName] = useState('');
  const [available, setAvailable] = useState('');
  const [planted, setPlanted] = useState('');
  const [forSale, setForSale] = useState('');

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit('/api/cfa/species', {
          name, quantityAvailable: Number(available) || 0, quantityPlanted: Number(planted) || 0, quantityForSale: Number(forSale) || 0,
        }, false);
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <Field label="Species name">
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Grevillea robusta" style={inputStyle} />
      </Field>
      <Field label="Quantity available">
        <input type="number" min={0} value={available} onChange={(e) => setAvailable(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Quantity already planted">
        <input type="number" min={0} value={planted} onChange={(e) => setPlanted(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Quantity for sale">
        <input type="number" min={0} value={forSale} onChange={(e) => setForSale(e.target.value)} style={inputStyle} />
      </Field>
      <SubmitButton submitting={submitting} label="Add Species" />
    </form>
  );
}

function PlantingForm({ species, submitting, onSubmit }: { species: Species[]; submitting: boolean; onSubmit: (p: string, b: Record<string, unknown>, a?: boolean) => Promise<boolean> }) {
  const [speciesId, setSpeciesId] = useState(species[0]?.id ?? '');
  const [numberPlanted, setNumberPlanted] = useState('');
  const [activity, setActivity] = useState('');
  const [plantedAt, setPlantedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [submittedName, setSubmittedName] = useState('');

  if (species.length === 0) {
    return <p style={{ fontSize: 12.5, color: C.inkLight }}>Add a species first before recording a planting.</p>;
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit('/api/cfa/planting', {
          speciesId, numberPlanted: Number(numberPlanted) || 0, activity: activity || null,
          plantedAt: new Date(plantedAt).toISOString(), submittedName: submittedName || null,
        });
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <Field label="Species">
        <select required value={speciesId} onChange={(e) => setSpeciesId(e.target.value)} style={inputStyle}>
          {species.map((sp) => <option key={sp.id} value={sp.id} style={{ background: C.bg }}>{sp.name}</option>)}
        </select>
      </Field>
      <Field label="Number planted">
        <input required type="number" min={1} value={numberPlanted} onChange={(e) => setNumberPlanted(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Date">
        <input type="date" value={plantedAt} onChange={(e) => setPlantedAt(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Activity / initiative (optional)">
        <input value={activity} onChange={(e) => setActivity(e.target.value)} placeholder="e.g. World Environment Day" style={inputStyle} />
      </Field>
      <Field label="Submitted by (if not signed in)">
        <input value={submittedName} onChange={(e) => setSubmittedName(e.target.value)} placeholder="Person or group name" style={inputStyle} />
      </Field>
      <SubmitButton submitting={submitting} label="Save Planting Record" />
    </form>
  );
}

function SurvivalForm({ species, submitting, onSubmit }: { species: Species[]; submitting: boolean; onSubmit: (p: string, b: Record<string, unknown>, a?: boolean) => Promise<boolean> }) {
  const [speciesId, setSpeciesId] = useState(species[0]?.id ?? '');
  const [numberPlanted, setNumberPlanted] = useState('');
  const [numberSurviving, setNumberSurviving] = useState('');
  const [observedAt, setObservedAt] = useState(() => new Date().toISOString().slice(0, 10));

  if (species.length === 0) {
    return <p style={{ fontSize: 12.5, color: C.inkLight }}>Add a species first before recording survival.</p>;
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit('/api/cfa/survival', {
          speciesId, numberPlanted: Number(numberPlanted) || 0, numberSurviving: Number(numberSurviving) || 0,
          observedAt: new Date(observedAt).toISOString(),
        });
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <Field label="Species">
        <select required value={speciesId} onChange={(e) => setSpeciesId(e.target.value)} style={inputStyle}>
          {species.map((sp) => <option key={sp.id} value={sp.id} style={{ background: C.bg }}>{sp.name}</option>)}
        </select>
      </Field>
      <Field label="Number planted (of this batch)">
        <input required type="number" min={1} value={numberPlanted} onChange={(e) => setNumberPlanted(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Number surviving">
        <input required type="number" min={0} value={numberSurviving} onChange={(e) => setNumberSurviving(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Observation date">
        <input type="date" value={observedAt} onChange={(e) => setObservedAt(e.target.value)} style={inputStyle} />
      </Field>
      <SubmitButton submitting={submitting} label="Save Survival Record" />
    </form>
  );
}

function InventoryForm({ species, submitting, onSubmit }: { species: Species[]; submitting: boolean; onSubmit: (p: string, b: Record<string, unknown>, a?: boolean) => Promise<boolean> }) {
  const [activityType, setActivityType] = useState<'ORDERED' | 'PLANTED' | 'SOLD'>('ORDERED');
  const [speciesId, setSpeciesId] = useState(species[0]?.id ?? '');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit('/api/cfa/inventory', {
          activityType, speciesId: speciesId || null, quantity: Number(quantity) || 0, note: note || null,
        });
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <Field label="Activity">
        <select value={activityType} onChange={(e) => setActivityType(e.target.value as typeof activityType)} style={inputStyle}>
          <option value="ORDERED" style={{ background: C.bg }}>Seedlings ordered</option>
          <option value="PLANTED" style={{ background: C.bg }}>Seedlings planted</option>
          <option value="SOLD" style={{ background: C.bg }}>Seedlings sold</option>
        </select>
      </Field>
      {species.length > 0 && (
        <Field label="Species (optional)">
          <select value={speciesId} onChange={(e) => setSpeciesId(e.target.value)} style={inputStyle}>
            <option value="" style={{ background: C.bg }}>(unspecified)</option>
            {species.map((sp) => <option key={sp.id} value={sp.id} style={{ background: C.bg }}>{sp.name}</option>)}
          </select>
        </Field>
      )}
      <Field label="Quantity">
        <input required type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Note (optional)">
        <input value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle} />
      </Field>
      <SubmitButton submitting={submitting} label="Save Inventory Entry" />
    </form>
  );
}
