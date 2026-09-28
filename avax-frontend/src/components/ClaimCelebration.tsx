'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const C = {
  bg:        '#0B1C14',
  gold:      '#C89B3C',
  goldLight: '#E4C878',
  paper:     '#F6F2E7',
  inkLight:  '#9BA396',
  hairline:  'rgba(200,155,60,0.14)',
};
const MONO: React.CSSProperties = { fontFamily: 'var(--font-plex-mono), monospace' };
const SERIF: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };

/* Warm, garden-y petal colours that sit next to the pine + gold palette. */
const PETALS = ['#E4C878', '#F6F2E7', '#E8A5A0', '#C89B3C', '#F2C6C2', '#B9D3A8'];

/* Deterministic pseudo-random so render stays pure (no Math.random). */
const rand = (i: number) => {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const FALLING = Array.from({ length: 26 }, (_, i) => ({
  left: rand(i) * 100,
  delay: rand(i + 100) * 1.6,
  duration: 3.2 + rand(i + 200) * 2.6,
  size: 9 + rand(i + 300) * 10,
  drift: (rand(i + 400) - 0.5) * 120,
  spin: (rand(i + 500) - 0.5) * 720,
  color: PETALS[i % PETALS.length],
}));

function Flower({ size, petal, centre, petals = 6 }: { size: number; petal: string; centre: string; petals?: number }) {
  return (
    <svg width={size} height={size} viewBox="-50 -50 100 100" aria-hidden="true">
      {Array.from({ length: petals }, (_, i) => (
        <ellipse key={i} cx="0" cy="-24" rx="14" ry="24" fill={petal} opacity="0.95"
          transform={`rotate(${(360 / petals) * i})`} />
      ))}
      <circle r="13" fill={centre} />
      <circle r="6" fill={C.bg} opacity="0.25" />
    </svg>
  );
}

function Petal({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 20 28" aria-hidden="true">
      <path d="M10 0 C18 7 18 20 10 28 C2 20 2 7 10 0 Z" fill={color} opacity="0.9" />
    </svg>
  );
}

/* Counts up from 0 to the claimed amount so the reward feels earned. */
function useCountUp(target: number, run: boolean, duration = 900) {
  const [v, setV] = useState(run ? 0 : target);
  useEffect(() => {
    if (!run) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setV(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, duration]);
  return v;
}

const fmtAmount = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });

export interface ClaimCelebrationProps {
  amount: number;
  unit?: string;
  multiplier: number;
  streak: number;
  balance?: number;
  onClose: () => void;
}

export default function ClaimCelebration({ amount, unit = 'NVR', multiplier, streak, balance, onClose }: ClaimCelebrationProps) {
  const reduce = useReducedMotion() ?? false;
  const shown = useCountUp(amount, !reduce);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const streakLine =
    streak >= 2 ? `${streak}-day streak. Come back tomorrow to keep it growing.`
    : 'Day one of your streak. Come back tomorrow to grow it.';

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(5,14,10,0.78)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflow: 'hidden' }}>

      {/* Petals drifting down across the whole screen */}
      {!reduce && FALLING.map((p, i) => (
        <motion.div key={i} aria-hidden="true"
          initial={{ y: '-10vh', x: 0, rotate: 0, opacity: 0 }}
          animate={{ y: '110vh', x: p.drift, rotate: p.spin, opacity: [0, 1, 1, 0.6] }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn', repeat: 1, repeatDelay: 0.4 }}
          style={{ position: 'absolute', top: 0, left: `${p.left}%`, pointerEvents: 'none' }}>
          <Petal size={p.size} color={p.color} />
        </motion.div>
      ))}

      <motion.div
        role="dialog" aria-modal="true" aria-labelledby="claim-celebration-title"
        onClick={(e) => e.stopPropagation()}
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        style={{ position: 'relative', width: '100%', maxWidth: 400, background: C.bg, border: `1px solid ${C.hairline}`,
          borderRadius: 24, padding: '28px 24px 24px', textAlign: 'center', boxShadow: '0 30px 80px rgba(0,0,0,0.45)' }}>

        {/* Bouquet: three flowers bloom in, one after another */}
        <div style={{ position: 'relative', height: 92, marginBottom: 6 }} aria-hidden="true">
          {[
            { x: -46, y: 18, size: 54, petal: '#E8A5A0', centre: C.goldLight, d: 0.15, r: -18 },
            { x: 46,  y: 18, size: 54, petal: C.paper,   centre: C.gold,      d: 0.3,  r: 16 },
            { x: 0,   y: 0,  size: 76, petal: C.goldLight, centre: '#E8A5A0', d: 0,    r: 0 },
          ].map((f, i) => (
            <motion.div key={i}
              initial={reduce ? false : { scale: 0, rotate: f.r - 90 }}
              animate={{ scale: 1, rotate: f.r }}
              transition={{ type: 'spring', stiffness: 220, damping: 12, delay: f.d }}
              style={{ position: 'absolute', left: '50%', top: f.y, marginLeft: f.x - f.size / 2 }}>
              <Flower size={f.size} petal={f.petal} centre={f.centre} petals={i === 2 ? 8 : 6} />
            </motion.div>
          ))}
        </div>

        <p style={{ ...MONO, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: C.goldLight, fontWeight: 600, margin: '0 0 8px' }}>
          Daily drop claimed
        </p>
        <h2 id="claim-celebration-title" style={{ ...SERIF, fontSize: 26, fontWeight: 700, color: C.paper, margin: '0 0 14px', letterSpacing: '-0.5px' }}>
          Congratulations!
        </h2>

        <p style={{ ...SERIF, fontSize: 40, fontWeight: 700, color: C.goldLight, margin: 0, lineHeight: 1 }}>
          +{fmtAmount(reduce ? amount : shown)}
          <span style={{ fontSize: 16, fontWeight: 500, color: C.inkLight, marginLeft: 8 }}>{unit}</span>
        </p>
        {multiplier > 1 && (
          <p style={{ ...MONO, fontSize: 11.5, color: C.paper, margin: '10px 0 0' }}>
            Includes a {multiplier.toFixed(2)}x hash power bonus
          </p>
        )}

        <p style={{ fontSize: 13, lineHeight: 1.55, color: C.inkLight, margin: '16px auto 0', maxWidth: 300 }}>
          {streakLine}
        </p>
        {balance !== undefined && (
          <p style={{ fontSize: 12, color: C.inkLight, margin: '8px 0 0' }}>
            Mining balance: <span style={{ ...MONO, color: C.paper, fontWeight: 700 }}>{fmtAmount(balance)} {unit}</span>
          </p>
        )}

        <button ref={closeRef} onClick={onClose}
          style={{ marginTop: 22, width: '100%', padding: '13px 0', borderRadius: 999, border: 'none', cursor: 'pointer',
            background: C.gold, color: '#1B1A14', fontSize: 14, fontWeight: 700, fontFamily: 'inherit' }}>
          Keep mining
        </button>
      </motion.div>
    </motion.div>
  );
}
