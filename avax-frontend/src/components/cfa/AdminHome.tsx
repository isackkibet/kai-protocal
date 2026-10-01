'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Anchor, ArrowRight, Check, ClipboardCheck, Leaf, MapPin, PackagePlus, UserCheck, Users } from 'lucide-react';
import { usePrivyAuth } from '@/lib/auth/privy-auth';

/**
 * Admin home for /nursery: one checklist that answers "what do I do next?".
 * Each task knows from live data whether it is done, and the first open task
 * is shown big with a single button. Setup tasks come first, then the
 * day-to-day ones (records to review, records to anchor).
 */

const C = {
  gold: '#C89B3C', goldLight: '#E4C878', paper: '#F6F2E7', paperDim: '#EFE9D9', inkLight: '#9BA396',
  hairline: 'rgba(200,155,60,0.14)', green: '#7DC383', panel: 'rgba(200,155,60,0.06)',
};
const MONO: React.CSSProperties = { fontFamily: 'var(--font-plex-mono), monospace' };

export type AdminAction = 'species' | 'location' | 'batch' | 'team';

interface Counts { species: number; locations: number; batches: number }
interface Live { teamOk: boolean; teamNote: string; notSignedIn: number; toReview: number; toAnchor: number; pendingBatch: boolean }

interface Task {
  id: string;
  icon: React.ReactNode;
  title: string;
  why: string;
  done: boolean;
  /** Shown on the right of a row: "Done", a count, or a short state. */
  state: string;
  button: string;
  run: () => void;
  /** Day-to-day tasks are never "done" forever; they show what is waiting. */
  ongoing?: boolean;
}

