'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, ChevronDown, ChevronRight, Loader2, Plus } from 'lucide-react';
import { usePrivyAuth } from '@/lib/auth/privy-auth';
import { useSDGImpact } from '@/hooks/useSDGImpact';
import { SdgGlyph, TierGlyph } from '@/lib/ui/sdgIcons';
import { SDG_TIERS, tierFor } from '@/lib/sdg/tiers';

/**
 * SDG Impact (/sdg): how a person's actions in KAI help the UN Sustainable
 * Development Goals, in plain words.
 *
 *   1. Your impact: points, level, what the next level needs, airdrop boost
 *   2. Ways to earn: each action says what it is, which goal it helps, where
 *      to do it, and then "Add points" once it is done
 *   3. Your impact by goal: the six goals KAI tracks and your share of each
 *
 * No emoji and no star icons; goals keep their official UN colours.
 */

const C = {
  bg: '#0E2418', band: '#12301F', card: '#15352A', cardHi: '#1B4032', line: 'rgba(246,242,231,0.08)',
  paper: '#F6F2E7', dim: '#C9CFC2', ink: '#9BA396', gold: '#C89B3C', goldLight: '#E4C878', green: '#7DC383',
};

/** Everyday words for each action, and the page where it is really done. */
const ACTION_WORDS: Record<string, { title: string; desc: string; href: string; where: string }> = {
  cfa_tree_plant: { title: 'Plant a tree', desc: 'Record a seedling you planted in the community nursery, with a photo.', href: '/nursery', where: 'Nursery' },
  forest_patrol_log: { title: 'Report a forest patrol', desc: 'Log a ranger patrol that protects the forest from illegal logging.', href: '/nursery', where: 'Nursery' },
  carbon_credit_stake: { title: 'Lock carbon credits', desc: 'Put charcoal carbon credits in a vault so the pollution they stand for is removed for good.', href: '/vaults', where: 'Vaults' },
  water_rights_guard: { title: 'Help protect water', desc: 'Fund sensors that watch water levels where herders graze their animals.', href: '/vaults', where: 'Vaults' },
  artisan_nft_support: { title: 'Support a local artisan', desc: 'Buy beadwork or textile NFTs made by Maasai and Turkana groups.', href: '/connft', where: 'NFT market' },
  chama_savings_pool: { title: 'Save with a chama', desc: 'Add money to a community savings group that lends to its members.', href: '/pools', where: 'Pools' },
  heritage_seed_bank: { title: 'Protect traditional seeds', desc: 'Support a seed bank that keeps drought-resistant local seeds safe.', href: '/nuvari', where: 'Playground' },
};

/** What each goal means, in one short line. */
const GOAL_WORDS: Record<number, string> = {
  13: 'Less pollution in the air, through trees and carbon credits.',
  15: 'Forests, trees and the animals that live in them.',
  8: 'Good work and fair income for local makers.',
  1: 'Savings and support so families are not poor.',
  6: 'Safe water for people and animals.',
  2: 'Enough food, through good seeds and farming.',
};

const CATEGORIES = ['All', 'Environment', 'Economy', 'Community', 'Agriculture'] as const;

