'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRightLeft, BarChart3, BookOpen, Camera, ChevronDown, CloudOff, Database, Droplets, FileText, FolderOpen, HeartPulse, HelpCircle, Home,
  Image as ImageIcon, LayoutDashboard, Leaf, Menu, MessageSquare, Mic, MicOff, PackagePlus, Paperclip, Plus, Send, Settings, ShieldCheck,
  Skull, Sprout, Trash2, Trees, Wrench, X,
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { usePrivyAuth } from '@/lib/auth/privy-auth';
import { formatChat } from '@/lib/ai/formatChat';
import { recentHistory } from '@/lib/ai/client';
import { isNurseryPlan, type NurseryPlan } from '@/lib/nursery/agent-logic';
import { MAX_EVIDENCE_BYTES } from '@/lib/nursery/evidence-rules';
import { dHash } from '@/lib/workspace/image-hash';
import {
  deleteThread, groupThreads, loadQueue, loadThreads, newThreadId, removeFromQueue, saveThread, type Thread,
} from '@/lib/workspace/storage';
import Orb, { toolLabel, type OrbState } from './Orb';
import { NurseryModal, type ModalType, type NurserySummary } from '@/components/cfa/NurseryTab';
import { AnimatePresence } from 'framer-motion';
import RecordCard, { type SavedResult } from './RecordCard';

/**
 * Kanuvari AI workspace (Guardian Setup & AI Architecture, Part 2): sidebar,
 * the AI workspace with the orb, and the universal input bar. The AI is the
 * interface; records are saved only by the user confirming a card, through
 * the normal /api/cfa routes (permissions, validation and audit there).
 */

const C = {
  bg: '#0E2418', panel: '#12301F', gold: '#C89B3C', goldLight: '#E4C878', paper: '#F6F2E7', paperDim: '#EFE9D9',
  inkLight: '#9BA396', hairline: 'rgba(200,155,60,0.16)', red: '#E88C7D', green: '#7DC383',
};

interface Msg { role: 'user' | 'ai'; text: string; at: number; tools?: string[]; plans?: NurseryPlan[]; error?: boolean }
interface Attachment { id: string; file: File; kind: 'evidence' | 'text' | 'unsupported'; text?: string; preview?: string; note?: string }
const EMPTY_SUMMARY: NurserySummary = { stats: null, species: [], locations: [], batches: [], activities: [] };

/** Instant nursery actions: the same forms as /nursery, no AI round-trip. */
const QUICK: { type: Exclude<ModalType, null>; label: string; icon: React.ReactNode; needs: 'setup' | 'stock' | 'any' }[] = [
  { type: 'batch', label: 'Add seedlings', icon: <PackagePlus size={15} />, needs: 'setup' },
  { type: 'plant', label: 'Plant', icon: <Trees size={15} />, needs: 'stock' },
  { type: 'activity', label: 'Nursery work', icon: <Droplets size={15} />, needs: 'setup' },
  { type: 'survival', label: 'Survival check', icon: <HeartPulse size={15} />, needs: 'any' },
  { type: 'transfer', label: 'Transfer', icon: <ArrowRightLeft size={15} />, needs: 'stock' },
  { type: 'loss', label: 'Record loss', icon: <Skull size={15} />, needs: 'stock' },
];

/** Event-time clock (kept out of render). */
const nowMs = () => Date.now();

/** Allowlist from the design (§2.2). Photos and PDFs become evidence; CSV/TXT are read into the message. */
const ACCEPT = '.pdf,.docx,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.webp,.mp4,.mov,.webm,.mp3,.wav,.m4a';
function classify(file: File): Attachment['kind'] {
  const n = file.name.toLowerCase();
  if (/\.(jpe?g|png|webp|pdf)$/.test(n)) return 'evidence';
  if (/\.(csv|txt)$/.test(n)) return 'text';
  return 'unsupported';
}

const STARTERS = [
  { label: 'Record seedlings received', q: 'We received seedlings today' },
  { label: 'Record a planting', q: 'We planted seedlings today' },
  { label: 'How many seedlings do we have?', q: 'How many seedlings do we have, by species?' },
  { label: 'What happened this month?', q: 'Show me what happened in the nursery this month' },
];

// Web Speech API (not in every TS lib.dom)
interface Recognizer { lang: string; interimResults: boolean; continuous: boolean; onresult: ((e: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null; start: () => void; stop: () => void }
function getRecognizer(): (new () => Recognizer) | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognizer; webkitSpeechRecognition?: new () => Recognizer };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}


