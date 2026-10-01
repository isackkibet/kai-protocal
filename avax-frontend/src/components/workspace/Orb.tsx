'use client';

/**
 * The Kanuvari AI orb: the agent's state at a glance (Guardian Setup & AI
 * Architecture §2.2). Idle is calm; listening pulses and grows; thinking
 * swirls; speaking breathes; a running tool shows what it is doing; a
 * pending confirmation dims the orb and asks the user to review.
 */
export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'tool' | 'confirm';

const LABEL: Record<OrbState, string> = {
  idle: 'Kanuvari AI',
  listening: 'Listening…',
  thinking: 'Thinking…',
  speaking: 'Answering…',
  tool: 'Working…',
  confirm: 'Review this record before saving',
};

export default function Orb({ state, detail, size = 88 }: { state: OrbState; detail?: string | null; size?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }} role="status" aria-live="polite">
      <style>{`
        @keyframes kv-breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes kv-pulse { 0% { box-shadow: 0 0 0 0 rgba(228,200,120,.55); } 100% { box-shadow: 0 0 0 26px rgba(228,200,120,0); } }
        @keyframes kv-swirl { to { transform: rotate(360deg); } }
        .kv-orb { transition: transform .4s ease, opacity .4s ease, filter .4s ease; }
        .kv-orb[data-s="idle"] { animation: kv-breathe 6s ease-in-out infinite; }
        .kv-orb[data-s="listening"] { transform: scale(1.12); animation: kv-pulse 1.2s ease-out infinite; }
        .kv-orb[data-s="speaking"] { animation: kv-breathe 1.4s ease-in-out infinite; }
        .kv-orb[data-s="confirm"] { opacity: .55; filter: saturate(.5); }
        .kv-ring { position: absolute; inset: -6px; border-radius: 50%; border: 2px solid transparent; border-top-color: #E4C878; border-right-color: rgba(125,195,131,.8); opacity: 0; }
        .kv-orb[data-s="thinking"] .kv-ring, .kv-orb[data-s="tool"] .kv-ring { opacity: 1; animation: kv-swirl 1.1s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .kv-orb, .kv-ring { animation: none !important; } }
      `}</style>
      <div className="kv-orb" data-s={state} style={{
        position: 'relative', width: size, height: size, borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 30%, #F6E7B0 0%, #C89B3C 35%, #1E5B3A 75%, #0E2418 100%)',
        boxShadow: '0 10px 40px rgba(200,155,60,.25), inset 0 -8px 20px rgba(0,0,0,.35)',
      }}>
        <span className="kv-ring" />
      </div>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: state === 'confirm' ? '#E4C878' : '#EFE9D9', textAlign: 'center' }}>
        {state === 'tool' && detail ? detail : LABEL[state]}
      </p>
    </div>
  );
}

/** Plain words for what a tool is doing, shown under the orb. */
export function toolLabel(name: string): string {
  if (/inventory|nursery_summary|list_nurseries|get_nursery|get_species|search_species|metrics/.test(name)) return 'Querying nursery records…';
  if (/history|activities|search_conservation|activity_detail/.test(name)) return 'Looking through past activity…';
  if (/^record_|create_|update_|add_cfa|change_cfa/.test(name)) return 'Preparing the record for you to review…';
  if (/validate|clean|reconcile|quality|anomal|duplicate/.test(name)) return 'Checking the data…';
  if (/report|compliance|custody/.test(name)) return 'Building the report…';
  if (/verification|review|decide|submit_for/.test(name)) return 'Checking verification…';
  if (/anchor|evidence|claim|did/.test(name)) return 'Checking proofs…';
  if (/portfolio|vault|pool|swap|yield|price|balance|gas|tx_history|apy/.test(name)) return 'Reading the blockchain…';
  if (/knowledge/.test(name)) return 'Searching the knowledge hub…';
  return 'Working…';
}