export default function AdminHome({ counts, onAction }: { counts: Counts; onAction: (a: AdminAction) => void }) {
  const { getAccessToken } = usePrivyAuth();
  const [live, setLive] = useState<Live | null>(null);

  const load = useCallback(async () => {
    const token = await getAccessToken().catch(() => null);
    const h: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    const [members, queue, anchor] = await Promise.all([
      fetch('/api/cfa/members', { headers: h }).then((r) => r.json()).catch(() => ({})),
      fetch('/api/mrv/queue', { headers: h }).then((r) => r.json()).catch(() => ({})),
      fetch('/api/mrv/anchor').then((r) => r.json()).catch(() => ({})),
    ]);
    const list: { role: string; status: string; hasSignedIn: boolean }[] = members.members ?? [];
    const active = list.filter((m) => m.status === 'active');
    const checkers = active.filter((m) => m.role === 'verifier' || m.role === 'admin').length;
    setLive({
      // Records need someone other than the person who recorded them.
      teamOk: checkers >= 2,
      teamNote: checkers >= 2 ? `${checkers} people can check records` : 'Only you can check records',
      notSignedIn: list.filter((m) => !m.hasSignedIn).length,
      toReview: (queue.queue ?? []).length,
      toAnchor: anchor.verifiedWaiting ?? 0,
      pendingBatch: (anchor.batches ?? []).some((b: { status: string }) => b.status === 'PENDING'),
    });
  }, [getAccessToken]);

  // Fetch-on-mount, and again whenever the nursery counts change.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load, counts.species, counts.locations, counts.batches]);

  const go = (href: string) => () => { window.location.href = href; };
  const tasks: Task[] = [
    {
      id: 'species', icon: <Leaf size={16} />, title: 'Add the trees you grow',
      why: 'Members choose from this list when they record seedlings, e.g. Croton (Croton megalocarpus).',
      done: counts.species > 0, state: counts.species > 0 ? `${counts.species} species` : 'Not started',
      button: 'Add a species', run: () => onAction('species'),
    },
    {
      id: 'location', icon: <MapPin size={16} />, title: 'Add a nursery location',
      why: 'Where seedlings are kept, e.g. “Main Nursery”. Every batch belongs to one.',
      done: counts.locations > 0, state: counts.locations > 0 ? `${counts.locations} location${counts.locations === 1 ? '' : 's'}` : 'Not started',
      button: 'Add a location', run: () => onAction('location'),
    },
    {
      id: 'team', icon: <UserCheck size={16} />, title: 'Choose who checks records',
      why: 'Nobody can approve their own work. You need at least two people who are admin or verifier.',
      done: !!live?.teamOk, state: live ? live.teamNote : '…',
      button: 'Open the team list', run: () => onAction('team'),
    },
    {
      id: 'batch', icon: <PackagePlus size={16} />, title: 'Record the first seedlings',
      why: 'A batch is one group of one species, e.g. 500 Croton in Main Nursery.',
      done: counts.batches > 0, state: counts.batches > 0 ? `${counts.batches} batch${counts.batches === 1 ? '' : 'es'}` : 'Not started',
      button: 'Add seedlings', run: () => onAction('batch'),
    },
    {
      id: 'review', icon: <ClipboardCheck size={16} />, title: 'Check records from others',
      why: 'Plantings and survival checks wait here until someone else approves them.',
      done: (live?.toReview ?? 0) === 0, ongoing: true,
      state: live ? (live.toReview ? `${live.toReview} waiting` : 'Nothing waiting') : '…',
      button: 'Open review', run: go('/mrv#review'),
    },
    {
      id: 'anchor', icon: <Anchor size={16} />, title: 'Put approved records on Avalanche',
      why: 'One wallet signature saves proof of all approved records. Needs a little Fuji AVAX.',
      done: (live?.toAnchor ?? 0) === 0 && !live?.pendingBatch, ongoing: true,
      state: live ? (live.pendingBatch ? 'Waiting for your signature' : live.toAnchor ? `${live.toAnchor} ready` : 'Nothing ready') : '…',
      button: 'Open anchoring', run: go('/mrv#anchor'),
    },
  ];

  const setup = tasks.filter((t) => !t.ongoing);
  const setupDone = setup.filter((t) => t.done).length;
  const next = tasks.find((t) => !t.done);

  return (
    <section style={{ marginBottom: 28, paddingBottom: 24, borderBottom: `1px solid ${C.hairline}` }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <p style={{ ...MONO, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: C.goldLight, fontWeight: 600, margin: 0 }}>Your admin checklist</p>
        <p style={{ fontSize: 11.5, color: C.inkLight, margin: 0 }}>Setup {setupDone} of {setup.length} done</p>
      </div>

      {/* Progress bar for the one-time setup */}
      <div style={{ height: 4, borderRadius: 4, background: C.hairline, marginBottom: 18, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(setupDone / setup.length) * 100}%`, background: C.green, transition: 'width .4s' }} />
      </div>

      {/* The one thing to do now */}
      {next ? (
        <div style={{ padding: 16, borderRadius: 14, border: `1px solid ${C.gold}`, background: C.panel, marginBottom: 16 }}>
          <p style={{ fontSize: 11, color: C.goldLight, margin: '0 0 4px', fontWeight: 700 }}>DO THIS NEXT</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: C.paper, margin: '0 0 4px' }}>{next.title}</p>
          <p style={{ fontSize: 12.5, color: C.inkLight, margin: '0 0 12px', lineHeight: 1.55 }}>{next.why}</p>
          <button onClick={next.run} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 999, border: 'none', background: C.gold, color: '#1B1A14', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            {next.button} <ArrowRight size={14} />
          </button>
        </div>
      ) : (
        <div style={{ padding: 14, borderRadius: 14, background: 'rgba(125,195,131,0.1)', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
          <Check size={18} color={C.green} />
          <p style={{ fontSize: 13, color: C.paperDim, margin: 0 }}>All set. Nothing is waiting for you. Members can now record their work below.</p>
        </div>
      )}

      {/* Every task, with its state */}
      <div>
        {tasks.map((t) => (
          <button key={t.id} onClick={t.run} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 2px', background: 'none', border: 'none',
            borderBottom: `1px solid ${C.hairline}`, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', color: C.paperDim,
          }}>
            <span style={{
              width: 26, height: 26, borderRadius: 999, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              ...(t.done ? { background: C.green, color: '#0E2418' } : { border: `1px solid ${t === next ? C.gold : C.hairline}`, color: t === next ? C.goldLight : C.inkLight }),
            }}>{t.done && !t.ongoing ? <Check size={14} /> : t.icon}</span>
            <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: t === next ? 700 : 500 }}>{t.title}</span>
            <span style={{ ...MONO, fontSize: 10.5, flexShrink: 0, color: t.done ? C.green : t === next ? C.goldLight : C.inkLight }}>{t.state}</span>
          </button>
        ))}
      </div>

      {live && live.notSignedIn > 0 && (
        <p style={{ fontSize: 11.5, color: C.inkLight, margin: '12px 0 0', display: 'flex', gap: 6, alignItems: 'center' }}>
          <Users size={13} /> {live.notSignedIn} person{live.notSignedIn === 1 ? ' has' : 's have'} been added but not signed in yet. They become active when they sign in on this page with that email.
        </p>
      )}
      <p style={{ fontSize: 11.5, color: C.inkLight, margin: '10px 0 0' }}>
        Records, photos and checks are under <Link href="/mrv" style={{ color: C.goldLight }}>Verification desk</Link>. Team, nurseries and CFA details are under “Manage the CFA” below.
      </p>
    </section>
  );
}