function SideLink({ href, icon, label, soon }: { href: string; icon: React.ReactNode; label: string; soon?: boolean }) {
  return (
    <Link href={href} className="kv-nav" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, color: C.paperDim, textDecoration: 'none', fontSize: 13.5 }}>
      {icon}<span style={{ flex: 1 }}>{label}</span>{soon && <span style={{ fontSize: 11.5, color: C.inkLight, border: `1px solid ${C.hairline}`, borderRadius: 999, padding: '1px 6px' }}>beta</span>}
    </Link>
  );
}

/** A sidebar item that puts a starter sentence in the input (the user still edits and sends it). */
function PromptButton({ q, icon, label, onPick }: { q: string; icon: React.ReactNode; label: string; onPick: (q: string) => void }) {
  return (
    <button onClick={() => onPick(q)} className="kv-nav" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, color: C.paperDim, background: 'none', border: 'none', fontSize: 13.5, cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'inherit' }}>
      {icon}{label}
    </button>
  );
}

/**
 * `embedded`: the Nursery AI inside /nursery — no sidebar, a fixed-height
 * panel, its own chat history, and answers kept to nursery work (the main
 * KAI assistant stays everywhere else).
 */
export default function Workspace({ embedded = false, fullScreen = false }: { embedded?: boolean; fullScreen?: boolean } = {}) {
  const { authenticated, getAccessToken, privyUserId, name, signInWithGoogle } = usePrivyAuth();
  const { address } = useAccount();
  const userKey = `${privyUserId ?? 'guest'}${embedded ? ':nursery' : ''}`;

  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadId, setThreadId] = useState<string>(() => newThreadId());
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [orb, setOrb] = useState<OrbState>('idle');
  const [orbDetail, setOrbDetail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingCards, setPendingCards] = useState(0);
  const [project, setProject] = useState<string>('');
  const [summary, setSummary] = useState<NurserySummary>(EMPTY_SUMMARY);
  const [quick, setQuick] = useState<Exclude<ModalType, null> | null>(null);
  const [quickSaving, setQuickSaving] = useState(false);
  const [isMember, setIsMember] = useState<boolean | null>(null);
  const [lang, setLang] = useState<'en' | 'sw'>('en');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [plusOpen, setPlusOpen] = useState(false);
  const [gpsConsent, setGpsConsent] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [online, setOnline] = useState(true);
  const [queued, setQueued] = useState(0);
  const [listening, setListening] = useState(false);
  const [clock] = useState(nowMs);
  const recRef = useRef<Recognizer | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const cameraRef = useRef<HTMLInputElement | null>(null);
  /** Photos/PDFs sent with the message that produced the current draft; attached once it is saved. */
  const [draftFiles, setDraftFiles] = useState<Attachment[]>([]);

  const authHeader = useCallback(async (): Promise<Record<string, string>> => {
    const t = await getAccessToken().catch(() => null);
    return t ? { Authorization: `Bearer ${t}` } : {};
  }, [getAccessToken]);

  // Load chats for this person, the nursery's species and projects, and the offline queue.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThreads(loadThreads(userKey));
    setQueued(loadQueue().length);
    fetch('/api/cfa/nursery/summary').then((r) => r.json()).then((d) => setSummary({ ...EMPTY_SUMMARY, ...d })).catch(() => {});
    try { const p = localStorage.getItem('kanuvari.project'); if (p) setProject(p); const l = localStorage.getItem('kanuvari.lang'); if (l === 'sw') setLang('sw'); } catch { /* optional */ }
  }, [userKey]);

  // Scroll the conversation box only (scrollIntoView would also scroll the page around an embedded panel).
  useEffect(() => { const box = scrollRef.current; if (box && msgs.length) box.scrollTop = box.scrollHeight; }, [msgs, orb]);

  // Offline tolerance: queue confirmed records; send them when the signal is back.
  const flushQueue = useCallback(async () => {
    const items = loadQueue();
    for (const q of items) {
      try {
        const res = await fetch(q.endpoint, { method: q.method, headers: { 'Content-Type': 'application/json', ...(await authHeader()) }, body: JSON.stringify(q.body) });
        // A 4xx will never succeed on retry (e.g. batch already planted): drop it and tell the user.
        if (res.ok || (res.status >= 400 && res.status < 500)) {
          removeFromQueue(q.id);
          const d = await res.json().catch(() => ({}));
          setMsgs((m) => [...m, { role: 'ai', at: nowMs(), text: res.ok ? `Sent the record saved offline: ${q.summary}` : `A record saved offline could not be saved: ${d.error ?? res.status}. (${q.summary})`, error: !res.ok }]);
        }
      } catch { break; }
    }
    setQueued(loadQueue().length);
  }, [authHeader]);
  useEffect(() => {
    const update = () => { setOnline(navigator.onLine); if (navigator.onLine) void flushQueue(); };
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, [flushQueue]);

  const refreshSummary = useCallback(async () => {
    const d = await fetch('/api/cfa/nursery/summary').then((r) => r.json()).catch(() => null);
    if (d) setSummary({ ...EMPTY_SUMMARY, ...d });
  }, []);

  // Is this person an active CFA member (the forms need it)?
  useEffect(() => {
    if (!authenticated) return;
    let live = true;
    (async () => {
      const d = await fetch('/api/cfa/join', { headers: await authHeader() }).then((r) => r.json()).catch(() => ({}));
      if (live) setIsMember(d.member?.status === 'active');
    })();
    return () => { live = false; };
  }, [authenticated, authHeader]);

  const say = (text: string, error = false) => setMsgs((m) => [...m, { role: 'ai', at: nowMs(), text, error }]);

  /** Opens a quick form, or explains in one line why it can't be used yet. */
  const openQuick = (q: (typeof QUICK)[number]) => {
    if (!authenticated) { say('Sign in with Google first (link at the top), then join the CFA on /nursery.'); return; }
    if (isMember === false) { say('Join the CFA first: open /nursery and press “Join Oloolua CFA”.'); return; }
    const setupDone = summary.species.length > 0 && summary.locations.length > 0;
    if (!setupDone) { say('A CFA admin must first add the species you grow and a nursery group (on /nursery).'); return; }
    if (q.needs === 'stock' && !summary.batches.some((b) => b.status === 'in_inventory')) { say('There are no seedlings in the nursery yet. Use “Add seedlings” first.'); return; }
    if (q.needs === 'any' && !summary.batches.length) { say('There are no batches yet. Use “Add seedlings” first.'); return; }
    setQuick(q.type);
  };

  /** Same save path as /nursery: the /api/cfa route checks membership, validates and audits. */
  const quickSubmit = async (path: string, body: Record<string, unknown>) => {
    if (!navigator.onLine) {
      const { enqueue } = await import('@/lib/workspace/storage');
      enqueue({ method: 'POST', endpoint: path, body, summary: `${QUICK.find((x) => x.type === quick)?.label ?? 'Record'} (from quick action)` });
      setQueued(loadQueue().length);
      setQuick(null);
      say('No signal: saved on this phone and will be sent when you are back online.');
      return true;
    }
    setQuickSaving(true);
    try {
      const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(await authHeader()) }, body: JSON.stringify(body) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { say(d.error ?? `Could not save (error ${res.status}).`, true); return false; }
      const id = (d.batch ?? d.activity ?? d.observation)?.id as string | undefined;
      const label = QUICK.find((x) => x.type === quick)?.label ?? 'Record';
      say(`✓ ${label} saved${id ? ` as record **${id.replace(/-/g, '').slice(0, 6).toUpperCase()}**` : ''}.${d.pointsEarned ? ` +${d.pointsEarned} Kai Bar points.` : ''}${d.mrvRecord ? ' It is now waiting for a verifier.' : ''}`);
      setQuick(null);
      await refreshSummary();
      return true;
    } catch {
      say('Network problem. Nothing was saved; try again.', true);
      return false;
    } finally {
      setQuickSaving(false);
    }
  };

  /** Instant numbers from the database, no AI. */
  const showNumbers = () => {
    const st = summary.stats;
    const bySpecies = new Map<string, { available: number; planted: number }>();
    for (const b of summary.batches) {
      const e = bySpecies.get(b.species.commonName) ?? { available: 0, planted: 0 };
      if (b.status === 'in_inventory') e.available += b.quantity;
      if (b.status === 'planted') e.planted += b.quantity;
      bySpecies.set(b.species.commonName, e);
    }
    const lines = [...bySpecies].map(([sp, e]) => `- **${sp}**: ${e.available.toLocaleString()} in the nursery, ${e.planted.toLocaleString()} planted`);
    say(st
      ? `**Nursery numbers**\n- Seedlings recorded: **${st.totalSeedlings.toLocaleString()}** (${st.inNursery.toLocaleString()} in the nursery, ${st.planted.toLocaleString()} planted)\n- Species: ${st.speciesCount} · Activities logged: ${st.activityCount}\n- Survival: ${st.avgSurvivalPct != null ? `${st.avgSurvivalPct.toFixed(0)}%` : 'no checks yet'}${lines.length ? `\n\n${lines.join('\n')}` : ''}`
      : 'No nursery data yet.');
  };

  const persist = useCallback((next: Msg[]) => {
    if (!next.length) return;
    const firstUser = next.find((m) => m.role === 'user')?.text ?? 'New chat';
    const t: Thread = {
      id: threadId, title: firstUser.slice(0, 60), project: project || null, updatedAt: Date.now(),
      messages: next.filter((m) => m.text).map((m) => ({ role: m.role, text: m.text, at: m.at, tools: m.tools })),
    };
    saveThread(userKey, t);
    setThreads(loadThreads(userKey));
  }, [threadId, project, userKey]);

  const openThread = (t: Thread) => {
    setThreadId(t.id);
    setMsgs(t.messages.map((m) => ({ ...m })));
    if (t.project) setProject(t.project);
    setSidebarOpen(false);
  };
  const newChat = () => { setThreadId(newThreadId()); setMsgs([]); setAttachments([]); setSidebarOpen(false); };

  // ── attachments ──
  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    const next: Attachment[] = [];
    for (const file of Array.from(files).slice(0, 5)) {
      const kind = classify(file);
      const a: Attachment = { id: newThreadId(), file, kind };
      if (kind === 'evidence') {
        if (file.size > MAX_EVIDENCE_BYTES && !file.type.startsWith('image/')) a.note = 'Larger than 3 MB: it will not be saved.';
        if (file.type.startsWith('image/')) a.preview = URL.createObjectURL(file);
      } else if (kind === 'text') {
        a.text = (await file.text()).slice(0, 20_000);
      } else {
        a.note = 'Kanuvari cannot read this type yet (Word, Excel, video, audio). Describe it in words, or attach a photo or PDF.';
      }
      next.push(a);
    }
    setAttachments((x) => [...x, ...next]);
    setPlusOpen(false);
  };
  const removeAttachment = (id: string) => setAttachments((x) => { const a = x.find((y) => y.id === id); if (a?.preview) URL.revokeObjectURL(a.preview); return x.filter((y) => y.id !== id); });

  /** After a record is saved, attach the photos/PDFs from this message as its evidence. */
  const attachEvidence = useCallback(async (saved: SavedResult, files: Attachment[]) => {
    if (!saved.entityId || !saved.entityType || !['seedling_inventory', 'nursery_activities', 'survival_observations'].includes(saved.entityType)) return;
    let position: GeolocationPosition | null = null;
    if (gpsConsent && 'geolocation' in navigator) {
      position = await new Promise((resolve) => navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), { timeout: 8000, maximumAge: 60_000 }));
    }
    for (const a of files.filter((f) => f.kind === 'evidence')) {
      let file = a.file;
      if (file.type.startsWith('image/') && file.size > 2.5 * 1024 * 1024) {
        const bmp = await createImageBitmap(file);
        const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
        const cv = document.createElement('canvas'); cv.width = Math.round(bmp.width * scale); cv.height = Math.round(bmp.height * scale);
        cv.getContext('2d')!.drawImage(bmp, 0, 0, cv.width, cv.height);
        const blob: Blob = await new Promise((r, j) => cv.toBlob((b) => (b ? r(b) : j(new Error('encode'))), 'image/jpeg', 0.82));
        file = new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
      }
      if (file.size > MAX_EVIDENCE_BYTES) continue;
      const form = new FormData();
      form.append('file', file);
      form.append('entityType', saved.entityType);
      form.append('entityId', saved.entityId);
      form.append('capturedAt', new Date(a.file.lastModified || Date.now()).toISOString());
      const h = await dHash(file);
      if (h) form.append('dhash', h);
      if (position) {
        form.append('gpsConsent', 'yes');
        form.append('latitude', String(position.coords.latitude));
        form.append('longitude', String(position.coords.longitude));
        form.append('accuracy', String(position.coords.accuracy));
      }
      await fetch('/api/cfa/evidence', { method: 'POST', body: form, headers: await authHeader() }).catch(() => {});
    }
  }, [gpsConsent, authHeader]);

  // ── voice: speech to an editable transcript; never sent automatically ──
  const toggleMic = () => {
    const R = getRecognizer();
    if (!R) { setMsgs((m) => [...m, { role: 'ai', at: nowMs(), text: 'Voice input is not supported in this browser. Try Chrome on Android.', error: true }]); return; }
    if (listening) { recRef.current?.stop(); return; }
    const rec = new R();
    rec.lang = lang === 'sw' ? 'sw-KE' : 'en-KE';
    rec.interimResults = true;
    rec.continuous = false;
    const base = input ? `${input.trim()} ` : '';
    rec.onresult = (e) => setInput(base + Array.from(e.results).map((r) => r[0].transcript).join(' '));
    rec.onend = () => { setListening(false); setOrb('idle'); };
    rec.onerror = () => { setListening(false); setOrb('idle'); };
    recRef.current = rec;
    setListening(true);
    setOrb('listening');
    rec.start();
  };

  // ── send ──
  const send = async (override?: string) => {
    const text = (override ?? input).trim();
    const readable = attachments.filter((a) => a.kind === 'text' && a.text);
    if ((!text && !readable.length) || busy) return;
    if (!online) { setMsgs((m) => [...m, { role: 'ai', at: nowMs(), text: 'You are offline. The AI needs a signal; records you already confirmed are kept and sent later.', error: true }]); return; }

    const sentFiles = attachments;
    const fileNote = sentFiles.filter((a) => a.kind === 'evidence').map((a) => a.file.name);
    const message = [
      text || 'Please read the attached file.',
      ...readable.map((a) => `\n[Attached file ${a.file.name}]\n${a.text}`),
      fileNote.length ? `\n(The user attached ${fileNote.join(', ')} as evidence for the next record.)` : '',
    ].join('');
    const before = msgs;
    const userMsg: Msg = { role: 'user', at: nowMs(), text: text || `Attached ${sentFiles.map((a) => a.file.name).join(', ')}` };
    const aiMsg: Msg = { role: 'ai', at: nowMs(), text: '', tools: [], plans: [] };
    setMsgs([...before, userMsg, aiMsg]);
    setInput('');
    setBusy(true);
    setOrb('thinking');
    setOrbDetail(null);
    const files = attachments;
    setAttachments([]);
    setDraftFiles(files);

    const update = (fn: (m: Msg) => Msg) => setMsgs((all) => { const c = [...all]; c[c.length - 1] = fn(c[c.length - 1]); return c; });
    try {
      const res = await fetch('/api/workspace/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
        body: JSON.stringify({ message, history: recentHistory(before), project: project || undefined, wallet: address, language: lang, scope: embedded ? 'nursery' : undefined }),
      });
      if (!res.ok || !res.body) throw new Error(String(res.status));
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split('\n\n');
        buf = parts.pop() ?? '';
        for (const p of parts) {
          if (!p.startsWith('data:')) continue;
          let e: { status?: string; tool?: string; plan?: unknown; token?: string; done?: boolean; tools?: string[]; error?: string };
          try { e = JSON.parse(p.slice(5).trim()); } catch { continue; }
          if (e.tool) { setOrb('tool'); setOrbDetail(toolLabel(e.tool)); update((m) => ({ ...m, tools: [...(m.tools ?? []), e.tool!] })); }
          if (e.plan && isNurseryPlan(e.plan)) { const plan = e.plan; update((m) => ({ ...m, plans: [...(m.plans ?? []), plan] })); setPendingCards((n) => n + 1); }
          if (typeof e.token === 'string') { setOrb('speaking'); update((m) => ({ ...m, text: m.text + e.token })); }
          if (e.error) update((m) => ({ ...m, text: e.error!, error: true }));
          if (e.done) setMsgs((all) => { persist(all); return all; });
        }
      }
    } catch {
      update((m) => ({ ...m, text: 'Could not reach Kanuvari AI. Check your connection and try again. Nothing was saved.', error: true }));
    } finally {
      setBusy(false);
      setOrb((s) => (s === 'listening' ? s : 'idle'));
      setOrbDetail(null);
    }
  };
  // A draft waiting for review dims the orb ("Review this record before saving").
  const shownOrb: OrbState = pendingCards > 0 && !busy && orb === 'idle' ? 'confirm' : orb;

  const groups = groupThreads(threads, new Date(clock));
  const pick = (q: string) => { setInput(q); setSidebarOpen(false); };
  const sectionLabel = (t: string) => <p style={{ fontSize: 12, letterSpacing: 1.3, textTransform: 'uppercase', color: C.goldLight, fontWeight: 700, margin: '16px 10px 4px' }}>{t}</p>;

  const sidebar = (
    <nav aria-label="Kanuvari" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '14px 10px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px 6px' }}>
        <Sprout size={20} color={C.goldLight} />
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: C.paper }}>Kanuvari</p>
          <p style={{ margin: 0, fontSize: 12.5, color: C.inkLight }}>by Kaibar Nuvari</p>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="kv-mobile-only" aria-label="Close menu" style={{ background: 'none', border: 'none', color: C.inkLight, cursor: 'pointer' }}><X size={18} /></button>
      </div>
      <button onClick={newChat} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 4px', padding: '10px 12px', borderRadius: 12, border: `1px solid ${C.gold}`, background: 'none', color: C.goldLight, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
        <Plus size={15} /> New chat
      </button>

      {sectionLabel('Main')}
      <SideLink href="/" icon={<Home size={16} />} label="Home" />
      <SideLink href="/nursery" icon={<LayoutDashboard size={16} />} label="Overview" />

      {sectionLabel('System')}
      <SideLink href="/profile" icon={<Settings size={16} />} label="Settings" />
      <SideLink href="/privacy" icon={<BookOpen size={16} />} label="Privacy & data" />
      <PromptButton onPick={pick} q="How do I use Kanuvari? Give me the steps." icon={<HelpCircle size={16} />} label="Help" />
    </nav>
  );

  return (
    <div style={embedded && fullScreen
      ? { display: 'flex', height: '100dvh', background: C.bg, color: C.paper, fontFamily: 'inherit' }
      : embedded
      ? { display: 'flex', height: 'calc(100dvh - 120px)', minHeight: 480, background: C.panel, color: C.paper, border: `1px solid ${C.hairline}`, borderRadius: 18, overflow: 'hidden', fontFamily: 'inherit' }
      : { display: 'flex', height: '100dvh', background: C.bg, color: C.paper, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        .kv-nav:hover { background: rgba(200,155,60,0.08) !important; }
        .kv-nav:focus-visible, button:focus-visible, textarea:focus-visible { outline: 2px solid #E4C878; outline-offset: 2px; }
        .kv-side { width: 268px; flex-shrink: 0; border-right: 1px solid ${C.hairline}; background: ${C.panel}; }
        .kv-mobile-only { display: none; }
        @media (max-width: 860px) {
          .kv-side { position: fixed; inset: 0 auto 0 0; z-index: 80; transform: translateX(-100%); transition: transform .25s ease; width: min(86vw, 300px); }
          .kv-side[data-open="true"] { transform: none; box-shadow: 0 0 60px rgba(0,0,0,.6); }
          .kv-mobile-only { display: inline-flex; }
        }
        summary::-webkit-details-marker { display: none; }
        .kv-quick { scrollbar-width: none; } .kv-quick::-webkit-scrollbar { display: none; }
      `}</style>
      {!embedded && <aside className="kv-side" data-open={sidebarOpen}>{sidebar}</aside>}
      {!embedded && sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(0,0,0,.45)' }} />}

      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* top bar */}
        <header style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: `1px solid ${C.hairline}` }}>
          {!embedded && <button onClick={() => setSidebarOpen(true)} className="kv-mobile-only" aria-label="Open menu" style={{ background: 'none', border: 'none', color: C.paperDim, cursor: 'pointer', padding: 6 }}><Menu size={20} /></button>}
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14.5, flex: 1, minWidth: 0 }}>
            {fullScreen
              ? <><Link href="/" aria-label="Home" style={{ color: C.inkLight, textDecoration: 'none', marginRight: 10 }}>←</Link>Oloolua CFA › Nursery groups</>
              : embedded ? 'Nursery AI' : 'Nursery Assistant'}
            {project ? <span style={{ color: C.inkLight, fontWeight: 500 }}> · {project}</span> : null}
          </p>
          {fullScreen && (
            <a href="#nursery-records" style={{ fontSize: 11.5, fontWeight: 700, color: C.goldLight, textDecoration: 'none', whiteSpace: 'nowrap' }}>Records ↓</a>
          )}
          {embedded && msgs.length > 0 && (
            <button onClick={newChat} style={{ fontSize: 11.5, color: C.paperDim, background: 'none', border: `1px solid ${C.hairline}`, borderRadius: 999, padding: '4px 10px', cursor: 'pointer' }}>New chat</button>
          )}

          {!online && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: C.red }}><CloudOff size={14} /> Offline</span>}
          {queued > 0 && <button onClick={() => void flushQueue()} style={{ fontSize: 11.5, color: C.goldLight, background: 'none', border: `1px solid ${C.gold}`, borderRadius: 999, padding: '3px 10px', cursor: 'pointer' }}>{queued} waiting to send</button>}
          <button onClick={() => { const l = lang === 'en' ? 'sw' : 'en'; setLang(l); try { localStorage.setItem('kanuvari.lang', l); } catch { /* optional */ } }} aria-label="Language"
            style={{ fontSize: 11.5, fontWeight: 700, color: C.paperDim, background: 'none', border: `1px solid ${C.hairline}`, borderRadius: 999, padding: '4px 10px', cursor: 'pointer' }}>
            {lang === 'en' ? 'EN' : 'SW'}
          </button>
        </header>

        {/* AI workspace */}
        <section ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: embedded ? '14px 12px' : '20px 16px' }}>
          <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: msgs.length ? '4px 0 8px' : (embedded ? '12px 0 6px' : '40px 0 12px') }}>
              <Orb state={shownOrb} detail={orbDetail} size={msgs.length ? (embedded ? 44 : 56) : (embedded ? 72 : 104)} />
            </div>

            {!authenticated && (
              <div style={{ textAlign: 'center', fontSize: 13, color: C.inkLight }}>
                You can ask questions now. To save records, <button onClick={() => { void signInWithGoogle(); }} style={{ background: 'none', border: 'none', color: C.goldLight, textDecoration: 'underline', cursor: 'pointer', fontSize: 13, padding: 0 }}>sign in with Google</button> and join the CFA on /nursery.
              </div>
            )}

            {msgs.length === 0 && (
              <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: embedded ? 17 : 22, fontWeight: 700, margin: '0 0 6px', textWrap: 'balance' }}>{name ? `Habari ${name.split(' ')[0]},` : 'Habari,'} what happened in the nursery?</h1>
                <p style={{ fontSize: 13.5, color: C.inkLight, margin: '0 auto 18px', maxWidth: 520, lineHeight: 1.6 }}>
                  Say it the way you would tell a colleague, for example “We planted 250 Croton seedlings today at the Nasari nursery.” I will ask for anything missing and show the record before anything is saved.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                  {STARTERS.map((s) => (
                    <button key={s.q} onClick={() => setInput(s.q)} style={{ padding: '10px 14px', borderRadius: 12, border: `1px solid ${C.hairline}`, background: 'rgba(200,155,60,0.05)', color: C.paperDim, fontSize: 13, cursor: 'pointer', minHeight: 44, fontFamily: 'inherit' }}>{s.label}</button>
                  ))}
                </div>
              </div>
            )}

            {msgs.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '88%', minWidth: 0 }}>
                  <div style={{
                    padding: m.role === 'user' ? '10px 14px' : '2px 0', borderRadius: 16,
                    background: m.role === 'user' ? 'rgba(200,155,60,0.16)' : 'none',
                    color: m.error ? C.red : C.paper, fontSize: 14.5, lineHeight: 1.65, wordBreak: 'break-word',
                  }}>
                    {m.role === 'ai'
                      ? <div dangerouslySetInnerHTML={{ __html: formatChat(m.text) }} />
                      : m.text}
                  </div>
                  {m.role === 'ai' && m.tools && m.tools.length > 0 && (
                    <p style={{ margin: '6px 0 0', fontSize: 11, color: C.inkLight }}>Used: {[...new Set(m.tools.map(toolLabel))].join(' · ')}</p>
                  )}
                  {m.plans?.map((p, j) => (
                    <RecordCard key={j} plan={p} project={project || null} species={summary.species}
                      attachmentNames={draftFiles.filter((a) => a.kind === 'evidence').map((a) => a.file.name)}
                      authHeader={async () => ({ ...(await authHeader()) })}
                      onSaved={async (saved) => { await attachEvidence(saved, draftFiles); setDraftFiles([]); }}
                      onQueued={() => setQueued(loadQueue().length)}
                      onDone={() => setPendingCards((n) => Math.max(0, n - 1))} />
                  ))}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
        </section>

        {/* Universal input bar */}
        <footer style={{ borderTop: `1px solid ${C.hairline}`, padding: '10px 12px calc(12px + env(safe-area-inset-bottom, 0px))' }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            {attachments.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                {attachments.map((a) => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 10, border: `1px solid ${a.kind === 'unsupported' || a.note ? C.red : C.hairline}`, maxWidth: 260 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {a.preview ? <img src={a.preview} alt="" style={{ width: 34, height: 34, objectFit: 'cover', borderRadius: 6 }} /> : <FileText size={18} color={C.goldLight} />}
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.file.name}</p>
                      <p style={{ margin: 0, fontSize: 12.5, color: a.note ? C.red : C.inkLight }}>{a.note ?? (a.kind === 'evidence' ? 'Evidence for the next record' : 'Will be read by the AI')}</p>
                    </div>
                    <button aria-label={`Remove ${a.file.name}`} onClick={() => removeAttachment(a.id)} style={{ background: 'none', border: 'none', color: C.inkLight, cursor: 'pointer' }}><X size={14} /></button>
                  </div>
                ))}
                {attachments.some((a) => a.kind === 'evidence' && a.file.type.startsWith('image/')) && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: C.inkLight, cursor: 'pointer' }}>
                    <input id="gps-consent" type="checkbox" checked={gpsConsent} onChange={(e) => setGpsConsent(e.target.checked)} /> Add my location to the photos (optional)
                  </label>
                )}
              </div>
            )}
            <div className="kv-quick" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 2 }} aria-label="Quick actions">
              <button onClick={showNumbers} style={quickBtn}><BarChart3 size={15} /> Nursery numbers</button>
              {QUICK.map((q) => (
                <button key={q.type} onClick={() => openQuick(q)} style={quickBtn}>{q.icon} {q.label}</button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, padding: 6, borderRadius: 18, border: `1px solid ${C.hairline}`, background: C.panel, position: 'relative' }}>
              <button aria-label="Attach" onClick={() => setPlusOpen((o) => !o)} style={{ width: 42, height: 42, borderRadius: 12, border: 'none', background: 'rgba(200,155,60,0.1)', color: C.goldLight, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Plus size={20} /></button>
              {plusOpen && (
                <div style={{ position: 'absolute', bottom: 56, left: 6, zIndex: 20, background: C.panel, border: `1px solid ${C.hairline}`, borderRadius: 14, padding: 6, width: 240, boxShadow: '0 12px 40px rgba(0,0,0,.5)' }}>
                  <button onClick={() => cameraRef.current?.click()} className="kv-nav" style={{ display: 'flex', gap: 10, alignItems: 'center', width: '100%', padding: '10px', background: 'none', border: 'none', color: C.paperDim, borderRadius: 10, cursor: 'pointer', fontSize: 13.5, fontFamily: 'inherit' }}><Camera size={16} /> Take a photo</button>
                  <button onClick={() => fileRef.current?.click()} className="kv-nav" style={{ display: 'flex', gap: 10, alignItems: 'center', width: '100%', padding: '10px', background: 'none', border: 'none', color: C.paperDim, borderRadius: 10, cursor: 'pointer', fontSize: 13.5, fontFamily: 'inherit' }}><Paperclip size={16} /> Upload a file</button>
                  <p style={{ fontSize: 12.5, color: C.inkLight, margin: '4px 10px 6px', lineHeight: 1.45 }}>Photos (JPG, PNG, WEBP) and PDF become evidence. CSV and TXT are read by the AI. Up to 5 files.</p>
                </div>
              )}
              <input ref={fileRef} type="file" accept={ACCEPT} multiple hidden onChange={(e) => { void addFiles(e.target.files); e.target.value = ''; }} />
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { void addFiles(e.target.files); e.target.value = ''; }} />
              <textarea id="kanuvari-input" value={input} rows={1} placeholder={lang === 'sw' ? 'Uliza Kanuvari…' : 'Ask Kanuvari…'}
                onChange={(e) => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`; }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }}
                style={{ flex: 1, minWidth: 0, resize: 'none', border: 'none', outline: 'none', background: 'none', color: C.paper, fontSize: 15, lineHeight: 1.5, padding: '10px 4px', fontFamily: 'inherit', maxHeight: 140 }} />
              <button aria-label={listening ? 'Stop listening' : 'Speak'} onClick={toggleMic} style={{ width: 42, height: 42, borderRadius: 12, border: 'none', background: listening ? C.gold : 'rgba(200,155,60,0.1)', color: listening ? '#1B1A14' : C.goldLight, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {listening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <button aria-label="Send" onClick={() => void send()} disabled={busy || (!input.trim() && !attachments.some((a) => a.kind === 'text'))}
                style={{ width: 42, height: 42, borderRadius: 12, border: 'none', background: C.gold, color: '#1B1A14', cursor: busy ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: busy || (!input.trim() && !attachments.some((a) => a.kind === 'text')) ? 0.5 : 1 }}>
                <Send size={18} />
              </button>
            </div>
            <p style={{ textAlign: 'center', fontSize: 12.5, color: C.inkLight, margin: '6px 0 0' }}>
              Kanuvari reads and drafts; nothing is saved until you press Confirm &amp; Save. {listening ? 'Speak now; you can edit the text before sending.' : ''}
            </p>
          </div>
        </footer>
      </main>

      <AnimatePresence>
        {quick && (
          <NurseryModal type={quick} summary={summary} submitting={quickSaving} onClose={() => setQuick(null)}
            onSubmit={quickSubmit} evidenceBatch={null} canUpload={!!isMember} />
        )}
      </AnimatePresence>
    </div>
  );
}

const quickBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0, padding: '8px 13px', minHeight: 38, borderRadius: 999,
  border: `1px solid ${C.hairline}`, background: 'rgba(200,155,60,0.07)', color: C.paperDim, fontSize: 12.5, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
};
