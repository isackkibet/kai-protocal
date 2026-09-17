'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sprout, Warehouse, Leaf, Tag, HeartPulse, Plus, X, Loader2,
  PackagePlus, ClipboardList, Trees, UserPlus, CheckCircle2,
} from 'lucide-react';
import { usePrivyAuth } from '@/lib/privy-auth';

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
function KPICard({ icon, value, label, color }: { icon: React.ReactNode; value: string; label: string; color: string }) {
  return (
    <div style={{
      borderRadius: 18, padding: '16px 14px', textAlign: 'center',
      background: `linear-gradient(145deg, ${color}10 0%, rgba(10,10,12,0.92) 100%)`,
      border: `1px solid ${color}28`, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }} />
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>{icon}</div>
      <p style={{ fontSize: 22, fontWeight: 900, color, margin: '0 0 3px', letterSpacing: -1 }}>{value}</p>
      <p style={{ fontSize: 9, color: 'rgba(248,248,250,0.40)', margin: 0, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase' }}>{label}</p>
    </div>
  );
}

function ActionButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '11px 13px', borderRadius: 14,
      background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
      color: '#f8f8fa', fontSize: 12, fontWeight: 700, cursor: 'pointer', textAlign: 'left',
    }}>
      {icon} {label}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 13, outline: 'none',
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

  useEffect(() => { load(); }, [load]);
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
      showToast(d.pointsEarned ? `Saved — +${d.pointsEarned} Kai Bar earned!` : 'Saved');
      setModal(null);
      await load();
      return true;
    } catch {
      showToast('Network error — please try again');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !summary) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: 'rgba(248,248,250,0.4)', fontSize: 12 }}>
        <Loader2 className="animate-spin" size={20} color="#10b981" style={{ marginBottom: 8 }} />
        <p>Loading nursery data…</p>
      </div>
    );
  }

  const s = summary?.stats;

  return (
    <div>
      {/* CFA membership — links this account to submissions for points */}
      {authenticated && isMember === false && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14,
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', marginBottom: 16,
        }}>
          <UserPlus size={18} color="#fbbf24" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: '#fff', margin: 0 }}>Join this CFA</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: '2px 0 0' }}>Link your account so planting & survival records you submit earn Kai Bar points.</p>
          </div>
          <button onClick={joinCfa} disabled={joining} style={{
            padding: '8px 14px', borderRadius: 10, border: 'none', cursor: joining ? 'wait' : 'pointer',
            background: 'linear-gradient(135deg,#f59e0b,#b45309)', color: '#fff', fontSize: 11, fontWeight: 800, flexShrink: 0,
          }}>
            {joining ? 'Joining…' : 'Join'}
          </button>
        </div>
      )}
      {authenticated && isMember === true && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12,
          background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)', marginBottom: 16,
        }}>
          <CheckCircle2 size={15} color="#34d399" />
          <p style={{ fontSize: 11, color: '#6ee7b7', margin: 0, fontWeight: 700 }}>You&apos;re a CFA member — your submissions earn Kai Bar points.</p>
        </div>
      )}

      {/* Summary cards */}
      <p className="label-caps" style={{ marginBottom: 12 }}>Nursery Overview</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 9, marginBottom: 18 }}>
        <KPICard icon={<Trees size={18} color="#22c55e" strokeWidth={1.8} />} value={(s?.treesPlanted ?? 0).toLocaleString()} label="Trees Planted" color="#22c55e" />
        <KPICard icon={<Warehouse size={18} color="#10b981" strokeWidth={1.8} />} value={(s?.treesInNursery ?? 0).toLocaleString()} label="In Nursery" color="#10b981" />
        <KPICard icon={<Leaf size={18} color="#a855f7" strokeWidth={1.8} />} value={(s?.speciesAvailable ?? 0).toString()} label="Species Avail." color="#a855f7" />
        <KPICard icon={<Tag size={18} color="#f59e0b" strokeWidth={1.8} />} value={(s?.speciesForSale ?? 0).toString()} label="For Sale" color="#f59e0b" />
        <KPICard icon={<HeartPulse size={18} color="#3b82f6" strokeWidth={1.8} />} value={s?.survivalRate != null ? `${s.survivalRate.toFixed(0)}%` : '—'} label="Survival Rate" color="#3b82f6" />
      </div>

      {/* Action buttons */}
      <p className="label-caps" style={{ marginBottom: 12 }}>Actions</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
        <ActionButton icon={<Sprout size={15} color="#22c55e" />} label="Add Planting Record" onClick={() => setModal('planting')} />
        <ActionButton icon={<PackagePlus size={15} color="#10b981" />} label="Add Inventory" onClick={() => setModal('inventory')} />
        <ActionButton icon={<HeartPulse size={15} color="#3b82f6" />} label="Record Survival" onClick={() => setModal('survival')} />
        <ActionButton icon={<Plus size={15} color="#a855f7" />} label="Add Species" onClick={() => setModal('species')} />
      </div>

      {/* Recent activity */}
      <p className="label-caps" style={{ marginBottom: 12 }}>Recent Activity</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(summary?.recentActivity.length ?? 0) === 0 && (
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>No nursery activity recorded yet.</p>
        )}
        {summary?.recentActivity.map((a) => (
          <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <ClipboardList size={14} color={a.kind === 'planting' ? '#22c55e' : '#10b981'} />
            <span style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{a.label}</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>
              {new Date(a.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>
        ))}
      </div>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 96, left: '50%', transform: 'translateX(-50%)', zIndex: 60,
          padding: '11px 20px', borderRadius: 12, fontSize: 13, fontWeight: 800,
          background: 'rgba(6,6,14,0.92)', color: '#34d399',
          boxShadow: '0 0 0 1px rgba(52,211,153,0.3), 0 10px 30px rgba(0,0,0,0.5)',
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
      style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto', background: '#0b120f', borderRadius: '20px 20px 0 0', border: '1px solid rgba(16,185,129,0.25)', padding: 20 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#fff' }}>{titles[type]}</h3>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
            <X size={15} />
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

function SubmitButton({ submitting, label }: { submitting: boolean; label: string }) {
  return (
    <button type="submit" disabled={submitting} style={{
      marginTop: 6, padding: '12px', borderRadius: 12, border: 'none', cursor: submitting ? 'wait' : 'pointer',
      background: 'linear-gradient(135deg,#10b981,#047857)', color: '#fff', fontSize: 13, fontWeight: 800,
    }}>
      {submitting ? 'Saving…' : label}
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
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
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
    return <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Add a species first before recording a planting.</p>;
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
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <Field label="Species">
        <select required value={speciesId} onChange={(e) => setSpeciesId(e.target.value)} style={inputStyle}>
          {species.map((sp) => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
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
    return <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Add a species first before recording survival.</p>;
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
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <Field label="Species">
        <select required value={speciesId} onChange={(e) => setSpeciesId(e.target.value)} style={inputStyle}>
          {species.map((sp) => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
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
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <Field label="Activity">
        <select value={activityType} onChange={(e) => setActivityType(e.target.value as typeof activityType)} style={inputStyle}>
          <option value="ORDERED">Seedlings ordered</option>
          <option value="PLANTED">Seedlings planted</option>
          <option value="SOLD">Seedlings sold</option>
        </select>
      </Field>
      {species.length > 0 && (
        <Field label="Species (optional)">
          <select value={speciesId} onChange={(e) => setSpeciesId(e.target.value)} style={inputStyle}>
            <option value="">— Unspecified —</option>
            {species.map((sp) => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
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