export default function SDGPage() {
  const { authenticated: isConnected, email, signInWithEmail, signInWithGoogle } = usePrivyAuth();
  const [category, setCategory] = useState<typeof CATEGORIES[number]>('All');
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [doneIds, setDoneIds] = useState<string[]>([]);
  const [aboutOpen, setAboutOpen] = useState(false);

  const { totalPoints, goals, availableActions, toast, logAction, loading, refresh } = useSDGImpact();
  const { tier, index: tierIndex, nextAt } = tierFor(totalPoints);
  const next = SDG_TIERS[tierIndex + 1];
  const progress = next ? Math.min(100, Math.round(((totalPoints - tier.from) / (next.from - tier.from)) * 100)) : 100;
  const goalPointsTotal = goals.reduce((n, g) => n + g.points, 0);

  const addPoints = async (actionId: string) => {
    if (!isConnected) { void signInWithEmail(); return; }
    if (submittingId) return;
    setSubmittingId(actionId);
    if (await logAction(actionId)) setDoneIds((d) => [...d, actionId]);
    setSubmittingId(null);
  };

  const actions = category === 'All' ? availableActions : availableActions.filter((a) => a.category === category);
  const goalOf = (n: number) => goals.find((g) => g.sdgNumber === n);

  return (
    <main className="sdg">
      {toast && <div className="sdg-toast" role="status">{toast}</div>}

      {/* Top bar */}
      <header className="sdg-top">
        <div className="sdg-wrap sdg-top-inner">
          <Link href="/" className="sdg-back" aria-label="Back to home"><ArrowLeft size={18} /></Link>
          <div style={{ minWidth: 0 }}>
            <h1 className="sdg-title">SDG Impact</h1>
            <p className="sdg-sub">How your actions help the world</p>
          </div>
          {isConnected
            ? <span className="sdg-wallet sdg-wallet--on"><span>{email ?? 'Signed in'}</span></span>
            : <button className="sdg-wallet" onClick={() => { void signInWithEmail(); }}><span>Sign in</span></button>}
        </div>
      </header>

      <div className="sdg-wrap sdg-body">
        {/* What is this? */}
        <div className="sdg-about">
          <button className="sdg-about-btn" onClick={() => setAboutOpen((o) => !o)} aria-expanded={aboutOpen}>
            <span>What are SDGs, and how do points work?</span>
            <ChevronDown size={16} style={{ transform: aboutOpen ? 'rotate(180deg)' : undefined, transition: 'transform .15s' }} />
          </button>
          {aboutOpen && (
            <ol>
              <li>The United Nations has <b>17 goals for a better world by 2030</b>, called SDGs (Sustainable Development Goals). KAI tracks <b>6</b> of them.</li>
              <li>When you do something good in KAI, like planting a tree or saving in a chama, you <b>earn points</b> for the goal it helps.</li>
              <li>More points move you up a <b>level</b>. A higher level gives a <b>bigger boost on your airdrop</b>.</li>
            </ol>
          )}
        </div>

        {/* 1. Your impact */}
        <section className="sdg-card sdg-me">
          {!isConnected ? (
            <div className="sdg-me-empty">
              <p className="sdg-h2" style={{ margin: 0 }}>See your impact</p>
              <p className="sdg-muted">Sign in with your email to see your points and level, and to start earning. No wallet needed.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <button className="sdg-btn" onClick={() => { void signInWithEmail(); }}>Sign in with email</button>
                <button className="sdg-btn sdg-btn--quiet" onClick={() => { void signInWithGoogle(); }}>Sign in with Google</button>
              </div>
            </div>
          ) : (
            <>
              <div className="sdg-me-row">
                <div>
                  <p className="sdg-kicker">Your points</p>
                  <p className="sdg-big">{totalPoints.toLocaleString()}</p>
                </div>
                <div className="sdg-level">
                  <span className="sdg-level-icon"><TierGlyph name={tier.name} size={20} strokeWidth={1.8} /></span>
                  <div>
                    <p className="sdg-kicker">Your level</p>
                    <p className="sdg-level-name">{tier.name}</p>
                  </div>
                </div>
              </div>

              <div className="sdg-bar" aria-label={`${progress}% of the way to the next level`}><i style={{ width: `${progress}%` }} /></div>
              <p className="sdg-muted" style={{ margin: '8px 0 0' }}>
                {next
                  ? <><b>{(nextAt - totalPoints).toLocaleString()} more points</b> to reach {next.name}.</>
                  : <>You are at the top level.</>}
                {' '}Your airdrop boost is <b>{tier.boost}</b>{totalPoints === 0 ? ' — earn your first points below.' : '.'}
              </p>
            </>
          )}

          {/* The level ladder, always visible so the goal is clear */}
          <div className="sdg-ladder">
            {SDG_TIERS.map((t, i) => {
              const state = isConnected && i < tierIndex ? 'done' : isConnected && i === tierIndex ? 'now' : 'later';
              return (
                <div key={t.name} className={`sdg-step sdg-step--${state}`}>
                  <span className="sdg-step-icon">{state === 'done' ? <Check size={14} /> : <TierGlyph name={t.name} size={15} strokeWidth={1.8} />}</span>
                  <span className="sdg-step-name">{t.name}</span>
                  <span className="sdg-step-meta">{t.from.toLocaleString()}+ pts · {t.boost}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* 2. Ways to earn */}
        <section>
          <h2 className="sdg-h2">Ways to earn points</h2>
          <p className="sdg-muted" style={{ marginTop: 0 }}>Do the action on its page first, then press <b>Add points</b>.</p>

          <div className="sdg-chips" role="tablist" aria-label="Filter actions">
            {CATEGORIES.map((cat) => {
              const n = cat === 'All' ? availableActions.length : availableActions.filter((a) => a.category === cat).length;
              return (
                <button key={cat} role="tab" aria-selected={category === cat} onClick={() => setCategory(cat)} className={category === cat ? 'sdg-chip sdg-chip--on' : 'sdg-chip'}>
                  {cat} <em>{n}</em>
                </button>
              );
            })}
          </div>

          {availableActions.length === 0 && (
            <div className="sdg-empty">
              {loading ? <><Loader2 size={16} className="sdg-spin" /> Loading…</> : <>Could not load the actions. <button className="sdg-btn sdg-btn--quiet" onClick={() => void refresh()}>Try again</button></>}
            </div>
          )}

          <div className="sdg-actions">
            {actions.map((act) => {
              const words = ACTION_WORDS[act.id];
              const goal = goalOf(act.sdgNumber);
              const tint = goal?.color ?? C.green;
              const done = doneIds.includes(act.id);
              return (
                <article key={act.id} className="sdg-action" style={{ ['--tint' as string]: tint }}>
                  <span className="sdg-action-icon"><SdgGlyph n={act.sdgNumber} size={20} strokeWidth={1.8} /></span>
                  <div className="sdg-action-text">
                    <p className="sdg-action-title">{words?.title ?? act.title}</p>
                    <p className="sdg-action-desc">{words?.desc ?? act.desc}</p>
                    <p className="sdg-action-meta">
                      <span className="sdg-goal-pill">SDG {act.sdgNumber} · {goal?.name ?? act.category}</span>
                      <span>Result: {act.metricIncrease.replace(/^\+/, '')}</span>
                    </p>
                  </div>
                  <div className="sdg-action-side">
                    <p className="sdg-points">+{act.points}<small> points</small></p>
                    <div className="sdg-action-btns">
                      {words && (
                        <Link href={words.href} prefetch={false} className="sdg-btn sdg-btn--quiet">
                          Go to {words.where} <ChevronRight size={14} />
                        </Link>
                      )}
                      <button className="sdg-btn" onClick={() => void addPoints(act.id)} disabled={submittingId === act.id || done}>
                        {submittingId === act.id ? <Loader2 size={14} className="sdg-spin" /> : done ? <><Check size={14} /> Added</> : <><Plus size={14} /> Add points</>}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* 3. Your impact by goal */}
        <section>
          <h2 className="sdg-h2">Your impact by goal</h2>
          <p className="sdg-muted" style={{ marginTop: 0 }}>The 6 UN goals KAI tracks, and how many of your points went to each.</p>
          {goals.length === 0 && !loading && <div className="sdg-empty">Could not load the goals. <button className="sdg-btn sdg-btn--quiet" onClick={() => void refresh()}>Try again</button></div>}
          <div className="sdg-goals">
            {goals.map((g) => {
              const share = goalPointsTotal ? Math.round((g.points / goalPointsTotal) * 100) : 0;
              return (
                <article key={g.code} className="sdg-goal" style={{ ['--tint' as string]: g.color }}>
                  <div className="sdg-goal-head">
                    <span className="sdg-goal-num">{g.sdgNumber}</span>
                    <div style={{ minWidth: 0 }}>
                      <p className="sdg-goal-name">{g.name}</p>
                      <p className="sdg-goal-desc">{GOAL_WORDS[g.sdgNumber] ?? g.description}</p>
                    </div>
                    <SdgGlyph n={g.sdgNumber} size={20} strokeWidth={1.8} className="sdg-goal-icon" />
                  </div>
                  <div className="sdg-goal-bar"><i style={{ width: `${share}%` }} /></div>
                  <div className="sdg-goal-foot">
                    <span><b>{g.points}</b> points{g.points > 0 ? ` · ${share}% of yours` : ''}</span>
                    {g.points > 0 ? <span>{g.impactValue}</span> : <span className="sdg-ink">Not started</span>}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>


      <style>{`
        .sdg { min-height: 100dvh; background: ${C.bg}; color: ${C.paper}; font-family: 'Inter', system-ui, sans-serif; padding-bottom: 110px; }
        .sdg-wrap { width: min(1080px, calc(100% - 32px)); margin: 0 auto; }
        .sdg-top { position: sticky; top: 0; z-index: 30; background: ${C.band}; border-bottom: 1px solid ${C.line}; }
        .sdg-top-inner { display: flex; align-items: center; gap: 12px; padding: 12px 0; }
        .sdg-back { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; color: ${C.paper}; background: rgba(246,242,231,0.06); flex-shrink: 0; }
        .sdg-title { margin: 0; font-size: 18px; font-weight: 700; }
        .sdg-sub { margin: 1px 0 0; font-size: 12.5px; color: ${C.ink}; }
        .sdg-wallet { margin-left: auto; display: inline-flex; align-items: center; gap: 7px; padding: 9px 14px; border-radius: 999px; border: none; background: ${C.gold}; color: #1B1A14; font-weight: 700; font-size: 13px; cursor: pointer; font-family: inherit; flex-shrink: 0; }
        .sdg-wallet--on { background: rgba(125,195,131,0.14); color: ${C.green}; font-weight: 600; max-width: 46vw; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .sdg-body { display: grid; grid-template-columns: minmax(0, 1fr); gap: 32px; padding-top: 20px; }
        .sdg-body > * { min-width: 0; }
        .sdg-h2 { margin: 0 0 6px; font-size: 17px; font-weight: 700; }
        .sdg-muted { font-size: 13.5px; line-height: 1.55; color: ${C.dim}; }
        .sdg-muted b { color: ${C.paper}; }
        .sdg-ink { color: ${C.ink}; }
        .sdg-kicker { margin: 0; font-size: 11.5px; font-weight: 700; letter-spacing: .8px; text-transform: uppercase; color: ${C.ink}; }

        .sdg-about { border-radius: 14px; background: ${C.band}; }
        .sdg-about-btn { display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%; padding: 14px 16px; border: none; background: none; color: ${C.paper}; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; text-align: left; }
        .sdg-about ol { margin: 0; padding: 0 16px 16px 36px; display: grid; gap: 8px; font-size: 13.5px; line-height: 1.55; color: ${C.dim}; }
        .sdg-about b { color: ${C.paper}; }

        .sdg-card { padding: 20px; border-radius: 18px; background: ${C.band}; }
        .sdg-me-empty { display: grid; gap: 4px; justify-items: start; }
        .sdg-me-row { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 16px; }
        .sdg-big { margin: 2px 0 0; font-size: 44px; font-weight: 700; line-height: 1; color: ${C.goldLight}; letter-spacing: -1px; }
        .sdg-level { display: flex; align-items: center; gap: 10px; }
        .sdg-level-icon { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 50%; color: ${C.green}; background: rgba(125,195,131,0.14); }
        .sdg-level-name { margin: 2px 0 0; font-size: 16px; font-weight: 700; }
        .sdg-bar { margin-top: 18px; height: 8px; border-radius: 999px; background: rgba(246,242,231,0.08); overflow: hidden; }
        .sdg-bar i { display: block; height: 100%; border-radius: 999px; background: ${C.gold}; }

        .sdg-ladder { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 18px; }
        @media (min-width: 720px) { .sdg-ladder { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
        .sdg-step { display: grid; grid-template-columns: auto 1fr; column-gap: 8px; align-items: center; padding: 10px; border-radius: 12px; background: ${C.card}; border: 1.5px solid transparent; }
        .sdg-step-icon { grid-row: span 2; display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; background: rgba(246,242,231,0.08); color: ${C.ink}; }
        .sdg-step-name { font-size: 12.5px; font-weight: 700; color: ${C.dim}; }
        .sdg-step-meta { font-size: 11.5px; color: ${C.ink}; }
        .sdg-step--now { border-color: ${C.gold}; }
        .sdg-step--now .sdg-step-icon { background: rgba(200,155,60,0.2); color: ${C.goldLight}; }
        .sdg-step--now .sdg-step-name { color: ${C.paper}; }
        .sdg-step--done .sdg-step-icon { background: ${C.green}; color: #10231A; }

        .sdg-chips { display: flex; gap: 8px; overflow-x: auto; padding: 4px 0 12px; scrollbar-width: none; }
        .sdg-chip { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 999px; border: 1px solid rgba(246,242,231,0.14); background: none; color: ${C.dim}; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; white-space: nowrap; min-height: 38px; }
        .sdg-chip em { font-style: normal; font-size: 11.5px; color: ${C.ink}; }
        .sdg-chip--on { background: ${C.gold}; border-color: ${C.gold}; color: #1B1A14; }
        .sdg-chip--on em { color: #1B1A14; }

        .sdg-actions { display: grid; gap: 10px; }
        .sdg-action { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 12px 14px; padding: 16px; border-radius: 16px; background: ${C.card}; }
        @media (min-width: 760px) { .sdg-action { grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; } }
        .sdg-action-icon { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 50%; color: var(--tint); background: color-mix(in srgb, var(--tint) 18%, ${C.bg}); }
        .sdg-action-title { margin: 0; font-size: 15px; font-weight: 700; }
        .sdg-action-desc { margin: 3px 0 0; font-size: 13.5px; line-height: 1.5; color: ${C.dim}; }
        .sdg-action-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 12px; margin: 8px 0 0; font-size: 12.5px; color: ${C.ink}; }
        .sdg-goal-pill { padding: 2px 9px; border-radius: 999px; font-weight: 600; color: ${C.paper}; background: color-mix(in srgb, var(--tint) 30%, ${C.bg}); }
        .sdg-action-side { grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; padding-top: 12px; border-top: 1px solid ${C.line}; }
        @media (min-width: 760px) { .sdg-action-side { grid-column: auto; flex-direction: column; align-items: flex-end; padding-top: 0; border-top: none; } }
        .sdg-points { margin: 0; font-size: 20px; font-weight: 700; color: ${C.goldLight}; }
        .sdg-points small { font-size: 12.5px; font-weight: 600; color: ${C.ink}; }
        .sdg-action-btns { display: flex; gap: 8px; flex-wrap: wrap; }

        .sdg-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 16px; border-radius: 999px; border: none; background: ${C.gold}; color: #1B1A14; font-weight: 700; font-size: 13.5px; cursor: pointer; font-family: inherit; min-height: 42px; text-decoration: none; white-space: nowrap; }
        .sdg-btn:disabled { opacity: .65; cursor: default; }
        .sdg-btn--quiet { background: rgba(246,242,231,0.08); color: ${C.paper}; }
        .sdg-me-empty .sdg-btn { margin-top: 8px; }

        .sdg-goals { display: grid; gap: 10px; grid-template-columns: 1fr; }
        @media (min-width: 640px) { .sdg-goals { grid-template-columns: 1fr 1fr; } }
        @media (min-width: 980px) { .sdg-goals { grid-template-columns: 1fr 1fr 1fr; } }
        .sdg-goal { padding: 16px; border-radius: 16px; background: ${C.card}; }
        .sdg-goal-head { display: flex; align-items: flex-start; gap: 12px; }
        .sdg-goal-num { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 10px; background: var(--tint); color: #fff; font-size: 17px; font-weight: 800; flex-shrink: 0; }
        .sdg-goal-name { margin: 0; font-size: 14.5px; font-weight: 700; }
        .sdg-goal-desc { margin: 3px 0 0; font-size: 13px; line-height: 1.45; color: ${C.dim}; }
        .sdg-goal-icon { margin-left: auto; flex-shrink: 0; color: var(--tint); opacity: .9; }
        .sdg-goal-bar { margin-top: 14px; height: 6px; border-radius: 999px; background: rgba(246,242,231,0.08); overflow: hidden; }
        .sdg-goal-bar i { display: block; height: 100%; border-radius: 999px; background: var(--tint); }
        .sdg-goal-foot { display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; margin-top: 8px; font-size: 12.5px; color: ${C.dim}; }
        .sdg-goal-foot b { color: ${C.paper}; }

        .sdg-empty { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 16px; border-radius: 14px; background: ${C.card}; font-size: 14px; color: ${C.dim}; }
        .sdg-toast { position: fixed; top: 76px; left: 50%; transform: translateX(-50%); z-index: 100; max-width: calc(100% - 32px); padding: 11px 20px; border-radius: 999px; background: ${C.cardHi}; color: ${C.goldLight}; font-size: 13.5px; font-weight: 600; text-align: center; box-shadow: 0 8px 24px rgba(0,0,0,.35); }
        .sdg-spin { animation: sdg-spin 1s linear infinite; }
        @keyframes sdg-spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}
